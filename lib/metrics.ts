import type { Neuron, StorageNode } from "@/lib/types"

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[mid] ?? null
  const left = sorted[mid - 1]
  const right = sorted[mid]
  if (left == null || right == null) return null
  return (left + right) / 2
}

export function definedNumbers(values: Array<number | null | undefined>): number[] {
  const out: number[] = []
  for (const value of values) {
    if (value != null) out.push(value)
  }
  return out
}

export interface CapacitySummary {
  usedBytes: number
  totalBytes: number
  reported: number
  omitted: number
}

export function networkCapacity(nodes: StorageNode[]): CapacitySummary {
  let usedBytes = 0
  let totalBytes = 0
  let reported = 0
  let omitted = 0
  for (const node of nodes) {
    if (node.usedBytes == null || node.totalBytes == null) {
      omitted += 1
      continue
    }
    usedBytes += node.usedBytes
    totalBytes += node.totalBytes
    reported += 1
  }
  return { usedBytes, totalBytes, reported, omitted }
}

export interface MatchSummary {
  uids: number
  nodes: number
  matchedUids: number
  matchedNodes: number
  unmatchedNodes: number
  uidsWithoutStorage: number
}

export function matchStats(neurons: Neuron[], nodes: StorageNode[]): MatchSummary {
  const neuronHotkeys = new Set(neurons.map((neuron) => neuron.hotkey))
  const matchedNodes = nodes.filter(
    (node) => node.hotkey != null && neuronHotkeys.has(node.hotkey),
  )
  const matchedUids = new Set(
    matchedNodes
      .map((node) => node.uid)
      .filter((uid): uid is number => uid != null),
  )
  return {
    uids: neurons.length,
    nodes: nodes.length,
    matchedUids: matchedUids.size,
    matchedNodes: matchedNodes.length,
    unmatchedNodes: nodes.length - matchedNodes.length,
    uidsWithoutStorage: neurons.length - matchedUids.size,
  }
}

export interface KpiModel {
  registered: number
  subnetSize: number
  validators: number
  miners: number
  servingMiners: number
  servingUnreported: number
  stake: number | null
  stakeOmitted: number
  medianLatency: number | null
  latencySample: number
  availability: number | null
  availabilitySample: number
  capacity: CapacitySummary
}

export function kpiModel(
  neurons: Neuron[],
  nodes: StorageNode[],
  subnetSize: number,
): KpiModel {
  const miners = neurons.filter((neuron) => neuron.role === "miner")
  const stakes = definedNumbers(neurons.map((neuron) => neuron.stake))
  const latencies = definedNumbers(nodes.map((node) => node.latencyMs))
  const availabilities = definedNumbers(nodes.map((node) => node.availability))
  return {
    registered: neurons.length,
    subnetSize,
    validators: neurons.filter((neuron) => neuron.role === "validator").length,
    miners: miners.length,
    servingMiners: miners.filter((neuron) => neuron.serving === true).length,
    servingUnreported: miners.filter((neuron) => neuron.serving == null).length,
    stake: stakes.length > 0 ? stakes.reduce((sum, value) => sum + value, 0) : null,
    stakeOmitted: neurons.length - stakes.length,
    medianLatency: median(latencies),
    latencySample: latencies.length,
    availability:
      availabilities.length > 0
        ? availabilities.reduce((sum, value) => sum + value, 0) / availabilities.length
        : null,
    availabilitySample: availabilities.length,
    capacity: networkCapacity(nodes),
  }
}
