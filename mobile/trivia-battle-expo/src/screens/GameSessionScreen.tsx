import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface Question {
  question: string;
  options: string[];
  correct: number;
}

export default function GameSessionScreen({ route, navigation }: any) {
  const { mode, stake } = route.params;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      // TODO: Fetch from your backend API
      // const response = await fetch(`YOUR_API_URL/questions?mode=${mode}`);
      // const data = await response.json();
      // setQuestions(data.questions);
      
      // For now, return empty to show proper loading/error state
      Alert.alert(
        'No Questions Available',
        'Questions need to be loaded from your backend API. Please implement the API endpoint.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to load questions:', error);
      Alert.alert('Error', 'Failed to load questions', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (questions.length === 0 || timeLeft <= 0 || isAnswered) return;
    
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isAnswered, questions]);

  useEffect(() => {
    if (timeLeft === 0 && !isAnswered && questions.length > 0) {
      handleTimeout();
    }
  }, [timeLeft]);

  useEffect(() => {
    // Simulate opponent answering
    if (!isAnswered && questions.length > 0) {
      const opponentTimer = setTimeout(() => {
        if (Math.random() > 0.3) {
          setOpponentScore(opponentScore + 1);
        }
      }, Math.random() * 10000 + 3000);
      return () => clearTimeout(opponentTimer);
    }
  }, [currentQuestion, questions]);

  const handleTimeout = () => {
    setIsAnswered(true);
    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const handleAnswer = (index: number) => {
    if (isAnswered || questions.length === 0) return;
    
    setSelectedAnswer(index);
    setIsAnswered(true);
    
    if (index === questions[currentQuestion].correct) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
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

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>No questions available</Text>
        </View>
      </View>
    );
  }

  const question = questions[currentQuestion];

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
