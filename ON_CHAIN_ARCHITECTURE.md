# 🎮 TriviaBattle V3 - Fully On-Chain Architecture

## ⚡ No Database Required!

**TriviaBattleV3** is a completely decentralized trivia game where **everything** lives on the blockchain:

✅ **Questions** - Stored on-chain  
✅ **Matches** - Created and managed on-chain  
✅ **Scores** - Calculated and stored on-chain  
✅ **Prizes** - Held in escrow and distributed on-chain  
✅ **Player Stats** - Tracked on-chain  
✅ **Leaderboard** - Derived from on-chain data  

---

## 🚀 Quick Start

### 1. Deploy Contract

```bash
cd contracts
npx hardhat run scripts/deployV3.js --network celo-sepolia
```

### 2. Add Supported Tokens

```bash
npx hardhat run scripts/addTokensV3.js --network celo-sepolia
```

### 3. Seed Questions

```bash
npx hardhat run scripts/seedQuestions.js --network celo-sepolia
```

### 4. Test Everything

```bash
npx hardhat run scripts/testV3.js --network celo-sepolia
```

---

## 📋 Current Deployment

**Contract Address**: `0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869`  
**Network**: Celo Sepolia Testnet  
**Chain ID**: 11142220  
**Explorer**: https://celo-sepolia.blockscout.com/address/0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869

### Supported Tokens
- **mcUSD**: `0xc2FB5a20d07036d828cBbF2FCEE5cea02cc9Cb2f`
- **mUSDC**: `0x360Da2CcFE307B5CB0330d062d8D83B721811B76`
- **mUSDT**: `0xE5eA34847A04d197B22652be1Dc8FbFf11392239`

### Questions Seeded
- **Total**: 30 questions
- **Active**: 30 questions
- **Categories**: Geography, Science, Art, History, Math, Sports, Technology, Music, Literature

---

## 🎯 How It Works

### For Players

1. **Browse Questions** - Read questions directly from the blockchain
2. **Create Match** - Specify token, entry fee, players, and question count
3. **Join Match** - Find and join existing matches
4. **Play** - Answer questions; contract auto-scores in real-time
5. **Win Prizes** - Winners claim prizes from escrow

### For Developers

#### Create a Match

```javascript
const contract = await ethers.getContractAt("TriviaBattleV3", contractAddress);
const token = await ethers.getContractAt("MockERC20", tokenAddress);

// Approve tokens
await token.approve(contractAddress, entryFee);

// Create match
await contract.createMatch(
  tokenAddress,  // Payment token
  entryFee,      // Entry fee amount
  2,             // Max players (2-10)
  5,             // Questions per match (5-20)
  true           // Auto-start when full
);
```

#### Join a Match

```javascript
// Approve tokens first
await token.approve(contractAddress, entryFee);

// Join match
await contract.joinMatch(matchId);

// If autoStart is true and match is full, it starts automatically!
```

#### Submit Answers

```javascript
// Submit answer (0-3 for multiple choice)
await contract.submitAnswer(matchId, questionId, answerIndex);

// Contract automatically:
// - Checks if correct
// - Updates score
// - Emits event
// - Auto-ends match when all players finish
```

#### Claim Prize

```javascript
// After match ends
await contract.claimPrize(matchId);

// Contract automatically:
// - Verifies you're a winner
// - Calculates prize split
// - Deducts platform fee (5%)
// - Transfers tokens from escrow
```

---

## 🏗️ Contract Architecture

### Question Management

```solidity
struct Question {
    uint256 id;
    string questionText;
    string[4] options;
    uint8 correctAnswer;  // 0-3
    string category;
    uint8 difficulty;     // 1-5
    bool isActive;
}
```

**Owner Functions:**
- `addQuestion()` - Add single question
- `addQuestionsBatch()` - Add multiple questions (gas efficient)
- `deactivateQuestion()` - Disable question without deleting

**View Functions:**
- `getQuestion(id)` - Get question details (without correct answer for players)
- `getTotalQuestions()` - Count all questions
- `getActiveQuestionsCount()` - Count active questions
- `getRandomQuestions(count, seed)` - Get random questions for match

### Match Management

```solidity
struct Match {
    uint256 matchId;
    address[] players;
    address token;
    uint256 entryFee;
    uint256 prizePool;
    uint256 escrowAmount;
    uint256[] questionIds;
    mapping(address => uint256) scores;
    mapping(address => mapping(uint256 => uint8)) answers;
    MatchStatus status;        // Waiting, Active, Completed, Cancelled
    uint256 startTime;
    uint256 endTime;
    uint8 maxPlayers;
    uint8 currentPlayers;
    uint8 questionsPerMatch;
    bool autoStart;
}
```

