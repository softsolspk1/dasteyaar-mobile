import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, useTheme, ActivityIndicator, Text, SegmentedButtons, Menu } from 'react-native-paper';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import api from '../../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
}

interface Prescription {
  _id: string;
  mrn: string;
  patient_id: {
    _id: string;
    name: string;
  };
  prescription_text: string;
  duration_days: number;
  priority: string;
  selected_product: {
    product_id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
  };
  diagnosis?: string;
  notes?: string;
  order_status: string;
}

export default function EditPrescriptionScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);

  const [prescriptionText, setPrescriptionText] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [priority, setPriority] = useState('normal');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [patientName, setPatientName] = useState('');
  const [orderStatus, setOrderStatus] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prescriptionRes, productsRes] = await Promise.all([
        api.get(`/prescriptions/${id}`),
        api.get('/products/team')
      ]);

      const prescription: Prescription = prescriptionRes.data.data;
      const productsList: Product[] = productsRes.data.data;

      setPrescriptionText(prescription.prescription_text);
      setDurationDays(prescription.duration_days.toString());
      setPriority(prescription.priority);
      setQuantity(prescription.selected_product.quantity.toString());
      setPatientName(prescription.patient_id.name);
      setOrderStatus(prescription.order_status);

      setProducts(productsList);

      // Find and set the selected product
      const product = productsList.find(
        p => p._id === prescription.selected_product.product_id
      );
      if (product) {
        setSelectedProduct(product);
      }
    } catch (error: any) {

      Alert.alert('Error', 'Failed to load prescription details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!prescriptionText.trim()) {
      Alert.alert('Validation Error', 'Prescription text is required');
      return false;
    }
    if (!durationDays || parseInt(durationDays) < 1 || parseInt(durationDays) > 365) {
      Alert.alert('Validation Error', 'Duration must be between 1 and 365 days');
      return false;
    }
    if (!selectedProduct) {
      Alert.alert('Validation Error', 'Please select a product');
      return false;
    }
    if (!quantity || parseInt(quantity) < 1) {
      Alert.alert('Validation Error', 'Quantity must be at least 1');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    // Check if order has already been created
    if (orderStatus !== 'pending') {
      Alert.alert(
        'Cannot Edit',
        'This prescription cannot be edited because an order has already been created for it.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);

      const updateData = {
        prescription_text: prescriptionText.trim(),
        duration_days: parseInt(durationDays),
        priority,
        selected_product: {
          product_id: selectedProduct!._id,
          name: selectedProduct!.name,
          sku: selectedProduct!.sku,
          price: selectedProduct!.price,
          quantity: parseInt(quantity)
        }
      };

      await api.put(`/prescriptions/${id}`, updateData);

      Alert.alert('Success', 'Prescription updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {

      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update prescription'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Changes?',
      'Are you sure you want to discard your changes?',
      [
        { text: 'Continue Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Edit Prescription' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading prescription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if prescription can be edited
  if (orderStatus !== 'pending') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Cannot Edit' }} />
        <View style={styles.loadingContainer}>
          <Text variant="titleMedium" style={styles.warningText}>
            This prescription cannot be edited because an order has already been created.
          </Text>
          <Button mode="contained" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Edit Prescription' }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: 100 }]}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Patient: {patientName}
        </Text>

        <TextInput
          label="Prescription Text *"
          value={prescriptionText}
          onChangeText={setPrescriptionText}
          mode="outlined"
          multiline
          numberOfLines={6}
          style={styles.input}
          placeholder="Enter prescription details (Rx, Sig, Disp, etc.)"
        />

        <TextInput
          label="Duration (Days) *"
          value={durationDays}
          onChangeText={setDurationDays}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
          left={<TextInput.Icon icon="calendar-range" />}
        />

        <Text variant="labelMedium" style={styles.label}>Priority *</Text>
        <SegmentedButtons
          value={priority}
          onValueChange={setPriority}
          buttons={[
            { value: 'normal', label: 'Normal', icon: 'checkbox-marked-circle' },
            { value: 'urgent', label: 'Urgent', icon: 'alert' },
            { value: 'emergency', label: 'Emergency', icon: 'alert-octagon' },
          ]}
          style={styles.segmentedButtons}
        />

        <Text variant="labelMedium" style={styles.label}>Select Product *</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={styles.productButton}
              contentStyle={styles.productButtonContent}
              icon="pill"
            >
              {selectedProduct ? selectedProduct.name : 'Select Product'}
            </Button>
          }
        >
          {products.map(product => (
            <Menu.Item
              key={product._id}
              onPress={() => {
                setSelectedProduct(product);
                setMenuVisible(false);
              }}
              title={product.name}
              leadingIcon="pill"
            />
          ))}
        </Menu>

        {selectedProduct && (
          <View style={styles.productInfo}>
            <Text variant="bodySmall" style={styles.productDetail}>
              SKU: {selectedProduct.sku}
            </Text>
            <Text variant="bodySmall" style={styles.productDetail}>
              Price: PKR {selectedProduct.price.toFixed(2)}
            </Text>
          </View>
        )}

        <TextInput
          label="Quantity *"
          value={quantity}
          onChangeText={setQuantity}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
          left={<TextInput.Icon icon="package-variant" />}
        />

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={handleCancel}
            style={styles.button}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.button}
            loading={saving}
            disabled={saving}
          >
            Save Changes
          </Button>
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
    gap: 16,
    padding: 24
  },
  loadingText: {
    marginTop: 16,
    color: '#666'
  },
  warningText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 16
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
    color: '#D32F2F'
  },
  input: {
    marginBottom: 16
  },
  label: {
    marginBottom: 8,
    color: '#666'
  },
  segmentedButtons: {
    marginBottom: 16
  },
  productButton: {
    marginBottom: 8
  },
  productButtonContent: {
    justifyContent: 'flex-start'
  },
  productInfo: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  productDetail: {
    color: '#666',
    marginBottom: 4
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 16
  },
  button: {
    flex: 1
  }
});
