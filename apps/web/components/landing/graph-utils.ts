/** Shared graph primitives for the landing page (no dependencies). */

export type GraphNode = {
  id: string;
  label: string;
  /** viewBox coordinates */
  x: number;
  y: number;
  radius?: number;
  accent?: string;
  kind?: string;
};

export type GraphEdge = {
  from: string;
  to: string;
};

export function nodeById(nodes: GraphNode[], id: string): GraphNode {
  const node = nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Unknown graph node: ${id}`);
  return node;
}

/** Ids of nodes directly connected to `id` (including itself). */
export function neighborhood(edges: GraphEdge[], id: string): Set<string> {
  const set = new Set<string>([id]);
  for (const e of edges) {
    if (e.from === id) set.add(e.to);
    if (e.to === id) set.add(e.from);
  }
  return set;
}

/** Deterministic pseudo-random generator (stable across SSR/CSR). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const INK = "#0b0b10";
export const MUTED = "#8a8a94";
export const ACCENT = "#4f46e5";
