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
  const [isRegistering, setIsRegistering] = useState(false);

  // If user is already logged in (e.g. component shown by mistake), maybe redirect or show message
  // useEffect(() => {
  //   if (user && user.isLoggedIn && onAuthComplete) {
  //     onAuthComplete(); 
  //   }
  // }, [user, onAuthComplete]);

  if (user && user.isLoggedIn) {
    return (
      <div className="text-center p-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-600 font-medium text-lg">You are already logged in</p>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user.username}</p>
        {onAuthComplete && (
          <button 
            onClick={onAuthComplete} 
            className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md font-medium transition"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const handleRegister = async () => {
    if (!username.trim()) {
      setError('Please enter a username to register.');
      return;
    }
    setError(null);
    try {
      await registerWithPasskey(username);
      if (onAuthComplete) onAuthComplete();
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during registration.');
    }
  };

  const handleLogin = async () => {
    setError(null);
    try {
      await loginWithPasskey();
      if (onAuthComplete) onAuthComplete();
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during login.');
    }
  };

  return (
    <div className="flex flex-col">
      {isRegistering ? (
        <div>
          <div className="mb-6 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Create Your Account</h3>
            <p className="text-gray-500 text-sm mt-1">Choose a username to get started with passkey authentication</p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex space-x-3 mb-3">
            <button
              onClick={handleRegister}
              disabled={isLoading || !username.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                  Register with Passkey
                </>
              )}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <button
              onClick={() => setIsRegistering(false)}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Welcome Back</h3>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account with your passkey</p>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center mb-4"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
                Login with Passkey
              </>
            )}
          </button>
          
          <div className="text-center">
            <button
              onClick={() => setIsRegistering(true)}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              New user? Create an account
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="ml-2 text-xs text-gray-500">
            Passkeys let you sign in without passwords. Your device will verify it's you.
          </span>
        </div>
      </div>
    </div>
  );
};

export default PasskeyAuth; 