import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { WalletInfo, BrowserResult } from '../types';

// Handles the authentication redirect
export const handleAuthRedirect = (url: string): WalletInfo | null => {
  try {
    const parsed = new URL(url);
    if (parsed.searchParams.get('success') !== 'true') return null;
    if (!parsed.searchParams.get('credentialId')) return null;

    const passkeyPubkey = Array.from(
      Buffer.from(parsed.searchParams.get('publicKey') || '', 'base64')
    );
    if (passkeyPubkey.length === 0) return null;

    return {
      credentialId: parsed.searchParams.get('credentialId') || '',
      passkeyPubkey,
      expo: parsed.searchParams.get('expo') || '',
      platform: parsed.searchParams.get('platform') || '',
      smartWallet: '',
      smartWalletAuthenticator: '',
    };
  } catch (err) {
    console.error('Failed to parse redirect URL:', err);
    return null;
  }
};

// Opens a browser for authentication
export const openBrowser = async (url: string, redirectUrl: string): Promise<string> => {
  if (Platform.OS === 'ios') {
    const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);
    if (result.type !== 'success') {
      throw new Error('Failed to open browser');
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
        Linking.removeAllListeners('url');
        reject(error);
      });
    });
  }
};

// Opens a browser for signing
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
    onError(error instanceof Error ? error : new Error('Unknown browser error'));
  }
};

// Handles the result of a browser sign-in
export const handleBrowserResult = (url: string): BrowserResult => {
  const parsed = new URL(url);
  if (parsed.searchParams.get('success') !== 'true') {
    throw new Error('Sign failed: success parameter is not true');
  }

  const signature = parsed.searchParams.get('signature');
  const clientDataJsonBase64 = parsed.searchParams.get('clientDataJSONReturn');
  const authenticatorDataBase64 = parsed.searchParams.get('authenticatorDataReturn');

  if (!signature || !clientDataJsonBase64 || !authenticatorDataBase64) {
    throw new Error('Missing signature or message from redirect');
  }

  return {
    signature,
    clientDataJsonBase64,
    authenticatorDataBase64,
  };
};
