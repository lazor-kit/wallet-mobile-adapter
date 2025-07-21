# LazorKit Wallet Mobile Adapter

A React Native adapter for LazorKit smart wallet with WebAuthn/passkey authentication on Solana.

## 🚨 Security Notice

This SDK handles sensitive wallet operations including:
- WebAuthn/passkey authentication
- Smart wallet creation and management
- Transaction signing
- Private key management

**Always verify the authenticity of this package and review the source code before use in production applications.**

## Features

- 🔐 **WebAuthn/Passkey Authentication**: Secure biometric authentication
- 🧠 **Smart Wallet Management**: Create and manage smart wallets on Solana
- 💰 **Paymaster Integration**: Transaction fee sponsorship
- 📱 **React Native Support**: Native mobile integration
- 🔄 **Persistent Storage**: Secure wallet state persistence
- 🎯 **TypeScript Support**: Full type safety

## Installation

```bash
npm install @lazorkit/wallet-mobile-adapter
```

### Peer Dependencies

This package requires the following peer dependencies:

```json
{
  "react": ">=18.0.0",
  "react-native": ">=0.70.0"
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
    isConnected,
    isLoading,
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
        <button onClick={handleConnect} disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
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

### 3. Error Handling
Implement proper error handling for wallet operations:

```tsx
import { LazorKitError, WalletConnectionError, SigningError } from '@lazorkit/wallet-mobile-adapter';

try {
  await connect(options);
} catch (error) {
  if (error instanceof WalletConnectionError) {
    // Handle connection-specific errors
  } else if (error instanceof SigningError) {
    // Handle signing-specific errors
  } else if (error instanceof LazorKitError) {
    // Handle general LazorKit errors
  } else {
    // Handle unexpected errors
  }
}
```

### 4. Debug Mode
Only enable debug mode in development:

```tsx
<LazorKitProvider isDebug={__DEV__}>
```

## API Reference

### Hooks

#### `useLazorWallet()`
Returns wallet state and methods.

**Returns:**
- `isConnected: boolean` - Wallet connection status
- `isLoading: boolean` - Loading state
- `isConnecting: boolean` - Connection in progress
- `isSigning: boolean` - Signing in progress
- `error: Error | null` - Current error state
- `connect(options: ConnectOptions)` - Connect to wallet
- `disconnect(options?: DisconnectOptions)` - Disconnect wallet
- `signMessage(transaction, options: SignOptions)` - Sign transaction

### Types

#### `ConnectOptions`
```typescript
interface ConnectOptions {
  redirectUrl: string;
  onSuccess?: (wallet: WalletInfo) => void;
  onFail?: (error: Error) => void;
}
```

#### `SignOptions`
```typescript
interface SignOptions {
  redirectUrl: string;
  onSuccess?: (signature: string) => void;
  onFail?: (error: Error) => void;
}
```

## Error Handling

The SDK provides specific error classes for different scenarios:

```typescript
import { 
  LazorKitError, 
  WalletConnectionError, 
  SigningError 
} from '@lazorkit/wallet-mobile-adapter';

// Check error types
if (error instanceof WalletConnectionError) {
  // Handle connection errors
} else if (error instanceof SigningError) {
  // Handle signing errors
}
```

## Troubleshooting

### Common Issues

1. **"Cannot resolve module" errors**
   - Ensure all peer dependencies are installed
   - Check React Native version compatibility

2. **WebAuthn not working**
   - Verify HTTPS is enabled (required for WebAuthn)
   - Check browser compatibility

3. **Transaction signing fails**
   - Verify paymaster service is accessible
   - Check network connectivity

### Debug Mode

Enable debug logging to troubleshoot issues:

```tsx
<LazorKitProvider isDebug={true}>
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
