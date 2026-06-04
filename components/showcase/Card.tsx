import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { BrandColors, ShowcaseDesign } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevation?: number;
}

export default function Card({ children, onPress, style, elevation = 2 }: CardProps) {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        styles.card,
        {
          shadowOpacity: elevation * 0.05,
          shadowRadius: elevation * 4,
          elevation: elevation,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {children}
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColors.white,
    borderRadius: ShowcaseDesign.borderRadius.medium,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});
