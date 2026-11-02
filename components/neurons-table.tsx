"use client";

import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Columns3 } from "lucide-react";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Missing } from "@/components/missing";
import { SectionHead } from "@/components/section-head";
import { ServingText } from "@/components/status";
import { DataTable } from "@/components/table-shell";
import {
  formatBlock,
  formatEmission,
  formatRatio,
  formatStake,
  formatTb,
  shortHotkey,
} from "@/lib/format";
import { storageForNeuron } from "@/lib/links";
import type { Neuron, Snapshot } from "@/lib/types";

export type NeuronRow = Neuron & {
  storageUsed: number | null;
  storageTotal: number | null;
  storageAvailability: number | null;
};

type RoleFilter = "all" | "validator" | "miner";
type ServingFilter = "all" | "serving" | "not-serving" | "unreported";

const columnHelper = createColumnHelper<NeuronRow>();

function compareNullable(a: number | null, b: number | null): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

export function NeuronsTable({
  snapshot,
  onSelect,
}: {
  snapshot: Snapshot | undefined;
  onSelect: (uid: number) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "incentive", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [servingFilter, setServingFilter] = useState<ServingFilter>("all");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [menuOpen, setMenuOpen] = useState(false);

  const data = useMemo<NeuronRow[]>(() => {
    if (!snapshot) return [];
    return snapshot.neurons
      .map((neuron) => {
        const link = storageForNeuron(neuron, snapshot.nodes);
        return {
          ...neuron,
          storageUsed: link?.usedBytes ?? null,
          storageTotal: link?.totalBytes ?? null,
          storageAvailability: link?.availability ?? null,
        };
      })
      .filter((neuron) => {
        if (roleFilter !== "all" && neuron.role !== roleFilter) return false;
        if (servingFilter === "serving" && neuron.serving !== true) return false;
        if (servingFilter === "not-serving" && neuron.serving !== false) return false;
        if (servingFilter === "unreported" && neuron.serving != null) return false;
        return true;
      });
  }, [snapshot, roleFilter, servingFilter]);

  const columns = useMemo(
    () =>
      [
        columnHelper.accessor("uid", {
          header: "UID",
          meta: { numeric: true },
          sortingFn: (a, b) => a.original.uid - b.original.uid,
          cell: ({ getValue }) => <span className="num">{getValue()}</span>,
        }),
        columnHelper.accessor("hotkey", {
          header: "Hotkey",
          enableSorting: false,
          cell: ({ getValue }) => {
            const value = getValue();
            return (
              <span className="inline-flex items-center gap-1">
                <span className="num text-dim" title={value}>
                  {shortHotkey(value)}
                </span>
                <CopyButton value={value} label="Copy hotkey" />
              </span>
            );
          },
        }),
        columnHelper.accessor("role", {
          header: "Role",
          cell: ({ getValue }) => (
            <span className="capitalize">{getValue()}</span>
          ),
        }),
        columnHelper.accessor("serving", {
          header: "Serving",
          sortingFn: (a, b) => {
            const rank = (value: boolean | null) =>
              value === true ? 0 : value === false ? 1 : 2;
            return rank(a.original.serving) - rank(b.original.serving);
          },
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing />;
            return <ServingText serving={value} />;
          },
        }),
        columnHelper.accessor("stake", {
          header: "Stake",
          meta: { numeric: true },
          sortingFn: (a, b) => compareNullable(a.original.stake, b.original.stake),
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing align="right" />;
            return <span className="num">{formatStake(value)} α</span>;
          },
        }),
        columnHelper.accessor("incentive", {
          header: "Incentive",
          meta: { numeric: true },
          sortingFn: (a, b) => compareNullable(a.original.incentive, b.original.incentive),
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing align="right" />;
            return <span className="num">{formatRatio(value, 3)}</span>;
          },
        }),
        columnHelper.accessor("emission", {
          header: "Emission",
          meta: { numeric: true },
          sortingFn: (a, b) => compareNullable(a.original.emission, b.original.emission),
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing align="right" />;
            return <span className="num">{formatEmission(value)}</span>;
          },
        }),
        columnHelper.accessor("dividends", {
          header: "Dividends",
          meta: { numeric: true },
          sortingFn: (a, b) => compareNullable(a.original.dividends, b.original.dividends),
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing align="right" />;
            return <span className="num">{formatRatio(value, 3)}</span>;
          },
        }),
        columnHelper.accessor("trust", {
          header: "Trust",
          meta: { numeric: true },
          sortingFn: (a, b) => compareNullable(a.original.trust, b.original.trust),
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing align="right" />;
            return <span className="num">{formatRatio(value, 2)}</span>;
          },
        }),
        columnHelper.accessor("consensus", {
          header: "Consensus",
          meta: { numeric: true },
          sortingFn: (a, b) => compareNullable(a.original.consensus, b.original.consensus),
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing align="right" />;
            return <span className="num">{formatRatio(value, 2)}</span>;
          },
        }),
        columnHelper.accessor("lastUpdate", {
          header: "Last update",
          meta: { numeric: true },
          sortingFn: (a, b) => compareNullable(a.original.lastUpdate, b.original.lastUpdate),
          cell: ({ getValue }) => {
            const value = getValue();
            if (value == null) return <Missing align="right" />;
            return <span className="num">{formatBlock(value)}</span>;
          },
        }),
        columnHelper.display({
          id: "storage",
          header: "Storage",
          enableSorting: false,
          cell: ({ row }) => {
            const { storageUsed, storageTotal, storageAvailability } = row.original;
            if (storageUsed == null && storageTotal == null && storageAvailability == null) {
              return <Missing align="right" />;
            }
            return (
              <span className="num text-dim">
                {storageUsed != null && storageTotal != null ? (
                  <>
                    {formatTb(storageUsed)}/{formatTb(storageTotal)} TB
                  </>
                ) : (
                  "—"
                )}
                {storageAvailability != null ? (
                  <span className="text-mute"> · {formatRatio(storageAvailability, 1)}</span>
                ) : null}
              </span>
            );
          },
        }),
      ] as ColumnDef<NeuronRow>[],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filter) => {
      const query = String(filter).trim().toLowerCase();
      if (!query) return true;
      const uid = String(row.original.uid);
      const hotkey = row.original.hotkey.toLowerCase();
      return uid.includes(query) || hotkey.includes(query);
    },
  });

  return (
    <section data-section="neurons" aria-label="Neurons">
      <SectionHead title="Neurons" />
      <div className="space-y-3 px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="neuron-search">
            Search neurons
          </label>
          <input
            id="neuron-search"
            type="search"
            placeholder="UID or hotkey"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="h-9 min-w-[12rem] flex-1 border border-line bg-recess px-2 text-[13px] text-ink placeholder:text-mute sm:max-w-xs"
          />
          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
            className="h-9 border border-line bg-recess px-2 text-[13px] text-ink"
          >
            <option value="all">All roles</option>
            <option value="validator">Validators</option>
            <option value="miner">Miners</option>
          </select>
          <select
            aria-label="Filter by serving status"
            value={servingFilter}
            onChange={(event) => setServingFilter(event.target.value as ServingFilter)}
            className="h-9 border border-line bg-recess px-2 text-[13px] text-ink"
          >
            <option value="all">All serving</option>
            <option value="serving">Serving</option>
            <option value="not-serving">Not serving</option>
            <option value="unreported">Unreported</option>
          </select>
          <div className="relative">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-1 border border-line bg-recess px-2 text-[13px] text-dim hover:text-ink"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Columns3 className="h-4 w-4" aria-hidden />
              Columns
            </button>
            {menuOpen ? (
              <div className="absolute right-0 z-20 mt-1 max-h-64 w-48 overflow-y-auto border border-line bg-surface p-2 shadow-none">
                {table
                  .getAllLeafColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <label
                      key={column.id}
                      className="flex cursor-pointer items-center gap-2 py-1 text-[12px] text-dim hover:text-ink"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="accent-phosphor"
                      />
                      {typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id}
                    </label>
                  ))}
              </div>
            ) : null}
          </div>
        </div>
        {!snapshot ? (
          <p className="text-[13px] text-mute">Loading neurons…</p>
        ) : (
          <DataTable
            table={table}
            empty="No neurons match the current filters."
            onRowClick={(row) => onSelect(row.uid)}
            rowId={(row) => String(row.uid)}
          />
        )}
      </div>
    </section>
  );
}
