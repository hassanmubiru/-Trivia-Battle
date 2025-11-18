# Quick Deploy to Celo Sepolia

## Quick Start

```bash
# 1. Navigate to contracts directory
cd contracts

# 2. Set your private key in .env file
echo "PRIVATE_KEY=your_testnet_private_key" > .env

# 3. Get testnet tokens
# Visit: https://thirdweb.com/celo-sepolia-testnet
# Chain ID: 11142220

# 4. Compile contracts
npm run compile

# 5. Deploy to Celo Sepolia
npm run deploy:celo-sepolia
```

## After Deployment

1. **Copy the contract address** from the output
2. **Update mobile app**: Edit `mobile/src/constants/contracts.ts`
   ```typescript
   'celo-sepolia': 'YOUR_CONTRACT_ADDRESS_HERE',
   ```
3. **Update backend**: Edit `backend/.env`
   ```bash
   CONTRACT_ADDRESS=YOUR_CONTRACT_ADDRESS_HERE
   ```

## Network Info

- **Chain ID**: 11142220
- **RPC**: https://11142220.rpc.thirdweb.com
- **Explorer**: https://celo-sepolia.blockscout.com/
- **Faucet**: https://thirdweb.com/celo-sepolia-testnet

## Full Documentation

See [DEPLOYMENT_CELO_SEPOLIA.md](./DEPLOYMENT_CELO_SEPOLIA.md) for complete instructions.

