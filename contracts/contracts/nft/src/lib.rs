#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, String as SorobanString, Symbol,
};

#[derive(Clone)]
#[contracttype]
pub struct NFTMetadata {
    pub name: SorobanString,
    pub description: SorobanString,
    pub image_url: SorobanString,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    TokenOwner(u32),
    TokenMetadata(u32),
    TotalSupply,
}

#[contract]
pub struct NftContract;

#[contractimpl]
impl NftContract {
    // Initialize the contract with an admin address
    pub fn initialize(env: Env, admin: Address) {
        // Ensure contract is not already initialized
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("contract has already been initialized");
        }

        // Set the admin address
        env.storage().instance().set(&DataKey::Admin, &admin);
        
        // Initialize total supply to 0
        env.storage().instance().set(&DataKey::TotalSupply, &0u32);
    }

    // Mint a new NFT
    pub fn mint(
        env: Env,
        to: Address,
        name: SorobanString,
        description: SorobanString,
        image_url: SorobanString,
    ) -> u32 {
        // Only admin can mint
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        // Get and update the total supply
        let mut total_supply: u32 = env.storage().instance().get(&DataKey::TotalSupply).unwrap();
        total_supply += 1;
        let token_id = total_supply;

        // Update total supply
        env.storage().instance().set(&DataKey::TotalSupply, &total_supply);

        // Store token metadata
        let metadata = NFTMetadata {
            name,
            description,
            image_url,
        };
        env.storage().instance().set(&DataKey::TokenMetadata(token_id), &metadata);

        // Set token owner
        env.storage().instance().set(&DataKey::TokenOwner(token_id), &to);

        // Emit mint event
        env.events()
            .publish(
                (Symbol::new(&env, "mint"), to),
                token_id,
            );

        token_id
    }

    // Transfer NFT to another address
    pub fn transfer(env: Env, from: Address, to: Address, token_id: u32) {
        // Verify token exists
        if !env.storage().instance().has(&DataKey::TokenOwner(token_id)) {
            panic!("token does not exist");
        }

        // Verify that the sender is the current owner
        let owner: Address = env.storage().instance().get(&DataKey::TokenOwner(token_id)).unwrap();
        if owner != from {
            panic!("sender is not the token owner");
        }

        // Require authorization from the sender
        from.require_auth();

        // Update token owner
        env.storage().instance().set(&DataKey::TokenOwner(token_id), &to);

        // Emit transfer event
        env.events()
            .publish(
                (Symbol::new(&env, "transfer"), from, to),
                token_id,
            );
    }

    // Get the total supply of NFTs
    pub fn total_supply(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0u32)
    }

    // Get the owner of a token by ID
    pub fn owner_of(env: Env, token_id: u32) -> Address {
        if !env.storage().instance().has(&DataKey::TokenOwner(token_id)) {
            panic!("token does not exist");
        }
        env.storage().instance().get(&DataKey::TokenOwner(token_id)).unwrap()
    }

    // Get the metadata of a token by ID
    pub fn token_metadata(env: Env, token_id: u32) -> NFTMetadata {
        if !env.storage().instance().has(&DataKey::TokenMetadata(token_id)) {
            panic!("token does not exist");
        }
        env.storage().instance().get(&DataKey::TokenMetadata(token_id)).unwrap()
    }

    // Get the URI of a token (which is just the image_url in this case)
    pub fn token_uri(env: Env, token_id: u32) -> SorobanString {
        if !env.storage().instance().has(&DataKey::TokenMetadata(token_id)) {
            panic!("token does not exist");
        }
        let metadata: NFTMetadata = env.storage().instance().get(&DataKey::TokenMetadata(token_id)).unwrap();
        metadata.image_url
    }

    // Get the admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_nft_contract() {
        let env = Env::default();
        let contract_id = env.register_contract(None, NftContract);
        let client = NftContractClient::new(&env, &contract_id);

        // Test accounts
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);

        // Initialize the contract
        client.initialize(&admin);
        assert_eq!(client.get_admin(), admin);
        assert_eq!(client.total_supply(), 0);

        // Mint an NFT
        env.mock_all_auths();
        let token_id = client.mint(
            &user1,
            &SorobanString::from_str(&env, "Cool NFT"),
            &SorobanString::from_str(&env, "A very cool NFT for testing"),
            &SorobanString::from_str(&env, "https://example.com/nft.png"),
        );
        assert_eq!(token_id, 1);
        assert_eq!(client.total_supply(), 1);
        assert_eq!(client.owner_of(&token_id), user1);

        // Check metadata
        let metadata = client.token_metadata(&token_id);
        assert_eq!(metadata.name, SorobanString::from_str(&env, "Cool NFT"));
        assert_eq!(metadata.description, SorobanString::from_str(&env, "A very cool NFT for testing"));
        assert_eq!(metadata.image_url, SorobanString::from_str(&env, "https://example.com/nft.png"));

        // Check URI
        let uri = client.token_uri(&token_id);
        assert_eq!(uri, SorobanString::from_str(&env, "https://example.com/nft.png"));

        // Transfer NFT
        env.mock_all_auths();
        client.transfer(&user1, &user2, &token_id);
        assert_eq!(client.owner_of(&token_id), user2);

        // Mint another NFT
        env.mock_all_auths();
        let token_id2 = client.mint(
            &user2,
            &SorobanString::from_str(&env, "Second NFT"),
            &SorobanString::from_str(&env, "Another cool NFT"),
            &SorobanString::from_str(&env, "https://example.com/nft2.png"),
        );
        assert_eq!(token_id2, 2);
        assert_eq!(client.total_supply(), 2);
        assert_eq!(client.owner_of(&token_id2), user2);
    }
}