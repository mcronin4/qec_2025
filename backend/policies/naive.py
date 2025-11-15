"""Naive policy that randomly selects a neighbor."""

import random
from typing import Dict, Tuple

# Handle imports for both local development and Vercel deployment
try:
    from backend.policies.base import BasePolicy
    from backend.graph import GraphState
    from backend.models import PlowState, DecisionContext
except ImportError:
    from policies.base import BasePolicy
    from graph import GraphState
    from models import PlowState, DecisionContext


class NaivePolicy(BasePolicy):
    """A simple policy that randomly selects a neighboring node."""
    
    def choose_next_node(
        self,
        graph: GraphState,
        plow: PlowState,
        context: DecisionContext | None
    ) -> Tuple[str, Dict]:
        """
        Randomly choose a neighbor of the current node.
        
        Args:
            graph: The graph state containing nodes and edges
            plow: The current plow state
            context: Optional decision context (ignored by this policy)
            
        Returns:
            A tuple of (target_node_id, debug_info_dict)
            
        Raises:
            ValueError: If the current node has no neighbors
        """
        # Get neighbors of current node
        neighbors = graph.get_neighbors(plow.current_node_id)
        
        if not neighbors:
            raise ValueError(f"Node {plow.current_node_id} has no neighbors")
        
        # Randomly select a neighbor
        selected = random.choice(neighbors)
        
        # Build debug info
        debug_info = {
            "policy": "naive",
            "available_neighbors": neighbors,
            "selected": selected,
            "current_node": plow.current_node_id
        }
        
        return selected, debug_info

