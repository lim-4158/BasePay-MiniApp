"use client";
import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const router = useRouter();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);
 

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.hero}>
          <h1 className={styles.title}>BasedPay</h1>
          <p className={styles.tagline}>
            Accept crypto payments with Singapore PayNow QR codes
          </p>
          <p className={styles.subtitle}>
            Hey {context?.user?.displayName || "there"}! Choose your path below
          </p>
        </div>

        <div className={styles.roleSelector}>
          <button
            className={styles.roleCard}
            onClick={() => router.push("/merchant")}
          >
            <div className={styles.roleIcon}>🏪</div>
            <h2>I&apos;m a Merchant</h2>
            <p>Register your PayNow QR payload to start accepting crypto payments</p>
            <span className={styles.roleAction}>Register Now →</span>
          </button>

          <button
            className={styles.roleCard}
            onClick={() => router.push("/user")}
          >
            <div className={styles.roleIcon}>💳</div>
            <h2>I&apos;m a User</h2>
            <p>Scan PayNow QR codes to pay merchants with USDC</p>
            <span className={styles.roleAction}>Make Payment →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
