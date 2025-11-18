/**
 * MiniPay Service
 * Handles MiniPay SDK integration for seamless wallet onboarding
 * and SocialConnect for phone number-based authentication
 */

import { SocialConnect } from '@celo/socialconnect';
import { MiniPay } from '@celo/minipay-sdk';
import { BigNumber } from 'bignumber.js';

export interface MiniPayConfig {
  apiKey: string;
  network: 'alfajores' | 'celo';
  redirectUrl?: string;
}

export interface SocialConnectUser {
  phoneNumber: string;
  address: string;
  verified: boolean;
}

export interface WalletInfo {
  address: string;
  network: string;
  phoneNumber?: string;
  balance: {
    celo: BigNumber;
    cusd: BigNumber;
    usdc: BigNumber;
    usdt: BigNumber;
  };
}

class MiniPayService {
  private miniPay: MiniPay | null = null;
  private socialConnect: SocialConnect | null = null;
  private currentUser: SocialConnectUser | null = null;
  private config: MiniPayConfig | null = null;

  /**
   * Initialize MiniPay SDK
   */
  async initialize(config: MiniPayConfig): Promise<void> {
    this.config = config;

    try {
      // Initialize MiniPay SDK
      this.miniPay = new MiniPay({
        apiKey: config.apiKey,
        network: config.network,
        redirectUrl: config.redirectUrl || 'triviabattle://callback',
      });

      // Initialize SocialConnect
      this.socialConnect = new SocialConnect({
        network: config.network,
      });

      await this.miniPay.initialize();
      await this.socialConnect.initialize();
    } catch (error) {
      console.error('MiniPay initialization error:', error);
      throw new Error('Failed to initialize MiniPay');
    }
  }

  /**
   * Authenticate user with phone number via SocialConnect
   */
  async authenticateWithPhone(phoneNumber: string): Promise<SocialConnectUser> {
    if (!this.socialConnect) {
      throw new Error('SocialConnect not initialized');
    }

    try {
      // Request phone number verification
      const verification = await this.socialConnect.requestVerification(phoneNumber);

      // Verify OTP (in production, this would come from user input)
      const verified = await this.socialConnect.verifyOTP(
        phoneNumber,
        verification.requestId,
        '' // OTP from user input
      );

      if (verified) {
        // Get or create wallet address for phone number
        const address = await this.socialConnect.getAddress(phoneNumber);

        this.currentUser = {
          phoneNumber,
          address,
          verified: true,
        };

        return this.currentUser;
      } else {
        throw new Error('Phone verification failed');
      }
    } catch (error) {
      console.error('SocialConnect authentication error:', error);
      throw new Error('Phone authentication failed');
    }
  }

  /**
   * Connect wallet via MiniPay
   */
  async connectWallet(): Promise<WalletInfo> {
    if (!this.miniPay) {
      throw new Error('MiniPay not initialized');
    }

    try {
      // Request wallet connection
      const wallet = await this.miniPay.connect();

      // Get balances for all supported tokens
      const balances = await this.getBalances(wallet.address);

      return {
        address: wallet.address,
        network: this.config?.network || 'alfajores',
        phoneNumber: this.currentUser?.phoneNumber,
        balance: balances,
      };
    } catch (error) {
      console.error('MiniPay connection error:', error);
      throw new Error('Failed to connect wallet');
    }
  }

  /**
   * Get balances for all supported tokens
   */
  async getBalances(address: string): Promise<WalletInfo['balance']> {
    if (!this.miniPay) {
      throw new Error('MiniPay not initialized');
    }

    try {
      const [celo, cusd, usdc, usdt] = await Promise.all([
        this.miniPay.getBalance(address, 'CELO'),
        this.miniPay.getBalance(address, 'cUSD'),
        this.miniPay.getBalance(address, 'USDC'),
        this.miniPay.getBalance(address, 'USDT'),
      ]);

      return {
        celo: new BigNumber(celo),
        cusd: new BigNumber(cusd),
        usdc: new BigNumber(usdc),
        usdt: new BigNumber(usdt),
      };
    } catch (error) {
      console.error('Error fetching balances:', error);
      throw new Error('Failed to fetch balances');
    }
  }

  /**
   * Send transaction via MiniPay
   */
  async sendTransaction(
    to: string,
    value: string,
    token?: 'CELO' | 'cUSD' | 'USDC' | 'USDT',
    data?: string
  ): Promise<string> {
    if (!this.miniPay) {
      throw new Error('MiniPay not initialized');
    }

    try {
      const txHash = await this.miniPay.sendTransaction({
        to,
        value,
        token: token || 'CELO',
        data,
      });

      return txHash;
    } catch (error) {
      console.error('Transaction error:', error);
      throw new Error('Transaction failed');
    }
  }

  /**
   * Approve token spending
   */
  async approveToken(
    token: 'cUSD' | 'USDC' | 'USDT',
    spender: string,
    amount: string
  ): Promise<string> {
    if (!this.miniPay) {
      throw new Error('MiniPay not initialized');
    }

    try {
      const txHash = await this.miniPay.approveToken({
        token,
        spender,
        amount,
      });

      return txHash;
    } catch (error) {
      console.error('Token approval error:', error);
      throw new Error('Token approval failed');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentUser.verified;
  }

  /**
   * Get current user
   */
  getCurrentUser(): SocialConnectUser | null {
    return this.currentUser;
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    if (this.miniPay) {
      await this.miniPay.disconnect();
    }
    this.currentUser = null;
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Simple formatting (can be enhanced)
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    return `+${phoneNumber}`;
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic validation (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }
}

export const miniPayService = new MiniPayService();
export default miniPayService;

