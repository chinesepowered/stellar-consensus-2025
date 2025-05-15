// components/creator/CreatorProfile.tsx
import React from 'react';
import TeaserVideo from './TeaserVideo'; // Assuming TeaserVideo component

interface CreatorProfileProps {
  creator: {
    username: string;
    bio: string;
    teaserVideoUrl?: string;
    // Add other creator-specific fields if needed
  };
}

const CreatorProfile: React.FC<CreatorProfileProps> = ({ creator }) => {
  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 my-6 ring-1 ring-gray-200">
      <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-800">{creator.username}</h2>
      <p className="text-gray-600 mb-6 text-lg">{creator.bio}</p>
      {creator.teaserVideoUrl && (
        <TeaserVideo src={creator.teaserVideoUrl} />
      )}
      {/* Placeholder for other creator info, like social links or total supporters */}
    </div>
  );
};

export default CreatorProfile; 