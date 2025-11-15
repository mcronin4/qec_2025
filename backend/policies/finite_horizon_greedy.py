"""Finite horizon greedy policy for snow plow routing."""

from typing import Dict, Tuple, List, Set

from backend.policies.base import BasePolicy
from backend.graph import GraphState
from backend.models import PlowState, DecisionContext, Edge


class FiniteHorizonGreedyPolicy(BasePolicy):
    """
    A policy that uses depth-first search to find the path with the best
    reward-to-time ratio within a finite time horizon.
    
    The algorithm explores all possible paths from the current node that fit
    within the time budget (T_max), and selects the next node on the path
    that maximizes total_reward / total_time.
    """
    
    def __init__(self, T_max: float = 10.0, default_snow: float = 1.0, default_importance: float = 1.0):
        """
        Initialize the finite horizon greedy policy.
        
        Args:
            T_max: Maximum time horizon for path exploration
            default_snow: Default snow amount for edges (if not provided in context)
            default_importance: Default importance for edges (if not provided in context)
        """
        self.T_max = T_max
        self.default_snow = default_snow
        self.default_importance = default_importance
    
    def choose_next_node(
        self,
        graph: GraphState,
        plow: PlowState,
        context: DecisionContext | None
    ) -> Tuple[str, Dict]:
        """
        Choose the next node using finite horizon greedy algorithm.
        
        Args:
            graph: The graph state containing nodes and edges
            plow: The current plow state
            context: Optional decision context (can contain edge attributes)
            
        Returns:
            A tuple of (target_node_id, debug_info_dict)
            
        Raises:
            ValueError: If the current node has no neighbors
        """
        start_node = plow.current_node_id
        
        # Build neighbor structure and extract edge attributes
        neighbors_map, edge_map, time_map, snow_map, importance_map = self._build_graph_data(graph, context)
        
        # Check if we have any neighbors
        if not neighbors_map.get(start_node):
            raise ValueError(f"Node {start_node} has no neighbors")
        
        # Run the finite horizon greedy algorithm
        best_ratio, best_path = self._best_path_ratio(
            start_node,
            self.T_max,
            neighbors_map,
            time_map,
            snow_map,
            importance_map
        )
        
        # The next node is the second node in the best path (first is current node)
        if len(best_path) < 2:
            # Fallback: if no good path found, just pick first neighbor
            next_node = neighbors_map[start_node][0][0]
        else:
            next_node = best_path[1]
        
        # Build debug info
        debug_info = {
            "policy": "finite_horizon_greedy",
            "current_node": start_node,
            "next_node": next_node,
            "best_path": best_path,
            "best_ratio": best_ratio,
            "T_max": self.T_max,
            "path_length": len(best_path)
        }
        
        return next_node, debug_info
    
    def _build_graph_data(
        self,
        graph: GraphState,
        context: DecisionContext | None
    ) -> Tuple[Dict[str, List[Tuple[str, str]]], Dict, Dict[str, float], Dict[str, float], Dict[str, float]]:
        """
        Build the data structures needed for the algorithm from the graph.
        
        Returns:
            A tuple of (neighbors_map, edge_map, time_map, snow_map, importance_map)
            - neighbors_map: Dict[node_id, List[Tuple[neighbor_id, edge_id]]]
            - edge_map: Dict mapping (from_node, to_node) to edge_id
            - time_map: Dict[edge_id, time]
            - snow_map: Dict[edge_id, snow_amount]
            - importance_map: Dict[edge_id, importance]
        """
        neighbors_map: Dict[str, List[Tuple[str, str]]] = {}
        edge_map: Dict[Tuple[str, str], str] = {}
        time_map: Dict[str, float] = {}
        snow_map: Dict[str, float] = {}
        importance_map: Dict[str, float] = {}
        
        # Get all edges from the graph by accessing the internal structure
        # Note: This is a bit hacky, but we need access to edges
        # In a production system, we'd add a get_edges() method to GraphState
        edges = self._get_edges_from_graph(graph)
        
        for edge in edges:
            # Use edge travel_time for path planning
            time_map[edge.id] = edge.travel_time
            
            # Use actual snow depth from edge (defensive against negative values)
            snow_map[edge.id] = max(0.0, edge.snow_depth)
            
            # Use default importance (could be extended to come from edge attributes)
            importance_map[edge.id] = self.default_importance
            
            # Build bidirectional neighbor map (undirected graph)
            if edge.from_node not in neighbors_map:
                neighbors_map[edge.from_node] = []
            if edge.to_node not in neighbors_map:
                neighbors_map[edge.to_node] = []
            
            neighbors_map[edge.from_node].append((edge.to_node, edge.id))
            neighbors_map[edge.to_node].append((edge.from_node, edge.id))
            
            # Build edge lookup map
            edge_map[(edge.from_node, edge.to_node)] = edge.id
            edge_map[(edge.to_node, edge.from_node)] = edge.id
        
        return neighbors_map, edge_map, time_map, snow_map, importance_map
    
    def _get_edges_from_graph(self, graph: GraphState) -> List[Edge]:
        """
        Extract edges from the GraphState.
        """
        return graph.get_edges()
    
    def _best_path_ratio(
        self,
        start_node: str,
        T_max: float,
        neighbors: Dict[str, List[Tuple[str, str]]],
        time: Dict[str, float],
        snow: Dict[str, float],
        importance: Dict[str, float]
    ) -> Tuple[float, List[str]]:
        """
        Find the path with the best reward-to-time ratio using DFS.
        
        Args:
            start_node: The starting node ID
            T_max: Maximum time budget
            neighbors: Dict mapping node_id to List[(neighbor_id, edge_id)]
            time: Dict mapping edge_id to traversal time
            snow: Dict mapping edge_id to snow amount
            importance: Dict mapping edge_id to importance value
            
        Returns:
            A tuple of (best_ratio, best_path)
        """
        best_ratio = 0.0
        best_path = [start_node]
        
        def dfs(node: str, time_used: float, reward: float, used_edges: Set[str], path: List[str]):
            nonlocal best_ratio, best_path
            
            # Any non-empty path candidate can update the best ratio
            if time_used > 0:
                ratio = reward / time_used
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_path = path.copy()
            
            # If we have no budget left, stop
            if time_used >= T_max:
                return
            
            # Try extending the path by one more edge
            for (nbr, edge_id) in neighbors.get(node, []):
                t_e = time[edge_id]
                new_time = time_used + t_e
                
                if new_time > T_max:
                    continue  # exceeds horizon
                
                # Only get reward first time we traverse this edge
                if edge_id in used_edges:
                    extra_reward = 0.0
                else:
                    extra_reward = importance[edge_id] * snow[edge_id]
                
                # Recurse
                added = False
                if extra_reward > 0:
                    used_edges.add(edge_id)
                    added = True
                
                path.append(nbr)
                dfs(nbr, new_time, reward + extra_reward, used_edges, path)
                path.pop()
                
                if added:
                    used_edges.remove(edge_id)
        
        dfs(start_node, 0.0, 0.0, set(), [start_node])
        
        return best_ratio, best_path

