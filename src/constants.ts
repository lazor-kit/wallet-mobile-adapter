import * as anchor from '@coral-xyz/anchor';

// Network Configuration
export const DEFAULT_RPC_ENDPOINT = 'https://api.devnet.solana.com';
export const DEFAULT_COMMITMENT = 'confirmed' as anchor.web3.Commitment;

// Storage Keys
export const STORAGE_KEYS = {
  WALLET: 'lazor-wallet-storage',
  SETTINGS: 'lazor-settings',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  CONNECT: '?action=connect',
  SIGN: '?action=sign',
} as const;

export const DEFAULTS = {
  RPC_ENDPOINT: 'https://api.devnet.solana.com',
  IPFS_URL: 'https://portal.lazor.sh',
  PAYMASTER_URL: 'https://lazorkit-paymaster.onrender.com',
};
