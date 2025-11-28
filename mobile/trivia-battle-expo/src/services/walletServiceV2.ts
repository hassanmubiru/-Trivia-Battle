/**
 * Wallet Service V2
 * Simplified MetaMask connection via WalletConnect with transaction signing
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

// TriviaBattle contract ABI
const TRIVIA_ABI = [
  'function deposit() payable',
  'function depositToken(address token, uint256 amount)',
  'function withdraw(uint256 amount)',
  'function getBalance(address user) view returns (uint256)',
];

export interface WalletInfo {
  address: string;
  isConnected: boolean;
  connectionType: 'walletconnect' | 'manual' | 'none';
  canSign: boolean;
  balances: {
    CELO: string;
    cUSD: string;
    USDC: string;
    USDT: string;
  };
}

class WalletServiceV2 {
  private provider: ethers.JsonRpcProvider;
  private walletAddress: string | null = null;
  private connectionType: 'walletconnect' | 'manual' | 'none' = 'none';
  private canSign: boolean = false;
  private signer: ethers.Signer | null = null;

  constructor() {
    // Initialize read-only provider
    this.provider = new ethers.JsonRpcProvider(
      CELO_ALFAJORES.rpcUrl,
      { chainId: CELO_ALFAJORES.chainId, name: CELO_ALFAJORES.name }
    );
  }

  /**
   * Generate WalletConnect deep link for MetaMask
   * For production, implement full WalletConnect SDK
   */
  generateMetaMaskLink(): { deepLink: string; projectId: string } {
    const projectId = '2aca272d18deb10ff748260da5f78bfd';
    const deepLink = `metamask://wc?projectId=${projectId}`;
    return { deepLink, projectId };
  }

  /**
   * Connect with MetaMask via copied address
   * (Full WalletConnect would automate this)
   */
  async connectMetaMask(address: string): Promise<WalletInfo> {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid wallet address');
    }

    this.walletAddress = address;
    this.connectionType = 'walletconnect';
    this.canSign = true; // Assume connected to MetaMask
    
    await AsyncStorage.setItem('walletAddress', address);
    await AsyncStorage.setItem('connectionType', 'walletconnect');

    const balances = await this.getBalances();

    return {
      address,
      isConnected: true,
      connectionType: 'walletconnect',
      canSign: true,
      balances,
    };
  }

  /**
   * Connect with a wallet address (read-only mode)
   */
  async connectWithAddress(address: string): Promise<WalletInfo> {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid wallet address');
    }

    this.walletAddress = address;
    this.connectionType = 'manual';
    this.canSign = false; // Cannot sign in read-only mode
    
    await AsyncStorage.setItem('walletAddress', address);
    await AsyncStorage.setItem('connectionType', 'manual');

    const balances = await this.getBalances();

    return {
      address,
      isConnected: true,
      connectionType: 'manual',
      canSign: false,
      balances,
    };
  }

  /**
   * Restore previous connection
   */
  async restoreConnection(): Promise<WalletInfo | null> {
    try {
      const address = await AsyncStorage.getItem('walletAddress');
      const type = (await AsyncStorage.getItem('connectionType')) as 'walletconnect' | 'manual' | null;

      if (address && ethers.isAddress(address)) {
        this.walletAddress = address;
        this.connectionType = type || 'manual';
        this.canSign = type === 'walletconnect';
        
        const balances = await this.getBalances();
        
        return {
          address,
          isConnected: true,
          connectionType: this.connectionType,
          canSign: this.canSign,
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
   * Simulate transaction (for demo - real version uses MetaMask signer)
   */
  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    if (!this.canSign) {
      throw new Error('Cannot sign transactions in read-only mode');
    }

    try {
      // In production with real MetaMask connection:
      // const signer = provider.getSigner();
      // const tx = await signer.sendTransaction({ to, value: ethers.parseEther(value), data });
      // return tx.hash;

      // For now, simulate with a transaction hash
      const tx = {
        from: this.walletAddress,
        to,
        value: ethers.parseEther(value).toString(),
        data: data || '0x',
      };

      console.log('Transaction ready (would be sent via MetaMask):', tx);
      
      // Return mock hash
      return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  }

  /**
   * Approve token spending
   */
  async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<string> {
    if (!this.canSign) {
      throw new Error('Cannot approve in read-only mode');
    }

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer || this.provider);
      const tx = await contract.approve(spenderAddress, ethers.parseUnits(amount, 18));
      return tx.hash;
    } catch (error) {
      console.error('Approve error:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    this.walletAddress = null;
    this.connectionType = 'none';
    this.canSign = false;
    this.signer = null;

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
   * Check if can sign transactions
   */
  canSignTransactions(): boolean {
    return this.canSign;
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

export const walletService = new WalletServiceV2();
export default walletService;
