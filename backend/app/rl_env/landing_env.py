import gymnasium as gym
from gymnasium import spaces
import numpy as np
from typing import Tuple, Dict, Any


class LandingEnv(gym.Env):
    """
    Autonomous Landing Bay RL Environment
    
    A rocket descends from orbit toward a moving landing pad.
    Goal: Land softly and upright before fuel runs out.
    """
    
    metadata = {"render_modes": ["human"], "render_fps": 30}
    
    def __init__(self):
        super().__init__()
        
        # Environment parameters
        self.gravity = 9.81  # m/s^2
        self.max_thrust = 30.0  # N
        self.max_fuel = 100.0  # fuel units
        self.mass = 1000.0  # kg
        self.moment_of_inertia = 1000.0  # kg*m^2
        
        # Landing pad parameters (sinusoidal movement)
        self.pad_amplitude = 50.0  # m
        self.pad_period = 20.0  # seconds
        
        # World boundaries
        self.max_altitude = 500.0  # m
        self.max_horizontal = 200.0  # m
        
        # Landing criteria
        self.max_landing_velocity = 2.0  # m/s
        self.max_landing_tilt = 0.1  # radians (~6 degrees)
        self.landing_radius = 5.0  # m
        
        # Observation space: [altitude, vx, vy, tilt, angular_velocity, fuel, pad_x]
        self.observation_space = spaces.Box(
            low=np.array([0, -50, -50, -np.pi, -5, 0, -self.max_horizontal]),
            high=np.array([self.max_altitude, 50, 50, np.pi, 5, self.max_fuel, self.max_horizontal]),
            dtype=np.float32
        )
        
        # Action space: [thrust_magnitude (0-1), thrust_angle (-1 to 1)]
        self.action_space = spaces.Box(
            low=np.array([0.0, -1.0]),
            high=np.array([1.0, 1.0]),
            dtype=np.float32
        )
        
        # State variables
        self.altitude = 0.0
        self.x = 0.0
        self.vx = 0.0
        self.vy = 0.0
        self.tilt = 0.0
        self.angular_velocity = 0.0
        self.fuel = 0.0
        self.pad_x = 0.0
        self.time = 0.0
        
        # Episode tracking
        self.trajectory = []
        
    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        
        # Random initial state
        self.altitude = self.np_random.uniform(200, self.max_altitude)
        self.x = self.np_random.uniform(-self.max_horizontal * 0.5, self.max_horizontal * 0.5)
        self.vx = self.np_random.uniform(-10, 10)
        self.vy = self.np_random.uniform(-5, 0)
        self.tilt = self.np_random.uniform(-0.5, 0.5)
        self.angular_velocity = self.np_random.uniform(-0.5, 0.5)
        self.fuel = self.max_fuel
        self.pad_x = 0.0
        self.time = 0.0
        self.trajectory = []
        
        observation = self._get_observation()
        info = {}
        
        return observation, info
    
    def step(self, action):
        dt = 0.1  # timestep in seconds
        
        # Parse action
        thrust_magnitude = np.clip(action[0], 0.0, 1.0)
        thrust_angle = np.clip(action[1], -1.0, 1.0)
        
        # Calculate thrust force
        thrust = thrust_magnitude * self.max_thrust
        
        # Fuel consumption
        fuel_consumed = thrust_magnitude * dt * 0.5  # proportional to thrust
        self.fuel = max(0.0, self.fuel - fuel_consumed)
        
        # Apply thrust only if fuel available
        if self.fuel > 0:
            # Thrust direction relative to rocket orientation
            thrust_x = thrust * np.sin(self.tilt + thrust_angle * 0.5)
            thrust_y = thrust * np.cos(self.tilt + thrust_angle * 0.5)
            
            # Forces
            fx = thrust_x
            fy = thrust_y - self.gravity * self.mass
            
            # Torque (thrust creates rotation)
            torque = thrust_x * 0.1 * thrust_angle  # simplified model
            
            # Update velocities
            self.vx += (fx / self.mass) * dt
            self.vy += (fy / self.mass) * dt
            self.angular_velocity += (torque / self.moment_of_inertia) * dt
        
        else:
            # No fuel - only gravity
            fx = 0.0
            fy = -self.gravity * self.mass
            torque = 0.0
            
            self.vx += (fx / self.mass) * dt
            self.vy += (fy / self.mass) * dt
            self.angular_velocity *= 0.99  # damping
        
        # Update position and orientation
        self.x += self.vx * dt
        self.altitude += self.vy * dt
        self.tilt += self.angular_velocity * dt
        
        # Normalize tilt to [-pi, pi]
        self.tilt = np.arctan2(np.sin(self.tilt), np.cos(self.tilt))
        
        # Update landing pad position (sinusoidal)
        self.pad_x = self.pad_amplitude * np.sin(2 * np.pi * self.time / self.pad_period)
        self.time += dt
        
        # Calculate reward
        reward = self._calculate_reward(thrust_magnitude)
        
        # Check termination conditions
        terminated = False
        truncated = False
        
        # Check if landed
        if self.altitude <= 0:
            distance_to_pad = abs(self.x - self.pad_x)
            velocity_magnitude = np.sqrt(self.vx**2 + self.vy**2)
            
            if (distance_to_pad < self.landing_radius and 
                velocity_magnitude < self.max_landing_velocity and 
                abs(self.tilt) < self.max_landing_tilt):
                terminated = True
            else:
                terminated = True  # Crashed
        
        # Check out of bounds
        if (self.altitude < 0 or 
            abs(self.x) > self.max_horizontal or 
            self.altitude > self.max_altitude):
            truncated = True
        
        # Check fuel depletion
        if self.fuel <= 0 and self.altitude > 0:
            truncated = True
        
        # Store trajectory
        state = {
            'altitude': float(self.altitude),
            'x': float(self.x),
            'vx': float(self.vx),
            'vy': float(self.vy),
            'tilt': float(self.tilt),
            'angular_velocity': float(self.angular_velocity),
            'fuel': float(self.fuel),
            'pad_x': float(self.pad_x),
            'time': float(self.time)
        }
        self.trajectory.append({
            'state': state,
            'action': action.tolist(),
            'reward': float(reward)
        })
        
        observation = self._get_observation()
        info = {
            'success': terminated and self.altitude <= 0 and abs(self.tilt) < self.max_landing_tilt,
            'fuel_used': self.max_fuel - self.fuel,
            'trajectory': self.trajectory.copy()
        }
        
        return observation, reward, terminated, truncated, info
    
    def _get_observation(self):
        """Get current observation"""
        return np.array([
            self.altitude,
            self.vx,
            self.vy,
            self.tilt,
            self.angular_velocity,
            self.fuel,
            self.pad_x
        ], dtype=np.float32)
    
    def _calculate_reward(self, thrust_magnitude):
        """Calculate reward based on current state"""
        reward = 0.0
        
        # Fuel consumption penalty
        reward -= thrust_magnitude * 0.1
        
        # Distance to pad penalty
        distance_to_pad = abs(self.x - self.pad_x)
        reward -= distance_to_pad * 0.01
        
        # Velocity penalty
        velocity_magnitude = np.sqrt(self.vx**2 + self.vy**2)
        reward -= velocity_magnitude * 0.1
        
        # Tilt penalty
        reward -= abs(self.tilt) * 0.5
        
        # Landing bonus (if landed successfully)
        if self.altitude <= 0:
            distance_to_pad = abs(self.x - self.pad_x)
            velocity_magnitude = np.sqrt(self.vx**2 + self.vy**2)
            
            if (distance_to_pad < self.landing_radius and 
                velocity_magnitude < self.max_landing_velocity and 
                abs(self.tilt) < self.max_landing_tilt):
                reward += 1000.0  # Large success bonus
            else:
                reward -= 500.0  # Large crash penalty
        
        return reward
    
    def get_state_dict(self):
        """Get current state as dictionary for WebSocket transmission"""
        return {
            'altitude': float(self.altitude),
            'x': float(self.x),
            'velocity': [float(self.vx), float(self.vy)],
            'tilt': float(self.tilt),
            'angular_velocity': float(self.angular_velocity),
            'fuel': float(self.fuel),
            'pad_x': float(self.pad_x),
            'time': float(self.time)
        }

