import { NextResponse } from 'next/server';
import { getUserByPasskeyId, updateUser, addUserAction } from '@/lib/mockUserDb';

// Placeholder for session management
async function getUserIdFromSession(request: Request): Promise<string | null> {
  const mockSessionToken = request.headers.get('Authorization')?.split('Bearer ')?.[1];
  if (mockSessionToken) return mockSessionToken;
  return null;
}

interface DepositRequestBody {
  amount: number;
  // userSmartWalletAddress: string; // Not strictly needed for mock, but good for realism
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: No session found" }, { status: 401 });
    }

    const user = await getUserByPasskeyId(userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: User not found for session" }, { status: 401 });
    }

    const { amount } = (await request.json()) as DepositRequestBody;
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 });
    }

    // In a real "Deposited Balance" model:
    // 1. Frontend: User passkey-signs a transaction from their smart wallet to the PlatformContract.
    //    This might be prepared by the backend or constructed client-side.
    // 2. Backend/Launchtube: Submits this transaction to Stellar.
    // 3. Backend (this API route, or a webhook): Confirms transaction and updates user's platform balance.

    // For Hackathon Mock:
    // We assume the XLM has been successfully transferred from user's smart wallet to the platform contract.
    // So, we just increase the user's internal platformBalanceXLM.
    // We also mock that their external XLM balance decreases.
    
    const updatedUser = await addUserAction(userId, {
      type: 'DEPOSIT',
      description: `Deposited ${amount.toFixed(7)} XLM to platform.`,
      amount: amount,
    });

    if (!updatedUser) {
        throw new Error('Failed to update user balance after deposit action.');
    }

    // This mockXlmBalance would ideally be fetched or be part of a more complex state
    const mockXlmBalanceAfterDeposit = (parseFloat('1000.0000000') - amount).toFixed(7); 

    return NextResponse.json({
      message: 'Deposit successful (mock)',
      newPlatformBalance: updatedUser.platformBalanceXLM.toFixed(7),
      newXlmBalance: mockXlmBalanceAfterDeposit, // Illustrative
      action: updatedUser.actionHistory[updatedUser.actionHistory.length -1]
    });

  } catch (error) {
    console.error("Deposit API error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Deposit failed", details: errorMessage }, { status: 500 });
  }
} 