/**
 * LazorKit Wallet Mobile Adapter - React Provider
 *
 * This file contains the React Provider component for LazorKit wallet integration.
 * It provides proper initialization of the store and React context.
 */

import * as anchor from '@coral-xyz/anchor';
import React, { useEffect, useMemo } from 'react';
import { useWalletStore } from './wallet-store';
import { logger } from './utils';
import { LazorKitWalletProviderProps } from './types';
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import { Text } from 'react-native';
import { DEFAULTS } from './config';

/**
 * Setup Buffer polyfill for React Native environment
 */
global.Buffer = Buffer;

Buffer.prototype.subarray = function subarray(begin: number | undefined, end: number | undefined) {
  try {
    const result = Uint8Array.prototype.subarray.apply(this, [begin, end]);
    Object.setPrototypeOf(result, Buffer.prototype); // Explicitly add the `Buffer` prototype (adds `readUIntLE`!)
    return result;
  } catch (error) {
    logger.error('Buffer subarray polyfill failed:', error, { begin, end });
    throw error;
  }
};

/**
 * LazorKit Wallet Provider component
 *
 * This provider initializes the wallet store with the given configuration
 * and sets up the Solana connection. The isDebug prop controls whether
 * debug logging is enabled throughout the SDK.
 */
export const LazorKitWalletProvider = ({
  rpcUrl = DEFAULTS.RPC_ENDPOINT,
  ipfsUrl = DEFAULTS.IPFS_URL,
  paymasterUrl = DEFAULTS.PAYMASTER_URL,
  isDebug = false,
  children,
}: LazorKitWalletProviderProps): React.JSX.Element => {
  const { setConnection, setConfig } = useWalletStore();

  // Set debug mode for logger
  useEffect(() => {
    logger.setDebugMode(isDebug);
    if (isDebug) {
      logger.info('Debug mode enabled for LazorKit SDK');
    }
  }, [isDebug]);

  const connection = useMemo(() => {
    try {
      logger.info('Creating Solana connection', { rpcUrl });
      const conn = new anchor.web3.Connection(rpcUrl!, 'confirmed');
      logger.info('Solana connection created successfully');
      return conn;
    } catch (error) {
      logger.error('Failed to create Solana connection:', error, { rpcUrl });
      // Fallback to default endpoint
      logger.warn('Falling back to default RPC endpoint');
      return new anchor.web3.Connection(DEFAULTS.RPC_ENDPOINT!, 'confirmed');
    }
  }, [rpcUrl]);

  useEffect(() => {
    try {
      logger.info('Initializing wallet store configuration', {
        rpcUrl,
        ipfsUrl,
        paymasterUrl,
        isDebug,
      });

      setConnection(connection);
      setConfig({ ipfsUrl, paymasterUrl, rpcUrl });

      logger.info('Wallet store configuration completed successfully');
    } catch (error) {
      logger.error('Failed to initialize wallet store:', error, {
        rpcUrl,
        ipfsUrl,
        paymasterUrl,
        isDebug,
      });
      // Don't throw here to prevent app crash, but log the error
    }
  }, [connection, ipfsUrl, paymasterUrl, rpcUrl, isDebug, setConnection, setConfig]);

  try {
    return <>{typeof children === 'string' ? <Text>{children}</Text> : children}</>;
  } catch (error) {
    logger.error('LazorKitWalletProvider render error:', error);
    return <Text>LazorKit Provider Error</Text>;
  }
};

/**
 * Export aliases for backwards compatibility
 */
export const LazorKitProvider = LazorKitWalletProvider;
