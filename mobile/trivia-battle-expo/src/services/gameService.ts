/**
 * Game Service
 * Manages game state, matchmaking, and real-time synchronization
 */

import { celoService } from './celoService';
import { websocketService } from './websocketService';
import { TriviaBattleABI } from '../constants/contracts';

export interface Match {
  matchId: number;
  players: string[];
  entryFee: string;
  prizePool: string;
  status: 'Waiting' | 'Active' | 'Completed' | 'Cancelled';
  startTime?: number;
  currentPlayers: number;
  maxPlayers: number;
}

export interface Question {
  questionId: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameSession {
  matchId: number;
  questions: Question[];
  currentQuestionIndex: number;
  scores: Record<string, number>;
  timeRemaining: number;
  status: 'waiting' | 'active' | 'ended';
}

class GameService {
  private contractAddress: string;
  private currentSession: GameSession | null = null;
  private matchmakingQueue: string[] = [];

  constructor() {
    // Contract address should be loaded from config
    this.contractAddress = process.env.CONTRACT_ADDRESS || '';
  }

  /**
   * Create a new match
   */
  async createMatch(
    entryFee: string,
    maxPlayers: number
  ): Promise<number> {
    try {
      const value = celoService.kit?.web3.utils.toWei(entryFee, 'ether') || '0';
      
      const result = await celoService.executeContract(
        this.contractAddress,
        TriviaBattleABI,
        'createMatch',
        [value, maxPlayers],
        value
      );

      // Parse match ID from transaction receipt
      const matchId = await this.getMatchIdFromTx(result.hash);
      
      return matchId;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  /**
   * Join an existing match
   */
  async joinMatch(matchId: number, entryFee: string): Promise<void> {
    try {
      const value = celoService.kit?.web3.utils.toWei(entryFee, 'ether') || '0';
      
      await celoService.executeContract(
        this.contractAddress,
        TriviaBattleABI,
        'joinMatch',
        [matchId],
        value
      );

      // Subscribe to match events
      this.subscribeToMatchEvents(matchId);
    } catch (error) {
      console.error('Error joining match:', error);
      throw error;
    }
  }

  /**
   * Submit an answer
   */
  async submitAnswer(
    matchId: number,
    questionId: number,
    answer: number
  ): Promise<void> {
    try {
      await celoService.executeContract(
        this.contractAddress,
        TriviaBattleABI,
        'submitAnswer',
        [matchId, questionId, answer]
      );

      // Also send via WebSocket for real-time updates
      websocketService.sendAnswer(matchId, questionId, answer);
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }

  /**
   * Get match details
   */
  async getMatchDetails(matchId: number): Promise<Match> {
    try {
      const details = await celoService.callContract(
        this.contractAddress,
        TriviaBattleABI,
        'getMatchDetails',
        [matchId]
      );

      return {
        matchId: Number(details.matchId_),
        players: details.players,
        entryFee: details.entryFee,
        prizePool: details.prizePool,
        status: this.mapStatus(details.status),
        startTime: details.startTime ? Number(details.startTime) : undefined,
        currentPlayers: Number(details.currentPlayers),
        maxPlayers: Number(details.maxPlayers),
      };
    } catch (error) {
      console.error('Error getting match details:', error);
      throw error;
    }
  }

  /**
   * Get player score
   */
  async getPlayerScore(matchId: number, playerAddress: string): Promise<number> {
    try {
      const score = await celoService.callContract(
        this.contractAddress,
        TriviaBattleABI,
        'getPlayerScore',
        [matchId, playerAddress]
      );

      return Number(score);
    } catch (error) {
      console.error('Error getting player score:', error);
      throw error;
    }
  }

  /**
   * Start matchmaking
   */
  async startMatchmaking(
    gameMode: '1v1' | '2v2' | '4player',
    entryFee: string
  ): Promise<number> {
    const maxPlayers = gameMode === '1v1' ? 2 : gameMode === '2v2' ? 4 : 4;

    // Try to find existing match first
    const existingMatch = await this.findAvailableMatch(entryFee, maxPlayers);
    
    if (existingMatch) {
      await this.joinMatch(existingMatch, entryFee);
      return existingMatch;
    }

    // Create new match
    const matchId = await this.createMatch(entryFee, maxPlayers);
    
    // Join WebSocket matchmaking room
    websocketService.joinMatchmaking(matchId, gameMode);
    
    return matchId;
  }

  /**
   * Initialize game session
   */
  async initializeSession(matchId: number, questions: Question[]): Promise<GameSession> {
    this.currentSession = {
      matchId,
      questions,
      currentQuestionIndex: 0,
      scores: {},
      timeRemaining: 30, // 30 seconds per question
      status: 'waiting',
    };

    // Subscribe to WebSocket updates
    websocketService.onQuestionUpdate((data) => {
      if (this.currentSession && data.matchId === matchId) {
        this.currentSession.currentQuestionIndex = data.questionIndex;
        this.currentSession.timeRemaining = data.timeRemaining;
      }
    });

    websocketService.onScoreUpdate((data) => {
      if (this.currentSession && data.matchId === matchId) {
        this.currentSession.scores = data.scores;
      }
    });

    return this.currentSession;
  }

  /**
   * Get current game session
   */
  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  /**
   * Claim prize
   */
  async claimPrize(matchId: number): Promise<void> {
    try {
      await celoService.executeContract(
        this.contractAddress,
        TriviaBattleABI,
        'claimPrize',
        [matchId]
      );
    } catch (error) {
      console.error('Error claiming prize:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getMatchIdFromTx(txHash: string): Promise<number> {
    // Parse match ID from transaction receipt events
    // This is a simplified version - actual implementation would parse events
    return 0; // Placeholder
  }

  private mapStatus(status: number): Match['status'] {
    const statusMap: Match['status'][] = ['Waiting', 'Active', 'Completed', 'Cancelled'];
    return statusMap[status] || 'Waiting';
  }

  private async findAvailableMatch(
    entryFee: string,
    maxPlayers: number
  ): Promise<number | null> {
    // Query backend API or indexer for available matches
    // This is a placeholder - actual implementation would query the indexer
    return null;
  }

  private subscribeToMatchEvents(matchId: number): void {
    celoService.subscribeToEvents(
      this.contractAddress,
      TriviaBattleABI,
      'MatchStarted',
      (event) => {
        if (event.returnValues.matchId === matchId) {
          // Handle match started
          websocketService.onMatchStarted(matchId);
        }
      }
    );

    celoService.subscribeToEvents(
      this.contractAddress,
      TriviaBattleABI,
      'MatchEnded',
      (event) => {
        if (event.returnValues.matchId === matchId) {
          // Handle match ended
          if (this.currentSession) {
            this.currentSession.status = 'ended';
          }
        }
      }
    );
  }
}

export const gameService = new GameService();
export default gameService;

