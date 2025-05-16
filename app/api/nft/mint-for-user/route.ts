import { NextResponse } from 'next/server';
import { Keypair, TransactionBuilder, Networks, TimeoutInfinite, Operation, xdr, Soroban } from '@stellar/stellar-sdk';
import { Server as SorobanRpcServer } from '@stellar/stellar-sdk/rpc';
import { Client as NftContractClient } from '../../../../contracts/contracts/nft/bindings/src'; 

const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const NFT_CONTRACT_ID = 'CCNMXO54G46RHX6XFJ3ZBVRMXZIPRU7JUNRIITQNTZJWIB55YV6J2W54';
const LAUNCHTUBE_URL = 'https://testnet.launchtube.xyz/';

interface MintRequestBody {
  userWalletAddress: string;
  name: string;
  description: string;
  imageUrl: string;
}

export async function POST(request: Request) {
  try {
    const { userWalletAddress, name, description, imageUrl } = await request.json() as MintRequestBody;

    if (!userWalletAddress || !name || !description || !imageUrl) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const platformPrivateKey = process.env.PLATFORM_ACCOUNT_PRIVATE_KEY;
    if (!platformPrivateKey) {
      console.error('PLATFORM_ACCOUNT_PRIVATE_KEY is not set');
      return NextResponse.json({ message: 'Server configuration error: Missing platform private key' }, { status: 500 });
    }
    
    const launchtubeToken = process.env.PLATFORM_LAUNCHTUBE_TOKEN;
    if (!launchtubeToken) {
      console.error('PLATFORM_LAUNCHTUBE_TOKEN is not set');
      return NextResponse.json({ message: 'Server configuration error: Missing Launchtube token' }, { status: 500 });
    }

    const platformKeypair = Keypair.fromSecret(platformPrivateKey);
    const platformAddress = platformKeypair.publicKey();

    const server = new SorobanRpcServer(RPC_URL, {
      allowHttp: RPC_URL.startsWith('http://'),
    });

    const nftClient = new NftContractClient({
      contractId: NFT_CONTRACT_ID,
      rpcUrl: RPC_URL, 
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    console.log(`Preparing to mint NFT: Name="${name}", To=${userWalletAddress}, By Platform=${platformAddress} via Launchtube`);

    const assembledTx = await nftClient.mint({
      to: userWalletAddress,
      name: name,
      description: description,
      image_url: imageUrl,
    }, {
      fee: 100000, 
      timeoutInSeconds: 30,
      simulate: true,
    });

    const sorobanData: Soroban.SorobanTransactionData = assembledTx.build();
    if (!sorobanData) {
        throw new Error("assembledTx.build() did not return SorobanTransactionData.");
    }

    const sourceAccount = await server.getAccount(platformAddress);
    const networkFee = (parseInt(sorobanData.resourceFee().toString()) + 100).toString();

    const txBuilder = new TransactionBuilder(sourceAccount, {
        fee: networkFee, 
        networkPassphrase: NETWORK_PASSPHRASE,
    })
    .addOperation(Operation.restoreFootprint({ footprint: sorobanData.footprint() }))
    .addOperation(
        Operation.invokeHostFunction({
            func: sorobanData.invokeHostFunctionOp().hostFunction(),
            parameters: sorobanData.invokeHostFunctionOp().parameters(),
            auth: sorobanData.invokeHostFunctionOp().auth() || [],
        })
    )
    .setTimeout(TimeoutInfinite);
    
    const transaction = txBuilder.build();
    transaction.sign(platformKeypair);
    const signedXDR = transaction.toEnvelope().toXDR("base64");

    console.log("Submitting signed XDR to Launchtube...");
    const formData = new URLSearchParams();
    formData.append("xdr", signedXDR);

    const launchtubeResponse = await fetch(LAUNCHTUBE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Bearer ${launchtubeToken}`,
      },
      body: formData.toString(),
    });

    const responseText = await launchtubeResponse.text();
    console.log("Launchtube raw response:", responseText);

    if (!launchtubeResponse.ok) {
      let errorData = { message: responseText };
      try { errorData = JSON.parse(responseText); } catch (e) { /* ignore */ }
      console.error(`Launchtube submission failed: ${launchtubeResponse.status}`, errorData);
      return NextResponse.json({ 
        message: `Launchtube submission failed: ${launchtubeResponse.statusText}`,
        details: errorData 
      }, { status: launchtubeResponse.status });
    }

    const launchtubeResult = JSON.parse(responseText);
    console.log("Launchtube submission successful:", launchtubeResult);
    
    return NextResponse.json({ 
      success: true, 
      message: 'NFT mint transaction submitted via Launchtube', 
      launchtubeResponse: launchtubeResult 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in mint-for-user API:', error);
    let errorDetails: any = { message: error.message, stack: error.stack };
    if (error.isSorobanError || (error.simulation && error.simulation.error)) {
        errorDetails.sorobanError = error.isSorobanError ? error.toString() : error.simulation.error;
        console.error("Soroban related error:", errorDetails.sorobanError);
    }
    return NextResponse.json(errorDetails, { status: 500 });
  }
} 