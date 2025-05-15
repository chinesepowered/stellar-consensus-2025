import { NextResponse } from 'next/server';
import { getUserByPasskeyId, MOCK_USER_DB } from '@/lib/mockUserDb';

// Placeholder for session management (same as in user/me)
async function getUserIdFromSession(request: Request): Promise<string | null> {
  const mockSessionToken = request.headers.get('Authorization')?.split('Bearer ')?.[1];
  if (mockSessionToken) {
    console.log(`Balance API: Got token: ${mockSessionToken}`);
    return mockSessionToken; // Assuming the token IS the userId (passkeyCredentialId)
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      console.error("Balance API: No session token found");
      return NextResponse.json({ error: "Unauthorized: No session found" }, { status: 401 });
    }

    console.log(`Balance API: Looking up user with ID: ${userId}`);
    console.log(`Balance API: Available user IDs in DB: ${Object.keys(MOCK_USER_DB).join(', ')}`);
    
    const user = await getUserByPasskeyId(userId);
    if (!user) {
      console.error(`Balance API: User not found for ID: ${userId}`);
      return NextResponse.json({ error: "Unauthorized: User not found for session" }, { status: 401 });
    }

    console.log(`Balance API: Found user ${user.username} with platform balance: ${user.platformBalanceXLM}`);
    
    // Mock XLM balance for testing
    const mockXlmBalance = '1000.0000000'; 

    return NextResponse.json({
      xlmBalance: mockXlmBalance, 
      platformBalance: user.platformBalanceXLM.toFixed(7)
    });

  } catch (error) {
    console.error("Get user/balance error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to fetch balances", details: errorMessage }, { status: 500 });
  }
} 