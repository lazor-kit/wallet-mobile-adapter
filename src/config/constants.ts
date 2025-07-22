import * as anchor from '@coral-xyz/anchor';

export const DEFAULT_COMMITMENT: anchor.web3.Commitment = 'confirmed';

export const STORAGE_KEYS = {
  WALLET: 'lazor-wallet-store',
} as const; 