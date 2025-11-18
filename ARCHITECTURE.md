# Trivia Battle - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Application                        │
│  (React Native + Composer Kit)                              │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Wallet  │  │  Game    │  │  Social  │  │ Leader-  │   │
│  │  Module  │  │  Module  │  │  Module  │  │  board   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐
│  Celo Blockchain│  │  Backend API    │  │  WebSocket   │
│  (Smart         │  │  (Questions,    │  │  (Real-time  │
│   Contracts)    │  │   Matchmaking)  │  │   Sync)      │
└─────────────────┘  └─────────────────┘  └──────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐
│  The Graph      │  │  PostgreSQL     │  │  Redis       │
│  (Indexer)      │  │  (Questions DB) │  │  (Cache)     │
└─────────────────┘  └─────────────────┘  └──────────────┘
```

## Data Flow

### Match Creation Flow
1. User initiates matchmaking from mobile app
2. App calls `createMatch()` on smart contract (with entry fee)
3. Contract emits `MatchCreated` event
4. Backend WebSocket service listens to event
5. Backend adds match to matchmaking queue
6. When match is full, backend calls `startMatch()` on contract
7. Contract emits `MatchStarted` event
8. Mobile app receives WebSocket notification
9. Game session begins

### Answer Submission Flow
1. User selects answer in mobile app
2. App immediately sends answer via WebSocket (for real-time UI)
3. App submits answer to smart contract via `submitAnswer()`
4. Contract validates and stores answer
5. Contract emits `AnswerSubmitted` event
6. Backend broadcasts update to other players via WebSocket
7. Scores updated in real-time

### Prize Distribution Flow
1. Match ends (all questions answered or time expired)
2. Backend calls `endMatch()` on contract with correct answers
3. Contract calculates scores and determines winners
4. Contract emits `MatchEnded` event with winners and prizes
5. Winners can call `claimPrize()` to receive funds
6. Contract transfers CELO tokens to winner addresses
7. Leaderboard updated on-chain

## Security Architecture

### On-Chain Security
- **Reentrancy Guards**: All state-changing functions protected
- **Access Control**: Owner-only functions for admin operations
- **Input Validation**: All parameters validated before processing
- **Safe Math**: Using OpenZeppelin SafeMath for arithmetic
- **Time Locks**: Match expiration and timeout mechanisms

### Off-Chain Security
- **API Authentication**: JWT tokens for backend access
- **Rate Limiting**: Prevent API abuse
- **Input Sanitization**: All user inputs validated
- **Secure Storage**: Private keys never stored, use wallet SDK

### Answer Validation Security
- **Commit-Reveal Scheme**: Prevents front-running (optional)
- **Time-based Validation**: Answers locked after submission
- **On-chain Verification**: Final validation on blockchain

## Performance Optimizations

### Blockchain
- **Event-Based Updates**: Use events instead of storage where possible
- **Batch Operations**: Group multiple actions in single transaction
- **Gas Optimization**: Optimized contract code, minimal storage writes

### Mobile App
- **Code Splitting**: Lazy load screens and components
- **State Management**: Efficient Redux store, selective re-renders
- **Caching**: Cache questions and match data
- **Optimistic UI**: Update UI before blockchain confirmation

### Backend
- **Caching**: Redis for frequently accessed data
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient database connections
- **Load Balancing**: Distribute traffic across servers

## Scalability Considerations

### Current Limitations
- Gas costs for each transaction
- Block confirmation time (~5 seconds on Celo)
- On-chain storage costs

### Future Improvements
- **Layer 2**: Migrate to Celo L2 when available
- **Off-chain Computation**: Move complex calculations off-chain
- **Sharding**: Partition leaderboards for scalability
- **State Channels**: For high-frequency interactions

## Monitoring & Analytics

### Key Metrics
- Match creation rate
- Average match duration
- Prize pool sizes
- User retention
- Transaction success rate
- Gas usage per operation

### Tools
- Sentry for error tracking
- DataDog for performance monitoring
- The Graph for on-chain analytics
- Custom dashboards for game metrics

