#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, 
    Address, BytesN, Env, Map, Vec, Symbol, 
    token::{Client as TokenClient, StellarAssetClient},
    xdr::Asset
};

// Storage keys for contract data
const ADMINS: &str = "admins";
const CREATORS: &str = "creators";
const SUBSCRIBERS: &str = "subscribers";
const CONTENT_PURCHASES: &str = "content_purchases";
const PAYMENT_TOKEN: &str = "payment_token";
const PLATFORM_FEE: &str = "platform_fee";
const PLATFORM_WALLET: &str = "platform_wallet";

// Ledger TTL constants
const DAY_IN_LEDGERS: u32 = 17280; // Approx 5 seconds per ledger, 24 hours = 17280 ledgers
const MONTH_IN_LEDGERS: u32 = 518400; // 30 days in ledgers

#[contracttype]
#[derive(Clone)]
pub struct Creator {
    id: Address,
    monthly_subscription_fee: i128,
    is_active: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct Subscriber {
    user_id: Address,
    creator_id: Address,
    subscription_end_ledger: u32,
    active: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct ContentItem {
    content_id: BytesN<32>, // Usually a hash of the content ID from offchain database
    creator_id: Address,
    price: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct Purchase {
    user_id: Address,
    content_id: BytesN<32>,
    purchased_at_ledger: u32,
}

#[contract]
pub struct SubscriptionPlatform;

#[contractimpl]
impl SubscriptionPlatform {
    // Initialize the contract
    pub fn initialize(
        env: Env, 
        admin: Address, 
        payment_token: Address, 
        platform_fee_percentage: u32, 
        platform_wallet: Address
    ) {
        // Verify platform fee is reasonable (0-30%)
        if platform_fee_percentage > 30 {
            panic!("Platform fee cannot exceed 30%");
        }
        
        // Initialize admin accounts
        let mut admins = Vec::new(&env);
        admins.push_back(admin);
        env.storage().instance().set(&Symbol::new(&env, ADMINS), &admins);
        
        // Set platform token, fee and wallet
        env.storage().instance().set(&Symbol::new(&env, PAYMENT_TOKEN), &payment_token);
        env.storage().instance().set(&Symbol::new(&env, PLATFORM_FEE), &platform_fee_percentage);
        env.storage().instance().set(&Symbol::new(&env, PLATFORM_WALLET), &platform_wallet);
        
        // Initialize empty storage for creators and subscriptions
        let creators = Map::<Address, Creator>::new(&env);
        env.storage().instance().set(&Symbol::new(&env, CREATORS), &creators);
        
        let subscribers = Map::<(Address, Address), Subscriber>::new(&env);
        env.storage().instance().set(&Symbol::new(&env, SUBSCRIBERS), &subscribers);
        
        let purchases = Map::<(Address, BytesN<32>), Purchase>::new(&env);
        env.storage().instance().set(&Symbol::new(&env, CONTENT_PURCHASES), &purchases);
    }
    
    // Admin Functions
    
    // Add a new admin
    pub fn add_admin(env: Env, admin: Address, new_admin: Address) {
        // Verify caller is an admin
        Self::require_admin(&env, &admin);
        
        new_admin.require_auth();
        
        let mut admins: Vec<Address> = env.storage().instance().get(&Symbol::new(&env, ADMINS)).unwrap();
        if !admins.contains(&new_admin) {
            admins.push_back(new_admin);
            env.storage().instance().set(&Symbol::new(&env, ADMINS), &admins);
        }
    }
    
    // Remove an admin
    pub fn remove_admin(env: Env, admin: Address, admin_to_remove: Address) {
        // Verify caller is an admin
        Self::require_admin(&env, &admin);
        
        let mut admins: Vec<Address> = env.storage().instance().get(&Symbol::new(&env, ADMINS)).unwrap();
        
        // Check we're not removing the last admin
        if admins.len() <= 1 {
            panic!("Cannot remove the last admin");
        }
        
        let mut new_admins = Vec::new(&env);
        for i in 0..admins.len() {
            let current_admin = admins.get(i).unwrap();
            if current_admin != admin_to_remove {
                new_admins.push_back(current_admin);
            }
        }
        
        env.storage().instance().set(&Symbol::new(&env, ADMINS), &new_admins);
    }
    
    // Set platform fee percentage
    pub fn set_platform_fee(env: Env, admin: Address, new_fee_percentage: u32) {
        // Verify caller is an admin
        Self::require_admin(&env, &admin);
        
        // Verify platform fee is reasonable (0-30%)
        if new_fee_percentage > 30 {
            panic!("Platform fee cannot exceed 30%");
        }
        
        env.storage().instance().set(&Symbol::new(&env, PLATFORM_FEE), &new_fee_percentage);
    }
    
    // Set platform wallet
    pub fn set_platform_wallet(env: Env, admin: Address, new_wallet: Address) {
        // Verify caller is an admin
        Self::require_admin(&env, &admin);
        
        new_wallet.require_auth();
        
        env.storage().instance().set(&Symbol::new(&env, PLATFORM_WALLET), &new_wallet);
    }
    
    // Creator Management
    
    // Register a new creator
    pub fn register_creator(env: Env, admin: Address, creator_id: Address, monthly_subscription_fee: i128) {
        // Verify caller is an admin
        Self::require_admin(&env, &admin);
        
        creator_id.require_auth();
        
        if monthly_subscription_fee <= 0 {
            panic!("Subscription fee must be positive");
        }
        
        let mut creators: Map<Address, Creator> = env.storage().instance().get(&Symbol::new(&env, CREATORS)).unwrap();
        
        if creators.contains_key(&creator_id) {
            panic!("Creator already registered");
        }
        
        let creator = Creator {
            id: creator_id.clone(),
            monthly_subscription_fee,
            is_active: true,
        };
        
        creators.set(creator_id, creator);
        env.storage().instance().set(&Symbol::new(&env, CREATORS), &creators);
    }
    
    // Update creator's subscription fee
    pub fn update_subscription_fee(env: Env, creator_id: Address, new_fee: i128) {
        creator_id.require_auth();
        
        if new_fee <= 0 {
            panic!("Subscription fee must be positive");
        }
        
        let mut creators: Map<Address, Creator> = env.storage().instance().get(&Symbol::new(&env, CREATORS)).unwrap();
        
        if !creators.contains_key(&creator_id) {
            panic!("Creator not registered");
        }
        
        let mut creator = creators.get(creator_id.clone()).unwrap();
        creator.monthly_subscription_fee = new_fee;
        creators.set(creator_id.clone(), creator);
        
        env.storage().instance().set(&Symbol::new(&env, CREATORS), &creators);
    }
    
    // Toggle creator active status
    pub fn toggle_creator_status(env: Env, creator_id: Address) {
        creator_id.require_auth();
        
        let mut creators: Map<Address, Creator> = env.storage().instance().get(&Symbol::new(&env, CREATORS)).unwrap();
        
        if !creators.contains_key(&creator_id) {
            panic!("Creator not registered");
        }
        
        let mut creator = creators.get(creator_id.clone()).unwrap();
        creator.is_active = !creator.is_active;
        creators.set(creator_id.clone(), creator);
        
        env.storage().instance().set(&Symbol::new(&env, CREATORS), &creators);
    }
    
    // Subscription Management
    
    // Subscribe to a creator
    pub fn subscribe(env: Env, user_id: Address, creator_id: Address, months: u32) {
        user_id.require_auth();
        
        if months == 0 {
            panic!("Subscription months must be greater than 0");
        }
        
        // Verify creator exists and is active
        let creators: Map<Address, Creator> = env.storage().instance().get(&Symbol::new(&env, CREATORS)).unwrap();
        
        if !creators.contains_key(&creator_id) {
            panic!("Creator not found");
        }
        
        let creator = creators.get(creator_id.clone()).unwrap();
        
        if !creator.is_active {
            panic!("Creator is not active");
        }
        
        // Calculate subscription fee
        let subscription_fee = creator.monthly_subscription_fee * (months as i128);
        
        // Calculate platform fee
        let platform_fee_percentage: u32 = env.storage().instance().get(&Symbol::new(&env, PLATFORM_FEE)).unwrap();
        let platform_fee = (subscription_fee * platform_fee_percentage as i128) / 100;
        
        // Calculate creator's share
        let creator_share = subscription_fee - platform_fee;
        
        // Transfer tokens
        let payment_token: Address = env.storage().instance().get(&Symbol::new(&env, PAYMENT_TOKEN)).unwrap();
        let platform_wallet: Address = env.storage().instance().get(&Symbol::new(&env, PLATFORM_WALLET)).unwrap();
        
        let token_client = TokenClient::new(&env, &payment_token);
        
        // Transfer platform fee to platform wallet
        if platform_fee > 0 {
            token_client.transfer(&user_id, &platform_wallet, &platform_fee);
        }
        
        // Transfer creator share to creator
        if creator_share > 0 {
            token_client.transfer(&user_id, &creator_id, &creator_share);
        }
        
        // Update subscription data
        let mut subscribers: Map<(Address, Address), Subscriber> = env.storage().instance().get(&Symbol::new(&env, SUBSCRIBERS)).unwrap();
        
        let current_ledger = env.ledger().sequence();
        let subscription_duration_in_ledgers = months as u32 * MONTH_IN_LEDGERS;
        
        let key = (user_id.clone(), creator_id.clone());
        
        if subscribers.contains_key(&key) {
            // Extend existing subscription
            let mut subscriber = subscribers.get(key.clone()).unwrap();
            
            // If subscription is expired, start from current ledger
            if subscriber.subscription_end_ledger <= current_ledger {
                subscriber.subscription_end_ledger = current_ledger + subscription_duration_in_ledgers;
            } else {
                // Extend existing subscription
                subscriber.subscription_end_ledger += subscription_duration_in_ledgers;
            }
            
            subscriber.active = true;
            subscribers.set(key, subscriber);
        } else {
            // Create new subscription
            let subscriber = Subscriber {
                user_id: user_id.clone(),
                creator_id: creator_id.clone(),
                subscription_end_ledger: current_ledger + subscription_duration_in_ledgers,
                active: true,
            };
            
            subscribers.set(key, subscriber);
        }
        
        env.storage().instance().set(&Symbol::new(&env, SUBSCRIBERS), &subscribers);
    }
    
    // Cancel a subscription
    pub fn cancel_subscription(env: Env, user_id: Address, creator_id: Address) {
        user_id.require_auth();
        
        let mut subscribers: Map<(Address, Address), Subscriber> = env.storage().instance().get(&Symbol::new(&env, SUBSCRIBERS)).unwrap();
        
        let key = (user_id.clone(), creator_id.clone());
        
        if !subscribers.contains_key(&key) {
            panic!("Subscription not found");
        }
        
        let mut subscriber = subscribers.get(key.clone()).unwrap();
        subscriber.active = false;
        subscribers.set(key, subscriber);
        
        env.storage().instance().set(&Symbol::new(&env, SUBSCRIBERS), &subscribers);
    }
    
    // Check if user is subscribed to a creator
    pub fn is_subscribed(env: Env, user_id: Address, creator_id: Address) -> bool {
        let subscribers: Map<(Address, Address), Subscriber> = env.storage().instance().get(&Symbol::new(&env, SUBSCRIBERS)).unwrap();
        
        let key = (user_id.clone(), creator_id.clone());
        
        if !subscribers.contains_key(&key) {
            return false;
        }
        
        let subscriber = subscribers.get(key).unwrap();
        
        // Check if subscription is active and not expired
        let current_ledger = env.ledger().sequence();
        return subscriber.active && subscriber.subscription_end_ledger > current_ledger;
    }
    
    // Get subscription details
    pub fn get_subscription(env: Env, user_id: Address, creator_id: Address) -> Option<Subscriber> {
        let subscribers: Map<(Address, Address), Subscriber> = env.storage().instance().get(&Symbol::new(&env, SUBSCRIBERS)).unwrap();
        
        let key = (user_id.clone(), creator_id.clone());
        
        if !subscribers.contains_key(&key) {
            return None;
        }
        
        Some(subscribers.get(key).unwrap())
    }
    
    // Content Purchase Management
    
    // Purchase exclusive content
    pub fn purchase_content(env: Env, user_id: Address, creator_id: Address, content_id: BytesN<32>, price: i128) {
        user_id.require_auth();
        
        // Verify creator exists and is active
        let creators: Map<Address, Creator> = env.storage().instance().get(&Symbol::new(&env, CREATORS)).unwrap();
        
        if !creators.contains_key(&creator_id) {
            panic!("Creator not found");
        }
        
        let creator = creators.get(creator_id.clone()).unwrap();
        
        if !creator.is_active {
            panic!("Creator is not active");
        }
        
        if price <= 0 {
            panic!("Price must be positive");
        }
        
        // Check if user already purchased this content
        let purchases: Map<(Address, BytesN<32>), Purchase> = env.storage().instance().get(&Symbol::new(&env, CONTENT_PURCHASES)).unwrap();
        
        let key = (user_id.clone(), content_id.clone());
        
        if purchases.contains_key(&key) {
            panic!("Content already purchased");
        }
        
        // Calculate platform fee
        let platform_fee_percentage: u32 = env.storage().instance().get(&Symbol::new(&env, PLATFORM_FEE)).unwrap();
        let platform_fee = (price * platform_fee_percentage as i128) / 100;
        
        // Calculate creator's share
        let creator_share = price - platform_fee;
        
        // Transfer tokens
        let payment_token: Address = env.storage().instance().get(&Symbol::new(&env, PAYMENT_TOKEN)).unwrap();
        let platform_wallet: Address = env.storage().instance().get(&Symbol::new(&env, PLATFORM_WALLET)).unwrap();
        
        let token_client = TokenClient::new(&env, &payment_token);
        
        // Transfer platform fee to platform wallet
        if platform_fee > 0 {
            token_client.transfer(&user_id, &platform_wallet, &platform_fee);
        }
        
        // Transfer creator share to creator
        if creator_share > 0 {
            token_client.transfer(&user_id, &creator_id, &creator_share);
        }
        
        // Record the purchase
        let mut purchases: Map<(Address, BytesN<32>), Purchase> = env.storage().instance().get(&Symbol::new(&env, CONTENT_PURCHASES)).unwrap();
        
        let purchase = Purchase {
            user_id: user_id.clone(),
            content_id: content_id.clone(),
            purchased_at_ledger: env.ledger().sequence(),
        };
        
        purchases.set(key, purchase);
        
        env.storage().instance().set(&Symbol::new(&env, CONTENT_PURCHASES), &purchases);
    }
    
    // Check if user has purchased specific content
    pub fn has_purchased_content(env: Env, user_id: Address, content_id: BytesN<32>) -> bool {
        let purchases: Map<(Address, BytesN<32>), Purchase> = env.storage().instance().get(&Symbol::new(&env, CONTENT_PURCHASES)).unwrap();
        
        let key = (user_id.clone(), content_id.clone());
        
        return purchases.contains_key(&key);
    }
    
    // Get all user purchases
    pub fn get_user_purchases(env: Env, user_id: Address) -> Vec<Purchase> {
        let purchases: Map<(Address, BytesN<32>), Purchase> = env.storage().instance().get(&Symbol::new(&env, CONTENT_PURCHASES)).unwrap();
        
        let mut user_purchases = Vec::new(&env);
        
        for (key, purchase) in purchases.iter() {
            if key.0 == user_id {
                user_purchases.push_back(purchase);
            }
        }
        
        user_purchases
    }
    
    // Creator Information
    
    // Get creator details
    pub fn get_creator(env: Env, creator_id: Address) -> Option<Creator> {
        let creators: Map<Address, Creator> = env.storage().instance().get(&Symbol::new(&env, CREATORS)).unwrap();
        
        if !creators.contains_key(&creator_id) {
            return None;
        }
        
        Some(creators.get(creator_id).unwrap())
    }
    
    // Utility Functions
    
    // Helper to verify if an address is an admin
    fn require_admin(env: &Env, admin: &Address) {
        admin.require_auth();
        
        let admins: Vec<Address> = env.storage().instance().get(&Symbol::new(&env, ADMINS)).unwrap();
        
        if !admins.contains(admin) {
            panic!("Caller is not an admin");
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::{Address as AddressTestUtils, Ledger}, vec, BytesN};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let admin = Address::random(&env);
        let payment_token = Address::random(&env);
        let platform_wallet = Address::random(&env);
        
        let contract_id = env.register_contract(None, SubscriptionPlatform);
        let client = SubscriptionPlatformClient::new(&env, &contract_id);
        
        client.initialize(&admin, &payment_token, &10, &platform_wallet);
        
        // Verify admin is set
        let admins: Vec<Address> = env.storage().instance().get(&Symbol::new(&env, ADMINS)).unwrap();
        assert_eq!(admins.len(), 1);
        assert_eq!(admins.get(0).unwrap(), admin);
        
        // Verify payment token is set
        let stored_token: Address = env.storage().instance().get(&Symbol::new(&env, PAYMENT_TOKEN)).unwrap();
        assert_eq!(stored_token, payment_token);
        
        // Verify platform fee is set
        let stored_fee: u32 = env.storage().instance().get(&Symbol::new(&env, PLATFORM_FEE)).unwrap();
        assert_eq!(stored_fee, 10);
        
        // Verify platform wallet is set
        let stored_wallet: Address = env.storage().instance().get(&Symbol::new(&env, PLATFORM_WALLET)).unwrap();
        assert_eq!(stored_wallet, platform_wallet);
    }
    
    #[test]
    #[should_panic(expected = "Platform fee cannot exceed 30%")]
    fn test_initialize_with_high_fee() {
        let env = Env::default();
        let admin = Address::random(&env);
        let payment_token = Address::random(&env);
        let platform_wallet = Address::random(&env);
        
        let contract_id = env.register_contract(None, SubscriptionPlatform);
        let client = SubscriptionPlatformClient::new(&env, &contract_id);
        
        client.initialize(&admin, &payment_token, &31, &platform_wallet);
    }
    
    // Add more comprehensive tests for each function...
}