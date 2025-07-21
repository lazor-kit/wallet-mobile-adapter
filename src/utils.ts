/**
 * LazorKit Wallet Mobile Adapter - Utility Functions
 *
 * This file contains core utility functions for wallet operations including
 * browser handling, logging, and paymaster interactions.
 */

import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { WalletInfo, BrowserResult, WalletActions, SignOptions } from './types';
import * as anchor from '@coral-xyz/anchor';
import { LazorKitProgram } from './anchor/interface/lazorkit';

/**
 * Simple logger utility for consistent logging across the SDK
 */
class Logger {
  private isDebugMode: boolean = false;

  setDebugMode(isDebug: boolean) {
    this.isDebugMode = isDebug;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(message: string, ...args: any[]) {
    if (this.isDebugMode) {
      console.log(`[LazorKit] ${message}`, ...args);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, ...args: any[]) {
    if (this.isDebugMode) {
      console.info(`[LazorKit] ${message}`, ...args);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: string, ...args: any[]) {
    console.warn(`[LazorKit] ${message}`, ...args);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: string, ...args: any[]) {
    console.error(`[LazorKit] ${message}`, ...args);
  }
}

export const logger = new Logger();

/**
 * Handles the authentication redirect URL and extracts wallet information
 *
 * @param url - The redirect URL containing wallet authentication data
 * @returns Parsed wallet information or null if invalid
 */
export const handleAuthRedirect = (url: string): WalletInfo | null => {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.get('success') !== 'true') {
      logger.error('Auth redirect failed: success parameter is not true', { url });
      return null;
    }
    if (!parsed.searchParams.get('credentialId')) {
      logger.error('Auth redirect failed: missing credentialId', { url });
      return null;
    }

    const passkeyPubkey = Array.from(
      Buffer.from(parsed.searchParams.get('publicKey') || '', 'base64')
    );
    if (passkeyPubkey.length === 0) {
      logger.error('Auth redirect failed: empty or invalid publicKey', { url });
      return null;
    }

    return {
      credentialId: parsed.searchParams.get('credentialId') || '',
      passkeyPubkey,
      expo: parsed.searchParams.get('expo') || '',
      platform: parsed.searchParams.get('platform') || '',
      smartWallet: '',
      smartWalletAuthenticator: '',
    };
  } catch (err) {
    logger.error('Failed to parse redirect URL:', err, { url });
    return null;
  }
};

/**
 * Opens a browser for authentication or signing
 *
 * @param url - The URL to open in the browser
 * @param redirectUrl - The redirect URL for the app
 * @returns Promise that resolves to the result URL
 */
export const openBrowser = async (url: string, redirectUrl: string): Promise<string> => {
  try {
    if (Platform.OS === 'ios') {
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
      if (result.type !== 'success') {
        logger.error('iOS browser session failed:', result.type, { url, redirectUrl });
        throw new Error(`Failed to open browser: ${result.type}`);
      }
      return result.url;
    } else {
      return new Promise((resolve, reject) => {
        const handleUrl = (event: { url: string }) => {
          WebBrowser.dismissBrowser();
          Linking.removeAllListeners('url');
          resolve(event.url);
        };

        Linking.addEventListener('url', handleUrl);

        WebBrowser.openBrowserAsync(url).catch((error) => {
          logger.error('Android browser open failed:', error, { url, redirectUrl });
          Linking.removeAllListeners('url');
          reject(error);
        });
      });
    }
  } catch (error) {
    logger.error('Browser opening error:', error, { url, redirectUrl });
    throw error;
  }
};

/**
 * Opens a browser for signing with callback handling
 *
 * @param url - The signing URL
 * @param redirectUrl - The redirect URL for the app
 * @param onSuccess - Success callback with result URL
 * @param onError - Error callback
 */
export const openSignBrowser = async (
  url: string,
  redirectUrl: string,
  onSuccess: (result: string) => void,
  onError: (error: Error) => void
) => {
  try {
    const result = await openBrowser(url, redirectUrl);
    onSuccess(result);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown browser error');
    logger.error('Sign browser error:', err, { url, redirectUrl });
    onError(err);
  }
};

/**
 * Handles the result of a browser sign-in and extracts signature data
 *
 * @param url - The result URL from browser
 * @returns Parsed browser result with signature data
 */
export const handleBrowserResult = (url: string): BrowserResult => {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.get('success') !== 'true') {
      logger.error('Browser result failed: success parameter is not true', { url });
      throw new Error('Sign failed: success parameter is not true');
    }

    const signature = parsed.searchParams.get('signature');
    const clientDataJsonBase64 = parsed.searchParams.get('clientDataJSONReturn');
    const authenticatorDataBase64 = parsed.searchParams.get('authenticatorDataReturn');

    if (!signature || !clientDataJsonBase64 || !authenticatorDataBase64) {
      logger.error('Browser result failed: missing signature data', {
        url,
        hasSignature: !!signature,
        hasClientData: !!clientDataJsonBase64,
        hasAuthData: !!authenticatorDataBase64,
      });
      throw new Error('Missing signature or message from redirect');
    }

    return {
      signature,
      clientDataJsonBase64,
      authenticatorDataBase64,
    };
  } catch (error) {
    logger.error('Failed to handle browser result:', error, { url });
    throw error;
  }
};

/**
 * Gets the fee payer public key from paymaster service
 *
 * @param paymasterUrl - The paymaster service URL
 * @returns Promise that resolves to fee payer public key
 */
