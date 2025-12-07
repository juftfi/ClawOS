import type { Address, Hex } from "viem";
import { isAddress, isHex } from "viem";

/**
 * Validate Ethereum address
 */
export function validateAddress(address: unknown): address is Address {
  return typeof address === "string" && isAddress(address);
}

/**
 * Validate hex string
 */
export function validateHex(value: unknown): value is Hex {
  return typeof value === "string" && isHex(value);
}

/**
 * Validate bigint or bigint string
 */
export function validateBigInt(value: unknown): boolean {
  if (typeof value === "bigint") {
    return value >= 0n;
  }
  if (typeof value === "string") {
    return /^\d+$/.test(value);
  }
  return false;
}

/**
 * Validate deadline (must be in the future)
 */
export function validateDeadline(deadline: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return deadline > now;
}

/**
 * Validate amount (must be positive)
 */
export function validateAmount(amount: bigint): boolean {
  return amount > 0n;
}

/**
 * Parse bigint from string or bigint
 */
export function parseBigInt(value: string | bigint): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}

