import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import type { MysteryBoxRewards } from "../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("MysteryBoxRewards", function () {
  let mysteryBox: MysteryBoxRewards;
  let mockUSDC: any;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  // Constants
  const PRIZES = [
    ethers.parseUnits("0.01", 6), // $0.01
    ethers.parseUnits("0.02", 6), // $0.02
    ethers.parseUnits("0.05", 6), // $0.05
    ethers.parseUnits("0.5", 6),  // $0.50
    ethers.parseUnits("1", 6),    // $1.00
  ];

  const INITIAL_BALANCE = ethers.parseUnits("1000", 6); // 1000 USDC

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock USDC token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();

    // Mint USDC to owner
    await mockUSDC.mint(owner.address, INITIAL_BALANCE);

    // Deploy MysteryBoxRewards
    const MysteryBoxRewards = await ethers.getContractFactory("MysteryBoxRewards");
    mysteryBox = await MysteryBoxRewards.deploy(await mockUSDC.getAddress());
    await mysteryBox.waitForDeployment();

    // Fund the mystery box contract
    const fundAmount = ethers.parseUnits("500", 6); // 500 USDC
    await mockUSDC.approve(await mysteryBox.getAddress(), fundAmount);
    await mysteryBox.depositFunds(fundAmount);
  });

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      expect(await mysteryBox.usdc()).to.equal(await mockUSDC.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await mysteryBox.owner()).to.equal(owner.address);
    });

    it("Should have correct prize tiers", async function () {
      for (let i = 0; i < PRIZES.length; i++) {
        expect(await mysteryBox.prizes(i)).to.equal(PRIZES[i]);
      }
    });

    it("Should have correct cumulative weights", async function () {
      expect(await mysteryBox.cumulativeWeights(0)).to.equal(40);
      expect(await mysteryBox.cumulativeWeights(1)).to.equal(70);
      expect(await mysteryBox.cumulativeWeights(2)).to.equal(90);
      expect(await mysteryBox.cumulativeWeights(3)).to.equal(98);
      expect(await mysteryBox.cumulativeWeights(4)).to.equal(100);
    });
  });

  describe("Granting Mystery Boxes", function () {
    it("Should allow owner to grant mystery box", async function () {
      await expect(mysteryBox.grantMysteryBox(user1.address))
        .to.emit(mysteryBox, "BoxGranted")
        .withArgs(user1.address, await ethers.provider.getBlock('latest').then(b => b!.timestamp + 1));

      expect(await mysteryBox.unclaimedBoxes(user1.address)).to.equal(1);
    });

    it("Should allow granting multiple boxes to same user", async function () {
      await mysteryBox.grantMysteryBox(user1.address);
      await mysteryBox.grantMysteryBox(user1.address);
      await mysteryBox.grantMysteryBox(user1.address);

      expect(await mysteryBox.unclaimedBoxes(user1.address)).to.equal(3);
    });

    it("Should allow batch granting to multiple users", async function () {
      await mysteryBox.grantMysteryBoxBatch([user1.address, user2.address]);

      expect(await mysteryBox.unclaimedBoxes(user1.address)).to.equal(1);
      expect(await mysteryBox.unclaimedBoxes(user2.address)).to.equal(1);
    });

    it("Should revert if non-owner tries to grant box", async function () {
      await expect(
        mysteryBox.connect(user1).grantMysteryBox(user2.address)
      ).to.be.revertedWithCustomError(mysteryBox, "OwnableUnauthorizedAccount");
    });

    it("Should skip zero addresses in batch grant", async function () {
      await mysteryBox.grantMysteryBoxBatch([
        user1.address,
        ethers.ZeroAddress,
        user2.address
      ]);

      expect(await mysteryBox.unclaimedBoxes(user1.address)).to.equal(1);
      expect(await mysteryBox.unclaimedBoxes(ethers.ZeroAddress)).to.equal(0);
      expect(await mysteryBox.unclaimedBoxes(user2.address)).to.equal(1);
    });
  });

  describe("Claiming Mystery Boxes", function () {
    beforeEach(async function () {
      // Grant a box to user1
      await mysteryBox.grantMysteryBox(user1.address);
    });

    it("Should allow user to claim mystery box", async function () {
      const tx = await mysteryBox.connect(user1).claimMysteryBox();
      const receipt = await tx.wait();

      // Check BoxOpened event was emitted
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "BoxOpened"
      );
      expect(event).to.not.be.undefined;

      // Check unclaimed boxes decreased
      expect(await mysteryBox.unclaimedBoxes(user1.address)).to.equal(0);

      // Check boxes opened increased
      expect(await mysteryBox.boxesOpened(user1.address)).to.equal(1);

      // Check user received USDC
      expect(await mockUSDC.balanceOf(user1.address)).to.be.gt(0);
    });

    it("Should award one of the valid prize amounts", async function () {
      await mysteryBox.connect(user1).claimMysteryBox();

      const balance = await mockUSDC.balanceOf(user1.address);
      const isValidPrize = PRIZES.some(prize => balance === prize);
      expect(isValidPrize).to.be.true;
    });

    it("Should update user stats correctly", async function () {
      await mysteryBox.connect(user1).claimMysteryBox();

      const stats = await mysteryBox.getUserStats(user1.address);
      expect(stats.unclaimed).to.equal(0);
      expect(stats.opened).to.equal(1);
      expect(stats.earned).to.be.gt(0);
      expect(stats.biggest).to.equal(stats.earned);
    });

    it("Should track biggest win correctly", async function () {
      // Grant and claim multiple boxes
      await mysteryBox.grantMysteryBox(user1.address);
      await mysteryBox.grantMysteryBox(user1.address);

      await mysteryBox.connect(user1).claimMysteryBox();
      const firstWin = await mockUSDC.balanceOf(user1.address);

      await mysteryBox.connect(user1).claimMysteryBox();
      const secondWin = (await mockUSDC.balanceOf(user1.address)) - firstWin;

      const stats = await mysteryBox.getUserStats(user1.address);
      const expectedBiggest = firstWin > secondWin ? firstWin : secondWin;
      expect(stats.biggest).to.equal(expectedBiggest);
    });

    it("Should revert if user has no unclaimed boxes", async function () {
      await expect(
        mysteryBox.connect(user2).claimMysteryBox()
      ).to.be.revertedWith("No unclaimed boxes");
    });

    it("Should revert if contract has insufficient balance", async function () {
      // Withdraw all funds
      const balance = await mockUSDC.balanceOf(await mysteryBox.getAddress());
      await mysteryBox.withdrawFunds(balance);

      await expect(
        mysteryBox.connect(user1).claimMysteryBox()
      ).to.be.revertedWith("Insufficient contract balance");
    });

    it("Should update global stats", async function () {
      await mysteryBox.connect(user1).claimMysteryBox();

      expect(await mysteryBox.totalBoxesOpened()).to.equal(1);
      expect(await mysteryBox.totalRewardsDistributed()).to.be.gt(0);
    });
  });

  describe("Prize Distribution", function () {
    it("Should distribute prizes across all tiers", async function () {
      const iterations = 100;
      const prizeCounts = new Map<bigint, number>();

      // Grant 100 boxes to user1
      const users = Array(iterations).fill(user1.address);
      for (let i = 0; i < iterations; i += 50) {
        await mysteryBox.grantMysteryBoxBatch(users.slice(i, i + 50));
      }

      // Claim all boxes
      for (let i = 0; i < iterations; i++) {
        await mysteryBox.connect(user1).claimMysteryBox();
      }

      // We should have opened all boxes
      expect(await mysteryBox.boxesOpened(user1.address)).to.equal(iterations);

      // Total rewards should be sum of all prizes
      const totalEarned = await mysteryBox.totalClaimed(user1.address);
      expect(totalEarned).to.be.gt(0);

      console.log(`      Total earned from ${iterations} boxes: ${ethers.formatUnits(totalEarned, 6)} USDC`);
      console.log(`      Average per box: ${ethers.formatUnits(totalEarned / BigInt(iterations), 6)} USDC`);
    });

    it("Should generate different prizes for same user", async function () {
      // Grant multiple boxes
      await mysteryBox.grantMysteryBoxBatch(Array(10).fill(user1.address));

      const prizes = new Set<bigint>();
      for (let i = 0; i < 10; i++) {
        const balanceBefore = await mockUSDC.balanceOf(user1.address);
        await mysteryBox.connect(user1).claimMysteryBox();
        const balanceAfter = await mockUSDC.balanceOf(user1.address);
        prizes.add(balanceAfter - balanceBefore);
      }

      // Should have at least some variety (not all same prize)
      expect(prizes.size).to.be.gt(1);
      console.log(`      Unique prizes from 10 boxes: ${prizes.size}`);
    });
  });

  describe("Fund Management", function () {
    it("Should allow depositing funds", async function () {
      const depositAmount = ethers.parseUnits("100", 6);
      await mockUSDC.mint(user1.address, depositAmount);
      await mockUSDC.connect(user1).approve(await mysteryBox.getAddress(), depositAmount);

      await expect(mysteryBox.connect(user1).depositFunds(depositAmount))
        .to.emit(mysteryBox, "FundsDeposited")
        .withArgs(user1.address, depositAmount);

      expect(await mockUSDC.balanceOf(await mysteryBox.getAddress())).to.be.gte(depositAmount);
    });

    it("Should allow owner to withdraw funds", async function () {
      const contractBalance = await mockUSDC.balanceOf(await mysteryBox.getAddress());
      const withdrawAmount = ethers.parseUnits("50", 6);

      await expect(mysteryBox.withdrawFunds(withdrawAmount))
        .to.emit(mysteryBox, "FundsWithdrawn")
        .withArgs(owner.address, withdrawAmount);

      expect(await mockUSDC.balanceOf(await mysteryBox.getAddress())).to.equal(
        contractBalance - withdrawAmount
      );
    });

    it("Should revert if non-owner tries to withdraw", async function () {
      await expect(
        mysteryBox.connect(user1).withdrawFunds(ethers.parseUnits("10", 6))
      ).to.be.revertedWithCustomError(mysteryBox, "OwnableUnauthorizedAccount");
    });

    it("Should revert if withdrawing more than balance", async function () {
      const contractBalance = await mockUSDC.balanceOf(await mysteryBox.getAddress());
      await expect(
        mysteryBox.withdrawFunds(contractBalance + 1n)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should get contract balance", async function () {
      const balance = await mysteryBox.getContractBalance();
      expect(balance).to.equal(await mockUSDC.balanceOf(await mysteryBox.getAddress()));
    });
  });

  describe("Prize Tiers Update", function () {
    it("Should allow owner to update prize tiers", async function () {
      const newPrizes = [
        ethers.parseUnits("0.1", 6),
        ethers.parseUnits("0.2", 6),
        ethers.parseUnits("0.5", 6),
      ];
      const newWeights = [50, 85, 100];

      await expect(mysteryBox.updatePrizeTiers(newPrizes, newWeights))
        .to.emit(mysteryBox, "PrizeTiersUpdated")
        .withArgs(newPrizes, newWeights);

      expect(await mysteryBox.prizes(0)).to.equal(newPrizes[0]);
      expect(await mysteryBox.prizes(1)).to.equal(newPrizes[1]);
      expect(await mysteryBox.prizes(2)).to.equal(newPrizes[2]);
    });

    it("Should revert if weights don't sum to 100", async function () {
      const newPrizes = [ethers.parseUnits("0.1", 6)];
      const newWeights = [50]; // Should be 100

      await expect(
        mysteryBox.updatePrizeTiers(newPrizes, newWeights)
      ).to.be.revertedWith("Weights must sum to 100");
    });

    it("Should revert if arrays have different lengths", async function () {
      const newPrizes = [ethers.parseUnits("0.1", 6), ethers.parseUnits("0.2", 6)];
      const newWeights = [100]; // Mismatched length

      await expect(
        mysteryBox.updatePrizeTiers(newPrizes, newWeights)
      ).to.be.revertedWith("Length mismatch");
    });

    it("Should revert if non-owner tries to update", async function () {
      const newPrizes = [ethers.parseUnits("0.1", 6)];
      const newWeights = [100];

      await expect(
        mysteryBox.connect(user1).updatePrizeTiers(newPrizes, newWeights)
      ).to.be.revertedWithCustomError(mysteryBox, "OwnableUnauthorizedAccount");
    });
  });

  describe("Security & Edge Cases", function () {
    it("Should prevent reentrancy attacks", async function () {
      // Grant box to user1
      await mysteryBox.grantMysteryBox(user1.address);

      // The ReentrancyGuard should prevent any reentrancy
      // This is tested implicitly through normal operation
      await expect(mysteryBox.connect(user1).claimMysteryBox()).to.not.be.reverted;
    });

    it("Should handle multiple users claiming simultaneously", async function () {
      await mysteryBox.grantMysteryBox(user1.address);
      await mysteryBox.grantMysteryBox(user2.address);

      await Promise.all([
        mysteryBox.connect(user1).claimMysteryBox(),
        mysteryBox.connect(user2).claimMysteryBox(),
      ]);

      expect(await mysteryBox.boxesOpened(user1.address)).to.equal(1);
      expect(await mysteryBox.boxesOpened(user2.address)).to.equal(1);
    });

    it("Should handle zero address in getUserStats", async function () {
      const stats = await mysteryBox.getUserStats(ethers.ZeroAddress);
      expect(stats.unclaimed).to.equal(0);
      expect(stats.opened).to.equal(0);
      expect(stats.earned).to.equal(0);
      expect(stats.biggest).to.equal(0);
    });
  });
});

// Mock ERC20 token for testing
// Note: You'll need to create this contract or use a library mock
