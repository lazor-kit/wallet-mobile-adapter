/**
 * LazorKit Wallet Mobile Adapter - Zustand Wallet Store
 *
 * This file contains the main Zustand store for wallet state management.
 * It orchestrates all wallet operations including authentication, smart wallet
 * creation, transaction signing, and persistent storage through AsyncStorage.
 *
 * The store follows a clean separation of concerns:
 * - State management via Zustand
 * - Persistence via AsyncStorage middleware
 * - Business logic via dedicated action functions
 */

import * as anchor from '@coral-xyz/anchor';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  WalletState,
  WalletInfo,
  WalletConfig,
  ConnectOptions,
  SignOptions,
} from './types';
import { DEFAULT_COMMITMENT, DEFAULTS, STORAGE_KEYS } from './config';
import { logger } from './utils';
import { connectAction, disconnectAction, signMessageAction } from './actions';

// ============================================================================
// AsyncStorage Setup
// ============================================================================

/**
 * Dynamic AsyncStorage loading and initialization
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AsyncStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  logger.warn('AsyncStorage not available - persistence will be disabled', error);
}

/**
 * Storage implementation for Zustand persistence middleware
 */
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (!AsyncStorage || typeof AsyncStorage.getItem !== 'function') {
        logger.warn('AsyncStorage not available - persistence disabled');
        return null;
      }
      const result = await AsyncStorage.getItem(name);
      logger.log('Retrieved from storage', { key: name, hasValue: !!result });
      return result;
    } catch (error) {
      logger.error('Error reading from AsyncStorage:', error, { key: name });
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (!AsyncStorage || typeof AsyncStorage.setItem !== 'function') {
        logger.warn('AsyncStorage not available - persistence disabled');
        return;
      }
      await AsyncStorage.setItem(name, value);
      logger.log('Saved to storage', { key: name });
    } catch (error) {
      logger.error('Error writing to AsyncStorage:', error, { key: name, valueLength: value.length });
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (!AsyncStorage || typeof AsyncStorage.removeItem !== 'function') {
        logger.warn('AsyncStorage not available - persistence disabled');
        return;
      }
      await AsyncStorage.removeItem(name);
      logger.log('Removed from storage', { key: name });
    } catch (error) {
      logger.error('Error removing from AsyncStorage:', error, { key: name });
    }
  },
};

// ============================================================================
// Zustand Store Definition
// ============================================================================

/**
 * Main Zustand store for LazorKit wallet state management
 *
 * This store provides:
 * - Wallet state management with persistence
 * - Configuration management
 * - Solana connection management
 * - Action methods for wallet operations
 * - State setters for UI updates
 */
export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // Initial State
      // ========================================================================

      wallet: null,
      config: {
        ipfsUrl: DEFAULTS.IPFS_URL,
        paymasterUrl: DEFAULTS.PAYMASTER_URL,
        rpcUrl: DEFAULTS.RPC_ENDPOINT,
      },
      connection: new anchor.web3.Connection(DEFAULTS.RPC_ENDPOINT!, DEFAULT_COMMITMENT),
      isLoading: false,
      isConnecting: false,
      isSigning: false,
      error: null,

      // ========================================================================
      // State Management Methods
      // ========================================================================

      /**
       * Updates wallet configuration and creates new RPC connection
       * @param config - New wallet configuration
       */
      setConfig: (config: WalletConfig) => {
        try {
          logger.info('Updating wallet configuration', { config });
          const connection = new anchor.web3.Connection(
            config.rpcUrl || DEFAULTS.RPC_ENDPOINT!,
            DEFAULT_COMMITMENT
          );
          set({ config, connection });
          logger.info('Wallet configuration updated successfully');
        } catch (error) {
          logger.error('Failed to update wallet configuration:', error, { config });
          throw new Error(`Failed to update configuration: ${error}`);
        }
      },

      /**
       * Updates wallet information in state
       * @param wallet - New wallet information or null to clear
       */
      setWallet: (wallet: WalletInfo | null) => {
        try {
          set({ wallet });
          logger.log('Wallet state updated', { hasWallet: !!wallet, smartWallet: wallet?.smartWallet });
        } catch (error) {
          logger.error('Failed to set wallet:', error, { wallet });
          throw error;
        }
      },

      /**
       * Updates loading state for UI feedback
       * @param isLoading - New loading state
       */
      setLoading: (isLoading: boolean) => set({ isLoading }),

      /**
       * Updates connecting state for UI feedback
       * @param isConnecting - New connecting state
       */
      setConnecting: (isConnecting: boolean) => set({ isConnecting }),

      /**
       * Updates signing state for UI feedback
       * @param isSigning - New signing state
       */
      setSigning: (isSigning: boolean) => set({ isSigning }),

      /**
       * Updates Solana RPC connection
       * @param connection - New RPC connection
       */
      setConnection: (connection: anchor.web3.Connection) => {
        try {
          set({ connection });
          logger.log('RPC connection updated', { endpoint: connection.rpcEndpoint });
        } catch (error) {
          logger.error('Failed to set connection:', error, { endpoint: connection?.rpcEndpoint });
          throw error;
        }
      },

      /**
       * Updates error state
       * @param error - Error object or null to clear
       */
      setError: (error: Error | null) => {
        set({ error });
        if (error) {
          logger.error('Error state set:', error);
        } else {
          logger.log('Error state cleared');
        }
      },

      /**
       * Clears any stored error
       */
      clearError: () => {
        set({ error: null });
        logger.log('Error state cleared');
      },

      // ========================================================================
      // Wallet Action Methods
      // ========================================================================

      /**
       * Connects wallet through WebAuthn authentication
       * @param options - Connection options with callbacks and redirect URL
       */
      connect: (options: ConnectOptions) => connectAction(get, set, options),

      /**
       * Disconnects wallet and clears stored data
       */
      disconnect: () => disconnectAction(set),

      /**
       * Signs and executes transaction through smart wallet
       * @param txnIns - Transaction instruction to execute
       * @param options - Signing options with callbacks and redirect URL
       */
      signMessage: (txnIns: anchor.web3.TransactionInstruction, options: SignOptions) =>
        signMessageAction(get, set, txnIns, options),
    }),
    {
      // ========================================================================
      // Persistence Configuration
      // ========================================================================

      name: STORAGE_KEYS.WALLET,
      storage: createJSONStorage(() => storage),

      /**
       * Partialize function - determines what state to persist
       * Only persists wallet and config data, not transient UI state
       */
      partialize: (state: WalletState) => ({
        wallet: state.wallet,
        config: state.config,
      }),
    }
  )
);
