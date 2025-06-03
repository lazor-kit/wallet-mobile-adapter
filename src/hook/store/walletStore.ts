import * as anchor from '@coral-xyz/anchor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../constants';
import { SignResult, WalletInfo } from '../types';
import { logger } from '../utils/logger';
import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { createWalletActions } from './walletAction';

const handleRedirect = (url: string): WalletInfo | null => {
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

interface WalletState {
    // State
    wallet: WalletInfo | null;
    isLoading: boolean;
    isConnecting: boolean;
    isSigning: boolean;
    connection: anchor.web3.Connection | null;
    error: Error | null;

    // Actions
    setWallet: (wallet: WalletInfo | null) => void;
    setLoading: (isLoading: boolean) => void;
    setConnecting: (isConnecting: boolean) => void;
    setSigning: (isSigning: boolean) => void;
    setConnection: (connection: anchor.web3.Connection) => void;
    setError: (error: Error | null) => void;
    clearError: () => void;

    // Complex actions
    connect: (options?: { onSuccess?: (wallet: WalletInfo) => void; onError?: (error: Error) => void }) => Promise<void>;
    disconnect: (options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => Promise<void>;
    signMessage: (message: string, options?: { onSuccess?: (result: SignResult) => void; onError?: (error: Error) => void }) => Promise<void>;
}

// Create a custom storage object for Zustand
const storage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(name);
        } catch (error) {
            logger.error('Error reading from AsyncStorage', error);
            return null;
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(name, value);
        } catch (error) {
            logger.error('Error writing to AsyncStorage', error);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(name);
        } catch (error) {
            logger.error('Error removing from AsyncStorage', error);
        }
    },
};

