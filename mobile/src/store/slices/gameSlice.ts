/**
 * Game Redux Slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Question {
  questionId: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface GameState {
  currentMatch: {
    matchId: number | null;
    players: string[];
    entryFee: string;
    prizePool: string;
    token: 'cUSD' | 'USDC' | 'USDT' | null;
    status: 'waiting' | 'active' | 'completed' | 'cancelled';
    questions: Question[];
    currentQuestionIndex: number;
    scores: Record<string, number>;
    timeRemaining: number;
  } | null;
  matchmaking: {
    isSearching: boolean;
    gameMode: '1v1' | '2v2' | '4player' | null;
    entryFee: string;
    selectedToken: 'cUSD' | 'USDC' | 'USDT' | null;
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: GameState = {
  currentMatch: null,
  matchmaking: {
    isSearching: false,
    gameMode: null,
    entryFee: '0.1',
    selectedToken: 'cUSD',
  },
  isLoading: false,
  error: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startMatchmaking: (
      state,
      action: PayloadAction<{
        gameMode: '1v1' | '2v2' | '4player';
        entryFee: string;
        token: 'cUSD' | 'USDC' | 'USDT';
      }>
    ) => {
      state.matchmaking.isSearching = true;
      state.matchmaking.gameMode = action.payload.gameMode;
      state.matchmaking.entryFee = action.payload.entryFee;
      state.matchmaking.selectedToken = action.payload.token;
    },
    stopMatchmaking: (state) => {
      state.matchmaking.isSearching = false;
      state.matchmaking.gameMode = null;
    },
    setCurrentMatch: (
      state,
      action: PayloadAction<GameState['currentMatch']>
    ) => {
      state.currentMatch = action.payload;
    },
    updateQuestion: (state, action: PayloadAction<number>) => {
      if (state.currentMatch) {
        state.currentMatch.currentQuestionIndex = action.payload;
      }
    },
    updateScores: (
      state,
      action: PayloadAction<Record<string, number>>
    ) => {
      if (state.currentMatch) {
        state.currentMatch.scores = action.payload;
      }
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      if (state.currentMatch) {
        state.currentMatch.timeRemaining = action.payload;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetGame: (state) => {
      state.currentMatch = null;
      state.matchmaking.isSearching = false;
      state.matchmaking.gameMode = null;
      state.error = null;
    },
  },
});

export const {
  startMatchmaking,
  stopMatchmaking,
  setCurrentMatch,
  updateQuestion,
  updateScores,
  updateTimeRemaining,
  setLoading,
  setError,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;

