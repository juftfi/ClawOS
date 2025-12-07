import { describe, it, expect } from "vitest";
import { generateNonce, generatePaymentId, generateAuthNonce } from "./nonce";

describe("nonce utilities", () => {
  describe("generateNonce", () => {
    it("should generate a bigint nonce", () => {
      const nonce = generateNonce();
      expect(typeof nonce).toBe("bigint");
      expect(nonce).toBeGreaterThan(0n);
    });

    it("should generate unique nonces", () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });
  });

  describe("generatePaymentId", () => {
    it("should generate a hex string", () => {
      const paymentId = generatePaymentId();
      expect(paymentId).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it("should generate unique payment IDs", () => {
      const id1 = generatePaymentId();
      const id2 = generatePaymentId();
      expect(id1).not.toBe(id2);
    });
  });

  describe("generateAuthNonce", () => {
    it("should generate a bigint auth nonce", () => {
      const nonce = generateAuthNonce();
      expect(typeof nonce).toBe("bigint");
      expect(nonce).toBeGreaterThanOrEqual(0n);
    });

    it("should generate unique auth nonces", () => {
      const nonce1 = generateAuthNonce();
      const nonce2 = generateAuthNonce();
      expect(nonce1).not.toBe(nonce2);
    });

    it("should fit in uint64 range", () => {
      const nonce = generateAuthNonce();
      const maxUint64 = 2n ** 64n - 1n;
      expect(nonce).toBeLessThanOrEqual(maxUint64);
    });
  });
});

