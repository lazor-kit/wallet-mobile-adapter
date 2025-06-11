import * as anchor from '@coral-xyz/anchor';

/**
 * Minimal WalletInfo: what we persist to AsyncStorage and derive pubkey from.
 */
export type WalletInfo = {
  credentialId: string;
  passkeyPubkey: number[]; // bytes
  expo: string;
  platform: string;
  smartWallet: string; // base58
  smartWalletAuthenticator: string; // base58
};

/**
 * Configuration for the wallet
 */
export type WalletConfig = {
  ipfsUrl: string;
  paymasterUrl: string;
};

/**
 * Options for connecting to a wallet
 */
export type ConnectOptions = {
  redirectUrl: string;
  onSuccess?: (wallet: WalletInfo) => void;
  onFail?: (error: Error) => void;
};

/**
 * Options for disconnecting from a wallet
 */
export type DisconnectOptions = {
  onSuccess?: () => void;
  onFail?: (error: Error) => void;
};

/**
 * Options for signing with a wallet
 */
export type SignOptions = {
  redirectUrl: string;
  onSuccess?: (signature: string) => void;
  onFail?: (error: Error) => void;
};

/**
 * Browser result data from passkey authentication
 */
export type BrowserResult = {
  signature: string;
  clientDataJsonBase64: string;
  authenticatorDataBase64: string;
};

/**
 * The state of the wallet store
 */
export type WalletState = {
  // Config
  config: WalletConfig;

  // State
  wallet: WalletInfo | null;
  isLoading: boolean;
  isConnecting: boolean;
  isSigning: boolean;
  connection: anchor.web3.Connection;
  error: Error | null;

  // Actions
  setConfig: (config: WalletConfig) => void;
  setWallet: (wallet: WalletInfo | null) => void;
  setLoading: (isLoading: boolean) => void;
  setConnecting: (isConnecting: boolean) => void;
  setSigning: (isSigning: boolean) => void;
  setConnection: (connection: anchor.web3.Connection) => void;
  setError: (error: Error | null) => void;
  clearError: () => void;

  // Complex actions
  connect: (options: ConnectOptions) => Promise<WalletInfo>;
  disconnect: () => Promise<void>;
  signMessage: (
    txnIns: anchor.web3.TransactionInstruction,
    options: SignOptions
  ) => Promise<void>;
};

/**
 * Public API for the Lazor wallet hook
 */
export type LazorWalletHook = {
  smartWalletPubkey: anchor.web3.PublicKey | null;
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  isSigning: boolean;
  error: Error | null;
  connection: anchor.web3.Connection;
  connect: (options: ConnectOptions) => Promise<WalletInfo>;
  disconnect: (options?: DisconnectOptions) => Promise<void>;
  signMessage: (
    txnIns: anchor.web3.TransactionInstruction,
    options: SignOptions
  ) => Promise<string>;
};
