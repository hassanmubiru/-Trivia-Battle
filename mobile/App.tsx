/**
 * Trivia Battle - Main App Component
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { PhoneAuthScreen } from './src/screens/Auth/PhoneAuthScreen';
import { HomeScreen } from './src/screens/Home/HomeScreen';
import { MatchmakingScreen } from './src/screens/Matchmaking/MatchmakingScreen';
import { GameSessionScreen } from './src/screens/GameSession/GameSessionScreen';
import { LeaderboardScreen } from './src/screens/Leaderboard/LeaderboardScreen';
import { ProfileScreen } from './src/screens/Profile/ProfileScreen';
import { miniPayService } from './src/services/miniPayService';

const Stack = createStackNavigator();

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize MiniPay SDK
    const init = async () => {
      try {
        await miniPayService.initialize({
          apiKey: process.env.MINIPAY_API_KEY || '',
          network: (process.env.CELO_NETWORK as 'alfajores' | 'celo') || 'alfajores',
        });
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize MiniPay:', error);
        setIsInitialized(true); // Continue anyway
      }
    };

    init();
  }, []);

  if (!isInitialized) {
    return null; // Or a loading screen
  }

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="PhoneAuth"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#35D07F',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="PhoneAuth"
            component={PhoneAuthScreen}
            options={{ title: 'Trivia Battle', headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Trivia Battle' }}
          />
          <Stack.Screen
            name="Matchmaking"
            component={MatchmakingScreen}
            options={{ title: 'Find Match' }}
          />
          <Stack.Screen
            name="GameSession"
            component={GameSessionScreen}
            options={{ title: 'Game', headerLeft: null, gestureEnabled: false }}
          />
          <Stack.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{ title: 'Leaderboard' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Profile' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
};

export default App;

