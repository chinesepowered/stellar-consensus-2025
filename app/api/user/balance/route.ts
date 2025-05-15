import { NextResponse } from 'next/server';
import { getUserByPasskeyId } from '@/lib/mockUserDb';

// Placeholder for session management (same as in user/me)
async function getUserIdFromSession(request: Request): Promise<string | null> {
  const mockSessionToken = request.headers.get('Authorization')?.split('Bearer ')?.[1];
  if (mockSessionToken) {
    return mockSessionToken; // Assuming the token IS the userId (passkeyCredentialId)
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: No session found" }, { status: 401 });
    }

    const user = await getUserByPasskeyId(userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: User not found for session" }, { status: 401 });
    }

    // In a real scenario, XLM balance might come from a Stellar SDK call to the user's smart wallet.
    // For the hackathon, we can either make it static or also store/mock it in User object if it changes.
    // The `platformBalanceXLM` is already in the User object.
    const mockXlmBalance = '1000.0000000'; // Or derive if stored and modified elsewhere

    return NextResponse.json({
      xlmBalance: mockXlmBalance, // This is user's direct wallet balance (mocked)
      platformBalance: user.platformBalanceXLM.toFixed(7) // This is user's balance in the platform contract
    });

  } catch (error) {
    console.error("Get user/balance error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to fetch balances", details: errorMessage }, { status: 500 });
  }
} 