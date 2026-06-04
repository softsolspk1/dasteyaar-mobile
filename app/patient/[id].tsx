import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, useColorScheme } from 'react-native';
import { Card, Title, Text, Button, List, Divider, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, router, Stack, useFocusEffect } from 'expo-router';
import api from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeColors } from '../../constants/theme';
import { ShowcaseStatusBar, PageHeader } from '../../components/showcase';

interface Patient {
  _id: string;
  mrn: string;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  city?: string;
  created_at?: string;
  createdAt?: string;
}

interface Prescription {
  _id: string;
  mrn: string;
  prescription_text?: string;
  dosage_frequency?: string;
  duration_days?: number;
  order_status: string;
  created_at: string;
  selected_product?: {
    name: string;
    quantity: number;
  };
}

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    loadPatientData();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      // Reload data when screen comes into focus
      loadPatientData();
    }, [id])
  );

  const loadPatientData = async () => {
    try {
      setLoading(true);

      // Load patient details
      const patientRes = await api.get(`/patients/${id}`);
      setPatient(patientRes.data.data);

      // Load prescriptions for this patient
      try {
        const prescriptionsRes = await api.get(`/doctors/me/prescriptions`, {
          params: { patient_id: id }
        });
        setPrescriptions(prescriptionsRes.data.data.prescriptions || []);
      } catch (prescError) {
        // Don't fail the whole page if prescriptions fail to load
        setPrescriptions([]);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/patient/edit/${id}`);
  };

  const handleCreatePrescription = () => {
    router.push({
      pathname: '/(tabs)/prescriptions',
      params: { patientId: id }
    });
  };

  const handleViewPrescription = (prescriptionId: string) => {
    router.push(`/prescription/${prescriptionId}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading patient data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Patient not found</Text>
          <Button mode="contained" onPress={() => router.back()} buttonColor={colors.primary}>Go Back</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ title: patient.name }} />
      <ScrollView 
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Patient Info Card */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={styles.header}>
              <View>
                <Title style={{ color: colors.text }}>{patient.name}</Title>
                <Chip
                  mode="outlined"
                  style={styles.mrnChip}
                  textStyle={{ color: colors.primary }}
                >
                  MRN: {patient.mrn}
                </Chip>
              </View>
              <Button mode="outlined" onPress={handleEdit} icon="pencil" textColor={colors.primary}>
                Edit
              </Button>
            </View>

            <Divider style={styles.divider} />

            <List.Item
              title="Phone Number"
              description={patient.phone}
              left={props => <List.Icon {...props} icon="phone" />}
            />
            <Divider />
            {patient.age && (
              <>
                <List.Item
                  title="Age"
                  description={`${patient.age} years`}
                  left={props => <List.Icon {...props} icon="calendar" />}
                />
                <Divider />
              </>
            )}
            {patient.gender && (
              <>
                <List.Item
                  title="Gender"
                  description={patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                  left={props => <List.Icon {...props} icon="human-male-female" />}
                />
                <Divider />
              </>
            )}
            {patient.city && (
              <>
                <List.Item
                  title="City"
                  description={patient.city}
                  left={props => <List.Icon {...props} icon="map-marker" />}
                />
                <Divider />
              </>
            )}
            <List.Item
              title="Registered On"
              description={formatDate(patient.createdAt || patient.created_at || '')}
              left={props => <List.Icon {...props} icon="clock" />}
            />
          </Card.Content>
        </Card>

        {/* Prescriptions Section */}
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={{ alignSelf: 'center' }}>Prescription History</Title>
              <Button
                mode="contained"
                onPress={handleCreatePrescription}
                icon="plus"
                buttonColor="#D32F2F"
                compact
                contentStyle={{ height: 36 }}
              >
                New
              </Button>
            </View>

            {prescriptions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No prescriptions yet</Text>
                <Button mode="outlined" onPress={handleCreatePrescription}>
                  Create First Prescription
                </Button>
              </View>
            ) : (
              prescriptions.map((prescription, index) => (
                <Card
                  key={prescription._id}
                  style={[styles.prescriptionCard, { backgroundColor: colors.background }]}
                  onPress={() => handleViewPrescription(prescription._id)}
                >
                  <Card.Content>
                    {prescription.selected_product && (
                      <Text style={[styles.prescriptionText, { color: colors.text, fontWeight: '600' }]}>
                        {prescription.selected_product.name} × {prescription.selected_product.quantity}
                      </Text>
                    )}
                    {prescription.dosage_frequency && (
                      <Text style={[styles.prescriptionText, { color: colors.text }]}>
                        Dosage: {prescription.dosage_frequency.charAt(0).toUpperCase() + prescription.dosage_frequency.slice(1)}
                      </Text>
                    )}
                    {prescription.prescription_text && (
                      <Text numberOfLines={2} style={[styles.prescriptionText, { color: colors.textSecondary, fontSize: 13 }]}>
                        {prescription.prescription_text}
                      </Text>
                    )}
                  </Card.Content>
                </Card>
              ))
            )}
          </Card.Content>
        </Card>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  mrnChip: {
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  divider: {
    marginVertical: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    gap: 16
  },
  emptyText: {
    color: '#999',
    fontSize: 16
  },
  prescriptionCard: {
    marginBottom: 12,
    elevation: 2
  },
  prescriptionText: {
    marginVertical: 8,
    lineHeight: 20
  },
});
