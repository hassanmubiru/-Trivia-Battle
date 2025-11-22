import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const SAMPLE_LEADERBOARD = [
  { rank: 1, name: '0x1234...5678', wins: 150, earnings: '125.50' },
  { rank: 2, name: '0x8765...4321', wins: 142, earnings: '118.20' },
  { rank: 3, name: '0xabcd...efgh', wins: 138, earnings: '112.80' },
  { rank: 4, name: '0x9876...1234', wins: 125, earnings: '98.40' },
  { rank: 5, name: '0x5555...6666', wins: 118, earnings: '91.30' },
  { rank: 6, name: '0x7777...8888', wins: 110, earnings: '85.60' },
  { rank: 7, name: '0x3333...4444', wins: 105, earnings: '79.20' },
  { rank: 8, name: '0x1111...2222', wins: 98, earnings: '72.10' },
  { rank: 9, name: '0x9999...0000', wins: 92, earnings: '66.50' },
  { rank: 10, name: '0xaaaa...bbbb', wins: 87, earnings: '61.40' },
];

export default function LeaderboardScreen() {
  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.subtitle}>Top Players This Week</Text>
      </View>

      <ScrollView style={styles.content}>
        {SAMPLE_LEADERBOARD.map((player) => (
          <View 
            key={player.rank} 
            style={[
              styles.playerCard,
              player.rank <= 3 && styles.topPlayerCard
            ]}
          >
            <View style={styles.rankBox}>
              <Text style={styles.rankText}>{getRankEmoji(player.rank)}</Text>
            </View>
            
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerStats}>{player.wins} wins</Text>
            </View>
            
            <View style={styles.earningsBox}>
              <Text style={styles.earnings}>{player.earnings}</Text>
              <Text style={styles.earningsLabel}>CELO</Text>
            </View>
          </View>
        ))}
        
        <View style={styles.yourRankCard}>
          <Text style={styles.yourRankLabel}>Your Rank</Text>
          <View style={styles.yourRankInfo}>
            <Text style={styles.yourRankNumber}>#--</Text>
            <Text style={styles.yourRankText}>Play games to get ranked!</Text>
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
    borderBottomWidth: 2,
    borderBottomColor: '#00ff00',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  playerCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  topPlayerCard: {
    borderColor: '#00ff00',
    borderWidth: 2,
  },
  rankBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  rankText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  playerStats: {
    fontSize: 13,
    color: '#999',
  },
  earningsBox: {
    alignItems: 'flex-end',
  },
  earnings: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  earningsLabel: {
    fontSize: 11,
    color: '#999',
  },
  yourRankCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#0088ff',
  },
  yourRankLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  yourRankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yourRankNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0088ff',
    marginRight: 15,
  },
  yourRankText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
});
