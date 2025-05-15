# Technical Design Document - OnlyFrens

## 1. Overview

OnlyFrens is a Next.js web application that allows users to support creators through subscriptions, tips, and NFT purchases, leveraging Stellar's Soroban smart contracts, PasskeyKit for seamless authentication and transaction signing, and Launchtube for reliable transaction submission. The primary goal is to provide a Web2-like user experience in a Web3 context.

## 2. System Architecture & Components

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

1.  **Next.js Frontend (Client-Side):**
    *   **Function:** Handles all user interface elements, displays creator and content information, and manages user interactions.
    *   **Technologies:** React, Next.js, TypeScript, Tailwind CSS (for rapid UI development).
    *   **Interaction:** Interacts with PasskeyKit Client SDK for registration/login and transaction signing. Makes requests to the Next.js backend (API routes) for data and contract interactions.

2.  **PasskeyKit Client SDK:**
    *   **Function:** Integrated into the frontend to manage passkey creation, authentication, and the signing of transactions directly in the user's browser, interacting with the device's native passkey manager.
    *   **Interaction:** Communicates with the user's device and the PasskeyKit Server SDK (via backend API routes) to coordinate authentication and transaction signing processes.

3.  **Next.js Backend (API Routes):**
    *   **Function:** Serves as the intermediary between the frontend and the blockchain/supporting services. Handles business logic that shouldn't live on the client, manages sessions, and prepares transactions.
    *   **Technologies:** Next.js API Routes, TypeScript.
    *   **Interaction:** Receives requests from the frontend. Uses PasskeyKit Server SDK for server-side validation of passkey operations. Uses Stellar SDK to build and simulate transactions before sending them to Launchtube.

4.  **PasskeyKit Server SDK:**
    *   **Function:** Used on the backend to verify attestations and assertions from the client-side PasskeyKit, ensuring the integrity of passkey operations. It will also be instrumental in constructing the necessary authorization entries for smart wallet interactions.
    *   **Interaction:** Works with API routes to validate client-side passkey data.

5.  **Stellar SDK / Soroban RPC:**
    *   **Function:** The primary library for constructing transactions, interacting with Soroban smart contracts (reading state, preparing invocations), and communicating with the Stellar network (either directly via Soroban RPC for reads or via Launchtube for writes).
    *   **Interaction:** Used by the backend to prepare and simulate contract calls.

6.  **Launchtube Service:**
    *   **Function:** Acts as a transaction submission service. The backend sends signed transactions (or transactions to be signed by a smart wallet controlled by passkeys) to Launchtube, which then ensures they are processed and submitted to the Stellar network. This abstracts away complexities like fee bumping and sequence number management for user-sponsored transactions.
    *   **Interaction:** Receives transaction envelopes from the backend and relays them to the Stellar network.

7.  **Soroban Smart Contracts (Rust):**
    *   **Function:** Deployed on the Stellar Testnet. These contracts define the core logic of the OnlyFrens platform.
        *   **Platform Contract:** Manages user app balances (deposits/withdrawals of XLM-backed tokens), creator subscriptions, and tips.
        *   **NFT Contract:** Handles the minting, ownership, and metadata of NFTs, which unlock premium content.
    *   **Technologies:** Rust, Soroban SDK.
    *   **Interaction:** Invoked via transactions submitted through Launchtube. Their state is read via Soroban RPC.

## 3. Component Interactions (Key Flows)

### a. User Registration & Login:

1.  User initiates registration/login on the frontend.
2.  Frontend (PasskeyKit Client SDK) prompts user for passkey creation/authentication via device.
3.  PasskeyKit Client SDK sends credential/assertion to Next.js backend.
4.  Backend (PasskeyKit Server SDK) verifies the credential/assertion.
5.  Upon successful verification, backend creates a session for the user. If it's a new user, it may trigger the creation/initialization of their smart wallet contract via PasskeyKit, which would involve a transaction submitted through Launchtube.

### b. Depositing XLM to App Balance:

1.  User initiates deposit on the frontend.
2.  Frontend communicates amount to backend.
3.  Backend prepares a Soroban transaction to call the `deposit` function on the Platform Contract. This transaction will likely involve transferring XLM from the user's funding account to the platform contract and updating the user's balance within the contract.
4.  The transaction needs to be signed. PasskeyKit Client SDK facilitates signing using the user's passkey (potentially signing an authorization for the smart wallet to perform the action).
5.  Signed transaction (or authorization payload) is sent to the backend.
6.  Backend submits it to Launchtube, which forwards it to the Stellar network.
7.  Frontend polls for updates or receives confirmation.

### c. Purchasing NFT (Premium Content):

1.  User selects premium content to purchase.
2.  Frontend communicates intent to backend.
3.  Backend prepares a Soroban transaction to:
    *   Call the Platform Contract to transfer payment from user's app balance to the creator.
    *   Call the NFT Contract to mint an NFT to the user.
    *   These might be part of a multi-operation transaction or managed via smart wallet capabilities.
4.  PasskeyKit Client SDK facilitates signing by the user's passkey.
5.  Signed transaction sent to backend, then to Launchtube.
6.  Frontend updates to show NFT ownership and unlock content.

## 4. Design Choices

### a. Storage:

