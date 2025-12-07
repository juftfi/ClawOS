import type { Hex } from "viem";

/**
 * Verification result
 */
export interface VerificationResult {
  /**
   * Whether the payment is valid
   */
  isValid: boolean;

  /**
   * Reason for invalidity
   */
  invalidReason?: string;

  /**
   * Recovered payer address
   */
  payer?: string;

  /**
   * Additional validation details
   */
  details?: {
    witnessValid: boolean;
    authorizationValid: boolean;
    amountValid: boolean;
    deadlineValid: boolean;
    recipientValid: boolean;
  };
}

/**
 * Settlement result
 */
export interface SettlementResult {
  /**
   * Whether settlement was successful
   */
  success: boolean;

  /**
   * Transaction hash if successful
   */
  txHash?: Hex;

  /**
   * Error message if failed
   */
  error?: string;

  /**
   * Block number
   */
  blockNumber?: bigint;
}

/**
 * Error reasons for payment validation
 */
export const ErrorReason = {
  INSUFFICIENT_FUNDS: "insufficient_funds",
  INVALID_SIGNATURE: "invalid_signature",
  INVALID_AUTHORIZATION: "invalid_authorization",
  INVALID_AMOUNT: "invalid_amount",
  INVALID_RECIPIENT: "invalid_recipient",
  PAYMENT_EXPIRED: "payment_expired",
  NONCE_REUSED: "nonce_reused",
  INVALID_IMPLEMENTATION: "invalid_implementation",
  INVALID_NETWORK: "invalid_network",
  INVALID_SCHEME: "invalid_scheme",
  UNEXPECTED_ERROR: "unexpected_error",
} as const;

export type ErrorReasonType = (typeof ErrorReason)[keyof typeof ErrorReason];

