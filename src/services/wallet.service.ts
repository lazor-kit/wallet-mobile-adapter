import * as anchor from '@coral-xyz/anchor';
import {
  WalletService,
  WalletInfo,
  ConnectOptions,
  SignOptions,
  BrowserService,
  StorageService,
  WalletConfig,
  BrowserResult,
} from '../core/types';
import { createError, handleError } from '../core/errors';
import { logger } from '../utils/logger';
import { LazorKitProgram } from '../anchor/interface/lazorkit';
import { API_ENDPOINTS } from '../constants';
import { getFeePayer, signAndSendTransaction } from '../utils/paymaster';

export class LazorWalletService implements WalletService {
  private wallet: WalletInfo | null = null;
  private config: WalletConfig;
  private lazorProgram: LazorKitProgram;

  constructor(
    private readonly connection: anchor.web3.Connection,
    private readonly browserService: BrowserService,
    private readonly storageService: StorageService,
    config: WalletConfig
  ) {
    this.config = config;
    this.lazorProgram = new LazorKitProgram(connection);
    this.loadWalletFromStorage();
  }

  async connect(options: ConnectOptions): Promise<WalletInfo> {
    try {
      logger.info('Starting wallet connection');

      if (this.wallet) {
        logger.info('Wallet already connected');
        return this.wallet;
      }

      const connectUrl = this.buildConnectUrl(options.redirectUrl);
      const resultUrl = await this.browserService.openAuthBrowser(connectUrl, options.redirectUrl);

      const walletInfo = this.browserService.parseAuthRedirect(resultUrl);
      if (!walletInfo) {
        throw createError.walletConnection(
          'Invalid wallet information received from authentication'
        );
      }

      await this.saveWallet(walletInfo);
      logger.info('Wallet connected successfully');

      return walletInfo;
    } catch (error) {
      logger.error('Failed to connect wallet', error);
      throw handleError(error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      logger.info('Disconnecting wallet');

      await this.storageService.removeWallet();
      this.wallet = null;

      logger.info('Wallet disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect wallet', error);
      throw handleError(error);
    }
  }

  async signTransaction(
    transaction: anchor.web3.TransactionInstruction,
    options: SignOptions
  ): Promise<string> {
    try {
      if (!this.wallet) {
        throw createError.walletNotConnected();
      }

      logger.info('Starting transaction signing');

      // Get message to sign
      const message = await this.lazorProgram.getMessage(this.wallet.smartWallet);
      const encodedChallenge = this.encodeChallenge(message);

      // Build sign URL
      const signUrl = this.buildSignUrl(encodedChallenge, options.redirectUrl);

      // Execute signing flow
      return new Promise((resolve, reject) => {
        this.browserService.openSignBrowser(
          signUrl,
          options.redirectUrl,
          async (resultUrl) => {
            try {
              const browserResult = this.browserService.parseBrowserResult(resultUrl);
              const signature = await this.executeTransaction(browserResult, transaction);

              logger.info('Transaction signed successfully', { signature });
              resolve(signature);
            } catch (error) {
              logger.error('Failed to execute transaction', error);
              reject(handleError(error));
            }
          },
          (error) => {
            logger.error('Browser signing failed', error);
            reject(handleError(error));
          }
        );
      });
    } catch (error) {
      logger.error('Failed to sign transaction', error);
      throw handleError(error);
    }
  }

  isConnected(): boolean {
    return this.wallet !== null;
  }

  getWalletInfo(): WalletInfo | null {
    return this.wallet;
  }

  getSmartWalletPubkey(): anchor.web3.PublicKey | null {
    if (!this.wallet) return null;

    try {
      return new anchor.web3.PublicKey(this.wallet.smartWallet);
    } catch (error) {
      logger.error('Failed to parse smart wallet public key', error);
      return null;
    }
  }

  updateConfig(config: WalletConfig): void {
    this.config = config;
  }

  private async loadWalletFromStorage(): Promise<void> {
    try {
      this.wallet = await this.storageService.getWallet();
      if (this.wallet) {
        logger.info('Wallet loaded from storage');
      }
    } catch (error) {
      logger.error('Failed to load wallet from storage', error);
      // Don't throw - this is not critical for initialization
    }
  }

  private async saveWallet(walletInfo: WalletInfo): Promise<void> {
    try {
      // Check if smart wallet already exists on chain
      let { smartWallet, smartWalletAuthenticator } =
        await this.lazorProgram.getSmartWalletByPasskey(walletInfo.passkeyPubkey);

      if (!smartWallet || !smartWalletAuthenticator) {
        logger.info('Smart wallet not found on chain, creating new one');

        // Get fee payer from paymaster
        const feePayer = await getFeePayer(this.config.paymasterUrl);

        // Create smart wallet transaction
        const createTxn = await this.lazorProgram.createSmartWalletTxn(
          walletInfo.passkeyPubkey,
          null,
          feePayer,
          walletInfo.credentialId
        );

        // Serialize and send transaction
        const serialized = createTxn
          .serialize({ verifySignatures: false, requireAllSignatures: false })
          .toString('base64');

        const result = await signAndSendTransaction(serialized, this.config.paymasterUrl);

        // Wait for confirmation
        await this.connection.confirmTransaction(result.signature, 'confirmed');

        // Fetch the created smart wallet
        const fetched = await this.lazorProgram.getSmartWalletByPasskey(walletInfo.passkeyPubkey);
        smartWallet = fetched.smartWallet;
        smartWalletAuthenticator = fetched.smartWalletAuthenticator;

        if (!smartWallet || !smartWalletAuthenticator) {
          throw createError.walletConnection('Failed to create smart wallet on chain');
        }

        logger.info('Smart wallet created successfully', {
          smartWallet: smartWallet.toString(),
          signature: result.signature,
        });
      }

      // Update wallet info with actual addresses
      const finalWalletInfo = {
        ...walletInfo,
        smartWallet: smartWallet.toString(),
        smartWalletAuthenticator: smartWalletAuthenticator.toString(),
      };

      await this.storageService.saveWallet(finalWalletInfo);
      this.wallet = finalWalletInfo;
    } catch (error) {
      logger.error('Failed to save wallet', error);
      throw handleError(error);
    }
  }

  private buildConnectUrl(redirectUrl: string): string {
    const encodedRedirectUrl = encodeURIComponent(redirectUrl);
    return `${this.config.ipfsUrl}/${API_ENDPOINTS.CONNECT}&redirect_url=${encodedRedirectUrl}`;
  }

  private buildSignUrl(encodedChallenge: string, redirectUrl: string): string {
    const encodedRedirectUrl = encodeURIComponent(redirectUrl);
    const encodedMessage = encodeURIComponent(encodedChallenge);
    return `${this.config.ipfsUrl}/${API_ENDPOINTS.SIGN}&message=${encodedMessage}&redirect_url=${encodedRedirectUrl}`;
  }

  private encodeChallenge(message: Buffer): string {
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private async executeTransaction(
    browserResult: BrowserResult,
    transaction: anchor.web3.TransactionInstruction
  ): Promise<string> {
    if (!this.wallet) {
      throw createError.walletNotConnected();
    }

    try {
      // Get fee payer from paymaster
      const feePayer = await getFeePayer(this.config.paymasterUrl);

      // Create execution transaction
      const executeTransaction = await this.lazorProgram.executeInstructionTxn(
        this.wallet.passkeyPubkey,
        Buffer.from(browserResult.clientDataJsonBase64, 'base64'),
        Buffer.from(browserResult.authenticatorDataBase64, 'base64'),
        Buffer.from(browserResult.signature, 'base64'),
        feePayer,
        new anchor.web3.PublicKey(this.wallet.smartWallet),
        null, // ruleInstruction
        transaction // cpiInstruction
      );

      // Serialize and send transaction
      const serialized = executeTransaction
        .serialize({ verifySignatures: false, requireAllSignatures: false })
        .toString('base64');

      const result = await signAndSendTransaction(serialized, this.config.paymasterUrl);

      // Wait for confirmation
      await this.connection.confirmTransaction(result.signature, 'confirmed');

      logger.info('Transaction executed successfully', { signature: result.signature });
      return result.signature;
    } catch (error) {
      logger.error('Failed to execute transaction', error);
      throw createError.signing('Failed to execute transaction', error);
    }
  }
}
