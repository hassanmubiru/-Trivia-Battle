import { useState, useEffect, useCallback, useRef } from 'react';
import { getWalletConnectService } from '../services/walletConnectService';

export interface UseWalletConnectState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (to: string, value: string) => Promise<string>;
  getBalance: () => Promise<string>;
  getTokenBalance: (tokenAddress: string, decimals?: number) => Promise<string>;
  on?: (event: string, listener: Function) => void;
}

export function useWalletConnect(projectId: string): UseWalletConnectState {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const serviceRef = useRef(getWalletConnectService(projectId));

  const service = serviceRef.current;

  // Initialize on mount
  useEffect(() => {
    const initWalletConnect = async () => {
      try {
        await service.initialize();
        
        // Check if already connected
        if (service.isConnected()) {
          setAddress(service.getAddress());
        }
        
        setIsInitialized(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Initialization failed');
        setError(error);
        console.error('[useWalletConnect] Initialization error:', error);
      }
    };

    initWalletConnect();

    // Setup listeners
    const handleConnected = (data: any) => {
      setAddress(data.address);
      setError(null);
    };

    const handleDisconnected = () => {
      setAddress(null);
    };

    const handleError = (err: any) => {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    };

    service.on('connected', handleConnected);
    service.on('disconnected', handleDisconnected);
    service.on('error', handleError);

    return () => {
      service.off('connected', handleConnected);
      service.off('disconnected', handleDisconnected);
      service.off('error', handleError);
    };
  }, []);

  const connect = useCallback(async (walletType: 'minipay' | 'metamask' = 'minipay') => {
    try {
      setIsConnecting(true);
      setError(null);
      const walletInfo = await service.connect(walletType);
      setAddress(walletInfo.address);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Connection failed');
      setError(error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await service.disconnect();
      setAddress(null);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Disconnect failed');
      setError(error);
      throw error;
    }
  }, []);

  const signMessage = useCallback(async (message: string) => {
    try {
      setError(null);
      return await service.signMessage(message);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Signing failed');
      setError(error);
      throw error;
    }
  }, []);

  const sendTransaction = useCallback(async (to: string, value: string) => {
    try {
      setError(null);
      return await service.sendTransaction(to, value);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Transaction failed');
      setError(error);
      throw error;
    }
  }, []);

  const getBalance = useCallback(async () => {
    try {
      setError(null);
      return await service.getBalance();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Balance fetch failed');
      setError(error);
      throw error;
    }
  }, []);

  const getTokenBalance = useCallback(
    async (tokenAddress: string, decimals: number = 18) => {
      try {
        setError(null);
        return await service.getTokenBalance(tokenAddress, decimals);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Token balance failed');
        setError(error);
        throw error;
      }
    },
    []
  );

  return {
    address,
    isConnected: service.isConnected(),
    isConnecting,
    isInitialized,
    error,
    connect,
    disconnect,
    signMessage,
    sendTransaction,
    getBalance,
    getTokenBalance,
    on: (event: string, listener: Function) => service.on(event, listener),
  };
}
