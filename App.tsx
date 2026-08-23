import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { processDueAnchors } from './src/lib/db';
import { getAnchorNoticeDays, scheduleAnchorNotifications } from './src/lib/notifications';
import { syncNow, watchConnectivityAndSync } from './src/lib/sync';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, fontsToLoad } from './src/theme';

SplashScreen.preventAutoHideAsync();

async function syncAnchors() {
  await processDueAnchors();
  const noticeDays = await getAnchorNoticeDays();
  await scheduleAnchorNotifications(noticeDays);
}

export default function App() {
  const [fontsLoaded] = useFonts(fontsToLoad);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
