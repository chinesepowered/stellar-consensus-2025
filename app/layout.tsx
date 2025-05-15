import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/contexts/UserContext';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OnlyFrens - Uplifting Creators',
  description: 'Support creators with Stellar and Passkeys.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen flex flex-col`}>
        <UserProvider>
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
} 