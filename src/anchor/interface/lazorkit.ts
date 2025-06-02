import * as anchor from '@coral-xyz/anchor';
import * as bs58 from 'bs58';
import * as constants from '../constants';
import IDL from '../idl/lazorkit.json';
import { Lazorkit } from '../types/lazorkit';
import * as types from '../types';
import {
  createSecp256r1Instruction,
  getBlockhash,
  hashSeeds,
  signAndSendTxn,
} from '../utils';
import { DefaultRuleProgram } from './default_rule';
// Polyfill for structuredClone if not available (for React Native/Expo)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

export class LazorKitProgram {
  readonly connection: anchor.web3.Connection;
  readonly Idl: anchor.Idl = IDL as Lazorkit;
  readonly defaultRuleProgram: DefaultRuleProgram;

  constructor(connection: anchor.web3.Connection) {
    this.connection = connection;
    this.defaultRuleProgram = new DefaultRuleProgram(connection);
  }

  get program(): anchor.Program<Lazorkit> {
    return new anchor.Program(this.Idl, { connection: this.connection });
  }

  get programId(): anchor.web3.PublicKey {
    return this.program.programId;
  }

  get smartWalletSeq(): anchor.web3.PublicKey {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [constants.SMART_WALLET_SEQ_SEED],
      this.programId
    )[0];
  }

  get smartWalletSeqData(): Promise<types.SmartWalletSeq> {
    return this.program.account.smartWalletSeq.fetch(this.smartWalletSeq);
  }

  async getLastestSmartWallet(): Promise<anchor.web3.PublicKey> {
    const seqData = await this.program.account.smartWalletSeq.fetch(
      this.smartWalletSeq
    );
    return anchor.web3.PublicKey.findProgramAddressSync(
      [constants.SMART_WALLET_SEED, seqData.seq.toArrayLike(Buffer, 'le', 8)],
      this.programId
    )[0];
  }

  async getSmartWalletConfigData(
    smartWallet: anchor.web3.PublicKey
  ): Promise<types.SmartWalletConfig> {
    return this.program.account.smartWalletConfig.fetch(
      this.smartWalletConfig(smartWallet)
    );
  }

  smartWalletAuthenticator(
    passkey: number[],
    smartWallet: anchor.web3.PublicKey
  ): [anchor.web3.PublicKey, number] {
    const hash = hashSeeds(passkey, smartWallet);
    return anchor.web3.PublicKey.findProgramAddressSync([hash], this.programId);
  }

  async getSmartWalletAuthenticatorData(
    smartWalletAuthenticator: anchor.web3.PublicKey
  ): Promise<types.SmartWalletAuthenticator> {
    return this.program.account.smartWalletAuthenticator.fetch(
      smartWalletAuthenticator
    );
  }

  smartWalletConfig(smartWallet: anchor.web3.PublicKey): anchor.web3.PublicKey {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [constants.SMART_WALLET_CONFIG_SEED, smartWallet.toBuffer()],
      this.programId
    )[0];
  }

  get whitelistRulePrograms(): anchor.web3.PublicKey {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [constants.WHITELIST_RULE_PROGRAMS_SEED],
      this.programId
    )[0];
  }

  get config(): anchor.web3.PublicKey {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [constants.CONFIG_SEED],
      this.programId
    )[0];
  }

  async initializeTxn(
    payer: anchor.web3.PublicKey,
    defaultRuleProgram: anchor.web3.PublicKey
  ): Promise<anchor.web3.Transaction> {
    const ix = await this.program.methods
      .initialize()
      .accountsPartial({
        signer: payer,
        config: this.config,
        whitelistRulePrograms: this.whitelistRulePrograms,
        smartWalletSeq: this.smartWalletSeq,
        defaultRuleProgram,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .remainingAccounts([
        {
          pubkey: anchor.web3.BPF_LOADER_PROGRAM_ID,
          isWritable: false,
          isSigner: false,
        },
      ])
      .instruction();
    return new anchor.web3.Transaction().add(ix);
  }

  async upsertWhitelistRuleProgramsTxn(
    payer: anchor.web3.PublicKey,
    ruleProgram: anchor.web3.PublicKey
  ): Promise<anchor.web3.Transaction> {
    const ix = await this.program.methods
      .upsertWhitelistRulePrograms(ruleProgram)
      .accountsPartial({
        signer: payer,
        whitelistRulePrograms: this.whitelistRulePrograms,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction();
    return new anchor.web3.Transaction().add(ix);
  }

  async createSmartWalletTxn(
    passkeyPubkey: number[],
    ruleIns: anchor.web3.TransactionInstruction | null,
    payer: anchor.web3.PublicKey
  ): Promise<anchor.web3.Transaction> {
    const configData = await this.program.account.config.fetch(this.config);
    const smartWallet = await this.getLastestSmartWallet();

    const depositSolIns = anchor.web3.SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: smartWallet,
      lamports: 10000000,
    });
    const transactiondesposit = new anchor.web3.Transaction().add(
      depositSolIns
    );
    const blockhash = await getBlockhash();
    transactiondesposit.recentBlockhash = blockhash;
    transactiondesposit.feePayer = payer;
    const result = await signAndSendTxn({
      base64EncodedTransaction: transactiondesposit
        .serialize({ verifySignatures: false, requireAllSignatures: false })
        .toString('base64'),
      relayerUrl: 'https://lazorkit-paymaster.onrender.com',
    });

    const [smartWalletAuthenticator] = this.smartWalletAuthenticator(
      passkeyPubkey,
      smartWallet
    );
    const ruleInstruction =
      ruleIns ||
      (await this.defaultRuleProgram.initRuleIns(
        payer,
        smartWallet,
        smartWalletAuthenticator
      ));

    const remainingAccounts = ruleInstruction.keys.map((account) => ({
      pubkey: account.pubkey,
      isSigner: account.pubkey.equals(payer),
      isWritable: account.isWritable,
    }));

    const createSmartWalletIx = await this.program.methods
      .createSmartWallet(passkeyPubkey, ruleInstruction.data)
      .accountsPartial({
        signer: payer,
        smartWalletSeq: this.smartWalletSeq,
        whitelistRulePrograms: this.whitelistRulePrograms,
        smartWallet,
        smartWalletConfig: this.smartWalletConfig(smartWallet),
        smartWalletAuthenticator,
        config: this.config,
        defaultRuleProgram: configData.defaultRuleProgram,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();

    const tx = new anchor.web3.Transaction().add(createSmartWalletIx);
    tx.feePayer = payer;
    tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    return tx;
  }

  async executeInstructionTxn(
    passkeyPubkey: number[],
    message: Buffer,
    signature: Buffer,
    ruleIns: anchor.web3.TransactionInstruction,
    cpiIns: anchor.web3.TransactionInstruction | null = null,
    payer: anchor.web3.PublicKey,
    smartWallet: anchor.web3.PublicKey,
    executeAction: anchor.IdlTypes<Lazorkit>['action'] = types.ExecuteAction
      .ExecuteCpi,
    createNewAuthenticator: number[] | null = null,
    verifyInstructionIndex: number = 0
  ): Promise<anchor.web3.Transaction> {
    const [smartWalletAuthenticator] = this.smartWalletAuthenticator(
      passkeyPubkey,
      smartWallet
    );

    const ruleData: types.CpiData = {
      data: ruleIns.data,
      startIndex: 0,
      length: ruleIns.keys.length,
    };

    let cpiData: types.CpiData | null = null;

    const remainingAccounts: anchor.web3.AccountMeta[] = [];

    if (cpiIns) {
      cpiData = {
        data: cpiIns.data,
        startIndex: 0,
        length: cpiIns.keys.length,
      };

      remainingAccounts.push(
        ...cpiIns.keys.map((key) => ({
          pubkey: key.pubkey,
          isWritable: key.isWritable,
          isSigner: key.pubkey.equals(payer),
        }))
      );

      ruleData.startIndex = cpiIns.keys.length;
    }

    remainingAccounts.push(
      ...ruleIns.keys.map((key) => ({
        pubkey: key.pubkey,
        isWritable: key.isWritable,
        isSigner: key.pubkey.equals(payer),
      }))
    );

    const verifySignatureIx = createSecp256r1Instruction(
      message,
      Buffer.from(passkeyPubkey),
      signature
    );

    let newSmartWalletAuthenticator: anchor.web3.PublicKey | null = null;
    if (createNewAuthenticator) {
      [newSmartWalletAuthenticator] = this.smartWalletAuthenticator(
        createNewAuthenticator,
        smartWallet
      );
    }

    const executeInstructionIx = await this.program.methods
      .executeInstruction({
        passkeyPubkey,
        signature,
        message,
        verifyInstructionIndex,
        ruleData: ruleData,
        cpiData: cpiData,
        action: executeAction,
        createNewAuthenticator,
      })
      .accountsPartial({
        payer,
        config: this.config,
        smartWallet,
        smartWalletConfig: this.smartWalletConfig(smartWallet),
        smartWalletAuthenticator,
        whitelistRulePrograms: this.whitelistRulePrograms,
        authenticatorProgram: ruleIns.programId,
        ixSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        cpiProgram: cpiIns ? cpiIns.programId : anchor.web3.PublicKey.default,
        newSmartWalletAuthenticator: newSmartWalletAuthenticator,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();

    return new anchor.web3.Transaction()
      .add(verifySignatureIx)
      .add(executeInstructionIx);
  }

  async getSmartWalletByPasskey(passkeyPubkey: number[]): Promise<{
    smartWallet: anchor.web3.PublicKey | null;
    smartWalletAuthenticator: anchor.web3.PublicKey | null;
  }> {
    // accounts
    const discriminator = IDL.accounts.find(
      (a) => a.name === 'SmartWalletAuthenticator'
    )!.discriminator;

    const accounts = await this.connection.getProgramAccounts(this.programId, {
      dataSlice: {
        offset: 8,
        length: 33,
      },
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: bs58.encode(discriminator),
          },
        },
        {
          memcmp: {
            offset: 8,
            bytes: bs58.encode(passkeyPubkey),
          },
        },
      ],
    });
    console.log('Found accounts:', accounts.length);

    if (accounts.length === 0) {
      return { smartWalletAuthenticator: null, smartWallet: null };
    }

    const smartWalletAuthenticatorData =
      await this.getSmartWalletAuthenticatorData(accounts[0].pubkey);

    return {
      smartWalletAuthenticator: accounts[0].pubkey,
      smartWallet: smartWalletAuthenticatorData.smartWallet,
    };
  }
}
