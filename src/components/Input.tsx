import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, onFocus, onBlur, ...textInputProps }: InputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? theme.colors.danger
    : isFocused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.rounded.semibold,
              fontSize: theme.fontSize.sm,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.textSecondary}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor,
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            color: theme.colors.textPrimary,
            fontFamily: theme.fontFamily.rounded.regular,
            fontSize: theme.fontSize.md,
          },
          style,
        ]}
        {...textInputProps}
      />
      {error ? (
        <Text
          style={[
            styles.error,
            {
              color: theme.colors.danger,
              fontFamily: theme.fontFamily.rounded.regular,
              fontSize: theme.fontSize.xs,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {},
  input: {
    borderWidth: 1,
  },
  error: {},
});
