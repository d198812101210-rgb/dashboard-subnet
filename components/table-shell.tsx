"use client";

import { flexRender, type Table as TableType } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import "@/components/table-meta";

export function SortGlyph({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="h-3 w-3" aria-hidden />;
  if (sorted === "desc") return <ArrowDown className="h-3 w-3" aria-hidden />;
  return <ArrowUpDown className="h-3 w-3 opacity-40" aria-hidden />;
}

export function DataTable<T>({
  table,
  empty,
  onRowClick,
  rowId,
}: {
  table: TableType<T>;
  empty: string;
  onRowClick?: (row: T) => void;
  rowId: (row: T) => string;
}) {
  const rows = table.getRowModel().rows;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-[13px]">
        <thead className="bg-recess">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="border-b border-line">
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const numeric = header.column.columnDef.meta?.numeric;
                return (
                  <th
                    key={header.id}
                    scope="col"
                    className={cn(
                      "whitespace-nowrap px-3 py-2 text-left font-medium",
                      numeric && "text-right",
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-1 text-mute hover:text-ink",
                          numeric && "ml-auto",
                          sorted && "text-ink",
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() ? (
                          <SortGlyph sorted={sorted === "asc" || sorted === "desc" ? sorted : false} />
                        ) : null}
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={table.getAllColumns().length} className="px-3 py-8 text-center text-mute">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-line",
                  onRowClick && "cursor-pointer hover:bg-surface",
                )}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                data-row-id={rowId(row.original)}
              >
                {row.getVisibleCells().map((cell) => {
                  const numeric = cell.column.columnDef.meta?.numeric;
                  return (
                    <td
                      key={cell.id}
                      className={cn("whitespace-nowrap px-3 py-2", numeric && "text-right")}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
