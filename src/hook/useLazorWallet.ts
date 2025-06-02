import * as anchor from '@coral-xyz/anchor';
import { useCallback } from 'react';
import { useWalletStore } from './store/walletStore';
import { ConnectOptions, LazorWalletHook, SignOptions, SignResult, UseLazorWalletOptions, WalletInfo } from './types';
import { logger } from './utils/logger';

/**
 * Hook that manages the LazorKit wallet flow
 */
export function useLazorWallet(options?: UseLazorWalletOptions): LazorWalletHook {
    const {
        wallet,
        isLoading,
        isConnecting,
        isSigning,
        error,
        connect: storeConnect,
        disconnect: storeDisconnect,
        signMessage: storeSignMessage,
    } = useWalletStore();

    const connect = useCallback(
        async (connectOptions?: ConnectOptions) => {
            logger.log('Connecting wallet');
            try {
                logger.log('Trying to connect wallet');
                await storeConnect({
                    onSuccess: (wallet: WalletInfo) => {
                        logger.log('Wallet connected successfully');
                        connectOptions?.onSuccess?.(wallet);
                        options?.onConnectSuccess?.(wallet);
                    },
                    onError: (error: Error) => {
                        logger.error('Failed to connect wallet', error);
                        connectOptions?.onFail?.(error);
                        options?.onConnectError?.(error);
                    },
                });
            } catch (error) {
                logger.error('Unexpected error during wallet connection', error);
                throw error;
            }
        },
        [storeConnect, options]
    );

    const disconnect = useCallback(
        async (disconnectOptions?: { onSuccess?: () => void; onError?: (error: Error) => void }) => {
            try {
                await storeDisconnect({
                    onSuccess: () => {
                        logger.log('Wallet disconnected successfully');
                        disconnectOptions?.onSuccess?.();
                        options?.onDisconnectSuccess?.();
                    },
                    onError: (error: Error) => {
                        logger.error('Failed to disconnect wallet', error);
                        disconnectOptions?.onError?.(error);
                        options?.onDisconnectError?.(error);
                    },
                });
            } catch (error) {
                logger.error('Unexpected error during wallet disconnection', error);
                throw error;
            }
        },
        [storeDisconnect, options]
    );

    const signMessage = useCallback(
        async (message: string, signOptions?: SignOptions) => {
            try {
                await storeSignMessage(message, {
                    onSuccess: (result: SignResult) => {
                        logger.log('Message signed successfully');
                        signOptions?.onSuccess?.(result);
                        options?.onSignSuccess?.(result);
                    },
                    onError: (error: Error) => {
                        logger.error('Failed to sign message', error);
                        signOptions?.onFail?.(error);
                        options?.onSignError?.(error);
                    },
                });
            } catch (error) {
                logger.error('Unexpected error during message signing', error);
                throw error;
            }
        },
        [storeSignMessage, options]
    );

    return {
        pubkey: wallet?.smartWallet ? new anchor.web3.PublicKey(wallet.smartWallet) : null,
        isConnected: !!wallet,
        isLoading,
        isConnecting,
        isSigning,
        error,
        connect,
        disconnect,
        signMessage,
    };
} 