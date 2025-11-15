/**
 * Geographic utility functions for converting lat/lon coordinates
 * to normalized x/y coordinates using Web Mercator projection (EPSG:3857)
 */

export interface GeoBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface MercatorBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ProjectedPoint {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
}

/**
 * Convert latitude to Web Mercator Y coordinate
 * Formula: y = ln(tan(π/4 + φ/2)) where φ is latitude in radians
 */
function latToMercatorY(lat: number): number {
  const latRad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}

/**
 * Convert longitude to Web Mercator X coordinate
 * Formula: x = λ where λ is longitude in radians
 */
function lonToMercatorX(lon: number): number {
  return (lon * Math.PI) / 180;
}

/**
 * Calculate geographic bounding box from array of lat/lon points
 */
export function calculateGeoBounds(points: Array<{ lat: number; lon: number }>): GeoBounds {
  if (points.length === 0) {
    throw new Error('Cannot calculate bounds from empty array');
  }

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLon = points[0].lon;
  let maxLon = points[0].lon;

  for (const point of points) {
    minLat = Math.min(minLat, point.lat);
    maxLat = Math.max(maxLat, point.lat);
    minLon = Math.min(minLon, point.lon);
    maxLon = Math.max(maxLon, point.lon);
  }

  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Calculate Mercator bounding box from geographic bounds
 */
export function calculateMercatorBounds(geoBounds: GeoBounds): MercatorBounds {
  return {
    minX: lonToMercatorX(geoBounds.minLon),
    maxX: lonToMercatorX(geoBounds.maxLon),
    minY: latToMercatorY(geoBounds.minLat),
    maxY: latToMercatorY(geoBounds.maxLat),
  };
}

/**
 * Convert lat/lon to normalized x/y coordinates (0-1 range)
 * using Web Mercator projection
 * 
 * @param lat - Latitude in degrees
 * @param lon - Longitude in degrees
 * @param mercatorBounds - Pre-calculated Mercator bounds for normalization
 * @returns Normalized x/y coordinates where (0,0) is bottom-left and (1,1) is top-right
 */
export function latLonToXY(
  lat: number,
  lon: number,
  mercatorBounds: MercatorBounds
): ProjectedPoint {
  const mercatorX = lonToMercatorX(lon);
  const mercatorY = latToMercatorY(lat);

  // Normalize to 0-1 range
  const x = (mercatorX - mercatorBounds.minX) / (mercatorBounds.maxX - mercatorBounds.minX);
  
  // For Y: flip so that north (higher lat) is at top (lower y in SVG coordinates)
  const y = 1 - (mercatorY - mercatorBounds.minY) / (mercatorBounds.maxY - mercatorBounds.minY);

  return { x, y };
}

/**
 * Create a projection function for a specific set of bounds
 * This is useful when converting many points with the same bounds
 */
export function createProjection(geoBounds: GeoBounds) {
  const mercatorBounds = calculateMercatorBounds(geoBounds);
  
  return {
    geoBounds,
    mercatorBounds,
    project: (lat: number, lon: number): ProjectedPoint => {
      return latLonToXY(lat, lon, mercatorBounds);
    },
  };
}

/**
 * Convert normalized x/y coordinates (0-1) back to lat/lon
 */
export function xyToLatLon(
  x: number,
  y: number,
  geoBounds: GeoBounds
): { lat: number; lon: number } {
  const mercatorBounds = calculateMercatorBounds(geoBounds);
  
  // Denormalize from 0-1 range
  const mercatorX = mercatorBounds.minX + x * (mercatorBounds.maxX - mercatorBounds.minX);
  const mercatorY = mercatorBounds.minY + (1 - y) * (mercatorBounds.maxY - mercatorBounds.minY);
  
  // Convert back from Mercator
  const lon = (mercatorX * 180) / Math.PI;
  const lat = (Math.atan(Math.exp(mercatorY)) - Math.PI / 4) * 2 * (180 / Math.PI);
  
  return { lat, lon };
}

/**
 * Calculate map center from geographic bounds
 */
export function getMapCenter(geoBounds: GeoBounds): [number, number] {
  return [(geoBounds.minLat + geoBounds.maxLat) / 2, (geoBounds.minLon + geoBounds.maxLon) / 2];
}

