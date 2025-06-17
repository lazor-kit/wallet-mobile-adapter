import React, { createContext, useEffect, useMemo } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { WalletService, BrowserService, StorageService, WalletConfig } from '../core/types';
import { LazorWalletService } from '../services/wallet.service';
import { ExpoBrowserService } from '../services/browser.service';
import { AsyncStorageService } from '../services/storage.service';
import { logger } from '../utils/logger';
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Ensure Buffer is available globally
global.Buffer = Buffer;

// Add subarray method if not available
if (!Buffer.prototype.subarray) {
  Buffer.prototype.subarray = function subarray(begin?: number, end?: number) {
    const result = Uint8Array.prototype.subarray.apply(this, [begin, end]);
    Object.setPrototypeOf(result, Buffer.prototype);
    return result;
  };
}

export interface LazorKitContextValue {
  walletService: WalletService;
  browserService: BrowserService;
  storageService: StorageService;
  connection: anchor.web3.Connection;
}

export const LazorKitContext = createContext<LazorKitContextValue | null>(null);

export interface LazorKitProviderProps {
  rpcUrl?: string;
  ipfsUrl?: string;
  paymasterUrl?: string;
  commitment?: anchor.web3.Commitment;
  children: React.ReactNode;
}

export const LazorKitProvider: React.FC<LazorKitProviderProps> = ({
  rpcUrl = 'https://api.devnet.solana.com',
  ipfsUrl = 'https://portal.lazor.sh',
  paymasterUrl = 'https://lazorkit-paymaster.onrender.com',
  commitment = 'confirmed',
  children,
}) => {
  // Create connection
  const connection = useMemo(
    () => new anchor.web3.Connection(rpcUrl, commitment),
    [rpcUrl, commitment]
  );

  // Create services
  const services = useMemo(() => {
    const config: WalletConfig = {
      ipfsUrl,
      paymasterUrl,
      rpcUrl,
    };

    const storageService = new AsyncStorageService();
    const browserService = new ExpoBrowserService();
    const walletService = new LazorWalletService(
      connection,
      browserService,
      storageService,
      config
    );

    return {
      walletService,
      browserService,
      storageService,
    };
  }, [connection, ipfsUrl, paymasterUrl, rpcUrl]);

  // Update wallet service config when props change
  useEffect(() => {
    const config: WalletConfig = {
      ipfsUrl,
      paymasterUrl,
      rpcUrl,
    };

    if ('updateConfig' in services.walletService) {
      (services.walletService as LazorWalletService).updateConfig(config);
    }
  }, [ipfsUrl, paymasterUrl, rpcUrl, services.walletService]);

  // Log provider initialization
  useEffect(() => {
    logger.info('LazorKit provider initialized', {
      rpcUrl,
      ipfsUrl,
      paymasterUrl,
      commitment,
    });
  }, [rpcUrl, ipfsUrl, paymasterUrl, commitment]);

  const contextValue: LazorKitContextValue = {
    ...services,
    connection,
  };

  return <LazorKitContext.Provider value={contextValue}>{children}</LazorKitContext.Provider>;
};
