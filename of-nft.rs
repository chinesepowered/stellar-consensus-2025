#![no_std]

use soroban_sdk::{
    contractimpl, contracttype, symbol, vec, Address, Env, Symbol, String, Map, Vec,
};

#[contracttype]
pub struct TokenMetadata {
    pub name: String,
    pub description: String,
    pub image: String, // Typically an IPFS or HTTPS URL
    // You can add more fields as needed
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    NextTokenId,
    TokenOwner(u128),
    TokenMetadata(u128),
}

pub struct NFTContract;

#[contractimpl]
impl NFTContract {
    // One-time initialization: set contract owner
    pub fn initialize(env: Env, owner: Address) {
        assert!(!env.storage().has(&DataKey::Owner), "already initialized");
        owner.require_auth();
        env.storage().set(&DataKey::Owner, &owner);
        env.storage().set(&DataKey::NextTokenId, &0u128);
    }

    // Mint a new NFT to 'to' address, with metadata
    pub fn mint(env: Env, to: Address, metadata: TokenMetadata) -> u128 {
        let owner: Address = env.storage().get_unchecked(&DataKey::Owner).unwrap();
        owner.require_auth();

        // Assign new token id
        let mut token_id: u128 = env.storage().get_unchecked(&DataKey::NextTokenId).unwrap();
        env.storage().set(&DataKey::TokenOwner(token_id), &to);
        env.storage().set(&DataKey::TokenMetadata(token_id), &metadata);

        // Emit event
        env.events().publish(
            (symbol!("NFTMinted"),),
            (to.clone(), token_id),
        );

        token_id += 1;
        env.storage().set(&DataKey::NextTokenId, &token_id);

        token_id - 1 // return the minted token id
    }

    // Transfer NFT to new owner
    pub fn transfer(env: Env, token_id: u128, to: Address) {
        let owner: Address = env.storage().get_unchecked(&DataKey::TokenOwner(token_id)).unwrap();
        owner.require_auth();
        env.storage().set(&DataKey::TokenOwner(token_id), &to);

        env.events().publish(
            (symbol!("NFTTransferred"),),
            (owner, to, token_id),
        );
    }

    // Get token owner
    pub fn owner_of(env: Env, token_id: u128) -> Address {
        env.storage().get_unchecked(&DataKey::TokenOwner(token_id)).unwrap()
    }

    // Get token metadata
    pub fn token_metadata(env: Env, token_id: u128) -> TokenMetadata {
        env.storage().get_unchecked(&DataKey::TokenMetadata(token_id)).unwrap()
    }
}
