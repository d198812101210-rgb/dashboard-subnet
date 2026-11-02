import { Clock, Radio, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { NodeStatus, SyncState } from "@/lib/types";

const STATUS_LABEL: Record<NodeStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  offline: "Offline",
  unknown: "Unreported",
};

export function statusLabel(status: NodeStatus): string {
  return STATUS_LABEL[status];
}

export function StatusGlyph({ status }: { status: NodeStatus }) {
  if (status === "healthy") {
    return <span className="inline-block h-1.5 w-1.5 rounded-full bg-phosphor" aria-hidden />;
  }
  if (status === "degraded") {
    return <span className="inline-block h-px w-2.5 bg-degraded" aria-hidden />;
  }
  if (status === "offline") {
    return <TriangleAlert className="h-3 w-3 text-offline" aria-hidden />;
  }
  return <span className="inline-block h-2 w-2 border border-line-strong" aria-hidden />;
}

export function StatusText({ status }: { status: NodeStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink">
      <StatusGlyph status={status} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ServingText({ serving }: { serving: boolean | null }) {
  if (serving == null) return null;
  if (serving) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-phosphor" aria-hidden />
        Serving
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="inline-block h-px w-2.5 bg-mute" aria-hidden />
      Not serving
    </span>
  );
}

const SYNC_LABEL: Record<SyncState, string> = {
  live: "Live",
  syncing: "Syncing",
  stale: "Stale",
};

export function SyncText({ state }: { state: SyncState }) {
  const Icon = state === "stale" ? TriangleAlert : state === "syncing" ? Clock : Radio;
  const color =
    state === "live" ? "text-phosphor" : state === "syncing" ? "text-degraded" : "text-offline";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-ink">
      <Icon className={cn("h-3.5 w-3.5", color)} aria-hidden />
      {SYNC_LABEL[state]}
    </span>
  );
}
