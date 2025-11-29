# Real Wallet Connection Guide

## Overview

The Trivia Battle app now supports **real wallet connections** with actual transaction signing capability. No more read-only fallbacks!

## Connection Methods

### 1. **Injected Wallet Provider (PREFERRED)**
Connect with MetaMask, MiniPay, or any Web3 wallet that injects an `ethereum` provider.

**Features:**
- ✅ Real transaction signing
- ✅ Automatic account detection
- ✅ User-controlled approvals
- ✅ Full contract interaction capability

**Supported Wallets:**
- MetaMask
- Opera MiniPay (via injected provider)
- Any EIP-1193 compatible wallet

**How it works:**
1. User taps "Connect MetaMask / Wallet"
2. App requests account access via injected provider
3. User approves in wallet
4. App gets real signer from browser provider
5. All transactions are signed by the actual wallet

### 2. **Manual Address Entry (Read-Only Fallback)**
Enter a wallet address when no Web3 provider is available.

**Features:**
- ✅ View wallet balance
- ✅ Check game history
- ✗ Cannot sign transactions
- ✗ Cannot play games requiring deposits

**When to use:**
- MetaMask not installed
- Testing balance checking
- Viewing wallet info without signing

## Implementation Details

### WalletService Changes

#### New Methods:

```typescript
// Check if wallet provider is available
hasInjectedProvider(): boolean

// Request account from provider
async requestAccount(): Promise<string>

// Connect with injected provider (real signing)
async connectWithProvider(): Promise<WalletInfo>

// Get signer for direct contract interactions
getSigner(): ethers.Signer | null
```

#### Updated Methods:

```typescript
// Now tries injected provider first, falls back to manual address
async connectMetaMask(address?: string): Promise<WalletInfo>

// Restored connections with signer recovery
async restoreConnection(): Promise<WalletInfo | null>

// Real transaction signing
async sendTransaction(to: string, value: string, data?: string): Promise<string>

// Real token approval
async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<string>
```

### MiniPayService Changes

#### Updated Methods:

```typescript
// Connect with read-only address (no signer)
async connectWithAddress(address: string): Promise<WalletState>

// Deposit with real signing
async deposit(amount: string, token?: string): Promise<string>

// Withdraw with real signing
async withdraw(amount: string, token?: string): Promise<string>

// Approve token with real signing
async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<string>
```

**Error Handling:**
- Throws clear error if signer not available
- User can connect with MetaMask/MiniPay for transaction support

### AuthScreen Updates

**Connection Flow:**

1. **"Connect MetaMask / Wallet" Button**
   - Attempts injected provider connection
   - Shows success with signing capability indicator
   - Falls back to MetaMask not available alert

2. **"Enter Address (Read-Only)" Button**
   - Manual address entry field
   - Clear read-only mode indication
   - No transaction capability warning

3. **User Feedback:**
   - ✓ Ready to sign transactions (full connection)
   - ⚠️ Read-only mode (manual address)

## Error Messages

### When User Tries Transaction in Read-Only Mode:

```
"Wallet connected in read-only mode. Cannot sign transactions. 
Please connect with MetaMask or MiniPay for transaction support."
```

### When User Rejects Connection:

```
"User rejected the connection request"
```

### When User Rejects Transaction:

```
"User rejected the transaction"
```

## Transaction Flow

### Deposit Example (Full Connection):

```
1. User enters amount and clicks "Deposit"
2. App gets signer from walletService.getSigner()
3. App creates contract instance with signer
4. User signs transaction in MetaMask/MiniPay
5. Transaction sent to blockchain
6. App waits for confirmation
7. Receipt hash returned to app
8. Success message shown to user
```

### Query Balance Example (Any Connection):

```
1. App uses provider (read-only)
2. No signing required
3. Returns balance immediately
4. Works in both connection modes
```

## Configuration

### Celo Sepolia Testnet (Default):

```typescript
// Network settings
chainId: 11142220
rpcUrl: 'https://celo-sepolia-rpc.publicnode.com'

// Token addresses
cUSD: '0xc2FB5a20d07036d828cBbF2FCEE5cea02cc9Cb2f'
USDC: '0x360Da2CcFE307B5CB0330d062d8D83B721811B76'
USDT: '0xE5eA34847A04d197B22652be1Dc8FbFf11392239'

// Contract
TriviaBattle: '0xAbB8c5D478F5FA20e4f8bc719B9B09b67Dd03ECd'
```

## Testing Checklist

### Real Connection Tests:
- [ ] MetaMask installed, click "Connect MetaMask / Wallet"
- [ ] Approve account request in MetaMask
- [ ] See "✓ Ready to sign transactions" message
- [ ] Balance displays correctly
- [ ] Attempt deposit - transaction sign in MetaMask
- [ ] Confirm transaction completes

### Read-Only Tests:
- [ ] Click "Enter Address (Read-Only)"
- [ ] Enter valid 0x address
- [ ] See "⚠️ Read-only mode" message
- [ ] Balance displays correctly
- [ ] Attempt deposit - get error message about read-only mode
- [ ] Can still view balance and game history

### Error Cases:
- [ ] No MetaMask, click "Connect MetaMask / Wallet" - see install alert
- [ ] Reject connection request - see rejection error
- [ ] Enter invalid address - see format error
- [ ] Try transaction in read-only - see signer error

## Migration Notes

### Breaking Changes:
- `connectMetaMask()` now requires injected provider or optional address parameter
- `deposit()` and `withdraw()` now throw error if no signer (previously returned mock hash)
- `sendTransaction()` uses real signing (previously returned mock hash)

### Backward Compatibility:
- Read-only address entry still works
- Balance queries unchanged
- Contract reads unchanged

## Future Enhancements

1. **WalletConnect Integration**
   - Support mobile wallet connections via QR code
   - Support for Valora, Ledger Live

2. **Gnosis Safe Support**
   - Multi-sig wallet integration

3. **Hardware Wallet Support**
   - Ledger Live connection
   - Trezor integration

4. **Enhanced Error Recovery**
   - Automatic reconnection on network change
   - Better error reporting and logging

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify wallet is connected to Celo Sepolia testnet
3. Ensure sufficient CELO for gas fees
4. Contact dev team with transaction hash for failures
