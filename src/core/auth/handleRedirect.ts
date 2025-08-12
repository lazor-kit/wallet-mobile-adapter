/**
 * LazorKit Wallet Mobile Adapter - Auth Redirect Handler
 *
 * Responsible for parsing the passkey authentication redirect coming back
 * from the LazorKit portal and converting it into a WalletInfo object.
 */

import { WalletInfo } from '../../types';
import { logger } from '../logger';
import { Buffer } from 'buffer';

/**
 * Parses the authentication redirect URL and returns wallet data.
 *
 * @param url - Redirect URL provided by the portal after passkey auth.
 * @returns WalletInfo or null when validation fails.
 */
export const handleAuthRedirect = (url: string): WalletInfo | null => {
  try {
    const parsed = new URL(url);

    // Basic validation
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
