"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import styles from "./success.module.css";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { composeCastAsync } = useComposeCast();

  const amount = searchParams.get("amount") || "";
  const merchantAddress = searchParams.get("merchant") || "";
  const txHash = searchParams.get("tx") || "";

  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const text = `Just paid ${amount} USDC on BasedPay! 💰\n\nUsing crypto to pay merchants via PayNow QR codes on Base. The future of payments is here!`;

      const result = await composeCastAsync({
        text: text,
        embeds: [process.env.NEXT_PUBLIC_URL || ""],
      });

      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      }
    } catch (error) {
      console.error("Error sharing cast:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Success Icon */}
        <div className={styles.successIcon}>
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="40" cy="40" r="40" fill="#10B981" />
            <path
              d="M25 40L35 50L55 30"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className={styles.title}>Payment Successful!</h1>

        <p className={styles.subtitle}>
          Your payment has been sent to the merchant
        </p>

        {/* Payment Summary */}
        <div className={styles.summaryCard}>
          <div className={styles.amountSection}>
            <p className={styles.label}>Amount Paid</p>
            <p className={styles.amountValue}>{amount} USDC</p>
          </div>

          <div className={styles.divider}></div>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>To Merchant</span>
            <span className={styles.detailValue}>
              {merchantAddress.slice(0, 8)}...{merchantAddress.slice(-6)}
            </span>
          </div>

          {txHash && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Transaction</span>
              <span className={styles.detailValue}>
                {txHash.slice(0, 8)}...{txHash.slice(-6)}
              </span>
            </div>
          )}
        </div>

        {/* Transaction Link */}
        {txHash && (
          <div className={styles.txCard}>
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.viewLink}
            >
              View on BaseScan →
            </a>
          </div>
        )}

        {/* Benefits */}
        <div className={styles.benefits}>
          <h2 className={styles.benefitsTitle}>What Happened?</h2>
          <div className={styles.benefitsList}>
            <div className={styles.benefit}>
              <span className={styles.benefitIcon}>✓</span>
              <div>
                <strong>Instant Settlement</strong>
                <p>Merchant received USDC directly to their wallet</p>
              </div>
            </div>
            <div className={styles.benefit}>
              <span className={styles.benefitIcon}>✓</span>
              <div>
                <strong>On-Chain Payment</strong>
                <p>Transaction permanently recorded on Base blockchain</p>
              </div>
            </div>
            <div className={styles.benefit}>
              <span className={styles.benefitIcon}>✓</span>
              <div>
                <strong>Low Fees</strong>
                <p>Minimal gas fees compared to traditional payment processors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button
            className={styles.shareButton}
            onClick={handleShare}
            disabled={isSharing}
          >
            {isSharing ? "Sharing..." : "Share on Farcaster"}
          </button>

          <button
            className={styles.historyButton}
            onClick={() => router.push("/user/history")}
          >
            View Payment History
          </button>

          <button
            className={styles.payAgainButton}
            onClick={() => router.push("/user")}
          >
            Make Another Payment
          </button>

          <button
            className={styles.homeButton}
            onClick={() => router.push("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
