import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Alert,
  Linking,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { miniPayService } from '../services/miniPayService';
import { Button, Card, Input } from '../components';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

export default function AuthScreen({ navigation }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if already connected
    const checkAuth = async () => {
      const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
      if (isAuthenticated === 'true') {
        navigation.replace('Main');
      }
    };
    checkAuth();
  }, [navigation]);

  const handlePhoneLogin = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    
    setIsConnecting(true);
    try {
      await AsyncStorage.setItem('userPhone', phoneNumber);
      await AsyncStorage.setItem('isAuthenticated', 'true');
      navigation.replace('Main');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to login');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWalletConnectMetaMask = async () => {
    setIsConnecting(true);
    try {
      const projectId = process.env.EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID;
      
      if (!projectId) {
        Alert.alert(
          'Configuration Required',
          'WalletConnect Project ID not configured.\n\n' +
          'Steps:\n' +
          '1. Go to: cloud.walletconnect.com\n' +
          '2. Create a free account and get a Project ID\n' +
          '3. Add to .env file:\n' +
          '   EXPO_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-id\n\n' +
          'Reference: WALLETCONNECT_V2_IMPLEMENTATION.md',
          [
            {
              text: 'Open WalletConnect Cloud',
              onPress: () => Linking.openURL('https://cloud.walletconnect.com'),
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
        setIsConnecting(false);
        return;
      }

      Alert.alert(
        'WalletConnect Setup',
        'Full WalletConnect v2 implementation coming soon.\n\n' +
        'To complete integration:\n' +
        '1. Implement WalletConnectService from WALLETCONNECT_V2_IMPLEMENTATION.md\n' +
        '2. Create files in src/services/ and src/hooks/\n' +
        '3. Test with MetaMask Mobile app\n\n' +
        'Your Project ID is configured and ready!',
        [{ text: 'Got It' }]
      );
      setIsConnecting(false);
    } catch (error: any) {
      Alert.alert('Connection Error', error.message || 'Failed to connect');
      setIsConnecting(false);
    }
  };

  const handleMiniPayConnect = async () => {
    setIsConnecting(true);
    try {
      if (!miniPayService.isMiniPayEnvironment()) {
        Alert.alert(
          'MiniPay Not Available',
          'Open this app in Opera MiniPay wallet to use MiniPay connection.\n\n' +
          'Alternative: Use MetaMask via WalletConnect',
          [{ text: 'OK' }]
        );
        setIsConnecting(false);
        return;
      }

      const walletState = await miniPayService.connect();
      
      if (walletState.isConnected && walletState.address) {
        await AsyncStorage.setItem('walletAddress', walletState.address);
        await AsyncStorage.setItem('walletType', 'minipay');
        await AsyncStorage.setItem('isAuthenticated', 'true');
        
        Alert.alert(
          '✓ Connected!',
          `CELO: ${parseFloat(walletState.balances.CELO).toFixed(4)}\ncUSD: ${parseFloat(walletState.balances.cUSD).toFixed(2)}`,
          [{ text: 'Continue', onPress: () => navigation.replace('Main') }]
        );
      }
    } catch (error: any) {
      Alert.alert('MiniPay Error', error.message || 'Failed to connect');
    } finally {
      setIsConnecting(false);
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
          
          {/* Primary: WalletConnect MetaMask */}
          <Button
            title="🦊 Connect MetaMask via WalletConnect"
            onPress={handleWalletConnectMetaMask}
            disabled={isConnecting}
            loading={isConnecting}
            variant="primary"
            size="lg"
            fullWidth
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Secondary: MiniPay */}
          <Button
            title="📱 Connect with MiniPay (Celo)"
            onPress={handleMiniPayConnect}
            disabled={isConnecting}
            loading={isConnecting}
            variant="secondary"
            size="lg"
            fullWidth
          />

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💡 Wallet Options:</Text>
            <Text style={styles.infoText}>
              • <Text style={styles.bold}>MetaMask</Text> - WalletConnect v2, 100+ wallets
            </Text>
            <Text style={styles.infoText}>
              • <Text style={styles.bold}>MiniPay</Text> - Celo native wallet (mobile)
            </Text>
          </View>
        </View>

        {/* Demo Mode */}
        <View style={[styles.divider, { marginVertical: Spacing.xl }]}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demo Mode</Text>
          <Text style={styles.sectionDescription}>
            Try the app without a wallet
          </Text>
          
          <Input
            label="Phone Number"
            placeholder="+256 XXX XXX XXX"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          
          <Button
            title="📱 Login with Phone"
            onPress={handlePhoneLogin}
            disabled={isConnecting}
            loading={isConnecting}
            variant="ghost"
            size="lg"
            fullWidth
          />
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
});
