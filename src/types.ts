import * as anchor from '@coral-xyz/anchor';
import React from 'react';
import { SmartWalletActionArgs } from './contract';

/**
 * Core wallet types
 */
export interface WalletInfo {
  readonly credentialId: string;
  readonly passkeyPubkey: number[];
  readonly expo: string;
  readonly platform: string;
  readonly smartWallet: string;
  readonly walletDevice: string;
}

export interface WalletConfig {
  readonly ipfsUrl: string;
  readonly configPaymaster: {
    readonly paymasterUrl: string;
    readonly apiKey?: string;
  };
  readonly rpcUrl?: string;
}

/**
 * Provider configuration types
 */
export interface LazorKitProviderProps {
  readonly rpcUrl?: string;
  readonly ipfsUrl?: string;
  readonly configPaymaster?: {
    readonly paymasterUrl: string;
    readonly apiKey?: string;
  };
  readonly isDebug?: boolean;
  readonly children:
  | React.JSX.Element
  | React.JSX.Element[]
  | string
  | number
  | boolean
  | null
  | undefined;
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
  readonly onSuccess?: (signature: any) => void;
  readonly onFail?: (error: Error) => void;
}

/**
 * Store state
 */
export interface WalletStateClient {
  // Data
  wallet: WalletInfo | null;
  config: WalletConfig;
  connection: anchor.web3.Connection;

  // Status
  isLoading: boolean;
  isConnecting: boolean;
  isSigning: boolean;
  error: Error | null;

  // State setters
  setConfig: (config: WalletConfig) => void;
  setWallet: (wallet: WalletInfo | null) => void;
  setLoading: (isLoading: boolean) => void;
  setConnecting: (isConnecting: boolean) => void;
  setSigning: (isSigning: boolean) => void;
  setConnection: (connection: anchor.web3.Connection) => void;
  setError: (error: Error | null) => void;
  clearError: () => void;

  // Actions
  connect: (options: ConnectOptions) => Promise<WalletInfo>;
  disconnect: () => Promise<void>;
  signMessage: (action: SmartWalletActionArgs, options: SignOptions) => Promise<void>;
}

/**
 * Hook interface
 */
export interface LazorWalletHook {
  smartWalletPubkey: anchor.web3.PublicKey | null;
  passkeyPubkey: number[] | null;
  isConnected: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  isSigning: boolean;
  error: Error | null;
  connection: anchor.web3.Connection;
  connect: (options: ConnectOptions) => Promise<WalletInfo>;
  disconnect: (options?: DisconnectOptions) => Promise<void>;
  signMessage: (action: SmartWalletActionArgs, options: SignOptions) => Promise<string>;
}

/**
 * Wallet Actions interface
 */
export interface WalletActions {
  saveWallet: (data: WalletInfo) => Promise<WalletInfo>;
  executeWallet: (
    data: WalletInfo,
    feePayer: anchor.web3.PublicKey,
    timestamp: anchor.BN,
    action: SmartWalletActionArgs,
    browserResult: BrowserResult,
    signOptions: SignOptions
  ) => Promise<Array<anchor.web3.VersionedTransaction>>;
}

/**
 * Error classes
 */
export class LazorKitError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'LazorKitError';
  }
}

export class WalletConnectionError extends LazorKitError {
  constructor(message: string) {
    super(message, 'WALLET_CONNECTION_ERROR');
    this.name = 'WalletConnectionError';
  }
}

export class SigningError extends LazorKitError {
  constructor(message: string) {
    super(message, 'SIGNING_ERROR');
    this.name = 'SigningError';
  }
}
