import type { Server } from "bun";
import type { MatchState, Screen, EventDetails, ScoreChangedData } from "lib";
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
        score: 0,
        autoMobility: 0,
        coral: 0,
        algae: 0,
        barge: 0,
        fouls: 0,
        autoBonusRP: false,
        coralBonusRP: false,
        bargeBonusRP: false,
        coopertitionAchieved: false,
        rankingPoints: 0,
      },
      blue: {
        score: 0,
        autoMobility: 0,
        coral: 0,
        algae: 0,
        barge: 0,
        fouls: 0,
        autoBonusRP: false,
        coralBonusRP: false,
        bargeBonusRP: false,
        coopertitionAchieved: false,
        rankingPoints: 0,
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
          console.log(matchPreview);
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

    this.fmsConnection.on("blueScoreChanged", async (data: ScoreChangedData) => {
      if (this.match) {
        const isTie = data.TotalPoints === this.match.score.red.score;
        const blueWins = data.TotalPoints > this.match.score.red.score;

        this.match.score.blue = {
          score: data.TotalPoints,
          autoMobility: data.AutoMobilityPoints,
          coral: data.TotalCoralPoints,
          algae: data.AlgaePoints,
          barge: data.EndgameBargePoints,
          fouls: data.FoulPoints,
          autoBonusRP: data.AutoBonusAchieved,
          coralBonusRP: data.CoralBonusAchieved,
          bargeBonusRP: data.BargeBonusAchieved,
          coopertitionAchieved: data.CoopertitionBonusAchieved,
          rankingPoints:
            (data.AutoBonusAchieved ? 1 : 0) +
            (data.CoralBonusAchieved ? 1 : 0) +
            (data.BargeBonusAchieved ? 1 : 0) +
            (data.CoopertitionBonusAchieved ? 1 : 0) +
            (isTie ? 1 : 0) +
            (blueWins ? 2 : 0)

        };
      }
      this.broadcastState();
    });

    this.fmsConnection.on("redScoreChanged", async (data: ScoreChangedData) => {
      if (this.match) {
        const isTie = data.TotalPoints === this.match.score.blue.score;
        const redWins = data.TotalPoints > this.match.score.blue.score;

        this.match.score.red = {
          score: data.TotalPoints,
          autoMobility: data.AutoMobilityPoints,
          coral: data.TotalCoralPoints,
          algae: data.AlgaePoints,
          barge: data.EndgameBargePoints,
          fouls: data.FoulPoints,
          autoBonusRP: data.AutoBonusAchieved,
          coralBonusRP: data.CoralBonusAchieved,
          bargeBonusRP: data.BargeBonusAchieved,
          coopertitionAchieved: data.CoopertitionBonusAchieved,
          rankingPoints:
            (data.AutoBonusAchieved ? 1 : 0) +
            (data.CoralBonusAchieved ? 1 : 0) +
            (data.BargeBonusAchieved ? 1 : 0) +
            (data.CoopertitionBonusAchieved ? 1 : 0) +
            (isTie ? 1 : 0) +
            (redWins ? 2 : 0)
        };
      }
      this.broadcastState();
    });

    this.fmsConnection.on("matchStart", () => {
      this.playSound("matchStart");
    });
    this.fmsConnection.on("autoEnd", () => {
      this.playSound("autoEnd");
    });
    this.fmsConnection.on("teleopStart", () => {
      this.playSound("teleopStart");
    });
    this.fmsConnection.on("endgameWarning", () => {
      this.playSound("endgameWarning");
    });
    this.fmsConnection.on("matchEnd", () => {
      this.playSound("matchEnd");
    });
    this.fmsConnection.on("matchAbort", () => {
      this.playSound("matchAbort");
    });
  }

  broadcastState() {
    this.server.publish(
      "audience-display",
      JSON.stringify({
        type: "state",
        data: {
          connected: true,
          screen: this.screen,
          match: this.match,
          eventDetails: this.eventDetails,
        },
      }),
    );
  }

  playSound(soundName: string) {
    this.server.publish(
      "audience-display",
      JSON.stringify({
        type: "sound",
        data: soundName,
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
