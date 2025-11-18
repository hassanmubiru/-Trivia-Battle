# Trivia Battle - Decentralized Mobile Game

A mobile-first, decentralized trivia battle game built on the Celo blockchain, featuring real-time multiplayer gameplay, multi-stablecoin support, and seamless wallet onboarding via MiniPay SDK.

## 🎮 Overview

Trivia Battle is a competitive trivia game where players:
- Compete in real-time head-to-head or group matches
- Stake stablecoins (cUSD, USDC, USDT) to enter matches
- Earn rewards based on performance
- Climb leaderboards and challenge friends
- Authenticate with phone number via SocialConnect
- Enjoy seamless wallet experience with MiniPay SDK

## ✨ Key Features

### 🔐 Authentication & Wallet
- **MiniPay SDK Integration**: Seamless wallet onboarding
- **SocialConnect**: Phone number-based authentication
- **No Seed Phrases**: Simplified user experience

### 💰 Multi-Stablecoin Support
- **cUSD**: Celo Dollar (native, lowest gas)
- **USDC**: USD Coin on Celo
- **USDT**: Tether USD on Celo
- **Token Selection**: Users choose preferred payment token

### 🎯 Smart Contract Features
- **Secure Escrow**: Tokens held securely until match completion
- **Automatic Refunds**: For cancelled or expired matches
- **Transparent Prizes**: Winner-takes-all or proportional distribution
- **On-chain Leaderboards**: Immutable player rankings

### ⚡ Real-Time Gameplay
- **WebSocket Integration**: Live match updates
- **Synchronized Timers**: Real-time question countdown
- **Live Scores**: Instant score updates
- **Matchmaking**: Fast player pairing

## 📋 Project Structure

```
Trivia Battle/
├── contracts/                  # Solidity smart contracts
│   ├── TriviaBattle.sol        # Original contract
│   └── TriviaBattleV2.sol     # Enhanced with multi-token support
├── mobile/                     # React Native mobile app
│   └── src/
│       ├── services/           # Business logic services
│       ├── screens/            # Screen components
│       └── components/         # Reusable UI components
├── backend/                    # Node.js backend services
└── Documentation/              # All documentation files
```

## 🚀 Quick Start

1. **Navigate to Project**:
   ```bash
   cd "/home/error51/games/Trivia Battle"
   ```

2. **Deploy Contracts**: See [PROJECT_SETUP.md](./PROJECT_SETUP.md)
3. **Set Up Backend**: Configure database and WebSocket server
4. **Run Mobile App**: Install dependencies and launch
5. **Test on Alfajores**: Use testnet before mainnet deployment

## 📚 Documentation

- **[PROJECT_SETUP.md](./PROJECT_SETUP.md)**: Detailed setup guide
- **[DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md)**: Comprehensive development plan and architecture
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: System architecture and data flow
- **[SECURITY_AUDIT.md](./SECURITY_AUDIT.md)**: Security guidelines and compliance
- **[ENHANCED_FEATURES.md](./ENHANCED_FEATURES.md)**: Detailed feature documentation
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)**: Complete implementation overview
- **[QUICK_START.md](./QUICK_START.md)**: Quick start guide
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**: Complete file structure

## 🛠️ Development

### Smart Contracts
```bash
cd contracts
npx hardhat compile
npx hardhat test
npx hardhat deploy --network alfajores
```

### Mobile App
```bash
cd mobile
npm run android  # or npm run ios
```

### Backend Services
```bash
cd backend
npm run dev
```

## 🔒 Security

- Smart contracts include comprehensive security measures
- See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for detailed security guidelines
- **Important**: Conduct professional security audit before mainnet deployment

## 📱 Supported Platforms

- **iOS**: React Native iOS app
- **Android**: React Native Android app
- **Blockchain**: Celo (Alfajores Testnet → Mainnet)

## 🛠️ Tech Stack

- **Frontend**: React Native, TypeScript, Composer Kit
- **Smart Contracts**: Solidity 0.8.20+, OpenZeppelin
- **Backend**: Node.js, Express, Socket.io, PostgreSQL, Redis
- **Wallet**: MiniPay SDK, SocialConnect
- **Tokens**: cUSD, USDC, USDT

## 📝 Getting Started

For detailed setup instructions, see [PROJECT_SETUP.md](./PROJECT_SETUP.md).

---

**Status**: ✅ Implementation Complete - Ready for Testing & Audit
**Blockchain**: Celo (Alfajores Testnet → Mainnet)
**Platform**: React Native (iOS & Android)
**Location**: `/home/error51/games/Trivia Battle`
