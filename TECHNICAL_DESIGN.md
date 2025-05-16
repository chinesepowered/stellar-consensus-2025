# 🛠️ OnlyFrens - Technical Design Deep Dive 🚀

## 1. 🗺️ System Overview

OnlyFrens is a **Next.js** web application empowering users to support creators via subscriptions, tips, and NFT purchases. It leverages **Stellar's Soroban smart contracts** for on-chain logic, **PasskeyKit** for a seamless WebAuthn-based authentication and smart wallet experience, and **Launchtube** for reliable transaction submission. Our primary architectural goal is achieving a *Web2-like user experience* within a robust Web3 framework.

## 2. 🏗️ System Architecture & Core Components

```mermaid
graph TD
    A[User Browser: Next.js Frontend] --> B{PasskeyKit Client SDK};
    A --> C{API Routes (Next.js Backend)};
    B --> D[User's Device Passkey Manager];
    C --> E{PasskeyKit Server SDK};
    C --> F{Stellar SDK / Soroban RPC};
    E --> F;
    F --> G[Launchtube Service];
    G --> H[Stellar Network (Testnet)];
    H --> I[Soroban Smart Contracts: Platform & NFT];
    I --> H;

    subgraph "User's Device"
        D
    end

    subgraph "OnlyFrens Application Server (Next.js)"
        C
        E
    end

    subgraph "Stellar Ecosystem"
        F
        G
        H
        I
    end
```

### Major Components:

1.  **🚀 Next.js Frontend (Client-Side):**
    *   **Function:** Manages all UI elements, displays creator/content info, and orchestrates user interactions.
    *   **Technologies:** React, Next.js, TypeScript, Tailwind CSS.
    *   **Interaction:** Integrates with **PasskeyKit Client SDK** for registration/login and transaction signing. Communicates with Next.js backend (API routes) for data fetching and complex operations.

2.  **🔑 PasskeyKit Client SDK:**
    *   **Function:** Embedded in the frontend to manage **passkey creation, authentication, and transaction signing** directly in the browser, interfacing with the device's native passkey manager.
    *   **Interaction:** Communicates with the user's device and the **PasskeyKit Server SDK** (via backend API routes).

3.  **🔌 Next.js Backend (API Routes):**
    *   **Function:** Acts as the secure intermediary between the frontend and blockchain/services. Handles business logic, session management, and prepares/validates transactions.
    *   **Technologies:** Next.js API Routes, TypeScript.
    *   **Interaction:** Services frontend requests. Utilizes **PasskeyKit Server SDK** for server-side passkey validation. Employs the **Stellar SDK** to build and simulate transactions before dispatching them via **Launchtube**.

4.  **🛡️ PasskeyKit Server SDK:**
    *   **Function:** Operates on the backend to verify attestations and assertions from the client-side PasskeyKit, ensuring the integrity of passkey operations. Crucial for constructing authorization entries for smart wallet interactions.
    *   **Interaction:** Collaborates with API routes to validate client-side passkey data.

5.  **🌐 Stellar SDK / Soroban RPC:**
    *   **Function:** The core library for **constructing transactions**, interacting with **Soroban smart contracts** (reading state, preparing invocations), and communicating with the Stellar network (directly via Soroban RPC for reads, or Launchtube for writes).
    *   **Interaction:** Used extensively by the backend for preparing and simulating contract calls.

6.  **📮 Launchtube Service:**
    *   **Function:** A reliable transaction submission service. The backend sends signed transactions (or transactions to be authorized by passkey-controlled smart wallets) to Launchtube, which ensures robust submission to the Stellar network. This abstracts complexities like **fee bumping and sequence number management**.
    *   **Interaction:** Receives transaction envelopes from the backend and relays them to the Stellar network.

7.  **📜 Soroban Smart Contracts (Rust):**
    *   **Function:** Deployed on the Stellar Testnet, these contracts embody the core logic of OnlyFrens:
        *   **Platform Contract (`CCIFA3JIYPVQILXSPZX5OMT6B5X4LPIMHXHZCD57AOWQNKTDTVAZZTBV`):** Manages user app balances (deposits/withdrawals), creator subscriptions, and tips. *Designed for transparency and future on-chain settlement capabilities.*
        *   **NFT Contract (`CCNMXO54G46RHX6XFJ3ZBVRMXZIPRU7JUNRIITQNTZJWIB55YV6J2W54`):** Handles the minting, ownership, and metadata of NFTs that unlock premium content. *Provides verifiable digital ownership.*
    *   **Technologies:** Rust, Soroban SDK.
    *   **Interaction:** Invoked via transactions submitted through Launchtube. State is read via Soroban RPC.

