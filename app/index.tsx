import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, StyleSheet, Image, Animated, Easing, Text } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { BrandColors } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  const { doctor, isLoading } = useAuth();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing...');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      // Fade in and scale animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for logo
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoScale, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Spinning animation for loader
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Progress bar and text animation
      const progressInterval = setInterval(() => {
        setLoadingProgress((prev) => {
          const next = Math.min(prev + Math.random() * 15, 100);

          if (next < 30) {
            setLoadingText('Initializing...');
          } else if (next < 60) {
            setLoadingText('Loading data...');
          } else if (next < 90) {
            setLoadingText('Almost ready...');
          } else {
            setLoadingText('Ready!');
          }

          return next;
        });
      }, 200);

      Animated.timing(progressWidth, {
        toValue: 100,
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();

      return () => clearInterval(progressInterval);
    }
  }, [isLoading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* App Logo */}
          <Animated.View
            style={[
              styles.logoWrapper,
              {
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <LinearGradient
              colors={[`${BrandColors.primary}20`, `${BrandColors.primary}10`]}
              style={styles.logoContainer}
            >
              <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </LinearGradient>
          </Animated.View>

          {/* App Title */}
          <Text style={styles.title}>Dast-e-Yaar</Text>
          <Text style={styles.subtitle}>Prescription Management</Text>
          <Text style={styles.tagline}>Enabling Healthy, Happy Lives</Text>

          {/* Loading Animation */}
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[
                styles.spinner,
                { transform: [{ rotate: spin }] }
              ]}
            />
            <Text style={styles.loadingText}>{loadingText}</Text>
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    width: progressWidth.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {/* Version Info */}
          <Text style={styles.versionText}>Version 1.0.0 | CCL Healthcare</Text>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2024 CCL Healthcare. All rights reserved.</Text>
            <Text style={styles.footerText}>
              Developed by <Text style={styles.footerBold}>Softsols Pakistan</Text>
            </Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  return <Redirect href={doctor ? '/(tabs)' : '/login'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoWrapper: {
    marginBottom: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BrandColors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: BrandColors.primary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 18,
    color: BrandColors.mediumGray,
    marginBottom: 16,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: BrandColors.mediumGray,
    fontStyle: 'italic',
    marginBottom: 48,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  spinner: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderColor: BrandColors.primaryLight,
    borderTopColor: BrandColors.primary,
    borderRadius: 20,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: BrandColors.mediumGray,
    fontWeight: '500',
    marginBottom: 16,
  },
  progressBarContainer: {
    width: 200,
    height: 4,
    backgroundColor: BrandColors.primaryLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: BrandColors.primary,
    borderRadius: 2,
  },
  versionText: {
    position: 'absolute',
    bottom: 80,
    fontSize: 13,
    color: BrandColors.mediumGray,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: BrandColors.mediumGray,
    textAlign: 'center',
  },
  footerBold: {
    fontWeight: '700',
  },
});
