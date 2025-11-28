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
  SmartWalletActionArgs,
  SmartWalletAction,
  asCredentialHash,
  asPasskeyPublicKey
} from '../../contract';
import { getFeePayer, signAndSendTxn } from '../paymaster';
import { logger } from '../logger';
import { sha256 } from 'js-sha256';

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
      // Compute credential hash
      const credentialHash = asCredentialHash(
        Array.from(
          new Uint8Array(
            sha256.arrayBuffer(Buffer.from(data.credentialId, 'base64'))
          )
        )
      );

      // Fetch initial wallet state
      let walletState = await lazorProgram.getSmartWalletByCredentialHash(credentialHash);

      let smartWallet: anchor.web3.PublicKey | undefined;
      let walletDevice: anchor.web3.PublicKey | undefined;

      if (!walletState) {
        // === Create new smart wallet on chain ===

        const feePayer = await getFeePayer(config.paymasterUrl);

        const result = await lazorProgram.createSmartWalletTxn({
          passkeyPublicKey: asPasskeyPublicKey(data.passkeyPubkey),
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

        await lazorProgram.connection.confirmTransaction(
          String(sendResult.signature),
          'confirmed'
        );

        walletState = await lazorProgram.getSmartWalletByCredentialHash(credentialHash);

        if (!walletState) {
          logger.error(
            'Failed to create smart wallet on chain after transaction confirmed',
            {
              signature: sendResult.signature,
              passkeyPubkey: data.passkeyPubkey,
            }
          );
          throw new Error('Failed to create smart wallet on chain');
        }
      }

      smartWallet = walletState.smartWallet;
      walletDevice = walletState.walletDevice;

      if (!smartWallet || !walletDevice) {
        throw new Error('Smart wallet or wallet device is undefined after processing.');
      }

      return {
        ...data,
        smartWallet: smartWallet.toString(),
        walletDevice: walletDevice.toString(),
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
    timestamp: anchor.BN,
    action: SmartWalletActionArgs,
    browserResult: BrowserResult,
    _options: SignOptions
  ): Promise<Array<anchor.web3.VersionedTransaction>> => {
    setLoading(true);
    const credentialHash = asCredentialHash(
      Array.from(
        new Uint8Array(
          sha256.arrayBuffer(Buffer.from(data.credentialId, 'base64'))
        )
      )
    );
    try {
      switch (action.type) {
        case SmartWalletAction.Execute: {
          const { policyInstruction, cpiInstruction } =
            action.args as ArgsByAction[SmartWalletAction.Execute];

          const executeTransaction = await lazorProgram.executeTxn({
            payer: feePayer,
            smartWallet: new anchor.web3.PublicKey(data.smartWallet),
            passkeySignature: {
              passkeyPublicKey: asPasskeyPublicKey(data.passkeyPubkey),
              signature64: browserResult.signature,
              clientDataJsonRaw64: browserResult.clientDataJsonBase64,
              authenticatorDataRaw64: browserResult.authenticatorDataBase64,
            },
            policyInstruction,
            cpiInstruction,
            timestamp,
            credentialHash,
          });
          return [executeTransaction as anchor.web3.VersionedTransaction];
        }
        case SmartWalletAction.CreateChunk: {
          const { policyInstruction, cpiInstructions } =
            action.args as ArgsByAction[SmartWalletAction.CreateChunk];

          const createChunkTransaction = await lazorProgram.createChunkTxn({
            payer: feePayer,
            smartWallet: new anchor.web3.PublicKey(data.smartWallet),
            passkeySignature: {
              passkeyPublicKey: asPasskeyPublicKey(data.passkeyPubkey),
              signature64: browserResult.signature,
              clientDataJsonRaw64: browserResult.clientDataJsonBase64,
              authenticatorDataRaw64: browserResult.authenticatorDataBase64,
            },
            policyInstruction,
            cpiInstructions,
            timestamp,
            credentialHash,
          });
          return [createChunkTransaction as anchor.web3.VersionedTransaction];
        }
        default:
          throw Error('Execute wallet is error');
      }
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
