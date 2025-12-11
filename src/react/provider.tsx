/**
 * LazorKit Wallet Mobile Adapter - React Provider
 */

import * as anchor from '@coral-xyz/anchor';
import React, { useEffect, useMemo } from 'react';
import { useWalletStore } from './store';
import { logger } from '../core/logger';
import { LazorKitProviderProps } from '../types';
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import { DEFAULTS } from '../config';

global.Buffer = Buffer;

Buffer.prototype.subarray = function subarray(begin: number | undefined, end: number | undefined) {
  try {
    const result = Uint8Array.prototype.subarray.apply(this, [begin, end]);
    Object.setPrototypeOf(result, Buffer.prototype);
    return result;
  } catch (error) {
    logger.error('Buffer subarray polyfill failed:', error, { begin, end });
    throw error;
  }
};

export const LazorKitProvider = ({
  rpcUrl = DEFAULTS.RPC_ENDPOINT,
  ipfsUrl = DEFAULTS.IPFS_URL,
  configPaymaster = {
    paymasterUrl: DEFAULTS.PAYMASTER_URL,
  },
  isDebug = false,
  children,
}: LazorKitProviderProps): React.JSX.Element => {
  const { setConnection, setConfig } = useWalletStore();

  useEffect(() => {
    logger.setDebugMode(isDebug);
    // Debug log removed
  }, [isDebug]);

  const connection = useMemo(() => {
    try {
      const conn = new anchor.web3.Connection(rpcUrl!, 'confirmed');
      return conn;
    } catch (error) {
      logger.error('Failed to create Solana connection:', error, { rpcUrl });
      // Warning log removed
      return new anchor.web3.Connection(DEFAULTS.RPC_ENDPOINT!, 'confirmed');
    }
  }, [rpcUrl]);

  useEffect(() => {
    try {
      // Debug log removed

      setConnection(connection);
      setConfig({
        ipfsUrl,
        configPaymaster: {
          paymasterUrl: configPaymaster.paymasterUrl,
        },
        rpcUrl
      });

      // Debug log removed
    } catch (error) {
      logger.error('Failed to initialize wallet store:', error, {
        rpcUrl,
        ipfsUrl,
        configPaymaster,
        isDebug,
      });
    }
  }, [connection, ipfsUrl, configPaymaster, rpcUrl, isDebug, setConnection, setConfig]);

  try {
    return <>{typeof children === 'string' ? <span>{children}</span> : children}</>;
  } catch (error) {
    logger.error('LazorKitProvider render error:', error);
    return <span>LazorKit Provider Error</span>;
  }
};
