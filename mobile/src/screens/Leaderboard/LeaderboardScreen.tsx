/**
 * Leaderboard Screen
 * Displays top players, rankings, and statistics
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { celoService } from '../../services/celoService';
import { TriviaBattleABI } from '../../constants/contracts';
import { PlayerStats } from '../../types';

interface Props {
  navigation: any;
}

export const LeaderboardScreen: React.FC<Props> = ({ navigation }) => {
  const { address } = useSelector((state: RootState) => state.wallet);
  const contractAddress = process.env.CONTRACT_ADDRESS || '';

  const [topPlayers, setTopPlayers] = useState<PlayerStats[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'global' | 'weekly' | 'monthly'>('global');

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      // Fetch top players from smart contract
      const players = await celoService.callContract(
        contractAddress,
        TriviaBattleABI,
        'getTopPlayers',
        [100] // Top 100
      );

      // Transform data
      const transformedPlayers: PlayerStats[] = players.map((p: any, index: number) => ({
        address: p.player,
        totalWins: Number(p.totalWins),
        totalEarnings: Number(p.totalEarnings),
        totalMatches: Number(p.totalMatches),
        winRate: p.totalMatches > 0 ? (Number(p.totalWins) / Number(p.totalMatches)) * 100 : 0,
      }));

      setTopPlayers(transformedPlayers);

      // Get user rank if connected
      if (address) {
        try {
          const rank = await celoService.callContract(
            contractAddress,
            TriviaBattleABI,
            'getPlayerRank',
            [address]
          );
          setUserRank(Number(rank));

          // Get user stats
          const stats = await celoService.callContract(
            contractAddress,
            TriviaBattleABI,
            'playerStats',
            [address]
          );

          setUserStats({
            address,
            totalWins: Number(stats.totalWins),
            totalEarnings: Number(stats.totalEarnings),
            totalMatches: Number(stats.totalMatches),
            winRate:
              Number(stats.totalMatches) > 0
                ? (Number(stats.totalWins) / Number(stats.totalMatches)) * 100
                : 0,
          });
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#35D07F" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'global' && styles.filterButtonActive]}
          onPress={() => setFilter('global')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'global' && styles.filterButtonTextActive,
            ]}
          >
            Global
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'weekly' && styles.filterButtonActive]}
          onPress={() => setFilter('weekly')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'weekly' && styles.filterButtonTextActive,
            ]}
          >
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'monthly' && styles.filterButtonActive]}
          onPress={() => setFilter('monthly')}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'monthly' && styles.filterButtonTextActive,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
      </View>

      {/* User Stats */}
      {userStats && (
        <View style={styles.userSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.userCard}>
            <Text style={styles.userRank}>
              {userRank ? `Rank #${userRank}` : 'Unranked'}
            </Text>
            <View style={styles.userStatsGrid}>
              <View style={styles.userStat}>
                <Text style={styles.userStatValue}>{userStats.totalWins}</Text>
                <Text style={styles.userStatLabel}>Wins</Text>
              </View>
              <View style={styles.userStat}>
                <Text style={styles.userStatValue}>{userStats.totalMatches}</Text>
                <Text style={styles.userStatLabel}>Matches</Text>
              </View>
              <View style={styles.userStat}>
                <Text style={styles.userStatValue}>
                  {userStats.winRate.toFixed(1)}%
                </Text>
                <Text style={styles.userStatLabel}>Win Rate</Text>
              </View>
              <View style={styles.userStat}>
                <Text style={styles.userStatValue}>
                  {formatNumber(userStats.totalEarnings)}
                </Text>
                <Text style={styles.userStatLabel}>Earnings</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Top Players */}
      <View style={styles.leaderboardSection}>
        <Text style={styles.sectionTitle}>Top Players</Text>
        {topPlayers.map((player, index) => (
          <View
            key={player.address}
            style={[
              styles.playerRow,
              address === player.address && styles.playerRowHighlighted,
            ]}
          >
            <View style={styles.rankContainer}>
              {index < 3 ? (
                <Text style={styles.rankEmoji}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </Text>
              ) : (
                <Text style={styles.rankNumber}>{index + 1}</Text>
              )}
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerAddress}>
                {formatAddress(player.address)}
                {address === player.address && ' (You)'}
              </Text>
              <View style={styles.playerStatsRow}>
                <Text style={styles.playerStat}>
                  {player.totalWins} wins • {player.totalMatches} matches
                </Text>
              </View>
            </View>
            <View style={styles.playerScore}>
              <Text style={styles.scoreValue}>{formatNumber(player.totalEarnings)}</Text>
              <Text style={styles.scoreLabel}>earned</Text>
            </View>
          </View>
        ))}
      </View>

      {topPlayers.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No players yet</Text>
          <Text style={styles.emptySubtext}>Be the first to play!</Text>
        </View>
      )}
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
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  filterSection: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#35D07F',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  userSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userRank: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#35D07F',
    marginBottom: 15,
    textAlign: 'center',
  },
  userStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  userStat: {
    alignItems: 'center',
  },
  userStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  leaderboardSection: {
    padding: 15,
  },
  playerRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  playerRowHighlighted: {
    backgroundColor: '#e8f5e9',
    borderWidth: 2,
    borderColor: '#35D07F',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  rankEmoji: {
    fontSize: 24,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  playerAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  playerStatsRow: {
    flexDirection: 'row',
  },
  playerStat: {
    fontSize: 12,
    color: '#666',
  },
  playerScore: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#35D07F',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});

