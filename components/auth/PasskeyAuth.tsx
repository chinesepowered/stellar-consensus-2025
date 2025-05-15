'use client';

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';

// Mock PasskeyKit object can be removed if actual calls are only in context (or context also mocks them)
// const mockPasskeyKit = { ... }; 

// User interface can be removed as context provides user state
// interface User { ... }

interface PasskeyAuthProps {
  // These props might be removed if UI reacts to context changes directly
  // onLoginSuccess?: (user: any) => void; 
  // onRegisterSuccess?: (user: any) => void;
  // Example: Could have a prop to close a modal if this component is in one
  onAuthComplete?: () => void; 
}

const PasskeyAuth: React.FC<PasskeyAuthProps> = ({ onAuthComplete }) => {
  const { registerWithPasskey, loginWithPasskey, isLoading, user } = useUser();
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');

  // If user is already logged in (e.g. component shown by mistake), maybe redirect or show message
  // useEffect(() => {
  //   if (user && user.isLoggedIn && onAuthComplete) {
  //     onAuthComplete(); 
  //   }
  // }, [user, onAuthComplete]);

  const handleRegister = async () => {
    if (!username.trim()) {
      setError('Please enter a username to register.');
      return;
    }
    setError(null);
    try {
      await registerWithPasskey(username);
      // Success is handled by context updating state and redirecting or UI changing based on context state
      // If onAuthComplete is provided (e.g. for closing a modal), call it.
      if (onAuthComplete) onAuthComplete();
    } catch (err: any) {
      // Context methods should ideally handle their own errors and alert users.
      // This catch is a fallback or for UI-specific errors here.
      setError(err.message || 'An unknown error occurred during registration.');
    }
  };

  const handleLogin = async () => {
    setError(null);
    try {
      // For mock login in UserContext, we might need to pass a mock rawId if the user is known
      // For a real PasskeyKit flow, it would discover credentials or use a provided one.
      // If your UserContext.loginWithPasskey() can take an optional mock credentialId for testing:
      // await loginWithPasskey('mock-cred-id-for-RotiFan99'); // Example for testing a specific user
      await loginWithPasskey(); // General login attempt
      
      if (onAuthComplete) onAuthComplete();
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during login.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-sm mx-auto my-8 ring-1 ring-gray-200">
      <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">OnlyFrens Access</h2>
      
      {user && user.isLoggedIn ? (
        <div className="text-center">
            <p className="text-green-600">You are already logged in as {user.username}.</p>
            {onAuthComplete && <button onClick={onAuthComplete} className="mt-4 text-indigo-600 hover:text-indigo-800">Close</button> }
        </div>
      ) : (
        <>
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-600 mb-2">New Creator/Supporter?</h3>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Choose a username" 
              className="w-full p-2 border border-gray-300 rounded mb-3 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
            <button 
              onClick={handleRegister} 
              disabled={isLoading || !username.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Register with Passkey'}
            </button>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Already have an account?</h3>
            <button 
              onClick={handleLogin} 
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Login with Passkey'}
            </button>
          </div>
        </>
      )}

      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
      
      {/* Mock PasskeyKit.isSupported() check - In a real app, this might be in context or a utility */}
      {/* For now, assuming it's always supported for mock flow */}
      {/* {!mockPasskeyKit.isSupported() && ( ... )} */}
    </div>
  );
};

export default PasskeyAuth; 