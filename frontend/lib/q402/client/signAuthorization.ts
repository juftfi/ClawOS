import type { Hex, LocalAccount, PrivateKeyAccount } from "viem";
import { keccak256, concat, toRlp } from "viem";
import type { UnsignedAuthorizationTuple, AuthorizationTuple } from "../types/eip7702";
import { SignatureError } from "../utils/errors";

/**
 * Sign an authorization tuple for EIP-7702
 * Computes: keccak256(0x05 || rlp([chain_id, address, nonce]))
 */
export async function signAuthorization(
  account: LocalAccount | PrivateKeyAccount,
  authorization: UnsignedAuthorizationTuple,
): Promise<AuthorizationTuple> {
  try {
    // Encode authorization data
    const encoded = toRlp([
      authorization.chainId === 0n ? "0x" : `0x${authorization.chainId.toString(16)}`,
      authorization.address,
      authorization.nonce === 0n ? "0x" : `0x${authorization.nonce.toString(16)}`,
    ]);

    // Prepend 0x05 type prefix
    const message = concat(["0x05", encoded]);

    // Hash the message
    const hash = keccak256(message);

    // Sign the hash
    const signature = await account.signMessage({
      message: { raw: hash },
    });

    // Parse signature (viem returns r,s,v format)
    const r = signature.slice(0, 66) as Hex;
    const s = `0x${signature.slice(66, 130)}` as Hex;
    const v = parseInt(signature.slice(130, 132), 16);

    // Convert v to y_parity (27/28 -> 0/1)
    const yParity = v >= 27 ? v - 27 : v;

    return {
      chainId: authorization.chainId,
      address: authorization.address,
      nonce: authorization.nonce,
      yParity,
      r,
      s,
    };
  } catch (error) {
    throw new SignatureError("Failed to sign authorization tuple", error);
  }
}

/**
 * Verify an authorization signature
 */
export async function verifyAuthorizationSignature(
  authorization: AuthorizationTuple,
  expectedSigner: Hex,
): Promise<boolean> {
  try {
    const { recoverMessageAddress } = await import("viem");
    
    // Encode authorization data
    const encoded = toRlp([
      authorization.chainId === 0n ? "0x" : `0x${authorization.chainId.toString(16)}`,
      authorization.address,
      authorization.nonce === 0n ? "0x" : `0x${authorization.nonce.toString(16)}`,
    ]);

    // Prepend 0x05 type prefix
    const message = concat(["0x05", encoded]);

    // Hash the message
    const hash = keccak256(message);

    // Reconstruct signature from components
    const v = authorization.yParity + 27;
    const signature = concat([
      authorization.r,
      authorization.s,
      `0x${v.toString(16).padStart(2, "0")}` as Hex,
    ]);

    // Recover signer address
    const recovered = await recoverMessageAddress({
      message: { raw: hash },
      signature,
    });

    // Verify signer matches expected
    return recovered.toLowerCase() === expectedSigner.toLowerCase();
  } catch {
    return false;
  }
}

