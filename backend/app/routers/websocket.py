import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Episode
from app.auth import verify_token
from app.env.landing_env import LandingEnv
from app.agent.ppo_agent import PPOAgent
import numpy as np
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


def convert_to_json_serializable(obj):
    """Recursively convert numpy types to Python native types for JSON serialization."""
    if isinstance(obj, np.bool):
        return bool(obj)
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.ndarray):
        return [convert_to_json_serializable(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_to_json_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [convert_to_json_serializable(item) for item in obj]
    else:
        return obj


@router.websocket("/ws/simulate")
async def websocket_endpoint(
    websocket: WebSocket,
):
    """WebSocket endpoint for simulation control"""
    
    # Extract token from Authorization header (priority) or query parameter
    token = None
    authorization = websocket.headers.get("authorization")
    
    if authorization:
        # Check Authorization header first
        if not authorization.startswith("Bearer "):
            logger.warning(f"Invalid authorization header format. Header: {authorization[:50]}...")
            await websocket.close(code=1008, reason="Invalid authorization header format. Expected 'Bearer <token>'")
            return
        token = authorization[7:]
        logger.debug(f"Extracted token from header. Token preview: {token[:10]}...{token[-10:]}")
    else:
        # Fall back to query parameter
        token = websocket.query_params.get("token")
        if token:
            logger.debug(f"Extracted token from query parameter. Token preview: {token[:10]}...{token[-10:]}")
    
    if not token:
        logger.warning("No Authorization header or token query parameter received")
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    # Verify JWT token
    payload = verify_token(token)
    if not payload:
        logger.warning(f"WebSocket token verification failed. Token preview: {token[:10]}...{token[-10:]}")
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    user_id = payload.get("sub")
    if not user_id:
        logger.warning(f"WebSocket token payload missing 'sub' field. Payload keys: {payload.keys()}")
        await websocket.close(code=1008, reason="Invalid token: missing user ID")
        return
    
    logger.info(f"WebSocket connection accepted for user_id: {user_id}")
    await websocket.accept()
    
    # Get database session
    db = next(get_db())
    
    env = None
    agent = None
    running = False
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "start":
                mode = data.get("mode", "auto")
                running = True
                
                # Initialize environment
                env = LandingEnv()
                obs, _ = env.reset()
                
                # Initialize agent based on mode
                if mode == "auto":
                    agent = PPOAgent()
                    try:
                        agent.load()
                    except:
                        agent = None  # Use random actions if no model
                
                # Start simulation loop
                if mode == "auto":
                    await run_auto_simulation(websocket, env, agent, user_id, db)
                elif mode == "train":
                    await run_train_simulation(websocket, env, user_id, db)
                elif mode == "manual":
                    await send_state_update(websocket, env)
                    running = True  # Wait for manual commands
                
            elif message_type == "action" and running and env is not None:
                # Manual mode: receive action from client
                if env is None:
                    await websocket.send_json({"type": "error", "message": "Environment not initialized"})
                    continue
                
                thrust = float(data.get("thrust", 0.5))
                angle = float(data.get("angle", 0.0))
                action = np.array([thrust, angle])
                
                obs, reward, terminated, truncated, info = env.step(action)
                
                await send_state_update(websocket, env)
                
                if terminated or truncated:
                    await handle_episode_end(websocket, env, info, user_id, db)
                    running = False
            
            elif message_type == "stop":
                running = False
                await websocket.send_json({"type": "stopped"})
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        db.close()


async def run_auto_simulation(websocket: WebSocket, env: LandingEnv, agent: PPOAgent, user_id: int, db: Session):
    """Run automatic simulation with agent"""
    obs, _ = env.reset()
    
    while True:
        # Get action from agent (or random if no agent)
        if agent and agent.model:
            action = agent.predict(obs)
        else:
            action = env.action_space.sample()
        
        obs, reward, terminated, truncated, info = env.step(action)
        
        # Send state update
        await send_state_update(websocket, env)
        
        # Small delay for visualization
        await asyncio.sleep(0.05)
        
        if terminated or truncated:
            await handle_episode_end(websocket, env, info, user_id, db)
            break


async def run_train_simulation(websocket: WebSocket, env: LandingEnv, user_id: int, db: Session):
    """Run training simulation (placeholder - sends mock training events)"""
    obs, _ = env.reset()
    episode = 0
    
    while episode < 10:  # Simulate 10 training episodes
        # Random actions for demonstration
        action = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(action)
        
        await send_state_update(websocket, env)
        await asyncio.sleep(0.05)
        
        if terminated or truncated:
            episode += 1
            await websocket.send_json({
                "type": "training",
                "episode": episode,
                "reward": float(info.get("reward", 0))
            })
            obs, _ = env.reset()
            
            if episode >= 10:
                await websocket.send_json({
                    "type": "training_complete",
                    "message": "Training simulation complete"
                })
                break


async def send_state_update(websocket: WebSocket, env: LandingEnv):
    """Send current state to client"""
    state = env.get_state_dict()
    await websocket.send_json({
        "type": "state",
        **state
    })


async def handle_episode_end(websocket: WebSocket, env: LandingEnv, info: dict, user_id: int, db: Session):
    """Handle episode completion and save to database"""
    success = info.get("success", False)
    fuel_used = info.get("fuel_used", 0.0)
    trajectory = info.get("trajectory", [])
    
    # Calculate landing accuracy (distance from pad at landing)
    if trajectory:
        last_state = trajectory[-1]["state"]
        pad_x = last_state.get("pad_x", 0)
        x = last_state.get("x", 0)
        landing_accuracy = 1.0 / (1.0 + abs(x - pad_x))  # Inverse distance, max 1.0
    else:
        landing_accuracy = 0.0
    
    # Save episode to database
    episode = Episode(
        user_id=user_id,
        success=success,
        fuel_used=fuel_used,
        landing_accuracy=landing_accuracy,
        trajectory_data=trajectory
    )
    db.add(episode)
    db.commit()
    
    # Send result to client
    result_data = {
        "type": "result",
        "success": success,
        "fuel_used": fuel_used,
        "landing_accuracy": landing_accuracy
    }
    await websocket.send_json(convert_to_json_serializable(result_data))

