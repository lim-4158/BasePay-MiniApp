import { useEffect, useMemo, useState } from "react";
import { resolveEnsName } from "../lib/ens";

type EnsMap = Record<string, string | null>;

export function useEnsNames(addresses: string[]): EnsMap {
  const [names, setNames] = useState<EnsMap>({});

  const normalizedAddresses = useMemo(() => {
    const deduped = new Set(
      addresses
        .filter(Boolean)
        .map((addr) => addr.toLowerCase())
    );
    return Array.from(deduped);
  }, [addresses]);

  useEffect(() => {
    if (normalizedAddresses.length === 0) {
      return;
    }

    let isCancelled = false;

    async function fetchNames() {
      const results = await Promise.all(
        normalizedAddresses.map(async (addr) => {
          const name = await resolveEnsName(addr);
          return [addr, name] as const;
        })
      );

      if (!isCancelled) {
        setNames((prev) => {
          const next = { ...prev };
          results.forEach(([addr, name]) => {
            next[addr] = name;
          });
          return next;
        });
      }
    }

    fetchNames();

    return () => {
      isCancelled = true;
    };
  }, [normalizedAddresses]);

  return names;
}
