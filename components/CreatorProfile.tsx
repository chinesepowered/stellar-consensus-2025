import React, { useState } from 'react';
import { Creator, DUMMY_SUBSCRIPTION_CONTRACT_ID, DUMMY_TIPJAR_CONTRACT_ID, DUMMY_NFT_MINT_CONTRACT_ID, LAUNCHTUBE_URL } from '../lib/data';
import { useWallet } from '../contexts/WalletContext';
import { StellarSDK } from '../lib/stellar-sdk'; // We'll create this utility file

interface CreatorProfileProps {
  creator: Creator;
}

const CreatorProfile = ({ creator }: CreatorProfileProps) => {
  const { isLoggedIn, userAddress, signTransaction, addRecentAction } = useWallet();
  const [isSubscribed, setIsSubscribed] = useState(false); // Mock subscription state
  const [purchasedNft, setPurchasedNft] = useState<any | null>(null); // Mock NFT purchase state
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!isLoggedIn || !userAddress) {
      alert('Please log in to subscribe.');
      return;
    }
    setIsLoading(true);
    console.log(`Attempting to subscribe to ${creator.username} with contract ${DUMMY_SUBSCRIPTION_CONTRACT_ID}`);
    try {
      // 1. Construct the transaction XDR for the subscribe contract call
      // This is highly dependent on the actual Soroban contract's interface
      // For demo: StellarSDK.createSubscriptionTx(userAddress, DUMMY_SUBSCRIPTION_CONTRACT_ID, creator.id);
      const transactionXDR = await StellarSDK.createDummyTransaction(
        userAddress, 
        DUMMY_SUBSCRIPTION_CONTRACT_ID, 
        'subscribe', 
        [{type: 'address', value: userAddress}, {type: 'string', value: creator.id}]
      );

      if (!transactionXDR) {
        throw new Error("Failed to create transaction XDR for subscription.");
      }

      // 2. Sign the transaction using PasskeyKit via WalletContext
      const signedXDR = await signTransaction(transactionXDR);
      if (!signedXDR) {
        throw new Error('Failed to sign subscription transaction.');
      }

      // 3. Submit to Launchtube (via a backend API route for security of Launchtube JWT)
      const response = await fetch('/api/submit-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xdr: signedXDR }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Subscription transaction failed on Launchtube.');
      }

      console.log('Subscription successful:', result);
      setIsSubscribed(true);
      addRecentAction({ 
        id: Date.now().toString(), 
        type: 'Subscription', 
        timestamp: new Date().toISOString(), 
        details: `Subscribed to ${creator.username}. Tx: ${result.hash ? result.hash.substring(0,10)+ '...' : 'N/A'}` 
      });
      alert('Subscription successful!');
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(`Subscription failed: ${error.message}`);
    }
    setIsLoading(false);
  };

  const handleTip = async (amount: string) => {
    if (!isLoggedIn || !userAddress) {
      alert('Please log in to tip.');
      return;
    }
    setIsLoading(true);
    console.log(`Attempting to tip ${creator.username} ${amount} XLM with contract ${DUMMY_TIPJAR_CONTRACT_ID}`);
    try {
      const transactionXDR = await StellarSDK.createDummyTransaction(
        userAddress, 
        DUMMY_TIPJAR_CONTRACT_ID, 
        'tip',
        [{type: 'address', value: creator.id}, {type: 'stroopAmount', value: StellarSDK.xlmToStroops(amount)}]
        // Assuming contract takes creator address and amount
      );

      if (!transactionXDR) throw new Error("Failed to create tip transaction XDR.");
      const signedXDR = await signTransaction(transactionXDR);
      if (!signedXDR) throw new Error('Failed to sign tip transaction.');

      const response = await fetch('/api/submit-transaction', { /* ... as above ... */ 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xdr: signedXDR }),
      });
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Tip transaction failed.');

      console.log('Tip successful:', result);
      addRecentAction({ 
        id: Date.now().toString(), 
        type: 'Tip', 
        timestamp: new Date().toISOString(), 
        details: `Tipped ${amount} XLM to ${creator.username}. Tx: ${result.hash ? result.hash.substring(0,10)+ '...' : 'N/A'}` 
      });
      alert('Tip successful!');
    } catch (error: any) {
      console.error('Tip error:', error);
      alert(`Tip failed: ${error.message}`);
    }
    setIsLoading(false);
  };

  const handleBuyNft = async () => {
    if (!isLoggedIn || !userAddress) {
      alert('Please log in to buy NFT.');
      return;
    }
    setIsLoading(true);
    console.log(`Attempting to buy NFT from ${creator.username} with contract ${DUMMY_NFT_MINT_CONTRACT_ID}`);
    try {
      const transactionXDR = await StellarSDK.createDummyTransaction(
        userAddress,
        DUMMY_NFT_MINT_CONTRACT_ID, 
        'mint_to',
        [{type: 'address', value: userAddress}] // Assuming contract takes recipient address
      );

      if (!transactionXDR) throw new Error("Failed to create NFT mint transaction XDR.");
      const signedXDR = await signTransaction(transactionXDR);
      if (!signedXDR) throw new Error('Failed to sign NFT mint transaction.');
      
      const response = await fetch('/api/submit-transaction', { /* ... as above ... */ 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xdr: signedXDR }),
      });
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'NFT mint transaction failed.');

      console.log('NFT Mint successful:', result);
      // Simulate receiving NFT metadata - in real app, this might come from tx result or an API call
      setPurchasedNft({
        name: creator.premiumContent.nftName,
        description: creator.premiumContent.nftDescription,
        imageUrl: creator.premiumContent.nftImageUrl,
        transactionHash: result.hash || 'N/A',
      });
      addRecentAction({ 
        id: Date.now().toString(), 
        type: 'NFT Mint', 
        timestamp: new Date().toISOString(), 
        details: `Purchased NFT: ${creator.premiumContent.nftName}. Tx: ${result.hash ? result.hash.substring(0,10)+ '...' : 'N/A'}` 
      });
      alert('NFT Purchase successful!');
    } catch (error: any) {
      console.error('NFT buy error:', error);
      alert(`NFT Purchase failed: ${error.message}`);
    }
    setIsLoading(false);
  };

  return (
    <div style={styles.profileContainer}>
      <div style={styles.header}>
        <img src={creator.avatarUrl} alt={creator.username} style={styles.avatar} />
        <div>
          <h1 style={styles.username}>{creator.username}</h1>
          <p style={styles.bio}>{creator.bio}</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Teaser Video</h2>
        {creator.teaserVideoUrl ? (
          <video controls src={creator.teaserVideoUrl} style={styles.videoPlayer} />
        ) : <p>No teaser video available.</p>}
      </div>

      {isLoggedIn && (
        <div style={styles.actionsSection}>
          {!isSubscribed ? (
            <button onClick={handleSubscribe} disabled={isLoading} style={styles.actionButton}>
              {isLoading ? 'Subscribing...' : 'Subscribe'}
            </button>
          ) : (
            <p style={styles.subscribedMessage}>You are subscribed!</p>
          )}
          <button onClick={() => handleTip('5')} disabled={isLoading} style={{...styles.actionButton, ...styles.tipButton}}>
            {isLoading ? 'Tipping...' : 'Tip 5 XLM'}
          </button>
          {!purchasedNft && (
            <button onClick={handleBuyNft} disabled={isLoading} style={{...styles.actionButton, ...styles.buyNftButton}}>
              {isLoading ? 'Purchasing...' : 'Buy Premium NFT'}
            </button>
          )}
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Timeline</h2>
        {(isLoggedIn && isSubscribed) || creator.id === 'roti_lady30' /* Public for featured */ ? (
          creator.timeline.length > 0 ? (
            creator.timeline.map(item => (
              <div key={item.id} style={styles.timelineItem}>
                {item.type === 'image' && <img src={item.content} alt="Timeline image" style={styles.timelineImage} />}
                {item.type === 'text' && <p>{item.content}</p>}
                <small style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</small>
              </div>
            ))
          ) : <p>No timeline posts yet.</p>
        ) : (
          <p>Subscribe to view the creator's timeline.</p>
        )}
      </div>

      {purchasedNft && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Your Premium Content Unlocked!</h2>
          <h3>{purchasedNft.name}</h3>
          <p>{purchasedNft.description}</p>
          <img src={purchasedNft.imageUrl} alt={purchasedNft.name} style={styles.nftImage} />
          <p>Transaction: {purchasedNft.transactionHash}</p>
          {creator.premiumContent.type === 'video' && (
            <video controls src={creator.premiumContent.contentUrl} style={styles.videoPlayer} />
          )}
          {/* Add other premium content types if necessary */}
        </div>
      )}
    </div>
  );
};

