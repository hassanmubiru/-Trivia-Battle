# Mobile Wallet Integration Guide

## Current Situation

### Why No Direct MetaMask in Expo?

In Expo/React Native, **injected providers** like `window.ethereum` (used by MetaMask in browsers) are **not available**. This is a fundamental limitation of the mobile environment.

```typescript
// ❌ This doesn't work in Expo/React Native
const ethereum = (window as any).ethereum; // undefined on mobile
```

## Available Wallet Options for Mobile

### ✅ Option 1: MiniPay (Recommended for Celo)

**MiniPay** is Celo's native mobile wallet, built into Opera browser in some regions.

**Advantages:**
- Native Celo integration
- Built for mobile
- Simple UX
- No additional apps needed (if available in your region)

**How it works:**
- App detects MiniPay environment: `window.ethereum?.isMiniPay`
- Users tap "Connect with MiniPay"
- Permission granted, connection established

**Current Implementation:**
```typescript
// src/services/miniPayService.ts
// Already implemented and ready to use
await miniPayService.connect();
```

**Setup for Testing:**
1. Install Opera browser
2. Enable MiniPay (if available in your region)
3. Tap "Connect with MiniPay" button

### ✅ Option 2: Manual Address Entry (Read-Only)

Users can enter their wallet address manually for read-only access (no signing).

**Current Implementation:**
```typescript
// src/screens/AuthScreen.tsx
// "Manual Entry" section - already implemented
const wallet = await walletService.connectMetaMask(walletAddress);
```

**Advantages:**
- Works everywhere
- No wallet needed
- Instant access

**Limitations:**
- Read-only mode only
- Cannot sign transactions
- User must provide address

### ⚠️ Option 3: Phone Number (Demo Mode)

Simple demo access without a wallet.

**Current Implementation:**
```typescript
// src/screens/AuthScreen.tsx
// "Demo Mode" section - already implemented
await AsyncStorage.setItem('userPhone', phoneNumber);
```

## Production Solution: WalletConnect v2 (Standard for React Native)

**WalletConnect v2 is the industry standard for mobile wallet integration in React Native/Expo.**

### Why WalletConnect for React Native?

Since MetaMask's injected provider (`window.ethereum`) only works in browsers, WalletConnect is the recommended approach for mobile apps.

**WalletConnect advantages:**
- ✅ **Standard in React Native ecosystem** - Used by all major apps
- ✅ Bridges your app with any wallet app
- ✅ Works on iOS, Android, and Web
- ✅ Supports MetaMask Mobile, Trust Wallet, Rainbow, Coinbase Wallet, etc.
- ✅ Handles signing requests securely
- ✅ User-friendly QR code flow
- ✅ Production-proven and battle-tested

### How WalletConnect v2 Works

```
Your App                 Wallet App (MetaMask)
(Trivia Game)            (Mobile)
    |                            |
    |--- Generate QR Code ------|
    |    (Session + URI)         |
    |                            |
    |<-- User scans QR ---------|
    |                            |
    |--- Request Signature ----->|
    |    (eth_signMessage)       |
    |                            | User approves in wallet
    |<-- Signature returned -----|
    |                            |
    |--- Send Transaction ------>|
    |    (eth_sendTransaction)   |
    |                            | User approves in wallet
    |<-- Tx Hash returned -------|
```

### WalletConnect v2 vs Other Solutions

| Solution | Mobile | Signing | Easy Setup | Standard |
|----------|--------|---------|-----------|----------|
| **WalletConnect v2** | ✅ Yes | ✅ Yes | ⚠️ Moderate | ✅ **Industry Standard** |
| MiniPay | ✅ Yes | ✅ Yes | ✅ Simple | ⚠️ Regional (Celo) |
| Manual Entry | ✅ Yes | ❌ No | ✅ Simple | ✅ Fallback |
| Browser MetaMask | ❌ No | ❌ No | ✅ Simple | ❌ Web only |

### Implementation Steps

#### Step 1: Install Dependencies

```bash
npm install @walletconnect/react-native-compat @walletconnect/web3wallet ethers
```

For Expo projects specifically:
```bash
npx expo install expo-random expo-web-browser
```

#### Step 2: Create WalletConnect Service

Create `src/services/walletConnectService.ts`:

```typescript
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { ethers } from 'ethers';

export interface WalletConnectConfig {
  projectId: string;
  chains: number[];
  methods: string[];
  events: string[];
}

export class WalletConnectService {
  private provider: EthereumProvider | null = null;
  private signer: ethers.Signer | null = null;
  private address: string | null = null;
  
  // Configuration
  private projectId: string;
  private chains: number[];

  constructor(projectId: string, chains: number[] = [11142220]) {
    this.projectId = projectId;
    this.chains = chains;
  }

  /**
   * Initialize WalletConnect provider
   */
  async initialize(): Promise<void> {
    try {
      this.provider = await EthereumProvider.init({
        projectId: this.projectId,
        chains: this.chains,
        methods: [
          'eth_sendTransaction',
          'eth_signMessage',
          'personal_sign',
          'eth_sign',
        ],
        events: [
          'chainChanged',
          'accountsChanged',
          'session_update',
          'connect',
          'disconnect',
        ],
        showQrModal: true,
        rpcMap: {
          11142220: 'https://celo-sepolia-rpc.publicnode.com', // Celo Sepolia
        },
      });

      // Setup event listeners
      this.setupListeners();
    } catch (error) {
      console.error('WalletConnect initialization failed:', error);
      throw error;
    }
  }

  /**
   * Connect to wallet via QR code
   */
  async connect(): Promise<string> {
    if (!this.provider) {
      throw new Error('WalletConnect not initialized. Call initialize() first.');
    }

    try {
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.address = accounts[0];
      
      // Setup ethers provider and signer
      const ethersProvider = new ethers.BrowserProvider(this.provider as any);
      this.signer = await ethersProvider.getSigner();

      console.log('Connected to:', this.address);
      return this.address;
    } catch (error) {
      console.error('WalletConnect connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect from wallet
   */
  async disconnect(): Promise<void> {
    if (!this.provider) return;

    try {
      await this.provider.disconnect();
      this.address = null;
      this.signer = null;
      console.log('Disconnected from WalletConnect');
    } catch (error) {
      console.error('Disconnect failed:', error);
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
   * Get current address
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
      const signature = await this.signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  }

  /**
   * Send a transaction
   */
  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    if (!this.provider || !this.address) {
      throw new Error('Not connected to wallet');
    }

    try {
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: this.address,
            to: to,
            value: ethers.toBeHex(ethers.parseEther(value)),
            data: data || '0x',
          },
        ],
      }) as string;

      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Get balance
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
      console.error('Balance fetch failed:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners
   */
  private setupListeners(): void {
    if (!this.provider) return;

    this.provider.on('accountsChanged', (accounts: string[]) => {
      console.log('Accounts changed:', accounts);
      this.address = accounts[0] || null;
    });

    this.provider.on('chainChanged', (chainId: string) => {
      console.log('Chain changed:', chainId);
      // Handle chain change
    });

    this.provider.on('disconnect', () => {
      console.log('Disconnected from WalletConnect');
      this.address = null;
      this.signer = null;
    });

    this.provider.on('connect', () => {
      console.log('Connected to WalletConnect');
    });
  }
}

// Singleton instance
let walletConnectService: WalletConnectService | null = null;

export function getWalletConnectService(projectId: string): WalletConnectService {
  if (!walletConnectService) {
    walletConnectService = new WalletConnectService(projectId);
  }
  return walletConnectService;
}
```

#### Step 3: Create React Hook

Create `src/hooks/useWalletConnect.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getWalletConnectService, WalletConnectService } from '../services/walletConnectService';

interface UseWalletConnectState {
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
}

export function useWalletConnect(projectId: string): UseWalletConnectState {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const service = getWalletConnectService(projectId);

  // Initialize WalletConnect on mount
  useEffect(() => {
    const initWalletConnect = async () => {
      try {
        await service.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize'));
      }
    };

    initWalletConnect();
  }, []);

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const addr = await service.connect();
      setAddress(addr);
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
  };
}
```

#### Step 4: Update Environment Configuration

Add to `.env`:

```env
# WalletConnect Configuration (required for production)
WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Get your Project ID from: https://cloud.walletconnect.com
# 1. Sign up / Login
# 2. Create new project
# 3. Copy Project ID
# 4. Paste here
```

#### Step 5: Update AuthScreen to Use WalletConnect

```typescript
import { useWalletConnect } from '../hooks/useWalletConnect';

export default function AuthScreen() {
  const projectId = process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';
  const wallet = useWalletConnect(projectId);

  const handleWalletConnect = async () => {
    try {
      if (!wallet.isInitialized) {
        Alert.alert('Error', 'WalletConnect is initializing. Please try again.');
        return;
      }

      await wallet.connect();
      
      Alert.alert(
        'Connected!',
        `Address: ${wallet.address?.slice(0, 6)}...${wallet.address?.slice(-4)}`,
        [{ text: 'Continue', onPress: () => navigation.replace('Main') }]
      );
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message);
    }
  };

  return (
    <Button
      title="🔗 Connect with WalletConnect"
      onPress={handleWalletConnect}
      disabled={!wallet.isInitialized}
      loading={wallet.isConnecting}
    />
  );
}
```

#### Step 6: Get WalletConnect Project ID

1. Visit: https://cloud.walletconnect.com
2. Sign up or login
3. Create a new project
4. Copy the **Project ID**
5. Add to your `.env` file:
   ```env
   WALLET_CONNECT_PROJECT_ID=abc123def456...
   ```

