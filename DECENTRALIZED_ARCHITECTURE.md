# Trivia Battle - Fully Decentralized Architecture

## 🎯 Overview

**Trivia Battle is now 100% decentralized** - everything runs on smart contracts and decentralized storage. No centralized backend servers needed!

## 🏗️ Architecture Components

### 1. Smart Contract (TriviaBattleV3)
**Address:** `0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869`  
**Network:** Celo Alfajores Testnet  
**Chain ID:** 44787

#### Contract Functions:

**Wallet Management**
- `deposit()` - Deposit CELO into your game wallet
- `withdraw(amount)` - Withdraw CELO from game wallet
- `getBalance(address)` - Check wallet balance

**Game Creation & Matchmaking**
- `createGame(stake)` - Create new game with stake amount
- `getAvailableGames()` - List games waiting for players
- `joinGame(gameId)` - Join an existing game
- `getGameInfo(gameId)` - Get game details

**Gameplay**
- `submitAnswer(gameId, questionIndex, answer)` - Submit answer on-chain
- `completeGame(gameId)` - Finalize game and distribute prizes

**Statistics**
- `getUserStats(address)` - Get player stats (games, wins, losses, earnings)
- `getLeaderboard(limit)` - Get top players
- `getUserGames(address)` - Get player's game history

### 2. Questions Storage

**Current:** Local fallback questions bundled with app  
**Future:** IPFS/Arweave for truly decentralized questions

Questions are stored by difficulty:
- **Quick Mode:** Easy questions (0.1 CELO stake)
- **Standard Mode:** Medium questions (0.5 CELO stake)
- **Premium Mode:** Hard questions (1.0 CELO stake)

Each question set contains 5 questions with:
- Question text
- 4 multiple choice options
- Correct answer index
- Category and difficulty

### 3. Mobile App (React Native + Expo)

**No backend needed!** App connects directly to:
- Celo blockchain via ethers.js
- IPFS/local storage for questions
- Smart contract events for real-time updates

## 🔄 How It Works

### Game Flow (Fully On-Chain)

```
1. Player Login
   ↓
   Store wallet address locally (AsyncStorage)
   
2. Home Screen
   ↓
   → Read balance from smart contract: getBalance(address)
   → Read stats from smart contract: getUserStats(address)
   
3. Create Game
   ↓
   → Call createGame(stake) - creates game on blockchain
   → Returns gameId
   
4. Matchmaking
   ↓
   → Check getAvailableGames()
   → If games exist: joinGame(gameId)
   → If no games: wait for opponent to join your game
   
5. Load Questions
   ↓
   → Fetch from IPFS or local storage
   → Questions stored decentralized (not on-chain to save gas)
   
6. Play Game
   ↓
   → Each answer: submitAnswer(gameId, questionIndex, answer)
   → Contract validates answer and updates score
   → Listen to AnswerSubmitted events for opponent's progress
   
7. Complete Game
   ↓
   → Call completeGame(gameId)
   → Contract determines winner based on scores
   → Prize automatically distributed to winner
   
8. Leaderboard
   ↓
   → Read from contract: getLeaderboard(100)
   → All stats stored on-chain
```

## 📱 App Services

### `blockchain.ts`
Handles all smart contract interactions:
- Provider setup (Celo RPC)
- Contract instance creation
- Read functions (balances, stats, leaderboard)
- Write functions (deposit, withdraw, create game, submit answer)
- Event listening (real-time game updates)

### `questionsService.ts`
Manages trivia questions:
- Fetch from IPFS (when implemented)
- Local fallback questions
- Question shuffling
- Mode-specific question sets

## 🔒 Security & Privacy

### Wallet Storage
- Private keys stored in encrypted AsyncStorage
- Never transmitted to any server
- Only used for signing transactions locally

### Transaction Signing
All transactions signed locally on device:
```typescript
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(address, abi, wallet);
const tx = await contract.functionName(args);
```

### Data Privacy
- No personal data collected
- No email/password required
- Only phone number (optional) for display
- Wallet address is pseudonymous

## ⛽ Gas Optimization

### Read Operations (FREE)
- `getBalance()`
- `getUserStats()`
- `getLeaderboard()`
- `getAvailableGames()`
- `getGameInfo()`

