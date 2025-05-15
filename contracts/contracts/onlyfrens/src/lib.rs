#![no_std]
use soroban_sdk::String as SorobanString;
use core::clone::Clone;
use core::convert::{Into, From};
use core::iter::{Iterator, ExactSizeIterator};
use core::option::Option;
use core::result::Result;
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env
};

// Import your NFT contract client here (ensure correct path)
mod nft_client;
use nft_client::Client as NFTContractClient;

const ROYALTY_BPS: i128 = 1000; // 10% royalty for platform
const BASIS_POINTS: i128 = 10000;
const MIN_XLM: i128 = 1_0000000; // 1 XLM (stroops)

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
    Balance(Address),
    NftContract,
}

#[contract]
pub struct PlatformContract;

#[contractimpl]
impl PlatformContract {
    // Set up contract owner and NFT contract address
    pub fn initialize(env: Env, owner: Address, nft_contract_id: Address) {
        if env.storage().instance().has(&DataKey::Owner) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::NftContract, &nft_contract_id);
    }

    // Simulated deposit (backend or future on-chain transfer)
    pub fn deposit(env: Env, user: Address, amount: i128) {
        user.require_auth();
        if amount < MIN_XLM {
            panic!("Minimum deposit is 1 XLM");
        }
        let key = DataKey::Balance(user.clone());
        let mut bal: i128 = env.storage().instance().get(&key).unwrap_or(0);
        bal += amount;
        env.storage().instance().set(&key, &bal);
        env.events().publish(
            (symbol_short!("deposit"), user.clone()),
            amount,
        );
    }

    // Query user balance
    pub fn get_balance(env: Env, user: Address) -> i128 {
        env.storage().instance().get(&DataKey::Balance(user)).unwrap_or(0)
    }

    // Spend (admin action) - tips, subs, NFT buys; splits royalty
    pub fn admin_spend(
        env: Env,
        from_user: Address,
        to_creator: Address,
        amount: i128,
        tx_type: SorobanString,
        product_id: Option<SorobanString>,
    ) {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();

        if amount < MIN_XLM {
            panic!("Min spend 1 XLM");
        }
        let from_key = DataKey::Balance(from_user.clone());
        let mut from_bal: i128 = env.storage().instance().get(&from_key).unwrap_or(0);
        if from_bal < amount {
            panic!("Insufficient balance");
        }
        from_bal -= amount;
        env.storage().instance().set(&from_key, &from_bal);

        let creator_amt = amount * (BASIS_POINTS - ROYALTY_BPS) / BASIS_POINTS;
        let platform_amt = amount - creator_amt;

        // Credit creator
        let creator_key = DataKey::Balance(to_creator.clone());
        let mut creator_bal: i128 = env.storage().instance().get(&creator_key).unwrap_or(0);
        creator_bal += creator_amt;
        env.storage().instance().set(&creator_key, &creator_bal);

        // Credit platform/owner
        let platform_key = DataKey::Balance(owner.clone());
        let mut plat_bal: i128 = env.storage().instance().get(&platform_key).unwrap_or(0);
        plat_bal += platform_amt;
        env.storage().instance().set(&platform_key, &plat_bal);

        env.events().publish(
            (symbol_short!("spend"), from_user.clone(), to_creator.clone(), tx_type.clone()),
            (amount, product_id),
        );
    }

    // Mint NFT by calling external NFT contract
    pub fn mint_nft(
        env: Env,
        to: Address,
        name: SorobanString,
        description: SorobanString,
        image_url: SorobanString,
    ) -> u32 {
        let owner: Address = env.storage().instance().get(&DataKey::Owner).unwrap();
        owner.require_auth();
        let nft_contract_id: Address = env.storage().instance().get(&DataKey::NftContract).unwrap();

        let nft_client = NFTContractClient::new(&env, &nft_contract_id);
        let token_id = nft_client.mint(&to, &name, &description, &image_url);

        env.events().publish(
            (symbol_short!("minted"), to.clone()),
            token_id,
        );
        token_id
    }

    // Simulated withdraw (real payment: see SDK 22 native asset docs)
    pub fn withdraw(env: Env, user: Address, amount: i128) {
        user.require_auth();
        if amount < MIN_XLM {
            panic!("Min withdraw is 1 XLM");
        }
        let key = DataKey::Balance(user.clone());
        let mut bal: i128 = env.storage().instance().get(&key).unwrap_or(0);
        if bal < amount {
            panic!("Insufficient balance");
        }
        bal -= amount;
        env.storage().instance().set(&key, &bal);
        env.events().publish(
            (symbol_short!("withdraw"), user.clone()),
            amount,
        );
    }
}
