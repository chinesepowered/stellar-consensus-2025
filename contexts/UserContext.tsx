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
const NFT_CONTRACT_ID = 'CD5IRLBLESZ5X4PTP2IFT6GJXCR45KZJEMSXTYFF7GH2ECA276WOM4WR';

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
  subscribeToCreator: (creatorId: string, price: number) => Promise<void>;
  tipCreator: (creatorId: string, amount: number) => Promise<void>;
  purchaseNft: (nftDetails: Omit<NftData, 'id' | 'purchaseDate' | 'contractAddress' | 'tokenId'> & { id: string, price: number, creatorId: string }) => Promise<void>;
  fetchBalances: () => Promise<void>;
  fundWalletWithTestnet: () => Promise<void>;
  depositViaLaunchtube: (amount: number) => Promise<boolean>;
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
          const accountData = await response.json();
          const xlmBalance = accountData.balances.find(
            (balance: any) => balance.asset_type === 'native'
          );
          
          if (xlmBalance) {
            setCurrentXlmBalance(xlmBalance.balance);
            console.log(`XLM balance from Horizon: ${xlmBalance.balance}`);
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

  const depositToPlatform = async (amount: number) => {
    if (!user) throw new Error("User not logged in");
    if (!passkeyKitInstance || !walletData) throw new Error("Wallet not initialized");
    if (!nativeTokenInstance) throw new Error("Native token client not initialized");
    
    setIsLoading(true);
    try {
      const passkeyKit = passkeyKitInstance;
      
      console.log(`Preparing to transfer ${amount} XLM to system account: ${SYSTEM_ACCOUNT_ADDRESS}`);
      
      try {
        // Convert XLM amount to stroop (1 XLM = 10,000,000 stroop)
        const amountInStroops = BigInt(Math.floor(amount * 10_000_000));
        console.log(`Building transfer transaction for ${amountInStroops} stroops...`);
        
        // Following EXACTLY the pattern from the demo in App.svelte:
        // Get a transaction without destructuring anything
        const at = await nativeTokenInstance.transfer({
          from: user.smartWalletAddress,
          to: SYSTEM_ACCOUNT_ADDRESS,
          amount: amountInStroops
        });
        
        // Sign with the keyId like in the demo
        console.log("Signing transaction...");
        await passkeyKit.sign(at, { keyId: walletData.keyIdBase64 });
        
        // Send the transaction using the built property if it exists, otherwise send the transaction object
        console.log("Sending transaction to network...");
        const result = at.built ? await at.built.send() : await at.send();
        console.log('Transaction successful!', result);
        
        // If transaction was successful, update the local balances
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
    } finally {
      setIsLoading(false);
    }
  };

  const withdrawFromPlatform = async (amount: number) => {
    if (!user) throw new Error("User not logged in");
    if (!passkeyKitInstance || !walletData) throw new Error("Wallet not initialized");
    if (!nativeTokenInstance) throw new Error("Native token client not initialized");
    
    setIsLoading(true);
    try {
      // For the hackathon demo, we're simulating a withdrawal
      // In a real app, we would create a transaction from the platform to the user
      console.log(`Simulating withdrawal of ${amount} XLM from platform to user's wallet: ${user.smartWalletAddress}`);
      
      // Create a transaction from system account to user wallet
      // This is a simulation - in a real app, this would use a different authorization mechanism
      try {
        // Initialize the funding account to use for the simulated withdrawal
        const funding = await initFundingAccount();
        if (!funding) {
          throw new Error("Could not initialize funding account for withdrawal");
        }
        
        // Convert XLM amount to stroop
        const amountInStroops = BigInt(Math.floor(amount * 10_000_000));
        
        // Use the pattern from the demo
        const at = await nativeTokenInstance.transfer({
          from: funding.publicKey,
          to: user.smartWalletAddress,
          amount: amountInStroops
        });
        
        // Sign with the funding account
        await at.signAuthEntries({
          address: funding.publicKey,
          signAuthEntry: funding.signer.signAuthEntry
        });
        
        // Send the transaction
        const result = at.built ? await at.built.send() : await at.send();
        console.log('Withdrawal transaction successful!', result);
        
        // Update local state
        const newPlatformBalance = Math.max(0, user.platformBalanceXLM - amount);
        const newXlmBalance = (parseFloat(currentXlmBalance) + amount).toFixed(7);
        
        // Update user in state and localStorage
        const updatedUser = { ...user, platformBalanceXLM: newPlatformBalance };
        setUser(updatedUser);
        setCurrentXlmBalance(newXlmBalance);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
        
        alert('Withdrawal Successful!');
      } catch (txError: any) {
        console.error("Transaction error:", txError);
        throw new Error(`Transaction failed: ${txError.message || 'Unknown error'}`);
      }
    } catch (error: any) { 
      console.error(error); 
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
    
    // Get token from environment variables
    const LAUNCHTUBE_TOKEN = process.env.LAUNCHTUBE_TOKEN || "";
    
    if (!LAUNCHTUBE_TOKEN) {
      console.log("No Launchtube token found in environment variables, falling back to direct submission");
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
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Launchtube error: ${JSON.stringify(errorData)}`);
      }
      
      const result = await response.json();
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
    if (!nativeTokenInstance) throw new Error("Native token client not initialized");
    
    // Get token from environment variables
    const LAUNCHTUBE_TOKEN = process.env.NEXT_PUBLIC_LAUNCHTUBE_TOKEN || "";
    
    if (!LAUNCHTUBE_TOKEN) {
      console.log("No Launchtube token in environment, falling back to regular deposit");
      await depositToPlatform(amount);
      return true; // Assuming deposit was successful
    }
    
    setIsLoading(true);
    try {
      const passkeyKit = passkeyKitInstance;
      
      console.log(`Preparing to transfer ${amount} XLM to system account via Launchtube: ${SYSTEM_ACCOUNT_ADDRESS}`);
      
      try {
        // Convert XLM amount to stroop (1 XLM = 10,000,000 stroop)
        const amountInStroops = BigInt(Math.floor(amount * 10_000_000));
        
        // Get transaction
        const at = await nativeTokenInstance.transfer({
          from: user.smartWalletAddress,
          to: SYSTEM_ACCOUNT_ADDRESS,
          amount: amountInStroops
        });
        
        // Sign with the passkey
        console.log("Signing transaction...");
        await passkeyKit.sign(at, { keyId: walletData.keyIdBase64 });
        
        if (!at.built) {
          throw new Error("Transaction not properly built for Launchtube");
        }
        
        // Send via Launchtube
        console.log("Submitting to Launchtube...");
        const xdr = at.built.toXDR();
        
        // Testnet Launchtube URL
        const LAUNCHTUBE_URL = "https://testnet.launchtube.xyz";
        
        // Make the request to Launchtube
        const response = await fetch(LAUNCHTUBE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Bearer ${LAUNCHTUBE_TOKEN}`
          },
          body: new URLSearchParams({ xdr })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Launchtube error: ${JSON.stringify(errorData)}`);
        }
        
        const result = await response.json();
        console.log("Launchtube submission successful:", result);
        
        // If transaction was successful, update the local balances
        const newPlatformBalance = user.platformBalanceXLM + amount;
        const newXlmBalance = (parseFloat(currentXlmBalance) - amount).toFixed(7);
        
        // Update user in state and localStorage
        const updatedUser = { ...user, platformBalanceXLM: newPlatformBalance };
        setUser(updatedUser);
        setCurrentXlmBalance(newXlmBalance);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updatedUser));
        
        alert('Deposit via Launchtube Successful!');
        return true;
      } catch (txError: any) {
        console.error("Launchtube transaction error:", txError);
        alert(`Launchtube deposit failed: ${txError.message || 'Unknown error'}`);
        return false;
      }
    } finally {
      setIsLoading(false);
    }
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
        fetchBalances,
        fundWalletWithTestnet: fundCurrentWalletWithTestnet,
        depositViaLaunchtube
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