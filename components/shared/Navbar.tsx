'use client'; // This will be an interactive component

import React, { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import PasskeyAuth from '@/components/auth/PasskeyAuth'; // To be shown in a modal

// Remove MockUserState as context provides this
// interface MockUserState { ... }

const Navbar = () => {
  const { user, logout, currentXlmBalance, depositToPlatform, isLoading } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(10);

  const handleAuthComplete = () => {
    setShowAuthModal(false);
  };

  const handleDeposit = async () => {
    if (depositAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    // Check if user has enough XLM
    const availableXlm = parseFloat(currentXlmBalance);
    if (isNaN(availableXlm) || availableXlm < depositAmount) {
      alert(`Insufficient XLM balance. You have ${currentXlmBalance} XLM available.`);
      return;
    }
    
    try {
      await depositToPlatform(depositAmount);
      setShowDepositModal(false);
    } catch (error: any) {
      alert(`Deposit failed: ${error.message}`);
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-indigo-600 font-bold text-xl">OnlyFrens</span>
            </Link>
            <span className="ml-2 text-gray-500 text-sm hidden md:inline">Support Uplifting Creators</span>
          </div>
          
          <div className="flex items-center gap-4">
            {user && user.isLoggedIn ? (
              <>
                <div className="hidden md:block">
                  <div className="flex items-center space-x-4">
                    {/* Wallet balance */}
                    <div className="text-sm text-gray-700">
                      <div 
                        className="bg-gradient-to-r from-indigo-50 to-blue-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center cursor-pointer hover:bg-indigo-100"
                        onClick={() => setShowDepositModal(true)}
                        title="Click to deposit"
                      >
                        <svg className="w-4 h-4 text-indigo-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">
                          {isLoading ? (
                            <span className="animate-pulse">Loading...</span>
                          ) : (
                            `${parseFloat(currentXlmBalance) === 0 ? '0' : currentXlmBalance} XLM`
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {/* Platform balance */}
                    <div className="text-sm text-gray-700">
                      <Link 
                        href="/wallet"
                        className="bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-1 rounded-full border border-green-100 flex items-center hover:bg-green-100"
                        title="Go to wallet"
                      >
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="font-medium">{user.platformBalanceXLM.toFixed(2)} XLM</span>
                      </Link>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-gray-500 flex items-center">
                        <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {user.username}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link 
                    href="/wallet" 
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-full text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Wallet
                  </Link>
                  
                  <button
                    onClick={() => logout()}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                Sign In with Passkey
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Passkey Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 border-b border-indigo-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-1.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                Sign in or Register with Passkey
              </h2>
            </div>
            <div className="p-6">
              <PasskeyAuth onAuthComplete={handleAuthComplete} />
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-1.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Deposit XLM to Platform
                </h2>
                <button 
                  onClick={() => setShowDepositModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount to Deposit</label>
                  <span className="text-xs text-gray-500">
                    Available: {isLoading ? 'Loading...' : `${currentXlmBalance} XLM`}
                  </span>
                </div>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    min="0"
                    step="1"
                    max={parseFloat(currentXlmBalance)}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <span className="text-gray-500 sm:text-sm px-2">XLM</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 text-sm text-gray-600">
                    <p>Deposit XLM from your wallet to use on the platform for subscriptions, tips, and NFT purchases.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleDeposit}
                  disabled={isLoading || depositAmount <= 0 || parseFloat(currentXlmBalance) < depositAmount}
                  className="flex-1 bg-green-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : `Deposit ${depositAmount} XLM`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 