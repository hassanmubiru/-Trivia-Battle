const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Seed questions into the on-chain smart contract
 * No database needed - all questions stored on blockchain
 */

const triviaQuestions = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct: 2,
    category: "Geography",
    difficulty: 1
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Da Vinci", "Picasso", "Rembrandt"],
    correct: 1,
    category: "Art",
    difficulty: 2
  },
  {
    question: "What is the largest planet in our solar system?",
    options: ["Mars", "Saturn", "Jupiter", "Neptune"],
    correct: 2,
    category: "Science",
    difficulty: 1
  },
  {
    question: "In what year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correct: 2,
    category: "History",
    difficulty: 2
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Au", "Gd", "Ag"],
    correct: 1,
    category: "Science",
    difficulty: 2
  },
  {
    question: "Which country is home to the kangaroo?",
    options: ["Australia", "New Zealand", "South Africa", "Brazil"],
    correct: 0,
    category: "Geography",
    difficulty: 1
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Dickens", "Shakespeare", "Hemingway", "Twain"],
    correct: 1,
    category: "Literature",
    difficulty: 1
  },
  {
    question: "What is the speed of light?",
    options: ["299,792 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],
    correct: 0,
    category: "Science",
    difficulty: 3
  },
  {
    question: "Which ocean is the largest?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correct: 3,
    category: "Geography",
    difficulty: 1
  },
  {
    question: "What is the smallest prime number?",
    options: ["0", "1", "2", "3"],
    correct: 2,
    category: "Mathematics",
    difficulty: 2
  },
  {
    question: "Who was the first person to walk on the moon?",
    options: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"],
    correct: 1,
    category: "History",
    difficulty: 2
  },
  {
    question: "What is the currency of Japan?",
    options: ["Yuan", "Won", "Yen", "Ringgit"],
    correct: 2,
    category: "General Knowledge",
    difficulty: 1
  },
  {
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correct: 2,
    category: "Geography",
    difficulty: 1
  },
  {
    question: "What is the main language spoken in Brazil?",
    options: ["Spanish", "Portuguese", "English", "French"],
    correct: 1,
    category: "Geography",
    difficulty: 2
  },
  {
    question: "Who developed the theory of relativity?",
    options: ["Newton", "Einstein", "Hawking", "Galileo"],
    correct: 1,
    category: "Science",
    difficulty: 2
  },
  {
    question: "What is the longest river in the world?",
    options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
    correct: 1,
    category: "Geography",
    difficulty: 3
  },
  {
    question: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    correct: 1,
    category: "Mathematics",
    difficulty: 1
  },
  {
    question: "What is the capital of Japan?",
    options: ["Seoul", "Beijing", "Tokyo", "Bangkok"],
    correct: 2,
    category: "Geography",
    difficulty: 1
  },
  {
    question: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Iron", "Diamond", "Platinum"],
    correct: 2,
    category: "Science",
    difficulty: 2
  },
  {
    question: "In which year was the first iPhone released?",
    options: ["2005", "2006", "2007", "2008"],
    correct: 2,
    category: "Technology",
    difficulty: 2
  },
  {
    question: "What is the largest organ in the human body?",
    options: ["Heart", "Brain", "Liver", "Skin"],
    correct: 3,
    category: "Science",
    difficulty: 2
  },
  {
    question: "Who painted 'The Starry Night'?",
    options: ["Monet", "Van Gogh", "Picasso", "Dali"],
    correct: 1,
    category: "Art",
    difficulty: 2
  },
  {
    question: "What is the freezing point of water in Celsius?",
    options: ["-10°C", "0°C", "10°C", "32°C"],
    correct: 1,
    category: "Science",
    difficulty: 1
  },
  {
    question: "How many Olympic rings are there?",
    options: ["4", "5", "6", "7"],
    correct: 1,
    category: "Sports",
    difficulty: 1
  },
  {
    question: "What is the capital of Canada?",
    options: ["Toronto", "Vancouver", "Ottawa", "Montreal"],
    correct: 2,
    category: "Geography",
    difficulty: 2
  },
  {
    question: "Who wrote '1984'?",
    options: ["Huxley", "Orwell", "Bradbury", "Vonnegut"],
    correct: 1,
    category: "Literature",
    difficulty: 3
  },
  {
    question: "What is the square root of 144?",
    options: ["10", "11", "12", "13"],
    correct: 2,
    category: "Mathematics",
    difficulty: 1
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 1,
    category: "Science",
    difficulty: 1
  },
  {
    question: "How many strings does a standard guitar have?",
    options: ["4", "5", "6", "7"],
    correct: 2,
    category: "Music",
    difficulty: 1
  },
  {
    question: "What is the largest mammal in the world?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    correct: 1,
    category: "Science",
    difficulty: 2
  }
];

