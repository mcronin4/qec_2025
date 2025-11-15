import { Node, Edge } from './types';

// 3x3 grid graph (9 nodes, 12 edges)
// Layout:
// 0-1-2
// | | |
// 3-4-5
// | | |
// 6-7-8
export const initialNodes: Node[] = [
  { id: '0', x: 0.2, y: 0.2 },
  { id: '1', x: 0.5, y: 0.2 },
  { id: '2', x: 0.8, y: 0.2 },
  { id: '3', x: 0.2, y: 0.5 },
  { id: '4', x: 0.5, y: 0.5 },
  { id: '5', x: 0.8, y: 0.5 },
  { id: '6', x: 0.2, y: 0.8 },
  { id: '7', x: 0.5, y: 0.8 },
  { id: '8', x: 0.8, y: 0.8 },
];

export const initialEdges: Edge[] = [
  // Horizontal edges (top row)
  { id: '0-1', from: '0', to: '1', length: 1.0, snowDepth: 0 },
  { id: '1-2', from: '1', to: '2', length: 1.0, snowDepth: 0 },
  // Horizontal edges (middle row)
  { id: '3-4', from: '3', to: '4', length: 1.0, snowDepth: 0 },
  { id: '4-5', from: '4', to: '5', length: 1.0, snowDepth: 0 },
  // Horizontal edges (bottom row)
  { id: '6-7', from: '6', to: '7', length: 1.0, snowDepth: 0 },
  { id: '7-8', from: '7', to: '8', length: 1.0, snowDepth: 0 },
  // Vertical edges (left column)
  { id: '0-3', from: '0', to: '3', length: 1.0, snowDepth: 0 },
  { id: '3-6', from: '3', to: '6', length: 1.0, snowDepth: 0 },
  // Vertical edges (middle column)
  { id: '1-4', from: '1', to: '4', length: 1.0, snowDepth: 0 },
  { id: '4-7', from: '4', to: '7', length: 1.0, snowDepth: 0 },
  // Vertical edges (right column)
  { id: '2-5', from: '2', to: '5', length: 1.0, snowDepth: 0 },
  { id: '5-8', from: '5', to: '8', length: 1.0, snowDepth: 0 },
];

