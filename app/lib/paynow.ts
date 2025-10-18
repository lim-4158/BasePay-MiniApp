/**
 * PayNow QR Code utilities
 *
 * PayNow QR codes follow the EMVCo QR standard
 * Format: Tag-Length-Value (TLV)
 */

export interface PayNowQRData {
  raw: string;
  proxyType?: string;
  proxyValue?: string;
  amount?: string;
  reference?: string;
}

/**
 * Parse a QR payload and surface common PayNow fields when present.
 * The caller is responsible for deciding whether the payload is valid.
 */
export function parsePayNowQR(qrData: string): PayNowQRData {
  const safeData = typeof qrData === "string" ? qrData.trim() : "";
  const result: PayNowQRData = {
    raw: safeData,
  };

  if (!safeData) {
    return result;
  }

  try {
    // Merchant account information is stored in tag 26
    const merchantInfoMatch = safeData.match(/26\d{2}([^]+?)(?=\d{2}\d{2}|$)/);

    if (merchantInfoMatch) {
      const merchantInfo = merchantInfoMatch[1];

      // Proxy type tag 01
      const proxyTypeMatch = merchantInfo.match(/01(\d{2})(\d+)/);
      if (proxyTypeMatch) {
        const length = parseInt(proxyTypeMatch[1], 10);
        result.proxyType = proxyTypeMatch[2].substring(0, length);
      }

      // Proxy value tag 02
      const proxyValueMatch = merchantInfo.match(/02(\d{2})(.+?)(?=\d{2}\d{2}|$)/);
      if (proxyValueMatch) {
        const valueLength = parseInt(proxyValueMatch[1], 10);
        result.proxyValue = proxyValueMatch[2].substring(0, valueLength);
      }
    }

    // Amount (tag 54)
    const amountMatch = safeData.match(/54(\d{2})(.+?)(?=\d{2}\d{2}|$)/);
    if (amountMatch) {
      const length = parseInt(amountMatch[1], 10);
      result.amount = amountMatch[2].substring(0, length);
    }

    // Reference (tag 08 under additional data field template 62)
    const referenceMatch = safeData.match(/62\d{2}.*?08(\d{2})(.+?)(?=\d{2}\d{2}|$)/);
    if (referenceMatch) {
      const length = parseInt(referenceMatch[1], 10);
      result.reference = referenceMatch[2].substring(0, length);
    }
  } catch (error) {
    console.error("Error parsing QR payload:", error);
  }

  return result;
}
