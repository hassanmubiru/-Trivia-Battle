/**
 * Matchmaking Screen
 * Allows users to select game mode, token, and entry fee, then find/create matches
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { startMatchmaking, stopMatchmaking } from '../../store/slices/gameSlice';
import { gameService } from '../../services/gameService';
import { tokenService } from '../../services/tokenService';
import { TokenSelector } from '../../components/TokenSelector';
import { SupportedToken, GameMode } from '../../types';

interface Props {
  navigation: any;
  route: any;
}

export const MatchmakingScreen: React.FC<Props> = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { address } = useSelector((state: RootState) => state.wallet);
  const { isSearching, gameMode: selectedGameMode } = useSelector(
    (state: RootState) => state.game.matchmaking
  );

  const [gameMode, setGameMode] = useState<GameMode>(
    route.params?.gameMode || '1v1'
  );
  const [entryFee, setEntryFee] = useState('0.1');
  const [selectedToken, setSelectedToken] = useState<SupportedToken>('cUSD');
  const [isCreating, setIsCreating] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});

  useEffect(() => {
    if (address) {
      loadTokenBalances();
    }
  }, [address, selectedToken]);

  const loadTokenBalances = async () => {
    if (!address) return;

    try {
      const balances = await tokenService.getAllBalances(address);
      setTokenBalances({
        cUSD: balances.cUSD.toString(),
        USDC: balances.USDC.toString(),
        USDT: balances.USDT.toString(),
      });
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const handleStartMatchmaking = async () => {
    if (!address) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    const fee = parseFloat(entryFee);
    if (isNaN(fee) || fee < 0.1) {
      Alert.alert('Error', 'Entry fee must be at least 0.1');
      return;
    }

    // Check balance
    const hasBalance = await tokenService.hasSufficientBalance(
      address,
      selectedToken,
      entryFee
    );

    if (!hasBalance) {
      Alert.alert(
        'Insufficient Balance',
        `You don't have enough ${selectedToken} to enter this match`
      );
      return;
    }

    try {
      setIsCreating(true);
      dispatch(
        startMatchmaking({
          gameMode,
          entryFee,
          token: selectedToken,
        })
      );

      // Approve token spending if needed
      const contractAddress = process.env.CONTRACT_ADDRESS || '';
      await tokenService.approveTokenSpending(
        selectedToken,
        contractAddress,
        entryFee
      );

      // Start matchmaking
      const matchId = await gameService.startMatchmaking(gameMode, entryFee);
      
      // Navigate to waiting/loading screen or directly to game
      navigation.replace('GameSession', { matchId });
    } catch (error: any) {
      console.error('Matchmaking error:', error);
      Alert.alert('Error', error.message || 'Failed to start matchmaking');
      dispatch(stopMatchmaking());
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    dispatch(stopMatchmaking());
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Match</Text>
      </View>

      <View style={styles.content}>
        {/* Game Mode Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game Mode</Text>
          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                gameMode === '1v1' && styles.modeButtonActive,
              ]}
              onPress={() => setGameMode('1v1')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  gameMode === '1v1' && styles.modeButtonTextActive,
                ]}
              >
                1v1
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                gameMode === '2v2' && styles.modeButtonActive,
              ]}
              onPress={() => setGameMode('2v2')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  gameMode === '2v2' && styles.modeButtonTextActive,
                ]}
              >
                2v2
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                gameMode === '4player' && styles.modeButtonActive,
              ]}
              onPress={() => setGameMode('4player')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  gameMode === '4player' && styles.modeButtonTextActive,
                ]}
              >
                4 Players
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Token Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Token</Text>
          <TokenSelector
            selectedToken={selectedToken}
            onTokenSelect={setSelectedToken}
            balances={tokenBalances}
          />
        </View>

        {/* Entry Fee */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entry Fee</Text>
          <TextInput
            style={styles.input}
            value={entryFee}
            onChangeText={setEntryFee}
            placeholder="0.1"
            keyboardType="decimal-pad"
          />
          <Text style={styles.inputHint}>Minimum: 0.1</Text>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startButton, (isCreating || isSearching) && styles.startButtonDisabled]}
          onPress={handleStartMatchmaking}
          disabled={isCreating || isSearching}
        >
          {isCreating || isSearching ? (
            <>
              <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.startButtonText}>Searching for match...</Text>
            </>
          ) : (
            <Text style={styles.startButtonText}>Start Matchmaking</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={!isSearching}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  modeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  modeButtonActive: {
    backgroundColor: '#35D07F',
    borderColor: '#35D07F',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  startButton: {
    backgroundColor: '#35D07F',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

