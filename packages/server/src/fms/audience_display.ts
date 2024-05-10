import type { Server } from "bun";
import type { MatchState, Screen, EventDetails } from "lib";
import { FMSSignalRConnection } from "../signalr/connection";
import { LevelParam, type FMSMatchPreview } from "lib/types/FMS_API_audience";

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

    this.fmsConnection.on("timer", async (time) => {
      if (this.match) {
        this.match.timer = time;
      }
      this.broadcastState();
    });

    this.fmsConnection.on("videoSwitch", async (screen) => {
      this.screen = screen;

      if (screen === "match-preview") {
        if (this.match) {
          this.match.details.matchType = "q";
          const matchPreview = await this.getMatchPreview(LevelParam.Qual, 3);
          this.match.details.matchNumber = matchPreview.matchNumber;
          for (let i = 0; i < 3; i++) {
            const matchPreviewTeamRed =
              matchPreview.redAlliance[
                `team${i + 1}` as "team1" | "team2" | "team3"
              ];
            this.match.teams.red[i] = {
              name: matchPreviewTeamRed.teamName,
              number: matchPreviewTeamRed.teamNumber,
              rank: matchPreviewTeamRed.teamRank,
              avatar: matchPreviewTeamRed.avatar,
            };

            const matchPreviewTeamBlue =
              matchPreview.blueAlliance[
                `team${i + 1}` as "team1" | "team2" | "team3"
              ];
            this.match.teams.blue[i] = {
              name: matchPreviewTeamBlue.teamName,
              number: matchPreviewTeamBlue.teamNumber,
              rank: matchPreviewTeamBlue.teamRank,
              avatar: matchPreviewTeamBlue.avatar,
            };
          }

          if (this.match.details.matchType === "q") {
            this.eventDetails.matchCount =
              matchPreview.numberOfQualMatches ?? 0;
          }
        }
      }

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

  private async getMatchPreview(level: LevelParam, matchNumber: number) {
    const res = await fetch(
      `http://${this.fmsUrl}/api/v1.0/audience/get/Get${LevelParam[level]}MatchPreviewData/${matchNumber}`,
    );
    return (await res.json()) as FMSMatchPreview;
  }
}
