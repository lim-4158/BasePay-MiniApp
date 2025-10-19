/**
 * ENS Resolution Helpers
 * Resolve Ethereum addresses to their primary ENS names
 */

import { createPublicClient, http, isAddress } from "viem";
import { mainnet } from "viem/chains";

const ETHEREUM_RPC_URL =
  process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "https://cloudflare-eth.com";

const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(ETHEREUM_RPC_URL),
});

const ensCache = new Map<string, string | null>();

export async function resolveEnsName(address: string): Promise<string | null> {
  const normalized = address?.toLowerCase();
  if (!normalized || !isAddress(normalized)) {
    return null;
  }

  if (ensCache.has(normalized)) {
    return ensCache.get(normalized) ?? null;
  }

  try {
    const name = await ensClient.getEnsName({
      address: normalized as `0x${string}`,
    });
    ensCache.set(normalized, name ?? null);
    return name ?? null;
  } catch (error) {
    console.error("Error resolving ENS name:", error);
    ensCache.set(normalized, null);
    return null;
  }
}
