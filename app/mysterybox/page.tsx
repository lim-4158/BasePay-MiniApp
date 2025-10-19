"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MYSTERY_BOX_ABI, MYSTERY_BOX_ADDRESS } from "../lib/contracts";
import styles from "./mysterybox.module.css";

export default function MysteryBox() {
  const router = useRouter();
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { address } = useAccount();

  const [isOpening, setIsOpening] = useState(false);
  const [prizeAmount, setPrizeAmount] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Initialize minikit
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Get user stats
  const { data: userStats, refetch: refetchStats } = useReadContract({
    address: MYSTERY_BOX_ADDRESS,
    abi: MYSTERY_BOX_ABI,
    functionName: "getUserStats",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Claim mystery box
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle box opening
  const handleOpenBox = () => {
    if (!address) return;

    setIsOpening(true);

    try {
      writeContract({
        address: MYSTERY_BOX_ADDRESS,
        abi: MYSTERY_BOX_ABI,
        functionName: "claimMysteryBox",
      });
    } catch (err) {
      console.error("Error opening box:", err);
      setIsOpening(false);
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isConfirmed && hash) {
      // TODO: Parse BoxOpened event to get prize amount
      // For now, refetch stats to show updated values
      refetchStats();
      setShowCelebration(true);
      setIsOpening(false);

      // Hide celebration after 5 seconds
      setTimeout(() => {
        setShowCelebration(false);
      }, 5000);
    }
  }, [isConfirmed, hash, refetchStats]);

  // Handle errors
  useEffect(() => {
    if (writeError) {
      console.error("Transaction error:", writeError);
      setIsOpening(false);
    }
  }, [writeError]);

  const unclaimed = userStats ? Number(userStats[0]) : 0;
  const opened = userStats ? Number(userStats[1]) : 0;
  const earned = userStats ? Number(userStats[2]) / 1e6 : 0; // Convert from 6 decimals
  const biggest = userStats ? Number(userStats[3]) / 1e6 : 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push("/")} type="button">
          ← Back
        </button>
        <h1 className={styles.title}>Mystery Boxes</h1>
        <p className={styles.subtitle}>Open boxes to win USDC prizes!</p>
      </div>

      <div className={styles.content}>
        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎁</div>
            <div className={styles.statValue}>{unclaimed}</div>
            <div className={styles.statLabel}>Unclaimed</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📦</div>
            <div className={styles.statValue}>{opened}</div>
            <div className={styles.statLabel}>Opened</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statValue}>${earned.toFixed(2)}</div>
            <div className={styles.statLabel}>Total Earned</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏆</div>
            <div className={styles.statValue}>${biggest.toFixed(2)}</div>
            <div className={styles.statLabel}>Biggest Win</div>
          </div>
        </div>

        {/* Mystery Box Section */}
        {unclaimed > 0 ? (
          <div className={styles.boxSection}>
            <div className={isOpening ? styles.boxOpening : styles.box}>
              <div className={styles.boxLid}></div>
              <div className={styles.boxBody}>
                <div className={styles.boxGlow}></div>
                <div className={styles.boxText}>?</div>
              </div>
            </div>

            <button
              className={styles.openButton}
              onClick={handleOpenBox}
              disabled={isOpening || isConfirming}
            >
              {isConfirming ? "Confirming..." : isOpening ? "Opening..." : "Open Mystery Box"}
            </button>

            <p className={styles.boxCount}>
              {unclaimed} {unclaimed === 1 ? "box" : "boxes"} available
            </p>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <h2 className={styles.emptyTitle}>No Mystery Boxes</h2>
            <p className={styles.emptyText}>
              Make a payment and share it on Farcaster to earn mystery boxes!
            </p>
            <button className={styles.payButton} onClick={() => router.push("/user")}>
              Make a Payment
            </button>
          </div>
        )}

        {/* Prize Tiers Info */}
        <div className={styles.prizeTiers}>
          <h3 className={styles.tiersTitle}>Prize Tiers</h3>
          <div className={styles.tiersList}>
            <div className={styles.tier}>
              <span className={styles.tierChance}>40%</span>
              <span className={styles.tierPrize}>$0.01 USDC</span>
            </div>
            <div className={styles.tier}>
              <span className={styles.tierChance}>30%</span>
              <span className={styles.tierPrize}>$0.02 USDC</span>
            </div>
            <div className={styles.tier}>
              <span className={styles.tierChance}>20%</span>
              <span className={styles.tierPrize}>$0.05 USDC</span>
            </div>
            <div className={styles.tier + " " + styles.tierRare}>
              <span className={styles.tierChance}>8%</span>
              <span className={styles.tierPrize}>$0.50 USDC</span>
            </div>
            <div className={styles.tier + " " + styles.tierEpic}>
              <span className={styles.tierChance}>2%</span>
              <span className={styles.tierPrize}>$1.00 USDC</span>
            </div>
          </div>
        </div>

        {/* How to Earn */}
        <div className={styles.howToEarn}>
          <h3 className={styles.howToTitle}>How to Earn Boxes</h3>
          <ol className={styles.stepsList}>
            <li>Make a payment with BasedPay</li>
            <li>Share your payment on Farcaster</li>
            <li>Get a mystery box automatically!</li>
            <li>Come back here to open it and win USDC</li>
          </ol>
        </div>
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className={styles.celebrationOverlay}>
          <div className={styles.celebrationContent}>
            <div className={styles.confetti}>🎉</div>
            <h2 className={styles.celebrationTitle}>Congratulations!</h2>
            <p className={styles.celebrationText}>
              You won USDC!
            </p>
            <button className={styles.celebrationClose} onClick={() => setShowCelebration(false)}>
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {writeError && (
        <div className={styles.errorBox}>
          <strong>Error</strong>
          <p>{writeError.message}</p>
        </div>
      )}
    </div>
  );
}
