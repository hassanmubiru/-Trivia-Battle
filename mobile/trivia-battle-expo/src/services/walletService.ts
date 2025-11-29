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

interface InjectedProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  isMetaMask?: boolean;
  isMiniPay?: boolean;
  on?: (event: string, handler: (...args: any[]) => void) => void;
}

class WalletService {
  private provider: ethers.JsonRpcProvider | ethers.BrowserProvider;
  private walletAddress: string | null = null;
  private connectionType: 'walletconnect' | 'manual' | 'none' = 'none';
  private canSign: boolean = false;
  private signer: ethers.Signer | null = null;
  private injectedProvider: InjectedProvider | null = null;

  constructor() {
    // Initialize read-only provider by default
    this.provider = new ethers.JsonRpcProvider(
      CELO_SEPOLIA.rpcUrl,
      { chainId: CELO_SEPOLIA.chainId, name: CELO_SEPOLIA.name }
    );
  }

  /**
   * Check if wallet provider is available (MetaMask, MiniPay, etc.)
   */
  hasInjectedProvider(): boolean {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return true;
    }
    return false;
  }

  /**
   * Request account connection from injected provider
   */
  async requestAccount(): Promise<string> {
    if (!this.hasInjectedProvider()) {
      throw new Error('No Web3 wallet provider detected. Please install MetaMask or use MiniPay.');
    }

    try {
      const injected = (window as any).ethereum as InjectedProvider;
      const accounts = await injected.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      return accounts[0];
    } catch (error: any) {
      if (error.code === 4001) {
        throw new Error('User rejected the connection request');
      }
      throw error;
    }
  }

  /**
   * Connect with injected provider (MetaMask, MiniPay, etc.)
   * This enables real signing capability
   */
  async connectWithProvider(): Promise<WalletInfo> {
    try {
      const address = await this.requestAccount();
      
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid wallet address returned from provider');
      }

      const injected = (window as any).ethereum as InjectedProvider;
      this.provider = new ethers.BrowserProvider(injected);
      this.signer = await this.provider.getSigner();
      this.walletAddress = address;
      this.injectedProvider = injected;
      
      // Determine connection type
      if (injected.isMiniPay) {
        this.connectionType = 'walletconnect';
      } else if (injected.isMetaMask) {
        this.connectionType = 'walletconnect';
      } else {
        this.connectionType = 'walletconnect';
      }
      
      this.canSign = true;
      
      await AsyncStorage.setItem('walletAddress', address);
      await AsyncStorage.setItem('connectionType', this.connectionType);
      await AsyncStorage.setItem('hasRealSigner', 'true');

      const balances = await this.getBalances();

      return {
        address,
        isConnected: true,
        connectionType: this.connectionType,
        canSign: true,
        balances,
      };
    } catch (error) {
      // Don't log as error since this is expected when no wallet is available
      throw error;
    }
  }

  /**
   * Generate WalletConnect deep link for MetaMask (fallback if no injection)
   */
  generateMetaMaskLink(): { deepLink: string; projectId: string } {
    const projectId = '2aca272d18deb10ff748260da5f78bfd';
    const deepLink = `metamask://wc?projectId=${projectId}`;
    return { deepLink, projectId };
  }

  /**
   * Connect with MetaMask via injected provider
   * This is now the preferred method when MetaMask is available
   */
  async connectMetaMask(address?: string): Promise<WalletInfo> {
    // Try to connect via injected provider first
    if (this.hasInjectedProvider()) {
      try {
        return await this.connectWithProvider();
      } catch (error) {
        console.warn('Failed to connect via injected provider:', error);
        // Fall through to manual address method if provided
      }
    }

    // Fallback: use provided address if given
    if (address) {
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid wallet address');
      }

      this.walletAddress = address;
      this.connectionType = 'walletconnect';
      this.canSign = false; // Can't sign without injected provider
      this.signer = null;
      
      await AsyncStorage.setItem('walletAddress', address);
      await AsyncStorage.setItem('connectionType', 'walletconnect');
      await AsyncStorage.removeItem('hasRealSigner');

      const balances = await this.getBalances();

      return {
        address,
        isConnected: true,
        connectionType: 'walletconnect',
        canSign: false,
        balances,
      };
    }

    throw new Error('No wallet provider available and no address provided');
  }

  /**
   * Restore previous connection
   * If connected with real signer, attempt to reconnect with provider
   */
  async restoreConnection(): Promise<WalletInfo | null> {
    try {
      const address = await AsyncStorage.getItem('walletAddress');
      const type = (await AsyncStorage.getItem('connectionType')) as 'walletconnect' | 'manual' | null;
      const hasRealSigner = await AsyncStorage.getItem('hasRealSigner');

      if (address && ethers.isAddress(address)) {
        this.walletAddress = address;
        this.connectionType = type || 'manual';
        
        // Try to restore signer if previously connected with provider
        if (hasRealSigner === 'true' && this.hasInjectedProvider()) {
          try {
            const injected = (window as any).ethereum as InjectedProvider;
            this.provider = new ethers.BrowserProvider(injected);
            this.signer = await this.provider.getSigner();
            this.canSign = true;
            this.injectedProvider = injected;
          } catch (error) {
            console.warn('Could not restore provider connection:', error);
            this.canSign = false;
            this.signer = null;
          }
        } else {
          this.canSign = false;
          this.signer = null;
        }
        
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
      // Expected if no previous connection exists
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
      console.warn('Error fetching balances:', error);
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
   * Send transaction with real signing via provider
   * Throws error if wallet doesn't support signing
   */
  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    if (!this.canSign || !this.signer) {
      throw new Error('Wallet connected in read-only mode. Cannot sign transactions. Please connect with MetaMask or MiniPay for transaction support.');
    }

    if (!this.walletAddress) {
      throw new Error('No wallet address set');
    }

    try {
      // Build transaction
      const tx = {
        to,
        value: ethers.parseEther(value),
        data: data || '0x',
      };

      // Send transaction via signer
      const txResponse = await this.signer.sendTransaction(tx);
      console.log('Transaction sent:', txResponse.hash);
      
      // Wait for confirmation
      const receipt = await txResponse.wait();
      if (!receipt) {
        throw new Error('Transaction failed - no receipt');
      }

      console.log('Transaction confirmed:', receipt.hash);
      return receipt.hash;
    } catch (error: any) {
      console.warn('Transaction error:', error);
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('User rejected the transaction');
      }
      throw error;
    }
  }

  /**
   * Approve token spending with real signing
   * Throws error if wallet doesn't support signing
   */
  async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<string> {
    if (!this.canSign || !this.signer) {
      throw new Error('Wallet connected in read-only mode. Cannot sign transactions. Please connect with MetaMask or MiniPay.');
    }

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      
      // Send approval transaction via signer
      const tx = await contract.approve(spenderAddress, ethers.parseUnits(amount, 18));
      console.log('Approval transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      if (!receipt) {
        throw new Error('Approval failed - no receipt');
      }

      console.log('Approval confirmed:', receipt.hash);
      return receipt.hash;
    } catch (error: any) {
      console.warn('Approval error:', error);
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('User rejected the approval');
      }
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
   * Get provider (read-only or with signer)
   */
  getProvider(): ethers.JsonRpcProvider | ethers.BrowserProvider {
    return this.provider;
  }

  /**
   * Get signer for direct contract interactions
   */
  getSigner(): ethers.Signer | null {
    return this.signer;
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
