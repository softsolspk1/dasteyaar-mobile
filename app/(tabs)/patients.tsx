import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useDebounce } from '../../hooks/use-debounce';
import { useCities } from '../../hooks/useCities';
import { Dialog, Portal, TextInput, SegmentedButtons, Surface, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';
import { BrandColors, ShowcaseDesign } from '../../constants/theme';
import { ShowcaseStatusBar, AppHeader, Card, FAB, Input, Button, Badge } from '../../components/showcase';
import { Ionicons } from '@expo/vector-icons';
import { setAddPatientDialogTrigger } from './_layout';

export default function PatientsScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { cities, cityNames } = useCities();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [productMenuVisible, setProductMenuVisible] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '',
    city: '',
  });

  const [newPrescription, setNewPrescription] = useState({
    dosage_frequency: '',
    duration_days: '',
    priority: 'normal',
    selected_product: { product_id: '', quantity: '1' },
  });

  useEffect(() => {
    loadAllPatients();
    loadProducts();

    // Register the trigger function for the add button
    const openDialog = () => {

      setShowDialog(true);
    };

    setAddPatientDialogTrigger(openDialog);

    // Cleanup
    return () => {
      setAddPatientDialogTrigger(() => {});
    };
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery) {
      searchPatients(debouncedSearchQuery);
    } else {
      loadAllPatients();
    }
  }, [debouncedSearchQuery]);

  useFocusEffect(
    React.useCallback(() => {
      loadAllPatients();
    }, [])
  );

  const loadAllPatients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/patients');
      setPatients(response.data.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async (query: string) => {
    if (!query || query.length < 2) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/patients', { params: { search: query } });
      if (response?.data?.data) {
        setPatients(response.data.data);
      }
    } catch (error) {

      // Don't show alert for search failures
    } finally {
      setLoading(false);
    }
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

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        setSelectedFiles((prev) => [...prev, ...result.assets]);
      }
    } catch (err) {

    }
  };

  const createPatient = async () => {
    if (!newPatient.name || !newPatient.phone) {
      Alert.alert('Error', 'Name and phone are required');
      return;
    }

    // Validate prescription fields (now always shown)
    if (
      !newPrescription.dosage_frequency ||
      !newPrescription.selected_product.product_id ||
      !newPrescription.selected_product.quantity
    ) {
      Alert.alert(
        'Error',
        'Please fill all required prescription fields (Product, Dosage Frequency, Quantity)'
      );
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create patient
      const patientData: any = {
        name: newPatient.name.trim(),
        phone: newPatient.phone.trim(),
      };
      
      // Only add optional fields if they have values
      if (newPatient.age && newPatient.age.trim()) {
        patientData.age = parseInt(newPatient.age);
      }
      if (newPatient.gender && newPatient.gender.trim()) {
        patientData.gender = newPatient.gender;
      }
      if (newPatient.city && newPatient.city.trim()) {
        patientData.city = newPatient.city.trim();
      }

      const patientResponse = await api.post('/patients', patientData);

      const createdPatient = patientResponse.data.data;
      const patientMRN = createdPatient.mrn;
      const patientId = createdPatient._id;

      // Step 2: Create prescription (now always required)
      try {
        // Find selected city ID
        const selectedCity = cities.find(c => c.name === newPatient.city);

        const prescriptionData = {
          patient_id: patientId,
          dosage_frequency: newPrescription.dosage_frequency,
          priority: newPrescription.priority,
          selected_product: {
            product_id: newPrescription.selected_product.product_id,
            quantity: Number(newPrescription.selected_product.quantity),
          },
          city_id: selectedCity?._id, // Include city_id if city is selected
        };

        // Validate the data
        if (isNaN(prescriptionData.selected_product.quantity) || prescriptionData.selected_product.quantity < 1) {
          throw new Error('Quantity must be a valid number greater than 0');
        }

        const prescriptionResponse = await api.post('/prescriptions', prescriptionData);
        const prescriptionId =
          prescriptionResponse?.data?.data?.prescription?._id || prescriptionResponse?.data?.data?._id;

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

          }
        }

        Alert.alert(
          'Success',
          `Patient created with MRN: ${patientMRN}\nPrescription created successfully!`
        );
      } catch (prescriptionError: any) {

        const errorMsg = prescriptionError?.response?.data?.error?.message || prescriptionError.message || 'Failed to create prescription';
        Alert.alert(
          'Partial Success',
          `Patient created with MRN: ${patientMRN}\n\nBut prescription creation failed: ${errorMsg}`
        );
      }

      // Reset form
      setShowDialog(false);
      setNewPatient({ name: '', phone: '', age: '', gender: '', city: '' });
      setNewPrescription({
        dosage_frequency: '',
        duration_days: '',
        priority: 'normal',
        selected_product: { product_id: '', quantity: '1' },
      });
      setSelectedProduct(null);
      setSelectedFiles([]);
      setCityMenuVisible(false);
      setProductMenuVisible(false);
      loadAllPatients();
    } catch (error: any) {

      // Extract detailed validation errors
      let errorMsg = 'Failed to create patient';
      if (error?.response?.data?.error) {
        const errorData = error.response.data.error;
        if (errorData.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
          // Extract validation error messages from Joi validation format
          const validationErrors = errorData.details.map((detail: any) => {
            const field = detail.field || 'Unknown field';
            const message = detail.message || detail.msg || 'Invalid value';
            return `${field}: ${message}`;
          }).join('\n');
          errorMsg = validationErrors;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        }
      } else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      Alert.alert('Validation Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Status Bar */}
      <ShowcaseStatusBar />

      {/* Header */}
      <AppHeader
        title="Patients"
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
          <Input
            icon="magnify"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by phone or MRN"
            containerStyle={styles.searchInput}
          />
      </View>

      {patients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={BrandColors.lightGray} />
          <Text style={styles.emptyTitle}>No Patients Yet</Text>
          <Text style={styles.emptyText}>
            {searchQuery.length >= 3
              ? 'No patients found matching your search'
              : loading
              ? 'Loading patients...'
              : 'Add your first patient to get started'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadAllPatients}
          renderItem={({ item }) => (
            <Card
              style={styles.patientCard}
              elevation={2}
              onPress={() => router.push(`/patient/${item._id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.patientMrn}>MRN: {item.mrn}</Text>
                  <View style={styles.patientDetails}>
                    <Text style={styles.detailText}>
                      <Ionicons name="call" size={12} color={BrandColors.mediumGray} /> {item.phone}
                    </Text>
                    {item.age && (
                      <Text style={styles.detailText}>• {item.age} yrs</Text>
                    )}
                    {item.gender && (
                      <Text style={styles.detailText}>• {item.gender}</Text>
                    )}
                  </View>
                </View>
                <Badge text="Active" variant="active" />
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push(`/patient/${item._id}`)}
                >
                  <Ionicons name="eye" size={16} color={BrandColors.info} />
                  <Text style={[styles.actionButtonText, { color: BrandColors.info }]}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push(`/patient/edit/${item._id}`)}
                >
                  <Ionicons name="create" size={16} color={BrandColors.warning} />
                  <Text style={[styles.actionButtonText, { color: BrandColors.warning }]}>Edit</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}

      {/* FAB */}
      <FAB icon="add" onPress={() => setShowDialog(true)} />

      {/* Add Patient Dialog */}
      <Portal>
        <Dialog
          visible={showDialog}
          onDismiss={() => {
            setShowDialog(false);
            setSelectedProduct(null);
            setSelectedFiles([]);
            setCityMenuVisible(false);
            setProductMenuVisible(false);
          }}
          style={styles.dialog}
        >
          <Dialog.Title>Add Patient</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView style={{ padding: 12 }}>
              <TextInput
                label="Name *"
                value={newPatient.name}
                onChangeText={(text) => setNewPatient({ ...newPatient, name: text })}
                mode="outlined"
                style={styles.dialogInput}
              />
              <TextInput
                label="Phone Number *"
                value={newPatient.phone}
                onChangeText={(text) => setNewPatient({ ...newPatient, phone: text })}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.dialogInput}
              />
              <TextInput
                label="Age"
                value={newPatient.age}
                onChangeText={(text) => setNewPatient({ ...newPatient, age: text })}
                mode="outlined"
                keyboardType="numeric"
                style={styles.dialogInput}
              />
              <SegmentedButtons
                value={newPatient.gender}
                onValueChange={(value) => setNewPatient({ ...newPatient, gender: value })}
                buttons={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                style={styles.dialogInput}
              />

              <Text style={[styles.label, { color: colors.onSurface }]}>City</Text>
              <Surface style={[styles.dropdownContainer, { backgroundColor: colors.surface }]} elevation={1}>
                <TouchableOpacity
                  style={[styles.dropdownButton, { borderColor: colors.outline }]}
                  onPress={() => setCityMenuVisible(!cityMenuVisible)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownText, { color: newPatient.city ? colors.onSurface : BrandColors.mediumGray }]}>
                    {newPatient.city || 'Select City'}
                  </Text>
                </TouchableOpacity>

                {cityMenuVisible && (
                  <ScrollView style={[styles.dropdownList, { borderTopColor: colors.outline }]} nestedScrollEnabled>
                    {cityNames.map((city) => (
                      <TouchableOpacity
                        key={city}
                        style={[styles.dropdownItem, { borderBottomColor: colors.outline }]}
                        onPress={() => {
                          setNewPatient({ ...newPatient, city });
                          setCityMenuVisible(false);
                        }}
                      >
                        <Text style={{ color: colors.onSurface }}>{city}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </Surface>

              <Divider style={styles.divider} />

              {/* Prescription Details Section */}
              <View style={styles.prescriptionSection}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Prescription Details</Text>

                <Text style={[styles.label, { color: colors.onSurface }]}>Select Product *</Text>
                <Surface style={[styles.dropdownContainer, { backgroundColor: colors.surface }]} elevation={1}>
                  <TouchableOpacity
                    style={[styles.dropdownButton, { borderColor: colors.outline }]}
                    onPress={() => setProductMenuVisible(!productMenuVisible)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dropdownText, { color: selectedProduct ? colors.onSurface : BrandColors.mediumGray }]}>
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
                  style={styles.dialogInput}
                />
                <SegmentedButtons
                  value={newPrescription.dosage_frequency}
                  onValueChange={(value) => setNewPrescription({ ...newPrescription, dosage_frequency: value })}
                  buttons={[
                    { value: 'fortnightly', label: 'Fortnightly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                  style={styles.dialogInput}
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
                  style={[styles.dialogInput, { backgroundColor: colors.surface }]}
                  textColor={colors.onSurface}
                  outlineColor={colors.outline}
                  activeOutlineColor={colors.primary}
                />

                <Text style={[styles.label, { color: colors.onSurface }]}>Prescription Image</Text>
                <Button title="Add Image" icon="camera" variant="outlined" onPress={pickImage} style={styles.dialogInput} />

                {selectedFiles.length > 0 && <Text style={{ color: colors.onSurface, marginBottom: 24 }}>{selectedFiles.length} image(s) selected</Text>}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button
              title="Cancel"
              variant="text"
              onPress={() => {
                setShowDialog(false);
                setSelectedProduct(null);
                setSelectedFiles([]);
                setCityMenuVisible(false);
                setProductMenuVisible(false);
              }}
            />
            <Button
              title="SUBMIT"
              onPress={createPatient}
              loading={loading}
            />
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: BrandColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.lightGray,
  },
  searchInput: {
    marginBottom: 0,
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
  patientCard: {
    marginBottom: 15,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: BrandColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: BrandColors.primary,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.darkGray,
    marginBottom: 4,
  },
  patientMrn: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.primary,
    marginBottom: 6,
  },
  patientDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: BrandColors.mediumGray,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: BrandColors.lightGray,
    paddingTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: ShowcaseDesign.borderRadius.small,
    backgroundColor: BrandColors.offWhite,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dialog: {
    backgroundColor: BrandColors.white,
    maxHeight: Platform.OS === 'ios' ? '100%' : '90%',
  },
  dialogInput: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 16,
  },
  prescriptionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BrandColors.lightGray,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: BrandColors.darkGray,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
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
});
