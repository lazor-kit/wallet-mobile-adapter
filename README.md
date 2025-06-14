# 🚀 LazorKit - Mobile Wallet Adapter

<div align="center">
  <img src="https://img.shields.io/badge/platform-React%20Native%20%7C%20iOS%20Only-blue.svg" alt="React Native | iOS Only" />
  <img src="https://img.shields.io/badge/network-Solana%20Devnet%20Only-purple.svg" alt="Solana Devnet Only" />
  <img src="https://img.shields.io/badge/auth-Passkey-green.svg" alt="Passkey Auth" />
  <img src="https://img.shields.io/badge/license-ISC-yellow.svg" alt="ISC License" />
</div>

<br />

> **Seamless Web3 authentication for React Native.** A React Native wallet adapter that leverages passkey authentication, smart wallets, and gasless transactions for the Solana Devnet ecosystem. Currently optimized for iOS with Android support coming soon.

## ⚠️ Current Status

> **Important**: This package is currently in beta and only supports:
> - iOS devices (Android support coming soon)
> - Solana Devnet (Mainnet support coming soon)

## ✨ Features

🔐 **Passkey Authentication** - Secure, passwordless wallet creation using iOS biometrics  
💸 **Gasless Transactions** - Built-in paymaster support for frictionless UX  
📱 **React Native** - Built with React Native, currently optimized for iOS  
⚡ **Smart Wallets** - Automatic smart wallet creation and management  
🔗 **Solana Devnet** - Full Anchor framework support with transaction signing  
💾 **Persistent Storage** - Secure wallet state persistence with AsyncStorage  
🛡️ **Type Safety** - Full TypeScript support with comprehensive type definitions  

---

## 📦 Installation

```bash
# Using npm
npm install @lazorkit/wallet-mobile-adapter

# Using yarn
yarn add @lazorkit/wallet-mobile-adapter
```

---

## 🚀 Quick Start

### 1. Setup the Provider

Wrap your app with `LazorKitWalletProvider`:

```tsx
import React from 'react';
import { LazorKitWalletProvider } from '@lazorkit/wallet-mobile-adapter';
const APP_REDIRECT_URL = "your-app-schema://"

export default function App() {
  return (
    <LazorKitWalletProvider
      rpcUrl="https://api.devnet.solana.com"
      ipfsUrl="https://portal.lazor.sh"  
      paymasterUrl="https://lazorkit-paymaster.onrender.com"
    >
      <YourApp />
    </LazorKitWalletProvider>
  );
}
```

### 2. Use the Wallet Hook

```tsx
import React from 'react';
import { View, Button, Text, Alert } from 'react-native';
import { useLazorWallet } from '@lazorkit/wallet-mobile-adapter';
import * as anchor from '@coral-xyz/anchor';

export function WalletDemo() {
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
        redirectUrl: APP_REDIRECT_URL // Your app's redirect URL
        onSuccess: (wallet) => {
          Alert.alert('Success', `Connected to ${wallet.smartWallet.slice(0, 8)}...`);
        },
        onFail: (error) => {
          Alert.alert('Error', error.message);
        },
      });
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleSign = async () => {
    if (!smartWalletPubkey) return;

    // Create a memo instruction
    const instruction = new anchor.web3.TransactionInstruction({
      keys: [],
      programId: new anchor.web3.PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'),
      data: Buffer.from('Hello from LazorKit! 🚀', 'utf-8'),
    });

    try {
      const signature = await signMessage(instruction, {
        redirectUrl: 'exp://127.0.0.1:8081',
        onSuccess: (sig) => {
          Alert.alert('Success', `Transaction signed: ${sig.slice(0, 8)}...`);
        },
        onFail: (error) => {
          Alert.alert('Error', error.message);
        },
      });
      
      console.log('Transaction signature:', signature);
    } catch (error) {
      console.error('Signing failed:', error);
    }
  };

  return (
    <View style={{ padding: 20, gap: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
        LazorKit Wallet Demo
      </Text>
      
      {!isConnected ? (
        <Button
          title={isConnecting ? 'Connecting...' : 'Connect Wallet'}
          onPress={handleConnect}
          disabled={isConnecting}
        />
      ) : (
        <View style={{ gap: 10 }}>
          <Text>
            Wallet: {smartWalletPubkey?.toBase58().slice(0, 8)}...
          </Text>
          <Button
            title={isSigning ? 'Signing...' : 'Sign Message'}
            onPress={handleSign}
            disabled={isSigning}
          />
          <Button
            title="Disconnect"
            onPress={() => disconnect()}
            color="#ff6b6b"
          />
        </View>
      )}
      
      {error && (
        <Text style={{ color: 'red' }}>
          Error: {error.message}
        </Text>
      )}
    </View>
  );
}
```

