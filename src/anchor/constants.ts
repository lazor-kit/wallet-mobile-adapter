import { Buffer } from 'buffer';
import * as anchor from '@coral-xyz/anchor';

// lazorkit PROGRAM
export const SMART_WALLET_SEQ_SEED = Buffer.from('smart_wallet_seq');
export const SMART_WALLET_SEED = Buffer.from('smart_wallet');
export const SMART_WALLET_CONFIG_SEED = Buffer.from('smart_wallet_config');
export const CONFIG_SEED = Buffer.from('config');
export const SMART_WALLET_AUTHENTICATOR_SEED = Buffer.from('smart_wallet_authenticator');
export const WHITELIST_RULE_PROGRAMS_SEED = Buffer.from('whitelist_rule_programs');

export const RULE_SEED = Buffer.from('rule');

export const ADDRESS_LOOKUP_TABLE = new anchor.web3.PublicKey(
  '7Pr3DG7tRPAjVb44gqbxTj1KstikAuVZY7YmXdotVjLA'
);
