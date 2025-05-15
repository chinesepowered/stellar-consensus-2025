import { NextResponse } from 'next/server';
import { getUserByPasskeyId, updateUser, addUserAction } from '@/lib/mockUserDb';

async function getUserIdFromSession(request: Request): Promise<string | null> {
  const mockSessionToken = request.headers.get('Authorization')?.split('Bearer ')?.[1];
  if (mockSessionToken) return mockSessionToken;
  return null;
}

interface WithdrawRequestBody {
  amount: number;
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: No session found" }, { status: 401 });
    }

    const user = await getUserByPasskeyId(userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: User not found" }, { status: 401 });
    }

    const { amount } = (await request.json()) as WithdrawRequestBody;
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 });
    }

    if (user.platformBalanceXLM < amount) {
      return NextResponse.json({ error: 'Insufficient platform balance' }, { status: 400 });
    }

    // In a real "Deposited Balance" model:
    // 1. Backend: Prepares a transaction for PlatformContract to send XLM to user's smart wallet.
    // 2. Frontend: User passkey-signs this transaction (or an approval for it).
    // 3. Backend/Launchtube: Submits transaction.
    // 4. Backend (this API): Confirms and updates internal platformBalanceXLM.

    // For Hackathon Mock:
    // We assume the XLM has been successfully transferred from the platform contract to the user's smart wallet.
    // So, we just decrease user's internal platformBalanceXLM.
    const updatedUser = await addUserAction(userId, {
        type: 'WITHDRAWAL',
        description: `Withdrew ${amount.toFixed(7)} XLM from platform.`,
        amount: -amount, // Negative amount for withdrawal type actions
    });

    if (!updatedUser) {
        throw new Error('Failed to update user balance after withdrawal action.');
    }
    
    // This mockXlmBalance would ideally be fetched or part of a more complex state
    const mockXlmBalanceAfterWithdrawal = (parseFloat('1000.0000000') + amount).toFixed(7); 

    return NextResponse.json({
      message: 'Withdrawal successful (mock)',
      newPlatformBalance: updatedUser.platformBalanceXLM.toFixed(7),
      newXlmBalance: mockXlmBalanceAfterWithdrawal, // Illustrative
      action: updatedUser.actionHistory[updatedUser.actionHistory.length -1]
    });

  } catch (error) {
    console.error("Withdraw API error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Withdrawal failed", details: errorMessage }, { status: 500 });
  }
} 