# OnlyFrens - Web3 Creator Economy Platform

A platform for creators to monetize their content using Soroban smart contracts and passkey authentication, designed to prove that Web3 UX doesn't have to suck.

**URL to Public Code Repository:** [YOUR GITHUB REPOSITORY URL HERE]

## Features

OnlyFrens aims to provide a comprehensive and user-friendly platform for content monetization:

- **Seamless Onboarding & Authentication**: Users can easily register and log in using device-native passkeys (e.g., Face ID, fingerprint scanners) powered by WebAuthn and PasskeyKit, eliminating the need for traditional passwords or complex wallet setups.
- **Direct Creator Support**: Facilitates content monetization through:
    - **Subscriptions**: Users can subscribe to creators to access exclusive content.
    - **Tipping**: Allows for direct financial appreciation of creators.
    - **NFT Purchases**: Creators can sell unique digital collectibles (NFTs) that unlock premium content or experiences.
- **Stellar-Powered Backend**:
    - **Smart Contracts**: Core logic for subscriptions, tips, and NFT management is handled by Soroban smart contracts deployed on the Stellar network.
    - **Low-Cost Transactions**: Leverages the Stellar network for efficient and affordable transactions.
- **User-Friendly Interface**:
    - **Premium Content Access**: NFT ownership seamlessly unlocks access to gated premium content (e.g., videos, articles).
    - **Integrated Balances**: Users can manage both their native Stellar XLM balance and a platform-specific balance for in-app interactions.
- **Smart Wallet Functionality**: Utilizes PasskeyKit for smart wallet management, simplifying transaction signing and potentially automating workflows.
- **Reliable Transaction Submission**: Integrates with Launchtube to ensure robust and reliable submission of transactions to the Stellar network.

## Quick Start

1.  Clone the repository: `git clone [YOUR GITHUB REPOSITORY URL HERE]`
2.  Navigate to the project directory.
3.  Install dependencies:
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```
4.  Set up your environment variables. Copy `.env.example` (create this file if it doesn't exist) to `.env` and fill in the required values.
5.  If applicable, add any necessary media files (e.g., `premium.mp4` to the `public` directory as per current project structure).
6.  Run the development server:
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
7.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

This project requires certain environment variables to be set for full functionality, especially for interacting with the Stellar network and smart contracts. Please create a `.env` file in the root of your project (you can copy from `.env.example` if provided) and include necessary configurations such as:

- Stellar network details (RPC URL, network passphrase)
- Contract IDs for deployed smart contracts
- Any API keys or service credentials if applicable

**Important**: Do not commit your `.env` file or any file containing sensitive secret keys to your public Git repository. Use an `.env.example` file to list the required variables.

## Technical Overview

### Authentication

Authentication is handled with PasskeyKit, allowing users to create and manage Stellar accounts using passkeys (WebAuthn). User data is persisted in localStorage for demonstration purposes, making the app work without a backend.

### Transactions

The platform aims for all transactional features (deposits, tips, subscriptions, NFT minting) to be fully operational on the Stellar testnet.

- **Deposits**: Users can deposit XLM into their platform balance via a smart contract interaction.
- **Platform Balance**: Stored on-chain within a platform smart contract, used for tips, subscriptions, and NFT purchases.
- **NFT Minting**: Utilizes a dedicated Soroban NFT smart contract. Interactions are facilitated through the backend API, which constructs and submits transactions via Launchtube.

### Premium Content

- The premium video content (`/premium.mp4`) is gated by NFT ownership and verified through a backend API endpoint.
- Users can only access the content if they own the corresponding NFT.

### Balances

The app clearly distinguishes between:
- **XLM Wallet Balance**: The user's native Stellar XLM balance, queried directly from the Stellar network.
- **Platform Balance**: XLM deposited by the user into the platform's smart contract, available for use within the OnlyFrens application.

### Contracts (Intended for Testnet Deployment)
- **Platform Contract ID**: `[YOUR_PLATFORM_CONTRACT_ID_HERE]` (Stellar Expert: `https://stellar.expert/contract/[YOUR_PLATFORM_CONTRACT_ID_HERE]`)
- **NFT Contract ID**: `CD5IRLBLESZ5X4PTP2IFT6GJXCR45KZJEMSXTYFF7GH2ECA276WOM4WR` (Example, update as needed) (Stellar Expert: `https://stellar.expert/contract/CD5IRLBLESZ5X4PTP2IFT6GJXCR45KZJEMSXTYFF7GH2ECA276WOM4WR`)
- **System/Treasury Account Address**: `[YOUR_SYSTEM_ACCOUNT_ADDRESS_HERE]` (e.g., GDXCCSIV6E3XYB45NCPPBR4BUJZEI3GPV2YNXF2XIQO2DVCDID76SHFG - update as needed)

