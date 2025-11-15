# GeoJSON to Graph Converter

Converts OpenStreetMap GeoJSON data to a graph representation for the Next.js simulation.

## Usage

```bash
npm run convert:geojson
```

This converts `backend/geographic/export.geojson` to `backend/geographic/graph.json`.

## Output Format

- **Nodes**: Intersection points with coordinates and street names
- **Edges**: Road segments with length (meters) and street name

## Implementation

- Filters for road types: residential, primary, secondary, tertiary
- Creates nodes at road intersections
- Calculates edge lengths using Haversine formula

