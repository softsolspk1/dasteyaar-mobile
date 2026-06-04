import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { BrandColors } from './theme';

export const CustomLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: BrandColors.primary,
    onPrimary: BrandColors.white,
    primaryContainer: BrandColors.primaryLight,
    onPrimaryContainer: BrandColors.primaryDark,
    secondary: BrandColors.secondary,
    onSecondary: BrandColors.white,
    secondaryContainer: `${BrandColors.secondary}20`,
    onSecondaryContainer: BrandColors.secondary,
    surface: BrandColors.surface,
    onSurface: BrandColors.darkGray,
    surfaceVariant: BrandColors.offWhite,
    onSurfaceVariant: BrandColors.mediumGray,
    outline: BrandColors.lightGray,
    outlineVariant: BrandColors.lightGray,
    error: BrandColors.error,
    onError: BrandColors.white,
    errorContainer: `${BrandColors.error}20`,
    onErrorContainer: BrandColors.error,
  }
};

export const CustomDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: BrandColors.primary,
    onPrimary: BrandColors.white,
    primaryContainer: BrandColors.primaryLight,
    onPrimaryContainer: BrandColors.primaryDark,
    secondary: BrandColors.secondary,
    onSecondary: BrandColors.white,
    secondaryContainer: `${BrandColors.secondary}20`,
    onSecondaryContainer: BrandColors.secondary,
    surface: BrandColors.surface,
    onSurface: BrandColors.darkGray,
    surfaceVariant: BrandColors.offWhite,
    onSurfaceVariant: BrandColors.mediumGray,
    outline: BrandColors.lightGray,
    outlineVariant: BrandColors.lightGray,
    error: BrandColors.error,
    onError: BrandColors.white,
    errorContainer: `${BrandColors.error}20`,
    onErrorContainer: BrandColors.error,
  }
};