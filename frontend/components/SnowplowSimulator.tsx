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
  const [tick, setTick] = useState(0);
  const [policy, setPolicy] = useState<string>('naive');
  const [tickSpeedMs, setTickSpeedMs] = useState<number>(1000);
  const [isStepping, setIsStepping] = useState(false);

  // Refs to track latest state values without causing effect re-runs
  const stormRef = useRef(storm);
  const edgesRef = useRef(edges);
  const plowRef = useRef(plow);

  // Update refs whenever state changes
  useEffect(() => { stormRef.current = storm; }, [storm]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { plowRef.current = plow; }, [plow]);

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

  // Simulation step - runs on each tick
  useEffect(() => {
    if (!isRunning || isStepping || tick === 0) return; // Guard: skip if not running or already stepping
    
    const performStep = async () => {
      setIsStepping(true); // Mark that we're processing this step
      
      try {
        // Use refs to get current values without adding dependencies
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
        // Skip this tick on error - next tick will retry from same state
      } finally {
        setIsStepping(false); // Always mark done, even on error
      }
    };
    
    performStep();
  }, [tick, isRunning, isStepping, nodes, requestNextMove]);

  const handleReset = () => {
    const resetEdges = initialEdges.map(e => ({ ...e, snowDepth: 0 }));
    setEdges(resetEdges);
    setPlow(initialPlow);
    setStorm(initialStorm);
    setIsStepping(false);
    setTick(0);
    setIsRunning(false);
    
    // Reset refs to match state
    edgesRef.current = resetEdges;
    plowRef.current = initialPlow;
    stormRef.current = initialStorm;
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

