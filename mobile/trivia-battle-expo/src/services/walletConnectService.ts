import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WalletInfo {
  address: string;
  chainId: number;
  isConnected: boolean;
}

export class WalletConnectService {
  private provider: EthereumProvider | null = null;
  private signer: ethers.Signer | null = null;
  private address: string | null = null;
  private projectId: string;
  private chains: number[];
  private listeners: Map<string, Function[]> = new Map();

  constructor(projectId: string, chains: number[] = [11142220]) {
    if (!projectId) {
      throw new Error(
        'WalletConnect projectId is required. Get it from https://cloud.walletconnect.com'
      );
    }
    this.projectId = projectId;
    this.chains = chains;
  }

  /**
   * Initialize WalletConnect provider
   */
  async initialize(): Promise<void> {
    try {
      console.log('[WalletConnect] Initializing with project ID...');
      
      this.provider = await EthereumProvider.init({
        projectId: this.projectId,
        chains: this.chains,
        methods: [
          'eth_sendTransaction',
          'eth_signMessage',
          'personal_sign',
          'eth_sign',
          'eth_signTypedData',
        ],
        events: ['chainChanged', 'accountsChanged', 'session_update'],
        showQrModal: true,
        rpcMap: {
          11142220: 'https://celo-sepolia-rpc.publicnode.com',
        },
      });

      this.setupEventListeners();
      
      // Try to restore previous session
      await this.restoreSession();
      
      console.log('[WalletConnect] Initialized successfully');
    } catch (error) {
      console.error('[WalletConnect] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Connect to wallet via QR code
   */
  async connect(): Promise<WalletInfo> {
    if (!this.provider) {
      throw new Error('WalletConnect not initialized. Call initialize() first.');
    }

    try {
      console.log('[WalletConnect] Connecting...');
      
      const accounts = (await this.provider.request({
        method: 'eth_requestAccounts',
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from wallet');
      }

      this.address = accounts[0];

      // Setup ethers provider
      const ethersProvider = new ethers.BrowserProvider(this.provider as any);
      this.signer = await ethersProvider.getSigner();

      // Get current chain
      const network = await ethersProvider.getNetwork();

      const walletInfo: WalletInfo = {
        address: this.address,
        chainId: Number(network.chainId),
        isConnected: true,
      };

      // Save session
      await this.saveSession(walletInfo);

      console.log('[WalletConnect] Connected:', this.address);
      this.emit('connected', walletInfo);

      return walletInfo;
    } catch (error) {
      console.error('[WalletConnect] Connection error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect from wallet
   */
  async disconnect(): Promise<void> {
    if (!this.provider) return;

    try {
      console.log('[WalletConnect] Disconnecting...');
      
      await this.provider.disconnect();
      
      this.address = null;
      this.signer = null;

      // Clear saved session
      await AsyncStorage.removeItem('walletconnect_session');

      console.log('[WalletConnect] Disconnected');
      this.emit('disconnected', null);
    } catch (error) {
      console.error('[WalletConnect] Disconnect error:', error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.address !== null && this.provider?.connected === true;
  }

  /**
   * Get wallet address
   */
  getAddress(): string | null {
    return this.address;
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.signer || !this.address) {
      throw new Error('Not connected to wallet');
    }

    try {
      console.log('[WalletConnect] Signing message...');
      
      const signature = await this.signer.signMessage(message);
      
      console.log('[WalletConnect] Message signed successfully');
      return signature;
    } catch (error) {
      console.error('[WalletConnect] Message signing error:', error);
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
    if (!this.provider || !this.address) {
      throw new Error('Not connected to wallet');
    }

    try {
      console.log('[WalletConnect] Sending transaction...');
      
      // Validate address
      if (!ethers.isAddress(to)) {
        throw new Error('Invalid recipient address');
      }

      const txHash = (await this.provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: this.address,
            to: to,
            value: ethers.toBeHex(ethers.parseEther(value)),
            data: data || '0x',
          },
        ],
      })) as string;

      console.log('[WalletConnect] Transaction sent:', txHash);
      return txHash;
    } catch (error) {
      console.error('[WalletConnect] Transaction error:', error);
      throw error;
    }
  }

  /**
   * Get CELO balance
   */
  async getBalance(): Promise<string> {
    if (!this.address || !this.provider) {
      throw new Error('Not connected to wallet');
    }

    try {
      const ethersProvider = new ethers.BrowserProvider(this.provider as any);
      const balance = await ethersProvider.getBalance(this.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('[WalletConnect] Balance fetch error:', error);
      throw error;
    }
  }

  /**
   * Get token balance (ERC20)
   */
  async getTokenBalance(tokenAddress: string, decimals: number = 18): Promise<string> {
    if (!this.address || !this.provider) {
      throw new Error('Not connected to wallet');
    }

    try {
      const ethersProvider = new ethers.BrowserProvider(this.provider as any);

      // ERC20 ABI (only balanceOf method)
      const erc20Abi = [
        'function balanceOf(address account) view returns (uint256)',
      ];

      const contract = new ethers.Contract(tokenAddress, erc20Abi, ethersProvider);
      const balance = await contract.balanceOf(this.address);
      
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('[WalletConnect] Token balance error:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.provider) return;

    this.provider.on('accountsChanged', (accounts: string[]) => {
      console.log('[WalletConnect] Accounts changed:', accounts);
      this.address = accounts[0] || null;
      this.emit('accountsChanged', accounts);
    });

    this.provider.on('chainChanged', (chainId: string) => {
      console.log('[WalletConnect] Chain changed:', chainId);
      this.emit('chainChanged', parseInt(chainId));
    });

    this.provider.on('disconnect', () => {
      console.log('[WalletConnect] Disconnected');
      this.address = null;
      this.signer = null;
      this.emit('disconnected', null);
    });

    this.provider.on('connect', () => {
      console.log('[WalletConnect] Connected');
      this.emit('connected', { address: this.address });
    });
  }

  /**
   * Save session to AsyncStorage
   */
  private async saveSession(walletInfo: WalletInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'walletconnect_session',
        JSON.stringify({
          ...walletInfo,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('[WalletConnect] Failed to save session:', error);
    }
  }

  /**
   * Restore previous session
   */
  private async restoreSession(): Promise<void> {
    try {
      const session = await AsyncStorage.getItem('walletconnect_session');
      if (session) {
        const data = JSON.parse(session);
        const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000; // 24h
        
        if (!isExpired) {
          console.log('[WalletConnect] Restoring previous session...');
          // Try to reconnect if provider is still connected
          if (this.provider?.connected) {
            this.address = data.address;
            const ethersProvider = new ethers.BrowserProvider(this.provider as any);
            this.signer = await ethersProvider.getSigner();
          }
        }
      }
    } catch (error) {
      console.error('[WalletConnect] Failed to restore session:', error);
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
        console.error(`[WalletConnect] Error in ${event} listener:`, error);
      }
    });
  }
}

// Singleton factory
let walletConnectService: WalletConnectService | null = null;

export function getWalletConnectService(projectId: string): WalletConnectService {
  if (!walletConnectService) {
    walletConnectService = new WalletConnectService(projectId);
  }
  return walletConnectService;
}