**Player Functions:**
- `createMatch()` - Create new match
- `joinMatch()` - Join existing match
- `submitAnswer()` - Answer question
- `claimPrize()` - Claim winnings
- `cancelMatch()` - Cancel waiting match (creator only)

**View Functions:**
- `getMatchDetails()` - Get match info
- `getMatchQuestions()` - Get question IDs for match
- `getPlayerScore()` - Get player's score
- `getActiveMatches()` - List all waiting matches

### Player Statistics

```solidity
struct PlayerStats {
    uint256 totalWins;
    uint256 totalEarnings;
    uint256 totalMatches;
    uint256 totalCorrectAnswers;
    uint256 highestScore;
    uint256 lastPlayedAt;
}
```

**View Functions:**
- `getPlayerStats()` - Get player's lifetime stats
- `getPlayerMatches()` - Get all matches player participated in

---

## 🔐 Security Features

### Escrow System
- All entry fees locked in contract
- Released only to winners or refunded if cancelled
- Platform fees accumulated separately

### Reentrancy Protection
- All state-changing functions use `nonReentrant` modifier
- SafeERC20 for token transfers

### Access Control
- Owner-only functions for admin tasks
- Player validation for match participation
- Answer submission validation

### Pausable
- Emergency pause functionality
- Owner can pause/unpause contract

---

## 💡 Backend Architecture (Stateless)

The backend is now **optional** and stateless:

### What Backend Does (Optional)
1. **WebSocket Server** - Real-time event streaming to mobile apps
2. **Event Polling** - Monitor blockchain events
3. **Caching** - Cache frequently accessed contract data
4. **API Gateway** - RESTful API for easier mobile integration

### What Backend Does NOT Do
- ❌ Store questions
- ❌ Store matches
- ❌ Store scores
- ❌ Store player data
- ❌ Manage game logic
- ❌ Handle payments

### Backend Setup

```bash
cd backend

# Update .env with V3 contract address
CONTRACT_ADDRESS=0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869
CONTRACT_VERSION=V3

# Install dependencies
npm install

# Start server (optional)
npm start
```

**Backend Dependencies:**
- `ethers` - Interact with blockchain
- `ws` - WebSocket server
- `express` - REST API
- `node-cache` - In-memory caching

**No More:**
- ❌ PostgreSQL
- ❌ Database migrations
- ❌ Question seeding scripts
- ❌ Match state management

---

## 📱 Mobile App Integration

### Update Contract Address

```typescript
// mobile/src/constants/contracts.ts
export const CONTRACTS = {
  TRIVIA_BATTLE: {
    address: "0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869",
    version: "V3",
    chainId: 11142220,
  },
};
```

### Read Questions from Chain

```typescript
// Get total questions
const totalQuestions = await contract.getTotalQuestions();

// Get a question
const question = await contract.getQuestion(questionId);

// Get random questions for preview
const randomQuestions = await contract.getRandomQuestions(5, Date.now());
```

### Create and Play Match

```typescript
// Create match
const tx = await contract.createMatch(
  tokenAddress,
  ethers.parseUnits("1", 18),
  2,    // 2 players
  5,    // 5 questions
  true  // auto-start
);

// Join match
await contract.joinMatch(matchId);

// Submit answers
await contract.submitAnswer(matchId, questionId, answerIndex);

// Claim prize
await contract.claimPrize(matchId);
```

### Listen to Events

```typescript
// Match created
contract.on("MatchCreated", (matchId, creator, token, entryFee) => {
  console.log("New match created:", matchId);
});

// Match started
contract.on("MatchStarted", (matchId, questionIds) => {
  console.log("Match started with questions:", questionIds);
});

// Answer submitted
contract.on("AnswerSubmitted", (matchId, player, questionId, answer, isCorrect) => {
  console.log("Answer:", isCorrect ? "Correct!" : "Wrong");
});

// Match ended
contract.on("MatchEnded", (matchId, winners, scores, prizePerWinner) => {
  console.log("Winners:", winners);
});
```

---

## 🧪 Testing

### Interactive Console

```bash
npx hardhat console --network celo-sepolia
```