## 3. 🔄 Component Interactions (Key Flows)

### a. 👤 User Registration & Login:

1.  User initiates registration/login on the frontend.
2.  Frontend (**PasskeyKit Client SDK**) prompts user for passkey creation/authentication via their device.
3.  PasskeyKit Client SDK securely sends credential/assertion to the Next.js backend.
4.  Backend (**PasskeyKit Server SDK**) rigorously verifies the credential/assertion.
5.  Upon successful verification, the backend establishes a user session. For new users, this triggers the **deployment or initialization of their smart wallet contract** via PasskeyKit, an operation submitted through Launchtube.

### b. 💸 Depositing XLM to App Balance:

1.  User initiates a deposit on the frontend.
2.  Frontend communicates the desired amount to the backend.
3.  Backend prepares a **Soroban transaction** to call the `deposit` function on the **Platform Contract**. This involves transferring value from the user's funding source to the platform contract and updating the user's internal balance within the contract.
4.  The transaction requires signing. The **PasskeyKit Client SDK** facilitates this using the user's passkey, which authorizes their smart wallet to perform the action.
5.  The signed transaction (or authorization payload) is sent to the backend.
6.  Backend submits it to **Launchtube**, which relays it to the Stellar network.
7.  Frontend updates upon confirmation, reflecting the new balance.

### c. 🖼️ Purchasing an NFT (Premium Content Access):

