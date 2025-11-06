from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, episodes, websocket
import logging
import os
from dotenv import load_dotenv
from datetime import datetime, timezone

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Autonomous Landing Bay RL Environment")

# CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests, especially useful for debugging CORS preflight"""
    method = request.method
    url = str(request.url)
    headers = dict(request.headers)
    
    # Log authorization header preview if present
    auth_header = headers.get("authorization", "Not present")
    if auth_header != "Not present":
        auth_preview = auth_header[:30] + "..." if len(auth_header) > 30 else auth_header
        logger.info(f"{method} {url} - Authorization: {auth_preview}")
    else:
        logger.info(f"{method} {url} - No Authorization header")
    
    # Log CORS preflight requests explicitly
    if method == "OPTIONS":
        logger.info(f"CORS preflight request: {url}")
        origin = headers.get("origin", "Not present")
        access_control_request_method = headers.get("access-control-request-method", "Not present")
        access_control_request_headers = headers.get("access-control-request-headers", "Not present")
        logger.info(f"  Origin: {origin}")
        logger.info(f"  Access-Control-Request-Method: {access_control_request_method}")
        logger.info(f"  Access-Control-Request-Headers: {access_control_request_headers}")
    
    response = await call_next(request)
    logger.info(f"{method} {url} - Status: {response.status_code}")
    return response

# Include routers
app.include_router(auth.router)
app.include_router(episodes.router)
app.include_router(websocket.router)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

