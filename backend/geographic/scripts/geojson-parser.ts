import * as fs from "fs";
import { GeoJSONFeatureCollection, RoadSegment } from "./types";

const ROAD_TYPES = ["residential", "primary", "secondary", "tertiary"];

/**
 * Parse GeoJSON file and filter for road features
 */
export function parseAndFilterGeoJSON(filePath: string): RoadSegment[] {
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as GeoJSONFeatureCollection;
  
  const roadSegments: RoadSegment[] = [];

  for (const feature of data.features) {
    // Only process LineString features with highway tags
    if (
      feature.geometry.type !== "LineString" ||
      !feature.properties.highway ||
      !ROAD_TYPES.includes(feature.properties.highway)
    ) {
      continue;
    }

    roadSegments.push({
      name: feature.properties.name || null,
      coordinates: feature.geometry.coordinates,
    });
  }

  return roadSegments;
}

