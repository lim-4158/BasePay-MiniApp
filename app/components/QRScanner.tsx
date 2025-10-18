"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);
  const elementId = useRef(`qr-reader-${Math.random().toString(36).substr(2, 9)}`);
  const stopPromiseRef = useRef<Promise<void> | null>(null);

  const stopActiveScanner = useCallback(async () => {
    if (stopPromiseRef.current) {
      await stopPromiseRef.current;
      return;
    }

    const activeScanner = scannerRef.current;

    if (!activeScanner) {
      if (isMountedRef.current) {
        setIsScanning(false);
      }
      return;
    }

    const stopPromise = (async () => {
      try {
        let state: number | null = null;

        try {
          state = await activeScanner.getState();
        } catch {
          state = null;
        }

        if (state === 2 || state === 3 || state === null) {
          await activeScanner.stop();
        }

        try {
          await activeScanner.clear();
        } catch (clearErr) {
          if (
            !(clearErr instanceof TypeError) ||
            !clearErr.message.includes("removeChild")
          ) {
            throw clearErr;
          }
          // Ignore DOM removal errors when element already unmounted
        }
      } catch (err) {
        if (isMountedRef.current) {
          console.error("Error stopping scanner:", err);
        }
      } finally {
        if (scannerRef.current === activeScanner) {
          scannerRef.current = null;
        }
        if (isMountedRef.current) {
          setIsScanning(false);
        }
        stopPromiseRef.current = null;
      }
    })();

    stopPromiseRef.current = stopPromise;
    await stopPromise;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      void stopActiveScanner();
    };
  }, [stopActiveScanner]);

  const startScanning = async () => {
    if (!isMountedRef.current) return;

    try {
      // Clean up any existing scanner first
      await stopActiveScanner();

      // Initialize new scanner
      const scanner = new Html5Qrcode(elementId.current);
      scannerRef.current = scanner;

      // Get available cameras first
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        throw new Error("No cameras found on this device");
      }

      // Request camera permission and start scanning
      await scanner.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10, // Scans per second
          qrbox: { width: 250, height: 250 }, // Scanning box size
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          if (!isMountedRef.current) return;

          console.log("QR Code detected:", decodedText);
          onScan(decodedText);

          // Stop scanning after successful scan
          void stopActiveScanner();
        },
        () => {
          // Error callback (called continuously while scanning)
          // We don't log these as they're just "no QR code found" messages
        }
      );

      if (isMountedRef.current) {
        setIsScanning(true);
        setHasPermission(true);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error("Error starting scanner:", err);
      setHasPermission(false);

      let errorMsg = "Failed to access camera";

      if (err instanceof Error) {
        // Provide more helpful error messages
        if (err.message.includes("Permission")) {
          errorMsg = "Camera permission denied. Please allow camera access in your browser settings.";
        } else if (err.message.includes("NotFoundError")) {
          errorMsg = "No camera found on this device.";
        } else if (err.message.includes("NotAllowedError")) {
          errorMsg = "Camera access blocked. Please enable camera permissions.";
        } else if (err.message.includes("NotReadableError")) {
          errorMsg = "Camera is already in use by another application.";
        } else if (err.message.includes("OverconstrainedError")) {
          errorMsg = "Camera constraints not supported. Try a different device.";
        } else {
          errorMsg = err.message;
        }
      }

      if (onError) {
        onError(errorMsg);
      }

      // Ensure we clear any partially initialized scanner
      await stopActiveScanner();
    }
  };

  const stopScanning = async () => {
    if (!isMountedRef.current) return;
    await stopActiveScanner();
  };

  return (
    <div style={{ width: "100%", maxWidth: "500px", margin: "0 auto" }}>
      <div
        id={elementId.current}
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
