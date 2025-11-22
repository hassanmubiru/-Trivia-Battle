import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Sample questions
const SAMPLE_QUESTIONS = [
  {
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correct: 2,
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correct: 1,
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"],
    correct: 2,
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correct: 3,
  },
  {
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correct: 2,
  },
];

export default function GameSessionScreen({ route, navigation }: any) {
  const { mode, stake } = route.params;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleTimeout();
    }
  }, [timeLeft, isAnswered]);

  useEffect(() => {
    // Simulate opponent answering
    if (!isAnswered) {
      const opponentTimer = setTimeout(() => {
        if (Math.random() > 0.3) {
          setOpponentScore(opponentScore + 1);
        }
      }, Math.random() * 10000 + 3000);
      return () => clearTimeout(opponentTimer);
    }
  }, [currentQuestion]);

  const handleTimeout = () => {
    setIsAnswered(true);
    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    if (index === SAMPLE_QUESTIONS[currentQuestion].correct) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const nextQuestion = () => {
    if (currentQuestion < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      endGame();
    }
  };

  const endGame = () => {
    const won = score > opponentScore;
    const winnings = won ? parseFloat(stake) * 1.8 : 0;
    
    Alert.alert(
      won ? '🎉 You Won!' : '😔 You Lost',
      `Final Score: ${score} - ${opponentScore}\n${won ? `You earned ${winnings.toFixed(2)} CELO!` : 'Better luck next time!'}`,
      [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
    );
  };

  const question = SAMPLE_QUESTIONS[currentQuestion];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>You</Text>
          <Text style={styles.score}>{score}</Text>
        </View>
        
        <View style={styles.timerBox}>
          <Text style={styles.timer}>{timeLeft}</Text>
          <Text style={styles.timerLabel}>seconds</Text>
        </View>
        
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Opponent</Text>
          <Text style={styles.score}>{opponentScore}</Text>
        </View>
      </View>

      {/* Question Progress */}
      <View style={styles.progress}>
        <Text style={styles.progressText}>
          Question {currentQuestion + 1} of {SAMPLE_QUESTIONS.length}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentQuestion + 1) / SAMPLE_QUESTIONS.length) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Question */}
      <ScrollView style={styles.content}>
        <View style={styles.questionBox}>
          <Text style={styles.question}>{question.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isCorrect = index === question.correct;
            const isSelected = selectedAnswer === index;
            
            let buttonStyle = styles.optionButton;
            if (isAnswered) {
              if (isCorrect) {
                buttonStyle = styles.optionCorrect;
              } else if (isSelected) {
                buttonStyle = styles.optionWrong;
              }
            }
            
            return (
              <TouchableOpacity
                key={index}
                style={buttonStyle}
                onPress={() => handleAnswer(index)}
                disabled={isAnswered}
              >
                <Text style={styles.optionLetter}>{String.fromCharCode(65 + index)}</Text>
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 2,
    borderBottomColor: '#00ff00',
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  score: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  timerBox: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#00ff00',
  },
  timer: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  timerLabel: {
    fontSize: 10,
    color: '#999',
  },
  progress: {
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  progressText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff00',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  questionBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 25,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#444',
  },
  question: {
    fontSize: 20,
    color: '#fff',
    lineHeight: 28,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 15,
  },
  optionButton: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
  },
  optionCorrect: {
    flexDirection: 'row',
    backgroundColor: '#00ff0020',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  optionWrong: {
    flexDirection: 'row',
    backgroundColor: '#ff000020',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ff0000',
  },
  optionLetter: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#00ff00',
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 35,
    marginRight: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
});
