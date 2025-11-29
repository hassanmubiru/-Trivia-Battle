# WalletConnect v2 Implementation Guide for React Native

## Overview

WalletConnect v2 is the **industry standard** for integrating blockchain wallets into React Native and Expo mobile apps. It enables seamless wallet connections via QR code and supports 100+ wallets including MetaMask Mobile, Trust Wallet, Rainbow, and more.

## Why WalletConnect v2?

### Problem It Solves

In React Native/Expo, `window.ethereum` (MetaMask's injected provider) is **not available** because these apps don't have a traditional browser environment.

### Solution

WalletConnect creates a bridge between your app and wallet apps using a QR code and WebSocket connection:

```
┌─────────────────────┐                    ┌──────────────────┐
│   Trivia Battle     │                    │  MetaMask Mobile │
│   (React Native)    │                    │                  │
│                     │                    │                  │
│  1. Show QR Code────┼────────────────────│                  │
│     (with URI)      │                    │                  │
│                     │◄──── User Scans ──┤                  │
│                     │                    │                  │
│  2. User requests   │                    │                  │
│     signing ────────┼────────────────────│→ User approves   │
│                     │                    │                  │
│  3. Receive         │                    │                  │
│     signature ──────│◄───────────────────│ Returns sig      │
│                     │                    │                  │
└─────────────────────┘                    └──────────────────┘
```

## Installation

### Step 1: Install Dependencies

```bash
cd mobile/trivia-battle-expo

# Core WalletConnect packages
npm install @walletconnect/react-native-compat @walletconnect/web3wallet ethers

# Expo specific (required for Expo projects)
npx expo install expo-random expo-web-browser
```

### Step 2: Install with Linking (if needed)

If you encounter issues with native modules:

```bash
npx expo prebuild --clean
```

## Implementation

### Create WalletConnect Service

Create `src/services/walletConnectService.ts`:

```typescript
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
      console.log('[WalletConnect] Initializing...');
      
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
          11142220: 'https://celo-sepolia-rpc.publicnode.com', // Celo Sepolia
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
```

### Create React Hook

Create `src/hooks/useWalletConnect.ts`:

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { getWalletConnectService } from '../services/walletConnectService';

export interface UseWalletConnectState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isInitialized: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  sendTransaction: (to: string, value: string) => Promise<string>;
  getBalance: () => Promise<string>;
  getTokenBalance: (tokenAddress: string, decimals?: number) => Promise<string>;
}

