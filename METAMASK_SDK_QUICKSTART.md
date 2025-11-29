# MetaMask SDK Setup - Quick Start

## Installation Complete ✅

The MetaMask SDK has been installed and configured for your React Native Expo project.

### What's Ready to Use

#### 1. MetaMask Connection Hook
```typescript
import { useMetaMaskSDK } from './hooks/useMetaMaskSDK';

function MyComponent() {
  const metaMask = useMetaMaskSDK();
  
  const connect = async () => {
    await metaMask.connect();
  };
  
  return (
    <button onClick={connect}>
      {metaMask.isConnected 
        ? `Connected: ${metaMask.address}` 
        : 'Connect MetaMask'}
    </button>
  );
}
```

#### 2. Direct Provider Access
```typescript
// Get raw Ethereum provider for advanced operations
const { provider } = useMetaMaskSDK();

const accounts = await provider?.request({
  method: 'eth_accounts',
  params: [],
});
```

#### 3. Transaction Signing
```typescript
const { signMessage, sendTransaction } = useMetaMaskSDK();

// Sign a message
const signature = await signMessage('Hello MetaMask!');

// Send transaction
const txHash = await sendTransaction(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f42e55', // to address
  '1000000000000000000', // 1 ETH in wei
);
```

### Environment Setup

#### Required Environment Variables
Create or update `.env` in the project root:

```env
# For Infura fallback (optional)
EXPO_PUBLIC_INFURA_API_KEY=your_infura_key_here

# Existing variables
GAME_CONTRACT_ADDRESS=0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869
RPC_URL=https://celo-sepolia-rpc.publicnode.com
CHAIN_ID=11142220
```

### Running the App

#### Development Mode
```bash
cd mobile/trivia-battle-expo
npx expo start

# Then in another terminal:
# For Android: npx expo run:android
# For iOS: npx expo run:ios
# Web: npx expo start --web
```

#### Testing MetaMask Connection

**Option 1: With MetaMask Mobile**
1. Install MetaMask app on device
2. Open this app from within MetaMask
3. Tap "🦊 Connect MetaMask" button
4. Approve connection in MetaMask
5. ✅ Connected!

**Option 2: With WalletConnect**
1. SDK automatically provides WalletConnect fallback
2. Tap "Connect MetaMask" button  
3. Scan QR code with any Web3 wallet
4. Approve connection
5. ✅ Connected!

**Option 3: Testing in Expo Go**
1. Open Expo Go app
2. Scan QR code from `npx expo start`
3. App will show error if wallet unavailable
4. Use actual MetaMask/WalletConnect for testing

### Key Files

| File | Purpose |
|------|---------|
| `src/providers/MetaMaskProvider.tsx` | SDK Provider wrapper |
| `src/hooks/useMetaMaskSDK.ts` | React hook for wallet connection |
| `src/screens/AuthScreen.tsx` | Updated to use SDK |
| `metro.config.js` | Module resolution for Node libs |
| `index.js` | Polyfills configuration |

### Common Tasks

#### Check if Wallet is Connected
```typescript
const { isConnected, address } = useMetaMaskSDK();

if (isConnected) {
  console.log('User wallet:', address);
}
```

#### Switch Network
```typescript
const { provider } = useMetaMaskSDK();

await provider?.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x2b7e' }], // Celo Sepolia
});
```

#### Get Balance
```typescript
const { address, provider } = useMetaMaskSDK();

const balance = await provider?.request({
  method: 'eth_getBalance',
  params: [address, 'latest'],
});
```

### Troubleshooting

#### "MetaMask provider not available"
- **Cause**: Wallet not installed or app not opened from MetaMask
- **Solution**: Use WalletConnect option or install MetaMask
- **For Testing**: Run with real MetaMask Mobile app

#### Build Errors
- Clear cache: `rm -rf node_modules/.cache`
- Rebuild: `npm install && npx expo start --clear`

#### Connection Timeout
- Check network connectivity
- Ensure MetaMask app is updated
- Try restarting Expo dev server

### Next Steps

1. ✅ MetaMask SDK installed
2. ✅ AuthScreen updated with SDK hook
3. ⏳ Test with MetaMask Mobile app
4. ⏳ Test with WalletConnect fallback
5. ⏳ Build for iOS/Android
6. ⏳ Deploy to app stores

### Documentation

- **MetaMask SDK**: https://docs.metamask.io/guide/sdk/
- **WalletConnect**: https://docs.walletconnect.com/
- **Expo**: https://docs.expo.dev/
- **Ethers.js**: https://docs.ethers.org/v6/

### Support

- Issues with SDK: GitHub (MetaMask/metamask-sdk)
- Issues with Expo: Expo Forum
- Issues with this project: Check METAMASK_SDK_MIGRATION.md

---

**Last Updated**: 2025-11-29  
**Status**: ✅ Ready for Testing