export const useWalletStore = create<WalletState>()(
    persist(
        (set, get) => {
            const setWallet = (wallet: WalletInfo | null) => set({ wallet });
            const setLoading = (isLoading: boolean) => set({ isLoading });
            const setConnecting = (isConnecting: boolean) => set({ isConnecting });
            const setSigning = (isSigning: boolean) => set({ isSigning });
            const setConnection = (connection: anchor.web3.Connection) => set({ connection });
            const setError = (error: Error | null) => set({ error });
            const clearError = () => set({ error: null });

            return {
                // Initial state
                wallet: null,
                isLoading: false,
                isConnecting: false,
                isSigning: false,
                connection: null,
                error: null,

                // Basic actions
                setWallet,
                setLoading,
                setConnecting,
                setSigning,
                setConnection,
                setError,
                clearError,

                // Complex actions
                connect: async (options) => {
                    const { isConnecting, connection } = get();
                    if (isConnecting) {
                        logger.warn('Already connecting');
                        return;
                    }

                    if (!connection) {
                        const error = new Error('No connection available');
                        logger.error('Connection error:', error);
                        options?.onError?.(error);
                        return;
                    }

                    set({ isConnecting: true, error: null });

                    try {
                        const redirectUrl = 'exp://localhost:8081';
                        const connectUrl = `https://portal.lazor.sh?action=connect&expo=lazorkit&redirect_url=${redirectUrl}`;


                        if (Platform.OS === 'ios') {
                            try {
                                const result = await WebBrowser.openAuthSessionAsync(
                                    connectUrl,
                                    redirectUrl
                                );

                                if (result.type === 'success' && result.url) {
                                    const walletInfo = handleRedirect(result.url);
                                    if (!walletInfo) throw new Error('Invalid wallet info');

                                    const { saveWallet } = createWalletActions(connection, setWallet, setLoading);
                                    const finalWallet = await saveWallet(walletInfo);
                                    options?.onSuccess?.(finalWallet);
                                }
                            } catch (error) {
                                logger.error('InAppBrowser auth failed:', error);
                                throw error;
                            }
                        } else {
                            try {
                                logger.log('Setting up URL listener for Android...');
                                const sub = Linking.addEventListener('url', async ({ url }) => {
                                    try {
                                        logger.log('URL event received:', url);
                                        WebBrowser.dismissBrowser();
                                        const walletInfo = handleRedirect(url);
                                        if (!walletInfo) throw new Error('Invalid wallet info');

                                        const { saveWallet } = createWalletActions(connection, setWallet, setLoading);
                                        const finalWallet = await saveWallet(walletInfo);
                                        options?.onSuccess?.(finalWallet);
                                    } catch (error: unknown) {
                                        const err = error instanceof Error ? error : new Error('Unknown error');
                                        logger.error('URL event handling failed:', err);
                                        setError(err);
                                        options?.onError?.(err);
                                    } finally {
                                        sub.remove();
                                    }
                                });

                                logger.log('Opening InAppBrowser on Android...');
                                await WebBrowser.openBrowserAsync(connectUrl);
                            } catch (error) {
                                logger.error('InAppBrowser open failed:', error);
                                throw error;
                            }
                        }
                    } catch (error: unknown) {
                        const err = error instanceof Error ? error : new Error('Unknown error');
                        setError(err);
                        options?.onError?.(err);
                    } finally {
                        setConnecting(false);
                    }
                },

                disconnect: async (options) => {
                    set({ isConnecting: true, error: null });

                    try {
                        set({ wallet: null });
                        options?.onSuccess?.();
                    } catch (error: unknown) {
                        const err = error instanceof Error ? error : new Error('Unknown error');
                        setError(err);
                        options?.onError?.(err);
                    } finally {
                        setConnecting(false);
                    }
                },

                signMessage: async (message, options) => {
                    const { isSigning, connection } = get();
                    if (isSigning) {
                        logger.warn('Already signing');
                        return;
                    }

                    if (!connection) {
                        const error = new Error('No connection available');
                        logger.error('Connection error:', error);
                        options?.onError?.(error);
                        return;
                    }

                    set({ isSigning: true, error: null });

                    try {
                        const redirectUrl = 'exp://localhost:8081';
                        const signUrl = `https://portal.lazor.sh?action=sign&message=${encodeURIComponent(message)}&expo=lazorkit&redirect_url=${encodeURIComponent(redirectUrl)}`;

                        if (Platform.OS === 'ios') {
                            const result = await WebBrowser.openAuthSessionAsync(
                                signUrl,
                                redirectUrl
                            );

                            if (result.type === 'success' && result.url) {
                                const parsed = new URL(result.url);
                                if (parsed.searchParams.get('success') !== 'true') {
                                    throw new Error('Sign failed: success parameter is not true');
                                }

                                const signature = parsed.searchParams.get('signature');
                                const msg = parsed.searchParams.get('msg');

                                if (!signature || !msg) {
                                    throw new Error('Missing signature or message from redirect');
                                }

                                const signResult: SignResult = {
                                    signature: Buffer.from(signature, 'base64'),
                                    msg: Buffer.from(msg, 'base64'),
                                };

                                options?.onSuccess?.(signResult);
                            }
                        } else {
                            const sub = Linking.addEventListener('url', async ({ url }) => {
                                try {
                                    WebBrowser.dismissBrowser();
                                    const parsed = new URL(url);
                                    if (parsed.searchParams.get('success') !== 'true') {
                                        throw new Error('Sign failed: success parameter is not true');
                                    }

                                    const signature = parsed.searchParams.get('signature');
                                    const msg = parsed.searchParams.get('msg');

                                    if (!signature || !msg) {
                                        throw new Error('Missing signature or message from redirect');
                                    }

                                    const signResult: SignResult = {
                                        signature: Buffer.from(signature, 'base64'),
                                        msg: Buffer.from(msg, 'base64'),
                                    };

                                    options?.onSuccess?.(signResult);
                                } catch (error: unknown) {
                                    const err = error instanceof Error ? error : new Error('Unknown error');
                                    setError(err);
                                    options?.onError?.(err);
                                } finally {
                                    sub.remove();
                                }
                            });
                            await WebBrowser.openBrowserAsync(signUrl);
                        }
                    } catch (error: unknown) {
                        const err = error instanceof Error ? error : new Error('Unknown error');
                        setError(err);
                        options?.onError?.(err);
                    } finally {
                        setSigning(false);
                    }
                },
            };
        },
        {
            name: STORAGE_KEYS.WALLET,
            storage: createJSONStorage(() => storage),
            partialize: (state) => ({ wallet: state.wallet }), // Only persist wallet info
        }
    )
); 