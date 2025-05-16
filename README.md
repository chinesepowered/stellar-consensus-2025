# OnlyFrens - Web3 Creator Economy Platform

A platform for creators to monetize their content using Soroban smart contracts and passkey authentication, designed to prove that Web3 UX doesn't have to suck.

## UX Features

Users use passkey to authenticate, which creates a Stellar wallet for them. They can then fund that wallet traditionally through anchors, credit cards, or through crypto (this part isn't implemented yet since uh no money and on testnet).

Similar to current Web2 video streaming sites, their actions are now super fast since done off-chain.

### Onchain:
-premium content are gated by NFT
-payment rails (for deposit and withdraw) are done

### Offchain:
-content serving (backend with CDN)
-internal transfers (eg: when tipping a creator, it just moves balance on platform); there's a Soroban contract for managing this for the hackaton and decentralization but at scale we could just use a normal database

The key is to use blockchain where it matters (anti-censorship, no chargebacks, easier payment rails) and use traditional tech where it's not needed (serving content, moving balances around accounts when users tip creators, subscribe to content, etc). While wallet balance is shown in the hackatohn to demosntrate passkey-kit, in reality users won't even know they have a wallet.

The NFT gating for premium content is to reward users with on-chain proof of their help towards their favorite creators. Who knows, maybe when their creator succeeds they may want to airdrop a little something to the people who helped them along the way :)

The end result is UX that's so good users don't even know it's on the blockchain, but with the benefits of Stellar payment rails and NFT (and possible future airdrops).

**URL to Public Code Repository:** https://github.com/chinesepowered/stellar-consensus-2025

## Features

OnlyFrens aims to provide a comprehensive and user-friendly platform for content monetization:

- **Seamless Onboarding & Authentication**: Users can easily register and log in using device-native passkeys (e.g., Face ID, fingerprint scanners) powered by WebAuthn and PasskeyKit, eliminating the need for traditional passwords or complex wallet setups.
- **Direct Creator Support**: Facilitates content monetization through:
    - **Subscriptions**: Users can subscribe to creators to access exclusive content.
    - **Tipping**: Allows for direct financial appreciation of creators.
    - **NFT Purchases**: Creators can sell unique digital collectibles (NFTs) that unlock premium content or experiences.
- **Stellar-Powered Backend**:
    - **Smart Contracts**: Core logic for subscriptions, tips, and NFT management is handled by Soroban smart contracts deployed on the Stellar network.
    - **Anchors for ramping**: Leverages the Stellar network of anchors to allow easier onboarding (so more users) and offboarding (so creators in many countries can get paid easily such as offramping to moneygram).
- **User-Friendly Interface**:
    - **Premium Content Access**: NFT ownership seamlessly unlocks access to gated premium content (e.g., videos, articles).
    - **Integrated Balances**: Users can manage both their native Stellar XLM balance and a platform-specific balance for in-app interactions.
- **Smart Wallet Functionality**: Utilizes PasskeyKit for smart wallet management, simplifying transaction signing and potentially automating workflows.
- **Reliable Transaction Submission**: Integrates with Launchtube to ensure robust and reliable submission of transactions to the Stellar network.

## Environment Variables

This project requires certain environment variables to be set for full functionality, especially for interacting with the Stellar network and smart contracts. Please create a `.env` file in the root of your project and include necessary configurations such as:

- NEXT_PUBLIC_SOROBAN_RPC_URL
- NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015" # For Testnet
- NEXT_PUBLIC_WALLET_WASM_HASH="ecd990f0b45ca6817149b6175f79b32efb442f35731985a084131e8265c4cd90"

- LAUNCHTUBE_TOKEN
- NEXT_PUBLIC_LAUNCHTUBE_TOKEN
- PLATFORM_ACCOUNT_PRIVATE_KEY
- SYSTEM_ACCOUNT_SECRET_KEY

## Technical Overview

### Authentication

Authentication is handled with PasskeyKit, allowing users to create and manage Stellar accounts using passkeys (WebAuthn). User data is persisted in localStorage for demonstration purposes, making the app work without a backend.

### Transactions

The platform aims for all transactional features (deposits, tips, subscriptions, NFT minting) to be fully operational on the Stellar testnet.

- **Deposits**: Users can deposit XLM into their platform balance via a smart contract interaction.
- **Platform Balance**: Stored on-chain within a platform smart contract, used for tips, subscriptions, and NFT purchases.
- **NFT Minting**: Utilizes a dedicated Soroban NFT smart contract. Interactions are facilitated through the backend API, which constructs and submits transactions via Launchtube.

### Premium Content

- The premium content is gated by NFT ownership and verified through a backend API endpoint.
- Users can only access the content if they own the corresponding NFT.

### Balances

The app clearly distinguishes between:
- **XLM Wallet Balance**: The user's native Stellar XLM balance, queried directly from the Stellar network.
- **Platform Balance**: XLM deposited by the user into the platform's smart contract, available for use within the OnlyFrens application.

### Contracts
- **Platform Contract ID**: `CCIFA3JIYPVQILXSPZX5OMT6B5X4LPIMHXHZCD57AOWQNKTDTVAZZTBV` (Stellar Expert: `https://stellar.expert/contract/CCIFA3JIYPVQILXSPZX5OMT6B5X4LPIMHXHZCD57AOWQNKTDTVAZZTBV`)
- **NFT Contract ID**:  `CCNMXO54G46RHX6XFJ3ZBVRMXZIPRU7JUNRIITQNTZJWIB55YV6J2W54` (Stellar Expert: `https://stellar.expert/contract/CCNMXO54G46RHX6XFJ3ZBVRMXZIPRU7JUNRIITQNTZJWIB55YV6J2W54`)
- **System/Treasury Account Address**: `GA7DDI3FA5IK36OJEX3PHNPLRFAA6P6KSNW7RSDSBAD6CJMVWACS3XMU`

## The Narrative "Why"

[Link to Narrative "Why" Document](./NARRATIVE_WHY.md)

## Technical Design Documentation

[Link to Technical Design Document](./TECHNICAL_DESIGN.md)

## Features (some mocked)

*   [x] User authentication with passkeys (leveraging PasskeyKit)
*   [x] Display user's XLM balance (fetched from Stellar network)
*   [x] Display user's app balance (managed by platform smart contract)
*   [x] Deposit XLM to app balance (via smart contract interaction)
*   [x] View featured creator profile (bio, teaser content)
*   [x] Subscribe to creators (on-chain mechanism for content access)
*   [x] Tip creators (via platform contract)
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


**Stellar Website:** 
[https://developers.stellar.org/](https://developers.stellar.org/)
