/**
 * PayNow QR Code utilities
 *
 * PayNow QR codes follow the EMVCo QR standard
 * Format: Tag-Length-Value (TLV)
 */

export interface PayNowQRData {
  raw: string;
  isPayNow: boolean;
  proxyType?: string;
  proxyValue?: string;
  amount?: string;
  reference?: string;
}

/**
 * Parse PayNow QR code data to surface common fields.
 * Returns best-effort metadata even if the payload is incomplete.
 */
export function parsePayNowQR(qrData: string): PayNowQRData {
  const safeData = typeof qrData === "string" ? qrData.trim() : "";
  const base: PayNowQRData = {
    raw: safeData,
    isPayNow: false,
  };

  if (!safeData) {
    return base;
  }

  try {
    if (!safeData.includes("SG.PAYNOW")) {
      return base;
    }

    base.isPayNow = true;

    // Merchant account information is stored in tag 26
    const merchantInfoMatch = safeData.match(/26\d{2}([^]+?)(?=\d{2}\d{2}|$)/);

    if (merchantInfoMatch) {
      const merchantInfo = merchantInfoMatch[1];

      // Proxy type tag 01
      const proxyTypeMatch = merchantInfo.match(/01(\d{2})(\d+)/);
      if (proxyTypeMatch) {
        const length = parseInt(proxyTypeMatch[1], 10);
        base.proxyType = proxyTypeMatch[2].substring(0, length);
      }

      // Proxy value tag 02
      const proxyValueMatch = merchantInfo.match(/02(\d{2})(.+?)(?=\d{2}\d{2}|$)/);
      if (proxyValueMatch) {
        const valueLength = parseInt(proxyValueMatch[1], 10);
        base.proxyValue = proxyValueMatch[2].substring(0, valueLength);
      }
    }

    // Amount (tag 54)
    const amountMatch = safeData.match(/54(\d{2})(.+?)(?=\d{2}\d{2}|$)/);
    if (amountMatch) {
      const length = parseInt(amountMatch[1], 10);
      base.amount = amountMatch[2].substring(0, length);
    }

    // Reference (tag 08 under additional data field template 62)
    const referenceMatch = safeData.match(/62\d{2}.*?08(\d{2})(.+?)(?=\d{2}\d{2}|$)/);
    if (referenceMatch) {
      const length = parseInt(referenceMatch[1], 10);
      base.reference = referenceMatch[2].substring(0, length);
    }
  } catch (error) {
    console.error("Error parsing PayNow QR:", error);
  }

  return base;
}
