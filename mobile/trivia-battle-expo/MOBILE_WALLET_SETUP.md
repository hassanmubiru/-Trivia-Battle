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

1. **Install WalletConnect v2:**
   ```bash
   npm install @walletconnect/react-native-compat @walletconnect/web3wallet
   ```

2. **Create WalletConnect Service:**
   ```typescript
   // src/services/walletConnectService.ts
   import { EthereumProvider } from '@walletconnect/ethereum-provider';

   export class WalletConnectService {
     private provider: EthereumProvider | null = null;

     async initialize() {
       this.provider = await EthereumProvider.init({
         projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID', // Get from https://cloud.walletconnect.com
         chains: [11142220], // Celo Sepolia
         methods: ['eth_sendTransaction', 'eth_signMessage', 'personal_sign'],
         events: ['chainChanged', 'accountsChanged'],
         showQrModal: true,
       });
     }

     async connect() {
       const accounts = await this.provider?.request({
         method: 'eth_requestAccounts',
       });
       return accounts?.[0];
     }

     async sendTransaction(tx: any) {
       return this.provider?.request({
         method: 'eth_sendTransaction',
         params: [tx],
       });
     }
   }
   ```

3. **Update AuthScreen to use WalletConnect:**
   ```typescript
   const handleWalletConnectConnect = async () => {
     try {
       const service = new WalletConnectService();
       await service.initialize();
       const address = await service.connect();
       // Connected!
     } catch (error) {
       console.error('WalletConnect connection failed', error);
     }
   };
   ```

4. **Get ProjectId:**
   - Go to https://cloud.walletconnect.com
   - Sign up/Login
   - Create a new project
   - Copy your Project ID
   - Add to your app config

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
