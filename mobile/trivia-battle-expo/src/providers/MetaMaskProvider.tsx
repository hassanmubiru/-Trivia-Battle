/**
 * MetaMask SDK Provider
 * Wraps the app with MetaMask SDK context
 */

import React from 'react';
import { MetaMaskProvider as SDKProvider } from '@metamask/sdk-react';

interface MetaMaskProviderProps {
  children: React.ReactNode;
}

export const MetaMaskProvider: React.FC<MetaMaskProviderProps> = ({ children }) => {
  return (
    <SDKProvider
      debug={true}
      sdkOptions={{
        dappMetadata: {
          name: 'Trivia Battle',
          url: 'https://triviabattle.io',
        },
        infuraAPIKey: process.env.EXPO_PUBLIC_INFURA_API_KEY || '',
        logging: {
          developerMode: true,
        },
      }}
    >
      {children}
    </SDKProvider>
  );
};

export default MetaMaskProvider;
