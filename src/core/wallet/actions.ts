/**
 * LazorKit Wallet Mobile Adapter - Wallet Actions (core)
 *
 * Pure functions that interact with the LazorKit on-chain program. No React or
 * Zustand dependencies here. The consumer is expected to provide their own
 * loading state handler via callbacks.
 */

import * as anchor from '@coral-xyz/anchor';
import { WalletInfo, BrowserResult, WalletActions, SignOptions } from '../../types';
import {
  ArgsByAction,
  LazorkitClient,
  MessageArgs,
  SmartWalletAction,
} from '../../contract-integration';
import { getFeePayer, signAndSendTxn } from '../paymaster';
import { logger } from '../logger';

/**
 * Factory that returns high-level wallet operations bound to a given
 * Connection and loading-state setter.
 */
export const createWalletActions = (
  connection: anchor.web3.Connection,
  setLoading: (isLoading: boolean) => void,
  config: { paymasterUrl: string }
): WalletActions => {
  const lazorProgram = new LazorkitClient(connection);

  /**
   * Ensures the smart wallet exists on-chain, creating it if needed.
   */
  const saveWallet = async (data: WalletInfo): Promise<WalletInfo> => {
    setLoading(true);

    try {
      // Debug log removed
      let { smartWallet, smartWalletAuthenticator } = await lazorProgram.getSmartWalletByPasskey(
        data.passkeyPubkey
      );

      if (!smartWallet || !smartWalletAuthenticator) {
        // Debug log removed

        const feePayer = await getFeePayer(config.paymasterUrl);

        const result = await lazorProgram.createSmartWalletTx({
          passkeyPubkey: data.passkeyPubkey,
          payer: feePayer,
          credentialIdBase64: data.credentialId,
        });

        const serialized = result.transaction
          .serialize({ verifySignatures: false, requireAllSignatures: false })
          .toString('base64');

        const { result: sendResult, error: sendError } = await signAndSendTxn({
          base64EncodedTransaction: serialized,
          relayerUrl: config.paymasterUrl,
        });

        if (sendError) {
          logger.error('Create wallet relayer error:', sendError, {
            paymasterUrl: config.paymasterUrl,
          });
          throw new Error(`Create wallet relayer error: ${JSON.stringify(sendError)}`);
        }

        await lazorProgram.connection.confirmTransaction(String(sendResult.signature), 'confirmed');

        const fetched = await lazorProgram.getSmartWalletByPasskey(data.passkeyPubkey);
        smartWallet = fetched.smartWallet;
        smartWalletAuthenticator = fetched.smartWalletAuthenticator;

        if (!smartWallet || !smartWalletAuthenticator) {
          logger.error('Failed to create smart wallet on chain after transaction confirmed', {
            signature: sendResult.signature,
            passkeyPubkey: data.passkeyPubkey,
          });
          throw new Error('Failed to create smart wallet on chain');
        }
      }

      // Return the enriched WalletInfo
      return {
        ...data,
        smartWallet: smartWallet.toString(),
        smartWalletAuthenticator: smartWalletAuthenticator.toString(),
      };
    } catch (error) {
      logger.error('SaveWallet action failed:', error, { walletData: data });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Executes a wallet instruction through the LazorKit program using WebAuthn
   * signature pieces provided by the browser flow.
   */
  const executeWallet = async (
    data: WalletInfo,
    feePayer: anchor.web3.PublicKey,
    action: MessageArgs,
    browserResult: BrowserResult,
    _options: SignOptions
  ): Promise<Array<anchor.web3.VersionedTransaction>> => {
    setLoading(true);
    try {
      switch (action.type) {
        case SmartWalletAction.ExecuteTx: {
          const { ruleInstruction, cpiInstruction } =
            action.args as ArgsByAction[SmartWalletAction.ExecuteTx];

          const executeTransaction = await lazorProgram.executeTxnDirectTx({
            passkeyPubkey: data.passkeyPubkey,
            smartWallet: new anchor.web3.PublicKey(data.smartWallet),
            clientDataJsonRaw64: browserResult.clientDataJsonBase64,
            authenticatorDataRaw64: browserResult.authenticatorDataBase64,
            signature64: browserResult.signature,
            payer: feePayer,
            cpiInstruction,
            ruleInstruction,
          });
          if (true) {
            const commitCpiTx = await lazorProgram.commitCpiTx({
              passkeyPubkey: data.passkeyPubkey,
              smartWallet: new anchor.web3.PublicKey(data.smartWallet),
              clientDataJsonRaw64: browserResult.clientDataJsonBase64,
              authenticatorDataRaw64: browserResult.authenticatorDataBase64,
              signature64: browserResult.signature,
              payer: feePayer,
              ruleInstruction,
              expiresAt: Math.floor(Date.now() / 1000) + 30,
            });

            const executeCommitedTx = await lazorProgram.executeCommitedTx({
              payer: feePayer,
              smartWallet: new anchor.web3.PublicKey(data.smartWallet),
              cpiInstruction,
            });

            return [commitCpiTx, executeCommitedTx];
          }
        }
        case SmartWalletAction.CallRule: {
          return [];
        }
        case SmartWalletAction.ChangeRule: {
          return [];
        }
        default:
          throw Error('Execute wallet is error');
      }

      // // Debug log removed

      // const serialized = executeTransaction
      //   .serialize({
      //     verifySignatures: false,
      //     requireAllSignatures: false,
      //   })
      //   .toString('base64');

      // const { result: sendResult, error: sendError } = await signAndSendTxn({
      //   base64EncodedTransaction: serialized,
      //   relayerUrl: config.paymasterUrl,
      // });

      // if (sendError) {
      //   logger.error('Execute wallet relayer error:', sendError, {
      //     paymasterUrl: config.paymasterUrl,
      //     smartWallet: data.smartWallet,
      //   });
      //   throw new Error(`Execute wallet relayer error: ${JSON.stringify(sendError)}`);
      // }

      // await lazorProgram.connection.confirmTransaction(String(sendResult.signature), 'confirmed');

      // return sendResult.signature;
    } catch (error: unknown) {
      logger.error('ExecuteWallet action failed:', error, {
        smartWallet: data.smartWallet,
      });
      const err = error instanceof Error ? error : new Error(String(error));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveWallet,
    executeWallet,
  };
};
