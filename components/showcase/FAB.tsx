import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { BrandColors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface FABProps {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  style?: ViewStyle;
  color?: string;
}

export default function FAB({
  icon = 'add',
  onPress,
  style,
  color = BrandColors.primary,
}: FABProps) {
  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: color }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={19.2} color={BrandColors.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 44.8, // 56 * 0.8
    height: 44.8, // 56 * 0.8
    borderRadius: 22.4, // 28 * 0.8
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
