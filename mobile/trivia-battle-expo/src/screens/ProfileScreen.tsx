import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
}

interface UserEarnings {
  totalEarned: number;
  totalSpent: number;
  netProfit: number;
}

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({
    phone: '',
    wallet: '',
  });
  const [stats, setStats] = useState<UserStats>({
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
  });
  const [earnings, setEarnings] = useState<UserEarnings>({
    totalEarned: 0,
    totalSpent: 0,
    netProfit: 0,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load basic user info
      const phone = await AsyncStorage.getItem('userPhone');
      const wallet = await AsyncStorage.getItem('walletAddress');
      setUserInfo({
        phone: phone || 'Not set',
        wallet: wallet || 'Not connected',
      });

      if (wallet) {
        // Fetch user stats from smart contract
        const { getUserStats, getWalletBalance } = await import('../services/blockchain');
        const statsData = await getUserStats(wallet);
        
        setStats({
          totalGames: statsData.gamesPlayed,
          wins: statsData.wins,
          losses: statsData.losses,
          winRate: statsData.winRate,
        });

        // Fetch earnings from blockchain
        const balance = await getWalletBalance(wallet);
        setEarnings({
          totalEarned: statsData.totalEarnings,
          totalSpent: 0, // Would need to calculate from game history
          netProfit: balance,
        });
      }

    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('isAuthenticated');
            navigation.replace('Auth');
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.username}>Player Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00ff00" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            {/* Stats Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Game Statistics</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.totalGames}</Text>
                  <Text style={styles.statLabel}>Total Games</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.wins}</Text>
                  <Text style={styles.statLabel}>Wins</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.losses}</Text>
                  <Text style={styles.statLabel}>Losses</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.winRate}%</Text>
                  <Text style={styles.statLabel}>Win Rate</Text>
                </View>
              </View>
            </View>

            {/* Earnings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Earnings</Text>
              
              <View style={styles.earningsCard}>
                <View style={styles.earningsRow}>
                  <Text style={styles.earningsLabel}>Total Earned</Text>
                  <Text style={styles.earningsValue}>{earnings.totalEarned.toFixed(2)} CELO</Text>
                </View>
                <View style={styles.earningsRow}>
                  <Text style={styles.earningsLabel}>Total Spent</Text>
                  <Text style={styles.earningsValue}>{earnings.totalSpent.toFixed(2)} CELO</Text>
                </View>
                <View style={[styles.earningsRow, styles.earningsTotal]}>
                  <Text style={styles.earningsTotalLabel}>Net Profit</Text>
                  <Text style={styles.earningsTotalValue}>{earnings.netProfit.toFixed(2)} CELO</Text>
                </View>
              </View>
            </View>

            {/* Account Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{userInfo.phone}</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Wallet</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {userInfo.wallet}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>💰 Deposit Funds</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>💸 Withdraw</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>📜 Transaction History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
              <Text style={[styles.actionButtonText, styles.logoutText]}>🚪 Logout</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Trivia Battle v1.0.0</Text>
              <Text style={styles.footerText}>Built on Celo Blockchain</Text>
            </View>
          </>
        )}
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
    alignItems: 'center',
    padding: 30,
    paddingTop: 60,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 2,
    borderBottomColor: '#00ff00',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#00ff00',
  },
  avatarText: {
    fontSize: 50,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  earningsCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#999',
  },
  earningsValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  earningsTotal: {
    borderTopWidth: 1,
    borderTopColor: '#444',
    paddingTop: 15,
    marginTop: 5,
    marginBottom: 0,
  },
  earningsTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  earningsTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  infoCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  actionButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff000020',
    borderColor: '#ff0000',
    marginTop: 10,
  },
  logoutText: {
    color: '#ff0000',
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: '#999',
    fontSize: 14,
    marginTop: 15,
  },
});
