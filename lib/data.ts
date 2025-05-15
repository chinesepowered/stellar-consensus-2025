// lib/data.ts

export interface Creator {
  id: string;
  username: string;
  bio: string;
  teaserVideoUrl: string;
  avatarUrl: string;
  timeline: Array<{ id: string; type: 'image' | 'text'; content: string; timestamp: string }>;
  premiumContent: {
    id: string;
    title: string;
    description: string;
    type: 'video' | 'document';
    contentUrl: string; // URL to the actual premium content
    nftImageUrl: string; // Image for the NFT
    nftName: string;
    nftDescription: string;
  };
}

export interface UserAction {
  id: string;
  type: 'Subscription' | 'Tip' | 'NFT Mint' | 'Login' | 'Logout';
  timestamp: string;
  details: string;
  creatorId?: string;
  amount?: string; // For tips
  nftId?: string; // For NFT mints
}

export const featuredCreator: Creator = {
  id: 'roti_lady30',
  username: 'roti_lady30',
  bio: 'A street vendor in Thailand specializing in delicious Roti, struggling to keep her stall afloat after recent economic challenges. Support her to keep the tradition alive!',
  teaserVideoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4', // Placeholder video
  avatarUrl: 'https://i.pravatar.cc/150?u=roti_lady30', // Placeholder avatar
  timeline: [
    { id: 't1', type: 'image', content: 'https://picsum.photos/seed/roti1/600/400', timestamp: '2024-07-28T10:00:00Z' }, // Placeholder image
    { id: 't2', type: 'text', content: 'So grateful for the support I've received so far! It means the world to me.', timestamp: '2024-07-28T12:30:00Z' },
    { id: 't3', type: 'image', content: 'https://picsum.photos/seed/roti2/600/400', timestamp: '2024-07-29T09:15:00Z' }, // Placeholder image
    { id: 't4', type: 'text', content: 'New batch of mango sticky rice Roti coming up tomorrow!', timestamp: '2024-07-29T15:00:00Z' },
  ],
  premiumContent: {
    id: 'nft_roti_recipe_001',
    title: 'Secret Roti Recipe Video',
    description: 'Unlock the generations-old secret recipe for my signature crispy Roti, passed down in my family.',
    type: 'video',
    contentUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4', // Placeholder premium video
    nftImageUrl: 'https://picsum.photos/seed/nft_roti/300/300', // Placeholder NFT image
    nftName: "Roti Lady's Secret Recipe Scroll",
    nftDescription: "This NFT grants exclusive access to Roti Lady's secret family recipe for her famous crispy Roti. A collector's item and a piece of culinary heritage.",
  },
};

// Dummy contract IDs - REPLACE WITH ACTUAL DEPLOYED CONTRACT IDs
export const DUMMY_SUBSCRIPTION_CONTRACT_ID: string = 'CDUMMYSUBSCRIPTIONCONTRACTIDAAAAAAAAAAAAAAAAAAAAAAAAAAA';
export const DUMMY_TIPJAR_CONTRACT_ID: string = 'CDUMMYTIPJARCONTRACTIDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
export const DUMMY_NFT_MINT_CONTRACT_ID: string = 'CDUMMYNFTMINTCONTRACTIDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
export const DUMMY_WALLET_WASM_HASH: string = 'YOUR_SMART_WALLET_WASM_HASH_HERE_32_BYTES_HEX_ENCODED'; // Placeholder

// Placeholder for Launchtube configuration (replace with actual values)
export const LAUNCHTUBE_URL: string = 'https://testnet.launchtube.xyz'; // Or your self-hosted instance

// Placeholder for PasskeyKit configuration
export const RPC_URL: string = 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE: string = 'Test SDF Network ; September 2015';
// This would be the contract ID of your smart wallet factory, if you're deploying new smart wallets for users.
// For this example, we might assume users already have a compatible wallet or use a simpler passkey signing flow.
export const FACTORY_CONTRACT_ID: string = 'YOUR_FACTORY_CONTRACT_ID_IF_APPLICABLE';

console.log("Don't forget to replace DUMMY contract IDs and PasskeyKit/Launchtube config in lib/data.ts with actual values!"); 