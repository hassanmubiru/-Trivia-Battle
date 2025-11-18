/**
 * Deployment script for TriviaBattle contract
 */

const hre = require('hardhat');

async function main() {
  console.log('Deploying TriviaBattle contract...');

  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'CELO');

  // Deploy contract
  const TriviaBattle = await hre.ethers.getContractFactory('TriviaBattle');
  const triviaBattle = await TriviaBattle.deploy();

  await triviaBattle.waitForDeployment();

  const contractAddress = await triviaBattle.getAddress();
  console.log('TriviaBattle deployed to:', contractAddress);

  // Verify deployment
  console.log('Verifying deployment...');
  const entryFee = await triviaBattle.MIN_ENTRY_FEE();
  console.log('Minimum entry fee:', hre.ethers.formatEther(entryFee), 'CELO');

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log('\nDeployment Info:');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Instructions
  console.log('\nNext steps:');
  console.log('1. Update CONTRACT_ADDRESS in mobile app config');
  console.log('2. Update contract address in backend services');
  console.log('3. Verify contract on CeloScan (if mainnet)');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

