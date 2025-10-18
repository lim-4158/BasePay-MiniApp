import hre from "hardhat";

const { ethers } = hre;

async function main() {
  console.log("🚀 Starting MerchantRegistry deployment to Base Sepolia...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy MerchantRegistry
  console.log("📦 Deploying MerchantRegistry contract...");
  const MerchantRegistry = await ethers.getContractFactory("MerchantRegistry");
  const merchantRegistry = await MerchantRegistry.deploy();

  await merchantRegistry.waitForDeployment();

  const contractAddress = await merchantRegistry.getAddress();
  console.log("✅ MerchantRegistry deployed to:", contractAddress);

  // Wait for a few confirmations before reading state
  console.log("⏳ Waiting for confirmations...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Verify contract details
  const name = await merchantRegistry.name();
  const symbol = await merchantRegistry.symbol();
  const totalMerchants = await merchantRegistry.totalMerchants();

  console.log("\n📋 Contract Details:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Total Merchants:", totalMerchants.toString());

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("   1. Save this address to your .env file:");
  console.log(`      NEXT_PUBLIC_MERCHANT_REGISTRY_ADDRESS=${contractAddress}`);
  console.log("\n   2. Verify contract on BaseScan (optional):");
  console.log(`      npx hardhat verify --network baseSepolia ${contractAddress}`);
  console.log("\n   3. View on BaseScan:");
  console.log(`      https://sepolia.basescan.org/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error during deployment:");
    console.error(error);
    process.exit(1);
  });
