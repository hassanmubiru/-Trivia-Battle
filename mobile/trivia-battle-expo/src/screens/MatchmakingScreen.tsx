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

    // TODO: Connect to real matchmaking backend
    // const matchmaking = async () => {
    //   try {
    //     const response = await fetch(`${API_URL}/matchmaking/join`, {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify({ mode, stake }),
    //     });
    //     const { gameId, opponentId } = await response.json();
    //     setStatus('Opponent found!');
    //     setTimeout(() => {
    //       navigation.replace('GameSession', { mode, stake, gameId, opponentId });
    //     }, 1500);
    //   } catch (error) {
    //     console.error('Matchmaking error:', error);
    //     Alert.alert('Error', 'Failed to find opponent');
    //     navigation.goBack();
    //   }
    // };
    // matchmaking();

    // Temporary: Simulate matchmaking for demo
    const matchTimer = setTimeout(() => {
      setStatus('Opponent found!');
      setTimeout(() => {
        navigation.replace('GameSession', { mode, stake });
      }, 1500);
    }, 3000);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(matchTimer);
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
