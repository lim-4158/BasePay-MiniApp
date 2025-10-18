import { expect } from "chai";
import hre from "hardhat";
import { MerchantRegistry } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("MerchantRegistry", function () {
  let merchantRegistry: MerchantRegistry;
  let owner: SignerWithAddress;
  let merchant1: SignerWithAddress;
  let merchant2: SignerWithAddress;
  let user: SignerWithAddress;

  const TEST_UEN_1 = "201234567A";
  const TEST_UEN_2 = "199812345B";
  const TEST_UEN_3 = "202198765C";

  beforeEach(async function () {
    // Get signers
    [owner, merchant1, merchant2, user] = await ethers.getSigners();

    // Deploy contract
    const MerchantRegistryFactory = await ethers.getContractFactory("MerchantRegistry");
    merchantRegistry = await MerchantRegistryFactory.deploy();
    await merchantRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await merchantRegistry.name()).to.equal("BasedPay Merchant");
      expect(await merchantRegistry.symbol()).to.equal("BPAY");
    });

    it("Should start with zero merchants", async function () {
      expect(await merchantRegistry.totalMerchants()).to.equal(0);
    });
  });

  describe("Claiming Merchants", function () {
    it("Should allow claiming a new UEN", async function () {
      const tx = await merchantRegistry.connect(merchant1).claimMerchant(TEST_UEN_1);
      const receipt = await tx.wait();

      // Check that merchant is claimed
      expect(await merchantRegistry.isUENClaimed(TEST_UEN_1)).to.be.true;

      // Check that merchant owns the NFT
      const merchantAddress = await merchantRegistry.getMerchantAddress(TEST_UEN_1);
      expect(merchantAddress).to.equal(merchant1.address);

      // Check total merchants increased
      expect(await merchantRegistry.totalMerchants()).to.equal(1);
    });

    it("Should emit MerchantClaimed event", async function () {
      const tx = await merchantRegistry.connect(merchant1).claimMerchant(TEST_UEN_1);

      await expect(tx)
        .to.emit(merchantRegistry, "MerchantClaimed")
        .withArgs(
          merchant1.address,
          TEST_UEN_1,
          0, // First token ID
          await ethers.provider.getBlock("latest").then(b => b?.timestamp)
        );
    });

    it("Should assign correct token ID", async function () {
      // Claim first UEN
      await merchantRegistry.connect(merchant1).claimMerchant(TEST_UEN_1);
      expect(await merchantRegistry.uenToTokenId(TEST_UEN_1)).to.equal(0);

      // Claim second UEN
      await merchantRegistry.connect(merchant2).claimMerchant(TEST_UEN_2);
      expect(await merchantRegistry.uenToTokenId(TEST_UEN_2)).to.equal(1);
    });

    it("Should store bidirectional mapping (UEN <-> TokenId)", async function () {
      await merchantRegistry.connect(merchant1).claimMerchant(TEST_UEN_1);

      const tokenId = await merchantRegistry.uenToTokenId(TEST_UEN_1);
      expect(tokenId).to.equal(0);

      const uen = await merchantRegistry.tokenIdToUEN(tokenId);
      expect(uen).to.equal(TEST_UEN_1);
    });

    it("Should allow multiple different UENs to be claimed", async function () {
      await merchantRegistry.connect(merchant1).claimMerchant(TEST_UEN_1);
      await merchantRegistry.connect(merchant2).claimMerchant(TEST_UEN_2);
      await merchantRegistry.connect(user).claimMerchant(TEST_UEN_3);

      expect(await merchantRegistry.totalMerchants()).to.equal(3);
      expect(await merchantRegistry.getMerchantAddress(TEST_UEN_1)).to.equal(merchant1.address);
      expect(await merchantRegistry.getMerchantAddress(TEST_UEN_2)).to.equal(merchant2.address);
      expect(await merchantRegistry.getMerchantAddress(TEST_UEN_3)).to.equal(user.address);
    });

    it("Should revert when claiming empty UEN", async function () {
      await expect(
        merchantRegistry.connect(merchant1).claimMerchant("")
      ).to.be.revertedWith("MerchantRegistry: Empty UEN");
    });

    it("Should revert when claiming already claimed UEN", async function () {
      // First claim succeeds
      await merchantRegistry.connect(merchant1).claimMerchant(TEST_UEN_1);

      // Second claim by same merchant fails
      await expect(
        merchantRegistry.connect(merchant1).claimMerchant(TEST_UEN_1)
      ).to.be.revertedWith("MerchantRegistry: UEN already claimed");

      // Second claim by different merchant also fails
      await expect(
        merchantRegistry.connect(merchant2).claimMerchant(TEST_UEN_1)
      ).to.be.revertedWith("MerchantRegistry: UEN already claimed");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Set up some claimed UENs
      await merchantRegistry.connect(merchant1).claimMerchant(TEST_UEN_1);
      await merchantRegistry.connect(merchant2).claimMerchant(TEST_UEN_2);
    });

    it("Should return correct merchant address for claimed UEN", async function () {
      expect(await merchantRegistry.getMerchantAddress(TEST_UEN_1)).to.equal(merchant1.address);
      expect(await merchantRegistry.getMerchantAddress(TEST_UEN_2)).to.equal(merchant2.address);
    });

    it("Should return zero address for unclaimed UEN", async function () {
      expect(await merchantRegistry.getMerchantAddress(TEST_UEN_3)).to.equal(ethers.ZeroAddress);
    });

    it("Should correctly report if UEN is claimed", async function () {
      expect(await merchantRegistry.isUENClaimed(TEST_UEN_1)).to.be.true;
      expect(await merchantRegistry.isUENClaimed(TEST_UEN_2)).to.be.true;
      expect(await merchantRegistry.isUENClaimed(TEST_UEN_3)).to.be.false;
    });

    it("Should return correct total merchants count", async function () {
      expect(await merchantRegistry.totalMerchants()).to.equal(2);

      await merchantRegistry.connect(user).claimMerchant(TEST_UEN_3);
      expect(await merchantRegistry.totalMerchants()).to.equal(3);
    });
  });

  describe("Soulbound (Non-transferable) Behavior", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      // Claim a merchant
      const tx = await merchantRegistry.connect(merchant1).claimMerchant(TEST_UEN_1);
      await tx.wait();
      tokenId = await merchantRegistry.uenToTokenId(TEST_UEN_1);
    });

    it("Should prevent transfer using transferFrom", async function () {
      await expect(
        merchantRegistry.connect(merchant1).transferFrom(merchant1.address, merchant2.address, tokenId)
      ).to.be.revertedWith("MerchantRegistry: Token is soulbound and cannot be transferred");
    });

    it("Should prevent transfer using safeTransferFrom", async function () {
      await expect(
        merchantRegistry.connect(merchant1)["safeTransferFrom(address,address,uint256)"](
          merchant1.address,
          merchant2.address,
          tokenId
        )
      ).to.be.revertedWith("MerchantRegistry: Token is soulbound and cannot be transferred");
    });

    it("Should prevent approval and transfer", async function () {
      // Approve merchant2
      await merchantRegistry.connect(merchant1).approve(merchant2.address, tokenId);

      // Transfer should still fail
      await expect(
        merchantRegistry.connect(merchant2).transferFrom(merchant1.address, merchant2.address, tokenId)
      ).to.be.revertedWith("MerchantRegistry: Token is soulbound and cannot be transferred");
    });

    it("Should maintain ownership after failed transfer attempt", async function () {
      // Try to transfer
      await expect(
        merchantRegistry.connect(merchant1).transferFrom(merchant1.address, merchant2.address, tokenId)
      ).to.be.revertedWith("MerchantRegistry: Token is soulbound and cannot be transferred");

      // Verify ownership unchanged
      expect(await merchantRegistry.ownerOf(tokenId)).to.equal(merchant1.address);
      expect(await merchantRegistry.getMerchantAddress(TEST_UEN_1)).to.equal(merchant1.address);
    });
  });

  describe("ERC721 Standard Functions", function () {
    let tokenId: bigint;

    beforeEach(async function () {
      await merchantRegistry.connect(merchant1).claimMerchant(TEST_UEN_1);
      tokenId = await merchantRegistry.uenToTokenId(TEST_UEN_1);
    });

    it("Should support balanceOf", async function () {
      expect(await merchantRegistry.balanceOf(merchant1.address)).to.equal(1);
      expect(await merchantRegistry.balanceOf(merchant2.address)).to.equal(0);
    });

    it("Should support ownerOf", async function () {
      expect(await merchantRegistry.ownerOf(tokenId)).to.equal(merchant1.address);
    });

    it("Should revert ownerOf for non-existent token", async function () {
      await expect(
        merchantRegistry.ownerOf(999)
      ).to.be.revertedWithCustomError(merchantRegistry, "ERC721NonexistentToken");
    });

    it("Should allow approval (even though transfer is blocked)", async function () {
      await merchantRegistry.connect(merchant1).approve(merchant2.address, tokenId);
      expect(await merchantRegistry.getApproved(tokenId)).to.equal(merchant2.address);
    });

    it("Should allow setApprovalForAll", async function () {
      await merchantRegistry.connect(merchant1).setApprovalForAll(merchant2.address, true);
      expect(await merchantRegistry.isApprovedForAll(merchant1.address, merchant2.address)).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle long UEN strings", async function () {
      const longUEN = "A".repeat(100);
      await merchantRegistry.connect(merchant1).claimMerchant(longUEN);
      expect(await merchantRegistry.isUENClaimed(longUEN)).to.be.true;
    });

    it("Should handle UENs with special characters", async function () {
      const specialUEN = "UEN-2024-@#$%";
      await merchantRegistry.connect(merchant1).claimMerchant(specialUEN);
      expect(await merchantRegistry.getMerchantAddress(specialUEN)).to.equal(merchant1.address);
    });

    it("Should handle UENs with spaces", async function () {
      const uenWithSpace = "201234567 A";
      await merchantRegistry.connect(merchant1).claimMerchant(uenWithSpace);
      expect(await merchantRegistry.isUENClaimed(uenWithSpace)).to.be.true;
    });

    it("Should treat case-sensitive UENs as different", async function () {
      const lowerUEN = "abc123";
      const upperUEN = "ABC123";

      await merchantRegistry.connect(merchant1).claimMerchant(lowerUEN);
      await merchantRegistry.connect(merchant2).claimMerchant(upperUEN);

      expect(await merchantRegistry.getMerchantAddress(lowerUEN)).to.equal(merchant1.address);
      expect(await merchantRegistry.getMerchantAddress(upperUEN)).to.equal(merchant2.address);
    });
  });
});
