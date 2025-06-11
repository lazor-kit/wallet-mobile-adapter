import * as anchor from '@coral-xyz/anchor';
import { LazorKitProgram } from '../../anchor/interface/lazorkit';
import { WalletInfo, BrowserResult } from '../types';
import { logger } from '../utils/logger';
import { getFeePayer } from '../utils/getFeePayer';

// Helper function for signing and sending transactions
async function signAndSendTxn({
  base64EncodedTransaction,
  relayerUrl,
}: {
  base64EncodedTransaction: string;
  relayerUrl: string;
}) {
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

    const data = await response.json();
    console.log('Response:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// The actions that can be performed on a wallet
export type WalletActions = {
  saveWallet: (data: WalletInfo) => Promise<WalletInfo>;
  executeWallet: (
    data: WalletInfo,
    browserResult: BrowserResult,
    txnIns: anchor.web3.TransactionInstruction
  ) => Promise<string>;
};

// Creates a new set of wallet actions
export const createWalletActions = (
  connection: anchor.web3.Connection,
  setLoading: (isLoading: boolean) => void,
  config: { paymasterUrl: string }
): WalletActions => {
  const lazorProgram = new LazorKitProgram(connection);

  const saveWallet = async (data: WalletInfo): Promise<WalletInfo> => {
    setLoading(true);

    try {
      let { smartWallet, smartWalletAuthenticator } =
        await lazorProgram.getSmartWalletByPasskey(data.passkeyPubkey);

      if (!smartWallet || !smartWalletAuthenticator) {
        logger.log('💡 SmartWallet missing; creating a new one...');

        const feePayer = await getFeePayer(config.paymasterUrl);

        const createTxn = await lazorProgram.createSmartWalletTxn(
          data.passkeyPubkey,
          null,
          feePayer
        );

        const serialized = createTxn
          .serialize({ verifySignatures: false, requireAllSignatures: false })
          .toString('base64');

        const { result: sendResult, error: sendError } = await signAndSendTxn({
          base64EncodedTransaction: serialized,
          relayerUrl: config.paymasterUrl,
        });

        if (sendError) {
          throw new Error(
            `Create wallet relayer error: ${JSON.stringify(sendError)}`
          );
        }

        await lazorProgram.connection.confirmTransaction(
          String(sendResult.signature),
          'confirmed'
        );

        const fetched = await lazorProgram.getSmartWalletByPasskey(
          data.passkeyPubkey
        );
        smartWallet = fetched.smartWallet;
        smartWalletAuthenticator = fetched.smartWalletAuthenticator;

        if (!smartWallet || !smartWalletAuthenticator) {
          throw new Error('Failed to create smart wallet on chain');
        }
      }

      return {
        ...data,
        smartWallet: smartWallet.toString(),
        smartWalletAuthenticator: smartWalletAuthenticator.toString(),
      };
    } finally {
      setLoading(false);
    }
  };

  const executeWallet = async (
    data: WalletInfo,
    browserResult: BrowserResult,
    txnIns: anchor.web3.TransactionInstruction
  ): Promise<string> => {
    setLoading(true);

    try {
      const feePayer = await getFeePayer(config.paymasterUrl);

      const executeTransaction = await lazorProgram.executeInstructionTxn(
        data.passkeyPubkey,
        Buffer.from(browserResult.clientDataJsonBase64, 'base64'),
        Buffer.from(browserResult.authenticatorDataBase64, 'base64'),
        Buffer.from(browserResult.signature, 'base64'),
        feePayer,
        new anchor.web3.PublicKey(data.smartWallet),
        null, // ruleInstruction
        txnIns // cpiInstruction
      );

      const serialized = executeTransaction
        .serialize({ verifySignatures: false, requireAllSignatures: false })
        .toString('base64');

      const { result: sendResult, error: sendError } = await signAndSendTxn({
        base64EncodedTransaction: serialized,
        relayerUrl: config.paymasterUrl,
      });

      if (sendError) {
        throw new Error(
          `Execute wallet relayer error: ${JSON.stringify(sendError)}`
        );
      }

      await lazorProgram.connection.confirmTransaction(
        String(sendResult.signature),
        'confirmed'
      );

      return sendResult.signature;
    } catch (error: any) {
      logger.error('Error executing wallet action:', error);
      throw new Error(`Failed to execute wallet action: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    saveWallet,
    executeWallet,
  };
}; 