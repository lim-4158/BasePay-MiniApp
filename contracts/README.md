# BasedPay Smart Contracts

Smart contracts for BasedPay — a crypto payment bridge that maps Singapore PayNow QR payloads directly to Base wallets.

## 📋 Overview

### MerchantRegistry.sol
`MerchantRegistry` is a lightweight registry that binds a full PayNow QR payload string to the merchant wallet that owns it.

**Key features**
- **One payload, one wallet** – a QR payload can be registered only once
- **Direct mapping** – look up the merchant wallet without decoding or NFTs
- **Simple lifecycle** – merchants call `registerMerchant(qrPayload)` to claim ownership
- **Transparent state** – anyone can query if a payload is registered and to whom

## 🛠️ Setup

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Configure environment**
   ```bash
   cp .env.contracts.example .env
   ```
   Populate the file with:
   - Deployer private key
   - Base Sepolia RPC URL
   - BaseScan API key (optional, for verification)

3. **Fund your deployer**
   Grab Base Sepolia ETH from the [official faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet).

## 🧪 Testing

Run the Hardhat test suite:
```bash
npm run test:contracts
```

Sample output:
```
  MerchantRegistry
    ✓ Deployment
    ✓ registerMerchant
    ✓ Read helpers
    ✓ Edge cases

  8 passing
```

## 🚀 Deployment

1. **Compile**
   ```bash
   npm run compile:contracts
   ```
2. **Deploy to Base Sepolia**
   ```bash
   npm run deploy:baseSepolia
   ```
   After deployment you’ll see the on-chain address. Save it to your `.env` so the app can read it.

3. **Verify (optional)**
   ```bash
   npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
   ```

## 📖 Contract Interface

### `registerMerchant(string qrPayload)`
Registers the caller as the merchant for the provided PayNow QR payload.

- Reverts if the payload string is empty
- Reverts if the payload has already been registered

```solidity
merchantRegistry.registerMerchant(fullQrPayload);
```

### `merchantForQr(string qrPayload) → address`
Returns the wallet that registered the payload, or `address(0)` if it’s unclaimed.

```solidity
address merchant = merchantRegistry.merchantForQr(fullQrPayload);
```

### `isQrRegistered(string qrPayload) → bool`
Returns `true` if the payload has an associated merchant.

### `totalMerchants() → uint256`
Number of unique payloads registered.

## 📁 Project Structure

```
contracts/
├── MerchantRegistry.sol        # Core registry contract
├── test/
│   └── MerchantRegistry.test.ts  # Unit tests
└── scripts/
    ├── deploy.ts               # Deployment helper
    └── test-deployed.ts        # Manual sanity checks for live contracts
```

## 🌐 Network Details

**Base Sepolia**
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org

**USDC (test token)**
- Address: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## 🐛 Troubleshooting

- **“Empty QR payload” revert** – ensure you pass the full string exported from the QR.
- **“QR already registered” revert** – the payload is already mapped on-chain; either coordinate with the current owner or use a different payload.
- **Tests failing** – make sure you’re on Node 20+, clear cache with `npx hardhat clean`, then reinstall dependencies.

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Base Docs](https://docs.base.org/)
- [BaseScan](https://sepolia.basescan.org/)
- [EMVCo QR Specification](https://www.emvco.com/emv-technologies/qrcode/)
 