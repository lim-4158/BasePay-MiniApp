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
            <circle cx="40" cy="40" r="40" fill="#3b82f6" />
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
          Your payment of {amount} USDC has been sent
        </p>

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

export default function UserSuccess() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
