"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "qr-reader";

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .catch((err) => console.error("Error stopping scanner:", err));
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      // Initialize scanner
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      // Request camera permission and start scanning
      await scanner.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10, // Scans per second
          qrbox: { width: 250, height: 250 }, // Scanning box size
        },
        (decodedText) => {
          // Success callback
          console.log("QR Code detected:", decodedText);
          onScan(decodedText);

          // Stop scanning after successful scan
          scanner
            .stop()
            .then(() => {
              setIsScanning(false);
            })
            .catch((err) => console.error("Error stopping scanner:", err));
        },
        (errorMessage) => {
          // Error callback (called continuously while scanning)
          // We don't log these as they're just "no QR code found" messages
        }
      );

      setIsScanning(true);
      setHasPermission(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setHasPermission(false);

      const errorMsg =
        err instanceof Error ? err.message : "Failed to access camera";
      if (onError) {
        onError(errorMsg);
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
      <div
        id={elementId}
        style={{
          width: "100%",
          border: isScanning ? "2px solid #0052FF" : "2px dashed #ccc",
          borderRadius: "12px",
          overflow: "hidden",
          minHeight: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f5",
        }}
      >
        {!isScanning && (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#666",
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ margin: "0 auto 20px" }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <circle cx="15.5" cy="8.5" r="1.5" />
              <circle cx="8.5" cy="15.5" r="1.5" />
              <circle cx="15.5" cy="15.5" r="1.5" />
            </svg>
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>
              {hasPermission === false
                ? "Camera access denied"
                : "Ready to scan"}
            </p>
            <p style={{ fontSize: "14px", color: "#999" }}>
              Position the PayNow QR code within the frame
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        {!isScanning ? (
          <button
            onClick={startScanning}
            style={{
              background: "#0052FF",
              color: "white",
              border: "none",
              padding: "14px 32px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              width: "100%",
              maxWidth: "300px",
            }}
          >
            Start Scanning
          </button>
        ) : (
          <button
            onClick={stopScanning}
            style={{
              background: "#DC2626",
              color: "white",
              border: "none",
              padding: "14px 32px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              width: "100%",
              maxWidth: "300px",
            }}
          >
            Stop Scanning
          </button>
        )}
      </div>

      {hasPermission === false && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            background: "#FEE2E2",
            border: "1px solid #FCA5A5",
            borderRadius: "8px",
            color: "#991B1B",
            fontSize: "14px",
          }}
        >
          <strong>Camera access denied.</strong> Please enable camera
          permissions in your browser settings to scan QR codes.
        </div>
      )}
    </div>
  );
}
