import * as anchor from '@coral-xyz/anchor';

/**
 * Core domain types
 */
export interface WalletInfo {
  readonly credentialId: string;
  readonly passkeyPubkey: number[];
  readonly expo: string;
  readonly platform: string;
  readonly smartWallet: string;
  readonly smartWalletAuthenticator: string;
}

export interface WalletConfig {
  readonly ipfsUrl: string;
  readonly paymasterUrl: string;
  readonly rpcUrl?: string;
}

/**
 * Operation options
 */
export interface ConnectOptions {
  readonly redirectUrl: string;
  readonly onSuccess?: (wallet: WalletInfo) => void;
  readonly onFail?: (error: Error) => void;
}

export interface DisconnectOptions {
  readonly onSuccess?: () => void;
  readonly onFail?: (error: Error) => void;
}

export interface SignOptions {
  readonly redirectUrl: string;
  readonly onSuccess?: (signature: string) => void;
  readonly onFail?: (error: Error) => void;
}

/**
 * Browser interaction types
 */
export interface BrowserResult {
  readonly signature: string;
  readonly clientDataJsonBase64: string;
  readonly authenticatorDataBase64: string;
}

/**
 * State types
 */
export interface WalletState {
  readonly wallet: WalletInfo | null;
  readonly isLoading: boolean;
  readonly isConnecting: boolean;
  readonly isSigning: boolean;
  readonly error: Error | null;
}

/**
 * Service interfaces
 */
export interface WalletService {
  connect(options: ConnectOptions): Promise<WalletInfo>;
  disconnect(): Promise<void>;
  signTransaction(
    transaction: anchor.web3.TransactionInstruction,
    options: SignOptions
  ): Promise<string>;
  isConnected(): boolean;
  getWalletInfo(): WalletInfo | null;
  getSmartWalletPubkey(): anchor.web3.PublicKey | null;
}

export interface BrowserService {
  openAuthBrowser(url: string, redirectUrl: string): Promise<string>;
  openSignBrowser(
    url: string,
    redirectUrl: string,
    onSuccess: (result: string) => Promise<void>,
    onError: (error: Error) => void
  ): Promise<void>;
  parseAuthRedirect(url: string): WalletInfo | null;
  parseBrowserResult(url: string): BrowserResult;
}

export interface StorageService {
  getWallet(): Promise<WalletInfo | null>;
  saveWallet(wallet: WalletInfo): Promise<void>;
  removeWallet(): Promise<void>;
  getConfig(): Promise<WalletConfig | null>;
  saveConfig(config: WalletConfig): Promise<void>;
}

/**
 * Hook return type
 */
export interface LazorWalletHook {
  readonly smartWalletPubkey: anchor.web3.PublicKey | null;
  readonly isConnected: boolean;
  readonly isLoading: boolean;
  readonly isConnecting: boolean;
  readonly isSigning: boolean;
  readonly error: Error | null;
  readonly connection: anchor.web3.Connection;
  connect(options: ConnectOptions): Promise<WalletInfo>;
  disconnect(options?: DisconnectOptions): Promise<void>;
  signMessage(
    transaction: anchor.web3.TransactionInstruction,
    options: SignOptions
  ): Promise<string>;
}

/**
 * Configuration types
 */
export interface LazorKitConfig {
  readonly rpcUrl: string;
  readonly ipfsUrl: string;
  readonly paymasterUrl: string;
  readonly commitment: anchor.web3.Commitment;
}

/**
 * Event types
 */
export type WalletEvent =
  | { type: 'connect'; wallet: WalletInfo }
  | { type: 'disconnect' }
  | { type: 'error'; error: Error }
  | { type: 'signing_start' }
  | { type: 'signing_complete'; signature: string };

export type WalletEventHandler = (event: WalletEvent) => void;
