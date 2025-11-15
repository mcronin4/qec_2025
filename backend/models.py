"""Pydantic models for the snow plow routing API."""

from pydantic import BaseModel, Field


class Node(BaseModel):
    """Represents a node in the graph."""
    id: str
    x: float
    y: float


class Edge(BaseModel):
    """Represents an undirected edge in the graph."""
    id: str
    from_node: str
    to_node: str
    travel_time: float = Field(description="Time to traverse this edge")
    snow_depth: float = Field(default=0.0, description="Current snow amount on this edge")


class PlowState(BaseModel):
    """Represents the current state of a snow plow."""
    current_node_id: str


class DecisionContext(BaseModel):
    """Optional context information for decision making."""
    storm_center: tuple[float, float] | None = None
    radius: float | None = None
    intensity: float | None = None
    time: float | None = None


class NextNodeRequest(BaseModel):
    """Request model for the /next_node endpoint."""
    plow: PlowState
    nodes: list[Node]
    edges: list[Edge]
    context: DecisionContext | None = None
    policy: str = "naive"


class NextNodeResponse(BaseModel):
    """Response model for the /next_node endpoint."""
    target_node_id: str
    debug_info: dict | None = None