### Write Operations (GAS REQUIRED)
- `deposit()` - ~50k gas
- `withdraw()` - ~40k gas
- `createGame()` - ~100k gas
- `joinGame()` - ~80k gas
- `submitAnswer()` - ~60k gas per answer
- `completeGame()` - ~120k gas

**Total game cost:** ~400-500k gas (~$0.01-0.02 USD on Celo)

## 🚀 Deployment & Testing

### 1. Smart Contract
Already deployed to Celo Alfajores testnet. To deploy to mainnet:

```bash
cd contracts
npx hardhat run scripts/deployV3.js --network celo-mainnet
```

Update `CONTRACT_ADDRESS` in `blockchain.ts` with new address.

### 2. Questions to IPFS (Optional)

```bash
# Install IPFS CLI
npm install -g ipfs

# Add questions to IPFS
ipfs add questions-quick.json
ipfs add questions-standard.json
ipfs add questions-premium.json

# Update IPFS hashes in questionsService.ts
```

### 3. Mobile App

```bash
cd mobile/trivia-battle-expo

# Install dependencies
npm install

# Build for Android
npx expo run:android

# Build for iOS
npx expo run:ios
```

## 🧪 Testing

### Test Wallet Setup
1. Create test wallet on Celo Alfajores
2. Get testnet CELO from faucet: https://faucet.celo.org
3. Import wallet to app using private key
4. Start playing!

### Test Flow
```bash
# 1. Check balance
const balance = await getWalletBalance(address);

# 2. Deposit funds
await depositFunds(privateKey, 1.0);

# 3. Create game
const { gameId } = await createGame(privateKey, 0.5);

# 4. Check game info
const game = await getGameInfo(gameId);

# 5. Submit answer
await submitAnswer(privateKey, gameId, 0, 2);

# 6. Complete game
await completeGameOnChain(privateKey, gameId);
```

## 📊 Contract Events

Listen to events for real-time updates:

```typescript
// Game created
event GameCreated(uint256 gameId, address creator, uint256 stake)

// Player joined
event GameJoined(uint256 gameId, address player)

// Answer submitted
event AnswerSubmitted(uint256 gameId, address player, uint8 questionIndex, bool correct)

// Game finished
event GameCompleted(uint256 gameId, address winner, uint256 prize)
```

## 🎮 User Experience

### No Account Creation
- Users connect with existing Celo wallet
- Or create new wallet in-app
- No email, password, or KYC required

### Instant Transactions
- Celo's 5-second block time
- Fast game creation and matching
- Real-time score updates via events

### Low Cost
- ~$0.01-0.02 per complete game
- Much cheaper than Ethereum mainnet
- Celo optimized for mobile payments

## 🔮 Future Enhancements

### 1. IPFS Integration
- Upload questions to IPFS
- Store IPFS hashes in contract
- Truly decentralized question storage

### 2. Arweave Permanent Storage
- Permanent question storage
- Guaranteed availability
- One-time payment for forever storage

### 3. Chainlink VRF
- Verifiable random question selection
- Fair and transparent
- Prevents question prediction

### 4. NFT Rewards
- Mint NFTs for achievements
- Rare NFTs for top players
- Tradeable on OpenSea/Celo NFT markets

### 5. DAO Governance
- Community votes on questions
- Stake TRIVIA tokens for voting power
- Decentralized moderation

### 6. Multi-Chain Support
- Deploy to Polygon, BSC, Arbitrum
- Cross-chain leaderboards
- Unified token across chains

## 📝 Contract Upgrade Path

Current: TriviaBattleV3  
Future: Use proxy pattern (OpenZeppelin UUPS)

```solidity
contract TriviaBattleV4 is Initializable, UUPSUpgradeable {
  // Upgradeable without losing state
}
```

## 🛠️ Development Tools

- **Hardhat:** Smart contract development
- **Ethers.js v6:** Blockchain interaction
- **Expo/React Native:** Mobile app
- **TypeScript:** Type safety
- **AsyncStorage:** Local wallet storage

## 📚 Resources

- [Celo Docs](https://docs.celo.org)
- [Ethers.js Docs](https://docs.ethers.org)
- [IPFS Docs](https://docs.ipfs.tech)
- [Expo Docs](https://docs.expo.dev)

## 🤝 Contributing

The project is fully open source and decentralized. Anyone can:
1. Fork the repo
2. Deploy their own contract
3. Modify questions
4. Launch their own version

No permission needed! 🎉

---

**Built with ❤️ on Celo blockchain**
