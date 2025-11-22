/**
 * User Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  phoneNumber: string | null;
  address: string | null;
  stats: {
    totalWins: number;
    totalEarnings: number;
    totalMatches: number;
  };
  isAuthenticated: boolean;
}

const initialState: UserState = {
  phoneNumber: null,
  address: null,
  stats: {
    totalWins: 0,
    totalEarnings: 0,
    totalMatches: 0,
  },
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{
        phoneNumber: string;
        address: string;
      }>
    ) => {
      state.phoneNumber = action.payload.phoneNumber;
      state.address = action.payload.address;
      state.isAuthenticated = true;
    },
    updateStats: (
      state,
      action: PayloadAction<{
        totalWins?: number;
        totalEarnings?: number;
        totalMatches?: number;
      }>
    ) => {
      if (action.payload.totalWins !== undefined) {
        state.stats.totalWins = action.payload.totalWins;
      }
      if (action.payload.totalEarnings !== undefined) {
        state.stats.totalEarnings = action.payload.totalEarnings;
      }
      if (action.payload.totalMatches !== undefined) {
        state.stats.totalMatches = action.payload.totalMatches;
      }
    },
    logout: (state) => {
      state.phoneNumber = null;
      state.address = null;
      state.isAuthenticated = false;
      state.stats = {
        totalWins: 0,
        totalEarnings: 0,
        totalMatches: 0,
      };
    },
  },
});

export const { setUser, updateStats, logout } = userSlice.actions;

export default userSlice.reducer;

