> [!CAUTION]
> **This repository is superseded and no longer maintained.**
> `@lazorkit/wallet-mobile-adapter` is now developed in
> [lazor-kit/lazor-kit](https://github.com/lazor-kit/lazor-kit/tree/main/packages/react-native)
> (`packages/react-native`). npm versions **2.0.0 and later** are published
> from there.
>
> **Do not use the versions built from this repository.** Versions 1.3.38 to
> 1.5.1 target the program `Gsuz7YcA5sbMGVRXT3xSYhJBessW4xFC4xYsihNCqMFh`, an
> Anchor program that was deployed to mainnet for testing from November 2025.
> It was not audited, and it was closed on mainnet on 2026-01-06. Wallets
> created on it can no longer be operated. Earlier 1.x versions target earlier
> development programs. The 2.0.0-beta pre-releases were superseded by 2.0.0.
>
> Install the current release instead:
> `npm install @lazorkit/wallet-mobile-adapter@latest`.

# LazorKit React Native SDK

LazorKit allows you to build **Passkey-native** mobile applications.

It replaces complex seed phrases with the standard biometrics users already know: **FaceID** or **TouchID**.

## Features
- **Seedless**: Onboard users instantly with Passkeys
- **Gasless**: Sponsored transactions via Paymaster
- **Native**: Built for React Native & Expo
- **Secure**: Hardware-bound credentials

## Installation

```bash
npm install @lazorkit/wallet-mobile-adapter
```

## Usage

```tsx
import { LazorKitProvider, useWallet } from '@lazorkit/wallet-mobile-adapter';
import { View, Button, Text } from 'react-native';

// 1. Wrap App
export default function App() {
  return (
    <LazorKitProvider
      rpcUrl="https://api.devnet.solana.com"
      portalUrl="https://portal.lazor.sh"
      configPaymaster={{ paymasterUrl: "https://lazorkit-paymaster.onrender.com" }}
    >
      <WalletScreen />
    </LazorKitProvider>
  );
}

// 2. Use Hook
function WalletScreen() {
  const { connect, signMessage, isConnected } = useWallet();

  const handleSign = async () => {
    if (!isConnected) {
      await connect({ redirectUrl: 'myapp://home' });
      return;
    }

    const sig = await signMessage("Hello", { 
      redirectUrl: 'myapp://callback' 
    });
    console.log("Signed:", sig);
  };

  return <Button title="Action" onPress={handleSign} />;
}
```

## API Reference

### `useWallet()`

#### `connect(options)`

Connects to the wallet.

**Parameters**

| Param | Type | Description |
|---|---|---|
| `options.redirectUrl` | `string` | Deep link URL |

#### `disconnect()`

Disconnects the wallet.

#### `signMessage(message, options)`

Signs a message string.

**Parameters**

| Param | Type | Description |
|---|---|---|
| `message` | `string` | Content to sign |
| `options.redirectUrl` | `string` | Deep link URL |

**Returns**
`Promise<string>` - Signature

#### `signAndSendTransaction(payload, options)`

Signs and sends transaction.

**Parameters**

| Param | Type | Description |
|---|---|---|
| `payload.instructions` | `TransactionInstruction[]` | Instructions |
| `payload.transactionOptions` | `object` | Config options |
| `transactionOptions.feeToken` | `string` | Token address for gas fees (e.g. USDC). |
| `transactionOptions.computeUnitLimit` | `number` | Max compute units. |
| `transactionOptions.addressLookupTableAccounts` | `AddressLookupTableAccount[]` | Lookup tables for v0 txs. |
| `transactionOptions.clusterSimulation` | `'devnet' \| 'mainnet'` | Network for simulation. |

| `options.redirectUrl` | `string` | Deep link URL |

**Returns**
`Promise<string>` - Signature
