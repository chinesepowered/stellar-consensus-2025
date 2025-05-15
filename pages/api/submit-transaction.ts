// pages/api/submit-transaction.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { LAUNCHTUBE_URL } from '../../lib/data';

// This would be your private Launchtube JWT. Store it securely in environment variables.
const LAUNCHTUBE_JWT = process.env.LAUNCHTUBE_JWT || 'YOUR_PRIVATE_LAUNCHTUBE_JWT_HERE';

if (LAUNCHTUBE_JWT === 'YOUR_PRIVATE_LAUNCHTUBE_JWT_HERE' && process.env.NODE_ENV === 'production') {
  console.warn("CRITICAL: Launchtube JWT is not set or is using the placeholder value in a production environment!");
}

interface SubmitTransactionResponse {
  hash?: string;
  error?: string;
  detail?: string; // For more detailed errors from Launchtube
  status?: string; // e.g., PENDING, SUCCESS, ERROR
  title?: string; // Error title from Launchtube
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmitTransactionResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { xdr } = req.body;

  if (!xdr || typeof xdr !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid XDR in request body' });
  }

  if (!LAUNCHTUBE_JWT || LAUNCHTUBE_JWT === 'YOUR_PRIVATE_LAUNCHTUBE_JWT_HERE') {
    console.error("Launchtube JWT is not configured. Cannot submit transaction.");
    return res.status(500).json({ error: 'Server configuration error: Launchtube JWT missing.'});
  }

  try {
    console.log(`Submitting XDR to Launchtube: ${xdr.substring(0, 50)}...`);

    const launchtubeBody = {
      is_simulation: false, // We are submitting an actual transaction
      is_blocking: true,    // Wait for the transaction to be included in a ledger (or timeout)
      signed_envelope_xdr_base64: xdr,
      // network_passphrase: NETWORK_PASSPHRASE, // Launchtube usually knows this based on its config for testnet/mainnet endpoint
    };

    const response = await fetch(`${LAUNCHTUBE_URL}/submit`, { // Assuming /submit is the correct endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LAUNCHTUBE_JWT}`,
      },
      body: JSON.stringify(launchtubeBody),
    });

    const responseBodyText = await response.text();
    let responseData: SubmitTransactionResponse;

    try {
        responseData = JSON.parse(responseBodyText);
    } catch (e) {
        // If Launchtube returns non-JSON error (e.g. plain text or HTML for 500s)
        console.error("Launchtube returned non-JSON response:", responseBodyText);
        return res.status(response.status || 500).json({ 
            error: 'Launchtube submission failed with non-JSON response.', 
            detail: responseBodyText.substring(0, 500) // Include a snippet of the error
        });
    }

    if (!response.ok) {
      console.error('Launchtube submission failed:', responseData);
      // Try to return a more specific error message from Launchtube if available
      const errorMessage = responseData.detail || responseData.error || responseData.title || 'Launchtube submission failed.';
      return res.status(response.status || 500).json({ error: errorMessage, ...responseData });
    }

    // Launchtube successful response structure might vary.
    // Based on the GitHub README for Launchtube, a successful submission might return something like:
    // { "Tx": "transaction_hash", "Sub": "submission_token_sub_claim" }
    // Or for blocking: { "hash": "...", "status": "SUCCESS", ... }
    // We will assume it includes at least a `hash` and `status` for blocking calls.
    console.log('Launchtube submission successful:', responseData);
    return res.status(200).json({
        hash: responseData.hash, 
        status: responseData.status,
        // Include any other relevant fields from responseData
    });

  } catch (error: any) {
    console.error('Error submitting transaction to Launchtube:', error);
    return res.status(500).json({ error: 'Internal server error while submitting transaction.', detail: error.message });
  }
} 