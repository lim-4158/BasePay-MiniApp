import hre from "hardhat";

const { ethers } = hre;

const MERCHANT_REGISTRY_ADDRESS = "0x4b45034E7Fc0195341301f0Ba60704884Ac4A53d";

async function main() {
  console.log("🧪 Testing deployed MerchantRegistry contract...\n");

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("📝 Testing with account:", signer.address);

  // Get contract instance
  const MerchantRegistry = await ethers.getContractFactory("MerchantRegistry");
  const registry = MerchantRegistry.attach(MERCHANT_REGISTRY_ADDRESS);

  console.log("📍 Contract address:", MERCHANT_REGISTRY_ADDRESS);
  console.log();

  // Test 1: Read contract info
  console.log("=== Test 1: Contract Info ===");
  const name = await registry.name();
  const symbol = await registry.symbol();
  const totalMerchants = await registry.totalMerchants();

  console.log("✅ Name:", name);
  console.log("✅ Symbol:", symbol);
  console.log("✅ Total Merchants:", totalMerchants.toString());
  console.log();

  // Test 2: Check if a UEN is claimed
  const testUEN = "201234567A";
  console.log("=== Test 2: Check UEN Status ===");
  const isClaimed = await registry.isUENClaimed(testUEN);
  console.log(`✅ UEN "${testUEN}" claimed:`, isClaimed);

  if (isClaimed) {
    const merchantAddress = await registry.getMerchantAddress(testUEN);
    console.log(`✅ Merchant address:`, merchantAddress);
  }
  console.log();

  // Test 3: Claim a new UEN (if you want to test claiming)
  console.log("=== Test 3: Claim Test UEN (Optional) ===");
  console.log("⚠️  Uncomment the code below to test claiming a UEN");
  console.log("    This will cost gas and claim the UEN to your account\n");

  /*
  const newTestUEN = "202398765B";
  const isNewUENClaimed = await registry.isUENClaimed(newTestUEN);

  if (!isNewUENClaimed) {
    console.log(`📝 Claiming UEN: ${newTestUEN}...`);
    const tx = await registry.claimMerchant(newTestUEN);
    console.log("⏳ Transaction sent:", tx.hash);

    await tx.wait();
    console.log("✅ UEN claimed successfully!");

    const merchantAddress = await registry.getMerchantAddress(newTestUEN);
    console.log("✅ Merchant address:", merchantAddress);

    const newTotal = await registry.totalMerchants();
    console.log("✅ New total merchants:", newTotal.toString());
  } else {
    console.log(`⚠️  UEN ${newTestUEN} is already claimed`);
  }
  */

  // Test 4: Query multiple UENs
  console.log("=== Test 4: Batch Query Test ===");
  const uensToCheck = ["201234567A", "199812345B", "202198765C"];

  for (const uen of uensToCheck) {
    const claimed = await registry.isUENClaimed(uen);
    if (claimed) {
      const address = await registry.getMerchantAddress(uen);
      console.log(`✅ ${uen}: Claimed by ${address}`);
    } else {
      console.log(`⭕ ${uen}: Not claimed`);
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
