import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { useTheme } from '../theme';

export type BadgeVariant = 'neutral' | 'success' | 'danger' | 'accent';

export interface BadgeProps extends ViewProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'neutral', style, ...viewProps }: BadgeProps) {
  const theme = useTheme();

  const backgroundColor: Record<BadgeVariant, string> = {
    neutral: theme.colors.surfaceAlt,
    success: theme.colors.success,
    danger: theme.colors.danger,
    accent: theme.colors.accent,
  };

  const textColor: Record<BadgeVariant, string> = {
    neutral: theme.colors.textPrimary,
    success: theme.colors.textOnPrimary,
    danger: theme.colors.textOnPrimary,
    accent: theme.colors.textOnAccent,
  };

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: backgroundColor[variant],
          borderRadius: theme.radius.full,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.md,
        },
        style,
      ]}
      {...viewProps}
    >
      <Text
        style={{
          color: textColor[variant],
          fontFamily: theme.fontFamily.rounded.bold,
          fontSize: theme.fontSize.xs,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
  },
});