---

## 📚 API Reference

### `useLazorWallet()`

The main hook providing wallet functionality:

```tsx
const {
  // State
  smartWalletPubkey,    // PublicKey | null - Smart wallet public key
  isConnected,          // boolean - Connection status  
  isLoading,           // boolean - General loading state
  isConnecting,        // boolean - Connection in progress
  isSigning,          // boolean - Transaction signing in progress
  error,              // Error | null - Last error that occurred
  connection,         // Connection - Solana RPC connection

  // Actions  
  connect,            // (options: ConnectOptions) => Promise<WalletInfo>
  disconnect,         // (options?: DisconnectOptions) => Promise<void>
  signMessage,        // (instruction: TransactionInstruction, options: SignOptions) => Promise<string>
} = useLazorWallet();
```

### `LazorKitWalletProvider`

Provider component props:

```tsx
type ProviderProps = {
  rpcUrl?: string;        // Solana RPC endpoint (default: devnet)
  ipfsUrl?: string;       // LazorKit portal URL  
  paymasterUrl?: string;  // Paymaster service URL
  children: React.ReactNode;
};
```

### Type Definitions

```typescript
// Wallet information returned after connection
type WalletInfo = {
  credentialId: string;           // Passkey credential ID
  passkeyPubkey: number[];       // Passkey public key bytes
  expo: string;                  // Expo configuration
  platform: string;             // Device platform
  smartWallet: string;           // Smart wallet address (base58)
  smartWalletAuthenticator: string; // Authenticator address (base58)
};

// Connection options
type ConnectOptions = {
  redirectUrl: string;                      // App redirect URL after auth
  onSuccess?: (wallet: WalletInfo) => void; // Success callback
  onFail?: (error: Error) => void;          // Error callback
};

// Signing options  
type SignOptions = {
  redirectUrl: string;                    // App redirect URL after signing
  onSuccess?: (signature: string) => void; // Success callback  
  onFail?: (error: Error) => void;        // Error callback
};

// Disconnect options
type DisconnectOptions = {
  onSuccess?: () => void;         // Success callback
  onFail?: (error: Error) => void; // Error callback  
};

// Wallet configuration
type WalletConfig = {
  ipfsUrl: string;      // LazorKit portal URL
  paymasterUrl: string; // Paymaster service URL
};
```

---

## 🔧 Configuration

### Environment Setup

```tsx
// Development (Devnet)
<LazorKitWalletProvider
  rpcUrl="https://api.devnet.solana.com"
  ipfsUrl="https://portal.lazor.sh"
  paymasterUrl="https://lazorkit-paymaster.onrender.com"
>

// Custom RPC
<LazorKitWalletProvider
  rpcUrl="https://your-custom-rpc.com"
  ipfsUrl="https://portal.lazor.sh"
  paymasterUrl="https://your-paymaster.com"
>
```

### Constants Available

```tsx
import { 
  DEFAULT_RPC_ENDPOINT,    // 'https://api.devnet.solana.com'
  DEFAULT_COMMITMENT,      // 'confirmed'
  DEFAULTS                 // Default URLs object
} from '@lazorkit/wallet-mobile-adapter';
```

