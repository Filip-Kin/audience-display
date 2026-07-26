import type { Server } from "bun";
import type {
  MatchState,
  Screen,
  EventDetails,
  AllianceScore,
  BracketData,
  GameConfig,
  MatchPhase,
  MatchType,
  PlayoffTiebreakType,
} from "lib";
import { FMSSignalRConnection } from "../signalr/connection";
import {
  LevelParam,
  type AllianceScoreDetails,
  type FMSAllianceSelection,
  type FMSFinalMatchPreview,
  type FMSFinalMatchScore,
  type FMSFinalResultsAlliance,
  type FMSMatchSchedule,
  type FMSPlayoffMatchPreview,
  type FMSPlayoffMatchScore,
  type FMSPlayoffPreviewAlliance,
  type FMSPlayoffResultsAlliance,
  type FMSQualMatchPreview,
  type FMSQualMatchScore,
  type FMSQualPreviewAlliance,
  type FMSQualResultsAlliance,
  type FMSQualRankData,
  type FMSRankingTeam,
} from "lib/types/FMS_API_audience";
import type { AllianceSelection, QualRanking, Team } from "lib/types/audience_display";
import { getTeamName } from "../team_name";
import { logRest, isFmsLoggingEnabled } from "../fms_logger";
import { syncFmsLog } from "../log_sync";
import { emptyAllianceScore, mapLiveScore, mapResultScore, defaultGameConfig } from "./score_mappers";
import { fetchGameConfig } from "./game_config";
import { fetchBracket } from "./bracket";
import type { ProfileSelector } from "../profile_selector";
import pkg from "../../../../package.json";

/** Normalized (level-independent) match preview the display state is built from. */
type NormalizedMatchPreview = {
  matchNumber: number;
  matchType: MatchType;
  redAllianceName?: string;
  blueAllianceName?: string;
  redTeams: Team[];
  blueTeams: Team[];
};

