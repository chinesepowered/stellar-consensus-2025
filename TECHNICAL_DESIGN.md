# OnlyFrens - Technical Design Document

## 1. Overview

OnlyFrens is a Next.js web application that enables users to support creators through subscriptions, tips, and NFT purchases, leveraging Stellar's Passkey-Kit for secure, passwordless authentication and Launchtube for reliable transaction submission to the Stellar network. The platform will feature a prominent creator, allow user interactions via mock Soroban contract calls, and display user activity.

## 2. System Architecture & Components

```mermaid
graph TD
    A[User Browser] --> B{Next.js Frontend (Pages/Components)};
    B --> C{Next.js API Routes (Backend)};
    C --> D[Passkey-Kit Server];
    C --> E[Launchtube Service];
    E --> F[Stellar Testnet];
    B --> G[Passkey-Kit Client];
    G --> D;

    subgraph "Frontend (Client-Side)"
        B
        G
    end

    subgraph "Backend (Server-Side)"
        C
        D
    end

    subgraph "External Services"
        E
        F
    end
```

### Major Components:

1.  **Next.js Frontend (`pages/`, `components/`):**
    *   **Function:** Renders the user interface, handles user input, and manages client-side state.
    *   **Details:** Includes pages for the featured creator, user profile, and components for displaying creator info, NFTs, user actions, and navigation. Uses React Context or SWR for state management (wallet, auth, user data).

2.  **Next.js API Routes (`pages/api/`):**
    *   **Function:** Handles backend logic, including interactions with Passkey-Kit server, Launchtube, and (mocked) Stellar smart contracts.
    *   **Details:** Endpoints for subscribing, tipping, minting NFTs. These will construct and prepare transactions.

3.  **Passkey-Kit (`passkey-kit` library):**
    *   **Function:** Manages user authentication (registration/login) using WebAuthn passkeys and signs transactions on the client-side.
    *   **Client-Side (`PasskeyKit`):** Interacts with browser WebAuthn APIs, manages passkey credentials, and signs transactions.
    *   **Server-Side (`PasskeyServer` - conceptual for this hackathon, as we might rely more on client-side signing with Launchtube relaying):** Potentially for validating challenges or managing server-side aspects of passkeys if needed, though the primary focus will be client-side signing for user actions.

4.  **Launchtube:**
    *   **Function:** A service that takes signed transactions (XDRs) and reliably submits them to the Stellar network, handling retries and sequencing.
    *   **Details:** Our API routes will send transactions signed by Passkey-Kit to Launchtube.

5.  **Stellar Network (Testnet):**
    *   **Function:** The decentralized ledger where (mock) smart contracts are deployed and transactions are recorded.

6.  **Mock Soroban Contracts (Conceptual):**
    *   **Function:** Represent the on-chain logic for subscriptions, tips, and NFT minting.
    *   **Details:** For the hackathon, we will use placeholder contract IDs and simulate interactions. Actual contract development in Rust is outside the MVP scope but noted for future work.

### Component Interactions:

1.  **User Authentication:** User interacts with Frontend -> Frontend uses `PasskeyKit` (client) to register/login -> `PasskeyKit` communicates with browser WebAuthn and potentially a `PasskeyServer` component (if deeper integration is chosen, or simple client-side for MVP).
2.  **Creator Support Actions (Subscribe, Tip, Buy NFT):**
    *   User initiates action on Frontend.
    *   Frontend calls a Next.js API Route.
    *   API Route prepares the (mock) contract call details.
    *   The transaction details are sent back to the client or handled such that `PasskeyKit` (client) can sign it.
    *   Signed transaction (XDR) is sent from the API route (or directly from client if architected that way) to Launchtube.
    *   Launchtube submits the transaction to the Stellar Testnet.
    *   Frontend updates to reflect the action.

## 3. Design Choices & Tradeoffs

### Storage:
-   **Client-Side State:** React Context or SWR will be used for managing application state like user authentication status, wallet information, and fetched data. This is suitable for a dynamic single-page application feel.
-   **Passkey Credentials:** Stored securely by the browser and operating system via WebAuthn.
-   **User Data / Creator Profiles:** For the hackathon, this will be hardcoded/mocked data (`lib/data.ts`). In a production system, a database (e.g., PostgreSQL, MongoDB) would be used.
-   **NFT Metadata:** Initially hardcoded. In a real scenario, this could be stored on IPFS or a dedicated metadata server.

### Contract State:
-   For the MVP, we will simulate contract state changes on the client-side or through mock API responses. Real Soroban contracts would store state on the Stellar ledger (e.g., who is subscribed, NFT ownership).

### Event Emission:
-   We will not be implementing actual contract event emission and indexing for the MVP. User actions will be tracked in client-side state and displayed in a user timeline. In a production system, Soroban contract events would be emitted for actions like `Subscribed`, `Tipped`, `NFTMinted` and an indexer (like Mercury Zephyr, mentioned in the Passkey-Kit repo) would track these.

### Passkeys Implementation:
-   We will use the `passkey-kit` library ([https://github.com/kalepail/passkey-kit](https://github.com/kalepail/passkey-kit)).
-   **Registration:** User creates a passkey associated with their browser/device.
-   **Login:** User authenticates using their existing passkey.
-   **Transaction Signing:** User actions requiring on-chain interaction (subscribe, tip, mint) will prompt the user to sign the transaction using their passkey. The `PasskeyKit` client-side SDK will handle the signing process, producing a signed XDR.
-   The app will primarily leverage client-side signing capabilities of `PasskeyKit` to create a seamless UX, where the user authorizes transactions directly.

### Why Stellar & Passkeys?
-   **Stellar:** Chosen for its speed, low transaction costs, and suitability for payments and asset issuance (NFTs). Soroban smart contracts offer powerful capabilities for building decentralized applications.
-   **Passkeys (via Passkey-Kit):** Provides a Web2-like user experience by eliminating the need for traditional passwords or complex seed phrases. This significantly lowers the barrier to entry for users new to web3, enhances security, and simplifies the authentication and transaction authorization flow.

## 4. Challenges Overcome (Anticipated & During Development)
*(To be filled in as we develop)*
-   Integrating Passkey-Kit for the first time.
-   Understanding the transaction flow with Launchtube.
-   Setting up the Next.js project structure for scalability.
-   Managing client-side state effectively for a responsive UI.
-   Simulating Soroban contract interactions without actual deployment for the MVP.

---
*This document is a work in progress and will be updated throughout the hackathon.* 