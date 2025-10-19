"use client";

import { useEffect, useMemo, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { getCustomerPayments, formatTransactionDate, type Transaction } from "./lib/transactions";
import { ERC20_ABI, USDC_ADDRESS, MYSTERY_BOX_ABI, MYSTERY_BOX_ADDRESS } from "./lib/contracts";
import styles from "./page.module.css";
import { useEnsNames } from "./hooks/useEnsNames";

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const router = useRouter();
  const { address } = useAccount();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);
  const [showMerchantModal, setShowMerchantModal] = useState(false);

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Get user's USDC balance
  const { data: usdcBalance, isLoading: isLoadingBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get user's mystery box stats
  const { data: userStats } = useReadContract({
    address: MYSTERY_BOX_ADDRESS,
    abi: MYSTERY_BOX_ABI,
    functionName: "getUserStats",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const unclaimedBoxes = userStats ? Number(userStats[0]) : 0;

  // Fetch recent transactions
  useEffect(() => {
    async function fetchTransactions() {
      if (!address) return;

      try {
        setIsLoadingTxs(true);
        const payments = await getCustomerPayments(address);
        setTransactions(payments.slice(0, 5)); // Show only 5 most recent
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoadingTxs(false);
      }
    }

    fetchTransactions();
  }, [address]);

  const ensAddresses = useMemo(
    () => transactions.map((tx) => tx.to),
    [transactions]
  );
  const ensNames = useEnsNames(ensAddresses);

  const formatAddress = (address: string) => {
    const lookupKey = address.toLowerCase();
    const ensName = ensNames[lookupKey];
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return ensName ? `${ensName} (${short})` : short;
  };

  const formatBalance = () => {
    if (!usdcBalance) return "0.00";
    return (Number(usdcBalance) / 1e6).toFixed(2);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.appName}>BasedPay</h1>
            <p className={styles.greeting}>
              Hey {context?.user?.displayName || "there"}! 👋
            </p>
          </div>
          <button
            className={styles.merchantLink}
            onClick={() => setShowMerchantModal(true)}
          >
            Merchant
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Mystery Box Notification Banner */}
        {unclaimedBoxes > 0 && (
          <div className={styles.mysteryBoxBanner} onClick={() => router.push("/mysterybox")}>
            <div className={styles.bannerLeft}>
              <div className={styles.bannerIcon}>🎁</div>
              <div className={styles.bannerText}>
                <div className={styles.bannerTitle}>
                  {unclaimedBoxes} Mystery {unclaimedBoxes === 1 ? "Box" : "Boxes"} Available!
                </div>
                <div className={styles.bannerSubtitle}>
                  Tap to open and win USDC prizes
                </div>
              </div>
            </div>
            <div className={styles.bannerArrow}>→</div>
          </div>
        )}

        {/* Balance Card */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <span className={styles.balanceLabel}>Your Balance</span>
            <span className={styles.usdcBadge}>USDC</span>
          </div>
          {isLoadingBalance ? (
            <div className={styles.balanceLoading}>
              <div className={styles.smallSpinner}></div>
            </div>
          ) : (
            <div className={styles.balanceAmount}>${formatBalance()}</div>
          )}
          <p className={styles.balanceSubtext}>on Base</p>
        </div>

        {/* Main Action Button */}
        <button
          className={styles.scanButton}
          onClick={() => router.push("/user")}
        >
          <div className={styles.scanIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
              <path d="M14 14h2m0 0h2m-2 0v2m0-2v-2m4 4h1v1m-1 2v1m-4-4h-2v2m6 2h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className={styles.scanText}>
            <span className={styles.scanTitle}>Scan to Pay</span>
            <span className={styles.scanSubtitle}>
              Scan merchant PayNow QR code
            </span>
          </div>
          <div className={styles.scanArrow}>→</div>
        </button>

        {/* Recent Transactions */}
        <div className={styles.transactionsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Payments</h2>
            {transactions.length > 0 && (
              <button
                className={styles.viewAllButton}
                onClick={() => router.push("/user/history")}
              >
                View All
              </button>
            )}
          </div>

          {isLoadingTxs && (
            <div className={styles.txLoading}>
              <div className={styles.spinner}></div>
              <p>Loading transactions...</p>
            </div>
          )}

          {!isLoadingTxs && transactions.length === 0 && (
            <div className={styles.emptyTransactions}>
              <div className={styles.emptyIcon}>💳</div>
              <p className={styles.emptyTitle}>No payments yet</p>
              <p className={styles.emptyText}>
                Scan a merchant&apos;s QR code to make your first payment
              </p>
            </div>
          )}

          {!isLoadingTxs && transactions.length > 0 && (
            <div className={styles.transactionsList}>
              {transactions.map((tx, index) => (
                <div
                  key={`${tx.txHash}-${index}`}
                  className={styles.transactionItem}
                  onClick={() =>
                    window.open(
                      `https://basescan.org/tx/${tx.txHash}`,
                      "_blank"
                    )
                  }
                >
                  <div className={styles.txLeft}>
                    <div className={styles.txIcon}>💸</div>
                    <div className={styles.txInfo}>
                      <div className={styles.txMerchant}>
                        {formatAddress(tx.to)}
                      </div>
                      <div className={styles.txDate}>
                        {tx.timestamp
                          ? formatTransactionDate(tx.timestamp)
                          : "Recent"}
                      </div>
                    </div>
                  </div>
                  <div className={styles.txAmount}>
                    -${parseFloat(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Merchant Confirmation Modal */}
      {showMerchantModal && (
        <div className={styles.modalOverlay} onClick={() => setShowMerchantModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIcon}>🏪</div>
            <h2 className={styles.modalTitle}>Switch to Merchant View?</h2>
            <p className={styles.modalText}>
              Register your PayNow QR code to start accepting crypto payments from customers.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalConfirm}
                onClick={() => {
                  setShowMerchantModal(false);
                  router.push("/merchant/manage");
                }}
              >
                Continue as Merchant
              </button>
              <button
                className={styles.modalCancel}
                onClick={() => setShowMerchantModal(false)}
              >
                Stay on User View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
