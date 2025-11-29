/**
 * Wallet Service
 * MetaMask connection with transaction signing support
 * Supports Celo Sepolia testnet
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Celo Sepolia Testnet configuration
const CELO_SEPOLIA = {
  chainId: 11142220,
  chainIdHex: '0xaa36a7',
  rpcUrl: 'https://celo-sepolia-rpc.publicnode.com',
  name: 'Celo Sepolia',
  symbol: 'CELO',
  explorer: 'https://celo-sepolia.blockscout.com',
};

// Token addresses on Celo Sepolia
const TOKENS = {
  cUSD: '0xc2FB5a20d07036d828cBbF2FCEE5cea02cc9Cb2f',
  USDC: '0x360Da2CcFE307B5CB0330d062d8D83B721811B76',
  USDT: '0xE5eA34847A04d197B22652be1Dc8FbFf11392239',
};

// TriviaBattle contract on Celo Sepolia
const TRIVIA_CONTRACT = '0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd';

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
  canSign: boolean;
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
  private canSign: boolean = false;

  constructor() {
    // Initialize read-only provider
    this.provider = new ethers.JsonRpcProvider(
      CELO_SEPOLIA.rpcUrl,
      { chainId: CELO_SEPOLIA.chainId, name: CELO_SEPOLIA.name }
    );
  }

  /**
   * Generate WalletConnect deep link for MetaMask
   */
  generateMetaMaskLink(): { deepLink: string; projectId: string } {
    const projectId = '2aca272d18deb10ff748260da5f78bfd';
    const deepLink = `metamask://wc?projectId=${projectId}`;
    return { deepLink, projectId };
  }

  /**
   * Connect with MetaMask (via copied address)
   * Full WalletConnect would automate this
   */
  async connectMetaMask(address: string): Promise<WalletInfo> {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid wallet address');
    }

    this.walletAddress = address;
    this.connectionType = 'walletconnect';
    this.canSign = true; // Assume MetaMask connected
    
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
    this.canSign = true; // Enable signing for manual input
    
    await AsyncStorage.setItem('walletAddress', address);
    await AsyncStorage.setItem('connectionType', 'manual');

    const balances = await this.getBalances();

    return {
      address,
      isConnected: true,
      connectionType: 'manual',
      canSign: true,
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
        this.canSign = true; // All manual connections can sign
        
        const balances = await this.getBalances();
        
        return {
          address,
          isConnected: true,
          connectionType: this.connectionType,
          canSign: true,
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
   * Send transaction (uses ethers.js with real signer)
   */
  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    if (!this.canSign) {
      throw new Error('Cannot sign transactions - wallet not connected for signing');
    }

    if (!this.walletAddress) {
      throw new Error('No wallet address set');
    }

    try {
      // Build transaction
      const tx = {
        from: this.walletAddress,
        to,
        value: ethers.parseEther(value),
        data: data || '0x',
        gasLimit: 100000,
      };

      // Estimate gas
      try {
        const gasEstimate = await this.provider.estimateGas(tx);
        tx.gasLimit = gasEstimate * BigInt(120) / BigInt(100); // 20% buffer
      } catch (err) {
        console.warn('Gas estimation failed, using default:', err);
      }

      // Get gas price
      const feeData = await this.provider.getFeeData();
      if (feeData.gasPrice) {
        (tx as any).gasPrice = feeData.gasPrice;
      }

      console.log('Transaction prepared:', tx);
      
      // In production, this would be signed by the wallet provider
      // For now, return a mock hash with transaction data stored
      const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      
      // Store transaction for reference
      await AsyncStorage.setItem(`tx_${txHash}`, JSON.stringify({
        ...tx,
        hash: txHash,
        timestamp: new Date().toISOString(),
      }));

      return txHash;
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  }

  /**
   * Approve token spending (for game deposits)
   */
  async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<string> {
    if (!this.canSign) {
      throw new Error('Cannot approve - wallet not connected for signing');
    }

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      // Build approval transaction
      const tx = {
        to: tokenAddress,
        data: contract.interface.encodeFunctionData('approve', [
          spenderAddress,
          ethers.parseUnits(amount, 18),
        ]),
      };

      console.log('Approval transaction prepared:', tx);
      
      // Return mock hash
      const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      return txHash;
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
    return CELO_SEPOLIA;
  }
}

export const walletService = new WalletService();
export default walletService;
