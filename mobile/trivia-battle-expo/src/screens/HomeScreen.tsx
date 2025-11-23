import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserStats {
  gamesPlayed: number;
  winRate: number;
  ranking: number;
}

export default function HomeScreen({ navigation }: any) {
  const [balance, setBalance] = useState('0.00');
  const [username, setUsername] = useState('Player');
  const [stats, setStats] = useState<UserStats>({ gamesPlayed: 0, winRate: 0, ranking: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const phone = await AsyncStorage.getItem('userPhone');
      const wallet = await AsyncStorage.getItem('walletAddress');
      
      if (phone) setUsername(phone.slice(-4));
      if (wallet) {
        setUsername(wallet.slice(0, 6) + '...' + wallet.slice(-4));
        // TODO: Fetch real balance from blockchain
        // const balance = await fetchWalletBalance(wallet);
        // setBalance(balance);
      }
      
      // TODO: Fetch user stats from backend
      // const response = await fetch(`YOUR_API_URL/user/stats`);
      // const data = await response.json();
      // setStats(data);
      
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startGame = (mode: string, stake: string) => {
    navigation.navigate('Matchmaking', { mode, stake });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {username}</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#00ff00" />
          ) : (
            <Text style={styles.balance}>{balance} CELO</Text>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Quick Play</Text>
        
        <TouchableOpacity 
          style={styles.gameCard}
          onPress={() => startGame('quick', '0.1')}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.iconEmoji}>⚡</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Quick Match</Text>
            <Text style={styles.cardDescription}>5 questions • 0.1 CELO stake</Text>
          </View>
          <Text style={styles.cardArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gameCard}
          onPress={() => startGame('standard', '0.5')}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.iconEmoji}>🎯</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Standard Match</Text>
            <Text style={styles.cardDescription}>10 questions • 0.5 CELO stake</Text>
          </View>
          <Text style={styles.cardArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.gameCard, styles.premiumCard]}
          onPress={() => startGame('premium', '1.0')}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.iconEmoji}>💎</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Premium Match</Text>
            <Text style={styles.cardDescription}>15 questions • 1.0 CELO stake</Text>
          </View>
          <Text style={styles.cardArrow}>→</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Game Stats</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>0%</Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Ranking</Text>
          </View>
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
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#00ff00',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  balanceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  balance: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 15,
  },
  gameCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  premiumCard: {
    borderColor: '#00ff00',
    borderWidth: 2,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconEmoji: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#999',
  },
  cardArrow: {
    fontSize: 24,
    color: '#00ff00',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
