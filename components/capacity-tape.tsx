import { Flash } from "@/components/flash";
import { SectionHead } from "@/components/section-head";
import { formatRatio, formatTb } from "@/lib/format";
import { networkCapacity } from "@/lib/metrics";
import type { StorageNode } from "@/lib/types";

const TICKS = [0, 0.25, 0.5, 0.75, 1] as const;

export function CapacityTape({ nodes }: { nodes: StorageNode[] | undefined }) {
  const capacity = nodes ? networkCapacity(nodes) : null;
  const ratio =
    capacity && capacity.totalBytes > 0
      ? capacity.usedBytes / capacity.totalBytes
      : null;
  const usedText =
    capacity && capacity.reported > 0 ? formatTb(capacity.usedBytes) : null;
  const totalText =
    capacity && capacity.reported > 0 ? formatTb(capacity.totalBytes) : null;
  const freeText =
    capacity && capacity.totalBytes > 0
      ? formatTb(Math.max(0, capacity.totalBytes - capacity.usedBytes))
      : null;
  const percent = ratio == null ? null : formatRatio(ratio, 1);

  return (
    <section data-section="capacity" aria-label="Network capacity">
      <SectionHead title="Network capacity" />
      <div className="px-4 py-5 md:px-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {usedText ? (
            <Flash
              signal={usedText}
              className="num text-[40px] leading-none tracking-[-0.03em] md:text-[56px]"
            >
              {usedText}
            </Flash>
          ) : (
            <span className="num text-[40px] leading-none text-mute md:text-[56px]">—</span>
          )}
          <span className="text-[13px] text-dim">
            {totalText ? `of ${totalText} TB used` : "capacity not reported"}
          </span>
        </div>

        <div className="relative mt-6 h-7 bg-recess">
          {ratio != null ? (
            <>
              <div
                className="absolute inset-y-0 left-0 bg-phosphor/35"
                style={{ width: `${Math.min(100, ratio * 100)}%` }}
              />
              <div
                className="absolute inset-y-0 w-0.5 bg-phosphor"
                style={{ left: `calc(${Math.min(100, ratio * 100)}% - 1px)` }}
                aria-hidden
              />
            </>
          ) : null}
        </div>

        <div className="relative mt-1 h-4">
          {TICKS.map((tick) => (
            <span
              key={tick}
              className="absolute top-0 h-2 w-px bg-line-strong"
              style={{ left: `${tick * 100}%` }}
              aria-hidden
            />
          ))}
          <div className="flex justify-between pt-2 text-[11px] text-mute">
            {TICKS.map((tick) => (
              <span key={tick} className="num">
                {Math.round(tick * 100)}%
              </span>
            ))}
          </div>
        </div>

        <p className="mt-2 text-[13px] text-dim">
          {percent && freeText ? (
            <>
              <span className="num text-ink">{percent}</span> utilized ·{" "}
              <span className="num text-ink">{freeText}</span> TB free
              {capacity && capacity.omitted > 0 ? (
                <>
                  {" "}
                  · <span className="num">{capacity.omitted}</span> nodes omitted from totals
                </>
              ) : null}
            </>
          ) : (
            "Utilization unavailable — no paired used/total reports."
          )}
        </p>
      </div>
    </section>
  );
}
