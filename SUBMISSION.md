# OnlyFrens - Stellar Hackathon Submission

## Project Overview

OnlyFrens is a web3 platform designed to support uplifting creators, allowing users to subscribe, tip, and purchase exclusive content via NFTs. It aims to provide a seamless web2-like user experience by leveraging Stellar's passkey technology.

## Key Features

1. **Passkey Authentication**: Users can create accounts and log in using their device's biometrics through WebAuthn, with wallet keys securely stored for persistent sessions
   
2. **Creator Support**: Users can support creators through:
   - Monthly subscriptions to access exclusive content
   - One-time tips of various amounts
   - Purchasing NFTs that unlock premium content
   
3. **Web3 Integration**: Built on Stellar Soroban with PasskeyKit for wallet management

## Technical Implementation

- **Frontend**: Next.js with TailwindCSS
- **Authentication**: PasskeyKit for Stellar wallet creation and management
- **Data Storage**: Client-side storage for the hackathon demo
- **Smart Contracts**: Soroban contracts for NFT minting and access control

## Hackathon Adaptations

For the hackathon demo, we've implemented the following:

1. **Client-side Authentication**: All authentication happens on the client side using PasskeyKit, eliminating backend dependency
2. **Wallet Persistence**: User wallet info is saved in localStorage, allowing users to stay logged in between sessions
3. **Simplified Transactions**: Regular transactions like tips and subscriptions are mocked in-memory
4. **Real NFT Integration**: NFT minting uses the real Soroban contract deployed at CD5IRLBLESZ5X4PTP2IFT6GJXCR45KZJEMSXTYFF7GH2ECA276WOM4WR

## Setup Instructions

1. Clone the repository
2. Run `npm install`
3. Create a `.env.local` file with your Stellar testnet account:
   ```
   NEXT_PUBLIC_SYSTEM_ACCOUNT_SECRET_KEY=YOUR_SECRET_KEY
   ```
4. Run `npm run dev`

## Team

OnlyFrens was created by the Consensus team for the Stellar Soroban Hackathon 2024. 