### Testing WalletConnect Integration

```typescript
// Simple test component
function WalletConnectTest() {
  const wallet = useWalletConnect('YOUR_PROJECT_ID');

  return (
    <View>
      {!wallet.isConnected ? (
        <Button title="Connect Wallet" onPress={wallet.connect} />
      ) : (
        <>
          <Text>Connected: {wallet.address}</Text>
          <Button
            title="Sign Message"
            onPress={async () => {
              const sig = await wallet.signMessage('Hello WalletConnect!');
              console.log('Signature:', sig);
            }}
          />
          <Button title="Disconnect" onPress={wallet.disconnect} />
        </>
      )}
    </View>
  );
}
```

### WalletConnect Supported Wallets

Once integrated, users can connect with:

- ✅ MetaMask Mobile
- ✅ Trust Wallet
- ✅ Coinbase Wallet
- ✅ Rainbow Wallet
- ✅ WalletConnect
- ✅ Argent
- ✅ Ledger Live
- ✅ And 100+ more wallets

All from a simple QR code scan!

### WalletConnect vs Current Solution

| Feature | MiniPay | Manual | WalletConnect |
|---------|---------|--------|---------------|
| **Signing** | ✅ Yes | ❌ No | ✅ Yes |
| **Mobile Support** | ✅ Yes | ✅ Yes | ✅ Yes |
| **MetaMask Mobile** | ❌ No | ❌ No | ✅ Yes |
| **Ease of Setup** | ✅ Simple | ✅ Simple | ⚠️ Moderate |
| **Regional** | ⚠️ Limited | ✅ Universal | ✅ Universal |

## Current App Flow

```
User Taps "Connect Wallet"
        |
        v
    Three Options:
    |
    +-> MiniPay (if available)
    |       -> Detects opera environment
    |       -> User approves
    |       -> Connected with signing
    |
    +-> Manual Entry
    |       -> User pastes address
    |       -> Read-only mode
    |
    +-> Demo Mode
            -> Enter phone number
            -> Demo access

```

## Testing on Your Device

### Test MiniPay (if available):
1. Install Opera browser with MiniPay
2. Open app in Opera
3. Tap "Connect with MiniPay"
4. Grant permissions

### Test Manual Entry:
1. Copy any wallet address (your Metamask address, etc.)
2. Tap "Manual Wallet Entry"
3. Paste the address
4. App connects in read-only mode
5. You can see balances but cannot sign

### Test Demo Mode:
1. Tap "Login with Phone"
2. Enter any phone number
3. Instant access without wallet

## Environment Variables

```env
# .env
USE_REAL_CONTRACTS=true
GAME_CONTRACT_ADDRESS=0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869
RPC_URL=https://celo-sepolia-rpc.publicnode.com
CHAIN_ID=11142220

# Optional: For WalletConnect (production)
WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

## Common Issues & Solutions

### Issue: "No Wallet Provider Detected"
**Cause:** App looking for injected provider in mobile environment
**Solution:** This is expected on mobile. Use MiniPay or manual entry instead.

### Issue: MiniPay not showing up
**Cause:** Not running in Opera browser with MiniPay
**Solution:** Install Opera browser or use alternative wallet connection method.

### Issue: "Cannot sign transactions"
**Cause:** Using manual address entry (read-only mode)
**Solution:** For signing, use MiniPay or implement WalletConnect for MetaMask Mobile.

### Issue: Balance shows as zero
**Cause:** Address not funded on testnet
**Solution:** 
1. Get testnet CELO from: https://celo-sepolia-faucet.vercel.app
2. Paste your wallet address
3. Request tokens
4. Wait for confirmation
5. Refresh balance in app

## Next Steps

### For Hackathon/Demo:
✅ Current setup is sufficient:
- MiniPay for users with it
- Manual entry as fallback
- Demo mode for testing

### For Production:
1. Implement WalletConnect v2
2. Add MetaMask Mobile support
3. Add other wallet support (Trust Wallet, Rainbow, etc.)
4. Implement transaction UI
5. Add transaction history
6. Add gas estimation

## Resources

- **MiniPay Docs:** https://docs.opera.com/minipay/
- **WalletConnect Docs:** https://docs.walletconnect.com/
- **ethers.js Mobile:** https://docs.ethers.org/v6/
- **Celo Docs:** https://docs.celo.org/
- **Expo Guide:** https://docs.expo.dev/

## Code References

**MiniPay Service:**
```
src/services/miniPayService.ts
```

**Wallet Service (general):**
```
src/services/walletService.ts
```

**MetaMask Service (browser-only for now):**
```
src/services/metaMaskService.ts
```

**Auth Screen (connection UI):**
```
src/screens/AuthScreen.tsx
```

---

**Summary:** Your app is currently set up with MiniPay and manual entry, which is perfectly suitable for mobile. For production MetaMask support on mobile, implement WalletConnect v2.
