"use client";

import { useComposeCast } from '@coinbase/onchainkit/minikit';
import { minikitConfig } from "../../minikit.config";
import styles from "./page.module.css";

const SHARE_URL = "https://new-mini-app-quickstart-indol-psi.vercel.app/";

export default function Success() {

  const { composeCastAsync } = useComposeCast();
  
  const handleShare = async () => {
    try {
      const text = `BasedPay is live! 🚀 Scan PayNow QR codes, pay with USDC, and collect mystery boxes worth up to 500 USDC. Check it out:\n${SHARE_URL}`;

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
        embeds: embedUrls
      });

      // result.cast can be null if user cancels
      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      } else {
        console.log("User cancelled the cast");
      }
    } catch (error) {
      console.error("Error sharing cast:", error);
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} type="button">
        ✕
      </button>
      
      <div className={styles.content}>
        <div className={styles.successMessage}>
          <div className={styles.checkmark}>
            <div className={styles.checkmarkCircle}>
              <div className={styles.checkmarkStem}></div>
              <div className={styles.checkmarkKick}></div>
            </div>
          </div>
          
          <h1 className={styles.title}>Welcome to the {minikitConfig.miniapp.name.toUpperCase()}!</h1>
          
          <p className={styles.subtitle}>
            You&apos;re in! We&apos;ll notify you as soon as we launch.<br />
            Get ready to experience the future of onchain marketing.
          </p>

          <button onClick={handleShare} className={styles.shareButton}>
            SHARE
          </button>
        </div>
      </div>
    </div>
  );
}
