import * as anchor from '@coral-xyz/anchor';
import { useWalletStore } from './store/walletStore';
import {
  ConnectOptions,
  DisconnectOptions,
  LazorWalletHook,
  SignOptions,
} from './types';

/**
 * Hook that manages the LazorKit wallet flow
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
      const result = await connect(connectOptions);
      connectOptions?.onSuccess?.(result);
      return result;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
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
        signMessage(txnIns, {
          redirectUrl: signOptions.redirectUrl,
          onSuccess: (signature) => {
            // Forward to consumer callback first
            signOptions?.onSuccess?.(signature);
            // Resolve promise with the actual result AFTER tx is sent
            resolve(signature);
          },
          onFail: (error) => {
            signOptions?.onFail?.(error);
            reject(error);
          },
        });
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
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
