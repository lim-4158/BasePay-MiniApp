/**
 * Transaction History Utilities
 * Query USDC transfer events from the blockchain
 */

import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { USDC_ADDRESS } from './contracts';

// Create public client for reading blockchain data
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export interface Transaction {
  from: string;
  to: string;
  amount: string; // Formatted USDC amount (e.g., "10.50")
  amountRaw: bigint; // Raw amount in smallest units
  txHash: string;
  blockNumber: bigint;
  timestamp?: number;
}

/**
 * Get all USDC transfers received by a merchant wallet
 * @param merchantAddress The merchant's wallet address
 * @param fromBlock Optional starting block number
 * @returns Array of received transactions
 */
export async function getMerchantPayments(
  merchantAddress: string,
  fromBlock: bigint = BigInt(0)
): Promise<Transaction[]> {
  try {
    const logs = await publicClient.getLogs({
      address: USDC_ADDRESS,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
      args: {
        to: merchantAddress as `0x${string}`,
      },
      fromBlock,
    });

    // Convert logs to transaction objects
    const transactions: Transaction[] = logs.map((log) => ({
      from: log.args.from as string,
      to: log.args.to as string,
      amountRaw: log.args.value as bigint,
      amount: formatUnits(log.args.value as bigint, 6), // USDC has 6 decimals
      txHash: log.transactionHash as string,
      blockNumber: log.blockNumber,
    }));

    // Get timestamps for recent transactions
    const transactionsWithTimestamps = await Promise.all(
      transactions.slice(0, 50).map(async (tx) => {
        try {
          const block = await publicClient.getBlock({ blockNumber: tx.blockNumber });
          return { ...tx, timestamp: Number(block.timestamp) };
        } catch (error) {
          console.error(`Error fetching block ${tx.blockNumber}:`, error);
          return tx;
        }
      })
    );

    // Sort by block number descending (most recent first)
    return transactionsWithTimestamps.sort((a, b) =>
      Number(b.blockNumber - a.blockNumber)
    );
  } catch (error) {
    console.error('Error fetching merchant payments:', error);
    throw error;
  }
}

/**
 * Get all USDC transfers sent by a customer wallet
 * @param customerAddress The customer's wallet address
 * @param fromBlock Optional starting block number
 * @returns Array of sent transactions
 */
export async function getCustomerPayments(
  customerAddress: string,
  fromBlock: bigint = BigInt(0)
): Promise<Transaction[]> {
  try {
    const logs = await publicClient.getLogs({
      address: USDC_ADDRESS,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
      args: {
        from: customerAddress as `0x${string}`,
      },
      fromBlock,
    });

    // Convert logs to transaction objects
    const transactions: Transaction[] = logs.map((log) => ({
      from: log.args.from as string,
      to: log.args.to as string,
      amountRaw: log.args.value as bigint,
      amount: formatUnits(log.args.value as bigint, 6), // USDC has 6 decimals
      txHash: log.transactionHash as string,
      blockNumber: log.blockNumber,
    }));

    // Get timestamps for recent transactions
    const transactionsWithTimestamps = await Promise.all(
      transactions.slice(0, 50).map(async (tx) => {
        try {
          const block = await publicClient.getBlock({ blockNumber: tx.blockNumber });
          return { ...tx, timestamp: Number(block.timestamp) };
        } catch (error) {
          console.error(`Error fetching block ${tx.blockNumber}:`, error);
          return tx;
        }
      })
    );

    // Sort by block number descending (most recent first)
    return transactionsWithTimestamps.sort((a, b) =>
      Number(b.blockNumber - a.blockNumber)
    );
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    throw error;
  }
}

/**
 * Calculate total amount received
 * @param transactions Array of transactions
 * @returns Total amount as formatted string
 */
export function calculateTotalReceived(transactions: Transaction[]): string {
  const total = transactions.reduce((sum, tx) => sum + tx.amountRaw, BigInt(0));
  return formatUnits(total, 6);
}

/**
 * Calculate total amount sent
 * @param transactions Array of transactions
 * @returns Total amount as formatted string
 */
export function calculateTotalSent(transactions: Transaction[]): string {
  const total = transactions.reduce((sum, tx) => sum + tx.amountRaw, BigInt(0));
  return formatUnits(total, 6);
}

/**
 * Format timestamp to readable date
 * @param timestamp Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatTransactionDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return new Intl.DateTimeFormat('en-SG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Get unique customer count from merchant transactions
 * @param transactions Array of transactions
 * @returns Number of unique customers
 */
export function getUniqueCustomerCount(transactions: Transaction[]): number {
  const uniqueCustomers = new Set(transactions.map(tx => tx.from.toLowerCase()));
  return uniqueCustomers.size;
}
