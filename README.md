# LazorKit Wallet Mobile Adapter

A React Native adapter for LazorKit smart wallet with WebAuthn/passkey authentication on Solana blockchain.

## 🚨 Security Notice

This SDK handles sensitive wallet operations including:
- WebAuthn/passkey authentication
- Smart wallet creation and management
- Transaction signing and execution
- Private key management

**Always verify the authenticity of this package and review the source code before use in production applications.**

## Features

- 🔐 **WebAuthn/Passkey Authentication**: Secure biometric authentication
- 🧠 **Smart Wallet Management**: Create and manage smart wallets on Solana
- 💰 **Paymaster Integration**: Transaction fee sponsorship
- 📱 **React Native Support**: Native mobile integration with Expo
- 🔄 **Persistent Storage**: Secure wallet state persistence with AsyncStorage
- 🎯 **TypeScript Support**: Full type safety and IntelliSense
- 🏗️ **Anchor Integration**: Built on Solana's Anchor framework
- 📦 **Modular Architecture**: Clean separation of concerns

## Installation

```bash
npm install @lazorkit/wallet-mobile-adapter
```

### Dependencies

This package includes the following dependencies:

```json
{
  "@coral-xyz/anchor": "0.31.1",
  "@react-native-async-storage/async-storage": "2.2.0",
  "buffer": "6.0.3",
  "expo-web-browser": "^14.2.0",
  "js-sha256": "0.11.1",
  "react-native-get-random-values": "^1.11.0",
  "zustand": "^5.0.7"
}
```

## Quick Start

### 1. Wrap your app with the provider

```tsx
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';

function App() {
  return (
    <LazorKitProvider
      rpcUrl="https://api.devnet.solana.com"
      ipfsUrl="https://portal.lazor.sh"
      paymasterUrl="https://lazorkit-paymaster.onrender.com"
      isDebug={false}
    >
      <YourApp />
    </LazorKitProvider>
  );
}
```

### 2. Use the wallet hook

```tsx
import { useLazorWallet } from '@lazorkit/wallet-mobile-adapter';

function WalletComponent() {
  const {
    smartWalletPubkey,
    passkeyPubkey,
    isConnected,
    isLoading,
    isConnecting,
    isSigning,
    connect,
    disconnect,
    signMessage,
    error
  } = useLazorWallet();

  const handleConnect = async () => {
    try {
      await connect({
        redirectUrl: 'your-app://wallet-callback',
        onSuccess: (wallet) => {
          console.log('Connected:', wallet);
        },
        onFail: (error) => {
          console.error('Connection failed:', error);
        }
      });
    } catch (error) {
      console.error('Connect error:', error);
    }
  };

  return (
    <div>
      {isConnected ? (
        <button onClick={disconnect}>Disconnect</button>
      ) : (
        <button onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

## Configuration

### Provider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rpcUrl` | `string` | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `ipfsUrl` | `string` | `https://portal.lazor.sh` | LazorKit portal URL |
| `paymasterUrl` | `string` | `https://lazorkit-paymaster.onrender.com` | Paymaster service URL |
| `isDebug` | `boolean` | `false` | Enable debug logging |

### Environment-Specific URLs

**Development:**
```tsx
<LazorKitProvider
  rpcUrl="https://api.devnet.solana.com"
  ipfsUrl="https://portal.lazor.sh"
  paymasterUrl="https://lazorkit-paymaster.onrender.com"
/>
```

**Production:**
```tsx
<LazorKitProvider
  rpcUrl="https://api.mainnet-beta.solana.com"
  ipfsUrl="https://portal.lazor.sh"
  paymasterUrl="https://lazorkit-paymaster.onrender.com"
/>
```

## API Reference

### Hooks

#### `useLazorWallet()`
Returns wallet state and methods.

**Returns:**
- `smartWalletPubkey: PublicKey | null` - Smart wallet public key
- `passkeyPubkey: number[] | null` - Passkey public key bytes
- `isConnected: boolean` - Wallet connection status
- `isLoading: boolean` - Loading state
- `isConnecting: boolean` - Connection in progress
- `isSigning: boolean` - Signing in progress
- `error: Error | null` - Current error state
- `connection: Connection` - Solana connection instance
- `connect(options: ConnectOptions)` - Connect to wallet
- `disconnect(options?: DisconnectOptions)` - Disconnect wallet
- `signMessage(action: SmartWalletActionArgs, options: SignOptions)` - Sign transaction

### Types

#### `ConnectOptions`
```typescript
interface ConnectOptions {
  redirectUrl: string;
  onSuccess?: (wallet: WalletInfo) => void;
  onFail?: (error: Error) => void;
}
```

#### `DisconnectOptions`
```typescript
interface DisconnectOptions {
  onSuccess?: () => void;
  onFail?: (error: Error) => void;
}
```

#### `SignOptions`
```typescript
interface SignOptions {
  redirectUrl: string;
  onSuccess?: (signature: any) => void;
  onFail?: (error: Error) => void;
}
```

#### `WalletInfo`
```typescript
interface WalletInfo {
  readonly credentialId: string;
  readonly passkeyPubkey: number[];
  readonly expo: string;
  readonly platform: string;
  readonly smartWallet: string;
  readonly walletDevice: string;
}
```

