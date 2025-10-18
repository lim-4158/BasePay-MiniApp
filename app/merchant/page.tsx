"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import QRScanner from "../components/QRScanner";
import { parsePayNowQR, type PayNowQRData } from "../lib/paynow";
import { MERCHANT_REGISTRY_ABI, MERCHANT_REGISTRY_ADDRESS } from "../lib/contracts";
import { addQRCode } from "../lib/qrStorage";
import styles from "./merchant.module.css";

type Step = "scan" | "confirm" | "naming" | "registering";

const previewPayload = (payload: string): string => {
  if (payload.length <= 80) {
    return payload;
  }

  return `${payload.slice(0, 40)}...${payload.slice(-20)}`;
};

export default function MerchantRegistration() {
  const router = useRouter();
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { address } = useAccount();

  const [step, setStep] = useState<Step>("scan");
  const [qrPayload, setQrPayload] = useState("");
  const [qrDetails, setQrDetails] = useState<PayNowQRData | null>(null);
  const [qrName, setQrName] = useState("");
  const [error, setError] = useState("");
  const [manualEntry, setManualEntry] = useState(false);
  const [manualPayload, setManualPayload] = useState("");

  // Initialize minikit
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const shouldCheckRegistration = qrPayload.length > 0 && step === "naming";

  // Check if QR payload is registered
  const { data: isRegistered, isLoading: isCheckingRegistration } = useReadContract({
    address: MERCHANT_REGISTRY_ADDRESS,
    abi: MERCHANT_REGISTRY_ABI,
    functionName: "isQrRegistered",
    args: shouldCheckRegistration ? [qrPayload] : undefined,
    query: {
      enabled: shouldCheckRegistration,
    },
  });

  // Register merchant contract call
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const resetToScan = () => {
    setStep("scan");
    setQrPayload("");
    setQrDetails(null);
    setManualPayload("");
    setError("");
  };

  // Handle QR scan
  const handleQRScan = (data: string) => {
    const parsed = parsePayNowQR(data);

    setQrPayload(parsed.raw);
    setQrDetails(parsed);
    setStep("naming");
    setError("");
    setManualEntry(false);
  };

  // Handle manual payload entry
  const handleManualSubmit = () => {
    const parsed = parsePayNowQR(manualPayload);

    if (!parsed.raw) {
      setError("Please paste the full QR payload.");
      return;
    }

    setQrPayload(parsed.raw);
    setQrDetails(parsed);
    setStep("naming");
    setError("");
    setManualEntry(false);
  };

  // Handle registration submission
  const handleRegister = () => {
    if (!qrPayload) return;

    setStep("registering");
    setError("");

    try {
      writeContract({
        address: MERCHANT_REGISTRY_ADDRESS,
        abi: MERCHANT_REGISTRY_ABI,
        functionName: "registerMerchant",
        args: [qrPayload],
      });
    } catch (err) {
      console.error("Error registering merchant:", err);
      setError(err instanceof Error ? err.message : "Failed to register QR payload");
      setStep("confirm");
    }
  };

  // Save to local storage and redirect after confirmation
  useEffect(() => {
    if (isConfirmed && hash && address) {
      try {
        addQRCode(address, qrPayload, qrName, hash);
        router.push(`/merchant/success?qr=${encodeURIComponent(qrPayload)}&tx=${hash}&name=${encodeURIComponent(qrName)}`);
      } catch (error) {
        console.error("Error saving QR code:", error);
        router.push(`/merchant/success?qr=${encodeURIComponent(qrPayload)}&tx=${hash}`);
      }
    }
  }, [isConfirmed, hash, qrPayload, qrName, address, router]);

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
        <button className={styles.backButton} onClick={() => router.push("/")} type="button">
          ← Back
        </button>
        <h1 className={styles.title}>Register Your PayNow QR</h1>
        <p className={styles.subtitle}>Scan the exact PayNow QR payload you want customers to pay</p>
      </div>

      <div className={styles.content}>
        {/* Step 1: Scan QR Code */}
        {step === "scan" && !manualEntry && (
          <div className={styles.scanStep}>
            <QRScanner onScan={handleQRScan} onError={setError} />

            <button className={styles.manualButton} onClick={() => setManualEntry(true)}>
              Enter QR Payload Manually
            </button>
          </div>
        )}

        {/* Manual Entry */}
        {step === "scan" && manualEntry && (
          <div className={styles.manualEntry}>
            <div className={styles.inputGroup}>
              <label htmlFor="qrPayload">PayNow QR Payload</label>
              <textarea
                id="qrPayload"
                value={manualPayload}
                onChange={(e) => setManualPayload(e.target.value)}
                placeholder="Paste the full string encoded in your PayNow QR"
                className={styles.textArea}
                rows={6}
              />
              <p className={styles.hint}>You can find this by exporting the QR from your banking portal.</p>
            </div>

            <div className={styles.buttonGroup}>
              <button className={styles.submitButton} onClick={handleManualSubmit} disabled={!manualPayload.trim()}>
                Continue
              </button>
              <button className={styles.secondaryButton} onClick={() => setManualEntry(false)}>
                Scan QR Instead
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirm QR Payload */}
        {step === "confirm" && (
          <div className={styles.confirmStep}>
            <div className={styles.qrDisplay}>
              <p className={styles.label}>QR Payload</p>
              <p className={styles.qrValue}>{previewPayload(qrPayload)}</p>
              {qrDetails?.proxyType && qrDetails?.proxyValue && (
                <p className={styles.meta}>
                  Proxy type {qrDetails.proxyType} · {qrDetails.proxyValue}
                </p>
              )}
              {qrDetails?.reference && (
                <p className={styles.meta}>Reference: {qrDetails.reference}</p>
              )}
            </div>

            {isCheckingRegistration ? (
              <div className={styles.loading}>Checking QR registration status...</div>
            ) : isRegistered ? (
              <div className={styles.errorBox}>
                <strong>QR Payload Already Registered</strong>
                <p>This PayNow QR payload has already been claimed by another wallet.</p>
              </div>
            ) : (
              <>
                <div className={styles.infoBox}>
                  <p>
                    ✓ This QR payload can be registered
                    <br />✓ You will be the default merchant wallet customers pay when they scan this QR
                    <br />✓ You can register additional QR payloads at any time
                  </p>
                </div>

                <div className={styles.buttonGroup}>
                  <button className={styles.claimButton} onClick={() => setStep("naming")} disabled={Boolean(isRegistered)}>
                    Continue
                  </button>
                  <button className={styles.secondaryButton} onClick={resetToScan}>
                    Scan A Different QR
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Name Your QR Code */}
        {step === "naming" && (
          <div className={styles.namingStep}>
            <h2 className={styles.stepTitle}>Name Your QR Code</h2>
            <p className={styles.stepSubtitle}>
              Give this QR code a memorable name to help you identify it later
            </p>

            {isCheckingRegistration ? (
              <div className={styles.loading}>Checking QR registration status...</div>
            ) : isRegistered ? (
              <>
                <div className={styles.errorBox}>
                  <strong>QR Payload Already Registered</strong>
                  <p>This PayNow QR payload has already been claimed by another wallet.</p>
                </div>
                <button className={styles.secondaryButton} onClick={resetToScan}>
                  Scan A Different QR
                </button>
              </>
            ) : (
              <>
                <div className={styles.inputGroup}>
                  <label htmlFor="qrName">QR Code Name</label>
                  <input
                    id="qrName"
                    type="text"
                    value={qrName}
                    onChange={(e) => setQrName(e.target.value)}
                    placeholder="e.g., Main Store Counter, Food Stall #1"
                    className={styles.nameInput}
                    maxLength={50}
                  />
                  <p className={styles.hint}>This name will only be visible to you</p>
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    className={styles.claimButton}
                    onClick={handleRegister}
                    disabled={!qrName.trim()}
                  >
                    Register QR Code
                  </button>
                  <button className={styles.secondaryButton} onClick={resetToScan}>
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 4: Registration in Progress */}
        {step === "registering" && (
          <div className={styles.claimingStep}>
            <div className={styles.spinner}></div>
            <h2>{isConfirming ? "Confirming Transaction..." : "Finalising Registration..."}</h2>
            <p className={styles.loadingText}>
              Please wait while we register your PayNow QR payload on-chain.
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