*   **User Data (Profile, non-sensitive info):** Potentially a simple database (e.g., Supabase, Firebase, or even local storage for a hackathon MVP if user accounts are primarily identified by their public key/passkey ID) for creator bios, teaser video URLs, etc. *For the hackathon, we may simplify this and hardcode creator data or store it in a JSON file if a DB is too much overhead.*
*   **Contract State (Balances, Subscriptions, NFT Ownership):** Stored directly on the Stellar ledger within the Soroban smart contracts. This is the source of truth for all on-chain data.
*   **Session Management:** Managed by the Next.js backend using secure cookies or tokens after passkey authentication.

### b. Contract State Storage:

*   **Platform Contract:** Will use Soroban's storage capabilities (e.g., `Env.storage().persistent()`) to store:
    *   `DataKey::UserBalance(Address)`: Mapping of user addresses (their smart wallet contract ID or public key) to their app balance (e.g., a custom token representing deposited XLM).
    *   `DataKey::Subscription(Address /*User*/, Address /*Creator*/)`: Mapping to store subscription status and expiry.
    *   `DataKey::Creator(Address)`: Information about registered creators.
*   **NFT Contract:** Will use Soroban's standard NFT contract patterns, storing:
    *   `DataKey::Owner(u32 /*Token ID*/)`: Mapping token ID to owner address.
    *   `DataKey::TokenURI(u32 /*Token ID*/)`: Mapping token ID to metadata URI.
    *   `DataKey::Admin`: The administrative address for the NFT contract.

### c. Emitted Events (Soroban Contracts):

*   **Platform Contract:**
    *   `deposit(user: Address, amount: u128)`
    *   `withdraw(user: Address, amount: u128)`
    *   `subscribed(user: Address, creator: Address, expires_on: u64)`
    *   `tipped(tipper: Address, creator: Address, amount: u128)`
*   **NFT Contract (Standard NEP-XXX events or custom as needed):**
    *   `mint(to: Address, token_id: u32)`
    *   `transfer(from: Address, to: Address, token_id: u32)`
    *   `set_token_uri(token_id: u32, uri: String)`

    These events will be crucial for the frontend to build a user's action timeline by querying an indexer or by direct observation if an indexer isn't fully set up for the hackathon.

### d. Passkeys Implementation:

*   **Leverage `passkey-kit`:** Both `PasskeyKit` (client) and `PasskeyServer` (server) from the `kalepail/passkey-kit` library will be used.
*   **Registration:**
    1.  Frontend requests challenge from backend.
    2.  Backend generates challenge using `PasskeyServer.challenge()`.
    3.  Frontend uses `PasskeyKit.create()` with the challenge to prompt user for passkey creation.
    4.  Frontend sends attestation to backend.
    5.  Backend verifies attestation using `PasskeyServer.verifyAttestation()` and stores the public key and credential ID.
    6.  A smart wallet contract, controlled by this passkey, will be deployed or identified for the user. The `passkey-kit` helps manage the relationship between the passkey (signer) and the smart wallet contract (account).
*   **Login:**
    1.  Frontend requests challenge from backend.
    2.  Backend generates challenge.
    3.  Frontend uses `PasskeyKit.get()` with the challenge.
    4.  Frontend sends assertion to backend.
    5.  Backend verifies assertion using `PasskeyServer.verifyAssertion()`.
*   **Transaction Signing:**
    *   Transactions will be constructed that invoke the user's smart wallet. The `PasskeyKit` on the client will be used to sign an authorization for the smart wallet to execute the transaction. This signed authorization is then submitted (often via the backend to Launchtube). The `PasskeyServer` might be involved in constructing the appropriate Soroban authorization entries if needed.
    *   The `passkey-kit` abstracts the details of how the passkey signature authorizes smart contract calls, making it seamless.

## 5. Challenges Overcome / To Be Addressed

*   **Smart Wallet Deployment:** Ensuring each new user with a passkey gets a corresponding smart wallet deployed and correctly associated. `passkey-kit` aims to simplify this.
*   **Transaction Atomicity:** For actions like NFT purchase (payment + mint), ensuring atomicity. This can be handled by a single smart contract call that internally orchestrates both actions or by relying on the smart wallet to execute a sequence of operations.
*   **Event Indexing for Timeline:** Efficiently displaying a user's action timeline. For a hackathon, we might use a simpler polling mechanism or rely on client-side tracking of initiated actions, rather than setting up a full event indexer like Zephyr from `passkey-kit` (though its principles are relevant).
*   **UX for Contract Interactions:** Abstracting away gas fees (Stellar fees are low, but still) and blockchain confirmations. Launchtube helps with submission reliability. PasskeyKit helps with signing. Frontend design will focus on clear feedback.
*   **Synchronization of Balances:** Ensuring the displayed XLM and app balances are up-to-date and reflect network state.

## 6. Future Considerations (Post-Hackathon)

*   Full Zephyr indexer integration for robust event tracking.
*   Creator-defined subscription tiers and benefits.
*   Decentralized storage for premium content (e.g., IPFS for NFT assets).
*   More sophisticated smart wallet policies.
*   Social features (comments, likes).

---
*This document is a work in progress and will be updated throughout the hackathon.* 