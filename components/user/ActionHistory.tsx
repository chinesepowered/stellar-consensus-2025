'use client';

import React from 'react';

export interface ActionEvent {
  id: string | number;
  type: 'Deposit' | 'Withdrawal' | 'Subscription' | 'Tip' | 'NftPurchase';
  timestamp: string; // ISO string
  amount?: string | number;
  creator?: string; // username or ID
  nftName?: string;
  status: 'Processing' | 'Completed' | 'Failed';
}

interface ActionHistoryProps {
  actions: ActionEvent[];
}

const ActionHistory: React.FC<ActionHistoryProps> = ({ actions }) => {
  if (!actions || actions.length === 0) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 my-4 ring-1 ring-gray-100 text-center">
        <p className="text-gray-500">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 my-4 ring-1 ring-gray-100">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Your Activity</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {actions.map((action) => (
          <div key={action.id} className="p-3 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors duration-150">
            <div className="flex justify-between items-center">
              <span className={`font-medium ${action.status === 'Completed' ? 'text-green-600' : action.status === 'Failed' ? 'text-red-600' : 'text-yellow-600'}`}>
                {action.type}
              </span>
              <span className="text-xs text-gray-400">{new Date(action.timestamp).toLocaleString()}</span>
            </div>
            {(action.amount) && <p className="text-sm text-gray-600">Amount: {action.amount} XLM</p>}
            {action.creator && <p className="text-sm text-gray-600">To: {action.creator}</p>}
            {action.nftName && <p className="text-sm text-gray-600">NFT: {action.nftName}</p>}
            <p className="text-sm text-gray-500">Status: {action.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActionHistory; 