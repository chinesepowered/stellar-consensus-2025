#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol, BytesN};

#[contract]
pub struct NFTContract;

#[contracttype]
#[derive(Clone)]
pub struct NFTMetadata {
    name: String,
    description: String,
    image_url: String,
}

#[contractimpl]
impl NFTContract {
    pub fn initialize(env: Env, admin: Address) {
        env.storage().instance().set(&Symbol::short("admin"), &admin);
        env.storage().instance().set(&Symbol::short("token_count"), &0u32);
    }

    pub fn mint(
        env: Env,
        to: Address,
        name: String,
        description: String,
        image_url: String,
    ) -> u32 {
        let admin: Address = env.storage().instance().get(&Symbol::short("admin")).unwrap();
        
        // Check authorization
        admin.require_auth();
        
        let token_count: u32 = env.storage().instance().get(&Symbol::short("token_count")).unwrap();
        let new_token_id = token_count + 1;

        // Store token metadata
        let metadata = NFTMetadata {
            name,
            description,
            image_url,
        };
        
        // Create token key using numeric id
        let token_key = Symbol::new(&env, &["token_", &new_token_id.to_string()].concat());
        env.storage().instance().set(&token_key, &metadata);
        
        // Set token ownership
        let owner_key = Symbol::new(&env, &["owner_", &new_token_id.to_string()].concat());
        env.storage().instance().set(&owner_key, &to);
        
        // Update token count
        env.storage().instance().set(&Symbol::short("token_count"), &new_token_id);
        
        new_token_id
    }

    pub fn transfer(env: Env, from: Address, to: Address, token_id: u32) {
        from.require_auth();
        
        let owner_key = Symbol::new(&env, &["owner_", &token_id.to_string()].concat());
        let current_owner: Address = env.storage().instance().get(&owner_key).unwrap();
        
        assert!(current_owner == from, "sender is not the owner");
        
        // Update ownership
        env.storage().instance().set(&owner_key, &to);
    }

    pub fn owner_of(env: Env, token_id: u32) -> Address {
        let owner_key = Symbol::new(&env, &["owner_", &token_id.to_string()].concat());
        env.storage().instance().get(&owner_key).unwrap()
    }

    pub fn token_metadata(env: Env, token_id: u32) -> NFTMetadata {
        let token_key = Symbol::new(&env, &["token_", &token_id.to_string()].concat());
        env.storage().instance().get(&token_key).unwrap()
    }

    pub fn total_supply(env: Env) -> u32 {
        env.storage().instance().get(&Symbol::short("token_count")).unwrap()
    }
    
    // Optional: Add token URI functionality
    pub fn token_uri(env: Env, token_id: u32) -> String {
        let metadata = Self::token_metadata(env.clone(), token_id);
        metadata.image_url
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, vec, Env};

    #[test]
    fn test_nft_contract() {
        let env = Env::default();
        let contract_id = env.register_contract(None, NFTContract);
        let client = NFTContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(&admin);
        
        // Test minting
        env.mock_all_auths();
        let token_id = client.mint(
            &admin,
            &user,
            &String::from_str(&env, "My NFT"),
            &String::from_str(&env, "A test NFT"),
            &String::from_str(&env, "https://example.com/image.jpg"),
        );
        
        assert_eq!(token_id, 1);
        
        // Test ownership
        let owner = client.owner_of(&token_id);
        assert_eq!(owner, user);
        
        // Test metadata
        let metadata = client.token_metadata(&token_id);
        assert_eq!(metadata.name, String::from_str(&env, "My NFT"));
        
        // Test transfer
        let new_user = Address::generate(&env);
        env.mock_all_auths();
        client.transfer(&user, &new_user, &token_id);
        
        let new_owner = client.owner_of(&token_id);
        assert_eq!(new_owner, new_user);
        
        // Test total supply
        let supply = client.total_supply();
        assert_eq!(supply, 1);
    }
}