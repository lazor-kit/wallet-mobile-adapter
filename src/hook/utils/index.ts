export async function signAndSendTxn({
    base64EncodedTransaction,
    relayerUrl,
}: {
    base64EncodedTransaction: string;
    relayerUrl: string;
}) {
    const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'signAndSendTransaction',
        params: [base64EncodedTransaction],
    };

    try {
        const response = await fetch(relayerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log('Response:', data);
        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}