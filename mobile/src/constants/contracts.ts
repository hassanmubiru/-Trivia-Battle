/**
 * Contract ABIs and Addresses
 * These should be updated after contract deployment
 */

export const TriviaBattleABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'entryFee', type: 'uint256' },
      { internalType: 'uint8', name: 'maxPlayers', type: 'uint8' },
    ],
    name: 'createMatch',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'matchId', type: 'uint256' }],
    name: 'joinMatch',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { internalType: 'uint256', name: 'questionId', type: 'uint256' },
      { internalType: 'uint8', name: 'answer', type: 'uint8' },
    ],
    name: 'submitAnswer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'matchId', type: 'uint256' }],
    name: 'getMatchDetails',
    outputs: [
      { internalType: 'uint256', name: 'matchId_', type: 'uint256' },
      { internalType: 'address[]', name: 'players', type: 'address[]' },
      { internalType: 'uint256', name: 'entryFee', type: 'uint256' },
      { internalType: 'uint256', name: 'prizePool', type: 'uint256' },
      { internalType: 'uint8', name: 'status', type: 'uint8' },
      { internalType: 'uint256', name: 'startTime', type: 'uint256' },
      { internalType: 'uint8', name: 'currentPlayers', type: 'uint8' },
      { internalType: 'uint8', name: 'maxPlayers', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { internalType: 'address', name: 'player', type: 'address' },
    ],
    name: 'getPlayerScore',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'matchId', type: 'uint256' }],
    name: 'claimPrize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'creator', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'entryFee', type: 'uint256' },
      { indexed: false, internalType: 'uint8', name: 'maxPlayers', type: 'uint8' },
    ],
    name: 'MatchCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
    ],
    name: 'PlayerJoined',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: false, internalType: 'uint256[]', name: 'questionIds', type: 'uint256[]' },
    ],
    name: 'MatchStarted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'player', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'questionId', type: 'uint256' },
      { indexed: false, internalType: 'uint8', name: 'answer', type: 'uint8' },
    ],
    name: 'AnswerSubmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'matchId', type: 'uint256' },
      { indexed: false, internalType: 'address[]', name: 'winners', type: 'address[]' },
      { indexed: false, internalType: 'uint256[]', name: 'prizes', type: 'uint256[]' },
    ],
    name: 'MatchEnded',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'limit', type: 'uint256' }],
    name: 'getTopPlayers',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'player', type: 'address' },
          { internalType: 'uint256', name: 'totalWins', type: 'uint256' },
          { internalType: 'uint256', name: 'totalEarnings', type: 'uint256' },
          { internalType: 'uint256', name: 'totalMatches', type: 'uint256' },
        ],
        internalType: 'struct TriviaBattleV2.PlayerStats[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'player', type: 'address' }],
    name: 'getPlayerRank',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'playerStats',
    outputs: [
      { internalType: 'address', name: 'player', type: 'address' },
      { internalType: 'uint256', name: 'totalWins', type: 'uint256' },
      { internalType: 'uint256', name: 'totalEarnings', type: 'uint256' },
      { internalType: 'uint256', name: 'totalMatches', type: 'uint256' },
      { internalType: 'uint256', name: 'totalEarningsCUSD', type: 'uint256' },
      { internalType: 'uint256', name: 'totalEarningsUSDC', type: 'uint256' },
      { internalType: 'uint256', name: 'totalEarningsUSDT', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
  alfajores: '', // Update after deployment
  celo: '', // Update after deployment
  'celo-sepolia': '0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd', // Deployed on Celo Sepolia
};

// Network configuration
export const NETWORKS = {
  alfajores: {
    name: 'Alfajores Testnet',
    rpcUrl: 'https://alfajores-forno.celo-testnet.org',
    chainId: 44787,
    explorer: 'https://alfajores.celoscan.io',
  },
  celo: {
    name: 'Celo Mainnet',
    rpcUrl: 'https://forno.celo.org',
    chainId: 42220,
    explorer: 'https://celoscan.io',
  },
  'celo-sepolia': {
    name: 'Celo Sepolia Testnet',
    rpcUrl: 'https://11142220.rpc.thirdweb.com',
    chainId: 11142220,
    explorer: 'https://celo-sepolia.blockscout.com',
  },
};

