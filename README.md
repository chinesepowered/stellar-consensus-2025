# OnlyFrens

OnlyFrens is a web3 platform designed to support uplifting creators, allowing users to subscribe, tip, and purchase exclusive content via NFTs. It aims to provide a seamless web2-like user experience by leveraging Stellar's passkey technology.

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
