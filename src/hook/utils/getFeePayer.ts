import { PublicKey } from '@solana/web3.js';

export async function getFeePayer(paymasterUrl: string): Promise<PublicKey> {
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
    throw new Error(`Failed to fetch fee payer: ${response.statusText}`);
  }

  const data = await response.json();
  const feePayerStr = data?.result?.fee_payer;
  if (!feePayerStr) {
    throw new Error('fee_payer not found in response');
  }

  return new PublicKey(feePayerStr);
} 