import { Node, Edge, SnowplowState } from './types';
import { calculateGeoBounds, createProjection } from './geoUtils';
import graphData from '../geographic/graph.json';

// Types for the raw geographic data
interface RawGraphNode {
  id: string;
  lat: number;
  lon: number;
  streetNames: string[];
}

interface RawGraphEdge {
  id: string;
  fromNode: string;
  toNode: string;
  length: number;
  streetName: string | null;
}

interface RawGraphData {
  nodes: RawGraphNode[];
  edges: RawGraphEdge[];
}

// Load and convert geographic graph data
function loadGeographicGraph(): { nodes: Node[]; edges: Edge[] } {
  const rawData = graphData as RawGraphData;
  
  // Calculate geographic bounds from all nodes
  const geoBounds = calculateGeoBounds(
    rawData.nodes.map(n => ({ lat: n.lat, lon: n.lon }))
  );
  
  // Create projection function
  const projection = createProjection(geoBounds);
  
  // Convert nodes: lat/lon -> x/y using Web Mercator projection
  const nodes: Node[] = rawData.nodes.map(rawNode => {
    const { x, y } = projection.project(rawNode.lat, rawNode.lon);
    return {
      id: rawNode.id,
      x,
      y,
      lat: rawNode.lat,
      lon: rawNode.lon,
      streetNames: rawNode.streetNames,
    };
  });
  
  // Convert edges: keep structure, normalize length, add snowDepth
  const edges: Edge[] = rawData.edges.map(rawEdge => ({
    id: rawEdge.id,
    from_node: rawEdge.fromNode,
    to_node: rawEdge.toNode,
    length: rawEdge.length,
    snowDepth: 0,
    streetName: rawEdge.streetName,
  }));
  
  return { nodes, edges };
}

// Load the geographic graph data
const { nodes: initialNodes, edges: initialEdges } = loadGeographicGraph();

// Export the converted data
export { initialNodes, initialEdges };

// Initial plow position (first node in the graph)
export const initialPlow: SnowplowState = {
  currentNodeId: initialNodes[0].id,
};

