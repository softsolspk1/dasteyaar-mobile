import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { BrandColors, ShowcaseDesign } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'contained' | 'outlined' | 'text';
  color?: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  gradient?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'contained',
  color = BrandColors.primary,
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = true,
  gradient = false,
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: ShowcaseDesign.borderRadius.medium,
      paddingVertical: 15,
      paddingHorizontal: 24,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      width: fullWidth ? '100%' : 'auto',
    };

    if (variant === 'contained') {
      return {
        ...baseStyle,
        backgroundColor: gradient ? 'transparent' : color,
      };
    } else if (variant === 'outlined') {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: color,
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
      };
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 16,
      fontWeight: '600',
    };

    if (variant === 'contained') {
      return {
        ...baseStyle,
        color: BrandColors.white,
      };
    } else {
      return {
        ...baseStyle,
        color: color,
      };
    }
  };

  const buttonContent = (
    <>
      {loading && <ActivityIndicator color={variant === 'contained' ? BrandColors.white : color} />}
      {!loading && icon && (
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={variant === 'contained' ? BrandColors.white : color}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </>
  );

  if (gradient && variant === 'contained' && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[getButtonStyle(), style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[BrandColors.primary, BrandColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {buttonContent}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        getButtonStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {buttonContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
});
