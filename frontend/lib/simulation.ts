import { Node, Edge, SnowplowState, StormState, NodeId } from './types';

export function updateStorm(storm: StormState): StormState {
  let { centerX, centerY, vx, vy, radius } = storm;

  centerX += vx;
  centerY += vy;

  // bounce off the boundaries (0..1 coordinate system)
  if (centerX < 0 || centerX > 1) vx *= -1;
  if (centerY < 0 || centerY > 1) vy *= -1;

  return { centerX, centerY, vx, vy, radius };
}

export function addSnowFromStorm(
  edges: Edge[],
  storm: StormState,
  nodes: Node[]
): Edge[] {
  return edges.map(edge => {
    const from = nodes.find(n => n.id === edge.from_node)!;
    const to = nodes.find(n => n.id === edge.to_node)!;

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    const dx = midX - storm.centerX;
    const dy = midY - storm.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Calculate intensity based on distance from storm center
    // Intensity is 1.0 at center, 0.0 at edge
    // Use <= to include edges exactly at the boundary
    let intensity = 0;
    if (dist <= storm.radius) {
      intensity = 1 - (dist / storm.radius);
      // Ensure minimum intensity at edge to avoid zero snow
      intensity = Math.max(intensity, 0.1);
    }

    // Max snow rate at center, decreasing to 0 at edge
    // Using intensity^2 for smoother falloff
    const maxSnowRate = 0.1; // maximum snow per tick at center
    const extraSnow = intensity * intensity * maxSnowRate;
    
    return {
      ...edge,
      snowDepth: Math.min(edge.snowDepth + extraSnow, 10), // clamp
    };
  });
}

export function moveToNode(
  plow: SnowplowState,
  targetNodeId: NodeId
): SnowplowState {
  return { currentNodeId: targetNodeId };
}

export function clearSnowOnEdge(
  edges: Edge[],
  fromNodeId: NodeId,
  toNodeId: NodeId
): Edge[] {
  return edges.map(edge => {
    // Check if this edge connects the two nodes (undirected)
    const isConnectingEdge = 
      (edge.from_node === fromNodeId && edge.to_node === toNodeId) ||
      (edge.from_node === toNodeId && edge.to_node === fromNodeId);
    
    if (isConnectingEdge) {
      return { 
        ...edge, 
        snowDepth: 0,
      };
    }
    return edge;
  });
}

