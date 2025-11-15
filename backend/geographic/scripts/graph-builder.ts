import { RoadSegment, GraphData, GraphNode, GraphEdge } from "./types";
import { haversineDistance, coordKey } from "./utils";

/**
 * Build graph from road segments
 * Nodes are created at intersection points
 */
export function buildGraph(roadSegments: RoadSegment[]): GraphData {
  // Track coordinate usage across all segments
  const coordUsage = new Map<string, number>();
  
  // Build usage map
  for (const segment of roadSegments) {
    for (const [lon, lat] of segment.coordinates) {
      const key = coordKey(lon, lat);
      coordUsage.set(key, (coordUsage.get(key) || 0) + 1);
    }
  }

  // Identify intersection points (used more than once)
  const intersections = new Set<string>();
  for (const [key, count] of coordUsage.entries()) {
    if (count > 1) {
      intersections.add(key);
    }
  }

  // Create nodes at intersections and endpoints
  const nodeMap = new Map<string, GraphNode>();
  const nodeStreets = new Map<string, Set<string>>();
  let nodeCounter = 0;

  const getOrCreateNode = (lon: number, lat: number, streetName: string | null): string => {
    const key = coordKey(lon, lat);
    
    if (!nodeMap.has(key)) {
      const nodeId = `node_${nodeCounter++}`;
      nodeMap.set(key, {
        id: nodeId,
        lat,
        lon,
        streetNames: [],
      });
      nodeStreets.set(key, new Set());
    }

    // Add street name to this node
    if (streetName) {
      nodeStreets.get(key)!.add(streetName);
    }

    return nodeMap.get(key)!.id;
  };

  // Build edges
  const edges: GraphEdge[] = [];
  let edgeCounter = 0;

  for (const segment of roadSegments) {
    const coords = segment.coordinates;
    const streetName = segment.name;

    // Split segment at intersections
    let segmentStart = 0;
    const splitPoints: number[] = [0]; // Start with first point

    for (let i = 1; i < coords.length - 1; i++) {
      const [lon, lat] = coords[i];
      const key = coordKey(lon, lat);
      if (intersections.has(key)) {
        splitPoints.push(i);
      }
    }
    splitPoints.push(coords.length - 1); // End with last point

    // Create edges between split points
    for (let i = 0; i < splitPoints.length - 1; i++) {
      const startIdx = splitPoints[i];
      const endIdx = splitPoints[i + 1];

      const [lon1, lat1] = coords[startIdx];
      const [lon2, lat2] = coords[endIdx];

      const fromNode = getOrCreateNode(lon1, lat1, streetName);
      const toNode = getOrCreateNode(lon2, lat2, streetName);

      // Calculate total length of this edge segment
      let length = 0;
      for (let j = startIdx; j < endIdx; j++) {
        const [lonA, latA] = coords[j];
        const [lonB, latB] = coords[j + 1];
        length += haversineDistance(latA, lonA, latB, lonB);
      }

      edges.push({
        id: `edge_${edgeCounter++}`,
        fromNode,
        toNode,
        length: Math.round(length * 100) / 100, // Round to 2 decimals
        streetName,
      });
    }
  }

  // Finalize nodes with street names
  const nodes: GraphNode[] = [];
  for (const [key, node] of nodeMap.entries()) {
    node.streetNames = Array.from(nodeStreets.get(key)!).sort();
    nodes.push(node);
  }

  return { nodes, edges };
}

