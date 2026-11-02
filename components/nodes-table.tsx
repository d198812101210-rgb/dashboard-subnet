"use client";

import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Missing } from "@/components/missing";
import { SectionHead } from "@/components/section-head";
import { StatusText } from "@/components/status";
import { DataTable } from "@/components/table-shell";
import {
  formatLatency,
  formatMbps,
  formatRatio,
  formatTb,
} from "@/lib/format";
import type { Snapshot, StorageNode } from "@/lib/types";

const columnHelper = createColumnHelper<StorageNode>();

function compareNullable(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

export function NodesTable({
  snapshot,
  onSelect,
}: {
  snapshot: Snapshot | undefined;
  onSelect: (id: string) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "availability", desc: true }]);

  const data = useMemo(() => snapshot?.nodes ?? [], [snapshot]);

  const columns = useMemo(
    () =>
      [
        columnHelper.accessor("id", {
          header: "Node ID",
          cell: ({ getValue }) => <span className="num">{getValue()}</span>,
        }),
        columnHelper.accessor("uid", {
          header: "Linked UID",
          meta: { numeric: true },
          sortingFn: (a, b) => compareNullable(a.original.uid, b.original.uid),
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing align="right" />;
            return <span className="num">{value}</span>;
          },
        }),
        columnHelper.display({
          id: "storage",
          header: "Used / total",
          meta: { numeric: true },
          sortingFn: (a, b) =>
            compareNullable(a.original.usedBytes, b.original.usedBytes),
          cell: ({ row }) => {
            const { usedBytes, totalBytes } = row.original;
            if (usedBytes == null && totalBytes == null) return <Missing align="right" />;
            return (
              <span className="num">
                {usedBytes == null ? "—" : formatTb(usedBytes)} /{" "}
                {totalBytes == null ? "—" : `${formatTb(totalBytes)} TB`}
              </span>
            );
          },
        }),
        columnHelper.accessor("latencyMs", {
          header: "Latency",
          meta: { numeric: true },
          sortingFn: (a, b) => compareNullable(a.original.latencyMs, b.original.latencyMs),
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing align="right" />;
            return <span className="num">{formatLatency(value)}</span>;
          },
        }),
        columnHelper.accessor("proofTimeMs", {
          header: "Proof time",
          meta: { numeric: true },
          sortingFn: (a, b) => compareNullable(a.original.proofTimeMs, b.original.proofTimeMs),
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing align="right" />;
            return <span className="num">{formatLatency(value)}</span>;
          },
        }),
        columnHelper.accessor("availability", {
          header: "Availability",
          meta: { numeric: true },
          sortingFn: (a, b) => compareNullable(a.original.availability, b.original.availability),
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing align="right" />;
            return <span className="num">{formatRatio(value, 1)}</span>;
          },
        }),
        columnHelper.accessor("bandwidthMbps", {
          header: "Bandwidth",
          meta: { numeric: true },
          sortingFn: (a, b) => compareNullable(a.original.bandwidthMbps, b.original.bandwidthMbps),
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing align="right" />;
            return <span className="num">{formatMbps(value)}</span>;
          },
        }),
        columnHelper.accessor("region", {
          header: "Region",
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing />;
            return value;
          },
        }),
        columnHelper.accessor("status", {
          header: "Status",
          sortingFn: (a, b) => a.original.status.localeCompare(b.original.status),
          cell: ({ getValue }) => <StatusText status={getValue()} />,
        }),
      ] as ColumnDef<StorageNode>[],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <section data-section="nodes" aria-label="Storage nodes">
      <SectionHead title="Storage nodes" />
      <div className="px-4 py-3 md:px-6">
        {!snapshot ? (
          <p className="text-[13px] text-mute">Loading storage nodes…</p>
        ) : (
          <DataTable
            table={table}
            empty="No storage nodes in snapshot."
            onRowClick={(row) => onSelect(row.id)}
            rowId={(row) => row.id}
          />
        )}
      </div>
    </section>
  );
}
