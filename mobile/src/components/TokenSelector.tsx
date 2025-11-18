/**
 * Token Selector Component
 * Allows users to select which stablecoin to use for entry fees
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SupportedToken, tokenService } from '../services/tokenService';

interface TokenSelectorProps {
  selectedToken: SupportedToken;
  onTokenSelect: (token: SupportedToken) => void;
  balances?: Record<SupportedToken, string>;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onTokenSelect,
  balances,
}) => {
  const tokens: SupportedToken[] = ['cUSD', 'USDC', 'USDT'];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Payment Token</Text>
      <View style={styles.tokenList}>
        {tokens.map((token) => (
          <TouchableOpacity
            key={token}
            style={[
              styles.tokenButton,
              selectedToken === token && styles.tokenButtonSelected,
            ]}
            onPress={() => onTokenSelect(token)}
          >
            <View style={styles.tokenInfo}>
              <Text
                style={[
                  styles.tokenSymbol,
                  selectedToken === token && styles.tokenSymbolSelected,
                ]}
              >
                {token}
              </Text>
              <Text style={styles.tokenName}>
                {tokenService.getTokenName(token)}
              </Text>
            </View>
            {balances && balances[token] && (
              <Text style={styles.balance}>
                Balance: {balances[token]} {token}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  tokenList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tokenButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tokenButtonSelected: {
    borderColor: '#35D07F',
    backgroundColor: '#f0fdf4',
  },
  tokenInfo: {
    alignItems: 'center',
  },
  tokenSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tokenSymbolSelected: {
    color: '#35D07F',
  },
  tokenName: {
    fontSize: 12,
    color: '#666',
  },
  balance: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
});

