import React from 'react';
import Layout from '../components/Layout';
import { useWallet } from '../contexts/WalletContext';
import { useRouter } from 'next/router';

const UserProfilePage = () => {
  const { isLoggedIn, userAddress, userActions } = useWallet();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoggedIn) {
      router.push('/'); // Redirect to home if not logged in
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn || !userAddress) {
    // This will be briefly shown before redirect or if redirect fails
    return <Layout title="Profile"><p>Loading profile or redirecting...</p></Layout>;
  }

  return (
    <Layout title={`My Profile - ${userAddress.substring(0, 8)}...`}>
      <div style={styles.profileContainer}>
        <h1 style={styles.header}>My Profile</h1>
        <p style={styles.address}><strong>Wallet Address:</strong> {userAddress}</p>

        <div style={styles.actionsSection}>
          <h2 style={styles.sectionTitle}>My Recent Activity</h2>
          {userActions.length > 0 ? (
            <ul style={styles.actionList}>
              {userActions.map(action => (
                <li key={action.id} style={styles.actionItem}>
                  <strong style={styles.actionType}>{action.type}</strong>
                  <p style={styles.actionDetails}>{action.details}</p>
                  <small style={styles.timestamp}>{new Date(action.timestamp).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recent activity to display.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

const styles = {
  profileContainer: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  header: {
    fontSize: '2rem',
    marginBottom: '20px',
    color: '#333',
  } as React.CSSProperties,
  address: {
    fontSize: '1rem',
    color: '#555',
    marginBottom: '30px',
    wordBreak: 'break-all' as 'break-all',
  } as React.CSSProperties,
  actionsSection: {
    marginTop: '30px',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1.5rem',
    marginBottom: '15px',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
    color: '#444',
  } as React.CSSProperties,
  actionList: {
    listStyleType: 'none',
    padding: 0,
  } as React.CSSProperties,
  actionItem: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: '5px',
    padding: '15px',
    marginBottom: '10px',
  } as React.CSSProperties,
  actionType: {
    display: 'block',
    fontSize: '1.1rem',
    color: '#0070f3',
    marginBottom: '5px',
  } as React.CSSProperties,
  actionDetails: {
    margin: '0 0 5px 0',
    color: '#333',
  } as React.CSSProperties,
  timestamp: {
    fontSize: '0.8rem',
    color: '#777',
  } as React.CSSProperties,
};

export default UserProfilePage; 