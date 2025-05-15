import Layout from '../components/Layout';
import CreatorProfile from '../components/CreatorProfile'; // Uncommented
import { featuredCreator } from '../lib/data';

export default function HomePage() {
  return (
    <Layout title={`OnlyFrens - ${featuredCreator.username}`}>
      {/* Removed the h1 and placeholder div, CreatorProfile will be the main content */}
      <CreatorProfile creator={featuredCreator} />
    </Layout>
  );
} 