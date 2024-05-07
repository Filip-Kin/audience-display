import type { Server } from "bun";
import type { MatchState, Screen } from "lib";

export class AudienceDisplayManager {
  private server: Server;

  private screen: Screen = "none";

  constructor(server: Server) {
    this.server = server;
  }

  broadcastState() {
    this.server.publish(
      "audience-display",
      JSON.stringify({
        connected: true,
        screen: this.screen,
        match: null,
      }),
    );
  }
}
