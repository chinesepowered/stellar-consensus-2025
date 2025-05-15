'use client'; // This will be an interactive component

import React, { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import PasskeyAuth from '@/components/auth/PasskeyAuth'; // To be shown in a modal

// Remove MockUserState as context provides this
// interface MockUserState { ... }

const Navbar = () => {
  const { user, currentXlmBalance, logout, isLoading, isLoadingUser } = useUser();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // MOCK DATA for balances is removed, will use context values

  const handleLogout = async () => {
    await logout();
  };

  const formatBalance = (balance: string | number) => {
    const num = typeof balance === 'string' ? parseFloat(balance) : balance;
    return num.toFixed(4); // Display 4 decimal places
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:text-sky-400 transition-colors">
            OnlyFrens
          </Link>
          <div className="flex items-center space-x-4">
            {isLoadingUser ? (
              <span className="text-sm text-gray-400">Loading user...</span>
            ) : user && user.isLoggedIn ? (
              <>
                <div className="text-sm text-right">
                  <div>Wallet: <span className="font-semibold text-sky-300">{formatBalance(currentXlmBalance)} XLM</span></div>
                  <div>Platform: <span className="font-semibold text-emerald-300">{formatBalance(user.platformBalanceXLM)} XLM</span></div>
                </div>
                <Link href="/profile" className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors">
                    {user.username}
                </Link>
                <button 
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                disabled={isLoading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Login / Register'}
              </button>
            )}
          </div>
        </div>
      </nav>
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-transparent max-w-md w-full">
            {/* PasskeyAuth component will be rendered here */}
            <PasskeyAuth onAuthComplete={() => setIsAuthModalOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar; 