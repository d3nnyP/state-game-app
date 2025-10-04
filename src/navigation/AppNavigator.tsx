import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GameManagerProvider } from '../contexts/GameManagerContext';
import { 
  MainMenuScreen, 
  CreateGameScreen, 
  ActiveGameScreen, 
  GameHistoryScreen 
} from '../screens';

export type RootStackParamList = {
  MainMenu: undefined;
  CreateGame: undefined;
  ActiveGame: undefined;
  GameHistory: undefined;
  GameDetails: { gameId: string };
  Statistics: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigator() {
  console.log('AppNavigator rendering...');
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainMenu"
        screenOptions={{
          headerShown: false, // We're handling headers in our screens
          gestureEnabled: true,
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen 
          name="MainMenu" 
          component={MainMenuScreen}
          options={{ title: '50 State License Plate Game' }}
        />
        <Stack.Screen 
          name="CreateGame" 
          component={CreateGameScreen}
          options={{ title: 'Create New Game' }}
        />
        <Stack.Screen 
          name="ActiveGame" 
          component={ActiveGameScreen}
          options={{ title: 'Active Game' }}
        />
        <Stack.Screen 
          name="GameHistory" 
          component={GameHistoryScreen}
          options={{ title: 'Game History' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function App() {
  return <AppNavigator />;
}