/** Normalized (level-independent) match results the display state is built from. */
type NormalizedMatchResults = {
  matchNumber: number;
  matchType: MatchType;
  redAllianceName?: string;
  blueAllianceName?: string;
  redSeriesWins?: number;
  blueSeriesWins?: number;
  redTeams: Team[];
  blueTeams: Team[];
  redScoreDetails: AllianceScoreDetails;
  blueScoreDetails: AllianceScoreDetails;
  matchWinner: "Red" | "Blue" | null;
  tiebreaker?: PlayoffTiebreakType;
};

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
    underReviewLatched: false,
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
    underReviewLatched: false,
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
  // Live from GetAllianceSelectionData.availableTeams (see updateAllianceSize).
  private potentialCaptains: Set<number> = new Set();
  private declinedTeams: Set<number> = new Set();
  // FMS suppresses isDeclined in availableTeams while a team is in potential-
  // captain position, so declines seen on the wire are tracked here and merged
  // with the REST flags (event wins where present).
  private eventDeclines: Map<number, boolean> = new Map();
  // Current field state, from the field monitor hub's MatchStatusInfoChanged.
  private currentMatchState = "";
  private rankData: QualRanking[] = [];
  private connected = false;
  private bracket: BracketData | null = demoBracket();
  private firstPlayoffMatchTime: string | null = null;
  private gameConfig: GameConfig = defaultGameConfig();
  private bracketRefreshTimer: ReturnType<typeof setInterval> | null = null;

  // Bumped on every screen-changing command (video switch, results, match end/commit)
  // so in-flight async handlers can tell they were superseded and stop touching state.
  private screenCommandSeq = 0;
  private scoreRevealFlipTimer: ReturnType<typeof setTimeout> | null = null;

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
  /** True once real results have been fetched this session; the demo
   * placeholder must never be re-shown as if it were real. */
  private resultsLoaded = false;
  /** False until the first real screen command resolves after boot. While
   * false, state broadcasts are withheld (pings only) so displays keep
   * showing whatever they had instead of this server's initial "none". */
  private screenEstablished = false;
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
        if (eventName !== null) this.eventDetails.name = eventName;
      })
    );

    promises.push(
      this.getCurrentMatchAndPlayNumber().then((data) => {
        if (data === null) return;
        this.match.details.matchNumber = data.matchNumber;
        this.currentLevel = data.level;
        this.match.details.matchType = this.getMatchTypeFromLevel(data.level);
      })
    );

    promises.push(
      this.getAlliances().then(async (alliances) => {
        const ranking = await this.getRankings();
        if (ranking !== null) this.ranking = ranking;
        await this.updateAllianceSize();
        if (alliances !== null) this.updateAllianceData(alliances);
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
      if (matchPreview !== null) this.applyMatchPreview(matchPreview);

      this.broadcastState();
    });

    this.fmsConnection.on("timer", async (time) => {
      this.match.timer = time;
      this.broadcastState();

      if (this.screen === "timeout") {
        if (time === 60) this.playSound("timeoutWarning");
        if (time === 0) this.playSound("timeoutEnd");
      }
    });

    this.fmsConnection.on("allianceClockTick", (time) => {
      // Selection break clock; only meaningful on the selection screens - and
      // the bracket, whose header shows the break countdown during playoff
      // breaks - so a stray/leftover alliance clock can never clobber the
      // match clock.
      if (
        this.screen !== "alliance-selection" &&
        this.screen !== "alliance-selection-fullscreen" &&
        this.screen !== "break-timer" &&
        this.screen !== "playoff-bracket"
      ) {
        return;
      }
      this.match.timer = time;
      // Pick-clock warning/expiry sounds (previously tied to the local countdown).
      if (
        this.pickTimerType === "pick" &&
        (this.screen === "alliance-selection" || this.screen === "alliance-selection-fullscreen")
      ) {
        if (time === 5) this.playSound("pickClock");
        if (time === 0) this.playSound("pickClockExpired");
      }
      this.broadcastState();
    });

    this.fmsConnection.on("videoSwitch", async (screen) => {
      const seq = ++this.screenCommandSeq;
      const isCurrent = () => seq === this.screenCommandSeq;
      this.cancelScoreRevealFlip();

      if (screen === "match-reveal") {
        // FMS option MatchResult: re-show the currently loaded results by routing
        // through scores-ready then score-reveal.
        this.stopBracketRefresh();
        if (!this.resultsLoaded) {
          // A normal post flips VideoSwitchOption to MatchResult AND sends
          // AudienceShowMatchResult moments apart, in either order. Give that
          // flow a few seconds to land; if nothing arrives (a first-ever boot
          // with no persisted results), keep the current screen rather than
          // re-show the demo placeholder or disturb the displays.
          for (let i = 0; i < 12 && !this.resultsLoaded; i++) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            // A showResults arrived and claimed the screen; it owns the flow.
            if (!isCurrent()) return;
          }
          if (!this.resultsLoaded) {
            // Fresh boot mid-MatchResult: the displays are still showing the
            // last reveal (they keep their own snapshot of it), so adopt
            // "score-reveal" and let the heartbeat match what they show. A
            // display refreshed right now would replay placeholder data, which
            // is the accepted tradeoff for not disturbing every other display.
            console.log("MatchResult with no results this session; adopting score-reveal");
            this.screen = "score-reveal";
            this.screenEstablished = true;
            this.broadcastState();
            return;
          }
        }
        this.screen = "scores-ready";
        this.screenEstablished = true;
        this.broadcastState();
        this.scheduleScoreRevealFlip();
        return;
      }

      // Always respect the video switch: whatever FMS commands is what shows,
      // including a blank display for VideoOnly/Background during playoffs.
      const next: Screen = screen;
      this.screen = next;
      this.screenEstablished = true;

      if (next === "match-preview") {
        const current = await this.getCurrentMatchAndPlayNumber();
        if (!isCurrent()) return;
        if (current !== null) {
          this.match.details.matchNumber = current.matchNumber;
          this.currentLevel = current.level;
          this.match.details.matchType = this.getMatchTypeFromLevel(current.level);
          this.match.score.winner = undefined;
          this.match.phase = "PreMatch";
          this.match.phaseTimer = 0;
          this.match.hubActive = "None";
          this.match.underReview = false;
          this.match.underReviewLatched = false;
          this.cachedAdvantage = { red: null, blue: null };

          const matchPreview = await this.getMatchPreview(this.currentLevel, current.matchNumber);
          if (!isCurrent()) return;
          if (matchPreview !== null) this.applyMatchPreview(matchPreview);
        } else {
          console.log("No current match loaded; showing match preview with existing data");
        }
      } else if (next === "alliance-selection" || next === "alliance-selection-fullscreen") {
        const alliances = await this.getAlliances();
        const ranking = await this.getRankings();
        await this.updateAllianceSize();
        if (!isCurrent()) return;
        if (ranking !== null) this.ranking = ranking;
        if (alliances !== null) this.updateAllianceData(alliances);
      } else if (next === "playoff-bracket") {
        await this.refreshBracket();
        if (!isCurrent()) return;
        this.startBracketRefresh();
        this.broadcastState();
        return;
      } else if (next === "rankings" || next === "break-timer") {
        // break-timer is the rankings display with the selection-start countdown.
        await this.refreshRankData();
        if (!isCurrent()) return;
      } else if (next === "timeout" && this.currentLevel === LevelParam.Playoff) {
        // The timeout slideshow includes a live mini bracket during playoffs.
        await this.refreshBracket();
        if (!isCurrent()) return;
        this.startBracketRefresh();
        this.broadcastState();
        return;
      }

      if (!isCurrent()) return;
      this.stopBracketRefresh();
      this.broadcastState();
    });

    this.fmsConnection.on("blueScoreChanged", (data) => {
      this.match.score.blue = mapLiveScore(data);
      this.cachedAdvantage.blue = data.AdvantageAchieved;
      if (this.screen !== "match-end" && this.screen !== "scores-ready") {
        this.broadcastState();
      }
    });

    this.fmsConnection.on("redScoreChanged", (data) => {
      this.match.score.red = mapLiveScore(data);
      this.cachedAdvantage.red = data.AdvantageAchieved;
      if (this.screen !== "match-end" && this.screen !== "scores-ready") {
        this.broadcastState();
      }
    });

    this.fmsConnection.on("gameSpecificMessage", (data) => {
      if (data.MessageType === "MatchPhaseChanged" || data.MatchPhase !== "None") {
        // FMS uses its "Coop" naming for the transition shift (cf. CoopFuelPoints);
        // normalize it to our TransitionShift phase so the label reads correctly.
        const raw = data.MatchPhase === "Coop" ? "TransitionShift" : data.MatchPhase;
        const phase: MatchPhase = raw === "None" ? "PreMatch" : raw;
        // Entering shifts 1-4 plays the FMS "Powerup" sound - only while the
        // field is actually running teleop (state from the field monitor hub).
        const SHIFTS: MatchPhase[] = ["Shift1", "Shift2", "Shift3", "Shift4"];
        if (
          this.currentMatchState === "MatchTeleop" &&
          SHIFTS.includes(phase) &&
          phase !== this.match.phase
        ) {
          this.playSound("shiftChange");
        }
        this.match.phase = phase;
        this.match.phaseTimer = data.CurrentPhaseTimeSeconds;
      }
      const blueActive = data.BlueAllianceGoalActive;
      const redActive = data.RedAllianceGoalActive;
      this.match.hubActive = blueActive && redActive ? "Both" : blueActive ? "Blue" : redActive ? "Red" : "None";
      this.broadcastState();
    });

    this.fmsConnection.on("matchStateChanged", (state) => {
      this.currentMatchState = state;
    });

    this.fmsConnection.on("plcMatchStatus", (data) => {
      this.match.underReview = data.RefUnderReview;
      // Latch it: a ref often flags review mid-match and releases it at the
      // buzzer, so the live flag alone can't drive the waiting-for-scores banner.
      if (data.RefUnderReview) this.match.underReviewLatched = true;
      this.broadcastState();
    });

    this.fmsConnection.on("showResults", async (data) => {
      const seq = ++this.screenCommandSeq;
      this.cancelScoreRevealFlip();

      const results = await this.getMatchResults(LevelParam[data.level], data.matchNumber);
      if (results === null) {
        console.log("Match results unavailable; keeping current screen");
        return;
      }

      const thresholds = {
        energized: this.gameConfig.energizedThreshold,
        supercharged: this.gameConfig.superchargedThreshold,
        traversal: this.gameConfig.traversalThreshold,
      };

      // A repost while the results are on screen: the reveal must slide out
      // still showing the OLD data, so hide it first and only swap the data in
      // once the exit animation has finished.
      if (this.screen === "score-reveal") {
        this.screen = "scores-ready";
        this.screenEstablished = true;
        this.broadcastState();
        await new Promise((resolve) => setTimeout(resolve, 600));
        if (seq !== this.screenCommandSeq) return;
      }

      // The results object is fully built before any of it is assigned, so a
      // failure above never leaves the display with half-cleared teams/scores.
      this.results.teams.red = results.redTeams;
      this.results.teams.blue = results.blueTeams;
      this.results.score.red = mapResultScore(results.redScoreDetails, this.cachedAdvantage.red, thresholds);
      this.results.score.blue = mapResultScore(results.blueScoreDetails, this.cachedAdvantage.blue, thresholds);
      this.results.details.matchNumber = results.matchNumber;
      this.results.details.matchType = results.matchType;
      this.results.details.redAlliance = results.redAllianceName;
      this.results.details.blueAlliance = results.blueAllianceName;
      this.results.details.redSeriesWins = results.redSeriesWins;
      this.results.details.blueSeriesWins = results.blueSeriesWins;
      this.results.tiebreaker = results.tiebreaker;
      this.results.score.winner = results.matchWinner === null ? "Tie" : results.matchWinner;
      this.resultsLoaded = true;

      // Finals results are the captures that matter most; push the FMS log to
      // the NAS whenever one is posted (also hooked on commit, but not every
      // FMS path emits WaitingForPostResults).
      if (results.matchType === "f") {
        // Delayed so the sync also captures the rows logged AFTER this
        // moment (score-reveal flip, broadcasts) rather than cutting the
        // capture off mid-flow.
        setTimeout(() => void syncFmsLog("finals results posted"), 5000);
      }

      // Clear under-review now that results are posted.
      this.results.underReview = false;
      this.match.underReview = false;
      this.match.underReviewLatched = false;

      if (seq !== this.screenCommandSeq) {
        // A newer command took the screen while we were fetching; keep the fresh
        // results data but don't steal the screen back.
        this.broadcastState();
        return;
      }

      this.screen = "scores-ready";
      this.screenEstablished = true;
      this.broadcastState();
      this.scheduleScoreRevealFlip();
    });

    this.fmsConnection.on("matchReady", () => this.playSound("matchReady"));
    this.fmsConnection.on("matchStart", () => this.playSound("matchStart"));
    this.fmsConnection.on("autoEnd", () => this.playSound("autoEnd"));
    this.fmsConnection.on("teleopStart", () => this.playSound("teleopStart"));
    this.fmsConnection.on("endgameWarning", () => this.playSound("endgameWarning"));
    this.fmsConnection.on("matchEnd", () => {
      this.playSound("matchEnd");
      this.screenEstablished = true;
      this.screenCommandSeq++;
      this.cancelScoreRevealFlip();
      this.screen = "match-end";
      this.broadcastState();
    });
    this.fmsConnection.on("matchAbort", () => this.playSound("matchAbort"));

    this.fmsConnection.on("matchCommit", () => {
      this.screenEstablished = true;
      this.screenCommandSeq++;
      this.cancelScoreRevealFlip();
      this.screen = "scores-ready";
      this.broadcastState();
      // Finals results are the captures that matter most; push the FMS log to
      // the NAS as soon as each one commits (internal 14+ = finals/overtime).
      if (this.currentLevel === LevelParam.Playoff && this.match.details.matchNumber >= 14) {
        setTimeout(() => void syncFmsLog("finals match committed"), 5000);
      }
    });

    this.fmsConnection.on("allianceTimer", (data: { Round: string; TimerType: string }) => {
      this.pickTimerType = data.TimerType.endsWith("Break") ? "break" : "pick";
      // Both break and pick clocks tick over the wire as AllianceSelectionTimer,
      // and that value respects pauses (it holds while the clock is paused), so
      // allianceClockTick drives match.timer for both. A local countdown used to
      // run for picks and kept ticking straight through a paused clock. Seed the
      // starting value (FMS wizard timing: round 1 = 45s, later rounds = 90s) so
      // the display shows something until the first wire tick lands.
      if (this.pickTimerType === "pick") {
        this.match.timer = data.Round === "Round1" ? 45 : 90;
      }
      this.broadcastState();
    });

    this.fmsConnection.on("allianceDecline", (data) => {
      this.eventDeclines.set(data.teamNumber, data.isDeclined);
    });

    this.fmsConnection.on("allianceSelectionChanged", async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const alliances = await this.getAlliances();
      const ranking = await this.getRankings();
      await this.updateAllianceSize();
      if (ranking !== null) this.ranking = ranking;
      if (alliances !== null) this.updateAllianceData(alliances);
      this.broadcastState();
    });

    this.fmsConnection.on("connected", async () => {
      this.connected = true;
      // Resync everything that can change while disconnected (an FMS restart
      // mid-event must not leave the display on stale state). The connection
      // also refetches the video switch option itself and re-emits videoSwitch.
      this.gameConfig = await fetchGameConfig(this.fmsUrl);
      await this.updateMatchCount();
      const current = await this.getCurrentMatchAndPlayNumber();
      if (current !== null) {
        this.currentLevel = current.level;
        this.match.details.matchNumber = current.matchNumber;
        this.match.details.matchType = this.getMatchTypeFromLevel(current.level);
      }
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

    // FMS emits this whenever a match is loaded (auto-advance after results,
    // manual load, test matches), so the current-match details - which feed the
    // timeout screen's Up Next card among others - always follow FMS without
    // needing a video switch.
    this.fmsConnection.on("matchLoaded", async (data) => {
      const level = LevelParam[data.level];
      if (level === this.currentLevel && data.matchNumber === this.match.details.matchNumber) {
        return;
      }
      this.currentLevel = level;
      this.match.details.matchNumber = data.matchNumber;
      this.match.details.matchType = this.getMatchTypeFromLevel(level);
      this.match.score.winner = undefined;
      const preview = await this.getMatchPreview(level, data.matchNumber);
      if (preview !== null) this.applyMatchPreview(preview);
      this.broadcastState();
    });
  }

  broadcastState() {
    if (!this.screenEstablished) {
      // Boot window: no screen has been established yet, so don't push the
      // initial "none" (it would blank every display that is happily showing
      // its last screen). The ping keeps client heartbeat watchdogs fed.
      this.server.publish("audience-display", JSON.stringify({ type: "ping" }));
      return;
    }
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
          rankData: this.rankData,
          bracket: this.bracket,
          firstPlayoffMatchTime: this.firstPlayoffMatchTime,
          gameConfig: this.gameConfig,
          activeProfileId: this.profileSelector?.get() ?? null,
          fmsLogging: isFmsLoggingEnabled(),
          version: pkg.version,
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
    // Scheduled start of playoff M1, for the bracket header's pre-playoff countdown.
    const schedule = await this.getCurrentSchedule();
    this.firstPlayoffMatchTime =
      schedule?.find(
        (m) => m.tournamentLevel === "Playoff" && m.matchNumber === 1
      )?.startTime ?? null;
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

  /** Flip scores-ready to score-reveal after the UI has had a moment to preload. */
  private scheduleScoreRevealFlip() {
    this.cancelScoreRevealFlip();
    this.scoreRevealFlipTimer = setTimeout(() => {
      this.scoreRevealFlipTimer = null;
      if (this.screen !== "scores-ready") return; // a newer command took the screen
      this.screen = "score-reveal";
      this.broadcastState();
    }, 500);
  }

  private cancelScoreRevealFlip() {
    if (this.scoreRevealFlipTimer) {
      clearTimeout(this.scoreRevealFlipTimer);
      this.scoreRevealFlipTimer = null;
    }
  }

  // #region FMS REST access

  /**
   * Fetch + parse an FMS REST endpoint. Returns null (after logging) on any
   * failure mode the real FMS exhibits: HTTP errors, 204 No Content, empty
   * bodies, and literal JSON null bodies.
   */
  private async fetchJson<T>(path: string, label: string): Promise<T | null> {
    try {
      const res = await fetch(`http://${this.fmsUrl}${path}`);
      if (res.status === 204) {
        logRest(path, 204, "");
        console.log(`${label} returned 204 (no content)`);
        return null;
      }
      if (!res.ok) {
        logRest(path, res.status, "");
        console.log(`${label} returned HTTP ${res.status}`);
        return null;
      }
      const text = (await res.text()).trim();
      logRest(path, res.status, text);
      if (!text) {
        console.log(`${label} returned an empty body`);
        return null;
      }
      return JSON.parse(text) as T;
    } catch (err) {
      console.log(`${label} request failed:`, err);
      return null;
    }
  }

  /**
   * The tiebreak value to display for a decided match: trust FMS's own enum
   * when it actually sent one (the playoff endpoint does), and recompute from
   * the score details when it is missing - the finals endpoint never assigns
   * the field (serializes "None") and "Unknown" is the no-tie default.
   */
  private resolveTiebreak(
    raw: PlayoffTiebreakType | null | undefined,
    red: AllianceScoreDetails,
    blue: AllianceScoreDetails
  ): PlayoffTiebreakType | undefined {
    if (raw && raw.startsWith("TieBreakSortOrder")) return raw;
    return this.computeTiebreak(red, blue);
  }

  /**
   * Which Table 10-3 criterion decided a points-tied playoff match. Real FMS
   * does NOT name the criterion on the audience wire (2026-07-23 log: a
   * tie-broken OT1 carries tiebreaker "None", same as a true tie), so it is
   * recomputed from the score details. The wire has no major/minor foul
   * split; penaltyPoints is the closest observable for criterion 1.
   */
  private computeTiebreak(
    red: AllianceScoreDetails,
    blue: AllianceScoreDetails
  ): PlayoffTiebreakType | undefined {
    if (red.totalScore !== blue.totalScore) return undefined; // decided on points
    if (red.penaltyPoints !== blue.penaltyPoints) return "TieBreakSortOrder1";
    if (red.autoFuelPoints !== blue.autoFuelPoints) return "TieBreakSortOrder2";
    if (
      red.autoClimbPoints + red.teleopClimbPoints !==
      blue.autoClimbPoints + blue.teleopClimbPoints
    ) {
      return "TieBreakSortOrder3";
    }
    return undefined;
  }

  // NOTE: real FMS numbers the whole 8-alliance playoff in one sequence
  // (1-13 double elim, 14-16 finals, 17-19 overtime) on the wire AND in the
  // DoubleElim endpoints (2026-07-22 laptop log: Final 1 posts as MatchNumber
  // 14, GetMatchResultsDoubleElimFinalData/14 echoes matchNumber 14). There
  // is no wire-vs-internal conversion.

  // #endregion

  private async updateMatchCount() {
    const level = await this.getActiveTournamentLevel();
    if (level !== null) this.currentLevel = level;
    if (this.currentLevel === LevelParam.Qualification) {
      const schedule = await this.getCurrentSchedule();
      if (schedule !== null) {
        this.eventDetails.matchCount = schedule.filter(
          (match) => match.tournamentLevel === "Qualification"
        ).length;
      }
    }
  }

  /** Apply a normalized preview to the live match state, ordering teams to match the field lineup. */
  private applyMatchPreview(preview: NormalizedMatchPreview) {
    this.match.details.matchNumber = preview.matchNumber;
    this.match.details.matchType = preview.matchType;
    this.match.details.redAlliance = preview.redAllianceName;
    this.match.details.blueAlliance = preview.blueAllianceName;

    const orderByLineup = (teams: Team[], lineup: number[]): Team[] => {
      const inLineup = teams.filter((t) => lineup.includes(t.number));
      const extras = teams.filter((t) => !lineup.includes(t.number));
      return [...inLineup, ...extras];
    };

    this.match.teams.red = orderByLineup(preview.redTeams, this.teamLineup.red);
    this.match.teams.blue = orderByLineup(preview.blueTeams, this.teamLineup.blue);
  }

  private mapQualPreviewTeams(alliance: FMSQualPreviewAlliance): Team[] {
    const teams: Team[] = [];
    for (const t of [alliance.team1, alliance.team2, alliance.team3]) {
      if (!t || t.teamNumber <= 0) continue;
      teams.push({
        name: getTeamName(t.teamNumber, t.teamName ?? ""),
        number: t.teamNumber,
        rank: t.teamRank,
        avatar: t.avatar,
        card: t.carryingCard ? "Yellow" : "None",
      });
    }
    return teams;
  }

  private mapPlayoffPreviewTeams(alliance: FMSPlayoffPreviewAlliance): Team[] {
    const teams: Team[] = [];
    for (const t of [alliance.team1, alliance.team2, alliance.team3, alliance.team4]) {
      // Official client guard: team4 exists as a zeroed object when the backup
      // slot is unfilled; never render a "team 0" card. No per-team rank/cards
      // exist at this level; the carried card is alliance-wide.
      if (!t || t.teamNumber <= 0) continue;
      teams.push({
        name: getTeamName(t.teamNumber, t.teamName ?? ""),
        number: t.teamNumber,
        avatar: t.avatar,
        card: alliance.carryingCard ? "Yellow" : "None",
      });
    }
    return teams;
  }

  private async getMatchPreview(
    level: LevelParam,
    matchNumber: number
  ): Promise<NormalizedMatchPreview | null> {
    if (level === LevelParam.Playoff) {
      // Same rule as getMatchResults: playoff wire numbers are 1-13, finals
      // 14-19 with tiebreaker/overtime posts riding the wire as 0; the number
      // decides the endpoint, never GetCurrentPlayoffLevel.
      if (matchNumber === 0) {
        matchNumber =
          this.match.details.matchNumber >= 14 ? this.match.details.matchNumber : 16;
      }
      const isFinals = matchNumber >= 14;
      const endpoint = isFinals
        ? "GetDoubleElimFinalMatchPreviewData"
        : "GetDoubleElimPlayoffMatchPreviewData";
      const data = await this.fetchJson<FMSPlayoffMatchPreview | FMSFinalMatchPreview>(
        `/api/v1.0/audience/get/${endpoint}/${matchNumber}`,
        endpoint
      );
      if (data === null) return null;
      return {
        matchNumber: data.matchNumber,
        matchType: isFinals ? "f" : "sf",
        redAllianceName: data.redAlliance.allianceName ?? undefined,
        blueAllianceName: data.blueAlliance.allianceName ?? undefined,
        redTeams: this.mapPlayoffPreviewTeams(data.redAlliance),
        blueTeams: this.mapPlayoffPreviewTeams(data.blueAlliance),
      };
    }

    const levelString =
      level === LevelParam.Qualification ? "Qual"
      : level === LevelParam.Practice ? "Practice"
      : "Test";
    const data = await this.fetchJson<FMSQualMatchPreview>(
      `/api/v1.0/audience/get/Get${levelString}MatchPreviewData/${matchNumber}`,
      `Get${levelString}MatchPreviewData`
    );
    if (data === null) return null;
    return {
      matchNumber: data.matchNumber,
      matchType: this.getMatchTypeFromLevel(level),
      redTeams: this.mapQualPreviewTeams(data.redAlliance),
      blueTeams: this.mapQualPreviewTeams(data.blueAlliance),
    };
  }

  private async getActiveTournamentLevel(): Promise<LevelParam | null> {
    try {
      const res = await fetch(
        `http://${this.fmsUrl}/api/v1.0/systembase/get/get_CurrentlyActiveTournamentLevel`
      );
      if (!res.ok) {
        console.log(`get_CurrentlyActiveTournamentLevel returned HTTP ${res.status}`);
        return null;
      }
      const data = (await res.text()).trim();
      switch (data) {
        case '"None"': return LevelParam.None;
        case '"Practice"': return LevelParam.Practice;
        case '"Qualification"': return LevelParam.Qualification;
        case '"Playoff"': return LevelParam.Playoff;
        case "":
          // Pre-event the endpoint returns 200 with an empty body; keep the current level.
          console.log("Tournament level not set yet (empty body); keeping current level");
          return null;
        default:
          console.log(`Unknown tournament level: ${data}; keeping current level`);
          return null;
      }
    } catch (err) {
      console.log("get_CurrentlyActiveTournamentLevel request failed:", err);
      return null;
    }
  }

  private async getCurrentMatchAndPlayNumber(): Promise<{
    matchNumber: number;
    playNumber: number;
    level: LevelParam;
  } | null> {
    // Returns HTTP 204 with an empty body when no match is loaded.
    const data = await this.fetchJson<{
      item1: keyof typeof LevelParam;
      item2: number;
      item3: number;
    }>(
      "/api/v1.0/audience/get/GetCurrentMatchAndPlayNumber",
      "GetCurrentMatchAndPlayNumber"
    );
    if (data === null) return null;

    let levelEnum = LevelParam.None;
    switch (data.item1) {
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

  private async getEventName(): Promise<string | null> {
    try {
      const res = await fetch(
        `http://${this.fmsUrl}/api/v1.0/systembase/get/get_CurrentlyActiveEventName`
      );
      if (!res.ok) {
        console.log(`get_CurrentlyActiveEventName returned HTTP ${res.status}`);
        return null;
      }
      const data = (await res.text()).trim();
      if (data.length < 2) return null;
      return data.substring(1, data.length - 1);
    } catch (err) {
      console.log("get_CurrentlyActiveEventName request failed:", err);
      return null;
    }
  }

  private async getCurrentSchedule(): Promise<FMSMatchSchedule[] | null> {
    return this.fetchJson<FMSMatchSchedule[]>(
      "/api/v1.0/match/get/GetCurrentSchedule",
      "GetCurrentSchedule"
    );
  }

  private getMatchTypeFromLevel(level: LevelParam): MatchType {
    switch (level) {
      case LevelParam.None: return "t";
      case LevelParam.Practice: return "p";
      case LevelParam.Qualification: return "q";
      // Playoff resolves to "sf" here; finals (wire numbers 14-19) are
      // detected by number when previews/results are fetched, which set
      // matchType "f" directly.
      default: return "sf";
    }
  }

  private mapQualResultTeams(alliance: FMSQualResultsAlliance): Team[] {
    const teams: Team[] = [];
    for (const t of [alliance.team1, alliance.team2, alliance.team3]) {
      if (!t || t.teamNumber <= 0) continue;
      teams.push({
        name: getTeamName(t.teamNumber, t.teamName ?? ""),
        number: t.teamNumber,
        rank: t.teamRank,
        avatar: t.avatar,
        card: t.cardEffectiveStatus,
        rankChange: t.teamRankChange ?? "NoChange",
      });
    }
    return teams;
  }

  private mapPlayoffResultTeams(
    alliance: FMSPlayoffResultsAlliance | FMSFinalResultsAlliance
  ): Team[] {
    const teams: Team[] = [];
    for (const t of [alliance.team1, alliance.team2, alliance.team3, alliance.team4]) {
      // Same guard as the official client: skip null/zeroed backup slots. Playoff
      // teams carry no rank; the effective card is alliance-wide.
      if (!t || t.teamNumber <= 0) continue;
      teams.push({
        name: getTeamName(t.teamNumber, t.teamName ?? ""),
        number: t.teamNumber,
        avatar: t.avatar,
        card: alliance.cardEffectiveStatus,
      });
    }
    return teams;
  }

  private async getMatchResults(
    level: LevelParam,
    matchNumber: number
  ): Promise<NormalizedMatchResults | null> {
    if (level === LevelParam.Playoff) {
      // Real-FMS ground truth (2026-07-22/23 laptop logs, 8-alliance bracket):
      // playoff wire numbers are 1-13 and finals continue the sequence at
      // 14-15; the Final Tiebreaker (16) and overtimes (17-19) carry their
      // real numbers while loading/playing but ALL post as MatchNumber 0.
      // Resolve 0 to the match that was just on the field. The number alone
      // decides the endpoint; GetCurrentPlayoffLevel must NOT be consulted
      // (it already says "Final" the moment M13's result records).
      if (matchNumber === 0) {
        matchNumber =
          this.match.details.matchNumber >= 14 ? this.match.details.matchNumber : 16;
      }
      const isFinals = matchNumber >= 14;
      if (isFinals) {
        const data = await this.fetchJson<FMSFinalMatchScore>(
          `/api/v1.0/audience_gs/get/GetMatchResultsDoubleElimFinalData/${matchNumber}`,
          "GetMatchResultsDoubleElimFinalData"
        );
        if (data === null) return null;
        return {
          matchNumber: data.matchNumber,
          matchType: "f",
          redAllianceName: data.redAllianceData.allianceName ?? undefined,
          blueAllianceName: data.blueAllianceData.allianceName ?? undefined,
          redSeriesWins: data.redAllianceData.seriesWins,
          blueSeriesWins: data.blueAllianceData.seriesWins,
          redTeams: this.mapPlayoffResultTeams(data.redAllianceData),
          blueTeams: this.mapPlayoffResultTeams(data.blueAllianceData),
          redScoreDetails: data.redAllianceData.scoreDetails,
          blueScoreDetails: data.blueAllianceData.scoreDetails,
          // Real FMS reports a true tie as matchWinner "None" with tiebreaker
          // "None" (2026-07-23 log); normalize to null + TrueTie so the reveal
          // ties correctly and the breakdown banner shows.
          matchWinner:
            data.matchWinner === "Red" || data.matchWinner === "Blue"
              ? data.matchWinner
              : null,
          tiebreaker:
            data.matchWinner === "Red" || data.matchWinner === "Blue"
              ? this.resolveTiebreak(
                  data.tiebreaker,
                  data.redAllianceData.scoreDetails,
                  data.blueAllianceData.scoreDetails
                )
              : "TrueTie",
        };
      }
      const data = await this.fetchJson<FMSPlayoffMatchScore>(
        `/api/v1.0/audience_gs/get/GetMatchResultsDoubleElimPlayoffData/${matchNumber}`,
        "GetMatchResultsDoubleElimPlayoffData"
      );
      if (data === null) return null;
      return {
        matchNumber: data.matchNumber,
        matchType: "sf",
        redAllianceName: data.redAllianceData.allianceName ?? undefined,
        blueAllianceName: data.blueAllianceData.allianceName ?? undefined,
        redTeams: this.mapPlayoffResultTeams(data.redAllianceData),
        blueTeams: this.mapPlayoffResultTeams(data.blueAllianceData),
        redScoreDetails: data.redAllianceData.scoreDetails,
        blueScoreDetails: data.blueAllianceData.scoreDetails,
        matchWinner:
          data.matchWinner === "Red" || data.matchWinner === "Blue"
            ? data.matchWinner
            : null,
        tiebreaker:
          data.matchWinner === "Red" || data.matchWinner === "Blue"
            ? this.resolveTiebreak(
                data.tiebreaker,
                data.redAllianceData.scoreDetails,
                data.blueAllianceData.scoreDetails
              )
            : "TrueTie",
      };
    }

    const levelString =
      level === LevelParam.Qualification ? "Qual"
      : level === LevelParam.Practice ? "Practice"
      : "TestMatch";
    const data = await this.fetchJson<FMSQualMatchScore>(
      `/api/v1.0/audience_gs/get/GetMatchResults${levelString}Data/${matchNumber}`,
      `GetMatchResults${levelString}Data`
    );
    if (data === null) return null;
    return {
      matchNumber: data.matchNumber,
      matchType: this.getMatchTypeFromLevel(level),
      redTeams: this.mapQualResultTeams(data.redAllianceData),
      blueTeams: this.mapQualResultTeams(data.blueAllianceData),
      redScoreDetails: data.redAllianceData.scoreDetails,
      blueScoreDetails: data.blueAllianceData.scoreDetails,
      matchWinner:
        data.matchWinner === "Red" || data.matchWinner === "Blue"
          ? data.matchWinner
          : null,
    };
  }

  private async getAlliances(): Promise<FMSAllianceSelection[] | null> {
    return this.fetchJson<FMSAllianceSelection[]>(
      "/api/v1.0/audience/get/GetAlliances",
      "GetAlliances"
    );
  }

  /** Teams per alliance (2/3/4) from FMS's allianceSelectionType; keeps the last value on error. */
  private async updateAllianceSize() {
    // fetchJson handles the no-event states real FMS serves (204 / empty body)
    // instead of exploding on a null parse.
    const data = await this.fetchJson<{
      allianceSelectionType?: string;
      availableTeams?: {
        teamNumber: number;
        inPotentialCaptainPosition: boolean;
        isDeclined: boolean;
      }[];
    }>(
      "/api/v1.0/audience/get/GetAllianceSelectionData",
      "GetAllianceSelectionData"
    );
    if (data === null) return;
    if (data.allianceSelectionType === "TwoTeam") this.allianceSize = 2;
    else if (data.allianceSelectionType === "FourTeam") this.allianceSize = 4;
    else if (data.allianceSelectionType === "ThreeTeam") this.allianceSize = 3;
    // availableTeams is the LIVE list: picked/captain teams drop out and
    // inPotentialCaptainPosition is maintained here. GetQualRankings is a
    // static wizard list whose flags never change mid-ceremony (real-FMS log),
    // so the potential-captain highlight must come from this endpoint.
    if (data.availableTeams) {
      this.potentialCaptains = new Set(
        data.availableTeams
          .filter((t) => t.inPotentialCaptainPosition)
          .map((t) => t.teamNumber)
      );
      this.declinedTeams = new Set(
        data.availableTeams.filter((t) => t.isDeclined).map((t) => t.teamNumber)
      );
    }
  }

  private updateAllianceData(alliances: FMSAllianceSelection[]) {
    // Runs after getRankings/updateAllianceSize in every call path, so it is
    // the one place that can stamp the live potential-captain flags onto the
    // freshly-assigned ranking list.
    for (const t of this.ranking) {
      t.potentialCaptain = this.potentialCaptains.has(t.number);
      t.declined = this.eventDeclines.get(t.number) ?? this.declinedTeams.has(t.number);
    }

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
        slots: [
          alliance.captainTeamNumber,
          alliance.firstRoundTeamNumber,
          alliance.secondRoundTeamNumber,
          alliance.alternateTeamNumber,
        ],
      });
    }
  }

  private async getRankings(): Promise<Omit<Team, "name" | "card">[] | null> {
    const rankings = await this.fetchJson<FMSRankingTeam[]>(
      "/api/v1.0/audience/get/GetQualRankings",
      "GetQualRankings"
    );
    if (rankings === null) return null;
    return rankings.map((r) => ({
      number: r.teamNumber,
      rank: r.rank,
      potentialCaptain: r.inPotentialCaptainPosition,
    }));
  }

  private async refreshRankData() {
    // Pre-event the body can be literal JSON null and teamRanks can be null/[];
    // show an empty table rather than dying (fetchJson maps all of those to null).
    const data = await this.fetchJson<FMSQualRankData>(
      "/api/v1.0/audience/get/GetQualificationRankData",
      "GetQualificationRankData"
    );
    this.rankData = (data?.teamRanks ?? []).map((t) => ({
      rank: t.rank,
      teamNumber: t.teamNumber,
      teamName: t.teamName,
      avatar: t.teamAvatar ?? "",
      rankingScore: t.sort1,
      wins: t.wins,
      losses: t.losses,
      ties: t.ties,
    }));
  }
}
