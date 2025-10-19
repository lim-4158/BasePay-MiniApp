"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MYSTERY_BOX_ABI, MYSTERY_BOX_ADDRESS } from "../../lib/contracts";
import styles from "./success.module.css";

const SHARE_URL = "https://new-mini-app-quickstart-indol-psi.vercel.app/";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { composeCastAsync } = useComposeCast();
  const { address } = useAccount();

  const amount = searchParams.get("amount") || "";

  const [isSharing, setIsSharing] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [grantingBox, setGrantingBox] = useState(false);

  // Get user mystery box stats for sharing copy
  const { data: userStats } = useReadContract({
    address: MYSTERY_BOX_ADDRESS,
    abi: MYSTERY_BOX_ABI,
    functionName: "getUserStats",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Grant mystery box contract call
  const { writeContract, data: grantHash } = useWriteContract();

  // Wait for grant transaction
  const { isSuccess: isGranted } = useWaitForTransactionReceipt({
    hash: grantHash,
  });

  const totalEarned = userStats ? Number(userStats[2]) / 1e6 : 0;
  const boxesOpened = userStats ? Number(userStats[1]) : 0;

  const handleShare = async () => {
    try {
      setIsSharing(true);

      // Create viral copy with dynamic stats
      let text = `Just spent ${amount} USDC on BasedPay! 💸\n\n`;

      if (boxesOpened > 0 && totalEarned > 0) {
        text += `I've earned $${totalEarned.toFixed(2)} from ${boxesOpened} mystery boxes! 🎁\n\n`;
      }

      text += `Paying with crypto via QR codes on Base. Share & get FREE mystery boxes with real USDC prizes! 🚀\nWin up to 500 USDC when you collect mystery boxes!\n\nJoin me at ${process.env.NEXT_PUBLIC_URL || "BasedPay"}\n${SHARE_URL}`;

      const primaryUrl = process.env.NEXT_PUBLIC_URL || SHARE_URL;
      const candidates = Array.from(new Set([primaryUrl, SHARE_URL])).filter(Boolean) as string[];
      const embedUrls: [] | [string] | [string, string] =
        candidates.length === 0
          ? []
          : candidates.length === 1
          ? [candidates[0]]
          : [candidates[0], candidates[1]];

      const result = await composeCastAsync({
        text: text,
        embeds: embedUrls,
      });

      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
        setHasShared(true);

        // Grant mystery box after successful share
        await grantMysteryBox();
      }
    } catch (error) {
      console.error("Error sharing cast:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const grantMysteryBox = async () => {
    if (!address) return;

    try {
      setGrantingBox(true);

      // Call the contract to grant a mystery box (no args needed - grants to msg.sender)
      writeContract({
        address: MYSTERY_BOX_ADDRESS,
        abi: MYSTERY_BOX_ABI,
        functionName: "grantMysteryBox",
      });
    } catch (error) {
      console.error("Error granting mystery box:", error);
      setGrantingBox(false);
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

        {/* Mystery Box Reward Section */}
        {!hasShared && (
          <div className={styles.mysteryBoxPromo}>
            <div className={styles.mysteryBoxIcon}>🎁</div>
            <h3 className={styles.mysteryBoxTitle}>Get a FREE Mystery Box!</h3>
            <p className={styles.mysteryBoxText}>
              Share your payment and earn a mystery box with real USDC prizes up to $1.00!
            </p>
            <div className={styles.prizeBadges}>
              <span className={styles.prizeBadge}>$0.01</span>
              <span className={styles.prizeBadge}>$0.02</span>
              <span className={styles.prizeBadge}>$0.05</span>
              <span className={styles.prizeBadge + " " + styles.prizeBadgeRare}>$0.50</span>
              <span className={styles.prizeBadge + " " + styles.prizeBadgeEpic}>$1.00</span>
            </div>
          </div>
        )}

        {/* Success notification after sharing */}
        {(hasShared || isGranted) && (
          <div className={styles.rewardSuccess}>
            <div className={styles.rewardIcon}>✨</div>
            <h3 className={styles.rewardTitle}>Mystery Box Granted!</h3>
            <p className={styles.rewardText}>
              Check your mystery boxes to open it and claim your prize!
            </p>
            <button
              className={styles.viewBoxesButton}
              onClick={() => router.push("/mysterybox")}
            >
              View My Mystery Boxes
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.actions}>
          {!hasShared && (
            <button
              className={styles.shareButton}
              onClick={handleShare}
              disabled={isSharing || grantingBox}
            >
              {isSharing ? "Sharing..." : grantingBox ? "Granting Box..." : "🎁 Share & Get Mystery Box"}
            </button>
          )}

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
