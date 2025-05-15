import React from 'react';
import Link from 'next/link';
import { useWallet } from '../contexts/WalletContext';

const Navbar = () => {
  const { isLoggedIn, userAddress, login, logout } = useWallet();

  const handleLogin = async () => {
    // You might want to prompt for a username if your PasskeyKit setup requires it for `createPasskey`
    // const username = prompt("Enter a username for passkey (can be anything for this demo):");
    // if (username) {
    //   await login(username);
    // }
    await login(); // Simplified login call, assumes defaultUser or no username needed for demo
  };

  return (
    <nav style={navStyles}>
      <div style={navBrandStyles}>
        <Link href="/" style={linkStyles}>OnlyFrens</Link>
      </div>
      <div style={navLinksStyles}>
        {isLoggedIn && userAddress && (
          <Link href="/profile" style={linkStyles}>My Profile</Link>
        )}
        {isLoggedIn ? (
          <div style={userInfoStyles}>
            <span style={userAddressStyles}>{`Logged in: ${userAddress ? `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}` : 'N/A'}`}</span>
            <button onClick={logout} style={buttonStyles}>Logout</button>
          </div>
        ) : (
          <button onClick={handleLogin} style={buttonStyles}>Login with Passkey</button>
        )}
      </div>
    </nav>
  );
};

// Basic inline styles for simplicity in a hackathon
const navStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem 2rem',
  backgroundColor: '#fff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginBottom: '20px',
};

const navBrandStyles: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
};

const linkStyles: React.CSSProperties = {
  textDecoration: 'none',
  color: '#0070f3',
  marginRight: '1rem',
};

const navLinksStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const userInfoStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const userAddressStyles: React.CSSProperties = {
  marginRight: '1rem',
  fontSize: '0.9rem',
  color: '#555',
};

const buttonStyles: React.CSSProperties = {
  padding: '0.5rem 1rem',
  backgroundColor: '#0070f3',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '0.9rem',
};

export default Navbar; 