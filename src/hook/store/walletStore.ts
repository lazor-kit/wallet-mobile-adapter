import * as anchor from '@coral-xyz/anchor';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_COMMITMENT, DEFAULT_RPC_ENDPOINT, DEFAULTS, STORAGE_KEYS } from '../../constants';
import { logger } from '../utils/logger';
import { connectAction, disconnectAction, signMessageAction } from './actions';
import { WalletState, WalletConfig, WalletInfo, ConnectOptions } from '../types';

// Dynamic import of AsyncStorage to handle cases where it's not available
let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  logger.warn('AsyncStorage not available - persistence will be disabled', error);
}

// The secure storage implementation
const storage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      // Check if AsyncStorage is available and has the required methods
      if (!AsyncStorage || typeof AsyncStorage.getItem !== 'function') {
        logger.warn('AsyncStorage not available - persistence disabled');
        return null;
      }
      return await AsyncStorage.getItem(name);
    } catch (error) {
      logger.error('Error reading from AsyncStorage', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      // Check if AsyncStorage is available and has the required methods
      if (!AsyncStorage || typeof AsyncStorage.setItem !== 'function') {
        logger.warn('AsyncStorage not available - persistence disabled');
        return;
      }
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      logger.error('Error writing to AsyncStorage', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      // Check if AsyncStorage is available and has the required methods
      if (!AsyncStorage || typeof AsyncStorage.removeItem !== 'function') {
        logger.warn('AsyncStorage not available - persistence disabled');
        return;
      }
      await AsyncStorage.removeItem(name);
    } catch (error) {
      logger.error('Error removing from AsyncStorage', error);
    }
  },
};

// The wallet store hook
export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => {
      const setConfig = (config: WalletConfig) => set({ config });
      const setWallet = (wallet: WalletInfo | null) => set({ wallet });
      const setLoading = (isLoading: boolean) => set({ isLoading });
      const setConnecting = (isConnecting: boolean) => set({ isConnecting });
      const setSigning = (isSigning: boolean) => set({ isSigning });
      const setConnection = (connection: anchor.web3.Connection) => set({ connection });
      const setError = (error: Error | null) => set({ error });
      const clearError = () => set({ error: null });

      return {
        // Initial state
        config: {
          ipfsUrl: DEFAULTS.IPFS_URL,
          paymasterUrl: DEFAULTS.PAYMASTER_URL,
        },
        wallet: null,
        isLoading: false,
        isConnecting: false,
        isSigning: false,
        connection: new anchor.web3.Connection(DEFAULT_RPC_ENDPOINT, DEFAULT_COMMITMENT),
        error: null,

        // Basic actions
        setConfig,
        setWallet,
        setLoading,
        setConnecting,
        setSigning,
        setConnection,
        setError,
        clearError,

        // Complex actions
        connect: (options: ConnectOptions) => connectAction(get, set, options),
        disconnect: () => disconnectAction(set),
        signMessage: (txnIns, options) => signMessageAction(get, set, txnIns, options),
      };
    },
    {
      name: STORAGE_KEYS.WALLET,
      storage: createJSONStorage(() => storage),
      partialize: (state: WalletState) => ({
        wallet: state.wallet,
        config: state.config,
      }),
    }
  )
);
