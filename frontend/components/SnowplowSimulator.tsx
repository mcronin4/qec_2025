'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Node, Edge, SnowplowState, StormState } from '@/lib/types';
import { initialNodes, initialEdges } from '@/lib/graph';
import {
  updateStorm,
  addSnowFromStorm,
  movePlow,
  plowReachedNode,
  clearSnowOnEdge,
  getCurrentNodeId,
} from '@/lib/simulation';
import GraphCanvas from './GraphCanvas';
import ControlPanel from './ControlPanel';
import StatsPanel from './StatsPanel';
import HeatmapLegend from './HeatmapLegend';

const TICK_MS = 150;

const initialStorm: StormState = {
  centerX: 0.4,
  centerY: 0.4,
  radius: 0.25,
  vx: 0.015,
  vy: 0.012,
};

const initialPlow: SnowplowState = {
  currentEdgeId: '0-1',
  position: 0,
  direction: 'forward',
};

export default function SnowplowSimulator() {
  const [nodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [plow, setPlow] = useState<SnowplowState>(initialPlow);
  const [storm, setStorm] = useState<StormState>(initialStorm);
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(0);
  
  // Refs to track latest state values for use in effects
  const edgesRef = useRef(edges);
  const plowRef = useRef(plow);
  const stormRef = useRef(storm);
  
  // Keep refs in sync with state
  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);
  
  useEffect(() => {
    plowRef.current = plow;
  }, [plow]);
  
  useEffect(() => {
    stormRef.current = storm;
  }, [storm]);

  // Game loop timer
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTick(t => t + 1);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [isRunning]);

  // Request next move from backend
  const requestNextMove = useCallback(
    async (currentPlow: SnowplowState, currentEdges: Edge[]) => {
      const currentNodeId = getCurrentNodeId(currentPlow, currentEdges);
      if (!currentNodeId) return;

      try {
        const res = await fetch('/api/next-move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            graph: { nodes, edges: currentEdges },
            plow: currentPlow,
          }),
        });

        const data = await res.json();
        if (data.nextEdgeId) {
          const nextEdge = currentEdges.find(e => e.id === data.nextEdgeId);
          if (nextEdge) {
            // Determine direction based on which node we're at
            const isForward = nextEdge.from === currentNodeId;
            setPlow({
              currentEdgeId: data.nextEdgeId,
              position: 0,
              direction: isForward ? 'forward' : 'backward',
            });
          }
        }
      } catch (error) {
        console.error('Error requesting next move:', error);
      }
    },
    [nodes]
  );

  // Simulation logic
  useEffect(() => {
    if (!isRunning) return;

    // Update storm
    setStorm(prevStorm => {
      const updatedStorm = updateStorm(prevStorm);
      stormRef.current = updatedStorm;
      return updatedStorm;
    });
    
    // Add snow from storm and clear snow from plow's current edge
    setEdges(prevEdges => {
      // Use ref to get latest storm state
      const edgesWithSnow = addSnowFromStorm(prevEdges, stormRef.current, nodes);
      
      // Use ref to get latest plow state
      if (plowRef.current.currentEdgeId) {
        return clearSnowOnEdge(edgesWithSnow, plowRef.current.currentEdgeId);
      }
      return edgesWithSnow;
    });
    
    // Move plow
    setPlow(prevPlow => {
      const updatedPlow = movePlow(prevPlow, edgesRef.current);
      plowRef.current = updatedPlow;
      
      if (plowReachedNode(updatedPlow)) {
        // Call backend to choose next node/edge
        requestNextMove(updatedPlow, edgesRef.current);
      }
      return updatedPlow;
    });
  }, [tick, isRunning, nodes, requestNextMove]);

  const handleReset = () => {
    const resetEdges = initialEdges.map(e => ({ ...e, snowDepth: 0 }));
    setEdges(resetEdges);
    setPlow(initialPlow);
    setStorm(initialStorm);
    edgesRef.current = resetEdges;
    plowRef.current = initialPlow;
    stormRef.current = initialStorm;
    setTick(0);
    setIsRunning(false);
  };

  return (
    <div className="container mx-auto p-4 space-y-3 max-w-4xl">
      <h1 className="text-2xl font-bold text-center">Snowplow Path Finding Simulation</h1>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <GraphCanvas nodes={nodes} edges={edges} plow={plow} storm={storm} />
        </div>
        <div className="w-full md:w-56 space-y-3">
          <ControlPanel
            isRunning={isRunning}
            onToggle={() => setIsRunning(!isRunning)}
            onReset={handleReset}
          />
          <HeatmapLegend />
          <StatsPanel edges={edges} />
        </div>
      </div>
    </div>
  );
}

