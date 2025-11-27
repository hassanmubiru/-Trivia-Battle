/**
 * MiniPay Service
 * Integrates with Celo MiniPay wallet for seamless mobile payments
 * 
 * MiniPay is Opera's crypto wallet built on Celo, accessed via injected provider
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Contract addresses on Celo
const CELO_MAINNET = {
  chainId: 42220,
  rpcUrl: 'https://forno.celo.org',
  name: 'Celo',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
};

const CELO_ALFAJORES = {
  chainId: 44787,
  rpcUrl: 'https://alfajores-forno.celo-testnet.org',
  name: 'Celo Alfajores',
  cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  USDC: '0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B',
  USDT: '0x02De4766C272abc10Bc88c220D214A26960a7e92',
};

// Use testnet for development
const NETWORK = CELO_ALFAJORES;

// TriviaBattle contract
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
   * Connect with wallet address (read-only mode)
   */
  async connectWithAddress(address: string): Promise<WalletState> {
    try {
      this.provider = new ethers.JsonRpcProvider(
        NETWORK.rpcUrl,
        { chainId: NETWORK.chainId, name: NETWORK.name }
      );
      this.walletAddress = address;
      this.isMiniPay = false;
      
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
   */
  async deposit(amount: string, token: string = 'CELO'): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected for signing');
    
    try {
      const contract = new ethers.Contract(TRIVIA_CONTRACT, TRIVIA_ABI, this.signer);
      
      if (token === 'CELO') {
        const tx = await contract.deposit({
          value: ethers.parseEther(amount),
        });
        await tx.wait();
        return tx.hash;
      } else {
        const tokenAddress = this.getTokenAddress(token);
        const decimals = token === 'cUSD' ? 18 : 6;
        const tokenAmount = ethers.parseUnits(amount, decimals);
        
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
        const approveTx = await tokenContract.approve(TRIVIA_CONTRACT, tokenAmount);
        await approveTx.wait();
        
        const tx = await contract.depositToken(tokenAddress, tokenAmount);
        await tx.wait();
        return tx.hash;
      }
    } catch (error) {
      console.error('Deposit error:', error);
      throw error;
    }
  }

  /**
   * Withdraw funds from game contract
   */
  async withdraw(amount: string, token: string = 'CELO'): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected for signing');
    
    try {
      const contract = new ethers.Contract(TRIVIA_CONTRACT, TRIVIA_ABI, this.signer);
      
      if (token === 'CELO') {
        const tx = await contract.withdraw(ethers.parseEther(amount));
        await tx.wait();
        return tx.hash;
      } else {
        const tokenAddress = this.getTokenAddress(token);
        const decimals = token === 'cUSD' ? 18 : 6;
        const tx = await contract.withdrawToken(
          tokenAddress, 
          ethers.parseUnits(amount, decimals)
        );
        await tx.wait();
        return tx.hash;
      }
    } catch (error) {
      console.error('Withdraw error:', error);
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