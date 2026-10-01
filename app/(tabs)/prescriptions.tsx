import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/use-debounce';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import {
  Dialog,
  Portal,
  TextInput,
  SegmentedButtons,
  Chip,
  Divider,
  Surface,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BrandColors } from '../../constants/theme';
import {
  ShowcaseStatusBar,
  AppHeader,
  Card,
  FAB,
  Input,
  Button,
  Badge,
} from '../../components/showcase';
import { Ionicons } from '@expo/vector-icons';

export default function PrescriptionsScreen() {
  const { colors } = useTheme();
  const { doctor } = useAuth();

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [patientMenuVisible, setPatientMenuVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [productMenuVisible, setProductMenuVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');

  // Filter and search states
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [newPrescription, setNewPrescription] = useState({
    patient_id: '',
    dosage_frequency: '',
    priority: 'normal',
    selected_product: { product_id: '', quantity: '1' },
  });

  useEffect(() => {
    loadPrescriptions();
    loadProducts();
    loadPatients();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Reload data when tab comes into focus
      loadPrescriptions();
    }, [])
  );

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/doctors/me/prescriptions');
      const fetched = response?.data?.data?.prescriptions ?? [];
      setPrescriptions(fetched);
      setFilteredPrescriptions(fetched);

      // Auto-sync order status for prescriptions with active orders
      if (fetched.length > 0) {
        syncPrescriptionOrders(fetched);
      }
    } catch (error) {

      setPrescriptions([]);
      setFilteredPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const syncPrescriptionOrders = async (prescriptionsToSync: any[]) => {
    try {
      // Only sync prescriptions with active orders (not fulfilled or cancelled)
      const activePrescriptions = prescriptionsToSync.filter(
        (p) => p.order_status !== 'fulfilled' && p.order_status !== 'cancelled'
      );

      if (activePrescriptions.length === 0) {
        return; // No orders to sync
      }

      // Get orders for these prescriptions
      const ordersResponse = await api.get('/doctors/me/orders');
      const allOrders = ordersResponse?.data?.data?.orders || [];

      // Filter orders that belong to active prescriptions
      const prescriptionIds = activePrescriptions.map((p) => p._id);
      const relevantOrders = allOrders.filter((o: any) =>
        prescriptionIds.includes(o.prescription_id)
      );

      if (relevantOrders.length === 0) return;

      const orderIds = relevantOrders.map((o: any) => o._id);

      // Sync orders
      await api.post('/orders/bulk-sync', { order_ids: orderIds });

      // Reload prescriptions to show updated status
      const updatedResponse = await api.get('/doctors/me/prescriptions');
      const updatedPrescriptions = updatedResponse?.data?.data?.prescriptions ?? [];
      setPrescriptions(updatedPrescriptions);
      setFilteredPrescriptions(updatedPrescriptions);
    } catch (error) {

      // Silently fail - user still sees cached data
    }
  };

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [prescriptions, filterStatus, filterPriority, searchQuery]);

  const applyFilters = () => {
    let filtered = [...prescriptions];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((p) => p.order_status === filterStatus);
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter((p) => p.priority === filterPriority);
    }

    // Search by MRN or patient name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.mrn?.toLowerCase().includes(query) ||
          p.patient_id?.name?.toLowerCase().includes(query)
      );
    }

    setFilteredPrescriptions(filtered);
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setSearchQuery('');
    setShowFilterDialog(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filterStatus !== 'all') count++;
    if (filterPriority !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  };

  const loadProducts = async () => {
    try {
      const response = await api.get('/products/team');
      const fetched = response?.data?.data ?? [];
      setProducts(fetched);
    } catch (error) {

      setProducts([]);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await api.get('/patients');
      const fetched = response?.data?.data ?? [];
      setPatients(fetched);
    } catch (error) {

      setPatients([]);
    }
  };

  const handleOpenDialog = () => {
    loadPatients(); // ensure fresh patients list
    setShowDialog(true);
  };

  const selectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setNewPrescription({ ...newPrescription, patient_id: patient._id });
    setPatientMenuVisible(false);
  };

  const selectProduct = (product: any) => {
    setSelectedProduct(product);
    setNewPrescription({
      ...newPrescription,
      selected_product: {
        product_id: product._id,
        quantity: '1',
      },
    });
    setProductMenuVisible(false);
  };

  const pickImage = () => {
    // RX-02: prescriptions may be multi-page PDFs, not just photos
    Alert.alert('Prescription Image', 'Choose a file type', [
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

      // result.canceled on web? in Expo SDK, check structure defensively
      if (!result.canceled && result.assets) {
        setSelectedFiles((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {

    }
  };

  const pickPrescriptionDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        setSelectedFiles((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {

    }
  };

  const createPrescription = async () => {
    if (
      !newPrescription.patient_id ||
      !newPrescription.dosage_frequency ||
      !newPrescription.selected_product.product_id ||
      !newPrescription.selected_product.quantity
    ) {
      Alert.alert(
        'Error',
        'Please fill all required fields (Patient, Product, Dosage Frequency, Quantity)'
      );
      return;
    }

    // If a coupon code was entered, validate it up-front so we fail fast before
    // creating the prescription/order. On success it's forwarded to /prescriptions.
    let validatedCouponCode: string | undefined;
    if (couponCode.trim()) {
      try {
        const qty = Number(newPrescription.selected_product.quantity) || 1;
        const orderTotal = selectedProduct?.price ? selectedProduct.price * qty : undefined;

        const validateResponse = await api.post('/coupons/validate', {
          coupon_code: couponCode.trim().toUpperCase(),
          doctor_id: doctor?.id,
          order_total: orderTotal,
          items: [
            {
              name: selectedProduct?.name,
              sku: selectedProduct?.sku,
              quantity: qty,
              price: selectedProduct?.price,
            },
          ],
        });

        validatedCouponCode = couponCode.trim().toUpperCase();
        const discountAmount = validateResponse?.data?.data?.discount_amount;
        if (discountAmount !== undefined) {
          Alert.alert('Coupon Applied', `A discount of Rs. ${discountAmount} will be applied to this order.`);
        }
      } catch (error: any) {
        const msg = error?.response?.data?.error?.message || 'Invalid or expired coupon code';
        Alert.alert('Invalid Coupon', msg);
        return;
      }
    }

    setLoading(true);
    try {
      // Convert string values to numbers and validate them
      const prescriptionData: any = {
        patient_id: newPrescription.patient_id,
        dosage_frequency: newPrescription.dosage_frequency,
        priority: newPrescription.priority,
        selected_product: {
          product_id: newPrescription.selected_product.product_id,
          quantity: Number(newPrescription.selected_product.quantity),
        },
      };

      if (validatedCouponCode) {
        prescriptionData.coupon_code = validatedCouponCode;
      }

      // Validate the data
      if (isNaN(prescriptionData.selected_product.quantity) || prescriptionData.selected_product.quantity < 1) {
        throw new Error('Quantity must be a valid number greater than 0');
      }

      const response = await api.post('/prescriptions', prescriptionData);

      const prescriptionId =
        response?.data?.data?.prescription?._id || response?.data?.data?._id;

      // Upload files if any
      if (selectedFiles.length > 0 && prescriptionId) {
        try {
          const formData = new FormData();
          selectedFiles.forEach((file: any, index: number) => {
            formData.append('files', {
              uri: file.uri,
              type: file.mimeType || file.type || 'image/jpeg',
              name: file.name || `file_${index}.jpg`,
            } as any);
          });

          await api.post(`/prescriptions/${prescriptionId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } catch (uploadError) {

          // Do not abort the whole flow — just log
        }
      }

      const couponWarning = response?.data?.data?.coupon_warning;
      Alert.alert(
        'Success',
        (response?.data?.message || 'Prescription created successfully') +
          (couponWarning ? `\n\nNote: ${couponWarning}` : '')
      );
      setShowDialog(false);
      setSelectedPatient(null);
      setSelectedProduct(null);
      setSelectedFiles([]);
      setCouponCode('');
      setNewPrescription({
        patient_id: '',
        dosage_frequency: '',
        priority: 'normal',
        selected_product: { product_id: '', quantity: '1' },
      });
      loadPrescriptions();
    } catch (error: any) {

      const errorMsg = error?.response?.data?.error?.message || error?.response?.data?.message || 'Failed to create prescription';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const filterCount = getActiveFilterCount();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ShowcaseStatusBar />

      <AppHeader
        title="Prescriptions"
      />

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Input
            icon="magnify"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by MRN or Patient Name"
            containerStyle={styles.searchInput}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterDialog(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="filter" size={20} color={BrandColors.white} />
            {filterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        {filterCount > 0 && (
          <View style={styles.activeFilters}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filterStatus !== 'all' && (
                <Chip mode="flat" onClose={() => setFilterStatus('all')} style={styles.filterChip}>
                  Status: {filterStatus}
                </Chip>
              )}
              {filterPriority !== 'all' && (
                <Chip mode="flat" onClose={() => setFilterPriority('all')} style={styles.filterChip}>
                  Priority: {filterPriority}
                </Chip>
              )}
              {searchQuery && (
                <Chip mode="flat" onClose={() => setSearchQuery('')} style={styles.filterChip}>
                  Search: {searchQuery}
                </Chip>
              )}
            </ScrollView>
            <Button title="Clear All" variant="text" onPress={clearFilters} />
          </View>
        )}

        <FlatList
          data={filteredPrescriptions}
          keyExtractor={(item) => String(item._id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card
              style={styles.prescriptionCard}
              elevation={2}
              onPress={() => router.push(`/prescription/${item._id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.prescriptionInfo}>
                  <Text style={styles.prescriptionMrn}>MRN: {item.mrn}</Text>
                  <Text style={styles.patientName}>{item.patient_id?.name || 'Unknown Patient'}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                    </Text>
                    {item.dosage_frequency && (
                      <Text style={styles.metaText}>• {item.dosage_frequency.charAt(0).toUpperCase() + item.dosage_frequency.slice(1)}</Text>
                    )}
                  </View>
                </View>
                <Badge text={item.order_status} variant={item.order_status as any} />
              </View>

              {/* Prescription Text Preview */}
              {item.prescription_text && (
                <View style={styles.prescriptionTextBox}>
                  <Text style={styles.prescriptionText} numberOfLines={2}>
                    {item.prescription_text}
                  </Text>
                </View>
              )}

              {/* Priority Badge */}
              {item.priority !== 'normal' && (
                <View style={styles.tagContainer}>
                  <View
                    style={[
                      styles.tag,
                      {
                        backgroundColor:
                          item.priority === 'urgent'
                            ? `${BrandColors.warning}20`
                            : `${BrandColors.error}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: item.priority === 'urgent' ? BrandColors.warning : BrandColors.error },
                      ]}
                    >
                      {String(item.priority).toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}
            </Card>
          )}
          refreshing={loading}
          onRefresh={loadPrescriptions}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery || filterCount > 0 ? 'No prescriptions match your filters' : 'No prescriptions yet'}
              </Text>
            </View>
          }
        />

        <FAB icon="add" onPress={handleOpenDialog} />

        <Portal>
          {/* Create Prescription Dialog */}
          <Dialog
            visible={showDialog}
            onDismiss={() => {
              setShowDialog(false);
              setSelectedPatient(null);
              setSelectedProduct(null);
              setCouponCode('');
            }}
            style={[styles.dialog, { backgroundColor: colors.surface }]}
          >
            <Dialog.Title style={{ color: colors.onSurface }}>Create Prescription</Dialog.Title>

            <Dialog.ScrollArea>
              <ScrollView style={{ padding: 12 }}>
                <Text style={[styles.label, { color: colors.onSurface }]}>Select Patient *</Text>
                <Surface style={[styles.dropdownContainer, { backgroundColor: colors.surface }]} elevation={1}>
                  <TouchableOpacity
                    style={[styles.dropdownButton, { borderColor: colors.outline }]}
                    onPress={() => setPatientMenuVisible(!patientMenuVisible)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dropdownText, { color: colors.onSurface }]}>
                      {selectedPatient ? `${selectedPatient.name} (${selectedPatient.mrn})` : 'Select Patient'}
                    </Text>
                  </TouchableOpacity>

                  {patientMenuVisible && (
                    <ScrollView style={[styles.dropdownList, { borderTopColor: colors.outline }]} nestedScrollEnabled>
                      {patients.length === 0 ? (
                        <Text style={[styles.emptyText, { color: BrandColors.mediumGray }]}>No patients found</Text>
                      ) : (
                        patients.map((patient) => (
                          <TouchableOpacity
                            key={patient._id}
                            style={[styles.dropdownItem, { borderBottomColor: colors.outline }]}
                            onPress={() => selectPatient(patient)}
                          >
                            <Text style={{ color: colors.onSurface }}>
                              {patient.name} ({patient.mrn})
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  )}
                </Surface>

                <Divider style={styles.divider} />

                <Text style={[styles.label, { color: colors.onSurface }]}>Select Product *</Text>
                <Surface style={[styles.dropdownContainer, { backgroundColor: colors.surface }]} elevation={1}>
                  <TouchableOpacity
                    style={[styles.dropdownButton, { borderColor: colors.outline }]}
                    onPress={() => setProductMenuVisible(!productMenuVisible)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dropdownText, { color: colors.onSurface }]}>
                      {selectedProduct ? `${selectedProduct.name} - Rs. ${selectedProduct.price}` : 'Select Product'}
                    </Text>
                  </TouchableOpacity>

                  {productMenuVisible && (
                    <ScrollView style={[styles.dropdownList, { borderTopColor: colors.outline }]} nestedScrollEnabled>
                      {products.length === 0 ? (
                        <Text style={[styles.emptyText, { color: BrandColors.mediumGray }]}>No products available</Text>
                      ) : (
                        products.map((product) => (
                          <TouchableOpacity
                            key={product._id}
                            style={[styles.dropdownItem, { borderBottomColor: colors.outline }]}
                            onPress={() => selectProduct(product)}
                          >
                            <Text style={{ color: colors.onSurface }}>
                              {product.name} - Rs. {product.price}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </ScrollView>
                  )}
                </Surface>

                <Text style={[styles.label, { color: colors.onSurface }]}>Dosage Frequency *</Text>
                <SegmentedButtons
                  value={newPrescription.dosage_frequency}
                  onValueChange={(value) => setNewPrescription({ ...newPrescription, dosage_frequency: value })}
                  buttons={[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                  ]}
                  style={styles.input}
                />
                <SegmentedButtons
                  value={newPrescription.dosage_frequency}
                  onValueChange={(value) => setNewPrescription({ ...newPrescription, dosage_frequency: value })}
                  buttons={[
                    { value: 'fortnightly', label: 'Fortnightly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                  style={styles.input}
                />

                <TextInput
                  label="Quantity *"
                  value={newPrescription.selected_product.quantity}
                  onChangeText={(text) =>
                    setNewPrescription({
                      ...newPrescription,
                      selected_product: { ...newPrescription.selected_product, quantity: text },
                    })
                  }
                  mode="outlined"
                  keyboardType="numeric"
                  style={[styles.input, { backgroundColor: colors.surface }]}
                  textColor={colors.onSurface}
                  outlineColor={colors.outline}
                  activeOutlineColor={colors.primary}
                />

                <Text style={[styles.label, { color: colors.onSurface }]}>Prescription Image</Text>
                <Button title="Add Prescription File" icon="camera" variant="outlined" onPress={pickImage} style={styles.input} />

                {selectedFiles.length > 0 && <Text style={{ color: colors.onSurface, marginBottom: 24 }}>{selectedFiles.length} image(s) selected</Text>}

                <Text style={[styles.label, { color: colors.onSurface }]}>Have a coupon code?</Text>
                <TextInput
                  label="Coupon Code (optional)"
                  value={couponCode}
                  onChangeText={(text) => setCouponCode(text.toUpperCase())}
                  mode="outlined"
                  autoCapitalize="characters"
                  style={[styles.input, { backgroundColor: colors.surface }]}
                  textColor={colors.onSurface}
                  outlineColor={colors.outline}
                  activeOutlineColor={colors.primary}
                />
              </ScrollView>
            </Dialog.ScrollArea>

            <Dialog.Actions>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowDialog(false);
                  setSelectedPatient(null);
                  setSelectedProduct(null);
                  setCouponCode('');
                }}
                variant="text"
              />
              <Button title="Create" onPress={createPrescription} loading={loading} />
            </Dialog.Actions>
          </Dialog>

          {/* Filter Dialog */}
          <Dialog
            visible={showFilterDialog}
            onDismiss={() => setShowFilterDialog(false)}
            style={[styles.dialog, { backgroundColor: colors.surface }]}
          >
            <Dialog.Title style={{ color: colors.onSurface }}>Filter Prescriptions</Dialog.Title>
            <Dialog.Content>
              <Text style={[styles.label, { color: colors.onSurface }]}>Status</Text>
              <SegmentedButtons
                value={filterStatus}
                onValueChange={setFilterStatus}
                buttons={[
                  { value: 'all', label: 'All' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'processing', label: 'Processing' },
                  { value: 'fulfilled', label: 'Fulfilled' },
                ]}
                style={styles.input}
              />

              <Text style={[styles.label, { color: colors.onSurface, marginTop: 16 }]}>Priority</Text>
              <SegmentedButtons
                value={filterPriority}
                onValueChange={setFilterPriority}
                buttons={[
                  { value: 'all', label: 'All' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'emergency', label: 'Emergency' },
                ]}
                style={styles.input}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button title="Clear All" variant="text" onPress={clearFilters} color={colors.onSurface} />
              <Button title="Apply" onPress={() => setShowFilterDialog(false)} color={colors.primary} />
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </SafeAreaView>
  );
}

/* Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 120,
  },
  prescriptionCard: {
    marginBottom: 8,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionMrn: {
    fontWeight: '600',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#757575',
  },
  prescriptionTextBox: {
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  prescriptionText: {
    fontSize: 14,
    color: '#212121',
    lineHeight: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* dialog & dropdown */
  dialog: {
    maxHeight: Platform.OS === 'ios' ? '100%' : '80%',
  },
  input: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  dropdownContainer: {
    marginBottom: 12,
    borderRadius: 8,
  },
  dropdownButton: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownList: {
    maxHeight: 200,
    borderTopWidth: 1,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    padding: 16,
  },
});
