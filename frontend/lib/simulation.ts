import { Node, Edge, SnowplowState, StormState, NodeId } from './types';

const PLOW_SPEED = 0.15; // fraction of edge per tick

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
    const from = nodes.find(n => n.id === edge.from)!;
    const to = nodes.find(n => n.id === edge.to)!;

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
    const maxSnowRate = 0.2; // maximum snow per tick at center
    const extraSnow = intensity * intensity * maxSnowRate;
    
    return {
      ...edge,
      snowDepth: Math.min(edge.snowDepth + extraSnow, 5), // clamp
    };
  });
}

export function movePlow(
  plow: SnowplowState,
  edges: Edge[]
): SnowplowState {
  if (!plow.currentEdgeId) return plow;

  const edge = edges.find(e => e.id === plow.currentEdgeId);
  if (!edge) return plow;

  let position = plow.position + PLOW_SPEED;

  if (position >= 1) {
    position = 1;
  }

  return { ...plow, position };
}

export function plowReachedNode(plow: SnowplowState): boolean {
  return plow.position >= 1;
}

export function clearSnowOnEdge(edges: Edge[], edgeId: string): Edge[] {
  return edges.map(e =>
    e.id === edgeId ? { ...e, snowDepth: Math.max(e.snowDepth - 0.5, 0) } : e
  );
}

export function getCurrentNodeId(
  plow: SnowplowState,
  edges: Edge[]
): NodeId | null {
  if (!plow.currentEdgeId) return null;
  const edge = edges.find(e => e.id === plow.currentEdgeId);
  if (!edge) return null;
  return plow.direction === 'forward' ? edge.to : edge.from;
}

