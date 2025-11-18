/**
 * Home Screen
 * Main dashboard showing wallet balance, stats, and quick actions
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { updateBalance } from '../../store/slices/walletSlice';
import { tokenService } from '../../services/tokenService';
import { formatBalance } from '../../utils/formatting';

interface Props {
  navigation: any;
}

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { address, balance, isConnected } = useSelector(
    (state: RootState) => state.wallet
  );
  const { stats } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (address && isConnected) {
      loadBalances();
    }
  }, [address, isConnected]);

  const loadBalances = async () => {
    if (!address) return;

    try {
      const balances = await tokenService.getAllBalances(address);
      dispatch(
        updateBalance({
          celo: balances.celo,
          cusd: balances.cUSD,
          usdc: balances.USDC,
          usdt: balances.USDT,
        })
      );
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const navigateToMatchmaking = (gameMode: '1v1' | '2v2' | '4player') => {
    navigation.navigate('Matchmaking', { gameMode });
  };

  if (!isConnected || !address) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please connect your wallet first</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trivia Battle</Text>
        <Text style={styles.subtitle}>{address.slice(0, 6)}...{address.slice(-4)}</Text>
      </View>

      {/* Balance Cards */}
      <View style={styles.balanceSection}>
        <Text style={styles.sectionTitle}>Your Balance</Text>
        <View style={styles.balanceGrid}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>cUSD</Text>
            <Text style={styles.balanceAmount}>{formatBalance(balance.cusd, 'cUSD')}</Text>
          </View>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>USDC</Text>
            <Text style={styles.balanceAmount}>{formatBalance(balance.usdc, 'USDC')}</Text>
          </View>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>USDT</Text>
            <Text style={styles.balanceAmount}>{formatBalance(balance.usdt, 'USDT')}</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalWins}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalMatches}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalEarnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Quick Play</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigateToMatchmaking('1v1')}
        >
          <Text style={styles.actionButtonText}>1v1 Battle</Text>
          <Text style={styles.actionButtonSubtext}>Head-to-head trivia</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigateToMatchmaking('2v2')}
        >
          <Text style={styles.actionButtonText}>2v2 Team Battle</Text>
          <Text style={styles.actionButtonSubtext}>Team up and compete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigateToMatchmaking('4player')}
        >
          <Text style={styles.actionButtonText}>4 Player Free-for-All</Text>
          <Text style={styles.actionButtonSubtext}>Last player standing wins</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation */}
      <View style={styles.navSection}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Leaderboard')}
        >
          <Text style={styles.navButtonText}>Leaderboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.navButtonText}>Profile</Text>
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
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
  balanceSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#35D07F',
  },
  statsSection: {
    padding: 20,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    backgroundColor: '#35D07F',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  actionButtonSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  navSection: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    justifyContent: 'space-between',
  },
  navButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#35D07F',
  },
});

