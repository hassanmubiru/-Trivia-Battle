import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { walletService } from '../services/walletService';

interface UserStats {
  gamesPlayed: number;
  winRate: number;
  ranking: number;
}

export default function HomeScreen({ navigation }: any) {
  const [balance, setBalance] = useState('0.00');
  const [cUSDBalance, setCUSDBalance] = useState('0.00');
  const [username, setUsername] = useState('Player');
  const [stats, setStats] = useState<UserStats>({ gamesPlayed: 0, winRate: 0, ranking: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const phone = await AsyncStorage.getItem('userPhone');
      
      if (phone) setUsername(phone.slice(-4));
      
      // Check wallet connection
      if (walletService.isConnected()) {
        const address = walletService.getAddress();
        if (address) {
          setUsername(address.slice(0, 6) + '...' + address.slice(-4));
          
          // Fetch balances
          const balances = await walletService.getBalances();
          setBalance(parseFloat(balances.CELO).toFixed(4));
          setCUSDBalance(parseFloat(balances.cUSD).toFixed(2));
        }
      } else {
        // Try to restore connection
        const wallet = await walletService.restoreConnection();
        if (wallet && wallet.isConnected) {
          setUsername(wallet.address.slice(0, 6) + '...' + wallet.address.slice(-4));
          setBalance(parseFloat(wallet.balances.CELO).toFixed(4));
          setCUSDBalance(parseFloat(wallet.balances.cUSD).toFixed(2));
        }
      }
      
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
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

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff00" />
        }
      >
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
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  balance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  balanceSecondary: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0088ff',
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
