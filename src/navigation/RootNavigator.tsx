import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import AnchorsScreen from '../screens/AnchorsScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';

export type RootTabParamList = {
  Home: undefined;
  Transacoes: undefined;
  Ancoras: undefined;
  Configuracoes: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen
          name="Transacoes"
          component={TransactionsScreen}
          options={{ title: 'Transações' }}
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
