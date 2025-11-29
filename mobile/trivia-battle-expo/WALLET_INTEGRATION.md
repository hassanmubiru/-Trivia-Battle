# Advanced MetaMask Wallet Integration Guide

## Overview

This comprehensive MetaMask wallet integration module provides production-grade wallet connectivity with robust error handling, automatic reconnection, security best practices, and excellent user experience.

## Architecture

### Core Components

1. **MetaMask Service** (`metaMaskService.ts`)
   - Advanced wallet connection with retry logic
   - Automatic network detection and switching
   - Event handling for account/chain changes
   - Secure signer management
   - Token balance tracking

2. **Wallet Hook** (`useWallet.ts`)
   - React hook for component integration
   - State management for wallet connections
   - Connection lifecycle management
   - Error handling

3. **Wallet Status Component** (`WalletStatus.tsx`)
   - Visual connection status display
   - Error messaging
   - Balance display
   - Quick actions (connect, disconnect, refresh)

4. **Error Logger** (`errorLogger.ts`)
   - Comprehensive error tracking
   - Metrics collection
   - Log persistence
   - Export capabilities

## Key Features

### 1. Connection Stability

#### Automatic Retry with Exponential Backoff
```typescript
const service = getMetaMaskService({
  maxRetries: 5,
  retryDelay: 1000,
  retryBackoffMultiplier: 1.5,
  connectionTimeout: 30000
});
```

- Automatically retries failed connections
- Exponential backoff prevents connection flooding
- Configurable retry parameters
- Maximum retry limit prevents infinite loops

#### Connection Timeout
- 30-second timeout for connection requests
- Prevents hanging connections
- User can retry manually

### 2. User Experience

#### Visual Status Indicators
- **Green dot**: Connected
- **Orange dot**: Connecting
- **Red dot**: Error

#### Error Messages
- Clear, user-friendly error descriptions
- Retry buttons for failed connections
- Connection history and diagnostics

#### Wallet Details Display
- Wallet address with copy functionality
- Network information
- Real-time balance updates
- Transaction signing status

### 3. Security Best Practices

#### Private Key Handling
```typescript
// Keys are NEVER stored locally
// All signing is delegated to MetaMask
const signature = await metaMaskService.signMessage(message);
```

- No local private key storage
- All signing delegated to wallet extension
- User approval required for transactions
- Secure message signing support

#### Transaction Security
```typescript
const txHash = await metaMaskService.sendTransaction(
  toAddress,
  amount,
  optionalData
);
```

- User must approve in wallet
- Transaction validation before sending
- Hash returned for tracking

#### Data Security
- Sensitive data cleared on disconnect
- Secure AsyncStorage usage
- 24-hour session expiration
- Encrypted connection state

### 4. Compatibility

#### Supported Wallets
- MetaMask (primary)
- MiniPay (Celo-native)
- Generic Web3 wallets

#### Device Support
- iOS with MetaMask mobile app
- Android with MetaMask mobile app
- React Native / Expo compatible
- Web browser extensions

#### Network Support
- Celo Sepolia (testnet)
- Automatic network switching
- Network addition if needed
- Chain validation

### 5. Performance Optimization

#### Lazy Loading
```typescript
// Service is lazily initialized
const service = getMetaMaskService();
```

#### Connection Caching
```typescript
// Restores previous connection automatically
const restored = await service.restoreConnection();
```

#### Balance Caching
- Balances cached between fetches
- Manual refresh available
- Configurable refresh intervals

#### Event-Driven Updates
- Real-time account change detection
- Automatic balance updates
- Chain change notifications

### 6. State Management

#### Provider States
```typescript
interface WalletConnection {
  address: string;
  isConnected: boolean;
  canSign: boolean;
  network: NetworkInfo;
  balance: TokenBalances;
  lastConnectedAt: number;
}
```

#### Event System
```typescript
service.on('connected', (connection) => {
  // Handle connection
});

service.on('error', (error) => {
  // Handle error
});

service.on('accountChanged', (address) => {
  // Handle account change
});

service.on('chainChanged', (chainId) => {
  // Handle chain change
});

service.on('disconnected', () => {
  // Handle disconnection
});
```

### 7. Error Logging and Debugging

#### Comprehensive Logging
```typescript
const logger = getErrorLogger();

logger.info('MetaMask', 'Connection started');
logger.warn('MetaMask', 'Retrying connection');
logger.error('MetaMask', 'Connection failed', error);
logger.critical('MetaMask', 'Critical error', error);
```

#### Error Metrics
```typescript
const metrics = logger.getMetrics();
console.log(`Total Errors: ${metrics.totalErrors}`);
console.log(`Connection Failures: ${metrics.connectionFailures}`);
```

#### Log Export
```typescript
const logsJson = logger.exportLogs();
// Send to backend for analysis
```

#### Debug Mode
```typescript
const service = getMetaMaskService({
  enableDebugLogging: true // or __DEV__
});
```

## Usage Examples

### Basic Integration

```typescript
import { useWallet } from '../hooks/useWallet';
import { WalletStatus } from '../components/WalletStatus';

export function WalletScreen() {
  const wallet = useWallet();

  return (
    <View>
      <WalletStatus wallet={wallet} showDetails={true} />
    </View>
  );
}
```

### Advanced Integration

