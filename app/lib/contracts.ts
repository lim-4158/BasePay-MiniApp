/**
 * Smart Contract Integration
 * ABIs and addresses for BasedPay contracts
 */

// MerchantRegistry Contract ABI
export const MERCHANT_REGISTRY_ABI = [
  {
    inputs: [{ internalType: "string", name: "qrPayload", type: "string" }],
    name: "registerMerchant",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "qrPayload", type: "string" }],
    name: "merchantForQr",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "qrPayload", type: "string" }],
    name: "isQrRegistered",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalMerchants",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "merchant", type: "address" },
      { indexed: false, internalType: "string", name: "qrPayload", type: "string" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "MerchantRegistered",
    type: "event",
  },
] as const;

// Contract Addresses
export const MERCHANT_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_MERCHANT_REGISTRY_ADDRESS ||
  "0x4b45034E7Fc0195341301f0Ba60704884Ac4A53d") as `0x${string}`;

export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as `0x${string}`;

export const MYSTERY_BOX_ADDRESS = (process.env.NEXT_PUBLIC_MYSTERY_BOX_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// MysteryBoxRewards Contract ABI
export const MYSTERY_BOX_ABI = [
  {
    inputs: [],
    name: "claimMysteryBox",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserStats",
    outputs: [
      { internalType: "uint256", name: "unclaimed", type: "uint256" },
      { internalType: "uint256", name: "opened", type: "uint256" },
      { internalType: "uint256", name: "earned", type: "uint256" },
      { internalType: "uint256", name: "biggest", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "unclaimedBoxes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "boxesOpened",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "totalClaimed",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "biggestWin",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "prize", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "BoxOpened",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "BoxGranted",
    type: "event",
  },
] as const;

// ERC20 ABI (for USDC transfers)
export const ERC20_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
