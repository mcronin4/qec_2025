import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Handle imports for both local development and Vercel deployment
# If backend is a package (local dev), import from backend.*
# If backend is the root (Vercel), import directly
try:
    from backend.models import NextNodeRequest, NextNodeResponse
    from backend.graph import GraphState
    from backend.policies import get_policy
except ImportError:
    # Fallback for Vercel deployment where backend is the root
    from models import NextNodeRequest, NextNodeResponse
    from graph import GraphState
    from policies import get_policy

# Load environment variables from .env file (if it exists)
load_dotenv()

app = FastAPI(
    title="Snow Plow Routing API",
    description="API for snow plow routing decisions using pluggable policies",
    version="1.0.0"
)

# Get allowed origins from environment variable
# Format: comma-separated list of URLs (e.g., "http://localhost:3000,https://your-app.vercel.app")
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

# Log allowed origins for debugging (remove in production if sensitive)
print(f"CORS allowed origins: {allowed_origins}")

# Add CORS middleware to allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Snow Plow Routing API"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/next_node", response_model=NextNodeResponse)
async def next_node(request: NextNodeRequest) -> NextNodeResponse:
    """
    Determine the next node for a snow plow to move toward.
    
    This endpoint receives the current plow state, graph structure, and optional context,
    then uses the specified policy to choose the next node.
    
    Args:
        request: NextNodeRequest containing plow state, nodes, edges, context, and policy
        
    Returns:
        NextNodeResponse with target_node_id and debug_info
        
    Raises:
        HTTPException: 400 for invalid policy, 404 for node not found, 422 for graph errors
    """
    try:
        # Build GraphState from request
        graph = GraphState(nodes=request.nodes, edges=request.edges)
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid graph structure: {str(e)}"
        )
    
    # Verify plow's current node exists in the graph
    if not graph.has_node(request.plow.current_node_id):
        raise HTTPException(
            status_code=404,
            detail=f"Plow's current node '{request.plow.current_node_id}' not found in graph"
        )
    
    # Get the policy
    try:
        policy = get_policy(request.policy)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    
    # Call policy to choose next node
    try:
        target_node_id, debug_info = policy.choose_next_node(
            graph=graph,
            plow=request.plow,
            context=request.context
        )
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail=f"Policy decision error: {str(e)}"
        )
    except KeyError as e:
        raise HTTPException(
            status_code=404,
            detail=f"Node not found: {str(e)}"
        )
    
    return NextNodeResponse(
        target_node_id=target_node_id,
        debug_info=debug_info
    )
