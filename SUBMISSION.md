# OnlyFrens - Stellar Hackathon Submission

## Project Overview

OnlyFrens is a web3 platform designed to support uplifting creators, allowing users to subscribe, tip, and purchase exclusive content via NFTs. It aims to provide a seamless web2-like user experience by leveraging Stellar's passkey technology.

## Key Features

1. **Passkey Authentication**: Users can create accounts and log in using their device's biometrics through WebAuthn, with wallet keys securely stored for persistent sessions
   
2. **Creator Support**: Users can support creators through:
   - Monthly subscriptions to access exclusive timeline updates
   - One-time tips of various amounts
   - Purchasing NFTs that unlock premium video content
   
3. **Web3 Integration**: Built on Stellar Soroban with PasskeyKit for wallet management

4. **Dual Balance System**:
   - Real Stellar XLM wallet balance (fetched from the network)
   - Platform XLM balance (for in-app transactions)

5. **NFT-Gated Premium Content**: Access to premium video content (`/premium.mp4`) is controlled through NFT ownership verification

## Real vs. Simulated Features

### Real Blockchain Features:
- **Authentication**: PasskeyKit integration creates real WebAuthn credentials
- **Wallet Addresses**: Real Stellar wallet addresses are used
- **XLM Balance**: The app fetches real user balances from the Stellar network
- **Smart Contract**: A real Soroban NFT contract is deployed and referenced

### Simulated Features:
- **Deposits**: The app prepares the transaction structure but doesn't execute it
- **Platform Balance**: Stored locally in localStorage
- **Tips & Subscriptions**: In-memory simulation with local balance updates
- **NFT Minting**: Backend API endpoint simulates the contract call

## Technical Implementation

- **Frontend**: Next.js with TailwindCSS
- **Authentication**: PasskeyKit for Stellar wallet creation and management
- **Data Storage**: Client-side storage for the hackathon demo
- **Smart Contracts**: Soroban contracts for NFT minting and access control
- **Backend API**: Minimal backend API endpoints to handle NFT minting and ownership verification

## System Design

1. **Authentication Flow**:
   - User creates a passkey → PasskeyKit creates Stellar wallet credentials
   - Wallet balance is fetched from Stellar network
   - Session persistence allows users to stay logged in

2. **Transaction Flow**:
   - Deposits: User's XLM would go to the system account (GDXCCSIV6E3XYB45NCPPBR4BUJZEI3GPV2YNXF2XIQO2DVCDID76SHFG)
   - Platform balance is used for content purchases and creator support
   - NFT purchases go through a backend endpoint that would interact with the contract

## Setup Instructions

1. Clone the repository
2. Run `npm install`
3. Add your premium.mp4 file to the public directory
4. Create a `.env.local` file with your Stellar testnet account:
   ```
   SYSTEM_ACCOUNT_SECRET_KEY=YOUR_SECRET_KEY
   ```
5. Run `npm run dev`

## Team

OnlyFrens was created by the Consensus team for the Stellar Soroban Hackathon 2024. 