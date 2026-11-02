import { kpiModel, matchStats, networkCapacity } from "../lib/metrics"
import {
  BLOCK_MS,
  buildSnapshot,
  chainHead,
  DEMO,
  MATCHED_NODE_COUNT,
  NODE_COUNT,
  STATUS_COUNTS,
  SUBNET_SIZE,
  TEMPO_BLOCKS,
  TEMPO_MS,
  VALIDATOR_COUNT,
} from "../lib/snapshot"
import { headerSync, sourceSync } from "../lib/sync"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function alignInsideTempo(now: number): number {
  const head = chainHead(now)
  const start = Math.floor(head / TEMPO_BLOCKS) * TEMPO_BLOCKS
  const into = head - start
  if (into > 20 && into < TEMPO_BLOCKS - 20) return now
  const target = start + TEMPO_BLOCKS + 30
  return now + (target - head) * BLOCK_MS
}

const now = alignInsideTempo(Date.UTC(2026, 5, 15, 12, 0, 0))
const first = buildSnapshot(now)
const nextBlock = buildSnapshot(now + BLOCK_MS)
const nextTempo = buildSnapshot(now + TEMPO_MS)
const drifted = buildSnapshot(now + 17 * BLOCK_MS)

assert(first.demo === DEMO, "demo flag")
assert(first.neurons.length === SUBNET_SIZE, "uid count")
assert(first.neurons.filter((neuron) => neuron.role === "validator").length === VALIDATOR_COUNT, "validators")
assert(first.nodes.length === NODE_COUNT, "node count")
assert(new Set(first.neurons.map((neuron) => neuron.uid)).size === SUBNET_SIZE, "unique uids")
assert(new Set(first.neurons.map((neuron) => neuron.hotkey)).size === SUBNET_SIZE, "unique hotkeys")
assert(new Set(first.nodes.map((node) => node.id)).size === NODE_COUNT, "unique node ids")

const stats = matchStats(first.neurons, first.nodes)
assert(stats.matchedNodes === MATCHED_NODE_COUNT, `matched nodes ${stats.matchedNodes}`)
assert(stats.matchedUids === MATCHED_NODE_COUNT, `matched uids ${stats.matchedUids}`)
assert(stats.unmatchedNodes === NODE_COUNT - MATCHED_NODE_COUNT, "unmatched nodes")
assert(first.nodes.some((node) => node.uid == null && node.hotkey != null), "orphan hotkey")
assert(first.nodes.some((node) => node.hotkey == null), "node hotkey not reported")

for (const [status, count] of Object.entries(STATUS_COUNTS)) {
  const actual = first.nodes.filter((node) => node.status === status).length
  assert(actual === count, `${status} count ${actual}`)
}

assert(first.neurons.some((neuron) => neuron.stake == null), "missing stake")
assert(first.neurons.some((neuron) => neuron.trust == null), "missing trust")
assert(first.neurons.some((neuron) => neuron.consensus == null), "missing consensus")
assert(first.neurons.some((neuron) => neuron.incentive == null), "missing incentive")
assert(first.neurons.some((neuron) => neuron.emission == null), "missing emission")
assert(first.neurons.some((neuron) => neuron.dividends == null), "missing dividends")
assert(first.neurons.some((neuron) => neuron.lastUpdate == null), "missing last update")
assert(first.neurons.some((neuron) => neuron.serving == null), "missing serving")
assert(
  first.neurons.some((neuron) => neuron.role === "miner" && neuron.dividends === 0),
  "miners report dividend zero",
)
assert(first.nodes.some((node) => node.latencyMs == null), "missing latency")
assert(first.nodes.some((node) => node.usedBytes == null), "missing used bytes")
assert(first.nodes.some((node) => node.availability == null), "missing availability")
assert(first.nodes.some((node) => node.region == null), "missing region")
assert(first.nodes.some((node) => node.bandwidthMbps == null), "missing bandwidth")
assert(first.nodes.some((node) => node.proofTimeMs == null), "missing proof time")

const capacity = networkCapacity(first.nodes)
let pairUsed = 0
let pairs = 0
for (const node of first.nodes) {
  if (node.usedBytes == null || node.totalBytes == null) continue
  pairUsed += node.usedBytes
  pairs += 1
}
assert(capacity.usedBytes === pairUsed, "capacity ignores missing used bytes")
assert(capacity.reported === pairs, "capacity pair count")
assert(capacity.omitted > 0, "some nodes omitted from capacity")

