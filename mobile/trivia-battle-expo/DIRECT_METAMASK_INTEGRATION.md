# Direct MetaMask Mobile Integration

## Overview

The wallet connection has been updated to use **direct MetaMask Mobile integration** instead of WalletConnect. This provides real, direct access to the user's MetaMask wallet with no intermediaries.

## Key Differences

| Feature | WalletConnect | Direct MetaMask |
|---------|---------------|-----------------|
| **Connection Type** | Bridge-based | Direct |
| **Project ID** | Required | Not needed |
| **QR Code** | Required | Not needed |
| **Latency** | Higher | Immediate |
| **Wallet Support** | 100+ wallets | MetaMask only |
| **Ease of Setup** | Complex | Simple |
| **Real Wallet Access** | Indirect | Direct |

## How It Works

### User Flow

1. **User taps "🦊 Connect MetaMask"**
   - AuthScreen calls `metaMask.connect()`

2. **MetaMask Shows Permission Dialog**
   - Request: `eth_requestAccounts`
   - Shows account selection
   - Shows "Connect" button

3. **User Approves**
   - MetaMask returns selected account
   - Direct access granted

4. **App Connected**
   - Wallet address displayed
   - Can sign messages
   - Can send transactions
   - Direct blockchain access

5. **Session Auto-Restored**
   - On app restart, auto-connects
   - 24-hour session persistence
   - User stays logged in

## Technical Implementation

### MetaMaskService

**File**: `src/services/metamaskService.ts`

```typescript
export class MetaMaskService {
  // Direct ethers.js provider from MetaMask
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private address: string | null = null;
  
  // Initialize provider from window.ethereum (injected by MetaMask)
  private initializeProvider(): void {
    const window = global as any;
    if (window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum);
    }
  }
  
  // Connect to wallet - shows MetaMask permission dialog
  async connect(): Promise<WalletInfo> {
    const accounts = await this.provider.ethereum.request({
      method: 'eth_requestAccounts',
    });
    this.address = accounts[0];
    // Setup signer and return wallet info
  }
}
```

**Key Features**:
- ✅ Uses injected `window.ethereum` provider
- ✅ Direct `eth_requestAccounts` RPC call
- ✅ ethers.js `BrowserProvider` wrapper
- ✅ Full signer capability
- ✅ Event listener support

### useMetaMask Hook

**File**: `src/hooks/useMetaMask.ts`

```typescript
export function useMetaMask(): UseMetaMaskReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const metaMask = getMetaMaskService();
  
  useEffect(() => {
    // Initialize and setup event listeners
    metaMask.initialize();
    
    metaMask.on('connected', (info) => {
      setAddress(info.address);
      setIsConnected(true);
    });
    
    metaMask.on('accountsChanged', (accounts) => {
      setAddress(accounts[0]);
    });
  }, []);
  
  return {
    address,
    isConnected,
    error,
    connect: () => metaMask.connect(),
    signMessage: (msg) => metaMask.signMessage(msg),
    sendTransaction: (to, value, data) => metaMask.sendTransaction(to, value, data),
    // ... other methods
  };
}
```

**Exports**:
- `address` - Current wallet address
- `isConnected` - Connection status
- `isConnecting` - Connection in progress
- `error` - Last error
- `connect()` - Request account connection
- `disconnect()` - Close wallet connection
- `signMessage()` - Sign messages
- `sendTransaction()` - Send blockchain transactions
- `getBalance()` - Get CELO balance
- `getTokenBalance()` - Get ERC20 balance
- `switchNetwork()` - Switch to Celo Sepolia
- `on/off` - Event listeners

### AuthScreen Integration

**File**: `src/screens/AuthScreen.tsx`

```typescript
export default function AuthScreen({ navigation }: any) {
  const metaMask = useMetaMask();
  
  const handleMetaMaskConnect = async () => {
    try {
      // Shows MetaMask permission dialog
      await metaMask.connect();
    } catch (error) {
      Alert.alert('Connection Error', error.message);
    }
  };
  
  return (
    <Button
      title="🦊 Connect MetaMask"
      onPress={handleMetaMaskConnect}
      disabled={metaMask.isConnecting}
    />
  );
}
```

## Architecture

```
AuthScreen (UI)
    ↓
useMetaMask Hook (State Management)
    ↓
MetaMaskService (Provider Integration)
    ↓
ethers.js BrowserProvider
    ↓
window.ethereum (Injected by MetaMask Mobile)
    ↓
MetaMask Mobile App
    ↓
User's Real Wallet
```

## Setup Requirements

### For Users
✅ MetaMask Mobile app installed
✅ Internet connection
✅ Ethereum account in MetaMask

### For Developers
✅ ethers.js@6.9.0 (blockchain library)
✅ React Native async capabilities
✅ No WalletConnect Project ID needed
✅ No QR code scanning needed

## Configuration

### Network Settings

Default: **Celo Sepolia Testnet**
- Chain ID: `11142220` (0x2ae28 hex)
- RPC: `https://celo-sepolia-rpc.publicnode.com`
- Currency: CELO
- Block Explorer: https://sepolia.celoscan.io

### Environment

No special .env configuration needed. The app works out of the box with MetaMask Mobile.

