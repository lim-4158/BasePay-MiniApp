"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import QRScanner from "../components/QRScanner";
import { parsePayNowQR, type PayNowQRData } from "../lib/paynow";
import { MERCHANT_REGISTRY_ABI, MERCHANT_REGISTRY_ADDRESS, ERC20_ABI, USDC_ADDRESS } from "../lib/contracts";
import styles from "./user.module.css";

type Step = "scan" | "verify" | "amount" | "review" | "paying";

export default function UserPayment() {
  const router = useRouter();
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { address: userAddress } = useAccount();

  const [step, setStep] = useState<Step>("scan");
  const [qrPayload, setQrPayload] = useState("");
  const [qrDetails, setQrDetails] = useState<PayNowQRData | null>(null);
  const [merchantAddress, setMerchantAddress] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [error, setError] = useState("");

  // Initialize minikit
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  const shouldLookupMerchant = qrPayload.length > 0 && step === "verify";

  // Lookup merchant wallet from QR payload
  const { data: merchantData } = useReadContract({
    address: MERCHANT_REGISTRY_ADDRESS,
    abi: MERCHANT_REGISTRY_ABI,
    functionName: "merchantForQr",
    args: shouldLookupMerchant ? [qrPayload] : undefined,
    query: {
      enabled: shouldLookupMerchant,
    },
  });

  // Get user's USDC balance
  const shouldCheckBalance = step === "amount" || step === "review";
  const { data: usdcBalance, isLoading: isLoadingBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: shouldCheckBalance && userAddress ? [userAddress] : undefined,
    query: {
      enabled: shouldCheckBalance && !!userAddress,
    },
  });

  // USDC transfer
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Update merchant address when lookup completes
  useEffect(() => {
    if (merchantData && merchantData !== "0x0000000000000000000000000000000000000000") {
      setMerchantAddress(merchantData as string);
      setStep("amount");
      setError("");
    } else if (merchantData === "0x0000000000000000000000000000000000000000" && step === "verify") {
      setError("This merchant hasn't registered their PayNow QR on BasedPay yet.");
    }
  }, [merchantData, step]);

  const resetToScan = () => {
    setStep("scan");
    setQrPayload("");
    setQrDetails(null);
    setMerchantAddress("");
    setPaymentAmount("");
    setError("");
  };

  // Handle QR scan
  const handleQRScan = (data: string) => {
    const parsed = parsePayNowQR(data);
    setQrPayload(parsed.raw);
    setQrDetails(parsed);
    setStep("verify");
    setError("");
  };

  // Handle amount input
  const handleAmountSubmit = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    // Check if user has sufficient balance
    if (usdcBalance) {
      const balance = Number(usdcBalance) / 1e6; // USDC has 6 decimals
      if (amount > balance) {
        setError(`Insufficient balance. You have ${balance.toFixed(2)} USDC`);
        return;
      }
    }

    setStep("review");
    setError("");
  };

  // Handle payment
  const handlePay = () => {
    if (!merchantAddress || !paymentAmount) return;

    setStep("paying");
    setError("");

    try {
      const amountInWei = BigInt(Math.floor(parseFloat(paymentAmount) * 1e6)); // USDC has 6 decimals

      writeContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [merchantAddress as `0x${string}`, amountInWei],
      });
    } catch (err) {
      console.error("Error sending payment:", err);
      setError(err instanceof Error ? err.message : "Failed to send payment");
      setStep("review");
    }
  };

  // Redirect to success page after confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      router.push(
        `/user/success?amount=${paymentAmount}&merchant=${merchantAddress}&tx=${hash}`
      );
    }
  }, [isConfirmed, hash, paymentAmount, merchantAddress, router]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      setError(writeError.message);
      setStep("review");
    }
  }, [writeError]);

  const formatBalance = () => {
    if (!usdcBalance) return "0.00";
    return (Number(usdcBalance) / 1e6).toFixed(2);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push("/")} type="button">
          ← Back
        </button>
        <h1 className={styles.title}>Pay with USDC</h1>
        <p className={styles.subtitle}>Scan a merchant&apos;s PayNow QR to pay with crypto</p>
      </div>

      <div className={styles.content}>
        {/* Step 1: Scan QR Code */}
        {step === "scan" && (
          <div className={styles.scanStep}>
            <QRScanner onScan={handleQRScan} onError={setError} />
          </div>
        )}

        {/* Step 2: Verifying Merchant */}
        {step === "verify" && (
          <div className={styles.verifyStep}>
            <div className={styles.spinner}></div>
            <h2>Looking up merchant...</h2>
            <p className={styles.loadingText}>Checking if this QR is registered on BasedPay</p>
          </div>
        )}

        {/* Step 3: Enter Amount */}
        {step === "amount" && (
          <div className={styles.amountStep}>
            <div className={styles.merchantCard}>
              <p className={styles.label}>Paying to Merchant</p>
              <p className={styles.merchantAddress}>
                {merchantAddress.slice(0, 6)}...{merchantAddress.slice(-4)}
              </p>
              {qrDetails?.proxyType && qrDetails?.proxyValue && (
                <p className={styles.meta}>
                  {qrDetails.proxyType} · {qrDetails.proxyValue}
                </p>
              )}
            </div>

            <div className={styles.balanceCard}>
              <p className={styles.balanceLabel}>Your USDC Balance</p>
              <p className={styles.balanceAmount}>
                {isLoadingBalance ? "Loading..." : `${formatBalance()} USDC`}
              </p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="amount">Payment Amount (USDC)</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className={styles.amountInput}
              />
            </div>

            <div className={styles.buttonGroup}>
              <button
                className={styles.continueButton}
                onClick={handleAmountSubmit}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                Continue
              </button>
              <button className={styles.secondaryButton} onClick={resetToScan}>
                Scan Different QR
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review Payment */}
        {step === "review" && (
          <div className={styles.reviewStep}>
            <h2 className={styles.reviewTitle}>Review Payment</h2>

            <div className={styles.reviewCard}>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Amount</span>
                <span className={styles.reviewValue}>{paymentAmount} USDC</span>
              </div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>To</span>
                <span className={styles.reviewValue}>
                  {merchantAddress.slice(0, 8)}...{merchantAddress.slice(-6)}
                </span>
              </div>
              {qrDetails?.proxyValue && (
                <div className={styles.reviewRow}>
                  <span className={styles.reviewLabel}>Merchant ID</span>
                  <span className={styles.reviewValue}>{qrDetails.proxyValue}</span>
                </div>
              )}
              <div className={styles.reviewDivider}></div>
              <div className={styles.reviewRow}>
                <span className={styles.reviewLabel}>Your Balance After</span>
                <span className={styles.reviewValue}>
                  {(parseFloat(formatBalance()) - parseFloat(paymentAmount)).toFixed(2)} USDC
                </span>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button className={styles.payButton} onClick={handlePay}>
                Confirm & Pay
              </button>
              <button className={styles.secondaryButton} onClick={() => setStep("amount")}>
                Edit Amount
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Payment in Progress */}
        {step === "paying" && (
          <div className={styles.payingStep}>
            <div className={styles.spinner}></div>
            <h2>{isConfirming ? "Confirming Payment..." : "Processing Payment..."}</h2>
            <p className={styles.loadingText}>
              Please wait while your payment is being processed on Base.
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
            {step === "verify" && (
              <button className={styles.secondaryButton} onClick={resetToScan} style={{ marginTop: "12px" }}>
                Scan Different QR
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
