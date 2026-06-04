import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { View, StyleSheet, Image } from 'react-native';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { BrandColors } from '../constants/theme';
import { CustomLightTheme, CustomDarkTheme } from '../constants/paper-theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

const SplashScreen = React.memo(() => {
  return (
    <View style={styles.splashContainer}>
      <Image
        source={require('../assets/images/logo.png')}
        style={styles.splashLogo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#D32F2F" style={styles.splashLoader} />
    </View>
  );
});
SplashScreen.displayName = 'SplashScreen';

function RootLayoutNav() {
  const { doctor, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!isLoading) {
      const route = doctor ? '/(tabs)' : '/login';
      setInitialRoute(route);
      
      if (route !== `/${segments.join('/')}`) {
        router.replace(route);
      }
    }
  }, [doctor, isLoading]);

  // Show splash until auth check is complete and initial route is determined
  if (isLoading || !initialRoute) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="patient/[id]" options={{ headerShown: true, title: 'Patient Details', headerStyle: { backgroundColor: BrandColors.primary }, headerTintColor: BrandColors.white }} />
        <Stack.Screen name="patient/edit/[id]" options={{ headerShown: true, title: 'Edit Patient', headerStyle: { backgroundColor: BrandColors.primary }, headerTintColor: BrandColors.white }} />
        <Stack.Screen name="prescription/[id]" options={{ headerShown: true, title: 'Prescription Details', headerStyle: { backgroundColor: BrandColors.primary }, headerTintColor: BrandColors.white }} />
        <Stack.Screen name="prescription/edit/[id]" options={{ headerShown: true, title: 'Edit Prescription', headerStyle: { backgroundColor: BrandColors.primary }, headerTintColor: BrandColors.white }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: true, title: 'Order Details', headerStyle: { backgroundColor: BrandColors.primary }, headerTintColor: BrandColors.white }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const paperTheme = CustomLightTheme; // Always use light theme

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
        });
        setFontsLoaded(true);
      } catch (error) {
        setFontsLoaded(true); // Continue even if fonts fail to load
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#D32F2F" style={styles.splashLoader} />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  splashLogo: {
    width: 280,
    height: 160,
    marginBottom: 40,
  },
  splashLoader: {
    marginTop: 20,
  },
});
