"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Flash } from "@/components/flash";
import { SyncText } from "@/components/status";
import { cn } from "@/lib/cn";
import { formatBlock } from "@/lib/format";
import { headerSync, sourceSync } from "@/lib/sync";
import type { Snapshot, SyncState } from "@/lib/types";

export function Header({ query }: { query: UseQueryResult<Snapshot, Error> }) {
  const data = query.data;
  const sync = headerSync(query);
  const block = data?.chain.headBlock;
  const minutes = data ? Math.round(data.metagraph.tempoMs / 60_000) : null;
  const statusMessage =
    sync === "stale"
      ? "Snapshot refresh failed. Showing the last successful sync."
      : data
        ? "Snapshot live."
        : "Syncing snapshot.";

  return (
    <header
      data-section="header"
      data-sync={sync}
      className="sticky top-0 z-30 border-b border-line bg-canvas"
    >
      <div className="grid gap-4 px-4 py-3 md:px-6 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
        <div>
          <h1 className="flex items-baseline gap-2 text-[15px] font-medium">
            <span className="num">SN{data?.subnetId ?? 75}</span>
            <span>{data?.subnetName ?? "Hippius"}</span>
          </h1>
          <p className="label mt-1">{data?.network ?? "—"}</p>
        </div>

        <div className="min-w-0 xl:justify-self-center">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 xl:justify-end">
            <span className="label">Chain head</span>
            <span className="num inline-block min-w-[11ch] text-right text-[15px] font-medium">
              {block == null ? (
                "—"
              ) : (
                <Flash signal={block}>{formatBlock(block)}</Flash>
              )}
            </span>
            <Heartbeat state={sync} block={block} />
            <SyncText state={sync} />
          </div>
          <p className="mt-1 text-[12px] leading-5 text-mute xl:text-right">
            <SyncedAgo at={data ? query.dataUpdatedAt : null} />
          </p>
          <p className="text-[12px] leading-5 text-dim xl:text-right">
            Metagraph at block{" "}
            <span className="num text-ink">
              {data ? formatBlock(data.metagraph.block) : "—"}
            </span>
            {" · "}
            rewards move on tempo, about{" "}
            <span className="num text-ink">{minutes ?? "—"}</span> min
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 xl:justify-end">
          <SourceLamp
            label="Metagraph"
            state={sourceSync(query, data?.sources.metagraph.ok)}
          />
          <SourceLamp
            label="Hippius chain"
            state={sourceSync(query, data?.sources.hippius.ok)}
          />
          {data?.demo ? (
            <span className="label border border-line px-1.5 py-1" title="Simulated snapshot">
              Demo data
            </span>
          ) : null}
        </div>
      </div>
      <p role="status" className="sr-only">
        {statusMessage}
      </p>
    </header>
  );
}

function Heartbeat({ state, block }: { state: SyncState; block: number | undefined }) {
  const color =
    state === "live" ? "bg-phosphor" : state === "syncing" ? "bg-degraded" : "bg-offline";
  return (
    <span
      key={block ?? "pending"}
      className={cn("inline-block h-2 w-2 rounded-full", color, state === "live" && "heartbeat")}
      aria-hidden
    />
  );
}

function SourceLamp({ label, state }: { label: string; state: SyncState }) {
  const color =
    state === "live" ? "bg-phosphor" : state === "syncing" ? "bg-degraded" : "bg-offline";
  return (
    <span className="inline-flex items-center gap-2 text-[12px] text-dim">
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", color)} aria-hidden />
      <span>{label}</span>
      <span className="text-ink">
        {state === "live" ? "Live" : state === "syncing" ? "Syncing" : "Stale"}
      </span>
    </span>
  );
}

function SyncedAgo({ at }: { at: number | null }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const label =
    now == null || at == null
      ? "synced —"
      : `synced ${Math.max(0, Math.floor((now - at) / 1000))}s ago`;

  return <span className="num inline-block min-w-[14ch]">{label}</span>;
}
