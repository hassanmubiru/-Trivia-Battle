#!/bin/bash

# TriviaBattle Quick Commands
# This script provides shortcuts for common operations

set -e

NETWORK="celo-sepolia"
CONTRACT_DIR="contracts"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TriviaBattle Quick Commands ===${NC}\n"

show_help() {
    echo "Usage: ./quick-commands.sh [command]"
    echo ""
    echo "Available commands:"
    echo "  tokens       - Add/update supported tokens"
    echo "  test         - Run contract tests"
    echo "  verify       - Check contract verification status"
    echo "  console      - Open Hardhat console"
    echo "  balance      - Check token balances"
    echo "  match        - Create a test match"
    echo "  explorer     - Open contract in block explorer"
    echo "  compile      - Compile contracts"
    echo "  mint         - Mint test tokens"
    echo "  info         - Show deployment info"
    echo "  help         - Show this help message"
}

# Change to contracts directory
cd "$CONTRACT_DIR"

case "$1" in
    tokens)
        echo -e "${GREEN}Adding supported tokens...${NC}"
        npx hardhat run scripts/addTokens.js --network $NETWORK
        ;;
    
    test)
        echo -e "${GREEN}Running contract tests...${NC}"
        npx hardhat run scripts/testContract.js --network $NETWORK
        ;;
    
    verify)
        echo -e "${GREEN}Checking verification status...${NC}"
        cd ..
        node contracts/scripts/verifyContract.js
        ;;
    
    console)
        echo -e "${GREEN}Opening Hardhat console...${NC}"
        echo -e "${YELLOW}Tip: Use 'const contract = await ethers.getContractAt(\"TriviaBattleV2\", \"0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd\")' to get contract instance${NC}"
        npx hardhat console --network $NETWORK
        ;;
    
    balance)
        echo -e "${GREEN}Checking balances...${NC}"
        npx hardhat console --network $NETWORK <<EOF
const [signer] = await ethers.getSigners();
console.log("Address:", signer.address);

// Check CELO balance
const celoBalance = await ethers.provider.getBalance(signer.address);
console.log("CELO Balance:", ethers.formatEther(celoBalance));

// Check token balances
const tokens = {
  "mcUSD": "0xc2FB5a20d07036d828cBbF2FCEE5cea02cc9Cb2f",
  "mUSDC": "0x360Da2CcFE307B5CB0330d062d8D83B721811B76",
  "mUSDT": "0xE5eA34847A04d197B22652be1Dc8FbFf11392239"
};

for (const [symbol, address] of Object.entries(tokens)) {
  const token = await ethers.getContractAt("MockERC20", address);
  const balance = await token.balanceOf(signer.address);
  console.log(symbol + " Balance:", ethers.formatUnits(balance, 18));
}
EOF
        ;;
    
    match)
        echo -e "${GREEN}Creating test match...${NC}"
        npx hardhat console --network $NETWORK <<EOF
const contract = await ethers.getContractAt("TriviaBattleV2", "0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd");
const token = await ethers.getContractAt("MockERC20", "0xc2FB5a20d07036d828cBbF2FCEE5cea02cc9Cb2f");

const entryFee = ethers.parseUnits("1", 18);
console.log("Approving token...");
await token.approve(contract.target, entryFee);

console.log("Creating match...");
const tx = await contract.createMatch(token.target, entryFee, 2);
const receipt = await tx.wait();

const event = receipt.logs.find(log => {
  try {
    return contract.interface.parseLog(log).name === "MatchCreated";
  } catch { return false; }
});

if (event) {
  const parsed = contract.interface.parseLog(event);
  console.log("Match created! ID:", parsed.args.matchId.toString());
}
EOF
        ;;
    
    explorer)
        echo -e "${GREEN}Opening block explorer...${NC}"
        if command -v xdg-open > /dev/null; then
            xdg-open "https://celo-sepolia.blockscout.com/address/0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd"
        elif command -v open > /dev/null; then
            open "https://celo-sepolia.blockscout.com/address/0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd"
        else
            echo "https://celo-sepolia.blockscout.com/address/0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd"
        fi
        ;;
    
    compile)
        echo -e "${GREEN}Compiling contracts...${NC}"
        npx hardhat compile
        ;;
    
    mint)
        echo -e "${GREEN}Minting test tokens...${NC}"
        echo -e "${YELLOW}Enter amount to mint (default: 1000):${NC}"
        read amount
        amount=${amount:-1000}
        
        npx hardhat console --network $NETWORK <<EOF
const [signer] = await ethers.getSigners();
const tokens = [
  "0xc2FB5a20d07036d828cBbF2FCEE5cea02cc9Cb2f",
  "0x360Da2CcFE307B5CB0330d062d8D83B721811B76",
  "0xE5eA34847A04d197B22652be1Dc8FbFf11392239"
];

for (const address of tokens) {
  const token = await ethers.getContractAt("MockERC20", address);
  const symbol = await token.symbol();
  console.log("Minting " + "$amount" + " " + symbol + "...");
  await token.faucet(ethers.parseUnits("$amount", 18));
}

console.log("Minted $amount of each token to:", signer.address);
EOF
        ;;
    
    info)
        echo -e "${GREEN}Deployment Information:${NC}"
        cat deployments/celo-sepolia.json | grep -E "contractAddress|network|chainId|deployer|timestamp" | head -5
        echo ""
        echo -e "${GREEN}Supported Tokens:${NC}"
        cat deployments/celo-sepolia.json | grep -A 5 "supportedTokens"
        ;;
    
    help|*)
        show_help
        ;;
esac

echo ""
