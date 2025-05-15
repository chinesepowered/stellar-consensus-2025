import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { UserProvider } from '@/contexts/UserContext';

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
      <body className={inter.className}>
        <UserProvider>
          {/* TODO: Add a global context provider for user state, passkeykit, etc. */}
          {children}
        </UserProvider>
      </body>
    </html>
  );
} 