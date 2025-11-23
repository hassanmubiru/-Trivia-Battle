# API Integration Guide

## Overview
All mock data has been removed from the Trivia Battle mobile app. This document outlines what needs to be implemented to make the app fully functional.

## Backend API Endpoints Needed

### Base URL
```
http://localhost:3000/api
```
Update `API_BASE_URL` in `/mobile/trivia-battle-expo/src/services/api.ts` with your actual backend URL.

---

## 1. User Stats API

### GET /api/users/:walletAddress/stats
Returns user game statistics.

**Response:**
```json
{
  "gamesPlayed": 42,
  "wins": 28,
  "losses": 14,
  "winRate": 66.7,
  "ranking": 15,
  "totalGames": 42
}
```

**Used in:**
- `HomeScreen.tsx` - Dashboard stats
- `ProfileScreen.tsx` - Profile statistics

---

## 2. User Earnings API

### GET /api/users/:walletAddress/earnings
Returns user financial statistics.

**Response:**
```json
{
  "totalEarned": 12.5,
  "totalSpent": 8.3,
  "netProfit": 4.2
}
```

**Used in:**
- `ProfileScreen.tsx` - Earnings section

---

## 3. Questions API

### GET /api/questions?mode=:mode&count=:count
Returns trivia questions for a game mode.

**Parameters:**
- `mode`: "quick" | "standard" | "premium"
- `count`: Number of questions (typically 5)

**Response:**
```json
[
  {
    "id": "q1",
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "category": "Geography",
    "difficulty": "easy"
  }
]
```

**Used in:**
- `GameSessionScreen.tsx` - Load questions at game start

---

## 4. Leaderboard API

### GET /api/leaderboard?limit=:limit
Returns top players ranked by performance.

**Parameters:**
- `limit`: Number of players to return (default 100)

**Response:**
```json
[
  {
    "rank": 1,
    "username": "CryptoMaster",
    "wins": 147,
    "totalEarnings": 52.3,
    "winRate": 78.5
  }
]
```

**Used in:**
- `LeaderboardScreen.tsx` - Display rankings

---

## 5. Matchmaking API

### POST /api/matchmaking/join
Join matchmaking queue to find an opponent.

**Request:**
```json
{
  "walletAddress": "0x123...",
  "mode": "standard",
  "stake": 0.5
}
```

**Response:**
```json
{
  "gameId": "game_123456",
  "opponentId": "0x456..."
}
```

**Used in:**
- `MatchmakingScreen.tsx` - Find opponent

---

## 6. Game Answer API

### POST /api/games/:gameId/answer
Submit an answer during gameplay.

**Request:**
```json
{
  "questionId": "q1",
  "answer": 2,
  "timeLeft": 12
}
```

**Response:**
```json
{
  "correct": true,
  "points": 120
}
```

**Used in:**
- `GameSessionScreen.tsx` - Submit each answer

---

## 7. Game Completion API

### POST /api/games/:gameId/complete
Complete a game and get final results.

**Request:**
```json
{
  "score": 480
}
```

**Response:**
```json
{
  "won": true,
  "prizeAmount": 1.0,
  "opponentScore": 360
}
```

**Used in:**
- `GameSessionScreen.tsx` - Game end

---

## Blockchain Integration

### Smart Contract
**Address:** `0xE40DE1f269E2aD112c6faeaA3df4ECAf2E512869`  
**Network:** Celo Alfajores Testnet  
**RPC:** `https://alfajores-forno.celo-testnet.org`

### Functions Needed

#### 1. Get Wallet Balance
```typescript
import { getWalletBalance } from './services/blockchain';

const balance = await getWalletBalance(walletAddress);
```

**Used in:**
- `HomeScreen.tsx` - Display balance

#### 2. Deposit Funds
```typescript
import { depositFunds } from './services/blockchain';

const txHash = await depositFunds(privateKey, amountInCelo);
```

#### 3. Withdraw Funds
```typescript
import { withdrawFunds } from './services/blockchain';

const txHash = await withdrawFunds(privateKey, amountInCelo);
```

