/**
 * Formatting Utility Functions
 */

import { BigNumber } from 'bignumber.js';
import { SupportedToken } from '../types';

const TOKEN_DECIMALS: Record<SupportedToken, number> = {
  cUSD: 18,
  USDC: 6,
  USDT: 6,
};

/**
 * Format token amount with appropriate decimals
 */
export const formatTokenAmount = (
  token: SupportedToken,
  amount: BigNumber | string
): string => {
  const amountBN = typeof amount === 'string' ? new BigNumber(amount) : amount;
  const decimals = TOKEN_DECIMALS[token];
  return amountBN.dividedBy(new BigNumber(10).pow(decimals)).toFixed(2);
};

/**
 * Format address for display (show first 6 and last 4 characters)
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  if (!phoneNumber) return '';
  // Simple formatting - can be enhanced
  return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
};

/**
 * Format time remaining (seconds to MM:SS)
 */
export const formatTimeRemaining = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format large numbers (e.g., 1000 -> 1K)
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Format balance for display
 */
export const formatBalance = (
  amount: BigNumber | string | number,
  token: SupportedToken
): string => {
  if (typeof amount === 'number') {
    amount = new BigNumber(amount);
  } else if (typeof amount === 'string') {
    amount = new BigNumber(amount);
  }
  
  return formatTokenAmount(token, amount);
};

