# 🚀 APP CONFIGURATION & SETUP GUIDE

**Status**: ✅ ENVIRONMENT CONFIGURED  
**Date**: November 29, 2025  
**Network**: Celo Sepolia Testnet

---

## ✅ Configuration Complete

The `.env` file has been created in `mobile/trivia-battle-expo/` with all real smart contract addresses.

### Files Created
- ✅ `.env` - Configuration file with real contract addresses
- ✅ `.env.example` - Template for reference

---

## 📋 What's Configured

### Game Contract
```
Address: 0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869
Status:  ✅ Deployed & Verified
Network: Celo Sepolia
```

### Real Tokens
```
cUSD:  0xc2FB5a20d07036d828cBbF2FCEE5cea02cc9Cb2f
USDC:  0x360Da2CcFE307B5CB0330d062d8D83B721811B76
USDT:  0xE5eA34847A04d197B22652be1Dc8FbFf11392239
```

### Network
```
RPC:      https://celo-sepolia-rpc.publicnode.com
Chain ID: 11142220
Explorer: https://celo-sepolia.blockscout.com
```

---

## 🛠️ Next Steps

### Step 1: Install Dependencies
```bash
cd mobile/trivia-battle-expo
npm install
```

### Step 2: Start Development Server
```bash
npm start
```

This will display a QR code you can scan with Expo Go on your phone.

### Step 3: Open App in Expo Go
1. Install Expo Go on your mobile device
2. Scan the QR code from terminal
3. Wait for app to load

---

## 🧪 Testing Checklist

### Before Testing
- [ ] `.env` file created with real contract addresses
- [ ] `npm install` completed
- [ ] MetaMask or MiniPay wallet installed on device
- [ ] Device connected to same network as development computer

### Test Wallet Connection
1. Open app in Expo Go
2. Look for "Connect Wallet" button
3. Click to open wallet selection
4. Select MetaMask or MiniPay
5. Approve connection request
6. Verify wallet address displays in app

### Get Test Tokens
1. Copy your wallet address from app
2. Go to: https://celo-sepolia-faucet.vercel.app/
3. Paste wallet address
4. Click "Request Tokens"
5. Wait 1-2 minutes for cUSD to arrive
6. Verify balance in app

### Test Game Creation
1. Open app
2. Click "Create Match"
3. Enter stake amount (e.g., 10 cUSD)
4. Click "Create"
5. Approve transaction in MetaMask/MiniPay
6. Watch for confirmation

### Verify on Block Explorer
1. Copy transaction hash from app
2. Go to: https://celo-sepolia.blockscout.com/
3. Paste transaction hash in search
4. Verify:
   - Transaction status: Success ✅
   - From address: Your wallet
   - To address: Game contract
   - Value transferred: Your stake amount

---

## 📱 Development Commands

### Start Development Server
```bash
npm start
```
Starts Expo development server with QR code for mobile scanning.

### Run on Android
```bash
npm run android
```
Launches app on connected Android device/emulator.

### Run on iOS
```bash
npm run ios
```
Launches app on iOS simulator.

### Run on Web
```bash
npm run web
```
Launches app in web browser (limited blockchain support).

---

## 🔐 Important Security Notes

### Private Keys
- ❌ Never expose private keys in `.env`
- ✅ MetaMask/MiniPay stores keys securely
- ✅ App signs transactions only with user approval

### Environment Variables
- ✅ `.env` is gitignored (won't commit to repo)
- ✅ `.env.example` shows template without sensitive data
- ✅ Safe to share `.env.example` but not `.env`

### Testnet vs Mainnet
- ℹ️ Current config uses Celo Sepolia testnet
- ℹ️ For mainnet: update RPC and contract addresses
- ℹ️ Testnet tokens have no real value

---

## 🐛 Troubleshooting

### "Module not found" Error
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "Cannot read property 'length' of undefined"
- Make sure `.env` file exists and has all required variables
- Restart development server: `Ctrl+C` then `npm start`

### Wallet Connection Fails
- Check MetaMask is installed on device
- Verify device is on same network as development computer
- Try killing Expo server and restarting: `npm start`

### Transaction Fails
- Check you have enough cUSD tokens
- Verify `.env` has correct contract address
- Check gas fees are reasonable

### Can't see transactions on explorer
- Verify chain ID is 11142220
- Check explorer shows Celo Sepolia network
- Wait 1-2 minutes for block confirmation

---

## 📊 Configuration Summary

| Item | Value |
|------|-------|
| **Game Contract** | 0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869 |
| **Network** | Celo Sepolia |
| **Chain ID** | 11142220 |
| **RPC Endpoint** | https://celo-sepolia-rpc.publicnode.com |
| **Block Explorer** | https://celo-sepolia.blockscout.com |
| **cUSD Address** | 0xc2FB5a20d07036d828cBbF2FCEE5cea02cc9Cb2f |
| **USDC Address** | 0x360Da2CcFE307B5CB0330d062d8D83B721811B76 |
| **USDT Address** | 0xE5eA34847A04d197B22652be1Dc8FbFf11392239 |

---

## 🔗 Useful Links

### Celo Sepolia Resources
- **Faucet**: https://celo-sepolia-faucet.vercel.app/
- **Explorer**: https://celo-sepolia.blockscout.com/
- **RPC**: https://celo-sepolia-rpc.publicnode.com

### Wallets
- **MetaMask**: https://metamask.io/
- **MiniPay**: https://minipay.opera.com/

### Contract
- **Game Contract**: 0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869
- **View on Explorer**: https://celo-sepolia.blockscout.com/address/0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869

---

## ✨ Ready to Go!

Your app is now configured with:
- ✅ Real game contract (deployed)
- ✅ Real token support (no mocks)
- ✅ Proper network configuration
- ✅ All environment variables set

**Next**: Run `npm install && npm start` to begin development!

---

**Status**: 🚀 READY FOR DEVELOPMENT  
**Configuration**: ✅ COMPLETE  
**Date**: November 29, 2025
