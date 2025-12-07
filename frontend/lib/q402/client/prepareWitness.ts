import type { Address, Hex } from "viem";
import type { WitnessMessage, BatchWitnessMessage, PaymentItem } from "../types/eip712";
import { generateNonce, generatePaymentId } from "../utils/nonce";
import { validateAddress, validateAmount } from "../utils/validation";
import { PaymentValidationError } from "../utils/errors";

/**
 * Options for preparing witness message
 */
export interface PrepareWitnessOptions {
  /**
   * Owner/payer address
   */
  owner: Address;

  /**
   * Token contract address
   */
  token: Address;

  /**
   * Amount in atomic units
   */
  amount: bigint | string;

  /**
   * Recipient address
   */
  to: Address;

  /**
   * Optional deadline (default: 15 minutes from now)
   */
  deadline?: bigint;

  /**
   * Optional payment ID (auto-generated if not provided)
   */
  paymentId?: Hex;

  /**
   * Optional nonce (auto-generated if not provided)
   */
  nonce?: bigint;
}

/**
 * Prepare a witness message for single payment
 */
export function prepareWitness(options: PrepareWitnessOptions): WitnessMessage {
  const { owner, token, amount, to, deadline, paymentId, nonce } = options;

  // Validate inputs
  if (!validateAddress(owner)) {
    throw new PaymentValidationError("Invalid owner address");
  }
  if (!validateAddress(token)) {
    throw new PaymentValidationError("Invalid token address");
  }
  if (!validateAddress(to)) {
    throw new PaymentValidationError("Invalid recipient address");
  }

  const amountBigInt = typeof amount === "string" ? BigInt(amount) : amount;
  if (!validateAmount(amountBigInt)) {
    throw new PaymentValidationError("Invalid amount");
  }

  // Generate defaults
  const finalDeadline = deadline ?? BigInt(Math.floor(Date.now() / 1000) + 900); // 15 minutes
  const finalPaymentId = paymentId ?? generatePaymentId();
  const finalNonce = nonce ?? generateNonce();

  return {
    owner,
    token,
    amount: amountBigInt,
    to,
    deadline: finalDeadline,
    paymentId: finalPaymentId,
    nonce: finalNonce,
  };
}

/**
 * Options for preparing batch witness message
 */
export interface PrepareBatchWitnessOptions {
  owner: Address;
  items: PaymentItem[];
  deadline?: bigint;
  paymentId?: Hex;
  nonce?: bigint;
}

/**
 * Prepare a batch witness message
 */
export function prepareBatchWitness(options: PrepareBatchWitnessOptions): BatchWitnessMessage {
  const { owner, items, deadline, paymentId, nonce } = options;

  // Validate owner
  if (!validateAddress(owner)) {
    throw new PaymentValidationError("Invalid owner address");
  }

  // Validate items
  if (!items || items.length === 0) {
    throw new PaymentValidationError("Items array cannot be empty");
  }

  for (const item of items) {
    if (!validateAddress(item.token)) {
      throw new PaymentValidationError(`Invalid token address: ${item.token}`);
    }
    if (!validateAddress(item.to)) {
      throw new PaymentValidationError(`Invalid recipient address: ${item.to}`);
    }
    if (!validateAmount(item.amount)) {
      throw new PaymentValidationError(`Invalid amount: ${item.amount}`);
    }
  }

  // Generate defaults
  const finalDeadline = deadline ?? BigInt(Math.floor(Date.now() / 1000) + 900); // 15 minutes
  const finalPaymentId = paymentId ?? generatePaymentId();
  const finalNonce = nonce ?? generateNonce();

  return {
    owner,
    items,
    deadline: finalDeadline,
    paymentId: finalPaymentId,
    nonce: finalNonce,
  };
}

