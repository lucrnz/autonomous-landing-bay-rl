"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import Rocket3D from "./Rocket3D";
import Terrain3D from "./Terrain3D";
import ThrusterParticles from "./ThrusterParticles";

interface SimulationState {
  altitude: number;
  x: number;
  velocity: [number, number];
  tilt: number;
  angular_velocity: number;
  fuel: number;
  pad_x: number;
  time: number;
}

interface SceneProps {
  state: SimulationState | null;
}

export default function Scene({ state }: SceneProps) {
  const { camera } = useThree();
  const targetCameraPosition = useRef(new THREE.Vector3(0, 30, 60));

  // Scale factors to match the original 2D canvas scaling
  const maxAltitude = 500;
  const maxHorizontal = 200;

  // Convert simulation coordinates to 3D scene coordinates
  const rocket3DPosition: [number, number, number] = useMemo(() => {
    if (!state) return [0, 0, 0];
    // Scale x position to match scene
    const x = (state.x / maxHorizontal) * 100;
    // Use altitude directly as y position
    const y = (state.altitude / maxAltitude) * 100;
    return [x, y, 0];
  }, [state]);

  const pad3DX = useMemo(() => {
    if (!state) return 0;
    return (state.pad_x / maxHorizontal) * 100;
  }, [state]);

  // Smooth camera following
  useFrame(() => {
    if (!state || state.altitude <= 0) {
      // Default camera position when no state or rocket is on ground
      targetCameraPosition.current.set(0, 30, 60);
    } else {
      // Follow the rocket
      const rocketX = rocket3DPosition[0];
      const rocketY = rocket3DPosition[1];

      // Camera follows rocket but maintains a good viewing distance
      targetCameraPosition.current.set(
        rocketX * 0.3, // Follow x movement partially
        rocketY * 0.5 + 25, // Follow altitude with offset
        60 // Fixed distance from scene
      );
    }

    // Smoothly interpolate camera position
    camera.position.lerp(targetCameraPosition.current, 0.05);
    camera.lookAt(rocket3DPosition[0], rocket3DPosition[1] * 0.5, 0);
  });

  if (!state) {
    return (
      <group>
        <Terrain3D padX={0} />
      </group>
    );
  }

  return (
    <group>
      {/* Terrain with landing pad */}
      <Terrain3D padX={pad3DX} />

      {/* Rocket */}
      {state.altitude > 0 && (
        <>
          <Rocket3D
            position={rocket3DPosition}
            rotation={state.tilt}
            velocity={state.velocity}
            fuel={state.fuel}
          />

          {/* Thruster particles */}
          <ThrusterParticles
            position={rocket3DPosition}
            rotation={state.tilt}
            fuel={state.fuel}
            velocity={state.velocity}
          />

          {/* Velocity vector visualization */}
          <VelocityVector
            position={rocket3DPosition}
            velocity={state.velocity}
          />
        </>
      )}
    </group>
  );
}

// Helper component for velocity vector
function VelocityVector({
  position,
  velocity,
}: {
  position: [number, number, number];
  velocity: [number, number];
}) {
  const velocityMagnitude = Math.sqrt(
    velocity[0] * velocity[0] + velocity[1] * velocity[1]
  );

  // Only show velocity vector if it's significant
  if (velocityMagnitude < 0.5) return null;

  // Scale velocity for visualization
  const scale = 5;
  const endX = position[0] + velocity[0] * scale;
  const endY = position[1] - velocity[1] * scale; // Negative because y-velocity is inverted

  // Create points for the line
  const points = [
    new THREE.Vector3(position[0], position[1], position[2]),
    new THREE.Vector3(endX, endY, position[2]),
  ];

  return (
    <group>
      {/* Velocity arrow line */}
      <Line points={points} color="#ff0000" lineWidth={3} />

      {/* Arrow head */}
      <mesh position={[endX, endY, position[2]]}>
        <coneGeometry args={[0.5, 1.5, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
    </group>
  );
}

