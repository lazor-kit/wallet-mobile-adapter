/**
 * LazorKit Wallet Mobile Adapter - Store Actions
 *
 * This file contains the action functions for the wallet store.
 * These actions handle wallet connection, disconnection, and transaction signing.
 */
import { handleAuthRedirect } from './core/auth/handleRedirect';
import { openBrowser, openSignBrowser } from './core/browser/open';
import { handleBrowserResult } from './core/browser/parseResult';
import { createWalletActions } from './core/wallet/actions';
import { logger } from './core/logger';
import { Buffer } from 'buffer';
import { API_ENDPOINTS } from './config';
import * as anchor from '@coral-xyz/anchor';
import {
  WalletStateClient,
  ConnectOptions,
  SignOptions,
  WalletConnectionError,
  SigningError,
} from './types';
import { asCredentialHash, LazorkitClient, SmartWalletActionArgs, getBlockchainTimestamp } from './contract';
import { getFeePayer } from './core/paymaster';
import { sha256 } from 'js-sha256';

/**
 * Connects to the wallet
 *
 * @param get - Zustand state getter function
 * @param set - Zustand state setter function
 * @param options - Connection options with callbacks
 * @returns Promise that resolves to complete wallet information
 */
export const connectAction = async (
  get: () => WalletStateClient,
  set: (state: Partial<WalletStateClient>) => void,
  options: ConnectOptions
) => {
  const { isConnecting, config } = get();
  if (isConnecting) {
    logger.error('Connect attempt while already connecting');
    throw new WalletConnectionError('Already connecting');
  }

  set({ isConnecting: true, error: null });

  try {
    const redirectUrl = options.redirectUrl;
    const connectUrl = `${config.ipfsUrl}/${API_ENDPOINTS.CONNECT
      }&redirect_url=${encodeURIComponent(redirectUrl)}`;

    const resultUrl = await openBrowser(connectUrl, redirectUrl);
    const walletInfo = handleAuthRedirect(resultUrl);
    if (!walletInfo) {
      logger.error('Invalid wallet info from redirect', { resultUrl });
      throw new WalletConnectionError('Invalid wallet info from redirect');
    }

    const { saveWallet } = createWalletActions(
      get().connection,
      (isLoading) => set({ isLoading }),
      config
    );

    const savedWallet = await saveWallet(walletInfo);
    set({ wallet: savedWallet });
    return savedWallet;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new WalletConnectionError(String(error));
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
export const disconnectAction = async (set: (state: Partial<WalletStateClient>) => void) => {
  set({ isLoading: true });
  try {
    set({ wallet: null });
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
  get: () => WalletStateClient,
  set: (state: Partial<WalletStateClient>) => void,
  action: SmartWalletActionArgs,
  options: SignOptions
) => {
  const { isSigning, connection, wallet, config } = get();
  if (isSigning) {
    return;
  }

  if (!wallet) {
    const error = new SigningError('No wallet connected');
    logger.error('Sign failed: No wallet connected');
    options?.onFail?.(error);
    return;
  }

  if (!connection) {
    const error = new SigningError('No connection available');
    logger.error('Sign failed: No connection available');
    options?.onFail?.(error);
    return;
  }

  set({ isSigning: true, error: null });

  try {
    const lazorProgram = new LazorkitClient(connection);

    const feePayer = await getFeePayer(config.paymasterUrl);

    const timestamp = await getBlockchainTimestamp(connection);

    const message = await lazorProgram.buildAuthorizationMessage({
      action,
      payer: feePayer,
      smartWallet: new anchor.web3.PublicKey(wallet.smartWallet),
      passkeyPublicKey: wallet.passkeyPubkey,
      timestamp: new anchor.BN(timestamp),
      credentialHash: asCredentialHash(
        Array.from(
          new Uint8Array(
            sha256.arrayBuffer(Buffer.from(wallet.credentialId, 'base64'))
          )
        )
      ),
    });

    const encodedChallenge = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const redirectUrl = options.redirectUrl;
    const signUrl = `${config.ipfsUrl}/${API_ENDPOINTS.SIGN}&message=${encodeURIComponent(
      encodedChallenge
    )}&redirect_url=${encodeURIComponent(redirectUrl)}`;

    await openSignBrowser(
      signUrl,
      redirectUrl,
      async (urlResult) => {
        try {
          const browserResult = handleBrowserResult(urlResult);
          const walletActions = createWalletActions(
            connection,
            (isLoading) => set({ isLoading }),
            config
          );

          const txnSignature = await walletActions.executeWallet(
            wallet,
            feePayer,
            action,
            browserResult,
            options
          );
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
      redirectUrl: options.redirectUrl,
    });
    const err = error instanceof Error ? error : new SigningError('Unknown error');
    set({ error: err });
    options?.onFail?.(err);
  } finally {
    set({ isSigning: false });
  }
};
