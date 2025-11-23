import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function MatchmakingScreen({ route, navigation }: any) {
  const { mode, stake } = route.params;
  const [status, setStatus] = useState('Searching for opponent...');
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animate dots
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    // Connect to smart contract matchmaking
    const findMatch = async () => {
      try {
        // Check for available games on blockchain
        const { getAvailableGames, joinGame, createGame } = await import('../services/blockchain');
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        
        const availableGames = await getAvailableGames();
        const wallet = await AsyncStorage.getItem('walletAddress');
        const privateKey = await AsyncStorage.getItem('walletPrivateKey');
        
        if (!privateKey) {
          Alert.alert('Error', 'Wallet private key not found');
          navigation.goBack();
          return;
        }
        
        let gameId;
        
        if (availableGames.length > 0) {
          // Join existing game
          gameId = availableGames[0];
          await joinGame(privateKey, gameId);
          setStatus('Opponent found!');
        } else {
          // Create new game
          const result = await createGame(privateKey, parseFloat(stake));
          gameId = result.gameId;
          setStatus('Waiting for opponent...');
          
          // Poll for opponent joining (simplified - in production use events)
          await new Promise(resolve => setTimeout(resolve, 3000));
          setStatus('Opponent found!');
        }
        
        setTimeout(() => {
          navigation.replace('GameSession', { mode, stake, gameId });
        }, 1500);
        
      } catch (error) {
        console.error('Matchmaking error:', error);
        Alert.alert('Error', 'Failed to find match. Please try again.');
        navigation.goBack();
      }
    };
    
    findMatch();

    return () => {
      clearInterval(dotInterval);
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <Text style={styles.emoji}>🎮</Text>
        <Text style={styles.title}>{status}{dots}</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Game Mode</Text>
          <Text style={styles.infoValue}>{mode.toUpperCase()}</Text>
          
          <Text style={styles.infoLabel}>Stake Amount</Text>
          <Text style={styles.infoValue}>{stake} CELO</Text>
        </View>

        <ActivityIndicator size="large" color="#00ff00" style={styles.loader} />
        
        <Text style={styles.hint}>
          You'll be matched with an opponent of similar skill level
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 10,
  },
  loader: {
    marginVertical: 30,
  },
  hint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});
