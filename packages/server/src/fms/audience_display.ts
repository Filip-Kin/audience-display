import type { Server } from "bun";
import type { MatchState, Screen, EventDetails, ScoreChangedData } from "lib";
import { FMSSignalRConnection } from "../signalr/connection";
import {
  LevelParam,
  type FMSAllianceSelection,
  type FMSMatchPreview,
  type FMSMatchSchedule,
  type FMSMatchScore,
  type FMSRankingTeam,
} from "lib/types/FMS_API_audience";
import type { AllianceSelection, Team } from "lib/types/audience_display";
import { getTeamName } from "../team_name";

export class AudienceDisplayManager {
  private server: Server;
  private fmsUrl: string;
  private fmsConnection: FMSSignalRConnection;

  private screen: Screen = "none";
  private currentLevel: LevelParam = LevelParam.None;
  private alliances: AllianceSelection[] = [];
  private ranking: Omit<Team, "name" | "card">[] = [];
  private connected = false;

  private eventDetails: EventDetails = {
    name: "Rainbow Rumble",
    matchCount: 80,
  };

  private results: MatchResults = {
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
          card: "None",
        },
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
          card: "None",
        },
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
          card: "None",
        },
      ],
      blue: [
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
          card: "None",
        },
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
          card: "None",
        },
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
          card: "None",
        },
      ],
    },
    details: {
      matchNumber: 13,
      matchType: "sf",
      redAlliance: "Alliance 1",
      blueAlliance: "Alliance 8",
    },
  };

  private match: MatchState = {
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
          card: "None",
        },
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
          card: "None",
        },
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
          card: "None",
        },
      ],
      blue: [
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
          card: "None",
        },
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
          card: "None",
        },
        {
          name: "Hemlock's Gray Matter",
          number: 5712,
          rank: 1,
          card: "None",
        },
      ],
    },
    details: {
      matchNumber: 13,
      matchType: "sf",
      redAlliance: "Alliance 1",
      blueAlliance: "Alliance 8",
    },
  };

  private teamLineup: {
    red: number[];
    blue: number[];
  } = {
      red: [],
      blue: [],
    };

  constructor(server: Server, fmsUrl: string) {
    this.server = server;
    this.fmsUrl = fmsUrl;
    this.fmsConnection = new FMSSignalRConnection(fmsUrl);

    let promises: Promise<void>[] = [];

    promises.push(
      this.getActiveTournamentLevel().then((level) => {
        this.currentLevel = level;
        console.log("Current tournament level", level);
        if (level === LevelParam.Qualification) {
          this.getCurrentSchedule().then((schedule) => {
            const matchCount = schedule.filter(
              (match) => match.tournamentLevel === "Qualification"
            ).length;
            console.log("Match count", matchCount);
            this.eventDetails.matchCount = matchCount;
          });
        }
      })
    );

    promises.push(
      this.getEventName().then((eventName) => {
        this.eventDetails.name = eventName;
      })
    );

    promises.push(
      this.getCurrentMatchAndPlayNumber().then((data) => {
        this.match.details.matchNumber = data.matchNumber;
        this.currentLevel = data.level;
        this.match.details.matchType = this.getMatchTypeFromLevel(data.level);
      })
    );

    promises.push(
      this.getAlliances().then(async (alliances) => {
        this.ranking = await this.getRankings();
        this.updateAllianceData(alliances);
      })
    );

    Promise.all(promises).then(async () => {
      // Try to wait for the team lineup to be set
      if (this.teamLineup.blue.length === 0 || this.teamLineup.red.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (this.teamLineup.blue.length === 0 || this.teamLineup.red.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const matchPreview = await this.getMatchPreview(
        this.currentLevel,
        this.match.details.matchNumber
      );
      this.updateMatchPreview(matchPreview);

      this.broadcastState();
    });

    this.fmsConnection.on("timer", async (time) => {
      if (this.match) {
        this.match.timer = time;
      }
      this.broadcastState();

      if (this.screen === "timeout") {
        if (time === 60) {
          this.playSound("timeoutWarning");
        }
        if (time === 0) {
          this.playSound("timeoutEnd");
        }
      }
    });

    this.fmsConnection.on("videoSwitch", async (screen) => {
      this.screen = screen;

      if (screen === "match-preview") {
        if (this.match) {
          // Get the current match number and tournament level
          const { matchNumber, playNumber, level } =
            await this.getCurrentMatchAndPlayNumber();
          this.match.details.matchNumber = matchNumber;
          this.currentLevel = level;
          this.match.details.matchType = this.getMatchTypeFromLevel(level);
          this.match.score.winner = undefined;

          // Get the match preview data
          const matchPreview = await this.getMatchPreview(
            this.currentLevel,
            matchNumber
          );
          this.updateMatchPreview(matchPreview);
        }
        this.broadcastState();
      } else if (screen === "match-reveal") {
        // This ensures the scores post, even if already on the score screen
        this.screen = "scores-ready";
        this.broadcastState();

        setTimeout(() => {
          this.screen = "score-reveal";
          this.broadcastState();
        }, 500);
      } else if (
        screen === "alliance-selection" ||
        screen === "alliance-selection-fullscreen"
      ) {
        const alliances = await this.getAlliances();
        this.ranking = await this.getRankings();
        this.updateAllianceData(alliances);
        this.broadcastState();
      } else {
        this.broadcastState();
      }
    });

    this.fmsConnection.on(
      "blueScoreChanged",
      async (data: ScoreChangedData) => {
        console.log("blueScoreChanged", data);
        if (this.match) {
          let coralBonusProgress = 0;
          if (data.TopRowCoralCount >= data.CoralBonusCoralThreshold)
            coralBonusProgress++;
          if (data.MidRowCoralCount >= data.CoralBonusCoralThreshold)
            coralBonusProgress++;
          if (data.BotRowCoralCount >= data.CoralBonusCoralThreshold)
            coralBonusProgress++;
          if (data.TroughCoralCount >= data.CoralBonusCoralThreshold)
            coralBonusProgress++;

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
              (data.CoopertitionBonusAchieved ? 1 : 0),
          };
        }
        this.broadcastState();
      }
    );

    this.fmsConnection.on("redScoreChanged", async (data: ScoreChangedData) => {
      if (this.match) {
        let coralBonusProgress = 0;
        if (data.TopRowCoralCount >= data.CoralBonusCoralThreshold)
          coralBonusProgress++;
        if (data.MidRowCoralCount >= data.CoralBonusCoralThreshold)
          coralBonusProgress++;
        if (data.BotRowCoralCount >= data.CoralBonusCoralThreshold)
          coralBonusProgress++;
        if (data.TroughCoralCount >= data.CoralBonusCoralThreshold)
          coralBonusProgress++;

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
            (data.CoopertitionBonusAchieved ? 1 : 0),
        };
      }
      this.broadcastState();
    });

    this.fmsConnection.on(
      "showResults",
      async (data: { matchNumber: number; level: keyof typeof LevelParam; }) => {
        console.log({
          matchNumber: data.matchNumber,
          level: data.level,
        });
        const results = await this.getMatchResults(
          LevelParam[data.level],
          data.matchNumber
        );

        for (let i = 0; i < 3; i++) {
          const matchResultsTeamRed =
            results.redAllianceData[
            `team${i + 1}` as "team1" | "team2" | "team3"
            ];
          this.results.teams.red[i] = {
            name: getTeamName(matchResultsTeamRed.teamNumber, matchResultsTeamRed.teamName),
            number: matchResultsTeamRed.teamNumber,
            rank: matchResultsTeamRed.teamRank,
            avatar: matchResultsTeamRed.avatar,
            card: matchResultsTeamRed.cardEffectiveStatus,
            rankChange: matchResultsTeamRed.teamRankChange,
          };

          const matchResultsTeamBlue =
            results.blueAllianceData[
            `team${i + 1}` as "team1" | "team2" | "team3"
            ];
          this.results.teams.blue[i] = {
            name: getTeamName(matchResultsTeamBlue.teamNumber, matchResultsTeamBlue.teamName),
            number: matchResultsTeamBlue.teamNumber,
            rank: matchResultsTeamBlue.teamRank,
            avatar: matchResultsTeamBlue.avatar,
            card: matchResultsTeamBlue.cardEffectiveStatus,
            rankChange: matchResultsTeamBlue.teamRankChange,
          };
        }

        this.results.score.red = {
          score: results.redAllianceData.scoreDetails.totalScore,
          autoMobility: results.redAllianceData.scoreDetails.autoMobilityPoints,
          coral: results.redAllianceData.scoreDetails.coralPoints,
          algae: results.redAllianceData.scoreDetails.algaePoints,
          barge: results.redAllianceData.scoreDetails.bargePoints,
          fouls: results.redAllianceData.scoreDetails.penaltyPoints,
          algaeCount: 0, // Does not matter for score results screen
          autoBonusRP: results.redAllianceData.scoreDetails.autoBonusAchieved,
          coralBonusRP: results.redAllianceData.scoreDetails.coralBonusAchieved,
          coralBonusProgress: 0, // Does not matter for score results screen
          coralBonusThreshold: 4, // Does not matter for score results screen
          bargeBonusRP: results.redAllianceData.scoreDetails.bargeBonusAchieved,
          coopertitionMet:
            results.redAllianceData.scoreDetails.coopertitionAchieved,
          coopertitionAchieved:
            results.redAllianceData.scoreDetails.coopertitionAchieved,
          rankingPoints: results.redAllianceData.scoreDetails.rankingPoints,
        };

        this.results.score.blue = {
          score: results.blueAllianceData.scoreDetails.totalScore,
          autoMobility:
            results.blueAllianceData.scoreDetails.autoMobilityPoints,
          coral: results.blueAllianceData.scoreDetails.coralPoints,
          algae: results.blueAllianceData.scoreDetails.algaePoints,
          barge: results.blueAllianceData.scoreDetails.bargePoints,
          fouls: results.blueAllianceData.scoreDetails.penaltyPoints,
          algaeCount: 0, // Does not matter for score results screen
          autoBonusRP: results.blueAllianceData.scoreDetails.autoBonusAchieved,
          coralBonusRP:
            results.blueAllianceData.scoreDetails.coralBonusAchieved,
          coralBonusProgress: 0, // Does not matter for score results screen
          coralBonusThreshold: 4, // Does not matter for score results screen
          bargeBonusRP:
            results.blueAllianceData.scoreDetails.bargeBonusAchieved,
          coopertitionMet:
            results.blueAllianceData.scoreDetails.coopertitionAchieved,
          coopertitionAchieved:
            results.blueAllianceData.scoreDetails.coopertitionAchieved,
          rankingPoints: results.blueAllianceData.scoreDetails.rankingPoints,
        };

        this.results.details.matchNumber = results.matchNumber;
        this.results.details.matchType = this.getMatchTypeFromLevel(
          this.currentLevel
        );

        this.results.details.redAlliance = results.redAllianceData.allianceName ?? undefined;
        this.results.details.blueAlliance = results.blueAllianceData.allianceName ?? undefined;

        this.results.score.winner =
          results.matchWinner === null ? "Tie" : results.matchWinner;

        // This ensures the scores post, even if already on the score screen
        this.screen = "scores-ready";

        this.broadcastState();

        setTimeout(() => {
          this.screen = "score-reveal";
          this.broadcastState();
        }, 500);
      }
    );

    this.fmsConnection.on("matchReady", () => {
      this.playSound("matchReady");
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
      this.screen = "match-end";
      this.broadcastState();
    });
    this.fmsConnection.on("matchAbort", () => {
      this.playSound("matchAbort");
    });

    this.fmsConnection.on("matchCommit", () => {
      this.screen = "scores-ready";
      this.broadcastState();
    });

    this.fmsConnection.on("allianceSelectionChanged", async () => {
      const alliances = await this.getAlliances();
      this.ranking = await this.getRankings();
      this.updateAllianceData(alliances);
      console.log(this.ranking);
      this.broadcastState();
    });

    this.fmsConnection.on("connected", () => {
      this.connected = true;
      this.broadcastState();
    });

    this.fmsConnection.on("disconnected", () => {
      console.log("Disconnected from FMS");
      this.connected = false;
      this.broadcastState();
    });

    this.fmsConnection.on("fieldMonitorTeamsChanged", (teams) => {
      this.teamLineup = {
        red: teams.red,
        blue: teams.blue,
      };
    });
  }

  broadcastState() {
    this.server.publish(
      "audience-display",
      JSON.stringify({
        type: "state",
        data: {
          connected: this.connected,
          screen: this.screen,
          match: this.match,
          results: this.results,
          eventDetails: this.eventDetails,
          alliances: this.alliances,
          ranking: this.ranking,
        },
      })
    );
  }

  playSound(soundName: string) {
    this.server.publish(
      "audience-display",
      JSON.stringify({
        type: "sound",
        data: soundName,
      })
    );
  }

  private async updateMatchPreview(matchPreview: FMSMatchPreview) {
    if (this.match) {
      this.match.details.redAlliance = matchPreview.redAlliance.allianceName ?? undefined;
      this.match.details.blueAlliance = matchPreview.blueAlliance.allianceName ?? undefined;

      this.match.teams.red = [];
      this.match.teams.blue = [];

      console.log({
        redAlliance: matchPreview.redAlliance,
        blueAlliance: matchPreview.blueAlliance,
        lineup: this.teamLineup,
      });

      for (let i = 0; i < 4; i++) {
        const matchPreviewTeamRed =
          matchPreview.redAlliance[
          `team${i + 1}` as "team1" | "team2" | "team3" | "team4"
          ];

        if (!matchPreviewTeamRed) {
          console.log(`Skipping team ${i + 1} in red alliance because null`);
        } else if (!this.teamLineup.red.includes(matchPreviewTeamRed.teamNumber)) {
          console.log(`Skipping team ${i + 1} in red alliance because not in lineup`);
        } else {
          console.log(`Adding team ${i + 1} in red alliance`, matchPreviewTeamRed.teamNumber);
          this.match.teams.red[i] = {
            name: getTeamName(matchPreviewTeamRed.teamNumber, matchPreviewTeamRed.teamName),
            number: matchPreviewTeamRed.teamNumber,
            rank: matchPreviewTeamRed.teamRank,
            avatar: matchPreviewTeamRed.avatar,
            card: (matchPreviewTeamRed.carryingCard ?? matchPreview.redAlliance.carryingCard),
          };
        }


        const matchPreviewTeamBlue =
          matchPreview.blueAlliance[
          `team${i + 1}` as "team1" | "team2" | "team3" | "team4"
          ];

        if (!matchPreviewTeamBlue) {
          console.log(`Skipping team ${i + 1} in blue alliance because null`);
        } else if (!this.teamLineup.blue.includes(matchPreviewTeamBlue.teamNumber)) {
          console.log(`Skipping team ${i + 1} in blue alliance because not in lineup`);
        } else {
          this.match.teams.blue[i] = {
            name: getTeamName(matchPreviewTeamBlue.teamNumber, matchPreviewTeamBlue.teamName),
            number: matchPreviewTeamBlue.teamNumber,
            rank: matchPreviewTeamBlue.teamRank,
            avatar: matchPreviewTeamBlue.avatar,
            card: (matchPreviewTeamBlue.carryingCard ?? matchPreview.blueAlliance.carryingCard),
          };
        }
        console.log(this.match.teams);
      }
    }
  }

  private async getMatchPreview(level: LevelParam, matchNumber: number) {
    let levelString = LevelParam[level];
    let matchString = matchNumber.toString();

    // FMS is so fucking stupid
    if (level === LevelParam.Qualification) {
      levelString = "Qual";
    } else if (level === LevelParam.None) {
      levelString = "Test";
    } else if (level === LevelParam.Playoff) {
      if (matchNumber > 13) {
        levelString = "DoubleElimFinal";
        matchString = (matchNumber - 13).toString();
      } else {
        levelString = "DoubleElimPlayoff";
      }
    }

    const res = await fetch(
      `http://${this.fmsUrl}/api/v1.0/audience/get/Get${levelString}MatchPreviewData/${matchString}`
    );

    console.log(res.url);

    console.log(res.status);

    return (await res.json()) as FMSMatchPreview;
  }

  private async getActiveTournamentLevel() {
    const res = await fetch(
      `http://${this.fmsUrl}/api/v1.0/systembase/get/get_CurrentlyActiveTournamentLevel`
    );
    const data = await res.text();
    switch (data) {
      case '"None"':
        return LevelParam.None;
      case '"Practice"':
        return LevelParam.Practice;
      case '"Qualification"':
        return LevelParam.Qualification;
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
      `http://${this.fmsUrl}/FieldMonitor/MatchNumberAndPlay`
    );
    const data = await res.json();
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
      `http://${this.fmsUrl}/api/v1.0/systembase/get/get_CurrentlyActiveEventName`
    );
    const data = await res.text();
    return data.substring(1, data.length - 1);
  }

  private async getCurrentSchedule() {
    const res = await fetch(
      `http://${this.fmsUrl}/api/v1.0/match/get/GetCurrentSchedule`
    );
    return (await res.json()) as FMSMatchSchedule[];
  }

  private getMatchTypeFromLevel(level: LevelParam) {
    switch (level) {
      case LevelParam.None:
        return "t";
      case LevelParam.Practice:
        return "p";
      case LevelParam.Qualification:
        return "q";
      case LevelParam.DoubleElimFinal:
        return "f";
      default:
        return "sf";
    }
  }

  private async getMatchResults(level: LevelParam, matchNumber: number) {
    let levelString = LevelParam[level];
    let matchString = matchNumber.toString();

    console.log({ level, matchNumber });

    // FMS is so fucking stupid
    if (level === LevelParam.Qualification) {
      levelString = "Qual";
    } else if (level === LevelParam.None) {
      levelString = "TestMatch";
    } else if (level === LevelParam.Playoff) {
      if (matchNumber > 13) {
        levelString = "DoubleElimFinal";
        matchString = (matchNumber - 13).toString();
      } else {
        levelString = "DoubleElimPlayoff";
      }
    }

    const res = await fetch(
      `http://${this.fmsUrl}/api/v1.0/audience_gs/get/GetMatchResults${levelString}Data/${matchString}`
    );

    console.log(res.url);
    let data = await res.json();
    console.log(data);

    // For some reason, FMS restarts the match numbers at 1 for finals, but only for match results
    // And our match name generator has no way to work around that so I'm just gonna fucking set it to the same number here
    if (level === LevelParam.Playoff && matchNumber > 13) {
      data.matchNumber = matchNumber;
    }

    return data as FMSMatchScore;
  }

  private async getAlliances() {
    const res = await fetch(
      `http://${this.fmsUrl}/api/v1.0/audience/get/GetAlliances`
    );
    return (await res.json()) as FMSAllianceSelection[];
  }

  private updateAllianceData(alliances: FMSAllianceSelection[]) {
    this.alliances = [];

    for (let i = 0; i < alliances.length; i++) {
      const alliance = alliances[i];
      const teams: Team[] = [];

      if (alliance.captainTeamNumber) {
        teams.push({
          number: alliance.captainTeamNumber,
          name: getTeamName(alliance.captainTeamNumber, alliance.captainTeamNameShort),
          avatar: alliance.captainAvatar,
          rank: 0,
          card: alliance.cardEffectiveStatus,
          isCaptain: true,
        });

        const teamInRankings = this.ranking.find(
          (team) => team.number === alliance.captainTeamNumber
        );
        if (teamInRankings) {
          teamInRankings.unavailableForSelection = true;
        }
      }

      if (alliance.firstRoundTeamNumber) {
        teams.push({
          number: alliance.firstRoundTeamNumber,
          name: getTeamName(alliance.firstRoundTeamNumber, alliance.firstRoundTeamNameShort),
          avatar: alliance.firstRoundAvatar,
          rank: 0,
          card: alliance.cardEffectiveStatus,
        });

        const teamInRankings = this.ranking.find(
          (team) => team.number === alliance.firstRoundTeamNumber
        );
        if (teamInRankings) {
          teamInRankings.unavailableForSelection = true;
        }
      }

      if (alliance.secondRoundTeamNumber) {
        teams.push({
          number: alliance.secondRoundTeamNumber,
          name: getTeamName(alliance.secondRoundTeamNumber, alliance.secondRoundTeamNameShort),
          avatar: alliance.secondRoundAvatar,
          rank: 0,
          card: alliance.cardEffectiveStatus,
        });

        const teamInRankings = this.ranking.find(
          (team) => team.number === alliance.secondRoundTeamNumber
        );
        if (teamInRankings) {
          teamInRankings.unavailableForSelection = true;
        }
      }

      if (alliance.alternateTeamNumber) {
        teams.push({
          number: alliance.alternateTeamNumber,
          name: getTeamName(alliance.alternateTeamNumber, alliance.alternateTeamNameShort),
          avatar: alliance.alternateAvatar,
          rank: 0,
          card: alliance.cardEffectiveStatus,
        });

        const teamInRankings = this.ranking.find(
          (team) => team.number === alliance.alternateTeamNumber
        );
        if (teamInRankings) {
          teamInRankings.unavailableForSelection = true;
        }
      }

      this.alliances.push({
        allianceNumber: alliance.allianceNumber,
        allianceName: alliance.allianceName,
        teams,
        card: alliance.cardEffectiveStatus,
      });
    }
  }

  private async getRankings() {
    const res = await fetch(
      `http://${this.fmsUrl}/api/v1.0/audience/get/GetQualRankings`
    );
    const rankings = (await res.json()) as FMSRankingTeam[];
    return rankings.map((ranking) => ({
      number: ranking.teamNumber,
      rank: ranking.rank,
      potentialCaptain: ranking.inPotentialCaptainPosition,
    }));
  }
}
