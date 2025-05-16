'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { User as ApiUser, NftData, UserAction } from '@/lib/types'; // Import standardized types
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'; // Import the support check
import type { PasskeyKit as PasskeyKitType } from 'passkey-kit'; // Import the actual type

// Configuration values previously in lib/data.ts
const DUMMY_WALLET_WASM_HASH = 'ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90';
const FACTORY_CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

// Real NFT contract ID - use for actual minting
const NFT_CONTRACT_ID = 'CD5IRLBLESZ5X4PTP2IFT6GJXCR45KZJEMSXTYFF7GH2ECA276WOM4WR';

// Contract IDs for demo purposes
const DUMMY_SUBSCRIPTION_CONTRACT_ID = 'CCIFA3JIYPVQILXSPZX5OMT6B5X4LPIMHXHZCD57AOWQNKTDTVAZZTBV';
const DUMMY_TIPJAR_CONTRACT_ID = 'CCIFA3JIYPVQILXSPZX5OMT6B5X4LPIMHXHZCD57AOWQNKTDTVAZZTBV';
const DUMMY_NFT_MINT_CONTRACT_ID = 'CD5IRLBLESZ5X4PTP2IFT6GJXCR45KZJEMSXTYFF7GH2ECA276WOM4WR';

// Local storage keys
const SESSION_TOKEN_LOCAL_STORAGE_KEY = 'onlyfrens_session_token';
const LOCAL_STORAGE_USER_KEY = 'onlyfrens_user_data';
const LOCAL_STORAGE_WALLET_KEY = 'onlyfrens_wallet_data';

// Extended UserState for the context, including login status and full NftData objects
interface UserState extends ApiUser {
  isLoggedIn: boolean;
  // Balances are part of ApiUser (platformBalanceXLM). We might add a separate xlm balance if needed.
  // subscriptions and ownedNfts are already part of ApiUser and use the correct types.
}

// Balances as returned by APIs - platform balance is from UserState.platformBalanceXLM
interface FetchedBalances {
  xlmBalance: string;      // User's direct Stellar account balance (mocked by API)
  platformBalance: string; // User's XLM balance deposited in the platform contract (from API)
}

// Wallet data to persist across sessions
interface WalletData {
  keyIdBase64: string;
  publicKey?: string;
  smartWalletAddress?: string;
}

interface UserContextType {
  user: UserState | null;
  currentXlmBalance: string; // Separate state for display of direct XLM balance
  isLoading: boolean;
  isLoadingUser: boolean; // For initial session load
  sessionToken: string | null;
  isPasskeySupported: boolean;
  isPasskeyKitInitialized: boolean;
  // Auth methods
  registerWithPasskey: (username: string) => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  logout: () => Promise<void>;
  // Platform actions
  depositToPlatform: (amount: number) => Promise<void>;
  withdrawFromPlatform: (amount: number) => Promise<void>;
  subscribeToCreator: (creatorId: string, price: number) => Promise<void>;
  tipCreator: (creatorId: string, amount: number) => Promise<void>;
  purchaseNft: (nftDetails: Omit<NftData, 'id' | 'purchaseDate' | 'contractAddress' | 'tokenId'> & { id: string, price: number, creatorId: string }) => Promise<void>;
  fetchBalances: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Helper function to mock a Stellar wallet address from a username
const mockWalletAddress = (username: string): string => {
  // Generate a deterministic mock wallet address for demo purposes
  return `G${username.toUpperCase().repeat(5).substring(0, 55)}`;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [currentXlmBalance, setCurrentXlmBalance] = useState<string>('10000.0000000');
  const [isLoading, setIsLoading] = useState(false); // For general per-action loading
  const [isLoadingUser, setIsLoadingUser] = useState(true); // For initial session check
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isPasskeySupported, setIsPasskeySupported] = useState(false); // Default to false until checked
  const [isPasskeyKitInitialized, setIsPasskeyKitInitialized] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  
  const passkeyKitRef = useRef<PasskeyKitType | null>(null); // Properly typed PasskeyKit instance

