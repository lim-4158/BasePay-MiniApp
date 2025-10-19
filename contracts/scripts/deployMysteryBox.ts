import { ethers } from "hardhat";

async function main() {
  console.log("🎁 Deploying MysteryBoxRewards contract...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // USDC address on Base Mainnet
  const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  console.log("USDC Address:", USDC_ADDRESS);

  // Deploy MysteryBoxRewards
  const MysteryBoxRewards = await ethers.getContractFactory("MysteryBoxRewards");
  const mysteryBox = await MysteryBoxRewards.deploy(USDC_ADDRESS);
  await mysteryBox.waitForDeployment();

  const mysteryBoxAddress = await mysteryBox.getAddress();
  console.log("\n✅ MysteryBoxRewards deployed to:", mysteryBoxAddress);

  // Get initial state
  const prizes = await mysteryBox.prizes(0);
  console.log("\nPrize Tiers:");
  console.log("- $0.01 USDC (40% chance)");
  console.log("- $0.02 USDC (30% chance)");
  console.log("- $0.05 USDC (20% chance)");
  console.log("- $0.50 USDC (8% chance)");
  console.log("- $1.00 USDC (2% chance)");

  console.log("\n📝 Next Steps:");
  console.log("1. Add to .env.local:");
  console.log(`   NEXT_PUBLIC_MYSTERY_BOX_ADDRESS=${mysteryBoxAddress}`);
  console.log("\n2. Fund the contract with USDC:");
  console.log(`   - Approve USDC spending for the contract`);
  console.log(`   - Call depositFunds(amount) with USDC amount (6 decimals)`);
  console.log(`   - Example: 100 USDC = 100000000 (100 * 1e6)`);
  console.log("\n3. Grant mystery boxes to users:");
  console.log(`   - Call grantMysteryBox(userAddress) after they share`);
  console.log("\n4. Verify contract on BaseScan (optional):");
  console.log(`   npx hardhat verify --network base ${mysteryBoxAddress} ${USDC_ADDRESS}`);

  // Save deployment info
  const deploymentInfo = {
    network: "base",
    mysteryBoxRewards: mysteryBoxAddress,
    usdc: USDC_ADDRESS,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📄 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
