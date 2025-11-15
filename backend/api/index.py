"""
Vercel serverless function handler for FastAPI
"""
import sys
import os
import traceback

# Debug: Print current directory and Python path
print(f"Current working directory: {os.getcwd()}")
print(f"Python path: {sys.path}")
print(f"Files in current directory: {os.listdir('.')}")

try:
    # Since Vercel deploys from backend/, we can import directly
    print("Attempting to import main...")
    from main import app
    print("Successfully imported app from main")
except ImportError as e:
    print(f"Failed to import from main: {e}")
    print(f"Traceback: {traceback.format_exc()}")
    # Try alternative path
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        print(f"Trying to add {backend_dir} to path")
        if backend_dir not in sys.path:
            sys.path.insert(0, backend_dir)
        from main import app
        print("Successfully imported app after adding path")
    except ImportError as e2:
        print(f"Failed again: {e2}")
        print(f"Traceback: {traceback.format_exc()}")
        raise

try:
    from mangum import Mangum
    print("Successfully imported Mangum")
except ImportError as e:
    print(f"Failed to import Mangum: {e}")
    print(f"Traceback: {traceback.format_exc()}")
    raise

# Create ASGI handler for Vercel
try:
    handler = Mangum(app, lifespan="off")
    print("Successfully created Mangum handler")
except Exception as e:
    print(f"Failed to create Mangum handler: {e}")
    print(f"Traceback: {traceback.format_exc()}")
    raise

print("API handler initialized successfully")
