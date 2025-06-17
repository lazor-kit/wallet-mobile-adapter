import { useState, useCallback, useRef, useContext } from 'react';
import * as anchor from '@coral-xyz/anchor';
import {
  LazorWalletHook,
  ConnectOptions,
  DisconnectOptions,
  SignOptions,
  WalletInfo,
  WalletState,
} from '../core/types';
import { handleError } from '../core/errors';
import { logger } from '../utils/logger';
import { LazorKitContext } from '../context/LazorKitContext';

/**
 * Enhanced LazorKit wallet hook with improved architecture
 */
export function useLazorWallet(): LazorWalletHook {
  const context = useContext(LazorKitContext);
  if (!context) {
    throw new Error('useLazorWallet must be used within a LazorKitProvider');
  }

  const { walletService, connection } = context;

  // Local state
  const [state, setState] = useState<WalletState>({
    wallet: walletService.getWalletInfo(),
    isLoading: false,
    isConnecting: false,
    isSigning: false,
    error: null,
  });

  // Prevent concurrent operations
  const operationRef = useRef<{ connect?: boolean; sign?: boolean }>({});

  const updateState = useCallback((updates: Partial<WalletState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleConnect = useCallback(
    async (options: ConnectOptions): Promise<WalletInfo> => {
      if (operationRef.current.connect) {
        throw new Error('Connection already in progress');
      }

      operationRef.current.connect = true;
      updateState({ isConnecting: true, error: null });

      try {
        const wallet = await walletService.connect(options);
        updateState({ wallet, isConnecting: false });

        // Call success callback if provided
        options.onSuccess?.(wallet);

        logger.info('Wallet connected successfully');
        return wallet;
      } catch (error) {
        const handledError = handleError(error);
        updateState({ isConnecting: false, error: handledError });

        // Call error callback if provided
        options.onFail?.(handledError);

        logger.error('Failed to connect wallet', handledError);
        throw handledError;
      } finally {
        operationRef.current.connect = false;
      }
    },
    [walletService, updateState]
  );

  const handleDisconnect = useCallback(
    async (options?: DisconnectOptions): Promise<void> => {
      updateState({ isLoading: true, error: null });

      try {
        await walletService.disconnect();
        updateState({ wallet: null, isLoading: false });

        // Call success callback if provided
        options?.onSuccess?.();

        logger.info('Wallet disconnected successfully');
      } catch (error) {
        const handledError = handleError(error);
        updateState({ isLoading: false, error: handledError });

        // Call error callback if provided
        options?.onFail?.(handledError);

        logger.error('Failed to disconnect wallet', handledError);
        throw handledError;
      }
    },
    [walletService, updateState]
  );

  const handleSignMessage = useCallback(
    async (
      transaction: anchor.web3.TransactionInstruction,
      options: SignOptions
    ): Promise<string> => {
      if (operationRef.current.sign) {
        throw new Error('Signing already in progress');
      }

      operationRef.current.sign = true;
      updateState({ isSigning: true, error: null });

      try {
        const signature = await walletService.signTransaction(transaction, {
          ...options,
          onSuccess: (sig) => {
            updateState({ isSigning: false });
            options.onSuccess?.(sig);
          },
          onFail: (error) => {
            const handledError = handleError(error);
            updateState({ isSigning: false, error: handledError });
            options.onFail?.(handledError);
          },
        });

        logger.info('Transaction signed successfully');
        return signature;
      } catch (error) {
        const handledError = handleError(error);
        updateState({ isSigning: false, error: handledError });

        logger.error('Failed to sign transaction', handledError);
        throw handledError;
      } finally {
        operationRef.current.sign = false;
      }
    },
    [walletService, updateState]
  );

  // Computed values
  const smartWalletPubkey = state.wallet?.smartWallet
    ? (() => {
        try {
          return new anchor.web3.PublicKey(state.wallet.smartWallet);
        } catch {
          return null;
        }
      })()
    : null;

  const isConnected = Boolean(state.wallet);

  return {
    smartWalletPubkey,
    isConnected,
    isLoading: state.isLoading,
    isConnecting: state.isConnecting,
    isSigning: state.isSigning,
    error: state.error,
    connection,
    connect: handleConnect,
    disconnect: handleDisconnect,
    signMessage: handleSignMessage,
  };
}