export function useWalletConnect(projectId: string): UseWalletConnectState {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const serviceRef = useRef(getWalletConnectService(projectId));

  const service = serviceRef.current;

  // Initialize on mount
  useEffect(() => {
    const initWalletConnect = async () => {
      try {
        await service.initialize();
        
        // Check if already connected
        if (service.isConnected()) {
          setAddress(service.getAddress());
        }
        
        setIsInitialized(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Initialization failed');
        setError(error);
        console.error('[useWalletConnect] Initialization error:', error);
      }
    };

    initWalletConnect();

    // Setup listeners
    const handleConnected = (data: any) => {
      setAddress(data.address);
      setError(null);
    };

    const handleDisconnected = () => {
      setAddress(null);
    };

    const handleError = (err: any) => {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    };

    service.on('connected', handleConnected);
    service.on('disconnected', handleDisconnected);
    service.on('error', handleError);

    return () => {
      service.off('connected', handleConnected);
      service.off('disconnected', handleDisconnected);
      service.off('error', handleError);
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const walletInfo = await service.connect();
      setAddress(walletInfo.address);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Connection failed');
      setError(error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await service.disconnect();
      setAddress(null);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Disconnect failed');
      setError(error);
      throw error;
    }
  }, []);

  const signMessage = useCallback(async (message: string) => {
    try {
      setError(null);
      return await service.signMessage(message);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Signing failed');
      setError(error);
      throw error;
    }
  }, []);

  const sendTransaction = useCallback(async (to: string, value: string) => {
    try {
      setError(null);
      return await service.sendTransaction(to, value);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Transaction failed');
      setError(error);
      throw error;
    }
  }, []);

  const getBalance = useCallback(async () => {
    try {
      setError(null);
      return await service.getBalance();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Balance fetch failed');
      setError(error);
      throw error;
    }
  }, []);

  const getTokenBalance = useCallback(
    async (tokenAddress: string, decimals: number = 18) => {
      try {
        setError(null);
        return await service.getTokenBalance(tokenAddress, decimals);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Token balance failed');
        setError(error);
        throw error;
      }
    },
    []
  );

  return {
    address,
    isConnected: service.isConnected(),
    isConnecting,
    isInitialized,
    error,
    connect,
    disconnect,
    signMessage,
    sendTransaction,
    getBalance,
    getTokenBalance,
  };
}
```

## Environment Setup

Add to `.env`:

```env
# WalletConnect Configuration
EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Note: Must have EXPO_PUBLIC_ prefix for Expo to expose it to the app
```

## Getting Your WalletConnect Project ID

1. Visit: **https://cloud.walletconnect.com**
2. Click **Sign Up** (or Login if you have an account)
3. Create a new **Project**
4. Copy your **Project ID** (looks like: `abc123def456...`)
5. Add to `.env`:
   ```env
   EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID=abc123def456...
   ```

## Usage in Components

```typescript
import { useWalletConnect } from '../hooks/useWalletConnect';
import { Button, Text, View, Alert } from 'react-native';

export function WalletScreen() {
  const projectId = process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';
  const wallet = useWalletConnect(projectId);

  if (!wallet.isInitialized) {
    return <Text>Initializing WalletConnect...</Text>;
  }

  if (wallet.error) {
    return <Text>Error: {wallet.error.message}</Text>;
  }

  const handleConnect = async () => {
    try {
      await wallet.connect();
      Alert.alert('Success', `Connected to ${wallet.address}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to connect wallet');
    }
  };

  const handleSignMessage = async () => {
    try {
      const signature = await wallet.signMessage('Hello WalletConnect!');
      Alert.alert('Signed', `Signature: ${signature.slice(0, 20)}...`);
    } catch (error) {
      Alert.alert('Error', 'Failed to sign message');
    }
  };

  if (!wallet.isConnected) {
    return (
      <Button
        title="🔗 Connect Wallet with WalletConnect"
        onPress={handleConnect}
        disabled={wallet.isConnecting}
      />
    );
  }

  return (
    <View>
      <Text>Connected: {wallet.address}</Text>
      <Button title="Sign Message" onPress={handleSignMessage} />
      <Button title="Disconnect" onPress={wallet.disconnect} />
    </View>
  );
}
```

## Supported Wallets

Once integrated, users can connect with 100+ wallets:

- **MetaMask Mobile**
- **Trust Wallet**
- **Coinbase Wallet**
- **Rainbow**
- **Argent**
- **Ledger Live**
- **Gnosis Safe**
- **MEW**
- **And 90+ more...**

All through a single QR code interface!

## Testing

### Test Checklist

- [ ] Get WalletConnect Project ID from cloud.walletconnect.com
- [ ] Add to .env with EXPO_PUBLIC_ prefix
- [ ] Install dependencies
- [ ] Create service and hook
- [ ] Test wallet connection
- [ ] Test message signing
- [ ] Test transaction sending
- [ ] Test on iOS and Android
- [ ] Test with multiple wallets

### Debug Logs

The service logs all actions with `[WalletConnect]` prefix:

```
[WalletConnect] Initializing...
[WalletConnect] Initialized successfully
[WalletConnect] Connecting...
[WalletConnect] Connected: 0x1234...
[WalletConnect] Signing message...
[WalletConnect] Message signed successfully
```

## Troubleshooting

### "WalletConnect projectId is required"

**Solution:** Make sure you added `EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID` to `.env`

```env
EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID=abc123...
```

### QR Code not showing

**Solution:** Check that `showQrModal: true` is set in the provider initialization

### User closes QR code without connecting

**Solution:** This is normal. The app returns control to user. They can try again.

### Balance shows as 0

**Solution:** Make sure the wallet has testnet tokens from faucet:
https://celo-sepolia-faucet.vercel.app

## Next Steps

1. Set up WalletConnect (this guide)
2. Integrate with game logic
3. Add transaction UI
4. Add history tracking
5. Test on real devices
6. Deploy to production

---

**WalletConnect v2 is production-ready and used by millions of users daily.** It's the industry standard for mobile wallet integration!
