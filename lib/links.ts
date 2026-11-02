import type { Neuron, StorageNode } from "@/lib/types";
import { definedNumbers, median } from "@/lib/metrics";

export interface NeuronStorageLink {
  nodeCount: number;
  usedBytes: number | null;
  totalBytes: number | null;
  availability: number | null;
  latencyMs: number | null;
}

export function nodesForNeuron(neuron: Neuron, nodes: StorageNode[]): StorageNode[] {
  return nodes.filter(
    (node) =>
      node.uid === neuron.uid || (node.hotkey != null && node.hotkey === neuron.hotkey),
  );
}

export function storageForNeuron(neuron: Neuron, nodes: StorageNode[]): NeuronStorageLink | null {
  const linked = nodesForNeuron(neuron, nodes);
  if (linked.length === 0) return null;

  let usedBytes = 0;
  let totalBytes = 0;
  let usedReported = 0;
  let totalReported = 0;

  for (const node of linked) {
    if (node.usedBytes != null) {
      usedBytes += node.usedBytes;
      usedReported += 1;
    }
    if (node.totalBytes != null) {
      totalBytes += node.totalBytes;
      totalReported += 1;
    }
  }

  const availabilities = definedNumbers(linked.map((node) => node.availability));
  const latencies = definedNumbers(linked.map((node) => node.latencyMs));

  return {
    nodeCount: linked.length,
    usedBytes: usedReported > 0 ? usedBytes : null,
    totalBytes: totalReported > 0 ? totalBytes : null,
    availability:
      availabilities.length > 0
        ? availabilities.reduce((sum, value) => sum + value, 0) / availabilities.length
        : null,
    latencyMs: median(latencies),
  };
}

export function neuronForNode(
  node: StorageNode,
  neurons: Neuron[],
): Neuron | undefined {
  if (node.uid != null) {
    const byUid = neurons.find((neuron) => neuron.uid === node.uid);
    if (byUid) return byUid;
  }
  if (node.hotkey) {
    return neurons.find((neuron) => neuron.hotkey === node.hotkey);
  }
  return undefined;
}
