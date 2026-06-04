import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, useTheme, ActivityIndicator, Text, SegmentedButtons, Surface } from 'react-native-paper';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import api from '../../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCities } from '../../../hooks/useCities';
import { BrandColors } from '../../../constants/theme';

interface Patient {
  _id: string;
  mrn: string;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  city?: string;
}

export default function EditPatientScreen() {
  const { id } = useLocalSearchParams();
  const theme = useTheme();
  const { cityNames } = useCities();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cityMenuVisible, setCityMenuVisible] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    loadPatient();
  }, [id]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/patients/${id}`);
      const patient: Patient = response.data.data;

      setName(patient.name);
      setPhone(patient.phone);
      setAge(patient.age?.toString() || '');
      setGender(patient.gender || '');
      setCity(patient.city || '');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load patient details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Patient name is required');
      return false;
    }
    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required');
      return false;
    }
    if (age && (parseInt(age) < 0 || parseInt(age) > 150)) {
      Alert.alert('Validation Error', 'Age must be between 0 and 150');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const updateData: any = {
        name: name.trim(),
        phone: phone.trim(),
      };

      if (age) updateData.age = parseInt(age);
      if (gender) updateData.gender = gender;
      if (city) updateData.city = city.trim();

      await api.put(`/patients/${id}`, updateData);

      Alert.alert('Success', 'Patient updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update patient'
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
        <Stack.Screen options={{ title: 'Edit Patient' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading patient...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Edit Patient' }} />
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: 100 }]}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Patient Information</Text>

        <TextInput
          label="Patient Name *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="account" />}
        />

        <TextInput
          label="Phone Number *"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
          left={<TextInput.Icon icon="phone" />}
        />

        <TextInput
          label="Age (Optional)"
          value={age}
          onChangeText={setAge}
          mode="outlined"
          keyboardType="number-pad"
          style={styles.input}
          left={<TextInput.Icon icon="calendar" />}
          placeholder="Enter age"
        />

        <Text variant="labelMedium" style={styles.label}>Gender</Text>
        <SegmentedButtons
          value={gender}
          onValueChange={setGender}
          buttons={[
            { value: 'male', label: 'Male', icon: 'human-male' },
            { value: 'female', label: 'Female', icon: 'human-female' },
            { value: 'other', label: 'Other', icon: 'human-male-female' },
          ]}
          style={styles.segmentedButtons}
        />

        <Text variant="labelMedium" style={styles.label}>City</Text>
        <Surface style={[styles.dropdownContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <TouchableOpacity
            style={[styles.dropdownButton, { borderColor: theme.colors.outline }]}
            onPress={() => setCityMenuVisible(!cityMenuVisible)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dropdownText, { color: city ? theme.colors.onSurface : BrandColors.mediumGray }]}>
              {city || 'Select City'}
            </Text>
          </TouchableOpacity>

          {cityMenuVisible && (
            <ScrollView style={[styles.dropdownList, { borderTopColor: theme.colors.outline }]} nestedScrollEnabled>
              {cityNames.map((cityOption) => (
                <TouchableOpacity
                  key={cityOption}
                  style={[styles.dropdownItem, { borderBottomColor: theme.colors.outline }]}
                  onPress={() => {
                    setCity(cityOption);
                    setCityMenuVisible(false);
                  }}
                >
                  <Text style={{ color: theme.colors.onSurface }}>{cityOption}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Surface>

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
    gap: 16
  },
  loadingText: {
    marginTop: 16,
    color: '#666'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 16
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600'
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
  dropdownContainer: {
    marginBottom: 16,
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
