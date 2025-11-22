/**
 * Game Session Screen
 * Real-time trivia game play with questions, timer, and scores
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import {
  setCurrentMatch,
  updateQuestion,
  updateScores,
  updateTimeRemaining,
} from '../../store/slices/gameSlice';
import { gameService } from '../../services/gameService';
import { websocketService } from '../../services/websocketService';
import { Question } from '../../types';

interface Props {
  navigation: any;
  route: any;
}

export const GameSessionScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { matchId } = route.params;
  const { address } = useSelector((state: RootState) => state.wallet);
  const { currentMatch } = useSelector((state: RootState) => state.game);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [gameStatus, setGameStatus] = useState<'waiting' | 'active' | 'ended'>('waiting');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeGame();
    setupWebSocketListeners();

    return () => {
      cleanup();
    };
  }, [matchId]);

  useEffect(() => {
    if (gameStatus === 'active' && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, gameStatus]);

  const initializeGame = async () => {
    try {
      // Load questions from backend
      const response = await fetch(
        `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/questions/random?count=10`
      );
      const questionsData = await response.json();
      setQuestions(questionsData);

      // Initialize session
      await gameService.initializeSession(matchId, questionsData);
      setGameStatus('active');
      setTimeRemaining(30);

      dispatch(
        setCurrentMatch({
          matchId,
          players: [],
          entryFee: '0.1',
          prizePool: '0',
          token: 'cUSD',
          status: 'active',
          questions: questionsData,
          currentQuestionIndex: 0,
          scores: {},
          timeRemaining: 30,
        })
      );
    } catch (error) {
      console.error('Error initializing game:', error);
      Alert.alert('Error', 'Failed to load game');
    }
  };

  const setupWebSocketListeners = () => {
    websocketService.onQuestionUpdate((data) => {
      if (data.matchId === matchId) {
        setCurrentQuestionIndex(data.questionIndex);
        setTimeRemaining(data.timeRemaining);
        dispatch(updateQuestion(data.questionIndex));
        dispatch(updateTimeRemaining(data.timeRemaining));
      }
    });

    websocketService.onScoreUpdate((data) => {
      if (data.matchId === matchId) {
        setScores(data.scores);
        dispatch(updateScores(data.scores));
      }
    });

    websocketService.onMatchEnded((data) => {
      if (data.matchId === matchId) {
        setGameStatus('ended');
        showResults(data.results);
      }
    });
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null || isSubmitting || timeRemaining <= 0) {
      return;
    }

    setSelectedAnswer(answerIndex);
  };

  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null || isSubmitting || timeRemaining <= 0) {
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setIsSubmitting(true);

    try {
      // Submit to blockchain
      await gameService.submitAnswer(matchId, currentQuestion.questionId, selectedAnswer);

      // Move to next question after a delay
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSelectedAnswer(null);
          setTimeRemaining(30);
        } else {
          // All questions answered
          setGameStatus('ended');
        }
        setIsSubmitting(false);
      }, 1000);
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      Alert.alert('Error', error.message || 'Failed to submit answer');
      setIsSubmitting(false);
    }
  };

  const handleTimeout = () => {
    if (selectedAnswer === null && !isSubmitting) {
      // Auto-submit no answer (or handle timeout differently)
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setTimeRemaining(30);
      } else {
        setGameStatus('ended');
      }
    }
  };

  const showResults = (results: any) => {
    const winners = results.winners || [];
    const isWinner = address && winners.includes(address);

    Alert.alert(
      isWinner ? '🎉 You Won!' : 'Game Ended',
      isWinner
        ? `Congratulations! You won ${results.prize || '0'} tokens!`
        : 'Better luck next time!',
      [
        {
          text: 'View Results',
          onPress: () => {
            navigation.replace('Profile');
          },
        },
        {
          text: 'Play Again',
          onPress: () => {
            navigation.replace('Home');
          },
        },
      ]
    );
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    websocketService.leaveMatch(matchId);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  if (gameStatus === 'waiting') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#35D07F" />
        <Text style={styles.waitingText}>Waiting for players...</Text>
      </View>
    );
  }

  if (gameStatus === 'ended') {
    return (
      <View style={styles.container}>
        <Text style={styles.endedText}>Game Ended</Text>
        <Text style={styles.scoreText}>Final Scores</Text>
        {Object.entries(scores).map(([player, score]) => (
          <Text key={player} style={styles.playerScore}>
            {player.slice(0, 6)}...{player.slice(-4)}: {score}
          </Text>
        ))}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('Home')}
        >
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#35D07F" />
        <Text>Loading question...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.questionNumber}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <Text style={styles.timer}>{timeRemaining}s</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` },
          ]}
        />
      </View>

      {/* Question */}
      <View style={styles.questionSection}>
        <Text style={styles.category}>{currentQuestion.category}</Text>
        <Text style={styles.difficulty}>
          {currentQuestion.difficulty.toUpperCase()}
        </Text>
        <Text style={styles.question}>{currentQuestion.question}</Text>
      </View>

      {/* Answers */}
      <View style={styles.answersSection}>
        {currentQuestion.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.answerButton,
              selectedAnswer === index && styles.answerButtonSelected,
              isSubmitting && styles.answerButtonDisabled,
            ]}
            onPress={() => handleAnswerSelect(index)}
            disabled={isSubmitting || timeRemaining <= 0}
          >
            <Text
              style={[
                styles.answerText,
                selectedAnswer === index && styles.answerTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Submit Button */}
      {selectedAnswer !== null && (
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleAnswerSubmit}
          disabled={isSubmitting || timeRemaining <= 0}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isLastQuestion ? 'Submit Final Answer' : 'Submit Answer'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Scores */}
      <View style={styles.scoresSection}>
        <Text style={styles.scoresTitle}>Scores</Text>
        {Object.entries(scores).map(([player, score]) => (
          <View key={player} style={styles.scoreRow}>
            <Text style={styles.scorePlayer}>
              {player === address ? 'You' : `${player.slice(0, 6)}...${player.slice(-4)}`}
            </Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#35D07F',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#35D07F',
  },
  questionSection: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  difficulty: {
    fontSize: 12,
    color: '#35D07F',
    fontWeight: '600',
    marginBottom: 10,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    lineHeight: 28,
  },
  answersSection: {
    padding: 15,
  },
  answerButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  answerButtonSelected: {
    borderColor: '#35D07F',
    backgroundColor: '#e8f5e9',
  },
  answerButtonDisabled: {
    opacity: 0.5,
  },
  answerText: {
    fontSize: 16,
    color: '#333',
  },
  answerTextSelected: {
    color: '#35D07F',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#35D07F',
    padding: 18,
    borderRadius: 10,
    margin: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoresSection: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scorePlayer: {
    fontSize: 14,
    color: '#666',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#35D07F',
  },
  waitingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  endedText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  playerScore: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  button: {
    backgroundColor: '#35D07F',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

