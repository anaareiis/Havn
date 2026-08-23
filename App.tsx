import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { processDueAnchors } from './src/lib/db';
import { getAnchorNoticeDays, scheduleAnchorNotifications } from './src/lib/notifications';
import { hasPin } from './src/lib/pin';
import { syncNow, watchConnectivityAndSync } from './src/lib/sync';
import RootNavigator from './src/navigation/RootNavigator';
import LockScreen from './src/screens/LockScreen';
import { ThemeProvider, fontsToLoad } from './src/theme';

SplashScreen.preventAutoHideAsync();

async function syncAnchors() {
  await processDueAnchors();
  const noticeDays = await getAnchorNoticeDays();
  await scheduleAnchorNotifications(noticeDays);
}

export default function App() {
  const [fontsLoaded] = useFonts(fontsToLoad);
  const [locked, setLocked] = useState<boolean | null>(null);

  useEffect(() => {
    hasPin().then(setLocked);
  }, []);

  useEffect(() => {
    if (fontsLoaded && locked !== null) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, locked]);

  useEffect(() => {
    syncNow().catch((error) => {
      console.warn('Havn sync failed', error);
    });

    const unwatch = watchConnectivityAndSync();
    return unwatch;
  }, []);

  useEffect(() => {
    syncAnchors();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncAnchors();
      }
    });

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded || locked === null) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {locked ? <LockScreen onUnlock={() => setLocked(false)} /> : <RootNavigator />}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
