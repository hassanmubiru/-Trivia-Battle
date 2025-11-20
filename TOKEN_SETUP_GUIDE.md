# Token Configuration and Testing Guide

## Overview
This guide will help you configure supported tokens, update the backend, and test the TriviaBattleV2 contract.

**Contract Address**: `0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd`  
**Network**: Celo Sepolia  
**Chain ID**: 11142220

---

## Step 1: Add Supported Tokens

### Option A: Deploy and Add Mock Tokens (Recommended for Testnet)

The script will automatically deploy mock ERC20 tokens for testing.

```bash
cd contracts
npx hardhat run scripts/addTokens.js --network celo-sepolia
```

This script will:
1. Deploy mock tokens (mcUSD, mUSDC, mUSDT)
2. Add them as supported tokens to the contract
3. Mint 10,000 tokens to your wallet for testing
4. Save token addresses to `deployments/celo-sepolia.json`

### Option B: Use Existing Testnet Tokens

If you have existing testnet tokens, edit `scripts/addTokens.js` and update the token addresses:

```javascript
tokenAddresses = {
  cUSD: "YOUR_CUSD_ADDRESS",
  USDC: "YOUR_USDC_ADDRESS",
  USDT: "YOUR_USDT_ADDRESS"
};
```

---

## Step 2: Update Backend Environment

### 2.1 Copy Environment Template

```bash
cd backend
cp .env.example .env
```

### 2.2 Update Token Addresses

After running `addTokens.js`, copy the token addresses from the console output or from `contracts/deployments/celo-sepolia.json` and update `backend/.env`:

```env
TOKEN_CUSD=0x... # Your mock cUSD address
TOKEN_USDC=0x... # Your mock USDC address
TOKEN_USDT=0x... # Your mock USDT address
```

### 2.3 Configure Other Variables

Update these important variables in `backend/.env`:

```env
# Database (if using PostgreSQL)
DB_PASSWORD=your_secure_password

# Session secret (generate a random string)
SESSION_SECRET=your_random_secret_here

# Backend private key (optional, for automated operations)
# Use a separate wallet with limited funds
BACKEND_PRIVATE_KEY=0x...
```

---

## Step 3: Test Contract Functions

### 3.1 Run Test Script

```bash
cd contracts
npx hardhat run scripts/testContract.js --network celo-sepolia
```

This will test:
- ✓ Contract ownership
- ✓ Supported tokens verification
- ✓ Contract settings (fees, limits)
- ✓ Match creation
- ✓ Escrow functionality

### 3.2 Manual Testing with Hardhat Console

```bash
npx hardhat console --network celo-sepolia
```

Then in the console:

```javascript
// Get contract instance
const TriviaBattle = await ethers.getContractAt(
  "TriviaBattleV2", 
  "0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd"
);

// Check supported tokens
const tokenAddress = "YOUR_TOKEN_ADDRESS";
await TriviaBattle.supportedTokens(tokenAddress);

// Get match details
await TriviaBattle.getMatchDetails(1);

// Check escrow balance
await TriviaBattle.getEscrowBalance(1, tokenAddress);
```

---

## Step 4: Verify Contract on Block Explorer

### 4.1 Automated Check

```bash
cd contracts
node scripts/verifyContract.js 0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd celo-sepolia
```

### 4.2 Manual Verification

1. Visit: https://celo-sepolia.blockscout.com/address/0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd
2. Click **"Verify & Publish"**
3. Select **"Solidity (Standard JSON Input)"**
4. Enter these settings:
   - **Compiler**: `v0.8.20+commit.a1b79de6`
   - **Optimization**: `Enabled`
   - **Runs**: `200`
   - **EVM Version**: `default`
5. Upload the Standard JSON Input file from:
   ```
   contracts/artifacts/build-info/6ba5764d1a3072aaf61f93b7f37aeef5.json
   ```
6. Click **"Verify & Publish"**

---

## Step 5: Test Complete Match Flow

### 5.1 Create a Match

