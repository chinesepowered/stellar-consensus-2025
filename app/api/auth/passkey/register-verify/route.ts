import { NextResponse } from 'next/server';
import { createUser, getUserByUsername } from '@/lib/mockUserDb'; // Assuming @/ is configured for root
import { User } from '@/lib/types'; // Assuming @/ is configured for root
// If @/ isn't configured, use relative paths like '../../../lib/mockUserDb'

// TODO: Replace with actual PasskeyKit server-side verification
// import { PasskeyServer } from '@kalepail/passkey-kit/server';

interface RegistrationRequestBody {
  username: string;
  attestationResponse: any; // This would be a specific type from PasskeyKit
  challenge: string;
}

export async function POST(request: Request) {
  try {
    const { username, attestationResponse, challenge } = await request.json() as RegistrationRequestBody;

    console.log(`API: Verify Passkey Registration for username: ${username}`);

    // --- TODO: 1. Passkey Verification ---
    // const passkeyServer = new PasskeyServer({ rpcUrl: process.env.SOROBAN_RPC_URL!, ... });
    // const verificationResult = await passkeyServer.verifyAttestation(attestationResponse, challenge);
    // if (!verificationResult || !verificationResult.success) {
    //   return NextResponse.json({ verified: false, error: 'Passkey verification failed', details: verificationResult?.error }, { status: 400 });
    // }
    // const { credentialID, publicKey } = verificationResult; 
    const MOCK_VERIFICATION_SUCCESS = true; // Assume verification is successful for mock
    const MOCK_CREDENTIAL_ID = 'cred-' + username + '-' + Date.now();
    const MOCK_PUBLIC_KEY = 'pubkey-' + username + '-' + Date.now();

    if (!MOCK_VERIFICATION_SUCCESS) { // Keep this block for the actual implementation
        return NextResponse.json({ verified: false, error: 'Passkey verification failed' }, { status: 400 });
    }

    // Check if username already exists
    const existingUserByUsername = await getUserByUsername(username);
    if (existingUserByUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    
    // --- TODO: 2. Smart Wallet Creation (Simulated) ---
    // In a real scenario, deploy smart wallet using PasskeyKit's server side or Stellar SDK with the publicKey
    // const deployedWalletAddress = await passkeyServer.deploySmartWallet(publicKey);
    // For the hackathon, our createUser function in mockUserDb generates a mock one.
    console.log(` MOCK: Smart wallet would be deployed for ${username} using public key: ${MOCK_PUBLIC_KEY}`);


    // --- 3. Create User in our DB ---
    const newUser = await createUser({
      id: MOCK_CREDENTIAL_ID, // Use passkey credential ID as user ID
      username,
      passkeyCredentialId: MOCK_CREDENTIAL_ID,
      passkeyPublicKey: MOCK_PUBLIC_KEY,
      // smartWalletAddress, platformBalanceXLM, etc., are set by createUser
    });

    console.log(` MOCK: User ${username} created with ID ${newUser.id} and smart wallet ${newUser.smartWalletAddress}`);

    // --- TODO: 4. Initial Airdrop & Deposit (Simulated) ---
    // This step is conceptual for the "Deposited Balance" model.
    // a. Airdrop XLM to user's new smartWalletAddress (e.g., 10 XLM for gas and initial use)
    //    This would be a real Stellar transaction from a funded backend wallet.
    // b. User (via a frontend call post-registration or automated here) deposits some XLM 
    //    from their smartWalletAddress to the PlatformContract.
    //    For simplicity in registration, we can give a small starting platform balance.
    newUser.platformBalanceXLM = 10; // Mock initial platform balance after a "simulated" deposit.
    // In a real flow:
    // 1. Airdrop to smart wallet.
    // 2. Frontend prompts user, they sign a deposit tx from smart wallet to platform contract.
    // 3. API for deposit verifies and updates platformBalanceXLM.
    
    // For now, we directly update the mock DB for simplicity for the hackathon.
    // In a more complete flow, there would be a separate API call for deposit.
    // await updateUser(newUser.id, { platformBalanceXLM: 10 }); // Or done via addUserAction
    

    // --- TODO: 5. Session Management ---
    // Upon successful registration & login, establish a session (e.g., using JWT in an HttpOnly cookie)
    // For now, just return user info.
    const { passkeyCredentialId, passkeyPublicKey, ...userResponse } = newUser;


    return NextResponse.json({
      success: true,
      user: userResponse,
      // In a real app, you'd set an HttpOnly cookie for the session here.
      // Example: token: "mock-session-token-for-" + newUser.id 
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Registration failed", details: errorMessage }, { status: 500 });
  }
} 