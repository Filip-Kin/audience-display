import { AudienceDisplayManager } from "./fms/audience_display";

const server = Bun.serve({
  fetch(request, server) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      const success = server.upgrade(request);
      if (success) {
        return undefined;
      } else {
        return new Response("Failed to upgrade connection", {
          status: 400,
        });
      }
    }
    return new Response("Hello world!");
  },
  websocket: {
    async message(ws, message) {
      console.log(`Received message: ${message}`);
    },
    open(ws) {
      console.log("Client connected!");
      ws.subscribe("audience-display");
      audienceDisplay.broadcastState();
    },
    close(ws) {
      console.log("Client disconnected!");
      ws.unsubscribe("audience-display");
    },
  },
});

const audienceDisplay = new AudienceDisplayManager(server);

console.log(`Listening on ${server.hostname}:${server.port}`);
