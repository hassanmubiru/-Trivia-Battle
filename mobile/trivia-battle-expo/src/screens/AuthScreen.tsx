import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { miniPayService } from '../services/miniPayService';

export default function AuthScreen({ navigation }: any) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isMiniPayAvailable, setIsMiniPayAvailable] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if MiniPay is available (in browser/webview environment)
    setIsMiniPayAvailable(miniPayService.isMiniPayEnvironment());
  }, []);

  const handlePhoneLogin = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }
    
    // Store user data
    await AsyncStorage.setItem('userPhone', phoneNumber);
    await AsyncStorage.setItem('isAuthenticated', 'true');
    
    navigation.replace('Main');
  };

  const handleMiniPayConnect = async () => {
    setIsConnecting(true);
    try {
      const walletState = await miniPayService.connect();
      if (walletState.isConnected && walletState.address) {
        await AsyncStorage.setItem('walletAddress', walletState.address);
        await AsyncStorage.setItem('walletType', walletState.isMiniPay ? 'minipay' : 'injected');
        await AsyncStorage.setItem('isAuthenticated', 'true');
        navigation.replace('Main');
      } else {
        Alert.alert('Connection Failed', 'Could not connect wallet');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWalletConnect = async () => {
    if (walletAddress.length < 42) {
      Alert.alert('Error', 'Please enter a valid wallet address');
      return;
    }
    
    // Store wallet address
    await AsyncStorage.setItem('walletAddress', walletAddress);
    await AsyncStorage.setItem('walletType', 'manual');
    await AsyncStorage.setItem('isAuthenticated', 'true');
    
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Text style={styles.title}>Trivia Battle</Text>
      <Text style={styles.subtitle}>Test Your Knowledge, Earn Crypto</Text>

      <View style={styles.loginBox}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+256 XXX XXX XXX"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
        <TouchableOpacity style={styles.button} onPress={handlePhoneLogin}>
          <Text style={styles.buttonText}>Login with Phone</Text>
        </TouchableOpacity>

        <Text style={styles.divider}>OR</Text>

        {isMiniPayAvailable ? (
          <TouchableOpacity 
            style={[styles.button, styles.buttonMiniPay]} 
            onPress={handleMiniPayConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonTextWhite}>🔗 Connect with MiniPay</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.label}>Wallet Address</Text>
            <TextInput
              style={styles.input}
              placeholder="0x..."
              placeholderTextColor="#666"
              value={walletAddress}
              onChangeText={setWalletAddress}
            />
            <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleWalletConnect}>
              <Text style={styles.buttonText}>Connect Wallet</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={styles.info}>
        Play trivia games, compete with others, and earn rewards on Celo blockchain
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ff00',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginBottom: 40,
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
    marginBottom: 8,
    marginTop: 10,
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
  buttonSecondary: {
    backgroundColor: '#0088ff',
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
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
    fontSize: 14,
  },
  info: {
    marginTop: 30,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
});
