import * as anchor from '@coral-xyz/anchor';

import { Lazorkit } from './lazorkit';

export type CpiData = anchor.IdlTypes<Lazorkit>['cpiData'];
export type SmartWalletSeq = anchor.IdlTypes<Lazorkit>['smartWalletSeq'];
export type SmartWalletConfig = anchor.IdlTypes<Lazorkit>['smartWalletConfig'];
export type SmartWalletAuthenticator = anchor.IdlTypes<Lazorkit>['smartWalletAuthenticator'];