/**
 * LazorKit Wallet Mobile Adapter - Store Actions
 *
 * This file contains the action functions for the wallet store.
 * These actions handle wallet connection, disconnection, and transaction signing.
 */

import {
  handleAuthRedirect,
  openBrowser,
  openSignBrowser,
  handleBrowserResult,
  createWalletActions,
  logger,
} from './utils';
import { Buffer } from 'buffer';
import { API_ENDPOINTS } from './config';
import * as anchor from '@coral-xyz/anchor';
import { WalletState, ConnectOptions, SignOptions } from './types';
import { LazorKitProgram } from './anchor/interface/lazorkit';

/**
 * Connects to the wallet
 *
 * @param get - Zustand state getter function
 * @param set - Zustand state setter function
 * @param options - Connection options with callbacks
 * @returns Promise that resolves to complete wallet information
 */
export const connectAction = async (
  get: () => WalletState,
  set: (state: Partial<WalletState>) => void,
  options: ConnectOptions
) => {
  const { isConnecting, config } = get();
  if (isConnecting) {
    logger.error('Connect attempt while already connecting');
    throw new Error('Already connecting');
  }

  set({ isConnecting: true, error: null });

  try {
    const redirectUrl = options.redirectUrl;
    const connectUrl = `${config.ipfsUrl}/${
      API_ENDPOINTS.CONNECT
    }&redirect_url=${encodeURIComponent(redirectUrl)}`;

    logger.log('Initiating wallet connection', { connectUrl, redirectUrl });

    const resultUrl = await openBrowser(connectUrl, redirectUrl);
    const walletInfo = handleAuthRedirect(resultUrl);
    if (!walletInfo) {
      logger.error('Invalid wallet info from redirect', { resultUrl });
      throw new Error('Invalid wallet info from redirect');
    }

    const { saveWallet } = createWalletActions(
      get().connection,
      (isLoading) => set({ isLoading }),
      config
    );

    const savedWallet = await saveWallet(walletInfo);
    set({ wallet: savedWallet });
    logger.log('Wallet connected successfully', { smartWallet: savedWallet.smartWallet });
    return savedWallet;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Connect action failed:', err, { redirectUrl: options.redirectUrl });
    set({ error: err });
    throw err;
  } finally {
    set({ isConnecting: false });
  }
};

/**
 * Disconnects from the wallet
 *
 * @param set - Zustand state setter function
 */
export const disconnectAction = async (set: (state: Partial<WalletState>) => void) => {
  set({ isLoading: true });
  try {
    logger.log('Disconnecting wallet');
    set({ wallet: null });
    logger.log('Wallet disconnected successfully');
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Disconnect action failed:', err);
    set({ error: err });
    throw err;
  } finally {
    set({ isLoading: false });
  }
};

/**
 * Signs a message through smart wallet
 *
 * @param get - Zustand state getter function
 * @param set - Zustand state setter function
 * @param txnIns - Transaction instruction to execute
 * @param options - Signing options with callbacks
 */
export const signMessageAction = async (
  get: () => WalletState,
  set: (state: Partial<WalletState>) => void,
  txnIns: anchor.web3.TransactionInstruction,
  options: SignOptions
) => {
  const { isSigning, connection, wallet, config } = get();
  if (isSigning) {
    logger.warn('Sign attempt while already signing');
    return;
  }

  if (!wallet) {
    const error = new Error('No wallet connected');
    logger.error('Sign failed: No wallet connected');
    options?.onFail?.(error);
    return;
  }

  if (!connection) {
    const error = new Error('No connection available');
    logger.error('Sign failed: No connection available');
    options?.onFail?.(error);
    return;
  }

  set({ isSigning: true, error: null });

  try {
    logger.log('Starting sign message flow', {
      smartWallet: wallet.smartWallet,
      instruction: txnIns.programId.toString(),
    });

    const lazorProgram = new LazorKitProgram(connection);
    const message = await lazorProgram.getMessage(wallet.smartWallet, txnIns.data);

    const encodedChallenge = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const redirectUrl = options.redirectUrl;
    const signUrl = `${config.ipfsUrl}/${API_ENDPOINTS.SIGN}&message=${encodeURIComponent(
      encodedChallenge
    )}&redirect_url=${encodeURIComponent(redirectUrl)}`;

    logger.log('Opening sign browser', { signUrl, redirectUrl });

    await openSignBrowser(
      signUrl,
      redirectUrl,
      async (urlResult) => {
        try {
          logger.log('Received sign browser result', { urlResult });
          const browserResult = handleBrowserResult(urlResult);
          const walletActions = createWalletActions(
            connection,
            (isLoading) => set({ isLoading }),
            config
          );

          const txnSignature = await walletActions.executeWallet(wallet, browserResult, txnIns);
          logger.log('Sign completed successfully', { signature: txnSignature });
          options?.onSuccess?.(txnSignature);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          logger.error('Sign browser result processing failed:', err, { urlResult });
          set({ error: err });
          options?.onFail?.(err);
        }
      },
      (error) => {
        logger.error('Sign browser failed:', error, { signUrl, redirectUrl });
        set({ error });
        options?.onFail?.(error);
      }
    );
  } catch (error: unknown) {
    logger.error('Sign message action failed:', error, {
      smartWallet: wallet?.smartWallet,
      instruction: txnIns.programId.toString(),
      redirectUrl: options.redirectUrl,
    });
    const err = error instanceof Error ? error : new Error('Unknown error');
    set({ error: err });
    options?.onFail?.(err);
  } finally {
    set({ isSigning: false });
  }
};
