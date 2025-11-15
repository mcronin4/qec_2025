// GeoJSON types
export interface GeoJSONFeature {
  type: "Feature";
  properties: {
    name?: string;
    highway?: string;
    [key: string]: any;
  };
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// Intermediate types
export interface RoadSegment {
  name: string | null;
  coordinates: [number, number][];
}

// Graph output types
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

