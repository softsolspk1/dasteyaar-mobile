import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking, useColorScheme, RefreshControl } from 'react-native';
import { Card, Title, Text, Button, List, Divider, Chip, useTheme, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import api from '../../services/api';
import { getThemeColors } from '../../constants/theme';
import { ShowcaseStatusBar, PageHeader } from '../../components/showcase';

interface Order {
  _id: string;
  prescription_id: string;
  shopify_order_id: string;
  shopify_order_number: string;
  patient_info: {
    mrn: string;
    name: string;
    phone: string;
    city?: string;
  };
  doctor_info: {
    doctor_id: string;
    name: string;
    district_id: string;
  };
  order_status: string;
  financial_status: string;
  fulfillment_status: string;
  tracking_number?: string;
  tracking_url?: string;
  total_amount: number;
  currency: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;  // MongoDB timestamp
  updatedAt?: string;  // MongoDB timestamp
  shopify_created_at?: string;
  shopify_updated_at?: string;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  // Load order initially
  useEffect(() => {
    const initializeOrder = async () => {
      await loadOrder();
      // Sync with Shopify in the background after initial load
      syncOrderStatus();
    };
    initializeOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/orders/${id}`);

      setOrder(response.data.data);
    } catch (error: any) {

      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const syncOrderStatus = async () => {
    try {

      const response = await api.post(`/orders/${id}/sync`);
      if (response.data.success) {
        setOrder(response.data.data);
        if (response.data.warning) {

        }
      }
    } catch (error: any) {

      // Silently fail - don't alert user as we still have cached data
    }
  };

  const handleTrackOrder = () => {
    if (order?.tracking_url) {
      Linking.openURL(order.tracking_url).catch(() => {
        Alert.alert('Error', 'Failed to open tracking link');
      });
    } else {
      Alert.alert('No Tracking', 'Tracking information not available yet');
    }
  };

  const handleReOrder = () => {
    Alert.alert(
      'Confirm Re-Order',
      'Are you sure you want to re-order the items from this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            if (!order?.prescription_id) {
              Alert.alert('Error', 'Original prescription not found.');
              return;
            }
            try {
              setReordering(true);
              const presId = typeof order.prescription_id === 'object' ? (order.prescription_id as any)._id : order.prescription_id;
              const presRes = await api.get(`/prescriptions/${presId}`);
              const oldPrescription = presRes.data.data;

              const prescriptionData = {
                patient_id: oldPrescription.patient_id?._id || oldPrescription.patient_id,
                prescription_text: oldPrescription.prescription_text,
                dosage_frequency: oldPrescription.dosage_frequency,
                duration_days: oldPrescription.duration_days,
                priority: oldPrescription.priority,
                selected_product: {
                  product_id: oldPrescription.items[0].product_id?._id || oldPrescription.items[0].product_id,
                  name: oldPrescription.items[0].name,
                  sku: oldPrescription.items[0].sku,
                  price: oldPrescription.items[0].price,
                  quantity: oldPrescription.items[0].quantity
                },
                diagnosis: oldPrescription.diagnosis,
                notes: oldPrescription.notes,
                city_id: oldPrescription.city_id
              };

              const response = await api.post('/prescriptions', prescriptionData);

              if (response.data.success) {
                Alert.alert('Success', 'Re-Order placed successfully!', [
                  { text: 'View New Order', onPress: () => router.push(`/order/${response.data.data.order._id}`) },
                  { text: 'OK', onPress: () => router.push('/(tabs)/orders') }
                ]);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to place re-order.');
            } finally {
              setReordering(false);
            }
          }
        }
      ]
    );
  };


  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {

        return 'N/A';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {

      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled': return '#4CAF50';
      case 'processing': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#FFA500';
    }
  };

  const getFinancialStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'refunded': return '#F44336';
      default: return '#FFA500';
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 0.25;
      case 'processing': return 0.5;
      case 'fulfilled': return 1;
      case 'cancelled': return 0;
      default: return 0.25;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled': return 'check-circle';
      case 'processing': return 'clock-outline';
      case 'cancelled': return 'close-circle';
      default: return 'package-variant';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Order not found</Text>
          <Button mode="contained" onPress={() => router.back()} buttonColor={colors.primary} textColor={colors.surface}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: `Order #${order.shopify_order_number}` }} />
      <ScrollView 
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await syncOrderStatus();
              setRefreshing(false);
            }}
            colors={[colors.primary]}
          />
        }>
        {/* Order Status Header */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={styles.statusHeader}>
              <View style={styles.statusIcon}>
                <List.Icon
                  icon={getStatusIcon(order.order_status)}
                  color={getStatusColor(order.order_status)}
                />
              </View>
              <View style={styles.statusInfo}>
                <Title style={{ color: colors.text }}>{order.shopify_order_number}</Title>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: getStatusColor(order.order_status) + '20', alignSelf: 'flex-start' }}
                  textStyle={{ color: getStatusColor(order.order_status), fontWeight: 'bold' }}
                >
                  {order.order_status.toUpperCase()}
                </Chip>
              </View>
            </View>

            <ProgressBar
              progress={getStatusProgress(order.order_status)}
              color={getStatusColor(order.order_status)}
              style={styles.progressBar}
            />

            <View style={styles.statusTimeline}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={[styles.timelineText, { color: colors.textSecondary }]}>Ordered</Text>
              </View>
              <View style={styles.timelineLine} />
              <View style={styles.timelineItem}>
                <View style={[
                  styles.timelineDot,
                  { backgroundColor: order.order_status === 'pending' ? '#DDD' : '#4CAF50' }
                ]} />
                <Text style={[styles.timelineText, { color: colors.textSecondary }]}>Processing</Text>
              </View>
              <View style={styles.timelineLine} />
              <View style={styles.timelineItem}>
                <View style={[
                  styles.timelineDot,
                  { backgroundColor: order.order_status === 'fulfilled' ? '#4CAF50' : '#DDD' }
                ]} />
                <Text style={[styles.timelineText, { color: colors.textSecondary }]}>Delivered</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Patient Information */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Title style={{ color: colors.text }}>Patient Information</Title>
            <List.Item
              title={order.patient_info.name}
              description={`MRN: ${order.patient_info.mrn}`}
              left={props => <List.Icon {...props} icon="account" />}
            />
            <Divider />
            <List.Item
              title="Phone"
              description={order.patient_info.phone}
              left={props => <List.Icon {...props} icon="phone" />}
            />
            {order.patient_info.city && (
              <>
                <Divider />
                <List.Item
                  title="Delivery City"
                  description={order.patient_info.city}
                  left={props => <List.Icon {...props} icon="map-marker" />}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {/* Order Details */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Title style={{ color: colors.text }}>Order Details</Title>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Order Number:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{order.shopify_order_number}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Order Date:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(order.createdAt || order.shopify_created_at || order.created_at)}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Last Updated:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(order.updatedAt || order.shopify_updated_at || order.updated_at)}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Financial Status:</Text>
              <Chip
                mode="flat"
                style={{ backgroundColor: getFinancialStatusColor(order.financial_status) + '20' }}
                textStyle={{ color: getFinancialStatusColor(order.financial_status) }}
              >
                {order.financial_status.toUpperCase()}
              </Chip>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Fulfillment:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{order.fulfillment_status.toUpperCase()}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Tracking Information */}
        {(order.tracking_number || order.tracking_url) && (
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Title style={{ color: colors.text }}>Tracking Information</Title>
              {order.tracking_number && (
                <List.Item
                  title="Tracking Number"
                  description={order.tracking_number}
                  left={props => <List.Icon {...props} icon="barcode" />}
                />
              )}
              {order.tracking_url && (
                <>
                  <Divider />
                  <List.Item
                    title="Track Shipment"
                    description="Click to open tracking link"
                    left={props => <List.Icon {...props} icon="truck-delivery" />}
                    right={props => <List.Icon {...props} icon="open-in-new" />}
                    onPress={handleTrackOrder}
                  />
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Payment Information */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Title style={{ color: colors.text }}>Payment Summary</Title>
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Total Amount:</Text>
              <Text style={[styles.paymentValue, { color: colors.primary }]}>
                {order.currency} {order.total_amount.toFixed(2)}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.paymentRow}>
              <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Payment Status:</Text>
              <Chip
                mode="flat"
                style={{ backgroundColor: getFinancialStatusColor(order.financial_status) + '20' }}
                textStyle={{ color: getFinancialStatusColor(order.financial_status), fontWeight: 'bold' }}
              >
                {order.financial_status.toUpperCase()}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.actionButton}
            textColor={colors.primary}
          >
            Back
          </Button>
          <Button
            mode="contained"
            onPress={handleReOrder}
            style={styles.actionButton}
            loading={reordering}
            disabled={reordering}
            buttonColor={colors.primary}
            textColor={colors.surface}
            icon="cart-arrow-down"
          >
            Re-Order
          </Button>
          {order.tracking_url && (
            <Button
              mode="contained"
              onPress={handleTrackOrder}
              style={styles.actionButton}
              icon="truck-delivery"
              buttonColor={colors.primary}
              textColor={colors.surface}
            >
              Track Order
            </Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    marginTop: 16,
    color: '#666'
  },
  card: {
    margin: 16,
    marginBottom: 8
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  statusIcon: {
    marginRight: 12
  },
  statusInfo: {
    flex: 1
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 16
  },
  statusTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8
  },
  timelineItem: {
    alignItems: 'center'
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#DDD',
    marginHorizontal: 8
  },
  timelineText: {
    fontSize: 12,
    color: '#666'
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4
  },
  detailLabel: {
    fontSize: 14,
    color: '#666'
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  divider: {
    marginVertical: 12
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4
  },
  paymentLabel: {
    fontSize: 16,
    color: '#666'
  },
  paymentValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F'
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 8,
    paddingBottom: 24
  },
  actionButton: {
    flex: 1
  }
});
