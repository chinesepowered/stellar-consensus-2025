import { NextResponse } from 'next/server';
import { getUserByPasskeyId } from '@/lib/mockUserDb'; // Adjust path if @/ isn't configured
import { User } from '@/lib/types'; // Adjust path if @/ isn't configured

// TODO: Replace with actual PasskeyKit server-side verification
// import { PasskeyServer } from '@kalepail/passkey-kit/server';

interface LoginRequestBody {
  assertionResponse: any; // This would be a specific type from PasskeyKit
  challenge: string;
  // username?: string; // Optional, depending on if it was part of the challenge or discoverable creds
}

export async function POST(request: Request) {
  try {
    const { assertionResponse, challenge } = await request.json() as LoginRequestBody;

    console.log(`API: Verify Passkey Login`);

    // --- TODO: 1. Passkey Verification ---
    // const passkeyServer = new PasskeyServer({ rpcUrl: process.env.SOROBAN_RPC_URL!, ... });
    // const verificationResult = await passkeyServer.verifyAssertion(assertionResponse, challenge);
    // if (!verificationResult || !verificationResult.success) {
    //   return NextResponse.json({ verified: false, error: 'Passkey login verification failed', details: verificationResult?.error }, { status: 400 });
    // }
    // const { credentialID } = verificationResult;
    // The credentialID is the key to look up the user.
    const MOCK_VERIFICATION_SUCCESS = true; // Assume verification is successful for mock
    // In a real scenario, the credentialID would come from the assertionResponse or be verified by PasskeyKit
    // For this mock, we need a way to link the assertion to a user. 
    // Let's assume the client sends the credentialID it used, or it's part of assertionResponse.rawId
    const MOCK_CREDENTIAL_ID = assertionResponse.rawId || assertionResponse.id || 'mock-cred-id-from-login-verify'; 

    if (!MOCK_VERIFICATION_SUCCESS) { // Keep this block for the actual implementation
      return NextResponse.json({ verified: false, error: 'Passkey login verification failed' }, { status: 400 });
    }

    // --- 2. Retrieve User ---
    const user = await getUserByPasskeyId(MOCK_CREDENTIAL_ID);

    if (!user) {
      // This could happen if the passkey is valid but not registered in our system,
      // or if MOCK_CREDENTIAL_ID couldn't be correctly determined.
      return NextResponse.json({ verified: false, error: 'User not found for this passkey' }, { status: 404 });
    }

    console.log(` MOCK: User ${user.username} logged in successfully with credential ID ${MOCK_CREDENTIAL_ID}`);

    // --- TODO: 3. Session Management ---
    // Upon successful login, establish a session (e.g., using JWT in an HttpOnly cookie)
    // For now, just return user info.
    const { passkeyCredentialId, passkeyPublicKey, ...userResponse } = user;

    return NextResponse.json({
      success: true,
      user: userResponse,
      // In a real app, you'd set an HttpOnly cookie for the session here.
      // Example: token: "mock-session-token-for-" + user.id 
    });

  } catch (error) {
    console.error("Login verification error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Login verification failed", details: errorMessage }, { status: 500 });
  }
} 