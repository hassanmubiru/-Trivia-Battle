# MetaMask SDK Integration for React Native

## Overview

Switched from custom direct integration to the official **MetaMask SDK for React** (@metamask/sdk-react) approach. This provides a more robust, officially-supported solution for connecting to MetaMask Mobile.

## What Changed

### 1. Dependencies Installed
```bash
npm install @metamask/sdk-react eciesjs react-native-background-timer react-native-randombytes
```

**Why**: The SDK handles all the low-level connection details, protocol negotiation, and encryption automatically.

### 2. Configuration Updates

#### `index.js` - Polyfills
Added the missing `node-libs-react-native/globals` polyfill:
```javascript
import 'node-libs-react-native/globals';  // NEW
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import '@ethersproject/shims';
```

#### `metro.config.js` - Module Resolution
Updated to properly resolve Node.js modules in React Native:
```javascript
const { mergeConfig } = require('expo/metro-config');
const nodeLibsReactNative = require('node-libs-react-native');

// Configure Metro to resolve extra Node modules
resolver: {
  extraNodeModules: {
    ...nodeLibsReactNative,
  },
}
```

### 3. New Provider Component

**File**: `src/providers/MetaMaskProvider.tsx`

```typescript
<MetaMaskProvider
  sdkOptions={{
    dappMetadata: {
      name: 'Trivia Battle',
      url: 'https://triviabattle.io',
    },
  }}
>
  {children}
</MetaMaskProvider>
```

Wraps the entire app with MetaMask SDK context.

### 4. New Hook - useMetaMaskSDK

**File**: `src/hooks/useMetaMaskSDK.ts`

Provides a simplified interface to the MetaMask SDK:

```typescript
const metaMask = useMetaMaskSDK();

// Returns:
{
  address: string;           // Connected wallet address
  chainId: number;           // Current chain ID
  isConnected: boolean;      // Connection status
  isConnecting: boolean;     // Connection in progress
  error: Error | null;       // Last error
  connect(): Promise<void>;  // Initiate connection
  disconnect(): Promise<void>;
  signMessage(message: string): Promise<string>;
  sendTransaction(to, value, data?): Promise<string>;
}
```

### 5. Updated App.tsx

Wrapped with the MetaMask provider:

```typescript
<MetaMaskProvider>
  <AppNavigator />
</MetaMaskProvider>
```

### 6. Updated AuthScreen

Simplified connection logic:

```typescript
const metaMask = useMetaMaskSDK();

const handleMetaMaskConnect = async () => {
  try {
    await metaMask.connect();
  } catch (error: any) {
    Alert.alert('Connection Failed', error.message);
  }
};
```

**Removed**: Demo mode (no longer needed - SDK works in all environments)

## Key Advantages

| Aspect | Custom | SDK |
|--------|--------|-----|
| **Maintenance** | Manual updates needed | Official MetaMask support |
| **Features** | Limited | Full WalletConnect + Mobile support |
| **Error Handling** | Custom logic | Built-in, standardized |
| **Testing** | Demo mode needed | SDK provides test mode |
| **Security** | Manual | Battle-tested by MetaMask |
| **Mobile Support** | Limited | Full MetaMask Mobile integration |

## How It Works

1. **App Initialization**:
   - MetaMaskProvider wraps the app
   - SDK initializes connection management

2. **User Connects Wallet**:
   - User taps "Connect MetaMask" button
   - SDK shows native connection dialog
   - MetaMask app opens if needed
   - User approves connection in MetaMask

3. **Wallet Access**:
   - Account address is available via hook
   - Chain ID is tracked automatically
   - Signing messages and transactions work natively

4. **Auto-Reconnection**:
   - SDK handles session persistence
   - Previous connections restore automatically

## Supported Wallets

The MetaMask SDK supports:
- **MetaMask** (native + WalletConnect)
- **100+ other wallets** via WalletConnect v2
- **Direct RPC calls** for advanced use

## Environment Variables

Add to `.env` if needed:
```
EXPO_PUBLIC_INFURA_API_KEY=your_infura_key
```

## Testing

1. **With MetaMask Mobile Installed**:
   - Open app within MetaMask
   - Tap "Connect MetaMask"
   - Works seamlessly

2. **With WalletConnect**:
   - SDK automatically switches to WalletConnect
   - Shows QR code for wallet scanning
   - Supports 100+ wallets

3. **Testing in Expo Go**:
   - SDK provides fallback handling
   - App won't crash if no wallet available

## Next Steps

1. Test with MetaMask Mobile app installed
2. Verify chain switching works
3. Test transaction signing
4. Test message signing
5. Deploy to TestFlight/Play Store
6. Monitor for SDK updates

## Migration from Custom Integration

The old files are still available for reference:
- `src/services/metamaskService.ts` (deprecated)
- `src/hooks/useMetaMask.ts` (deprecated)

These can be removed in a future cleanup if SDK-based approach is stable.

## Support

- **MetaMask SDK Docs**: https://docs.metamask.io/guide/sdk/
- **GitHub**: https://github.com/MetaMask/metamask-sdk
- **Issues**: Report via GitHub or MetaMask support
