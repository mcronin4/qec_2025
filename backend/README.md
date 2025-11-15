# Snow Plow Routing API

A FastAPI backend that provides routing decisions for snow plow simulation using pluggable policy strategies.

## Architecture

The backend is organized into three layers:

- **API Layer** (`main.py`) - FastAPI endpoints and request/response handling
- **Domain Layer** (`models.py`, `graph.py`) - Core data structures and graph operations
- **Policy Layer** (`policies/`) - Decision-making strategies

## Running the Server

From the project root:

```bash
# Activate virtual environment
source backend/venv/bin/activate

# Start the server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The server will be available at `http://localhost:8000`

## API Documentation

Interactive API documentation is available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### POST `/next_node`

Determine the next node for a snow plow to move toward.

**Request Body:**
```json
{
  "plow": {
    "id": "plow1",
    "current_node_id": "A"
  },
  "nodes": [
    {"id": "A", "x": 0.0, "y": 0.0},
    {"id": "B", "x": 1.0, "y": 0.0}
  ],
  "edges": [
    {"id": "e1", "from_node": "A", "to_node": "B", "weight": 5.0}
  ],
  "context": {
    "storm_center": [0.5, 0.5],
    "radius": 2.0,
    "intensity": 7.5,
    "time": 1.0
  },
  "policy": "naive"
}
```

**Response:**
```json
{
  "target_node_id": "B",
  "debug_info": {
    "policy": "naive",
    "available_neighbors": ["B"],
    "selected": "B",
    "current_node": "A"
  }
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy"
}
```

## Available Policies

- **naive** - Randomly selects a neighboring node

## Adding New Policies

1. Create a new policy class in `backend/policies/` that inherits from `BasePolicy`
2. Implement the `choose_next_node()` method
3. Register the policy in `backend/policies/__init__.py` in the `POLICY_REGISTRY`

Example:

```python
# backend/policies/my_policy.py
from backend.policies.base import BasePolicy

class MyPolicy(BasePolicy):
    def choose_next_node(self, graph, plow, context):
        # Your logic here
        target = "some_node_id"
        debug_info = {"info": "value"}
        return target, debug_info
```

```python
# backend/policies/__init__.py
from backend.policies.my_policy import MyPolicy

POLICY_REGISTRY = {
    "naive": NaivePolicy(),
    "my_policy": MyPolicy(),  # Add your policy
}
```

## Edge Weight Agnosticism

The `weight` field on edges is intentionally agnostic - it can represent:
- Amount of snow to be cleared
- Road length/distance
- Traffic density
- Any other metric

Policies interpret the weight according to their own strategy. This allows for flexible future implementations without changing the core data models.

## Error Handling

The API provides clear error messages:
- **400** - Invalid policy name
- **404** - Node not found in graph
- **422** - Invalid graph structure or policy decision error

