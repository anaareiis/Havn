import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  type Theme as NavigationTheme,
} from '@react-navigation/native';

import { SyncStatusBar } from '../components';
import AccountsScreen from '../screens/AccountsScreen';
import AnchorsScreen from '../screens/AnchorsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import { useTheme, type Theme } from '../theme';

export type RootTabParamList = {
  Home: undefined;
  Contas: undefined;
  Transacoes: undefined;
  Categorias: undefined;
  Ancoras: undefined;
  Configuracoes: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function buildNavigationTheme(theme: Theme): NavigationTheme {
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;

  return {
    ...base,
    dark: theme.scheme === 'dark',
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
    fonts: {
      regular: { fontFamily: theme.fontFamily.rounded.regular, fontWeight: '400' },
      medium: { fontFamily: theme.fontFamily.rounded.semibold, fontWeight: '600' },
      bold: { fontFamily: theme.fontFamily.rounded.bold, fontWeight: '700' },
      heavy: { fontFamily: theme.fontFamily.rounded.extrabold, fontWeight: '800' },
    },
  };
}

export default function RootNavigator() {
  const theme = useTheme();

  return (
    <NavigationContainer theme={buildNavigationTheme(theme)}>
      <SyncStatusBar />
      <Tab.Navigator screenOptions={{ headerTitleAlign: 'center', headerStatusBarHeight: 0 }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Contas" component={AccountsScreen} options={{ title: 'Contas' }} />
        <Tab.Screen
          name="Transacoes"
          component={TransactionsScreen}
          options={{ title: 'Transações' }}
        />
        <Tab.Screen
          name="Categorias"
          component={CategoriesScreen}
          options={{ title: 'Categorias' }}
        />
        <Tab.Screen name="Ancoras" component={AnchorsScreen} options={{ title: 'Âncoras' }} />
        <Tab.Screen
          name="Configuracoes"
          component={SettingsScreen}
          options={{ title: 'Configurações' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
