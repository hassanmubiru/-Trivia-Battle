/**
 * Blockchain Service
 * All game logic runs on smart contract - fully decentralized
 */

import { ethers } from 'ethers';

// Deployed TriviaBattleV3 contract
const CONTRACT_ADDRESS = '0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869';

// Celo RPC URLs (with fallbacks)
const RPC_URLS = [
  'https://forno.celo.org', // Mainnet
  'https://rpc.ankr.com/celo',
  'https://1rpc.io/celo',
];

// Use testnet for development
const TESTNET_RPC_URLS = [
  'https://alfajores-forno.celo-testnet.org',
  'https://celo-alfajores.infura.io/v3/00000000000000000000000000000000',
];

// Set to true for testnet, false for mainnet
const USE_TESTNET = true;
const RPC_URL = USE_TESTNET ? TESTNET_RPC_URLS[0] : RPC_URLS[0];

// Complete ABI for TriviaBattleV3 contract
const CONTRACT_ABI = [
  // Wallet functions
  'function getBalance(address user) view returns (uint256)',
  'function deposit() payable',
  'function withdraw(uint256 amount)',
  
  // Game creation and matching
  'function createGame(uint256 stake) returns (uint256)',
  'function joinGame(uint256 gameId)',
  
  // Game play
  'function submitAnswer(uint256 gameId, uint8 questionIndex, uint8 answer)',
  'function completeGame(uint256 gameId)',
  
  // View functions
  'function getGameInfo(uint256 gameId) view returns (tuple(address player1, address player2, uint256 stake, uint8 status, uint256 player1Score, uint256 player2Score, uint256 startTime))',
  'function getAvailableGames() view returns (uint256[])',
  'function getUserStats(address user) view returns (tuple(uint256 gamesPlayed, uint256 wins, uint256 losses, uint256 totalEarnings))',
  'function getLeaderboard(uint256 limit) view returns (address[], uint256[], uint256[])',
  'function getUserGames(address user) view returns (uint256[])',
  
  // Events
  'event GameCreated(uint256 indexed gameId, address indexed creator, uint256 stake)',
  'event GameJoined(uint256 indexed gameId, address indexed player)',
  'event AnswerSubmitted(uint256 indexed gameId, address indexed player, uint8 questionIndex, bool correct)',
  'event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 prize)',
];

/**
 * Get provider (read-only)
 * Creates a new provider instance with proper network configuration
 */
export function getProvider(): ethers.JsonRpcProvider {
  // Create FetchRequest for React Native compatibility
  const fetchReq = new ethers.FetchRequest(RPC_URL);
  fetchReq.timeout = 30000; // 30 second timeout
  
  const provider = new ethers.JsonRpcProvider(
    fetchReq,
    USE_TESTNET ? { name: 'celo-alfajores', chainId: 44787 } : { name: 'celo', chainId: 42220 },
    { staticNetwork: true } // Skip network detection to avoid errors
  );
  
  return provider;
}

/**
 * Get contract instance (read-only)
 */
export function getContract(): ethers.Contract {
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

/**
 * Get wallet balance from blockchain
 */
export async function getWalletBalance(address: string): Promise<number> {
  try {
    const contract = getContract();
    const balance = await contract.getBalance(address);
    // Convert from wei to CELO
    return parseFloat(ethers.formatEther(balance));
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return 0;
  }
}

/**
 * Get native CELO balance (not contract balance)
 */
export async function getNativeCeloBalance(address: string): Promise<number> {
  try {
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return parseFloat(ethers.formatEther(balance));
  } catch (error) {
    console.error('Error fetching native CELO balance:', error);
    return 0;
  }
}

/**
 * Deposit CELO into contract
 * Requires a signer (wallet with private key)
 */
export async function depositFunds(privateKey: string, amount: number): Promise<string> {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Convert amount to wei
    const value = ethers.parseEther(amount.toString());
    
    // Send deposit transaction
    const tx = await contract.deposit({ value });
    await tx.wait();
    
    return tx.hash;
  } catch (error) {
    console.error('Error depositing funds:', error);
    throw error;
  }
}

/**
 * Withdraw CELO from contract
 * Requires a signer (wallet with private key)
 */
export async function withdrawFunds(privateKey: string, amount: number): Promise<string> {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Convert amount to wei
    const value = ethers.parseEther(amount.toString());
    
    // Send withdraw transaction
    const tx = await contract.withdraw(value);
    await tx.wait();
    
    return tx.hash;
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    throw error;
  }
}

/**
 * Create a new game on blockchain
 * Requires a signer (wallet with private key)
 */
export async function createGame(privateKey: string, stake: number): Promise<{ gameId: number; txHash: string }> {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Convert stake to wei
    const stakeWei = ethers.parseEther(stake.toString());
    
    // Create game transaction
    const tx = await contract.createGame(stakeWei);
    const receipt = await tx.wait();
    
    // Extract gameId from event logs (simplified)
    // In production, parse the GameCreated event properly
    const gameId = Date.now(); // Temporary: use timestamp as game ID
    
    return {
      gameId,
      txHash: tx.hash,
    };
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
}