---

## 💡 Advanced Usage

### Custom Transaction

```tsx
import { SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const sendSOL = async () => {
  if (!smartWalletPubkey) return;

  const instruction = SystemProgram.transfer({
    fromPubkey: smartWalletPubkey,
    toPubkey: new PublicKey('RECIPIENT_WALLET_ADDRESS'),
    lamports: 0.1 * LAMPORTS_PER_SOL,
  });

  try {
    const signature = await signMessage(instruction, {
      redirectUrl: 'exp://127.0.0.1:8081',
      onSuccess: (sig) => console.log('Transfer successful:', sig),
      onFail: (err) => console.error('Transfer failed:', err),
    });
    
    return signature;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};
```

### Error Handling

```tsx
const connectWithRetry = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await connect({
        redirectUrl: 'exp://127.0.0.1:8081',
        onSuccess: (wallet) => {
          console.log(`Connected on attempt ${attempt}:`, wallet.smartWallet);
        },
        onFail: (error) => {
          console.log(`Attempt ${attempt} failed:`, error.message);
          if (attempt === maxRetries) {
            throw error;
          }
        },
      });
      break; // Success, exit loop
    } catch (error) {
      if (attempt === maxRetries) {
        console.error('All connection attempts failed');
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

### Multiple Instructions

```tsx
const executeMultipleInstructions = async () => {
  if (!smartWalletPubkey) return;

  // Create multiple instructions
  const instructions = [
    // Memo instruction
    new anchor.web3.TransactionInstruction({
      keys: [],
      programId: new anchor.web3.PublicKey('Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo'),
      data: Buffer.from('Batch transaction', 'utf-8'),
    }),
    // Add more instructions as needed
  ];

  // Sign each instruction (or combine them in your smart contract)
  for (const instruction of instructions) {
    try {
      await signMessage(instruction, {
        redirectUrl: 'exp://127.0.0.1:8081',
        onSuccess: (sig) => console.log('Instruction signed:', sig),
        onFail: (err) => console.error('Instruction failed:', err),
      });
    } catch (error) {
      console.error('Batch execution failed:', error);
      break;
    }
  }
};
```

---

## 🔒 Security Considerations

- **Passkey Security**: Wallet creation relies on device biometric security
- **Redirect URLs**: Always use your app's registered redirect URL scheme  
- **Storage**: Wallet data is persisted securely using AsyncStorage
- **Network**: Currently supports Solana Devnet only
- **Validation**: Always validate transaction instructions before signing

---

## 🚨 Requirements & Limitations

### Requirements
- React Native 0.60+
- iOS 16+ (for passkey support)
- Expo SDK 48+ (for `expo-web-browser`)

### Current Limitations  
- **iOS Only** - Android support coming soon
- **Devnet Only** - Mainnet support coming soon
- **Single Instruction** - Multi-instruction transactions need custom implementation
- **iOS Optimized** - Currently only tested and optimized for iOS

---

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/lazorkit/wallet-mobile-adapter
cd wallet-mobile-adapter

# Install dependencies
yarn install

# Build the package
yarn build

# Run tests
yarn test
```

---

## 📝 Changelog

### v1.2.33
- Improved AsyncStorage error handling
- Enhanced type safety
- Better error messages and logging

### v1.2.x
- Added persistent wallet storage
- Improved connection stability
- Enhanced passkey authentication flow

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and development process.

---

## 🆘 Support

- 🐦 **Twitter**: [@lazorkit](https://twitter.com/lazorkit)
- 🐛 **Issues**: [GitHub Issues](https://github.com/lazor-kit/wallet-mobile-adapter/issues)

---

## 📄 License

ISC © [LazorKit](https://github.com/lazor-kit)

---

<div align="center">
  <p>Made with ❤️ by the LazorKit team</p>
  <p>
    <a href="https://lazorkit.xyz">🌐 Website</a> •
    <a href="https://twitter.com/lazorkit">🐦 Twitter</a>
  </p>
</div>
