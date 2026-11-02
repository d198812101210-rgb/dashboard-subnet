"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Snapshot } from "@/lib/types";

async function fetchSnapshot({ signal }: { signal?: AbortSignal }): Promise<Snapshot> {
  const response = await fetch("/api/sn75/snapshot", {
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Snapshot request failed (${response.status})`);
  }
  return (await response.json()) as Snapshot;
}

export function useSnapshot() {
  return useQuery({
    queryKey: ["sn75", "snapshot"],
    queryFn: fetchSnapshot,
    refetchInterval: 12_000,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
