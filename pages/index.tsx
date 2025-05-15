import Layout from '../components/Layout';
import CreatorProfile from '../components/CreatorProfile';
import { featuredCreator } from '../lib/data';

export default function HomePage() {
  return (
    <Layout title={`OnlyFrens - ${featuredCreator.username}`}>
      <CreatorProfile creator={featuredCreator} />
    </Layout>
  );
} 