### Smart Wallet Actions

The SDK supports three types of smart wallet actions:

#### 1. Execute Transaction
```typescript
import { SmartWalletAction, SmartWalletActionArgs } from '@lazorkit/wallet-mobile-adapter';

const action: SmartWalletActionArgs<SmartWalletAction.ExecuteTransaction> = {
  type: SmartWalletAction.ExecuteTransaction,
  args: {
    policyInstruction: null, // Optional policy instruction
    cpiInstruction: transactionInstruction // Your transaction instruction
  }
};
```

#### 2. Invoke Policy
```typescript
const action: SmartWalletActionArgs<SmartWalletAction.InvokePolicy> = {
  type: SmartWalletAction.InvokePolicy,
  args: {
    policyInstruction: policyTransactionInstruction,
    newWalletDevice: {
      passkeyPubkey: newPasskeyBytes,
      credentialIdBase64: newCredentialId
    }
  }
};
```

#### 3. Update Policy
```typescript
const action: SmartWalletActionArgs<SmartWalletAction.UpdatePolicy> = {
  type: SmartWalletAction.UpdatePolicy,
  args: {
    destroyPolicyInstruction: destroyPolicyInstruction,
    initPolicyInstruction: initPolicyInstruction,
    newWalletDevice: {
      passkeyPubkey: newPasskeyBytes,
      credentialIdBase64: newCredentialId
    }
  }
};
```

### Contract Integration

The SDK exports contract integration utilities:

```typescript
import { 
  LazorkitClient, 
  DefaultPolicyClient,
  SmartWalletConfig,
  SmartWalletAuthenticator 
} from '@lazorkit/wallet-mobile-adapter';

// Use LazorkitClient for smart wallet operations
const client = new LazorkitClient(connection);

// Use DefaultPolicyClient for policy operations
const policyClient = new DefaultPolicyClient(connection);
```

## Error Handling

The SDK provides specific error classes for different scenarios:

```typescript
import { 
  LazorKitError, 
  WalletConnectionError, 
  SigningError 
} from '@lazorkit/wallet-mobile-adapter';

try {
  await connect(options);
} catch (error) {
  if (error instanceof WalletConnectionError) {
    // Handle connection-specific errors
    console.error('Connection error:', error.message);
  } else if (error instanceof SigningError) {
    // Handle signing-specific errors
    console.error('Signing error:', error.message);
  } else if (error instanceof LazorKitError) {
    // Handle general LazorKit errors
    console.error('LazorKit error:', error.message);
  } else {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
  }
}
```

## Security Best Practices

### 1. URL Verification
Always verify the authenticity of service URLs:
- `https://portal.lazor.sh` - Official LazorKit portal
- `https://lazorkit-paymaster.onrender.com` - Official paymaster service

### 2. Environment Variables
Use environment variables for sensitive configuration:

```tsx
<LazorKitProvider
  rpcUrl={process.env.SOLANA_RPC_URL}
  ipfsUrl={process.env.LAZORKIT_PORTAL_URL}
  paymasterUrl={process.env.LAZORKIT_PAYMASTER_URL}
/>
```

### 3. Debug Mode
Only enable debug mode in development:

```tsx
<LazorKitProvider isDebug={__DEV__}>
```

### 4. Error Handling
Implement proper error handling for all wallet operations:

```tsx
const handleSignMessage = async (action: SmartWalletActionArgs) => {
  try {
    const signature = await signMessage(action, {
      redirectUrl: 'your-app://sign-callback',
      onSuccess: (sig) => console.log('Signed:', sig),
      onFail: (error) => console.error('Sign failed:', error)
    });
  } catch (error) {
    console.error('Sign error:', error);
  }
};
```

## Troubleshooting

### Common Issues

1. **"Cannot resolve module" errors**
   - Ensure all dependencies are installed
   - Check React Native version compatibility
   - Verify Expo SDK version compatibility

2. **WebAuthn not working**
   - Verify HTTPS is enabled (required for WebAuthn)
   - Check browser compatibility
   - Ensure proper redirect URL configuration

3. **Transaction signing fails**
   - Verify paymaster service is accessible
   - Check network connectivity
   - Ensure proper SmartWalletActionArgs structure

4. **Buffer polyfill issues**
   - The SDK automatically includes Buffer polyfills
   - Ensure `react-native-get-random-values` is installed

### Debug Mode

Enable debug logging to troubleshoot issues:

```tsx
<LazorKitProvider isDebug={true}>
```

## Architecture

The SDK is built with a modular architecture:

```
src/
├── react/           # React components and hooks
├── core/            # Core wallet functionality
├── contract-integration/  # Anchor contract integration
├── config/          # Configuration and defaults
└── types.ts         # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@lazor.sh
- 🐛 Issues: [GitHub Issues](https://github.com/lazorkit/wallet-mobile-adapter/issues)
- 📖 Docs: [https://lazor.sh/docs](https://lazor.sh/docs)

## Security

If you discover a security vulnerability, please report it to security@lazor.sh instead of creating a public issue.