  useEffect(() => {
    const initializePasskeyKitAndCheckSupport = async () => {
      if (typeof window !== "undefined") {
        // First, check for WebAuthn support using @simplewebauthn/browser
        const supported = browserSupportsWebAuthn();
        setIsPasskeySupported(supported);
        
        if (supported) {
          try {
            // Also import SimpleWebAuthn browser functions for PasskeyKit
            const { startRegistration, startAuthentication } = await import('@simplewebauthn/browser');
            
            // Dynamically import PasskeyKit only if WebAuthn is supported
            const { PasskeyKit } = await import('passkey-kit');
            
            if (!PasskeyKit) {
              console.error("PasskeyKit module was imported but PasskeyKit class is not available");
              return;
            }
            
            // Use configuration values
            console.log("Initializing PasskeyKit with config:", {
              rpcUrl: RPC_URL,
              networkPassphrase: NETWORK_PASSPHRASE,
              walletWasmHash: DUMMY_WALLET_WASM_HASH,
              WebAuthn: { startRegistration, startAuthentication }
            });
            
            passkeyKitRef.current = new PasskeyKit({
              rpcUrl: RPC_URL,
              networkPassphrase: NETWORK_PASSPHRASE,
              walletWasmHash: DUMMY_WALLET_WASM_HASH,
              timeoutInSeconds: 60, // Generous timeout for demo purposes
              WebAuthn: { startRegistration, startAuthentication } // Use imported functions
            });
            
            // Verify the instance is valid
            if (!passkeyKitRef.current) {
              console.error("PasskeyKit failed to initialize");
              setIsPasskeyKitInitialized(false);
              return;
            }
            
            setIsPasskeyKitInitialized(true);
            console.log("PasskeyKit successfully initialized with WebAuthn support.");
          } catch (error) {
            console.error("Failed to load or initialize PasskeyKit:", error);
            setIsPasskeyKitInitialized(false); // Ensure it's false on error
          }
        } else {
          console.warn("WebAuthn is not supported by this browser.");
          setIsPasskeyKitInitialized(false); // Cannot initialize PasskeyKit if WebAuthn not supported
        }
      }
    };

    initializePasskeyKitAndCheckSupport();

    const loadSession = async () => {
      const storedToken = localStorage.getItem(SESSION_TOKEN_LOCAL_STORAGE_KEY);
      const storedUserData = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      const storedWalletData = localStorage.getItem(LOCAL_STORAGE_WALLET_KEY);
      
      if (storedToken && storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setSessionToken(storedToken);
          setUser({ ...userData, isLoggedIn: true });
          setCurrentXlmBalance('10000.0000000'); // Mock XLM balance for demo
          
          // Load wallet data if available
          if (storedWalletData) {
            setWalletData(JSON.parse(storedWalletData));
          }
        } catch (error) {
          console.warn("Failed to load user/wallet data from localStorage:", error);
          localStorage.removeItem(SESSION_TOKEN_LOCAL_STORAGE_KEY);
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          localStorage.removeItem(LOCAL_STORAGE_WALLET_KEY);
          setSessionToken(null);
          setUser(null);
          setWalletData(null);
        }
      }
      setIsLoadingUser(false);
    };
    
    loadSession();
  }, []);

  const handleAuthSuccess = (userData: ApiUser, token: string, walletInfo?: WalletData) => {
    const userState: UserState = { 
      ...userData, 
      isLoggedIn: true 
    };
    
    setUser(userState);
    setSessionToken(token);
    
    // Store user data
    localStorage.setItem(SESSION_TOKEN_LOCAL_STORAGE_KEY, token);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userState));
    
    // Store wallet data if provided
    if (walletInfo) {
      setWalletData(walletInfo);
      localStorage.setItem(LOCAL_STORAGE_WALLET_KEY, JSON.stringify(walletInfo));
    }
    
    console.log(`Auth success, token set: ${token}`);
  };

  const registerWithPasskey = async (username: string) => {
    if (!isPasskeyKitInitialized || !passkeyKitRef.current) {
      alert("PasskeyKit is still initializing or not available. Please try again shortly.");
      return;
    }
    setIsLoading(true);
    try {
      // Using proper PasskeyKit createKey method for registration
      const passkeyKit = passkeyKitRef.current;
      const attestationResult = await passkeyKit.createKey(
        "onlyfrens", // app name
        username,    // username
        {
          rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        }
      );
      
      console.log("PasskeyKit createKey result:", attestationResult);

      // Store keyId for future wallet connections
      if (attestationResult.keyIdBase64) {
        // Create wallet data object to persist
        const walletInfo: WalletData = {
          keyIdBase64: attestationResult.keyIdBase64,
          publicKey: attestationResult.keyIdBase64, // In a real app this would be the actual public key
          smartWalletAddress: mockWalletAddress(username)
        };
        
        // Create a mock user in localStorage
        const newUserId = attestationResult.keyIdBase64;
        const mockUser: ApiUser = {
          id: newUserId,
          username,
          smartWalletAddress: mockWalletAddress(username),
          platformBalanceXLM: 1000, // Initial balance for demo
          subscriptions: [],
          ownedNfts: [],
          actionHistory: [],
          passkeyCredentialId: attestationResult.keyIdBase64,
          passkeyPublicKey: attestationResult.keyIdBase64, // In a real app this would be different
        };
        
        // Generate a mock session token
        const sessionToken = `session_${newUserId}_${Date.now()}`;
        
        handleAuthSuccess(mockUser, sessionToken, walletInfo);
        alert(`Welcome, ${username}!`);
      } else {
        throw new Error('Registration failed: No keyId returned from PasskeyKit');
      }
    } catch (error: any) {
      console.error("Registration error:", error.message, error.stack);
      alert(`Registration Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPasskey = async () => {
    if (!isPasskeyKitInitialized || !passkeyKitRef.current) {
      alert("PasskeyKit is still initializing or not available. Please try again shortly.");
      return;
    }
    setIsLoading(true);
    try {
      // Try to get stored wallet data first
      const storedWalletData = localStorage.getItem(LOCAL_STORAGE_WALLET_KEY);
      let storedKeyId = null;
      
      if (storedWalletData) {
        const parsedWalletData = JSON.parse(storedWalletData);
        storedKeyId = parsedWalletData.keyIdBase64;
      }
      
      // Using proper PasskeyKit connectWallet method
      const passkeyKit = passkeyKitRef.current;
      
      const connectOptions: any = {
        rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
      };
      
      // If we have a stored keyId, use it to help with wallet connection
      if (storedKeyId) {
        connectOptions.keyId = storedKeyId;
      }
      
      console.log("Connecting wallet with options:", connectOptions);
      
      try {
        const assertionResult = await passkeyKit.connectWallet(connectOptions);
        console.log("Wallet connect result:", assertionResult);
        
        if (assertionResult.keyIdBase64) {
          // Create or update wallet data
          const walletInfo: WalletData = {
            keyIdBase64: assertionResult.keyIdBase64,
            // In a real app we would set the actual public key and wallet address
            publicKey: assertionResult.keyIdBase64,
            smartWalletAddress: mockWalletAddress(assertionResult.keyIdBase64.substring(0, 8))
          };
          
          // Retrieve the user from localStorage or create one if it doesn't exist
          const storedUserData = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
          let userData: ApiUser;
          
          if (storedUserData) {
            userData = JSON.parse(storedUserData);
          } else {
            // No stored user - create a mock user with a generic username
            userData = {
              id: assertionResult.keyIdBase64,
              username: `user_${assertionResult.keyIdBase64.substring(0, 6)}`,
              smartWalletAddress: mockWalletAddress(`user_${assertionResult.keyIdBase64.substring(0, 6)}`),
              platformBalanceXLM: 1000,  // Demo balance
              subscriptions: [],
              ownedNfts: [],
              actionHistory: [],
              passkeyCredentialId: assertionResult.keyIdBase64,
              passkeyPublicKey: assertionResult.keyIdBase64
            };
          }
          
          // Generate a session token
          const sessionToken = `session_${userData.id}_${Date.now()}`;
          
          handleAuthSuccess(userData, sessionToken, walletInfo);
          alert(`Welcome back, ${userData.username}!`);
        } else {
          throw new Error('Login failed: No keyId returned from PasskeyKit');
        }
      } catch (e: any) {
        console.error("PasskeyKit.connectWallet error:", e);
        alert(`Login error: ${e.message}`);
      }
    } catch (e: any) {
      console.error("Login error:", e);
      alert(`Login failed: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear session data
      localStorage.removeItem(SESSION_TOKEN_LOCAL_STORAGE_KEY);
      // Don't clear user and wallet data to allow quick re-login
      // localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      // localStorage.removeItem(LOCAL_STORAGE_WALLET_KEY);
      
      setSessionToken(null);
      setUser(null);
      
      // Don't clear wallet data on logout so user can quickly log back in
      // setWalletData(null);
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const fetchBalances = async () => {
    // Mock implementation - just update the UI with what we have
    if (user) {
      setCurrentXlmBalance('10000.0000000');
      setUser(prev => prev ? { ...prev, platformBalanceXLM: prev.platformBalanceXLM } : null);
    }
  };

  const depositToPlatform = async (amount: number) => {
    if (!user) throw new Error("User not logged in");
    setIsLoading(true);
    try {
      // In-memory mock - just update the local state
      const newPlatformBalance = user.platformBalanceXLM + amount;
      const newXlmBalance = (parseFloat(currentXlmBalance) - amount).toFixed(7);
      
      // Update user in state and localStorage
      const updatedUser = { ...user, platformBalanceXLM: newPlatformBalance };
      setUser(updatedUser);
      setCurrentXlmBalance(newXlmBalance);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
      
      alert('Deposit Successful!');
    } catch (error: any) { 
      console.error(error); 
      alert(`Deposit failed: ${error.message}`); 
    }
    setIsLoading(false);
  };

  const withdrawFromPlatform = async (amount: number) => {
    if (!user) throw new Error("User not logged in");
    setIsLoading(true);
    try {
      // In-memory mock - just update the local state
      const newPlatformBalance = Math.max(0, user.platformBalanceXLM - amount);
      const newXlmBalance = (parseFloat(currentXlmBalance) + amount).toFixed(7);
      
      // Update user in state and localStorage
      const updatedUser = { ...user, platformBalanceXLM: newPlatformBalance };
      setUser(updatedUser);
      setCurrentXlmBalance(newXlmBalance);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
      
      alert('Withdrawal Successful!');
    } catch (error: any) { 
      console.error(error); 
      alert(`Withdrawal failed: ${error.message}`); 
    }
    setIsLoading(false);
  };

  const subscribeToCreator = async (creatorId: string, price: number) => {
    if (!user) throw new Error("User not logged in");
    if (user.platformBalanceXLM < price) throw new Error("Insufficient platform balance.");
    setIsLoading(true);
    try {
      // In-memory mock - create subscription and update balances
      const newSubscription = {
        creatorId,
        subscribedSince: new Date().toISOString(),
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      };
      
      const newPlatformBalance = user.platformBalanceXLM - price;
      
      // Add new subscription and update user
      const updatedSubscriptions = [...user.subscriptions.filter(s => s.creatorId !== creatorId), newSubscription];
      const updatedUser = { 
        ...user, 
        subscriptions: updatedSubscriptions, 
        platformBalanceXLM: newPlatformBalance 
      };
      
      setUser(updatedUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
      
      alert('Subscribed successfully!');
    } catch (error: any) { 
      console.error(error); 
      alert(`Subscription failed: ${error.message}`); 
    }
    setIsLoading(false);
  };

  const tipCreator = async (creatorId: string, amount: number) => {
    if (!user) throw new Error("User not logged in");
    if (user.platformBalanceXLM < amount) throw new Error("Insufficient platform balance.");
    setIsLoading(true);
    try {
      // In-memory mock - just update the balance
      const newPlatformBalance = user.platformBalanceXLM - amount;
      
      // Add action to history
      const newAction: UserAction = {
        id: `action_${Date.now()}`,
        type: "TIP",
        description: `Tipped creator ${creatorId} ${amount} XLM`,
        timestamp: new Date().toISOString(),
        targetId: creatorId,
        amount: amount
      };
      
      const updatedUser = { 
        ...user, 
        platformBalanceXLM: newPlatformBalance,
        actionHistory: [newAction, ...user.actionHistory]
      };
      
      setUser(updatedUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
      
      alert('Tip Successful!');
    } catch (error: any) { 
      console.error(error); 
      alert(`Tip failed: ${error.message}`); 
    }
    setIsLoading(false);
  };
  
  const purchaseNft = async (nftPurchaseDetails: Omit<NftData, 'id' | 'purchaseDate' | 'contractAddress' | 'tokenId'> & { id: string, price: number, creatorId: string }) => {
    if (!user) throw new Error("User not logged in");
    const { price, creatorId, id: nftId } = nftPurchaseDetails;
    
    if (user.platformBalanceXLM < price) throw new Error("Insufficient platform balance.");
    setIsLoading(true);
    try {
      // First, update the in-memory state
      const newPlatformBalance = user.platformBalanceXLM - price;
      
      // Call backend to mint the NFT
      console.log(`Calling backend API to mint NFT ${nftId}`);
      
      const response = await fetch('/api/nft/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          walletAddress: user.smartWalletAddress,
          nftId,
          name: nftPurchaseDetails.name,
          description: nftPurchaseDetails.description,
          imageUrl: nftPurchaseDetails.imageUrl,
          creatorId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mint NFT');
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to mint NFT');
      }
      
      // Use the NFT data returned from the backend
      const newNft: NftData = result.nft;
      
      // Add new NFT and action to history
      const newAction: UserAction = {
        id: `action_${Date.now()}`,
        type: "NFT_PURCHASE",
        description: `Purchased NFT ${newNft.name}`,
        timestamp: new Date().toISOString(),
        targetId: newNft.id,
        amount: -price
      };
      
      const updatedUser = { 
        ...user, 
        platformBalanceXLM: newPlatformBalance,
        ownedNfts: [...user.ownedNfts, newNft],
        actionHistory: [newAction, ...user.actionHistory]
      };
      
      setUser(updatedUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
      
      alert('NFT Purchased successfully!');
    } catch (error: any) { 
      console.error(error); 
      alert(`NFT Purchase failed: ${error.message}`); 
    }
    setIsLoading(false);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        currentXlmBalance,
        isLoading,
        isLoadingUser,
        sessionToken,
        isPasskeySupported,
        isPasskeyKitInitialized,
        registerWithPasskey,
        loginWithPasskey,
        logout,
        depositToPlatform,
        withdrawFromPlatform,
        subscribeToCreator,
        tipCreator,
        purchaseNft,
        fetchBalances
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 