"use client";

import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { getCustomerPayments, formatTransactionDate, type Transaction } from "./lib/transactions";
import { ERC20_ABI, USDC_ADDRESS } from "./lib/contracts";
import styles from "./page.module.css";

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
          <div className={styles.scanIcon}>📱</div>
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
                        {tx.to.slice(0, 6)}...{tx.to.slice(-4)}
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

        {/* Quick Links */}
        <div className={styles.quickLinks}>
          <button
            className={styles.quickLink}
            onClick={() => router.push("/user/history")}
          >
            <span>📊</span>
            <span>History</span>
          </button>
          <button
            className={styles.quickLink}
            onClick={() => router.push("/merchant/dashboard")}
          >
            <span>🏪</span>
            <span>Dashboard</span>
          </button>
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
