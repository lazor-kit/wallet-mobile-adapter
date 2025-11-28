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

export { LazorKitProvider } from './react/provider';
export { useLazorWallet } from './react/hook';
export { useWalletStore } from './react/store';
export * from './types';
export { logger } from './core/logger';
export * from './config';
export * from './contract';
