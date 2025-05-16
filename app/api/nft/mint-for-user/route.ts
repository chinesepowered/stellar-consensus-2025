import { NextResponse } from 'next/server';
import { Keypair } from '@stellar/stellar-sdk';
import { Client as NftContractClient } from '../../../../contracts/contracts/nft/bindings/src'; 
import { basicNodeSigner } from '@stellar/stellar-sdk/contract';

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

    console.log("All environment variables:", JSON.stringify(process.env, null, 2));
    console.log("Attempting to read PLATFORM_ACCOUNT_PRIVATE_KEY (for debug, not used):", process.env.PLATFORM_ACCOUNT_PRIVATE_KEY);
    console.log("Attempting to read SYSTEM_ACCOUNT_SECRET_KEY:", process.env.SYSTEM_ACCOUNT_SECRET_KEY);
    console.log("Attempting to read LAUNCHTUBE_TOKEN:", process.env.LAUNCHTUBE_TOKEN);

    const platformPrivateKey = process.env.SYSTEM_ACCOUNT_SECRET_KEY;
    if (!platformPrivateKey) {
      console.error('SYSTEM_ACCOUNT_SECRET_KEY is not set');
      return NextResponse.json({ message: 'Server configuration error: Missing system account private key' }, { status: 500 });
    }
    
    const launchtubeToken = process.env.LAUNCHTUBE_TOKEN;
    if (!launchtubeToken) {
      console.error('LAUNCHTUBE_TOKEN is not set');
      return NextResponse.json({ message: 'Server configuration error: Missing Launchtube token' }, { status: 500 });
    }

    const platformKeypair = Keypair.fromSecret(platformPrivateKey);

    const nftClient = new NftContractClient({
      contractId: NFT_CONTRACT_ID,
      rpcUrl: RPC_URL, 
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    console.log(`Preparing to mint NFT: Name="${name}", To=${userWalletAddress} via Launchtube`);

    const mintOperationArgs = {
      to: userWalletAddress,
      name: name,
      description: description,
      image_url: imageUrl,
    };
    
    const assembledTx = await nftClient.mint(
      mintOperationArgs, 
      {
        fee: 100000,
      }
    );

    const signTransaction = basicNodeSigner(platformKeypair, NETWORK_PASSPHRASE);

    await assembledTx.sign(signTransaction);

    const signedXDR = assembledTx.toXDR();

    console.log("Signed XDR ready for Launchtube:", signedXDR.substring(0, 100) + "...");
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
    if (error && typeof error.isSorobanError === 'boolean' && error.isSorobanError) {
        errorDetails.sorobanError = error.toString();
        console.error("Soroban RPC related error:", errorDetails.sorobanError);
    } else if (error && error.simulation?.error) {
        errorDetails.sorobanError = error.simulation.error;
        console.error("Soroban simulation error:", errorDetails.sorobanError);
    }
    return NextResponse.json(errorDetails, { status: 500 });
  }
} 