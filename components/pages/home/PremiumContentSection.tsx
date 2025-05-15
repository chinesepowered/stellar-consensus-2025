'use client';

import React from 'react';
import { NftData } from '@/lib/types';

interface PremiumContentSectionProps {
  premiumContent: NftData;
  hasAccess: boolean;
  isLoggedIn: boolean;
  onPurchase: () => void;
  onViewContent: () => void;
  isLoading?: boolean;
}

const PremiumContentSection: React.FC<PremiumContentSectionProps> = ({ 
  premiumContent, 
  hasAccess, 
  isLoggedIn,
  onPurchase,
  onViewContent,
  isLoading
}) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 text-white shadow-2xl rounded-xl p-6 md:p-8 my-8 ring-2 ring-purple-400 ring-offset-4 ring-offset-gray-50">
      <h3 className="text-3xl md:text-4xl font-bold mb-5 text-center">Exclusive Premium Content</h3>
      <div className={`transition-opacity duration-500 ease-in-out ${hasAccess ? 'opacity-100' : 'opacity-80 group'}`}>
        <div className="text-center mb-6">
            <p className="text-xl font-semibold">{premiumContent.name}</p>
            <p className="text-purple-200 text-md">{premiumContent.description}</p>
        </div>

        {hasAccess ? (
          <div>
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6 shadow-2xl ring-1 ring-white/20">
                <video controls autoPlay src={premiumContent.premiumContentUrl} className="w-full h-full rounded-lg focus:outline-none" poster={premiumContent.imageUrl.replace('NFT', 'Video+Poster')}>
                    Your browser does not support the video tag.
                </video>
            </div>
            <button 
                onClick={onViewContent} 
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-10 rounded-lg text-xl shadow-xl transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 mb-4"
            >
                View Fullscreen / Details
            </button>
            <div className="mt-2 p-5 border border-purple-400 rounded-lg bg-white/10 backdrop-blur-sm shadow-lg">
                <h4 className="font-semibold text-xl mb-3 text-yellow-300">Your Collectible NFT:</h4>
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <img src={premiumContent.imageUrl} alt="NFT Image" className="w-32 h-32 rounded-lg shadow-lg ring-2 ring-white/50 object-cover" />
                    <div>
                        <p><strong>Name:</strong> {premiumContent.name}</p>
                        <p className="text-sm"><strong>Description:</strong> {premiumContent.description}</p>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 px-4 bg-black/20 rounded-lg shadow-inner group-hover:bg-black/30 transition-colors duration-300">
            <img src={premiumContent.imageUrl} alt={`${premiumContent.name} NFT`} className="w-40 h-40 rounded-xl mx-auto mb-5 shadow-2xl ring-2 ring-purple-400/50" />
            <p className="text-purple-100 text-lg mb-6">Purchase the NFT for {premiumContent.price} XLM to unlock this exclusive video and get the digital collectible!</p>
            {isLoggedIn ? (
                <button 
                    onClick={onPurchase}
                    disabled={isLoading}
                    className="bg-yellow-400 hover:bg-yellow-500 text-purple-800 font-bold py-3 px-10 rounded-lg text-xl shadow-xl transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:opacity-50"
                >
                    {isLoading? 'Processing...' : `Buy NFT & Unlock (${premiumContent.price} XLM)`}
                </button>
            ) : (
                <p className="text-yellow-300 font-semibold">Please log in to purchase.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumContentSection; 