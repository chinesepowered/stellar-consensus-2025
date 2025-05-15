'use client';

import React, { useState } from 'react';

interface ActionsPanelProps {
  creatorUsername: string;
  isSubscribed: boolean;
  onSubscribe: () => void; // Placeholder for actual API call
  onTip: (amount: number) => void; // Placeholder for actual API call
  isLoading?: boolean; // Added isLoading prop
  // TODO: Add props for subscription price, suggested tip amounts
}

const ActionsPanel: React.FC<ActionsPanelProps> = ({ 
  creatorUsername, 
  isSubscribed, 
  onSubscribe,
  onTip,
  isLoading // Destructure isLoading
}) => {
  const [tipAmount, setTipAmount] = useState('');
  const subscriptionPrice = 10; // Mock price in XLM
  const commonTipAmounts = [5, 10, 20];

  const handleTipSubmit = () => {
    const amount = parseFloat(tipAmount);
    if (amount > 0) {
      onTip(amount);
      setTipAmount('');
    } else {
      alert('Please enter a valid tip amount.');
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 my-8 ring-1 ring-gray-200">
      <h3 className="text-2xl font-semibold text-gray-700 mb-6 text-center">Support {creatorUsername}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Subscription Section */}
        <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg ring-1 ring-slate-200">
          <h4 className="text-xl font-medium text-gray-600 mb-3">Monthly Subscription</h4>
          {isSubscribed ? (
            <p className="text-green-600 font-semibold text-lg">✔️ Subscribed! Thank you!</p>
          ) : (
            <>
              <p className="text-gray-500 mb-3 text-center">Unlock exclusive timeline posts and support the creator regularly.</p>
              <button 
                onClick={onSubscribe}
                disabled={isLoading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 disabled:opacity-50"
              >
                Subscribe ({subscriptionPrice} XLM/month)
              </button>
            </>
          )}
        </div>

        {/* Tip Section */}
        <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg ring-1 ring-slate-200">
          <h4 className="text-xl font-medium text-gray-600 mb-3">Send a One-Time Tip</h4>
          <p className="text-gray-500 mb-3 text-center">Show your appreciation with a tip in XLM.</p>
          <div className="flex space-x-2 mb-3">
            {commonTipAmounts.map(amount => (
                 <button key={amount} onClick={() => onTip(amount)} disabled={isLoading} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-800 font-semibold py-2 px-4 rounded-md text-sm disabled:opacity-50">
                    {amount} XLM
                </button>
            ))}
          </div>
          <div className="w-full flex items-center space-x-2">
            <input 
              type="number"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              placeholder="Custom XLM amount"
              className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <button 
              onClick={handleTipSubmit}
              disabled={isLoading || !tipAmount || parseFloat(tipAmount) <= 0}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 px-5 rounded-md shadow-sm transition duration-150 ease-in-out disabled:opacity-50"
            >
              Tip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionsPanel; 