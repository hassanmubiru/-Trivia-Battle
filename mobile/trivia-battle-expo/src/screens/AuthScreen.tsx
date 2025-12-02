import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  // @ts-ignore
  ScrollView, 
  StyleSheet, 
  // @ts-ignore
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMetaMaskSDK } from '../hooks/useMetaMaskSDK';
import { Button, Card } from '../components';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

export default function AuthScreen({ navigation }: any) {
  const metaMask = useMetaMaskSDK();

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
      if (isAuthenticated === 'true') {
        navigation.replace('Main');
      }
    };
    checkAuth();
  }, [navigation]);

  // Auto-navigate when MetaMask connects
  useEffect(() => {
    const handleWalletConnect = async () => {
      if (metaMask.isConnected && metaMask.address) {
        try {
          await AsyncStorage.setItem('walletAddress', metaMask.address);
          await AsyncStorage.setItem('walletType', 'metamask');
          await AsyncStorage.setItem('isAuthenticated', 'true');
          
          Alert.alert(
            '✓ Connected!',
            `Wallet: ${metaMask.address.slice(0, 6)}...${metaMask.address.slice(-4)}`,
            [{ text: 'Continue', onPress: () => navigation.replace('Main') }]
          );
        } catch (error) {
          console.error('Error saving wallet:', error);
        }
      }
    };
    
    handleWalletConnect();
  }, [metaMask.isConnected, metaMask.address]);

  const handleMetaMaskConnect = async () => {
    try {
      await metaMask.connect();
    } catch (error: any) {
      console.error('Connection error:', error);
      Alert.alert(
        'Connection Failed',
        error.message || 'Failed to connect to MetaMask',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <RNStatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Trivia Battle</Text>
        <Text style={styles.subtitle}>Test Your Knowledge, Earn Crypto</Text>
      </View>

      {/* Main Card */}
      <Card style={styles.card} variant="elevated">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect Your Wallet</Text>
          <Text style={styles.sectionDescription}>
            Connect MetaMask to play trivia and earn rewards on Celo
          </Text>
          
          {/* MetaMask Connection */}
          <Button
            title={metaMask.isConnecting ? '⏳ Connecting...' : '🦊 Connect MetaMask'}
            onPress={handleMetaMaskConnect}
            disabled={metaMask.isConnecting}
            loading={metaMask.isConnecting}
            variant="primary"
            size="lg"
            fullWidth
          />

          {metaMask.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {metaMask.error.message}</Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 How it works:</Text>
            <Text style={styles.infoText}>
              1. Tap "Connect MetaMask" above
            </Text>
            <Text style={styles.infoText}>
              2. Approve the connection in MetaMask app
            </Text>
            <Text style={styles.infoText}>
              3. Return to this app and start playing!
            </Text>
          </View>
        </View>
      </Card>

      {/* Network Card */}
      <Card style={styles.infoCard} variant="outlined">
        <View style={styles.networkInfo}>
          <Text style={styles.networkBadge}>🔗 Celo Sepolia Testnet</Text>
          <Text style={styles.infoText}>
            Get test CELO from the{' '}
            <Text 
              style={styles.link}
              onPress={() => Linking.openURL('https://celo-sepolia-faucet.vercel.app')}
            >
              faucet
            </Text>
          </Text>
        </View>
      </Card>

      {/* Security Card */}
      <Card style={styles.securityCard} variant="outlined">
        <View style={styles.securityInfo}>
          <Text style={styles.securityTitle}>🛡️ Security Note</Text>
          <Text style={styles.securityText}>
            WalletConnect uses industry-standard encryption. Your private keys stay safe on your device.
          </Text>
        </View>
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Play trivia, compete with others, and earn rewards on Celo
        </Text>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  headerSection: {
    marginBottom: Spacing['3xl'],
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    marginBottom: Spacing.xl,
    width: '100%',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.onSurface,
    marginBottom: Spacing.md,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.outline,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: Colors.onSurfaceVariant,
  },
  infoBox: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  bold: {
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.onSurface,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#c62828',
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: '#c62828',
  },
  infoCard: {
    marginBottom: Spacing.lg,
    width: '100%',
  },
  securityCard: {
    marginBottom: Spacing.lg,
    width: '100%',
    borderColor: Colors.success,
  },
  networkInfo: {
    alignItems: 'center',
  },
  securityInfo: {
    alignItems: 'flex-start',
  },
  networkBadge: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  securityTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
  securityText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.onSurfaceVariant,
  },
  link: {
    color: Colors.secondary,
    fontWeight: Typography.fontWeight.semibold as any,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  miniPayBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignSelf: 'center',
    marginTop: Spacing.sm,
  },
  miniPayBadgeText: {
    fontSize: Typography.fontSize.sm,
    color: '#2e7d32',
    fontWeight: Typography.fontWeight.medium as any,
  },
});
