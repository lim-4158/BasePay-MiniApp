/**
 * QR Code Storage Management
 * Local storage solution for mapping QR payloads to custom names
 */

export interface QRCodeData {
  payload: string;
  name: string;
  registeredAt: number;
  txHash?: string;
}

const STORAGE_KEY = 'basedpay_qr_codes';

/**
 * Get all registered QR codes for the current wallet
 */
export function getRegisteredQRCodes(walletAddress: string): QRCodeData[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${walletAddress.toLowerCase()}`);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading QR codes:', error);
    return [];
  }
}

/**
 * Add a new QR code with custom name
 */
export function addQRCode(
  walletAddress: string,
  payload: string,
  name: string,
  txHash?: string
): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getRegisteredQRCodes(walletAddress);

    // Check if payload already exists
    const isDuplicate = existing.some(qr => qr.payload === payload);
    if (isDuplicate) {
      throw new Error('QR code already registered');
    }

    const newQR: QRCodeData = {
      payload,
      name: name.trim() || 'Unnamed QR Code',
      registeredAt: Date.now(),
      txHash,
    };

    const updated = [...existing, newQR];
    localStorage.setItem(
      `${STORAGE_KEY}_${walletAddress.toLowerCase()}`,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error('Error adding QR code:', error);
    throw error;
  }
}

/**
 * Update QR code name
 */
export function updateQRCodeName(
  walletAddress: string,
  payload: string,
  newName: string
): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getRegisteredQRCodes(walletAddress);
    const updated = existing.map(qr =>
      qr.payload === payload ? { ...qr, name: newName.trim() || 'Unnamed QR Code' } : qr
    );

    localStorage.setItem(
      `${STORAGE_KEY}_${walletAddress.toLowerCase()}`,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error('Error updating QR code name:', error);
    throw error;
  }
}

/**
 * Delete a QR code
 */
export function deleteQRCode(walletAddress: string, payload: string): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getRegisteredQRCodes(walletAddress);
    const updated = existing.filter(qr => qr.payload !== payload);

    localStorage.setItem(
      `${STORAGE_KEY}_${walletAddress.toLowerCase()}`,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error('Error deleting QR code:', error);
    throw error;
  }
}

/**
 * Get QR code by payload
 */
export function getQRCodeByPayload(
  walletAddress: string,
  payload: string
): QRCodeData | undefined {
  const qrCodes = getRegisteredQRCodes(walletAddress);
  return qrCodes.find(qr => qr.payload === payload);
}

/**
 * Get QR code name by payload (returns "Unknown QR" if not found)
 */
export function getQRCodeName(walletAddress: string, payload: string): string {
  const qrCode = getQRCodeByPayload(walletAddress, payload);
  return qrCode?.name || 'Unknown QR Code';
}