### Key Configuration Values (Examples)
- `DUMMY_WALLET_WASM_HASH`: 'ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90' (Illustrative, specific to project setup)
- `RPC_URL`: 'https://soroban-testnet.stellar.org'
- `NETWORK_PASSPHRASE`: 'Test SDF Network ; September 2015'

## The Narrative "Why"

[Link to Narrative "Why" Document](./NARRATIVE_WHY.md)

## Technical Design Documentation

[Link to Technical Design Document](./TECHNICAL_DESIGN.md)

## Implemented Features (Project Scope)

*   [x] User authentication with passkeys (leveraging PasskeyKit)
*   [x] Display user's XLM balance (fetched from Stellar network)
*   [x] Display user's app balance (managed by platform smart contract)
*   [x] Deposit XLM to app balance (via smart contract interaction)
*   [x] View featured creator profile (bio, teaser content)
*   [x] Subscribe to creators (on-chain mechanism for content access)
*   [x] Tip creators (direct peer-to-peer or via platform contract)
*   [x] Purchase premium content (NFT minting via Soroban contract)
*   [x] View purchased premium content (NFT-gated access)
*   [x] Display minted NFT metadata
*   [x] User action/event timeline (derived from on-chain events or backend tracking)

## Technologies Used

*   Next.js
*   Stellar SDK ([js-stellar-sdk](https://github.com/stellar/js-stellar-sdk))
*   PasskeyKit ([https://github.com/kalepail/passkey-kit](https://github.com/kalepail/passkey-kit))
*   Launchtube ([https://github.com/stellar/launchtube](https://github.com/stellar/launchtube))
*   Soroban Smart Contracts (Rust)
*   TypeScript
*   Tailwind CSS

## Stellar Integration

*   **Launchtube:** Intended for robust submission of all user-initiated transactions to the Stellar network.

## Deployed Contract IDs (Stellar Testnet)

*   **Platform Contract:** `[YOUR_PLATFORM_CONTRACT_ID_HERE]` - ([View on Stellar Expert](https://stellar.expert/contract/[YOUR_PLATFORM_CONTRACT_ID_HERE]))
*   **NFT Contract:** `[YOUR_NFT_CONTRACT_ID_HERE_IF_DIFFERENT_OR_CONFIRMED]` - ([View on Stellar Expert](https://stellar.expert/contract/[YOUR_NFT_CONTRACT_ID_HERE_IF_DIFFERENT_OR_CONFIRMED])) 
    *   (Example NFT Contract used during development: `CD5IRLBLESZ5X4PTP2IFT6GJXCR45KZJEMSXTYFF7GH2ECA276WOM4WR`)

## Deployed Front-End

*   **Unique Repo Name:** `stellar-onlyfrens-consensus-toronto-2025` (Ensure your GitHub repo is named this)
*   **Description:** A web3 creator support platform built on Stellar, showcasing seamless UX with Passkeys and Launchtube for the Stellar Consensus Hackathon 2025.
*   **Website:** [https://developers.stellar.org/](https://developers.stellar.org/)
*   **Topics:** `stellar`, `rust`, `smart-contracts`, `consensus-toronto-2025`, `passkeys`, `nextjs`, `web3`, `creator-economy`, `blockchain`, `soroban`

## Building and Running

```bash
# Clone the repository (ensure your repository URL is correct)
git clone https://github.com/your-username/stellar-onlyfrens-consensus-toronto-2025.git 
# cd stellar-onlyfrens-consensus-toronto-2025 # Ensure this matches your repo name

# Install dependencies
npm install
# or
# yarn install
# or
# pnpm install

# Configure your environment variables by creating a .env file.
# You can use .env.example as a template if provided.

# Run the development server
npm run dev
# or
# yarn dev
# or
# pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.
Make sure your Rust environment and Soroban CLI are set up if you plan to build or deploy contracts.
