import { NextResponse } from 'next/server';
import { PasskeyRegistrationChallenge } from '@/lib/types'; // Adjust path if @/ isn't configured

// TODO: Replace with actual PasskeyKit server-side challenge generation
// import { PasskeyServer } from '@kalepail/passkey-kit/server';

interface ChallengeRequestBody {
  username: string;
}

export async function POST(request: Request) {
  try {
    const { username } = (await request.json()) as ChallengeRequestBody;

    console.log(`API: Generate Passkey Registration Challenge for username: ${username}`);

    // --- TODO: Passkey Challenge Generation ---
    // const passkeyServer = new PasskeyServer({ rpcUrl: process.env.SOROBAN_RPC_URL!, ... });
    // const challengePayload = await passkeyServer.generateRegistrationChallenge({ username });
    // This payload would include the challenge and other necessary options for the client.

    // For mock purposes, generate a simple challenge.
    // The actual challenge should be a securely generated, unpredictable string.
    const mockChallenge = `mock-challenge-${username}-${Date.now()}`;
    const MOCK_RP_ID = 'localhost'; // Relying Party ID - should match your domain

    const responsePayload: PasskeyRegistrationChallenge & { rpId: string } = {
      challenge: mockChallenge,
      // userId: username, // Optional: PasskeyKit might use this or generate its own internal identifiers
      rpId: MOCK_RP_ID, // The relying party ID is important for the browser's webauthn API
    };

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error("Registration challenge error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to generate registration challenge", details: errorMessage }, { status: 500 });
  }
} 