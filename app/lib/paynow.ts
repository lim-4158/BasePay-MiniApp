/**
 * PayNow QR Code Parser
 *
 * PayNow QR codes follow the EMVCo QR standard
 * Format: Tag-Length-Value (TLV)
 *
 * Example structure:
 * 00 02 01       - Payload format indicator
 * 26 XX          - Merchant Account Information
 *   00 12 SG.PAYNOW
 *   01 01 2      - Proxy type (2 = UEN, 0 = Mobile, 1 = UEN)
 *   02 09 [UEN]  - Proxy value (UEN number)
 */

export interface PayNowQRData {
  uen: string | null;
  amount?: string;
  reference?: string;
  raw?: string;
}

/**
 * Parse PayNow QR code data to extract UEN
 */
export function parsePayNowQR(qrData: string): PayNowQRData {
  try {
    // PayNow QR codes contain "SG.PAYNOW" identifier
    if (!qrData.includes('SG.PAYNOW')) {
      return { uen: null, raw: qrData };
    }

    // Find the merchant account information section (tag 26)
    const merchantInfoMatch = qrData.match(/26\d{2}([^]+?)(?=\d{2}\d{2}|$)/);

    if (!merchantInfoMatch) {
      return { uen: null, raw: qrData };
    }

    const merchantInfo = merchantInfoMatch[1];

    // Extract proxy type and value
    // Proxy type tag is 01, value tag is 02
    const proxyTypeMatch = merchantInfo.match(/01(\d{2})(\d+)/);
    const proxyValueMatch = merchantInfo.match(/02(\d{2})(.+?)(?=\d{2}\d{2}|$)/);

    if (!proxyValueMatch) {
      return { uen: null, raw: qrData };
    }

    const proxyType = proxyTypeMatch ? proxyTypeMatch[2] : '';
    const proxyValueLength = parseInt(proxyValueMatch[1], 10);
    const proxyValue = proxyValueMatch[2].substring(0, proxyValueLength);

    // Proxy type 2 = UEN
    // Proxy type 0 = Mobile number
    // We only care about UEN for merchant registration
    if (proxyType === '2') {
      // Extract amount if present (tag 54)
      const amountMatch = qrData.match(/54(\d{2})(.+?)(?=\d{2}\d{2}|$)/);
      const amount = amountMatch ? amountMatch[2].substring(0, parseInt(amountMatch[1], 10)) : undefined;

      // Extract reference if present (tag 08 under additional data, tag 62)
      const referenceMatch = qrData.match(/62\d{2}.*?08(\d{2})(.+?)(?=\d{2}\d{2}|$)/);
      const reference = referenceMatch ? referenceMatch[2].substring(0, parseInt(referenceMatch[1], 10)) : undefined;

      return {
        uen: proxyValue,
        amount,
        reference,
        raw: qrData,
      };
    }

    return { uen: null, raw: qrData };
  } catch (error) {
    console.error('Error parsing PayNow QR:', error);
    return { uen: null, raw: qrData };
  }
}

/**
 * Simple UEN format validation
 * Singapore UEN format: 9-10 characters (8-9 digits + 1 letter)
 * Examples: 201234567A, 53123456K, T08GB0001A
 */
export function isValidUEN(uen: string): boolean {
  if (!uen || typeof uen !== 'string') {
    return false;
  }

  // Remove whitespace
  const cleanUEN = uen.trim().toUpperCase();

  // UEN should be 9-10 characters
  if (cleanUEN.length < 9 || cleanUEN.length > 10) {
    return false;
  }

  // Should end with a letter
  if (!/[A-Z]$/.test(cleanUEN)) {
    return false;
  }

  // Should start with digits or specific prefixes
  return true;
}

/**
 * Format UEN for display
 */
export function formatUEN(uen: string): string {
  return uen.trim().toUpperCase();
}
