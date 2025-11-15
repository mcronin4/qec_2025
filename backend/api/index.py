"""
Vercel serverless function handler for FastAPI
"""
import sys
import os

# Add the backend directory to the path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mangum import Mangum
from backend.main import app

# Create ASGI handler for Vercel
handler = Mangum(app, lifespan="off")
