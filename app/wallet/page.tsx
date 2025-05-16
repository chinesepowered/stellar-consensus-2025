'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import PasskeyAuth from '@/components/auth/PasskeyAuth';

export default function WalletPage() {
  const { user, currentXlmBalance, depositToPlatform, withdrawFromPlatform, isLoading, fetchBalances, fundWalletWithTestnet, depositViaLaunchtube } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [copySuccess, setCopySuccess] = useState(false);
  const [newSignerName, setNewSignerName] = useState('');
  const [walletSigners, setWalletSigners] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const addressRef = useRef<HTMLInputElement>(null);

  // Fetch balances only once when component mounts
  useEffect(() => {
    if (user?.isLoggedIn && user.smartWalletAddress) {
      console.log("Wallet page mounted, fetching balance");
      fetchBalances().catch(err => {
        console.error("Error fetching initial balance:", err);
      });
    }
  }, []); // Empty dependency array to run only once on mount

  const copyToClipboard = () => {
    if (addressRef.current) {
      addressRef.current.select();
      document.execCommand('copy');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleRefreshBalance = async () => {
    try {
      await fetchBalances();
    } catch (error) {
      console.error("Error refreshing balance:", error);
      alert("Could not refresh balance. Please try again later.");
    }
  };

  // Advanced wallet functions
  const fundWallet = async () => {
    try {
      await fundWalletWithTestnet();
    } catch (error) {
      console.error("Error funding wallet:", error);
      alert(`Failed to fund wallet: ${error.message}`);
    }
  };
  
  const addNewSigner = async () => {
    if (!newSignerName || !newSignerName.trim()) {
      alert("Please enter a name for the new signer");
      return;
    }
    
    try {
      alert(`This would create a new signer named "${newSignerName}" with a new passkey in a real implementation.`);
      
      // This would be implemented with real code in a production version
      /*
      const { keyId: kid, publicKey } = await account.createKey(
        "OnlyFrens",
        newSignerName,
      );

      const at = await account.addSecp256r1(kid, publicKey, undefined, SignerStore.Temporary);
      await account.sign(at, { keyId: adminSigner });
      
      await getWalletSigners();
      */
      
      setNewSignerName('');
      alert(`New signer "${newSignerName}" would be added!`);
    } catch (error) {
      console.error("Error adding signer:", error);
      alert(`Failed to add signer: ${error.message}`);
    }
  };
  
  const resetWallet = () => {
    if (confirm("This will remove all stored wallet data. Are you sure?")) {
      localStorage.removeItem("onlyfrens_wallet_data");
      localStorage.removeItem("onlyfrens_session_token");
      localStorage.removeItem("onlyfrens_user_data");
      alert("Wallet data reset. Please refresh the page to log in again.");
    }
  };

  const handleLaunchtubeDeposit = async () => {
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
      await depositViaLaunchtube(amount);
      setAmount(0);
    } catch (error: any) {
      alert(`Launchtube deposit failed: ${error.message}`);
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Your Balances</h3>
            <button 
              onClick={handleRefreshBalance}
              className="flex items-center text-indigo-600 hover:text-indigo-800"
              disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-1 ${isLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoading ? 'Refreshing...' : 'Refresh Balance'}
            </button>
          </div>
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
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleDeposit}
                    disabled={isLoading || amount <= 0 || parseFloat(currentXlmBalance) < amount}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Deposit'}
                  </button>
                  
                  <button
                    onClick={handleLaunchtubeDeposit}
                    disabled={isLoading || amount <= 0 || parseFloat(currentXlmBalance) < amount}
                    className="bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Via Launchtube'}
                  </button>
                </div>
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
      
      {/* Advanced Wallet Functions */}
      <div className="mt-8">
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-gray-700 font-medium mb-4"
        >
          <span className="mr-2">
            {showAdvanced ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </span>
          Advanced Wallet Functions {showAdvanced ? '(Hide)' : '(Show)'}
        </button>
        
        {showAdvanced && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Advanced Wallet Management</h3>
              <p className="text-sm text-gray-500">These functions mimic the PasskeyKit demo functionality</p>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left column - Wallet actions */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-4">Wallet Actions</h4>
                  
                  <div className="space-y-4">
                    {/* Fund wallet */}
                    <div>
                      <button
                        onClick={fundWallet}
                        disabled={isLoading}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Funding...' : 'Fund Wallet with 100 Test XLM'}
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        Adds 100 test XLM to your wallet from the Stellar testnet
                      </p>
                    </div>
                    
                    {/* Refresh wallet balance */}
                    <div>
                      <button
                        onClick={handleRefreshBalance}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Refreshing...' : 'Refresh Wallet Balance'}
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        Gets the latest balance from your wallet
                      </p>
                    </div>
                    
                    {/* Reset wallet */}
                    <div>
                      <button
                        onClick={resetWallet}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                      >
                        Reset Wallet Data
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        Warning: Removes all locally stored wallet data
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Right column - Manage signers */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-4">Manage Signers</h4>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">
                      Passkey wallet supports multiple signers. You can add additional passkeys as signers to your wallet.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Add new signer */}
                    <div>
                      <label htmlFor="new-signer" className="block text-sm font-medium text-gray-700 mb-1">
                        New Signer Name
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          id="new-signer"
                          value={newSignerName}
                          onChange={(e) => setNewSignerName(e.target.value)}
                          placeholder="Enter name for new signer"
                          className="flex-1 p-2 border border-gray-300 rounded-l-md"
                        />
                        <button
                          onClick={addNewSigner}
                          disabled={!newSignerName}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Signer
                        </button>
                      </div>
                    </div>
                    
                    {/* Signers list would go here - simplified for hackathon */}
                    <div className="border rounded-md p-4">
                      <p className="text-sm text-center text-gray-500">
                        You currently have 1 active signer (your primary passkey)
                      </p>
                      <p className="text-xs text-center text-gray-400 mt-2">
                        In a production app, you would see a list of signers here with options to manage them
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border-t border-yellow-100">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    These advanced functions are simplified for the hackathon demo. In a production app, they would interact directly with the Stellar network.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 