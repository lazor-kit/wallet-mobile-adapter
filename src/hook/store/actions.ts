import {
  handleAuthRedirect,
  openBrowser,
  openSignBrowser,
  handleBrowserResult,
} from '../utils/browser';
import { createWalletActions } from './walletActions';
import { Buffer } from 'buffer';
import { API_ENDPOINTS } from '../../constants';
import { logger } from '../utils/logger';
import * as anchor from '@coral-xyz/anchor';
import { WalletState, ConnectOptions, SignOptions } from '../types';

// Connects to the wallet
export const connectAction = async (
  get: () => WalletState,
  set: (state: Partial<WalletState>) => void,
  options: ConnectOptions
) => {
  const { isConnecting, config } = get();
  if (isConnecting) {
    throw new Error('Already connecting');
  }

  set({ isConnecting: true, error: null });

  try {
    const redirectUrl = options.redirectUrl;
    const connectUrl = `${config.ipfsUrl}/${API_ENDPOINTS.CONNECT}&expo=lazorkit&redirect_url=${redirectUrl}`;

    const resultUrl = await openBrowser(connectUrl, redirectUrl);
    const walletInfo = handleAuthRedirect(resultUrl);
    if (!walletInfo) {
      throw new Error('Invalid wallet info from redirect');
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
    const err = error instanceof Error ? error : new Error(String(error));
    set({ error: err });
    throw err;
  } finally {
    set({ isConnecting: false });
  }
};

// Disconnects from the wallet
export const disconnectAction = async (set: (state: Partial<WalletState>) => void) => {
  set({ isLoading: true });
  try {
    set({ wallet: null });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    set({ error: err });
  } finally {
    set({ isLoading: false });
  }
};

// Signs a message
export const signMessageAction = async (
  get: () => WalletState,
  set: (state: Partial<WalletState>) => void,
  txnIns: anchor.web3.TransactionInstruction,
  options: SignOptions
) => {
  const { isSigning, connection, wallet, config } = get();
  if (isSigning) {
    logger.warn('Already signing');
    return;
  }

  if (!wallet) {
    const error = new Error('No wallet connected');
    logger.error('Wallet error:', error);
    options?.onFail?.(error);
    return;
  }

  if (!connection) {
    const error = new Error('No connection available');
    logger.error('Connection error:', error);
    options?.onFail?.(error);
    return;
  }

  set({ isSigning: true, error: null });

  try {
    const hardcodeMessage = Buffer.from('Hello');
    const redirectUrl = options.redirectUrl;
    const signUrl = `${config.ipfsUrl}/${API_ENDPOINTS.SIGN}&message=${encodeURIComponent(
      hardcodeMessage.toString()
    )}&expo=lazorkit&redirect_url=${encodeURIComponent(redirectUrl)}`;

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

          const txnSignature = await walletActions.executeWallet(wallet, browserResult, txnIns);
          logger.log('Sign result:', txnSignature);
          options?.onSuccess?.(txnSignature);
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          set({ error: err });
          options?.onFail?.(err);
        }
      },
      (error) => {
        set({ error });
        options?.onFail?.(error);
      }
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    set({ error: err });
    options?.onFail?.(err);
  } finally {
    set({ isSigning: false });
  }
};
