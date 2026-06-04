import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Image, Linking, useColorScheme } from 'react-native';
import { Card, Title, Text, Button, List, Divider, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack, useFocusEffect } from 'expo-router';
import api from '../../services/api';
import { getThemeColors } from '../../constants/theme';
import { ShowcaseStatusBar, PageHeader } from '../../components/showcase';

interface Prescription {
  _id: string;
  mrn: string;
  patient_id: {
    _id: string;
    name: string;
    mrn: string;
    phone: string;
  };
  prescription_text?: string;
  dosage_frequency?: string;
  prescription_files: string[];
  duration_days?: number;
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
  shopify_order_id?: string;
  shopify_order_number?: string;
  order_status: string;
  created_at?: string;
  createdAt?: string;
}

export default function PrescriptionDetailScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    loadPrescription();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      // Reload data when screen comes into focus
      loadPrescription();
    }, [id])
  );

  const loadPrescription = async () => {
    try {
      setLoading(true);

      const response = await api.get(`/prescriptions/${id}`);

      setPrescription(response.data.data);
    } catch (error: any) {

      const errorMessage = error.response?.data?.error?.message || 'Failed to load prescription details';
      Alert.alert('Error', `${errorMessage}\n\nPrescription ID: ${id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = () => {
    if (prescription?.patient_id?._id) {
      router.push(`/patient/${prescription.patient_id._id}`);
    }
  };

  const handleEdit = () => {
    if (prescription?.order_status !== 'pending') {
      Alert.alert(
        'Cannot Edit',
        'This prescription cannot be edited because an order has already been created.',
        [{ text: 'OK' }]
      );
      return;
    }
    router.push(`/prescription/edit/${id}`);
  };

  const handleOpenFile = (fileUrl: string) => {
    Linking.openURL(fileUrl).catch(() => {
      Alert.alert('Error', 'Failed to open file');
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return '#F44336';
      case 'urgent': return '#FF9800';
      default: return '#4CAF50';
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading prescription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!prescription) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Prescription not found</Text>
          <Button mode="contained" onPress={() => router.back()} buttonColor={colors.primary}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: "Prescription Details" }} />
      <ScrollView 
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Status Header */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.statusHeader}>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: getPriorityColor(prescription.priority) + '20' }}
                  textStyle={{ color: getPriorityColor(prescription.priority), fontWeight: 'bold' }}
                  icon="alert-circle"
                >
                  {prescription.priority.toUpperCase()}
                </Chip>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: getStatusColor(prescription.order_status) + '20' }}
                  textStyle={{ color: getStatusColor(prescription.order_status), fontWeight: 'bold' }}
                  icon="package-variant"
                >
                  {prescription.order_status.toUpperCase()}
                </Chip>
              </View>
              {prescription.order_status === 'pending' && (
                <Button
                  mode="contained"
                  onPress={handleEdit}
                  icon="pencil"
                  compact
                  buttonColor={colors.primary}
                  contentStyle={{ height: 36 }}
                >
                  Edit
                </Button>
              )}
            </View>
            <Text style={[styles.mrn, { color: colors.text }]}>MRN: {prescription.mrn}</Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(prescription.createdAt || prescription.created_at || '')}</Text>
          </Card.Content>
        </Card>

        {/* Patient Info */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Title style={{ color: colors.text }}>Patient Information</Title>
            <List.Item
              title={prescription.patient_id.name}
              description={`MRN: ${prescription.patient_id.mrn} • ${prescription.patient_id.phone}`}
              left={props => <List.Icon {...props} icon="account" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleViewPatient}
            />
          </Card.Content>
        </Card>

        {/* Prescription Details */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Title style={{ color: colors.text }}>Prescription Details</Title>
            {prescription.dosage_frequency && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Dosage Frequency:</Text>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: colors.primary + '20' }}
                  textStyle={{ color: colors.primary, fontWeight: 'bold', textTransform: 'capitalize' }}
                >
                  {prescription.dosage_frequency}
                </Chip>
              </View>
            )}
            {prescription.prescription_text && (
              <>
                <Divider style={styles.divider} />
                <View style={[styles.prescriptionBox, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.prescriptionText, { color: colors.text }]}>{prescription.prescription_text}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Product Information */}
        {prescription.selected_product && (
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Title style={{ color: colors.text }}>Product Details</Title>
              <List.Item
                title={prescription.selected_product.name}
                description={`SKU: ${prescription.selected_product.sku}`}
                left={props => <List.Icon {...props} icon="pill" />}
              />
              <Divider />
              <View style={styles.productInfo}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Quantity:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{prescription.selected_product.quantity}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Price:</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>PKR {prescription.selected_product.price.toFixed(2)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Total:</Text>
                  <Text style={[styles.infoValue, styles.totalPrice, { color: colors.text }]}>
                    PKR {(prescription.selected_product.price * prescription.selected_product.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Diagnosis & Notes */}
        {(prescription.diagnosis || prescription.notes) && (
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Title style={{ color: colors.text }}>Clinical Notes</Title>
              {prescription.diagnosis && (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Diagnosis:</Text>
                  <Text style={[styles.notesText, { color: colors.text }]}>{prescription.diagnosis}</Text>
                  <Divider style={styles.divider} />
                </>
              )}
              {prescription.notes && (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Additional Notes:</Text>
                  <Text style={[styles.notesText, { color: colors.text }]}>{prescription.notes}</Text>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Prescription Files */}
        {prescription.prescription_files && prescription.prescription_files.length > 0 && (
          <Card style={[styles.card, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Title style={{ color: colors.text }}>Attached Files ({prescription.prescription_files.length})</Title>
              {prescription.prescription_files.map((fileUrl, index) => (
                <Card key={index} style={styles.fileCard} onPress={() => handleOpenFile(fileUrl)}>
                  <Card.Content style={styles.fileContent}>
                    <List.Icon icon="file-document" />
                    <View style={styles.fileInfo}>
                      <Text style={{ color: colors.text }}>Prescription File {index + 1}</Text>
                      <Text style={[styles.fileHint, { color: colors.textSecondary }]}>Tap to view</Text>
                    </View>
                    <List.Icon icon="open-in-new" />
                  </Card.Content>
                </Card>
              ))}
            </Card.Content>
          </Card>
        )}

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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  statusHeader: {
    flexDirection: 'row',
    gap: 8,
    flex: 1
  },
  mrn: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
    marginTop: 8
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  prescriptionBox: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#D32F2F',
    marginTop: 8
  },
  prescriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333'
  },
  divider: {
    marginVertical: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4
  },
  infoLabel: {
    fontSize: 14,
    color: '#666'
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  totalPrice: {
    fontSize: 16,
    color: '#D32F2F'
  },
  productInfo: {
    marginTop: 8
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 4
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333'
  },
  fileCard: {
    marginTop: 8,
    elevation: 1
  },
  fileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8
  },
  fileInfo: {
    flex: 1,
    marginLeft: 8
  },
  fileHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 8
  },
  actionButton: {
    flex: 1
  }
});
