import React from 'react';
import { NftData } from '@/lib/types'; // Import the standardized NftData

// export interface NftData { // Remove local interface
//   id: string | number;
//   name: string;
//   description: string;
//   imageUrl: string;
//   contractAddress?: string;
//   tokenId?: string;
//   // any other relevant metadata
// }

interface NftCardProps {
  nft: NftData;
  onClick?: () => void; // For viewing premium content associated with it
}

const NftCard: React.FC<NftCardProps> = ({ nft, onClick }) => {
  return (
    <div
      className={`bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xl rounded-lg p-5 ring-1 ring-purple-400 transition-all duration-300 ease-in-out hover:shadow-2xl ${onClick ? 'cursor-pointer hover:scale-105' : ''}`}
      onClick={onClick}
    >
      <div className="aspect-square bg-black/20 rounded-md overflow-hidden mb-4 shadow-inner">
        <img
          src={nft.imageUrl || 'https://via.placeholder.com/300.png?text=NFT'}
          alt={nft.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300.png?text=NFT+Error')}
        />
      </div>
      <h4 className="text-xl font-bold mb-1 truncate" title={nft.name}>{nft.name}</h4>
      <p className="text-sm text-purple-200 mb-3 h-10 overflow-hidden" title={nft.description}>{nft.description}</p>
      {onClick && (
        <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-purple-800 font-semibold py-2 px-4 rounded-md text-sm transition duration-150 ease-in-out">
          View Content
        </button>
      )}
      {/* Optionally display tokenId or contract link */}
      {/* {nft.tokenId && <p className="text-xs text-purple-300 mt-2">Token ID: {nft.tokenId}</p>} */}
    </div>
  );
};

export default NftCard; 