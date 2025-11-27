/**
 * Wallet Service
 * Handles MetaMask connection via WalletConnect and direct wallet input
 * Supports Celo network (Alfajores testnet for development)
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Celo Alfajores Testnet configuration
const CELO_ALFAJORES = {
  chainId: 44787,
  chainIdHex: '0xaef3',
  rpcUrl: 'https://alfajores-forno.celo-testnet.org',
  name: 'Celo Alfajores',
  symbol: 'CELO',
  explorer: 'https://alfajores.celoscan.io',
};

// Token addresses on Alfajores
const TOKENS = {
  cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  USDC: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B',
  USDT: '0x02De4766C272abc10Bc88c220D214A26960a7e92',
};

// TriviaBattle contract
const TRIVIA_CONTRACT = '0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869';

// ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

export interface WalletInfo {
  address: string;
  isConnected: boolean;
  connectionType: 'walletconnect' | 'manual' | 'none';
  balances: {
    CELO: string;
    cUSD: string;
    USDC: string;
    USDT: string;
  };
}

class WalletService {
  private provider: ethers.JsonRpcProvider;
  private walletAddress: string | null = null;
  private connectionType: 'walletconnect' | 'manual' | 'none' = 'none';
  private wcProvider: any = null;

  constructor() {
    // Initialize read-only provider
    this.provider = new ethers.JsonRpcProvider(
      CELO_ALFAJORES.rpcUrl,
      { chainId: CELO_ALFAJORES.chainId, name: CELO_ALFAJORES.name }
    );
  }

  /**
   * Initialize WalletConnect
   */
  async initWalletConnect(): Promise<{ uri: string; approval: () => Promise<any> }> {
    try {
      // Dynamic import to avoid issues
      const { Core } = await import('@walletconnect/core');
      const { Web3Wallet } = await import('@walletconnect/web3wallet');

      const core = new Core({
        projectId: '2aca272d18deb10ff748260da5f78bfd', // WalletConnect Cloud project ID
      });

      // This creates a pairing URI that MetaMask can scan
      const { uri, approval } = await core.pairing.create();
      
      return { uri, approval };
    } catch (error) {
      console.error('WalletConnect init error:', error);
      throw error;
    }
  }

  /**
   * Connect via deep link to MetaMask
   * Opens MetaMask app and requests connection
   */
  getMetaMaskDeepLink(wcUri?: string): string {
    if (wcUri) {
      // WalletConnect URI - opens MetaMask to approve connection
      return `metamask://wc?uri=${encodeURIComponent(wcUri)}`;
    }
    // Just open MetaMask
    return 'metamask://';
  }

  /**
   * Connect with a wallet address (read-only mode)
   * User enters their address manually
   */
  async connectWithAddress(address: string): Promise<WalletInfo> {
    // Validate address
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid wallet address');
    }

    this.walletAddress = address;
    this.connectionType = 'manual';
    
    // Store for persistence
    await AsyncStorage.setItem('walletAddress', address);
    await AsyncStorage.setItem('connectionType', 'manual');

    const balances = await this.getBalances();

    return {
      address,
      isConnected: true,
      connectionType: 'manual',
      balances,
    };
  }

  /**
   * Restore previous connection
   */
  async restoreConnection(): Promise<WalletInfo | null> {
    try {
      const address = await AsyncStorage.getItem('walletAddress');
      const type = await AsyncStorage.getItem('connectionType');

      if (address && ethers.isAddress(address)) {
        this.walletAddress = address;
        this.connectionType = (type as any) || 'manual';
        
        const balances = await this.getBalances();
        
        return {
          address,
          isConnected: true,
          connectionType: this.connectionType,
          balances,
        };
      }
      return null;
    } catch (error) {
      console.error('Restore connection error:', error);
      return null;
    }
  }

  /**
   * Get all token balances
   */
  async getBalances(): Promise<WalletInfo['balances']> {
    if (!this.walletAddress) {
      return { CELO: '0', cUSD: '0', USDC: '0', USDT: '0' };
    }

    try {
      // Get CELO balance
      const celoBalance = await this.provider.getBalance(this.walletAddress);
      
      // Get token balances
      const cusdContract = new ethers.Contract(TOKENS.cUSD, ERC20_ABI, this.provider);
      const usdcContract = new ethers.Contract(TOKENS.USDC, ERC20_ABI, this.provider);
      const usdtContract = new ethers.Contract(TOKENS.USDT, ERC20_ABI, this.provider);

      const [cusdBalance, usdcBalance, usdtBalance] = await Promise.all([
        cusdContract.balanceOf(this.walletAddress).catch(() => BigInt(0)),
        usdcContract.balanceOf(this.walletAddress).catch(() => BigInt(0)),
        usdtContract.balanceOf(this.walletAddress).catch(() => BigInt(0)),
      ]);

      return {
        CELO: ethers.formatEther(celoBalance),
        cUSD: ethers.formatUnits(cusdBalance, 18),
        USDC: ethers.formatUnits(usdcBalance, 6),
        USDT: ethers.formatUnits(usdtBalance, 6),
      };
    } catch (error) {
      console.error('Error fetching balances:', error);
      return { CELO: '0', cUSD: '0', USDC: '0', USDT: '0' };
    }
  }

  /**
   * Get single token balance
   */
  async getTokenBalance(token: string): Promise<string> {
    const balances = await this.getBalances();
    return balances[token as keyof typeof balances] || '0';
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    this.walletAddress = null;
    this.connectionType = 'none';
    this.wcProvider = null;

    await AsyncStorage.removeItem('walletAddress');
    await AsyncStorage.removeItem('connectionType');
  }

  /**
   * Get current wallet address
   */
  getAddress(): string | null {
    return this.walletAddress;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.walletAddress !== null;
  }

  /**
   * Get connection type
   */
  getConnectionType(): string {
    return this.connectionType;
  }

  /**
   * Get provider for contract interactions
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return TRIVIA_CONTRACT;
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return CELO_ALFAJORES;
  }
}

export const walletService = new WalletService();
export default walletService;
