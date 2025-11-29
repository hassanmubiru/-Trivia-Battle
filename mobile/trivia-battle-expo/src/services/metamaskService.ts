import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WalletInfo {
  address: string;
  chainId: number;
  isConnected: boolean;
}

/**
 * Direct MetaMask Mobile connection service
 * Uses MetaMask's injected provider for real wallet access
 */
export class MetaMaskService {
  private signer: ethers.Signer | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private address: string | null = null;
  private chainId: number = 11142220; // Celo Sepolia
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeProvider();
  }

  /**
   * Initialize ethers provider from MetaMask
   */
  private initializeProvider(): void {
    try {
      // In React Native with MetaMask Mobile, the injected provider is available
      const window = global as any;
      
      if (window.ethereum) {
        console.log('[MetaMask] Injected provider detected');
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.setupEventListeners();
      } else {
        console.warn('[MetaMask] No injected provider found');
      }
    } catch (error) {
      console.error('[MetaMask] Provider initialization error:', error);
    }
  }

  /**
   * Initialize the service (load provider)
   */
  async initialize(): Promise<void> {
    try {
      console.log('[MetaMask] Initializing...');
      
      // Check if we have a cached session
      await this.restoreSession();
      
      console.log('[MetaMask] Initialized successfully');
    } catch (error) {
      console.error('[MetaMask] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Connect to MetaMask wallet
   * Prompts user to connect their MetaMask account
   */
  async connect(): Promise<WalletInfo> {
    if (!this.provider) {
      // If provider not available, try opening MetaMask app
      this.openMetaMaskApp();
      throw new Error(
        'MetaMask provider not available. Opening MetaMask app...'
      );
    }

    try {
      console.log('[MetaMask] Requesting accounts...');
      
      // Request account access - this shows MetaMask permission dialog
      const accounts = await (this.provider as any).ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned. User may have rejected the request.');
      }

      this.address = accounts[0];
      console.log('[MetaMask] Connected to:', this.address);

      // Get current chain ID
      const chainIdHex = await (this.provider as any).ethereum.request({
        method: 'eth_chainId',
      }) as string;
      
      this.chainId = parseInt(chainIdHex, 16);
      console.log('[MetaMask] Current chain ID:', this.chainId);

      // Setup signer
      this.signer = await this.provider.getSigner();

      const walletInfo: WalletInfo = {
        address: this.address,
        chainId: this.chainId,
        isConnected: true,
      };

      // Save session
      await this.saveSession(walletInfo);

      this.emit('connected', walletInfo);
      return walletInfo;
    } catch (error: any) {
      console.error('[MetaMask] Connection error:', error);
      
      // Check if MetaMask is installed
      if (error.message?.includes('MetaMask')) {
        this.emit('error', new Error('MetaMask Mobile is not installed. Please install it from your app store.'));
      } else {
        this.emit('error', error);
      }
      
      throw error;
    }
  }

  /**
   * Disconnect from wallet
   */
  async disconnect(): Promise<void> {
    try {
      console.log('[MetaMask] Disconnecting...');
      
      this.address = null;
      this.signer = null;
      this.provider = null;

      // Clear saved session
      await AsyncStorage.removeItem('metamask_session');

      console.log('[MetaMask] Disconnected');
      this.emit('disconnected', null);
    } catch (error) {
      console.error('[MetaMask] Disconnect error:', error);
      throw error;
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.address !== null && this.signer !== null;
  }

  /**
   * Get wallet address
   */
  getAddress(): string | null {
    return this.address;
  }

  /**
   * Get current chain ID
   */
  getChainId(): number {
    return this.chainId;
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.signer || !this.address) {
      throw new Error('Not connected to MetaMask');
    }

    try {
      console.log('[MetaMask] Signing message...');
      const signature = await this.signer.signMessage(message);
      console.log('[MetaMask] Message signed successfully');
      return signature;
    } catch (error) {
      console.error('[MetaMask] Message signing error:', error);
      throw error;
    }
  }

  /**
   * Send a transaction
   */
  async sendTransaction(
    to: string,
    value: string,
    data?: string
  ): Promise<string> {
    if (!this.signer || !this.address || !this.provider) {
      throw new Error('Not connected to MetaMask');
    }

    try {
      console.log('[MetaMask] Sending transaction...');
      
      // Validate address
      if (!ethers.isAddress(to)) {
        throw new Error('Invalid recipient address');
      }

      const tx = await this.signer.sendTransaction({
        to: to,
        value: ethers.parseEther(value),
        data: data || '0x',
      });

      console.log('[MetaMask] Transaction sent:', tx.hash);
      return tx.hash;
    } catch (error) {
      console.error('[MetaMask] Transaction error:', error);
      throw error;
    }
  }

  /**
   * Get CELO balance
   */
  async getBalance(): Promise<string> {
    if (!this.address || !this.provider) {
      throw new Error('Not connected to MetaMask');
    }

    try {
      const balance = await this.provider.getBalance(this.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('[MetaMask] Balance fetch error:', error);
      throw error;
    }
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(tokenAddress: string, decimals: number = 18): Promise<string> {
    if (!this.address || !this.provider) {
      throw new Error('Not connected to MetaMask');
    }

    try {
      const erc20Abi = [
        'function balanceOf(address account) view returns (uint256)',
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, this.provider);
      const balance = await contract.balanceOf(this.address);
      
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('[MetaMask] Token balance error:', error);
      throw error;
    }
  }

  /**
   * Switch network to Celo Sepolia
   */
  async switchNetwork(): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      console.log('[MetaMask] Switching to Celo Sepolia...');
      
      await (this.provider as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2ae28' }], // 11142220 in hex
      });

      console.log('[MetaMask] Switched to Celo Sepolia');
      this.chainId = 11142220;
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not found, add it
        await this.addNetwork();
      } else {
        console.error('[MetaMask] Network switch error:', error);
        throw error;
      }
    }
  }

  /**
   * Add Celo Sepolia network to MetaMask
   */
  private async addNetwork(): Promise<void> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      console.log('[MetaMask] Adding Celo Sepolia network...');
      
      await (this.provider as any).ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x2ae28', // 11142220 in hex
            chainName: 'Celo Sepolia Testnet',
            rpcUrls: ['https://celo-sepolia-rpc.publicnode.com'],
            blockExplorerUrls: ['https://sepolia.celoscan.io'],
            nativeCurrency: {
              name: 'CELO',
              symbol: 'CELO',
              decimals: 18,
            },
          },
        ],
      });

      console.log('[MetaMask] Network added successfully');
    } catch (error) {
      console.error('[MetaMask] Add network error:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for MetaMask events
   */
  private setupEventListeners(): void {
    if (!this.provider) return;

    const ethereum = (this.provider as any).ethereum;

    if (ethereum?.on) {
      ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('[MetaMask] Accounts changed:', accounts);
        this.address = accounts[0] || null;
        this.emit('accountsChanged', accounts);
      });

      ethereum.on('chainChanged', (chainId: string) => {
        console.log('[MetaMask] Chain changed:', chainId);
        this.chainId = parseInt(chainId, 16);
        this.emit('chainChanged', this.chainId);
      });

      ethereum.on('disconnect', () => {
        console.log('[MetaMask] Disconnected');
        this.address = null;
        this.signer = null;
        this.emit('disconnected', null);
      });

      ethereum.on('connect', () => {
        console.log('[MetaMask] Connected');
      });
    }
  }

  /**
   * Save session to AsyncStorage
   */
  private async saveSession(walletInfo: WalletInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'metamask_session',
        JSON.stringify({
          ...walletInfo,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('[MetaMask] Failed to save session:', error);
    }
  }

  /**
   * Restore previous session
   */
  private async restoreSession(): Promise<void> {
    try {
      const session = await AsyncStorage.getItem('metamask_session');
      if (session) {
        const data = JSON.parse(session);
        const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000; // 24h
        
        if (!isExpired && this.provider) {
          console.log('[MetaMask] Restoring previous session...');
          this.address = data.address;
          this.chainId = data.chainId;
          this.signer = await this.provider.getSigner();
        }
      }
    } catch (error) {
      console.error('[MetaMask] Failed to restore session:', error);
    }
  }

  /**
   * Open MetaMask Mobile app
   */
  private openMetaMaskApp(): void {
    try {
      // In React Native with MetaMask, the app should already be available
      // This is just a fallback message
      console.log('[MetaMask] Please use your MetaMask app to complete the transaction');
    } catch (error) {
      console.error('[MetaMask] Error:', error);
    }
  }

  /**
   * Event emitter
   */
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    if (!this.listeners.has(event)) return;
    const listeners = this.listeners.get(event)!;
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  private emit(event: string, data: any): void {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`[MetaMask] Error in ${event} listener:`, error);
      }
    });
  }
}

// Singleton factory
let metaMaskService: MetaMaskService | null = null;

export function getMetaMaskService(): MetaMaskService {
  if (!metaMaskService) {
    metaMaskService = new MetaMaskService();
  }
  return metaMaskService;
}
