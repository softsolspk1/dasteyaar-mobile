import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, Text, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { BrandColors } from '../constants/theme';
import { ShowcaseStatusBar, Button, Input } from '../components/showcase';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Status Bar */}
      <ShowcaseStatusBar />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[BrandColors.primary, BrandColors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>Dast-e-Yaar</Text>
        <Text style={styles.headerSubtitle}>Doctor Login</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 80 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {/* Login Form */}
          <Input
            label="Username/Email Address"
            icon="account"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter username or email"
            autoCapitalize="none"
            keyboardType="email-address"
            disabled={loading}
            returnKeyType="next"
          />

          <Input
            label="Password"
            icon="lock"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            disabled={loading}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {/* Login Button */}
          <Button
            title="Login"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            gradient
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 CCL Healthcare. All rights reserved.</Text>
            <Text style={styles.footerText}>
              Developed by <Text style={styles.footerBold}>Softsols Pakistan</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.white,
  },
  header: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: BrandColors.white,
    marginBottom: 8,
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 14,
    color: BrandColors.white,
    opacity: 0.9,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 32,
  },

  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: BrandColors.mediumGray,
    textAlign: 'center',
  },
  footerBold: {
    fontWeight: '700',
  },
});
