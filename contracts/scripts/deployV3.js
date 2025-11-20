const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=== Deploying TriviaBattleV3 (Fully On-Chain) ===\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "CELO\n");

  // Deploy contract
  console.log("Deploying TriviaBattleV3...");
  const TriviaBattleV3 = await hre.ethers.getContractFactory("TriviaBattleV3");
  const contract = await TriviaBattleV3.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("✓ TriviaBattleV3 deployed to:", contractAddress);

  // Wait for confirmations
  console.log("\nWaiting for block confirmations...");
  await contract.deploymentTransaction().wait(5);
  console.log("✓ Confirmed\n");

  // Save deployment info
  const network = hre.network.name;
  const deployment = {
    network: network,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contractAddress: contractAddress,
    contractName: "TriviaBattleV3",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    explorer: getExplorerUrl(network, contractAddress),
    features: [
      "Fully on-chain questions storage",
      "No database required",
      "Auto-match start",
      "Real-time scoring",
      "Multi-token support",
      "Escrow system"
    ]
  };

  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const filename = path.join(deploymentPath, `${network}-v3.json`);
  fs.writeFileSync(filename, JSON.stringify(deployment, null, 2));
  console.log("✓ Deployment info saved to:", filename);

  console.log("\n=== Deployment Summary ===");
  console.log("Contract:", contractAddress);
  console.log("Network:", network);
  console.log("Explorer:", deployment.explorer);
  console.log("\n=== Next Steps ===");
  console.log("1. Deploy mock tokens: npx hardhat run scripts/deployTokens.js --network", network);
  console.log("2. Add supported tokens: npx hardhat run scripts/addTokensV3.js --network", network);
  console.log("3. Add questions: npx hardhat run scripts/seedQuestions.js --network", network);
  console.log("4. Test contract: npx hardhat run scripts/testV3.js --network", network);
}

function getExplorerUrl(network, address) {
  const explorers = {
    "celo-sepolia": `https://celo-sepolia.blockscout.com/address/${address}`,
    "alfajores": `https://alfajores.celoscan.io/address/${address}`,
    "celo": `https://explorer.celo.org/mainnet/address/${address}`
  };
  return explorers[network] || `https://etherscan.io/address/${address}`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
