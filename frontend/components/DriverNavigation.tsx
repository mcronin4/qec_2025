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

  // Calculate current instruction
  useEffect(() => {
    if (!nextNodeId) {
      // Show a default message when waiting for next move
      setCurrentInstruction({
        type: 'straight',
        streetName: null,
        distance: 0,
        description: 'Waiting for route...',
      });
      return;
    }

    const currentNode = nodes.find(n => n.id === plow.currentNodeId);
    const nextNode = nodes.find(n => n.id === nextNodeId);
    
    if (!currentNode || !nextNode) {
      setCurrentInstruction({
        type: 'straight',
        streetName: null,
        distance: 0,
        description: `Invalid route: ${!currentNode ? 'current node not found' : 'next node not found'}`,
      });
      return;
    }

    // If nextNodeId is the same as current, we might have just moved
    // Try to find the edge using the previous position from history
    if (nextNodeId === plow.currentNodeId) {
      // If we have history, use the previous position to find the edge we just traversed
      if (movementHistory.length >= 2) {
        const prevNodeId = movementHistory[movementHistory.length - 2];
        const edge = getEdgeBetween(nodes, edges, prevNodeId, plow.currentNodeId);
        if (edge) {
          const streetName = edge.streetName || 'unnamed street';
          setCurrentInstruction({
            type: 'straight',
            streetName: edge.streetName,
            distance: edge.length,
            description: `Just arrived on ${streetName}`,
          });
          return;
        }
      }
      // Otherwise, we're waiting
      setCurrentInstruction({
        type: 'straight',
        streetName: null,
        distance: 0,
        description: 'Waiting for next move...',
      });
      return;
    }

    // Get the edge we're about to traverse (from current position to next)
    const nextEdge = getEdgeBetween(nodes, edges, plow.currentNodeId, nextNodeId);
    if (!nextEdge) {
      // Debug: log what we're looking for
      console.log('Edge lookup failed:', {
        fromId: plow.currentNodeId,
        toId: nextNodeId,
        history: movementHistory,
        totalEdges: edges.length,
        matchingEdges: edges.filter(e => 
          e.from_node === plow.currentNodeId || e.to_node === plow.currentNodeId ||
          e.from_node === nextNodeId || e.to_node === nextNodeId
        ).slice(0, 5).map(e => ({ 
          id: e.id, 
          from: e.from_node, 
          to: e.to_node,
        })),
      });
      setCurrentInstruction({
        type: 'straight',
        streetName: null,
        distance: 0,
        description: `No edge found`,
      });
      return;
    }

    // Determine if this is a turn or straight
    if (movementHistory.length >= 1) {
      const prevNodeId = movementHistory[movementHistory.length - 1];
      const prevNode = nodes.find(n => n.id === prevNodeId);
      
      if (prevNode) {
        const angle = calculateTurnAngle(prevNode, currentNode, nextNode);
        const turnType = getTurnDirection(angle);
        
        const streetName = nextEdge.streetName || 'unnamed street';
        const distance = nextEdge.length;
        
        let description = '';
        if (turnType === 'straight') {
          description = `Continue straight on ${streetName}`;
        } else if (turnType === 'turn-left') {
          description = `Turn left onto ${streetName}`;
        } else {
          description = `Turn right onto ${streetName}`;
        }
        
        setCurrentInstruction({
          type: turnType,
          streetName: nextEdge.streetName,
          distance,
          description,
        });
        return;
      }
    }

    // If no history, just show the street name and distance
    const streetName = nextEdge.streetName || 'unnamed street';
    setCurrentInstruction({
      type: 'straight',
      streetName: nextEdge.streetName,
      distance: nextEdge.length,
      description: `Head on ${streetName}`,
    });
  }, [plow.currentNodeId, nextNodeId, nodes, edges, movementHistory]);

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

  // Format distance
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(2)}km`;
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-xs border-2 border-blue-500 z-[1001]">
      <div className="flex items-start gap-3">
        <div className="text-5xl flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg text-gray-900 leading-tight">
            {currentInstruction.description}
          </div>
          {currentInstruction.distance > 0 && (
            <div className="text-sm text-gray-500 mt-2 font-medium">
              Distance: {formatDistance(currentInstruction.distance)}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-400 italic">
        Driver Navigation
      </div>
    </div>
  );
}

