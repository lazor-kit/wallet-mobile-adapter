# LazorKit Wallet Mobile Adapter

A comprehensive React Native SDK for integrating LazorKit smart wallets with your mobile applications. Built with TypeScript, featuring clean architecture, robust error handling, and full type safety.

## 🚀 Features

- **🔐 Passkey Authentication**: Secure wallet creation and signing using WebAuthn passkeys
- **📱 React Native First**: Optimized for mobile development with Expo support
- **🏗️ Clean Architecture**: Service-layer pattern with dependency injection
- **🛡️ Type Safe**: Full TypeScript support with strict typing
- **⚡ High Performance**: Optimized for mobile with efficient state management
- **🔄 Auto Retry**: Built-in retry logic for network operations
- **📊 Comprehensive Logging**: Structured logging with configurable levels
- **🧪 Testable**: Mockable services for easy unit testing

## 📦 Installation

```bash
npm install @lazorkit/wallet-mobile-adapter
# or
yarn add @lazorkit/wallet-mobile-adapter
```

### Required Peer Dependencies

```bash
npm install @coral-xyz/anchor @react-native-async-storage/async-storage expo-web-browser
```

## 🎯 Quick Start

### 1. Setup Provider

Wrap your app with the `LazorKitProvider`:

```tsx
import React from 'react';
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';

export default function App() {
  return (
    <LazorKitProvider
      rpcUrl="https://api.devnet.solana.com"
      ipfsUrl="https://portal.lazor.sh"
      paymasterUrl="https://lazorkit-paymaster.onrender.com"
      commitment="confirmed"
    >
      <YourApp />
    </LazorKitProvider>
  );
}
```

### 2. Use the Hook

Use the `useLazorWallet` hook in your components:

```tsx
import React from 'react';
import { View, Button, Text } from 'react-native';
import { useLazorWallet } from '@lazorkit/wallet-mobile-adapter';
import * as anchor from '@coral-xyz/anchor';

export function WalletScreen() {
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
        redirectUrl: 'your-app://auth',
        onSuccess: (wallet) => {
          console.log('Connected:', wallet.smartWallet);
        },
        onFail: (error) => {
          console.error('Connection failed:', error);
        },
      });
    } catch (error) {
      console.error('Connect error:', error);
    }
  };

  const handleSign = async () => {
    // Create your transaction instruction
    const instruction = anchor.web3.SystemProgram.transfer({
      fromPubkey: smartWalletPubkey!,
      toPubkey: new anchor.web3.PublicKey('...'),
      lamports: 1000000,
    });

    try {
      const signature = await signMessage(instruction, {
        redirectUrl: 'your-app://sign',
        onSuccess: (sig) => {
          console.log('Transaction signature:', sig);
        },
        onFail: (error) => {
          console.error('Signing failed:', error);
        },
      });
    } catch (error) {
      console.error('Sign error:', error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Wallet: {smartWalletPubkey?.toString() || 'Not connected'}</Text>
      <Text>Status: {isConnected ? 'Connected' : 'Disconnected'}</Text>
      
      {error && <Text style={{ color: 'red' }}>Error: {error.message}</Text>}
      
      {!isConnected ? (
        <Button
          title={isConnecting ? 'Connecting...' : 'Connect Wallet'}
          onPress={handleConnect}
          disabled={isConnecting}
        />
      ) : (
        <View>
          <Button
            title={isSigning ? 'Signing...' : 'Sign Transaction'}
            onPress={handleSign}
            disabled={isSigning}
          />
          <Button title="Disconnect" onPress={disconnect} />
        </View>
      )}
    </View>
  );
}
```

## 🏗️ Architecture

The SDK follows a clean architecture pattern with clear separation of concerns:

```
┌─────────────────┐
│   React Hook    │  ← useLazorWallet()
├─────────────────┤
│ Service Layer   │  ← WalletService, BrowserService, StorageService
├─────────────────┤
│  Core Domain    │  ← Types, Errors, Business Logic
├─────────────────┤
│   Utilities     │  ← Logger, Paymaster, Helpers
└─────────────────┘
```

### Services

- **WalletService**: Core wallet operations (connect, disconnect, sign)
- **BrowserService**: Browser interactions and URL parsing
- **StorageService**: Persistent data storage with AsyncStorage
- **PaymasterService**: Fee payment and transaction relaying

## 🔧 Configuration

### Provider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rpcUrl` | `string` | `https://api.devnet.solana.com` | Solana RPC endpoint |
| `ipfsUrl` | `string` | `https://portal.lazor.sh` | LazorKit portal URL |
| `paymasterUrl` | `string` | `https://lazorkit-paymaster.onrender.com` | Paymaster service URL |
| `commitment` | `Commitment` | `confirmed` | Transaction confirmation level |

### Environment Setup

For React Native/Expo, add to your `app.json`:

```json
{
  "expo": {
    "scheme": "your-app",
    "web": {
      "bundler": "metro"
    }
  }
}
```

## 📱 Deep Linking

Configure deep linking for authentication and signing flows:

