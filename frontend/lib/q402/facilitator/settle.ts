import type { Hex, WalletClient, Address } from "viem";
import { encodeFunctionData, createPublicClient, http } from "viem";
import type { SignedPaymentPayload, PaymentItem } from "../types/payment";
import type { SettlementResult } from "../types/responses";
import { PaymentImplementationAbi } from "../contracts/abi";
import { NetworkConfigs } from "../types/network";
import { TransactionError } from "../utils/errors";
import { PaymentScheme } from "../types/payment";

/**
 * Settle a payment by constructing and submitting a type 0x04 transaction
 */
export async function settlePayment(
  walletClient: WalletClient,
  payload: SignedPaymentPayload,
): Promise<SettlementResult> {
  try {
    const { authorization, paymentDetails, witnessSignature } = payload;

    // Get network config
    const networkConfig = NetworkConfigs[paymentDetails.networkId];
    if (!networkConfig) {
      throw new TransactionError(`Unsupported network: ${paymentDetails.networkId}`);
    }

    // Determine if single or batch payment
    const isBatch = paymentDetails.scheme === PaymentScheme.EIP7702_DELEGATED_BATCH;

    // Encode function data
    let data: Hex;
    if (isBatch) {
      // Batch payment
      const batchDetails = payload.paymentDetails as any; // Type assertion for batch
      const items: PaymentItem[] = batchDetails.items || [];

      data = encodeFunctionData({
        abi: PaymentImplementationAbi,
        functionName: "payBatch",
        args: [
          authorization.address, // owner
          items.map((item) => ({
            token: item.token,
            amount: item.amount,
            to: item.to,
          })),
          BigInt(0), // deadline - from witness
          "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex, // paymentId
          witnessSignature,
        ],
      });
    } else {
      // Single payment
      data = encodeFunctionData({
        abi: PaymentImplementationAbi,
        functionName: "pay",
        args: [
          authorization.address, // owner
          paymentDetails.token,
          BigInt(paymentDetails.amount),
          paymentDetails.to,
          BigInt(0), // deadline - from witness
          "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex, // paymentId
          witnessSignature,
        ],
      });
    }

    // Prepare authorization list for type 0x04 transaction
    const authorizationList = [
      {
        chainId: Number(authorization.chainId),
        address: authorization.address,
        nonce: Number(authorization.nonce),
        yParity: authorization.yParity,
        r: authorization.r,
        s: authorization.s,
      },
    ];

    // Send type 0x04 transaction
    // Note: This requires viem experimental features for EIP-7702
    const hash = await walletClient.sendTransaction({
      to: authorization.address, // Send to owner's EOA
      data,
      // @ts-expect-error - authorizationList is experimental
      authorizationList,
    });

    // Wait for confirmation
    const publicClient = createPublicClient({
      chain: {
        id: networkConfig.chainId,
        name: networkConfig.name,
        rpcUrls: {
          default: { http: [networkConfig.rpcUrl] },
          public: { http: [networkConfig.rpcUrl] },
        },
        nativeCurrency: {
          name: "BNB",
          symbol: "BNB",
          decimals: 18,
        },
      },
      transport: http(networkConfig.rpcUrl),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      success: receipt.status === "success",
      txHash: hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Estimate gas for a payment settlement
 */
export async function estimateSettlementGas(
  walletClient: WalletClient,
  payload: SignedPaymentPayload,
): Promise<bigint> {
  const { authorization, paymentDetails, witnessSignature } = payload;

  const isBatch = paymentDetails.scheme === PaymentScheme.EIP7702_DELEGATED_BATCH;

  let data: Hex;
  if (isBatch) {
    const batchDetails = payload.paymentDetails as any;
    const items: PaymentItem[] = batchDetails.items || [];

    data = encodeFunctionData({
      abi: PaymentImplementationAbi,
      functionName: "payBatch",
      args: [
        authorization.address,
        items.map((item) => ({
          token: item.token,
          amount: item.amount,
          to: item.to,
        })),
        BigInt(0),
        "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex,
        witnessSignature,
      ],
    });
  } else {
    data = encodeFunctionData({
      abi: PaymentImplementationAbi,
      functionName: "pay",
      args: [
        authorization.address,
        paymentDetails.token,
        BigInt(paymentDetails.amount),
        paymentDetails.to,
        BigInt(0),
        "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex,
        witnessSignature,
      ],
    });
  }

  // Estimate gas (simplified - would need proper implementation)
  return BigInt(200000); // Placeholder
}

