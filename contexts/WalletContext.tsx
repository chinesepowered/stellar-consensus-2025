// contexts/WalletContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PasskeyKit } from 'passkey-kit';
import { UserAction, RPC_URL, NETWORK_PASSPHRASE, DUMMY_WALLET_WASM_HASH } from '../lib/data';

// Define the shape of the context data
interface WalletState {
  isLoggedIn: boolean;
  userAddress: string | null;
  passkeyKitInstance: PasskeyKit | null;
  userActions: UserAction[];
  login: (username?: string) => Promise<void>;
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
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [passkeyKitInstance, setPasskeyKitInstance] = useState<PasskeyKit | null>(null);
  const [userActions, setUserActions] = useState<UserAction[]>([]);

  useEffect(() => {
    const kit = new PasskeyKit({
      rpcUrl: RPC_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      walletWasmHash: DUMMY_WALLET_WASM_HASH,
    });
    setPasskeyKitInstance(kit);
  }, []);

  const login = async (username: string = 'defaultUser') => {
    if (!passkeyKitInstance) {
      console.error("PasskeyKit not initialized");
      return;
    }
    try {
      console.log(`Simulating passkey creation/authentication for user: ${username}`);
      const simulatedPk = "G_DUMMY_LOGGED_IN_USER_ADDRESS";
      
      if (simulatedPk) {
        setUserAddress(simulatedPk);
        setIsLoggedIn(true);
        addRecentAction({
          id: Date.now().toString(),
          type: "Login",
          timestamp: new Date().toISOString(),
          details: `User ${username} logged in successfully.`
        });
        console.log(`User ${username} logged in, address:`, simulatedPk);
      } else {
        console.warn("Login attempt: Simulated public key retrieval failed.");
        setIsLoggedIn(false);
        setUserAddress(null);
      }

    } catch (error) {
      console.error("Login failed:", error);
      setIsLoggedIn(false);
      setUserAddress(null);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserAddress(null);
    addRecentAction({
        id: Date.now().toString(),
        type: "Logout",
        timestamp: new Date().toISOString(),
        details: "User logged out."
      });
    console.log("User logged out");
  };

  const signTransaction = async (xdr: string): Promise<string | null> => {
    if (!passkeyKitInstance || !isLoggedIn) {
      console.error("Cannot sign transaction: User not logged in or PasskeyKit not initialized.");
      return null;
    }
    try {
      console.log("Attempting to sign XDR:", xdr);
      const signedTransactionResult = await passkeyKitInstance.sign(xdr);
      
      if (signedTransactionResult && typeof (signedTransactionResult as any).xdr === 'string') {
        const signedXdrString = (signedTransactionResult as any).xdr as string;
        console.log("Transaction signed, XDR:", signedXdrString);
        return signedXdrString;
      } else {
        if (typeof signedTransactionResult === 'string') {
            console.log("Transaction signed, (raw string result):", signedTransactionResult);
            return signedTransactionResult;
        }
        console.error("Signed transaction result does not contain a valid XDR string.", signedTransactionResult);
        return null;
      }
    } catch (error) {
      console.error("Failed to sign transaction:", error);
      return null;
    }
  };

  const addRecentAction = (action: UserAction) => {
    setUserActions(prevActions => [action, ...prevActions.slice(0, 9)]);
  };

  return (
    <WalletContext.Provider value={{ isLoggedIn, userAddress, passkeyKitInstance, userActions, login, logout, signTransaction, addRecentAction }}>
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