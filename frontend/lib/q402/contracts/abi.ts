/**
 * ABI for EIP-7702 delegated payment implementation contract
 */
export const PaymentImplementationAbi = [
  {
    type: "function",
    name: "pay",
    stateMutability: "nonpayable",
    inputs: [
      { name: "owner", type: "address" },
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" },
      { name: "paymentId", type: "bytes32" },
      { name: "witnessSig", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "payBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "owner", type: "address" },
      {
        name: "items",
        type: "tuple[]",
        components: [
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "to", type: "address" },
        ],
      },
      { name: "deadline", type: "uint256" },
      { name: "paymentId", type: "bytes32" },
      { name: "witnessSig", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "Payment",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "paymentId", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BatchPayment",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "paymentId", type: "bytes32", indexed: false },
      { name: "itemCount", type: "uint256", indexed: false },
    ],
  },
] as const;

/**
 * Standard ERC-20 ABI (minimal)
 */
export const Erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

