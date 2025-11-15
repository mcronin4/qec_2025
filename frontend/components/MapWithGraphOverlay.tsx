'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Node, Edge, SnowplowState, StormState } from '@/lib/types';
import { calculateGeoBounds, getMapCenter, xyToLatLon } from '@/lib/geoUtils';

interface MapWithGraphOverlayProps {
  nodes: Node[];
  edges: Edge[];
  plow: SnowplowState;
  storm: StormState;
}

function GraphOverlay({ nodes, edges, plow, storm }: MapWithGraphOverlayProps) {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create container for SVG if it doesn't exist
    if (!containerRef.current) {
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '1000';
      
      const mapContainer = map.getContainer();
      mapContainer.appendChild(container);
      containerRef.current = container;
    }

    const updateOverlay = () => {
      if (!containerRef.current) return;

      const bounds = map.getBounds();
      const mapSize = map.getSize();
      
      // Create new SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', String(mapSize.x));
      svg.setAttribute('height', String(mapSize.y));
      svg.style.position = 'absolute';
      svg.style.top = '0';
      svg.style.left = '0';
      
      // Add defs for gradients and filters
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      
      // Storm gradient
      const stormGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
      stormGradient.setAttribute('id', 'stormGradient');
      stormGradient.innerHTML = `
        <stop offset="0%" stop-color="rgba(139, 0, 0, 0.4)" />
        <stop offset="50%" stop-color="rgba(255, 69, 0, 0.25)" />
        <stop offset="100%" stop-color="rgba(255, 255, 0, 0.15)" />
      `;
      defs.appendChild(stormGradient);

      // Glow filter
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', 'glow');
      filter.innerHTML = `
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      `;
      defs.appendChild(filter);
      svg.appendChild(defs);

      const getNode = (id: string) => nodes.find(n => n.id === id);

      // Draw edges
      edges.forEach(edge => {
        const from = getNode(edge.from_node);
        const to = getNode(edge.to_node);
        if (!from || !to || !from.lat || !from.lon || !to.lat || !to.lon) return;

        const fromPoint = map.latLngToContainerPoint([from.lat, from.lon]);
        const toPoint = map.latLngToContainerPoint([to.lat, to.lon]);

        // Calculate color based on snow depth
        const snowRatio = Math.min(edge.snowDepth / 5, 1);
        const red = Math.floor(0 + (255 - 0) * snowRatio);
        const green = Math.floor(100 + (0 - 100) * snowRatio);
        const blue = Math.floor(255 + (0 - 255) * snowRatio);
        const alpha = 0.7 + snowRatio * 0.3;
        
        const hasGlow = snowRatio > 0.5;
        const thickness = 4 + edge.snowDepth * 2;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // Glow layer
        if (hasGlow) {
          const glowLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          glowLine.setAttribute('x1', String(fromPoint.x));
          glowLine.setAttribute('y1', String(fromPoint.y));
          glowLine.setAttribute('x2', String(toPoint.x));
          glowLine.setAttribute('y2', String(toPoint.y));
          glowLine.setAttribute('stroke', `rgba(${red}, ${green}, ${blue}, ${alpha * 0.5})`);
          glowLine.setAttribute('stroke-width', String(thickness * 2));
          glowLine.setAttribute('stroke-linecap', 'round');
          glowLine.setAttribute('filter', 'url(#glow)');
          glowLine.setAttribute('opacity', '0.6');
          g.appendChild(glowLine);
        }

        // Main line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', String(fromPoint.x));
        line.setAttribute('y1', String(fromPoint.y));
        line.setAttribute('x2', String(toPoint.x));
        line.setAttribute('y2', String(toPoint.y));
        line.setAttribute('stroke', `rgba(${red}, ${green}, ${blue}, ${alpha})`);
        line.setAttribute('stroke-width', String(thickness));
        line.setAttribute('stroke-linecap', 'round');
        if (hasGlow) line.setAttribute('filter', 'url(#glow)');
        g.appendChild(line);

        // Snow label
        if (edge.snowDepth > 0.1) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', String((fromPoint.x + toPoint.x) / 2));
          text.setAttribute('y', String((fromPoint.y + toPoint.y) / 2));
          text.setAttribute('fill', 'white');
          text.setAttribute('font-size', '12');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'middle');
          text.setAttribute('stroke', 'black');
          text.setAttribute('stroke-width', '2');
          text.setAttribute('paint-order', 'stroke');
          text.textContent = edge.snowDepth.toFixed(1);
          g.appendChild(text);
        }

        svg.appendChild(g);
      });

      // Draw nodes
      nodes.forEach(node => {
        if (!node.lat || !node.lon) return;
        const point = map.latLngToContainerPoint([node.lat, node.lon]);
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', String(point.x));
        circle.setAttribute('cy', String(point.y));
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', 'white');
        circle.setAttribute('stroke', '#333');
        circle.setAttribute('stroke-width', '1');
        svg.appendChild(circle);
      });

      // Draw storm
      const geoBounds = calculateGeoBounds(nodes.map(n => ({ lat: n.lat!, lon: n.lon! })));
      const stormLatLon = xyToLatLon(storm.centerX, storm.centerY, geoBounds);
      const stormCenter = map.latLngToContainerPoint([stormLatLon.lat, stormLatLon.lon]);
      
      // Calculate storm radius in pixels
      const latSpan = geoBounds.maxLat - geoBounds.minLat;
      const stormRadiusInDegrees = storm.radius * latSpan;
      const stormEdgeLatLon = { lat: stormLatLon.lat + stormRadiusInDegrees, lon: stormLatLon.lon };
      const stormEdgePoint = map.latLngToContainerPoint([stormEdgeLatLon.lat, stormEdgeLatLon.lon]);
      const stormRadiusPixels = Math.abs(stormEdgePoint.y - stormCenter.y);

      const stormCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      stormCircle.setAttribute('cx', String(stormCenter.x));
      stormCircle.setAttribute('cy', String(stormCenter.y));
      stormCircle.setAttribute('r', String(stormRadiusPixels));
      stormCircle.setAttribute('fill', 'url(#stormGradient)');
      stormCircle.setAttribute('stroke', 'rgba(255, 200, 0, 0.3)');
      stormCircle.setAttribute('stroke-width', '2');
      svg.appendChild(stormCircle);

      // Draw plow
      const plowNode = getNode(plow.currentNodeId);
      if (plowNode && plowNode.lat && plowNode.lon) {
        const plowPoint = map.latLngToContainerPoint([plowNode.lat, plowNode.lon]);
        
        const plowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        plowCircle.setAttribute('cx', String(plowPoint.x));
        plowCircle.setAttribute('cy', String(plowPoint.y));
        plowCircle.setAttribute('r', '8');
        plowCircle.setAttribute('fill', 'yellow');
        plowCircle.setAttribute('stroke', 'black');
        plowCircle.setAttribute('stroke-width', '2');
        svg.appendChild(plowCircle);
      }

      // Replace old SVG with new one
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(svg);
    };

    updateOverlay();
    map.on('move zoom zoomanim viewreset', updateOverlay);

    return () => {
      map.off('move zoom zoomanim viewreset', updateOverlay);
      if (containerRef.current) {
        containerRef.current.remove();
        containerRef.current = null;
      }
    };
  }, [map, nodes, edges, plow, storm]);

  return null;
}

export default function MapWithGraphOverlay({ nodes, edges, plow, storm }: MapWithGraphOverlayProps) {
  if (nodes.length === 0) return null;

  // Calculate map center and bounds
  const geoBounds = calculateGeoBounds(nodes.map(n => ({ lat: n.lat!, lon: n.lon! })));
  const center = getMapCenter(geoBounds);

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: 'calc(100vh - 16px)', width: '100%' }}
      className="rounded border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GraphOverlay nodes={nodes} edges={edges} plow={plow} storm={storm} />
    </MapContainer>
  );
}
