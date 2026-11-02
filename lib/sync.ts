import type { Snapshot, SyncState } from "@/lib/types"

export interface QueryFlags {
  data: Snapshot | undefined
  isPending: boolean
  isRefetching: boolean
  isError: boolean
}

export function headerSync(query: QueryFlags): SyncState {
  if (query.isPending) return "syncing"
  if (query.isRefetching) return "syncing"
  if (query.isError && !query.data) return "stale"
  if (query.isError) return "stale"
  return "live"
}

export function sourceSync(query: QueryFlags, ok: boolean | undefined): SyncState {
  if (!query.data) return query.isError ? "stale" : "syncing"
  if (query.isError && !query.isRefetching) return "stale"
  if (ok === false) return "stale"
  return "live"
}
