import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Input } from '../components';
import {
  authenticateWithBiometrics,
  isBiometricAvailable,
  isBiometricEnabled,
} from '../lib/biometrics';
import { verifyPin } from '../lib/pin';
import { useTheme } from '../theme';

export interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const theme = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  const tryBiometrics = useCallback(async () => {
    const [available, enabled] = await Promise.all([isBiometricAvailable(), isBiometricEnabled()]);
    setBiometricAvailable(available && enabled);

    if (available && enabled) {
      const success = await authenticateWithBiometrics();
      if (success) onUnlock();
    }
  }, [onUnlock]);

  useEffect(() => {
    tryBiometrics();
  }, [tryBiometrics]);

  async function handleUnlock() {
    const isValid = await verifyPin(pin);
    if (!isValid) {
      setError('PIN incorreto');
      setPin('');
      return;
    }

    onUnlock();
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        padding: theme.spacing.lg,
      }}
    >
      <Card style={{ gap: theme.spacing.md }}>
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontFamily: theme.fontFamily.rounded.extrabold,
            fontSize: theme.fontSize.xl,
            textAlign: 'center',
          }}
        >
          Havn
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.rounded.regular,
            fontSize: theme.fontSize.sm,
            textAlign: 'center',
          }}
        >
          Digite seu PIN para continuar
        </Text>

        <Input
          placeholder="••••"
          keyboardType="number-pad"
          secureTextEntry
          maxLength={4}
          value={pin}
          onChangeText={(value) => {
            setPin(value);
            setError(undefined);
          }}
          error={error}
          autoFocus
        />

        <Button
          label="Desbloquear"
          variant="primary"
          disabled={pin.length !== 4}
          onPress={handleUnlock}
        />

        {biometricAvailable ? (
          <Button label="Usar biometria" variant="outline" onPress={tryBiometrics} />
        ) : null}
      </Card>
    </View>
  );
}
