import { randomBytes } from "crypto";
import { bytesToBigInt } from "viem";

/**
 * Generate a random nonce for payment
 * Uses cryptographically secure random bytes
 */
export function generateNonce(): bigint {
  const bytes = randomBytes(32);
  return bytesToBigInt(bytes);
}

/**
 * Generate a payment ID (32-byte hex string)
 */
export function generatePaymentId(): `0x${string}` {
  const bytes = randomBytes(32);
  return `0x${bytes.toString("hex")}`;
}

/**
 * Generate an authorization nonce (uint64)
 */
export function generateAuthNonce(): bigint {
  const bytes = randomBytes(8);
  return bytesToBigInt(bytes);
}

