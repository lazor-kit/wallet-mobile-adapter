# LazorKit Wallet SDK v2.x Migration Guide

## Overview

The LazorKit Wallet SDK has been completely refactored to provide better architecture, improved error handling, and enhanced developer experience. **This is a major version update with breaking changes.** This guide helps you migrate from v1.x to v2.x.

## Key Improvements

### 1. **Clean Architecture**
- **Service Layer**: Business logic separated into dedicated services
- **Dependency Injection**: Services are injected via React Context
- **Interface Segregation**: Clear interfaces for each service

### 2. **Better Error Handling**
- **Custom Error Types**: Specific error types for different scenarios
- **Error Factory Functions**: Consistent error creation
- **Error Boundaries**: Better error propagation and handling

### 3. **Improved Type Safety**
- **Readonly Types**: Immutable data structures
- **Strict Interfaces**: Clear contracts between components
- **Better Generics**: More precise typing

### 4. **Enhanced Testability**
- **Dependency Injection**: Easy to mock services for testing
- **Pure Functions**: Predictable behavior
- **Separation of Concerns**: Isolated business logic

## Migration Steps

### Step 1: Update Provider Usage

**Old (No longer available in v2.x):**
```tsx
import { LazorKitWalletProvider } from '@lazorkit/wallet-mobile-adapter';

<LazorKitWalletProvider
  rpcUrl="https://api.devnet.solana.com"
  ipfsUrl="https://portal.lazor.sh"
  paymasterUrl="https://lazorkit-paymaster.onrender.com"
>
  {children}
</LazorKitWalletProvider>
```

**New (Required):**
```tsx
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';

<LazorKitProvider
  rpcUrl="https://api.devnet.solana.com"
  ipfsUrl="https://portal.lazor.sh"
  paymasterUrl="https://lazorkit-paymaster.onrender.com"
  commitment="confirmed"
>
  {children}
</LazorKitProvider>
```

### Step 2: Update Hook Usage

**Old:**
```tsx
import { useLazorWallet } from '@lazorkit/wallet-mobile-adapter';

const {
  smartWalletPubkey,
  isConnected,
  isLoading,
  isConnecting,
  isSigning,
  error,
  connection,
  connect,
  disconnect,
  signMessage,
} = useLazorWallet();
```

**New (Same API, Better Implementation):**
```tsx
import { useLazorWallet } from '@lazorkit/wallet-mobile-adapter';

const {
  smartWalletPubkey,
  isConnected,
  isLoading,
  isConnecting,
  isSigning,
  error,
  connection,
  connect,
  disconnect,
  signMessage,
} = useLazorWallet();
```

### Step 3: Update Error Handling

**Old:**
```tsx
try {
  await connect(options);
} catch (error) {
  console.error('Connection failed:', error);
}
```

**New:**
```tsx
import { WalletConnectionError, handleError } from '@lazorkit/wallet-mobile-adapter';

try {
  await connect(options);
} catch (error) {
  const handledError = handleError(error);
  
  if (handledError instanceof WalletConnectionError) {
    // Handle connection-specific errors
    console.error('Connection failed:', handledError.message);
  } else {
    // Handle other errors
    console.error('Unexpected error:', handledError.message);
  }
}
```

### Step 4: Update Type Imports

**Old:**
```tsx
import type {
  ConnectOptions,
  WalletInfo,
  SignOptions,
} from '@lazorkit/wallet-mobile-adapter';
```

**New (Enhanced Types):**
```tsx
import type {
  ConnectOptions,
  WalletInfo,
  SignOptions,
  WalletState,
  LazorKitConfig,
} from '@lazorkit/wallet-mobile-adapter';
```

## Advanced Usage

### Custom Service Implementations

You can now create custom implementations of services:

```tsx
import {
  WalletService,
  BrowserService,
  StorageService,
  LazorWalletService,
} from '@lazorkit/wallet-mobile-adapter';

// Custom browser service for web
class WebBrowserService implements BrowserService {
  // Implementation...
}

// Custom storage service
class CustomStorageService implements StorageService {
  // Implementation...
}

// Create custom wallet service
const customWalletService = new LazorWalletService(
  connection,
  new WebBrowserService(),
  new CustomStorageService(),
  config
);
```

### Enhanced Logging

```tsx
import { logger, LogLevel } from '@lazorkit/wallet-mobile-adapter';

// Configure logging
logger.configure({
  level: LogLevel.DEBUG,
  enableTimestamp: true,
});

// Create scoped logger
const serviceLogger = logger.scope('WalletService');
serviceLogger.info('Operation started');
```

## Breaking Changes

### 1. Provider Changes
- `LazorKitWalletProvider` has been **removed** in v2.x
- **Must** use `LazorKitProvider` instead

### 2. Internal Store Changes
- The internal Zustand store is no longer exposed
- Use the hook API instead of direct store access

### 3. Error Types
- Generic `Error` objects are now wrapped in `LazorKitError` types
- More specific error types available for better error handling

### 4. Service Architecture
- Internal implementation completely changed
- Public API remains the same for seamless migration

## Backward Compatibility

The refactor maintains backward compatibility for:
- ✅ Hook API (`useLazorWallet`)
- ✅ Core functionality (connect, disconnect, sign)
- ✅ Type definitions (with additions)
- ❌ Provider component (requires migration to `LazorKitProvider`)

## Benefits After Migration

1. **Better Error Debugging**: Specific error types and enhanced logging
2. **Improved Performance**: Optimized service architecture
3. **Enhanced Testing**: Mockable services and better separation
4. **Future-Proof**: Extensible architecture for new features
5. **Type Safety**: Enhanced TypeScript support

## Need Help?

If you encounter issues during migration:

1. Check the console for detailed error messages
2. Enable debug logging: `logger.configure({ level: LogLevel.DEBUG })`
3. Review the service interfaces for custom implementations
4. Use the legacy provider temporarily if needed

The refactored SDK provides the same great developer experience with improved reliability and maintainability! 