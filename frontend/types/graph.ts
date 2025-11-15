// Graph types for frontend consumption
export interface GraphNode {
  id: string;
  lat: number;
  lon: number;
  streetNames: string[];
}

export interface GraphEdge {
  id: string;
  fromNode: string;
  toNode: string;
  length: number;
  streetName: string | null;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

