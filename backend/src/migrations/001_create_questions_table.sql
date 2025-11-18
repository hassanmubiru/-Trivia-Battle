-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  category VARCHAR(50),
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);

-- Insert sample questions
INSERT INTO questions (question, options, correct_answer, category, difficulty) VALUES
('What is the capital of France?', ARRAY['London', 'Berlin', 'Paris', 'Madrid'], 2, 'Geography', 'easy'),
('Who wrote "Romeo and Juliet"?', ARRAY['Charles Dickens', 'William Shakespeare', 'Jane Austen', 'Mark Twain'], 1, 'Literature', 'easy'),
('What is the largest planet in our solar system?', ARRAY['Earth', 'Mars', 'Jupiter', 'Saturn'], 2, 'Science', 'medium'),
('In which year did World War II end?', ARRAY['1943', '1944', '1945', '1946'], 2, 'History', 'medium'),
('What is the chemical symbol for gold?', ARRAY['Go', 'Gd', 'Au', 'Ag'], 2, 'Science', 'easy');

