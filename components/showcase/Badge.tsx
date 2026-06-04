import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { BrandColors, ShowcaseDesign } from '../../constants/theme';

interface BadgeProps {
  text: string;
  variant?: 'active' | 'pending' | 'completed' | 'shipped' | 'delivered' | 'processing' | 'fulfilled' | 'cancelled';
  style?: ViewStyle;
}

export default function Badge({ text, variant = 'active', style }: BadgeProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'active':
      case 'delivered':
      case 'fulfilled':
        return BrandColors.success;
      case 'pending':
        return BrandColors.warning;
      case 'completed':
      case 'shipped':
        return BrandColors.info;
      case 'processing':
        return BrandColors.info;
      case 'cancelled':
        return BrandColors.error;
      default:
        return BrandColors.mediumGray;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
    >
      <Text style={styles.text}>{text.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: ShowcaseDesign.borderRadius.medium,
    alignSelf: 'flex-start',
  },
  text: {
    color: BrandColors.white,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
