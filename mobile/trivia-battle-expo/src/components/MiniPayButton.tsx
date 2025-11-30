/**
 * MiniPay Connect Button Component
 * A styled button for connecting to MiniPay wallet
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Image,
} from 'react-native';
import { useMiniPay } from '../hooks/useMiniPay';

interface MiniPayButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  showBalance?: boolean;
  style?: object;
}

export const MiniPayButton: React.FC<MiniPayButtonProps> = ({
  onConnect,
  onDisconnect,
  showBalance = true,
  style,
}) => {
  const {
    isConnected,
    isConnecting,
    isMiniPay,
    address,
    balances,
    connect,
    disconnect,
  } = useMiniPay();

  const handlePress = async () => {
    if (isConnected) {
      await disconnect();
      onDisconnect?.();
    } else {
      await connect();
      onConnect?.();
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0.00';
    if (num < 0.01) return '<0.01';
    return num.toFixed(2);
  };

  if (isConnecting) {
    return (
      <View style={[styles.button, styles.connecting, style]}>
        <ActivityIndicator color="#fff" size="small" />
        <Text style={styles.buttonText}>Connecting...</Text>
      </View>
    );
  }

  if (isConnected && address) {
    return (
      <TouchableOpacity
        style={[styles.button, styles.connected, style]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.connectedContent}>
          <View style={styles.walletInfo}>
            {isMiniPay && (
              <View style={styles.miniPayBadge}>
                <Text style={styles.miniPayBadgeText}>MiniPay</Text>
              </View>
            )}
            <Text style={styles.addressText}>{formatAddress(address)}</Text>
          </View>
          {showBalance && (
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>cUSD</Text>
              <Text style={styles.balanceValue}>${formatBalance(balances.cUSD)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, styles.disconnected, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        <Text style={styles.miniPayIcon}>💳</Text>
        <Text style={styles.buttonText}>Connect MiniPay</Text>
      </View>
    </TouchableOpacity>
  );
};

/**
 * Compact MiniPay button for headers/nav
 */
export const MiniPayButtonCompact: React.FC<MiniPayButtonProps> = ({
  onConnect,
  onDisconnect,
  style,
}) => {
  const { isConnected, isConnecting, address, balances, connect, disconnect } = useMiniPay();

  const handlePress = async () => {
    if (isConnected) {
      await disconnect();
      onDisconnect?.();
    } else {
      await connect();
      onConnect?.();
    }
  };

  if (isConnecting) {
    return (
      <View style={[styles.compactButton, style]}>
        <ActivityIndicator color="#FCFF52" size="small" />
      </View>
    );
  }

  if (isConnected && address) {
    return (
      <TouchableOpacity
        style={[styles.compactButton, styles.compactConnected, style]}
        onPress={handlePress}
      >
        <Text style={styles.compactBalance}>${parseFloat(balances.cUSD).toFixed(2)}</Text>
        <View style={styles.compactDot} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.compactButton, style]}
      onPress={handlePress}
    >
      <Text style={styles.compactText}>Connect</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connecting: {
    backgroundColor: '#666',
  },
  connected: {
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#FCFF52',
  },
  disconnected: {
    backgroundColor: '#FCFF52',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  miniPayIcon: {
    fontSize: 20,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniPayBadge: {
    backgroundColor: '#FCFF52',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniPayBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  addressText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    color: '#888',
    fontSize: 10,
  },
  balanceValue: {
    color: '#FCFF52',
    fontSize: 16,
    fontWeight: '700',
  },
  // Compact styles
  compactButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  compactConnected: {
    borderColor: '#FCFF52',
  },
  compactText: {
    color: '#FCFF52',
    fontSize: 14,
    fontWeight: '600',
  },
  compactBalance: {
    color: '#FCFF52',
    fontSize: 14,
    fontWeight: '700',
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
});

export default MiniPayButton;
