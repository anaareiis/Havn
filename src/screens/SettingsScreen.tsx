import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Input } from '../components';
import {
  DEFAULT_ANCHOR_NOTICE_DAYS,
  getAnchorNoticeDays,
  scheduleAnchorNotifications,
  setAnchorNoticeDays,
} from '../lib/notifications';
import { clearPin, hasPin, setPin, verifyPin } from '../lib/pin';
import { useTheme } from '../theme';

type PinModalMode = 'create' | 'change' | 'remove';

export default function SettingsScreen() {
  const theme = useTheme();
  const [noticeDaysText, setNoticeDaysText] = useState(String(DEFAULT_ANCHOR_NOTICE_DAYS));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const [pinExists, setPinExists] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<PinModalMode | null>(null);
  const [currentPinText, setCurrentPinText] = useState('');
  const [newPinText, setNewPinText] = useState('');
  const [confirmPinText, setConfirmPinText] = useState('');
  const [pinError, setPinError] = useState<string | undefined>();
  const [pinSaved, setPinSaved] = useState(false);

  const loadNoticeDays = useCallback(async () => {
    const days = await getAnchorNoticeDays();
    setNoticeDaysText(String(days));
  }, []);

  const loadPinStatus = useCallback(async () => {
    setPinExists(await hasPin());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNoticeDays();
      loadPinStatus();
    }, [loadNoticeDays, loadPinStatus]),
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

  function openPinModal(mode: PinModalMode) {
    setPinModalMode(mode);
    setCurrentPinText('');
    setNewPinText('');
    setConfirmPinText('');
    setPinError(undefined);
    setPinSaved(false);
  }

  async function handlePinSubmit() {
    if (pinModalMode === 'remove') {
      if (!(await verifyPin(currentPinText))) {
        setPinError('PIN atual incorreto');
        return;
      }
      await clearPin();
      setPinExists(false);
      setPinModalMode(null);
      return;
    }

    if (pinModalMode === 'change' && !(await verifyPin(currentPinText))) {
      setPinError('PIN atual incorreto');
      return;
    }

    if (!/^\d{4}$/.test(newPinText)) {
      setPinError('O PIN precisa ter 4 dígitos');
      return;
    }

    if (newPinText !== confirmPinText) {
      setPinError('Os PINs não coincidem');
      return;
    }

    await setPin(newPinText);
    setPinExists(true);
    setPinError(undefined);
    setPinSaved(true);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}
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

      <Card style={{ gap: theme.spacing.md }}>
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.fontFamily.rounded.semibold,
            fontSize: theme.fontSize.md,
          }}
        >
          Porto (segurança)
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.rounded.regular,
            fontSize: theme.fontSize.sm,
          }}
        >
          {pinExists
            ? 'Seu app está protegido por PIN.'
            : 'Nenhum PIN configurado — qualquer pessoa com o app aberto acessa seus dados.'}
        </Text>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {pinExists ? (
            <>
              <Button
                label="Alterar PIN"
                variant="outline"
                onPress={() => openPinModal('change')}
              />
              <Button
                label="Remover PIN"
                variant="outline"
                onPress={() => openPinModal('remove')}
              />
            </>
          ) : (
            <Button label="Criar PIN" variant="primary" onPress={() => openPinModal('create')} />
          )}
        </View>
      </Card>

      <Modal
        visible={pinModalMode !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPinModalMode(null)}
      >
        <View style={styles.modalOverlay}>
          <Card style={{ gap: theme.spacing.md }}>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontFamily: theme.fontFamily.rounded.bold,
                fontSize: theme.fontSize.lg,
              }}
            >
              {pinModalMode === 'create' && 'Criar PIN'}
              {pinModalMode === 'change' && 'Alterar PIN'}
              {pinModalMode === 'remove' && 'Remover PIN'}
            </Text>

            {pinModalMode !== 'create' ? (
              <Input
                label="PIN atual"
                placeholder="••••"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                value={currentPinText}
                onChangeText={setCurrentPinText}
              />
            ) : null}

            {pinModalMode !== 'remove' ? (
              <>
                <Input
                  label="Novo PIN"
                  placeholder="••••"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  value={newPinText}
                  onChangeText={setNewPinText}
                />
                <Input
                  label="Confirmar novo PIN"
                  placeholder="••••"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={4}
                  value={confirmPinText}
                  onChangeText={setConfirmPinText}
                />
              </>
            ) : null}

            {pinError ? (
              <Text style={{ color: theme.colors.danger, fontSize: theme.fontSize.xs }}>
                {pinError}
              </Text>
            ) : null}

            {pinSaved ? (
              <Text style={{ color: theme.colors.success, fontSize: theme.fontSize.xs }}>
                PIN salvo.
              </Text>
            ) : null}

            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button label="Cancelar" variant="outline" onPress={() => setPinModalMode(null)} />
              <Button
                label={pinModalMode === 'remove' ? 'Remover' : 'Salvar'}
                variant="primary"
                onPress={handlePinSubmit}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});
