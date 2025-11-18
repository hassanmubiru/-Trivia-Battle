# Deploy to Celo Sepolia Testnet

Complete guide for deploying Trivia Battle smart contracts to Celo Sepolia testnet.

## Prerequisites

1. **Node.js** 18+ installed
2. **Testnet Wallet** with private key (for deployment)
3. **Testnet Funds** - Get CELO-S tokens from the faucet

## Step 1: Get Testnet Funds

Visit the Celo Sepolia faucet to get testnet tokens:
- **Faucet URL**: https://thirdweb.com/celo-sepolia-testnet
- **Chain ID**: 11142220

You'll need CELO-S tokens to pay for gas fees during deployment.

## Step 2: Set Up Environment Variables

```bash
cd contracts
```

Create or update `.env` file:

```bash
PRIVATE_KEY=your_private_key_here
```

**⚠️ Important**: 
- Use a test account private key only
- Never commit `.env` to version control
- Never use mainnet private keys

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Compile Contracts

```bash
npm run compile
```

This will compile the TriviaBattleV2 contract with all dependencies.

## Step 5: Deploy to Celo Sepolia

```bash
npm run deploy:celo-sepolia
```

Or manually:

```bash
npx hardhat run scripts/deployV2.js --network celo-sepolia
```

## Step 6: Deployment Output

After successful deployment, you'll see:

```
✅ TriviaBattleV2 deployed to: 0x...
📄 Deployment Info:
{
  "network": "celo-sepolia",
  "chainId": 11142220,
  "contractAddress": "0x...",
  "contractName": "TriviaBattleV2",
  ...
}
```

**Copy the contract address** - you'll need it for the next steps.

## Step 7: Update Configuration

### Update Mobile App

Edit `mobile/src/constants/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  alfajores: '',
  celo: '',
  'celo-sepolia': 'YOUR_DEPLOYED_CONTRACT_ADDRESS', // Add here
};
```

### Update Backend

Edit `backend/.env`:

```bash
CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
CELO_NETWORK=celo-sepolia
CELO_RPC_URL=https://11142220.rpc.thirdweb.com
```

## Step 8: Verify on Block Explorer

Visit the Celo Sepolia Block Explorer:
- **URL**: https://celo-sepolia.blockscout.com/
- Search for your contract address

## Step 9: Test the Deployment

### Test Contract Functions

You can interact with the contract using Hardhat console:

```bash
npx hardhat console --network celo-sepolia
```

```javascript
const TriviaBattleV2 = await ethers.getContractFactory("TriviaBattleV2");
const contract = await TriviaBattleV2.attach("YOUR_CONTRACT_ADDRESS");

// Check minimum entry fee
const minFee = await contract.MIN_ENTRY_FEE();
console.log("Min entry fee:", ethers.formatEther(minFee));

// Check supported tokens
const cusd = await contract.CUSD();
console.log("cUSD address:", cusd);
```

## Network Information

- **Network Name**: Celo Sepolia Testnet
- **Chain ID**: 11142220
- **RPC URL**: https://11142220.rpc.thirdweb.com
- **Block Explorer**: https://celo-sepolia.blockscout.com/
- **Faucet**: https://thirdweb.com/celo-sepolia-testnet
- **Currency**: CELO-S (testnet tokens)

## Troubleshooting

### Error: "insufficient funds"
- Get more testnet tokens from the faucet
- Ensure your account has CELO-S tokens

### Error: "nonce too low"
- Wait a few moments and try again
- The network might need to sync

### Error: "network not found"
- Verify `hardhat.config.js` includes `celo-sepolia` network
- Check RPC URL is correct

### Deployment Verification Failed
- This is normal for testnets - verification might not be available
- You can still interact with the contract

## Next Steps

1. **Test the Mobile App**: Update the mobile app with the new contract address
2. **Test Backend Integration**: Ensure backend can read from the contract
3. **Run Tests**: Execute your test suite against the deployed contract
4. **Monitor**: Watch for events and transactions on the block explorer

## Contract Details

The deployed contract (TriviaBattleV2) includes:
- Multi-stablecoin support (cUSD, USDC, USDT)
- Secure escrow mechanism
- Automatic refunds
- On-chain leaderboards
- Reentrancy protection
- Pausable functionality

## Support

For issues or questions:
- Celo Documentation: https://docs.celo.org/
- Celo Discord: https://chat.celo.org/
- Block Explorer: https://celo-sepolia.blockscout.com/

---

**Deployment completed!** 🎉

