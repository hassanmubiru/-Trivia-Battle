const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Add supported tokens to TriviaBattleV3 contract
 */

async function main() {
  const network = hre.network.name;
  console.log("=== Adding Supported Tokens to TriviaBattleV3 ===");
  console.log("Network:", network, "\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments", `${network}-v3.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("Contract Address:", deployment.contractAddress);

  const contract = await hre.ethers.getContractAt(
    "TriviaBattleV3",
    deployment.contractAddress
  );

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address, "\n");

  let tokenAddresses = {};

  // Check if mock tokens exist in old deployment
  const oldDeploymentPath = path.join(__dirname, "../deployments", `${network}.json`);
  if (fs.existsSync(oldDeploymentPath)) {
    const oldDeployment = JSON.parse(fs.readFileSync(oldDeploymentPath, "utf8"));
    if (oldDeployment.supportedTokens) {
      console.log("Found existing mock tokens from previous deployment:");
      tokenAddresses = oldDeployment.supportedTokens;
      for (const [symbol, address] of Object.entries(tokenAddresses)) {
        console.log(`  ${symbol}: ${address}`);
      }
    }
  }

  // If no tokens found, deploy new ones
  if (Object.keys(tokenAddresses).length === 0) {
    console.log("No existing tokens found. Deploying new mock tokens...\n");
    
    const MockToken = await hre.ethers.getContractFactory("MockERC20");
    
    // Deploy mcUSD
    console.log("Deploying Mock cUSD...");
    const mcUSD = await MockToken.deploy("Mock Celo Dollar", "mcUSD");
    await mcUSD.waitForDeployment();
    tokenAddresses.cUSD = await mcUSD.getAddress();
    console.log("  ✓ mcUSD:", tokenAddresses.cUSD);
    
    // Deploy mUSDC
    console.log("Deploying Mock USDC...");
    const mUSDC = await MockToken.deploy("Mock USD Coin", "mUSDC");
    await mUSDC.waitForDeployment();
    tokenAddresses.USDC = await mUSDC.getAddress();
    console.log("  ✓ mUSDC:", tokenAddresses.USDC);
    
    // Deploy mUSDT
    console.log("Deploying Mock USDT...");
    const mUSDT = await MockToken.deploy("Mock Tether USD", "mUSDT");
    await mUSDT.waitForDeployment();
    tokenAddresses.USDT = await mUSDT.getAddress();
    console.log("  ✓ mUSDT:", tokenAddresses.USDT);

    // Mint tokens to deployer
    console.log("\nMinting 10,000 tokens to deployer...");
    const mintAmount = hre.ethers.parseUnits("10000", 18);
    
    await mcUSD.mint(deployer.address, mintAmount);
    await mUSDC.mint(deployer.address, mintAmount);
    await mUSDT.mint(deployer.address, mintAmount);
    
    console.log("  ✓ Tokens minted\n");
  }

  // Add tokens to contract
  console.log("Adding tokens to contract...\n");

  for (const [symbol, address] of Object.entries(tokenAddresses)) {
    try {
      const isSupported = await contract.supportedTokens(address);
      
      if (isSupported) {
        console.log(`✓ ${symbol} already supported`);
      } else {
        console.log(`Adding ${symbol}...`);
        const tx = await contract.addSupportedToken(address);
        await tx.wait();
        console.log(`  ✓ ${symbol} added`);
      }
    } catch (error) {
      console.error(`✗ Error with ${symbol}:`, error.message);
    }
  }

  // Verify all tokens
  console.log("\n=== Verification ===");
  for (const [symbol, address] of Object.entries(tokenAddresses)) {
    const isSupported = await contract.supportedTokens(address);
    console.log(`${symbol}: ${isSupported ? "✓ Supported" : "✗ Not supported"}`);
    
    if (isSupported) {
      try {
        const token = await hre.ethers.getContractAt("MockERC20", address);
        const balance = await token.balanceOf(deployer.address);
        console.log(`  Balance: ${hre.ethers.formatUnits(balance, 18)}`);
      } catch (e) {
        // Token might not be a MockERC20
      }
    }
  }

  // Save to deployment file
  deployment.supportedTokens = tokenAddresses;
  deployment.tokensConfigured = true;
  deployment.lastUpdated = new Date().toISOString();
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\n✓ Token addresses saved to deployment file");

  console.log("\n=== Next Steps ===");
  console.log("1. Seed questions: npx hardhat run scripts/seedQuestions.js --network", network);
  console.log("2. Test contract: npx hardhat run scripts/testV3.js --network", network);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
