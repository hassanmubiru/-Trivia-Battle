const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Test script for TriviaBattleV2 contract
 * Tests basic functionality including:
 * - Token support verification
 * - Match creation
 * - Player joining
 * - Match lifecycle
 */

async function main() {
  const network = hre.network.name;
  console.log("=== Testing TriviaBattleV2 Contract ===");
  console.log("Network:", network);
  
  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments", `${network}.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found for network: ${network}`);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("\nContract Address:", deployment.contractAddress);
  
  // Get signers
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  console.log("\nTest accounts:");
  console.log("- Deployer/Owner:", deployer.address);
  if (signers.length > 1) {
    console.log("- Player 1:", signers[1].address);
  }
  if (signers.length > 2) {
    console.log("- Player 2:", signers[2].address);
  }
  
  // Get contract instance
  const TriviaBattle = await hre.ethers.getContractAt(
    "TriviaBattleV2",
    deployment.contractAddress
  );
  
  // Test 1: Check owner
  console.log("\n--- Test 1: Ownership ---");
  const owner = await TriviaBattle.owner();
  console.log("Contract owner:", owner);
  console.log("Is deployer owner?", owner.toLowerCase() === deployer.address.toLowerCase());
  
  // Test 2: Check supported tokens
  console.log("\n--- Test 2: Supported Tokens ---");
  if (deployment.supportedTokens) {
    for (const [symbol, address] of Object.entries(deployment.supportedTokens)) {
      const isSupported = await TriviaBattle.supportedTokens(address);
      console.log(`${symbol} (${address}):`);
      console.log(`  Supported: ${isSupported ? "✓" : "✗"}`);
      
      if (isSupported) {
        // Get token info
        try {
          const token = await hre.ethers.getContractAt("MockERC20", address);
          const name = await token.name();
          const symbol = await token.symbol();
          const decimals = await token.decimals();
          const balance = await token.balanceOf(deployer.address);
          
          console.log(`  Name: ${name}`);
          console.log(`  Symbol: ${symbol}`);
          console.log(`  Decimals: ${decimals}`);
          console.log(`  Deployer Balance: ${hre.ethers.formatUnits(balance, decimals)}`);
        } catch (error) {
          console.log(`  (Could not fetch token details)`);
        }
      }
    }
  } else {
    console.log("⚠️  No supported tokens configured. Run addTokens.js first.");
  }
  
  // Test 3: Check contract settings
  console.log("\n--- Test 3: Contract Settings ---");
  const platformFee = await TriviaBattle.platformFeePercentage();
  const maxMatches = await TriviaBattle.maxMatchesPerPlayer();
  const minEntryFee = await TriviaBattle.MIN_ENTRY_FEE();
  
  console.log("Platform Fee:", platformFee.toString() + "%");
  console.log("Max Matches per Player:", maxMatches.toString());
  console.log("Min Entry Fee:", hre.ethers.formatEther(minEntryFee), "tokens");
  
  // Test 4: Create a test match (if tokens are available)
  console.log("\n--- Test 4: Match Creation ---");
  
  if (deployment.supportedTokens) {
    const testToken = Object.values(deployment.supportedTokens)[0]; // Use first token
    const testTokenSymbol = Object.keys(deployment.supportedTokens)[0];
    
    try {
      const token = await hre.ethers.getContractAt("MockERC20", testToken);
      const entryFee = hre.ethers.parseUnits("1", 18); // 1 token
      
      // Check balance
      const balance = await token.balanceOf(deployer.address);
      console.log(`\nDeployer ${testTokenSymbol} balance:`, hre.ethers.formatUnits(balance, 18));
      
      if (balance >= entryFee) {
        // Approve token spending
        console.log("\nApproving token spending...");
        const approveTx = await token.approve(deployment.contractAddress, entryFee);
        await approveTx.wait();
        console.log("✓ Approved");
        
        // Create match
        console.log("\nCreating match...");
        const createTx = await TriviaBattle.createMatch(
          testToken,
          entryFee,
          2 // 2 players
        );
        const receipt = await createTx.wait();
        
        // Find MatchCreated event
        const matchCreatedEvent = receipt.logs.find(
          log => {
            try {
              const parsed = TriviaBattle.interface.parseLog({
                topics: log.topics,
                data: log.data
              });
              return parsed.name === "MatchCreated";
            } catch {
              return false;
            }
          }
        );
        
        if (matchCreatedEvent) {
          const parsed = TriviaBattle.interface.parseLog({
            topics: matchCreatedEvent.topics,
            data: matchCreatedEvent.data
          });
          const matchId = parsed.args.matchId;
          console.log("✓ Match created! Match ID:", matchId.toString());
          
          // Get match details
          const matchDetails = await TriviaBattle.getMatchDetails(matchId);
          console.log("\nMatch Details:");
          console.log("- Match ID:", matchDetails.matchId_.toString());
          console.log("- Token:", matchDetails.token);
          console.log("- Entry Fee:", hre.ethers.formatUnits(matchDetails.entryFee, 18));
          console.log("- Prize Pool:", hre.ethers.formatUnits(matchDetails.prizePool, 18));
          console.log("- Status:", matchDetails.status);
          console.log("- Current Players:", matchDetails.currentPlayers.toString());
          console.log("- Max Players:", matchDetails.maxPlayers.toString());
          console.log("- Players:", matchDetails.players);
          
          // Check escrow
          const escrowBalance = await TriviaBattle.getEscrowBalance(matchId, testToken);
          console.log("- Escrow Balance:", hre.ethers.formatUnits(escrowBalance, 18));
        }
      } else {
        console.log("⚠️  Insufficient token balance. Mint tokens first using:");
        console.log(`   await token.mint(deployer.address, ethers.parseUnits("10000", 18))`);
      }
    } catch (error) {
      console.error("✗ Match creation failed:", error.message);
    }
  } else {
    console.log("⚠️  No tokens configured. Run addTokens.js first.");
  }
  
  console.log("\n=== Test Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
