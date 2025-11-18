/**
 * WebSocket Service
 * Handles real-time communication for game synchronization
 */

import io, { Socket } from 'socket.io-client';

export interface QuestionUpdate {
  matchId: number;
  questionIndex: number;
  question: any;
  timeRemaining: number;
}

export interface ScoreUpdate {
  matchId: number;
  scores: Record<string, number>;
}

export interface MatchFound {
  matchId: number;
  players: string[];
  entryFee: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private wsUrl: string;

  constructor() {
    this.wsUrl = process.env.WS_URL || 'ws://localhost:3001';
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.wsUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('WebSocket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Join matchmaking queue
   */
  joinMatchmaking(matchId: number, gameMode: string): void {
    if (!this.socket || !this.connected) {
      this.connect();
    }

    this.socket?.emit('joinMatchmaking', { matchId, gameMode });
  }

  /**
   * Join match room
   */
  joinMatch(matchId: number): void {
    if (!this.socket || !this.connected) {
      this.connect();
    }

    this.socket?.emit('joinMatch', { matchId });
  }

  /**
   * Send answer
   */
  sendAnswer(matchId: number, questionId: number, answer: number): void {
    if (!this.socket || !this.connected) {
      return;
    }

    this.socket.emit('submitAnswer', {
      matchId,
      questionId,
      answer,
      timestamp: Date.now(),
    });
  }

  /**
   * Send player ready status
   */
  sendPlayerReady(matchId: number): void {
    if (!this.socket || !this.connected) {
      return;
    }

    this.socket.emit('playerReady', { matchId });
  }

  // Event listeners
  onMatchFound(callback: (data: MatchFound) => void): void {
    this.socket?.on('matchFound', callback);
  }

  onQuestionUpdate(callback: (data: QuestionUpdate) => void): void {
    this.socket?.on('questionUpdate', callback);
  }

  onScoreUpdate(callback: (data: ScoreUpdate) => void): void {
    this.socket?.on('scoreUpdate', callback);
  }

  onMatchStarted(callback: (matchId: number) => void): void {
    this.socket?.on('matchStarted', (data: { matchId: number }) => {
      callback(data.matchId);
    });
  }

  onMatchEnded(callback: (data: any) => void): void {
    this.socket?.on('matchEnded', callback);
  }

  onPlayerJoined(callback: (data: { matchId: number; player: string }) => void): void {
    this.socket?.on('playerJoined', callback);
  }

  onError(callback: (error: any) => void): void {
    this.socket?.on('error', callback);
  }

  // Remove event listeners
  off(event: string, callback?: Function): void {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  /**
   * Leave match room
   */
  leaveMatch(matchId: number): void {
    if (!this.socket || !this.connected) {
      return;
    }

    this.socket.emit('leaveMatch', { matchId });
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;

