import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSyncStatus } from '../lib/syncStatus';
import { useTheme } from '../theme';

const LABELS: Record<ReturnType<typeof useSyncStatus>, string> = {
  offline: 'Offline',
  syncing: 'Sincronizando…',
  synced: 'Sincronizado',
  error: 'Erro ao sincronizar',
};

export function SyncStatusBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const status = useSyncStatus();

  const textColor =
    status === 'synced'
      ? theme.colors.success
      : status === 'error'
        ? theme.colors.danger
        : status === 'syncing'
          ? theme.colors.primary
          : theme.colors.textSecondary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceAlt,
          paddingTop: insets.top,
          paddingBottom: theme.spacing.xs,
        },
      ]}
    >
      <Text
        style={{
          color: textColor,
          fontFamily: theme.fontFamily.rounded.semibold,
          fontSize: theme.fontSize.xs,
          textAlign: 'center',
        }}
      >
        {LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
