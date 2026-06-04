import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Global variable to trigger patient dialog
export let triggerAddPatientDialog: (() => void) | null = null;

export function setAddPatientDialogTrigger(fn: () => void) {
  triggerAddPatientDialog = fn;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-patient"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.addButtonWrapper}>
              <View style={styles.addButtonCircle}>
                <Ionicons name="add" size={22.4} color="#FFF" />
              </View>
            </View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.9}
              onPress={() => {

                // Navigate to patients tab first to ensure it's mounted
                router.push('/(tabs)/patients');
                // Wait a bit for navigation, then trigger dialog
                setTimeout(() => {

                  if (triggerAddPatientDialog) {
                    triggerAddPatientDialog();

                  } else {

                  }
                }, 100);
              }}
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="prescriptions"
        options={{
          title: 'Prescriptions',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color}) => <Ionicons name="cart" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonWrapper: {
    position: 'absolute',
    top: -8,
    width: 48, // 60 * 0.8
    height: 48, // 60 * 0.8
    borderRadius: 24, // 30 * 0.8
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonCircle: {
    width: 40, // 50 * 0.8
    height: 40, // 50 * 0.8
    borderRadius: 20, // 25 * 0.8
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
