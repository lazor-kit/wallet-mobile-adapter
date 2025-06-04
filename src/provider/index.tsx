import * as anchor from '@coral-xyz/anchor';
import React, { useEffect } from 'react';
import { useWalletStore } from '../hook/store/walletStore';
import { logger } from '../hook/utils/logger';
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
import { Text } from 'react-native';

type LazorWalletProviderProps = {
  connection: anchor.web3.Connection;
  children: React.ReactNode;
};

global.Buffer = Buffer;

Buffer.prototype.subarray = function subarray(begin: number | undefined, end: number | undefined) {
  const result = Uint8Array.prototype.subarray.apply(this, [begin, end]);
  Object.setPrototypeOf(result, Buffer.prototype); // Explicitly add the `Buffer` prototype (adds `readUIntLE`!)
  return result;
};

export const LazorWalletProvider: React.FC<LazorWalletProviderProps> = ({
  connection,
  children,
}) => {
  const setConnection = useWalletStore((state) => state.setConnection);

  useEffect(() => {
    logger.info('Setting connection in wallet store');
    setConnection(connection);
  }, [connection, setConnection]);

  return <>{typeof children === 'string' ? <Text>{children}</Text> : children}</>;
};
