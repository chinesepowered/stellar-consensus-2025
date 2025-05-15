import { User, UserAction } from './types';

// In-memory store for users. 
// In a real application, this would be a database.
// The key is the user's ID (e.g., passkey credential ID).
const MOCK_USER_DB: Record<string, User> = {};

export const getUserByPasskeyId = async (passkeyCredentialId: string): Promise<User | null> => {
  console.log(`MockUserDB: Looking up user by ID: ${passkeyCredentialId}`);
  console.log(`MockUserDB: Available user IDs: ${Object.keys(MOCK_USER_DB).join(', ')}`);
  
  // Direct lookup by ID
  if (MOCK_USER_DB[passkeyCredentialId]) {
    console.log(`MockUserDB: Found user directly with ID: ${passkeyCredentialId}`);
    return MOCK_USER_DB[passkeyCredentialId];
  }
  
  // Try to find by passkeyCredentialId field (in case ID is different)
  for (const id in MOCK_USER_DB) {
    const user = MOCK_USER_DB[id];
    if (user.passkeyCredentialId === passkeyCredentialId) {
      console.log(`MockUserDB: Found user by passkeyCredentialId field: ${passkeyCredentialId}`);
      return user;
    }
    
    // Try a different format - handle base64 vs base64url encoding variations
    // This checks if they're the same credential but with different encoding
    if (user.passkeyCredentialId && typeof passkeyCredentialId === 'string') {
      const normalizedDbId = user.passkeyCredentialId.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const normalizedSearchId = passkeyCredentialId.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      if (normalizedDbId === normalizedSearchId) {
        console.log(`MockUserDB: Found user after normalizing credential ID formats`);
        return user;
      }
      
      // Try additional fuzzy matching - check if one is a substring of the other
      if (normalizedDbId.includes(normalizedSearchId) || normalizedSearchId.includes(normalizedDbId)) {
        console.log(`MockUserDB: Found user by substring matching of credential IDs`);
        return user;
      }
    }
  }
  
  // If not found, try a more permissive match on start/end of ID
  // This helps when IDs might be encoded/formatted differently
  if (typeof passkeyCredentialId === 'string' && passkeyCredentialId.length > 10) {
    const startChars = passkeyCredentialId.substring(0, 10); // First 10 chars
    const endChars = passkeyCredentialId.substring(passkeyCredentialId.length - 10); // Last 10 chars
    
    for (const id in MOCK_USER_DB) {
      const user = MOCK_USER_DB[id];
      const userId = user.id || '';
      const userPasskeyId = user.passkeyCredentialId || '';
      
      if ((typeof userId === 'string' && 
           (userId.startsWith(startChars) || userId.endsWith(endChars))) ||
          (typeof userPasskeyId === 'string' && 
           (userPasskeyId.startsWith(startChars) || userPasskeyId.endsWith(endChars)))) {
        console.log(`MockUserDB: Found user through partial credential ID matching`);
        return user;
      }
    }
  }
  
  // Last resort: If only one user in the database, return that user for demo purposes
  if (Object.keys(MOCK_USER_DB).length === 1) {
    console.log(`MockUserDB: Only one user in database, returning as fallback`);
    return Object.values(MOCK_USER_DB)[0];
  }
  
  console.log(`MockUserDB: No user found for ID: ${passkeyCredentialId}`);
  return null;
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