export type NodeId = string;
export type EdgeId = string;

export interface Node {
  id: NodeId;
  x: number; // for drawing (0-1 coordinate system)
  y: number;
}

export interface Edge {
  id: EdgeId;
  from_node: NodeId;
  to_node: NodeId;
  length: number; // road length (used as travel time / weight for backend)
  snowDepth: number; // current snow amount on this edge (for visualization)
  streetName: string;
}

export interface SnowplowState {
  currentNodeId: NodeId;
}

export interface StormState {
  centerX: number;
  centerY: number;
  radius: number;
  vx: number; // velocity x
  vy: number; // velocity y
}

