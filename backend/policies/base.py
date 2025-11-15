"""Base policy class for snow plow routing decisions."""

from abc import ABC, abstractmethod
from typing import Dict, Tuple

from backend.graph import GraphState
from backend.models import PlowState, DecisionContext


class BasePolicy(ABC):
    """Abstract base class for routing policies."""
    
    @abstractmethod
    def choose_next_node(
        self,
        graph: GraphState,
        plow: PlowState,
        context: DecisionContext | None
    ) -> Tuple[str, Dict]:
        """
        Choose the next node for the plow to move toward.
        
        Args:
            graph: The graph state containing nodes and edges
            plow: The current plow state
            context: Optional decision context (storm info, etc.)
            
        Returns:
            A tuple of (target_node_id, debug_info_dict)
            
        Raises:
            ValueError: If the current node has no neighbors or other decision errors
        """
        pass

