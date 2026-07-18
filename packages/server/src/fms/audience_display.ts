import type { Server } from "bun";
import type {
  MatchState,
  Screen,
  EventDetails,
  ScoreChangedData,
  GameSpecificMessage,
  PlcMatchStatusData,
  AllianceScore,
  BracketData,
  GameConfig,
  MatchPhase,
} from "lib";
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
import { emptyAllianceScore, mapLiveScore, mapResultScore, defaultGameConfig } from "./score_mappers";
import { fetchGameConfig } from "./game_config";
import { fetchBracket } from "./bracket";
import type { ProfileSelector } from "../profile_selector";

const PLAYOFF_LEVELS = new Set<LevelParam>([
  LevelParam.Playoff,
  LevelParam.DoubleElimPlayoff,
  LevelParam.DoubleElimFinal,
]);

function demoTeam(num: number, name: string, rank: number): Team {
  return { number: num, name, rank, card: "None" };
}

function demoScore(opts: {
  score: number;
  fuel: number;
  autoFuel: number;
  teleopFuel: number;
  autoClimb: number;
  endgameClimb: number;
  energized: boolean;
  supercharged: boolean;
  traversal: boolean;
  advantage: boolean | null;
  rp: number;
  isHigh: boolean;
}): AllianceScore {
  return {
    score: opts.score,
    autoFuelPoints: opts.autoFuel,
    teleopFuelPoints: opts.teleopFuel,
    transitionShiftFuelPoints: 0,
    shiftFuelPoints: [0, 0, 0, 0],
    endgameFuelPoints: 0,
    totalFuelPoints: opts.autoFuel + opts.teleopFuel,
    teleopFuelCount: opts.fuel,
    totalFuelCount: opts.fuel,
    autoClimbPoints: opts.autoClimb,
    endgameClimbPoints: opts.endgameClimb,
    totalClimbPoints: opts.autoClimb + opts.endgameClimb,
    energizedAchieved: opts.energized,
    superchargedAchieved: opts.supercharged,
    traversalAchieved: opts.traversal,
    advantageAchieved: opts.advantage,
    energizedThreshold: 100,
    superchargedThreshold: 360,
    traversalThreshold: 50,
    rankingPoints: opts.rp,
    foulPoints: 0,
    adjustPoints: 0,
    penalties: { g206: false, g418: false, g419: false },
    isHighScore: opts.isHigh,
  };
}

function defaultMatchState(matchNumber: number): MatchState {
  return {
    timer: 15,
    phase: "PreMatch",
    phaseTimer: 0,
    hubActive: "None",
    underReview: false,
    score: {
      red: emptyAllianceScore(),
      blue: emptyAllianceScore(),
    },
    teams: {
      red: [
        demoTeam(5712, "Hemlock's Gray Matter", 1),
        demoTeam(254, "The Cheesy Poofs", 2),
        demoTeam(2767, "Stryke Force", 5),
      ],
      blue: [
        demoTeam(1678, "Citrus Circuits", 3),
        demoTeam(3641, "MARS", 7),
        demoTeam(6328, "Mechanical Advantage", 9),
      ],
    },
    details: {
      matchNumber,
      matchType: "q",
      redAlliance: undefined,
      blueAlliance: undefined,
    },
  };
}

function demoAlliances(): AllianceSelection[] {
  const teamSets = [
    [
      { number: 5712, name: "Hemlock's Gray Matter" },
      { number: 254, name: "The Cheesy Poofs" },
      { number: 1678, name: "Citrus Circuits" },
    ],
    [
      { number: 2767, name: "Stryke Force" },
      { number: 6328, name: "Mechanical Advantage" },
      { number: 3641, name: "MARS" },
    ],
    [
      { number: 33, name: "Killer Bees" },
      { number: 67, name: "HOT Team" },
      { number: 469, name: "Las Guerrillas" },
    ],
    [
      { number: 1701, name: "Robocubs" },
      { number: 2767, name: "Stryke Force" },
      { number: 4153, name: "Wolves of the Sea" },
    ],
  ];
  return teamSets.map((teams, i) => ({
    allianceNumber: i + 1,
    allianceName: `Alliance ${i + 1}`,
    teams: teams.map((t, j) => ({
      number: t.number,
      name: t.name,
      rank: 0,
      card: "None" as const,
      isCaptain: j === 0,
    })),
    card: "None" as const,
  }));
}

