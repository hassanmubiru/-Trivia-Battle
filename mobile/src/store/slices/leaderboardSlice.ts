/**
 * Leaderboard Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PlayerRanking {
  address: string;
  rank: number;
  totalWins: number;
  totalEarnings: number;
  totalMatches: number;
  winRate: number;
}

interface LeaderboardState {
  global: PlayerRanking[];
  weekly: PlayerRanking[];
  monthly: PlayerRanking[];
  friends: PlayerRanking[];
  userRank: number | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  global: [],
  weekly: [],
  monthly: [],
  friends: [],
  userRank: null,
  isLoading: false,
  error: null,
};

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setGlobalLeaderboard: (
      state,
      action: PayloadAction<PlayerRanking[]>
    ) => {
      state.global = action.payload;
    },
    setWeeklyLeaderboard: (
      state,
      action: PayloadAction<PlayerRanking[]>
    ) => {
      state.weekly = action.payload;
    },
    setMonthlyLeaderboard: (
      state,
      action: PayloadAction<PlayerRanking[]>
    ) => {
      state.monthly = action.payload;
    },
    setFriendsLeaderboard: (
      state,
      action: PayloadAction<PlayerRanking[]>
    ) => {
      state.friends = action.payload;
    },
    setUserRank: (state, action: PayloadAction<number>) => {
      state.userRank = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setGlobalLeaderboard,
  setWeeklyLeaderboard,
  setMonthlyLeaderboard,
  setFriendsLeaderboard,
  setUserRank,
  setLoading,
  setError,
} = leaderboardSlice.actions;

export default leaderboardSlice.reducer;

