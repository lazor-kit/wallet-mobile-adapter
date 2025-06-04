import * as anchor from '@coral-xyz/anchor';

// App Configuration
export const APP_SCHEME = 'lazorkit';
export const APP_NAME = 'LazorKit';

// Network Configuration
export const DEFAULT_RPC_ENDPOINT = 'https://api.devnet.solana.com';
export const DEFAULT_COMMITMENT = 'confirmed' as anchor.web3.Commitment;

// Wallet Configuration
export const PAYER_PUBLICKEY = new anchor.web3.PublicKey(
  'hij78MKbJSSs15qvkHWTDCtnmba2c1W4r1V22g5sD8w'
);

// Storage Keys
export const STORAGE_KEYS = {
  WALLET: 'lazor-wallet-storage',
  SETTINGS: 'lazor-settings',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  CONNECT: 'https://portal.lazor.sh/connect',
  SIGN: 'https://portal.lazor.sh/sign',
} as const;
