/**
 * Token Service
 * Handles multi-stablecoin operations (cUSD, USDC, USDT)
 */

import { miniPayService } from './miniPayService';
import { BigNumber } from 'bignumber.js';

export type SupportedToken = 'cUSD' | 'USDC' | 'USDT';

export interface TokenInfo {
  symbol: SupportedToken;
  address: string;
  decimals: number;
  name: string;
}

export interface TokenBalance {
  token: SupportedToken;
  balance: BigNumber;
  formatted: string;
}

// Token addresses on Celo (mainnet)
export const TOKEN_ADDRESSES: Record<SupportedToken, string> = {
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  USDC: '0xceBA9300f2b948710d2653dD7B07f33A8b32118C',
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
};

// Token addresses on Alfajores (testnet)
export const TOKEN_ADDRESSES_TESTNET: Record<SupportedToken, string> = {
  cUSD: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
  USDC: '0x41F5b3C4c6FcC5b5D4b5C5b5C5b5C5b5C5b5C5b5C',
  USDT: '0x41F5b3C4c6FcC5b5D4b5C5b5C5b5C5b5C5b5C5b5C',
};

export const TOKEN_DECIMALS: Record<SupportedToken, number> = {
  cUSD: 18,
  USDC: 6,
  USDT: 6,
};

class TokenService {
  private network: 'alfajores' | 'celo' = 'alfajores';

  /**
   * Set network
   */
  setNetwork(network: 'alfajores' | 'celo'): void {
    this.network = network;
  }

  /**
   * Get token address for current network
   */
  getTokenAddress(token: SupportedToken): string {
    const addresses =
      this.network === 'alfajores' ? TOKEN_ADDRESSES_TESTNET : TOKEN_ADDRESSES;
    return addresses[token];
  }

  /**
   * Get token info
   */
  getTokenInfo(token: SupportedToken): TokenInfo {
    return {
      symbol: token,
      address: this.getTokenAddress(token),
      decimals: TOKEN_DECIMALS[token],
      name: this.getTokenName(token),
    };
  }

  /**
   * Get token name
   */
  getTokenName(token: SupportedToken): string {
    const names: Record<SupportedToken, string> = {
      cUSD: 'Celo Dollar',
      USDC: 'USD Coin',
      USDT: 'Tether USD',
    };
    return names[token];
  }

  /**
   * Get all token balances for an address
   */
  async getAllBalances(address: string): Promise<TokenBalance[]> {
    try {
      const balances = await miniPayService.getBalances(address);
      const tokenBalances: TokenBalance[] = [];

      for (const [token, balance] of Object.entries(balances)) {
        if (token !== 'celo') {
          const tokenSymbol = token as SupportedToken;
          tokenBalances.push({
            token: tokenSymbol,
            balance: balance,
            formatted: this.formatTokenAmount(tokenSymbol, balance),
          });
        }
      }

      return tokenBalances;
    } catch (error) {
      console.error('Error fetching token balances:', error);
      throw error;
    }
  }

  /**
   * Get balance for a specific token
   */
  async getBalance(
    address: string,
    token: SupportedToken
  ): Promise<TokenBalance> {
    try {
      const balances = await miniPayService.getBalances(address);
      const balance =
        token === 'cUSD'
          ? balances.cusd
          : token === 'USDC'
          ? balances.usdc
          : balances.usdt;

      return {
        token,
        balance,
        formatted: this.formatTokenAmount(token, balance),
      };
    } catch (error) {
      console.error(`Error fetching ${token} balance:`, error);
      throw error;
    }
  }

  /**
   * Format token amount with decimals
   */
  formatTokenAmount(token: SupportedToken, amount: BigNumber): string {
    const decimals = TOKEN_DECIMALS[token];
    return amount.dividedBy(new BigNumber(10).pow(decimals)).toFixed(2);
  }

  /**
   * Parse token amount from user input (e.g., "10.5" -> BigNumber with decimals)
   */
  parseTokenAmount(token: SupportedToken, amount: string): BigNumber {
    const decimals = TOKEN_DECIMALS[token];
    const amountBN = new BigNumber(amount);
    return amountBN.multipliedBy(new BigNumber(10).pow(decimals));
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(
    address: string,
    token: SupportedToken,
    amount: string
  ): Promise<boolean> {
    try {
      const balance = await this.getBalance(address, token);
      const requiredAmount = this.parseTokenAmount(token, amount);
      return balance.balance.isGreaterThanOrEqualTo(requiredAmount);
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }

  /**
   * Approve token spending for a contract
   */
  async approveTokenSpending(
    token: SupportedToken,
    spender: string,
    amount: string
  ): Promise<string> {
    try {
      const amountBN = this.parseTokenAmount(token, amount);
      const txHash = await miniPayService.approveToken(
        token,
        spender,
        amountBN.toString()
      );
      return txHash;
    } catch (error) {
      console.error('Error approving token:', error);
      throw error;
    }
  }

  /**
   * Check token allowance
   */
  async checkAllowance(
    token: SupportedToken,
    owner: string,
    spender: string
  ): Promise<BigNumber> {
    // This would require contract interaction
    // For now, return a placeholder
    // In production, use ContractKit to call allowance() on ERC20 contract
    return new BigNumber(0);
  }

  /**
   * Get minimum entry fee in token units
   */
  getMinimumEntryFee(token: SupportedToken): string {
    // Minimum 0.1 tokens
    const minFee = 0.1;
    return minFee.toString();
  }

  /**
   * Convert between tokens (for display purposes)
   * Note: This is a 1:1 conversion for stablecoins, but could integrate with DEX for real rates
   */
  convertTokenAmount(
    amount: string,
    fromToken: SupportedToken,
    toToken: SupportedToken
  ): string {
    // For stablecoins, 1:1 conversion
    // In production, could fetch real-time rates from a DEX
    return amount;
  }

  /**
   * Get gas estimate for token transaction
   */
  async estimateGas(
    token: SupportedToken,
    from: string,
    to: string,
    amount: string
  ): Promise<BigNumber> {
    // Gas estimation would be done via ContractKit
    // For stablecoins, typical gas: ~65,000 for transfer, ~45,000 for approve
    return new BigNumber(65000);
  }

  /**
   * Get recommended token for user (based on balance)
   */
  async getRecommendedToken(address: string): Promise<SupportedToken> {
    try {
      const balances = await this.getAllBalances(address);

      // Find token with highest balance
      let maxBalance = new BigNumber(0);
      let recommendedToken: SupportedToken = 'cUSD';

      for (const tokenBalance of balances) {
        if (tokenBalance.balance.isGreaterThan(maxBalance)) {
          maxBalance = tokenBalance.balance;
          recommendedToken = tokenBalance.token;
        }
      }

      return recommendedToken;
    } catch (error) {
      console.error('Error getting recommended token:', error);
      return 'cUSD'; // Default to cUSD
    }
  }
}

export const tokenService = new TokenService();
export default tokenService;

