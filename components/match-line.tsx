import { formatCount } from "@/lib/format";
import { matchStats } from "@/lib/metrics";
import type { Snapshot } from "@/lib/types";

export function MatchLine({ snapshot }: { snapshot: Snapshot | null }) {
  const stats = snapshot ? matchStats(snapshot.neurons, snapshot.nodes) : null;
  return (
    <p
      data-section="match"
      className="border-t border-line px-4 py-2 text-[12px] leading-5 text-dim md:px-6"
    >
      {stats ? (
        <>
          <span className="num text-ink">{formatCount(stats.matchedUids)}</span> of{" "}
          <span className="num">{formatCount(stats.uids)}</span> UIDs match a storage node by hotkey
          <span className="text-mute"> · </span>
          <span className="num text-ink">{formatCount(stats.unmatchedNodes)}</span> of{" "}
          <span className="num">{formatCount(stats.nodes)}</span> nodes have no UID
        </>
      ) : (
        <span className="text-mute">Hotkey match —</span>
      )}
    </p>
  );
}
