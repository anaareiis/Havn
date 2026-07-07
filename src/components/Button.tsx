import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { useTheme } from '../theme';

export type ButtonVariant = 'primary' | 'accent' | 'outline';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  ...pressableProps
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const fill =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'accent'
        ? theme.colors.accent
        : 'transparent';
  const pressedFill =
    variant === 'primary'
      ? theme.colors.primaryPressed
      : variant === 'accent'
        ? theme.colors.accentPressed
        : theme.colors.surfaceAlt;
  const textColor =
    variant === 'primary'
      ? theme.colors.textOnPrimary
      : variant === 'accent'
        ? theme.colors.textOnAccent
        : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed && !isDisabled ? pressedFill : fill,
          borderColor: theme.colors.primary,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderRadius: theme.radius.md,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.xl,
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: textColor,
              fontFamily: theme.fontFamily.rounded.bold,
              fontSize: theme.fontSize.md,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
});
