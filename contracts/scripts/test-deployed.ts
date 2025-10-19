import hre from "hardhat";
import { MerchantRegistry__factory } from "../../typechain-types/factories/contracts/MerchantRegistry__factory";

const { ethers } = hre;

const MERCHANT_REGISTRY_ADDRESS = "0x4b45034E7Fc0195341301f0Ba60704884Ac4A53d";

async function main() {
  console.log("🧪 Testing deployed MerchantRegistry contract...\n");

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("📝 Testing with account:", signer.address);

  // Get contract instance
  const registry = MerchantRegistry__factory.connect(
    MERCHANT_REGISTRY_ADDRESS,
    signer
  );

  console.log("📍 Contract address:", MERCHANT_REGISTRY_ADDRESS);
  console.log();

  // Test 1: Read contract info
  console.log("=== Test 1: Contract Stats ===");
  const totalMerchants = await registry.totalMerchants();

  console.log("✅ Total Merchants:", totalMerchants.toString());
  console.log();

  // Test 2: Check if a QR payload is registered
  const testPayload =
    "00020101021226390012SG.PAYNOW0101002114123456789015204000053037025406100.005802SG5909COFFEE1236009Singapore62070703ABC6304B60A";
  console.log("=== Test 2: Check QR Payload ===");
  const isRegistered = await registry.isQrRegistered(testPayload);
  console.log(`✅ Payload registered:`, isRegistered);

  if (isRegistered) {
    const merchantAddress = await registry.merchantForQr(testPayload);
    console.log(`✅ Merchant address:`, merchantAddress);
  } else {
    console.log("ℹ️  Payload not registered yet.");
  }
  console.log();

  // Test 3: Register a new payload (optional)
  console.log("=== Test 3: Register Test Payload (Optional) ===");
  console.log("⚠️  Uncomment the code below to test registering a payload");
  console.log("    This will cost gas and bind the payload to your account\n");

  /*
  const newPayload =
    "00020101021126380012SG.PAYNOW0101002014123456789025204000053037025406200.005802SG5910FOODTRUCK6304A13B";
  const alreadyRegistered = await registry.isQrRegistered(newPayload);

  if (!alreadyRegistered) {
    console.log(`📝 Registering payload...`);
    const tx = await registry.registerMerchant(newPayload);
    console.log("⏳ Transaction sent:", tx.hash);

    await tx.wait();
    console.log("✅ QR payload registered successfully!");

    const merchantAddress = await registry.merchantForQr(newPayload);
    console.log("✅ Merchant address:", merchantAddress);

    const newTotal = await registry.totalMerchants();
    console.log("✅ New total merchants:", newTotal.toString());
  } else {
    console.log(`⚠️  Payload already registered`);
  }
  */

  // Test 4: Query multiple payloads
  console.log("=== Test 4: Batch Query Test ===");
  const payloadsToCheck = [
    testPayload,
    "00020101021126390012SG.PAYNOW0101002014123456789035204000053037025406150.005802SG5911BOOKSHOP6304C55D",
  ];

  for (const payload of payloadsToCheck) {
    const registered = await registry.isQrRegistered(payload);
    if (registered) {
      const address = await registry.merchantForQr(payload);
      console.log(`✅ Payload registered by ${address}`);
    } else {
      console.log(`⭕ Payload not registered`);
    }
  }
  console.log();

  console.log("🎉 Testing completed!");
  console.log("\n📝 Contract Dashboard:");
  console.log(`   BaseScan: https://sepolia.basescan.org/address/${MERCHANT_REGISTRY_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error during testing:");
    console.error(error);
    process.exit(1);
  });
