import { hashString, mulberry32, shuffle } from "@/lib/prng"
import type { Neuron, NeuronRole, NodeStatus, Snapshot, StorageNode } from "@/lib/types"

export const BLOCK_MS = 12_000
export const TEMPO_BLOCKS = 360
export const TEMPO_MS = BLOCK_MS * TEMPO_BLOCKS
export const ORIGIN_MS = Date.UTC(2024, 0, 1)
export const BASE_BLOCK = 4_820_000
export const SUBNET_SIZE = 256
export const VALIDATOR_COUNT = 64
export const NODE_COUNT = 150
export const MATCHED_NODE_COUNT = 105
export const STATUS_COUNTS = {
  healthy: 108,
  degraded: 22,
  offline: 14,
  unknown: 6,
} as const
export const DEMO = true

const TOTAL_EMISSION = 151.2
const REGIONS = [
  "Frankfurt",
  "Amsterdam",
  "Ashburn",
  "San Jose",
  "Singapore",
  "London",
  "Tokyo",
  "Sydney",
] as const
const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

export function chainHead(now: number): number {
  return BASE_BLOCK + Math.floor((now - ORIGIN_MS) / BLOCK_MS)
}

export function tempoIndex(now: number): number {
  return Math.floor((now - ORIGIN_MS) / TEMPO_MS)
}

export function metagraphBlockFor(now: number): number {
  return Math.floor(chainHead(now) / TEMPO_BLOCKS) * TEMPO_BLOCKS
}

interface NeuronBase {
  uid: number
  hotkey: string
  role: NeuronRole
  serving: boolean | null
  stake: number | null
  trustMissing: boolean
  consensusMissing: boolean
  dividendMissing: boolean
  lastUpdateMissing: boolean
  incentiveMissing: boolean
}

interface NodeBase {
  id: string
  hotkey: string | null
  uid: number | null
  status: NodeStatus
  region: string | null
  totalBytes: number | null
  usedBytes: number | null
  latencyMs: number | null
  proofTimeMs: number | null
  availability: number | null
  bandwidthMbps: number | null
}

interface Reward {
  incentive: number | null
  emission: number | null
  dividends: number | null
  trust: number | null
  consensus: number | null
  lastUpdateOffset: number | null
}

function hotkey(rand: () => number): string {
  let value = "5"
  for (let index = 0; index < 47; index += 1) {
    value += BASE58[Math.floor(rand() * BASE58.length)] ?? "1"
  }
  return value
}

function logUniform(rand: () => number, min: number, max: number): number {
  const low = Math.log(min)
  const high = Math.log(max)
  return Math.exp(low + rand() * (high - low))
}

function weighted(rand: () => number): number {
  const unit = Math.max(0.015, rand())
  return Math.pow(unit, -1.05)
}

function buildNeurons(rand: () => number): NeuronBase[] {
  const validatorUids = new Set(
    shuffle(
      Array.from({ length: SUBNET_SIZE }, (_, index) => index),
      rand,
    ).slice(0, VALIDATOR_COUNT),
  )
  const neurons: NeuronBase[] = []
  for (let uid = 0; uid < SUBNET_SIZE; uid += 1) {
    const role: NeuronRole = validatorUids.has(uid) ? "validator" : "miner"
    const serveRoll = rand()
    const serving =
      role === "validator"
        ? serveRoll < 0.9
          ? true
          : serveRoll < 0.96
            ? false
            : null
        : serveRoll < 0.74
          ? true
          : serveRoll < 0.92
            ? false
            : null
    const stakeMissing = rand() < 0.04
    const stake = stakeMissing
      ? null
      : Math.round(
          logUniform(rand, role === "validator" ? 800 : 8, role === "validator" ? 420_000 : 18_000) *
            100,
        ) / 100
    neurons.push({
      uid,
      hotkey: hotkey(rand),
      role,
      serving,
      stake,
      trustMissing: rand() < 0.07,
      consensusMissing: rand() < 0.05,
      dividendMissing: role === "validator" ? rand() < 0.08 : false,
      lastUpdateMissing: rand() < 0.04,
      incentiveMissing: rand() < 0.02,
    })
  }
  return neurons
}

