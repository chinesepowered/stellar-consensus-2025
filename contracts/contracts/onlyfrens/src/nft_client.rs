use soroban_sdk::String as SorobanString;
use core::clone::Clone;
use core::convert::{Into, From, TryInto};
use core::iter::{Iterator, ExactSizeIterator};
use core::result::Result;

pub const WASM: &[u8] = soroban_sdk::contractfile!(
  file =
  "\\code\\consensus\\contracts\\target\\wasm32v1-none\\release\\onlyfrens_nft.wasm",
  sha256 = "29efa3d3eb3999d8d98e1651e03fa1442b85ec30f2bfbfcf357108ea30d23de3"
);
#[soroban_sdk::contractargs(name = "Args")]
#[soroban_sdk::contractclient(name = "Client")]
pub trait Contract {
  fn initialize(env: soroban_sdk::Env, admin: soroban_sdk::Address);
  fn mint(
      env: soroban_sdk::Env,
      to: soroban_sdk::Address,
      name: SorobanString,
      description: SorobanString,
      image_url: SorobanString,
  ) -> u32;
  fn transfer(
      env: soroban_sdk::Env,
      from: soroban_sdk::Address,
      to: soroban_sdk::Address,
      token_id: u32,
  );
  fn total_supply(env: soroban_sdk::Env) -> u32;
  fn owner_of(env: soroban_sdk::Env, token_id: u32) -> soroban_sdk::Address;
  fn token_metadata(env: soroban_sdk::Env, token_id: u32) -> NFTMetadata;
  fn token_uri(env: soroban_sdk::Env, token_id: u32) -> SorobanString;
  fn get_admin(env: soroban_sdk::Env) -> soroban_sdk::Address;
}
#[soroban_sdk::contracttype(export = false)]
#[derive(Debug, Clone, Eq, PartialEq, Ord, PartialOrd)]
pub struct NFTMetadata {
  pub description: SorobanString,
  pub image_url: SorobanString,
  pub name: SorobanString,
}
#[soroban_sdk::contracttype(export = false)]
#[derive(Debug, Clone, Eq, PartialEq, Ord, PartialOrd)]
pub enum DataKey {
  Admin,
  TokenOwner(u32),
  TokenMetadata(u32),
  TotalSupply,
}