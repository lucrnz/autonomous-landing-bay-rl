"use client";

import { Box } from "@mui/material";
import { Canvas } from "@react-three/fiber";
import Scene from "./3d/Scene";
import { Suspense } from "react";

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

interface SimulationCanvasProps {
  state: SimulationState | null;
}

// Placeholder component for SSR
function CanvasPlaceholder() {
  return (
    <div
      style={{
        width: "800px",
        height: "600px",
        backgroundColor: "#000011",
        border: "2px solid #333",
        borderRadius: "4px",
      }}
    />
  );
}

export default function SimulationCanvas({ state }: SimulationCanvasProps) {
  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        p: 2,
      }}
    >
      {/* 3D Canvas with SSR fallback */}
      <div
        style={{
          width: "800px",
          height: "600px",
          border: "2px solid #333",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <Suspense fallback={<CanvasPlaceholder />}>
          <Canvas
            camera={{ position: [0, 30, 60], fov: 60 }}
            shadows
            gl={{ antialias: true, alpha: false }}
            style={{ background: "#000011" }}
          >
            {/* Ambient lighting */}
            <ambientLight intensity={0.3} />

            {/* Main directional light with shadows */}
            <directionalLight
              position={[50, 100, 50]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-left={-100}
              shadow-camera-right={100}
              shadow-camera-top={100}
              shadow-camera-bottom={-100}
              shadow-camera-near={0.5}
              shadow-camera-far={500}
            />

            {/* Rim light for dramatic effect */}
            <directionalLight
              position={[-30, 20, -30]}
              intensity={0.3}
              color="#4488ff"
            />

            {/* Scene with all 3D objects */}
            <Scene state={state} />

            {/* Fog for depth */}
            <fog attach="fog" args={["#000011", 100, 300]} />
          </Canvas>
        </Suspense>
      </div>

      {/* HTML Overlays for UI elements */}
      {state && (
        <Box
          sx={{
            position: "absolute",
            top: 30,
            left: 30,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #333",
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#ffffff",
          }}
        >
          {/* Fuel bar */}
          <Box sx={{ mb: 1 }}>
            <div
              style={{ marginBottom: "4px", fontSize: "11px", opacity: 0.8 }}
            >
              FUEL
            </div>
            <div
              style={{
                width: "100px",
                height: "10px",
                backgroundColor: "#333333",
                border: "1px solid #ffffff",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${state.fuel}%`,
                  height: "100%",
                  backgroundColor:
                    state.fuel > 30
                      ? "#00ff00"
                      : state.fuel > 10
                      ? "#ffaa00"
                      : "#ff0000",
                  transition: "width 0.1s, background-color 0.3s",
                }}
              />
            </div>
          </Box>

          {/* Metrics */}
          <Box sx={{ mt: 1 }}>
            <div style={{ marginBottom: "2px" }}>
              <span style={{ opacity: 0.7 }}>ALT:</span>{" "}
              <span style={{ color: "#00ff88" }}>
                {state.altitude.toFixed(1)}m
              </span>
            </div>
            <div style={{ marginBottom: "2px" }}>
              <span style={{ opacity: 0.7 }}>VEL:</span>{" "}
              <span style={{ color: "#ff8800" }}>
                {Math.sqrt(
                  state.velocity[0] ** 2 + state.velocity[1] ** 2
                ).toFixed(2)}
                m/s
              </span>
            </div>
            <div style={{ marginBottom: "2px" }}>
              <span style={{ opacity: 0.7 }}>FUEL:</span>{" "}
              <span
                style={{
                  color:
                    state.fuel > 30
                      ? "#00ff00"
                      : state.fuel > 10
                      ? "#ffaa00"
                      : "#ff0000",
                }}
              >
                {state.fuel.toFixed(1)}%
              </span>
            </div>
            <div style={{ marginBottom: "2px" }}>
              <span style={{ opacity: 0.7 }}>TILT:</span>{" "}
              <span style={{ color: "#4488ff" }}>
                {((state.tilt * 180) / Math.PI).toFixed(1)}°
              </span>
            </div>
            <div
              style={{ marginBottom: "2px", fontSize: "10px", opacity: 0.6 }}
            >
              <span>X: {state.x.toFixed(1)}</span>
              {" | "}
              <span>PAD: {state.pad_x.toFixed(1)}</span>
            </div>
          </Box>
        </Box>
      )}

      {/* Status indicator when no state */}
      {!state && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#666",
            fontSize: "18px",
            fontFamily: "monospace",
            textAlign: "center",
          }}
        >
          AWAITING SIMULATION START
        </Box>
      )}
    </Box>
  );
}
