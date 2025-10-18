"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import QRScanner from "../components/QRScanner";
import { parsePayNowQR, formatUEN, isValidUEN } from "../lib/paynow";
import { MERCHANT_REGISTRY_ABI, MERCHANT_REGISTRY_ADDRESS } from "../lib/contracts";
import styles from "./merchant.module.css";

export default function MerchantClaim() {
  const router = useRouter();
  const { isFrameReady, setFrameReady } = useMiniKit();

  const [step, setStep] = useState<"scan" | "confirm" | "claiming">("scan");
  const [uen, setUen] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [manualEntry, setManualEntry] = useState(false);
  const [manualUEN, setManualUEN] = useState("");

  // Initialize minikit
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Check if UEN is claimed
  const { data: isClaimed, isLoading: isCheckingClaim } = useReadContract({
    address: MERCHANT_REGISTRY_ADDRESS,
    abi: MERCHANT_REGISTRY_ABI,
    functionName: "isUENClaimed",
    args: uen ? [uen] : undefined,
    query: {
      enabled: !!uen && step === "confirm",
    },
  });

  // Claim merchant contract call
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Handle QR scan
  const handleQRScan = (data: string) => {
    const parsed = parsePayNowQR(data);

    if (parsed.uen) {
      setUen(formatUEN(parsed.uen));
      setStep("confirm");
      setError("");
    } else {
      setError("No UEN found in QR code. Please try again or enter manually.");
    }
  };

  // Handle manual UEN entry
  const handleManualSubmit = () => {
    const formatted = formatUEN(manualUEN);

    if (!isValidUEN(formatted)) {
      setError("Invalid UEN format. Please check and try again.");
      return;
    }

    setUen(formatted);
    setStep("confirm");
    setError("");
  };

  // Handle claim submission
  const handleClaim = () => {
    if (!uen) return;

    setStep("claiming");
    setError("");

    try {
      writeContract({
        address: MERCHANT_REGISTRY_ADDRESS,
        abi: MERCHANT_REGISTRY_ABI,
        functionName: "claimMerchant",
        args: [uen],
      });
    } catch (err) {
      console.error("Error claiming merchant:", err);
      setError(err instanceof Error ? err.message : "Failed to claim UEN");
      setStep("confirm");
    }
  };

  // Redirect to success page after confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      router.push(`/merchant/success?uen=${encodeURIComponent(uen)}&tx=${hash}`);
    }
  }, [isConfirmed, hash, uen, router]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setError(writeError.message);
      setStep("confirm");
    }
  }, [writeError]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => router.push("/")}
          type="button"
        >
          ← Back
        </button>
        <h1 className={styles.title}>Claim Your UEN</h1>
        <p className={styles.subtitle}>
          Scan your PayNow QR code to register as a merchant
        </p>
      </div>

      <div className={styles.content}>
        {/* Step 1: Scan QR Code */}
        {step === "scan" && !manualEntry && (
          <div className={styles.scanStep}>
            <QRScanner onScan={handleQRScan} onError={setError} />

            <button
              className={styles.manualButton}
              onClick={() => setManualEntry(true)}
            >
              Enter UEN Manually
            </button>
          </div>
        )}

        {/* Manual Entry */}
        {step === "scan" && manualEntry && (
          <div className={styles.manualEntry}>
            <div className={styles.inputGroup}>
              <label htmlFor="uen">UEN Number</label>
              <input
                id="uen"
                type="text"
                value={manualUEN}
                onChange={(e) => setManualUEN(e.target.value.toUpperCase())}
                placeholder="e.g., 201234567A"
                className={styles.input}
              />
              <p className={styles.hint}>
                Enter your Singapore business registration number
              </p>
            </div>

            <div className={styles.buttonGroup}>
              <button
                className={styles.submitButton}
                onClick={handleManualSubmit}
                disabled={!manualUEN}
              >
                Continue
              </button>
              <button
                className={styles.secondaryButton}
                onClick={() => setManualEntry(false)}
              >
                Scan QR Instead
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirm UEN */}
        {step === "confirm" && (
          <div className={styles.confirmStep}>
            <div className={styles.uenDisplay}>
              <p className={styles.label}>UEN Number</p>
              <p className={styles.uenValue}>{uen}</p>
            </div>

            {isCheckingClaim ? (
              <div className={styles.loading}>Checking UEN status...</div>
            ) : isClaimed ? (
              <div className={styles.errorBox}>
                <strong>UEN Already Claimed</strong>
                <p>
                  This UEN has already been registered by another merchant.
                </p>
              </div>
            ) : (
              <>
                <div className={styles.infoBox}>
                  <p>
                    ✓ This UEN is available to claim
                    <br />✓ You will receive a non-transferable NFT
                    <br />✓ Customers can pay you using this UEN
                  </p>
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    className={styles.claimButton}
                    onClick={handleClaim}
                    disabled={isClaimed}
                  >
                    Claim UEN
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => {
                      setStep("scan");
                      setUen("");
                      setManualEntry(false);
                    }}
                  >
                    Scan Different UEN
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Claiming in Progress */}
        {step === "claiming" && (
          <div className={styles.claimingStep}>
            <div className={styles.spinner}></div>
            <h2>
              {isConfirming ? "Confirming Transaction..." : "Processing Claim..."}
            </h2>
            <p className={styles.loadingText}>
              Please wait while we register your UEN on the blockchain.
              <br />
              This may take a few moments.
            </p>
            {hash && (
              <p className={styles.txHash}>
                Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className={styles.errorBox}>
            <strong>Error</strong>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
