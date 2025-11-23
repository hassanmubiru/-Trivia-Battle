/**
 * Questions Service
 * Fetches trivia questions from decentralized storage (IPFS/Arweave)
 * Questions are stored on-chain as IPFS hashes to maintain decentralization
 */

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: string;
}

// IPFS gateway for fetching questions
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

// Question set IPFS hashes by difficulty
// These hashes point to JSON files containing question arrays
const QUESTION_SETS: Record<string, string> = {
  // TODO: Upload question sets to IPFS and update these hashes
  quick: 'QmQuickQuestionsHash123',   // 5 easy questions
  standard: 'QmStandardQuestionsHash456', // 5 medium questions  
  premium: 'QmPremiumQuestionsHash789',  // 5 hard questions
};

/**
 * Fetch questions from IPFS for a specific game mode
 */
export async function fetchQuestionsFromIPFS(mode: string): Promise<Question[]> {
  try {
    const ipfsHash = QUESTION_SETS[mode] || QUESTION_SETS.standard;
    const response = await fetch(`${IPFS_GATEWAY}${ipfsHash}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch questions from IPFS');
    }
    
    const questions = await response.json();
    return questions;
  } catch (error) {
    console.error('Error fetching questions from IPFS:', error);
    // Fallback to local questions if IPFS fails
    return getLocalQuestions(mode);
  }
}

/**
 * Get local fallback questions (stored in app)
 * Used when IPFS is unavailable
 */
function getLocalQuestions(mode: string): Question[] {
  const quickQuestions: Question[] = [
    {
      id: 'q1',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
      category: 'Math',
      difficulty: 'easy',
    },
    {
      id: 'q2',
      question: 'What color is the sky?',
      options: ['Green', 'Blue', 'Red', 'Yellow'],
      correctAnswer: 1,
      category: 'General',
      difficulty: 'easy',
    },
    {
      id: 'q3',
      question: 'How many days in a week?',
      options: ['5', '6', '7', '8'],
      correctAnswer: 2,
      category: 'General',
      difficulty: 'easy',
    },
    {
      id: 'q4',
      question: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswer: 2,
      category: 'Geography',
      difficulty: 'easy',
    },
    {
      id: 'q5',
      question: 'How many continents are there?',
      options: ['5', '6', '7', '8'],
      correctAnswer: 2,
      category: 'Geography',
      difficulty: 'easy',
    },
  ];

  const standardQuestions: Question[] = [
    {
      id: 'q1',
      question: 'What is the largest planet in our solar system?',
      options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 2,
      category: 'Science',
      difficulty: 'medium',
    },
    {
      id: 'q2',
      question: 'Who painted the Mona Lisa?',
      options: ['Van Gogh', 'Da Vinci', 'Picasso', 'Monet'],
      correctAnswer: 1,
      category: 'Art',
      difficulty: 'medium',
    },
    {
      id: 'q3',
      question: 'What year did World War II end?',
      options: ['1943', '1944', '1945', '1946'],
      correctAnswer: 2,
      category: 'History',
      difficulty: 'medium',
    },
    {
      id: 'q4',
      question: 'What is the speed of light?',
      options: ['299,792 km/s', '199,792 km/s', '399,792 km/s', '99,792 km/s'],
      correctAnswer: 0,
      category: 'Science',
      difficulty: 'medium',
    },
    {
      id: 'q5',
      question: 'Which country has the most population?',
      options: ['India', 'USA', 'China', 'Indonesia'],
      correctAnswer: 2,
      category: 'Geography',
      difficulty: 'medium',
    },
  ];

  const premiumQuestions: Question[] = [
    {
      id: 'q1',
      question: 'What is the quantum number for electron spin?',
      options: ['±1/2', '±1', '±2', '0'],
      correctAnswer: 0,
      category: 'Physics',
      difficulty: 'hard',
    },
    {
      id: 'q2',
      question: 'Who wrote "The Divine Comedy"?',
      options: ['Virgil', 'Homer', 'Dante', 'Milton'],
      correctAnswer: 2,
      category: 'Literature',
      difficulty: 'hard',
    },
    {
      id: 'q3',
      question: 'What is the smallest prime number greater than 100?',
      options: ['101', '103', '107', '109'],
      correctAnswer: 0,
      category: 'Math',
      difficulty: 'hard',
    },
    {
      id: 'q4',
      question: 'In which year was the Magna Carta signed?',
      options: ['1205', '1215', '1225', '1235'],
      correctAnswer: 1,
      category: 'History',
      difficulty: 'hard',
    },
    {
      id: 'q5',
      question: 'What is the chemical symbol for Tungsten?',
      options: ['T', 'Tu', 'W', 'Tg'],
      correctAnswer: 2,
      category: 'Chemistry',
      difficulty: 'hard',
    },
  ];

  switch (mode) {
    case 'quick':
      return quickQuestions;
    case 'premium':
      return premiumQuestions;
    default:
      return standardQuestions;
  }
}

/**
 * Shuffle array to randomize question order
 */
export function shuffleQuestions(questions: Question[]): Question[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get questions for a game mode
 */
export async function getQuestionsForMode(mode: string): Promise<Question[]> {
  // Try IPFS first, fallback to local
  const questions = await fetchQuestionsFromIPFS(mode);
  
  // Shuffle to prevent memorization
  return shuffleQuestions(questions);
}
