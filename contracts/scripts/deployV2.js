/**
 * Deployment script for TriviaBattleV2 contract
 * Enhanced contract with multi-stablecoin support
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Deploying TriviaBattleV2 contract...');
  console.log('Network:', hre.network.name);

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'CELO');

  if (balance === 0n) {
    console.error('❌ ERROR: Account has no balance. Please fund your account with testnet tokens.');
    console.log('\nGet testnet tokens from:');
    if (hre.network.name === 'celo-sepolia') {
      console.log('  https://thirdweb.com/celo-sepolia-testnet');
    } else if (hre.network.name === 'alfajores') {
      console.log('  https://faucet.celo.org/alfajores');
    }
    process.exit(1);
  }

  // Deploy TriviaBattleV2 contract
  console.log('\n📝 Deploying TriviaBattleV2...');
  const TriviaBattleV2 = await hre.ethers.getContractFactory('TriviaBattleV2');
  const triviaBattleV2 = await TriviaBattleV2.deploy();

  await triviaBattleV2.waitForDeployment();
  const contractAddress = await triviaBattleV2.getAddress();
  console.log('✅ TriviaBattleV2 deployed to:', contractAddress);

  // Verify deployment
  console.log('\n🔍 Verifying deployment...');
  try {
    const minEntryFee = await triviaBattleV2.MIN_ENTRY_FEE();
    const matchTimeout = await triviaBattleV2.MATCH_TIMEOUT();
    const platformFee = await triviaBattleV2.platformFeePercentage();

    console.log('✓ Minimum entry fee:', hre.ethers.formatEther(minEntryFee), 'tokens');
    console.log('✓ Match timeout:', matchTimeout.toString(), 'seconds');
    console.log('✓ Platform fee:', platformFee.toString(), '%');

    // Check supported tokens
    const cusd = await triviaBattleV2.CUSD();
    const usdc = await triviaBattleV2.USDC();
    const usdt = await triviaBattleV2.USDT();
    console.log('✓ Supported tokens:');
    console.log('  - cUSD:', cusd);
    console.log('  - USDC:', usdc);
    console.log('  - USDT:', usdt);
  } catch (error) {
    console.warn('⚠️  Warning: Could not verify all contract details:', error.message);
  }

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    contractAddress,
    contractName: 'TriviaBattleV2',
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    explorer: getExplorerUrl(hre.network.name, contractAddress),
  };

  // Save to file
  const deploymentFile = path.join(__dirname, `../deployments/${hre.network.name}.json`);
  const deploymentDir = path.dirname(deploymentFile);
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log('\n📄 Deployment Info:');
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log('\n💾 Saved to:', deploymentFile);

  // Instructions
  console.log('\n📋 Next steps:');
  console.log('1. Update CONTRACT_ADDRESS in mobile app config:');
  console.log(`   mobile/src/constants/contracts.ts -> CONTRACT_ADDRESSES.${hre.network.name === 'celo-sepolia' ? 'celo-sepolia' : hre.network.name} = '${contractAddress}'`);
  console.log('2. Update contract address in backend .env:');
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
  console.log('3. Verify contract on block explorer:');
  console.log(`   ${deploymentInfo.explorer}`);
  console.log('4. Test the contract with sample transactions');
  
  if (hre.network.name === 'celo-sepolia') {
    console.log('\n🔗 Useful links:');
    console.log('  Block Explorer: https://celo-sepolia.blockscout.com/');
    console.log('  Faucet: https://thirdweb.com/celo-sepolia-testnet');
    console.log('  Chain ID: 11142220');
  }
}

function getExplorerUrl(network, address) {
  const explorers = {
    'alfajores': `https://alfajores.celoscan.io/address/${address}`,
    'celo': `https://celoscan.io/address/${address}`,
    'celo-sepolia': `https://celo-sepolia.blockscout.com/address/${address}`,
  };
  return explorers[network] || `https://explorer.celo.org/address/${address}`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  });

