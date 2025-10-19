"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import {
  getRegisteredQRCodes,
  type QRCodeData,
} from "../../lib/qrStorage";
import {
  getMerchantPayments,
  formatTransactionDate,
  type Transaction,
} from "../../lib/transactions";
import styles from "./manage.module.css";

export default function MerchantManage() {
  const router = useRouter();
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { address } = useAccount();

  const [qrCodes, setQRCodes] = useState<QRCodeData[]>([]);
  const [selectedQR, setSelectedQR] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTxs, setIsLoadingTxs] = useState(false);
  const [todayTotal, setTodayTotal] = useState("0.00");

  // Initialize minikit
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Load registered QR codes
  useEffect(() => {
    if (!address) return;

    const codes = getRegisteredQRCodes(address);
    setQRCodes(codes);

    // Auto-select first QR code if available
    if (codes.length > 0 && !selectedQR) {
      setSelectedQR(codes[0].payload);
    }
  }, [address, selectedQR]);

  // Fetch transactions when QR code selected
  useEffect(() => {
    async function fetchTransactions() {
      if (!address || !selectedQR) return;

      try {
        setIsLoadingTxs(true);
        const payments = await getMerchantPayments(address);

        // Note: We can't filter by QR payload since USDC transfers don't include that info
        // Showing all payments for now - this would need a custom contract to track properly
        setTransactions(payments);

        // Calculate today's total
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Math.floor(today.getTime() / 1000);

        const todayPayments = payments.filter(
          (tx) => tx.timestamp && tx.timestamp >= todayTimestamp
        );
        const total = todayPayments.reduce(
          (sum, tx) => sum + parseFloat(tx.amount),
          0
        );
        setTodayTotal(total.toFixed(2));
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoadingTxs(false);
      }
    }

    fetchTransactions();
  }, [address, selectedQR]);

  const selectedQRData = qrCodes.find((qr) => qr.payload === selectedQR);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => router.push("/")}
          type="button"
        >
          ← Back
        </button>
        <h1 className={styles.title}>Merchant Manager</h1>
      </div>

      <div className={styles.content}>
        {/* No QR Codes State */}
        {qrCodes.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📱</div>
            <h2 className={styles.emptyTitle}>No QR Codes Registered</h2>
            <p className={styles.emptyText}>
              Register your first PayNow QR code to start accepting crypto
              payments
            </p>
            <button
              className={styles.registerButton}
              onClick={() => router.push("/merchant")}
            >
              Register New QR Code
            </button>
          </div>
        )}

        {/* QR Code Management */}
        {qrCodes.length > 0 && (
          <>
            {/* QR Selector */}
            <div className={styles.selectorSection}>
              <div className={styles.selectorGroup}>
                <label htmlFor="qrSelect" className={styles.selectorLabel}>
                  QR Code
                </label>
                <div className={styles.dropdownWrapper}>
                  <select
                    id="qrSelect"
                    className={styles.qrDropdown}
                    value={selectedQR}
                    onChange={(e) => setSelectedQR(e.target.value)}
                  >
                    {qrCodes.map((qr) => (
                      <option key={qr.payload} value={qr.payload}>
                        {qr.name}
                      </option>
                    ))}
                  </select>
                  <span className={styles.dropdownIcon}>▾</span>
                </div>
              </div>
              <button
                className={styles.addQRButton}
                onClick={() => router.push("/merchant")}
                aria-label="Add new QR code"
              >
                +
              </button>
            </div>

            {/* Today's Stats */}
            <div className={styles.statsCard}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Today&apos;s Total</span>
                <span className={styles.statValue}>${todayTotal} USDC</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>QR Code Name</span>
                <span className={styles.statName}>{selectedQRData?.name}</span>
              </div>
            </div>

            {/* Transactions */}
            <div className={styles.transactionsSection}>
              <h2 className={styles.sectionTitle}>Recent Payments</h2>

              {isLoadingTxs && (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Loading transactions...</p>
                </div>
              )}

              {!isLoadingTxs && transactions.length === 0 && (
                <div className={styles.noTransactions}>
                  <p>No payments received yet</p>
                </div>
              )}

              {!isLoadingTxs && transactions.length > 0 && (
                <div className={styles.transactionsList}>
                  {transactions.slice(0, 10).map((tx, index) => (
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
                        <div className={styles.txIcon}>💰</div>
                        <div className={styles.txInfo}>
                          <div className={styles.txFrom}>
                            From: {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
                          </div>
                          <div className={styles.txDate}>
                            {tx.timestamp
                              ? formatTransactionDate(tx.timestamp)
                              : "Recent"}
                          </div>
                        </div>
                      </div>
                      <div className={styles.txAmount}>
                        +${parseFloat(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {transactions.length > 10 && (
                <button
                  className={styles.viewAllButton}
                  onClick={() => router.push("/merchant/dashboard")}
                >
                  View All Transactions →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
