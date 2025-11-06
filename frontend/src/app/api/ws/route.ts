import { waitForSocketClientOpen } from "@/lib/ws";
import { StatusCodes } from "http-status-codes";
import { cookies } from "next/headers";
import { WebSocket } from "ws";
import { env } from "@/env";

// Convert HTTP/HTTPS URL to WebSocket URL
function getWebSocketUrl(baseUrl: string): string {
  return baseUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
}

export function GET() {
  const headers = new Headers();
  headers.set("Connection", "Upgrade");
  headers.set("Upgrade", "websocket");
  return new Response("Upgrade Required", {
    status: StatusCodes.UPGRADE_REQUIRED,
    headers,
  });
}

export async function UPGRADE(
  client: import("ws").WebSocket,
  _server: import("ws").WebSocketServer
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt_token")?.value;

  if (!token) {
    client.close();
    return;
  }

  const backendUrl = `${getWebSocketUrl(
    env.PYTHON_API_URL
  )}/ws/simulate?${new URLSearchParams({ token })}`;
  const backend = new WebSocket(backendUrl);

  backend.on("error", (error) => {
    console.error("[proxy] backend error:", error);
    client.close();
    return;
  });

  // Wait for backend and client to be open
  try {
    console.log("[proxy] waiting for backend and client to be open");
    await Promise.all([
      waitForSocketClientOpen(backend),
      waitForSocketClientOpen(client),
    ]);
  } catch (error) {
    console.error("[proxy] error:", error);
    client.close();
    backend.close();
    return;
  }

  console.log("[proxy] backend and client are open");

  client.on("message", (msg) => {
    console.log("[proxy] client -[msg]-> backend");
    // Convert Buffer/ArrayBuffer to UTF-8 string
    let message: string;
    if (Buffer.isBuffer(msg)) {
      message = msg.toString("utf-8");
    } else if (Array.isArray(msg)) {
      // Handle array of Buffers
      message = Buffer.concat(msg).toString("utf-8");
    } else {
      message = msg.toString();
    }
    backend.send(message);
  });

  client.on("close", () => {
    console.log("[proxy] client closed");
    backend.close();
  });

  backend.on("message", (msg) => {
    console.log("[proxy] backend -[msg]-> client");
    // Convert Buffer/ArrayBuffer to UTF-8 string
    let message: string;
    if (Buffer.isBuffer(msg)) {
      message = msg.toString("utf-8");
    } else if (Array.isArray(msg)) {
      // Handle array of Buffers
      message = Buffer.concat(msg).toString("utf-8");
    } else {
      message = msg.toString();
    }
    client.send(message);
  });

  backend.on("close", () => {
    console.log("[proxy] backend closed");
    client.close();
  });

  client.send(JSON.stringify({ type: "proxy-connected" }));
}
