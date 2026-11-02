import { Flash } from "@/components/flash";
import { Missing } from "@/components/missing";
import {
  formatCount,
  formatLatency,
  formatRatio,
  formatStake,
  formatStakeCompact,
  formatTb,
} from "@/lib/format";
import { kpiModel } from "@/lib/metrics";
import type { Snapshot } from "@/lib/types";

export function KpiStrip({ snapshot }: { snapshot: Snapshot | null }) {
  const model = snapshot
    ? kpiModel(snapshot.neurons, snapshot.nodes, snapshot.subnetSize)
    : null;
  const capacity = model?.capacity;
  const usedText =
    capacity && capacity.reported > 0 ? formatTb(capacity.usedBytes) : null;
  const totalText =
    capacity && capacity.reported > 0 ? formatTb(capacity.totalBytes) : null;

  const items: Array<{ label: string; value: string | null; unit?: string; sub: string; exact?: string }> =
    [
      {
        label: "Registered UIDs",
        value: model ? formatCount(model.registered) : null,
        sub: model ? `/ ${formatCount(model.subnetSize)}` : "\u00a0",
      },
      {
        label: "Validators",
        value: model ? formatCount(model.validators) : null,
        sub: model ? `of ${formatCount(model.registered)} UIDs` : "\u00a0",
      },
      {
        label: "Serving miners",
        value: model ? formatCount(model.servingMiners) : null,
        sub: model
          ? `of ${formatCount(model.miners)} miners${
              model.servingUnreported > 0 ? ` · ${formatCount(model.servingUnreported)} unreported` : ""
            }`
          : "\u00a0",
      },
      {
        label: "Storage used",
        value: usedText,
        unit: usedText ? "TB" : undefined,
        sub:
          totalText && capacity
            ? `of ${totalText} TB${
                capacity.omitted > 0 ? ` · ${formatCount(capacity.omitted)} omitted` : ""
              }`
            : model
              ? "none reporting"
              : "\u00a0",
      },
      {
        label: "Median latency",
        value: model?.medianLatency == null ? null : formatLatency(model.medianLatency),
        sub: model ? `${formatCount(model.latencySample)} reporting` : "\u00a0",
      },
      {
        label: "Average availability",
        value: model?.availability == null ? null : formatRatio(model.availability, 1),
        sub: model ? `${formatCount(model.availabilitySample)} reporting` : "\u00a0",
      },
      {
        label: "Total alpha stake",
        value: model?.stake == null ? null : formatStakeCompact(model.stake),
        unit: model?.stake == null ? undefined : "α",
        exact: model?.stake == null ? undefined : `${formatStake(model.stake)} α`,
        sub:
          model && model.stakeOmitted > 0
            ? `${formatCount(model.stakeOmitted)} unreported`
            : "\u00a0",
      },
    ];

  return (
    <section data-section="kpi" aria-label="Network figures">
      <div className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4 xl:grid-cols-7">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 bg-canvas px-3 py-3 md:px-4 md:py-4">
            <h2 className="label min-h-8">{item.label}</h2>
            <div className="mt-2 flex items-baseline gap-2" title={item.exact}>
              <Figure ready={snapshot != null} value={item.value} />
              {item.unit ? <span className="text-[13px] text-dim">{item.unit}</span> : null}
            </div>
            <p className="mt-1 min-h-4 text-[12px] leading-4 text-mute">{item.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Figure({ ready, value }: { ready: boolean; value: string | null }) {
  if (!ready) {
    return (
      <span className="num text-[24px] leading-none tracking-[-0.03em] text-mute xl:text-[28px]">
        —
      </span>
    );
  }
  if (value == null) return <Missing />;
  return (
    <Flash
      signal={value}
      className="num text-[24px] leading-none tracking-[-0.03em] xl:text-[28px]"
    >
      {value}
    </Flash>
  );
}
