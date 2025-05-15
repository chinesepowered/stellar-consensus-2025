import { NextResponse } from 'next/server';
import { getUserByPasskeyId, updateUser, addUserAction } from '@/lib/mockUserDb';
import { User, NftData } from '@/lib/types'; // Import NftData
// We need NftData type for the request body if it includes full details for minting
// If NftData from components/user/NftCard.tsx is used, ensure paths are correct or type is duplicated/shared
// For simplicity, let's assume nftDetailsForMinting is a simple object for now.

async function getUserIdFromSession(request: Request): Promise<string | null> {
  const mockSessionToken = request.headers.get('Authorization')?.split('Bearer ')?.[1];
  if (mockSessionToken) return mockSessionToken;
  return null;
}

interface BuyNftRequestBody {
  premiumContentId: string; // Identifier for the premium content being purchased
  price: number;
  creatorId: string; // Needed for potential revenue split or tracking
  // userSmartWalletAddress: string; // User's smart wallet for the NFT (already in User object)
  nftDetailsForMinting: Omit<NftData, 'id' | 'contractAddress' | 'tokenId' | 'purchaseDate' | 'creatorId' | 'price'>; // Use imported NftData, omit fields that are set here or not applicable for minting input
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

    const { premiumContentId, price, creatorId, nftDetailsForMinting } = (await request.json()) as BuyNftRequestBody;
    if (!premiumContentId || typeof price !== 'number' || price < 0 || !creatorId || !nftDetailsForMinting) {
      return NextResponse.json({ error: 'Invalid request body for NFT purchase' }, { status: 400 });
    }

    if (user.platformBalanceXLM < price) {
      return NextResponse.json({ error: 'Insufficient platform balance for NFT purchase' }, { status: 400 });
    }
    
    // Check if user already owns this NFT to prevent re-purchase (optional, depends on logic)
    if (user.ownedNfts.some(nft => nft.id === premiumContentId)) {
        return NextResponse.json({ 
            message: "NFT already owned.", 
            nft: user.ownedNfts.find(nft => nft.id === premiumContentId) 
        }, { status: 200 });
    }

    // Mock: Deduct price, "mint" NFT by adding to user's ownedNfts list.
    // In a real Soroban scenario:
    // 1. Platform contract would be called (backend admin-authed call).
    // 2. It would deduct user's internal balance.
    // 3. It would call the NFT contract's mint function, assigning ownership to the user's smartWalletAddress.

    user.platformBalanceXLM -= price;
    
    const newNftEntry: NftData = {
        ...nftDetailsForMinting, // Spread the provided details
        id: premiumContentId, // Using premiumContentId as the unique ID for the NFT record
        creatorId: creatorId, // Ensure creatorId from request is included if not in nftDetailsForMinting
        price: price, // Store the purchase price
        purchaseDate: new Date().toISOString(),
        contractAddress: "mock-nft-contract-addr-" + premiumContentId.substring(0,4), // Would come from actual deployment
        tokenId: "mock-token-" + Date.now().toString().slice(-6), // Would come from NFT contract mint function
    };

    user.ownedNfts.push(newNftEntry);

    const updatedUser = await updateUser(currentUserId, {
        platformBalanceXLM: user.platformBalanceXLM,
        ownedNfts: user.ownedNfts,
    });

    await addUserAction(currentUserId, {
        type: 'NFT_PURCHASE',
        description: `Purchased NFT '${nftDetailsForMinting.name}' for ${price.toFixed(7)} XLM.`,
        amount: -price,
        targetId: premiumContentId, // Could be creatorId or an internal content ID
    });
    
    if (!updatedUser) {
        throw new Error('Failed to update user data after NFT purchase.')
    }

    return NextResponse.json({
      message: `Successfully purchased NFT: ${nftDetailsForMinting.name}`,
      newPlatformBalance: updatedUser.platformBalanceXLM.toFixed(7),
      nft: newNftEntry,
    });

  } catch (error) {
    console.error("Buy NFT API error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "NFT Purchase failed", details: errorMessage }, { status: 500 });
  }
} 