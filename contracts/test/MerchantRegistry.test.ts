import { expect } from "chai";
import hre from "hardhat";
import { MerchantRegistry } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs.js";

const { ethers } = hre;

const QR_PAYLOAD_1 =
  "00020101021226390012SG.PAYNOW0101002114123456789015204000053037025406100.005802SG5909COFFEE1236009Singapore62070703ABC6304B60A";
const QR_PAYLOAD_2 =
  "00020101021126380012SG.PAYNOW0101002014123456789025204000053037025406200.005802SG5910FOODTRUCK6304A13B";
const QR_PAYLOAD_3 =
  "00020101021126390012SG.PAYNOW0101002014123456789035204000053037025406150.005802SG5911BOOKSHOP6304C55D";

describe("MerchantRegistry", function () {
  let merchantRegistry: MerchantRegistry;
  let owner: SignerWithAddress;
  let merchant1: SignerWithAddress;
  let merchant2: SignerWithAddress;

  beforeEach(async function () {
    [owner, merchant1, merchant2] = await ethers.getSigners();

    const MerchantRegistryFactory = await ethers.getContractFactory("MerchantRegistry");
    merchantRegistry = await MerchantRegistryFactory.deploy();
    await merchantRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("starts with zero registrations", async function () {
      expect(await merchantRegistry.totalMerchants()).to.equal(0);
    });
  });

  describe("registerMerchant", function () {
    it("registers a new QR payload", async function () {
      await merchantRegistry.connect(merchant1).registerMerchant(QR_PAYLOAD_1);

      expect(await merchantRegistry.isQrRegistered(QR_PAYLOAD_1)).to.be.true;
      expect(await merchantRegistry.merchantForQr(QR_PAYLOAD_1)).to.equal(merchant1.address);
      expect(await merchantRegistry.totalMerchants()).to.equal(1);
    });

    it("emits MerchantRegistered event", async function () {
      const tx = merchantRegistry.connect(merchant1).registerMerchant(QR_PAYLOAD_1);

      await expect(tx)
        .to.emit(merchantRegistry, "MerchantRegistered")
        .withArgs(merchant1.address, QR_PAYLOAD_1, anyValue);
    });

    it("allows different merchants to register unique payloads", async function () {
      await merchantRegistry.connect(merchant1).registerMerchant(QR_PAYLOAD_1);
      await merchantRegistry.connect(merchant2).registerMerchant(QR_PAYLOAD_2);

      expect(await merchantRegistry.isQrRegistered(QR_PAYLOAD_1)).to.be.true;
      expect(await merchantRegistry.isQrRegistered(QR_PAYLOAD_2)).to.be.true;
      expect(await merchantRegistry.merchantForQr(QR_PAYLOAD_1)).to.equal(merchant1.address);
      expect(await merchantRegistry.merchantForQr(QR_PAYLOAD_2)).to.equal(merchant2.address);
      expect(await merchantRegistry.totalMerchants()).to.equal(2);
    });

    it("allows the same merchant to register multiple payloads", async function () {
      await merchantRegistry.connect(merchant1).registerMerchant(QR_PAYLOAD_1);
      await merchantRegistry.connect(merchant1).registerMerchant(QR_PAYLOAD_2);

      expect(await merchantRegistry.merchantForQr(QR_PAYLOAD_1)).to.equal(merchant1.address);
      expect(await merchantRegistry.merchantForQr(QR_PAYLOAD_2)).to.equal(merchant1.address);
      expect(await merchantRegistry.totalMerchants()).to.equal(2);
    });

    it("reverts when registering an empty payload", async function () {
      await expect(merchantRegistry.connect(merchant1).registerMerchant("")).to.be.revertedWith(
        "MerchantRegistry: Empty QR payload"
      );
    });

    it("reverts when registering an already claimed payload", async function () {
      await merchantRegistry.connect(merchant1).registerMerchant(QR_PAYLOAD_1);

      await expect(merchantRegistry.connect(merchant1).registerMerchant(QR_PAYLOAD_1)).to.be.revertedWith(
        "MerchantRegistry: QR already registered"
      );
      await expect(merchantRegistry.connect(merchant2).registerMerchant(QR_PAYLOAD_1)).to.be.revertedWith(
        "MerchantRegistry: QR already registered"
      );
    });
  });

  describe("Read helpers", function () {
    beforeEach(async function () {
      await merchantRegistry.connect(merchant1).registerMerchant(QR_PAYLOAD_1);
      await merchantRegistry.connect(merchant2).registerMerchant(QR_PAYLOAD_2);
    });

    it("returns zero address for unregistered payloads", async function () {
      expect(await merchantRegistry.merchantForQr(QR_PAYLOAD_3)).to.equal(ethers.ZeroAddress);
    });

    it("reports registration status accurately", async function () {
      expect(await merchantRegistry.isQrRegistered(QR_PAYLOAD_1)).to.be.true;
      expect(await merchantRegistry.isQrRegistered(QR_PAYLOAD_2)).to.be.true;
      expect(await merchantRegistry.isQrRegistered(QR_PAYLOAD_3)).to.be.false;
    });

    it("tracks total registrations", async function () {
      expect(await merchantRegistry.totalMerchants()).to.equal(2);

      await merchantRegistry.connect(owner).registerMerchant(QR_PAYLOAD_3);
      expect(await merchantRegistry.totalMerchants()).to.equal(3);
    });
  });

  describe("Edge cases", function () {
    it("supports very long payloads", async function () {
      const longPayload = "PAYNOW".repeat(200);
      await merchantRegistry.connect(merchant1).registerMerchant(longPayload);
      expect(await merchantRegistry.merchantForQr(longPayload)).to.equal(merchant1.address);
    });
  });
});
