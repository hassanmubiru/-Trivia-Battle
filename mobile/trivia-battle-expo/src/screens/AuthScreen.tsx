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
import { walletService } from '../services/walletService';
import { miniPayService } from '../services/miniPayService';
import { ethers } from 'ethers';
import { Button, Card, Input } from '../components';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

export default function AuthScreen({ navigation }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    // Check if already connected
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    const wallet = await walletService.restoreConnection();
    if (wallet && wallet.isConnected) {
      await AsyncStorage.setItem('isAuthenticated', 'true');
      navigation.replace('Main');
    }
  };

  const handlePhoneLogin = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    
    await AsyncStorage.setItem('userPhone', phoneNumber);
    await AsyncStorage.setItem('isAuthenticated', 'true');
    
    navigation.replace('Main');
  };

  const handleMetaMaskConnect = async () => {
    setIsConnecting(true);
    try {
      // On mobile devices, injected providers (like MetaMask's window.ethereum)
      // are not available in Expo/React Native environments.
      // 
      // Users have two options:
      // 1. Use MiniPay (Celo-native wallet) - Best for Celo
      // 2. Enter their wallet address manually for read-only access
      // 
      // In a production app, you would implement WalletConnect v2 for full mobile support
      
      Alert.alert(
        'MetaMask on Mobile',
        'In Expo/React Native, direct MetaMask injection is not available.\n\n' +
        'We recommend:\n\n' +
        '1. Use MiniPay (best for Celo) - tap "Connect with MiniPay" above\n\n' +
        '2. Enter your address manually for read-only access\n\n' +
        'For production, implement WalletConnect v2 for full mobile signing support.',
        [
          {
            text: 'Try MiniPay',
            onPress: () => {
              setIsConnecting(false);
              handleMiniPayConnect();
            },
          },
          {
            text: 'Enter Address',
            onPress: () => {
              setIsConnecting(false);
              setShowManualInput(true);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setIsConnecting(false),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Connection failed');
      setIsConnecting(false);
    }
  };

  const handleMiniPayConnect = async () => {
    setIsConnecting(true);
    try {
      // Check if MiniPay is available
      if (!miniPayService.isMiniPayEnvironment()) {
        Alert.alert(
          'MiniPay Not Available',
          'This app must be opened in the Opera MiniPay wallet to use MiniPay connection.\n\nAlternatively, use MetaMask or manual address entry.',
          [{ text: 'OK' }]
        );
        setIsConnecting(false);
        return;
      }

      // Attempt to connect via MiniPay
      const walletState = await miniPayService.connect();
      
      if (walletState.isConnected && walletState.address) {
        await AsyncStorage.setItem('walletAddress', walletState.address);
        await AsyncStorage.setItem('walletType', 'minipay');
        await AsyncStorage.setItem('isAuthenticated', 'true');
        
        Alert.alert(
          'Connected via MiniPay!',
          `CELO: ${parseFloat(walletState.balances.CELO).toFixed(4)}\ncUSD: ${parseFloat(walletState.balances.cUSD).toFixed(2)}`,
          [{ text: 'Continue', onPress: () => navigation.replace('Main') }]
        );
      }
    } catch (error: any) {
      Alert.alert('MiniPay Connection Error', error.message || 'Failed to connect MiniPay wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWalletConnect = async () => {
    if (!walletAddress || walletAddress.length < 42) {
      Alert.alert('Error', 'Please enter a valid wallet address (0x...)');
      return;
    }

    if (!ethers.isAddress(walletAddress)) {
      Alert.alert('Error', 'Invalid wallet address format');
      return;
    }

    setIsConnecting(true);
    try {
      const wallet = await walletService.connectMetaMask(walletAddress);
      
      if (wallet.isConnected) {
        await AsyncStorage.setItem('isAuthenticated', 'true');
        
        const warningText = wallet.canSign 
          ? '✓ Ready to sign transactions' 
          : '⚠️ Read-only mode\n(Cannot sign transactions without MetaMask)';
        
        Alert.alert(
          '✓ Address Connected!',
          `Wallet: ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}\n${warningText}\n\nCELO: ${parseFloat(wallet.balances.CELO).toFixed(4)}\ncUSD: ${parseFloat(wallet.balances.cUSD).toFixed(2)}`,
          [{ text: 'Play Games', onPress: () => navigation.replace('Main') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Connection Error', error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <RNStatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Trivia Battle</Text>
        <Text style={styles.subtitle}>Test Your Knowledge, Earn Crypto</Text>
      </View>

      {/* Main Content Card */}
      <Card style={styles.card} variant="elevated">
        {/* Connection Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connect Your Wallet</Text>
          
          {/* MiniPay Button */}
          <Button
            title="📱 Connect with MiniPay"
            onPress={handleMiniPayConnect}
            disabled={isConnecting}
            loading={isConnecting}
            variant="primary"
            size="lg"
            fullWidth
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Manual Wallet Connection Button */}
          <Button
            title="🦊 Manual Wallet Entry"
            onPress={handleMetaMaskConnect}
            disabled={isConnecting}
            loading={isConnecting}
            variant="secondary"
            size="lg"
            fullWidth
          />
        </View>

        {/* Divider */}
        <View style={[styles.divider, { marginVertical: Spacing.xl }]}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Manual Entry Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Entry</Text>
          <Text style={styles.sectionDescription}>
            Enter your wallet address for read-only access (no signing)
          </Text>
          
          <Input
            label="Wallet Address"
            placeholder="0x..."
            value={walletAddress}
            onChangeText={setWalletAddress}
            keyboardType="default"
          />
          
          <Button
            title="💼 Continue with Address"
            onPress={handleWalletConnect}
            disabled={isConnecting}
            loading={isConnecting}
            variant="outline"
            size="lg"
            fullWidth
          />
        </View>

        {/* Demo Mode Section */}
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
            title="Login with Phone"
            onPress={handlePhoneLogin}
            disabled={isConnecting}
            loading={isConnecting}
            variant="ghost"
            size="lg"
            fullWidth
          />
        </View>
      </Card>

      {/* Network Info Card */}
      <Card style={styles.infoCard} variant="outlined">
        <View style={styles.networkInfo}>
          <Text style={styles.networkBadge}>🔗 Celo Sepolia Testnet</Text>
          <Text style={styles.infoText}>
            Get test CELO from the{' '}
            <Text 
              style={styles.link}
              onPress={() => Linking.openURL('https://celo-sepolia-faucet.vercel.app')}
            >
              testnet faucet
            </Text>
          </Text>
        </View>
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Play trivia games, compete with others, and earn rewards on Celo blockchain
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
    marginBottom: Spacing.sm,
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
  infoCard: {
    marginBottom: Spacing.lg,
    width: '100%',
  },
  networkInfo: {
    alignItems: 'center',
  },
  networkBadge: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
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
