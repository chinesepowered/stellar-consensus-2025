'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import PasskeyAuth from '@/components/auth/PasskeyAuth';

const Navbar = () => {
  const { user, logout, currentXlmBalance } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAuthComplete = () => {
    setShowAuthModal(false);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-indigo-600 font-bold text-xl">OnlyFrens</span>
            </Link>
            <span className="ml-2 text-gray-500 text-sm">Support Uplifting Creators</span>
          </div>
          
          <div className="flex items-center gap-4">
            {user && user.isLoggedIn ? (
              <>
                <div className="hidden md:block">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-700">
                      <span className="bg-gray-100 px-2 py-1 rounded-md">
                        {currentXlmBalance} XLM
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">@{user.username}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link 
                    href="/wallet" 
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Wallet
                  </Link>
                  
                  <button
                    onClick={() => logout()}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In with Passkey
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Passkey Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
            <div className="p-4 bg-indigo-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Sign in or Register</h2>
            </div>
            <div className="p-6">
              <PasskeyAuth onAuthComplete={handleAuthComplete} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 