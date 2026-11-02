"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { CopyButton } from "@/components/copy-button";
import { Missing } from "@/components/missing";
import { ServingText, StatusText } from "@/components/status";
import {
  formatBlock,
  formatEmission,
  formatLatency,
  formatMbps,
  formatRatio,
  formatStake,
  formatTb,
} from "@/lib/format";
import { neuronForNode, nodesForNeuron, storageForNeuron } from "@/lib/links";
import type { DashboardSelection } from "@/lib/selection";
import type { Snapshot } from "@/lib/types";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 border-b border-line py-2 text-[13px]">
      <dt className="label pt-0.5">{label}</dt>
      <dd className="min-w-0 text-ink">{children}</dd>
    </div>
  );
}

export function DetailDrawer({
  selection,
  snapshot,
  onClose,
}: {
  selection: DashboardSelection | null;
  snapshot: Snapshot | undefined;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!selection) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, onClose]);

  if (!selection || !snapshot) return null;

  const neuron =
    selection.kind === "neuron"
      ? snapshot.neurons.find((row) => row.uid === selection.uid)
      : neuronForNode(
          snapshot.nodes.find((node) => node.id === selection.id)!,
          snapshot.neurons,
        );

  const node =
    selection.kind === "node"
      ? snapshot.nodes.find((row) => row.id === selection.id)
      : undefined;

  const linkedNodes = neuron ? nodesForNeuron(neuron, snapshot.nodes) : node ? [node] : [];
  const storage = neuron ? storageForNeuron(neuron, snapshot.nodes) : null;

  const title =
    selection.kind === "neuron"
      ? `UID ${selection.uid}`
      : node?.id ?? "Storage node";

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Close detail drawer"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="drawer-in relative flex h-full w-full max-w-[420px] flex-col border-l border-line-strong bg-surface"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id="drawer-title" className="num text-[15px] font-medium">
            {title}
          </h2>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center border border-line text-dim hover:text-ink"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {neuron ? (
            <>
              <p className="label mb-2">Metagraph</p>
              <dl>
                <Field label="UID">
                  <span className="num">{neuron.uid}</span>
                </Field>
                <Field label="Hotkey">
                  <span className="inline-flex items-center gap-1">
                    <span className="num break-all text-dim">{neuron.hotkey}</span>
                    <CopyButton value={neuron.hotkey} label="Copy hotkey" />
                  </span>
                </Field>
                <Field label="Role">
                  <span className="capitalize">{neuron.role}</span>
                </Field>
                <Field label="Serving">
                  {neuron.serving == null ? <Missing /> : <ServingText serving={neuron.serving} />}
                </Field>
                <Field label="Stake">
                  {neuron.stake == null ? (
                    <Missing />
                  ) : (
                    <span className="num">{formatStake(neuron.stake)} α</span>
                  )}
                </Field>
                <Field label="Incentive">
                  {neuron.incentive == null ? (
                    <Missing />
                  ) : (
                    <span className="num">{formatRatio(neuron.incentive, 4)}</span>
                  )}
                </Field>
                <Field label="Emission">
                  {neuron.emission == null ? (
                    <Missing />
                  ) : (
                    <span className="num">{formatEmission(neuron.emission)}</span>
                  )}
                </Field>
                <Field label="Dividends">
                  {neuron.dividends == null ? (
                    <Missing />
                  ) : (
                    <span className="num">{formatRatio(neuron.dividends, 4)}</span>
                  )}
                </Field>
                <Field label="Trust">
                  {neuron.trust == null ? (
                    <Missing />
                  ) : (
                    <span className="num">{formatRatio(neuron.trust, 3)}</span>
                  )}
                </Field>
                <Field label="Consensus">
                  {neuron.consensus == null ? (
                    <Missing />
                  ) : (
                    <span className="num">{formatRatio(neuron.consensus, 3)}</span>
                  )}
                </Field>
                <Field label="Last update">
                  {neuron.lastUpdate == null ? (
                    <Missing />
                  ) : (
                    <span className="num">block {formatBlock(neuron.lastUpdate)}</span>
                  )}
                </Field>
              </dl>
            </>
          ) : null}

          {node || linkedNodes.length > 0 ? (
            <>
              <p className="label mb-2 mt-4">Hippius chain</p>
              {node ? (
                <dl>
                  <Field label="Node ID">
                    <span className="num">{node.id}</span>
                  </Field>
                  <Field label="Linked UID">
                    {node.uid == null ? <Missing /> : <span className="num">{node.uid}</span>}
                  </Field>
                  <Field label="Status">
                    <StatusText status={node.status} />
                  </Field>
                  <Field label="Region">{node.region ?? <Missing />}</Field>
                  <Field label="Used">
                    {node.usedBytes == null ? (
                      <Missing />
                    ) : (
                      <span className="num">{formatTb(node.usedBytes)} TB</span>
                    )}
                  </Field>
                  <Field label="Total">
                    {node.totalBytes == null ? (
                      <Missing />
                    ) : (
                      <span className="num">{formatTb(node.totalBytes)} TB</span>
                    )}
                  </Field>
                  <Field label="Latency">
                    {node.latencyMs == null ? (
                      <Missing />
                    ) : (
                      <span className="num">{formatLatency(node.latencyMs)}</span>
                    )}
                  </Field>
                  <Field label="Proof time">
                    {node.proofTimeMs == null ? (
                      <Missing />
                    ) : (
                      <span className="num">{formatLatency(node.proofTimeMs)}</span>
                    )}
                  </Field>
                  <Field label="Availability">
                    {node.availability == null ? (
                      <Missing />
                    ) : (
                      <span className="num">{formatRatio(node.availability, 2)}</span>
                    )}
                  </Field>
                  <Field label="Bandwidth">
                    {node.bandwidthMbps == null ? (
                      <Missing />
                    ) : (
                      <span className="num">{formatMbps(node.bandwidthMbps)}</span>
                    )}
                  </Field>
                </dl>
              ) : storage ? (
                <dl>
                  <Field label="Linked nodes">
                    <span className="num">{storage.nodeCount}</span>
                  </Field>
                  <Field label="Used / total">
                    {storage.usedBytes == null && storage.totalBytes == null ? (
                      <Missing />
                    ) : (
                      <span className="num">
                        {storage.usedBytes == null ? "—" : `${formatTb(storage.usedBytes)} TB`} /{" "}
                        {storage.totalBytes == null ? "—" : `${formatTb(storage.totalBytes)} TB`}
                      </span>
                    )}
                  </Field>
                  <Field label="Availability">
                    {storage.availability == null ? (
                      <Missing />
                    ) : (
                      <span className="num">{formatRatio(storage.availability, 2)}</span>
                    )}
                  </Field>
                  <Field label="Median latency">
                    {storage.latencyMs == null ? (
                      <Missing />
                    ) : (
                      <span className="num">{formatLatency(storage.latencyMs)}</span>
                    )}
                  </Field>
                </dl>
              ) : (
                <p className="text-[13px] text-mute">No Hippius storage linked to this UID.</p>
              )}

              {linkedNodes.length > 1 ? (
                <ul className="mt-3 space-y-1 border-t border-line pt-3 text-[12px] text-dim">
                  {linkedNodes.map((item) => (
                    <li key={item.id} className="num">
                      {item.id} · {item.status}
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
