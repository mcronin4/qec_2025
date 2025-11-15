"""
Vercel serverless function handler for FastAPI
"""
import sys
import os

# Get the directory containing this file (api/)
api_dir = os.path.dirname(os.path.abspath(__file__))
# Get the parent directory (backend/)
backend_dir = os.path.dirname(api_dir)

# Add the backend directory to Python path
# This allows us to import from backend.main, backend.models, etc.
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Also add parent directory in case backend is a subdirectory
parent_dir = os.path.dirname(backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Debug: print paths for troubleshooting
print(f"Python path: {sys.path}")
print(f"API dir: {api_dir}")
print(f"Backend dir: {backend_dir}")
print(f"Parent dir: {parent_dir}")

# Try to import - this will show us what's available
try:
    from backend.main import app
    print("Successfully imported from backend.main")
except ImportError as e:
    print(f"Failed to import from backend.main: {e}")
    # Try alternative import
    try:
        # If backend is the root, try importing main directly
        sys.path.insert(0, backend_dir)
        import main
        app = main.app
        print("Successfully imported from main directly")
    except ImportError as e2:
        print(f"Failed to import from main: {e2}")
        raise

from mangum import Mangum

# Create ASGI handler for Vercel
handler = Mangum(app, lifespan="off")
