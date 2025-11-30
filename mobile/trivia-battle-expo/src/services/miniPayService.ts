/**
 * MiniPay Service
 * Integrates with Celo MiniPay wallet for seamless mobile payments
 * 
 * MiniPay is Opera's crypto wallet built on Celo, accessed via injected provider
 * Configured for Celo Mainnet
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Celo Mainnet Configuration
const CELO_MAINNET = {
  chainId: 42220,
  rpcUrl: 'https://forno.celo.org',
  name: 'Celo',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
};

// Use Celo Mainnet
const NETWORK = CELO_MAINNET;

// TriviaBattle contract on Celo Mainnet (update after deployment)
const TRIVIA_CONTRACT = '0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869';

// ERC20 ABI for token interactions
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

// TriviaBattle contract ABI (minimal)
const TRIVIA_ABI = [
  'function deposit() payable',
  'function depositToken(address token, uint256 amount)',
  'function withdraw(uint256 amount)',
  'function withdrawToken(address token, uint256 amount)',
  'function getBalance(address user) view returns (uint256)',
  'function getTokenBalance(address user, address token) view returns (uint256)',
  'function createGame(uint256 stake, address token) returns (uint256)',
  'function joinGame(uint256 gameId)',
];

export interface WalletState {
  address: string;
  isConnected: boolean;
  isMiniPay: boolean;
  balances: {
    CELO: string;
    cUSD: string;
    USDC: string;
    USDT: string;
  };
}

class MiniPayService {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private walletAddress: string | null = null;
  private isMiniPay: boolean = false;

  /**
   * Check if running inside MiniPay app
   */
  isMiniPayEnvironment(): boolean {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const provider = (window as any).ethereum;
      return provider.isMiniPay === true;
    }
    return false;
  }

  /**
   * Initialize connection - tries MiniPay first, falls back to RPC
   */
  async connect(): Promise<WalletState> {
    try {
      // Check for MiniPay/injected provider
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const injectedProvider = (window as any).ethereum;
        
        const accounts = await injectedProvider.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts && accounts.length > 0) {
          this.provider = new ethers.BrowserProvider(injectedProvider);
          this.signer = await this.provider.getSigner();
          this.walletAddress = accounts[0];
          this.isMiniPay = injectedProvider.isMiniPay === true;
          
          await AsyncStorage.setItem('walletAddress', this.walletAddress);
          await AsyncStorage.setItem('isMiniPay', String(this.isMiniPay));
          
          const balances = await this.getAllBalances();
          
          return {
            address: this.walletAddress,
            isConnected: true,
            isMiniPay: this.isMiniPay,
            balances,
          };
        }
      }
      
      // Fallback: Check stored wallet address for read-only mode
      const storedAddress = await AsyncStorage.getItem('walletAddress');
      if (storedAddress) {
        this.provider = new ethers.JsonRpcProvider(
          NETWORK.rpcUrl,
          { chainId: NETWORK.chainId, name: NETWORK.name }
        );
        this.walletAddress = storedAddress;
        
        const balances = await this.getAllBalances();
        
        return {
          address: storedAddress,
          isConnected: true,
          isMiniPay: false,
          balances,
        };
      }
      
      throw new Error('No wallet connected');
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  /**
   * Connect with wallet address (read-only fallback)
   */
  async connectWithAddress(address: string): Promise<WalletState> {
    try {
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid wallet address');
      }

      this.provider = new ethers.JsonRpcProvider(
        NETWORK.rpcUrl,
        { chainId: NETWORK.chainId, name: NETWORK.name }
      );
      this.walletAddress = address;
      this.isMiniPay = false;
      this.signer = null; // No signer in read-only mode
      
      await AsyncStorage.setItem('walletAddress', address);
      
      const balances = await this.getAllBalances();
      
      return {
        address,
        isConnected: true,
        isMiniPay: false,
        balances,
      };
    } catch (error) {
      console.error('Address connection error:', error);
      throw error;
    }
  }

  /**
   * Get all token balances
   */
  async getAllBalances(): Promise<WalletState['balances']> {
    if (!this.walletAddress) {
      return { CELO: '0', cUSD: '0', USDC: '0', USDT: '0' };
    }

    try {
      const provider = this.provider || new ethers.JsonRpcProvider(NETWORK.rpcUrl);
      
      const celoBalance = await provider.getBalance(this.walletAddress);
      
      const cusdContract = new ethers.Contract(NETWORK.cUSD, ERC20_ABI, provider);
      const usdcContract = new ethers.Contract(NETWORK.USDC, ERC20_ABI, provider);
      const usdtContract = new ethers.Contract(NETWORK.USDT, ERC20_ABI, provider);
      
      const [cusdBalance, usdcBalance, usdtBalance] = await Promise.all([
        cusdContract.balanceOf(this.walletAddress),
        usdcContract.balanceOf(this.walletAddress),
        usdtContract.balanceOf(this.walletAddress),
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
   * Deposit funds into game contract
   * Requires real signer (MiniPay or MetaMask)
   */
  async deposit(amount: string, token: string = 'CELO'): Promise<string> {
    if (!this.signer) {
      throw new Error('Cannot sign transactions. Please connect with MiniPay or MetaMask for transaction support.');
    }
    
    try {
      const contract = new ethers.Contract(TRIVIA_CONTRACT, TRIVIA_ABI, this.signer);
      
      if (token === 'CELO') {
        const tx = await contract.deposit({
          value: ethers.parseEther(amount),
        });
        const receipt = await tx.wait();
        if (!receipt) throw new Error('Deposit failed');
        return receipt.hash;
      } else {
        const tokenAddress = this.getTokenAddress(token);
        const decimals = token === 'cUSD' ? 18 : 6;
        const tokenAmount = ethers.parseUnits(amount, decimals);
        
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
        const approveTx = await tokenContract.approve(TRIVIA_CONTRACT, tokenAmount);
        const approveReceipt = await approveTx.wait();
        if (!approveReceipt) throw new Error('Approval failed');
        
        const tx = await contract.depositToken(tokenAddress, tokenAmount);
        const receipt = await tx.wait();
        if (!receipt) throw new Error('Deposit failed');
        return receipt.hash;
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('User rejected the transaction');
      }
      throw error;
    }
  }

  /**
   * Withdraw funds from game contract
   * Requires real signer (MiniPay or MetaMask)
   */
  async withdraw(amount: string, token: string = 'CELO'): Promise<string> {
    if (!this.signer) {
      throw new Error('Cannot sign transactions. Please connect with MiniPay or MetaMask for transaction support.');
    }
    
    try {
      const contract = new ethers.Contract(TRIVIA_CONTRACT, TRIVIA_ABI, this.signer);
      
      if (token === 'CELO') {
        const tx = await contract.withdraw(ethers.parseEther(amount));
        const receipt = await tx.wait();
        if (!receipt) throw new Error('Withdrawal failed');
        return receipt.hash;
      } else {
        const tokenAddress = this.getTokenAddress(token);
        const decimals = token === 'cUSD' ? 18 : 6;
        const tx = await contract.withdrawToken(
          tokenAddress, 
          ethers.parseUnits(amount, decimals)
        );
        const receipt = await tx.wait();
        if (!receipt) throw new Error('Withdrawal failed');
        return receipt.hash;
      }
    } catch (error: any) {
      console.error('Withdraw error:', error);
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('User rejected the transaction');
      }
      throw error;
    }
  }

  /**
   * Get token address by symbol
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
   * Approve token spending for contract
   * Requires real signer
   */
  async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Cannot sign transactions. Please connect with MiniPay or MetaMask for transaction support.');
    }

    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const tx = await contract.approve(spenderAddress, ethers.parseUnits(amount, 18));
      const receipt = await tx.wait();
      if (!receipt) throw new Error('Approval failed');
      return receipt.hash;
    } catch (error: any) {
      console.error('Approval error:', error);
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('User rejected the approval');
      }
      throw error;
    }
  }

  getAddress(): string | null {
    return this.walletAddress;
  }

  isConnected(): boolean {
    return this.walletAddress !== null;
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.walletAddress = null;
    this.isMiniPay = false;
    
    await AsyncStorage.removeItem('walletAddress');
    await AsyncStorage.removeItem('isMiniPay');
  }
}

export const miniPayService = new MiniPayService();
export default miniPayService;