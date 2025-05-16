'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { User as ApiUser, NftData, UserAction } from '@/lib/types'; // Import standardized types
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'; // Import the support check
import { PasskeyKit as PasskeyKitType, SACClient } from 'passkey-kit'; // Import the actual type
import { Buffer } from 'buffer'; // Import Buffer properly
import { Keypair } from '@stellar/stellar-sdk/minimal';
import { basicNodeSigner } from '@stellar/stellar-sdk/minimal/contract';

// System account that will receive deposits
const SYSTEM_ACCOUNT_ADDRESS = 'GDXCCSIV6E3XYB45NCPPBR4BUJZEI3GPV2YNXF2XIQO2DVCDID76SHFG';

// Configuration values previously in lib/data.ts
const DUMMY_WALLET_WASM_HASH = 'ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90';
const FACTORY_CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

// Real NFT contract ID - use for actual minting
const NFT_CONTRACT_ID = 'CCNMXO54G46RHX6XFJ3ZBVRMXZIPRU7JUNRIITQNTZJWIB55YV6J2W54';

// Contract IDs for demo purposes
const DUMMY_SUBSCRIPTION_CONTRACT_ID = 'CCIFA3JIYPVQILXSPZX5OMT6B5X4LPIMHXHZCD57AOWQNKTDTVAZZTBV';
const DUMMY_TIPJAR_CONTRACT_ID = 'CCIFA3JIYPVQILXSPZX5OMT6B5X4LPIMHXHZCD57AOWQNKTDTVAZZTBV';
const DUMMY_NFT_MINT_CONTRACT_ID = 'CD5IRLBLESZ5X4PTP2IFT6GJXCR45KZJEMSXTYFF7GH2ECA276WOM4WR';

// Native token contract ID (XLM)
const NATIVE_TOKEN_CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

// Local storage keys
const SESSION_TOKEN_LOCAL_STORAGE_KEY = 'onlyfrens_session_token';
const LOCAL_STORAGE_USER_KEY = 'onlyfrens_user_data';
const LOCAL_STORAGE_WALLET_KEY = 'onlyfrens_wallet_data';

// Create singleton instances to avoid recreating them during renders
let passkeyKitInstance: PasskeyKitType | null = null;
let sacClientInstance: SACClient | null = null;
let nativeTokenInstance: any = null;

