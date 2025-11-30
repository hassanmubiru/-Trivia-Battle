/**
 * MetaMask SDK Provider
 * Wraps the app with MetaMask SDK context
 * 
 * Note: The SDK may show warnings about batch sending - these are expected
 * when no wallet is connected and can be safely ignored.
 */

import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { MetaMaskProvider as SDKProvider } from '@metamask/sdk-react';

// Suppress known MetaMask SDK warnings that occur when wallet isn't connected
LogBox.ignoreLogs([
  'Sender: Failed to send batch',
  'Failed to send batch',
  'MM_SDK',
  'MetaMask:',
  '[object Object]',
]);

interface MetaMaskProviderProps {
  children: React.ReactNode;
}

export const MetaMaskProvider: React.FC<MetaMaskProviderProps> = ({ children }) => {
  useEffect(() => {
    // Suppress console errors for batch sender issues
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const message = args[0]?.toString?.() || '';
      if (message.includes('Sender: Failed to send batch') || 
          message.includes('Failed to send batch') ||
          message.includes('[object Object]')) {
        return; // Suppress these expected errors
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <SDKProvider
      debug={false}
      sdkOptions={{
        dappMetadata: {
          name: 'Trivia Battle',
          url: 'https://triviabattle.io',
        },
        logging: {
          developerMode: false,
          sdk: false,
        },
        // Disable automatic connection attempts
        checkInstallationImmediately: false,
        // Disable storage to prevent auto-reconnection
        storage: {
          enabled: false,
        },
      }}
    >
      {children}
    </SDKProvider>
  );
};

export default MetaMaskProvider;
