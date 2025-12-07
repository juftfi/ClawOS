import type { Address, Hex } from "viem";
import type { AuthorizationTuple } from "./eip7702";
import type { WitnessTypedData, BatchWitnessTypedData, PaymentItem } from "./eip712";
import type { SupportedNetwork } from "./network";

// Re-export PaymentItem for external use
export type { PaymentItem } from "./eip712";

/**
 * Payment scheme identifier
 */
export const PaymentScheme = {
  EIP7702_DELEGATED: "evm/eip7702-delegated-payment",
  EIP7702_DELEGATED_BATCH: "evm/eip7702-delegated-batch",
} as const;

export type PaymentSchemeType = (typeof PaymentScheme)[keyof typeof PaymentScheme];

/**
 * Payment details returned by resource server in 402 response
 */
export interface PaymentDetails {
  /**
   * Payment scheme identifier
   */
  scheme: PaymentSchemeType;

  /**
   * Network identifier
   */
  networkId: SupportedNetwork;

  /**
   * Token contract address
   */
  token: Address;

  /**
   * Payment amount in atomic units
   */
  amount: string;

  /**
   * Recipient address (resource server settlement wallet)
   */
  to: Address;

  /**
   * Implementation contract address (whitelisted delegation target)
   */
  implementationContract: Address;

  /**
   * EIP-712 witness typed data
   */
  witness: WitnessTypedData | BatchWitnessTypedData;

  /**
   * Authorization tuple template (without signature)
   */
  authorization: {
    chainId: number;
    address: Address;
    nonce: number;
  };
}

/**
 * Batch payment details
 */
export interface BatchPaymentDetails extends Omit<PaymentDetails, "token" | "amount" | "witness"> {
  scheme: typeof PaymentScheme.EIP7702_DELEGATED_BATCH;
  items: PaymentItem[];
  witness: BatchWitnessTypedData;
}

/**
 * Signed payment payload for X-PAYMENT header
 */
export interface SignedPaymentPayload {
  /**
   * Witness signature (EIP-712)
   */
  witnessSignature: Hex;

  /**
   * Signed authorization tuple (EIP-7702)
   */
  authorization: AuthorizationTuple;

  /**
   * Payment details
   */
  paymentDetails: PaymentDetails | BatchPaymentDetails;
}

/**
 * 402 Payment Required response
 */
export interface PaymentRequiredResponse {
  /**
   * Protocol version
   */
  x402Version: number;

  /**
   * Accepted payment methods
   */
  accepts: PaymentDetails[];

  /**
   * Optional error message
   */
  error?: string;
}

/**
 * Payment execution response
 */
export interface PaymentExecutionResponse {
  /**
   * Transaction hash
   */
  txHash: Hex;

  /**
   * Block number
   */
  blockNumber?: bigint;

  /**
   * Transaction status
   */
  status: "pending" | "confirmed" | "failed";

  /**
   * Transfer events or receipts
   */
  transfers?: Array<{
    token: Address;
    from: Address;
    to: Address;
    amount: bigint;
  }>;

  /**
   * Error message if failed
   */
  error?: string;
}

