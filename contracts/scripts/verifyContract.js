const axios = require("axios");

/**
 * Verify contract on Blockscout explorer
 * 
 * For Celo Sepolia, use: https://celo-sepolia.blockscout.com
 * 
 * Manual verification steps if API fails:
 * 1. Go to: https://celo-sepolia.blockscout.com/address/YOUR_CONTRACT_ADDRESS
 * 2. Click "Verify & Publish"
 * 3. Select "Solidity (Single file)" or "Solidity (Standard JSON Input)"
 * 4. Enter compiler version: v0.8.20+commit.a1b79de6
 * 5. Enable optimization: Yes, 200 runs
 * 6. Paste contract code or upload JSON
 */

async function verifyContract(contractAddress, network = "celo-sepolia") {
  console.log("=== Contract Verification ===\n");
  
  const explorerUrls = {
    "celo-sepolia": "https://celo-sepolia.blockscout.com",
    "celo": "https://explorer.celo.org",
    "alfajores": "https://alfajores.celoscan.io"
  };
  
  const explorerUrl = explorerUrls[network];
  
  if (!explorerUrl) {
    console.error(`Unknown network: ${network}`);
    return;
  }
  
  const contractUrl = `${explorerUrl}/address/${contractAddress}`;
  
  console.log("Contract Address:", contractAddress);
  console.log("Network:", network);
  console.log("Explorer URL:", contractUrl);
  console.log("");
  
  // Check if contract exists
  console.log("Checking contract on explorer...");
  
  try {
    const response = await axios.get(`${explorerUrl}/api?module=contract&action=getsourcecode&address=${contractAddress}`);
    
    if (response.data.status === "1" && response.data.result[0].SourceCode) {
      console.log("✓ Contract is already verified!");
      console.log("\nContract Details:");
      console.log("- Name:", response.data.result[0].ContractName);
      console.log("- Compiler:", response.data.result[0].CompilerVersion);
      console.log("- Optimization:", response.data.result[0].OptimizationUsed === "1" ? "Enabled" : "Disabled");
      console.log("- Runs:", response.data.result[0].Runs);
    } else {
      console.log("ℹ Contract not yet verified\n");
      console.log("To verify manually:");
      console.log("1. Visit:", contractUrl);
      console.log("2. Click 'Verify & Publish'");
      console.log("3. Use these settings:");
      console.log("   - Compiler: v0.8.20+commit.a1b79de6");
      console.log("   - Optimization: Enabled");
      console.log("   - Runs: 200");
      console.log("   - EVM Version: default");
      console.log("");
      console.log("4. Upload contract source or use Standard JSON Input");
      console.log("   Standard JSON file location: contracts/artifacts/build-info/");
    }
  } catch (error) {
    console.error("Error checking verification status:", error.message);
    console.log("\nManual verification link:", contractUrl);
  }
  
  console.log("\n=== Next Steps ===");
  console.log("1. Add supported tokens using: npx hardhat run scripts/addTokens.js --network", network);
  console.log("2. Test contract functions using: npx hardhat run scripts/testContract.js --network", network);
  console.log("3. Update backend/.env with token addresses");
}

// Run if called directly
if (require.main === module) {
  const contractAddress = process.argv[2] || "0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd";
  const network = process.argv[3] || "celo-sepolia";
  
  verifyContract(contractAddress, network)
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { verifyContract };
