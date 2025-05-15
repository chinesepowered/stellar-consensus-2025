import { NextResponse } from 'next/server';
import { getUserByPasskeyId, updateUser, addUserAction } from '@/lib/mockUserDb';
import { User } from '@/lib/types';

async function getUserIdFromSession(request: Request): Promise<string | null> {
  const mockSessionToken = request.headers.get('Authorization')?.split('Bearer ')?.[1];
  if (mockSessionToken) return mockSessionToken;
  return null;
}

interface SubscribeRequestBody {
  creatorId: string;
  price: number; // Subscription price
  // userId: string; // Sent from context, but we get from session for security
}

export async function POST(request: Request) {
  try {
    const currentUserId = await getUserIdFromSession(request);
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized: No session found" }, { status: 401 });
    }

    const user = await getUserByPasskeyId(currentUserId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized: User not found" }, { status: 401 });
    }

    const { creatorId, price } = (await request.json()) as SubscribeRequestBody;
    if (!creatorId || typeof price !== 'number' || price < 0) { // Price can be 0 for free subs
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    if (user.platformBalanceXLM < price) {
      return NextResponse.json({ error: 'Insufficient platform balance for subscription' }, { status: 400 });
    }

    // Check if already subscribed and not expired (simple check, real app might have more complex logic)
    const existingSubscription = user.subscriptions.find(sub => sub.creatorId === creatorId);
    if (existingSubscription && (!existingSubscription.expires || new Date(existingSubscription.expires) > new Date())) {
        return NextResponse.json({ message: 'Already subscribed to this creator.', subscription: existingSubscription }, { status: 200 });
    }

    // Mock: Deduct price from platform balance & add subscription record
    // In a real scenario, the platform contract would handle this logic atomically.
    user.platformBalanceXLM -= price;
    
    const newExpiry = new Date();
    newExpiry.setMonth(newExpiry.getMonth() + 1); // Mock 1-month subscription
    
    const newSubscription = {
        creatorId,
        subscribedSince: new Date().toISOString(),
        expires: newExpiry.toISOString(),
    };

    // Remove old subscription if it existed, then add new one
    const updatedSubscriptions = user.subscriptions.filter(sub => sub.creatorId !== creatorId);
    updatedSubscriptions.push(newSubscription);
    user.subscriptions = updatedSubscriptions;

    const updatedUser = await updateUser(currentUserId, {
        platformBalanceXLM: user.platformBalanceXLM,
        subscriptions: user.subscriptions,
    });

    await addUserAction(currentUserId, {
        type: 'SUBSCRIPTION',
        description: `Subscribed to ${creatorId} for ${price.toFixed(7)} XLM.`,
        amount: -price,
        targetId: creatorId,
    });

    if (!updatedUser) {
        throw new Error('Failed to update user after subscription.')
    }

    return NextResponse.json({
      message: `Successfully subscribed to ${creatorId}`,
      newPlatformBalance: updatedUser.platformBalanceXLM.toFixed(7),
      subscription: newSubscription,
    });

  } catch (error) {
    console.error("Subscribe API error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Subscription failed", details: errorMessage }, { status: 500 });
  }
} 