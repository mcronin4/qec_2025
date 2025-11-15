"""One-step greedy policy that chooses the adjacent edge with the highest snow reward."""

import random
from typing import Dict, Tuple, List

# Handle imports for both local development and Vercel deployment
try:
    from backend.policies.base import BasePolicy
    from backend.graph import GraphState
    from backend.models import PlowState, DecisionContext, Edge
except ImportError:
    from policies.base import BasePolicy
    from graph import GraphState
    from models import PlowState, DecisionContext, Edge


class OneStepGreedyPolicy(BasePolicy):
    """
    A simple greedy policy that chooses the adjacent edge with the highest snow reward.
    
    Reward is calculated as: snow_depth * length
    Does not consider time efficiency, importance, or look-ahead.
    Ties are broken randomly.
    """
    
    def choose_next_node(
        self,
        graph: GraphState,
        plow: PlowState,
        context: DecisionContext | None
    ) -> Tuple[str, Dict]:
        """
        Choose the neighbor connected by the edge with the highest snow reward.
        
        Args:
            graph: The graph state containing nodes and edges
            plow: The current plow state
            context: Optional decision context (ignored by this policy)
            
        Returns:
            A tuple of (target_node_id, debug_info_dict)
            
        Raises:
            ValueError: If the current node has no neighbors
        """
        current_node = plow.current_node_id
        
        # Get neighbors and their connecting edges
        neighbors = graph.get_neighbors(current_node)
        
        if not neighbors:
            raise ValueError(f"Node {current_node} has no neighbors")
        
        # Get all edges from the graph
        edges = graph.get_edges()
        
        # Build a map of edges for quick lookup
        edge_map = {}
        for edge in edges:
            edge_map[(edge.from_node, edge.to_node)] = edge
            edge_map[(edge.to_node, edge.from_node)] = edge
        
        # Calculate reward for each neighbor
        neighbor_rewards: List[Tuple[str, float, Edge]] = []
        for neighbor in neighbors:
            edge = edge_map.get((current_node, neighbor))
            if edge is None:
                # Shouldn't happen, but handle gracefully
                continue
            
            # Reward = snow_depth * length
            reward = edge.snow_depth * edge.length
            neighbor_rewards.append((neighbor, reward, edge))
        
        if not neighbor_rewards:
            raise ValueError(f"Node {current_node} has neighbors but no edges found")
        
        # Find the maximum reward
        max_reward = max(r for _, r, _ in neighbor_rewards)
        
        # Get all neighbors with the maximum reward (for tie-breaking)
        best_neighbors = [(n, r, e) for n, r, e in neighbor_rewards if r == max_reward]
        
        # Randomly select from the best neighbors (handles ties)
        selected_neighbor, selected_reward, selected_edge = random.choice(best_neighbors)
        
        # Build debug info
        debug_info = {
            "policy": "one_step_greedy",
            "current_node": current_node,
            "selected_neighbor": selected_neighbor,
            "selected_edge_id": selected_edge.id,
            "selected_reward": selected_reward,
            "max_reward": max_reward,
            "num_ties": len(best_neighbors),
            "all_neighbor_rewards": [
                {
                    "neighbor": n,
                    "reward": r,
                    "edge_id": e.id,
                    "snow_depth": e.snow_depth,
                    "length": e.length
                }
                for n, r, e in neighbor_rewards
            ]
        }
        
        return selected_neighbor, debug_info