/**
 * Complete a game and distribute prizes
 * Requires a signer (wallet with private key)
 */
export async function completeGameOnChain(
  privateKey: string,
  gameId: number,
  winner: string
): Promise<string> {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Complete game transaction
    const tx = await contract.completeGame(gameId, winner);
    await tx.wait();
    
    return tx.hash;
  } catch (error) {
    console.error('Error completing game on chain:', error);
    throw error;
  }
}

/**
 * Get game information from blockchain
 */
export async function getGameInfo(gameId: number): Promise<any> {
  try {
    const contract = getContract();
    const gameInfo = await contract.getGameInfo(gameId);
    return {
      player1: gameInfo.player1,
      player2: gameInfo.player2,
      stake: parseFloat(ethers.formatEther(gameInfo.stake)),
      status: gameInfo.status,
      player1Score: gameInfo.player1Score.toString(),
      player2Score: gameInfo.player2Score.toString(),
      startTime: gameInfo.startTime.toString(),
    };
  } catch (error) {
    console.error('Error fetching game info:', error);
    return null;
  }
}

/**
 * Get user statistics from blockchain
 */
export async function getUserStats(address: string): Promise<{
  gamesPlayed: number;
  wins: number;
  losses: number;
  totalEarnings: number;
  winRate: number;
}> {
  try {
    const contract = getContract();
    const stats = await contract.getUserStats(address);
    
    const gamesPlayed = parseInt(stats.gamesPlayed.toString());
    const wins = parseInt(stats.wins.toString());
    const losses = parseInt(stats.losses.toString());
    const totalEarnings = parseFloat(ethers.formatEther(stats.totalEarnings));
    const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
    
    return {
      gamesPlayed,
      wins,
      losses,
      totalEarnings,
      winRate: parseFloat(winRate.toFixed(1)),
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      totalEarnings: 0,
      winRate: 0,
    };
  }
}

/**
 * Get leaderboard from blockchain
 */
export async function getLeaderboard(limit: number = 100): Promise<Array<{
  address: string;
  wins: number;
  earnings: number;
  rank: number;
}>> {
  try {
    const contract = getContract();
    const [addresses, wins, earnings] = await contract.getLeaderboard(limit);
    
    return addresses.map((address: string, index: number) => ({
      address,
      wins: parseInt(wins[index].toString()),
      earnings: parseFloat(ethers.formatEther(earnings[index])),
      rank: index + 1,
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Get available games to join
 */
export async function getAvailableGames(): Promise<number[]> {
  try {
    const contract = getContract();
    const gameIds = await contract.getAvailableGames();
    return gameIds.map((id: any) => parseInt(id.toString()));
  } catch (error) {
    console.error('Error fetching available games:', error);
    return [];
  }
}

/**
 * Join an existing game
 */
export async function joinGame(privateKey: string, gameId: number): Promise<string> {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Join game transaction
    const tx = await contract.joinGame(gameId);
    await tx.wait();
    
    return tx.hash;
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
}

/**
 * Submit an answer to a question
 */
export async function submitAnswer(
  privateKey: string,
  gameId: number,
  questionIndex: number,
  answer: number
): Promise<{ txHash: string; correct: boolean }> {
  try {
    const provider = getProvider();
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
    
    // Submit answer transaction
    const tx = await contract.submitAnswer(gameId, questionIndex, answer);
    const receipt = await tx.wait();
    
    // Parse AnswerSubmitted event to check if answer was correct
    let correct = false;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === 'AnswerSubmitted') {
          correct = parsed.args.correct;
        }
      } catch (e) {
        // Not our event
      }
    }
    
    return {
      txHash: tx.hash,
      correct,
    };
  } catch (error) {
    console.error('Error submitting answer:', error);
    throw error;
  }
}

/**
 * Get user's game history
 */
export async function getUserGames(address: string): Promise<number[]> {
  try {
    const contract = getContract();
    const gameIds = await contract.getUserGames(address);
    return gameIds.map((id: any) => parseInt(id.toString()));
  } catch (error) {
    console.error('Error fetching user games:', error);
    return [];
  }
}

/**
 * Listen to game events
 */
export function listenToGameEvents(
  gameId: number,
  onAnswerSubmitted: (player: string, correct: boolean) => void,
  onGameCompleted: (winner: string, prize: number) => void
): () => void {
  const contract = getContract();
  
  // Listen for AnswerSubmitted events
  const answerFilter = contract.filters.AnswerSubmitted(gameId);
  contract.on(answerFilter, (gameId, player, questionIndex, correct) => {
    onAnswerSubmitted(player, correct);
  });
  
  // Listen for GameCompleted events
  const completedFilter = contract.filters.GameCompleted(gameId);
  contract.on(completedFilter, (gameId, winner, prize) => {
    onGameCompleted(winner, parseFloat(ethers.formatEther(prize)));
  });
  
  // Return cleanup function
  return () => {
    contract.off(answerFilter);
    contract.off(completedFilter);
  };
}
