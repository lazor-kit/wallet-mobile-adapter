import * as anchor from '@coral-xyz/anchor';
import * as bs58 from 'bs58';
import { LazorKitProgram } from '../../anchor/interface/lazorkit';
import { WalletInfo } from '../types';
import { signAndSendTxn } from '../utils';

// Debug logger
const isDebug = process.env.EXPO_PUBLIC_DEBUG === 'true' || __DEV__;
const log = (...args: any[]) => isDebug && console.log('[LazorSDK]', ...args);
const logError = (msg: string, err: any) => {
    if (isDebug) {
        console.error(`[LazorSDK Error] ${msg}:`, err);
    }
};

// A static "payer" for fee-paying (replace with your logic or an injected Keypair)
const PAYER_PUBLICKEY = new anchor.web3.PublicKey(
    'hij78MKbJSSs15qvkHWTDCtnmba2c1W4r1V22g5sD8w'
);

export const createWalletActions = (
    connection: anchor.web3.Connection,
    setWallet: (wallet: WalletInfo | null) => void,
    setLoading: (isLoading: boolean) => void
) => {
    const lazorProgram = new LazorKitProgram(connection);

    const saveWallet = async (data: WalletInfo): Promise<WalletInfo> => {
        setLoading(true);

        try {
            let { smartWallet, smartWalletAuthenticator } =
                await lazorProgram.getSmartWalletByPasskey(data.passkeyPubkey);

            if (!smartWallet || !smartWalletAuthenticator) {
                log('💡 SmartWallet missing; creating a new one...');

                const createTxn = await lazorProgram.createSmartWalletTxn(
                    data.passkeyPubkey,
                    null,
                    PAYER_PUBLICKEY
                );

                const serialized = createTxn
                    .serialize({ verifySignatures: false, requireAllSignatures: false })
                    .toString('base64');
                const { result: sendResult, error: sendError } = await signAndSendTxn({
                    base64EncodedTransaction: serialized,
                    relayerUrl: 'https://lazorkit-paymaster.onrender.com',
                });

                if (sendError) {
                    throw new Error(
                        `Create wallet relayer error: ${JSON.stringify(sendError)}`
                    );
                }

                await lazorProgram.connection.confirmTransaction(
                    String(sendResult.signature),
                    'confirmed'
                );

                const fetched = await lazorProgram.getSmartWalletByPasskey(
                    data.passkeyPubkey
                );
                smartWallet = fetched.smartWallet;
                smartWalletAuthenticator = fetched.smartWalletAuthenticator;

                if (!smartWallet || !smartWalletAuthenticator) {
                    throw new Error('Failed to create smart wallet on chain');
                }

                log('💸 Airdropping 0.1 SOL to new SmartWallet...');
                const airdropTxn = new anchor.web3.Transaction().add(
                    anchor.web3.SystemProgram.transfer({
                        fromPubkey: PAYER_PUBLICKEY,
                        toPubkey: new anchor.web3.PublicKey(smartWallet),
                        lamports: anchor.web3.LAMPORTS_PER_SOL / 10,
                    })
                );

                const payerKeypair = anchor.web3.Keypair.fromSecretKey(
                    bs58.decode(process.env.EXPO_PUBLIC_PRIVATE_KEY!)
                );
                airdropTxn.feePayer = payerKeypair.publicKey;
                airdropTxn.recentBlockhash = (
                    await lazorProgram.connection.getLatestBlockhash()
                ).blockhash;
                airdropTxn.sign(payerKeypair);

                await lazorProgram.connection.sendRawTransaction(
                    airdropTxn.serialize()
                );
            }

            const finalWallet: WalletInfo = {
                ...data,
                smartWallet: smartWallet.toString(),
                smartWalletAuthenticator: smartWalletAuthenticator.toString(),
            };

            setWallet(finalWallet);
            return finalWallet;
        } finally {
            setLoading(false);
        }
    };

    return {
        saveWallet,
    };
}; 