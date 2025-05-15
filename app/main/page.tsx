// app/main/page.tsx
'use client'; 

import React, { useState, useEffect } from 'react';
import CreatorProfile from '@/components/creator/CreatorProfile';
import TimelinePost, { TimelinePostData } from '@/components/creator/TimelinePost';
import PremiumContentSection from '@/components/pages/home/PremiumContentSection'; 
import ActionsPanel from '@/components/pages/home/ActionsPanel';
import { useUser } from '@/contexts/UserContext';
import { NftData } from '@/lib/types'; // For the premiumContent definition
import PremiumContent from '@/components/PremiumContent'; // For viewing unlocked content

// Mock data - this would eventually come from APIs / state management
const initialFeaturedCreator = {
  username: 'roti_lady30',
  bio: 'A street vendor in Thailand struggling to keep afloat. Selling delicious homemade roti to support my family.',
  teaserVideoUrl: '/videos/roti_lady_teaser.mp4', 
  timelinePosts: [
    { id: 'tl1', type: 'photo', content: 'Fresh batch of roti dough, ready for the day! #thaifood #streetfood', imageUrl: 'https://via.placeholder.com/600x400.png?text=Roti+Dough', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'tl2', type: 'photo', content: 'Happy customer enjoying a banana Nutella roti! 😊', imageUrl: 'https://via.placeholder.com/600x400.png?text=Happy+Customer', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 'tl3', type: 'text', content: 'Feeling grateful for all the support lately. It means the world to me and my family!', timestamp: new Date().toISOString() },
  ] as TimelinePostData[],
  premiumContent: {
    id: 'prem1-roti-recipe', // Unique ID for this premium content NFT
    name: 'Exclusive Roti Recipe Video',
    description: 'Learn to make my family\'s secret recipe for authentic Thai roti, passed down for generations!',
    imageUrl: 'https://via.placeholder.com/300.png?text=Roti+Recipe+NFT',
    price: 50, // XLM
    creatorId: 'roti_lady30',
    premiumContentUrl: '/videos/roti_lady_recipe.mp4', 
    premiumContentType: 'video',
  } as NftData // Use the NftData type from lib/types
};

export default function HomePage() {
  const [featuredCreator] = useState(initialFeaturedCreator);
  const { user, isLoading: isUserContextLoading, subscribeToCreator, tipCreator, purchaseNft } = useUser();
  const [isPremiumContentModalOpen, setIsPremiumContentModalOpen] = useState(false);
  const [selectedNftForModal, setSelectedNftForModal] = useState<NftData | null>(null);

  const handleSubscribe = async () => {
    if (!user || !user.isLoggedIn) {
        alert("Please log in to subscribe.");
        return;
    }
    try {
        await subscribeToCreator(featuredCreator.username, 10); // Assuming 10 XLM price
    } catch (e: any) {
        alert(`Subscription failed: ${e.message}`);
    }
  };

  const handleTip = async (amount: number) => {
    if (!user || !user.isLoggedIn) {
        alert("Please log in to tip.");
        return;
    }
    try {
        await tipCreator(featuredCreator.username, amount);
    } catch (e: any) {
        alert(`Tip failed: ${e.message}`);
    }
  };

  const handlePurchaseNft = async () => {
    if (!user || !user.isLoggedIn) {
        alert("Please log in to purchase.");
        return;
    }
    try {
        // Prepare the NftData subset needed for the purchaseNft context method
        const { id, name, description, imageUrl, premiumContentUrl, premiumContentType, price = 0, creatorId = '' } = featuredCreator.premiumContent;
        await purchaseNft({ 
            id, 
            name, 
            description, 
            imageUrl, 
            premiumContentUrl, 
            premiumContentType,
            price, 
            creatorId 
        });
    } catch (e: any) {
        alert(`NFT Purchase failed: ${e.message}`);
    }
  };

  const isSubscribedToFeaturedCreator = user?.isLoggedIn && user.subscriptions.some(sub => sub.creatorId === featuredCreator.username && (!sub.expires || new Date(sub.expires) > new Date()));
  const hasPremiumAccess = user?.isLoggedIn && user.ownedNfts.some(nft => nft.id === featuredCreator.premiumContent.id);

  const viewPremiumContent = () => {
    if (hasPremiumAccess) {
        setSelectedNftForModal(featuredCreator.premiumContent);
        setIsPremiumContentModalOpen(true);
    }
  };

  return (
    <>
      <CreatorProfile creator={featuredCreator} />
      
      {user && user.isLoggedIn && (
        <ActionsPanel 
            creatorUsername={featuredCreator.username}
            isSubscribed={!!isSubscribedToFeaturedCreator} // Pass boolean
            onSubscribe={handleSubscribe} 
            onTip={handleTip}
            isLoading={isUserContextLoading}
        />
      )}
      
      <PremiumContentSection 
        premiumContent={featuredCreator.premiumContent} 
        hasAccess={!!hasPremiumAccess} // Pass boolean
        isLoggedIn={!!user?.isLoggedIn} // Pass boolean
        onPurchase={handlePurchaseNft}
        onViewContent={viewPremiumContent} // Pass function to view content
        isLoading={isUserContextLoading}
      />

      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 my-6 ring-1 ring-gray-200">
        <h3 className="text-2xl md:text-3xl font-semibold mb-6 text-gray-700">Creator Timeline</h3>
        {isSubscribedToFeaturedCreator ? (
          <div className="space-y-6">
            {featuredCreator.timelinePosts.map(post => (
              <TimelinePost key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 text-lg">
              {user && user.isLoggedIn ? 
                'Subscribe to view exclusive timeline content.' : 
                'Login and subscribe to view the timeline.'
              }
            </p>
            {!(user && user.isLoggedIn) && <p className="text-sm text-gray-400 mt-2">(Use the global login button in Navbar)</p>}
          </div>
        )}
      </div>

      {isPremiumContentModalOpen && selectedNftForModal && (
        <PremiumContent 
            nft={selectedNftForModal} 
            onClose={() => setIsPremiumContentModalOpen(false)} 
        />
      )}
    </>
  );
} 