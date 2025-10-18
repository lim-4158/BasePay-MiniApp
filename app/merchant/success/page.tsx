"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import styles from "./success.module.css";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { composeCastAsync } = useComposeCast();

  const uen = searchParams.get("uen") || "";
  const txHash = searchParams.get("tx") || "";

  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const text = `I just registered my business on BasedPay! 🎉\n\nNow accepting crypto payments via PayNow QR codes on Base. UEN: ${uen}`;

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

        <h1 className={styles.title}>UEN Claimed Successfully!</h1>

        <p className={styles.subtitle}>
          Your business is now registered on BasedPay
        </p>

        {/* UEN Display */}
        <div className={styles.uenCard}>
          <p className={styles.label}>Registered UEN</p>
          <p className={styles.uenValue}>{uen}</p>
        </div>

        {/* Transaction Details */}
        {txHash && (
          <div className={styles.txCard}>
            <p className={styles.txLabel}>Transaction Hash</p>
            <p className={styles.txValue}>{txHash}</p>
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
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
          <h2 className={styles.benefitsTitle}>What&apos;s Next?</h2>
          <div className={styles.benefitsList}>
            <div className={styles.benefit}>
              <span className={styles.benefitIcon}>✓</span>
              <div>
                <strong>Accept Crypto Payments</strong>
                <p>Customers can now pay you with USDC using your PayNow QR</p>
              </div>
            </div>
            <div className={styles.benefit}>
              <span className={styles.benefitIcon}>✓</span>
              <div>
                <strong>Instant Settlement</strong>
                <p>Receive payments directly to your wallet</p>
              </div>
            </div>
            <div className={styles.benefit}>
              <span className={styles.benefitIcon}>✓</span>
              <div>
                <strong>Non-Transferable NFT</strong>
                <p>Your UEN ownership is secure and permanent</p>
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

export default function MerchantSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
