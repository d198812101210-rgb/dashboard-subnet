export type SyncState = "live" | "syncing" | "stale"

export type NeuronRole = "validator" | "miner"

export type NodeStatus = "healthy" | "degraded" | "offline" | "unknown"

export interface Neuron {
  uid: number
  hotkey: string
  role: NeuronRole
  serving: boolean | null
  stake: number | null
  incentive: number | null
  emission: number | null
  dividends: number | null
  trust: number | null
  consensus: number | null
  lastUpdate: number | null
}

export interface StorageNode {
  id: string
  hotkey: string | null
  uid: number | null
  usedBytes: number | null
  totalBytes: number | null
  latencyMs: number | null
  proofTimeMs: number | null
  availability: number | null
  bandwidthMbps: number | null
  region: string | null
  status: NodeStatus
}

export interface SourceHealth {
  ok: boolean
  syncedAt: number
}

export interface Snapshot {
  demo: boolean
  generatedAt: number
  network: string
  subnetId: number
  subnetName: string
  subnetSize: number
  chain: {
    headBlock: number
    blockTimeMs: number
    observedAt: number
  }
  metagraph: {
    block: number
    syncedAt: number
    tempoBlocks: number
    tempoMs: number
  }
  sources: {
    metagraph: SourceHealth
    hippius: SourceHealth
  }
  neurons: Neuron[]
  nodes: StorageNode[]
}
