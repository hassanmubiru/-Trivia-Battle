/**
 * Seed Questions Script
 * Populates the database with trivia questions
 */

const pool = require('../config/database');

const questions = [
  // Geography
  {
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correct_answer: 2,
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    question: 'What is the longest river in the world?',
    options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'],
    correct_answer: 1,
    category: 'Geography',
    difficulty: 'medium',
  },
  {
    question: 'Which country is home to the kangaroo?',
    options: ['New Zealand', 'Australia', 'South Africa', 'Argentina'],
    correct_answer: 1,
    category: 'Geography',
    difficulty: 'easy',
  },
  {
    question: 'What is the smallest country in the world?',
    options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
    correct_answer: 1,
    category: 'Geography',
    difficulty: 'medium',
  },

  // Science
  {
    question: 'What is the chemical symbol for gold?',
    options: ['Go', 'Gd', 'Au', 'Ag'],
    correct_answer: 2,
    category: 'Science',
    difficulty: 'easy',
  },
  {
    question: 'What is the largest planet in our solar system?',
    options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
    correct_answer: 2,
    category: 'Science',
    difficulty: 'easy',
  },
  {
    question: 'How many bones are in the human body?',
    options: ['196', '206', '216', '226'],
    correct_answer: 1,
    category: 'Science',
    difficulty: 'medium',
  },
  {
    question: 'What is the speed of light in vacuum?',
    options: [
      '299,792,458 m/s',
      '300,000,000 m/s',
      '299,000,000 m/s',
      '301,000,000 m/s',
    ],
    correct_answer: 0,
    category: 'Science',
    difficulty: 'hard',
  },
  {
    question: 'What is the atomic number of hydrogen?',
    options: ['0', '1', '2', '3'],
    correct_answer: 1,
    category: 'Science',
    difficulty: 'easy',
  },

  // History
  {
    question: 'In which year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correct_answer: 2,
    category: 'History',
    difficulty: 'medium',
  },
  {
    question: 'Who was the first person to walk on the moon?',
    options: ['Buzz Aldrin', 'Neil Armstrong', 'Michael Collins', 'John Glenn'],
    correct_answer: 1,
    category: 'History',
    difficulty: 'easy',
  },
  {
    question: 'In which year did the Berlin Wall fall?',
    options: ['1987', '1988', '1989', '1990'],
    correct_answer: 2,
    category: 'History',
    difficulty: 'medium',
  },
  {
    question: 'Who painted the Mona Lisa?',
    options: [
      'Vincent van Gogh',
      'Pablo Picasso',
      'Leonardo da Vinci',
      'Michelangelo',
    ],
    correct_answer: 2,
    category: 'History',
    difficulty: 'easy',
  },
  {
    question: 'What was the name of the ship that brought the Pilgrims to America?',
    options: ['Mayflower', 'Santa Maria', 'Titanic', 'Queen Mary'],
    correct_answer: 0,
    category: 'History',
    difficulty: 'medium',
  },

  // Literature
  {
    question: 'Who wrote "Romeo and Juliet"?',
    options: ['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'],
    correct_answer: 1,
    category: 'Literature',
    difficulty: 'easy',
  },
  {
    question: 'What is the first book in the Harry Potter series?',
    options: [
      'The Philosopher\'s Stone',
      'The Chamber of Secrets',
      'The Prisoner of Azkaban',
      'The Goblet of Fire',
    ],
    correct_answer: 0,
    category: 'Literature',
    difficulty: 'easy',
  },
  {
    question: 'Who wrote "1984"?',
    options: ['George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'J.D. Salinger'],
    correct_answer: 0,
    category: 'Literature',
    difficulty: 'medium',
  },
  {
    question: 'In which novel does Atticus Finch appear?',
    options: [
      'The Great Gatsby',
      'To Kill a Mockingbird',
      'The Catcher in the Rye',
      'Lord of the Flies',
    ],
    correct_answer: 1,
    category: 'Literature',
    difficulty: 'medium',
  },

  // Sports
  {
    question: 'How many players are on a basketball team on the court at once?',
    options: ['4', '5', '6', '7'],
    correct_answer: 1,
    category: 'Sports',
    difficulty: 'easy',
  },
  {
    question: 'What is the maximum score in a single turn in bowling?',
    options: ['10', '20', '30', '40'],
    correct_answer: 2,
    category: 'Sports',
    difficulty: 'medium',
  },
  {
    question: 'In which sport would you perform a slam dunk?',
    options: ['Tennis', 'Basketball', 'Volleyball', 'Soccer'],
    correct_answer: 1,
    category: 'Sports',
    difficulty: 'easy',
  },
  {
    question: 'How many gold medals did Michael Phelps win in his career?',
    options: ['18', '21', '23', '25'],
    correct_answer: 2,
    category: 'Sports',
    difficulty: 'hard',
  },

  // Entertainment
  {
    question: 'What is the highest-grossing film of all time?',
    options: ['Avatar', 'Avengers: Endgame', 'Titanic', 'Star Wars: The Force Awakens'],
    correct_answer: 0,
    category: 'Entertainment',
    difficulty: 'medium',
  },
  {
    question: 'Who directed the movie "Inception"?',
    options: ['Steven Spielberg', 'Christopher Nolan', 'Martin Scorsese', 'Quentin Tarantino'],
    correct_answer: 1,
    category: 'Entertainment',
    difficulty: 'medium',
  },
  {
    question: 'What is the name of the fictional continent where Game of Thrones takes place?',
    options: ['Westeros', 'Middle-earth', 'Narnia', 'Azeroth'],
    correct_answer: 0,
    category: 'Entertainment',
    difficulty: 'easy',
  },

  // Technology
  {
    question: 'What does HTML stand for?',
    options: [
      'Hypertext Markup Language',
      'High-level Text Markup Language',
      'Home Tool Markup Language',
      'Hyperlink and Text Markup Language',
    ],
    correct_answer: 0,
    category: 'Technology',
    difficulty: 'easy',
  },
  {
    question: 'What year was the first iPhone released?',
    options: ['2005', '2006', '2007', '2008'],
    correct_answer: 2,
    category: 'Technology',
    difficulty: 'medium',
  },
  {
    question: 'What does CPU stand for?',
    options: [
      'Central Processing Unit',
      'Computer Personal Unit',
      'Central Program Utility',
      'Computer Processing Unit',
    ],
    correct_answer: 0,
    category: 'Technology',
    difficulty: 'easy',
  },
];

async function seedQuestions() {
  try {
    console.log('Starting to seed questions...');

    // Clear existing questions (optional - comment out if you want to keep existing)
    // await pool.query('DELETE FROM questions');

    // Insert questions
    for (const q of questions) {
      await pool.query(
        `INSERT INTO questions (question, options, correct_answer, category, difficulty)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [q.question, q.options, q.correct_answer, q.category, q.difficulty]
      );
    }

    console.log(`Successfully seeded ${questions.length} questions!`);

    // Get count
    const result = await pool.query('SELECT COUNT(*) FROM questions');
    console.log(`Total questions in database: ${result.rows[0].count}`);
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedQuestions();
}

module.exports = { seedQuestions, questions };

