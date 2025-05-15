import React from 'react';

interface TeaserVideoProps {
  src: string;
  poster?: string; // Optional poster image
}

const TeaserVideo: React.FC<TeaserVideoProps> = ({ src, poster }) => {
  return (
    <div className="mb-4 aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-lg">
      <h3 className="text-xl font-semibold mb-0 px-4 pt-3 pb-2 bg-gray-50 text-gray-700">Teaser Video</h3>
      <video 
        controls 
        src={src} 
        className="w-full rounded-b-lg focus:outline-none"
        poster={poster || "https://via.placeholder.com/640x360.png?text=Loading+Video..."}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default TeaserVideo; 