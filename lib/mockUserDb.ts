import { User, UserAction } from './types';

// In-memory store for users. 
// In a real application, this would be a database.
// The key is the user's ID (e.g., passkey credential ID).
const MOCK_USER_DB: Record<string, User> = {};

export const getUserByPasskeyId = async (passkeyCredentialId: string): Promise<User | null> => {
  return MOCK_USER_DB[passkeyCredentialId] || null;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  for (const userId in MOCK_USER_DB) {
    if (MOCK_USER_DB[userId].username === username) {
      return MOCK_USER_DB[userId];
    }
  }
  return null;
};

export const createUser = async (userData: Omit<User, 'id' | 'smartWalletAddress' | 'platformBalanceXLM' | 'subscriptions' | 'ownedNfts' | 'actionHistory'> & { id: string }): Promise<User> => {
  if (MOCK_USER_DB[userData.id]) {
    throw new Error('User already exists');
  }
  const newUser: User = {
    ...userData,
    // For the hackathon, generate a mock smart wallet address.
    // This would typically involve interaction with Stellar SDK / a wallet service.
    smartWalletAddress: `G${userData.id.toUpperCase().replace(/-/g, '').substring(0, 55)}`, 
    platformBalanceXLM: 0, // Initial platform balance
    subscriptions: [],
    ownedNfts: [],
    actionHistory: [],
  };
  MOCK_USER_DB[userData.id] = newUser;
  return newUser;
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  if (!MOCK_USER_DB[userId]) {
    return null;
  }
  MOCK_USER_DB[userId] = { ...MOCK_USER_DB[userId], ...updates };
  return MOCK_USER_DB[userId];
};

// Helper to add an action to a user's history
export const addUserAction = async (userId: string, action: Omit<UserAction, 'id' | 'timestamp'>): Promise<User | null> => {
  const user = await getUserByPasskeyId(userId);
  if (!user) return null;

  const newAction: UserAction = {
    ...action,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  user.actionHistory.push(newAction);
  if (action.type === 'DEPOSIT' && action.amount) {
    user.platformBalanceXLM += action.amount;
  }
  // Add more balance update logic for other action types as needed (e.g., TIP, PURCHASE)
  // For TIP, SUBSCRIBE, BUY_NFT, the amount would be deducted.
  // For WITHDRAWAL, the amount would be deducted.

  return updateUser(userId, { actionHistory: user.actionHistory, platformBalanceXLM: user.platformBalanceXLM });
};

// Export the DB itself if needed for direct manipulation in some specific mock scenarios (use with caution)
export { MOCK_USER_DB }; 