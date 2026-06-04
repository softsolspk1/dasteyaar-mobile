import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text, TouchableOpacity, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileDrawer from '../../components/ui/ProfileDrawer';
import NotificationsDrawer from '../../components/ui/NotificationsDrawer';
import BannerCarousel from '../../components/BannerCarousel';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { triggerAddPatientDialog } from './_layout';
import { useBanners } from '../../hooks/useBanners';
import api from '../../services/api';
import { BrandColors, ShowcaseDesign } from '../../constants/theme';
import { ShowcaseStatusBar, AppHeader, Card } from '../../components/showcase';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { doctor } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ patients: 0, prescriptions: 0, orders: 0, pending: 0 });
  const [patientStats, setPatientStats] = useState({ today: 0, month: 0, year: 0 });
  const [refreshing, setRefreshing] = useState(false);
  
  // Banner system
  const { banners, loading: bannersLoading, error: bannersError, refresh: refreshBanners } = useBanners();

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Reload data when tab comes into focus
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      await Promise.all([
        loadStats(),
        loadPatientStats(),
        refreshBanners()
      ]);
    } catch (error) {

    }
  };

  const loadStats = async () => {
    try {
      const [prescriptionsRes, ordersRes, patientsRes] = await Promise.all([
        api.get('/doctors/me/prescriptions', { params: { status: 'pending' } }),
        api.get('/doctors/me/orders', { params: { limit: 1 } }),
        api.get('/patients', { params: { limit: 1 } }),
      ]);

      setStats({
        patients: patientsRes.data.data.pagination?.total || patientsRes.data.data.length || 0,
        prescriptions: prescriptionsRes.data.data.pagination?.total || 0,
        orders: ordersRes.data.data.pagination?.total || 0,
        pending: prescriptionsRes.data.data.count || 0,
      });
    } catch (error) {

    }
  };

  const loadPatientStats = async () => {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

      // Fetch all patients and filter client-side since API may not support date filtering
      const response = await api.get('/patients');
      const allPatients = response.data.data || [];

      // Filter by creation date
      const todayPatients = allPatients.filter((p: any) => {
        const createdAt = new Date(p.createdAt);
        return createdAt >= new Date(startOfDay);
      });

      const monthPatients = allPatients.filter((p: any) => {
        const createdAt = new Date(p.createdAt);
        return createdAt >= new Date(startOfMonth);
      });

      const yearPatients = allPatients.filter((p: any) => {
        const createdAt = new Date(p.createdAt);
        return createdAt >= new Date(startOfYear);
      });

      setPatientStats({
        today: todayPatients.length,
        month: monthPatients.length,
        year: yearPatients.length,
      });
    } catch (error) {

      setPatientStats({ today: 0, month: 0, year: 0 });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Status Bar */}
      <ShowcaseStatusBar />

      {/* Profile Drawer */}
      <ProfileDrawer
        visible={showProfileDrawer}
        onClose={() => setShowProfileDrawer(false)}
      />

      {/* Notifications Drawer */}
      <NotificationsDrawer
        visible={showNotificationsDrawer}
        onClose={() => setShowNotificationsDrawer(false)}
      />

      {/* App Header */}
      <AppHeader
        title="Dast-e-Yaar"
        showMenu
        showNotification
        notificationCount={stats.pending}
        onMenuPress={() => setShowProfileDrawer(true)}
        onNotificationPress={() => setShowNotificationsDrawer(true)}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BrandColors.primary]}
          />
        }
      >
        {/* DastEYaar Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Patient's Statistics */}
        <View style={styles.patientStatsSection}>
          <View style={styles.patientStatsGrid}>
            <Card style={styles.patientStatCard} elevation={2}>
              <Text style={styles.patientStatNumber}>{patientStats.today}</Text>
              <Text style={styles.patientStatLabel}>TODAY</Text>
            </Card>

            <Card style={styles.patientStatCard} elevation={2}>
              <Text style={styles.patientStatNumber}>{patientStats.month}</Text>
              <Text style={styles.patientStatLabel}>THIS MONTH</Text>
            </Card>

            <Card style={styles.patientStatCard} elevation={2}>
              <Text style={styles.patientStatNumber}>{patientStats.year}</Text>
              <Text style={styles.patientStatLabel}>THIS YEAR</Text>
            </Card>
          </View>
        </View>

        {/* Add New Patient Button */}
        <View style={styles.addPatientSection}>
          <TouchableOpacity
            style={styles.addPatientButton}
            onPress={() => {
              router.push('/(tabs)/patients');
              setTimeout(() => {
                if (triggerAddPatientDialog) {
                  triggerAddPatientDialog();
                }
              }, 100);
            }}
          >
            <Ionicons name="add-circle" size={24} color={BrandColors.white} />
            <Text style={styles.addPatientButtonText}>Add New Patient</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Us Button */}
        <View style={styles.contactUsSection}>
          <TouchableOpacity
            style={styles.contactUsButton}
            onPress={() => {
              const phoneNumber = '+923248855666';
              const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
              const webUrl = `https://wa.me/${phoneNumber}`;
              
              // Try to open WhatsApp app first, fallback to web
              Linking.openURL(whatsappUrl).catch(() => {
                Linking.openURL(webUrl);
              });
            }}
          >
            <Ionicons name="logo-whatsapp" size={24} color={BrandColors.white} />
            <Text style={styles.contactUsButtonText}>Contact Us</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Carousel */}
        <BannerCarousel
          banners={banners || []}
          loading={bannersLoading}
          error={bannersError || undefined}
          onRefresh={refreshBanners}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.white,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: BrandColors.mediumGray,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  logoImage: {
    width: 400,
    height: 200,
  },
  patientStatsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.darkGray,
    marginBottom: 16,
  },
  patientStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  patientStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  patientStatNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: BrandColors.primary,
    marginBottom: 4,
  },
  patientStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.mediumGray,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  addPatientSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  contactUsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  addPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: ShowcaseDesign.borderRadius.medium,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addPatientButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.white,
  },
  contactUsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366', // WhatsApp green
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: ShowcaseDesign.borderRadius.medium,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactUsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.white,
  },
});
