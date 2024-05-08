import type { Server } from "bun";
import type { MatchState, Screen, EventDetails } from "lib";
import { FMSSignalRConnection } from "../signalr/connection";

export class AudienceDisplayManager {
  private server: Server;
  private fmsUrl: string;
  private fmsConnection: FMSSignalRConnection;

  private screen: Screen = "none";
  private eventDetails: EventDetails = {
    name: "Rainbow Rumble",
    matchCount: 80,
  };
  private match: MatchState | null = {
    score: {
      red: {
        amp: 0,
        auto: 0,
        endgame: 0,
        fouls: 0,
        harmonyRP: false,
        melodyRP: false,
        noteCount: 0,
        noteRequirement: 0,
        rainbowRP: false,
        score: 0,
        speaker: 0,
      },
      blue: {
        amp: 0,
        auto: 0,
        endgame: 0,
        fouls: 0,
        harmonyRP: false,
        melodyRP: false,
        noteCount: 0,
        noteRequirement: 0,
        rainbowRP: false,
        score: 0,
        speaker: 0,
      },
    },
    timer: 15,
    teams: {
      red: [
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
        },
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
        },
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
        },
      ],
      blue: [
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
        },
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
        },
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
        },
      ],
    },
    details: {
      matchNumber: 13,
      matchType: "sf",
    },
  };

  constructor(server: Server, fmsUrl: string) {
    this.server = server;
    this.fmsUrl = fmsUrl;
    this.fmsConnection = new FMSSignalRConnection(fmsUrl);

    this.fmsConnection.on("videoSwitch", (screen) => {
      this.screen = screen;
      this.broadcastState();
    });
  }

  broadcastState() {
    this.server.publish(
      "audience-display",
      JSON.stringify({
        connected: true,
        screen: this.screen,
        match: this.match,
      }),
    );
  }
}
