// contexts/WalletContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PasskeyKit } from 'passkey-kit';
import { UserAction, RPC_URL, NETWORK_PASSPHRASE, DUMMY_WALLET_WASM_HASH } from '../lib/data';
import { AssembledTransaction } from '@stellar/stellar-sdk/minimal/contract';

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
        const kit = new PasskeyKit({
          rpcUrl: RPC_URL,
          networkPassphrase: NETWORK_PASSPHRASE,
          walletWasmHash: DUMMY_WALLET_WASM_HASH,
        });
        setPasskeyKitInstance(kit);
        console.log("PasskeyKit initialized");
      } catch (error) {
        console.error("Error initializing PasskeyKit:", error);
        // Handle initialization error, e.g. by setting a state that disables passkey functionality
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
      const result: CreateKeyResult = await passkeyKitInstance.createKey(APP_NAME, username);
      console.log("Key creation result:", result);

      if (result.keyIdBase64) {
        setIsLoggedIn(true);
        addRecentAction({ 
          id: Date.now().toString(),
          type: "Login",
          details: `Logged in as ${username} (Key ID: ${result.keyIdBase64.substring(0, 10)}...)`,
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
    // const loggedOutUsername = username || 'User'; // username state was removed for simplicity for now
    setIsLoggedIn(false);
    setUserIdentifier(null); 
    addRecentAction({
        id: Date.now().toString(),
        type: "Logout",
        timestamp: new Date().toISOString(),
        details: `User logged out.`
      });
    console.log(`User logged out`);
    alert("You have been logged out.");
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
    setUserActions(prevActions => [action, ...prevActions.slice(0, 9)]);
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