/**
 * LazorKit Wallet Mobile Adapter - Zustand Wallet Store (react layer)
 *
 * This file mirrors the previous src/wallet-store.ts but lives under react/
 * and imports from the new core & config modules.
 */

import * as anchor from '@coral-xyz/anchor';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { WalletStateClient, WalletInfo, WalletConfig, ConnectOptions, SignOptions } from '../types';
import { DEFAULT_COMMITMENT, DEFAULTS, STORAGE_KEYS } from '../config';
import { logger } from '../core/logger';
import { connectAction, disconnectAction, signAndExecuteTransaction } from '../actions';
import { SmartWalletActionArgs } from '../contract';

// AsyncStorage dynamic import remains unchanged
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let AsyncStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  // Warning log removed
}

const storage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (!AsyncStorage || typeof AsyncStorage.getItem !== 'function') {
        // Warning log removed
        return null;
      }
      const result = await AsyncStorage.getItem(name);
      // Debug log removed
      return result;
    } catch (error) {
      logger.error('Error reading from AsyncStorage:', error, { key: name });
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (!AsyncStorage || typeof AsyncStorage.setItem !== 'function') {
        // Warning log removed
        return;
      }
      await AsyncStorage.setItem(name, value);
      // Debug log removed
    } catch (error) {
      logger.error('Error writing to AsyncStorage:', error, {
        key: name,
        valueLength: value.length,
      });
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (!AsyncStorage || typeof AsyncStorage.removeItem !== 'function') {
        // Warning log removed
        return;
      }
      await AsyncStorage.removeItem(name);
      // Debug log removed
    } catch (error) {
      logger.error('Error removing from AsyncStorage:', error, { key: name });
    }
  },
};

export const useWalletStore = create<WalletStateClient>()(
  persist(
    (set, get) => ({
      wallet: null,
      config: {
        ipfsUrl: DEFAULTS.IPFS_URL,
        configPaymaster: {
          paymasterUrl: DEFAULTS.PAYMASTER_URL,
        },
        rpcUrl: DEFAULTS.RPC_ENDPOINT,
      },
      connection: new anchor.web3.Connection(DEFAULTS.RPC_ENDPOINT!, DEFAULT_COMMITMENT),
      isLoading: false,
      isConnecting: false,
      isSigning: false,
      error: null,

      setConfig: (config: WalletConfig) => {
        try {
          // Info log removed
          const connection = new anchor.web3.Connection(
            config.rpcUrl || DEFAULTS.RPC_ENDPOINT!,
            DEFAULT_COMMITMENT
          );
          set({ config, connection });
          // Info log removed
        } catch (error) {
          logger.error('Failed to update wallet configuration:', error, { config });
          throw new Error(`Failed to update configuration: ${error}`);
        }
      },

      setWallet: (wallet: WalletInfo | null) => {
        try {
          set({ wallet });
          // Debug log removed
        } catch (error) {
          logger.error('Failed to set wallet:', error, { wallet });
          throw error;
        }
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),
      setConnecting: (isConnecting: boolean) => set({ isConnecting }),
      setSigning: (isSigning: boolean) => set({ isSigning }),
      setConnection: (connection: anchor.web3.Connection) => {
        try {
          set({ connection });
          // Debug log removed
        } catch (error) {
          logger.error('Failed to set connection:', error, { endpoint: connection?.rpcEndpoint });
          throw error;
        }
      },
      setError: (error: Error | null) => {
        set({ error });
        if (error) {
          logger.error('Error state set:', error);
        } else {
          // Debug log removed
        }
      },
      clearError: () => {
        set({ error: null });
        // Debug log removed
      },

      connect: (options: ConnectOptions) => connectAction(get, set, options),
      disconnect: () => disconnectAction(set),
      signAndExecuteTransaction: (instructions: anchor.web3.TransactionInstruction[], options: SignOptions) =>
        signAndExecuteTransaction(get, set, instructions, options),
    }),
    {
      name: STORAGE_KEYS.WALLET,
      storage: createJSONStorage(() => storage),
      partialize: (state: WalletStateClient) => ({
        wallet: state.wallet,
        config: state.config,
      }),
    }
  )
);
