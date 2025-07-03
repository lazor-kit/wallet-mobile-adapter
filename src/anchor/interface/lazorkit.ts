import * as anchor from '@coral-xyz/anchor';
import * as bs58 from 'bs58';
import * as constants from '../constants';
import IDL from '../idl/lazorkit.json';
import { Lazorkit } from '../types/lazorkit';
import * as types from '../types';
import * as borsh from 'borsh';
import { createSecp256r1Instruction, hashSeeds, instructionToAccountMetas } from '../utils';
// Polyfill for structuredClone if not available (for React Native/Expo)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}
import { Buffer } from 'buffer';
import { sha256 } from 'js-sha256';

export class LazorKitProgram {
  /** Network connection used by all RPC / account queries */
  readonly connection: anchor.web3.Connection;

  /** Cached IDL to avoid repeated JSON parsing */
  readonly Idl: anchor.Idl = IDL as Lazorkit;

  /** Lazily-instantiated (and cached) Anchor `Program` wrapper */
  private _program?: anchor.Program<Lazorkit>;

  /** Frequently-used PDA caches (network-independent, so safe to memoise) */
  private _smartWalletSeq?: anchor.web3.PublicKey;
  private _whitelistRulePrograms?: anchor.web3.PublicKey;
  private _config?: anchor.web3.PublicKey;

  constructor(connection: anchor.web3.Connection) {
    this.connection = connection;
  }

  get program(): anchor.Program<Lazorkit> {
    if (!this._program) {
      this._program = new anchor.Program(this.Idl, {
        connection: this.connection,
      });
    }
    return this._program;
  }

  get programId(): anchor.web3.PublicKey {
    return this.program.programId;
  }

  get smartWalletSeq(): anchor.web3.PublicKey {
    if (!this._smartWalletSeq) {
      this._smartWalletSeq = anchor.web3.PublicKey.findProgramAddressSync(
        [constants.SMART_WALLET_SEQ_SEED],
        this.programId
      )[0];
    }
    return this._smartWalletSeq;
  }

  get smartWalletSeqData(): Promise<types.SmartWalletSeq> {
    return this.program.account.smartWalletSeq.fetch(this.smartWalletSeq);
  }

  async getLastestSmartWallet(): Promise<anchor.web3.PublicKey> {
    const seqData = await this.program.account.smartWalletSeq.fetch(this.smartWalletSeq);
    return anchor.web3.PublicKey.findProgramAddressSync(
      [constants.SMART_WALLET_SEED, seqData.seq.toArrayLike(Buffer, 'le', 8)],
      this.programId
    )[0];
  }

  async getSmartWalletConfigData(
    smartWallet: anchor.web3.PublicKey
  ): Promise<types.SmartWalletConfig> {
    return this.program.account.smartWalletConfig.fetch(this.smartWalletConfig(smartWallet));
  }

  smartWalletAuthenticator(
    passkey: number[],
    smartWallet: anchor.web3.PublicKey
  ): [anchor.web3.PublicKey, number] {
    const hash = hashSeeds(passkey, smartWallet);
    return anchor.web3.PublicKey.findProgramAddressSync(
      [constants.SMART_WALLET_AUTHENTICATOR_SEED, smartWallet.toBuffer(), hash],
      this.programId
    );
  }

  async getSmartWalletAuthenticatorData(
    smartWalletAuthenticator: anchor.web3.PublicKey
  ): Promise<types.SmartWalletAuthenticator> {
    return this.program.account.smartWalletAuthenticator.fetch(smartWalletAuthenticator);
  }

