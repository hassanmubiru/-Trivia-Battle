/**
 * Wallet Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BigNumber } from 'bignumber.js';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  network: 'alfajores' | 'celo';
  balance: {
    celo: BigNumber;
    cusd: BigNumber;
    usdc: BigNumber;
    usdt: BigNumber;
  };
  phoneNumber: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  isConnected: false,
  address: null,
  network: 'alfajores',
  balance: {
    celo: new BigNumber(0),
    cusd: new BigNumber(0),
    usdc: new BigNumber(0),
    usdt: new BigNumber(0),
  },
  phoneNumber: null,
  isLoading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    connectSuccess: (
      state,
      action: PayloadAction<{
        address: string;
        network: 'alfajores' | 'celo';
        phoneNumber?: string;
      }>
    ) => {
      state.isConnected = true;
      state.address = action.payload.address;
      state.network = action.payload.network;
      state.phoneNumber = action.payload.phoneNumber || null;
      state.isLoading = false;
      state.error = null;
    },
    connectFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    disconnect: (state) => {
      state.isConnected = false;
      state.address = null;
      state.phoneNumber = null;
      state.balance = {
        celo: new BigNumber(0),
        cusd: new BigNumber(0),
        usdc: new BigNumber(0),
        usdt: new BigNumber(0),
      };
    },
    updateBalance: (
      state,
      action: PayloadAction<{
        celo: BigNumber;
        cusd: BigNumber;
        usdc: BigNumber;
        usdt: BigNumber;
      }>
    ) => {
      state.balance = action.payload;
    },
    setNetwork: (state, action: PayloadAction<'alfajores' | 'celo'>) => {
      state.network = action.payload;
    },
  },
});

export const {
  connectStart,
  connectSuccess,
  connectFailure,
  disconnect,
  updateBalance,
  setNetwork,
} = walletSlice.actions;

export default walletSlice.reducer;

