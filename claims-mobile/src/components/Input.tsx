import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  rightAction?: { label: string; onPress: () => void };
  hint?: string;
}

export default function Input({ label, error, rightAction, hint, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        <TextInput
          style={[styles.input, props.multiline && styles.inputMultiline]}
          placeholderTextColor={Colors.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.rightAction}>
            <Text style={styles.rightActionText}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputFocused: {
    borderColor: Colors.accent,
    backgroundColor: Colors.white,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: '400',
  },
  inputMultiline: {
    paddingTop: 14,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  rightAction: {
    paddingHorizontal: Spacing.md,
  },
  rightActionText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: Typography.sm,
  },
  hint: {
    color: Colors.textTertiary,
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
  },
  error: {
    color: Colors.error,
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
});