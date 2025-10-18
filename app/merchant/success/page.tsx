"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import styles from "./success.module.css";

const previewPayload = (payload: string): string => {
  if (payload.length <= 80) {
    return payload;
  }

  return `${payload.slice(0, 40)}...${payload.slice(-20)}`;
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { composeCastAsync } = useComposeCast();

  const qrPayload = searchParams.get("qr") || "";
  const txHash = searchParams.get("tx") || "";

  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const text = `I just registered my PayNow QR on BasedPay! 🎉\n\nCrypto payments to this QR now settle directly to my Base wallet.`;

      const result = await composeCastAsync({
        text,
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
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="40" fill="#0052ff" />
            <path
              d="M25 40L35 50L55 30"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className={styles.title}>PayNow QR Registered!</h1>

        <p className={styles.subtitle}>Your QR payload now resolves to your BasedPay merchant wallet</p>

        {/* Transaction Details */}
        {txHash && (
          <div className={styles.txCard}>
            <p className={styles.txLabel}>Transaction Hash</p>
            <p className={styles.txValue}>{txHash}</p>
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

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button className={styles.shareButton} onClick={handleShare} disabled={isSharing}>
            {isSharing ? "Sharing..." : "Share on Farcaster"}
          </button>

          <button className={styles.homeButton} onClick={() => router.push("/")}>
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
