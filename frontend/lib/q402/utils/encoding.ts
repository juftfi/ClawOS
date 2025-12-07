import { base64 } from "@scure/base";
import type { Hex } from "viem";

/**
 * Encode data to base64 string
 */
export function encodeBase64(data: string | object): string {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  const bytes = new TextEncoder().encode(str);
  return base64.encode(bytes);
}

/**
 * Decode base64 string to object
 */
export function decodeBase64<T = unknown>(encoded: string): T {
  const bytes = base64.decode(encoded);
  const str = new TextDecoder().decode(bytes);
  return JSON.parse(str) as T;
}

/**
 * RLP encode authorization tuple for EIP-7702
 * Format: rlp([chain_id, address, nonce])
 */
export function rlpEncodeAuthorization(
  chainId: bigint,
  address: Hex,
  nonce: bigint,
): Uint8Array {
  // Simple RLP encoding for authorization tuple
  // This is a basic implementation - in production, use a proper RLP library
  const items = [
    encodeRlpItem(chainId),
    encodeRlpItem(address),
    encodeRlpItem(nonce),
  ];

  return encodeRlpList(items);
}

/**
 * Encode a single RLP item
 */
function encodeRlpItem(value: bigint | string): Uint8Array {
  if (typeof value === "bigint") {
    // Encode bigint as bytes
    if (value === 0n) {
      return new Uint8Array([0x80]); // Empty string
    }
    const hex = value.toString(16).padStart(value.toString(16).length % 2 === 0 ? 0 : 1, "0");
    const bytes = hexToBytes(hex);
    return encodeRlpString(bytes);
  } else {
    // Encode hex string
    const bytes = hexToBytes(value.replace(/^0x/, ""));
    return encodeRlpString(bytes);
  }
}

/**
 * Encode RLP string
 */
function encodeRlpString(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 1 && bytes[0] < 0x80) {
    return bytes;
  }
  if (bytes.length <= 55) {
    return new Uint8Array([0x80 + bytes.length, ...bytes]);
  }
  const lengthBytes = numberToBytes(bytes.length);
  return new Uint8Array([0xb7 + lengthBytes.length, ...lengthBytes, ...bytes]);
}

/**
 * Encode RLP list
 */
function encodeRlpList(items: Uint8Array[]): Uint8Array {
  const concatenated = new Uint8Array(items.reduce((acc, item) => acc + item.length, 0));
  let offset = 0;
  for (const item of items) {
    concatenated.set(item, offset);
    offset += item.length;
  }

  if (concatenated.length <= 55) {
    return new Uint8Array([0xc0 + concatenated.length, ...concatenated]);
  }
  const lengthBytes = numberToBytes(concatenated.length);
  return new Uint8Array([0xf7 + lengthBytes.length, ...lengthBytes, ...concatenated]);
}

/**
 * Convert hex string to bytes
 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Convert number to bytes
 */
function numberToBytes(num: number): Uint8Array {
  const hex = num.toString(16).padStart(num.toString(16).length % 2 === 0 ? 0 : 1, "0");
  return hexToBytes(hex);
}