## Available Methods

### Connect/Disconnect
```typescript
await metaMask.connect()           // Show permission dialog
await metaMask.disconnect()        // Close connection
```

### Query State
```typescript
metaMask.isConnected()             // boolean
metaMask.getAddress()              // string | null
metaMask.getChainId()              // number
```

### Transactions
```typescript
await metaMask.signMessage(msg)    // Sign arbitrary message
await metaMask.sendTransaction(    // Send CELO
  toAddress,
  amountInCelo,
  optionalData
)
```

### Balance Queries
```typescript
await metaMask.getBalance()        // CELO balance
await metaMask.getTokenBalance(    // ERC20 token balance
  tokenAddress,
  decimals
)
```

### Network Management
```typescript
await metaMask.switchNetwork()     // Switch to Celo Sepolia
```

## Event System

Subscribe to wallet events:

```typescript
metaMask.on('connected', (info) => {
  console.log('Connected:', info.address);
});

metaMask.on('accountsChanged', (accounts) => {
  console.log('Accounts changed:', accounts);
});

metaMask.on('chainChanged', (chainId) => {
  console.log('Network changed:', chainId);
});

metaMask.on('disconnected', () => {
  console.log('Disconnected');
});

metaMask.on('error', (error) => {
  console.error('Error:', error);
});

// Unsubscribe
metaMask.off('connected', listener);
```

## Session Persistence

**Duration**: 24 hours
**Storage**: AsyncStorage
**Key**: `metamask_session`
**Auto-Restore**: On app launch, checks for valid session

```typescript
{
  address: "0x...",
  chainId: 11142220,
  isConnected: true,
  timestamp: 1700000000
}
```

If session is valid (< 24h old), user is automatically reconnected.

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| MetaMask not installed | App not on device | Install MetaMask Mobile |
| "Not connected to MetaMask" | Connection rejected | Tap Connect button again |
| "Invalid recipient address" | Bad address format | Verify wallet address |
| "Network switch failed" | Network not added | App auto-adds Celo Sepolia |
| "Permission denied" | User rejected | Ask user to approve in settings |

### Error Recovery

```typescript
try {
  await metaMask.connect();
} catch (error) {
  if (error.message.includes('MetaMask')) {
    // Suggest installing app
  } else {
    // Retry or show message
  }
}
```

## Testing Checklist

- [ ] MetaMask Mobile installed on device
- [ ] App compiles without errors
- [ ] Tap "Connect MetaMask" button
- [ ] MetaMask permission dialog appears
- [ ] Can select account
- [ ] Connection succeeds
- [ ] Wallet address displays
- [ ] Can sign messages
- [ ] Can send transactions
- [ ] Session persists on restart

## Production Deployment

### Checklist

- [ ] Test on real devices (Android + iOS)
- [ ] Test all wallet operations
- [ ] Test error scenarios
- [ ] Test session persistence
- [ ] Test network switching
- [ ] Test with real MetaMask accounts
- [ ] Verify blockchain transactions
- [ ] User testing complete
- [ ] Ready for app store submission

## Advantages Over WalletConnect

✅ **Simpler**: No Project ID, no QR codes, no setup
✅ **Faster**: Direct connection, no bridge overhead
✅ **Reliable**: Uses MetaMask's native provider
✅ **Real**: Direct access to actual wallet
✅ **No Dependencies**: No WalletConnect library needed
✅ **Better UX**: Single permission dialog
✅ **Lower Cost**: No WalletConnect infrastructure

## File Structure

```
src/
├── services/
│   └── metamaskService.ts      # Direct MetaMask integration
├── hooks/
│   └── useMetaMask.ts          # React hook wrapper
└── screens/
    └── AuthScreen.tsx          # Updated to use MetaMask
```

## Migration from WalletConnect

Old code:
```typescript
import { useWalletConnect } from '../hooks/useWalletConnect';
const projectId = process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID;
const walletConnect = useWalletConnect(projectId);
await walletConnect.connect();
```

New code:
```typescript
import { useMetaMask } from '../hooks/useMetaMask';
const metaMask = useMetaMask();
await metaMask.connect();
```

## Future Enhancements

- [ ] Hardware wallet support (Ledger, Trezor)
- [ ] Multi-wallet support (add WalletConnect back as option)
- [ ] Token swapping integration
- [ ] DeFi protocol interactions
- [ ] Gas fee estimation and optimization
- [ ] ENS name resolution
- [ ] WalletConnect as fallback for non-MetaMask wallets

## References

- [ethers.js Documentation](https://docs.ethers.org)
- [MetaMask Developer Docs](https://docs.metamask.io)
- [EIP-1193 Ethereum Provider](https://eips.ethereum.org/EIPS/eip-1193)
- [MetaMask Wallet API](https://docs.metamask.io/wallet/reference/json-rpc-api/)

## Recent Commits

- `054a9af` - Direct MetaMask integration implementation
- `8d89be4` - Add MetaMask service and hook
- `b4a6ea9` - Original deep link integration

## Support

For issues or questions:
1. Check error message
2. Verify MetaMask is installed
3. Check gas fees
4. Try restarting app
5. Check internet connection
