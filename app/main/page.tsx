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
  bio: 'A street vendor in Thailand struggling to keep afloat. Selling delicious homemade roti to support my family.',
  location: 'Bangkok, Thailand',
  teaserVideoUrl: '/videos/roti_lady_teaser.mp4',
  bannerImageUrl: 'https://images.unsplash.com/photo-1496412705862-e0088f16f791?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
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
      content: 'Fresh batch of roti dough, ready for the day! #thaifood #streetfood',
      imageUrl: '/cooking1.jpg',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      likes: 24
    },
    {
      id: 'post2',
      content: 'Happy customer enjoying a banana Nutella roti! 😊',
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
    <section className="relative">
      {/* Banner Image */}
      <div className="h-64 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <img 
          src={creator.bannerImageUrl} 
          alt="Creator Banner"
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Profile Content */}
      <div className="container mx-auto px-4 relative -mt-24 z-20">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col md:flex-row">
            {/* Profile Image */}
            <div className="md:mr-8 mb-4 md:mb-0 flex-shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md mx-auto md:mx-0">
                <img 
                  src={creator.profileImageUrl} 
                  alt={creator.displayName} 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Creator Info */}
            <div className="flex-grow">
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{creator.displayName}</h1>
                <p className="text-gray-500">@{creator.username} • {creator.location}</p>
                <p className="mt-2 text-gray-700 max-w-3xl">{creator.bio}</p>
              </div>
              
              {/* Support Goal */}
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Support Goal</span>
                  <span>
                    {creator.supportGoal.current} / {creator.supportGoal.target} {creator.supportGoal.currency}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-indigo-600 h-3 rounded-full" 
                    style={{ width: `${(creator.supportGoal.current / creator.supportGoal.target * 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <button 
                  onClick={() => onSupport()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-full transition shadow-md"
                >
                  Support Creator
                </button>
                <button 
                  onClick={() => onUnlock()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-full transition shadow-md"
                >
                  Unlock Premium Content
                </button>
                {!isLoggedIn && (
                  <div className="text-sm text-gray-500 mt-2 sm:mt-3 sm:ml-4 sm:text-left text-center">
                    Sign in with Passkey to support this creator
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden my-8">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-800">Premium Content</h2>
        <p className="text-gray-600 mt-1">Support this creator by purchasing exclusive content</p>
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden my-8">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-800">Creator Timeline</h2>
        <p className="text-gray-600 mt-1">
          {isSubscribed 
            ? "Latest updates from this creator" 
            : "Subscribe to see creator updates"}
        </p>
      </div>
      
      {isSubscribed ? (
        <div className="divide-y">
          {posts.map((post: any) => (
            <div key={post.id} className="p-6">
              <div className="flex items-start">
                <div className="flex-grow">
                  <p className="text-gray-700 mb-2">{post.content}</p>
                  {post.imageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden max-h-96">
                      <img 
                        src={post.imageUrl} 
                        alt="Post"
                        className="w-full h-auto object-cover" 
                      />
                    </div>
                  )}
                  <div className="mt-3 flex items-center text-gray-500 text-sm">
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                    <span className="mx-2">•</span>
                    <button className="flex items-center hover:text-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {post.likes}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 inline-block mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-gray-700 font-medium mt-4">Subscribe to View Timeline</h3>
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
              Subscribe to this creator to view their exclusive timeline posts and updates.
            </p>
            <button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-full transition shadow-md text-sm">
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
  const [creator] = useState(initialFeaturedCreator);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumContent, setShowPremiumContent] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  const isSubscribedToCreator = user?.isLoggedIn && user.subscriptions.some(
    sub => sub.creatorId === creator.username && (!sub.expires || new Date(sub.expires) > new Date())
  );
  
  const hasPremiumAccess = user?.isLoggedIn && user.ownedNfts.some(
    nft => nft.id === creator.premiumContent.id
  );
  
  const handlePurchaseContent = async () => {
    if (!user?.isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    
    if (hasPremiumAccess) {
      // Verify NFT ownership with backend before showing premium content
      try {
        const response = await fetch('/api/nft/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            walletAddress: user.smartWalletAddress,
            nftId: creator.premiumContent.id,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to verify NFT ownership');
        }
        
        const result: { success?: boolean; hasAccess?: boolean } = await response.json();
        
        if (!result.success || !result.hasAccess) {
          alert('Access verification failed. Please try again.');
          return;
        }
        
        // Approved - show premium content
        setShowPremiumContent(true);
      } catch (error: any) {
        console.error('Error verifying NFT access:', error);
        alert(`Verification failed: ${error.message}`);
      }
      return;
    }
    
    // Prepare the purchase
    const { id, name, description, imageUrl, premiumContentUrl, premiumContentType, price = 0, creatorId = '' } = creator.premiumContent;
    
    purchaseNft({ 
      id, 
      name, 
      description, 
      imageUrl, 
      premiumContentUrl, 
      premiumContentType,
      price, 
      creatorId 
    }).catch(err => {
      alert(`Purchase failed: ${err.message}`);
    });
  };
  
  const handleSupportCreator = () => {
    if (!user?.isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    
    setShowSupportModal(true);
  };
  
  const handleSubscribe = async () => {
    if (!user?.isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      await subscribeToCreator(creator.username, 10); // 10 XLM per month subscription
    } catch (e: any) {
      alert(`Subscription failed: ${e.message}`);
    }
  };
  
  const handleTip = async (amount: number) => {
    if (!user?.isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      await tipCreator(creator.username, amount);
      setShowSupportModal(false);
    } catch (e: any) {
      alert(`Tip failed: ${e.message}`);
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
        hasAccess={hasPremiumAccess}
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
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowSupportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Premium Content Modal */}
      {showPremiumContent && hasPremiumAccess && (
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