/**
 * LazorKit Wallet Mobile Adapter - Configuration Constants
 *
 * This file contains all configuration constants, default values, and API endpoints
 * used throughout the LazorKit wallet adapter. These values can be overridden via
 * the provider configuration.
 */

import * as anchor from '@coral-xyz/anchor';

/**
 * Default RPC commitment level for Solana transactions
 * 'confirmed' provides a good balance between speed and security
 */
export const DEFAULT_COMMITMENT: anchor.web3.Commitment = 'confirmed';

/**
 * Default configuration values for LazorKit services
 * These can be overridden when initializing the LazorKitProvider
 */
export const DEFAULTS = {
  /** LazorKit portal URL for authentication and signing flows */
  IPFS_URL: 'https://portal.lazor.sh',

  /** Paymaster service URL for transaction fee sponsorship */
  PAYMASTER_URL: 'https://lazorkit-paymaster.onrender.com',

  /** Default Solana RPC endpoint (Devnet) */
  RPC_ENDPOINT: 'https://api.devnet.solana.com',
} as const;

/**
 * API endpoints for LazorKit portal interactions
 * These are appended to the IPFS_URL to create full URLs
 */
export const API_ENDPOINTS = {
  CONNECT: '?action=connect',
  SIGN: '?action=sign',
} as const;

/**
 * Storage keys used for persisting data in AsyncStorage
 * Prefixed with 'lazor-' to avoid conflicts with other apps
 */
export const STORAGE_KEYS = {
  /** Key for storing wallet information and state */
  WALLET: 'lazor-wallet-store',
} as const;


