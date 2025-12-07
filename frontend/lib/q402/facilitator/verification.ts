/**
 * Payment verification logic for facilitator services
 * (Migrated from facilitator package)
 */

import type { SignedPaymentPayload } from "../types/payment";
import type { VerificationResult } from "../types/responses";
import { ErrorReason } from "../types/responses";

/**
 * Core payment verification function
 * 
 * This function validates:
 * 1. Basic payload validation
 * 2. Deadline checks
 * 3. Signature format validation
 * 4. Authorization format validation
 * 5. Payment parameters validation
 */
export async function verifyPayment(
  payload: SignedPaymentPayload,
): Promise<VerificationResult> {
  try {
    const { witnessSignature, authorization, paymentDetails } = payload;
    
    // 1. Basic payload validation
    if (!witnessSignature || !authorization || !paymentDetails) {
      return {
        isValid: false,
        invalidReason: ErrorReason.INVALID_SIGNATURE,
      };
    }

    // 2. Check deadline (from witness message)
    const now = Math.floor(Date.now() / 1000);
    const witness = paymentDetails.witness as any;
    if (witness?.message?.deadline && now > Number(witness.message.deadline)) {
      return {
        isValid: false,
        invalidReason: ErrorReason.PAYMENT_EXPIRED,
      };
    }

    // 3. Verify basic signature format
    const witnessValid = isValidSignature(witnessSignature);
    const authorizationValid = isValidAuthorization(authorization);

    if (!witnessValid) {
      return {
        isValid: false,
        invalidReason: ErrorReason.INVALID_SIGNATURE,
      };
    }

    if (!authorizationValid) {
      return {
        isValid: false,
        invalidReason: ErrorReason.INVALID_AUTHORIZATION,
      };
    }

    // 4. Verify amounts and recipients
    const amountValid = 'amount' in paymentDetails ? isValidAmount(paymentDetails.amount) : true; // Batch payments don't have single amount
    const recipientValid = isValidRecipient(paymentDetails.to);

    if (!amountValid) {
      return {
        isValid: false,
        invalidReason: ErrorReason.INVALID_AMOUNT,
      };
    }

    if (!recipientValid) {
      return {
        isValid: false,
        invalidReason: ErrorReason.INVALID_RECIPIENT,
      };
    }

    // All validations passed
    return {
      isValid: true,
      payer: authorization.address,
      details: {
        witnessValid,
        authorizationValid,
        amountValid,
        deadlineValid: true,
        recipientValid,
      },
    };
    
  } catch (error) {
    console.error("Payment verification error:", error);
    return {
      isValid: false,
      invalidReason: ErrorReason.UNEXPECTED_ERROR,
    };
  }
}

/**
 * Validate signature format
 */
function isValidSignature(signature: string): boolean {
  return (
    typeof signature === 'string' &&
    signature.startsWith('0x') &&
    signature.length === 132 // 65 bytes = 130 hex chars + 0x prefix
  );
}

/**
 * Validate EIP-7702 authorization format
 */
function isValidAuthorization(authorization: any): boolean {
  const { chainId, address, nonce, yParity, r, s } = authorization;
  
  return !!(
    typeof chainId === 'number' && chainId > 0 &&
    typeof address === 'string' && address.startsWith('0x') && address.length === 42 &&
    typeof nonce === 'number' && nonce >= 0 &&
    typeof yParity === 'number' && (yParity === 0 || yParity === 1) &&
    typeof r === 'string' && r.startsWith('0x') && r.length === 66 &&
    typeof s === 'string' && s.startsWith('0x') && s.length === 66
  );
}

/**
 * Validate payment amount
 */
function isValidAmount(amount: string): boolean {
  try {
    const amountBigInt = BigInt(amount);
    return amountBigInt > 0n;
  } catch {
    return false;
  }
}

/**
 * Validate recipient address
 */
function isValidRecipient(recipient: string): boolean {
  return (
    typeof recipient === 'string' &&
    recipient.startsWith('0x') &&
    recipient.length === 42
  );
}
