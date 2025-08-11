/**
 * LazorKit Wallet Mobile Adapter - Paymaster helpers
 *
 * Helper utilities to interact with LazorKit paymaster / relayer service.
 */

import * as anchor from '@coral-xyz/anchor';
import { logger } from './logger';

/**
 * Fetches the fee-payer public key from the paymaster service.
 */
export const getFeePayer = async (paymasterUrl: string): Promise<anchor.web3.PublicKey> => {
  try {
    const response = await fetch(paymasterUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getConfig',
        params: [],
      }),
    });

    if (!response.ok) {
      logger.error('Paymaster HTTP error:', response.status, response.statusText, { paymasterUrl });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data?.result?.fee_payer) {
      logger.error('Paymaster invalid response: missing feePayer field', { data, paymasterUrl });
      throw new Error('Invalid response: missing feePayer field');
    }

    return new anchor.web3.PublicKey(data.result.fee_payer);
  } catch (error) {
    logger.error('Failed to get fee payer from paymaster:', error, { paymasterUrl });
    throw new Error(`Failed to get fee payer from paymaster: ${error}`);
  }
};

interface SignAndSendParams {
  base64EncodedTransaction: string;
  relayerUrl: string;
}

/**
 * Sends a serialized transaction to the paymaster relayer for signing &
 * broadcasting. Returns the JSON-RPC response from the relayer.
 */
export const signAndSendTxn = async ({
  base64EncodedTransaction,
  relayerUrl,
}: SignAndSendParams) => {
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'signAndSendTransaction',
    params: [base64EncodedTransaction],
  };

  try {
    const response = await fetch(relayerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.error('Relayer HTTP error:', response.status, response.statusText, {
        relayerUrl,
        payload,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Relayer request failed:', error, { relayerUrl, payload });
    throw error;
  }
};
