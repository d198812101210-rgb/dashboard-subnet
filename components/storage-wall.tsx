"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SectionHead } from "@/components/section-head";
import { statusLabel } from "@/components/status";
import { cn } from "@/lib/cn";
import {
  formatLatency,
  formatRatio,
  formatTb,
} from "@/lib/format";
import type { NodeStatus, StorageNode } from "@/lib/types";

const STATUS_STYLE: Record<
  NodeStatus,
  { cell: string; legend: string }
> = {
  healthy: {
    cell: "bg-phosphor-dim border-phosphor-edge",
    legend: "bg-phosphor",
  },
  degraded: {
    cell: "bg-degraded-dim border-degraded/60",
    legend: "bg-degraded",
  },
  offline: {
    cell: "bg-offline-dim border-offline/70",
    legend: "bg-offline",
  },
  unknown: {
    cell: "bg-unknown border-line-strong",
    legend: "border border-line-strong bg-unknown",
  },
};

export function StorageWall({
  nodes,
  onSelect,
}: {
  nodes: StorageNode[] | undefined;
  onSelect: (id: string) => void;
}) {
  const counts = useMemo(() => {
    const tally: Record<NodeStatus, number> = {
      healthy: 0,
      degraded: 0,
      offline: 0,
      unknown: 0,
    };
    for (const node of nodes ?? []) tally[node.status] += 1;
    return tally;
  }, [nodes]);

  const legend = (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-dim">
      {(Object.keys(counts) as NodeStatus[]).map((status) => (
        <li key={status} className="inline-flex items-center gap-1.5">
          <span
            className={cn("inline-block h-2 w-2", STATUS_STYLE[status].legend)}
            aria-hidden
          />
          {statusLabel(status)}
          <span className="num text-ink">{counts[status]}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <section data-section="storage-wall" aria-label="Storage node wall">
      <SectionHead title="Storage wall" aside={nodes ? legend : undefined} />
      <div className="px-4 py-4 md:px-6">
        {!nodes ? (
          <p className="text-[13px] text-mute">Loading nodes…</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {nodes.map((node) => (
              <WallCell key={node.id} node={node} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function WallCell({
  node,
  onSelect,
}: {
  node: StorageNode;
  onSelect: (id: string) => void;
}) {
  const previousStatus = useRef(node.status);
  const [flash, setFlash] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (previousStatus.current === node.status) return;
    previousStatus.current = node.status;
    setFlash(true);
    const timeout = window.setTimeout(() => setFlash(false), 600);
    return () => window.clearTimeout(timeout);
  }, [node.status]);

  const used =
    node.usedBytes != null && node.totalBytes != null
      ? `${formatTb(node.usedBytes)} / ${formatTb(node.totalBytes)} TB`
      : "—";
  const latency = node.latencyMs == null ? "—" : formatLatency(node.latencyMs);
  const availability =
    node.availability == null ? "—" : formatRatio(node.availability, 1);
  const region = node.region ?? "—";

  return (
    <span className="group relative">
      <button
        type="button"
        aria-label={`${node.id}, ${statusLabel(node.status)}`}
        className={cn(
          "h-4 w-7 shrink-0 border sm:h-4 sm:w-7",
          STATUS_STYLE[node.status].cell,
          node.status === "offline" && "relative overflow-hidden",
          flash && "lamp-flash",
          "hover:outline hover:outline-1 hover:outline-phosphor hover:outline-offset-1",
        )}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        onClick={() => onSelect(node.id)}
      >
        {node.status === "offline" ? (
          <span
            className="absolute inset-0 bg-offline/25"
            style={{ clipPath: "polygon(0 100%, 100% 0, 100% 100%)" }}
            aria-hidden
          />
        ) : null}
        {node.status === "degraded" ? (
          <span className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-degraded" aria-hidden />
        ) : null}
      </button>
      {hover ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max max-w-[min(16rem,calc(100vw-2rem))] -translate-x-1/2 border border-line bg-surface px-2 py-2 text-left text-[11px] font-sans normal-case tracking-normal"
        >
          <span className="num block text-[12px] text-ink">{node.id}</span>
          <span className="mt-1 block text-dim">{statusLabel(node.status)}</span>
          <span className="mt-2 block text-mute">Capacity</span>
          <span className="num block text-ink">{used}</span>
          <span className="mt-1 block text-mute">Latency</span>
          <span className="num block text-ink">{latency}</span>
          <span className="mt-1 block text-mute">Availability</span>
          <span className="num block text-ink">{availability}</span>
          <span className="mt-1 block text-mute">Region</span>
          <span className="block text-ink">{region}</span>
        </span>
      ) : null}
    </span>
  );
}
