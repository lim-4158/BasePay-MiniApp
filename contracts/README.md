# BasedPay Smart Contracts

Smart contracts for BasedPay - a crypto payment solution using Singapore PayNow QR codes on Base blockchain.

## 📋 Overview

### MerchantRegistry.sol
ERC721 contract that allows merchants to claim ownership of their UEN (Singapore business registration number).

**Key Features:**
- **One UEN per merchant**: Each UEN can only be claimed once
- **Soulbound NFTs**: Tokens are non-transferable to ensure UEN ownership integrity
- **Simple claiming**: Merchants call `claimMerchant(uen)` to mint their NFT
- **Easy lookup**: Users can query merchant addresses by UEN for payments

## 🛠️ Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy example env file
cp .env.contracts.example .env

# Edit .env and add:
# - Your private key (for deployment)
# - Base Sepolia RPC URL
# - BaseScan API key (for verification)
```

### 3. Get Testnet ETH
Get Base Sepolia ETH from the faucet:
https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

## 🧪 Testing

Run the test suite:
```bash
npm run test:contracts
```

All tests should pass:
```
  MerchantRegistry
    ✔ Deployment
    ✔ Claiming Merchants
    ✔ Query Functions
    ✔ Soulbound Behavior
    ✔ ERC721 Standard Functions
    ✔ Edge Cases

  26 passing
```

## 🚀 Deployment

### Compile Contracts
```bash
npm run compile:contracts
```

### Deploy to Base Sepolia
```bash
npm run deploy:baseSepolia
```

After deployment, you'll see:
```
✅ MerchantRegistry deployed to: 0x...

📝 Next steps:
   1. Save this address to your .env file
   2. Verify contract on BaseScan
   3. View on BaseScan
```

### Verify Contract (Optional)
```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

## 📖 Contract Functions

### For Merchants

#### `claimMerchant(string uen) → uint256`
Claim ownership of a UEN by minting an NFT.

**Parameters:**
- `uen`: Singapore business registration number

**Returns:**
- `tokenId`: The minted NFT token ID

**Example:**
```solidity
uint256 tokenId = merchantRegistry.claimMerchant("201234567A");
```

### For Users (Payment)

#### `getMerchantAddress(string uen) → address`
Get the wallet address of the merchant who owns a UEN.

**Parameters:**
- `uen`: The UEN to query

**Returns:**
- `address`: Merchant's wallet address, or `address(0)` if unclaimed

**Example:**
```solidity
address merchant = merchantRegistry.getMerchantAddress("201234567A");
// Transfer USDC to this address
```

#### `isUENClaimed(string uen) → bool`
Check if a UEN has already been claimed.

**Parameters:**
- `uen`: The UEN to check

**Returns:**
- `bool`: `true` if claimed, `false` otherwise

### Query Functions

#### `totalMerchants() → uint256`
Get the total number of registered merchants.

#### `uenToTokenId(string uen) → uint256`
Get the token ID for a UEN.

#### `tokenIdToUEN(uint256 tokenId) → string`
Get the UEN for a token ID.

## 🔒 Security Features

### Soulbound Tokens
NFTs cannot be transferred after minting. This ensures:
- UEN ownership always reflects the true business owner
- No secondary market speculation
- Protection against front-running attacks

### No Unclaim Function
Once claimed, a UEN cannot be released. This prevents:
- Claim/unclaim griefing attacks
- UEN squatting schemes

## 📁 Project Structure

```
contracts/
├── MerchantRegistry.sol       # Main ERC721 contract
├── test/
│   └── MerchantRegistry.test.ts  # Comprehensive test suite
└── scripts/
    └── deploy.ts              # Deployment script
```

## 🌐 Network Details

### Base Sepolia (Testnet)
- **Chain ID:** 84532
- **RPC URL:** https://sepolia.base.org
- **Explorer:** https://sepolia.basescan.org
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### USDC on Base Sepolia
- **Address:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## 🐛 Troubleshooting

### "Insufficient funds" error
- Get testnet ETH from the Base Sepolia faucet
- Check your wallet balance: `await ethers.provider.getBalance(address)`

### "UEN already claimed" error
- This UEN is already registered by another merchant
- Try a different UEN or check ownership with `getMerchantAddress(uen)`

### Tests failing
- Ensure you're using Node.js 20+ (`nvm use 22`)
- Clear cache: `npx hardhat clean`
- Reinstall dependencies: `npm install`

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Base Documentation](https://docs.base.org/)
- [BaseScan](https://sepolia.basescan.org/)