// Helper function to initialize PasskeyKit (will be called once)
async function initializePasskeyKit() {
  if (typeof window === "undefined" || !browserSupportsWebAuthn()) {
    return null;
  }
  
  try {
    const { startRegistration, startAuthentication } = await import('@simplewebauthn/browser');
    const { PasskeyKit, SACClient } = await import('passkey-kit');
    
    if (!PasskeyKit) {
      console.error("PasskeyKit module was imported but PasskeyKit class is not available");
      return null;
    }
    
    console.log("Initializing PasskeyKit with config");
    
    // Create the PasskeyKit instance
    const instance = new PasskeyKit({
      rpcUrl: RPC_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      walletWasmHash: DUMMY_WALLET_WASM_HASH,
      timeoutInSeconds: 60, // Generous timeout for demo purposes
      WebAuthn: { startRegistration, startAuthentication } // Use imported functions
    });
    
    // Initialize SAC client
    sacClientInstance = new SACClient({
      rpcUrl: RPC_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    
    // Get native token client
    nativeTokenInstance = sacClientInstance.getSACClient(NATIVE_TOKEN_CONTRACT_ID);
    
    console.log("PasskeyKit initialized successfully!");
    
    return instance;
  } catch (error) {
    console.error("Failed to initialize PasskeyKit:", error);
    return null;
  }
}

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
  subscribeToCreator: (creatorId: string, price: number) => Promise<{ success: boolean; error?: string }>;
  tipCreator: (creatorId: string, amount: number) => Promise<{ success: boolean; error?: string }>;
  purchaseNft: (
    nftDetails: Omit<NftData, 'id' | 'purchaseDate' | 'contractAddress' | 'tokenId'> & { id: string, price: number, creatorId: string },
    options?: { directOnChainOnly?: boolean }
  ) => Promise<{ success: boolean; error?: string; nft?: NftData }>;
  fetchBalances: () => Promise<void>;
  fundWalletWithTestnet: () => Promise<void>;
  depositViaLaunchtube: (amount: number) => Promise<boolean>;
  hasPremiumAccess: () => boolean;
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

// Create a funding keypair and request Stellar testnet tokens for it
// Adapted from the PasskeyKit demo 
const generateFundingKeypair = async () => {
  try {
    // Import needed modules dynamically
    const { Keypair } = await import("@stellar/stellar-sdk/minimal");
    const { basicNodeSigner } = await import("@stellar/stellar-sdk/minimal/contract");
    
    // Generate a keypair based on the current hour to make it stable but changing each hour
    const now = new Date();
    now.setMinutes(0, 0, 0);
    
    // Create a deterministic seed based on the current hour
    const nowData = new TextEncoder().encode(now.getTime().toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', nowData);
    
    // Convert ArrayBuffer to Buffer using Buffer.from
    const seed = Buffer.from(hashBuffer);
    const keypair = Keypair.fromRawEd25519Seed(seed);
    
    console.log("Generated funding keypair", keypair.publicKey());
    
    return {
      keypair,
      publicKey: keypair.publicKey(),
      signer: basicNodeSigner(keypair, NETWORK_PASSPHRASE)
    };
  } catch (error) {
    console.error("Error generating funding keypair:", error);
    return null;
  }
};

// Store the funding info globally
let fundingInfo: { keypair: any; publicKey: string; signer: any } | null = null;

// Initialize funding keypair
const initFundingAccount = async () => {
  if (!fundingInfo) {
    fundingInfo = await generateFundingKeypair();
  }
  return fundingInfo;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [currentXlmBalance, setCurrentXlmBalance] = useState<string>('0.0000000');
  const [isLoading, setIsLoading] = useState(false); // For general per-action loading
  const [isLoadingUser, setIsLoadingUser] = useState(true); // For initial session check
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isPasskeySupported, setIsPasskeySupported] = useState(false); // Default to false until checked
  const [isPasskeyKitInitialized, setIsPasskeyKitInitialized] = useState(false);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  
  // Initialize once on component mount
  useEffect(() => {
    const checkSupportAndInitialize = async () => {
      if (typeof window !== "undefined") {
        // Check for WebAuthn support
        const supported = browserSupportsWebAuthn();
        setIsPasskeySupported(supported);
        
        if (supported) {
          try {
            // Only initialize if not already done
            if (!passkeyKitInstance) {
              passkeyKitInstance = await initializePasskeyKit();
            }
            
            if (passkeyKitInstance) {
              setIsPasskeyKitInitialized(true);
              console.log("PasskeyKit successfully initialized with WebAuthn support.");
            } else {
              setIsPasskeyKitInitialized(false);
            }
          } catch (error) {
            console.error("Failed to initialize PasskeyKit:", error);
            setIsPasskeyKitInitialized(false);
          }
        } else {
          console.warn("WebAuthn is not supported by this browser.");
          setIsPasskeyKitInitialized(false);
        }
      }
    };

    checkSupportAndInitialize();
  }, []);

  // Load session data separately
  useEffect(() => {
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

  // Simplified fetch balances using the demo app pattern
  const fetchBalances = useCallback(async () => {
    if (!user?.smartWalletAddress || !isPasskeyKitInitialized) {
      console.log("Cannot fetch balances: user not logged in, no wallet address, or PasskeyKit not initialized");
      return;
    }
    
    console.log(`Fetching balance for wallet address: ${user.smartWalletAddress}`);
    setIsLoading(true);
    
    try {
      // Similar approach to the demo app
      if (!nativeTokenInstance) {
        if (!sacClientInstance) {
          console.error("SAC client not initialized");
          throw new Error("Wallet services not fully initialized");
        }
        nativeTokenInstance = sacClientInstance.getSACClient(NATIVE_TOKEN_CONTRACT_ID);
      }
      
      // Get balance like the demo app
      const { result } = await nativeTokenInstance.balance({ 
        id: user.smartWalletAddress 
      });
      
      if (result !== undefined) {
        // Convert from stroop (10^-7) to XLM (match the demo app approach)
        const balanceInXLM = (Number(result) / 10_000_000).toFixed(7);
        console.log(`Raw balance result: ${result}, converted to: ${balanceInXLM} XLM`);
        setCurrentXlmBalance(balanceInXLM);
      } else {
        console.log("No balance result returned");
        setCurrentXlmBalance('0.0000000');
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      
      // Fall back to Horizon API
      try {
        const horizonUrl = `https://horizon-testnet.stellar.org/accounts/${user.smartWalletAddress}`;
        const response = await fetch(horizonUrl);
        
        if (response.ok) {
          const accountData = await response.json() as { balances: Array<{ asset_type: string; balance: string }> };
          const xlmBalanceObj = accountData.balances.find(
            (balance: any) => balance.asset_type === 'native'
          );
          
          if (xlmBalanceObj) {
            setCurrentXlmBalance(xlmBalanceObj.balance);
            console.log(`XLM balance from Horizon: ${xlmBalanceObj.balance}`);
          } else {
            setCurrentXlmBalance('0.0000000');
          }
        } else {
          setCurrentXlmBalance('0.0000000');
        }
      } catch (fallbackError) {
        console.error("Error in fallback balance fetch:", fallbackError);
        setCurrentXlmBalance('0.0000000');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.smartWalletAddress, isPasskeyKitInitialized]);

  // Effect to fetch balance when user and PasskeyKit are ready
  useEffect(() => {
    const shouldFetchBalance = user?.smartWalletAddress && isPasskeyKitInitialized && !isLoadingUser;
    
    if (shouldFetchBalance) {
      console.log("User and PasskeyKit ready, fetching initial balance");
      // Use setTimeout to avoid immediate execution in the same render cycle
      setTimeout(() => {
        fetchBalances();
      }, 500);
    }
  }, [user?.smartWalletAddress, isPasskeyKitInitialized, isLoadingUser]);

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
      
      // Set a timeout to fetch balances after wallet info is saved
      setTimeout(() => {
        console.log("Fetching balances after successful authentication");
        fetchBalances();
      }, 500);
    }
    
    console.log(`Auth success, token set: ${token}`);
  };

  const registerWithPasskey = async (username: string) => {
    if (!isPasskeyKitInitialized || !passkeyKitInstance) {
      alert("PasskeyKit is still initializing or not available. Please try again shortly.");
      return;
    }
    
    // First clear any existing data to avoid conflicts
    resetAllUserData();
    
    setIsLoading(true);
    try {
      // Using direct PasskeyKit createWallet method for registration
      // This will create both a passkey and wallet in one step
      const passkeyKit = passkeyKitInstance;
      
      console.log("Creating wallet directly with PasskeyKit.createWallet...");
      const walletResult = await passkeyKit.createWallet(
        "onlyfrens", // app name
        username     // username
      );
      
      console.log("Wallet creation result:", walletResult);

      // We should now have a valid wallet
      if (walletResult.keyIdBase64 && walletResult.contractId) {
        // Try to fund the new wallet with testnet XLM
        console.log("Attempting to fund the new wallet...");
        await fundWallet(walletResult.contractId);
        
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
    if (!isPasskeyKitInitialized || !passkeyKitInstance) {
      alert("PasskeyKit is still initializing or not available. Please try again shortly.");
      return;
    }
    
    const passkeyKit = passkeyKitInstance;
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

  // Import the required modules for the wallet functions
  const importDemoModules = async () => {
    try {
      // These would be imported from the demo's lib/common.ts 
      const baseKeyPair = Keypair.random();
      const baseAccount = baseKeyPair.publicKey();
      console.log("Created base account:", baseAccount);
      return { baseKeyPair, baseAccount };
    } catch (error) {
      console.error("Failed to import demo modules:", error);
      return null;
    }
  };

  // Updated deposit function using lessons from the demo
  const depositToPlatform = async (amount: number) => {
    if (!user) throw new Error("User not logged in");
    if (!passkeyKitInstance || !walletData) throw new Error("Wallet not initialized");
    if (!sacClientInstance) throw new Error("SAC client not initialized");
    
    setIsLoading(true);
    try {
      // Log all available information
      console.log("===== Starting deposit process =====");
      console.log("User wallet address:", user.smartWalletAddress);
      console.log("Passkey data:", {
        keyId: walletData.keyIdBase64,
        hasPublicKey: Boolean(walletData.publicKey)
      });
      
      // Convert XLM amount to stroop
      const amountInStroops = BigInt(Math.floor(amount * 10_000_000));
      console.log(`Amount: ${amount} XLM (${amountInStroops} stroops)`);
      
      try {
        // Get the native token client directly 
        const nativeTokenClient = sacClientInstance.getSACClient(NATIVE_TOKEN_CONTRACT_ID);
        
        // Log token client details
        console.log("Token client:", {
          address: NATIVE_TOKEN_CONTRACT_ID,
          methods: Object.getOwnPropertyNames(Object.getPrototypeOf(nativeTokenClient))
            .filter(name => typeof nativeTokenClient[name] === 'function')
        });
        
        // Following the exact demo pattern
        console.log("Building transfer transaction...");
        const txParams = {
          from: user.smartWalletAddress,
          to: SYSTEM_ACCOUNT_ADDRESS, 
          amount: amountInStroops
        };
        
        console.log("Transaction parameters:", JSON.stringify(txParams, (k, v) => 
          typeof v === 'bigint' ? v.toString() : v
        ));
        
        // Create transfer transaction
        let transaction = await nativeTokenClient.transfer(txParams);
        
        console.log("Transaction created with properties:", Object.keys(transaction));
        
        // Try different signing patterns
        try {
          console.log("Trying to sign with { keyId }...");
          await passkeyKitInstance.sign(transaction, { keyId: walletData.keyIdBase64 });
        } catch (signError) {
          console.error("First signing attempt failed:", signError);
          
          try {
            console.log("Retrying with different pattern...");
            // Instead of direct signing, try recreating everything from scratch
            
            const fundResult = await fundWallet(user.smartWalletAddress);
            if (fundResult) {
              await fetchBalances();
              alert("Transaction approach failed, but we funded your wallet directly with test XLM.");
              return;
            } else {
              throw new Error("All signing attempts failed");
            }
          } catch (retryError) {
            console.error("All signing attempts failed:", retryError);
            throw new Error(`Signing failed: ${retryError.message}`);
          }
        }
        
        // If signing succeeds, send the transaction
        console.log("Transaction signed, sending...");
        const result = await transaction.send();
        console.log("Transaction result:", result);
        
        // Update balances
        const newPlatformBalance = user.platformBalanceXLM + amount;
        const newXlmBalance = (parseFloat(currentXlmBalance) - amount).toFixed(7);
        
        // Update user state and localStorage
        const updatedUser = { ...user, platformBalanceXLM: newPlatformBalance };
        setUser(updatedUser);
        setCurrentXlmBalance(newXlmBalance);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
        
        alert('Deposit Successful!');
      } catch (txError) {
        console.error("Transaction pipeline error:", txError);
        throw txError;
      }
    } catch (error: any) { 
      console.error("Deposit error:", error);
      alert(`Deposit failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawFromPlatform = async (amount: number) => {
    if (!user) throw new Error("User not logged in");
    if (!passkeyKitInstance || !walletData) throw new Error("Wallet not initialized");
    if (!sacClientInstance) throw new Error("SAC client not initialized");
    
    setIsLoading(true);
    try {
      // For the hackathon demo, we're simulating a withdrawal
      // In a real app, we would create a transaction from the platform to the user
      console.log(`Simulating withdrawal of ${amount} XLM to user's wallet: ${user.smartWalletAddress}`);
      
      try {
        // Initialize the funding account
        const funding = await initFundingAccount();
        if (!funding) {
          throw new Error("Could not initialize funding account for withdrawal");
        }
        
        // Convert XLM amount to stroop
        const amountInStroops = BigInt(Math.floor(amount * 10_000_000));
        
        // Get the native token client directly 
        const nativeTokenClient = sacClientInstance.getSACClient(NATIVE_TOKEN_CONTRACT_ID);
        
        // Create transfer transaction from funding account to user
        console.log("Creating withdrawal transaction...");
        const txParams = {
          from: funding.publicKey,
          to: user.smartWalletAddress,
          amount: amountInStroops
        };
        
        // Build the transaction
        const transaction = await nativeTokenClient.transfer(txParams);
        
        // Sign with funding account
        console.log("Signing withdrawal transaction...");
        await transaction.signAuthEntries({
          address: funding.publicKey,
          signAuthEntry: funding.signer.signAuthEntry
        });
        
        // Send the transaction
        console.log("Sending withdrawal transaction...");
        const result = await transaction.send();
        console.log("Withdrawal transaction result:", result);
        
        // Update balances
        const newPlatformBalance = Math.max(0, user.platformBalanceXLM - amount);
        const newXlmBalance = (parseFloat(currentXlmBalance) + amount).toFixed(7);
        
        // Update user state
        const updatedUser = { ...user, platformBalanceXLM: newPlatformBalance };
        setUser(updatedUser);
        setCurrentXlmBalance(newXlmBalance);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
        
        alert('Withdrawal Successful!');
      } catch (txError) {
        console.error("Withdrawal transaction error:", txError);
        throw new Error(`Withdrawal failed: ${txError.message}`);
      }
    } catch (error: any) { 
      console.error("Withdrawal error:", error); 
      alert(`Withdrawal failed: ${error.message}`); 
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToCreator = async (creatorId: string, price: number) => {
    if (!user) throw new Error("User not logged in");
    if (user.platformBalanceXLM < price) throw new Error("Insufficient platform balance.");
    setIsLoading(true);
    try {
      // In-memory mock - just update the balance and add subscription
      const newPlatformBalance = user.platformBalanceXLM - price;
      
      // Set up a subscription that expires in 30 days
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      // Match the existing structure of subscription objects
      const newSubscription = { 
        creatorId,
        subscribedSince: new Date().toISOString(),
        expires: expiryDate.toISOString()
      };
      
      // Add action to history
      const newAction: UserAction = {
        id: `action_${Date.now()}`,
        type: "SUBSCRIPTION",
        description: `Subscribed to creator ${creatorId} for ${price} XLM/month`,
        timestamp: new Date().toISOString(),
        targetId: creatorId,
        amount: price
      };
      
      const updatedSubscriptions = [
        newSubscription,
        ...user.subscriptions.filter(s => s.creatorId !== creatorId)
      ];
      
      const updatedUser = { 
        ...user, 
        subscriptions: updatedSubscriptions, 
        platformBalanceXLM: newPlatformBalance,
        actionHistory: [newAction, ...user.actionHistory]
      };
      
      setUser(updatedUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
      
      // No alert - returning success object instead
      return { success: true };
    } catch (error: any) { 
      console.error(error); 
      // Return error instead of showing alert
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
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
      
      // No alert - the UI component will show success status instead
      return { success: true };
    } catch (error: any) { 
      console.error(error); 
      // Return error instead of showing alert
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  const purchaseNft = async (
    nftPurchaseDetails: Omit<NftData, 'id' | 'purchaseDate' | 'contractAddress' | 'tokenId'> & { id: string, price: number, creatorId: string },
    options?: { directOnChainOnly?: boolean }
  ) => {
    if (!user) throw new Error("User not logged in");
    const { price, creatorId, id: nftId } = nftPurchaseDetails;

    if (user.platformBalanceXLM < price) throw new Error("Insufficient platform balance.");
    setIsLoading(true);
    try {
      const newPlatformBalance = user.platformBalanceXLM - price;
      let newNft: NftData;

      if (options?.directOnChainOnly) {
        console.log(`[Direct On-Chain] Initiating on-chain minting for NFT: ${nftPurchaseDetails.name} to wallet ${user.smartWalletAddress}`);
        // Directly call the on-chain minting, skip platform DB call
        const mintingResponse = await fetch('/api/nft/mint-for-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userWalletAddress: user.smartWalletAddress,
            nftId: nftPurchaseDetails.id, // Use the ID from input details
            name: nftPurchaseDetails.name,
            description: nftPurchaseDetails.description,
            imageUrl: nftPurchaseDetails.imageUrl,
          }),
        });

        if (!mintingResponse.ok) {
          const mintErrorData = await mintingResponse.json() as { message?: string };
          // For direct on-chain, failure here is critical, so we throw and stop.
          throw new Error(mintErrorData.message || 'Direct on-chain NFT minting failed');
        }

        const mintingResult = await mintingResponse.json() as { success: boolean; message?: string; [key: string]: any };
        console.log("[Direct On-Chain] On-chain minting successful:", mintingResult);

        // Construct NftData client-side as we skipped the DB call that usually provides it
        newNft = {
          id: nftPurchaseDetails.id,
          name: nftPurchaseDetails.name,
          description: nftPurchaseDetails.description,
          imageUrl: nftPurchaseDetails.imageUrl,
          contractAddress: NFT_CONTRACT_ID, // Use the globally defined contract ID
          tokenId: `onchain-${Date.now()}`, // Placeholder tokenId, actual one is on-chain
          creatorId: nftPurchaseDetails.creatorId,
          purchaseDate: new Date().toISOString(),
        };
        // No separate alert for on-chain failure here, as we throw above if it fails.

      } else {
        // Original behavior: Call platform DB first, then on-chain mint
        console.log(`Calling backend API to mint NFT ${nftId} (platform DB first)`);
        const response = await fetch('/api/nft/mint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          const errorData = await response.json() as { message?: string };
          throw new Error(errorData.message || 'Failed to mint NFT (platform DB)');
        }

        const result = await response.json() as { success: boolean; message?: string; nft: NftData };
        if (!result.success || !result.nft) {
          throw new Error(result.message || 'Failed to mint NFT (platform DB reports failure or missing NFT data)');
        }
        newNft = result.nft; // Use the NFT data returned from the platform DB

        // ---- Call backend to mint the actual NFT on-chain ----
        try {
          console.log(`Initiating on-chain minting for NFT ${newNft.id} to wallet ${user.smartWalletAddress}`);
          const mintingResponse = await fetch('/api/nft/mint-for-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userWalletAddress: user.smartWalletAddress,
              nftId: newNft.id,
              name: newNft.name,
              description: newNft.description,
              imageUrl: newNft.imageUrl,
            }),
          });

          if (!mintingResponse.ok) {
            const mintErrorData = await mintingResponse.json() as { message?: string };
            throw new Error(mintErrorData.message || 'On-chain NFT minting failed via backend');
          }

          const mintingResult = await mintingResponse.json() as { success: boolean; message?: string; [key: string]: any };
          console.log("On-chain minting successful:", mintingResult);
        } catch (mintingError: any) {
          console.error("Error during on-chain NFT minting:", mintingError);
          // Return partial success but include error message about on-chain part
          return {
            success: true,
            error: `NFT purchase recorded in platform, but on-chain minting failed: ${mintingError.message}. Please contact support.`,
            nft: newNft
          };
        }
        // ---- END On-chain minting call ----
      }

      // Common logic for updating user state
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

      // Return success with the minted NFT
      return { success: true, nft: newNft };
    } catch (error: any) {
      console.error("NFT Purchase Error:", error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Now let's add the fundWallet function that will fund a newly created wallet
  const fundWallet = async (contractId: string) => {
    if (!isPasskeyKitInitialized || !nativeTokenInstance) {
      console.error("Cannot fund wallet: PasskeyKit or native token client not initialized");
      return false;
    }
    
    try {
      // Initialize the funding account if not done yet
      const funding = await initFundingAccount();
      if (!funding) {
        console.error("Could not initialize funding account");
        return false;
      }
      
      console.log(`Funding wallet ${contractId} with 100 XLM from ${funding.publicKey}`);
      
      // Use the pattern from the demo
      const at = await nativeTokenInstance.transfer({
        to: contractId,
        from: funding.publicKey,
        amount: BigInt(100 * 10_000_000) // 100 XLM
      });
      
      // Sign the transaction with the funding account
      await at.signAuthEntries({
        address: funding.publicKey,
        signAuthEntry: funding.signer.signAuthEntry
      });
      
      // Send the transaction
      const result = at.built ? await at.built.send() : await at.send();
      console.log("Funding transaction result:", result);
      
      return true;
    } catch (error) {
      console.error("Error funding wallet:", error);
      return false;
    }
  };

  // Add a wrapper function for funding current user's wallet
  const fundCurrentWalletWithTestnet = async () => {
    if (!user?.smartWalletAddress) {
      console.error("Cannot fund wallet: No wallet address available");
      alert("You need to be logged in with a valid wallet to use this feature");
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await fundWallet(user.smartWalletAddress);
      if (success) {
        alert("Your wallet has been funded with 100 test XLM!");
        await fetchBalances();
      } else {
        alert("Failed to fund your wallet. Please try again later.");
      }
    } catch (error) {
      console.error("Error funding wallet:", error);
      alert("Failed to fund wallet: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // Utility function to submit transactions through Launchtube
  const submitViaLaunchtube = async (transaction: any) => {
    if (!transaction.built) {
      throw new Error("Transaction must be built before submitting to Launchtube");
    }
    
    // Testnet Launchtube URL
    const LAUNCHTUBE_URL = "https://testnet.launchtube.xyz";
    
    // Get token from environment variables - try both possible names
    let LAUNCHTUBE_TOKEN = process.env.NEXT_PUBLIC_LAUNCHTUBE_TOKEN || "";
    
    // If the NEXT_PUBLIC token contains "your_token_here", use the regular token instead
    if (LAUNCHTUBE_TOKEN.includes("your_token_here")) {
      console.log("NEXT_PUBLIC_LAUNCHTUBE_TOKEN is malformatted, trying LAUNCHTUBE_TOKEN");
      LAUNCHTUBE_TOKEN = process.env.LAUNCHTUBE_TOKEN || "";
    }
    
    // Log first few characters of token for debugging
    if (LAUNCHTUBE_TOKEN) {
      console.log(`Using Launchtube token: ${LAUNCHTUBE_TOKEN.substring(0, 20)}...`);
    } else {
      console.log("No valid Launchtube token found");
      return transaction.built.send();
    }
    
    try {
      console.log("Submitting transaction via Launchtube...");
      
      // Get the XDR of the built transaction
      const xdr = transaction.built.toXDR();
      
      // Create form data
      const formData = new URLSearchParams();
      formData.append("xdr", xdr);
      
      // Make the request to Launchtube
      const response = await fetch(LAUNCHTUBE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${LAUNCHTUBE_TOKEN}`
        },
        body: formData
      });
      
      // Log the complete response for debugging
      const responseText = await response.text();
      console.log("Launchtube response:", responseText);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { message: responseText };
        }
        throw new Error(`Launchtube error: ${JSON.stringify(errorData)}`);
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { message: responseText };
      }
      
      console.log("Launchtube submission successful:", result);
      return result;
    } catch (error) {
      console.error("Error submitting via Launchtube:", error);
      console.log("Falling back to direct submission...");
      return transaction.built.send();
    }
  };

  // Function to deposit using Launchtube
  const depositViaLaunchtube = async (amount: number): Promise<boolean> => {
    if (!user) throw new Error("User not logged in");
    if (!passkeyKitInstance || !walletData) throw new Error("Wallet not initialized");
    if (!sacClientInstance) throw new Error("SAC client not initialized");
    
    // Testnet Launchtube URL
    const LAUNCHTUBE_URL = "https://testnet.launchtube.xyz";
    
    // Get token from environment variables - try both possible names
    let LAUNCHTUBE_TOKEN = process.env.NEXT_PUBLIC_LAUNCHTUBE_TOKEN || "";
    
    // If the NEXT_PUBLIC token contains "your_token_here", use the regular token instead
    if (LAUNCHTUBE_TOKEN.includes("your_token_here")) {
      console.log("NEXT_PUBLIC_LAUNCHTUBE_TOKEN is malformatted, trying LAUNCHTUBE_TOKEN");
      LAUNCHTUBE_TOKEN = process.env.LAUNCHTUBE_TOKEN || "";
    }
    
    // Log first few characters of token for debugging
    if (LAUNCHTUBE_TOKEN) {
      console.log(`Using Launchtube token for deposit: ${LAUNCHTUBE_TOKEN.substring(0, 20)}...`);
    } else {
      console.log("No valid Launchtube token found");
      alert("No Launchtube token available");
      return false;
    }
    
    setIsLoading(true);
    try {
      console.log(`Preparing to transfer ${amount} XLM to system account via Launchtube: ${SYSTEM_ACCOUNT_ADDRESS}`);
      console.log("Wallet data available:", {
        keyId: walletData.keyIdBase64,
        hasPublicKey: Boolean(walletData.publicKey),
        smartWalletAddress: walletData.smartWalletAddress || user.smartWalletAddress
      });
      
      try {
        // Convert XLM amount to stroop (1 XLM = 10,000,000 stroop)
        const amountInStroops = BigInt(Math.floor(amount * 10_000_000));
        
        // Get the native token client directly 
        if (!nativeTokenInstance) {
          nativeTokenInstance = sacClientInstance.getSACClient(NATIVE_TOKEN_CONTRACT_ID);
        }
        console.log("Got native token client:", Boolean(nativeTokenInstance));
        
        // Create transaction using the passkey-kit directly
        console.log("Creating transaction...");
        
        // Build the transaction with the parameters explicitly unwrapped
        // This avoids destructuring which might cause the options error
        const from = user.smartWalletAddress;
        const to = SYSTEM_ACCOUNT_ADDRESS;
        const amountValue = amountInStroops;
        
        console.log("Transaction parameters:", {
          from,
          to,
          amount: amountValue.toString()
        });
        
        // Build without destructuring the parameters
        const transaction = await nativeTokenInstance.transfer({
          from,
          to,
          amount: amountValue
        });
        
        console.log("Transaction created with properties:", Object.keys(transaction));
        
        // Make sure we're using the correct keyId format for signature
        const keyId = walletData.keyIdBase64;
        console.log(`Using keyId for signing: ${keyId}`);
        
        let isConnectedForKey = false;
        try {
          console.log("Checking wallet connection with stored keyId before signing:", keyId);
          isConnectedForKey = await checkWalletConnection(keyId);
        } catch (connectionError) {
          console.warn("checkWalletConnection with stored keyId threw an error:", connectionError);
          isConnectedForKey = false;
        }

        if (!isConnectedForKey) {
          console.warn("Could not connect/verify with stored keyId. Attempting sign with user passkey selection.");
          // This will call connectWallet() without keyId if instance is not connected, letting user pick.
          await passkeyKitInstance.sign(transaction); 
        } else {
          console.log("Successfully connected/verified with stored keyId. Signing with it.");
          // Instance should be connected with keyId.
          await passkeyKitInstance.sign(transaction, { keyId });
        }
          
        if (!transaction.built) {
          throw new Error("Transaction wasn't properly built after signing");
        }
        
        console.log("Transaction signed successfully and built");
        
        // Get XDR representation for logging/debugging
        const xdr = transaction.built.toXDR();
        console.log("Generated XDR:", xdr.substring(0, 100) + "...");
        
        // Create form data
        const formData = new URLSearchParams();
        formData.append("xdr", xdr);
        
        // Submit to Launchtube
        console.log("Submitting to Launchtube...");
        console.log(`Using Launchtube URL: ${LAUNCHTUBE_URL} with token length: ${LAUNCHTUBE_TOKEN.length}`);
        
        const response = await fetch(LAUNCHTUBE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${LAUNCHTUBE_TOKEN}`
          },
          body: formData.toString()
        });
        
        const responseText = await response.text();
        console.log("Launchtube response:", responseText);
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            errorData = { message: responseText };
          }
          throw new Error(`Launchtube API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }
        
        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          result = { message: responseText };
        }
        
        console.log("Transaction result:", result);
        
        // Update balances
        const newPlatformBalance = user.platformBalanceXLM + amount;
        const newXlmBalance = (parseFloat(currentXlmBalance) - amount).toFixed(7);
        
        // Update user state and localStorage
        const updatedUser = { ...user, platformBalanceXLM: newPlatformBalance };
        setUser(updatedUser);
        setCurrentXlmBalance(newXlmBalance);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
        
        alert('Deposit via Launchtube Successful!');
        return true;
      } catch (txError: any) {
        console.error("Launchtube transaction error:", txError);
        // This catch block is for errors during transaction creation or submission logic outside of signing.
        // The main try-catch for depositViaLaunchtube will handle overall failures.
        throw txError; 
      }
    } catch (error: any) {
      console.error("Launchtube deposit failed:", error);
      
      // Try to extract useful information from the error
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error name:", error.name);
        console.error("Error stack:", error.stack);
        
        if ('cause' in error) {
          console.error("Error cause:", error.cause);
        }
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
      
      alert(`Launchtube deposit failed: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to check wallet connection status
  const checkWalletConnection = async (keyId: string): Promise<boolean> => {
    if (!passkeyKitInstance) return false;
    
    try {
      console.log(`Checking wallet connection status for keyId: ${keyId}`);
      const connectResult = await passkeyKitInstance.connectWallet({
        rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        keyId: keyId // Pass the keyId here
      });
      
      console.log("Wallet connectResult:", JSON.stringify(connectResult, null, 2));

      if (connectResult && connectResult.keyIdBase64 && connectResult.contractId) {
        console.log("Wallet connected successfully:", {
          keyId: connectResult.keyIdBase64,
          contractId: connectResult.contractId
        });
        
        if (connectResult.keyIdBase64 !== keyId) {
          console.warn("Connected wallet keyId doesn't match the expected keyId:", {
            connected: connectResult.keyIdBase64,
            expected: keyId
          });
          // Decide if this mismatch is critical. For now, we'll allow it if a contractId was found.
        }
        
        return true;
      }
      
      console.error("Failed to connect to wallet: connectResult was invalid or incomplete.", connectResult);
      return false;
    } catch (error: any) {
      console.error("Error during checkWalletConnection:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      if (error.cause) {
        console.error("Error cause:", error.cause);
      }
      return false;
    }
  };

  const hasPremiumAccess = useCallback((): boolean => {
    if (!user || !user.ownedNfts || user.ownedNfts.length === 0) {
      return false;
    }
    return user.ownedNfts.some(nft => nft.contractAddress === NFT_CONTRACT_ID);
  }, [user]);

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
        fetchBalances,
        fundWalletWithTestnet: fundCurrentWalletWithTestnet,
        depositViaLaunchtube,
        hasPremiumAccess,
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