function demoRanking(): Omit<Team, "name" | "card">[] {
  return [
    { number: 5712, rank: 1 },
    { number: 254, rank: 2 },
    { number: 1678, rank: 3 },
    { number: 2767, rank: 4, potentialCaptain: true },
    { number: 33, rank: 5 },
    { number: 67, rank: 6 },
    { number: 469, rank: 7 },
    { number: 6328, rank: 8 },
    { number: 1701, rank: 9 },
    { number: 3641, rank: 10 },
    { number: 4153, rank: 11 },
    { number: 9999, rank: 12 },
  ];
}

function demoBracket(): BracketData {
  const mkMatch = (
    matchNumber: number,
    shortName: string,
    longName: string,
    red: number,
    blue: number,
    redScore: number,
    blueScore: number,
    winner: "None" | "Red" | "Blue",
    isComplete: boolean,
    isNextMatch = false
  ) => ({
    matchNumber,
    shortName,
    longName,
    isComplete,
    winningAllianceType: winner,
    winningAllianceNumber:
      winner === "Red" ? red : winner === "Blue" ? blue : 0,
    redAllianceNumber: red,
    redAllianceScore: redScore,
    blueAllianceNumber: blue,
    blueAllianceScore: blueScore,
    isNextMatch,
  });
  return {
    alliances: [],
    doubleElimMatchesList: [
      mkMatch(1, "M1", "Match 1", 1, 8, 142, 98, "Red", true),
      mkMatch(2, "M2", "Match 2", 4, 5, 120, 134, "Blue", true),
      mkMatch(3, "M3", "Match 3", 2, 7, 156, 88, "Red", true),
      mkMatch(4, "M4", "Match 4", 3, 6, 110, 145, "Blue", true),
      mkMatch(5, "M5", "Match 5", 8, 4, 102, 118, "Blue", true),
      mkMatch(6, "M6", "Match 6", 7, 6, 95, 130, "Blue", true),
      mkMatch(7, "M7", "Match 7", 1, 5, 168, 142, "Red", true),
      mkMatch(8, "M8", "Match 8", 2, 3, 140, 152, "Blue", true),
      mkMatch(9, "M9", "Match 9", 4, 8, 0, 0, "None", false, true),
      mkMatch(10, "M10", "Match 10", 6, 7, 0, 0, "None", false),
      mkMatch(11, "M11", "Match 11", 1, 3, 0, 0, "None", false),
      mkMatch(12, "M12", "Match 12", 5, 4, 0, 0, "None", false),
      mkMatch(13, "M13", "Match 13", 0, 0, 0, 0, "None", false),
    ],
    finals: mkMatch(14, "F1", "Final 1", 1, 3, 0, 0, "None", false),
    currentLevel: "Level4",
    allianceCount: "EightAlliance",
    tournamentType: "Regional",
    season: 2026,
    eventCode: "FAMNM",
    eventName: "Rainbow Rumble",
    eventLocation: "Ann Arbor, MI",
  };
}

