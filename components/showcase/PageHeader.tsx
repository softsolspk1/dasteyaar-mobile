import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { BrandColors, ShowcaseDesign } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface PageHeaderProps {
  title: string;
  backButton?: boolean;
  onBack?: () => void;
}

export default function PageHeader({ title, backButton = true, onBack }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <></>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: BrandColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.lightGray,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: BrandColors.darkGray,
  },
});