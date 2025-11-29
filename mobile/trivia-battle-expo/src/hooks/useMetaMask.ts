import { useEffect, useState } from 'react';
import { getMetaMaskService } from '../services/metamaskService';

export interface UseMetaMaskReturn {
  address: string | null;
  chainId: number;
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (to: string, value: string, data?: string) => Promise<string>;
  getBalance: () => Promise<string>;
  getTokenBalance: (tokenAddress: string, decimals?: number) => Promise<string>;
  switchNetwork: () => Promise<void>;
  on?: (event: string, listener: Function) => void;
  off?: (event: string, listener: Function) => void;
}

/**
 * React hook for MetaMask Mobile integration
 * Handles connection, disconnection, and wallet operations
 */
export function useMetaMask(): UseMetaMaskReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number>(11142220);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const metamask = getMetaMaskService();

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      try {
        await metamask.initialize();
        
        // Check if already connected
        if (metamask.isConnected()) {
          setAddress(metamask.getAddress());
          setChainId(metamask.getChainId());
          setIsConnected(true);
        }

        // Setup event listeners
        metamask.on('connected', (info: any) => {
          setAddress(info.address);
          setChainId(info.chainId);
          setIsConnected(true);
          setError(null);
        });

        metamask.on('disconnected', () => {
          setAddress(null);
          setIsConnected(false);
        });

        metamask.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          } else {
            setAddress(null);
            setIsConnected(false);
          }
        });

        metamask.on('chainChanged', (newChainId: number) => {
          setChainId(newChainId);
        });

        metamask.on('error', (err: Error) => {
          setError(err);
        });

        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize MetaMask:', err);
        setError(err instanceof Error ? err : new Error('Initialization failed'));
        setIsInitialized(true);
      }
    };

    init();

    return () => {
      // Cleanup listeners
      metamask.off('connected', () => {});
      metamask.off('disconnected', () => {});
      metamask.off('accountsChanged', () => {});
      metamask.off('chainChanged', () => {});
      metamask.off('error', () => {});
    };
  }, []);

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const walletInfo = await metamask.connect();
      setAddress(walletInfo.address);
      setChainId(walletInfo.chainId);
      setIsConnected(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Connection failed');
      setError(error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await metamask.disconnect();
      setAddress(null);
      setIsConnected(false);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Disconnection failed');
      setError(error);
      throw error;
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    try {
      return await metamask.signMessage(message);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Message signing failed');
      setError(error);
      throw error;
    }
  };

  const sendTransaction = async (
    to: string,
    value: string,
    data?: string
  ): Promise<string> => {
    try {
      return await metamask.sendTransaction(to, value, data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Transaction failed');
      setError(error);
      throw error;
    }
  };

  const getBalance = async (): Promise<string> => {
    try {
      return await metamask.getBalance();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Balance fetch failed');
      setError(error);
      throw error;
    }
  };

  const getTokenBalance = async (
    tokenAddress: string,
    decimals: number = 18
  ): Promise<string> => {
    try {
      return await metamask.getTokenBalance(tokenAddress, decimals);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Token balance fetch failed');
      setError(error);
      throw error;
    }
  };

  const switchNetwork = async (): Promise<void> => {
    try {
      await metamask.switchNetwork();
      setChainId(11142220);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Network switch failed');
      setError(error);
      throw error;
    }
  };

  return {
    address,
    chainId,
    isConnected,
    isConnecting,
    isInitialized,
    error,
    connect,
    disconnect,
    signMessage,
    sendTransaction,
    getBalance,
    getTokenBalance,
    switchNetwork,
    on: (event: string, listener: Function) => metamask.on(event, listener),
    off: (event: string, listener: Function) => metamask.off(event, listener),
  };
}
