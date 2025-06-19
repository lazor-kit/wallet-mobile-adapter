# LazorKit Wallet Mobile Adapter

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white" alt="Solana" />
</p>

A React Native SDK for integrating LazorKit smart wallets with WebAuthn passkey authentication. Provides secure, gasless wallet functionality with zero seed phrase management.

## Features

- **WebAuthn Authentication** - Secure biometric authentication (Face ID, Touch ID, fingerprint)
- **Smart Contract Wallets** - Account abstraction on Solana with enhanced security
- **Gasless Transactions** - Fee sponsorship through integrated paymaster service
- **Auto-Persistence** - Automatic wallet state management with AsyncStorage
- **TypeScript Support** - Complete type safety with comprehensive error handling
- **Debug Mode** - Configurable logging for development and production

## Installation

```bash
npm install @lazorkit/wallet-mobile-adapter
```

## Quick Start

```tsx
import React from 'react';
import { LazorKitWalletProvider, useLazorWallet } from '@lazorkit/wallet-mobile-adapter';
import { View, Button, Text } from 'react-native';
import * as anchor from '@coral-xyz/anchor';

// Setup Provider
export default function App() {
  return (
    <LazorKitWalletProvider
      rpcUrl="https://api.devnet.solana.com"
      ipfsUrl="https://portal.lazor.sh"
      paymasterUrl="https://lazorkit-paymaster.onrender.com"
      isDebug={true}
    >
      <WalletScreen />
    </LazorKitWalletProvider>
  );
}

// Use Wallet Hook
function WalletScreen() {
  const {
    smartWalletPubkey,
    isConnected,
    isConnecting,
    isSigning,
    error,
    connect,
    disconnect,
    signMessage,
  } = useLazorWallet();

  const handleConnect = async () => {
    try {
      await connect({
        redirectUrl: 'yourapp://wallet',
        onSuccess: (wallet) => console.log('Connected:', wallet.smartWallet),
        onFail: (error) => console.error('Failed:', error.message),
      });
    } catch (error) {
      console.error('Connect error:', error);
    }
  };

  const handleTransaction = async () => {
    if (!smartWalletPubkey) return;

    const instruction = anchor.web3.SystemProgram.transfer({
      fromPubkey: smartWalletPubkey,
      toPubkey: new anchor.web3.PublicKey('11111111111111111111111111111111'),
      lamports: 1000000, // 0.001 SOL
    });

    try {
      await signMessage(instruction, {
        redirectUrl: 'yourapp://sign',
        onSuccess: (signature) => console.log('Transaction:', signature),
        onFail: (error) => console.error('Failed:', error.message),
      });
    } catch (error) {
      console.error('Sign error:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {error && <Text style={{ color: 'red' }}>Error: {error.message}</Text>}
      
      {!isConnected ? (
        <Button 
          title={isConnecting ? "Connecting..." : "Connect Wallet"} 
          onPress={handleConnect}
          disabled={isConnecting}
        />
      ) : (
        <View>
          <Text>Wallet: {smartWalletPubkey?.toString()}</Text>
          <Button 
            title={isSigning ? "Signing..." : "Send Transaction"} 
            onPress={handleTransaction} 
            disabled={isSigning}
          />
          <Button title="Disconnect" onPress={disconnect} />
        </View>
      )}
    </View>
  );
}
```

## Configuration

### Provider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rpcUrl` | `string?` | `devnet` | Solana RPC endpoint |
| `ipfsUrl` | `string?` | `portal.lazor.sh` | LazorKit portal URL |
| `paymasterUrl` | `string?` | `paymaster URL` | Fee sponsorship service |
| `isDebug` | `boolean?` | `false` | Enable debug logging |

### Debug Mode

```tsx
// Development - Full logging
<LazorKitWalletProvider isDebug={true}>
  <App />
</LazorKitWalletProvider>

// Production - Errors and warnings only
<LazorKitWalletProvider isDebug={false}>
  <App />
</LazorKitWalletProvider>
```

## API Reference

### Hook Interface

```typescript
interface LazorWalletHook {
  // State
  smartWalletPubkey: anchor.web3.PublicKey | null;
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  isSigning: boolean;
  error: Error | null;
  connection: anchor.web3.Connection;
  
  // Actions  
  connect: (options: ConnectOptions) => Promise<WalletInfo>;
  disconnect: (options?: DisconnectOptions) => Promise<void>;
  signMessage: (
    instruction: anchor.web3.TransactionInstruction, 
    options: SignOptions
  ) => Promise<string>;
}
```

### Core Types

```typescript
interface WalletInfo {
  readonly credentialId: string;
  readonly passkeyPubkey: number[];
  readonly smartWallet: string;
  readonly smartWalletAuthenticator: string;
  readonly expo: string;
  readonly platform: string;
}

interface ConnectOptions {
  readonly redirectUrl: string;
  readonly onSuccess?: (wallet: WalletInfo) => void;
  readonly onFail?: (error: Error) => void;
}

interface SignOptions {
  readonly redirectUrl: string;
  readonly onSuccess?: (signature: string) => void;
  readonly onFail?: (error: Error) => void;
}
```

## Error Handling

```tsx
import { 
  LazorKitError, 
  WalletConnectionError, 
  SigningError 
} from '@lazorkit/wallet-mobile-adapter';

try {
  await connect({ redirectUrl: 'yourapp://callback' });
} catch (error) {
  if (error instanceof WalletConnectionError) {
    console.error('Connection failed:', error.message);
  } else if (error instanceof SigningError) {
    console.error('Signing failed:', error.message);
  } else if (error instanceof LazorKitError) {
    console.error('LazorKit error:', error.message, error.code);
  }
}
```

## How It Works

1. **Connect**: User connects via WebAuthn biometric authentication in browser
2. **Smart Wallet**: Creates or retrieves smart contract wallet on Solana
3. **Sign**: Transactions are signed using device passkeys via browser
4. **Execute**: Smart wallet executes transactions with paymaster fee sponsorship

## Platform Support

- **iOS**: 14+ with Face ID/Touch ID
- **Android**: 7+ with biometric authentication  
- **React Native**: 0.60+
- **Expo**: SDK 45+ (managed workflow)

## Troubleshooting

### Common Issues

**AsyncStorage Error:**
```bash
npm install @react-native-async-storage/async-storage
cd ios && pod install  # iOS only
```

**Buffer Polyfills:**
```tsx
// Add to your index.js or App.tsx
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
```

### Debug Storage

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// View stored data
const data = await AsyncStorage.getItem('lazor-wallet-store');
console.log('Stored data:', JSON.parse(data || '{}'));

// Clear data (development only)
await AsyncStorage.removeItem('lazor-wallet-store');
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [docs.lazorkit.com](https://docs.lazorkit.com)
- **Issues**: [GitHub Issues](https://github.com/lazor-kit/wallet-mobile-adapter/issues)

---

Built with ❤️ by the LazorKit team
