import * as anchor from '@coral-xyz/anchor';
import React, { useEffect, useMemo } from 'react';
import { useWalletStore } from '../hook/store/walletStore';
import { logger } from '../hook/utils/logger';
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import { Text } from 'react-native';
import { DEFAULTS } from '../constants';

type LazorKitWalletProviderProps = {
  rpcUrl?: string;
  ipfsUrl?: string;
  paymasterUrl?: string;
  children: React.ReactNode;
};

global.Buffer = Buffer;

Buffer.prototype.subarray = function subarray(begin: number | undefined, end: number | undefined) {
  const result = Uint8Array.prototype.subarray.apply(this, [begin, end]);
  Object.setPrototypeOf(result, Buffer.prototype); // Explicitly add the `Buffer` prototype (adds `readUIntLE`!)
  return result;
};

export const LazorKitWalletProvider: React.FC<LazorKitWalletProviderProps> = ({
  rpcUrl = DEFAULTS.RPC_ENDPOINT,
  ipfsUrl = DEFAULTS.IPFS_URL,
  paymasterUrl = DEFAULTS.PAYMASTER_URL,
  children,
}) => {
  const { setConnection, setConfig } = useWalletStore();

  const connection = useMemo(() => new anchor.web3.Connection(rpcUrl, 'confirmed'), [rpcUrl]);

  useEffect(() => {
    logger.info('Setting connection and config in wallet store');
    setConnection(connection);
    setConfig({ ipfsUrl, paymasterUrl });
  }, [connection, ipfsUrl, paymasterUrl, setConnection, setConfig]);

  return <>{typeof children === 'string' ? <Text>{children}</Text> : children}</>;
};
