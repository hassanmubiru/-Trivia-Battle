# Trivia Battle - Decentralized Mobile Game Development Plan
## Celo Blockchain Integration

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Smart Contract Design](#smart-contract-design)
4. [Backend Integration](#backend-integration)
5. [Security & Performance](#security--performance)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Technical Stack](#technical-stack)

---

## Project Overview

### Vision
A mobile-first, decentralized trivia battle game where players compete in real-time matches, stake CELO tokens, and earn rewards based on performance. The game combines engaging gameplay with blockchain-based incentives and transparent reward distribution.

### Core Features
- **Real-time Multiplayer Battles**: Head-to-head or small group (2-4 players) trivia matches
- **Token-Based Entry Fees**: Players stake CELO tokens to enter matches
- **Dynamic Prize Pools**: Winner-takes-all or proportional distribution based on performance
- **Leaderboards**: On-chain and off-chain rankings
- **Social Features**: Challenges, friend invites, match history
- **Wallet Integration**: Seamless Valora wallet connection

---

## Frontend Architecture

### Technology Stack
- **Framework**: React Native (0.72+)
- **Celo Integration**: Composer Kit (React Native SDK)
- **State Management**: Redux Toolkit + RTK Query
- **Real-time Communication**: WebSocket (via backend) + Celo blockchain events
- **UI Library**: React Native Paper / NativeBase
- **Navigation**: React Navigation v6
- **Wallet**: Valora SDK integration

### Project Structure
```
trivia-battle-mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Wallet/
│   │   ├── Game/
│   │   ├── Leaderboard/
│   │   └── Social/
│   ├── screens/             # Screen components
│   │   ├── Home/
│   │   ├── Matchmaking/
│   │   ├── GameSession/
│   │   ├── Leaderboard/
│   │   └── Profile/
│   ├── navigation/          # Navigation configuration
│   ├── store/               # Redux store
│   │   ├── slices/
│   │   │   ├── walletSlice.ts
│   │   │   ├── gameSlice.ts
│   │   │   ├── userSlice.ts
│   │   │   └── leaderboardSlice.ts
│   │   └── api/             # RTK Query endpoints
│   ├── services/            # Business logic
│   │   ├── celoService.ts   # Celo blockchain interactions
│   │   ├── gameService.ts   # Game state management
│   │   ├── websocketService.ts
│   │   └── notificationService.ts
│   ├── hooks/               # Custom React hooks
│   ├── utils/               # Helper functions
│   ├── types/               # TypeScript definitions
│   └── constants/           # App constants
├── contracts/               # Solidity smart contracts
├── backend/                 # Node.js backend (optional)
└── tests/
```

### Key Frontend Components

#### 1. Wallet Integration Module
**File**: `src/services/celoService.ts`

**Responsibilities**:
- Initialize Celo connection using Composer Kit
- Connect/disconnect Valora wallet
- Handle transaction signing
- Monitor wallet balance
- Listen to blockchain events

**Implementation**:
```typescript
// Key functions:
- connectWallet(): Promise<WalletConnection>
- getBalance(address: string): Promise<BigNumber>
- sendTransaction(tx: Transaction): Promise<TransactionReceipt>
- subscribeToEvents(contractAddress: string, eventName: string)
```

#### 2. Matchmaking System
**File**: `src/screens/Matchmaking/MatchmakingScreen.tsx`

**Flow**:
1. User selects game mode (1v1, 2v2, 4-player)
2. User stakes entry fee (minimum 0.1 CELO)
3. App searches for available matches or creates new lobby
4. When match found, navigate to pre-game screen
5. On-chain match creation via smart contract
6. Start game when all players ready

**State Management**:
- Matchmaking queue (Redux slice)
- WebSocket connection for real-time match updates
- Blockchain event listeners for match creation

#### 3. Game Session Screen
**File**: `src/screens/GameSession/GameSessionScreen.tsx`

**Features**:
- Real-time question display (10-15 questions per match)
- 30-second timer per question
- Multiple-choice options (4 choices)
- Live score updates
- Opponent progress indicators
- Answer submission with blockchain validation

**Real-time Synchronization**:
- WebSocket for immediate UI updates
- Blockchain transactions for answer validation
- Periodic state sync with smart contract

#### 4. Leaderboard System
**File**: `src/screens/Leaderboard/LeaderboardScreen.tsx`

**Data Sources**:
- On-chain: Total wins, total earnings (from smart contract)
- Off-chain: Win rate, average score, recent matches (from backend/Indexer)

**Display**:
- Global leaderboard (top 100)
- Weekly/monthly rankings
- Friends leaderboard
- Personal statistics

#### 5. Social Features
**Components**:
- Challenge system: Send trivia challenges to friends
- Match history: View past games and results
- Share functionality: Share achievements on social media
- Friend system: Add friends via wallet addresses

---

## Smart Contract Design

### Contract Architecture

#### 1. TriviaBattle.sol (Main Game Contract)
**Location**: `contracts/TriviaBattle.sol`

**Core Functions**:
```solidity
// Match Management
- createMatch(uint256 entryFee, uint8 maxPlayers) → matchId
- joinMatch(uint256 matchId) → success
- startMatch(uint256 matchId) → success
- submitAnswer(uint256 matchId, uint256 questionId, uint8 answer) → success
- endMatch(uint256 matchId) → (winners[], prizeDistribution[])

// Prize Management
- claimPrize(uint256 matchId) → success
- withdrawEntryFee(uint256 matchId) → success (if match cancelled)

// Query Functions
- getMatchDetails(uint256 matchId) → Match struct
- getPlayerScore(uint256 matchId, address player) → uint256
- getLeaderboard(uint256 limit) → PlayerStats[]
```

**Data Structures**:
```solidity
struct Match {
    uint256 matchId;
    address[] players;
    uint256 entryFee;
    uint256 prizePool;
    uint256[] questionIds;
    mapping(address => uint256) scores;
    mapping(address => mapping(uint256 => uint8)) answers;
    MatchStatus status;
    uint256 startTime;
    uint256 endTime;
}

enum MatchStatus { Waiting, Active, Completed, Cancelled }
```

**Security Features**:
- Reentrancy guards on prize distribution
- Access control for admin functions
- Time-based match expiration
- Answer validation before acceptance

#### 2. QuestionOracle.sol (Question Management)
**Location**: `contracts/QuestionOracle.sol`

**Purpose**: Store question hashes and validate answers

**Functions**:
```solidity
- submitQuestionHash(uint256 questionId, bytes32 questionHash) → success
- validateAnswer(uint256 questionId, uint8 answer) → bool
- getQuestionHash(uint256 questionId) → bytes32
```

**Design Decision**: Store only hashes on-chain to save gas. Full questions stored off-chain with IPFS or backend API.

#### 3. PrizePool.sol (Prize Distribution)
**Location**: `contracts/PrizePool.sol`

**Functions**:
```solidity
- deposit(uint256 matchId) → success
- distribute(uint256 matchId, address[] winners, uint256[] amounts) → success
- claim(uint256 matchId, address player) → success
```

**Distribution Logic**:
- Winner-takes-all (default)
- Proportional (top 3: 60%, 30%, 10%)
- Configurable per match type

#### 4. Leaderboard.sol (On-chain Rankings)
**Location**: `contracts/Leaderboard.sol`

**Functions**:
```solidity
- updateStats(address player, bool won, uint256 prize) → success
- getTopPlayers(uint256 limit) → PlayerStats[]
- getPlayerRank(address player) → uint256
```

**Storage Optimization**:
- Use mapping for O(1) lookups
- Maintain sorted list for top N players only
- Periodic cleanup of inactive players

### Gas Optimization Strategies

1. **Batch Operations**: Group multiple answer submissions in single transaction
2. **Event-Based Updates**: Emit events instead of storing all data on-chain
3. **Storage Packing**: Optimize struct layouts to minimize storage slots
4. **Lazy Evaluation**: Defer expensive computations until necessary
5. **Proxy Pattern**: Use upgradeable contracts for future improvements

### Contract Deployment Plan

1. **Testnet Phase**: Deploy to Alfajores testnet
2. **Security Audit**: Third-party audit before mainnet
3. **Mainnet Deployment**: Gradual rollout with initial limits
4. **Upgrade Path**: Use proxy pattern for bug fixes

---

## Backend Integration

### Architecture Overview

**Hybrid Approach**: 
- On-chain: Match creation, answer validation, prize distribution
- Off-chain: Question delivery, real-time synchronization, analytics

### Backend Services

#### 1. Question Service
**Technology**: Node.js + Express / Python FastAPI

**Endpoints**:
```
GET /api/questions/random?category=&difficulty=&count=
GET /api/questions/:questionId
POST /api/questions/validate
```

**Question Storage**:
- Database: PostgreSQL with question bank
- Categories: General, Science, History, Sports, etc.
- Difficulty levels: Easy, Medium, Hard
- IPFS backup for decentralization

**Integration with Smart Contract**:
- Generate question hash (keccak256) for on-chain validation
- Store mapping: questionId → hash in contract
- Serve full questions to frontend via API

#### 2. WebSocket Service
**Technology**: Socket.io / WebSocket server

**Purpose**: Real-time game state synchronization

**Events**:
```javascript
// Client → Server
- joinMatch(matchId)
- submitAnswer(matchId, questionId, answer)
- playerReady(matchId)

// Server → Client
- matchFound(matchData)
- questionUpdate(questionData)
- scoreUpdate(scores)
- matchEnded(results)
```

**Synchronization Strategy**:
1. WebSocket for instant UI updates
2. Blockchain transactions for final validation
3. Periodic reconciliation between WebSocket state and blockchain

#### 3. Matchmaking Service
**Technology**: Redis + Node.js

**Algorithm**:
- Queue-based matchmaking (FIFO or skill-based)
- Minimum entry fee matching
- Timeout after 60 seconds (create bot match or refund)

**Implementation**:
```javascript
// Redis queues
- matchmaking:1v1:queue
- matchmaking:2v2:queue
- matchmaking:4player:queue

// Matchmaking logic
1. Add player to queue
2. Check for compatible players
3. Create match on blockchain
4. Notify all players via WebSocket
```

#### 4. Notification Service
**Technology**: Firebase Cloud Messaging / Push notifications

**Triggers**:
- Match found
- Opponent answered
- Match results available
- Prize claimable
- Friend challenge received

#### 5. Indexer Service
**Technology**: The Graph / Custom indexer

**Purpose**: Efficient querying of on-chain data

**Subgraphs**:
- Match events
- Player statistics
- Prize distributions
- Leaderboard updates

**Benefits**:
- Fast queries without full node sync
- Historical data aggregation
- Complex filtering and sorting

### Data Flow Diagram

```
Mobile App
    ↓
[WebSocket] ←→ Backend Service
    ↓
[HTTP API] ←→ Question Service
    ↓
[Blockchain] ←→ Smart Contracts
    ↓
[The Graph] ←→ Indexer
```

---

## Security & Performance

### Security Considerations

#### 1. Smart Contract Security
- **Reentrancy Protection**: Use ReentrancyGuard from OpenZeppelin
- **Access Control**: Role-based permissions (owner, moderator)
- **Input Validation**: Validate all user inputs
- **Integer Overflow**: Use SafeMath or Solidity 0.8+
- **Front-running Prevention**: Commit-reveal scheme for answers
- **Time-based Attacks**: Use block.timestamp carefully
- **Gas Limit DoS**: Cap array sizes, use pagination

#### 2. Answer Validation Security
**Challenge**: Prevent cheating and answer manipulation

**Solution**: Commit-Reveal Scheme
```solidity
// Phase 1: Commit (hash of answer + salt)
commitAnswer(matchId, questionId, bytes32 commitHash)

// Phase 2: Reveal (after all commits)
revealAnswer(matchId, questionId, uint8 answer, bytes32 salt)
```

**Alternative**: Time-locked answers (reveal after match ends)

#### 3. Frontend Security
- **Private Key Management**: Never store keys, use wallet SDK
- **Transaction Signing**: Always require user confirmation
- **API Authentication**: JWT tokens for backend communication
- **Input Sanitization**: Validate all user inputs
- **Secure Storage**: Use React Native Keychain for sensitive data

#### 4. Backend Security
- **Rate Limiting**: Prevent API abuse
- **CORS Configuration**: Restrict origins
- **SQL Injection Prevention**: Use parameterized queries
- **DDoS Protection**: Cloudflare / AWS Shield
- **API Key Management**: Rotate keys regularly

### Performance Optimization

#### 1. Blockchain Performance
- **Gas Optimization**: 
  - Use events instead of storage where possible
  - Batch operations
  - Optimize loops and conditionals
- **Transaction Batching**: Group multiple actions
- **Layer 2 Consideration**: Future migration to Celo L2 if available

#### 2. Mobile App Performance
- **Code Splitting**: Lazy load screens
- **Image Optimization**: Compress assets, use WebP
- **State Management**: Memoization, selective re-renders
- **Network Optimization**: 
  - Cache question data
  - Batch API calls
  - Use compression (gzip)
- **Offline Support**: Cache game data, queue transactions

#### 3. Backend Performance
- **Caching**: Redis for frequently accessed data
- **Database Indexing**: Optimize query performance
- **CDN**: Serve static assets via CDN
- **Load Balancing**: Distribute traffic across servers
- **Connection Pooling**: Efficient database connections

#### 4. Real-time Performance
- **WebSocket Optimization**: 
  - Binary protocol for smaller payloads
  - Message compression
  - Connection pooling
- **State Reconciliation**: Efficient diff algorithms
- **Debouncing**: Limit update frequency

### User Experience Considerations

1. **Transaction UX**:
   - Show gas estimates before confirmation
   - Progress indicators during transactions
   - Clear error messages
   - Retry mechanisms for failed transactions

2. **Loading States**:
   - Skeleton screens during data fetch
   - Optimistic UI updates
   - Background sync for blockchain data

3. **Error Handling**:
   - Graceful degradation
   - User-friendly error messages
   - Fallback mechanisms

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)
- [ ] Project setup (React Native, Composer Kit)
- [ ] Basic wallet integration
- [ ] Smart contract development (core functions)
- [ ] Contract testing and deployment to testnet
- [ ] Basic UI components

### Phase 2: Core Gameplay (Weeks 4-6)
- [ ] Matchmaking system
- [ ] Game session screen
- [ ] Answer submission flow
- [ ] Real-time synchronization
- [ ] Prize distribution

### Phase 3: Backend Services (Weeks 7-9)
- [ ] Question service API
- [ ] WebSocket server
- [ ] Matchmaking service
- [ ] Integration testing

### Phase 4: Social Features (Weeks 10-11)
- [ ] Leaderboard implementation
- [ ] Challenge system
- [ ] Match history
- [ ] Social sharing

### Phase 5: Polish & Security (Weeks 12-14)
- [ ] Security audit
- [ ] Performance optimization
- [ ] UI/UX improvements
- [ ] Comprehensive testing
- [ ] Documentation

### Phase 6: Launch (Week 15+)
- [ ] Mainnet deployment
- [ ] Beta testing
- [ ] Marketing materials
- [ ] Public launch

---

## Technical Stack Summary

### Frontend
- React Native 0.72+
- TypeScript
- Composer Kit (Celo SDK)
- Redux Toolkit
- React Navigation
- React Native Paper

### Smart Contracts
- Solidity 0.8.20+
- Hardhat / Truffle
- OpenZeppelin Contracts
- Celo Testnet (Alfajores) → Mainnet

### Backend
- Node.js + Express / Python FastAPI
- PostgreSQL
- Redis
- Socket.io
- The Graph (Indexer)

### DevOps
- GitHub Actions (CI/CD)
- Docker
- AWS / GCP (Hosting)
- Monitoring: Sentry, DataDog

---

## Next Steps

1. **Review and Refine**: Discuss plan with team, adjust as needed
2. **Set Up Development Environment**: Install dependencies, configure tools
3. **Start with Phase 1**: Begin foundation work
4. **Iterate**: Regular reviews and adjustments

---

## Additional Considerations

### Tokenomics (Future)
- Governance token for platform decisions
- Staking mechanisms
- NFT rewards for achievements
- Referral bonuses

### Scalability
- Consider Layer 2 solutions as user base grows
- Off-chain computation for complex calculations
- Sharding strategies for leaderboards

### Compliance
- KYC/AML considerations for large prize pools
- Regional regulations for gambling/tokenized games
- Terms of service and privacy policy

---

*This plan is a living document and should be updated as the project evolves.*

