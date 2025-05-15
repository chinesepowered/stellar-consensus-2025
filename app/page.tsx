'use client';

import dynamic from 'next/dynamic';

// Dynamically import the MainPage to keep the same functionality
const MainPage = dynamic(() => import('./main/page'), {
  loading: () => <p>Loading...</p>,
});

export default function HomePage() {
  return <MainPage />;
} 