1.  User selects premium content, indicating intent to purchase the access NFT.
2.  Frontend communicates this intent to the backend.
3.  Backend prepares a **Soroban transaction** to orchestrate the purchase. This is designed as a single logical operation (or a sequence managed by the user's smart wallet) to:
    *   Invoke the **Platform Contract** to transfer payment from the user's app balance to the creator or platform treasury.
    *   Invoke the **NFT Contract** to mint the access NFT directly to the user's smart wallet.
4.  **PasskeyKit Client SDK** facilitates signing by the user's passkey, authorizing their smart wallet for these operations.
5.  The signed authorization/transaction is sent to the backend, then relayed via **Launchtube** to the Stellar network.
6.  Frontend updates to reflect NFT ownership and unlocks the premium content upon confirmation.

## 4. 🧠 Design Choices & Rationale

### a. 🗄️ Data Storage Strategy:

*   **User Profile Data (Off-Chain):** User and creator profiles (bios, display names, non-sensitive preferences) are stored in a scalable database solution (e.g., PostgreSQL, Supabase). This ensures efficient querying for data not requiring ledger immutability.
*   **Contract State (On-Chain):** All critical states like **balances, subscription status, and NFT ownership** are stored directly on the Stellar ledger within Soroban smart contracts. This provides the *single source of truth*, ensuring transparency and verifiability.
*   **Session Management (Backend):** Secure HTTP-only cookies or tokens manage user sessions, initiated after successful passkey authentication.

### b. 🏛️ Smart Contract State Storage:

*   **Platform Contract:** Utilizes Soroban's storage (`Env.storage().persistent()`) for:
    *   `DataKey::UserBalance(Address)`: Maps user smart wallet addresses to their platform app balance.
    *   `DataKey::Subscription(Address /*User*/, Address /*Creator*/)`: Tracks subscription status and expiry.
    *   `DataKey::Creator(Address)`: Stores information about registered creators.
*   **NFT Contract:** Employs standard Soroban NFT patterns, storing:
    *   `DataKey::Owner(u32 /*Token ID*/)`: Maps token IDs to owner smart wallet addresses.
    *   `DataKey::TokenURI(u32 /*Token ID*/)`: Maps token IDs to metadata URIs (e.g., IPFS links or JSON metadata URLs).
    *   `DataKey::Admin`: The administrative address for NFT contract management.

### c. 📣 Emitted Events (Soroban Contracts):

*   **Platform Contract Events:**
    *   `deposit(user: Address, amount: u128)`
    *   `withdraw(user: Address, amount: u128)`
    *   `subscribed(user: Address, creator: Address, expires_on: u64)`
    *   `tipped(tipper: Address, creator: Address, amount: u128, memo: String)`
*   **NFT Contract Events (illustrative, follows standards like NEP-171 or ERC721 conceptually):**
    *   `mint(operator: Address, to: Address, token_id: u32, token_uri: String)`
    *   `transfer(operator: Address, from: Address, to: Address, token_id: u32)`
    *   `approval(owner: Address, approved: Address, token_id: u32)` (or `ApprovalForAll`)

    These events are *crucial* for off-chain services and the frontend. An **event indexer service** (conceptually similar to Zephyr from PasskeyKit, or a custom solution) listens for these events to build user timelines and maintain application state efficiently, minimizing direct contract queries.

### d. 🔑 Passkeys Implementation Details:

*   **Core Library:** Leverages **`passkey-kit`** (`PasskeyKit` for client, `PasskeyServer` for backend) from `kalepail/passkey-kit`.
*   **Registration Flow:**
    1.  Frontend requests a challenge from the backend.
    2.  Backend generates challenge via `PasskeyServer.challenge()`.
    3.  Frontend uses `PasskeyKit.create()` with this challenge, prompting user for passkey creation (device native UI).
    4.  Frontend sends the attestation object to the backend.
    5.  Backend verifies attestation with `PasskeyServer.verifyAttestation()`, storing public key & credential ID.
    6.  A **smart wallet contract**, controlled by this new passkey, is deployed or identified for the user. `passkey-kit` streamlines the linkage between passkey (signer) and smart wallet (account).
*   **Login Flow:**
    1.  Frontend requests challenge from backend.
    2.  Backend generates challenge.
    3.  Frontend uses `PasskeyKit.get()` with the challenge.
    4.  Frontend sends assertion to backend.
    5.  Backend verifies assertion with `PasskeyServer.verifyAssertion()`.
*   **Transaction Signing:**
    *   Transactions are constructed to invoke the user's **smart wallet**. The `PasskeyKit` on the client signs an *authorization* for the smart wallet to execute the transaction. This signed authorization is then typically submitted via the backend to Launchtube.
    *   `passkey-kit` elegantly abstracts the complexities of how passkey signatures authorize smart contract calls, making the UX seamless.

## 5. 💪 Challenges Overcome & Key Design Considerations

*   **🚀 Smart Wallet Lifecycle Management:** A core achievement is ensuring each new user with a passkey seamlessly gets a corresponding smart wallet deployed and correctly associated. **`passkey-kit`** has been instrumental here.
*   **🔗 Transaction Atomicity & Composability:** For multi-step actions like NFT purchases (payment + minting), ensuring atomicity is critical. Our design uses smart contract functions that orchestrate multiple operations or leverages the smart wallet to execute authorized sequences.
*   **📊 Efficient State Retrieval & Event Indexing:** To deliver a responsive UX (timelines, balances), we recognize that direct contract queries alone are inefficient. The design incorporates an **event indexing layer** for fast data access.
*   **✨ Seamless User Experience for Contract Interactions:** Abstracting blockchain complexities (fees, confirmations) is paramount. **Launchtube** ensures reliable submission, while **PasskeyKit** provides familiar signing. The frontend prioritizes clear feedback.
*   **🔄 Synchronization of On-Chain & Off-Chain Data:** Maintaining consistency between smart contract data and any off-chain databases (e.g., user profiles) is addressed through careful event handling and synchronization strategies.

## 6. 🔮 Future Considerations (Post-Hackathon)

*   **Zephyr Integration:** Full integration of an event indexer like **Zephyr** for robust, real-time event tracking and state building.
*   **Creator Subscription Tiers:** Allowing creators to define multiple subscription levels with varied benefits.
*   **Decentralized Content Storage:** Exploring IPFS or Arweave for storing NFT-associated premium content for greater decentralization.
*   **Advanced Smart Wallet Policies:** Implementing more sophisticated, user-configurable policies for their smart wallets.
*   **Social Engagement Features:** Adding comments, likes, and other community-building features.

---
*This document is a work in progress and will be updated throughout the hackathon.* 