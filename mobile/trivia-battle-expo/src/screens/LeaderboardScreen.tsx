import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface LeaderboardPlayer {
  rank: number;
  name: string;
  wins: number;
  earnings: string;
}

export default function LeaderboardScreen() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // TODO: Enable when blockchain connection is stable
      // For now, show empty state
      setPlayers([]);
      setUserRank(null);
      
      /* Uncomment when blockchain is working:
      const { getLeaderboard } = await import('../services/blockchain');
      const leaderboardData = await getLeaderboard(100);
      
      // Transform blockchain data to match UI format
      const formattedPlayers = leaderboardData.map(player => ({
        rank: player.rank,
        name: `${player.address.slice(0, 6)}...${player.address.slice(-4)}`,
        wins: player.wins,
        earnings: player.earnings.toFixed(2),
      }));
      
      setPlayers(formattedPlayers);
      setUserRank(null);
      */
      
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.title}>🏆 Leaderboard</Text>
          <Text style={styles.subtitle}>Top Players This Week</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Leaderboard</Text>
        <Text style={styles.subtitle}>Top Players This Week</Text>
      </View>

      <ScrollView style={styles.content}>
        {players.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyTitle}>No Rankings Yet</Text>
            <Text style={styles.emptyText}>
              Be the first to play and climb the leaderboard!
            </Text>
          </View>
        ) : (
          <>
            {players.map((player) => (
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
          </>
        )}
        
        <View style={styles.yourRankCard}>
          <Text style={styles.yourRankLabel}>Your Rank</Text>
          <View style={styles.yourRankInfo}>
            <Text style={styles.yourRankNumber}>
              {userRank ? `#${userRank}` : '#--'}
            </Text>
            <Text style={styles.yourRankText}>
              {userRank ? 'Keep climbing!' : 'Play games to get ranked!'}
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
});
