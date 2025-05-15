// contexts/WalletContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PasskeyKit } from 'passkey-kit';
// Import configuration constants directly
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';
const DUMMY_WALLET_WASM_HASH = 'ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90';
import { AssembledTransaction } from '@stellar/stellar-sdk/minimal/contract';
import { UserAction } from '@/lib/types'; // Import the correct UserAction type

// Define App Name for PasskeyKit
const APP_NAME = "OnlyFrens";

// Define the expected structure for the result of passkeyKitInstance.createKey
interface CreateKeyResult {
  rawResponse: any; // Can be refined if AuthenticatorAttestationResponseJSON is available and needed
  keyId: Buffer;
  keyIdBase64: string;
  publicKey: Buffer;
}

// Define the shape of the context data
interface WalletState {
  isLoggedIn: boolean;
  userIdentifier: string | null; // Changed from userAddress to reflect passkey ID or similar
  passkeyKitInstance: PasskeyKit | null;
  userActions: UserAction[];
  login: (username: string) => Promise<void>;
  logout: () => void;
  signTransaction: (xdr: string) => Promise<string | null>;
  addRecentAction: (action: UserAction) => void;
}

// Create the context with a default undefined value
const WalletContext = createContext<WalletState | undefined>(undefined);

// Define the props for the provider
interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userIdentifier, setUserIdentifier] = useState<string | null>(null); 
  const [passkeyKitInstance, setPasskeyKitInstance] = useState<PasskeyKit | null>(null);
  const [userActions, setUserActions] = useState<UserAction[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // First, try to load SimpleWebAuthn functions if available
        const importSimpleWebAuthn = async () => {
          try {
            const { startRegistration, startAuthentication } = await import('@simplewebauthn/browser');
            
            const kit = new PasskeyKit({
              rpcUrl: RPC_URL,
              networkPassphrase: NETWORK_PASSPHRASE,
              walletWasmHash: DUMMY_WALLET_WASM_HASH,
              timeoutInSeconds: 60, // Longer timeout for better UX
              WebAuthn: {
                startRegistration,
                startAuthentication
              }
            });
            setPasskeyKitInstance(kit);
            console.log("PasskeyKit initialized with SimpleWebAuthn");
            return;
          } catch (error) {
            console.warn("Failed to load SimpleWebAuthn, falling back to basic PasskeyKit:", error);
          }
        };

        // Try to initialize with SimpleWebAuthn first
        importSimpleWebAuthn().catch(() => {
          // Fallback to basic initialization if SimpleWebAuthn isn't available
          const kit = new PasskeyKit({
            rpcUrl: RPC_URL,
            networkPassphrase: NETWORK_PASSPHRASE,
            walletWasmHash: DUMMY_WALLET_WASM_HASH,
            timeoutInSeconds: 60, // Longer timeout for better UX
          });
          setPasskeyKitInstance(kit);
          console.log("PasskeyKit initialized with default WebAuthn");
        });
      } catch (error) {
        console.error("Error initializing PasskeyKit:", error);
        // Handle initialization error
      }
    }
  }, []);

  const login = async (username: string) => {
    if (!passkeyKitInstance) {
      console.error("PasskeyKit not initialized");
      alert("Login service not ready. Please try again shortly.");
      return;
    }
    setUserIdentifier(username);
    try {
      // Save the username to localStorage for future reference
      localStorage.setItem('last_username', username);
      
      console.log(`Creating key for ${username} with PasskeyKit`);
      const result: CreateKeyResult = await passkeyKitInstance.createKey(APP_NAME, username);
      console.log("Key creation result:", result);

      if (result.keyIdBase64) {
        // Store the keyId for future login attempts
        localStorage.setItem('passkey_key_id', result.keyIdBase64);
        
        setIsLoggedIn(true);
        
        // Add a system action for login (using a valid action type)
        addRecentAction({ 
          id: Date.now().toString(),
          type: "CONTENT_VIEW", // Use a valid action type
          description: `Logged in as ${username} (Key ID: ${result.keyIdBase64.substring(0, 10)}...)`,
          timestamp: new Date().toISOString() 
        });
        
        alert(`Hello ${username}! Your passkey is now active for this session.`);
      } else {
        console.error("Login failed: keyIdBase64 not found in createKey result");
        alert("Login failed: Could not retrieve passkey details. Please check console.");
      }
    } catch (error: any) {
      console.error("Login/Registration with Passkey failed:", error);
      let errorMessage = "Login/Registration with Passkey failed.";
      if (error && error.message) {
        errorMessage += ` Error: ${error.message}`;
      }

      // Check for common user cancellation errors from WebAuthn prompts
      const messageIncludesCancelled = typeof error?.message === 'string' && error.message.includes('cancelled');
      const messageIncludesAbortError = typeof error?.message === 'string' && error.message.includes('AbortError');

      if (
        (error && error.name === 'AbortError') || 
        messageIncludesCancelled || 
        messageIncludesAbortError || 
        (error && error.name === 'NotAllowedError')
      ) {
        errorMessage = "Passkey operation cancelled or not allowed by user.";
      }
      alert(errorMessage);
      setIsLoggedIn(false);
      setUserIdentifier(null);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserIdentifier(null);
    // Don't clear the passkey_key_id as we want to keep that for future logins
  };

  const signTransaction = async (xdr: string): Promise<string | null> => {
    if (!passkeyKitInstance || !isLoggedIn) {
      console.error("Not logged in or PasskeyKit not initialized");
      alert("Please log in first to sign transactions.");
      return null;
    }
    try {
      console.log("Attempting to sign XDR with PasskeyKit:", xdr);
      const signedResult: AssembledTransaction<any> = await passkeyKitInstance.sign(xdr);
      console.log("Transaction signed:", signedResult);
      return signedResult.toXDR();
    } catch (error: any) {
      console.error("Failed to sign transaction with PasskeyKit:", error);
      alert(`Transaction signing failed: ${error.message}`);
      return null;
    }
  };

  const addRecentAction = (action: UserAction) => {
    setUserActions(prev => [action, ...prev].slice(0, 10)); // Keep only 10 most recent actions
  };

  return (
    <WalletContext.Provider value={{ isLoggedIn, userIdentifier, passkeyKitInstance, userActions, login, logout, signTransaction, addRecentAction }}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use the WalletContext
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}; 