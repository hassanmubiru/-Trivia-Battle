/**
 * Profile Screen
 * User profile with stats, match history, and settings
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/userSlice';
import { disconnect } from '../../store/slices/walletSlice';
import { celoService } from '../../services/celoService';
import { miniPayService } from '../../services/miniPayService';
import { TriviaBattleABI } from '../../constants/contracts';
import { formatBalance } from '../../utils/formatting';

interface Props {
  navigation: any;
}

interface MatchHistory {
  matchId: number;
  status: 'won' | 'lost' | 'draw';
  prize: string;
  token: string;
  date: Date;
  players: number;
}

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { address, phoneNumber } = useSelector((state: RootState) => state.wallet);
  const { stats } = useSelector((state: RootState) => state.user);
  const contractAddress = process.env.CONTRACT_ADDRESS || '';

  const [userStats, setUserStats] = useState<any>(null);
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [address]);

  const loadProfile = async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch user stats from contract
      try {
        const stats = await celoService.callContract(
          contractAddress,
          TriviaBattleABI,
          'playerStats',
          [address]
        );

        setUserStats({
          totalWins: Number(stats.totalWins),
          totalEarnings: Number(stats.totalEarnings),
          totalMatches: Number(stats.totalMatches),
          winRate:
            Number(stats.totalMatches) > 0
              ? (Number(stats.totalWins) / Number(stats.totalMatches)) * 100
              : 0,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      }

      // Load match history (would come from indexer/backend)
      // For now, empty array
      setMatchHistory([]);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await miniPayService.disconnect();
              dispatch(logout());
              dispatch(disconnect());
              navigation.replace('PhoneAuth');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#35D07F" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!address) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please connect your wallet first</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {address.slice(2, 4).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.address}>{formatAddress(address)}</Text>
        {phoneNumber && (
          <Text style={styles.phone}>{phoneNumber}</Text>
        )}
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {userStats?.totalWins || stats.totalWins || 0}
            </Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {userStats?.totalMatches || stats.totalMatches || 0}
            </Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {userStats?.winRate
                ? `${userStats.winRate.toFixed(1)}%`
                : stats.totalMatches > 0
                ? `${((stats.totalWins / stats.totalMatches) * 100).toFixed(1)}%`
                : '0%'}
            </Text>
            <Text style={styles.statLabel}>Win Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {userStats?.totalEarnings
                ? formatBalance(userStats.totalEarnings.toString(), 'cUSD')
                : formatBalance(stats.totalEarnings.toString(), 'cUSD')}
            </Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>
      </View>

      {/* Match History Section */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Match History</Text>
        {matchHistory.length > 0 ? (
          matchHistory.map((match) => (
            <View key={match.matchId} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchId}>Match #{match.matchId}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    match.status === 'won' && styles.statusBadgeWon,
                    match.status === 'lost' && styles.statusBadgeLost,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      match.status === 'won' && styles.statusTextWon,
                      match.status === 'lost' && styles.statusTextLost,
                    ]}
                  >
                    {match.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.matchDetails}>
                <Text style={styles.matchDetail}>
                  {match.players} players • {match.date.toLocaleDateString()}
                </Text>
                {match.status === 'won' && (
                  <Text style={styles.matchPrize}>
                    +{formatBalance(match.prize, match.token as any)}
                  </Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>No matches yet</Text>
            <Text style={styles.emptyHistorySubtext}>
              Start playing to see your match history
            </Text>
          </View>
        )}
      </View>

      {/* Actions Section */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Text style={styles.actionButtonText}>View Leaderboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.actionButtonText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
            Logout
          </Text>
        </TouchableOpacity>
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
    padding: 30,
    paddingTop: 40,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#35D07F',
  },
  address: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  phone: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#35D07F',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  historySection: {
    padding: 20,
    paddingTop: 0,
  },
  matchCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
  },
  statusBadgeWon: {
    backgroundColor: '#e8f5e9',
  },
  statusBadgeLost: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  statusTextWon: {
    color: '#35D07F',
  },
  statusTextLost: {
    color: '#f44336',
  },
  matchDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchDetail: {
    fontSize: 14,
    color: '#666',
  },
  matchPrize: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#35D07F',
  },
  emptyHistory: {
    padding: 40,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#999',
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#35D07F',
  },
  logoutButton: {
    backgroundColor: '#ffebee',
  },
  logoutButtonText: {
    color: '#f44336',
  },
});

