import * as anchor from '@coral-xyz/anchor';

import { Lazorkit } from './lazorkit';

// Account types
export type SmartWalletConfig = anchor.IdlTypes<Lazorkit>['smartWalletConfig'];
export type SmartWalletAuthenticator = anchor.IdlTypes<Lazorkit>['smartWalletAuthenticator'];
export type Config = anchor.IdlTypes<Lazorkit>['config'];
export type WhitelistRulePrograms = anchor.IdlTypes<Lazorkit>['whitelistRulePrograms'];

// Enum types
export type UpdateConfigType = anchor.IdlTypes<Lazorkit>['updateConfigType'];
export type ExecuteActionType = anchor.IdlTypes<Lazorkit>['action'];

// Action constants
export const ExecuteAction = {
  ExecuteTx: { executeTx: {} },
  ChangeRuleProgram: { changeRuleProgram: {} },
  CallRuleProgram: { callRuleProgram: {} },
};
