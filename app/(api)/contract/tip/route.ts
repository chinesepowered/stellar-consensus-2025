import { NextResponse } from 'next/server';
import { getUserByPasskeyId, updateUser, addUserAction } from '@/lib/mockUserDb';

async function getUserIdFromSession(request: Request): Promise<string | null> {
  const mockSessionToken = request.headers.get('Authorization')?.split('Bearer ')?.[1];
  if (mockSessionToken) return mockSessionToken;
  return null;
}

interface TipRequestBody {
  creatorId: string;
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

    const { creatorId, amount } = (await request.json()) as TipRequestBody;
    if (!creatorId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid request body for tip' }, { status: 400 });
    }

    if (user.platformBalanceXLM < amount) {
      return NextResponse.json({ error: 'Insufficient platform balance for tip' }, { status: 400 });
    }

    // Mock: Deduct amount from platform balance.
    // In a real scenario, platform contract transfers from user's internal balance to creator's internal balance.
    // Or, if tipping directly from user smart wallet (not the "Deposited Balance" model for tips):
    // 1. Backend: Prepare Soroban tx for user's smart wallet to send XLM to creator.
    // 2. Frontend: User passkey-signs.
    // 3. Backend/Launchtube: Submits.

    // Using the "Deposited Balance" model for tips as well:
    const updatedUser = await addUserAction(userId, {
        type: 'TIP',
        description: `Tipped ${amount.toFixed(7)} XLM to ${creatorId}.`,
        amount: -amount,
        targetId: creatorId,
    });
    
    if (!updatedUser) {
        throw new Error('Failed to update user balance after tip action.');
    }

    // TODO: In a real system, the creator's balance would be increased here.
    // For the hackathon, we are only tracking the tipper's balance change.

    return NextResponse.json({
      message: `Successfully tipped ${amount.toFixed(7)} XLM to ${creatorId}`,
      newPlatformBalance: updatedUser.platformBalanceXLM.toFixed(7),
      action: updatedUser.actionHistory[updatedUser.actionHistory.length -1]
    });

  } catch (error) {
    console.error("Tip API error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Tip failed", details: errorMessage }, { status: 500 });
  }
} 