function buildNodes(rand: () => number, neurons: NeuronBase[]): NodeBase[] {
  const statuses: NodeStatus[] = [
    ...Array.from({ length: STATUS_COUNTS.healthy }, () => "healthy" as const),
    ...Array.from({ length: STATUS_COUNTS.degraded }, () => "degraded" as const),
    ...Array.from({ length: STATUS_COUNTS.offline }, () => "offline" as const),
    ...Array.from({ length: STATUS_COUNTS.unknown }, () => "unknown" as const),
  ]
  const shuffledStatus = shuffle(statuses, rand)
  const miners = shuffle(
    neurons.filter((neuron) => neuron.role === "miner"),
    rand,
  )
  const validators = shuffle(
    neurons.filter((neuron) => neuron.role === "validator"),
    rand,
  )
  const matched = [...miners, ...validators].slice(0, MATCHED_NODE_COUNT)
  const linked = new Set(
    shuffle(
      Array.from({ length: NODE_COUNT }, (_, index) => index),
      rand,
    ).slice(0, MATCHED_NODE_COUNT),
  )
  const usedHotkeys = new Set(neurons.map((neuron) => neuron.hotkey))
  const freshHotkey = (): string => {
    let key = hotkey(rand)
    while (usedHotkeys.has(key)) key = hotkey(rand)
    usedHotkeys.add(key)
    return key
  }

  let cursor = 0
  const nodes: NodeBase[] = []
  for (let index = 0; index < NODE_COUNT; index += 1) {
    const status = shuffledStatus[index] ?? "unknown"
    const link = linked.has(index) ? matched[cursor++] : undefined
    const regionMissing = status === "unknown" ? rand() < 0.7 : rand() < 0.08
    const region = regionMissing ? null : (REGIONS[Math.floor(rand() * REGIONS.length)] ?? null)
    const measured = measureNode(rand, status)
    nodes.push({
      id: `hp-${String(1000 + index).padStart(4, "0")}`,
      hotkey: link ? link.hotkey : rand() < 0.72 ? freshHotkey() : null,
      uid: link ? link.uid : null,
      status,
      region,
      ...measured,
    })
  }
  return nodes
}

function measureNode(rand: () => number, status: NodeStatus): Omit<
  NodeBase,
  "id" | "hotkey" | "uid" | "status" | "region"
> {
  if (status === "unknown") {
    const totalBytes = rand() < 0.65 ? null : Math.round(logUniform(rand, 4, 40) * 1e12)
    const usedBytes =
      totalBytes == null || rand() < 0.5 ? null : Math.round(totalBytes * (0.2 + rand() * 0.5))
    return {
      totalBytes,
      usedBytes,
      latencyMs: null,
      proofTimeMs: null,
      availability: null,
      bandwidthMbps: null,
    }
  }

  if (status === "offline") {
    const totalBytes = Math.round(logUniform(rand, 6, 80) * 1e12)
    const usedBytes = rand() < 0.15 ? null : Math.round(totalBytes * (0.15 + rand() * 0.7))
    return {
      totalBytes,
      usedBytes,
      latencyMs: rand() < 0.55 ? null : Math.round(400 + rand() * 2200),
      proofTimeMs: null,
      availability: rand() < 0.2 ? null : 0,
      bandwidthMbps: null,
    }
  }

  if (status === "degraded") {
    const totalBytes = Math.round(logUniform(rand, 6, 90) * 1e12)
    const usedBytes = rand() < 0.05 ? null : Math.round(totalBytes * (0.35 + rand() * 0.55))
    return {
      totalBytes,
      usedBytes: capUsed(usedBytes, totalBytes),
      latencyMs: rand() < 0.06 ? null : Math.round(160 + rand() * 780),
      proofTimeMs: rand() < 0.1 ? null : Math.round(1800 + rand() * 9000),
      availability: rand() < 0.05 ? null : Math.min(0.975, 0.9 + rand() * 0.075),
      bandwidthMbps: rand() < 0.12 ? null : Math.round(40 + rand() * 800),
    }
  }

  const totalBytes = Math.round(logUniform(rand, 8, 96) * 1e12)
  const usedBytes = rand() < 0.03 ? null : Math.round(totalBytes * (0.5 + rand() * 0.45))
  return {
    totalBytes,
    usedBytes: capUsed(usedBytes, totalBytes),
    latencyMs: rand() < 0.04 ? null : Math.round(8 + rand() * 64),
    proofTimeMs: rand() < 0.05 ? null : Math.round(180 + rand() * 2200),
    availability: rand() < 0.03 ? null : Math.min(1, 0.985 + rand() * 0.014),
    bandwidthMbps: rand() < 0.08 ? null : Math.round(200 + rand() * 7800),
  }
}

function capUsed(used: number | null, total: number | null): number | null {
  if (used == null || total == null) return used
  return Math.min(used, total)
}