async function main() {
  const network = hre.network.name;
  console.log("=== Seeding Questions to Smart Contract ===");
  console.log("Network:", network, "\n");

  // Load deployment info
  const deploymentPath = path.join(__dirname, "../deployments", `${network}-v3.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("Contract Address:", deployment.contractAddress);

  // Get contract instance
  const contract = await hre.ethers.getContractAt(
    "TriviaBattleV3",
    deployment.contractAddress
  );

  const [deployer] = await hre.ethers.getSigners();
  console.log("Seeding with account:", deployer.address, "\n");

  // Check current question count
  const currentCount = await contract.getTotalQuestions();
  console.log("Current questions in contract:", currentCount.toString());

  if (currentCount > 0) {
    console.log("\n⚠️  Questions already exist. Do you want to add more? (yes/no)");
    // For automated script, we'll add anyway
  }

  console.log(`\nAdding ${triviaQuestions.length} questions in batches...\n`);

  // Add questions in batches of 10 to avoid gas limits
  const batchSize = 10;
  let addedCount = 0;

  for (let i = 0; i < triviaQuestions.length; i += batchSize) {
    const batch = triviaQuestions.slice(i, i + batchSize);
    
    const questionTexts = batch.map(q => q.question);
    const optionsList = batch.map(q => q.options);
    const correctAnswers = batch.map(q => q.correct);
    const categories = batch.map(q => q.category);
    const difficulties = batch.map(q => q.difficulty);

    console.log(`Adding batch ${Math.floor(i / batchSize) + 1} (${batch.length} questions)...`);
    
    try {
      const tx = await contract.addQuestionsBatch(
        questionTexts,
        optionsList,
        correctAnswers,
        categories,
        difficulties
      );
      
      console.log("  Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("  ✓ Confirmed (Gas used:", receipt.gasUsed.toString(), ")");
      
      addedCount += batch.length;
    } catch (error) {
      console.error("  ✗ Error adding batch:", error.message);
    }
  }

  // Verify questions were added
  const finalCount = await contract.getTotalQuestions();
  const activeCount = await contract.getActiveQuestionsCount();
  
  console.log("\n=== Summary ===");
  console.log("Total questions in contract:", finalCount.toString());
  console.log("Active questions:", activeCount.toString());
  console.log("Questions added this session:", addedCount);

  // Display sample questions
  console.log("\n=== Sample Questions ===");
  for (let i = 1; i <= Math.min(3, Number(finalCount)); i++) {
    const q = await contract.getQuestion(i);
    console.log(`\nQuestion ${i}:`);
    console.log("  Text:", q.questionText);
    console.log("  Options:", q.options);
    console.log("  Category:", q.category);
    console.log("  Difficulty:", q.difficulty.toString());
    console.log("  Active:", q.isActive);
  }

  // Update deployment file
  deployment.questionsSeeded = true;
  deployment.totalQuestions = finalCount.toString();
  deployment.lastSeededAt = new Date().toISOString();
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\n✓ Deployment file updated");

  console.log("\n=== Next Steps ===");
  console.log("1. Test contract: npx hardhat run scripts/testV3.js --network", network);
  console.log("2. Create a match: Use mobile app or console");
  console.log("3. View on explorer:", deployment.explorer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
