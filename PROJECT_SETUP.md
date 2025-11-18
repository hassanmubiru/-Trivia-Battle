# Project Setup Guide

Complete guide to set up and run the Trivia Battle project.

## Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **React Native CLI** (`npm install -g react-native-cli`)
- **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))
- **Redis** 6+ ([Download](https://redis.io/download))
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Celo Development Tools
- **Hardhat** (included in contracts package)
- **Celo Wallet** (Valora app for testing)

## Step-by-Step Setup

### 1. Navigate to Project Directory
```bash
cd "/home/error51/games/Trivia Battle"
```

### 2. Smart Contracts Setup

```bash
cd contracts
npm install

# Create .env file
cat > .env << EOF
PRIVATE_KEY=your_private_key_here
ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org
CELO_RPC_URL=https://forno.celo.org
EOF

# Compile contracts
npm run compile

# Run tests
npm run test
```

**Note**: Replace `your_private_key_here` with a test account private key (never use mainnet keys in .env files).

### 3. Backend Setup

```bash
cd ../backend
npm install

# Create .env file
cat > .env << EOF
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/triviabattle
REDIS_URL=redis://localhost:6379
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
CONTRACT_ADDRESS=
JWT_SECRET=your_jwt_secret_here
WS_URL=ws://localhost:3001
EOF

# Set up PostgreSQL database
createdb triviabattle

# Run migrations
psql triviabattle < src/migrations/001_create_questions_table.sql

# Start Redis (if not running)
redis-server

# Start backend server
npm run dev
```

### 4. Mobile App Setup

```bash
cd ../mobile
npm install

# Install iOS pods (macOS only)
cd ios && pod install && cd ..

# Create .env file
cat > .env << EOF
CELO_NETWORK=alfajores
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
CONTRACT_ADDRESS=
API_URL=http://localhost:3001
WS_URL=ws://localhost:3001
MINIPAY_API_KEY=your_minipay_api_key
WALLET_CONNECT_PROJECT_ID=your_project_id
EOF

# For Android
npm run android

# For iOS (macOS only)
npm run ios
```

## Configuration Details

### Environment Variables

#### Contracts (.env)
- `PRIVATE_KEY`: Private key for deploying contracts (testnet only)
- `ALFAJORES_RPC_URL`: Celo testnet RPC endpoint
- `CELO_RPC_URL`: Celo mainnet RPC endpoint

#### Backend (.env)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `CONTRACT_ADDRESS`: Deployed contract address (after deployment)
- `JWT_SECRET`: Secret for JWT token signing

#### Mobile (.env)
- `CONTRACT_ADDRESS`: Deployed contract address
- `MINIPAY_API_KEY`: MiniPay SDK API key
- `WALLET_CONNECT_PROJECT_ID`: WalletConnect project ID

## Deployment Workflow

### 1. Deploy Contracts to Testnet

```bash
cd contracts
npm run deploy:alfajores
```

**Output**: Contract address will be displayed. Copy this address.

### 2. Update Contract Address

Update the contract address in:
- `mobile/src/constants/contracts.ts`
- `backend/.env`

### 3. Verify Deployment

```bash
# Check contract on CeloScan
# https://alfajores.celoscan.io/address/YOUR_CONTRACT_ADDRESS
```

## Testing

### Smart Contracts
```bash
cd contracts
npm run test
```

### Mobile App
```bash
cd mobile
npm run test
```

### Backend
```bash
cd backend
npm run test
```

## Troubleshooting

### Common Issues

#### 1. Metro Bundler Issues
```bash
cd mobile
npm start -- --reset-cache
```

#### 2. Pod Installation Issues (iOS)
```bash
cd mobile/ios
pod deintegrate
pod install
```

#### 3. Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check connection string format
- Ensure database exists: `psql -l`

#### 4. Redis Connection Issues
- Verify Redis is running: `redis-cli ping`
- Check Redis URL format

#### 5. Contract Deployment Issues
- Verify you have testnet CELO in your account
- Check RPC URL is correct
- Ensure private key is set correctly

## Development Workflow

### 1. Start All Services
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Mobile (Android)
cd mobile && npm run android

# Terminal 3: Mobile (iOS - macOS only)
cd mobile && npm run ios
```

### 2. Make Changes
- Smart contracts: Edit `.sol` files, compile, test, deploy
- Backend: Edit `.js` files, server auto-reloads
- Mobile: Edit `.tsx` files, Metro bundler hot-reloads

### 3. Test Changes
- Run unit tests
- Test on device/emulator
- Verify blockchain interactions

## Next Steps

1. **Deploy to Testnet**: Follow deployment workflow
2. **Test Integration**: Test full flow end-to-end
3. **Security Audit**: Review `SECURITY_AUDIT.md`
4. **Beta Testing**: Test with real users
5. **Mainnet Deployment**: After audit and testing

## Resources

- [Celo Documentation](https://docs.celo.org/)
- [React Native Docs](https://reactnative.dev/)
- [Hardhat Docs](https://hardhat.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Redis Docs](https://redis.io/documentation)

---

**Need Help?** Check the documentation files or review error messages carefully.

