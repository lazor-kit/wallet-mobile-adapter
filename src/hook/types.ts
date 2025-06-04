import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';

// Hook Types
export type UseLazorWalletOptions = {
  onConnectSuccess?: (wallet: WalletInfo) => void;
  onConnectError?: (error: Error) => void;
  onDisconnectSuccess?: () => void;
  onDisconnectError?: (error: Error) => void;
  onSignSuccess?: (result: SignResult) => void;
  onSignError?: (error: Error) => void;
};

export type LazorWalletHook = {
  pubkey: anchor.web3.PublicKey | null;
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  isSigning: boolean;
  error: Error | null;
  connect: (options?: ConnectOptions) => Promise<void>;
  disconnect: (options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }) => Promise<void>;
  signMessage: (message: string, options?: SignOptions) => Promise<void>;
};
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
 * The shape of a SignResult: signature + original message + txHash (optional).
 */
export type SignResult = {
  signature: Buffer; // raw bytes
  msg: Buffer; // raw message bytes
  txHash?: string; // optional transaction hash, if applicable
};

export type ConnectOptions = {
  onSuccess?: (wallet: WalletInfo) => void;
  onFail?: (error: Error) => void;
};

export type SignOptions = {
  onSuccess?: (result: SignResult) => void;
  onFail?: (error: Error) => void;
};
