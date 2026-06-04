import React from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '../../constants/theme';

interface NotificationsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationsDrawer({ visible, onClose }: NotificationsDrawerProps) {
  const { height } = useWindowDimensions();

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { height }]}>
      <TouchableOpacity style={styles.dismiss} onPress={onClose} />
      <View style={styles.drawer}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
          <View style={styles.header}>
            <Text variant="titleLarge" style={styles.title}>Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={BrandColors.darkGray} />
            </TouchableOpacity>
          </View>

          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={BrandColors.lightGray} />
            <Text variant="titleMedium" style={styles.emptyTitle}>No Notifications</Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              You have no notifications at the moment
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  dismiss: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 400,
    backgroundColor: BrandColors.white,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.lightGray,
  },
  title: {
    color: BrandColors.darkGray,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: BrandColors.darkGray,
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyText: {
    color: BrandColors.mediumGray,
    textAlign: 'center',
  },
});