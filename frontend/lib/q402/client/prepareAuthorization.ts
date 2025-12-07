import type { Address } from "viem";
import type { UnsignedAuthorizationTuple } from "../types/eip7702";
import { generateAuthNonce } from "../utils/nonce";
import { validateAddress } from "../utils/validation";
import { PaymentValidationError } from "../utils/errors";

/**
 * Options for preparing authorization tuple
 */
export interface PrepareAuthorizationOptions {
  /**
   * Chain ID (0 for any chain, or specific chain ID)
   */
  chainId: bigint | number;

  /**
   * Implementation contract address to delegate to
   */
  implementationAddress: Address;

  /**
   * Optional authorization nonce (auto-generated if not provided)
   */
  nonce?: bigint | number;
}

/**
 * Prepare an unsigned authorization tuple for EIP-7702
 */
export function prepareAuthorization(
  options: PrepareAuthorizationOptions,
): UnsignedAuthorizationTuple {
  const { chainId, implementationAddress, nonce } = options;

  // Validate implementation address
  if (!validateAddress(implementationAddress)) {
    throw new PaymentValidationError("Invalid implementation contract address");
  }

  // Convert chain ID to bigint
  const chainIdBigInt = typeof chainId === "number" ? BigInt(chainId) : chainId;

  // Generate nonce if not provided
  const finalNonce =
    nonce !== undefined
      ? typeof nonce === "number"
        ? BigInt(nonce)
        : nonce
      : generateAuthNonce();

  return {
    chainId: chainIdBigInt,
    address: implementationAddress,
    nonce: finalNonce,
  };
}

