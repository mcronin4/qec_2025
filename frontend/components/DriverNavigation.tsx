'use client';

import { Node, Edge, SnowplowState } from '@/lib/types';
import { useEffect, useState } from 'react';

interface NavigationInstruction {
  type: 'turn-left' | 'turn-right' | 'straight';
  streetName: string | null;
  distance: number; // in meters (or whatever unit length is)
  description: string;
}

interface DriverNavigationProps {
  nodes: Node[];
  edges: Edge[];
  plow: SnowplowState;
  nextNodeId: string | null; // The next node the plow will move to
}

// Calculate the angle between two vectors (incoming and outgoing)
function calculateTurnAngle(
  prevNode: Node,
  currentNode: Node,
  nextNode: Node
): number {
  // Vector from previous to current
  const dx1 = currentNode.x - prevNode.x;
  const dy1 = currentNode.y - prevNode.y;
  
  // Vector from current to next
  const dx2 = nextNode.x - currentNode.x;
  const dy2 = nextNode.y - currentNode.y;
  
  // Calculate angles
  const angle1 = Math.atan2(dy1, dx1);
  const angle2 = Math.atan2(dy2, dx2);
  
  // Calculate the difference (normalized to -π to π)
  let diff = angle2 - angle1;
  
  // Normalize to -π to π
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  
  return diff;
}

// Determine turn direction based on angle
// Note: In screen coordinates (y increases downward), a positive angle (counter-clockwise in math)
// corresponds to a clockwise turn on screen (right turn), and vice versa
function getTurnDirection(angle: number): 'turn-left' | 'turn-right' | 'straight' {
  const threshold = Math.PI / 6; // 30 degrees
  
  if (Math.abs(angle) < threshold) {
    return 'straight';
  } else if (angle > 0) {
    // Positive angle = counter-clockwise in math = clockwise on screen = right turn
    return 'turn-right';
  } else {
    // Negative angle = clockwise in math = counter-clockwise on screen = left turn
    return 'turn-left';
  }
}

// Get the edge connecting two nodes
function getEdgeBetween(nodes: Node[], edges: Edge[], fromId: string, toId: string): Edge | null {
  return edges.find(
    edge =>
      (edge.from_node === fromId && edge.to_node === toId) ||
      (edge.from_node === toId && edge.to_node === fromId)
  ) || null;
}

export default function DriverNavigation({
  nodes,
  edges,
  plow,
  nextNodeId,
}: DriverNavigationProps) {
  const [movementHistory, setMovementHistory] = useState<string[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState<NavigationInstruction>({
    type: 'straight',
    streetName: null,
    distance: 0,
    description: 'Waiting for route...',
  });

  // Track movement history - add current node when it changes
  useEffect(() => {
    setMovementHistory(prev => {
      const newHistory = [...prev];
      // Only add if it's different from the last entry
      if (newHistory.length === 0 || newHistory[newHistory.length - 1] !== plow.currentNodeId) {
        newHistory.push(plow.currentNodeId);
      }
      // Keep only last 10 nodes to avoid memory issues
      return newHistory.slice(-10);
    });
  }, [plow.currentNodeId]);

  // Calculate current instruction based on the turn we just completed
  useEffect(() => {
    const currentNode = nodes.find(n => n.id === plow.currentNodeId);
    
    if (!currentNode) {
      setCurrentInstruction({
        type: 'straight',
        streetName: null,
        distance: 0,
        description: 'Invalid route data...',
      });
      return;
    }

    // We need at least 2 nodes in history to show a completed move
    // History format: [node1, node2, node3, ...] where the last entry is the current node
    if (movementHistory.length < 2) {
      // Not enough history yet - just starting
      setCurrentInstruction({
        type: 'straight',
        streetName: null,
        distance: 0,
        description: 'Starting route...',
      });
      return;
    }

    // Get the edge we just traversed (from previous node to current node)
    const prevNodeId = movementHistory[movementHistory.length - 2];
    const prevNode = nodes.find(n => n.id === prevNodeId);
    
    if (!prevNode) {
      setCurrentInstruction({
        type: 'straight',
        streetName: null,
        distance: 0,
        description: 'Route data error...',
      });
      return;
    }

    // Find the edge we just traversed
    const lastEdge = getEdgeBetween(nodes, edges, prevNodeId, plow.currentNodeId);
    if (!lastEdge) {
      setCurrentInstruction({
        type: 'straight',
        streetName: null,
        distance: 0,
        description: 'No edge data...',
      });
      return;
    }

    // Calculate turn direction if we have at least 3 nodes (can calculate angle)
    // History: [X, A, B] where B is current
    // We calculate turn from X->A->B
    if (movementHistory.length >= 3) {
      const nodeBeforePrevId = movementHistory[movementHistory.length - 3];
      const nodeBeforePrev = nodes.find(n => n.id === nodeBeforePrevId);
      
      if (nodeBeforePrev) {
        // Calculate the turn angle: from (nodeBeforePrev -> prevNode -> currentNode)
        const angle = calculateTurnAngle(nodeBeforePrev, prevNode, currentNode);
        const turnType = getTurnDirection(angle);
        
        const streetName = lastEdge.streetName || 'unnamed street';
        const distance = lastEdge.length;
        
        let description = '';
        if (turnType === 'straight') {
          description = `Continued straight on ${streetName}`;
        } else if (turnType === 'turn-left') {
          description = `Turned left onto ${streetName}`;
        } else {
          description = `Turned right onto ${streetName}`;
        }
        
        setCurrentInstruction({
          type: turnType,
          streetName: lastEdge.streetName,
          distance,
          description,
        });
        return;
      }
    }

    // If we only have 2 nodes, we can't calculate a turn yet, just show the street
    const streetName = lastEdge.streetName || 'unnamed street';
    setCurrentInstruction({
      type: 'straight',
      streetName: lastEdge.streetName,
      distance: lastEdge.length,
      description: `On ${streetName}`,
    });
  }, [plow.currentNodeId, nodes, edges, movementHistory]);

  // Get icon for turn type
  const getIcon = () => {
    switch (currentInstruction.type) {
      case 'turn-left':
        return '↰';
      case 'turn-right':
        return '↱';
      case 'straight':
        return '↑';
      default:
        return '→';
    }
  };

  // Format distance (always in meters)
  const formatDistance = (distance: number): string => {
    return `${Math.round(distance)}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-2 border-2 border-blue-500">
      <div className="flex items-start gap-2">
        <div className="text-3xl flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-gray-900 leading-tight">
            {currentInstruction.description}
          </div>
          {currentInstruction.distance > 0 && (
            <div className="text-xs text-gray-500 mt-1 font-medium">
              Distance: {formatDistance(currentInstruction.distance)}
            </div>
          )}
        </div>
      </div>
      <div className="mt-1 text-[10px] text-gray-400 italic">
        Driver Navigation
      </div>
    </div>
  );
}

