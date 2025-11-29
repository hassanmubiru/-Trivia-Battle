# MetaMask SDK Testing Guide

## Quick Test (5 minutes)

### Prerequisites
- MetaMask Mobile app installed on device/emulator
- Device connected to computer
- Expo CLI installed

### Step 1: Start Dev Server
```bash
cd mobile/trivia-battle-expo
npx expo start
```

### Step 2: Open App in MetaMask
1. Open MetaMask app on device
2. Tap browser icon (if available) or open dApp
3. Paste Expo QR code or manual URL
4. App should load

### Step 3: Test Connection
1. Tap "🦊 Connect MetaMask" button
2. MetaMask should show permission dialog
3. Approve the connection
4. Should see wallet address displayed
5. ✅ Connection successful!

### Step 4: Test Disconnection
1. Look for disconnect button
2. Tap to disconnect
3. Status should reset
4. ✅ Disconnection works!

## Full Test Suite (30 minutes)

### Test 1: Basic Connection Flow
- [ ] Launch app
- [ ] See "Connect MetaMask" button
- [ ] Tap button
- [ ] MetaMask prompt appears
- [ ] Approve in MetaMask
- [ ] Wallet address displays
- [ ] Can see chain ID (11142220)
- [ ] Connection status shows "Connected"

### Test 2: Account Display
- [ ] Check displayed address format: `0x...`
- [ ] Address matches MetaMask wallet
- [ ] Can copy address (if copy button exists)
- [ ] Address persists on navigation

### Test 3: Wallet Persistence
- [ ] Connect wallet
- [ ] Leave app
- [ ] Return to app
- [ ] Wallet should still be connected
- [ ] No need to re-approve

### Test 4: Disconnection
- [ ] While connected, disconnect
- [ ] Status changes to disconnected
- [ ] Address clears
- [ ] Can reconnect again

### Test 5: Error Handling
- [ ] Deny permission in MetaMask
- [ ] Should show error message
- [ ] Can retry connection

### Test 6: Network Detection
- [ ] Check displayed network
- [ ] Should show Celo Sepolia or current network
- [ ] Try switching network in MetaMask
- [ ] App should detect change

### Test 7: State Recovery
- [ ] Connect wallet
- [ ] Restart Expo dev server
- [ ] Check if connection is restored
- [ ] Should either restore or require fresh connection

### Test 8: WalletConnect Fallback
- [ ] Close MetaMask app
- [ ] Try to connect
- [ ] Should show WalletConnect QR code
- [ ] Scan with another wallet app
- [ ] Connection should work with alternative wallet

### Test 9: Navigation
- [ ] While connected, navigate screens
- [ ] Connection state should persist
- [ ] Address should be available across screens

### Test 10: Performance
- [ ] Measure app startup time
- [ ] Check memory usage (shouldn't be high)
- [ ] Monitor battery impact
- [ ] Test with poor network

## Advanced Tests (1 hour)

### Message Signing
```typescript
const { signMessage } = useMetaMaskSDK();
const sig = await signMessage('Test Message');
console.log('Signature:', sig);
```

**Expected**: 
- [ ] MetaMask shows sign dialog
- [ ] User can approve/reject
- [ ] Signature is valid (starts with 0x)

### Transaction Sending
```typescript
const { sendTransaction } = useMetaMaskSDK();
const txHash = await sendTransaction(
  '0x742d35Cc6634C0532925a3b844Bc9e7595f42e55',
  '1000000000000000000' // 1 ETH in wei
);
```

**Expected**:
- [ ] MetaMask shows transaction dialog
- [ ] Shows gas estimate
- [ ] User can approve/reject
- [ ] Returns transaction hash on success

### Chain Switching
```typescript
const { provider } = useMetaMaskSDK();
await provider?.request({
  method: 'wallet_switchEthereumChain',
  params: [{ chainId: '0x2b7e' }] // Celo Sepolia
});
```

**Expected**:
- [ ] MetaMask shows chain switch dialog
- [ ] Chain ID updates in app
- [ ] Connected account persists

### Balance Query
```typescript
const { address, provider } = useMetaMaskSDK();
const balance = await provider?.request({
  method: 'eth_getBalance',
  params: [address, 'latest']
});
const balanceInEth = parseInt(balance, 16) / 1e18;
```

**Expected**:
- [ ] Returns balance in wei
- [ ] Correctly converts to decimal
- [ ] Matches MetaMask balance

## Browser/Emulator Specific Tests

### Android Emulator
```bash
npx expo run:android
```

- [ ] App launches in emulator
- [ ] MetaMask app works (requires Play Store installed)
- [ ] QR code scanning works
- [ ] Connection succeeds
- [ ] No crashes or hangs

### iOS Simulator
```bash
npx expo run:ios
```

- [ ] App launches in simulator
- [ ] MetaMask deeplink works (if supported)
- [ ] WalletConnect fallback loads
- [ ] Connection process works
- [ ] No memory issues

### Web
```bash
npx expo start --web
```

- [ ] Web version loads
- [ ] MetaMask browser extension connects
- [ ] Alternative wallets work
- [ ] No React Native specific errors

## Troubleshooting

### "MetaMask provider not available"
```
Status: Expected in development
Fix: Use MetaMask app or WalletConnect
```

### "Connection timeout"
```
Status: Network issue
Fix: Check internet, restart Expo
```

### "Invalid RPC response"
```
Status: Network or RPC issue
Fix: Change RPC, check network settings
```

### "Transaction reverted"
```
Status: Contract issue (not SDK)
Fix: Check contract address and function
```

### Wallet state not persisting
```
Status: AsyncStorage might be disabled
Fix: Check AsyncStorage configuration
```

## Performance Benchmarks

### Target Metrics
- **App Startup**: < 5 seconds
- **Connect Time**: < 10 seconds
- **Memory Usage**: < 150MB (React Native baseline)
- **Bundle Size**: < 5MB

### How to Measure

```bash
# Bundle size
npm run build:web

# Memory (Android)
adb shell dumpsys meminfo | grep trivia

# Performance (timing)
console.time('metric-name');
// code
console.timeEnd('metric-name');
```

## Test Results Template

```markdown
# MetaMask SDK Test Results

**Date**: [DATE]
**Device**: [DEVICE TYPE]
**MetaMask Version**: [VERSION]
**Expo Version**: [VERSION]

## Basic Tests
- [ ] Connection: ✅/❌
- [ ] Display: ✅/❌
- [ ] Persistence: ✅/❌
- [ ] Disconnection: ✅/❌

## Issues Found
1. [Issue description]
2. [Issue description]

## Performance
- Startup time: ___ ms
- Memory: ___ MB
- Bundle: ___ MB

## Status: [PASS/FAIL]
```

## When to Move to Production

✅ All basic tests pass  
✅ No critical errors  
✅ Performance acceptable  
✅ Edge cases handled  
✅ Documentation complete  
✅ Team review passed  

Then:
1. Build release APK/IPA
2. Internal testing
3. Beta testing (TestFlight/Play Store beta)
4. App store submission
5. Launch!

## Support

- **Issue Found?**: Document in METAMASK_SDK_TESTING.md
- **Need Help?**: Check METAMASK_SDK_QUICKSTART.md
- **SDK Issues?**: https://github.com/MetaMask/metamask-sdk

---

**Last Updated**: November 29, 2025  
**Status**: Ready for Testing  
**Estimated Time**: 5-60 minutes depending on scope
