// app/main/page.tsx
'use client'; 

import React, { useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/contexts/UserContext';
import PasskeyAuth from '@/components/auth/PasskeyAuth';
import { NftData } from '@/lib/types';

// Improved creator profile with more engaging UI
const initialFeaturedCreator = {
  username: 'roti_lady30',
  displayName: 'Somying',
  bio: 'A street vendor in Thailand struggling to keep afloat.',
  location: 'Bangkok, Thailand',
  teaserVideoUrl: '/videos/roti_lady_teaser.mp4',
  bannerImageUrl: '/banner.jpg',
  profileImageUrl: '/profile.jpg',
  supportGoal: {
    current: 340,
    target: 1000,
    currency: 'XLM'
  },
  premiumContent: {
    id: 'prem1-roti-recipe',
    name: 'My secret plea for support',
    description: "A teary plea for support for her family and the reasons why she's struggling",
    imageUrl: 'https://upload.wikimedia.org/wikipedia/en/5/59/Padlock.svg',
    price: 50,
    creatorId: 'roti_lady30',
    premiumContentUrl: '/premium.mp4',
    premiumContentType: 'video',
  } as NftData,
  posts: [
    {
      id: 'post1',
      content: 'Cooking the banana roti! #thaifood #streetfood',
      imageUrl: '/cooking1.jpg',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      likes: 24
    },
    {
      id: 'post2',
      content: 'Almost ready, just needs some seasoning! 😊',
      imageUrl: '/cooking2.jpg',
      date: new Date(Date.now() - 86400000).toISOString(),
      likes: 36
    },
    {
      id: 'post3',
      content: 'Feeling grateful for all the support lately. It means the world to me and my family!',
      date: new Date().toISOString(),
      likes: 42
    }
  ]
};

const CreatorHero = ({ creator, onSupport, onUnlock, isLoggedIn }: any) => {
  return (
    <section className="bg-white py-4 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="rounded-lg p-4">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            {/* Profile Image */}
            <div className="mb-4 md:mb-0 md:mr-6">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img 
                  src={creator.profileImageUrl} 
                  alt={creator.displayName} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Creator Info */}
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-0.5">{creator.displayName}</h1>
              <p className="text-xs text-gray-500 mb-1">@{creator.username} • {creator.location}</p>
              <p className="text-sm text-gray-700 max-w-lg mb-3">{creator.bio}</p>
              
              {/* Support Goal */}
              <div className="max-w-md mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Support Goal</span>
                  <span>
                    {creator.supportGoal.current} / {creator.supportGoal.target} {creator.supportGoal.currency}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${(creator.supportGoal.current / creator.supportGoal.target * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <button 
                  onClick={() => onSupport()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-full transition shadow-md flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Support Creator
                </button>
                <button 
                  onClick={() => onUnlock()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-5 rounded-full transition shadow-md flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  Unlock Premium Content
                </button>
                {!isLoggedIn && (
                  <div className="text-xs text-gray-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sign in to support this creator
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContentPreview = ({ premiumContent, onPurchase, hasAccess }: any) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden my-6">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          Premium Content
          <span className="text-base font-normal text-gray-600 ml-3">Support this creator by purchasing exclusive content</span>
        </h2>
      </div>
      <div className="md:flex">
        <div className="md:w-1/3 relative h-48 md:h-auto">
          <div className="absolute inset-0">
            <img 
              src={premiumContent.imageUrl} 
              alt={premiumContent.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-indigo-600 text-white py-1 px-4 rounded-full font-bold">
                {premiumContent.price} XLM
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 md:w-2/3">
          <h3 className="text-xl font-bold text-gray-800">{premiumContent.name}</h3>
          <p className="mt-3 text-gray-700">{premiumContent.description}</p>
          {hasAccess ? (
            <button
              onClick={onPurchase}
              className="mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-full transition shadow-md inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              View Content
            </button>
          ) : (
            <button 
              onClick={onPurchase}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-full transition shadow-md inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Unlock This Content
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const TimelinePosts = ({ posts, isSubscribed }: any) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden my-6">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Creator Timeline</h2>
        {isSubscribed && (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            Subscribed
          </span>
        )}
      </div>
      
      {isSubscribed ? (
        <div className="divide-y">
          {posts.map((post: any) => (
            <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex flex-col">
                {/* Post content */}
                <div className="mb-3">
                  <p className="text-gray-700">{post.content}</p>
                </div>
                
                {/* Post image */}
                {post.imageUrl && (
                  <div className="my-3 rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={post.imageUrl} 
                      alt="Post"
                      className="w-full h-auto object-contain max-h-80" 
                    />
                  </div>
                )}
                
                {/* Post metadata and actions */}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(post.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </span>
                    
                    <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={post.hasLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-xs">{post.likes}</span>
                    </button>
                  </div>
                  
                  <div>
                    <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-2 py-1 rounded-full hover:bg-indigo-50 transition-colors">
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-lg border border-indigo-100 inline-block mx-auto mb-4 max-w-md">
            <div className="bg-white rounded-full p-3 w-14 h-14 mx-auto mb-3 shadow-sm flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-gray-800 font-bold text-lg mb-2">Exclusive Content Access</h3>
            <p className="text-gray-600 text-sm max-w-xs mx-auto mb-4">
              Subscribe to access the creator's timeline and stay updated with their latest posts.
            </p>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-full transition shadow-sm text-sm inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Subscribe for 10 XLM/month
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const GetStartedGuide = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 my-8 shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Getting Started with OnlyFrens</h2>
      
      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="bg-indigo-100 text-indigo-700 w-10 h-10 rounded-full flex items-center justify-center mb-3">
            <span className="font-bold">1</span>
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Create Your Passkey</h3>
          <p className="text-gray-600 text-sm">Sign up with a secure passkey - no passwords to remember, just your device's biometrics.</p>
          <button onClick={onLogin} className="mt-4 text-indigo-600 font-medium text-sm hover:text-indigo-800">
            Get Started →
          </button>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="bg-indigo-100 text-indigo-700 w-10 h-10 rounded-full flex items-center justify-center mb-3">
            <span className="font-bold">2</span>
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Fund Your Wallet</h3>
          <p className="text-gray-600 text-sm">Add XLM to your OnlyFrens wallet to support creators and unlock premium content.</p>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <div className="bg-indigo-100 text-indigo-700 w-10 h-10 rounded-full flex items-center justify-center mb-3">
            <span className="font-bold">3</span>
          </div>
          <h3 className="font-bold text-gray-800 mb-2">Support Creators</h3>
          <p className="text-gray-600 text-sm">Subscribe to creators, purchase NFTs, and make a real difference in their lives.</p>
        </div>
      </div>
      
      <div className="mt-6 text-center text-gray-600 text-sm">
        <p>Powered by Soroban smart contracts, Passkey-Kit, and Launchtube for seamless web3 experiences.</p>
      </div>
    </div>
  );
};

export default function HomePage() {
  const { user, isLoading, subscribeToCreator, tipCreator, purchaseNft } = useUser();
  const [creator, setCreator] = useState(initialFeaturedCreator);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumContent, setShowPremiumContent] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportStatus, setSupportStatus] = useState<{ success: boolean; message: string; isLoading: boolean } | null>(null);
  const [fakeAccess, setFakeAccess] = useState<Record<string, boolean>>({});
  
  const isSubscribedToCreator = user?.isLoggedIn && user.subscriptions.some(
    sub => sub.creatorId === creator.username && (!sub.expires || new Date(sub.expires) > new Date())
  );
  
  const hasPremiumAccess = user?.isLoggedIn && user.ownedNfts.some(
    nft => nft.id === creator.premiumContent.id
  );
  const effectiveHasPremiumAccess = hasPremiumAccess || !!fakeAccess[creator.premiumContent.id];
  
  const handlePurchaseContent = async () => {
    const contentId = creator.premiumContent.id;
    const currentEffectiveAccess = hasPremiumAccess || !!fakeAccess[contentId];

    if (!user?.isLoggedIn) {
      setShowAuthModal(true);
      return;
    }

    if (currentEffectiveAccess) {
      if (hasPremiumAccess) { // If access is potentially real (user has the NFT)
        // Verify NFT ownership with backend before showing premium content
        try {
          const response = await fetch('/api/nft/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id, // user is confirmed to be logged in here
              walletAddress: user.smartWalletAddress,
              nftId: contentId,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to verify NFT ownership');
          }

          const result: { success?: boolean; hasAccess?: boolean } = await response.json();

          if (!result.success || !result.hasAccess) {
            setSupportStatus({
              success: false,
              message: 'Access verification failed. Please try again.',
              isLoading: false
            });
            return; // Do not show content if verification fails
          }
          
          // Approved - show premium content
          setShowPremiumContent(true);
        } catch (error: any) {
          console.error('Error verifying NFT access:', error);
          setSupportStatus({
            success: false,
            message: `Verification failed: ${error.message}`,
            isLoading: false
          });
        }
      } else { // Access is purely from fakeAccess (currentEffectiveAccess is true but hasPremiumAccess is false)
        setShowPremiumContent(true); // Just show it, no verification needed for fake access
      }
      return;
    }

    // User is logged in, and currentEffectiveAccess is false. This is the "Unlock This Content" click.
    // Perform the fake purchase.
    const { price = 0 } = creator.premiumContent;

    // 1. Update support goal
    setCreator(prev => ({
      ...prev,
      supportGoal: {
        ...prev.supportGoal,
        current: prev.supportGoal.current + price,
      },
    }));

    // 2. Grant fake access
    setFakeAccess(prev => ({
      ...prev,
      [contentId]: true,
    }));

    // 3. Set status message (optional, for consistency with original purchase flow)
    setSupportStatus({
      success: true,
      message: 'Content unlocked! (Simulated)',
      isLoading: false,
    });
    // This status might not be directly visible unless a modal that uses it is also shown.
    // The main feedback is the content modal appearing and button text changing.

    // 4. Show the premium content modal directly after fake unlock.
    setShowPremiumContent(true);
  };
  
  const handleSupportCreator = () => {
    if (!user?.isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    
    setSupportStatus(null);
    setShowSupportModal(true);
  };
  
  const handleSubscribe = async () => {
    if (!user?.isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      setSupportStatus({ success: false, message: '', isLoading: true });
      await subscribeToCreator(creator.username, 10); // 10 XLM per month subscription
      
      // Update support goal
      setCreator(prev => ({
        ...prev,
        supportGoal: {
          ...prev.supportGoal,
          current: prev.supportGoal.current + 10
        }
      }));
      
      setSupportStatus({
        success: true,
        message: 'Successfully subscribed to creator!',
        isLoading: false
      });
      
      // Close modal after a delay to show success message
      setTimeout(() => {
        setShowSupportModal(false);
        setSupportStatus(null);
      }, 2000);
    } catch (e: any) {
      setSupportStatus({
        success: false,
        message: `Subscription failed: ${e.message}`,
        isLoading: false
      });
    }
  };
  
  const handleTip = async (amount: number) => {
    if (!user?.isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      setSupportStatus({ success: false, message: '', isLoading: true });
      await tipCreator(creator.username, amount);
      
      // Update support goal
      setCreator(prev => ({
        ...prev,
        supportGoal: {
          ...prev.supportGoal,
          current: prev.supportGoal.current + amount
        }
      }));
      
      setSupportStatus({
        success: true,
        message: `Successfully sent ${amount} XLM tip to ${creator.displayName}!`,
        isLoading: false
      });
      
      // Close modal after a delay to show success message
      setTimeout(() => {
        setShowSupportModal(false);
        setSupportStatus(null);
      }, 2000);
    } catch (e: any) {
      setSupportStatus({
        success: false,
        message: `Tip failed: ${e.message}`,
        isLoading: false
      });
    }
  };

  return (
    <>
      <CreatorHero 
        creator={creator} 
        onSupport={handleSupportCreator}
        onUnlock={handlePurchaseContent}
        isLoggedIn={user?.isLoggedIn}
      />
      
      {!user?.isLoggedIn && (
        <GetStartedGuide onLogin={() => setShowAuthModal(true)} />
      )}
      
      <ContentPreview 
        premiumContent={creator.premiumContent}
        onPurchase={handlePurchaseContent}
        hasAccess={effectiveHasPremiumAccess}
      />
      
      <TimelinePosts 
        posts={creator.posts}
        isSubscribed={isSubscribedToCreator}
      />
      
      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
            <div className="p-4 bg-indigo-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Sign in with Passkey</h2>
            </div>
            <div className="p-6">
              <PasskeyAuth onAuthComplete={() => setShowAuthModal(false)} />
            </div>
          </div>
        </div>
      )}
      
      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
            <div className="p-4 bg-indigo-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Support {creator.displayName}</h2>
            </div>
            <div className="p-6">
              {supportStatus ? (
                <div className={`mb-6 p-4 rounded-lg ${supportStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {supportStatus.isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {supportStatus.success ? (
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {supportStatus.message}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">Choose how you'd like to support this creator:</p>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={handleSubscribe}
                      className="w-full p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-left flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium text-indigo-800">Monthly Subscription</span>
                        <p className="text-sm text-gray-600">Access to exclusive timeline updates</p>
                      </div>
                      <span className="text-indigo-700 font-bold">10 XLM/mo</span>
                    </button>
                    
                    <button 
                      onClick={() => handleTip(5)}
                      className="w-full p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-left flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium text-green-800">Small Tip</span>
                        <p className="text-sm text-gray-600">Every bit helps!</p>
                      </div>
                      <span className="text-green-700 font-bold">5 XLM</span>
                    </button>
                    
                    <button 
                      onClick={() => handleTip(20)}
                      className="w-full p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-left flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium text-green-800">Medium Tip</span>
                        <p className="text-sm text-gray-600">Show your appreciation</p>
                      </div>
                      <span className="text-green-700 font-bold">20 XLM</span>
                    </button>
                    
                    <button 
                      onClick={() => handleTip(50)}
                      className="w-full p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-left flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium text-green-800">Large Tip</span>
                        <p className="text-sm text-gray-600">Make a significant impact</p>
                      </div>
                      <span className="text-green-700 font-bold">50 XLM</span>
                    </button>
                  </div>
                </>
              )}
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => {
                    setShowSupportModal(false);
                    setSupportStatus(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  {supportStatus?.success ? 'Close' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Premium Content Modal */}
      {showPremiumContent && effectiveHasPremiumAccess && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-4xl w-full">
            <div className="p-4 bg-indigo-50 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">{creator.premiumContent.name}</h2>
              <button 
                onClick={() => setShowPremiumContent(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="relative pb-[56.25%] bg-gray-200 rounded-lg mb-4">
                <video 
                  className="absolute inset-0 w-full h-full object-cover"
                  src={creator.premiumContent.premiumContentUrl} 
                  controls 
                  autoPlay
                  controlsList="nodownload"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{creator.premiumContent.name}</h3>
              <p className="text-gray-700">{creator.premiumContent.description}</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="ml-2 text-sm text-gray-600">
                    This premium content is unlocked because you own the NFT.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 