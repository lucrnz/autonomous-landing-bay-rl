"use client";

import { useState, useEffect, useRef } from "react";
import { env } from "@/env";

const getWebSocketUrl = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;

  return `${protocol}//${host}${env.NEXT_PUBLIC_BASE_PATH}api/ws`;
};

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

export function useSimulation(
  onResult?: (result: {
    success: boolean;
    fuel_used: number;
    landing_accuracy: number;
  }) => void
) {
  const [state, setState] = useState<SimulationState | null>(null);
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  const [isProxyConnected, setIsProxyConnected] = useState(false);
  const [mode, setMode] = useState<"auto" | "train" | "manual" | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    fuel_used: number;
    landing_accuracy: number;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  /**
   * @returns Promise that resolves when the connection is established`
   */
  const connect = () =>
    new Promise<void>((resolve, reject) => {
      const wsUrl = getWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnectionOpen(true);
        setIsProxyConnected(false);
      };

      ws.onclose = () => {
        setIsConnectionOpen(false);
        setIsProxyConnected(false);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnectionOpen(false);
        setIsProxyConnected(false);
        reject(error);
      };

      ws.onmessage = async (event) => {
        console.log(event.data);
        // Event data is a blob UTF-8 encoded JSON string
        const jsonString =
          typeof event.data === "string"
            ? event.data
            : event.data instanceof Blob
            ? await event.data.text()
            : "";

        const message: Record<string, unknown> & { type: string } =
          JSON.parse(jsonString);

        switch (message.type) {
          case "proxy-connected":
            {
              setIsProxyConnected(true);
              clearTimeout(timeout);
              resolve();
            }
            break;
          case "state":
            {
              setState({
                altitude: message.altitude as number,
                x: message.x as number,
                velocity: message.velocity as [number, number],
                tilt: message.tilt as number,
                angular_velocity: message.angular_velocity as number,
                fuel: message.fuel as number,
                pad_x: message.pad_x as number,
                time: message.time as number,
              });
            }
            break;
          case "result":
            {
              const resultData = {
                success: message.success as boolean,
                fuel_used: message.fuel_used as number,
                landing_accuracy: message.landing_accuracy as number,
              };
              setResult(resultData);
              onResult?.(resultData);
            }
            break;
          case "error":
            {
              console.error("WebSocket error:", message.message);
              setIsConnectionOpen(false);
              setIsProxyConnected(false);
            }
            break;
          case "stopped":
            {
              setIsConnectionOpen(false);
              setIsProxyConnected(false);
              setMode(null);
            }
            break;
          default:
            {
              console.error("Unknown message type:", message.type);
            }
            break;
        }
      };

      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
        clearTimeout(timeout);
      }, 10000);
    });

  const start = async (simMode: "auto" | "train" | "manual") => {
    if (!isProxyConnected) {
      await connect();
    }

    wsRef.current?.send(JSON.stringify({ type: "start", mode: simMode }));
    setMode(simMode);
    setResult(null);
  };

  const sendAction = (thrust: number, angle: number) => {
    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      mode === "manual"
    ) {
      wsRef.current.send(
        JSON.stringify({
          type: "action",
          thrust,
          angle,
        })
      );
    }
  };

  const stop = () => {
    wsRef.current?.send(JSON.stringify({ type: "stop" }));
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    state,
    isConnected: isConnectionOpen && isProxyConnected,
    mode,
    result,
    start,
    sendAction,
    stop,
  };
}
