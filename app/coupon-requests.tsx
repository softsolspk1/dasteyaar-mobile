import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Text, ScrollView, Platform } from 'react-native';
import { Dialog, Portal, TextInput, SegmentedButtons, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BrandColors, ShowcaseDesign } from '../constants/theme';
import { ShowcaseStatusBar, Card, FAB, Button, Badge } from '../components/showcase';
import { Ionicons } from '@expo/vector-icons';

interface CouponRequest {
  _id: string;
  coupon_code: string;
  doctor_name: string;
  discount_type: 'flat' | 'percentage';
  discount_value: number;
  status: 'pending_approval' | 'active' | 'rejected' | 'expired';
  rejection_reason?: string;
  approval_date?: string;
  usage_count: number;
  usage_limit?: number;
  createdAt: string;
}

export default function CouponRequestsScreen() {
  const { colors } = useTheme();
  const { doctor } = useAuth();

  const [requests, setRequests] = useState<CouponRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountValue, setDiscountValue] = useState('');
  const [validityFrom, setValidityFrom] = useState('');
  const [validityTo, setValidityTo] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadRequests();
    }, [])
  );

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/coupons/my-requests');
      setRequests(response?.data?.data ?? []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load coupon requests');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDiscountType('flat');
    setDiscountValue('');
    setValidityFrom('');
    setValidityTo('');
    setUsageLimit('');
  };

  const submitRequest = async () => {
    if (!doctor?.id) {
      Alert.alert('Error', 'Unable to determine your doctor account');
      return;
    }

    const value = Number(discountValue);
    if (!discountValue.trim() || isNaN(value) || value <= 0) {
      Alert.alert('Error', 'Please enter a valid discount value');
      return;
    }
    if (discountType === 'percentage' && value > 100) {
      Alert.alert('Error', 'Percentage discount cannot exceed 100');
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        doctor_id: doctor.id,
        discount_type: discountType,
        discount_value: value,
      };
      if (validityFrom.trim()) payload.validity_from = validityFrom.trim();
      if (validityTo.trim()) payload.validity_to = validityTo.trim();
      if (usageLimit.trim()) {
        const limit = Number(usageLimit.trim());
        if (!isNaN(limit) && limit > 0) payload.usage_limit = limit;
      }

      await api.post('/coupons/request', payload);
      Alert.alert('Success', 'Coupon request submitted for approval');
      setShowDialog(false);
      resetForm();
      loadRequests();
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || 'Failed to submit coupon request';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Badge component only has typed variants for order/prescription-style statuses.
  // Coupon statuses are mapped onto the closest matching color; unmatched values
  // (e.g. 'expired') fall through Badge's internal default case which renders gray.
  const getBadgeVariant = (status: string): any => {
    switch (status) {
      case 'active':
        return 'active'; // green
      case 'pending_approval':
        return 'pending'; // orange
      case 'rejected':
        return 'cancelled'; // red
      default:
        return 'expired'; // gray (Badge default fallback)
    }
  };

  const formatDiscount = (item: CouponRequest) =>
    item.discount_type === 'percentage' ? `${item.discount_value}% off` : `Rs. ${item.discount_value} off`;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ShowcaseStatusBar />

      {requests.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetag-outline" size={64} color={BrandColors.lightGray} />
          <Text style={styles.emptyTitle}>No Coupon Requests</Text>
          <Text style={styles.emptyText}>
            Tap the + button to request a discount coupon for your patients
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadRequests}
          renderItem={({ item }) => (
            <Card style={styles.requestCard} elevation={2}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.couponCode}>{item.coupon_code}</Text>
                  <Text style={styles.doctorName}>For Dr. {item.doctor_name}</Text>
                  <Text style={styles.discountText}>{formatDiscount(item)}</Text>
                </View>
                <Badge text={item.status.replace(/_/g, ' ')} variant={getBadgeVariant(item.status)} />
              </View>

              {item.status === 'rejected' && item.rejection_reason && (
                <View style={styles.rejectionBox}>
                  <Text style={styles.rejectionText}>Reason: {item.rejection_reason}</Text>
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text style={styles.metaText}>Requested {formatDate(item.createdAt)}</Text>
                {typeof item.usage_limit === 'number' && (
                  <Text style={styles.metaText}>
                    Used {item.usage_count}/{item.usage_limit}
                  </Text>
                )}
              </View>
            </Card>
          )}
        />
      )}

      <FAB icon="add" onPress={() => setShowDialog(true)} />

      <Portal>
        <Dialog
          visible={showDialog}
          onDismiss={() => {
            setShowDialog(false);
            resetForm();
          }}
          style={styles.dialog}
        >
          <Dialog.Title>New Coupon Request</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={{ padding: 12 }}>
              <Text style={[styles.label, { color: colors.onSurface }]}>Discount For</Text>
              <Text style={[styles.readonlyValue, { color: colors.onSurface }]}>
                Dr. {doctor?.name || 'You'}
              </Text>

              <Text style={[styles.label, { color: colors.onSurface }]}>Discount Type</Text>
              <SegmentedButtons
                value={discountType}
                onValueChange={(v) => setDiscountType(v as 'flat' | 'percentage')}
                buttons={[
                  { value: 'flat', label: 'Flat (Rs.)' },
                  { value: 'percentage', label: 'Percentage (%)' },
                ]}
                style={styles.dialogInput}
              />

              <TextInput
                label={discountType === 'percentage' ? 'Discount Value (%) *' : 'Discount Value (Rs.) *'}
                value={discountValue}
                onChangeText={setDiscountValue}
                mode="outlined"
                keyboardType="numeric"
                style={styles.dialogInput}
              />

              <TextInput
                label="Valid From (YYYY-MM-DD)"
                value={validityFrom}
                onChangeText={setValidityFrom}
                mode="outlined"
                placeholder="Optional"
                style={styles.dialogInput}
              />

              <TextInput
                label="Valid To (YYYY-MM-DD)"
                value={validityTo}
                onChangeText={setValidityTo}
                mode="outlined"
                placeholder="Optional"
                style={styles.dialogInput}
              />

              <TextInput
                label="Usage Limit"
                value={usageLimit}
                onChangeText={setUsageLimit}
                mode="outlined"
                keyboardType="numeric"
                placeholder="Optional, leave blank for unlimited"
                style={styles.dialogInput}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              title="Cancel"
              variant="text"
              onPress={() => {
                setShowDialog(false);
                resetForm();
              }}
            />
            <Button title="Submit" onPress={submitRequest} loading={submitting} />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.offWhite,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: BrandColors.darkGray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: BrandColors.mediumGray,
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  requestCard: {
    marginBottom: 15,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  couponCode: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.primary,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  doctorName: {
    fontSize: 14,
    color: BrandColors.darkGray,
    marginBottom: 2,
  },
  discountText: {
    fontSize: 13,
    color: BrandColors.mediumGray,
  },
  rejectionBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: ShowcaseDesign.borderRadius.small,
    backgroundColor: `${BrandColors.error}15`,
  },
  rejectionText: {
    fontSize: 13,
    color: BrandColors.error,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BrandColors.lightGray,
  },
  metaText: {
    fontSize: 12,
    color: BrandColors.mediumGray,
  },
  dialog: {
    backgroundColor: BrandColors.white,
    maxHeight: Platform.OS === 'ios' ? '100%' : '90%',
  },
  dialogInput: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  readonlyValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
});
