/**
 * useMiniPay Hook
 * React hook for MiniPay wallet integration
 * 
 * Provides easy access to MiniPay functionality in React components
 */

import { useState, useEffect, useCallback } from 'react';
// @ts-ignore - Alert type issue in some RN versions
import { Alert } from 'react-native';
import { miniPayService, WalletState, TransactionResult } from '../services/miniPayService';

interface UseMiniPayReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  isMiniPay: boolean;
  address: string | null;
  network: 'mainnet' | 'sepolia' | null;
  
  // Balances
  balances: WalletState['balances'];
  isLoadingBalances: boolean;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  sendCUSD: (to: string, amount: string) => Promise<TransactionResult>;
  deposit: (amount: string, token?: 'CELO' | 'cUSD' | 'USDC' | 'USDT') => Promise<TransactionResult>;
  withdraw: (amount: string, token?: 'CELO' | 'cUSD' | 'USDC' | 'USDT') => Promise<TransactionResult>;
  openMiniPay: () => Promise<void>;
  
  // Utilities
  canSign: boolean;
  isMiniPayEnvironment: boolean;
  error: Error | null;
}

export function useMiniPay(): UseMiniPayReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<'mainnet' | 'sepolia' | null>(null);
  const [balances, setBalances] = useState<WalletState['balances']>({
    CELO: '0',
    cUSD: '0',
    USDC: '0',
    USDT: '0',
  });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Check if running in MiniPay environment
  const isMiniPayEnvironment = miniPayService.isMiniPayEnvironment();
  const canSign = miniPayService.canSign();

  // Restore connection on mount
  useEffect(() => {
    const restore = async () => {
      try {
        const state = await miniPayService.restoreConnection();
        if (state) {
          setIsConnected(true);
          setIsMiniPay(state.isMiniPay);
          setAddress(state.address);
          setNetwork(state.network);
          setBalances(state.balances);
        }
      } catch (err) {
        console.error('Failed to restore MiniPay connection:', err);
      }
    };
    restore();
  }, []);

  // Setup event listeners
  useEffect(() => {
    const handleConnected = (data: { address: string; isMiniPay: boolean }) => {
      setIsConnected(true);
      setAddress(data.address);
      setIsMiniPay(data.isMiniPay);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
      setAddress(null);
      setIsMiniPay(false);
      setBalances({ CELO: '0', cUSD: '0', USDC: '0', USDT: '0' });
    };

    const handleAccountChanged = (data: { address: string }) => {
      setAddress(data.address);
      refreshBalances();
    };

    miniPayService.on('connected', handleConnected);
    miniPayService.on('disconnected', handleDisconnected);
    miniPayService.on('accountChanged', handleAccountChanged);

    return () => {
      miniPayService.off('connected', handleConnected);
      miniPayService.off('disconnected', handleDisconnected);
      miniPayService.off('accountChanged', handleAccountChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const state = await miniPayService.connect();
      setIsConnected(true);
      setIsMiniPay(state.isMiniPay);
      setAddress(state.address);
      setNetwork(state.network);
      setBalances(state.balances);
    } catch (err: any) {
      setError(err);
      
      // Show user-friendly error
      if (err.message.includes('No Web3 wallet')) {
        Alert.alert(
          'Wallet Required',
          'Please open this app in MiniPay or install a Web3 wallet to continue.',
          [
            { text: 'Open MiniPay', onPress: () => miniPayService.openMiniPay() },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Connection Failed', err.message);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await miniPayService.disconnect();
      setIsConnected(false);
      setAddress(null);
      setIsMiniPay(false);
      setNetwork(null);
      setBalances({ CELO: '0', cUSD: '0', USDC: '0', USDT: '0' });
    } catch (err: any) {
      setError(err);
      Alert.alert('Error', 'Failed to disconnect wallet');
    }
  }, []);

  const refreshBalances = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoadingBalances(true);
    try {
      const newBalances = await miniPayService.getAllBalances();
      setBalances(newBalances);
    } catch (err: any) {
      console.error('Failed to refresh balances:', err);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [isConnected]);

  const sendCUSD = useCallback(async (to: string, amount: string): Promise<TransactionResult> => {
    if (!canSign) {
      throw new Error('Cannot sign transactions. Please connect with MiniPay.');
    }

    try {
      const result = await miniPayService.sendCUSD(to, amount);
      // Refresh balances after transaction
      refreshBalances();
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  }, [canSign, refreshBalances]);

  const deposit = useCallback(async (
    amount: string, 
    token: 'CELO' | 'cUSD' | 'USDC' | 'USDT' = 'cUSD'
  ): Promise<TransactionResult> => {
    if (!canSign) {
      throw new Error('Cannot sign transactions. Please connect with MiniPay.');
    }

    try {
      const result = await miniPayService.deposit(amount, token);
      refreshBalances();
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  }, [canSign, refreshBalances]);

  const withdraw = useCallback(async (
    amount: string, 
    token: 'CELO' | 'cUSD' | 'USDC' | 'USDT' = 'cUSD'
  ): Promise<TransactionResult> => {
    if (!canSign) {
      throw new Error('Cannot sign transactions. Please connect with MiniPay.');
    }

    try {
      const result = await miniPayService.withdraw(amount, token);
      refreshBalances();
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  }, [canSign, refreshBalances]);

  const openMiniPay = useCallback(async () => {
    await miniPayService.openMiniPay();
  }, []);

  return {
    // Connection state
    isConnected,
    isConnecting,
    isMiniPay,
    address,
    network,
    
    // Balances
    balances,
    isLoadingBalances,
    
    // Actions
    connect,
    disconnect,
    refreshBalances,
    sendCUSD,
    deposit,
    withdraw,
    openMiniPay,
    
    // Utilities
    canSign,
    isMiniPayEnvironment,
    error,
  };
}

export default useMiniPay;
