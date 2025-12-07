import type { Address, Hex } from "viem";

/**
 * EIP-7702 authorization tuple structure
 * Used to delegate code execution to an implementation contract
 */
export interface AuthorizationTuple {
  /**
   * Chain ID (0 for any chain, or specific chain ID like 56 for BSC)
   */
  chainId: bigint;

  /**
   * Address of the implementation contract to delegate to
   */
  address: Address;

  /**
   * Authorization nonce (uint64)
   */
  nonce: bigint;

  /**
   * Signature y_parity (0 or 1)
   */
  yParity: number;

  /**
   * Signature r component
   */
  r: Hex;

  /**
   * Signature s component
   */
  s: Hex;
}

/**
 * Unsigned authorization tuple before signing
 */
export interface UnsignedAuthorizationTuple {
  chainId: bigint;
  address: Address;
  nonce: bigint;
}

/**
 * Authorization signature components
 */
export interface AuthorizationSignature {
  yParity: number;
  r: Hex;
  s: Hex;
}

