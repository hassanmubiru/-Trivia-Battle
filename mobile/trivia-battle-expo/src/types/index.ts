/**
 * TypeScript Type Definitions
 */

export type SupportedToken = 'cUSD' | 'USDC' | 'USDT';
export type Network = 'alfajores' | 'celo';
export type GameMode = '1v1' | '2v2' | '4player';
export type MatchStatus = 'waiting' | 'active' | 'completed' | 'cancelled';

export interface Question {
  questionId: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Match {
  matchId: number;
  players: string[];
  entryFee: string;
  prizePool: string;
  token: SupportedToken;
  status: MatchStatus;
  startTime?: number;
  currentPlayers: number;
  maxPlayers: number;
}

export interface GameSession {
  matchId: number;
  questions: Question[];
  currentQuestionIndex: number;
  scores: Record<string, number>;
  timeRemaining: number;
  status: MatchStatus;
}

export interface PlayerStats {
  address: string;
  totalWins: number;
  totalEarnings: number;
  totalMatches: number;
  winRate: number;
}