  smartWalletConfig(smartWallet: anchor.web3.PublicKey): anchor.web3.PublicKey {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [constants.SMART_WALLET_CONFIG_SEED, smartWallet.toBuffer()],
      this.programId
    )[0];
  }

  get config(): anchor.web3.PublicKey {
    if (!this._config) {
      this._config = anchor.web3.PublicKey.findProgramAddressSync(
        [constants.CONFIG_SEED],
        this.programId
      )[0];
    }
    return this._config;
  }

  async initializeTxn(payer: anchor.web3.PublicKey): Promise<anchor.web3.Transaction> {
    const ix = await this.program.methods
      .initialize()
      .accountsPartial({
        signer: payer,
        config: this.config,
        smartWalletSeq: this.smartWalletSeq,
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

  async createSmartWalletTxn(
    passkeyPubkey: number[],
    payer: anchor.web3.PublicKey,
    credentialId: string = ''
  ): Promise<anchor.web3.Transaction> {
    const smartWallet = await this.getLastestSmartWallet();
    const [smartWalletAuthenticator] = this.smartWalletAuthenticator(passkeyPubkey, smartWallet);

    const createSmartWalletIx = await this.program.methods
      .createSmartWallet(passkeyPubkey, Buffer.from(credentialId, 'base64'))
      .accountsPartial({
        signer: payer,
        smartWalletSeq: this.smartWalletSeq,
        smartWallet,
        smartWalletConfig: this.smartWalletConfig(smartWallet),
        smartWalletAuthenticator,
        config: this.config,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .instruction();

    const tx = new anchor.web3.Transaction().add(createSmartWalletIx);
    tx.feePayer = payer;
    tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    return tx;
  }

  async executeInstructionTxn(
    passkeyPubkey: number[],
    clientDataJsonRaw: Buffer,
    authenticatorDataRaw: Buffer,
    signature: Buffer,
    payer: anchor.web3.PublicKey,
    smartWallet: anchor.web3.PublicKey,
    verifyInstructionIndex: number = 0,
    cpiIns: anchor.web3.TransactionInstruction
  ): Promise<anchor.web3.Transaction> {
    const [smartWalletAuthenticator] = this.smartWalletAuthenticator(passkeyPubkey, smartWallet);

    let cpiData: types.CpiData | null = null;

    const remainingAccounts: anchor.web3.AccountMeta[] = instructionToAccountMetas(cpiIns, payer);

    const message = Buffer.concat([
      authenticatorDataRaw,
      Buffer.from(sha256.arrayBuffer(clientDataJsonRaw)),
    ]);

    const verifySignatureIx = createSecp256r1Instruction(
      message,
      Buffer.from(passkeyPubkey),
      signature
    );

    const executeInstructionIx = await this.program.methods
      .executeInstruction({
        passkeyPubkey,
        signature,
        clientDataJsonRaw,
        authenticatorDataRaw,
        verifyInstructionIndex,
      })
      .accountsPartial({
        payer,
        config: this.config,
        smartWallet,
        smartWalletConfig: this.smartWalletConfig(smartWallet),
        smartWalletAuthenticator,
        ixSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        cpiProgram: cpiIns.programId,
      })
      .remainingAccounts(remainingAccounts)
      .instruction();

    const txn = new anchor.web3.Transaction().add(verifySignatureIx).add(executeInstructionIx);

    txn.feePayer = payer;
    txn.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    return txn;
  }

  /**
   * Query the chain for the smart-wallet associated with a passkey.
   */
  async getSmartWalletByPasskey(passkeyPubkey: number[]): Promise<{
    smartWallet: anchor.web3.PublicKey | null;
    smartWalletAuthenticator: anchor.web3.PublicKey | null;
  }> {
    const discriminator = (IDL as any).accounts.find(
      (a: any) => a.name === 'SmartWalletAuthenticator'
    )!.discriminator;

    const accounts = await this.connection.getProgramAccounts(this.programId, {
      dataSlice: {
        offset: 8,
        length: 33,
      },
      filters: [
        { memcmp: { offset: 0, bytes: bs58.encode(discriminator) } },
        { memcmp: { offset: 8, bytes: bs58.encode(passkeyPubkey) } },
      ],
    });

    if (accounts.length === 0) {
      return { smartWalletAuthenticator: null, smartWallet: null };
    }

    const smartWalletAuthenticatorData = await this.getSmartWalletAuthenticatorData(
      accounts[0].pubkey
    );

    return {
      smartWalletAuthenticator: accounts[0].pubkey,
      smartWallet: smartWalletAuthenticatorData.smartWallet,
    };
  }

  /**
   * Build the serialized Message struct used for signing requests.
   */
  async getMessage(smartWallet: string, instructionData: Buffer): Promise<Buffer> {
    const smartWalletData = await this.getSmartWalletConfigData(
      new anchor.web3.PublicKey(smartWallet)
    );

    class Message {
      nonce: anchor.BN;
      current_slot: anchor.BN;
      instruction_data: Buffer;
      constructor(fields: { nonce: anchor.BN; current_slot: anchor.BN; instruction_data: Buffer }) {
        this.nonce = fields.nonce;
        this.current_slot = fields.current_slot;
        this.instruction_data = fields.instruction_data;
      }
    }

    const schema = new Map([
      [
        Message,
        {
          kind: 'struct',
          fields: [
            ['nonce', 'u64'],
            ['current_slot', 'i64'],
            ['instruction_data', 'vec<u8>'],
          ],
        },
      ],
    ]);

    const encoded = borsh.serialize(
      schema,
      new Message({
        nonce: smartWalletData.lastNonce,
        current_slot: new anchor.BN(await this.connection.getSlot()),
        instruction_data: instructionData,
      })
    );
    return Buffer.from(encoded);
  }
}
