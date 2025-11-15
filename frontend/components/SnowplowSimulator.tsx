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

export default function SnowplowSimulator() {
  const [nodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [plow, setPlow] = useState<SnowplowState>(initialPlow);
  const [storm, setStorm] = useState<StormState>(initialStorm);
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [policy, setPolicy] = useState<string>('naive');
  const [isWaitingForBackend, setIsWaitingForBackend] = useState(false);
  
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
      if (isWaitingForBackend) return;
      
      setIsWaitingForBackend(true);
      
      try {
        // Step 2: Send current snapshot to backend
        const backendEdges = currentEdges.map(edge => ({
          id: edge.id,
          from_node: edge.from_node,
          to_node: edge.to_node,
          travel_time: edge.length,
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

        // Step 3: Backend returns decision
        const data = await res.json();
        if (data.target_node_id) {
          const oldNodeId = currentPlow.currentNodeId;
          const newNodeId = data.target_node_id;
          
          // Step 4a: Move plow to target node
          setPlow(moveToNode(currentPlow, newNodeId));
          
          // Step 4b: Clear snow on the edge that was just traversed
          setEdges(prevEdges => clearSnowOnEdge(prevEdges, oldNodeId, newNodeId));
        }
      } catch (error) {
        console.error('Error requesting next move:', error);
      } finally {
        setIsWaitingForBackend(false);
      }
    },
    [nodes, policy, isWaitingForBackend]
  );

  // Simulation logic - correct order:
  // 1. Add snow (if storm overlays the edge)
  // 2. Send snapshot to backend
  // 3. Backend decides next node
  // 4. Simulate step (move plow + clear snow) - happens in requestNextMove callback
  useEffect(() => {
    if (!isRunning) return;

    // Update storm position
    setStorm(prevStorm => {
      const updatedStorm = updateStorm(prevStorm);
      stormRef.current = updatedStorm;
      return updatedStorm;
    });
    
    // Step 1: Add snow from storm
    setEdges(prevEdges => {
      const edgesWithSnow = addSnowFromStorm(prevEdges, stormRef.current, nodes);
      return edgesWithSnow;
    });
    
    // Step 2-4: Request next move (backend decides, then we simulate)
    if (!isWaitingForBackend) {
      requestNextMove(plowRef.current, edgesRef.current);
    }
  }, [tick, isRunning, nodes, requestNextMove, isWaitingForBackend]);

  const handleReset = () => {
    const resetEdges = initialEdges.map(e => ({ ...e, snowDepth: 0 }));
    setEdges(resetEdges);
    setPlow(initialPlow);
    setStorm(initialStorm);
    setIsWaitingForBackend(false);
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
            policy={policy}
            onPolicyChange={setPolicy}
          />
          <HeatmapLegend />
          <StatsPanel edges={edges} />
        </div>
      </div>
    </div>
  );
}

