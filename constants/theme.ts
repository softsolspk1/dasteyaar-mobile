/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#D32F2F'; // CCL Red
const tintColorDark = '#D32F2F'; // CCL Red (same as light)

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#11181C', // Same as light
    background: '#fff', // Same as light
    tint: tintColorLight, // Same as light
    icon: '#687076', // Same as light
    tabIconDefault: '#687076', // Same as light
    tabIconSelected: tintColorLight, // Same as light
  },
};

// CCL Dast E Yaar Brand Colors (Matching Showcase Exactly)
export const BrandColors = {
  // Primary CCL Colors
  primary: '#D32F2F', // --ccl-red
  primaryDark: '#B71C1C', // --ccl-red-dark
  primaryLight: '#FFCDD2', // --ccl-red-light

  // Neutral Colors
  white: '#FFFFFF', // --ccl-white
  offWhite: '#FAFAFA', // --ccl-off-white
  darkGray: '#212121', // --ccl-dark-gray
  mediumGray: '#757575', // --ccl-medium-gray
  lightGray: '#E0E0E0', // --ccl-light-gray

  // Status Colors
  success: '#4CAF50', // --ccl-success
  warning: '#FF9800', // --ccl-warning
  info: '#2196F3', // --ccl-info

  // App Defaults
  background: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  border: '#E0E0E0',
  error: '#D32F2F',

  // Legacy
  secondary: '#FF6B35', // Orange
  accent: '#FFC107', // Yellow/Gold
};

// Dark Mode Brand Colors (Showcase-based)
export const DarkBrandColors = {
  // Primary CCL Colors
  primary: '#D32F2F',
  primaryDark: '#B71C1C',
  primaryLight: '#4D1F1F',

  // Neutral Colors
  white: '#FFFFFF',
  offWhite: '#1A1A1A',
  darkGray: '#E0E0E0',
  mediumGray: '#B0B0B0',
  lightGray: '#333333',

  // Status Colors
  success: '#66BB6A',
  warning: '#FFA726',
  info: '#42A5F5',

  // App Defaults
  background: '#000000',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#333333',
  error: '#EF5350',

  // Legacy
  secondary: '#FF6B35',
  accent: '#FFC107',
};

// Showcase Design System Values
export const ShowcaseDesign = {
  // Mobile Container (from showcase)
  mobileContainer: {
    width: 375,
    height: 812,
    borderRadius: 30,
  },

  // Heights (from showcase)
  statusBar: 44,
  appHeader: 70,
  bottomNav: 80,

  // Border Radius
  borderRadius: {
    small: 8,
    medium: 12,
    large: 15,
    xlarge: 20,
    round: 50,
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Font Sizes
  fontSize: {
    tiny: 10,
    small: 12,
    body: 14,
    medium: 16,
    large: 18,
    xlarge: 20,
    xxlarge: 24,
    huge: 28,
  },
};

// Helper to get theme colors based on color scheme
export const getThemeColors = (isDark: boolean) => BrandColors; // Always use light mode colors

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
