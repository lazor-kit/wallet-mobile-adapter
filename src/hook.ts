/**
 * LazorKit Wallet Mobile Adapter - React Hook
 *
 * This file contains the React hook for LazorKit wallet integration.
 * Provides a clean interface over the Zustand store for React components.
 */

import * as anchor from '@coral-xyz/anchor';
import { useWalletStore } from './wallet-store';
import {
  ConnectOptions,
  DisconnectOptions,
  LazorWalletHook,
  SignOptions,
} from './types';
import { logger } from './utils';

/**
 * Hook that manages the LazorKit wallet flow
 * 
 * This hook provides access to wallet state and operations including
 * connection, disconnection, and transaction signing through smart wallets.
 * 
 * @returns LazorWalletHook interface with wallet state and methods
 */
export function useLazorWallet(): LazorWalletHook {
  const {
    wallet,
    isLoading,
    isConnecting,
    isSigning,
    error,
    connect,
    disconnect,
    connection,
    signMessage,
  } = useWalletStore();

  const handleConnect = async (connectOptions: ConnectOptions) => {
    try {
      logger.log('Hook connect initiated', { redirectUrl: connectOptions.redirectUrl });
      const result = await connect(connectOptions);
      connectOptions?.onSuccess?.(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      logger.error('Hook connect failed:', err, { redirectUrl: connectOptions.redirectUrl });
      connectOptions?.onFail?.(err);
      throw err;
    }
  };

  const handleDisconnect = async (disconnectOptions?: DisconnectOptions) => {
    try {
      logger.log('Hook disconnect initiated');
      await disconnect();
      disconnectOptions?.onSuccess?.();
      logger.log('Hook disconnect completed');
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      logger.error('Hook disconnect failed:', err);
      disconnectOptions?.onFail?.(err);
      throw err;
    }
  };

  const handleSignMessage = (
    txnIns: anchor.web3.TransactionInstruction,
    signOptions: SignOptions
  ): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      try {
        logger.log('Hook signMessage initiated', { 
          instruction: txnIns.programId.toString(),
          redirectUrl: signOptions.redirectUrl 
        });
        
        signMessage(txnIns, {
          redirectUrl: signOptions.redirectUrl,
          onSuccess: (signature) => {
            logger.log('Hook signMessage completed', { signature });
            // Forward to consumer callback first
            signOptions?.onSuccess?.(signature);
            // Resolve promise with the actual result AFTER tx is sent
            resolve(signature);
          },
          onFail: (error) => {
            logger.error('Hook signMessage failed:', error, { 
              instruction: txnIns.programId.toString(),
              redirectUrl: signOptions.redirectUrl 
            });
            signOptions?.onFail?.(error);
            reject(error);
          },
        });
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        logger.error('Hook signMessage initialization failed:', err, { 
          instruction: txnIns.programId.toString(),
          redirectUrl: signOptions.redirectUrl 
        });
        signOptions?.onFail?.(err);
        reject(err);
      }
    });
  };

  return {
    smartWalletPubkey: wallet?.smartWallet
      ? new anchor.web3.PublicKey(wallet.smartWallet)
      : null,
    isConnected: !!wallet,
    isLoading,
    isConnecting,
    isSigning,
    error,
    connection,
    connect: handleConnect,
    disconnect: handleDisconnect,
    signMessage: handleSignMessage,
  };
} 