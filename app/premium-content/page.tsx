'use client';

import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext'; // Adjust path if necessary
import Link from 'next/link';
import { NftData } from '@/lib/types'; // Added NftData import

export default function PremiumContentPage() {
  const { user, isLoadingUser, hasPremiumAccess, loginWithPasskey, purchaseNft, isLoading } = useUser(); // Added purchaseNft and isLoading
  const [isPurchasing, setIsPurchasing] = useState(false); // Added for purchase loading state

  // Define the details for the premium access NFT
  const premiumAccessNftDetails: Omit<NftData, 'id' | 'purchaseDate' | 'contractAddress' | 'tokenId'> & { id: string; price: number; creatorId: string } = {
    id: 'premium-access-nft-001', // Unique ID for this type of NFT purchase
    name: 'Site Premium Access Pass',
    description: 'Unlocks all premium content on the site.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Golden_key.svg/1200px-Golden_key.svg.png', // Placeholder image
    price: 25, // Example price in XLM
    creatorId: 'platform-admin', // Identifier for platform-issued NFTs
  };

  const handlePurchaseAccess = async () => {
    if (!user) {
      alert('Please log in to purchase access.');
      loginWithPasskey();
      return;
    }
    setIsPurchasing(true);
    try {
      await purchaseNft(premiumAccessNftDetails, { directOnChainOnly: true });
      alert('Premium Access NFT Purchase initiated! You should have access if on-chain minting succeeds.');
      // The UserContext state update (now conditional on on-chain success) should trigger a re-render
    } catch (error: any) {
      console.error('Failed to purchase premium access NFT:', error);
      alert(`Purchase failed: ${error.message}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoadingUser || isPurchasing) { // Added isPurchasing to loading condition
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Loading User Information...</h1>
        <p className="mt-2 text-sm text-gray-600">Please wait while we check your access.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-md text-gray-700">You must be logged in to view premium content.</p>
        <button 
          onClick={loginWithPasskey}
          className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Log In with Passkey
        </button>
        <p className="mt-4">
          <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
            Go back to Homepage
          </Link>
        </p>
      </div>
    );
  }

  if (!hasPremiumAccess()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Premium Access Required</h1>
        <p className="mt-2 text-md text-gray-700">You do not currently have access to this premium content.</p>
        <p className="mt-1 text-sm text-gray-600">Purchase our Premium Access NFT to unlock all exclusive content!</p>
        
        {/* Existing link to wallet page (optional, can be kept or removed) */}
        <Link href="/wallet" 
          className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Go to Wallet Page (for deposits/other actions)
        </Link>

        {/* New Button to Purchase Premium Access NFT */}
        <button
          onClick={handlePurchaseAccess}
          disabled={isPurchasing || isLoading}
          className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isPurchasing ? 'Processing Purchase...' : `Purchase Premium Access NFT (${premiumAccessNftDetails.price} XLM)`}
        </button>

        <p className="mt-4">
          <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
            Go back to Homepage
          </Link>
        </p>
      </div>
    );
  }

  // User is logged in and has premium access
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-700">Welcome to Our Exclusive Premium Content!</h1>
          <p className="mt-3 text-lg text-gray-600">Thank you for being a valued NFT holder.</p>
        </header>
        
        <main className="bg-white shadow-xl rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Top Secret Hackathon Strategy</h2>
          <p className="text-gray-700 mb-6">
            This is the content you get for owning the special NFT! Here are some (mock) top-secret details for winning the hackathon:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-8">
            <li>Always ensure your `.env` files are up to date with the latest private keys and tokens.</li>
            <li>When in doubt, `console.log()` everything. It's the duct tape of debugging.</li>
            <li>Remember that Soroban fees are complex; Launchtube is your friend.</li>
            <li>Frontend styling can make or break a demo – spend a little time making it look nice!</li>
            <li>Celebrate small victories with your team. High morale leads to better code.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Another Premium Article</h2>
          <p className="text-gray-700">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </main>

        <footer className="mt-10 text-center">
          <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
            &larr; Back to Homepage
          </Link>
        </footer>
      </div>
    </div>
  );
} 