```typescript
import { getMetaMaskService } from '../services/metaMaskService';
import { getErrorLogger } from '../services/errorLogger';

export async function handleGameCreation() {
  const metaMask = getMetaMaskService();
  const logger = getErrorLogger();

  try {
    // Check connection
    if (!metaMask.isConnected()) {
      throw new Error('Wallet not connected');
    }

    // Check balance
    const connection = metaMask.getConnectionState();
    if (parseFloat(connection?.balance.cUSD || '0') < 10) {
      throw new Error('Insufficient balance');
    }

    // Send transaction
    const txHash = await metaMask.sendTransaction(
      gameContractAddress,
      '10', // 10 cUSD stake
      gameData
    );

    logger.info('GameCreation', 'Transaction sent', { hash: txHash });
    return txHash;

  } catch (error: any) {
    logger.error('GameCreation', 'Failed to create game', error);
    // Show error to user
  }
}
```

### Custom Configuration

```typescript
import { getMetaMaskService } from '../services/metaMaskService';

const metaMask = getMetaMaskService({
  maxRetries: 3,
  retryDelay: 500,
  retryBackoffMultiplier: 2,
  connectionTimeout: 20000,
  enableDebugLogging: true
});
```

### Error Handling

```typescript
try {
  await wallet.connect();
} catch (error: any) {
  const errorCode = error.code;
  
  switch (errorCode) {
    case 'USER_REJECTED':
      // User declined connection
      break;
    case 'NETWORK_ERROR':
      // Network connectivity issue
      break;
    case 'TIMEOUT':
      // Connection timeout
      break;
    default:
      // Unknown error
  }
}
```

### Monitoring

```typescript
const logger = getErrorLogger();

// Get recent errors
const recentErrors = logger.getLogs({
  level: ErrorSeverity.ERROR
});

// Get all errors for a specific tag
const connectionErrors = logger.getLogs({
  tag: 'Connection'
});

// Export logs for debugging
const logsJson = logger.exportLogs();
console.log(logger.getErrorSummary());
```

## API Reference

### MetaMaskService

#### Methods
- `connect()`: Establish wallet connection
- `disconnect()`: Disconnect wallet
- `isConnected()`: Check connection status
- `getAddress()`: Get wallet address
- `getConnectionState()`: Get full connection object
- `getBalances()`: Fetch all token balances
- `sendTransaction()`: Send transaction
- `signMessage()`: Sign message
- `restoreConnection()`: Restore previous connection
- `isWalletAvailable()`: Check wallet presence
- `detectWalletType()`: Identify wallet type

#### Events
- `connected`: Connection successful
- `disconnected`: Wallet disconnected
- `error`: Connection error
- `accountChanged`: User switched account
- `chainChanged`: User switched network

### useWallet Hook

#### State
- `wallet`: Current connection state
- `isConnecting`: Connection in progress
- `isConnected`: Connected boolean
- `error`: Current error or null

#### Methods
- `connect()`: Initiate connection
- `disconnect()`: Disconnect wallet
- `refreshBalance()`: Update balances
- `retryConnection()`: Retry failed connection

### WalletStatus Component

#### Props
- `wallet`: UseWalletState object (required)
- `showDetails`: Show full details (default: false)
- `compact`: Compact display mode (default: false)

## Security Considerations

1. **Private Key Safety**
   - Never request or store private keys
   - Always use wallet's signing capabilities
   - User controls all approvals

2. **Data Handling**
   - Clear sensitive data on disconnect
   - Encrypt stored connection state
   - Use secure storage (AsyncStorage)

3. **Transaction Security**
   - Always verify recipient address
   - Display clear transaction details
   - Require user confirmation

4. **Connection Security**
   - Validate network before operations
   - Verify contract addresses
   - Use HTTPS only

## Testing

### Unit Tests
```typescript
describe('MetaMaskService', () => {
  it('should connect to wallet', async () => {
    const service = getMetaMaskService();
    const connection = await service.connect();
    expect(connection.isConnected).toBe(true);
  });

  it('should handle connection errors', async () => {
    // Test error scenarios
  });
});
```

### Integration Tests
- Test with actual MetaMask
- Verify transaction flow
- Test network switching
- Verify error recovery

## Troubleshooting

### Connection Issues
1. Verify MetaMask is installed
2. Check wallet is unlocked
3. Verify network is Celo Sepolia
4. Check browser/app permissions

### Transaction Issues
1. Verify sufficient balance
2. Check gas fees
3. Verify contract address
4. Check transaction parameters

### Balance Issues
1. Verify token contracts on testnet
2. Check wallet has test tokens
3. Verify network is correct
4. Try manual refresh

## Performance Metrics

- Connection time: ~2-3 seconds (with retry)
- Balance fetch: ~1-2 seconds
- Transaction: ~15-30 seconds (varies by network)
- Message signing: ~1-2 seconds

## Future Enhancements

- [ ] Multi-chain support
- [ ] Transaction history
- [ ] Gas estimation
- [ ] Token swap integration
- [ ] NFT support
- [ ] Hardware wallet support
- [ ] Mobile app deep linking
- [ ] Biometric authentication

## Support

For issues or questions, refer to:
- [MetaMask Documentation](https://docs.metamask.io/)
- [Celo Documentation](https://docs.celo.org/)
- [ethers.js Documentation](https://docs.ethers.org/)
