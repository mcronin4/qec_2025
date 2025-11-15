"""High-traffic priority policy for snow plow routing.

This policy extends the finite horizon greedy approach by assigning higher
importance weights to commonly trafficked streets (main roads, downtown corridors).
"""

from typing import Dict, Tuple, List

# Handle imports for both local development and Vercel deployment
try:
    from backend.policies.finite_horizon_greedy import FiniteHorizonGreedyPolicy
    from backend.graph import GraphState
    from backend.models import PlowState, DecisionContext, Edge
except ImportError:
    from policies.finite_horizon_greedy import FiniteHorizonGreedyPolicy
    from graph import GraphState
    from models import PlowState, DecisionContext, Edge


# High-traffic streets that should be prioritized
HIGH_TRAFFIC_STREETS = {
    "Princess Street": 1.2,
    "Brock Street": 1.2,
    "Johnson Street": 1.2,
    "King Street": 1.2,
    "Queen Street": 1.2,
}


class HighTrafficPriorityPolicy(FiniteHorizonGreedyPolicy):
    """
    A policy that prioritizes high-traffic streets by assigning them higher
    importance weights in the reward calculation.
    
    This extends the finite horizon greedy policy with a simple modification:
    edges on designated high-traffic streets receive a 1.2x importance multiplier,
    making the algorithm prefer clearing these streets first when all else is equal.
    """
    
    def __init__(self, T_max: float = 60.0, default_snow: float = 1.0):
        """
        Initialize the high-traffic priority policy.
        
        Args:
            T_max: Maximum time horizon for path exploration
            default_snow: Default snow amount for edges (if not provided in context)
        """
        # Initialize parent with default_importance=1.0
        super().__init__(T_max=T_max, default_snow=default_snow, default_importance=1.0)
    
    def _build_graph_data(
        self,
        graph: GraphState,
        context: DecisionContext | None
    ) -> Tuple[Dict[str, List[Tuple[str, str]]], Dict, Dict[str, float], Dict[str, float], Dict[str, float], Dict[str, float]]:
        """
        Build graph data structures with importance weights for high-traffic streets.
        
        This overrides the parent method to inject street-specific importance values
        based on the HIGH_TRAFFIC_STREETS mapping.
        
        Returns:
            A tuple of (neighbors_map, edge_map, time_map, snow_map, importance_map, length_map)
        """
        # Get the base graph data from parent class
        neighbors_map, edge_map, time_map, snow_map, importance_map, length_map = \
            super()._build_graph_data(graph, context)
        
        # Override importance values for high-traffic streets
        edges = self._get_edges_from_graph(graph)
        for edge in edges:
            if edge.id in importance_map:
                # Check if this edge is on a high-traffic street
                if edge.streetName and edge.streetName in HIGH_TRAFFIC_STREETS:
                    importance_map[edge.id] = HIGH_TRAFFIC_STREETS[edge.streetName]
        
        return neighbors_map, edge_map, time_map, snow_map, importance_map, length_map
    
    def choose_next_node(
        self,
        graph: GraphState,
        plow: PlowState,
        context: DecisionContext | None
    ) -> Tuple[str, Dict]:
        """
        Choose the next node using finite horizon greedy with high-traffic priorities.
        
        Args:
            graph: The graph state containing nodes and edges
            plow: The current plow state
            context: Optional decision context
            
        Returns:
            A tuple of (target_node_id, debug_info_dict)
        """
        # Call parent implementation (which will use our overridden _build_graph_data)
        next_node, debug_info = super().choose_next_node(graph, plow, context)
        
        # Update debug info to indicate this is the high-traffic priority policy
        debug_info["policy"] = "high_traffic_priority"
        debug_info["high_traffic_streets"] = list(HIGH_TRAFFIC_STREETS.keys())
        
        return next_node, debug_info

