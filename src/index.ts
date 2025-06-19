/**
 * LazorKit Wallet Mobile Adapter - Main Entry Point
 *
 * This is the main entry point for the LazorKit Wallet Mobile Adapter SDK.
 * It exports all public APIs including React components, hooks, types,
 * services, and utility functions for wallet integration.
 *
 * The SDK provides:
 * - WebAuthn-based wallet authentication
 * - Smart wallet creation and management on Solana
 * - Transaction signing through paymaster fee sponsorship
 * - Persistent wallet storage with AsyncStorage
 * - Clean React integration with hooks and providers
 */

// ============================================================================
// React Components and Hooks
// ============================================================================

/**
 * Main React exports for wallet integration
 * These are the primary APIs that most users will interact with
 */
export { LazorKitProvider, LazorKitWalletProvider } from './wallet-provider';

/**
 * React hook for wallet integration
 */
export { useLazorWallet } from './hook';

/**
 * Direct Zustand store access for advanced usage
 * Most users should use the React hook instead
 */
export { useWalletStore } from './wallet-store';

// ============================================================================
// TypeScript Type Definitions
// ============================================================================

/**
 * Core interface exports for TypeScript users
 * These types define the shape of wallet data and configuration
 */
export type {
  WalletInfo,
  WalletConfig,
  WalletState,
  ConnectOptions,
  DisconnectOptions,
  SignOptions,
  BrowserResult,
  LazorWalletHook,
  WalletActions,
  LazorKitWalletProviderProps,
} from './types';

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Error class exports for proper error handling
 * These can be used with instanceof checks for specific error handling
 */
export { LazorKitError, WalletConnectionError, SigningError } from './types';

// ============================================================================
// Service Classes (Advanced Usage)
// ============================================================================

/**
 * Store actions for advanced usage
 */
export { connectAction, disconnectAction, signMessageAction } from './actions';

// ============================================================================
// Configuration Constants
// ============================================================================

/**
 * Configuration and constant exports
 * These include default values, API endpoints, and storage keys
 */
export { DEFAULT_COMMITMENT, STORAGE_KEYS, API_ENDPOINTS, DEFAULTS } from './config';

// ============================================================================
// Utility Functions (Optional)
// ============================================================================

/**
 * Utility function exports for wallet operations and debugging
 */
export {
  logger,
  handleAuthRedirect,
  openBrowser,
  openSignBrowser,
  handleBrowserResult,
  getFeePayer,
  signAndSendTxn,
  createWalletActions,
} from './utils';

// ============================================================================
// Anchor Program Interfaces (Optional)
// ============================================================================

/**
 * Anchor program interface exports for direct program interaction
 * These are optional and only needed for advanced on-chain operations
 */
export * from './anchor/interface/lazorkit';
export * from './anchor/types';
