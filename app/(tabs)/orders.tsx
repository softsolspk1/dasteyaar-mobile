import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useDebounce } from '../../hooks/use-debounce';
import { Chip, Dialog, Portal, SegmentedButtons, Button as PaperButton, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import api from '../../services/api';
import { BrandColors } from '../../constants/theme';
import { ShowcaseStatusBar, AppHeader, Card, Input, Badge } from '../../components/showcase';
import { Ionicons } from '@expo/vector-icons';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { colors } = useTheme();

  useEffect(() => {
    loadOrders();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadOrders();
    }, [])
  );

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/doctors/me/orders');
      const fetchedOrders = response.data?.data?.orders || [];
      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);
      
      // Sync orders with Shopify in the background
      if (fetchedOrders.length > 0) {
        syncOrdersInBackground(fetchedOrders);
      }
    } catch (error) {

      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const syncOrdersInBackground = async (ordersToSync: any[]) => {
    try {
      // Only sync active orders (not fulfilled or cancelled)
      const activeOrders = ordersToSync.filter(
        o => o.order_status !== 'fulfilled' && o.order_status !== 'cancelled'
      );

      if (activeOrders.length === 0) {
        return; // No orders to sync
      }

      const orderIds = activeOrders.map(o => o._id);
      const response = await api.post('/orders/bulk-sync', { order_ids: orderIds });
      
      if (response.data.success && response.data.data.orders) {
        // Merge synced orders with existing fulfilled/cancelled orders
        const syncedOrdersMap = new Map(response.data.data.orders.map((o: any) => [o._id, o]));
        const updatedOrders = ordersToSync.map(o => syncedOrdersMap.get(o._id) || o);
        
        setOrders(updatedOrders);
        setFilteredOrders(updatedOrders);
      }
    } catch (error) {

      // Silently fail - user still sees cached data
    }
  };

  useEffect(() => {
    applyFilters();
  }, [orders, filterStatus, debouncedSearchQuery]);

  const applyFilters = () => {
    let filtered = [...orders];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(o => o.order_status === filterStatus);
    }

    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.shopify_order_number?.toLowerCase().includes(query) ||
        o.patient_info?.mrn?.toLowerCase().includes(query) ||
        o.patient_info?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setSearchQuery('');
    setShowFilterDialog(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  };

  const filterCount = getActiveFilterCount();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ShowcaseStatusBar />
      <AppHeader title="Orders" />

      <View style={styles.content}>
        {/* Search + Filter */}
        <View style={styles.searchContainer}>
          <Input
            icon="magnify"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by Order #, MRN, or Patient"
            containerStyle={styles.searchInput}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterDialog(true)}
          >
            <Ionicons name="filter" size={20} color={BrandColors.white} />
            {filterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filters */}
        {filterCount > 0 && (
          <View style={styles.activeFilters}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filterStatus !== 'all' && (
                <Chip
                  mode="flat"
                  onClose={() => setFilterStatus('all')}
                  style={styles.filterChip}
                >
                  Status: {filterStatus}
                </Chip>
              )}
              {searchQuery && (
                <Chip
                  mode="flat"
                  onClose={() => setSearchQuery('')}
                  style={styles.filterChip}
                >
                  Search: {searchQuery}
                </Chip>
              )}
            </ScrollView>
            <PaperButton mode="text" onPress={clearFilters} compact>
              Clear All
            </PaperButton>
          </View>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={BrandColors.lightGray} />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptyText}>
              {searchQuery || filterCount > 0
                ? 'No orders match your filters'
                : 'Orders will appear here once prescriptions are created.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item._id.toString()}
            contentContainerStyle={styles.listContent}
            refreshing={loading}
            onRefresh={loadOrders}
            renderItem={({ item }) => (
              <Card
                style={styles.orderCard}
                onPress={() => router.push(`/order/${item._id}`)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.orderNumber}>
                    Order #{item.shopify_order_number || 'N/A'}
                  </Text>
                  <Badge text={item.order_status} variant={item.order_status as any} />
                </View>

                <View style={styles.cardDetails}>
                  <Text style={styles.detailText}>
                    <Ionicons name="person" size={14} color={BrandColors.mediumGray} />{' '}
                    {item.patient_info?.name || 'N/A'}
                  </Text>
                  <Text style={styles.detailText}>
                    <Ionicons name="medical" size={14} color={BrandColors.mediumGray} /> MRN:{' '}
                    {item.patient_info?.mrn || 'N/A'}
                  </Text>

                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Total Amount:</Text>
                    <Text style={styles.amountValue}>Rs. {item.total_amount || 0}</Text>
                  </View>

                  {item.tracking_number && (
                    <View style={styles.trackingRow}>
                      <Ionicons name="location" size={14} color={BrandColors.info} />
                      <Text style={styles.trackingText}>
                        Tracking: {item.tracking_number}
                      </Text>
                    </View>
                  )}

                  <Text style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </Card>
            )}
          />
        )}
      </View>

      <Portal>
        <Dialog
          visible={showFilterDialog}
          onDismiss={() => setShowFilterDialog(false)}
          style={[styles.dialog, { backgroundColor: colors.surface }]}
        >
          <Dialog.Title style={{ color: colors.onSurface }}>
            Filter Orders
          </Dialog.Title>
          <Dialog.Content>
            <Text style={[styles.label, { color: colors.onSurface }]}>Status</Text>
            <View style={styles.filterButtonsContainer}>
              <SegmentedButtons
                value={filterStatus}
                onValueChange={setFilterStatus}
                buttons={[
                  { value: 'all', label: 'All' },
                  { value: 'pending', label: 'Pending' },
                ]}
                style={styles.segmentedButtonsRow}
              />
              <SegmentedButtons
                value={filterStatus}
                onValueChange={setFilterStatus}
                buttons={[
                  { value: 'processing', label: 'Processing' },
                  { value: 'fulfilled', label: 'Fulfilled' },
                ]}
                style={styles.segmentedButtonsRow}
              />
              <SegmentedButtons
                value={filterStatus}
                onValueChange={setFilterStatus}
                buttons={[
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                style={styles.segmentedButtonsRow}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={clearFilters}>Clear All</PaperButton>
            <PaperButton onPress={() => setShowFilterDialog(false)}>Apply</PaperButton>
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
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  dialog: {
    maxHeight: '80%',
  },
  label: {
    marginBottom: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  orderCard: {
    marginBottom: 15,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardDetails: {
    gap: 6,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  detailText: {
    fontSize: 14,
    color: '#757575',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  amountLabel: {
    fontSize: 14,
    color: '#757575',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D32F2F',
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  trackingText: {
    fontSize: 13,
    color: '#2196F3',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  filterButtonsContainer: {
    gap: 8,
  },
  segmentedButtonsRow: {
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 12,
  },
});
