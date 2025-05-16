# ✨ OnlyFrens - Revolutionizing Creator Support with Stellar ✨

A platform where creators meet cutting-edge Web3 technology, designed to prove that **Web3 UX doesn't have to suck!**

**🔗 Public Code Repository:** [https://github.com/chinesepowered/stellar-consensus-2025](https://github.com/chinesepowered/stellar-consensus-2025)

**🔗 Canva:** [Canva Link](https://www.canva.com/design/DAGnlUetMhM/MTS5mYSQ1K1R5_Ol41S3bA/edit?utm_content=DAGnlUetMhM&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

## 🚀 Quick Look

### Demo Video

Watch a quick walkthrough of OnlyFrens in action:

[Watch Demo Video](https://github.com/chinesepowered/stellar-consensus-2025/raw/refs/heads/main/public/demo.mp4)


## 💡 Core UX Philosophy & Key Features

Our mission with OnlyFrens is to deliver a Web3 application with the *seamlessness, intuition, and fluidity* of your favorite Web2 experiences. Users shouldn't need a blockchain PhD to support creators they love.

*   **🔑 Effortless Onboarding:** Users authenticate using device-native **passkeys** (e.g., Face ID, fingerprint). This action transparently creates a Stellar smart wallet for them in seconds!
*   **💰 Simplified Funding (Vision):** While direct funding via traditional anchors (credit cards, bank transfers) or crypto exchanges is the ultimate goal, our hackathon version focuses on streamlined testnet interactions to showcase the core experience.
*   **🏗️ Hybrid Architecture for Optimal Performance:** We harness the power of both on-chain and off-chain systems:

    *   **⛓️ On-Chain (Stellar Network):**
        *   💎 **Premium Content Access:** Gated by unique NFTs, providing verifiable, tradable ownership.
        *   💸 **Robust Payment Rails:** Deposits and withdrawals utilize Stellar's fast and low-cost infrastructure.
        *   🤝 **Creator Support & Transparency (Future Ready):** While some internal transfers are off-chain for MVP speed, our design includes on-chain settlement options. The platform contract (`CCIFA3JIYPVQILXSPZX5OMT6B5X4LPIMHXHZCD57AOWQNKTDTVAZZTBV`) pioneers this for shared logic.

    *   **⚡ Off-Chain (Traditional Backend):**
        *   🎬 **Swift Content Delivery:** Lightning-fast video/content serving via a standard backend (CDN-ready).
        *   💨 **Real-time Interactions:** Instant internal balance updates for tips or micro-subscriptions ensure a smooth UX, with on-chain settlement for withdrawals.

*   **🎯 User-Centric by Design:**
    *   Users enjoy a fast, responsive interface. *No confusing blockchain jargon!* Most actions feel just like any other modern web app.
    *   NFTs act as **digital badges of honor**, proving support and unlocking potential future perks like exclusive airdrops.
    *   The outcome? A UX that delights users, backed by Stellar's powerful payment rails and the unique value of NFTs.

## 🚀 Platform Features Breakdown

OnlyFrens empowers creators and fans with a rich, user-friendly toolkit:

- **🔑 Seamless Onboarding & Authentication**: Users register and log in effortlessly with device-native **passkeys** (Face ID, fingerprint, etc.) via WebAuthn and PasskeyKit. No more forgotten passwords! This _automatically provisions a Stellar smart wallet_ for the user.
- **🎁 Direct Creator Support**: Multiple ways to show love and get exclusive content:
    - **🎫 Subscriptions**: Access exclusive content through a hybrid on-chain/off-chain model for flexibility and speed.
    - **💖 Tipping**: Instantly send appreciation to creators (off-chain ledger for UX, with on-chain settlement options).
    - **🖼️ NFT Purchases**: Creators can sell unique digital collectibles (NFTs) minted on the Stellar network, unlocking premium experiences.
- **⚙️ Stellar-Powered Backend & Smart Contracts**:
    - **Soroban Core Logic**: Key functions like NFT minting (`CCNMXO54G46RHX6XFJ3ZBVRMXZIPRU7JUNRIITQNTZJWIB55YV6J2W54`) and platform fund management aspects (`CCIFA3JIYPVQILXSPZX5OMT6B5X4LPIMHXHZCD57AOWQNKTDTVAZZTBV`) are powered by robust Soroban smart contracts.
    - **🌍 Anchor Integration (Vision):** Designed to tap into Stellar's rich ecosystem of anchors for easy fiat-to-crypto onboarding and global creator payouts (e.g., via MoneyGram).
- **🖥️ User-Friendly Interface**:
    - **🔒 NFT-Gated Premium Content**: Access exclusive content, seamlessly verified against _on-chain NFT ownership_.
    - **📊 Dual Balance Display**: Users clearly see their native Stellar XLM balance (in their smart wallet) and their internal platform balance for quick in-app actions.
- **🛡️ Smart Wallet Functionality via PasskeyKit**: Abstracting blockchain complexities, simplifying interactions and transaction signing for a smooth user journey.
- ** Тран Reliable Transaction Submission via Launchtube**: Ensures on-chain transactions are dependably submitted to the Stellar network, handling potential network issues gracefully.

## 🛠️ Environment Variables Setup

To get your local instance running, you'll need to set up some environment variables. Create a `.env` file in your project root (copy `.env.example` if available, or create a new one) and fill in the following:

*   `NEXT_PUBLIC_SOROBAN_RPC_URL`: RPC URL for the Soroban testnet (e.g., `https://soroban-testnet.stellar.org`).
*   `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`: Network passphrase (e.g., `"Test SDF Network ; September 2015"` for Testnet).
*   `NEXT_PUBLIC_WALLET_WASM_HASH`: The WASM hash of your smart wallet contract.
*   `LAUNCHTUBE_TOKEN`: Your API token for the Launchtube service.
*   `NEXT_PUBLIC_LAUNCHTUBE_TOKEN`: (Can be the same as `LAUNCHTUBE_TOKEN`; used if client-side Launchtube calls are made, though backend usage is more common).
*   `PLATFORM_ACCOUNT_PRIVATE_KEY`: Private key for a platform administrative account (⚠️ **Handle with extreme care!**).
*   `SYSTEM_ACCOUNT_SECRET_KEY`: Secret key for the system's main treasury/operational account (⚠️ **Handle with extreme care!**).

**🔒 IMPORTANT SECURITY NOTE**: Never commit your actual secret keys or tokens in the `.env` file to a public repository. Always use an `.env.example` file to list the *required* variables with placeholder or example values for contributors.

## 🔧 Technical Overview

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
- **Platform Contract ID**: `CCIFA3JIYPVQILXSPZX5OMT6B5X4LPIMHXHZCD57AOWQNKTDTVAZZTBV`
  *   ([View on Stellar Expert 🔭](https://stellar.expert/contract/CCIFA3JIYPVQILXSPZX5OMT6B5X4LPIMHXHZCD57AOWQNKTDTVAZZTBV))
- **NFT Contract ID**:  `CCNMXO54G46RHX6XFJ3ZBVRMXZIPRU7JUNRIITQNTZJWIB55YV6J2W54`
  *   ([View on Stellar Expert 🔭](https://stellar.expert/contract/CCNMXO54G46RHX6XFJ3ZBVRMXZIPRU7JUNRIITQNTZJWIB55YV6J2W54))
- **System/Treasury Account Address**: `GA7DDI3FA5IK36OJEX3PHNPLRFAA6P6KSNW7RSDSBAD6CJMVWACS3XMU`
  *   ([View on Stellar Expert 🔭](https://stellar.expert/accounts/GA7DDI3FA5IK36OJEX3PHNPLRFAA6P6KSNW7RSDSBAD6CJMVWACS3XMU))

## 📖 The Narrative "Why"

[Link to Narrative "Why" Document](./NARRATIVE_WHY.md)

## ✅ Features (Target Scope for Hackathon)

*   [x] 🔑 User authentication with passkeys (leveraging PasskeyKit, provisions smart wallet)
*   [x] 💰 Display user's XLM balance (fetched from Stellar network via user's smart wallet)
*   [x] 💳 Display user's app balance (conceptually managed by platform contract, fetched on-chain)
*   [x] 📥 Deposit XLM to app balance (on-chain interaction with platform/system account)
*   [x] 🧑‍🎨 View featured creator profile (bio, teaser content)
*   [x]  suscribirse Subscribe to creators (simulated or basic on-chain mechanism for content access)
*   [x] ❤️ Tip creators (simulated or via platform contract with off-chain ledger for UX, on-chain settlement option)
*   [x] 🖼️ Purchase premium content (NFT minting via Soroban NFT contract)
*   [x] 🎬 View purchased premium content (NFT-gated access, verified on-chain)
*   [x] ℹ️ Display minted NFT metadata
*   [x] 📜 User action/event timeline (basic implementation, with vision for on-chain event derivation)

## 🛠️ Technologies Used

*   Next.js
*   Stellar SDK ([js-stellar-sdk](https://github.com/stellar/js-stellar-sdk))
*   PasskeyKit ([https://github.com/kalepail/passkey-kit](https://github.com/kalepail/passkey-kit))
*   Launchtube ([https://github.com/stellar/launchtube](https://github.com/stellar/launchtube))
*   Soroban Smart Contracts (Rust)
*   TypeScript
*   Tailwind CSS

## 📦 Repository Information

*   **Project Name:** `stellar-consensus-2025`
*   **Tagline:** A Web3 creator support platform on Stellar, proving great UX is possible with Passkeys & Launchtube.
*   **Keywords/Topics:** `stellar`, `rust`, `smart-contracts`, `consensus-toronto-2025`, `passkeys`, `nextjs`, `web3`, `creator-economy`, `blockchain`, `soroban`, `fintech`, `ux`, `passkeykit`, `launchtube`
*   **Stellar Dev Portal:** [https://developers.stellar.org/](https://developers.stellar.org/)

### Screenshots

Here are some glimpses of the OnlyFrens interface:

<p align="center">
  <span style="display: inline-block; text-align: center; margin: 10px; width: 40%;">
    <img src="/public/screen1.jpg" alt="OnlyFrens Homepage" width="100%" /><br />
    <em>Homepage &amp; Guide</em>
  </span>
  <span style="display: inline-block; text-align: center; margin: 10px; width: 40%;">
    <img src="/public/screen2.jpg" alt="OnlyFrens Support Modal" width="100%" /><br />
    <em>Support Modal</em>
  </span>
</p>
<p align="center">
  <span style="display: inline-block; text-align: center; margin: 10px; width: 40%;">
    <img src="/public/screen3.jpg" alt="OnlyFrens Premium Content Locked" width="100%" /><br />
    <em>Premium Locked</em>
  </span>
  <span style="display: inline-block; text-align: center; margin: 10px; width: 40%;">
    <img src="/public/screen4.jpg" alt="OnlyFrens Premium Content Unlocked" width="100%" /><br />
    <em>Premium Unlocked</em>
  </span>
</p>
<p align="center">
  <span style="display: inline-block; text-align: center; margin: 10px; width: 40%;">
    <img src="/public/screen5.jpg" alt="OnlyFrens Creator Timeline" width="100%" /><br />
    <em>Creator Timeline</em>
  </span>
</p>