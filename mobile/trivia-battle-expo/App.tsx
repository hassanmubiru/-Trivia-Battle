/**
 * Trivia Battle - Main App Component
 */

import 'react-native-gesture-handler';
import React from 'react';
import { MetaMaskProvider } from './src/providers/MetaMaskProvider';
import AppNavigator from './src/navigation/AppNavigator';

const App: React.FC = () => {
  return (
    <MetaMaskProvider>
      <AppNavigator />
    </MetaMaskProvider>
  );
};

export default App;


