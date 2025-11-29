import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { walletService } from '../services/walletService';
import { miniPayService } from '../services/miniPayService';
import { ethers } from 'ethers';

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
      // Try to connect via injected provider (MetaMask, MiniPay, etc.)
      const wallet = await walletService.connectWithProvider();
      
      if (wallet.isConnected) {
        await AsyncStorage.setItem('isAuthenticated', 'true');
        
        const signingCapability = wallet.canSign ? '✓ Ready to sign transactions' : '(Read-only mode)';
        
        Alert.alert(
          '✓ Wallet Connected!',
          `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}\n${signingCapability}\n\nCELO: ${parseFloat(wallet.balances.CELO).toFixed(4)}\ncUSD: ${parseFloat(wallet.balances.cUSD).toFixed(2)}`,
          [{ text: 'Play Games', onPress: () => navigation.replace('Main') }]
        );
      }
    } catch (error: any) {
      // If injected provider not available or user rejected, show manual input
      if (error.message.includes('No Web3 wallet provider') || error.code === 4001) {
        Alert.alert(
          'No Wallet Provider Detected',
          'MetaMask or another Web3 wallet not available. You can still enter your wallet address for read-only access, but you won\'t be able to sign transactions.\n\nFor full functionality, install MetaMask or open this app in MiniPay.',
          [
            { text: 'Install MetaMask', onPress: () => Linking.openURL('https://metamask.io') },
            { text: 'Enter Address Anyway', onPress: () => setShowManualInput(true) },
            { text: 'Cancel', style: 'cancel', onPress: () => setIsConnecting(false) },
          ]
        );
      } else {
        Alert.alert('Connection Error', error.message || 'Failed to connect wallet');
      }
    } finally {
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
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar style="light" />
      
      <Text style={styles.title}>Trivia Battle</Text>
      <Text style={styles.subtitle}>Test Your Knowledge, Earn Crypto</Text>

      <View style={styles.loginBox}>
        {/* MiniPay Connection */}
        <TouchableOpacity 
          style={[styles.button, styles.buttonMiniPay]} 
          onPress={handleMiniPayConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonTextDark}>📱 Connect with MiniPay</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.divider}>OR</Text>

        {/* MetaMask Connection */}
        <TouchableOpacity 
          style={[styles.button, styles.buttonMetaMask]} 
          onPress={handleMetaMaskConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonTextWhite}>🦊 Connect MetaMask / Wallet</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.divider}>OR</Text>

        {/* Manual Wallet Address - Read-Only Fallback */}
        <Text style={styles.label}>Manual Address (Read-Only)</Text>
        <Text style={styles.sublabel}>Enter wallet address without signing capability</Text>
        <TextInput
          style={styles.input}
          placeholder="0x..."
          placeholderTextColor="#666"
          value={walletAddress}
          onChangeText={setWalletAddress}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary]} 
          onPress={handleWalletConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>💼 Enter Address (Read-Only)</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.divider}>OR</Text>

        {/* Phone Login */}
        <Text style={styles.label}>Phone Number (Demo Mode)</Text>
        <TextInput
          style={styles.input}
          placeholder="+256 XXX XXX XXX"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
        <TouchableOpacity style={[styles.button, styles.buttonGreen]} onPress={handlePhoneLogin}>
          <Text style={styles.buttonText}>Login with Phone</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.networkInfo}>
        <Text style={styles.networkText}>🔗 Network: Celo Alfajores Testnet</Text>
        <Text style={styles.networkText}>Get test CELO from faucet.celo.org</Text>
      </View>

      <Text style={styles.info}>
        Play trivia games, compete with others, and earn rewards on Celo blockchain
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 30,
  },
  loginBox: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00ff00',
  },
  label: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 5,
    marginTop: 15,
    fontWeight: '600',
  },
  sublabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    backgroundColor: '#00ff00',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonGreen: {
    backgroundColor: '#00ff00',
  },
  buttonSecondary: {
    backgroundColor: '#0088ff',
  },
  buttonMetaMask: {
    backgroundColor: '#F6851B',
  },
  buttonMiniPay: {
    backgroundColor: '#FCFF52',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextWhite: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextDark: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 15,
    fontSize: 14,
  },
  networkInfo: {
    marginTop: 20,
    alignItems: 'center',
  },
  networkText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  info: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
});
