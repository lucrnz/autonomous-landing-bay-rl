"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ThrusterParticlesProps {
  position: [number, number, number];
  rotation: number;
  fuel: number;
  velocity: [number, number];
}

export default function ThrusterParticles({
  position,
  rotation,
  fuel,
  velocity,
}: ThrusterParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 100;

  // Initialize particle positions and velocities
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;

      velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 1] = -Math.random() * 2 - 1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      lifetimes[i] = Math.random();
      sizes[i] = Math.random() * 0.5 + 0.2;
    }

    return { positions, velocities, lifetimes, sizes };
  }, []);

  useFrame((state, delta) => {
    if (!particlesRef.current || fuel <= 0) return;

    const positions =
      particlesRef.current.geometry.attributes.position.array as Float32Array;
    const sizes =
      particlesRef.current.geometry.attributes.size.array as Float32Array;

    // Calculate thruster position in world space
    const thrusterOffset = new THREE.Vector3(0, -0.7, 0);
    thrusterOffset.applyAxisAngle(new THREE.Vector3(0, 0, 1), rotation);

    for (let i = 0; i < particleCount; i++) {
      particles.lifetimes[i] += delta * 2;

      if (particles.lifetimes[i] > 1) {
        // Reset particle
        positions[i * 3] = position[0] + thrusterOffset.x;
        positions[i * 3 + 1] = position[1] + thrusterOffset.y;
        positions[i * 3 + 2] = position[2] + thrusterOffset.z;

        // Random spread for particles
        const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.3;
        const spreadDistance = Math.random() * 0.3;

        particles.velocities[i * 3] =
          Math.sin(rotation + spreadAngle) * spreadDistance +
          (Math.random() - 0.5) * 0.2;
        particles.velocities[i * 3 + 1] = -Math.random() * 3 - 2;
        particles.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

        particles.lifetimes[i] = 0;
      } else {
        // Update particle position
        positions[i * 3] += particles.velocities[i * 3] * delta;
        positions[i * 3 + 1] += particles.velocities[i * 3 + 1] * delta;
        positions[i * 3 + 2] += particles.velocities[i * 3 + 2] * delta;

        // Fade out particle based on lifetime
        const life = particles.lifetimes[i];
        sizes[i] = particles.sizes[i] * (1 - life) * 2;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.geometry.attributes.size.needsUpdate = true;
  });

  if (fuel <= 0) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        color="#ff8800"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

