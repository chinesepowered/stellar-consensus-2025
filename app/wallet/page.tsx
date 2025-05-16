'use client';

import React, { useState, useRef } from 'react';
import { useUser } from '@/contexts/UserContext';
import PasskeyAuth from '@/components/auth/PasskeyAuth';

export default function WalletPage() {
  const { user, currentXlmBalance, depositToPlatform, withdrawFromPlatform, isLoading } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [copySuccess, setCopySuccess] = useState(false);
  const addressRef = useRef<HTMLInputElement>(null);

  const copyToClipboard = () => {
    if (addressRef.current) {
      addressRef.current.select();
      document.execCommand('copy');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (!user?.isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to access your wallet and manage your funds.
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium hover:bg-indigo-700 transition"
          >
            Sign In with Passkey
          </button>
        </div>

        {showAuthModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
              <div className="p-4 bg-indigo-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Sign in with Passkey</h2>
              </div>
              <div className="p-6">
                <PasskeyAuth onAuthComplete={() => setShowAuthModal(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleDeposit = async () => {
    if (amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    // Check if user has enough XLM
    const availableXlm = parseFloat(currentXlmBalance);
    if (isNaN(availableXlm) || availableXlm < amount) {
      alert(`Insufficient XLM balance. You have ${currentXlmBalance} XLM available.`);
      return;
    }
    
    try {
      await depositToPlatform(amount);
      setAmount(0);
    } catch (error: any) {
      alert(`Deposit failed: ${error.message}`);
    }
  };

  const handleWithdraw = async () => {
    if (amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (amount > user.platformBalanceXLM) {
      alert("Insufficient platform balance");
      return;
    }
    try {
      await withdrawFromPlatform(amount);
      setAmount(0);
    } catch (error: any) {
      alert(`Withdrawal failed: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Wallet</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
        <div className="p-6 border-b">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Your Wallet Address</h3>
          <div className="flex items-center">
            <input
              ref={addressRef}
              type="text"
              readOnly
              value={user.smartWalletAddress}
              className="flex-1 p-3 bg-gray-50 border border-gray-300 rounded-l-md text-sm font-mono"
            />
            <button
              onClick={copyToClipboard}
              className="bg-indigo-600 text-white px-4 py-3 rounded-r-md hover:bg-indigo-700 transition"
            >
              {copySuccess ? (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </span>
              ) : (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </span>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Use this address to receive XLM testnet tokens for your demo</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Balances */}
        <div className="p-6 border-b">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-indigo-800 mb-1">XLM Wallet Balance</h3>
              <div className="text-3xl font-bold text-indigo-700">
                {isLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  `${parseFloat(currentXlmBalance) === 0 ? '0' : currentXlmBalance} XLM`
                )}
              </div>
              <p className="text-xs text-indigo-600 mt-1">Available for deposit</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-1">Platform Balance</h3>
              <div className="text-3xl font-bold text-green-700">{user.platformBalanceXLM.toFixed(7)} XLM</div>
              <p className="text-xs text-green-600 mt-1">Available for platform actions</p>
            </div>
          </div>
        </div>
        
        {/* Deposit/Withdraw Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              className={`flex-1 py-3 px-6 text-center ${activeTab === 'deposit' ? 'bg-indigo-50 text-indigo-600 font-medium border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('deposit')}
            >
              Deposit
            </button>
            <button
              className={`flex-1 py-3 px-6 text-center ${activeTab === 'withdraw' ? 'bg-indigo-50 text-indigo-600 font-medium border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('withdraw')}
            >
              Withdraw
            </button>
          </div>
        </div>
        
        {/* Form */}
        <div className="p-6">
          {activeTab === 'deposit' ? (
            <div>
              <p className="text-gray-600 mb-4">
                Deposit XLM from your wallet to the platform to support creators and unlock premium content.
              </p>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-700">
                    Amount (XLM)
                  </label>
                  <span className="text-xs text-gray-500">
                    Available: {isLoading ? 'Loading...' : `${currentXlmBalance} XLM`}
                  </span>
                </div>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="deposit-amount"
                    className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.0000000"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    max={parseFloat(currentXlmBalance)}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  {[5, 10, 25, 50].map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount)}
                      disabled={parseFloat(currentXlmBalance) < quickAmount}
                      className="px-3 py-1 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {quickAmount} XLM
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={handleDeposit}
                  disabled={isLoading || amount <= 0 || parseFloat(currentXlmBalance) < amount}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Deposit'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                Withdraw XLM from your platform balance back to your Stellar wallet.
              </p>
              <div className="mb-4">
                <label htmlFor="withdraw-amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (XLM)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="number"
                    id="withdraw-amount"
                    className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.0000000"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Available: <span className="font-medium">{user.platformBalanceXLM.toFixed(7)} XLM</span>
                </div>
                
                <button
                  onClick={handleWithdraw}
                  disabled={isLoading || amount <= 0 || amount > user.platformBalanceXLM}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Withdraw'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Transaction History (could be added later) */}
        <div className="p-6 border-t bg-gray-50">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Recent Transactions</h3>
          <div className="text-sm text-gray-500 text-center py-6">
            Transaction history will appear here
          </div>
        </div>
      </div>
    </div>
  );
} 