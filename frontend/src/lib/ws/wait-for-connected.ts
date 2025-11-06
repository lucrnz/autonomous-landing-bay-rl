import WebSocket from "ws";

export function waitForSocketClientOpen(
  client: WebSocket,
  timeoutMs: number = 5000
) {
  return new Promise((resolve, reject) => {
    if (client.readyState === WebSocket.OPEN) {
      resolve(true);
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error("Client timeout"));
      return;
    }, timeoutMs);

    client.on("error", (error) => {
      client.removeAllListeners("error");
      clearTimeout(timeout);
      reject(error);
    });

    client.on("open", () => {
      client.removeAllListeners("open");
      client.removeAllListeners("error");
      clearTimeout(timeout);
      resolve(true);
    });
  });
}
