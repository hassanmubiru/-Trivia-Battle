const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Script to add supported tokens to TriviaBattleV2 contract
 * 
 * For Celo Sepolia testnet, we'll use:
 * - Mock cUSD (deploy if needed)
 * - Mock USDC (deploy if needed)
 * - Mock USDT (deploy if needed)
 * 
 * For Celo Mainnet:
 * - cUSD: 0x765DE816845861e75A25fCA122bb6898B8B1282a
 * - USDC: 0xceBA9300f2b948710d2653dD7B07f33A8b32118C
 * - USDT: 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e
 */

// Mock ERC20 Token Contract for testing
const MOCK_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function mint(address to, uint256 amount) public"
];

// Deploy a mock ERC20 token
async function deployMockToken(name, symbol) {
  console.log(`\nDeploying Mock ${symbol}...`);
  
  const MockToken = await hre.ethers.getContractFactory("contracts/MockERC20.sol:MockERC20");
  const token = await MockToken.deploy(name, symbol);
  await token.waitForDeployment();
  
  const tokenAddress = await token.getAddress();
  console.log(`${symbol} deployed to:`, tokenAddress);
  
  return tokenAddress;
}

async function main() {
  const network = hre.network.name;
  console.log("Network:", network);
  
  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments", `${network}.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found for network: ${network}`);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("\nContract Address:", deployment.contractAddress);
  
  // Get the contract instance
  const TriviaBattle = await hre.ethers.getContractAt(
    "TriviaBattleV2",
    deployment.contractAddress
  );
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  // Check if deployer is owner
  const owner = await TriviaBattle.owner();
  console.log("Contract owner:", owner);
  
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("Deployer is not the contract owner!");
  }
  
  let tokenAddresses = {};
  
  // Network-specific token configuration
  if (network === "celo") {
    // Celo Mainnet - use real stablecoin addresses
    console.log("\n=== Using Celo Mainnet Stablecoins ===");
    tokenAddresses = {
      cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
      USDC: "0xceBA9300f2b948710d2653dD7B07f33A8b32118C",
      USDT: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e"
    };
  } else if (network === "alfajores") {
    // Celo Alfajores Testnet - use testnet tokens
    console.log("\n=== Using Celo Alfajores Testnet Tokens ===");
    tokenAddresses = {
      cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Alfajores cUSD
      USDC: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B", // Alfajores USDC (if exists)
      USDT: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"  // Use cUSD as fallback
    };
  } else if (network === "celo-sepolia") {
    // Celo Sepolia - deploy mock tokens or use existing ones
    console.log("\n=== Deploying Mock Tokens for Celo Sepolia ===");
    
    // Check if MockERC20 contract exists
    try {
      // Try to deploy mock tokens
      const MockToken = await hre.ethers.getContractFactory("MockERC20");
      
      // Deploy mock tokens
      const mockCUSD = await MockToken.deploy("Mock Celo Dollar", "mcUSD");
      await mockCUSD.waitForDeployment();
      tokenAddresses.cUSD = await mockCUSD.getAddress();
      
      const mockUSDC = await MockToken.deploy("Mock USD Coin", "mUSDC");
      await mockUSDC.waitForDeployment();
      tokenAddresses.USDC = await mockUSDC.getAddress();
      
      const mockUSDT = await MockToken.deploy("Mock Tether USD", "mUSDT");
      await mockUSDT.waitForDeployment();
      tokenAddresses.USDT = await mockUSDT.getAddress();
      
      console.log("\nMock tokens deployed:");
      console.log("- mcUSD:", tokenAddresses.cUSD);
      console.log("- mUSDC:", tokenAddresses.USDC);
      console.log("- mUSDT:", tokenAddresses.USDT);
      
      // Mint some tokens to deployer for testing
      console.log("\nMinting test tokens to deployer...");
      const mintAmount = hre.ethers.parseUnits("10000", 18); // 10,000 tokens
      
      await mockCUSD.mint(deployer.address, mintAmount);
      await mockUSDC.mint(deployer.address, mintAmount);
      await mockUSDT.mint(deployer.address, mintAmount);
      
      console.log("Minted 10,000 of each token to:", deployer.address);
      
    } catch (error) {
      console.error("Mock token deployment failed:", error.message);
      console.log("\n⚠️  Please deploy MockERC20.sol contract first or provide testnet token addresses");
      
      // Fallback: ask user to provide addresses
      console.log("\nPlease update this script with your testnet token addresses");
      return;
    }
  } else {
    console.log("\n⚠️  Unknown network. Please configure token addresses for:", network);
    return;
  }
  
  // Add tokens to contract
  console.log("\n=== Adding Supported Tokens ===");
  
  for (const [symbol, address] of Object.entries(tokenAddresses)) {
    try {
      // Check if token is already supported
      const isSupported = await TriviaBattle.supportedTokens(address);
      
      if (isSupported) {
        console.log(`✓ ${symbol} (${address}) is already supported`);
      } else {
        console.log(`Adding ${symbol} (${address})...`);
        const tx = await TriviaBattle.addSupportedToken(address);
        await tx.wait();
        console.log(`✓ ${symbol} added successfully!`);
      }
    } catch (error) {
      console.error(`✗ Failed to add ${symbol}:`, error.message);
    }
  }
  
  // Save token addresses to deployment file
  deployment.supportedTokens = tokenAddresses;
  deployment.lastUpdated = new Date().toISOString();
  
  fs.writeFileSync(
    deploymentPath,
    JSON.stringify(deployment, null, 2)
  );
  
  console.log("\n✓ Token addresses saved to deployment file");
  
  // Verify tokens are added
  console.log("\n=== Verification ===");
  for (const [symbol, address] of Object.entries(tokenAddresses)) {
    const isSupported = await TriviaBattle.supportedTokens(address);
    console.log(`${symbol}: ${isSupported ? "✓ Supported" : "✗ Not supported"}`);
  }
  
  console.log("\n=== Setup Complete! ===");
  console.log("\nNext steps:");
  console.log("1. Update backend/.env with contract address and token addresses");
  console.log("2. Test contract functions using testContract.js script");
  console.log("3. Verify contract on block explorer");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
