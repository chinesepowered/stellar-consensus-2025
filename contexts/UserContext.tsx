'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { User as ApiUser, NftData, UserAction } from '@/lib/types'; // Import standardized types
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'; // Import the support check
import type { PasskeyKit as PasskeyKitType } from 'passkey-kit'; // Import the actual type

// System account that will receive deposits
const SYSTEM_ACCOUNT_ADDRESS = 'GDXCCSIV6E3XYB45NCPPBR4BUJZEI3GPV2YNXF2XIQO2DVCDID76SHFG';

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
// This is now deprecated as we'll use real wallet addresses from PasskeyKit
const mockWalletAddress = (username: string): string => {
  // Generate a deterministic mock wallet address for demo purposes
  return `G${username.toUpperCase().repeat(5).substring(0, 55)}`;
};

// Helper function to completely reset user data
const resetAllUserData = () => {
  localStorage.removeItem(SESSION_TOKEN_LOCAL_STORAGE_KEY);
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  localStorage.removeItem(LOCAL_STORAGE_WALLET_KEY);
  console.log("All user data reset. User should register a new passkey.");
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
          
          // Load wallet data if available
          if (storedWalletData) {
            setWalletData(JSON.parse(storedWalletData));
            
            // Fetch real wallet balance
            fetchBalances();
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
    
    // First clear any existing data to avoid conflicts
    resetAllUserData();
    
    setIsLoading(true);
    try {
      // Using direct PasskeyKit createWallet method for registration
      // This will create both a passkey and wallet in one step
      const passkeyKit = passkeyKitRef.current;
      
      console.log("Creating wallet directly with PasskeyKit.createWallet...");
      const walletResult = await passkeyKit.createWallet(
        "onlyfrens", // app name
        username     // username
      );
      
      console.log("Wallet creation result:", walletResult);

      // We should now have a valid wallet
      if (walletResult.keyIdBase64 && walletResult.contractId) {
        // Create wallet data object to persist with real wallet address
        const walletInfo: WalletData = {
          keyIdBase64: walletResult.keyIdBase64,
          publicKey: walletResult.keyIdBase64,
          smartWalletAddress: walletResult.contractId
        };
        
        // Create a user in localStorage with real wallet address
        const newUserId = walletResult.keyIdBase64;
        const mockUser: ApiUser = {
          id: newUserId,
          username,
          smartWalletAddress: walletResult.contractId,
          platformBalanceXLM: 1000, // Initial balance for demo
          subscriptions: [],
          ownedNfts: [],
          actionHistory: [],
          passkeyCredentialId: walletResult.keyIdBase64,
          passkeyPublicKey: walletResult.keyIdBase64,
        };
        
        // Generate a mock session token
        const sessionToken = `session_${newUserId}_${Date.now()}`;
        
        handleAuthSuccess(mockUser, sessionToken, walletInfo);
        alert(`Welcome, ${username}! Your new wallet address is ${walletResult.contractId}`);
      } else {
        throw new Error('Registration failed: Wallet creation did not return expected values');
      }
    } catch (error: any) {
      console.error("Registration error:", error.message, error.stack);
      alert(`Registration Error: ${error.message}`);
      // Reset data on failure to ensure clean state
      resetAllUserData();
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPasskey = async () => {
    if (!isPasskeyKitInitialized || !passkeyKitRef.current) {
      alert("PasskeyKit is still initializing or not available. Please try again shortly.");
      return;
    }
    
    const passkeyKit = passkeyKitRef.current;
    setIsLoading(true);
    
    try {
      // Try to force a new authentication to bypass potential cached credentials
      alert("Please select a passkey from your device. If you have multiple passkeys, choose the most recent one.");
      
      // Since we can't access the WebAuthn property directly, use a fresh createKey call first
      // This will trigger the authenticator selection UI and get us a keyId
      try {
        // First try full authentication flow without stored data
        const connectResult = await passkeyKit.connectWallet({
          rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
        });
        
        console.log("Connect wallet result:", connectResult);
        
        if (connectResult && connectResult.contractId) {
          // Successfully connected to wallet
          const walletInfo: WalletData = {
            keyIdBase64: connectResult.keyIdBase64,
            publicKey: connectResult.keyIdBase64,
            smartWalletAddress: connectResult.contractId
          };
          
          // Either update existing user or create new one
          const storedUserData = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
          let userData: ApiUser;
          
          if (storedUserData) {
            userData = JSON.parse(storedUserData);
            userData.smartWalletAddress = connectResult.contractId;
            userData.passkeyCredentialId = connectResult.keyIdBase64;
            userData.passkeyPublicKey = connectResult.keyIdBase64;
          } else {
            // Create new user
            userData = {
              id: connectResult.keyIdBase64,
              username: `user_${connectResult.keyIdBase64.substring(0, 6)}`,
              smartWalletAddress: connectResult.contractId,
              platformBalanceXLM: 1000,
              subscriptions: [],
              ownedNfts: [],
              actionHistory: [],
              passkeyCredentialId: connectResult.keyIdBase64,
              passkeyPublicKey: connectResult.keyIdBase64
            };
          }
          
          // Generate session token
          const sessionToken = `session_${userData.id}_${Date.now()}`;
          handleAuthSuccess(userData, sessionToken, walletInfo);
          alert(`Welcome back! Your wallet address is ${connectResult.contractId}`);
        } else {
          throw new Error("Failed to connect wallet. No contract ID returned.");
        }
      } catch (error: any) {
        console.error("Connect wallet error:", error);
        // If we can't connect, offer to create a new wallet
        if (confirm("Unable to connect to an existing wallet. Would you like to create a new one instead?")) {
          try {
            // Reset everything first
            resetAllUserData();
            
            // Create a username
            const username = prompt("Enter a username for your new wallet:", "user") || "user";
            
            // Create a new wallet
            const walletResult = await passkeyKit.createWallet(
              "onlyfrens",
              username
            );
            
            if (walletResult && walletResult.contractId) {
              // Create wallet info
              const walletInfo: WalletData = {
                keyIdBase64: walletResult.keyIdBase64,
                publicKey: walletResult.keyIdBase64,
                smartWalletAddress: walletResult.contractId
              };
              
              // Create user
              const newUser: ApiUser = {
                id: walletResult.keyIdBase64,
                username,
                smartWalletAddress: walletResult.contractId,
                platformBalanceXLM: 1000,
                subscriptions: [],
                ownedNfts: [],
                actionHistory: [],
                passkeyCredentialId: walletResult.keyIdBase64,
                passkeyPublicKey: walletResult.keyIdBase64
              };
              
              // Create session
              const sessionToken = `session_${newUser.id}_${Date.now()}`;
              handleAuthSuccess(newUser, sessionToken, walletInfo);
              alert(`New wallet created successfully! Your wallet address is ${walletResult.contractId}`);
            } else {
              throw new Error("Failed to create new wallet during login recovery.");
            }
          } catch (createError: any) {
            console.error("Failed to create new wallet:", createError);
            alert(`Error creating new wallet: ${createError.message}\n\nPlease try registering a completely new passkey.`);
          }
        } else {
          // User chose not to create a new wallet
          alert("Login canceled. Please try registering a new passkey instead.");
        }
      }
    } catch (e: any) {
      console.error("Authentication error:", e);
      
      // If authentication fails, offer to reset
      if (confirm("Authentication failed or was canceled. Would you like to reset your data and register a new passkey?")) {
        resetAllUserData();
        setUser(null);
        setSessionToken(null);
        setWalletData(null);
        alert("Your data has been reset. Please register a new passkey.");
      } else {
        alert(`Login failed: ${e.message}`);
      }
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
    // Only fetch if user is logged in and has a wallet address
    if (!user || !user.smartWalletAddress) return;
    
    setIsLoading(true);
    try {
      // Fetch real wallet balance from Stellar horizon
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${user.smartWalletAddress}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Account not found/not activated yet
          console.log("Account not found. May need activation.");
          setCurrentXlmBalance('0.0000000');
        } else {
          throw new Error(`Failed to fetch balance: ${response.statusText}`);
        }
      } else {
        const accountData = await response.json();
        
        // Find XLM balance in the balances array
        const xlmBalance = accountData.balances.find(
          (balance: any) => balance.asset_type === 'native'
        );
        
        if (xlmBalance) {
          setCurrentXlmBalance(xlmBalance.balance);
          console.log(`Real XLM balance fetched: ${xlmBalance.balance}`);
        } else {
          setCurrentXlmBalance('0.0000000');
        }
      }
      
      // Platform balance is still from local storage - no change needed
      setUser(prev => prev ? { ...prev, platformBalanceXLM: prev.platformBalanceXLM } : null);
    } catch (error) {
      console.error("Error fetching balances:", error);
      // Fallback to previous balance or default
      setCurrentXlmBalance(prev => prev || '0.0000000');
    } finally {
      setIsLoading(false);
    }
  };

  const depositToPlatform = async (amount: number) => {
    if (!user) throw new Error("User not logged in");
    if (!passkeyKitRef.current || !walletData) throw new Error("Wallet not initialized");
    
    setIsLoading(true);
    try {
      const passkeyKit = passkeyKitRef.current;
      
      console.log(`Preparing to transfer ${amount} XLM to system account: ${SYSTEM_ACCOUNT_ADDRESS}`);
      
      // Create a transaction to send XLM to the system account
      // This is where we'd normally use the Stellar SDK to build and submit a transaction
      try {
        // For the hackathon, we'll simulate this part
        console.log(`Building transfer transaction...`);
        
        // In a real implementation, we would:
        // 1. Import necessary Stellar SDK components
        // 2. Build a payment transaction to system account
        // 3. Sign it using PasskeyKit
        // 4. Submit it to the network
        
        /* 
        const StellarSdk = await import('@stellar/stellar-sdk');
        const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
        
        // Build the transaction
        const sourceAccount = await server.loadAccount(user.smartWalletAddress);
        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET
        })
          .addOperation(StellarSdk.Operation.payment({
            destination: SYSTEM_ACCOUNT_ADDRESS,
            asset: StellarSdk.Asset.native(),
            amount: amount.toString()
          }))
          .setTimeout(180)
          .build();
        
        // Get transaction XDR
        const transactionXDR = transaction.toXDR();
        
        // Use PasskeyKit to sign the transaction
        const signedTransaction = await passkeyKit.sign(transactionXDR);
        
        // Submit the transaction
        const result = await server.submitTransaction(signedTransaction);
        
        console.log('Transaction successful!', result);
        */
        
        // If transaction was successful, update the local balances
        // For the hackathon, we'll simulate this
        const newPlatformBalance = user.platformBalanceXLM + amount;
        const newXlmBalance = (parseFloat(currentXlmBalance) - amount).toFixed(7);
        
        // Update user in state and localStorage
        const updatedUser = { ...user, platformBalanceXLM: newPlatformBalance };
        setUser(updatedUser);
        setCurrentXlmBalance(newXlmBalance);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
        
        alert('Deposit Successful!');
      } catch (txError: any) {
        console.error("Transaction error:", txError);
        throw new Error(`Transaction failed: ${txError.message || 'Unknown error'}`);
      }
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