const model = kpiModel(first.neurons, first.nodes, first.subnetSize)
const latencyValues = first.nodes
  .map((node) => node.latencyMs)
  .filter((value): value is number => value != null)
assert(model.latencySample === latencyValues.length, "latency sample skips null")
const availabilityValues = first.nodes
  .map((node) => node.availability)
  .filter((value): value is number => value != null)
assert(model.availabilitySample === availabilityValues.length, "availability sample skips null")
assert(model.availabilitySample < first.nodes.length, "availability excludes missing")
if (model.availability != null) {
  const mean =
    availabilityValues.reduce((sum, value) => sum + value, 0) / availabilityValues.length
  assert(Math.abs(model.availability - mean) < 1e-12, "availability mean")
}

assert(nextBlock.chain.headBlock === first.chain.headBlock + 1, "head advances one block")
assert(nextBlock.metagraph.block === first.metagraph.block, "metagraph holds across a block")
assert(first.chain.headBlock !== first.metagraph.block, "head and metagraph differ")
assert(
  JSON.stringify(first.neurons.map((neuron) => neuron.incentive)) ===
    JSON.stringify(nextBlock.neurons.map((neuron) => neuron.incentive)),
  "incentive is stable inside a tempo",
)
assert(
  JSON.stringify(first.neurons.map((neuron) => neuron.emission)) ===
    JSON.stringify(nextBlock.neurons.map((neuron) => neuron.emission)),
  "emission is stable inside a tempo",
)
assert(
  JSON.stringify(first.neurons.map((neuron) => neuron.dividends)) ===
    JSON.stringify(nextBlock.neurons.map((neuron) => neuron.dividends)),
  "dividends are stable inside a tempo",
)
assert(nextTempo.metagraph.block === first.metagraph.block + TEMPO_BLOCKS, "metagraph advances on tempo")
assert(
  JSON.stringify(first.neurons.map((neuron) => neuron.incentive)) !==
    JSON.stringify(nextTempo.neurons.map((neuron) => neuron.incentive)),
  "incentive changes on tempo",
)
assert(
  drifted.nodes.some(
    (node, index) =>
      node.usedBytes !== first.nodes[index]?.usedBytes ||
      node.latencyMs !== first.nodes[index]?.latencyMs,
  ),
  "storage drifts across blocks",
)
assert(
  drifted.nodes.every((node, index) => node.status === first.nodes[index]?.status),
  "status stays put while telemetry drifts",
)

const encoded = JSON.stringify(first)
assert(!/"ip"\s*:/.test(encoded), "no ip field")
assert(!/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(encoded), "no ipv4 address")

assert(headerSync({ data: undefined, isPending: true, isRefetching: false, isError: false }) === "syncing", "pending syncs")
assert(headerSync({ data: first, isPending: false, isRefetching: true, isError: false }) === "syncing", "refetch syncs")
assert(headerSync({ data: first, isPending: false, isRefetching: false, isError: true }) === "stale", "error is stale")
assert(headerSync({ data: first, isPending: false, isRefetching: false, isError: false }) === "live", "success is live")
assert(
  sourceSync({ data: first, isPending: false, isRefetching: true, isError: false }, true) === "live",
  "sources stay live while the header syncs",
)
assert(
  sourceSync({ data: first, isPending: false, isRefetching: false, isError: true }, true) === "stale",
  "failed refresh marks the source stale",
)

const top = [...first.neurons].sort((a, b) => (b.incentive ?? -1) - (a.incentive ?? -1))[0]
console.log(
  JSON.stringify(
    {
      head: first.chain.headBlock,
      metagraph: first.metagraph.block,
      validators: model.validators,
      servingMiners: model.servingMiners,
      matchedUids: stats.matchedUids,
      unmatchedNodes: stats.unmatchedNodes,
      usedTb: capacity.usedBytes / 1e12,
      totalTb: capacity.totalBytes / 1e12,
      omitted: capacity.omitted,
      medianLatency: model.medianLatency,
      availability: model.availability,
      topIncentive: top?.incentive,
      stake: model.stake,
    },
    null,
    2,
  ),
)
console.log("snapshot checks passed")
