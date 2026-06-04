import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, TextInputProps } from 'react-native-paper';
import { BrandColors } from '../../constants/theme';

interface InputProps {
  label?: string;
  icon?: string;
  error?: string;
  containerStyle?: any;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  placeholder?: string;
  disabled?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
}

export default function Input({
  label,
  icon,
  error,
  containerStyle,
  value,
  onChangeText,
  secureTextEntry,
  placeholder,
  disabled,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        mode="outlined"
        label={label}
        value={value}
        onChangeText={onChangeText}
        error={!!error}
        disabled={disabled}
        placeholder={placeholder}
        secureTextEntry={isPassword && !showPassword}
        left={icon ? <TextInput.Icon icon={icon} /> : undefined}
        right={
          isPassword ? (
            <TextInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
            />
          ) : undefined
        }
        style={styles.input}
        {...props}
      />
      {error && (
        <TextInput.Error style={styles.errorText}>
          {error}
        </TextInput.Error>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: BrandColors.white,
  },
  errorText: {
    fontSize: 12,
    color: BrandColors.error,
    marginTop: 4,
  },
});
