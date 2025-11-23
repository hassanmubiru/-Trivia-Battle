/**
 * Blockchain Service
 * Smart contract interactions using ethers.js
 */

import { ethers } from 'ethers';

// TODO: Update with actual deployed contract address
const CONTRACT_ADDRESS = '0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869';

// Celo Alfajores Testnet (for testing)
const RPC_URL = 'https://alfajores-forno.celo-testnet.org';

// Minimal ABI for TriviaBattleV3 contract
const CONTRACT_ABI = [
  'function getBalance(address user) view returns (uint256)',
  'function deposit() payable',
  'function withdraw(uint256 amount)',
  'function createGame(uint256 stake) returns (uint256)',
  'function completeGame(uint256 gameId, address winner)',
  'function getGameInfo(uint256 gameId) view returns (tuple(address player1, address player2, uint256 stake, uint8 status))',
];

/**
 * Get provider (read-only)
 */
export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(RPC_URL);
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
    };
  } catch (error) {
    console.error('Error fetching game info:', error);
    return null;
  }
}