function demoResultsState(): MatchState {
  return {
    timer: 0,
    phase: "PostMatch",
    phaseTimer: 0,
    hubActive: "None",
    underReview: false,
    score: {
      red: demoScore({
        score: 142,
        fuel: 88,
        autoFuel: 14,
        teleopFuel: 62,
        autoClimb: 12,
        endgameClimb: 30,
        energized: false,
        supercharged: false,
        traversal: true,
        advantage: true,
        rp: 2,
        isHigh: false,
      }),
      blue: demoScore({
        score: 168,
        fuel: 112,
        autoFuel: 18,
        teleopFuel: 74,
        autoClimb: 6,
        endgameClimb: 45,
        energized: true,
        supercharged: false,
        traversal: true,
        advantage: false,
        rp: 5,
        isHigh: true,
      }),
      winner: "Blue",
    },
    teams: {
      red: [
        demoTeam(5712, "Hemlock's Gray Matter", 1),
        demoTeam(254, "The Cheesy Poofs", 2),
        demoTeam(2767, "Stryke Force", 5),
      ],
      blue: [
        demoTeam(1678, "Citrus Circuits", 3),
        demoTeam(3641, "MARS", 7),
        demoTeam(6328, "Mechanical Advantage", 9),
      ],
    },
    details: {
      matchNumber: 42,
      matchType: "q",
    },
  };
}

export class AudienceDisplayManager {
  private server: Server;
  private fmsUrl: string;
  private fmsConnection: FMSSignalRConnection;

  private screen: Screen = "none";
  private currentLevel: LevelParam = LevelParam.None;
  private alliances: AllianceSelection[] = demoAlliances();
  private ranking: Omit<Team, "name" | "card">[] = demoRanking();
  private allianceSize = 3;
  private pickTimerType: "pick" | "break" = "pick";
  private connected = false;
  private bracket: BracketData | null = demoBracket();
  private gameConfig: GameConfig = defaultGameConfig();
  private bracketRefreshTimer: ReturnType<typeof setInterval> | null = null;

  // advantageAchieved is live-event-only; cache it across the match so we can
  // include it on the results screen even though FMS omits it from the result endpoint.
  private cachedAdvantage: { red: boolean | null; blue: boolean | null } = {
    red: null,
    blue: null,
  };

  private eventDetails: EventDetails = {
    name: "Rainbow Rumble",
    matchCount: 80,
  };

  private results: MatchState = demoResultsState();
  private match: MatchState = defaultMatchState(1);

  private teamLineup: { red: number[]; blue: number[] } = { red: [], blue: [] };
  private profileSelector: ProfileSelector | null = null;

