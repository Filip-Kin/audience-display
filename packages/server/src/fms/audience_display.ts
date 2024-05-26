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
        amp: 0,
        auto: 0,
        endgame: 0,
        fouls: 0,
        ensambleRP: false,
        melodyRP: false,
        noteCount: 0,
        noteRequirement: 0,
        rainbowRP: false,
        score: 0,
        speaker: 0,
        amplified: false,
      },
      blue: {
        amp: 0,
        auto: 0,
        endgame: 0,
        fouls: 0,
        ensambleRP: false,
        melodyRP: false,
        noteCount: 0,
        noteRequirement: 0,
        rainbowRP: false,
        score: 0,
        speaker: 0,
        amplified: false,
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

    this.fmsConnection.on(
      "blueScoreChanged",
      async (data: ScoreChangedData) => {
        if (this.match) {
          this.match.score.blue = {
            amp: data.TeleopAmpNotePoints + data.AutoAmpNotePoints,
            auto: data.AutoPoints,
            endgame: data.EndGameTotalStagePoints,
            ensambleRP: data.EnsambleBonusAchieved,
            fouls: data.FoulPoints,
            melodyRP: data.MelodyBonusAchieved,
            noteCount: data.TotalNoteCount,
            noteRequirement: data.MelodyBonusThreshold,
            score: data.TotalPoints,
            speaker: data.AutoSpeakerNotePoints + data.TeleopSpeakerNotePoints,
            rainbowRP: false,
            amplified: true,
          };
        }
        this.broadcastState();
      },
    );
    this.fmsConnection.on("redScoreChanged", async (data: ScoreChangedData) => {
      if (this.match) {
        this.match.score.red = {
          amp: data.TeleopAmpNotePoints + data.AutoAmpNotePoints,
          auto: data.AutoPoints,
          endgame: data.EndGameTotalStagePoints,
          ensambleRP: data.EnsambleBonusAchieved,
          fouls: data.FoulPoints,
          melodyRP: data.MelodyBonusAchieved,
          noteCount: data.TotalNoteCount,
          noteRequirement: data.MelodyBonusThreshold,
          score: data.TotalPoints,
          speaker: data.AutoSpeakerNotePoints + data.TeleopSpeakerNotePoints,
          rainbowRP: false,
          amplified: false,
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
