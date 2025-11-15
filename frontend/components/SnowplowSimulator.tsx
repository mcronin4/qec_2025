'use client';

import { useState, useEffect, useCallback } from 'react';
import { Node, Edge, SnowplowState, StormState } from '@/lib/types';
import { initialNodes, initialEdges, initialPlow } from '@/lib/graph';
import {
  updateStorm,
  addSnowFromStorm,
  moveToNode,
  clearSnowOnEdge,
} from '@/lib/simulation';
import GraphCanvas from './GraphCanvas';
import ControlPanel from './ControlPanel';
import StatsPanel from './StatsPanel';
import HeatmapLegend from './HeatmapLegend';

const initialStorm: StormState = {
  centerX: 0.4,
  centerY: 0.4,
  radius: 0.5,
  vx: 0.003,  // Reduced from 0.015 - slower movement
  vy: 0.002,  // Reduced from 0.012 - slower movement
};

export default function SnowplowSimulator() {
  const [nodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [plow, setPlow] = useState<SnowplowState>(initialPlow);
  const [storm, setStorm] = useState<StormState>(initialStorm);
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [policy, setPolicy] = useState<string>('naive');
  const [tickSpeedMs, setTickSpeedMs] = useState<number>(1000);
  const [isStepping, setIsStepping] = useState(false);

  // Game loop timer
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setTick(t => t + 1);
    }, tickSpeedMs);
    return () => clearInterval(id);
  }, [isRunning, tickSpeedMs]);

  // Request next move from backend
  const requestNextMove = useCallback(
    async (currentPlow: SnowplowState, currentEdges: Edge[]): Promise<string | null> => {
      // Convert edge length (meters) to travel time (seconds)
      // Snowplow speed: 20 km/h = 5.556 m/s
      const SNOWPLOW_SPEED_MS = 20000 / 3600; // 20 km/h in m/s
      
      const backendEdges = currentEdges.map(edge => ({
        id: edge.id,
        from_node: edge.from_node,
        to_node: edge.to_node,
        travel_time: edge.length / SNOWPLOW_SPEED_MS, // Convert meters to seconds
        snow_depth: edge.snowDepth,
      }));

      const res = await fetch('http://localhost:8000/next_node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plow: {
            current_node_id: currentPlow.currentNodeId,
          },
          nodes: nodes,
          edges: backendEdges,
          policy: policy,
        }),
      });

      if (!res.ok) {
        throw new Error(`Backend returned ${res.status}`);
      }

      const data = await res.json();
      return data.target_node_id || null;
    },
    [nodes, policy]
  );

  // Simulation step - runs on each tick
  useEffect(() => {
    if (!isRunning || isStepping) return; // Guard: skip if not running or already stepping
    
    const performStep = async () => {
      setIsStepping(true); // Mark that we're processing this step
      
      try {
        // 1. Update storm position
        const updatedStorm = updateStorm(storm);
        setStorm(updatedStorm);
        
        // 2. Add snow from storm
        const edgesWithSnow = addSnowFromStorm(edges, updatedStorm, nodes);
        setEdges(edgesWithSnow);
        
        // 3. Get backend decision
        const nextNodeId = await requestNextMove(plow, edgesWithSnow);
        
        // 4. Move plow and clear snow on traversed edge
        if (nextNodeId) {
          setPlow(moveToNode(plow, nextNodeId));
          setEdges(prev => clearSnowOnEdge(prev, plow.currentNodeId, nextNodeId));
        }
      } catch (error) {
        console.error('Step error:', error);
        // Skip this tick on error - next tick will retry from same state
      } finally {
        setIsStepping(false); // Always mark done, even on error
      }
    };
    
    performStep();
  }, [tick, isRunning, isStepping, storm, edges, plow, nodes, requestNextMove]);

  const handleReset = () => {
    const resetEdges = initialEdges.map(e => ({ ...e, snowDepth: 0 }));
    setEdges(resetEdges);
    setPlow(initialPlow);
    setStorm(initialStorm);
    setIsStepping(false);
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
            policy={policy}
            onPolicyChange={setPolicy}
            tickSpeedMs={tickSpeedMs}
            onTickSpeedChange={setTickSpeedMs}
          />
          <HeatmapLegend />
          <StatsPanel edges={edges} />
        </div>
      </div>
    </div>
  );
}