export const getFeePayer = async (paymasterUrl: string): Promise<anchor.web3.PublicKey> => {
  try {
    const response = await fetch(paymasterUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getConfig',
        params: [],
      }),
    });

    if (!response.ok) {
      logger.error('Paymaster HTTP error:', response.status, response.statusText, { paymasterUrl });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.result?.fee_payer) {
      logger.error('Paymaster invalid response: missing feePayer field', { data, paymasterUrl });
      throw new Error('Invalid response: missing feePayer field');
    }

    return new anchor.web3.PublicKey(data.result.fee_payer);
  } catch (error) {
    logger.error('Failed to get fee payer from paymaster:', error, { paymasterUrl });
    throw new Error(`Failed to get fee payer from paymaster: ${error}`);
  }
};

/**
 * Helper function for signing and sending transactions through paymaster
 *
 * @param base64EncodedTransaction - The serialized transaction
 * @param relayerUrl - The paymaster service URL
 * @returns Promise that resolves to paymaster response
 */
export const signAndSendTxn = async ({
  base64EncodedTransaction,
  relayerUrl,
}: {
  base64EncodedTransaction: string;
  relayerUrl: string;
}) => {
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'signAndSendTransaction',
    params: [base64EncodedTransaction],
  };

  try {
    const response = await fetch(relayerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.error('Relayer HTTP error:', response.status, response.statusText, {
        relayerUrl,
        payload,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    logger.log('Relayer response:', data);
    return data;
  } catch (error) {
    logger.error('Relayer request failed:', error, { relayerUrl, payload });
    throw error;
  }
};

// ============================================================================
// Wallet Actions
// ============================================================================

/**
 * Creates a new set of wallet actions
 *
 * @param connection - Solana RPC connection
 * @param setLoading - Loading state setter function
 * @param config - Configuration object with paymaster URL
 * @returns WalletActions object with saveWallet and executeWallet methods
 */
export const createWalletActions = (
  connection: anchor.web3.Connection,
  setLoading: (isLoading: boolean) => void,
  config: { paymasterUrl: string }
): WalletActions => {
  const lazorProgram = new LazorKitProgram(connection);

  const saveWallet = async (data: WalletInfo): Promise<WalletInfo> => {
    setLoading(true);

    try {
      let { smartWallet, smartWalletAuthenticator } = await lazorProgram.getSmartWalletByPasskey(
        data.passkeyPubkey
      );

      if (!smartWallet || !smartWalletAuthenticator) {
        logger.log('💡 SmartWallet missing; creating a new one...');

        try {
          const feePayer = await getFeePayer(config.paymasterUrl);

          const result = await lazorProgram.createSmartWalletTxn(
            data.passkeyPubkey,
            feePayer,
            data.credentialId
          );

          const serialized = result.transaction
            .serialize({ verifySignatures: false, requireAllSignatures: false })
            .toString('base64');

          const { result: sendResult, error: sendError } = await signAndSendTxn({
            base64EncodedTransaction: serialized,
            relayerUrl: config.paymasterUrl,
          });

          if (sendError) {
            logger.error('Create wallet relayer error:', sendError, {
              paymasterUrl: config.paymasterUrl,
            });
            throw new Error(`Create wallet relayer error: ${JSON.stringify(sendError)}`);
          }

          await lazorProgram.connection.confirmTransaction(
            String(sendResult.signature),
            'confirmed'
          );

          const fetched = await lazorProgram.getSmartWalletByPasskey(data.passkeyPubkey);
          smartWallet = fetched.smartWallet;
          smartWalletAuthenticator = fetched.smartWalletAuthenticator;

          if (!smartWallet || !smartWalletAuthenticator) {
            logger.error('Failed to create smart wallet on chain after transaction confirmed', {
              signature: sendResult.signature,
              passkeyPubkey: data.passkeyPubkey,
            });
            throw new Error('Failed to create smart wallet on chain');
          }
        } catch (createError) {
          logger.error('Smart wallet creation failed:', createError, {
            passkeyPubkey: data.passkeyPubkey,
            credentialId: data.credentialId,
          });
          throw createError;
        }
      }

      return {
        ...data,
        smartWallet: smartWallet.toString(),
        smartWalletAuthenticator: smartWalletAuthenticator.toString(),
      };
    } catch (error) {
      logger.error('SaveWallet action failed:', error, { walletData: data });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const executeWallet = async (
    data: WalletInfo,
    browserResult: BrowserResult,
    txnIns: anchor.web3.TransactionInstruction,
    options: SignOptions
  ): Promise<string> => {
    setLoading(true);

    try {
      const feePayer = await getFeePayer(config.paymasterUrl);

      const executeTransaction = await lazorProgram.executeInstructionTxn(
        data.passkeyPubkey,
        Buffer.from(browserResult.clientDataJsonBase64, 'base64'),
        Buffer.from(browserResult.authenticatorDataBase64, 'base64'),
        Buffer.from(browserResult.signature, 'base64'),
        feePayer,
        new anchor.web3.PublicKey(data.smartWallet),
        txnIns, // cpiInstruction
        options.ruleIns,
        options.action,
        options.createNewPasskey
      );

      const serialized = executeTransaction
        .serialize({ verifySignatures: false, requireAllSignatures: false })
        .toString('base64');

      const { result: sendResult, error: sendError } = await signAndSendTxn({
        base64EncodedTransaction: serialized,
        relayerUrl: config.paymasterUrl,
      });

      if (sendError) {
        logger.error('Execute wallet relayer error:', sendError, {
          paymasterUrl: config.paymasterUrl,
          smartWallet: data.smartWallet,
        });
        throw new Error(`Execute wallet relayer error: ${JSON.stringify(sendError)}`);
      }

      await lazorProgram.connection.confirmTransaction(String(sendResult.signature), 'confirmed');

      return sendResult.signature;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error('ExecuteWallet action failed:', error, {
        smartWallet: data.smartWallet,
        instruction: txnIns.programId.toString(),
      });
      throw new Error(`Failed to execute wallet action: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    saveWallet,
    executeWallet,
  };
};
