import { BrowserService, WalletInfo, BrowserResult } from '../core/types';
import { createError, handleError } from '../core/errors';
import { logger } from '../utils/logger';
import * as WebBrowser from 'expo-web-browser';

export class ExpoBrowserService implements BrowserService {
  async openAuthBrowser(url: string, redirectUrl: string): Promise<string> {
    try {
      logger.info('Opening auth browser', { url, redirectUrl });
      
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
      
      if (result.type === 'success') {
        return result.url;
      }
      
      if (result.type === 'cancel') {
        throw createError.browser('User cancelled authentication');
      }
      
      throw createError.browser(`Authentication failed: ${result.type}`);
    } catch (error) {
      logger.error('Error opening auth browser', error);
      throw handleError(error);
    }
  }

  async openSignBrowser(
    url: string,
    redirectUrl: string,
    onSuccess: (result: string) => Promise<void>,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      logger.info('Opening sign browser', { url, redirectUrl });
      
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
      
      if (result.type === 'success') {
        await onSuccess(result.url);
        return;
      }
      
      if (result.type === 'cancel') {
        const error = createError.browser('User cancelled signing');
        onError(error);
        return;
      }
      
      const error = createError.browser(`Signing failed: ${result.type}`);
      onError(error);
    } catch (error) {
      logger.error('Error opening sign browser', error);
      const handledError = handleError(error);
      onError(handledError);
    }
  }

  parseAuthRedirect(url: string): WalletInfo | null {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      
      const credentialId = params.get('credential_id');
      const passkeyPubkeyParam = params.get('passkey_pubkey');
      const expo = params.get('expo');
      const platform = params.get('platform');
      const smartWallet = params.get('smart_wallet');
      const smartWalletAuthenticator = params.get('smart_wallet_authenticator');
      
      if (!credentialId || !passkeyPubkeyParam || !expo || !platform || !smartWallet || !smartWalletAuthenticator) {
        logger.warn('Missing required parameters in auth redirect', { url });
        return null;
      }
      
      // Parse passkey public key from comma-separated string
      const passkeyPubkey = passkeyPubkeyParam.split(',').map(num => parseInt(num.trim(), 10));
      
      if (passkeyPubkey.some(isNaN)) {
        logger.warn('Invalid passkey public key format', { passkeyPubkeyParam });
        return null;
      }
      
      return {
        credentialId,
        passkeyPubkey,
        expo,
        platform,
        smartWallet,
        smartWalletAuthenticator,
      };
    } catch (error) {
      logger.error('Error parsing auth redirect', error);
      return null;
    }
  }

  parseBrowserResult(url: string): BrowserResult {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      
      const signature = params.get('signature');
      const clientDataJsonBase64 = params.get('client_data_json');
      const authenticatorDataBase64 = params.get('authenticator_data');
      
      if (!signature || !clientDataJsonBase64 || !authenticatorDataBase64) {
        throw createError.validation('Missing required parameters in browser result');
      }
      
      return {
        signature,
        clientDataJsonBase64,
        authenticatorDataBase64,
      };
    } catch (error) {
      logger.error('Error parsing browser result', error);
      throw createError.browser('Failed to parse browser result', error);
    }
  }
} 