import React from 'react';

export interface TimelinePostData {
  id: string | number;
  type: 'text' | 'photo' | 'video'; // Extend as needed
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  timestamp?: string; // Or Date object
}

interface TimelinePostProps {
  post: TimelinePostData;
}

const TimelinePost: React.FC<TimelinePostProps> = ({ post }) => {
  return (
    <div className="border border-gray-200 p-4 rounded-md bg-gray-50 shadow-sm hover:shadow-md transition-shadow duration-150">
      {post.imageUrl && (
        <img 
          src={post.imageUrl} 
          alt={post.content.substring(0, 50)} // Alt text snippet
          className="w-full h-auto rounded-md mb-3 shadow-inner object-cover max-h-96"
          onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x200.png?text=Image+Error')}
        />
      )}
      {post.videoUrl && (
        <div className="aspect-video bg-black rounded-md overflow-hidden mb-3">
          <video controls src={post.videoUrl} className="w-full h-full" onError={(e) => console.error("Video error:", e)}></video>
        </div>
      )}
      <p className="text-gray-700 leading-relaxed">{post.content}</p>
      {post.timestamp && (
        <p className="text-xs text-gray-400 mt-2">{new Date(post.timestamp).toLocaleString()}</p>
      )}
    </div>
  );
};

export default TimelinePost; 