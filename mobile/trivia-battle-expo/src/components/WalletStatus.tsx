/**
 * Wallet Connection Status Component
 * Displays connection status, errors, and actions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { Button } from './Button';
import { UseWalletState, useWallet } from '../hooks/useWallet';

interface WalletStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const WalletStatus: React.FC<WalletStatusProps> = ({
  showDetails = false,
  compact = false,
}) => {
  const wallet = useWallet();
  const getStatusColor = (): string => {
    if (wallet.isConnecting) return Colors.warning;
    if (wallet.isConnected) return Colors.success;
    if (wallet.error) return Colors.error;
    return Colors.onSurfaceVariant;
  };

  const getStatusText = (): string => {
    if (wallet.isConnecting) return 'Connecting...';
    if (wallet.isConnected) return 'Connected';
    if (wallet.error) return 'Connection Error';
    return 'Not Connected';
  };

  if (compact && wallet.isConnected) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.statusIndicator, { backgroundColor: Colors.success }]} />
        <Text style={styles.compactText}>
          {wallet.wallet?.address?.slice(0, 6)}...{wallet.wallet?.address?.slice(-4)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status Header */}
      <View style={styles.header}>
        <View style={styles.statusInfo}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        {wallet.isConnecting && <ActivityIndicator size="small" color={Colors.primary} />}
      </View>

      {/* Wallet Details */}
      {wallet.isConnected && wallet.wallet && (
        <View style={styles.details}>
          <View style={styles.addressContainer}>
            <Text style={styles.label}>Wallet Address</Text>
            <Text style={styles.address}>{wallet.wallet.address}</Text>
          </View>

          {showDetails && wallet.wallet.balance && (
            <>
              {/* Balances */}
              <View style={styles.balancesContainer}>
                <Text style={styles.label}>Balances</Text>
                <View style={styles.balanceRow}>
                  <Text style={styles.balanceLabel}>CELO:</Text>
                  <Text style={styles.balanceValue}>
                    {typeof wallet.wallet.balance.CELO === 'string'
                      ? parseFloat(wallet.wallet.balance.CELO).toFixed(4)
                      : wallet.wallet.balance.CELO.toFixed(4)}
                  </Text>
                </View>
                {wallet.wallet.balance.cUSD && (
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>cUSD:</Text>
                    <Text style={styles.balanceValue}>
                      {typeof wallet.wallet.balance.cUSD === 'string'
                        ? parseFloat(wallet.wallet.balance.cUSD).toFixed(2)
                        : wallet.wallet.balance.cUSD.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      )}

      {/* Error Display */}
      {wallet.error && (
        <View style={[styles.errorContainer, { borderLeftColor: Colors.error }]}>
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>Connection Error</Text>
            <Text style={styles.errorMessage}>{wallet.error.message}</Text>
            {wallet.error.retryCount > 0 && (
              <Text style={styles.retryInfo}>Retries: {wallet.error.retryCount}</Text>
            )}
          </View>
          <Button
            title="Retry"
            onPress={wallet.retryConnection}
            variant="outline"
            size="sm"
            style={{ width: 'auto' }}
          />
        </View>
      )}

      {/* Action Buttons */}
      {!wallet.isConnecting && (
        <View style={styles.actions}>
          {!wallet.isConnected ? (
            <Button
              title="Connect Wallet"
              onPress={wallet.connect}
              variant="primary"
              size="lg"
              fullWidth
            />
          ) : (
            <>
              <Button
                title="Refresh Balance"
                onPress={wallet.refreshBalance}
                variant="secondary"
                size="md"
                fullWidth
                style={{ marginBottom: Spacing.sm }}
              />
              <Button
                title="Disconnect"
                onPress={wallet.disconnect}
                variant="outline"
                size="md"
                fullWidth
              />
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.base,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold as any,
  },
  compactText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.onSurface,
    fontWeight: Typography.fontWeight.medium as any,
  },
  details: {
    marginBottom: Spacing.lg,
  },
  addressContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  address: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontFamily: 'Courier New',
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  networkContainer: {
    marginBottom: Spacing.md,
  },
  balancesContainer: {
    marginBottom: Spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outline,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.onSurfaceVariant,
    fontWeight: Typography.fontWeight.medium as any,
  },
  balanceValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold as any,
  },
  value: {
    fontSize: Typography.fontSize.sm,
    color: Colors.onSurface,
    fontWeight: Typography.fontWeight.medium as any,
  },
  capabilityContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outline,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceVariant,
    borderLeftWidth: 4,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  errorTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.error,
    marginBottom: Spacing.xs,
  },
  errorMessage: {
    fontSize: Typography.fontSize.xs,
    color: Colors.onSurfaceVariant,
    marginBottom: Spacing.xs,
  },
  retryInfo: {
    fontSize: Typography.fontSize.xs,
    color: Colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  actions: {
    gap: Spacing.sm,
  },
});
