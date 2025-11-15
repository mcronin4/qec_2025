import { Node, Edge, SnowplowState } from './types';

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
  { id: '0-1', from_node: '0', to_node: '1', length: 1.0, snowDepth: 0, streetName: 'North Ave' },
  { id: '1-2', from_node: '1', to_node: '2', length: 1.0, snowDepth: 0, streetName: 'North Ave' },
  // Horizontal edges (middle row)
  { id: '3-4', from_node: '3', to_node: '4', length: 1.0, snowDepth: 0, streetName: 'Central St' },
  { id: '4-5', from_node: '4', to_node: '5', length: 1.0, snowDepth: 0, streetName: 'Central St' },
  // Horizontal edges (bottom row)
  { id: '6-7', from_node: '6', to_node: '7', length: 1.0, snowDepth: 0, streetName: 'South Blvd' },
  { id: '7-8', from_node: '7', to_node: '8', length: 1.0, snowDepth: 0, streetName: 'South Blvd' },
  // Vertical edges (left column)
  { id: '0-3', from_node: '0', to_node: '3', length: 1.0, snowDepth: 0, streetName: 'West St' },
  { id: '3-6', from_node: '3', to_node: '6', length: 1.0, snowDepth: 0, streetName: 'West St' },
  // Vertical edges (middle column)
  { id: '1-4', from_node: '1', to_node: '4', length: 1.0, snowDepth: 0, streetName: 'Main St' },
  { id: '4-7', from_node: '4', to_node: '7', length: 1.0, snowDepth: 0, streetName: 'Main St' },
  // Vertical edges (right column)
  { id: '2-5', from_node: '2', to_node: '5', length: 1.0, snowDepth: 0, streetName: 'East Ave' },
  { id: '5-8', from_node: '5', to_node: '8', length: 1.0, snowDepth: 0, streetName: 'East Ave' },
];

export const initialPlow: SnowplowState = {
  currentNodeId: '0',
};

