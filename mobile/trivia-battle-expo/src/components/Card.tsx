/**
 * Modern Card Component
 * Reusable container with shadow and consistent spacing
 */

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  padding = Spacing.lg,
}) => {
  const getCardStyle = (): ViewStyle => {
    const variants = {
      elevated: {
        backgroundColor: Colors.surface,
        ...Shadows.md,
      },
      outlined: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.outline,
      },
      filled: {
        backgroundColor: Colors.surfaceVariant,
      },
    };

    return {
      borderRadius: BorderRadius.md,
      padding,
      ...variants[variant],
    };
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
  },
});
