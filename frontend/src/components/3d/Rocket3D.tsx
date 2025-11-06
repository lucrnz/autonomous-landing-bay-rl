"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Rocket3DProps {
  position: [number, number, number];
  rotation: number;
  velocity: [number, number];
  fuel: number;
}

export default function Rocket3D({
  position,
  rotation,
  velocity,
  fuel,
}: Rocket3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Smooth animation interpolation
  useFrame(() => {
    if (groupRef.current) {
      // Smoothly interpolate position
      groupRef.current.position.lerp(
        new THREE.Vector3(position[0], position[1], position[2]),
        0.3
      );
      // Smoothly interpolate rotation
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        rotation,
        0.3
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main rocket body - cone shape */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <coneGeometry args={[0.8, 3, 8]} />
        <meshStandardMaterial
          color="#e0e0e0"
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Rocket nose cone */}
      <mesh castShadow position={[0, 3.2, 0]}>
        <coneGeometry args={[0.8, 1.2, 8]} />
        <meshStandardMaterial color="#ff4444" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Rocket fins */}
      {[0, 90, 180, 270].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh
            key={i}
            castShadow
            position={[Math.cos(rad) * 0.8, 0.2, Math.sin(rad) * 0.8]}
            rotation={[0, rad, 0]}
          >
            <boxGeometry args={[0.1, 1.2, 0.8]} />
            <meshStandardMaterial
              color="#333333"
              metalness={0.5}
              roughness={0.5}
            />
          </mesh>
        );
      })}

      {/* Engine nozzle */}
      <mesh castShadow position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.5, 0.3, 0.8, 8]} />
        <meshStandardMaterial
          color="#1a1a1a"
          metalness={0.9}
          roughness={0.2}
          emissive="#ff6600"
          emissiveIntensity={fuel > 0 ? 0.3 : 0}
        />
      </mesh>

      {/* Engine glow when fuel is present */}
      {fuel > 0 && (
        <pointLight
          position={[0, -0.5, 0]}
          color="#ff8800"
          intensity={2}
          distance={5}
        />
      )}

      {/* Window/viewport */}
      <mesh castShadow position={[0, 2.5, 0.75]}>
        <circleGeometry args={[0.3, 16]} />
        <meshStandardMaterial
          color="#4488ff"
          metalness={0.9}
          roughness={0.1}
          emissive="#2266dd"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Racing stripes */}
      <mesh castShadow position={[0, 1.5, 0.81]}>
        <boxGeometry args={[0.15, 2.5, 0.01]} />
        <meshStandardMaterial color="#ff0000" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 1.5, -0.81]}>
        <boxGeometry args={[0.15, 2.5, 0.01]} />
        <meshStandardMaterial color="#0000ff" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

