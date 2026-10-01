import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Linking, useColorScheme, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { Card, Title, Text, Button, List, Divider, Chip, useTheme, ActivityIndicator, ProgressBar, TextInput, Portal, Dialog } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { getThemeColors } from '../../constants/theme';
import { ShowcaseStatusBar, PageHeader } from '../../components/showcase';

interface OrderRemark {
  _id?: string;
  text: string;
  added_by_role: string;
  added_by_name: string;
  visibility: 'public' | 'internal';
  createdAt: string;
}

interface PrescriptionAttachment {
  _id?: string;
  url: string;
  file_type?: string;
  uploaded_by_name?: string;
  uploaded_at: string;
}

interface OrderDelivery {
  scheduled_date?: string;
  scheduled_time_slot?: string;
  estimated_delivery_time?: string;
  rider_name?: string;
  rider_contact?: string;
  rider_vehicle?: string;
  delivery_status: string;
  actual_delivery_time?: string;
}

interface OutletPerformance {
  rating_value?: number;
  rating_comments?: string;
  rating_date?: string;
}

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
  discount?: {
    coupon_id?: string;
    coupon_code: string;
    discount_type: 'flat' | 'percentage';
    discount_value: number;
    discount_amount: number;
  };
  created_at?: string;
  updated_at?: string;
  createdAt?: string;  // MongoDB timestamp
  updatedAt?: string;  // MongoDB timestamp
  shopify_created_at?: string;
  shopify_updated_at?: string;
  remarks?: OrderRemark[];
  prescription_attachments?: PrescriptionAttachment[];
  prescription_required?: boolean;
  prescription_status?: 'not_required' | 'pending' | 'attached';
  delivery?: OrderDelivery;
  outlet_performance?: OutletPerformance;
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
  const [reorderDialogVisible, setReorderDialogVisible] = useState(false);
  const [reorderQuantity, setReorderQuantity] = useState('1');
  const [reorderCoupon, setReorderCoupon] = useState('');
  const [pendingReorder, setPendingReorder] = useState<{ prescription: any; presId: string } | null>(null);

  const [remarks, setRemarks] = useState<OrderRemark[]>([]);
  const [remarksLoading, setRemarksLoading] = useState(false);
  const [newRemark, setNewRemark] = useState('');
  const [addingRemark, setAddingRemark] = useState(false);
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Load order initially
  useEffect(() => {
    const initializeOrder = async () => {
      await loadOrder();
      // Sync with Shopify in the background after initial load
      syncOrderStatus();
      loadRemarks();
      loadQuickTags();
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

  const loadRemarks = async () => {
    try {
      setRemarksLoading(true);
      const response = await api.get(`/orders/${id}/remarks`);
      setRemarks(response?.data?.data ?? []);
    } catch (error) {
      // Silently fail - remarks are supplementary, don't block the screen
    } finally {
      setRemarksLoading(false);
    }
  };

  const loadQuickTags = async () => {
    try {
      const response = await api.get('/orders/quick-tags');
      setQuickTags(response?.data?.data ?? []);
    } catch (error) {
      // Silently fail - quick tags are a convenience shortcut, not essential
    }
  };

  const handleAddRemark = async (overrideText?: string) => {
    const text = (overrideText ?? newRemark).trim();
    if (!text) return;
    try {
      setAddingRemark(true);
      const response = await api.post(`/orders/${id}/remarks`, {
        text,
        visibility: 'public',
      });
      setRemarks(response?.data?.data ?? []);
      setNewRemark('');
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || 'Failed to add remark';
      Alert.alert('Error', msg);
    } finally {
      setAddingRemark(false);
    }
  };

  const pickPrescriptionAttachment = () => {
    // RX-02: prescriptions may be multi-page PDFs, not just photos
    Alert.alert('Attach Prescription', 'Choose a file type', [
      { text: 'Photo', onPress: pickPrescriptionImages },
      { text: 'PDF Document', onPress: pickPrescriptionDocument },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pickPrescriptionImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadPrescriptionAttachments(result.assets);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const pickPrescriptionDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadPrescriptionAttachments(result.assets);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open document picker');
    }
  };

  const uploadPrescriptionAttachments = async (files: any[]) => {
    try {
      setUploadingAttachment(true);
      const formData = new FormData();
      files.forEach((file: any, index: number) => {
        formData.append('files', {
          uri: file.uri,
          type: file.mimeType || file.type || 'image/jpeg',
          name: file.name || `attachment_${index}.jpg`,
        } as any);
      });

      const response = await api.post(`/orders/${id}/prescription-attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setOrder((prev) =>
        prev ? { ...prev, prescription_attachments: response?.data?.data ?? prev.prescription_attachments, prescription_status: 'attached' } : prev
      );
      Alert.alert('Success', 'Prescription attached to order');
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || 'Failed to upload prescription';
      Alert.alert('Error', msg);
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleCallRider = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to place call');
    });
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'out_for_delivery': return '#2196F3';
      case 'failed': return '#F44336';
      case 'rescheduled': return '#FF9800';
      default: return '#FFA500';
    }
  };

  const handleReOrder = async () => {
    if (!order?.prescription_id) {
      Alert.alert('Error', 'Original prescription not found.');
      return;
    }
    try {
      setReordering(true);
      const presId = typeof order.prescription_id === 'object' ? (order.prescription_id as any)._id : order.prescription_id;
      const presRes = await api.get(`/prescriptions/${presId}`);
      const oldPrescription = presRes.data.data;

      setPendingReorder({ prescription: oldPrescription, presId });
      setReorderQuantity(String(oldPrescription.items?.[0]?.quantity || 1));
      // Carry the same coupon forward by default - a discount that applied for
      // this doctor/patient shouldn't silently vanish on a repeat order.
      setReorderCoupon(order.discount?.coupon_code || '');
      setReorderDialogVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load original prescription for re-order.');
    } finally {
      setReordering(false);
    }
  };

  const confirmReorder = async () => {
    if (!pendingReorder) return;
    const oldPrescription = pendingReorder.prescription;
    const quantity = Number(reorderQuantity);
    if (!quantity || quantity < 1) {
      Alert.alert('Error', 'Quantity must be a valid number greater than 0');
      return;
    }

    try {
      setReordering(true);

      const prescriptionData: any = {
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
          quantity,
        },
        diagnosis: oldPrescription.diagnosis,
        notes: oldPrescription.notes,
        city_id: oldPrescription.city_id,
      };

      if (reorderCoupon.trim()) {
        prescriptionData.coupon_code = reorderCoupon.trim().toUpperCase();
      }

      const response = await api.post('/prescriptions', prescriptionData);

      if (response.data.success) {
        setReorderDialogVisible(false);
        setPendingReorder(null);
        const couponWarning = response?.data?.data?.coupon_warning;
        Alert.alert(
          'Success',
          'Re-Order placed successfully!' + (couponWarning ? `\n\nNote: ${couponWarning}` : ''),
          [
            { text: 'View New Order', onPress: () => router.push(`/order/${response.data.data.order._id}`) },
            { text: 'OK', onPress: () => router.push('/(tabs)/orders') }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to place re-order.');
    } finally {
      setReordering(false);
    }
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
            {order.discount && (
              <>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>
                    Coupon Applied:
                  </Text>
                  <Chip mode="flat" style={{ backgroundColor: colors.primary + '20' }} textStyle={{ color: colors.primary, fontWeight: 'bold' }}>
                    {order.discount.coupon_code}
                  </Chip>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={[styles.paymentLabel, { color: colors.textSecondary }]}>Discount:</Text>
                  <Text style={[styles.paymentValue, { color: colors.success || colors.primary }]}>
                    - {order.currency} {order.discount.discount_amount.toFixed(2)}
                    {order.discount.discount_type === 'percentage' ? ` (${order.discount.discount_value}%)` : ''}
                  </Text>
                </View>
                <Divider style={styles.divider} />
              </>
            )}
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

        {/* Delivery Information */}
        {order.delivery && order.delivery.delivery_status !== 'not_scheduled' && (
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Title style={{ color: colors.text }}>Delivery Information</Title>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status:</Text>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: getDeliveryStatusColor(order.delivery.delivery_status) + '20' }}
                  textStyle={{ color: getDeliveryStatusColor(order.delivery.delivery_status), fontWeight: 'bold' }}
                >
                  {order.delivery.delivery_status.replace(/_/g, ' ').toUpperCase()}
                </Chip>
              </View>
              {order.delivery.scheduled_date && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Scheduled Date:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(order.delivery.scheduled_date)}</Text>
                  </View>
                </>
              )}
              {order.delivery.scheduled_time_slot && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Time Slot:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>{order.delivery.scheduled_time_slot}</Text>
                  </View>
                </>
              )}
              {order.delivery.rider_name && (
                <>
                  <Divider />
                  <List.Item
                    title={order.delivery.rider_name}
                    description={order.delivery.rider_vehicle ? `Rider • ${order.delivery.rider_vehicle}` : 'Rider'}
                    left={props => <List.Icon {...props} icon="account-hard-hat" />}
                    right={props =>
                      order.delivery?.rider_contact ? (
                        <List.Icon {...props} icon="phone" color={colors.primary} />
                      ) : undefined
                    }
                    onPress={
                      order.delivery?.rider_contact
                        ? () => handleCallRider(order.delivery?.rider_contact)
                        : undefined
                    }
                  />
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Prescription Attachment */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Title style={{ color: colors.text }}>Prescription Attachment</Title>
            {order.prescription_attachments && order.prescription_attachments.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentsRow}>
                {order.prescription_attachments.map((att, index) =>
                  att.file_type === 'application/pdf' ? (
                    <TouchableOpacity
                      key={att._id || index}
                      onPress={() => Linking.openURL(att.url).catch(() => {})}
                      style={[styles.attachmentThumb, styles.pdfThumb, { backgroundColor: colors.background }]}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={32} color={colors.primary} />
                      <Text style={{ color: colors.textSecondary, fontSize: 10 }} numberOfLines={1}>
                        PDF
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      key={att._id || index}
                      onPress={() => Linking.openURL(att.url).catch(() => {})}
                    >
                      <Image source={{ uri: att.url }} style={styles.attachmentThumb} />
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            ) : (
              <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>No prescription attached yet</Text>
            )}
            <Button
              mode="outlined"
              onPress={pickPrescriptionAttachment}
              loading={uploadingAttachment}
              disabled={uploadingAttachment}
              textColor={colors.primary}
              icon="camera"
              style={{ marginTop: 12 }}
            >
              Attach Prescription
            </Button>
          </Card.Content>
        </Card>

        {/* Outlet Rating (read-only) */}
        {order.outlet_performance?.rating_value ? (
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Title style={{ color: colors.text }}>Outlet Rating</Title>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialCommunityIcons
                    key={star}
                    name={star <= Math.round(order.outlet_performance?.rating_value || 0) ? 'star' : 'star-outline'}
                    size={22}
                    color="#FFB300"
                    style={{ marginRight: 2 }}
                  />
                ))}
              </View>
              {order.outlet_performance.rating_comments && (
                <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                  {order.outlet_performance.rating_comments}
                </Text>
              )}
            </Card.Content>
          </Card>
        ) : null}

        {/* Remarks */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Title style={{ color: colors.text }}>Remarks</Title>
            {remarksLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
            ) : remarks.length === 0 ? (
              <Text style={{ color: colors.textSecondary, marginVertical: 8 }}>No remarks yet</Text>
            ) : (
              [...remarks].reverse().map((remark, index, arr) => (
                <View key={remark._id || index}>
                  <View style={styles.remarkItem}>
                    <Text style={[styles.remarkMeta, { color: colors.textSecondary }]}>
                      {remark.added_by_name} ({remark.added_by_role}) • {formatDate(remark.createdAt)}
                    </Text>
                    <Text style={{ color: colors.text }}>{remark.text}</Text>
                  </View>
                  {index < arr.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))
            )}
            <View style={styles.remarkInputRow}>
              <TextInput
                mode="outlined"
                placeholder="Add a remark..."
                value={newRemark}
                onChangeText={setNewRemark}
                style={styles.remarkInput}
                dense
              />
              <Button
                mode="contained"
                onPress={() => handleAddRemark()}
                loading={addingRemark}
                disabled={addingRemark || !newRemark.trim()}
                buttonColor={colors.primary}
                textColor={colors.surface}
              >
                Add
              </Button>
            </View>
            {quickTags.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickTagsRow}>
                {quickTags.map((tag) => (
                  <Chip
                    key={tag}
                    mode="outlined"
                    style={styles.quickTagChip}
                    disabled={addingRemark}
                    onPress={() => handleAddRemark(tag)}
                  >
                    {tag}
                  </Chip>
                ))}
              </ScrollView>
            )}
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

      <Portal>
        <Dialog visible={reorderDialogVisible} onDismiss={() => setReorderDialogVisible(false)}>
          <Dialog.Title>Confirm Re-Order</Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 12 }}>
              Review the quantity and coupon code before placing this repeat order.
            </Text>
            <TextInput
              label="Quantity"
              value={reorderQuantity}
              onChangeText={setReorderQuantity}
              keyboardType="numeric"
              mode="outlined"
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label="Coupon Code (optional)"
              value={reorderCoupon}
              onChangeText={(text) => setReorderCoupon(text.toUpperCase())}
              autoCapitalize="characters"
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReorderDialogVisible(false)} disabled={reordering}>
              Cancel
            </Button>
            <Button onPress={confirmReorder} loading={reordering} disabled={reordering}>
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  },
  attachmentsRow: {
    marginBottom: 4
  },
  attachmentThumb: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#EEE'
  },
  pdfThumb: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  remarkItem: {
    paddingVertical: 8
  },
  remarkMeta: {
    fontSize: 12,
    marginBottom: 2
  },
  remarkInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12
  },
  remarkInput: {
    flex: 1
  },
  quickTagsRow: {
    marginTop: 10
  },
  quickTagChip: {
    marginRight: 8
  }
});
