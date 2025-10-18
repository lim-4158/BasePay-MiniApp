"use client";

import { useRouter } from "next/navigation";

export default function UserPayment() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0052FF 0%, #0041CC 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        color: "white",
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: "48px", marginBottom: "16px" }}>Coming Soon</h1>
        <p style={{ fontSize: "20px", marginBottom: "32px", opacity: 0.9 }}>
          User payment flow is under construction
        </p>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "white",
            color: "#0052FF",
            border: "none",
            padding: "16px 32px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
