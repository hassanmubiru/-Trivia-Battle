import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WalletInfo {
  address: string;
  chainId: number;
  isConnected: boolean;
}

/**
 * Direct MetaMask Mobile connection service
 * Works with MetaMask Mobile's injected ethereum provider
 */
export class MetaMaskService {
  private ethereum: any = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private address: string | null = null;
  private chainId: number = 44787; // Celo Sepolia
  private listeners: Map<string, Function[]> = new Map();
  private rpcUrl: string = 'https://celo-sepolia.drpc.org';

  constructor() {
    // Don't initialize provider in constructor - use lazy initialization
    // This prevents RPC calls on app startup before wallet connection
  }

  /**
   * Get or create provider lazily
   */
  private getOrCreateProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      // Try to get injected ethereum from MetaMask Mobile
      const globalObj = global as any;
      
      if (globalObj.ethereum) {
        console.log('[MetaMask] Injected provider detected');
        this.ethereum = globalObj.ethereum;
        this.setupEventListeners();
      } else {
        console.log('[MetaMask] No injected provider, using JSON-RPC');
      }

      // Create a JSON-RPC provider with staticNetwork to prevent auto-detection
      this.provider = new ethers.JsonRpcProvider(
        this.rpcUrl, 
        { chainId: this.chainId, name: 'Celo Sepolia' },
        { staticNetwork: true }
      );

      console.log('[MetaMask] Provider initialized with RPC endpoint (lazy)');
    }
    return this.provider;
  }

  /**
   * Initialize provider from MetaMask or create JSON-RPC provider
   * @deprecated Use getOrCreateProvider() for lazy initialization
   */
  private initializeProvider(): void {
    this.getOrCreateProvider();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      console.log('[MetaMask] Initializing service...');

      if (!this.provider) {
        this.initializeProvider();
      }

      // Try to restore previous session
      await this.restoreSession();

      console.log('[MetaMask] Initialization complete');
    } catch (error) {
      console.error('[MetaMask] Initialization error:', error);
    }
  }

  /**
   * Connect to MetaMask wallet
   * Shows permission dialog if no injected provider
   */
  async connect(useDemoMode: boolean = false): Promise<WalletInfo> {
    try {
      console.log('[MetaMask] Starting connection...');

      // If no ethereum provider and not in demo mode, throw error
      if (!this.ethereum && !useDemoMode) {
        console.warn('[MetaMask] No provider found. Try using demo mode for testing.');
        throw new Error(
          'MetaMask provider not found. Please ensure MetaMask Mobile is installed and the app is opened from within MetaMask.'
        );
      }

      // Demo mode for testing without MetaMask
      if (useDemoMode) {
        console.log('[MetaMask] Using DEMO mode (for testing only)');
        this.address = '0x1234567890123456789012345678901234567890'; // Test address
        this.chainId = 11142220;
        
        const walletInfo: WalletInfo = {
          address: this.address,
          chainId: this.chainId,
          isConnected: true,
        };

        // Save session
        await this.saveSession(walletInfo);
        this.emit('connected', walletInfo);
        return walletInfo;
      }

      // Request accounts from injected ethereum provider
      console.log('[MetaMask] Requesting accounts...');
      const accounts = (await this.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned. User may have rejected the request.');
      }

      this.address = accounts[0];
      console.log('[MetaMask] Connected to account:', this.address);

      // Get chain ID
      const chainIdHex = await this.ethereum.request({
        method: 'eth_chainId',
      }) as string;

      this.chainId = parseInt(chainIdHex, 16);
      console.log('[MetaMask] Connected to chain:', this.chainId);

      // Create a signer from the provider
      if (this.provider) {
        this.signer = await this.provider.getSigner();
      }

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
      this.emit('error', error);
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
    if (!this.ethereum || !this.address) {
      throw new Error('Not connected to MetaMask');
    }

    try {
      console.log('[MetaMask] Signing message...');

      // Sign message using eth_sign
      const signature = await this.ethereum.request({
        method: 'personal_sign',
        params: [message, this.address],
      }) as string;

      console.log('[MetaMask] Message signed');
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
    if (!this.ethereum || !this.address) {
      throw new Error('Not connected to MetaMask');
    }

    try {
      console.log('[MetaMask] Sending transaction...');

      // Validate address
      if (!ethers.isAddress(to)) {
        throw new Error('Invalid recipient address');
      }

      const valueInWei = ethers.parseEther(value);

      // Send transaction via injected ethereum
      const txHash = await this.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: this.address,
            to: to,
            value: ethers.toBeHex(valueInWei),
            data: data || '0x',
          },
        ],
      }) as string;

      console.log('[MetaMask] Transaction sent:', txHash);
      return txHash;
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
    if (!this.ethereum) {
      throw new Error('Provider not initialized');
    }

    try {
      console.log('[MetaMask] Switching to Celo Sepolia...');

      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x2ae28' }], // 11142220 in hex
      });

      this.chainId = 11142220;
      console.log('[MetaMask] Switched to Celo Sepolia');
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
    if (!this.ethereum) {
      throw new Error('Provider not initialized');
    }

    try {
      console.log('[MetaMask] Adding Celo Sepolia network...');

      await this.ethereum.request({
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
    if (!this.ethereum) return;

    if (this.ethereum.on) {
      this.ethereum.on('accountsChanged', (accounts: string[]) => {
        console.log('[MetaMask] Accounts changed:', accounts);
        this.address = accounts[0] || null;
        this.emit('accountsChanged', accounts);
      });

      this.ethereum.on('chainChanged', (chainId: string) => {
        console.log('[MetaMask] Chain changed:', chainId);
        this.chainId = parseInt(chainId, 16);
        this.emit('chainChanged', this.chainId);
      });

      this.ethereum.on('disconnect', () => {
        console.log('[MetaMask] Disconnected');
        this.address = null;
        this.signer = null;
        this.emit('disconnected', null);
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

        if (!isExpired) {
          console.log('[MetaMask] Restoring previous session...');
          this.address = data.address;
          this.chainId = data.chainId;
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
