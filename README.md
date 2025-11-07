# Autonomous Landing Bay RL Environment

A reinforcement learning environment for training agents to land a rocket on a moving landing pad. The project includes a physics-based simulation environment, PPO agent training capabilities, and a real-time 3D visualization dashboard.

## Disclaimer

This project is not intended for production use. It was created solely for demonstration and educational purposes to showcase my skills and experience as a full-stack software developer.

Use it at your own risk there are no guarantees of stability, security, or ongoing maintenance.

## Demo
🚀 You can just try out the app for yourself!

<https://demo.lucdev.net/landing-bay-rl>

## Features

- **Physics-based landing simulation**: Realistic rocket dynamics with gravity, thrust, fuel consumption, and angular momentum
- **Moving landing pad**: Sinusoidal movement pattern adds complexity to the landing challenge
- **PPO agent training**: Built-in Proximal Policy Optimization agent using Stable Baselines3
- **Real-time visualization**: 3D WebGL visualization using React Three Fiber
- **WebSocket streaming**: Live simulation state updates via WebSocket connections
- **Episode tracking**: Automatic logging and storage of training episodes with success metrics
- **Multiple control modes**: Automatic agent control, manual control, and training modes
- **User authentication**: JWT-based authentication system for multi-user support

## Tech Stack

### Backend
- **FastAPI**: REST API and WebSocket server
- **Stable Baselines3**: PPO reinforcement learning agent
- **Gymnasium**: RL environment interface
- **PyTorch**: Deep learning backend
- **SQLAlchemy**: Database ORM
- **SQLite**: Episodes and user data storage

### Frontend
- **Next.js 16**: React framework with App Router
- **React Three Fiber**: 3D rendering engine
- **Material-UI**: Component library
- **TailwindCSS**: Styling utility library
- **TanStack Query**: Data fetching and caching
- **WebSocket API**: Real-time communication

## Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- Poetry (for Python dependency management)
- pnpm (for Node.js dependency management)

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies using Poetry:
```bash
poetry install
```

3. The database will be automatically created on first run. The backend uses SQLite, so no additional database setup is required.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies using pnpm:
```bash
pnpm install
```

## Usage

### Starting the Backend

From the `backend` directory:
```bash
poetry run poe dev
```

The API server will start on `http://localhost:8000`. API documentation is available at `http://localhost:8000/docs`.

### Starting the Frontend

From the `frontend` directory:
```bash
pnpm dev
```

The frontend will start on `http://localhost:3000/landing-bay-rl/`.

### Training an Agent

The PPO agent can be trained programmatically. The agent will automatically save checkpoints to `backend/models/ppo_landing.zip`. If no model exists, the agent will use random actions.

### Testing with CLI

A CLI tool is available for testing WebSocket connections:
```bash
cd backend
poetry run python cli/test_simulation.py
```

This interactive tool allows you to test auto, manual, and training simulation modes.

## Environment Details

The landing environment simulates a rocket descending from orbit toward a moving landing pad. The physics model includes:

- **Gravity**: 9.81 m/s² downward acceleration
- **Thrust**: Variable magnitude (0-30N) and angle control
- **Fuel consumption**: Proportional to thrust magnitude
- **Angular dynamics**: Torque from thrust creates rotation
- **Landing pad movement**: Sinusoidal horizontal motion with 50m amplitude and 20s period

### Observation Space

The agent receives a 7-dimensional observation vector:
- Altitude (0-500m)
- Horizontal velocity (vx, -50 to 50 m/s)
- Vertical velocity (vy, -50 to 50 m/s)
- Tilt angle (-π to π radians)
- Angular velocity (-5 to 5 rad/s)
- Fuel remaining (0-100 units)
- Landing pad horizontal position (-200 to 200m)

### Action Space

The agent controls:
- Thrust magnitude (0.0 to 1.0, normalized)
- Thrust angle (-1.0 to 1.0, normalized relative to rocket orientation)

### Success Criteria

A successful landing requires:
- Landing within 5m radius of the pad center
- Vertical velocity below 2 m/s
- Tilt angle within 0.1 radians (~6 degrees) of vertical

## License
[MIT License](./LICENSE)
