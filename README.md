# OnlyFrens - Web3 Creator Economy Platform

A platform for creators to monetize their content using Soroban smart contracts and passkey authentication.

## Features

- **Passkey Authentication**: Login and register without passwords using WebAuthn and PasskeyKit
- **Content Monetization**: Support creators through subscriptions, tips, and NFT purchases
- **Blockchain Integration**: Built on Stellar, using PasskeyKit for wallet management
- **Premium Content**: NFT-gated premium video content unlocked by purchase
- **Dual Balance System**: Manage both your Stellar XLM wallet and platform balances

## Real vs. Simulated Features

### Real Blockchain Features:
- **Passkey Authentication**: Creates real credentials on your device using WebAuthn
- **Wallet Addresses**: Uses real Stellar wallet addresses
- **XLM Balance**: Fetches your real XLM balance from the Stellar network
- **NFT Contract Reference**: Uses a real deployed Soroban contract

### Simulated for Hackathon:
- **Deposits**: Updates local platform balance but doesn't yet execute blockchain transactions
- **Withdrawals**: Updates local balance without blockchain transactions
- **Tips & Subscriptions**: Uses in-memory simulation
- **NFT Minting**: Backend prepares but doesn't execute contract calls

## Quick Start

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Add your premium.mp4 file to the public directory 
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

For NFT minting functionality, set the following environment variables:

```
SYSTEM_ACCOUNT_SECRET_KEY=YOUR_STELLAR_SECRET_KEY
```

## Technical Overview

### Authentication

Authentication is handled with PasskeyKit, allowing users to create and manage Stellar accounts using passkeys (WebAuthn). User data is persisted in localStorage for demonstration purposes, making the app work without a backend.

### Transactions

- **Deposits**: The app prepares a transaction to send XLM from your wallet to the system account (GDXCCSIV6E3XYB45NCPPBR4BUJZEI3GPV2YNXF2XIQO2DVCDID76SHFG), though for the hackathon this is simulated
- **Platform Balance**: Stored locally and used for tips, subscriptions, and NFT purchases
- **NFT Minting**: Uses the actual Soroban contract deployed at CD5IRLBLESZ5X4PTP2IFT6GJXCR45KZJEMSXTYFF7GH2ECA276WOM4WR through a backend API endpoint.

### Premium Content

- The premium video content (`/premium.mp4`) is gated by NFT ownership and verified through a backend API endpoint.
- Users can only access the content if they own the corresponding NFT.

### Balances

The app shows two separate balances:
- **XLM Wallet Balance**: The user's real Stellar XLM balance (queried from the network)
- **Platform Balance**: XLM deposited to the platform for use within the app (simulated in localStorage)

### Contracts

- NFT Contract: CD5IRLBLESZ5X4PTP2IFT6GJXCR45KZJEMSXTYFF7GH2ECA276WOM4WR
- System Account Address: GDXCCSIV6E3XYB45NCPPBR4BUJZEI3GPV2YNXF2XIQO2DVCDID76SHFG

### Important Config Values

- DUMMY_WALLET_WASM_HASH: 'ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90'
- RPC_URL: 'https://soroban-testnet.stellar.org'
- NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015'

## The Narrative "Why"

[Link to Narrative "Why" Document](./NARRATIVE_WHY.md)

## Technical Design Documentation

[Link to Technical Design Document](./TECHNICAL_DESIGN.md)

## Implemented Features

*   [ ] User authentication with passkeys
*   [ ] Display user's XLM balance
*   [ ] Display user's app balance (from platform contract)
*   [ ] Deposit XLM to app balance
*   [ ] View featured creator profile (bio, teaser video)
*   [ ] Subscribe to creators (timeline access)
*   [ ] Tip creators
*   [ ] Purchase premium content (NFT minting)
*   [ ] View purchased premium content
*   [ ] Display minted NFT metadata
*   [ ] User action/event timeline

## Technologies Used

*   Next.js
*   Stellar SDK (js-stellar-sdk)
*   PasskeyKit ([https://github.com/kalepail/passkey-kit](https://github.com/kalepail/passkey-kit))
*   Launchtube ([https://github.com/stellar/launchtube](https://github.com/stellar/launchtube))
*   Soroban Smart Contracts (Rust)

## Stellar Integration

*   **Stellar SDK:** [https://github.com/stellar/js-stellar-sdk](https://github.com/stellar/js-stellar-sdk)
*   **Passkeys:** Implemented via PasskeyKit for seamless authentication and transaction signing.
*   **Launchtube:** Used for submitting transactions to the Stellar network.

## Deployed Contract IDs (Testnet)

*   Platform Contract: [Link to Stellar Expert]
*   NFT Contract: [Link to Stellar Expert]

## Deployed Front-End

*   [Link to deployed application (Optional)]

## Repository Information

*   **Unique Repo Name:** stellar-onlyfrens-consensus-toronto-2025
*   **Description:** A web3 creator support platform using Stellar, Passkeys, and Launchtube for the Consensus Toronto 2025 Hackathon.
*   **Website:** [https://developers.stellar.org/](https://developers.stellar.org/)
*   **Topics:** `stellar`, `rust`, `smart-contracts`, `consensus-toronto-2025`, `passkeys`, `nextjs`

## Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd stellar-onlyfrens-consensus-toronto-2025

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Run the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```
