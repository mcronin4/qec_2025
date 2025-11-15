# Map Overlay Guide

## Overview

The snowplow simulator now uses real geographic data from Kingston, Ontario, with proper Web Mercator projection to ensure accurate alignment with map images.

## How It Works

1. **Geographic Data**: Loaded from `backend/geographic/graph.json` (lat/lon coordinates)
2. **Projection**: Converted to x/y coordinates using Web Mercator (EPSG:3857)
3. **Normalization**: Scaled to 0-1 range for SVG rendering
4. **Map Overlay**: Optional background image aligned with the projected coordinates

## Adding a Background Map Image

To add a background map image to the visualization:

### Step 1: Export Map from OpenStreetMap

1. Visit [openstreetmap.org](https://www.openstreetmap.org)
2. Navigate to the Kingston downtown area (approximately 44.22°-44.23°N, 76.48°-76.51°W)
3. Click the "Export" button
4. Adjust the bounding box to match your graph data
5. Click "Export" to download the PNG image

### Step 2: Add Image to Project

Save the exported image as:
```
frontend/public/kingston-map.png
```

### Step 3: Enable in UI

Update `SnowplowSimulator.tsx` to pass the background image prop:

```tsx
<GraphCanvas 
  nodes={nodes} 
  edges={edges} 
  plow={plow} 
  storm={storm}
  backgroundImage="/kingston-map.png"  // Add this line
/>
```

## Technical Details

### Coordinate System

- **Input**: Latitude/Longitude (WGS84)
- **Projection**: Web Mercator (EPSG:3857)
- **Output**: Normalized x/y (0-1 range)

### Why Web Mercator?

Web Mercator ensures 1:1 alignment with OpenStreetMap tiles because:
- OpenStreetMap uses Web Mercator projection
- Handles latitude distortion correctly
- Preserves angles (conformal projection)
- Streets intersect at correct angles

### Backend Compatibility

The backend receives normalized x/y coordinates from the frontend. The conversion from lat/lon to x/y happens once at load time in `frontend/lib/graph.ts`.

## Files Modified

- `frontend/lib/types.ts` - Extended Node interface with optional lat/lon/streetNames
- `frontend/lib/geoUtils.ts` - NEW: Web Mercator projection utilities
- `frontend/lib/graph.ts` - Updated to load geographic data and convert coordinates
- `frontend/components/GraphCanvas.tsx` - Added optional backgroundImage prop
- `frontend/types/graph.ts` - DELETED: Merged into lib/types.ts

## Troubleshooting

### Map doesn't align with nodes

Ensure the exported map image covers the exact same geographic bounds as the graph data. You can check the bounds in the browser console by inspecting the projection object.

### Image doesn't show

1. Verify the image path is correct (relative to `/public/`)
2. Check browser console for loading errors
3. Ensure the image file exists in `frontend/public/`

