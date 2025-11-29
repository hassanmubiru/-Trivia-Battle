/**
 * useMetaMaskSDK Hook
 * Simplified hook using MetaMask SDK
 */

import { useState, useCallback, useEffect } from 'react';
import { useSDK } from '@metamask/sdk-react';

export interface WalletInfo {
  address: string;
  chainId: number;
  isConnected: boolean;
  isConnecting: boolean;
}

export const useMetaMaskSDK = () => {
  const sdkState = useSDK();
  const { account, chainId, provider, sdk, error: sdkError, connecting, connected } = sdkState;
  
  const [walletInfo, setWalletInfo] = useState<WalletInfo>({
    address: '',
    chainId: 0,
    isConnected: false,
    isConnecting: false,
  });
  const [error, setError] = useState<Error | null>(null);

  // Update wallet info when account or chainId changes
  useEffect(() => {
    setWalletInfo({
      address: account || '',
      chainId: chainId ? parseInt(chainId, 16) : 0,
      isConnected: connected || false,
      isConnecting: connecting || false,
    });
    
    if (sdkError) {
      setError(new Error(sdkError.message || 'Unknown SDK error'));
    } else {
      setError(null);
    }
  }, [account, chainId, connected, connecting, sdkError]);

  const connect = useCallback(async () => {
    try {
      setWalletInfo(prev => ({ ...prev, isConnecting: true }));
      const accounts = await sdk?.connect();
      
      if (accounts && accounts.length > 0) {
        setWalletInfo(prev => ({
          ...prev,
          address: accounts[0],
          isConnected: true,
          isConnecting: false,
        }));
        setError(null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect');
      setError(error);
      setWalletInfo(prev => ({ ...prev, isConnecting: false, isConnected: false }));
    }
  }, [sdk]);

  const disconnect = useCallback(async () => {
    try {
      await sdk?.terminate();
      setWalletInfo({
        address: '',
        chainId: 0,
        isConnected: false,
        isConnecting: false,
      });
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to disconnect');
      setError(error);
    }
  }, [sdk]);

  const signMessage = useCallback(async (message: string) => {
    if (!provider) {
      throw new Error('Ethereum provider not available');
    }

    try {
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, account],
      }) as string;
      return signature;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to sign message');
      setError(error);
      throw error;
    }
  }, [provider, account]);

  const sendTransaction = useCallback(async (to: string, value: string, data?: string) => {
    if (!provider) {
      throw new Error('Ethereum provider not available');
    }

    try {
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: account,
            to,
            value,
            data,
          },
        ],
      }) as string;
      return txHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send transaction');
      setError(error);
      throw error;
    }
  }, [provider, account]);

  return {
    ...walletInfo,
    error,
    connect,
    disconnect,
    signMessage,
    sendTransaction,
    provider,
    sdk,
  };
};

export default useMetaMaskSDK;
