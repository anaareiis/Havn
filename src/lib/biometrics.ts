import * as LocalAuthentication from 'expo-local-authentication';

import { getSetting, setSetting } from './db';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function isBiometricEnabled(): Promise<boolean> {
  return (await getSetting(BIOMETRIC_ENABLED_KEY)) === '1';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await setSetting(BIOMETRIC_ENABLED_KEY, enabled ? '1' : '0');
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquear Havn',
    cancelLabel: 'Usar PIN',
    disableDeviceFallback: true,
  });
  return result.success;
}
