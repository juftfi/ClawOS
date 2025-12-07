import { describe, it, expect } from "vitest";
import {
  validateAddress,
  validateHex,
  validateBigInt,
  validateDeadline,
  validateAmount,
  parseBigInt,
} from "./validation";

describe("validation utilities", () => {
  describe("validateAddress", () => {
    it("should validate correct Ethereum addresses", () => {
      expect(validateAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb9")).toBe(true);
      expect(validateAddress("0x0000000000000000000000000000000000000000")).toBe(true);
    });

    it("should reject invalid addresses", () => {
      expect(validateAddress("0x123")).toBe(false);
      expect(validateAddress("not an address")).toBe(false);
      expect(validateAddress("")).toBe(false);
      expect(validateAddress(null)).toBe(false);
      expect(validateAddress(undefined)).toBe(false);
    });
  });

  describe("validateHex", () => {
    it("should validate hex strings", () => {
      expect(validateHex("0x1234abcd")).toBe(true);
      expect(validateHex("0x0")).toBe(true);
    });

    it("should reject invalid hex strings", () => {
      expect(validateHex("1234")).toBe(false);
      expect(validateHex("0xgg")).toBe(false);
      expect(validateHex("")).toBe(false);
    });
  });

  describe("validateBigInt", () => {
    it("should validate bigint values", () => {
      expect(validateBigInt(123n)).toBe(true);
      expect(validateBigInt(0n)).toBe(true);
      expect(validateBigInt(BigInt(Number.MAX_SAFE_INTEGER))).toBe(true);
    });

    it("should validate bigint strings", () => {
      expect(validateBigInt("123")).toBe(true);
      expect(validateBigInt("0")).toBe(true);
      expect(validateBigInt("999999999999999")).toBe(true);
    });

    it("should reject invalid values", () => {
      expect(validateBigInt(-123n)).toBe(false);
      expect(validateBigInt("-123")).toBe(false);
      expect(validateBigInt("abc")).toBe(false);
      expect(validateBigInt("12.34")).toBe(false);
    });
  });

  describe("validateDeadline", () => {
    it("should accept future deadlines", () => {
      const future = BigInt(Math.floor(Date.now() / 1000) + 3600);
      expect(validateDeadline(future)).toBe(true);
    });

    it("should reject past deadlines", () => {
      const past = BigInt(Math.floor(Date.now() / 1000) - 3600);
      expect(validateDeadline(past)).toBe(false);
    });
  });

  describe("validateAmount", () => {
    it("should accept positive amounts", () => {
      expect(validateAmount(1n)).toBe(true);
      expect(validateAmount(1000000n)).toBe(true);
    });

    it("should reject zero or negative amounts", () => {
      expect(validateAmount(0n)).toBe(false);
      expect(validateAmount(-1n)).toBe(false);
    });
  });

  describe("parseBigInt", () => {
    it("should parse bigint strings", () => {
      expect(parseBigInt("123")).toBe(123n);
      expect(parseBigInt("0")).toBe(0n);
    });

    it("should return bigint as-is", () => {
      expect(parseBigInt(123n)).toBe(123n);
    });
  });
});

