'use client';

import { Node, Edge, SnowplowState, StormState } from '@/lib/types';

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  plow: SnowplowState;
  storm: StormState;
}

export default function GraphCanvas({
  nodes,
  edges,
  plow,
  storm,
}: GraphCanvasProps) {
  const getNode = (id: string) => nodes.find(n => n.id === id)!;

  // Get plow coordinates from its edge + position
  const plowPos = (() => {
    if (!plow.currentEdgeId) return null;
    const edge = edges.find(e => e.id === plow.currentEdgeId);
    if (!edge) return null;
    const from = getNode(edge.from);
    const to = getNode(edge.to);
    const x = from.x + (to.x - from.x) * plow.position;
    const y = from.y + (to.y - from.y) * plow.position;
    return { x, y };
  })();

  return (
    <svg
      viewBox="0 0 1 1"
      className="w-full h-full border rounded bg-slate-900"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxHeight: '400px', width: '100%' }}
    >
      <defs>
        {/* Radial gradient for storm: dark red center to yellow edges */}
        <radialGradient id="stormGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(139, 0, 0, 0.4)" /> {/* Dark red center */}
          <stop offset="50%" stopColor="rgba(255, 69, 0, 0.25)" /> {/* Orange middle */}
          <stop offset="100%" stopColor="rgba(255, 255, 0, 0.15)" /> {/* Yellow edge */}
        </radialGradient>
        
        {/* Glow filter for high-snow edges */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="0.01" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Heatmap edges with glow effect for high snow */}
      {edges.map(edge => {
        const from = getNode(edge.from);
        const to = getNode(edge.to);

        // map snowDepth → strokeWidth + color
        // Base width is thicker, and increases more with snow
        const baseThickness = 0.015;
        const thickness = baseThickness + edge.snowDepth * 0.008;
        
        // Color changes from blue (no snow) to red (lots of snow)
        // Snow depth 0 = blue, snow depth 5 = red
        const snowRatio = Math.min(edge.snowDepth / 5, 1);
        // Interpolate from blue (0, 100, 255) to red (255, 0, 0)
        const red = Math.floor(0 + (255 - 0) * snowRatio);
        const green = Math.floor(100 + (0 - 100) * snowRatio);
        const blue = Math.floor(255 + (0 - 255) * snowRatio);
        const alpha = 0.7 + snowRatio * 0.3; // More opaque with more snow
        
        // Add glow effect for high snow (snowRatio > 0.5)
        const hasGlow = snowRatio > 0.5;

        return (
          <g key={edge.id}>
            {/* Glow layer for high-snow edges */}
            {hasGlow && (
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={`rgba(${red}, ${green}, ${blue}, ${alpha * 0.5})`}
                strokeWidth={thickness * 2}
                strokeLinecap="round"
                filter="url(#glow)"
                opacity={0.6}
              />
            )}
            {/* Main edge */}
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={`rgba(${red}, ${green}, ${blue}, ${alpha})`}
              strokeWidth={thickness}
              strokeLinecap="round"
              filter={hasGlow ? "url(#glow)" : undefined}
            />
            {/* Snow depth label (small text on edge midpoint) */}
            {edge.snowDepth > 0.1 && (
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2}
                fontSize="0.02"
                fill="white"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ pointerEvents: 'none' }}
                stroke="black"
                strokeWidth="0.003"
                strokeLinejoin="round"
              >
                {edge.snowDepth.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}

      {/* nodes */}
      {nodes.map(node => (
        <circle
          key={node.id}
          cx={node.x}
          cy={node.y}
          r={0.01}
          fill="white"
        />
      ))}

      {/* storm with gradient */}
      <circle
        cx={storm.centerX}
        cy={storm.centerY}
        r={storm.radius}
        fill="url(#stormGradient)"
        stroke="rgba(255, 200, 0, 0.3)"
        strokeWidth={0.003}
      />

      {/* plow */}
      {plowPos && (
        <circle
          cx={plowPos.x}
          cy={plowPos.y}
          r={0.015}
          fill="yellow"
          stroke="black"
          strokeWidth={0.002}
        />
      )}
    </svg>
  );
}

