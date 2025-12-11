/* 
  Paymaster service integration for Kora
  
  This module provides functions to interact with a paymaster service for
  fee payment in smart wallet transactions.
*/
import * as anchor from "@coral-xyz/anchor";

// Define return types based on Kora JSON-RPC API
interface JsonRpcResponse<T> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

interface PaymasterConfig {
  paymasterUrl: string;
  apiKey?: string;
}
/**
 * Helper function to make JSON-RPC requests to the paymaster service.
 * Handles headers, including optional API key auth.
 */
const rpcRequest = async <T>(
  method: string,
  params: any,
  paymasterUrl: string,
  apiKey?: string
): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const response = await fetch(paymasterUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC request failed with status ${response.status}`);
  }

  const json: JsonRpcResponse<T> = await response.json();

  if (json.error) {
    throw new Error(`RPC error: ${json.error.message}`);
  }

  if (!json.result) {
    throw new Error("RPC result is undefined");
  }

  return json.result;
};

/**
 * Retrieves the fee payer signer and payment destination from the paymaster.
 * 
 * @param paymasterUrl - URL of the paymaster service
 * @param apiKey - Optional API key for authentication
 * @returns PublicKey of the fee payer signer
 */
export const getFeePayer = async (paymasterUrl: string, apiKey?: string) => {
  interface GetPayerSignerResult {
    payment_address: string;
    signer_address: string;
  }

  const result = await rpcRequest<GetPayerSignerResult>(
    "getPayerSigner",
    [],
    paymasterUrl,
    apiKey
  );

  if (!result.signer_address) {
    throw new Error("Failed to get fee payer");
  }

  return new anchor.web3.PublicKey(result.signer_address);
};

/**
 * Signs and immediately broadcasts a transaction via the paymaster.
 * 
 * @param base64EncodedTransaction - The transaction to sign and send, encoded as base64
 * @param paymasterUrl - URL of the paymaster service
 * @param signerKey - The public key of the user signing the transaction
 * @param apiKey - Optional API key for authentication
 * @returns Transaction signature (txid)
 */
export const signAndExecuteTransaction = async (
  base64EncodedTransaction: string,
  paymasterUrl: string,
  signerKey: string,
  apiKey?: string
) => {
  interface SignAndSendResult {
    signature: string;
    signed_transaction: string;
    signer_pubkey: string;
  }
  const result = await rpcRequest<SignAndSendResult>(
    "signAndSendTransaction",
    {
      transaction: base64EncodedTransaction,
      signer_key: signerKey,
    },
    paymasterUrl,
    apiKey
  );

  if (!result.signature) {
    throw new Error("Failed to sign and execute transaction");
  }

  return result.signature;
};

/**
 * Signs a transaction with the paymaster's key but does NOT broadcast it.
 * Useful for inspecting the signed transaction before sending or for multi-sig flows.
 * 
 * @param base64EncodedTransaction - The transaction to sign, encoded as base64
 * @param paymasterUrl - URL of the paymaster service
 * @param signerKey - The public key of the user signing the transaction
 * @param apiKey - Optional API key for authentication
 * @returns Object containing the signature and the fully signed transaction (base64)
 */
export const signTransaction = async (
  base64EncodedTransaction: string,
  paymasterUrl: string,
  signerKey: string,
  apiKey?: string
) => {
  interface SignTransactionResult {
    signature: string;
    signed_transaction: string;
    signer_pubkey: string;
  }

  const result = await rpcRequest<SignTransactionResult>(
    "signTransaction",
    {
      transaction: base64EncodedTransaction,
      signer_key: signerKey,
    },
    paymasterUrl,
    apiKey
  );

  if (!result.signed_transaction) {
    throw new Error("Failed to sign transaction");
  }

  return {
    signature: result.signature,
    signed_transaction: result.signed_transaction
  };
};

/**
 * Retrieves the list of tokens supported by the paymaster for fee payment.
 * 
 * @param paymasterUrl - URL of the paymaster service
 * @param apiKey - Optional API key for authentication
 * @returns Array of supported token mint addresses
 */
export const getSupportedFeeTokens = async (
  paymasterUrl: string,
  apiKey?: string
) => {
  interface GetSupportedTokensResult {
    tokens: string[];
  }

  const result = await rpcRequest<GetSupportedTokensResult>(
    "getSupportedTokens",
    [],
    paymasterUrl,
    apiKey
  );

  if (!result.tokens) {
    throw new Error("Failed to get supported fee tokens");
  }

  return result.tokens;
};
