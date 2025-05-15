'use client';

import React from 'react';
import { NftData } from '@/lib/types'; // Import the standardized NftData

interface PremiumContentProps {
  nft: NftData; // The NFT that unlocks this content
  // contentUrl is now part of NftData as premiumContentUrl
  // contentType is now part of NftData as premiumContentType
  onClose?: () => void; // If shown in a modal
}

const PremiumContent: React.FC<PremiumContentProps> = ({ 
  nft,
  onClose 
}) => {
  const { premiumContentUrl, premiumContentType } = nft; // Destructure from nft prop

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 md:p-8 relative ring-1 ring-gray-300">
        {onClose && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        )}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{nft.name}</h2>
        <p className="text-sm text-gray-500 mb-4">Unlocked with your NFT: {nft.description}</p>
        
        {premiumContentType === 'video' && premiumContentUrl && (
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg mb-4">
            <video controls autoPlay src={premiumContentUrl} className="w-full h-full focus:outline-none">
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        {/* Add other content types here, e.g., article, image, download link */}

        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="font-semibold text-lg mb-2 text-gray-700">Your Ownership Proof:</h4>
            <div className="flex items-center space-x-3">
                <img src={nft.imageUrl} alt={nft.name} className="w-20 h-20 rounded-md shadow-md ring-1 ring-gray-200" />
                <div>
                    <p className="text-sm text-gray-600"><strong>NFT Name:</strong> {nft.name}</p>
                    {nft.tokenId && <p className="text-xs text-gray-500">Token ID: {nft.tokenId}</p>}
                    {nft.contractAddress && <p className="text-xs text-gray-500">Contract: {nft.contractAddress}</p>}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default PremiumContent; 