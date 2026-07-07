import { StyleSheet, View, type ViewProps } from 'react-native';

import { useTheme } from '../theme';

export type CardProps = ViewProps;

export function Card({ style, children, ...viewProps }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.lg,
        },
        style,
      ]}
      {...viewProps}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
