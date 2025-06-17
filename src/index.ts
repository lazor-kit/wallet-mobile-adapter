// Core Hook and Provider
export { useLazorWallet } from './hooks/useLazorWallet';
export { LazorKitProvider } from './context/LazorKitContext';

// Core Types
export type {
  ConnectOptions,
  DisconnectOptions,
  LazorWalletHook,
  SignOptions,
  WalletInfo,
  WalletConfig,
  BrowserResult,
  WalletState,
  LazorKitConfig,
} from './core/types';

// Service Interfaces (for advanced usage)
export type { WalletService, BrowserService, StorageService } from './core/types';

// Error Types
export {
  LazorKitError,
  WalletConnectionError,
  WalletNotConnectedError,
  SigningError,
  BrowserError,
  ValidationError,
  createError,
  handleError,
} from './core/errors';

// Service Implementations (for custom integrations)
export { LazorWalletService } from './services/wallet.service';
export { ExpoBrowserService } from './services/browser.service';
export { AsyncStorageService } from './services/storage.service';

// Utilities
export { logger, LogLevel } from './utils/logger';
export { getFeePayer, signAndSendTransaction } from './utils/paymaster';

// Constants
export { DEFAULT_COMMITMENT, DEFAULT_RPC_ENDPOINT, DEFAULTS } from './constants';