```javascript
// Get contract
const contract = await ethers.getContractAt("TriviaBattleV3", "0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869");

// Browse questions
const q = await contract.getQuestion(1);
console.log(q.questionText);
console.log(q.options);

// Check tokens
const isSupported = await contract.supportedTokens("TOKEN_ADDRESS");

// Get active matches
const matches = await contract.getActiveMatches();
console.log("Active matches:", matches);

// Check player stats
const stats = await contract.getPlayerStats("PLAYER_ADDRESS");
console.log("Wins:", stats.totalWins.toString());
```

### Full Match Test

See `contracts/scripts/testV3.js` for complete test flow.

---

## ⛽ Gas Costs

| Operation | Estimated Gas | Cost (at 5 Gwei) |
|-----------|---------------|------------------|
| Add Question | ~200,000 | ~$0.01 |
| Add 10 Questions Batch | ~2,900,000 | ~$0.15 |
| Create Match | ~250,000 | ~$0.01 |
| Join Match | ~150,000 | ~$0.008 |
| Submit Answer | ~100,000 | ~$0.005 |
| Claim Prize | ~120,000 | ~$0.006 |

*Note: Celo gas fees are typically very low*

---

## 🎨 Features

### ✅ Implemented

- [x] Fully on-chain question storage
- [x] Dynamic match creation (2-10 players)
- [x] Flexible question count (5-20 per match)
- [x] Multi-token support (cUSD, USDC, USDT)
- [x] Automatic match start
- [x] Real-time scoring
- [x] Escrow system
- [x] Winner calculation with tie-handling
- [x] Prize distribution
- [x] Player statistics
- [x] Match refunds
- [x] Question categories and difficulty
- [x] Random question selection
- [x] Event emission for all actions

### 🔮 Future Enhancements

- [ ] On-chain leaderboard ranking
- [ ] Tournament mode
- [ ] Question voting/curation
- [ ] NFT rewards for achievements
- [ ] Referral system
- [ ] Dynamic prize pools
- [ ] Time-based bonuses
- [ ] Team matches

---

## 📊 Comparison: V2 vs V3

| Feature | V2 (Database) | V3 (Fully On-Chain) |
|---------|---------------|---------------------|
| Questions Storage | PostgreSQL | Smart Contract |
| Match Management | Backend | Smart Contract |
| Scoring | Backend | Smart Contract |
| Player Stats | Database | Smart Contract |
| Backend Required | Yes | Optional |
| Deployment Complexity | High | Low |
| Decentralization | Partial | Full |
| Censorship Resistance | No | Yes |
| Data Availability | Backend-dependent | Always available |
| Setup Time | ~1 hour | ~10 minutes |

---

## 🚨 Important Notes

### Gas Considerations
- **Question seeding**: Done once by admin, stored forever
- **Gameplay**: Players pay gas for their own actions
- **Optimization**: Use batch functions when possible

### Data Availability
- All data is public on blockchain
- Correct answers are visible to anyone inspecting contract
- Consider implementing answer hashing for future versions

### Scaling
- Questions are stored efficiently with IDs
- Consider deploying multiple contracts for different games
- Use layer-2 solutions for lower gas costs

---

## 🔧 Development Workflow

### 1. Add New Questions

```bash
# Edit scripts/seedQuestions.js to add more questions
# Then run:
npx hardhat run scripts/seedQuestions.js --network celo-sepolia
```

### 2. Update Contract

```bash
# Make changes to TriviaBattleV3.sol
npx hardhat compile
npx hardhat run scripts/deployV3.js --network celo-sepolia
# Re-run addTokensV3 and seedQuestions
```

### 3. Test Locally

```bash
# Start local node
npx hardhat node

# In another terminal
npx hardhat run scripts/deployV3.js --network localhost
npx hardhat run scripts/addTokensV3.js --network localhost
npx hardhat run scripts/seedQuestions.js --network localhost
npx hardhat run scripts/testV3.js --network localhost
```

---

## 📚 Resources

- **Contract Source**: `contracts/contracts/TriviaBattleV3.sol`
- **Deployment Info**: `contracts/deployments/celo-sepolia-v3.json`
- **Explorer**: https://celo-sepolia.blockscout.com/address/0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869
- **Celo Docs**: https://docs.celo.org
- **Hardhat Docs**: https://hardhat.org

---

## 🎉 Success!

You now have a **fully decentralized trivia game** running entirely on the blockchain!

No databases, no centralized servers, just pure Web3 gaming. 🚀

**Contract Address**: `0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869`

Start playing or building your mobile app integration!

---

**Last Updated**: November 20, 2025  
**Version**: 3.0.0  
**Status**: ✅ Production Ready (Testnet)