  constructor(server: Server, fmsUrl: string, profileSelector?: ProfileSelector) {
    this.server = server;
    this.fmsUrl = fmsUrl;
    this.fmsConnection = new FMSSignalRConnection(fmsUrl);
    this.profileSelector = profileSelector ?? null;
    if (this.profileSelector) {
      this.profileSelector.onChange(() => this.broadcastState());
    }

    const promises: Promise<void>[] = [];

    promises.push(this.updateMatchCount());

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
        await this.updateAllianceSize();
        this.updateAllianceData(alliances);
      })
    );

    promises.push(
      fetchGameConfig(this.fmsUrl).then((cfg) => {
        this.gameConfig = cfg;
      })
    );

    Promise.all(promises).then(async () => {
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
      this.match.timer = time;
      this.broadcastState();

      if (this.screen === "timeout") {
        if (time === 60) this.playSound("timeoutWarning");
        if (time === 0) this.playSound("timeoutEnd");
      }
      if (this.screen === "alliance-selection" || this.screen === "alliance-selection-fullscreen") {
        if (time === 5) this.playSound("pickClock");
        if (time === 0) this.playSound("pickClockExpired");
      }
    });

    this.fmsConnection.on("videoSwitch", async (screen: Screen | string) => {
      // Playoff break auto-show: when FMS sends "none" in a playoff tournament, show the bracket.
      let next = screen as Screen;
      if (next === "none" && PLAYOFF_LEVELS.has(this.currentLevel)) {
        next = "playoff-bracket";
      }

      this.screen = next;

      if (next === "match-preview") {
        const { matchNumber, level } = await this.getCurrentMatchAndPlayNumber();
        this.match.details.matchNumber = matchNumber;
        this.currentLevel = level;
        this.match.details.matchType = this.getMatchTypeFromLevel(level);
        this.match.score.winner = undefined;
        this.match.phase = "PreMatch";
        this.match.phaseTimer = 0;
        this.match.hubActive = "None";
        this.match.underReview = false;
        this.cachedAdvantage = { red: null, blue: null };

        const matchPreview = await this.getMatchPreview(this.currentLevel, matchNumber);
        this.updateMatchPreview(matchPreview);
      } else if (next === "match-reveal" as unknown as Screen) {
        // legacy: route through scores-ready then score-reveal
        this.screen = "scores-ready";
        this.broadcastState();
        setTimeout(() => {
          this.screen = "score-reveal";
          this.broadcastState();
        }, 500);
        return;
      } else if (next === "alliance-selection" || next === "alliance-selection-fullscreen") {
        const alliances = await this.getAlliances();
        this.ranking = await this.getRankings();
        await this.updateAllianceSize();
        this.updateAllianceData(alliances);
      } else if (next === "playoff-bracket") {
        await this.refreshBracket();
        this.startBracketRefresh();
        this.broadcastState();
        return;
      }

      this.stopBracketRefresh();
      this.broadcastState();
    });

    this.fmsConnection.on("blueScoreChanged", (data: ScoreChangedData) => {
      this.match.score.blue = mapLiveScore(data);
      this.cachedAdvantage.blue = data.AdvantageAchieved;
      if (this.screen !== "match-end" && this.screen !== "scores-ready") {
        this.broadcastState();
      }
    });

    this.fmsConnection.on("redScoreChanged", (data: ScoreChangedData) => {
      this.match.score.red = mapLiveScore(data);
      this.cachedAdvantage.red = data.AdvantageAchieved;
      if (this.screen !== "match-end" && this.screen !== "scores-ready") {
        this.broadcastState();
      }
    });

    this.fmsConnection.on("gameSpecificMessage", (data: GameSpecificMessage) => {
      if (data.MessageType === "MatchPhaseChanged" || data.MatchPhase !== "None") {
        // FMS uses its "Coop" naming for the transition shift (cf. CoopFuelPoints);
        // normalize it to our TransitionShift phase so the label reads correctly.
        const raw = data.MatchPhase === "Coop" ? "TransitionShift" : data.MatchPhase;
        const phase = raw === "None" ? "PreMatch" : (raw as MatchPhase);
        this.match.phase = phase;
        this.match.phaseTimer = data.CurrentPhaseTimeSeconds;
      }
      const blueActive = data.BlueAllianceGoalActive;
      const redActive = data.RedAllianceGoalActive;
      this.match.hubActive = blueActive && redActive ? "Both" : blueActive ? "Blue" : redActive ? "Red" : "None";
      this.broadcastState();
    });

    this.fmsConnection.on("plcMatchStatus", (data: PlcMatchStatusData) => {
      this.match.underReview = data.RefUnderReview;
      this.broadcastState();
    });

    this.fmsConnection.on("showResults", async (data: { matchNumber: number; level: keyof typeof LevelParam }) => {
      const results = await this.getMatchResults(LevelParam[data.level], data.matchNumber);

      this.results.teams.red = [];
      this.results.teams.blue = [];

      for (let i = 0; i < 4; i++) {
        const keyFor = (n: number) => `team${n + 1}` as "team1" | "team2" | "team3" | "team4";
        const redTeam = results.redAllianceData[keyFor(i)];
        if (redTeam) {
          this.results.teams.red.push({
            name: getTeamName(redTeam.teamNumber, redTeam.teamName),
            number: redTeam.teamNumber,
            rank: redTeam.teamRank,
            avatar: redTeam.avatar,
            card: redTeam.cardEffectiveStatus,
            rankChange: redTeam.teamRankChange,
          });
        }
        const blueTeam = results.blueAllianceData[keyFor(i)];
        if (blueTeam) {
          this.results.teams.blue.push({
            name: getTeamName(blueTeam.teamNumber, blueTeam.teamName),
            number: blueTeam.teamNumber,
            rank: blueTeam.teamRank,
            avatar: blueTeam.avatar,
            card: blueTeam.cardEffectiveStatus,
            rankChange: blueTeam.teamRankChange,
          });
        }
      }

      const thresholds = {
        energized: this.gameConfig.energizedThreshold,
        supercharged: this.gameConfig.superchargedThreshold,
        traversal: this.gameConfig.traversalThreshold,
      };

      this.results.score.red = mapResultScore(
        results.redAllianceData.scoreDetails,
        this.cachedAdvantage.red,
        thresholds
      );
      this.results.score.blue = mapResultScore(
        results.blueAllianceData.scoreDetails,
        this.cachedAdvantage.blue,
        thresholds
      );

      this.results.details.matchNumber = results.matchNumber;
      this.results.details.matchType = this.getMatchTypeFromLevel(this.currentLevel);
      this.results.details.redAlliance = results.redAllianceData.allianceName ?? undefined;
      this.results.details.blueAlliance = results.blueAllianceData.allianceName ?? undefined;
      this.results.details.redSeriesWins = results.redAllianceData.seriesWins;
      this.results.details.blueSeriesWins = results.blueAllianceData.seriesWins;
      this.results.tiebreaker = results.tiebreaker;
      this.results.score.winner = results.matchWinner === null ? "Tie" : results.matchWinner;

      // Clear under-review now that results are posted.
      this.results.underReview = false;
      this.match.underReview = false;

      this.screen = "scores-ready";
      this.broadcastState();

      setTimeout(() => {
        this.screen = "score-reveal";
        this.broadcastState();
      }, 500);
    });

    this.fmsConnection.on("matchReady", () => this.playSound("matchReady"));
    this.fmsConnection.on("matchStart", () => this.playSound("matchStart"));
    this.fmsConnection.on("autoEnd", () => this.playSound("autoEnd"));
    this.fmsConnection.on("teleopStart", () => this.playSound("teleopStart"));
    this.fmsConnection.on("endgameWarning", () => this.playSound("endgameWarning"));
    this.fmsConnection.on("matchEnd", () => {
      this.playSound("matchEnd");
      this.screen = "match-end";
      this.broadcastState();
    });
    this.fmsConnection.on("matchAbort", () => this.playSound("matchAbort"));

    this.fmsConnection.on("matchCommit", () => {
      this.screen = "scores-ready";
      this.broadcastState();
    });

    this.fmsConnection.on("allianceTimer", (data: { Round: string; TimerType: string }) => {
      this.pickTimerType = data.TimerType.endsWith("Break") ? "break" : "pick";
      this.broadcastState();
    });

    this.fmsConnection.on("allianceSelectionChanged", async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const alliances = await this.getAlliances();
      this.ranking = await this.getRankings();
      await this.updateAllianceSize();
      this.updateAllianceData(alliances);
      this.broadcastState();
    });

    this.fmsConnection.on("connected", async () => {
      this.connected = true;
      this.gameConfig = await fetchGameConfig(this.fmsUrl);
      this.broadcastState();
    });

    this.fmsConnection.on("disconnected", () => {
      console.log("Disconnected from FMS");
      this.connected = false;
      this.broadcastState();
    });

    this.fmsConnection.on("fieldMonitorTeamsChanged", (teams) => {
      this.teamLineup = { red: teams.red, blue: teams.blue };
    });

    this.fmsConnection.on("tournamentLevelChanged", async () => {
      await this.updateMatchCount();
      this.gameConfig = await fetchGameConfig(this.fmsUrl);
      this.broadcastState();
    });

    this.fmsConnection.on("timeout", async (data) => {
      this.match.details.matchNumber = data.MatchNumber;
      this.match.score.winner = undefined;
      this.broadcastState();
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
          allianceSize: this.allianceSize,
          pickTimerType: this.pickTimerType,
          bracket: this.bracket,
          gameConfig: this.gameConfig,
          activeProfileId: this.profileSelector?.get() ?? null,
        },
      })
    );
  }

  selectProfile(id: string) {
    this.profileSelector?.set(id);
  }

  playSound(soundName: string) {
    this.server.publish(
      "audience-display",
      JSON.stringify({ type: "sound", data: soundName })
    );
  }

  private async refreshBracket() {
    this.bracket = await fetchBracket(this.fmsUrl);
  }

  private startBracketRefresh() {
    if (this.bracketRefreshTimer) return;
    this.bracketRefreshTimer = setInterval(() => {
      this.refreshBracket().then(() => this.broadcastState());
    }, 30_000);
  }

  private stopBracketRefresh() {
    if (this.bracketRefreshTimer) {
      clearInterval(this.bracketRefreshTimer);
      this.bracketRefreshTimer = null;
    }
  }

  private async updateMatchCount() {
    this.currentLevel = await this.getActiveTournamentLevel();
    if (this.currentLevel === LevelParam.Qualification) {
      const schedule = await this.getCurrentSchedule();
      const matchCount = schedule.filter(
        (match) => match.tournamentLevel === "Qualification"
      ).length;
      this.eventDetails.matchCount = matchCount;
    }
  }

  private async updateMatchPreview(matchPreview: FMSMatchPreview) {
    this.match.details.redAlliance = matchPreview.redAlliance.allianceName ?? undefined;
    this.match.details.blueAlliance = matchPreview.blueAlliance.allianceName ?? undefined;

    this.match.teams.red = [];
    this.match.teams.blue = [];

    const redExtraTeams: Team[] = [];
    const blueExtraTeams: Team[] = [];

    for (let i = 0; i < 4; i++) {
      const key = `team${i + 1}` as "team1" | "team2" | "team3" | "team4";

      const red = matchPreview.redAlliance[key];
      if (red) {
        const team: Team = {
          name: getTeamName(red.teamNumber, red.teamName),
          number: red.teamNumber,
          rank: red.teamRank,
          avatar: red.avatar,
          card: (red.carryingCard ?? matchPreview.redAlliance.carryingCard) ? "Yellow" : "None",
        };
        if (this.teamLineup.red.includes(red.teamNumber)) {
          this.match.teams.red.push(team);
        } else {
          redExtraTeams.push(team);
        }
      }

      const blue = matchPreview.blueAlliance[key];
      if (blue) {
        const team: Team = {
          name: getTeamName(blue.teamNumber, blue.teamName),
          number: blue.teamNumber,
          rank: blue.teamRank,
          avatar: blue.avatar,
          card: (blue.carryingCard ?? matchPreview.blueAlliance.carryingCard) ? "Yellow" : "None",
        };
        if (this.teamLineup.blue.includes(blue.teamNumber)) {
          this.match.teams.blue.push(team);
        } else {
          blueExtraTeams.push(team);
        }
      }
    }

    this.match.teams.red = [...this.match.teams.red, ...redExtraTeams];
    this.match.teams.blue = [...this.match.teams.blue, ...blueExtraTeams];
  }

  private async getMatchPreview(level: LevelParam, matchNumber: number) {
    let levelString = LevelParam[level];
    let matchString = matchNumber.toString();

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
    return (await res.json()) as FMSMatchPreview;
  }

  private async getActiveTournamentLevel() {
    const res = await fetch(
      `http://${this.fmsUrl}/api/v1.0/systembase/get/get_CurrentlyActiveTournamentLevel`
    );
    const data = await res.text();
    switch (data) {
      case '"None"': return LevelParam.None;
      case '"Practice"': return LevelParam.Practice;
      case '"Qualification"': return LevelParam.Qualification;
      case '"Playoff"': return LevelParam.Playoff;
      case '"DoubleElimPlayoff"': return LevelParam.DoubleElimPlayoff;
      case '"DoubleElimFinal"': return LevelParam.DoubleElimFinal;
      default: throw new Error(`Unknown tournament level: ${data}`);
    }
  }

  private async getCurrentMatchAndPlayNumber() {
    const res = await fetch(`http://${this.fmsUrl}/api/v1.0/audience/get/GetCurrentMatchAndPlayNumber`);
    const data = await res.json();
    const levelString = data.item1 as "None" | "Practice" | "Qualification" | "Playoff";
    let levelEnum = LevelParam.None;
    switch (levelString) {
        case "Practice": {
            levelEnum = LevelParam.Practice;
            break;
        }
        case "Qualification": {
            levelEnum = LevelParam.Qualification;
            break;
        }
        case "Playoff": {
            levelEnum = LevelParam.Playoff;
            break;
        }
    }

    return {
      matchNumber: data.item2,
      playNumber: data.item3,
      level: levelEnum,
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
    const res = await fetch(`http://${this.fmsUrl}/api/v1.0/match/get/GetCurrentSchedule`);
    return (await res.json()) as FMSMatchSchedule[];
  }

  private getMatchTypeFromLevel(level: LevelParam) {
    switch (level) {
      case LevelParam.None: return "t";
      case LevelParam.Practice: return "p";
      case LevelParam.Qualification: return "q";
      case LevelParam.DoubleElimFinal: return "f";
      default: return "sf";
    }
  }

  private async getMatchResults(level: LevelParam, matchNumber: number) {
    let levelString = LevelParam[level];
    let matchString = matchNumber.toString();

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
    const data = await res.json();
    // FMS restarts match numbers at 1 for finals; preserve the human-readable number
    if (level === LevelParam.Playoff && matchNumber > 13) {
      data.matchNumber = matchNumber;
    }
    return data as FMSMatchScore;
  }

  private async getAlliances() {
    const res = await fetch(`http://${this.fmsUrl}/api/v1.0/audience/get/GetAlliances`);
    return (await res.json()) as FMSAllianceSelection[];
  }

  /** Teams per alliance (2/3/4) from FMS's allianceSelectionType; keeps the last value on error. */
  private async updateAllianceSize() {
    try {
      const res = await fetch(`http://${this.fmsUrl}/api/v1.0/audience/get/GetAllianceSelectionData`);
      const data = (await res.json()) as { allianceSelectionType?: string };
      if (data.allianceSelectionType === "TwoTeam") this.allianceSize = 2;
      else if (data.allianceSelectionType === "FourTeam") this.allianceSize = 4;
      else if (data.allianceSelectionType === "ThreeTeam") this.allianceSize = 3;
    } catch (e) {
      console.log("Failed to fetch alliance selection type:", e);
    }
  }

  private updateAllianceData(alliances: FMSAllianceSelection[]) {
    this.alliances = [];

    for (const alliance of alliances) {
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
        const found = this.ranking.find((t) => t.number === alliance.captainTeamNumber);
        if (found) found.unavailableForSelection = true;
      }

      const pushAndMark = (num: number | null, nameShort: string, avatar: string) => {
        if (!num) return;
        teams.push({
          number: num,
          name: getTeamName(num, nameShort),
          avatar,
          rank: 0,
          card: alliance.cardEffectiveStatus,
        });
        const found = this.ranking.find((t) => t.number === num);
        if (found) found.unavailableForSelection = true;
      };

      pushAndMark(alliance.firstRoundTeamNumber, alliance.firstRoundTeamNameShort, alliance.firstRoundAvatar);
      pushAndMark(alliance.secondRoundTeamNumber, alliance.secondRoundTeamNameShort, alliance.secondRoundAvatar);
      pushAndMark(alliance.alternateTeamNumber, alliance.alternateTeamNameShort, alliance.alternateAvatar);

      this.alliances.push({
        allianceNumber: alliance.allianceNumber,
        allianceName: alliance.allianceName,
        teams,
        card: alliance.cardEffectiveStatus,
      });
    }
  }

  private async getRankings() {
    const res = await fetch(`http://${this.fmsUrl}/api/v1.0/audience/get/GetQualRankings`);
    const rankings = (await res.json()) as FMSRankingTeam[];
    return rankings.map((r) => ({
      number: r.teamNumber,
      rank: r.rank,
      potentialCaptain: r.inPotentialCaptainPosition,
    }));
  }
}
