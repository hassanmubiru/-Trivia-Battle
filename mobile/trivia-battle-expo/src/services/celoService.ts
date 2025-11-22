/**
 * Celo Service
 * Handles all Celo blockchain interactions using Composer Kit
 */

import { ContractKit, newKit } from '@celo/contractkit';
import { WalletConnectWallet } from '@celo/wallet-walletconnect';
import { Valora } from '@celo/wallet-walletconnect-v1';
import { BigNumber } from 'bignumber.js';

export interface WalletConnection {
  address: string;
  network: string;
}

export interface TransactionResult {
  hash: string;
  receipt?: any;
}

class CeloService {
  private kit: ContractKit | null = null;
  private wallet: WalletConnectWallet | null = null;
  private connectedAddress: string | null = null;

  /**
   * Initialize Celo connection
   */
  async initialize(network: 'alfajores' | 'celo' = 'alfajores'): Promise<void> {
    const rpcUrl = 
      network === 'alfajores' 
        ? 'https://alfajores-forno.celo-testnet.org'
        : 'https://forno.celo.org';

    this.kit = newKit(rpcUrl);
  }

  /**
   * Connect to Valora wallet
   */
  async connectWallet(): Promise<WalletConnection> {
    if (!this.kit) {
      await this.initialize();
    }

    try {
      // Initialize WalletConnect for Valora
      const wallet = new WalletConnectWallet({
        connect: {
          metadata: {
            name: 'Trivia Battle',
            description: 'Decentralized Trivia Battle Game',
            url: 'https://triviabattle.app',
            icons: ['https://triviabattle.app/icon.png'],
          },
        },
      });

      await wallet.init();
      this.wallet = wallet;

      // Get accounts
      const accounts = await wallet.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.connectedAddress = accounts[0];
      this.kit!.connection.addAccount(accounts[0]);

      return {
        address: accounts[0],
        network: 'alfajores', // or detect from kit
      };
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw new Error('Failed to connect wallet');
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    if (this.wallet) {
      await this.wallet.close();
      this.wallet = null;
    }
    this.connectedAddress = null;
    this.kit = null;
  }

  /**
   * Get current wallet address
   */
  getAddress(): string | null {
    return this.connectedAddress;
  }

  /**
   * Get CELO balance
   */
  async getBalance(address?: string): Promise<BigNumber> {
    if (!this.kit) {
      throw new Error('Kit not initialized');
    }

    const targetAddress = address || this.connectedAddress;
    if (!targetAddress) {
      throw new Error('No address provided');
    }

    const balance = await this.kit.getTotalBalance(targetAddress);
    return balance.CELO;
  }

  /**
   * Get contract instance
   */
  getContract(abi: any, address: string) {
    if (!this.kit) {
      throw new Error('Kit not initialized');
    }

    return new this.kit.web3.eth.Contract(abi, address);
  }

  /**
   * Send transaction
   */
  async sendTransaction(
    to: string,
    data: string,
    value?: string
  ): Promise<TransactionResult> {
    if (!this.kit || !this.connectedAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      const tx = await this.kit.sendTransaction({
        from: this.connectedAddress,
        to,
        data,
        value: value || '0',
      });

      const receipt = await tx.waitReceipt();
      
      return {
        hash: receipt.transactionHash,
        receipt,
      };
    } catch (error) {
      console.error('Transaction error:', error);
      throw new Error('Transaction failed');
    }
  }

  /**
   * Call contract method (read-only)
   */
  async callContract(
    contractAddress: string,
    abi: any,
    method: string,
    params: any[] = []
  ): Promise<any> {
    const contract = this.getContract(abi, contractAddress);
    return await contract.methods[method](...params).call();
  }

  /**
   * Execute contract method (write)
   */
  async executeContract(
    contractAddress: string,
    abi: any,
    method: string,
    params: any[] = [],
    value?: string
  ): Promise<TransactionResult> {
    if (!this.kit || !this.connectedAddress) {
      throw new Error('Wallet not connected');
    }

    const contract = this.getContract(abi, contractAddress);
    const tx = contract.methods[method](...params);

    const gasEstimate = await tx.estimateGas({ from: this.connectedAddress });
    const gasPrice = await this.kit.web3.eth.getGasPrice();

    const txObject = {
      from: this.connectedAddress,
      to: contractAddress,
      data: tx.encodeABI(),
      gas: gasEstimate.toString(),
      gasPrice: gasPrice.toString(),
      value: value || '0',
    };

    const signedTx = await this.kit.web3.eth.accounts.signTransaction(
      txObject,
      // In production, this should use the connected wallet's signing
      process.env.PRIVATE_KEY || ''
    );

    const receipt = await this.kit.web3.eth.sendSignedTransaction(
      signedTx.rawTransaction
    );

    return {
      hash: receipt.transactionHash,
      receipt,
    };
  }

  /**
   * Subscribe to contract events
   */
  subscribeToEvents(
    contractAddress: string,
    abi: any,
    eventName: string,
    callback: (event: any) => void
  ): () => void {
    const contract = this.getContract(abi, contractAddress);
    const event = contract.events[eventName];

    event({}, (error: any, result: any) => {
      if (error) {
        console.error('Event error:', error);
        return;
      }
      callback(result);
    });

    // Return unsubscribe function
    return () => {
      // Unsubscribe logic
    };
  }

  /**
   * Estimate gas for transaction
   */
  async estimateGas(
    contractAddress: string,
    abi: any,
    method: string,
    params: any[] = [],
    value?: string
  ): Promise<BigNumber> {
    if (!this.kit || !this.connectedAddress) {
      throw new Error('Wallet not connected');
    }

    const contract = this.getContract(abi, contractAddress);
    const tx = contract.methods[method](...params);

    const gas = await tx.estimateGas({
      from: this.connectedAddress,
      value: value || '0',
    });

    return new BigNumber(gas.toString());
  }
}

export const celoService = new CeloService();
export default celoService;

