export type NodeId = string;
export type EdgeId = string;

export interface Node {
  id: NodeId;
  x: number; // for drawing (0-1 coordinate system)
  y: number;
}

export interface Edge {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
  length: number; // for movement
  snowDepth: number; // current snow amount on this edge
}

export interface SnowplowState {
  currentEdgeId: EdgeId | null;
  position: number; // 0..1 along the edge
  direction: "forward" | "backward";
}

export interface StormState {
  centerX: number;
  centerY: number;
  radius: number;
  vx: number; // velocity x
  vy: number; // velocity y
}

