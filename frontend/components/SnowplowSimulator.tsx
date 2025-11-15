'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Node, Edge, SnowplowState, StormState } from '@/lib/types';
import { initialNodes, initialEdges, initialPlow } from '@/lib/graph';
import {
  updateStorm,
  addSnowFromStorm,
  moveToNode,
  clearSnowOnEdge,
} from '@/lib/simulation';
import MapWithGraphOverlay from './MapWithGraphOverlay';
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
  const [policy, setPolicy] = useState<string>('naive');
  const [tickSpeedMs, setTickSpeedMs] = useState<number>(1000);

  // Refs to track latest state values and control loop
  const stormRef = useRef(storm);
  const edgesRef = useRef(edges);
  const plowRef = useRef(plow);
  const isRunningRef = useRef(isRunning);
  const tickSpeedRef = useRef(tickSpeedMs);

  // Update refs whenever state changes
  useEffect(() => { stormRef.current = storm; }, [storm]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { plowRef.current = plow; }, [plow]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { tickSpeedRef.current = tickSpeedMs; }, [tickSpeedMs]);

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
        length: edge.length, // Length in meters for reward calculation
        snow_depth: edge.snowDepth,
      }));

      // Get backend URL from environment variable, fallback to localhost for development
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      const res = await fetch(`${backendUrl}/next_node`, {
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

  // Self-scheduling simulation loop
  useEffect(() => {
    if (!isRunning) return;

    let timeoutId: NodeJS.Timeout;

    const runSimulationLoop = async () => {
      const stepStartTime = Date.now();

      try {
        // 1. Update storm position
        const updatedStorm = updateStorm(stormRef.current);
        setStorm(updatedStorm);
        
        // 2. Add snow from storm
        const edgesWithSnow = addSnowFromStorm(edgesRef.current, updatedStorm, nodes);
        setEdges(edgesWithSnow);
        
        // 3. Get backend decision
        const nextNodeId = await requestNextMove(plowRef.current, edgesWithSnow);
        
        // 4. Move plow and clear snow on traversed edge
        if (nextNodeId) {
          setPlow(moveToNode(plowRef.current, nextNodeId));
          setEdges(prev => clearSnowOnEdge(prev, plowRef.current.currentNodeId, nextNodeId));
        }
      } catch (error) {
        console.error('Step error:', error);
      }

      // Calculate how long this step took
      const stepDuration = Date.now() - stepStartTime;
      // Wait for remaining time to meet tickSpeedMs (or 0 if already exceeded)
      const waitTime = Math.max(0, tickSpeedRef.current - stepDuration);

      // Schedule next step only if still running
      if (isRunningRef.current) {
        timeoutId = setTimeout(runSimulationLoop, waitTime);
      }
    };

    // Start the loop
    runSimulationLoop();

    // Cleanup: cancel scheduled timeout when stopping
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isRunning, nodes, requestNextMove]);

  const handleReset = () => {
    // Stop simulation first
    setIsRunning(false);
    
    // Reset all state
    const resetEdges = initialEdges.map(e => ({ ...e, snowDepth: 0 }));
    setEdges(resetEdges);
    setPlow(initialPlow);
    setStorm(initialStorm);
    
    // Reset refs to match state
    edgesRef.current = resetEdges;
    plowRef.current = initialPlow;
    stormRef.current = initialStorm;
    isRunningRef.current = false;
  };

  return (
    <div className="container mx-auto p-2 max-w-[1800px]">
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="w-full lg:w-3/4">
          <MapWithGraphOverlay nodes={nodes} edges={edges} plow={plow} storm={storm} />
        </div>
        <div className="w-full lg:w-1/4 space-y-3">
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

