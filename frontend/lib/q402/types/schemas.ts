import { z } from "zod";
import { SupportedNetworks, type SupportedNetwork } from "./network";
import { PaymentScheme } from "./payment";

/**
 * Address validation schema (Ethereum address)
 */
export const AddressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/);

/**
 * Hex string validation schema
 */
export const HexSchema = z.string().regex(/^0x[0-9a-fA-F]+$/);

/**
 * BigInt string schema
 */
export const BigIntStringSchema = z.string().regex(/^\d+$/);

/**
 * Network schema
 */
export const NetworkSchema = z.enum([
  SupportedNetworks.BSC_MAINNET,
  SupportedNetworks.BSC_TESTNET,
] as [SupportedNetwork, ...SupportedNetwork[]]);

/**
 * Payment scheme schema
 */
export const PaymentSchemeSchema = z.enum([
  PaymentScheme.EIP7702_DELEGATED,
  PaymentScheme.EIP7702_DELEGATED_BATCH,
]);

/**
 * EIP-712 domain schema
 */
export const Eip712DomainSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  chainId: z.number(),
  verifyingContract: AddressSchema,
});

/**
 * Witness message schema
 */
export const WitnessMessageSchema = z.object({
  owner: AddressSchema,
  token: AddressSchema,
  amount: BigIntStringSchema,
  to: AddressSchema,
  deadline: BigIntStringSchema,
  paymentId: HexSchema,
  nonce: BigIntStringSchema,
});

/**
 * Payment item schema
 */
export const PaymentItemSchema = z.object({
  token: AddressSchema,
  amount: BigIntStringSchema,
  to: AddressSchema,
});

/**
 * Batch witness message schema
 */
export const BatchWitnessMessageSchema = z.object({
  owner: AddressSchema,
  items: z.array(PaymentItemSchema),
  deadline: BigIntStringSchema,
  paymentId: HexSchema,
  nonce: BigIntStringSchema,
});

/**
 * Authorization tuple schema
 */
export const AuthorizationTupleSchema = z.object({
  chainId: z.number(),
  address: AddressSchema,
  nonce: z.number(),
  yParity: z.number().min(0).max(1),
  r: HexSchema,
  s: HexSchema,
});

/**
 * Payment details schema
 */
export const PaymentDetailsSchema = z.object({
  scheme: PaymentSchemeSchema,
  networkId: NetworkSchema,
  token: AddressSchema,
  amount: BigIntStringSchema,
  to: AddressSchema,
  implementationContract: AddressSchema,
  witness: z.record(z.any()), // Flexible for typed data
  authorization: z.object({
    chainId: z.number(),
    address: AddressSchema,
    nonce: z.number(),
  }),
});

/**
 * Payment required response schema
 */
export const PaymentRequiredResponseSchema = z.object({
  x402Version: z.number(),
  accepts: z.array(PaymentDetailsSchema),
  error: z.string().optional(),
});

/**
 * Signed payment payload schema
 */
export const SignedPaymentPayloadSchema = z.object({
  witnessSignature: HexSchema,
  authorization: AuthorizationTupleSchema,
  paymentDetails: PaymentDetailsSchema,
});

