/**
 * LazorKit Wallet Mobile Adapter - React Hook
 */

import * as anchor from '@coral-xyz/anchor';
import { useWalletStore } from './store';
import { ConnectOptions, DisconnectOptions, LazorWalletHook, SignOptions } from '../types';
import { logger } from '../core/logger';
import { MessageArgs } from '../contract-integration';

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
      await disconnect();
      disconnectOptions?.onSuccess?.();
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      logger.error('Hook disconnect failed:', err);
      disconnectOptions?.onFail?.(err);
      throw err;
    }
  };

  const handleSignMessage = (action: MessageArgs, signOptions: SignOptions): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      try {
        signMessage(action, {
          redirectUrl: signOptions.redirectUrl,
          onSuccess: (signature) => {
            signOptions?.onSuccess?.(signature);
            resolve(signature);
          },
          onFail: (error) => {
            logger.error('Hook signMessage failed:', error, {
              redirectUrl: signOptions.redirectUrl,
            });
            signOptions?.onFail?.(error);
            reject(error);
          },
        });
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        logger.error('Hook signMessage initialization failed:', err, {
          redirectUrl: signOptions.redirectUrl,
        });
        signOptions?.onFail?.(err);
        reject(err);
      }
    });
  };

  return {
    smartWalletPubkey: wallet?.smartWallet ? new anchor.web3.PublicKey(wallet.smartWallet) : null,
    passkeyPubkey: wallet?.passkeyPubkey || null,
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
