# Quick Start Guide

## Prerequisites

1. **Node.js** 18+ installed
2. **React Native** development environment set up
3. **Celo Wallet** (Valora) for testing
4. **PostgreSQL** database (for backend)
5. **Redis** (for caching and matchmaking)

## Setup Steps

### 1. Smart Contracts

```bash
cd contracts
npm install
cp .env.example .env
# Edit .env with your private key

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Alfajores testnet
npm run deploy:alfajores
```

**Important**: After deployment, copy the contract address and update it in:
- `mobile/src/constants/contracts.ts`
- `backend/.env`

### 2. Backend Services

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database and Redis URLs

# Set up database
createdb triviabattle
# Run migrations (create questions table)

# Start server
npm run dev
```

**Database Schema** (questions table):
```sql
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  category VARCHAR(50),
  difficulty VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Mobile App

```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with contract address and API URLs

# For Android
npm run android

# For iOS
npm run ios
```

## Testing Flow

1. **Deploy Contract**: Deploy to Alfajores testnet
2. **Start Backend**: Run backend server
3. **Start Mobile App**: Launch on device/emulator
4. **Connect Wallet**: Connect Valora wallet
5. **Create Match**: Start matchmaking with test CELO
6. **Play Game**: Answer questions and test flow

## Development Tips

### Testing Smart Contracts
- Use Hardhat console: `npx hardhat console --network alfajores`
- Test individual functions before full integration
- Monitor gas usage during development

### Testing Mobile App
- Use React Native Debugger for state inspection
- Monitor WebSocket connections in browser DevTools
- Test wallet connection flow thoroughly

### Testing Backend
- Use Postman/Insomnia for API testing
- Monitor WebSocket events with Socket.io client
- Check Redis queues for matchmaking state

## Common Issues

### Contract Deployment Fails
- Check you have testnet CELO in your account
- Verify private key in .env file
- Ensure network RPC URL is correct

### Wallet Connection Issues
- Make sure Valora app is installed
- Check WalletConnect configuration
- Verify network (Alfajores vs Mainnet)

### WebSocket Connection Fails
- Verify backend server is running
- Check CORS configuration
- Ensure WS_URL in mobile app matches backend

## Next Steps

1. Review [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for detailed architecture
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
3. Start implementing Phase 1 features
4. Set up CI/CD pipeline
5. Plan security audit

## Resources

- [Celo Documentation](https://docs.celo.org/)
- [Composer Kit](https://docs.celo.org/developer-resources/composer)
- [React Native Docs](https://reactnative.dev/)
- [Hardhat Docs](https://hardhat.org/docs)

