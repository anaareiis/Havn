import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Input } from '../components';
import { verifyPin } from '../lib/pin';
import { useTheme } from '../theme';

export interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const theme = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | undefined>();

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
      </Card>
    </View>
  );
}
