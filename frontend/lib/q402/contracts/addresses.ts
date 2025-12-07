import type { Address } from "viem";
import { SupportedNetworks, type SupportedNetwork } from "../types/network";

/**
 * Implementation contract addresses for different networks
 * These are placeholder addresses - replace with actual deployed contract addresses
 */
export const ImplementationAddresses: Record<SupportedNetwork, Address> = {
  [SupportedNetworks.BSC_MAINNET]: "0x0000000000000000000000000000000000000000", // TODO: Deploy and update
  [SupportedNetworks.BSC_TESTNET]: "0x0000000000000000000000000000000000000000", // TODO: Deploy and update
};

/**
 * Get implementation contract address for a network
 */
export function getImplementationAddress(network: SupportedNetwork): Address {
  const address = ImplementationAddresses[network];
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    throw new Error(`Implementation contract not deployed on network: ${network}`);
  }
  return address;
}

/**
 * Common token addresses on BSC
 */
export const CommonTokens = {
  BSC_MAINNET: {
    USDT: "0x55d398326f99059fF775485246999027B3197955" as Address,
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d" as Address,
    BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56" as Address,
    DAI: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3" as Address,
  },
  BSC_TESTNET: {
    USDT: "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" as Address,
    USDC: "0x64544969ed7EBf5f083679233325356EbE738930" as Address,
  },
};

