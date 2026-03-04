import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native';
import { Colors, Radius, Shadow, Typography, Spacing } from '../theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  rightElement?: React.ReactNode;
}

// ✅ Fix: explicit lookup objects instead of dynamic `keyof typeof styles`
// Dynamic string keys break TypeScript's ability to verify the style type.
// Explicit maps are safer and clearer.

const variantStyles: Record<Variant, ViewStyle> = {
  primary: {
    backgroundColor: Colors.primary,
    ...Shadow.md,
  },
  secondary: {
    backgroundColor: Colors.accentLight,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error,
  },
};

const sizeStyles: Record<Size, ViewStyle> = {
  sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  md: { paddingHorizontal: Spacing.lg, paddingVertical: 13 },
  lg: { paddingHorizontal: Spacing.xl, paddingVertical: 16, width: '100%' },
};

const labelColorMap: Record<Variant, string> = {
  primary: Colors.white,
  secondary: Colors.accent,
  outline: Colors.textPrimary,
  ghost: Colors.accent,
  danger: Colors.white,
};

const labelSizeMap: Record<Size, number> = {
  sm: Typography.sm,
  md: Typography.base,
  lg: Typography.base,
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  rightElement,
}: Props) {
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === 'primary' || variant === 'danger' ? Colors.white : Colors.accent;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.inner}>
          <Text
            style={[
              styles.label,
              { color: labelColorMap[variant], fontSize: labelSizeMap[size] },
              size === 'lg' && styles.labelLg,
            ]}
          >
            {label}
          </Text>
          {rightElement}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  labelLg: {
    fontWeight: '700',
  },
});