import os
from typing import Optional
from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env
from app.rl_env.landing_env import LandingEnv


class PPOAgent:
    """PPO Agent wrapper for training and inference"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or "models/ppo_landing.zip"
        self.model: Optional[PPO] = None
        self.env = None
        
    def create_env(self):
        """Create a new environment instance"""
        return LandingEnv()
    
    def train(self, total_timesteps: int = 100000):
        """Train the PPO agent"""
        # Create vectorized environment
        self.env = make_vec_env(LandingEnv, n_envs=1)
        
        # Create or load model
        if os.path.exists(self.model_path):
            self.model = PPO.load(self.model_path, env=self.env)
            print(f"Loaded existing model from {self.model_path}")
        else:
            self.model = PPO(
                "MlpPolicy",
                self.env,
                verbose=1,
                learning_rate=3e-4,
                n_steps=2048,
                batch_size=64,
                n_epochs=10,
                gamma=0.99,
                gae_lambda=0.95,
                clip_range=0.2,
                ent_coef=0.01,
            )
            print("Created new PPO model")
        
        # Train the model
        self.model.learn(total_timesteps=total_timesteps)
        
        # Save the model
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        self.model.save(self.model_path)
        print(f"Model saved to {self.model_path}")
    
    def predict(self, observation):
        """Predict action given observation"""
        if self.model is None:
            self.load()
        
        if self.model is None:
            # Return random action if no model available
            return [0.5, 0.0]
        
        action, _ = self.model.predict(observation, deterministic=True)
        return action
    
    def load(self):
        """Load model from file"""
        if os.path.exists(self.model_path):
            self.env = self.create_env()
            self.model = PPO.load(self.model_path, env=self.env)
            print(f"Loaded model from {self.model_path}")
        else:
            print(f"Model not found at {self.model_path}, using random actions")
            self.model = None
    
    def save(self):
        """Save model to file"""
        if self.model is not None:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            self.model.save(self.model_path)
            print(f"Model saved to {self.model_path}")
        else:
            print("No model to save")

