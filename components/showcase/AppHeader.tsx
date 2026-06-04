import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BrandColors, ShowcaseDesign } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  showMenu?: boolean;
  showSearch?: boolean;
  showAdd?: boolean;
  showNotification?: boolean;
  notificationCount?: number;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onAddPress?: () => void;
  onNotificationPress?: () => void;
}

export default function AppHeader({
  title,
  showBack = false,
  showMenu = false,
  showSearch = false,
  showAdd = false,
  showNotification = false,
  notificationCount = 0,
  onBackPress,
  onMenuPress,
  onSearchPress,
  onAddPress,
  onNotificationPress,
}: AppHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {/* Left Section */}
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={BrandColors.primary} />
          </TouchableOpacity>
        )}
        {showMenu && (
          <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
            <Ionicons name="menu" size={20} color={BrandColors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {showSearch && (
          <TouchableOpacity style={styles.iconButton} onPress={onSearchPress}>
            <Ionicons name="search" size={20} color={BrandColors.primary} />
          </TouchableOpacity>
        )}
        {showAdd && (
          <TouchableOpacity style={[styles.iconButton, styles.addButton]} onPress={onAddPress}>
            <Ionicons name="add" size={20} color={BrandColors.white} />
          </TouchableOpacity>
        )}
        {showNotification && (
          <TouchableOpacity style={styles.iconButton} onPress={onNotificationPress}>
            <Ionicons name="notifications" size={20} color={BrandColors.primary} />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    backgroundColor: BrandColors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.lightGray,
    marginTop: -1, // To remove any gap from SafeAreaView
  },
  leftSection: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  rightSection: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: BrandColors.darkGray,
    fontFamily: 'System',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BrandColors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: BrandColors.primary,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BrandColors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: BrandColors.white,
    fontSize: 10,
    fontWeight: '600',
  },
});
