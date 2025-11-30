/**
 * MiniPay Service
 * Production integration with Opera MiniPay wallet on Celo
 * 
 * MiniPay is Opera's mobile money wallet built on Celo blockchain.
 * When running inside MiniPay browser, window.ethereum is injected with isMiniPay=true
 * 
 * Supports both Celo Mainnet (production) and Celo Sepolia (testing)
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore - React Native types
import { Linking, Platform } from 'react-native';

// Celo Mainnet Configuration (Production - where MiniPay operates)
const CELO_MAINNET = {
  chainId: 42220,
  chainIdHex: '0xa4ec',
  rpcUrl: 'https://forno.celo.org',
  name: 'Celo',
  blockExplorer: 'https://celoscan.io',
  // Mainnet token addresses
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
};

// Celo Sepolia Testnet Configuration (Development)
const CELO_SEPOLIA = {
  chainId: 44787,
  chainIdHex: '0xaef3',
  rpcUrl: 'https://celo-sepolia.drpc.org',
  name: 'Celo Sepolia',
  blockExplorer: 'https://celo-sepolia.blockscout.com',
  // Testnet token addresses
  cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  USDC: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B',
  USDT: '0xE4D517785D091D3c54818832dB6094bcc2744545',
};

// Use environment to determine network
const USE_MAINNET = process.env.EXPO_PUBLIC_USE_MAINNET === 'true';
const NETWORK = USE_MAINNET ? CELO_MAINNET : CELO_SEPOLIA;

// TriviaBattle contract addresses per network
const TRIVIA_CONTRACTS = {
  mainnet: '0x0000000000000000000000000000000000000000', // TODO: Deploy to mainnet
  sepolia: '0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869',
};

const TRIVIA_CONTRACT = USE_MAINNET ? TRIVIA_CONTRACTS.mainnet : TRIVIA_CONTRACTS.sepolia;

// ERC20 ABI for token interactions
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

// TriviaBattle contract ABI
const TRIVIA_ABI = [
  'function deposit() payable',
  'function depositToken(address token, uint256 amount)',
  'function withdraw(uint256 amount)',
  'function withdrawToken(address token, uint256 amount)',
  'function getBalance(address user) view returns (uint256)',
  'function getTokenBalance(address user, address token) view returns (uint256)',
  'function createGame(uint256 stake, address token) returns (uint256)',
  'function joinGame(uint256 gameId)',
  'function getUserStats(address user) view returns (tuple(uint256 gamesPlayed, uint256 wins, uint256 losses, uint256 totalEarnings))',
];

export interface WalletState {
  address: string;
  isConnected: boolean;
  isMiniPay: boolean;
  network: 'mainnet' | 'sepolia';
  balances: {
    CELO: string;
    cUSD: string;
    USDC: string;
    USDT: string;
  };
}

export interface TransactionResult {
  hash: string;
  status: 'success' | 'failed';
  blockNumber?: number;
}

class MiniPayService {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private walletAddress: string | null = null;
  private isMiniPay: boolean = false;
  private listeners: Map<string, Function[]> = new Map();

  /**
   * Check if running inside MiniPay browser
   * MiniPay injects ethereum provider with isMiniPay flag
   */
  isMiniPayEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) return false;
    
    // MiniPay sets this flag
    return ethereum.isMiniPay === true;
  }

  /**
   * Check if any Web3 provider is available
   */
  hasWeb3Provider(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum;
  }

  /**
   * Get current network configuration
   */
  getNetwork() {
    return NETWORK;
  }

  /**
   * Open MiniPay app or app store if not installed
   * MiniPay is available on Android in Africa region
   */
  async openMiniPay(): Promise<void> {
    const miniPayUrl = 'https://minipay.opera.com/';
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.opera.mini.native';
    
    try {
      // Try to open MiniPay deeplink
      const canOpen = await Linking.canOpenURL(miniPayUrl);
      if (canOpen) {
        await Linking.openURL(miniPayUrl);
      } else if (Platform.OS === 'android') {
        // Open Play Store for Android
        await Linking.openURL(playStoreUrl);
      } else {
        // For iOS or web, open the website
        await Linking.openURL(miniPayUrl);
      }
    } catch (error) {
      console.error('Error opening MiniPay:', error);
      // Fallback to website
      await Linking.openURL(miniPayUrl);
    }
  }

  /**
   * Connect to MiniPay wallet
   * Will use injected provider if available, otherwise shows instructions
   */
  async connect(): Promise<WalletState> {
    try {
      // Check for injected provider (MiniPay or other Web3 wallet)
      if (this.hasWeb3Provider()) {
        const ethereum = (window as any).ethereum;
        
        // Request account access
        const accounts = await ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts returned from wallet');
        }

        // Create ethers provider from injected provider
        this.provider = new ethers.BrowserProvider(ethereum);
        this.signer = await this.provider.getSigner();
        this.walletAddress = accounts[0];
        this.isMiniPay = ethereum.isMiniPay === true;

        // Verify we're on the correct network
        const network = await this.provider.getNetwork();
        if (Number(network.chainId) !== NETWORK.chainId) {
          // Try to switch network
          await this.switchNetwork();
        }

        // Save connection state
        await AsyncStorage.setItem('walletAddress', this.walletAddress);
        await AsyncStorage.setItem('connectionType', this.isMiniPay ? 'minipay' : 'injected');
        await AsyncStorage.setItem('isMiniPay', String(this.isMiniPay));

        // Setup event listeners
        this.setupEventListeners(ethereum);

        // Fetch balances
        const balances = await this.getAllBalances();

        this.emit('connected', { address: this.walletAddress, isMiniPay: this.isMiniPay });

        return {
          address: this.walletAddress,
          isConnected: true,
          isMiniPay: this.isMiniPay,
          network: USE_MAINNET ? 'mainnet' : 'sepolia',
          balances,
        };
      }

      // No injected provider - try to restore from storage
      const storedAddress = await AsyncStorage.getItem('walletAddress');
      if (storedAddress && ethers.isAddress(storedAddress)) {
        return this.connectReadOnly(storedAddress);
      }

      throw new Error(
        this.isMiniPayEnvironment() 
          ? 'Please approve the connection request in MiniPay'
          : 'No Web3 wallet detected. Please open this app in MiniPay or install a Web3 wallet.'
      );
    } catch (error: any) {
      console.error('MiniPay connection error:', error);
      
      if (error.code === 4001) {
        throw new Error('Connection rejected by user');
      }
      
      throw error;
    }
  }

  /**
   * Connect in read-only mode with just an address
   * Useful for viewing balances without signing capability
   */
  async connectReadOnly(address: string): Promise<WalletState> {
    if (!ethers.isAddress(address)) {
      throw new Error('Invalid wallet address');
    }

    this.provider = new ethers.JsonRpcProvider(
      NETWORK.rpcUrl,
      { chainId: NETWORK.chainId, name: NETWORK.name },
      { staticNetwork: true }
    );
    this.walletAddress = address;
    this.isMiniPay = false;
    this.signer = null;

    await AsyncStorage.setItem('walletAddress', address);
    await AsyncStorage.setItem('connectionType', 'readonly');

    const balances = await this.getAllBalances();

    return {
      address,
      isConnected: true,
      isMiniPay: false,
      network: USE_MAINNET ? 'mainnet' : 'sepolia',
      balances,
    };
  }

  /**
   * Setup event listeners for account and chain changes
   */
  private setupEventListeners(ethereum: any): void {
    if (!ethereum.on) return;

    ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect();
        this.emit('disconnected', {});
      } else if (accounts[0] !== this.walletAddress) {
        this.walletAddress = accounts[0];
        this.emit('accountChanged', { address: accounts[0] });
      }
    });

    ethereum.on('chainChanged', (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      this.emit('chainChanged', { chainId: newChainId });
      
      // Reload if chain changed to ensure correct contract addresses
      if (newChainId !== NETWORK.chainId) {
        console.warn('Network changed to unsupported chain:', newChainId);
      }
    });

    ethereum.on('disconnect', () => {
      this.disconnect();
      this.emit('disconnected', {});
    });
  }

  /**
   * Switch to the correct Celo network
   */
  async switchNetwork(): Promise<void> {
    if (!this.hasWeb3Provider()) {
      throw new Error('No Web3 provider available');
    }

    const ethereum = (window as any).ethereum;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK.chainIdHex }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: NETWORK.chainIdHex,
            chainName: NETWORK.name,
            nativeCurrency: {
              name: 'CELO',
              symbol: 'CELO',
              decimals: 18,
            },
            rpcUrls: [NETWORK.rpcUrl],
            blockExplorerUrls: [NETWORK.blockExplorer],
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Get all token balances for connected wallet
   */
  async getAllBalances(): Promise<WalletState['balances']> {
    if (!this.walletAddress) {
      return { CELO: '0', cUSD: '0', USDC: '0', USDT: '0' };
    }

    try {
      const provider = this.provider || new ethers.JsonRpcProvider(
        NETWORK.rpcUrl,
        { chainId: NETWORK.chainId, name: NETWORK.name },
        { staticNetwork: true }
      );

      // Get native CELO balance
      const celoBalance = await provider.getBalance(this.walletAddress);

      // Get token balances in parallel
      const cusdContract = new ethers.Contract(NETWORK.cUSD, ERC20_ABI, provider);
      const usdcContract = new ethers.Contract(NETWORK.USDC, ERC20_ABI, provider);
      const usdtContract = new ethers.Contract(NETWORK.USDT, ERC20_ABI, provider);

      const [cusdBalance, usdcBalance, usdtBalance] = await Promise.all([
        cusdContract.balanceOf(this.walletAddress).catch(() => 0n),
        usdcContract.balanceOf(this.walletAddress).catch(() => 0n),
        usdtContract.balanceOf(this.walletAddress).catch(() => 0n),
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
   * Get token balance for a specific token
   */
  async getTokenBalance(token: 'CELO' | 'cUSD' | 'USDC' | 'USDT'): Promise<string> {
    const balances = await this.getAllBalances();
    return balances[token];
  }

  /**
   * Send cUSD payment (most common in MiniPay)
   * This is the primary payment method for MiniPay users
   */
  async sendCUSD(to: string, amount: string): Promise<TransactionResult> {
    if (!this.signer) {
      throw new Error('Wallet not connected or read-only mode. Connect with MiniPay to send transactions.');
    }

    if (!ethers.isAddress(to)) {
      throw new Error('Invalid recipient address');
    }

    try {
      const cusdContract = new ethers.Contract(NETWORK.cUSD, ERC20_ABI, this.signer);
      const amountWei = ethers.parseUnits(amount, 18);

      // Check balance first
      const balance = await cusdContract.balanceOf(this.walletAddress);
      if (balance < amountWei) {
        throw new Error(`Insufficient cUSD balance. You have ${ethers.formatUnits(balance, 18)} cUSD`);
      }

      const tx = await cusdContract.transfer(to, amountWei);
      const receipt = await tx.wait();

      this.emit('transactionSent', { hash: tx.hash, type: 'transfer' });

      return {
        hash: tx.hash,
        status: receipt?.status === 1 ? 'success' : 'failed',
        blockNumber: receipt?.blockNumber,
      };
    } catch (error: any) {
      console.error('cUSD transfer error:', error);
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        throw new Error('Transaction rejected by user');
      }
      
      throw error;
    }
  }

  /**
   * Deposit funds into TriviaBattle contract
   */
  async deposit(amount: string, token: 'CELO' | 'cUSD' | 'USDC' | 'USDT' = 'cUSD'): Promise<TransactionResult> {
    if (!this.signer) {
      throw new Error('Wallet not connected. Please connect with MiniPay first.');
    }

    if (!TRIVIA_CONTRACT || TRIVIA_CONTRACT === '0x0000000000000000000000000000000000000000') {
      throw new Error('Game contract not deployed on this network');
    }

    try {
      const contract = new ethers.Contract(TRIVIA_CONTRACT, TRIVIA_ABI, this.signer);

      if (token === 'CELO') {
        const tx = await contract.deposit({
          value: ethers.parseEther(amount),
        });
        const receipt = await tx.wait();
        
        return {
          hash: tx.hash,
          status: receipt?.status === 1 ? 'success' : 'failed',
          blockNumber: receipt?.blockNumber,
        };
      } else {
        // For tokens, need to approve first
        const tokenAddress = this.getTokenAddress(token);
        const decimals = token === 'cUSD' ? 18 : 6;
        const amountWei = ethers.parseUnits(amount, decimals);

        // Check and set allowance
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
        const allowance = await tokenContract.allowance(this.walletAddress, TRIVIA_CONTRACT);
        
        if (allowance < amountWei) {
          const approveTx = await tokenContract.approve(TRIVIA_CONTRACT, amountWei);
          await approveTx.wait();
        }

        const tx = await contract.depositToken(tokenAddress, amountWei);
        const receipt = await tx.wait();

        return {
          hash: tx.hash,
          status: receipt?.status === 1 ? 'success' : 'failed',
          blockNumber: receipt?.blockNumber,
        };
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        throw new Error('Transaction rejected by user');
      }
      
      throw error;
    }
  }

  /**
   * Withdraw funds from TriviaBattle contract
   */
  async withdraw(amount: string, token: 'CELO' | 'cUSD' | 'USDC' | 'USDT' = 'cUSD'): Promise<TransactionResult> {
    if (!this.signer) {
      throw new Error('Wallet not connected. Please connect with MiniPay first.');
    }

    try {
      const contract = new ethers.Contract(TRIVIA_CONTRACT, TRIVIA_ABI, this.signer);

      if (token === 'CELO') {
        const tx = await contract.withdraw(ethers.parseEther(amount));
        const receipt = await tx.wait();
        
        return {
          hash: tx.hash,
          status: receipt?.status === 1 ? 'success' : 'failed',
          blockNumber: receipt?.blockNumber,
        };
      } else {
        const tokenAddress = this.getTokenAddress(token);
        const decimals = token === 'cUSD' ? 18 : 6;
        
        const tx = await contract.withdrawToken(
          tokenAddress,
          ethers.parseUnits(amount, decimals)
        );
        const receipt = await tx.wait();

        return {
          hash: tx.hash,
          status: receipt?.status === 1 ? 'success' : 'failed',
          blockNumber: receipt?.blockNumber,
        };
      }
    } catch (error: any) {
      console.error('Withdraw error:', error);
      
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        throw new Error('Transaction rejected by user');
      }
      
      throw error;
    }
  }

  /**
   * Get in-game balance from contract
   */
  async getGameBalance(token: 'CELO' | 'cUSD' | 'USDC' | 'USDT' = 'cUSD'): Promise<string> {
    if (!this.walletAddress) return '0';

    try {
      const provider = this.provider || new ethers.JsonRpcProvider(
        NETWORK.rpcUrl,
        { chainId: NETWORK.chainId, name: NETWORK.name },
        { staticNetwork: true }
      );
      
      const contract = new ethers.Contract(TRIVIA_CONTRACT, TRIVIA_ABI, provider);

      if (token === 'CELO') {
        const balance = await contract.getBalance(this.walletAddress);
        return ethers.formatEther(balance);
      } else {
        const tokenAddress = this.getTokenAddress(token);
        const decimals = token === 'cUSD' ? 18 : 6;
        const balance = await contract.getTokenBalance(this.walletAddress, tokenAddress);
        return ethers.formatUnits(balance, decimals);
      }
    } catch (error) {
      console.error('Error getting game balance:', error);
      return '0';
    }
  }

  /**
   * Get token address from symbol
   */
  private getTokenAddress(token: string): string {
    switch (token.toUpperCase()) {
      case 'CUSD':
      case 'cUSD':
        return NETWORK.cUSD;
      case 'USDC':
        return NETWORK.USDC;
      case 'USDT':
        return NETWORK.USDT;
      default:
        throw new Error(`Unknown token: ${token}`);
    }
  }

  /**
   * Event emitter methods
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  /**
   * Get connected wallet address
   */
  getAddress(): string | null {
    return this.walletAddress;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.walletAddress !== null;
  }

  /**
   * Check if we can sign transactions
   */
  canSign(): boolean {
    return this.signer !== null;
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.walletAddress = null;
    this.isMiniPay = false;
    this.listeners.clear();

    await AsyncStorage.multiRemove([
      'walletAddress',
      'connectionType',
      'isMiniPay',
    ]);

    this.emit('disconnected', {});
  }

  /**
   * Restore previous connection if available
   */
  async restoreConnection(): Promise<WalletState | null> {
    try {
      const storedAddress = await AsyncStorage.getItem('walletAddress');
      const connectionType = await AsyncStorage.getItem('connectionType');

      if (!storedAddress) return null;

      // If was connected via injected provider, try to reconnect
      if (connectionType === 'minipay' || connectionType === 'injected') {
        if (this.hasWeb3Provider()) {
          return this.connect();
        }
      }

      // Otherwise, restore as read-only
      return this.connectReadOnly(storedAddress);
    } catch (error) {
      console.error('Error restoring connection:', error);
      return null;
    }
  }
}

export const miniPayService = new MiniPayService();
export default miniPayService;
