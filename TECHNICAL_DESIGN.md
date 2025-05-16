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
3.  Backend prepares a Soroban transaction to orchestrate the purchase. This ideally involves a single logical operation or a sequence managed by the user's smart wallet to:
    *   Call the Platform Contract to transfer payment from the user's app balance to the creator.
    *   Call the NFT Contract to mint an NFT to the user.
4.  PasskeyKit Client SDK facilitates signing by the user's passkey for the smart wallet to authorize these operations.
5.  The signed authorization/transaction is sent to the backend, then relayed via Launchtube to the Stellar network.
6.  Frontend updates to show NFT ownership and unlock content upon confirmation.

## 4. Design Choices

### a. Storage:

*   **User Data (Profile, non-sensitive info):** User and creator profile information (bios, display names, non-sensitive preferences) will be stored in a scalable database solution (e.g., PostgreSQL, MySQL, or a managed cloud database like Supabase/Firebase). This allows for efficient querying and management of off-chain user-specific data that doesn't need to reside on the ledger.
*   **Contract State (Balances, Subscriptions, NFT Ownership):** Stored directly on the Stellar ledger within the Soroban smart contracts. This is the immutable source of truth for all on-chain assets and states, ensuring transparency and verifiability.
*   **Session Management:** Handled by the Next.js backend using secure, HTTP-only cookies or tokens, initiated after successful passkey authentication.

### b. Contract State Storage:

*   **Platform Contract:** Will use Soroban's storage capabilities (e.g., `Env.storage().persistent()`) to store:
    *   `DataKey::UserBalance(Address)`: Mapping of user addresses (their smart wallet contract ID or public key) to their app balance (e.g., a custom token representing deposited XLM).
    *   `DataKey::Subscription(Address /*User*/, Address /*Creator*/)`: Mapping to store subscription status and expiry.
    *   `DataKey::Creator(Address)`: Information about registered creators.
*   **NFT Contract:** Will use Soroban's standard NFT contract patterns, storing:
    *   `DataKey::Owner(u32 /*Token ID*/)`: Mapping token ID to owner address (which could be a user's smart wallet contract ID).
    *   `DataKey::TokenURI(u32 /*Token ID*/)`: Mapping token ID to metadata URI (e.g., an IPFS link or a URL to a JSON file following NFT metadata standards).
    *   `DataKey::Admin`: The administrative address for the NFT contract, responsible for configuration or upgrades.

### c. Emitted Events (Soroban Contracts):

*   **Platform Contract:**
    *   `deposit(user: Address, amount: u128)`
    *   `withdraw(user: Address, amount: u128)`
    *   `subscribed(user: Address, creator: Address, expires_on: u64)`
    *   `tipped(tipper: Address, creator: Address, amount: u128, memo: String)`
*   **NFT Contract (examples, can follow established standards like ERC721/NEP-17 if applicable or define custom ones):**
    *   `mint(operator: Address, to: Address, token_id: u32, token_uri: String)`
    *   `transfer(operator: Address, from: Address, to: Address, token_id: u32)`
    *   `approval(owner: Address, approved: Address, token_id: u32)` // Or ApprovalForAll

    These events are essential for off-chain services and the frontend to react to state changes. An event indexer service (conceptually similar to Zephyr from `passkey-kit` or a custom solution leveraging Stellar network data providers) will listen for these events to build and maintain a readable history of actions, user timelines, and application state without constantly querying contracts directly.

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

## 5. Challenges Overcome & Design Considerations

*   **Smart Wallet Lifecycle Management:** Ensuring each new user with a passkey has a corresponding smart wallet deployed or associated correctly is a key design consideration. The `passkey-kit` library is instrumental in simplifying this process by linking passkey credentials to smart wallet control and deployment.
*   **Transaction Atomicity & Composability:** For complex actions like an NFT purchase (which involves payment and minting), ensuring atomicity is critical. This is achieved by designing smart contract functions that orchestrate multiple sub-operations within a single transaction, or by leveraging the user's smart wallet to execute a predefined sequence of authorized calls.
*   **Efficient State Retrieval and Event Indexing:** To provide a responsive user experience (e.g., for user action timelines, up-to-date balances), relying solely on direct contract state queries can be inefficient. The design incorporates an event indexing layer that processes and stores contract-emitted events. This allows the frontend to quickly fetch historical data and real-time updates.
*   **Seamless User Experience for Contract Interactions:** Abstracting away blockchain complexities (like transaction fees, though Stellar's are low, and confirmation delays) is paramount. Launchtube assists with reliable transaction submission, while PasskeyKit provides a familiar signing experience. The frontend design focuses on clear, immediate feedback and optimistic updates where appropriate.
*   **Synchronization of On-Chain and Off-Chain Data:** Maintaining consistency between data stored in smart contracts and any off-chain databases (e.g., user profiles) requires careful event handling and synchronization logic.

## 6. Future Considerations (Post-Hackathon)

*   Full Zephyr indexer integration for robust event tracking.
*   Creator-defined subscription tiers and benefits.
*   Decentralized storage for premium content (e.g., IPFS for NFT assets).
*   More sophisticated smart wallet policies.
*   Social features (comments, likes).

---
*This document is a work in progress and will be updated throughout the hackathon.* 