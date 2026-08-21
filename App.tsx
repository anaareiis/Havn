import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AppState } from 'react-native';

import { processDueAnchors } from './src/lib/db';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider, fontsToLoad } from './src/theme';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts(fontsToLoad);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    processDueAnchors();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        processDueAnchors();
      }
    });

    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
