export interface UserAction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TIP' | 'SUBSCRIPTION' | 'NFT_PURCHASE' | 'CONTENT_VIEW';
  timestamp: string;
  description: string; // e.g., "Tipped 5 XLM to CreatorX", "Purchased 'Cool NFT #1'"
  amount?: number; // Optional, can be positive (deposit) or negative (spend)
  targetId?: string; // Optional, e.g., creatorId, nftId
}

export interface NftData {
  id: string; // Unique identifier for the NFT, could be premiumContentId or a contract-generated ID
  name: string;
  description: string;
  imageUrl: string; // URL for the NFT's primary image
  creatorId?: string; // Username or ID of the creator
  price?: number; // Price in XLM if it's for sale (e.g., in a listing)
  contractAddress?: string; // Stellar contract address of the NFT collection
  tokenId?: string; // The specific token ID within the NFT contract (if minted)
  // For premium content unlocking:
  premiumContentUrl?: string; // URL to the actual premium content (e.g., video)
  premiumContentType?: 'video' | 'article' | 'download' | 'image';
  purchaseDate?: string; // Added purchaseDate
}

export interface User {
  id: string; // Could be derived from passkey credential ID
  username?: string; // User's chosen display name
  passkeyCredentialId: string; // The raw ID of the passkey credential
  passkeyPublicKey: string; // The public key of the passkey
  // For hackathon simplicity, we'll mock the smart wallet association.
  // In a real scenario, this would be securely managed.
  smartWalletAddress: string;
  // Balances are managed by the platform contract after deposit.
  // These represent the user's internal balance within the platform.
  platformBalanceXLM: number;
  // Record of subscriptions
  subscriptions: Array<{
    creatorId: string;
    subscribedSince: string;
    expires?: string; // For time-limited subscriptions
  }>;
  // Record of owned NFTs
  ownedNfts: Array<NftData>;
  // Timeline of user actions on the platform
  actionHistory: UserAction[];
}

// For PasskeyKit interactions (simplified)
export interface PasskeyRegistrationChallenge {
  challenge: string;
  userId?: string; // Optional, could be pre-filled if user already has an account name
}

export interface PasskeyLoginChallenge {
  challenge: string;
  // Optional: allowCredentials can be used to suggest specific credentials to the client
  // allowCredentials?: Array<{ type: 'public-key', id: string }>;
} 