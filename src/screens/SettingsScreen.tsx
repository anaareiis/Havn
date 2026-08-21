import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Text, View } from 'react-native';

import { Button, Card, Input } from '../components';
import {
  DEFAULT_ANCHOR_NOTICE_DAYS,
  getAnchorNoticeDays,
  scheduleAnchorNotifications,
  setAnchorNoticeDays,
} from '../lib/notifications';
import { useTheme } from '../theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const [noticeDaysText, setNoticeDaysText] = useState(String(DEFAULT_ANCHOR_NOTICE_DAYS));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const loadNoticeDays = useCallback(async () => {
    const days = await getAnchorNoticeDays();
    setNoticeDaysText(String(days));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNoticeDays();
    }, [loadNoticeDays]),
  );

  async function handleSave() {
    const parsed = Number(noticeDaysText);
    if (!noticeDaysText.trim() || !Number.isInteger(parsed) || parsed < 0) {
      setError('Informe um número inteiro maior ou igual a zero');
      setSaved(false);
      return;
    }

    setError(undefined);
    await setAnchorNoticeDays(parsed);
    await scheduleAnchorNotifications(parsed);
    setSaved(true);
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
        gap: theme.spacing.lg,
      }}
    >
      <Text
        style={{
          color: theme.colors.textPrimary,
          fontFamily: theme.fontFamily.rounded.extrabold,
          fontSize: theme.fontSize.xxl,
        }}
      >
        Configurações
      </Text>

      <Card style={{ gap: theme.spacing.md }}>
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.fontFamily.rounded.semibold,
            fontSize: theme.fontSize.md,
          }}
        >
          Notificações de Âncoras
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.rounded.regular,
            fontSize: theme.fontSize.sm,
          }}
        >
          Quantos dias antes do vencimento você quer ser avisado.
        </Text>

        <Input
          label="Dias de antecedência"
          placeholder="1"
          keyboardType="numeric"
          value={noticeDaysText}
          onChangeText={(value) => {
            setNoticeDaysText(value);
            setSaved(false);
          }}
          error={error}
        />

        <Button label="Salvar" variant="primary" onPress={handleSave} />

        {saved ? (
          <Text
            style={{
              color: theme.colors.success,
              fontFamily: theme.fontFamily.rounded.regular,
              fontSize: theme.fontSize.sm,
            }}
          >
            Preferência salva.
          </Text>
        ) : null}
      </Card>
    </View>
  );
}
