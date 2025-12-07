import type { Hex, WalletClient, LocalAccount, PrivateKeyAccount } from "viem";
import { signTypedData } from "viem/actions";
import type {
  WitnessMessage,
  BatchWitnessMessage,
  Eip712Domain,
} from "../types/eip712";
import { SignatureError } from "../utils/errors";

/**
 * Sign a witness message using EIP-712
 */
export async function signWitness(
  account: LocalAccount | PrivateKeyAccount,
  domain: Eip712Domain,
  message: WitnessMessage,
): Promise<Hex> {
  try {
    const signature = await account.signTypedData({
      domain: {
        name: domain.name,
        version: domain.version,
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract,
      },
      types: {
        Witness: [
          { name: "owner", type: "address" },
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "paymentId", type: "bytes32" },
          { name: "nonce", type: "uint256" },
        ],
      },
      primaryType: "Witness",
      message: {
        owner: message.owner,
        token: message.token,
        amount: message.amount,
        to: message.to,
        deadline: message.deadline,
        paymentId: message.paymentId,
        nonce: message.nonce,
      },
    });

    return signature;
  } catch (error) {
    throw new SignatureError("Failed to sign witness message", error);
  }
}

/**
 * Sign a witness message using wallet client
 */
export async function signWitnessWithWallet(
  walletClient: WalletClient,
  domain: Eip712Domain,
  message: WitnessMessage,
): Promise<Hex> {
  try {
    if (!walletClient.account) {
      throw new SignatureError("Wallet client has no account");
    }

    const signature = await signTypedData(walletClient, {
      account: walletClient.account,
      domain: {
        name: domain.name,
        version: domain.version,
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract,
      },
      types: {
        Witness: [
          { name: "owner", type: "address" },
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "to", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "paymentId", type: "bytes32" },
          { name: "nonce", type: "uint256" },
        ],
      },
      primaryType: "Witness",
      message: {
        owner: message.owner,
        token: message.token,
        amount: message.amount,
        to: message.to,
        deadline: message.deadline,
        paymentId: message.paymentId,
        nonce: message.nonce,
      },
    });

    return signature;
  } catch (error) {
    throw new SignatureError("Failed to sign witness message with wallet", error);
  }
}

/**
 * Sign a batch witness message
 */
export async function signBatchWitness(
  account: LocalAccount | PrivateKeyAccount,
  domain: Eip712Domain,
  message: BatchWitnessMessage,
): Promise<Hex> {
  try {
    const signature = await account.signTypedData({
      domain: {
        name: domain.name,
        version: domain.version,
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract,
      },
      types: {
        PaymentItem: [
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "to", type: "address" },
        ],
        BatchWitness: [
          { name: "owner", type: "address" },
          { name: "items", type: "PaymentItem[]" },
          { name: "deadline", type: "uint256" },
          { name: "paymentId", type: "bytes32" },
          { name: "nonce", type: "uint256" },
        ],
      },
      primaryType: "BatchWitness",
      message,
    });

    return signature;
  } catch (error) {
    throw new SignatureError("Failed to sign batch witness message", error);
  }
}

