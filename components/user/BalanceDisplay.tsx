'use client';

import React from 'react';

interface BalanceDisplayProps {
  xlmBalance: string | number; // Could be from user's main Stellar account
  appBalance: string | number; // XLM deposited into the platform contract
  onDepositClick?: () => void;
  onWithdrawClick?: () => void;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ 
  xlmBalance, 
  appBalance,
  onDepositClick,
  onWithdrawClick 
}) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 my-4 ring-1 ring-gray-100">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Your Balances</h3>
      <div className="space-y-3">
        <div>
          <span className="font-medium text-gray-600">Stellar Wallet (XLM):</span> 
          <span className="ml-2 text-lg font-bold text-indigo-600">{xlmBalance} XLM</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">Platform Balance (XLM):</span> 
          <span className="ml-2 text-lg font-bold text-green-600">{appBalance} XLM</span>
        </div>
      </div>
      {(onDepositClick || onWithdrawClick) && (
        <div className="mt-6 flex space-x-3 border-t pt-4">
          {onDepositClick && (
            <button 
              onClick={onDepositClick}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
            >
              Deposit XLM to Platform
            </button>
          )}
          {onWithdrawClick && (
            <button 
              onClick={onWithdrawClick}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
            >
              Withdraw XLM from Platform
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default BalanceDisplay; 