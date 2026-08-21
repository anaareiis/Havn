import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import AccountsScreen from '../screens/AccountsScreen';
import AnchorsScreen from '../screens/AnchorsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';

export type RootTabParamList = {
  Home: undefined;
  Contas: undefined;
  Transacoes: undefined;
  Categorias: undefined;
  Ancoras: undefined;
  Configuracoes: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
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
