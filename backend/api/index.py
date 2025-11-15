"""
Vercel serverless function handler for FastAPI
"""
from mangum import Mangum

# Since Vercel deploys from backend/, we can import directly
# The main.py file will handle the import fallback internally
try:
    from main import app
except ImportError:
    # Fallback if main is not found (shouldn't happen)
    import sys
    import os
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sys.path.insert(0, backend_dir)
    from main import app

# Create ASGI handler for Vercel
handler = Mangum(app, lifespan="off")
