/**
 * Trivia Battle - Main App Component
 */

import 'react-native-gesture-handler';
import React from 'react';
import { LogBox } from 'react-native';
import { MetaMaskProvider } from './src/providers/MetaMaskProvider';
import AppNavigator from './src/navigation/AppNavigator';

// Suppress known MetaMask SDK warnings
LogBox.ignoreLogs([
  'Sender: Failed to send batch',
  'Failed to send batch',
  'MM_SDK',
  'MetaMask:',
]);

const App: React.FC = () => {
  return (
    <MetaMaskProvider>
      <AppNavigator />
    </MetaMaskProvider>
  );
};

export default App;