// Basic inline styles
const styles = {
  profileContainer: { padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' } as React.CSSProperties,
  header: { display: 'flex', alignItems: 'center', marginBottom: '20px' } as React.CSSProperties,
  avatar: { width: '100px', height: '100px', borderRadius: '50%', marginRight: '20px' } as React.CSSProperties,
  username: { margin: '0 0 5px 0', fontSize: '2rem' } as React.CSSProperties,
  bio: { margin: 0, color: '#555' } as React.CSSProperties,
  section: { marginBottom: '30px' } as React.CSSProperties,
  sectionTitle: { fontSize: '1.5rem', marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' } as React.CSSProperties,
  videoPlayer: { width: '100%', maxWidth: '600px', borderRadius: '8px' } as React.CSSProperties,
  actionsSection: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'} as React.CSSProperties,
  actionButton: { padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', border: 'none', borderRadius: '5px', backgroundColor: '#0070f3', color: 'white' } as React.CSSProperties,
  tipButton: { backgroundColor: '#28a745' } as React.CSSProperties,
  buyNftButton: { backgroundColor: '#ffc107', color: '#333' } as React.CSSProperties,
  subscribedMessage: { color: 'green', fontWeight: 'bold' } as React.CSSProperties,
  timelineItem: { marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #f0f0f0' } as React.CSSProperties,
  timelineImage: { maxWidth: '100%', borderRadius: '8px', marginBottom: '5px' } as React.CSSProperties,
  timestamp: { fontSize: '0.8rem', color: '#777' } as React.CSSProperties,
  nftImage: { maxWidth: '300px', borderRadius: '8px', marginTop: '10px', marginBottom: '10px' } as React.CSSProperties,
};

export default CreatorProfile; 