#### 4. Create Game
```typescript
import { createGame } from './services/blockchain';

const { gameId, txHash } = await createGame(privateKey, stake);
```

#### 5. Complete Game
```typescript
import { completeGameOnChain } from './services/blockchain';

const txHash = await completeGameOnChain(privateKey, gameId, winnerAddress);
```

---

## Implementation Checklist

### Backend (Node.js/Express)
- [ ] Set up Express server with API routes
- [ ] Connect to SQLite database (already exists at `/backend/src/config/database.js`)
- [ ] Implement user stats endpoint
- [ ] Implement user earnings endpoint
- [ ] Implement questions endpoint (already seeded)
- [ ] Implement leaderboard endpoint
- [ ] Implement matchmaking queue system
- [ ] Implement game session management
- [ ] Add WebSocket support for real-time game updates

### Smart Contract
- [ ] Deploy TriviaBattleV3 to Celo network (already deployed)
- [ ] Update contract address in `blockchain.ts` if needed
- [ ] Test deposit/withdraw functions
- [ ] Test game creation
- [ ] Test prize distribution

### Mobile App Integration
- [ ] Update `API_BASE_URL` in `src/services/api.ts`
- [ ] Implement wallet private key storage (use encrypted storage)
- [ ] Connect HomeScreen to blockchain for balance
- [ ] Connect GameSessionScreen to questions API
- [ ] Connect LeaderboardScreen to leaderboard API
- [ ] Connect ProfileScreen to stats/earnings APIs
- [ ] Test matchmaking flow
- [ ] Test full game flow end-to-end

### Security
- [ ] Never store private keys in plain text
- [ ] Use AsyncStorage encryption for sensitive data
- [ ] Implement JWT authentication for API
- [ ] Add rate limiting to prevent abuse
- [ ] Validate all user inputs on backend
- [ ] Use HTTPS for API communications

---

## Testing the App

### Without Backend (Current State)
The app will:
- Show loading states
- Display empty states with friendly messages
- Not crash (graceful error handling)

### With Backend
1. Start backend server: `cd backend && npm start`
2. Update `API_BASE_URL` in `api.ts`
3. Rebuild app: `cd mobile/trivia-battle-expo && npx expo run:android`
4. Test each screen functionality

---

## File Locations

### Services
- API Service: `/mobile/trivia-battle-expo/src/services/api.ts`
- Blockchain Service: `/mobile/trivia-battle-expo/src/services/blockchain.ts`

### Screens (All Updated)
- Auth: `/mobile/trivia-battle-expo/src/screens/AuthScreen.tsx`
- Home: `/mobile/trivia-battle-expo/src/screens/HomeScreen.tsx`
- Matchmaking: `/mobile/trivia-battle-expo/src/screens/MatchmakingScreen.tsx`
- Game Session: `/mobile/trivia-battle-expo/src/screens/GameSessionScreen.tsx`
- Leaderboard: `/mobile/trivia-battle-expo/src/screens/LeaderboardScreen.tsx`
- Profile: `/mobile/trivia-battle-expo/src/screens/ProfileScreen.tsx`

### Backend
- Server: `/backend/src/index.js`
- Database: `/backend/src/config/database.js`
- Questions Seed: `/backend/src/scripts/seedQuestions.js`

---

## Next Steps

1. **Set up Backend Server**
   ```bash
   cd /home/error51/games/Trivia\ Battle/backend
   npm install
   npm start
   ```

2. **Update API Base URL**
   - If running on physical device, use your computer's IP address
   - Example: `http://192.168.1.100:3000/api`

3. **Rebuild Mobile App**
   ```bash
   cd /home/error51/games/Trivia\ Battle/mobile/trivia-battle-expo
   npx expo run:android
   ```

4. **Test Flow**
   - Login with phone/wallet
   - Check if balance loads from blockchain
   - Start a game and verify questions load
   - Complete game and check leaderboard updates
