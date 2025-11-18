# Project Structure

Complete file structure of the Trivia Battle project.

```
games/
├── 📄 Documentation
│   ├── README.md                      # Main project README
│   ├── DEVELOPMENT_PLAN.md            # Comprehensive development plan
│   ├── ARCHITECTURE.md                # System architecture
│   ├── SECURITY_AUDIT.md             # Security guidelines
│   ├── ENHANCED_FEATURES.md           # Enhanced features docs
│   ├── IMPLEMENTATION_SUMMARY.md      # Implementation overview
│   ├── IMPLEMENTATION_CHECKLIST.md    # Phase-by-phase checklist
│   ├── QUICK_START.md                 # Quick start guide
│   ├── PROJECT_SETUP.md               # Detailed setup guide
│   └── PROJECT_STRUCTURE.md           # This file
│
├── 📁 contracts/                      # Smart Contracts
│   ├── contracts/
│   │   └── MockERC20.sol              # Mock ERC20 for testing
│   ├── test/
│   │   └── TriviaBattle.test.js        # Contract tests
│   ├── scripts/
│   │   └── deploy.js                   # Deployment script
│   ├── TriviaBattle.sol                # Original contract
│   ├── TriviaBattleV2.sol              # Enhanced contract (multi-token)
│   ├── hardhat.config.js               # Hardhat configuration
│   ├── package.json                    # Contract dependencies
│   └── .gitignore
│
├── 📁 mobile/                         # React Native Mobile App
│   ├── src/
│   │   ├── components/
│   │   │   └── TokenSelector.tsx      # Token selection UI
│   │   ├── constants/
│   │   │   └── contracts.ts            # Contract ABIs & addresses
│   │   ├── screens/
│   │   │   └── Auth/
│   │   │       └── PhoneAuthScreen.tsx # Phone authentication
│   │   ├── services/
│   │   │   ├── celoService.ts          # Celo blockchain interactions
│   │   │   ├── miniPayService.ts       # MiniPay SDK integration
│   │   │   ├── tokenService.ts          # Multi-token management
│   │   │   ├── gameService.ts           # Game logic
│   │   │   └── websocketService.ts     # Real-time communication
│   │   ├── store/
│   │   │   ├── slices/
│   │   │   │   ├── walletSlice.ts      # Wallet state
│   │   │   │   ├── gameSlice.ts        # Game state
│   │   │   │   ├── userSlice.ts        # User state
│   │   │   │   └── leaderboardSlice.ts # Leaderboard state
│   │   │   └── store.ts                # Redux store config
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript types
│   │   └── utils/
│   │       └── formatting.ts           # Formatting utilities
│   ├── App.tsx                         # Main app component
│   ├── index.js                        # App entry point
│   ├── app.json                        # App configuration
│   ├── package.json                    # Dependencies
│   ├── tsconfig.json                   # TypeScript config
│   ├── babel.config.js                 # Babel config
│   ├── metro.config.js                 # Metro bundler config
│   ├── jest.config.js                  # Jest test config
│   ├── jest.setup.js                   # Jest setup
│   └── .gitignore
│
├── 📁 backend/                        # Node.js Backend
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js            # Database configuration
│   │   ├── migrations/
│   │   │   └── 001_create_questions_table.sql
│   │   └── index.js                    # Main server file
│   ├── package.json                    # Backend dependencies
│   └── .gitignore
│
└── 📄 Root Files
    └── .gitignore                      # Git ignore rules
```

## File Count Summary

- **Smart Contracts**: 3 Solidity files + tests
- **Mobile App**: 20+ TypeScript/TSX files
- **Backend**: 3 JavaScript files + migrations
- **Documentation**: 10+ markdown files
- **Configuration**: Multiple config files

## Key Components

### Smart Contracts
- **TriviaBattleV2.sol**: Main game contract with multi-token support
- **MockERC20.sol**: Testing utility
- **deploy.js**: Deployment script

### Mobile Services
- **miniPayService.ts**: MiniPay SDK & SocialConnect integration
- **tokenService.ts**: Multi-stablecoin management
- **celoService.ts**: Celo blockchain interactions
- **gameService.ts**: Game state management
- **websocketService.ts**: Real-time updates

### Mobile UI
- **PhoneAuthScreen.tsx**: Phone number authentication
- **TokenSelector.tsx**: Token selection component
- **App.tsx**: Main app with navigation

### State Management
- **Redux Store**: Centralized state management
- **Slices**: Wallet, Game, User, Leaderboard

### Backend
- **index.js**: Express server with WebSocket
- **database.js**: PostgreSQL configuration
- **Migrations**: Database schema

## Next Steps

1. **Install Dependencies**: Run `npm install` in each directory
2. **Configure Environment**: Set up `.env` files
3. **Deploy Contracts**: Deploy to Alfajores testnet
4. **Start Backend**: Run backend server
5. **Run Mobile App**: Launch on device/emulator

See [PROJECT_SETUP.md](./PROJECT_SETUP.md) for detailed setup instructions.

