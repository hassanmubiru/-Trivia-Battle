/**
 * API Service
 * Centralized backend API communication
 */

// TODO: Update with your actual backend URL
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * User Statistics
 */
export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  ranking: number;
  totalGames: number;
}

/**
 * User Earnings
 */
export interface UserEarnings {
  totalEarned: number;
  totalSpent: number;
  netProfit: number;
}

/**
 * Trivia Question
 */
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: string;
}

/**
 * Leaderboard Player
 */
export interface LeaderboardPlayer {
  rank: number;
  username: string;
  wins: number;
  totalEarnings: number;
  winRate: number;
}

/**
 * Fetch user statistics from backend
 */
export async function fetchUserStats(walletAddress: string): Promise<UserStats> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${walletAddress}/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch user stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user stats:', error);
    // Return default stats on error
    return {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      ranking: 0,
      totalGames: 0,
    };
  }
}

/**
 * Fetch user earnings from backend
 */
export async function fetchUserEarnings(walletAddress: string): Promise<UserEarnings> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${walletAddress}/earnings`);
    if (!response.ok) {
      throw new Error('Failed to fetch user earnings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user earnings:', error);
    return {
      totalEarned: 0,
      totalSpent: 0,
      netProfit: 0,
    };
  }
}

/**
 * Fetch trivia questions for a game mode
 */
export async function fetchQuestions(mode: string): Promise<Question[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/questions?mode=${mode}&count=5`);
    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching questions:', error);
    return [];
  }
}

/**
 * Fetch leaderboard rankings
 */
export async function fetchLeaderboard(): Promise<LeaderboardPlayer[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard?limit=100`);
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Join matchmaking queue
 */
export async function joinMatchmaking(walletAddress: string, mode: string, stake: number): Promise<{ gameId: string; opponentId: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/matchmaking/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        mode,
        stake,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to join matchmaking');
    }
    return await response.json();
  } catch (error) {
    console.error('Error joining matchmaking:', error);
    throw error;
  }
}

/**
 * Submit game answer
 */
export async function submitAnswer(
  gameId: string,
  questionId: string,
  answer: number,
  timeLeft: number
): Promise<{ correct: boolean; points: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionId,
        answer,
        timeLeft,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to submit answer');
    }
    return await response.json();
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

/**
 * Complete game and get final results
 */
export async function completeGame(
  gameId: string,
  score: number
): Promise<{ won: boolean; prizeAmount: number; opponentScore: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/games/${gameId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        score,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to complete game');
    }
    return await response.json();
  } catch (error) {
    console.error('Error completing game:', error);
    throw error;
  }
}
