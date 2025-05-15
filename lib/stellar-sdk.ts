import { TransactionBuilder, Operation, Keypair, xdr, Account } from '@stellar/stellar-sdk';
import { SorobanRpc } from '@stellar/stellar-sdk/rpc';
import { NETWORK_PASSPHRASE, RPC_URL } from './data';

const server = new SorobanRpc.Server(RPC_URL, {
    allowHttp: RPC_URL.startsWith('http://')
});

export type ContractArg = 
    | { type: 'address', value: string }
    | { type: 'string', value: string }
    | { type: 'bytes', value: Buffer }
    | { type: 'u32', value: number }
    | { type: 'i32', value: number }
    | { type: 'u64', value: string }
    | { type: 'i64', value: string }
    | { type: 'u128', value: string }
    | { type: 'i128', value: string }
    | { type: 'bool', value: boolean }
    | { type: 'symbol', value: string }
    | { type: 'stroopAmount', value: string };

async function createDummyTransaction(
    sourceAddress: string,
    contractId: string,
    methodName: string,
    methodArgs: ContractArg[] = []
): Promise<string | null> {
    try {
        console.log(`Building transaction for: ${sourceAddress} to contract ${contractId}, method ${methodName}`);
        
        const sourceAccountDetails = await server.getAccount(sourceAddress);

        const parsedArgs = methodArgs.map(arg => {
            switch (arg.type) {
                case 'address': return xdr.ScVal.scvAddress(new xdr.ScAddress.scAddressTypeAccount(Keypair.fromPublicKey(arg.value).xdrPublicKey()));
                case 'string': return xdr.ScVal.scvString(arg.value);
                case 'bytes': return xdr.ScVal.scvBytes(arg.value);
                case 'u32': return xdr.ScVal.scvU32(arg.value);
                case 'i32': return xdr.ScVal.scvI32(arg.value);
                case 'u64': return xdr.ScVal.scvU64(BigInt(arg.value));
                case 'i64': return xdr.ScVal.scvI64(BigInt(arg.value));
                case 'u128': return xdr.ScVal.scvU128(BigInt(arg.value));
                case 'i128': return xdr.ScVal.scvI128(BigInt(arg.value));
                case 'bool': return xdr.ScVal.scvBool(arg.value);
                case 'symbol': return xdr.ScVal.scvSymbol(arg.value);
                case 'stroopAmount': return xdr.ScVal.scvI128(BigInt(arg.value));
                default: throw new Error(`Unsupported arg type: ${(arg as any).type}`);
            }
        });

        const operation = Operation.invokeContractFunction({
            contract: contractId,
            function: methodName,
            args: parsedArgs,
        });

        const txFeeStats = await server.getFeeStats();
        const fee = txFeeStats.sorobanInclusionFee.p99;

        const txBuilder = new TransactionBuilder(new Account(sourceAddress, sourceAccountDetails.sequence), {
            fee,
            networkPassphrase: NETWORK_PASSPHRASE,
        })
        .addOperation(operation)
        .setTimeout(180)
        .build();

        const txXDR = txBuilder.toXDR();
        console.log("Transaction XDR created:", txXDR);
        return txXDR;

    } catch (error: any) {
        console.error("Error creating dummy transaction:", error);
        if (error && error.message && error.message.toLowerCase().includes("account not found")) {
             alert(`Your account ${sourceAddress} was not found on the test network. Please ensure it is created and funded (e.g. using Friendbot for testnet).`);
        } else if (error && error.response && typeof error.response.data === 'object' && error.response.data && 'detail' in error.response.data) {
            alert(`Error creating transaction: ${error.response.data.detail}`);
        } else if (error && error.message) {
            alert(`Error creating transaction: ${error.message}`);
        } else {
            alert('An unknown error occurred while creating the transaction.');
        }
        return null;
    }
}

function xlmToStroops(xlmAmount: string): string {
    const numXLM = parseFloat(xlmAmount);
    if (isNaN(numXLM) || numXLM < 0) {
        console.warn("Invalid XLM amount for xlmToStroops:", xlmAmount);
        return "0";
    }
    const stroops = Math.round(numXLM * 10000000);
    return stroops.toString();
}

export const StellarSDK = {
    createDummyTransaction,
    xlmToStroops,
}; 