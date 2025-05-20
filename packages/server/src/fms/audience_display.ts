import type { Server } from "bun";
import type { MatchState, Screen, EventDetails, ScoreChangedData } from "lib";
import { FMSSignalRConnection } from "../signalr/connection";
import { LevelParam, type FMSMatchPreview, type FMSMatchSchedule } from "lib/types/FMS_API_audience";

export class AudienceDisplayManager {
  private server: Server;
  private fmsUrl: string;
  private fmsConnection: FMSSignalRConnection;

  private screen: Screen = "none";
  private currentLevel: LevelParam = LevelParam.None;

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
        algaeCount: 0,
        autoBonusRP: false,
        coralBonusRP: false,
        coralBonusProgress: 0,
        coralBonusThreshold: 4,
        bargeBonusRP: false,
        coopertitionMet: false,
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
        algaeCount: 0,
        autoBonusRP: false,
        coralBonusRP: false,
        coralBonusProgress: 0,
        coralBonusThreshold: 4,
        bargeBonusRP: false,
        coopertitionMet: false,
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

    this.getActiveTournamentLevel().then((level) => {
      this.currentLevel = level;

      if (level === LevelParam.Qual) {
        this.getCurrentSchedule().then((schedule) => {
          const matchCount = schedule.filter(
            (match) => match.tournamentLevel === "Qual",
          ).length;
          this.eventDetails.matchCount = matchCount;
        });
      }
    });

    this.getEventName().then((eventName) => {
      this.eventDetails.name = eventName;
    });

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

          // Get the current match number and tournament level
          const { matchNumber, playNumber, level } = await this.getCurrentMatchAndPlayNumber();
          this.match.details.matchNumber = matchNumber;
          this.currentLevel = level;
          switch (this.currentLevel) {
            case LevelParam.Practice:
              this.match.details.matchType = "p";
              break;
            case LevelParam.Qual:
              this.match.details.matchType = "q";
              break;
            case LevelParam.DoubleElimFinal:
              this.match.details.matchType = "f";
              break;
            default:
              this.match.details.matchType = "sf";
              break;
          }

          // Get the match preview data
          const matchPreview = await this.getMatchPreview(this.currentLevel, matchNumber);
          console.log(matchPreview);

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
      console.log("blueScoreChanged", data);
      if (this.match) {
        let coralBonusProgress = 0;
        if (data.TopRowCoralCount >= data.CoralBonusCoralThreshold) coralBonusProgress++;
        if (data.MidRowCoralCount >= data.CoralBonusCoralThreshold) coralBonusProgress++;
        if (data.BotRowCoralCount >= data.CoralBonusCoralThreshold) coralBonusProgress++;
        if (data.TroughCoralCount >= data.CoralBonusCoralThreshold) coralBonusProgress++;

        this.match.score.blue = {
          score: data.TotalPoints,
          autoMobility: data.AutoMobilityPoints,
          coral: data.TotalCoralPoints,
          algae: data.AlgaePoints,
          barge: data.EndgameBargePoints,
          fouls: data.FoulPoints,
          algaeCount: data.AlgaeCount,
          autoBonusRP: data.AutoBonusAchieved,
          coralBonusRP: data.CoralBonusAchieved,
          coralBonusProgress: coralBonusProgress,
          coralBonusThreshold: data.CoralBonusLevelsThreshold,
          bargeBonusRP: data.BargeBonusAchieved,
          coopertitionMet: data.CoopertitionCriteriaMet,
          coopertitionAchieved: data.CoopertitionBonusAchieved,
          rankingPoints:
            (data.AutoBonusAchieved ? 1 : 0) +
            (data.CoralBonusAchieved ? 1 : 0) +
            (data.BargeBonusAchieved ? 1 : 0) +
            (data.CoopertitionBonusAchieved ? 1 : 0)

        };
      }
      this.broadcastState();
    });

    this.fmsConnection.on("redScoreChanged", async (data: ScoreChangedData) => {
      if (this.match) {
        let coralBonusProgress = 0;
        if (data.TopRowCoralCount >= data.CoralBonusCoralThreshold) coralBonusProgress++;
        if (data.MidRowCoralCount >= data.CoralBonusCoralThreshold) coralBonusProgress++;
        if (data.BotRowCoralCount >= data.CoralBonusCoralThreshold) coralBonusProgress++;
        if (data.TroughCoralCount >= data.CoralBonusCoralThreshold) coralBonusProgress++;

        this.match.score.red = {
          score: data.TotalPoints,
          autoMobility: data.AutoMobilityPoints,
          coral: data.TotalCoralPoints,
          algae: data.AlgaePoints,
          barge: data.EndgameBargePoints,
          fouls: data.FoulPoints,
          algaeCount: data.AlgaeCount,
          autoBonusRP: data.AutoBonusAchieved,
          coralBonusRP: data.CoralBonusAchieved,
          coralBonusProgress: coralBonusProgress,
          coralBonusThreshold: data.CoralBonusLevelsThreshold,
          bargeBonusRP: data.BargeBonusAchieved,
          coopertitionMet: data.CoopertitionCriteriaMet,
          coopertitionAchieved: data.CoopertitionBonusAchieved,
          rankingPoints:
            (data.AutoBonusAchieved ? 1 : 0) +
            (data.CoralBonusAchieved ? 1 : 0) +
            (data.BargeBonusAchieved ? 1 : 0) +
            (data.CoopertitionBonusAchieved ? 1 : 0)
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

  private async getActiveTournamentLevel() {
    const res = await fetch(
      `http://${this.fmsUrl}/api/v1.0/systembase/get/get_CurrentlyActiveTournamentLevel`,
    );
    const data = await res.text();
    switch (data) {
      case '"None"':
        return LevelParam.None;
      case '"Practice"':
        return LevelParam.Practice;
      case '"Qualification"':
        return LevelParam.Qual;
      case '"Playoff"':
        return LevelParam.Playoff;
      case '"DoubleElimPlayoff"':
        return LevelParam.DoubleElimPlayoff;
      case '"DoubleElimFinal"':
        return LevelParam.DoubleElimFinal;
      default:
        throw new Error(`Unknown tournament level: ${data}`);
    }
  }

  private async getCurrentMatchAndPlayNumber() {
    const res = await fetch(
      `http://${this.fmsUrl}/FieldMonitor/MatchNumberAndPlay`,
    );
    const data = await res.json();
    console.log(data);
    return {
      matchNumber: data[0],
      playNumber: data[1],
      level: data[2],
    } as {
      matchNumber: number;
      playNumber: number;
      level: LevelParam;
    };
  }

  private async getEventName() {
    const res = await fetch(
      `http://${this.fmsUrl}/api/v1.0/systembase/get/get_CurrentlyActiveEventName`,
    );
    const data = await res.text();
    return data.substring(1, data.length - 1);
  }

  private async getCurrentSchedule() {
    const res = await fetch(
      `http://${this.fmsUrl}/api/v1.0/match/get/GetCurrentSchedule`,
    );
    return (await res.json()) as FMSMatchSchedule[];
  }

}