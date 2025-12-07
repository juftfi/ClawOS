import type { PaymentRequiredResponse, PaymentDetails } from "../types/payment";
import { PaymentScheme } from "../types/payment";
import type { SupportedNetwork } from "../types/network";

/**
 * Options for selecting payment details
 */
export interface SelectPaymentDetailsOptions {
  /**
   * Preferred network (optional)
   */
  network?: SupportedNetwork;

  /**
   * Preferred scheme (optional)
   */
  scheme?: string;

  /**
   * Maximum amount willing to pay (optional)
   */
  maxAmount?: bigint;
}

/**
 * Select payment details from 402 response
 * Returns the first matching payment option, or the first available if no preferences match
 */
export function selectPaymentDetails(
  response: PaymentRequiredResponse,
  options?: SelectPaymentDetailsOptions,
): PaymentDetails | null {
  if (!response.accepts || response.accepts.length === 0) {
    return null;
  }

  const { network, scheme, maxAmount } = options ?? {};

  // Filter by preferences
  let candidates = response.accepts;

  if (network) {
    const filtered = candidates.filter((details) => details.networkId === network);
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }

  if (scheme) {
    const filtered = candidates.filter((details) => details.scheme === scheme);
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }

  if (maxAmount !== undefined) {
    const filtered = candidates.filter((details) => BigInt(details.amount) <= maxAmount);
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }

  // Return first candidate
  return candidates[0] ?? null;
}

/**
 * Check if payment details are supported by this client
 */
export function isPaymentDetailsSupported(details: PaymentDetails): boolean {
  // Check scheme
  const supportedSchemes = [PaymentScheme.EIP7702_DELEGATED, PaymentScheme.EIP7702_DELEGATED_BATCH];
  if (!supportedSchemes.includes(details.scheme as (typeof supportedSchemes)[number])) {
    return false;
  }

  // Check network (BSC mainnet/testnet)
  const supportedNetworks = ["bsc-mainnet", "bsc-testnet"];
  if (!supportedNetworks.includes(details.networkId)) {
    return false;
  }

  return true;
}

