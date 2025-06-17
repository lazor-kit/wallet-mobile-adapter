import { PublicKey } from '@solana/web3.js';
import { createError } from '../core/errors';
import { logger } from './logger';

/**
 * Get the fee payer public key from the paymaster service
 */
export async function getFeePayer(paymasterUrl: string): Promise<PublicKey> {
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
      throw createError.general(
        `Failed to fetch fee payer: ${response.statusText}`,
        'PAYMASTER_REQUEST_FAILED'
      );
    }

    const data = await response.json();
    const feePayerStr = data?.result?.fee_payer;

    if (!feePayerStr) {
      throw createError.general('fee_payer not found in response', 'PAYMASTER_INVALID_RESPONSE');
    }

    return new PublicKey(feePayerStr);
  } catch (error) {
    logger.error('Failed to get fee payer from paymaster', error);
    throw error;
  }
}

/**
 * Sign and send a transaction via the paymaster service
 */
export async function signAndSendTransaction(
  base64EncodedTransaction: string,
  paymasterUrl: string
): Promise<{ signature: string }> {
  try {
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'signAndSendTransaction',
      params: [base64EncodedTransaction],
    };

    const response = await fetch(paymasterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw createError.general(
        `Paymaster request failed: ${response.statusText}`,
        'PAYMASTER_REQUEST_FAILED'
      );
    }

    const data = await response.json();

    if (data.error) {
      throw createError.general(
        `Paymaster error: ${JSON.stringify(data.error)}`,
        'PAYMASTER_ERROR'
      );
    }

    if (!data.result?.signature) {
      throw createError.general('No signature in paymaster response', 'PAYMASTER_INVALID_RESPONSE');
    }

    return { signature: data.result.signature };
  } catch (error) {
    logger.error('Failed to sign and send transaction via paymaster', error);
    throw error;
  }
}
