// Import polyfills FIRST before anything else
import 'node-libs-react-native/globals';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import '@ethersproject/shims';

// Crypto polyfill for MetaMask SDK
try {
  require('crypto');
} catch (e) {
  // Crypto polyfill already loaded
}

// Suppress MetaMask SDK batch sender errors early
// These occur when the SDK tries to communicate before wallet is connected
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString?.() || '';
  if (message.includes('Sender: Failed to send batch') || 
      message.includes('Failed to send batch') ||
      message.includes('[object Object]')) {
    return; // Suppress expected MetaMask SDK errors
  }
  originalConsoleError.apply(console, args);
};

import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'Sender: Failed to send batch',
  'Failed to send batch',
  'MM_SDK',
]);

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
