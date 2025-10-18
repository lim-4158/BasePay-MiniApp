"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import {
  getMerchantPayments,
  calculateTotalReceived,
  getUniqueCustomerCount,
  formatTransactionDate,
  type Transaction,
} from "../../lib/transactions";
import styles from "./dashboard.module.css";

export default function MerchantDashboard() {
  const router = useRouter();
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { address } = useAccount();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Initialize minikit
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Fetch merchant payment history
  useEffect(() => {
    async function fetchPayments() {
      if (!address) {
        setError("Please connect your wallet");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const payments = await getMerchantPayments(address);
        setTransactions(payments);
      } catch (err) {
        console.error("Error fetching payments:", err);
        setError("Failed to load payment history");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPayments();
  }, [address]);

  const totalReceived = transactions.length > 0 ? calculateTotalReceived(transactions) : "0";
  const uniqueCustomers = getUniqueCustomerCount(transactions);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push("/merchant")} type="button">
          ← Back
        </button>
        <h1 className={styles.title}>Merchant Dashboard</h1>
        <p className={styles.subtitle}>Track your crypto payments</p>
      </div>

      <div className={styles.content}>
        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>💰</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Received</p>
              <p className={styles.statValue}>{parseFloat(totalReceived).toFixed(2)} USDC</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Payments</p>
              <p className={styles.statValue}>{transactions.length}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Unique Customers</p>
              <p className={styles.statValue}>{uniqueCustomers}</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📈</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Avg Payment</p>
              <p className={styles.statValue}>
                {transactions.length > 0
                  ? (parseFloat(totalReceived) / transactions.length).toFixed(2)
                  : "0.00"}{" "}
                USDC
              </p>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className={styles.historySection}>
          <h2 className={styles.historyTitle}>Payment History</h2>

          {isLoading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Loading payment history...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <strong>Error</strong>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && transactions.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <h3>No Payments Yet</h3>
              <p>You haven&apos;t received any USDC payments yet.</p>
              <p className={styles.emptyHint}>
                Share your PayNow QR code with customers to start accepting crypto payments!
              </p>
            </div>
          )}

          {!isLoading && !error && transactions.length > 0 && (
            <div className={styles.transactionList}>
              {transactions.map((tx, index) => (
                <div key={`${tx.txHash}-${index}`} className={styles.transactionCard}>
                  <div className={styles.txHeader}>
                    <div className={styles.txAmount}>+{parseFloat(tx.amount).toFixed(2)} USDC</div>
                    <div className={styles.txDate}>
                      {tx.timestamp ? formatTransactionDate(tx.timestamp) : "Recent"}
                    </div>
                  </div>

                  <div className={styles.txDetails}>
                    <div className={styles.txRow}>
                      <span className={styles.txLabel}>From</span>
                      <span className={styles.txValue}>
                        {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                      </span>
                    </div>

                    <div className={styles.txRow}>
                      <span className={styles.txLabel}>Transaction</span>
                      <a
                        href={`https://basescan.org/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.txLink}
                      >
                        {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)} →
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isLoading && transactions.length > 0 && (
          <div className={styles.actions}>
            <button className={styles.primaryButton} onClick={() => router.push("/merchant")}>
              Register Another QR
            </button>
            <button className={styles.secondaryButton} onClick={() => router.push("/")}>
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
