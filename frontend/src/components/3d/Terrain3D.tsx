"use client";

import * as THREE from "three";

interface Terrain3DProps {
  padX: number;
}

export default function Terrain3D({ padX }: Terrain3DProps) {
  return (
    <group>
      {/* Ground plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial
          color="#1a1a2e"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Grid pattern on ground for depth perception */}
      <gridHelper
        args={[400, 40, "#2a2a4e", "#1a1a3e"]}
        position={[0, 0.01, 0]}
      />

      {/* Landing pad base */}
      <mesh receiveShadow position={[padX, 0.1, 0]}>
        <cylinderGeometry args={[4, 4, 0.2, 32]} />
        <meshStandardMaterial
          color="#00aa00"
          roughness={0.6}
          metalness={0.3}
          emissive="#00ff00"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Landing pad target rings */}
      <mesh position={[padX, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 3, 32]} />
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[padX, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2, 32]} />
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.5}
        />
      </mesh>
      <mesh position={[padX, 0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 1, 32]} />
        <meshStandardMaterial
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Center marker */}
      <mesh position={[padX, 0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Landing pad lights at corners */}
      {[
        [padX + 3, 0.5, 3],
        [padX + 3, 0.5, -3],
        [padX - 3, 0.5, 3],
        [padX - 3, 0.5, -3],
      ].map((pos, i) => (
        <group key={i}>
          <mesh position={pos as [number, number, number]}>
            <cylinderGeometry args={[0.2, 0.2, 1, 8]} />
            <meshStandardMaterial
              color="#ffaa00"
              emissive="#ffaa00"
              emissiveIntensity={1}
            />
          </mesh>
          <pointLight
            position={pos as [number, number, number]}
            color="#ffaa00"
            intensity={1}
            distance={10}
          />
        </group>
      ))}

      {/* Ambient terrain features - rocks */}
      {Array.from({ length: 15 }, (_, i) => {
        const angle = (i / 15) * Math.PI * 2;
        const distance = 30 + Math.random() * 60;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const size = 0.5 + Math.random() * 2;

        return (
          <mesh
            key={`rock-${i}`}
            castShadow
            position={[x, size / 2, z]}
            rotation={[
              Math.random() * 0.5,
              Math.random() * Math.PI * 2,
              Math.random() * 0.5,
            ]}
          >
            <dodecahedronGeometry args={[size, 0]} />
            <meshStandardMaterial
              color="#3a3a4a"
              roughness={0.9}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