function buildRewards(neurons: NeuronBase[], tempo: number): Reward[] {
  const rand = mulberry32((0x75a70 ^ Math.imul(tempo + 1, 0x9e3779b1)) >>> 0)
  const weights = neurons.map((neuron) => {
    if (neuron.incentiveMissing) return 0
    const roleBoost = neuron.role === "validator" ? 0.45 : 1
    const serveBoost = neuron.serving === false ? 0.1 : neuron.serving == null ? 0.35 : 1
    return weighted(rand) * roleBoost * serveBoost
  })
  const weightSum = weights.reduce((sum, value) => sum + value, 0) || 1
  const dividendWeights = neurons.map((neuron) => {
    if (neuron.role !== "validator" || neuron.dividendMissing) return 0
    return weighted(rand)
  })
  const dividendSum = dividendWeights.reduce((sum, value) => sum + value, 0) || 1

  return neurons.map((neuron, index) => {
    const incentive = neuron.incentiveMissing ? null : (weights[index] ?? 0) / weightSum
    const trust = neuron.trustMissing
      ? null
      : Math.min(1, (neuron.role === "validator" ? 0.7 : 0.28) + rand() * 0.3)
    const consensus = neuron.consensusMissing
      ? null
      : Math.min(1, (neuron.role === "validator" ? 0.66 : 0.32) + rand() * 0.34)
    const lastUpdateOffset = neuron.lastUpdateMissing ? null : Math.floor(rand() * 140)
    return {
      incentive,
      emission: incentive == null ? null : incentive * TOTAL_EMISSION,
      dividends:
        neuron.role === "miner"
          ? 0
          : neuron.dividendMissing
            ? null
            : (dividendWeights[index] ?? 0) / dividendSum,
      trust,
      consensus,
      lastUpdateOffset,
    }
  })
}

function driftNode(node: NodeBase, block: number): StorageNode {
  let usedBytes = node.usedBytes
  let latencyMs = node.latencyMs
  if ((hashString(node.id) + block) % 17 === 0) {
    const rand = mulberry32((hashString(node.id) ^ Math.imul(block, 0x45d9f3b)) >>> 0)
    if (usedBytes != null && node.totalBytes != null) {
      const wobble = (rand() - 0.35) * 8e10
      const next = usedBytes + wobble
      usedBytes = Math.round(
        Math.min(node.totalBytes * 0.985, Math.max(node.totalBytes * 0.04, next)),
      )
    }
    if (latencyMs != null) {
      latencyMs = Math.max(1, Math.round(latencyMs + (rand() - 0.5) * 18))
    }
  }
  return {
    id: node.id,
    hotkey: node.hotkey,
    uid: node.uid,
    status: node.status,
    region: node.region,
    totalBytes: node.totalBytes,
    usedBytes,
    latencyMs,
    proofTimeMs: node.proofTimeMs,
    availability: node.availability,
    bandwidthMbps: node.bandwidthMbps,
  }
}

const identityRand = mulberry32(0x755101)
const neuronBases = buildNeurons(identityRand)
const nodeBases = buildNodes(identityRand, neuronBases)
const rewardCache = new Map<number, Reward[]>()

export function buildSnapshot(now: number): Snapshot {
  const head = chainHead(now)
  const tempo = tempoIndex(now)
  const metaBlock = Math.floor(head / TEMPO_BLOCKS) * TEMPO_BLOCKS
  const blockStartedAt = ORIGIN_MS + (head - BASE_BLOCK) * BLOCK_MS
  const tempoStartedAt = ORIGIN_MS + tempo * TEMPO_MS
  let rewards = rewardCache.get(tempo)
  if (!rewards) {
    rewards = buildRewards(neuronBases, tempo)
    rewardCache.set(tempo, rewards)
  }
  const rewardRows = rewards

  return {
    demo: DEMO,
    generatedAt: now,
    network: "finney",
    subnetId: 75,
    subnetName: "Hippius",
    subnetSize: SUBNET_SIZE,
    chain: {
      headBlock: head,
      blockTimeMs: BLOCK_MS,
      observedAt: blockStartedAt,
    },
    metagraph: {
      block: metaBlock,
      syncedAt: tempoStartedAt,
      tempoBlocks: TEMPO_BLOCKS,
      tempoMs: TEMPO_MS,
    },
    sources: {
      metagraph: { ok: true, syncedAt: tempoStartedAt },
      hippius: { ok: true, syncedAt: blockStartedAt },
    },
    neurons: neuronBases.map((base, index) => {
      const reward = rewardRows[index]
      return {
        uid: base.uid,
        hotkey: base.hotkey,
        role: base.role,
        serving: base.serving,
        stake: base.stake,
        incentive: reward?.incentive ?? null,
        emission: reward?.emission ?? null,
        dividends: reward?.dividends ?? null,
        trust: reward?.trust ?? null,
        consensus: reward?.consensus ?? null,
        lastUpdate:
          reward?.lastUpdateOffset == null
            ? null
            : Math.max(0, metaBlock - reward.lastUpdateOffset),
      }
    }),
    nodes: nodeBases.map((node) => driftNode(node, head)),
  }
}
