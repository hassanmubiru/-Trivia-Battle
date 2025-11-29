/**
 * Wallet Connection Hook
 * Manages wallet state and provides easy integration with React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMetaMaskService, WalletConnection, ConnectionError } from '../services/metaMaskService';

export interface UseWalletState {
  wallet: WalletConnection | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: ConnectionError | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

export const useWallet = (): UseWalletState => {
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<ConnectionError | null>(null);
  const metaMaskService = useRef(getMetaMaskService());

  const handleConnectionSuccess = useCallback((connection: WalletConnection) => {
    setWallet(connection);
    setError(null);
    setIsConnecting(false);
  }, []);

  const handleConnectionError = useCallback((err: ConnectionError) => {
    setError(err);
    setIsConnecting(false);
  }, []);

  const handleDisconnect = useCallback(() => {
    setWallet(null);
    setError(null);
  }, []);

  // Setup event listeners
  useEffect(() => {
    const service = metaMaskService.current;

    service.on('connected', handleConnectionSuccess);
    service.on('error', handleConnectionError);
    service.on('disconnected', handleDisconnect);

    return () => {
      service.off('connected', handleConnectionSuccess);
      service.off('error', handleConnectionError);
      service.off('disconnected', handleDisconnect);
    };
  }, [handleConnectionSuccess, handleConnectionError, handleDisconnect]);

  // Restore connection on mount
  useEffect(() => {
    const restoreConnection = async () => {
      try {
        const restored = await metaMaskService.current.restoreConnection();
        if (restored) {
          setWallet(restored);
        }
      } catch (err) {
        console.error('Failed to restore connection:', err);
      }
    };

    restoreConnection();
  }, []);

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      const connection = await metaMaskService.current.connect();
      setWallet(connection);
      setError(null);
    } catch (err: any) {
      setError({
        code: err.code || 'UNKNOWN_ERROR',
        message: err.message,
        timestamp: Date.now(),
        retryCount: 0,
      });
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await metaMaskService.current.disconnect();
      setWallet(null);
      setError(null);
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      if (wallet) {
        const balances = await metaMaskService.current.getBalances();
        setWallet({
          ...wallet,
          balance: balances,
        });
      }
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  }, [wallet]);

  const retryConnection = useCallback(async () => {
    await connect();
  }, [connect]);

  return {
    wallet,
    isConnecting,
    isConnected: metaMaskService.current.isConnected(),
    error,
    connect,
    disconnect,
    refreshBalance,
    retryConnection,
  };
};
