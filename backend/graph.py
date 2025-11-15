"""GraphState domain class for managing graph structure and queries."""

from typing import Dict, List
from backend.models import Node, Edge


class GraphState:
    """Domain class that manages graph structure and provides neighbor queries."""
    
    def __init__(self, nodes: List[Node], edges: List[Edge]):
        """
        Initialize the graph state with nodes and edges.
        
        Args:
            nodes: List of Node objects
            edges: List of Edge objects
            
        Raises:
            ValueError: If edges reference nodes that don't exist
        """
        # Store nodes in a dictionary for O(1) lookup
        self._nodes: Dict[str, Node] = {node.id: node for node in nodes}
        
        # Build adjacency map for undirected graph
        self._adjacency: Dict[str, List[str]] = {node.id: [] for node in nodes}
        
        # Validate edges and build adjacency map
        for edge in edges:
            if edge.from_node not in self._nodes:
                raise ValueError(f"Edge {edge.id} references non-existent node: {edge.from_node}")
            if edge.to_node not in self._nodes:
                raise ValueError(f"Edge {edge.id} references non-existent node: {edge.to_node}")
            
            # Add both directions since graph is undirected
            self._adjacency[edge.from_node].append(edge.to_node)
            self._adjacency[edge.to_node].append(edge.from_node)
    
    def get_neighbors(self, node_id: str) -> List[str]:
        """
        Get list of neighbor node IDs for a given node.
        
        Args:
            node_id: The ID of the node to get neighbors for
            
        Returns:
            List of neighbor node IDs
            
        Raises:
            KeyError: If node_id doesn't exist in the graph
        """
        if node_id not in self._adjacency:
            raise KeyError(f"Node {node_id} not found in graph")
        return self._adjacency[node_id]
    
    def get_node(self, node_id: str) -> Node:
        """
        Get a Node object by its ID.
        
        Args:
            node_id: The ID of the node to retrieve
            
        Returns:
            The Node object
            
        Raises:
            KeyError: If node_id doesn't exist in the graph
        """
        if node_id not in self._nodes:
            raise KeyError(f"Node {node_id} not found in graph")
        return self._nodes[node_id]
    
    def has_node(self, node_id: str) -> bool:
        """
        Check if a node exists in the graph.
        
        Args:
            node_id: The ID of the node to check
            
        Returns:
            True if the node exists, False otherwise
        """
        return node_id in self._nodes

