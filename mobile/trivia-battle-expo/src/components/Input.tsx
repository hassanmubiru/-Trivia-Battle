/**
 * Modern Input Component
 * Text input with consistent styling and validation support
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Text,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

interface InputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  label?: string;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  label,
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  style,
}) => {
  const [focused, setFocused] = useState(false);

  const getContainerStyle = (): ViewStyle => ({
    marginVertical: Spacing.sm,
  });

  const getInputStyle = (): TextStyle => ({
    backgroundColor: disabled ? Colors.surfaceVariant : Colors.surface,
    borderWidth: 1,
    borderColor: error
      ? Colors.error
      : focused
      ? Colors.primary
      : Colors.outline,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.onSurface,
    height: multiline ? undefined : 48,
  });

  return (
    <View style={[getContainerStyle(), style]}>
      {label && (
        <Text
          style={{
            fontSize: Typography.fontSize.sm,
            fontWeight: Typography.fontWeight.semibold as any,
            color: Colors.onSurface,
            marginBottom: Spacing.sm,
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={Colors.onSurfaceVariant}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={!disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={getInputStyle()}
      />
      {error && (
        <Text
          style={{
            fontSize: Typography.fontSize.xs,
            color: Colors.error,
            marginTop: Spacing.sm,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  input: {},
});