### iOS (Info.plist)

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>your-app</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>your-app</string>
    </array>
  </dict>
</array>
```

### Android (AndroidManifest.xml)

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="your-app" />
</intent-filter>
```

## 🛡️ Error Handling

The SDK provides comprehensive error types for better debugging:

```tsx
import { 
  WalletConnectionError, 
  SigningError, 
  BrowserError,
  handleError 
} from '@lazorkit/wallet-mobile-adapter';

try {
  await connect(options);
} catch (error) {
  const handledError = handleError(error);
  
  if (handledError instanceof WalletConnectionError) {
    // Handle connection-specific errors
    console.log('Connection failed:', handledError.message);
  } else if (handledError instanceof SigningError) {
    // Handle signing-specific errors
    console.log('Signing failed:', handledError.message);
  } else {
    // Handle other errors
    console.log('Unexpected error:', handledError.message);
  }
}
```

### Error Types

- `WalletConnectionError`: Connection and authentication failures
- `SigningError`: Transaction signing failures
- `BrowserError`: Browser interaction failures
- `ValidationError`: Data validation failures
- `LazorKitError`: Base error type with error codes

## 📊 Logging

Configure logging for better debugging:

```tsx
import { logger, LogLevel } from '@lazorkit/wallet-mobile-adapter';

// Configure global logging
logger.configure({
  level: __DEV__ ? LogLevel.DEBUG : LogLevel.WARN,
  enableTimestamp: true,
});

// Create scoped loggers
const serviceLogger = logger.scope('WalletService');
serviceLogger.info('Operation completed');
```

## 🧪 Testing

The SDK is designed for easy testing with mockable services:

```tsx
import { 
  WalletService, 
  BrowserService, 
  StorageService 
} from '@lazorkit/wallet-mobile-adapter';

// Mock services for testing
const mockBrowserService: BrowserService = {
  openAuthBrowser: jest.fn(),
  openSignBrowser: jest.fn(),
  parseAuthRedirect: jest.fn(),
  parseBrowserResult: jest.fn(),
};

const mockStorageService: StorageService = {
  getWallet: jest.fn(),
  saveWallet: jest.fn(),
  removeWallet: jest.fn(),
  getConfig: jest.fn(),
  saveConfig: jest.fn(),
};
```

## 🔄 Migration from v1.x

If you're upgrading from an older version:

**Breaking Change**: `LazorKitWalletProvider` has been removed. Use `LazorKitProvider` instead:

```tsx
// Old (no longer available)
import { LazorKitWalletProvider } from '@lazorkit/wallet-mobile-adapter';

// New
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';
```

See our [Migration Guide](./REFACTOR_MIGRATION.md) for detailed instructions.

## 📖 API Reference

### useLazorWallet Hook

```tsx
interface LazorWalletHook {
  // State
  smartWalletPubkey: PublicKey | null;
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  isSigning: boolean;
  error: Error | null;
  connection: Connection;
  
  // Actions
  connect(options: ConnectOptions): Promise<WalletInfo>;
  disconnect(options?: DisconnectOptions): Promise<void>;
  signMessage(
    transaction: TransactionInstruction,
    options: SignOptions
  ): Promise<string>;
}
```

### Type Definitions

```tsx
interface WalletInfo {
  credentialId: string;
  passkeyPubkey: number[];
  expo: string;
  platform: string;
  smartWallet: string;
  smartWalletAuthenticator: string;
}

interface ConnectOptions {
  redirectUrl: string;
  onSuccess?: (wallet: WalletInfo) => void;
  onFail?: (error: Error) => void;
}

interface SignOptions {
  redirectUrl: string;
  onSuccess?: (signature: string) => void;
  onFail?: (error: Error) => void;
}
```

## 🔗 Advanced Usage

### Custom Service Implementations

You can extend or replace services for custom behavior:

```tsx
import { LazorWalletService, ExpoBrowserService } from '@lazorkit/wallet-mobile-adapter';

class CustomBrowserService extends ExpoBrowserService {
  async openAuthBrowser(url: string, redirectUrl: string): Promise<string> {
    // Custom browser implementation
    return super.openAuthBrowser(url, redirectUrl);
  }
}
```

### Direct Paymaster Access

```tsx
import { getFeePayer, signAndSendTransaction } from '@lazorkit/wallet-mobile-adapter';

// Get fee payer for custom transactions
const feePayer = await getFeePayer('https://your-paymaster.com');

// Send transactions directly
const signature = await signAndSendTransaction(
  base64Transaction,
  'https://your-paymaster.com'
);
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 📞 Support

- 📧 Email: support@lazorkit.com
- 💬 Discord: [LazorKit Community](https://discord.gg/lazorkit)
- 📖 Docs: [docs.lazorkit.com](https://docs.lazorkit.com)
- 🐛 Issues: [GitHub Issues](https://github.com/lazorkit/wallet-mobile-adapter/issues)

## 🙏 Acknowledgments

Built with ❤️ by the LazorKit team. Special thanks to the Solana and React Native communities for their amazing tools and libraries.
