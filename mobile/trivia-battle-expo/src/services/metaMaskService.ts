/**
 * Advanced MetaMask Wallet Connection Service
 * Production-grade with stability, security, and error handling
 * 
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Comprehensive error logging
 * - Connection state management
 * - Security best practices
 * - Event handling and monitoring
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types and Interfaces
export interface MetaMaskConfig {
  maxRetries: number;
  retryDelay: number;
  retryBackoffMultiplier: number;
  connectionTimeout: number;
  enableDebugLogging: boolean;
}

export interface WalletConnection {
  address: string;
  isConnected: boolean;
  canSign: boolean;
  network: {
    chainId: number;
    name: string;
    rpcUrl: string;
  };
  balance: {
    CELO: string;
    cUSD: string;
    USDC: string;
    USDT: string;
  };
  lastConnectedAt: number;
}

export interface ConnectionError {
  code: string;
  message: string;
  timestamp: number;
  retryCount: number;
}

export interface InjectedProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  isMetaMask?: boolean;
  isMiniPay?: boolean;
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
}

// Default Configuration
const DEFAULT_CONFIG: MetaMaskConfig = {
  maxRetries: 5,
  retryDelay: 1000, // 1 second
  retryBackoffMultiplier: 1.5,
  connectionTimeout: 30000, // 30 seconds
  enableDebugLogging: __DEV__,
};

// Celo Sepolia Network Configuration
const CELO_SEPOLIA = {
  chainId: 44787,
  chainIdHex: '0xaef3',
  name: 'Celo Sepolia Testnet',
  rpcUrl: 'https://celo-sepolia.drpc.org',
  blockExplorer: 'https://celo-sepolia.blockscout.com',
  symbol: 'CELO',
  decimals: 18,
};

// Token Addresses on Celo Sepolia
const TOKENS = {
  cUSD: {
    address: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
    decimals: 18,
    symbol: 'cUSD',
  },
  USDC: {
    address: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B',
    decimals: 6,
    symbol: 'USDC',
  },
  USDT: {
    address: '0xE4D517785D091D3c54818832dB6094bcc2744545',
    decimals: 6,
    symbol: 'USDT',
  },
};

// Logger with timestamp and levels
class Logger {
  private enableDebug: boolean;

  constructor(enableDebug: boolean = false) {
    this.enableDebug = enableDebug;
  }

  info(tag: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] [INFO] [${tag}] ${message}`;
    console.log(log, data ? data : '');
  }

  warn(tag: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] [WARN] [${tag}] ${message}`;
    console.warn(log, data ? data : '');
  }

  error(tag: string, message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] [ERROR] [${tag}] ${message}`;
    console.error(log, error ? error : '');
  }

  debug(tag: string, message: string, data?: any): void {
    if (this.enableDebug) {
      const timestamp = new Date().toISOString();
      const log = `[${timestamp}] [DEBUG] [${tag}] ${message}`;
      console.log(log, data ? data : '');
    }
  }
}

class MetaMaskWalletService {
  private _readOnlyProvider: ethers.JsonRpcProvider | null = null;
  private provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private walletAddress: string | null = null;
  private injectedProvider: InjectedProvider | null = null;
  private config: MetaMaskConfig;
  private logger: Logger;
  private connectionState: WalletConnection | null = null;
  private retryCount: number = 0;
  private isConnecting: boolean = false;
  private connectionError: ConnectionError | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private chainChangeListener: ((chainId: string) => void) | null = null;
  private accountChangeListener: ((accounts: string[]) => void) | null = null;

  constructor(config: Partial<MetaMaskConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new Logger(this.config.enableDebugLogging);
    // Don't initialize provider in constructor - use lazy initialization
  }

  /**
   * Get or create read-only provider (lazy initialization)
   */
  private getReadOnlyProvider(): ethers.JsonRpcProvider {
    if (!this._readOnlyProvider) {
      this._readOnlyProvider = new ethers.JsonRpcProvider(
        CELO_SEPOLIA.rpcUrl,
        { chainId: CELO_SEPOLIA.chainId, name: CELO_SEPOLIA.name },
        { staticNetwork: true }
      );
      this.logger.debug('MetaMask', 'Read-only provider initialized (lazy)');
    }
    return this._readOnlyProvider;
  }

  /**
   * Check if MetaMask or Web3 wallet is available
   */
  isWalletAvailable(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    const hasProvider = !!(window as any).ethereum;
    this.logger.debug('MetaMask', 'Wallet availability check', { available: hasProvider });
    return hasProvider;
  }

  /**
   * Detect wallet type (MetaMask, MiniPay, etc.)
   */
  detectWalletType(): string {
    if (!this.isWalletAvailable()) {
      return 'none';
    }
    const ethereum = (window as any).ethereum;
    if (ethereum.isMiniPay) return 'minipay';
    if (ethereum.isMetaMask) return 'metamask';
    return 'generic-web3';
  }

  /**
   * Connect to MetaMask with retry logic
   */
  async connect(forceRefresh: boolean = false): Promise<WalletConnection> {
    if (this.isConnecting && !forceRefresh) {
      this.logger.warn('MetaMask', 'Connection already in progress');
      throw new Error('Connection already in progress');
    }

    this.isConnecting = true;
    this.retryCount = 0;

    try {
      return await this.attemptConnection();
    } catch (error) {
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Attempt connection with retry logic
   */
  private async attemptConnection(): Promise<WalletConnection> {
    while (this.retryCount < this.config.maxRetries) {
      try {
        this.logger.info('MetaMask', `Connection attempt ${this.retryCount + 1}/${this.config.maxRetries}`);

        // Check wallet availability
        if (!this.isWalletAvailable()) {
          throw new Error('MetaMask or Web3 wallet not available');
        }

        // Get accounts
        const accounts = await this.requestAccounts();
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found');
        }

        const address = accounts[0];
        if (!ethers.isAddress(address)) {
          throw new Error('Invalid wallet address');
        }

        // Setup provider and signer
        const ethereum = (window as any).ethereum as InjectedProvider;
        this.injectedProvider = ethereum;
        this.provider = new ethers.BrowserProvider(ethereum);
        this.signer = await this.provider.getSigner();
        this.walletAddress = address;

        // Verify network
        const network = await this.provider.getNetwork();
        if (network.chainId !== BigInt(CELO_SEPOLIA.chainId)) {
          this.logger.warn('MetaMask', 'Wrong network detected', { chainId: network.chainId });
          await this.switchNetwork();
        }

        // Fetch balances
        const balance = await this.getBalances();

        // Create connection state
        this.connectionState = {
          address,
          isConnected: true,
          canSign: true,
          network: {
            chainId: CELO_SEPOLIA.chainId,
            name: CELO_SEPOLIA.name,
            rpcUrl: CELO_SEPOLIA.rpcUrl,
          },
          balance,
          lastConnectedAt: Date.now(),
        };

        // Setup event listeners
        this.setupEventListeners();

        // Save to storage
        await this.saveConnectionState();

        this.logger.info('MetaMask', 'Wallet connected successfully', { address });
        this.emit('connected', this.connectionState);
        this.isConnecting = false;

        return this.connectionState;
      } catch (error: any) {
        this.retryCount++;
        const delay = this.calculateBackoffDelay();

        if (this.retryCount < this.config.maxRetries) {
          this.logger.warn('MetaMask', `Connection failed, retrying in ${delay}ms`, error.message);
          await this.sleep(delay);
        } else {
          this.logger.error('MetaMask', 'Max retries exceeded', error);
          this.connectionError = {
            code: error.code || 'UNKNOWN_ERROR',
            message: error.message || 'Connection failed',
            timestamp: Date.now(),
            retryCount: this.retryCount,
          };
          this.emit('error', this.connectionError);
          throw error;
        }
      }
    }

    throw new Error('Failed to connect wallet');
  }

  /**
   * Request accounts from wallet
   */
  private async requestAccounts(): Promise<string[]> {
    const timeout = this.config.connectionTimeout;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection timeout')), timeout)
    );

    const ethereum = (window as any).ethereum as InjectedProvider;
    const accountsPromise = ethereum.request({ method: 'eth_requestAccounts' });

    return Promise.race([accountsPromise, timeoutPromise]);
  }

  /**
   * Switch to Celo Sepolia network
   */
  private async switchNetwork(): Promise<void> {
    try {
      const ethereum = (window as any).ethereum as InjectedProvider;
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CELO_SEPOLIA.chainIdHex }],
      });
      this.logger.info('MetaMask', 'Network switched successfully');
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, try to add it
        await this.addNetwork();
      } else {
        throw error;
      }
    }
  }

  /**
   * Add Celo Sepolia network to wallet
   */
  private async addNetwork(): Promise<void> {
    try {
      const ethereum = (window as any).ethereum as InjectedProvider;
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: CELO_SEPOLIA.chainIdHex,
            chainName: CELO_SEPOLIA.name,
            rpcUrls: [CELO_SEPOLIA.rpcUrl],
            blockExplorerUrls: [CELO_SEPOLIA.blockExplorer],
            nativeCurrency: {
              name: CELO_SEPOLIA.symbol,
              symbol: CELO_SEPOLIA.symbol,
              decimals: CELO_SEPOLIA.decimals,
            },
          },
        ],
      });
      this.logger.info('MetaMask', 'Network added successfully');
    } catch (error) {
      this.logger.error('MetaMask', 'Failed to add network', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for account/chain changes
   */
  private setupEventListeners(): void {
    if (!this.injectedProvider) {
      return;
    }

    // Account change listener
    this.accountChangeListener = (accounts: string[]) => {
      if (accounts.length === 0) {
        this.logger.info('MetaMask', 'Wallet disconnected');
        this.disconnect();
        this.emit('disconnected', null);
      } else if (accounts[0] !== this.walletAddress) {
        this.logger.info('MetaMask', 'Account changed', { account: accounts[0] });
        this.walletAddress = accounts[0];
        this.emit('accountChanged', accounts[0]);
      }
    };

    // Chain change listener
    this.chainChangeListener = (chainId: string) => {
      this.logger.info('MetaMask', 'Chain changed', { chainId });
      this.emit('chainChanged', chainId);
    };

    if (this.injectedProvider.on) {
      this.injectedProvider.on('accountsChanged', this.accountChangeListener);
      this.injectedProvider.on('chainChanged', this.chainChangeListener);
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    try {
      // Remove event listeners
      if (this.injectedProvider && this.injectedProvider.removeListener) {
        if (this.accountChangeListener) {
          this.injectedProvider.removeListener('accountsChanged', this.accountChangeListener);
        }
        if (this.chainChangeListener) {
          this.injectedProvider.removeListener('chainChanged', this.chainChangeListener);
        }
      }

      // Clear state
      this.provider = null;
      this.signer = null;
      this.walletAddress = null;
      this.injectedProvider = null;
      this.connectionState = null;
      this.connectionError = null;

      // Clear storage
      await AsyncStorage.removeItem('walletConnection');

      this.logger.info('MetaMask', 'Wallet disconnected');
      this.emit('disconnected', null);
    } catch (error) {
      this.logger.error('MetaMask', 'Error during disconnect', error);
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): WalletConnection | null {
    return this.connectionState;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.connectionState !== null && this.connectionState.isConnected;
  }

  /**
   * Get wallet address
   */
  getAddress(): string | null {
    return this.walletAddress;
  }

  /**
   * Get balances for all tokens
   */
  async getBalances(): Promise<{ CELO: string; cUSD: string; USDC: string; USDT: string }> {
    try {
      if (!this.walletAddress || !this.provider) {
        return { CELO: '0', cUSD: '0', USDC: '0', USDT: '0' };
      }

      const celoBalance = await this.provider.getBalance(this.walletAddress);
      const cusdBalance = await this.getTokenBalance(TOKENS.cUSD.address, TOKENS.cUSD.decimals);
      const usdcBalance = await this.getTokenBalance(TOKENS.USDC.address, TOKENS.USDC.decimals);
      const usdtBalance = await this.getTokenBalance(TOKENS.USDT.address, TOKENS.USDT.decimals);

      return {
        CELO: ethers.formatUnits(celoBalance, CELO_SEPOLIA.decimals),
        cUSD: cusdBalance,
        USDC: usdcBalance,
        USDT: usdtBalance,
      };
    } catch (error) {
      this.logger.warn('MetaMask', 'Failed to fetch balances', error);
      return { CELO: '0', cUSD: '0', USDC: '0', USDT: '0' };
    }
  }

  /**
   * Get balance for a specific ERC20 token
   */
  private async getTokenBalance(tokenAddress: string, decimals: number): Promise<string> {
    try {
      if (!this.walletAddress || !this.provider) {
        return '0';
      }

      const erc20Abi = [
        'function balanceOf(address account) view returns (uint256)',
        'function decimals() view returns (uint8)',
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
      const balance = await contract.balanceOf(this.walletAddress);

      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      this.logger.warn('MetaMask', `Failed to fetch token balance for ${tokenAddress}`, error);
      return '0';
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      this.logger.info('MetaMask', 'Sending transaction', { to, value });

      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(value),
        data,
      });

      this.logger.info('MetaMask', 'Transaction sent', { hash: tx.hash });
      return tx.hash;
    } catch (error: any) {
      this.logger.error('MetaMask', 'Transaction failed', error);
      throw error;
    }
  }

  /**
   * Sign message
   */
  async signMessage(message: string): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }

      this.logger.info('MetaMask', 'Signing message');
      const signature = await this.signer.signMessage(message);

      this.logger.info('MetaMask', 'Message signed successfully');
      return signature;
    } catch (error: any) {
      this.logger.error('MetaMask', 'Message signing failed', error);
      throw error;
    }
  }

  /**
   * Restore connection from storage
   */
  async restoreConnection(): Promise<WalletConnection | null> {
    try {
      const stored = await AsyncStorage.getItem('walletConnection');
      if (!stored) {
        return null;
      }

      const state = JSON.parse(stored) as WalletConnection;
      const isStale = Date.now() - state.lastConnectedAt > 24 * 60 * 60 * 1000; // 24 hours

      if (isStale) {
        await AsyncStorage.removeItem('walletConnection');
        return null;
      }

      // Verify connection is still valid
      if (this.isWalletAvailable()) {
        try {
          return await this.connect(true);
        } catch (error) {
          this.logger.warn('MetaMask', 'Failed to restore connection', error);
          return null;
        }
      }

      return null;
    } catch (error) {
      this.logger.error('MetaMask', 'Error restoring connection', error);
      return null;
    }
  }

  /**
   * Save connection state to storage
   */
  private async saveConnectionState(): Promise<void> {
    try {
      if (this.connectionState) {
        await AsyncStorage.setItem('walletConnection', JSON.stringify(this.connectionState));
      }
    } catch (error) {
      this.logger.warn('MetaMask', 'Failed to save connection state', error);
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoffDelay(): number {
    return Math.min(
      this.config.retryDelay * Math.pow(this.config.retryBackoffMultiplier, this.retryCount - 1),
      30000 // Max 30 seconds
    );
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Event emitter utilities
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          this.logger.error('MetaMask', `Error in event listener for ${event}`, error);
        }
      });
    }
  }

  /**
   * Get error information
   */
  getLastError(): ConnectionError | null {
    return this.connectionError;
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.connectionError = null;
  }

  /**
   * Get connection stats
   */
  getStats(): {
    isConnected: boolean;
    retryCount: number;
    lastError: ConnectionError | null;
    connectionDuration: number | null;
  } {
    return {
      isConnected: this.isConnected(),
      retryCount: this.retryCount,
      lastError: this.connectionError,
      connectionDuration: this.connectionState
        ? Date.now() - this.connectionState.lastConnectedAt
        : null,
    };
  }
}

// Create singleton instance
let metaMaskInstance: MetaMaskWalletService | null = null;

export function getMetaMaskService(config?: Partial<MetaMaskConfig>): MetaMaskWalletService {
  if (!metaMaskInstance) {
    metaMaskInstance = new MetaMaskWalletService(config);
  }
  return metaMaskInstance;
}

export default MetaMaskWalletService;