```javascript
// In Hardhat console
const [deployer, player1, player2] = await ethers.getSigners();
const token = await ethers.getContractAt("MockERC20", "YOUR_TOKEN_ADDRESS");
const entryFee = ethers.parseUnits("1", 18);

// Approve and create match
await token.approve(TriviaBattle.target, entryFee);
const tx = await TriviaBattle.createMatch(token.target, entryFee, 2);
const receipt = await tx.wait();

// Get match ID from event
const event = receipt.logs.find(log => {
  try {
    return TriviaBattle.interface.parseLog(log).name === "MatchCreated";
  } catch { return false; }
});
const matchId = TriviaBattle.interface.parseLog(event).args.matchId;
console.log("Match ID:", matchId.toString());
```

### 5.2 Player Joins Match

```javascript
// Switch to player1
const token1 = token.connect(player1);
const trivia1 = TriviaBattle.connect(player1);

// Mint tokens to player1
await token.mint(player1.address, ethers.parseUnits("10", 18));

// Approve and join
await token1.approve(TriviaBattle.target, entryFee);
await trivia1.joinMatch(matchId);
```

### 5.3 Start Match

```javascript
// Owner starts match with question IDs
const questionIds = [1, 2, 3, 4, 5];
await TriviaBattle.startMatch(matchId, questionIds);
```

### 5.4 Submit Answers

```javascript
// Players submit answers
await trivia1.submitAnswer(matchId, 1, 2); // player1 answers question 1 with option 2
await TriviaBattle.submitAnswer(matchId, 1, 2); // deployer answers
// ... continue for all questions
```

### 5.5 End Match and Claim Prize

```javascript
// Owner ends match with correct answers
const correctAnswers = [2, 1, 3, 0, 2];
await TriviaBattle.endMatch(matchId, questionIds, correctAnswers);

// Winner claims prize
await TriviaBattle.claimPrize(matchId);
```

---

## Quick Commands Reference

```bash
# Deploy mock tokens and add to contract
npx hardhat run scripts/addTokens.js --network celo-sepolia

# Test contract functionality
npx hardhat run scripts/testContract.js --network celo-sepolia

# Verify contract
node scripts/verifyContract.js

# Interactive console
npx hardhat console --network celo-sepolia

# Check contract on explorer
open https://celo-sepolia.blockscout.com/address/0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd
```

---

## Troubleshooting

### Issue: "Unsupported token" error
**Solution**: Make sure you've run `addTokens.js` and the token address is correct.

### Issue: "Insufficient allowance" error
**Solution**: Approve token spending before creating/joining match:
```javascript
await token.approve(contractAddress, amount);
```

### Issue: "Insufficient token balance" error
**Solution**: Mint tokens to your address:
```javascript
await token.mint(yourAddress, ethers.parseUnits("1000", 18));
```

### Issue: Contract not verified
**Solution**: Follow manual verification steps in Step 4.2

---

## Next Steps

1. ✅ Configure tokens using `addTokens.js`
2. ✅ Update `backend/.env` with token addresses
3. ✅ Test contract with `testContract.js`
4. ✅ Verify contract on Blockscout
5. 🔄 Set up backend database and API
6. 🔄 Test mobile app integration
7. 🔄 Deploy to mainnet (when ready)

---

## Important Security Notes

⚠️ **Never commit `.env` files to version control**  
⚠️ **Use separate wallets for testing and production**  
⚠️ **Keep private keys secure and never share them**  
⚠️ **Test thoroughly on testnet before mainnet deployment**  
⚠️ **Consider a security audit before mainnet launch**

---

## Resources

- **Contract Explorer**: https://celo-sepolia.blockscout.com/address/0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd
- **Celo Sepolia RPC**: https://11142220.rpc.thirdweb.com
- **Celo Faucet**: https://faucet.celo.org
- **Hardhat Docs**: https://hardhat.org/docs
- **Celo Docs**: https://docs.celo.org

---

**Last Updated**: November 20, 2025
