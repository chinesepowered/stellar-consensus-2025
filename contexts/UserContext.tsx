'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { User as ApiUser, NftData, UserAction, PasskeyRegistrationChallenge, PasskeyLoginChallenge } from '@/lib/types'; // Import standardized types
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'; // Import the support check
import type { PasskeyKit as PasskeyKitType } from 'passkey-kit'; // Import the actual type

const SESSION_TOKEN_LOCAL_STORAGE_KEY = 'onlyfrens_session_token';

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
  loginWithPasskey: (rawId?: string) => Promise<void>; // rawId might be needed for mock login from assertion
  logout: () => Promise<void>;
  // Platform actions
  depositToPlatform: (amount: number) => Promise<void>;
  withdrawFromPlatform: (amount: number) => Promise<void>;
  subscribeToCreator: (creatorId: string, price: number) => Promise<void>;
  tipCreator: (creatorId: string, amount: number) => Promise<void>;
  purchaseNft: (nftDetails: Omit<NftData, 'id' | 'purchaseDate' | 'contractAddress' | 'tokenId'> & { id: string, price: number, creatorId: string }) => Promise<void>;
  fetchBalances: (tokenOverride?: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [currentXlmBalance, setCurrentXlmBalance] = useState<string>('0.0000000');
  const [isLoading, setIsLoading] = useState(false); // For general per-action loading
  const [isLoadingUser, setIsLoadingUser] = useState(true); // For initial session check
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isPasskeySupported, setIsPasskeySupported] = useState(false); // Default to false until checked
  const [isPasskeyKitInitialized, setIsPasskeyKitInitialized] = useState(false);
  
  const passkeyKitRef = useRef<PasskeyKitType | null>(null); // Properly typed PasskeyKit instance

  useEffect(() => {
    const initializePasskeyKitAndCheckSupport = async () => {
      if (typeof window !== "undefined") {
        // First, check for WebAuthn support using @simplewebauthn/browser
        const supported = browserSupportsWebAuthn();
        setIsPasskeySupported(supported);
        
        if (supported) {
          try {
            // Dynamically import PasskeyKit only if WebAuthn is supported
            const { PasskeyKit } = await import('passkey-kit');
            
            if (!PasskeyKit) {
              console.error("PasskeyKit module was imported but PasskeyKit class is not available");
              return;
            }
            
            passkeyKitRef.current = new PasskeyKit({
              rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org:443',
              networkPassphrase: 'Test SDF Network ; September 2015',
              walletWasmHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef' // Sample hash - replace with actual hash
            });
            
            // Verify required methods for our use case
            if (!passkeyKitRef.current) {
              console.error("PasskeyKit failed to initialize");
              setIsPasskeyKitInitialized(false);
              return;
            }
            
            // Check if we can use the methods we need for our authentication
            // We'll temporarily use any type for the methods we need to check
            const kitInstance = passkeyKitRef.current as any;
            if (!kitInstance.createKey || !kitInstance.connectWallet) {
              console.error("PasskeyKit initialized but required methods are missing");
              setIsPasskeyKitInitialized(false);
              return;
            }
            
            setIsPasskeyKitInitialized(true);
            console.log("PasskeyKit initialized and WebAuthn supported.");
          } catch (error) {
            console.error("Failed to load or initialize PasskeyKit:", error);
            setIsPasskeyKitInitialized(false); // Ensure it's false on error
            // isPasskeySupported is already set based on browserSupportsWebAuthn()
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
      if (storedToken) {
        setSessionToken(storedToken);
        try {
          const headers = { 'Authorization': `Bearer ${storedToken}`, 'Content-Type': 'application/json' };
          const response = await fetch('/api/user/me', { headers });
          if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || 'Session fetch failed');
          }
          const data = await response.json();
          if (data.user) {
            setUser({ ...data.user, isLoggedIn: true });
            const balanceHeaders = { 'Authorization': `Bearer ${storedToken}` }; // No content-type for GET
            const balanceResponse = await fetch('/api/user/balance', { headers: balanceHeaders });
            if(balanceResponse.ok) {
                const balanceData: FetchedBalances = await balanceResponse.json();
                setCurrentXlmBalance(balanceData.xlmBalance);
                setUser(prev => prev ? ({...prev, platformBalanceXLM: parseFloat(balanceData.platformBalance)}) : null);
            }
          } else {
            localStorage.removeItem(SESSION_TOKEN_LOCAL_STORAGE_KEY);
            setSessionToken(null);
          }
        } catch (error) {
          console.warn("Session load error:", error);
          localStorage.removeItem(SESSION_TOKEN_LOCAL_STORAGE_KEY);
          setSessionToken(null);
          setUser(null);
        }
      }
      setIsLoadingUser(false);
    };
    loadSession();
  }, []);

  const authedFetch = async (url: string, options: RequestInit = {}) => {
    const token = sessionToken || localStorage.getItem(SESSION_TOKEN_LOCAL_STORAGE_KEY);
    if (!token && !url.includes('/api/auth/passkey/')) { // Allow auth calls without token
         // Only throw error if it's not an auth call that generates a token
        if (!url.startsWith('/api/auth/passkey/register') && !url.startsWith('/api/auth/passkey/login')){
            throw new Error("No session token available for authenticated request.");
        }
    }
    const headers: HeadersInit = {
      ...options.headers,
      'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        let errorDetails = 'Unknown error';
        try {
            const errorBody = await response.json();
            errorDetails = errorBody.error || errorBody.message || JSON.stringify(errorBody);
        } catch (e) {
            errorDetails = await response.text();
        }
        throw new Error(`API Error (${response.status}): ${errorDetails}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        const text = await response.text();
        return text ? JSON.parse(text) : {}; // Handle empty JSON response
    }
    return response.text(); 
  };

  const handleAuthSuccess = (apiUser: ApiUser, token: string, balances?: FetchedBalances) => {
    setUser({ ...apiUser, isLoggedIn: true });
    setSessionToken(token);
    localStorage.setItem(SESSION_TOKEN_LOCAL_STORAGE_KEY, token);
    if (balances) {
      setCurrentXlmBalance(balances.xlmBalance);
    } else {
      fetchBalances(token); 
    }
  };

  const registerWithPasskey = async (username: string) => {
    if (!isPasskeyKitInitialized || !passkeyKitRef.current) { // Check both state and ref
      alert("PasskeyKit is still initializing or not available. Please try again shortly.");
      return;
    }
    setIsLoading(true);
    try {
      const challengePayload: PasskeyRegistrationChallenge & { rpId: string, userId?: string } = await fetch('/api/auth/passkey/register-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      }).then(res => res.json());

      // Using PasskeyKit's createKey method for registration
      const passkeyKit = passkeyKitRef.current as any;
      const attestationResponse = await passkeyKit.createKey(username, username, {
        rpId: challengePayload.rpId
      });

      const verifyResponse = await fetch('/api/auth/passkey/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          attestationResponse: attestationResponse.rawResponse, 
          challenge: challengePayload.challenge 
        }), 
      });
      if (!verifyResponse.ok) throw new Error(await verifyResponse.text());
      const { user: registeredUser, success, token } = await verifyResponse.json(); 
      
      if (success && registeredUser && token) {
        handleAuthSuccess(registeredUser, token);
        alert(`Welcome, ${registeredUser.username}!`);
      } else {
        throw new Error('Registration failed: No user data returned or verification error.');
      }
    } catch (error: any) {
      console.error("Registration error in context:", error.message, error.stack);
      alert(`Registration Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPasskey = async (/* mockRawId?: string */) => {
    if (!isPasskeyKitInitialized || !passkeyKitRef.current) { // Check both state and ref
      alert("PasskeyKit is still initializing or not available. Please try again shortly.");
      return;
    }
    setIsLoading(true);
    try {
      // For login, PasskeyKit usually doesn't need username upfront if discoverable credentials are used
      console.log("Sending login challenge request...");
      const challengeResponse = await fetch('/api/auth/passkey/login-challenge', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}), // Empty body or could include username for non-discoverable
      });
      
      if (!challengeResponse.ok) {
        const errorText = await challengeResponse.text();
        console.error("Login challenge error:", challengeResponse.status, errorText);
        throw new Error(`Login Error: Failed to fetch challenge - ${challengeResponse.status} ${errorText}`);
      }
      
      const challengePayload = await challengeResponse.json();
      console.log("Challenge received:", challengePayload);

      try {
        // Using a simplified approach with mockCredentialId for the hackathon
        // This bypasses actual wallet connection for demo purposes
        const mockCredentialId = localStorage.getItem('last_registered_credential_id');
        
        if (!mockCredentialId) {
          // If no credential ID stored, fall back to mock one
          const mockResponse = {
            rawResponse: {
              id: "mock-credential-from-simplified-login",
              rawId: "mock-credential-from-simplified-login"
            }
          };
          
          const verifyResponse = await fetch('/api/auth/passkey/login-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              assertionResponse: mockResponse.rawResponse, 
              challenge: challengePayload.challenge 
            }),
          });
          
          if (!verifyResponse.ok) throw new Error(await verifyResponse.text());
          const data = await verifyResponse.json();
          
          if (data.success && data.user && data.token) {
            handleAuthSuccess(data.user, data.token);
            alert(`Welcome back, ${data.user.username}!`);
            return;
          } else {
            throw new Error('Login failed: User data not returned or verification error.');
          }
        } else {
          // Use the stored credential ID from registration
          const mockResponse = {
            rawResponse: {
              id: mockCredentialId,
              rawId: mockCredentialId
            }
          };
          
          const verifyResponse = await fetch('/api/auth/passkey/login-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              assertionResponse: mockResponse.rawResponse, 
              challenge: challengePayload.challenge 
            }),
          });
          
          if (!verifyResponse.ok) throw new Error(await verifyResponse.text());
          const data = await verifyResponse.json();
          
          if (data.success && data.user && data.token) {
            handleAuthSuccess(data.user, data.token);
            alert(`Welcome back, ${data.user.username}!`);
            return;
          } else {
            throw new Error('Login failed: User data not returned or verification error.');
          }
        }
      } catch (walletError) {
        console.error("Wallet connection error:", walletError);
        // Fall back to manual login for hackathon demo
        alert("Simplified login process for hackathon demo will be used.");
        
        // Prompt for username to lookup user for demo purposes
        const demoUsername = prompt("Enter username for demo login:");
        if (!demoUsername) {
          throw new Error("Username required for demo login");
        }
        
        const demoLoginResponse = await fetch('/api/auth/passkey/demo-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: demoUsername }),
        });
        
        if (!demoLoginResponse.ok) {
          throw new Error(await demoLoginResponse.text());
        }
        
        const demoData = await demoLoginResponse.json();
        if (demoData.success && demoData.user && demoData.token) {
          handleAuthSuccess(demoData.user, demoData.token);
          alert(`Demo login successful. Welcome, ${demoData.user.username}!`);
        } else {
          throw new Error('Demo login failed: User not found or other error.');
        }
      }
    } catch (error: any) {
      console.error("Login error in context:", error.message, error.stack);
      alert(`Login Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authedFetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn("Logout API call failed:", error);
    }
    setUser(null);
    setSessionToken(null);
    setCurrentXlmBalance('0.0000000');
    localStorage.removeItem(SESSION_TOKEN_LOCAL_STORAGE_KEY);
    setIsLoading(false);
    console.log('[UserContext] Logged out.');
    alert('You have been logged out.');
  };

  const fetchBalances = async (tokenOverride?: string) => {
    const token = tokenOverride || sessionToken;
    if (!token && !user) return;
    
    setIsLoading(true);
    try {
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      
      const response = await fetch('/api/user/balance', { headers });
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || 'Unknown error');
      }
      const data: FetchedBalances = await response.json();
      setCurrentXlmBalance(data.xlmBalance);
      setUser(prev => prev ? { ...prev, platformBalanceXLM: parseFloat(data.platformBalance) } : null);
    } catch (error: any) {
      console.error("Fetch balances error:", error);
      alert(`Error fetching balances: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const depositToPlatform = async (amount: number) => {
    if (!user) throw new Error("User not logged in");
    setIsLoading(true);
    try {
      const data = await authedFetch('/api/contract/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      setUser(prev => prev ? { ...prev, platformBalanceXLM: parseFloat(data.newPlatformBalance) } : null);
      setCurrentXlmBalance(data.newXlmBalance); // API returns illustrative new XLM balance
      alert('Deposit Successful!');
    } catch (error: any) { console.error(error); alert(`Deposit failed: ${error.message}`); }
    setIsLoading(false);
  };

  const withdrawFromPlatform = async (amount: number) => {
    if (!user) throw new Error("User not logged in");
    setIsLoading(true);
    try {
      const data = await authedFetch('/api/contract/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      setUser(prev => prev ? { ...prev, platformBalanceXLM: parseFloat(data.newPlatformBalance) } : null);
      setCurrentXlmBalance(data.newXlmBalance); // API returns illustrative new XLM balance
      alert('Withdrawal Successful!');
    } catch (error: any) { console.error(error); alert(`Withdrawal failed: ${error.message}`); }
    setIsLoading(false);
  };

  const subscribeToCreator = async (creatorId: string, price: number) => {
    if (!user) throw new Error("User not logged in");
    if (user.platformBalanceXLM < price) throw new Error("Insufficient platform balance.");
    setIsLoading(true);
    try {
      const data = await authedFetch('/api/contract/subscribe', {
        method: 'POST',
        body: JSON.stringify({ creatorId, price }),
      });
      setUser(prev => prev ? {
        ...prev,
        platformBalanceXLM: parseFloat(data.newPlatformBalance),
        subscriptions: prev.subscriptions.filter(s => s.creatorId !== creatorId).concat([data.subscription]),
      } : null);
      alert('Subscribed successfully!');
    } catch (error: any) { console.error(error); alert(`Subscription failed: ${error.message}`); }
    setIsLoading(false);
  };

  const tipCreator = async (creatorId: string, amount: number) => {
    if (!user) throw new Error("User not logged in");
    if (user.platformBalanceXLM < amount) throw new Error("Insufficient platform balance.");
    setIsLoading(true);
    try {
      const data = await authedFetch('/api/contract/tip', {
        method: 'POST',
        body: JSON.stringify({ creatorId, amount }),
      });
      setUser(prev => prev ? { ...prev, platformBalanceXLM: parseFloat(data.newPlatformBalance) } : null);
      alert('Tip Successful!');
    } catch (error: any) { console.error(error); alert(`Tip failed: ${error.message}`); }
    setIsLoading(false);
  };
  
  const purchaseNft = async (nftPurchaseDetails: Omit<NftData, 'id' | 'purchaseDate' | 'contractAddress' | 'tokenId'> & { id: string, price: number, creatorId: string }) => {
    if (!user) throw new Error("User not logged in");
    const { id: premiumContentId, price, creatorId: nftCreatorId, ...nftDetailsForApi } = nftPurchaseDetails;
    if (user.platformBalanceXLM < price) throw new Error("Insufficient platform balance.");
    setIsLoading(true);
    try {
      const data = await authedFetch('/api/contract/buy-nft', {
        method: 'POST',
        body: JSON.stringify({ premiumContentId, price, creatorId: nftCreatorId, nftDetailsForMinting: nftDetailsForApi }),
      });
      const newNft: NftData = data.nft;
      setUser(prev => prev ? {
        ...prev,
        platformBalanceXLM: parseFloat(data.newPlatformBalance),
        ownedNfts: prev.ownedNfts.filter(n => n.id !== newNft.id).concat([newNft]),
      } : null);
      alert('NFT Purchased successfully!');
    } catch (error: any) { console.error(error); alert(`NFT Purchase failed: ${error.message}`); }
    setIsLoading(false);
  };

  return (
    <UserContext.Provider value={{
       user, currentXlmBalance, isLoading, isLoadingUser, sessionToken, isPasskeySupported, isPasskeyKitInitialized,
       registerWithPasskey, loginWithPasskey, logout, 
       depositToPlatform, withdrawFromPlatform,
       subscribeToCreator, tipCreator, purchaseNft,
       fetchBalances 
    }}>
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