import { HubConnectionBuilder, type HubConnection, type IHttpConnectionOptions } from "@microsoft/signalr";
import { FmsLoggingWebSocket } from "../fms_logger";

// The SignalR runtime honors options.WebSocket (see HttpConnection.js) but the
// public typings omit it; extend locally so the frame-logging socket can be
// injected instead of the `ws` package it would otherwise pick in this runtime.
type HubOptions = IHttpConnectionOptions & { WebSocket?: typeof WebSocket };
const HUB_OPTIONS: HubOptions = { WebSocket: FmsLoggingWebSocket };
import {
  type ScoreChangedData,
  type ScoringElementChangedData,
  type GameSpecificMessage,
  type PlcMatchStatusData,
  type Screen,
} from "lib";
import { LevelParam, type VideoSwitchOption } from "lib/types/FMS_API_audience";

/**
 * Screens the videoSwitch event can request. "match-reveal" is not a UI screen;
 * it is the internal request to run the scores-ready -> score-reveal flow with
 * whatever results are currently loaded (FMS option MatchResult).
 */
export type VideoSwitchScreen = Screen | "match-reveal";

export type ShowResultsData = {
  matchNumber: number;
  level: keyof typeof LevelParam;
};

export type AllianceTimerData = { Round: string; TimerType: string };

export type MatchStatusInfoData = {
  MatchState: string;
  MatchNumber: number;
  Level?: keyof typeof LevelParam;
};

export type MatchLoadedData = { matchNumber: number; level: keyof typeof LevelParam };

type EventMap = {
  videoSwitch: VideoSwitchScreen;
  timer: number;
  allianceClockTick: number;
  blueScoreChanged: ScoreChangedData;
  redScoreChanged: ScoreChangedData;
  matchCommit: null;
  showResults: ShowResultsData;
  endgameWarning: null;
  matchReady: null;
  matchStart: null;
  matchEnd: null;
  matchAbort: null;
  teleopStart: null;
  autoEnd: null;
  allianceSelectionChanged: unknown;
  allianceTimer: AllianceTimerData;
  connected: null;
  disconnected: null;
  timeout: MatchStatusInfoData;
  matchLoaded: MatchLoadedData;
  fieldMonitorTeamsChanged: { red: number[]; blue: number[] };
  tournamentLevelChanged: unknown;
  gameSpecificMessage: GameSpecificMessage;
  plcMatchStatus: PlcMatchStatusData;
};

type EventCallbacks = { [K in keyof EventMap]: Array<(data: EventMap[K]) => void> };

/** Where every real FMS video switch option lands. Options without a dedicated screen idle on "none". */
const VIDEO_SWITCH_SCREENS: Record<VideoSwitchOption, VideoSwitchScreen> = {
  Background: "none",
  MatchPreview: "match-preview",
  VideoOnly: "none",
  VideoAndScore: "match-ready",
  MatchResult: "match-reveal",
  Rankings: "rankings",
  Schedule: "none",
  Alliance: "alliance-selection",
  // Only one alliance-selection layout exists; mapping all three options to the same
  // screen also makes hybrid<->fullscreen switches no-ops instead of transitions.
  AllianceHybrid: "alliance-selection",
  AllianceFullscreen: "alliance-selection",
  Bracket: "playoff-bracket",
  Timeout: "timeout",
  Award: "none",
  AwardAssignment: "none",
  WifiReminder: "none",
  Message: "none",
  // The FMS alliance-selection wizard's "Break Timer" button starts the
  // EightMinuteBreak clock AND switches the video option to TimerBug
  // (2026-07-19 ground-truth log), so TimerBug IS the selection-break screen.
  TimerBug: "break-timer",
  RegionalPreviouslyQualified: "none",
  RegionalAdvancers: "none",
};

function isVideoSwitchOption(option: string): option is VideoSwitchOption {
  return option in VIDEO_SWITCH_SCREENS;
}

export class FMSSignalRConnection {
  private fmsUrl: string;
  private infrastructureConnection: HubConnection;
  private gameSpecificConnection: HubConnection;
  private fieldMonitorConnection: HubConnection;
  private currentTeams: {
    red: number[];
    blue: number[];
  } = { red: [], blue: [] };

  private eventCallbacks: EventCallbacks = {
    videoSwitch: [],
    timer: [],
    allianceClockTick: [],
    blueScoreChanged: [],
    redScoreChanged: [],
    matchCommit: [],
    showResults: [],
    endgameWarning: [],
    matchReady: [],
    matchStart: [],
    matchEnd: [],
    matchAbort: [],
    teleopStart: [],
    autoEnd: [],
    allianceSelectionChanged: [],
    allianceTimer: [],
    connected: [],
    disconnected: [],
    timeout: [],
    matchLoaded: [],
    fieldMonitorTeamsChanged: [],
    tournamentLevelChanged: [],
    gameSpecificMessage: [],
    plcMatchStatus: [],
  };

  constructor(fmsUrl: string) {
    this.fmsUrl = fmsUrl;
    this.infrastructureConnection = new HubConnectionBuilder()
      .withUrl(`http://${fmsUrl}/infrastructureHub`, HUB_OPTIONS)
      .withServerTimeout(30000) // 30 seconds, per FMS Audience Display
      .withKeepAliveInterval(15000) // 15 seconds per FMS Audience Display
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds(retryContext) {
          console.warn("Retrying SignalR connection...");
          return Math.min(2_000 * retryContext.previousRetryCount, 120_000);
        },
      })
      .build();

    this.gameSpecificConnection = new HubConnectionBuilder()
      .withUrl(`http://${fmsUrl}/gameSpecificHub`, HUB_OPTIONS)
      .withServerTimeout(30000) // 30 seconds, per FMS Audience Display
      .withKeepAliveInterval(15000) // 15 seconds per FMS Audience Display
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds(retryContext) {
          console.warn("Retrying SignalR connection...");
          return Math.min(2_000 * retryContext.previousRetryCount, 120_000);
        },
      })
      .build();

    this.fieldMonitorConnection = new HubConnectionBuilder()
      .withUrl(`http://${fmsUrl}/fieldMonitorHub`, HUB_OPTIONS)
      .withServerTimeout(30000) // 30 seconds, per FMS Audience Display
      .withKeepAliveInterval(15000) // 15 seconds per FMS Audience Display
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds(retryContext) {
          console.warn("Retrying SignalR connection...");
          return Math.min(2_000 * retryContext.previousRetryCount, 120_000);
        },
      })
      .build();

    // Register handlers before starting so no early message hits an unknown method.
    this.handleInfrastructureConnection();
    this.handleGameSpecificConnection();
    this.handleFieldMonitorConnection();

    // Each hub retries independently until its first successful start;
    // withAutomaticReconnect only covers drops after that.
    this.startHubWithRetry(this.infrastructureConnection, "infrastructure", () => {
      this.emit("connected", null);
      this.refreshVideoSwitchOption();
    });
    this.startHubWithRetry(this.gameSpecificConnection, "game specific");
    this.startHubWithRetry(this.fieldMonitorConnection, "field monitor");
  }

  private startHubWithRetry(connection: HubConnection, name: string, onConnected?: () => void) {
    const attempt = () => {
      connection
        .start()
        .then(() => {
          console.log(`Connected to FMS ${name} hub`);
          onConnected?.();
        })
        .catch((err) => {
          console.log(`Failed to connect to FMS ${name} hub, retrying in 5s:`, err);
          setTimeout(attempt, 5_000);
        });
    };
    attempt();
  }

  /** Fetch the current video switch option and emit the matching screen. Used on connect and reconnect. */
  private async refreshVideoSwitchOption() {
    try {
      const res = await fetch(
        `http://${this.fmsUrl}/api/v1.0/settings/get/get_VideoswitchOption`,
      );
      if (!res.ok) {
        console.log(`get_VideoswitchOption returned ${res.status}; keeping current screen`);
        return;
      }
      const option = (await res.text()).replace(/"/g, "");
      console.log("Switching to", option);
      this.videoSwitch(option);
    } catch (err) {
      console.log("Failed to fetch video switch option:", err);
    }
  }

  private handleInfrastructureConnection() {
    /**
     * Any settings changed in FMS
     * VideoSwitchOption
     * BackgroundVideoMessage (texted entered in match control page)
     * AutoTime, TeleopTime, TimeoutTime (match time changed in control page)
     * CurrentWizardStep
     *
     */
    this.infrastructureConnection.on(
      "systemconfigvaluechanged",
      async (data: string) => {
        console.log("systemconfigvaluechanged: ", data);
        if (data === "VideoSwitchOption") {
          await this.refreshVideoSwitchOption();
        }
      },
    );

    // 2026 FMS folds every countdown into one named-timer event (2025's bare
    // MatchTimerChanged is gone). MatchTimer is the match clock: auto counts to
    // 0, the value preloads to the full teleop length and holds while
    // MatchTransitionTimer ticks the 3s auto->teleop pause, then teleop counts
    // down. The pick clock is NOT ticked over the wire (AudienceAllianceTimer is
    // a start trigger; displays run the countdown locally). Timeout/break timer
    // names are unverified for 2026 - log unknown names so a capture reveals them.
    this.infrastructureConnection.on("timerchanged", (data: { Timer: string; TimeLeft: number }) => {
      switch (data.Timer) {
        case "MatchTimer":
        // Unverified-for-2026 names kept forwarded just in case:
        case "TimeoutTimer":
        case "BreakTimer":
          this.emit("timer", data.TimeLeft);
          break;
        // The alliance-selection BREAK clocks (TwoMinuteBreak/EightMinuteBreak)
        // tick here at 1 Hz; the pick clock is trigger-only (never ticked).
        // Kept separate from "timer" so a leftover selection clock can never
        // clobber the match clock.
        case "AllianceSelectionTimer":
          this.emit("allianceClockTick", data.TimeLeft);
          break;
        case "MatchTransitionTimer":
        case "GameSpecificDataTimer":
          break;
        default:
          console.log("timerchanged (unhandled timer): ", data);
      }
    });

    // 30 seconds left (endgame, per GetGameConfig endgameLengthSeconds)
    this.infrastructureConnection.on("matchtimerwarning1", (data) => {
      console.log("matchtimerwarning1: ", data);
      this.emit("endgameWarning", null);
    });

    // 90 seconds left
    this.infrastructureConnection.on("matchtimerwarning2", (data) => {
      // console.log('matchtimerwarning2: ', data);
    });

    // 60 seconds left (intended for timeouts but also played during matches lol)
    this.infrastructureConnection.on("timeoutwarning1", (data) => {
      //console.log('timeoutwarning1: ', data);
    });

    this.infrastructureConnection.on("plc_status_changed", (data) => {
      // console.log("plc_status_changed: ", data);
    });

    this.infrastructureConnection.on(
      "plc_astop_status_requestupdate",
      (data) => {
        //console.log('plc_astop_status_requestupdate: ', data);
      },
    );

    this.infrastructureConnection.on("plc_astop_status_changed", (data) => {
      // console.log("plc_astop_status_changed: ", data);
    });

    this.infrastructureConnection.on(
      "plc_estop_status_requestupdate",
      (data) => {
        //console.log('plc_estop_status_requestupdate: ', data);
      },
    );

    this.infrastructureConnection.on("plc_estop_status_changed", (data) => {
      // console.log("plc_estop_status_changed: ", data);
    });

    this.infrastructureConnection.on(
      "plc_connection_status_requestupdate",
      (data) => {
        //console.log('plc_connection_status_requestupdate: ', data);
      },
    );

    this.infrastructureConnection.on("plc_match_status_changed", (data: PlcMatchStatusData) => {
      this.emit("plcMatchStatus", data);
    });

    this.infrastructureConnection.on("matchstatusinfochanged", (data: MatchStatusInfoData) => {
      console.log("matchstatusinfochanged: ", data);

      if (data.MatchState.endsWith("TO")) {
        this.emit("timeout", data);
      }

      // FMS announces every match load via the prestart states - including the
      // auto-advance right after results post and test matches - so screens
      // like the timeout "Up Next" card can follow the loaded match without
      // waiting for a video switch.
      if (
        (data.MatchState === "WaitingForPrestart" || data.MatchState === "Prestarting") &&
        data.Level !== undefined
      ) {
        this.emit("matchLoaded", { matchNumber: data.MatchNumber, level: data.Level });
      }

      // Match Ready
      if (data.MatchState === "WaitingForMatchStart" || data.MatchState === "WaitingForMatchStartTO") {
        this.emit("matchReady", null);
      }

      // Match Started
      if (data.MatchState === "MatchAuto") {
        this.emit("matchStart", null);
      }
      // Auto Over
      if (data.MatchState === "MatchTransition") {
        this.emit("autoEnd", null);
      }
      // Teleop Started
      if (data.MatchState === "MatchTeleop") {
        this.emit("teleopStart", null);
      }
      // Match Over
      if (data.MatchState === "WaitingForCommit") {
        this.emit("matchEnd", null);
      }
      // Match Abort
      if (data.MatchState === "MatchCancelled") {
        this.emit("matchAbort", null);
      }
      // Scores committed
      if (data.MatchState === "WaitingForPostResults") {
        this.emit("matchCommit", null);
      }
    });

    this.infrastructureConnection.on("matchstatuschanged", (data) => {
      console.log("matchstatuschanged: ", data);
    });

    // BackupPerformed_Incremental when score committed
    // BackupPerformed_Full
    this.infrastructureConnection.on("backupprogress", (data) => {
      console.log("backupprogress: ", data);
    });

    this.infrastructureConnection.on(
      "audienceshowmatchresult",
      (data: { MatchNumber: number; TournamentLevel: keyof typeof LevelParam }) => {
        console.log("audienceshowmatchresult: ", data);
        this.emit("showResults", {
          matchNumber: data.MatchNumber,
          level: data.TournamentLevel,
        });
      },
    );

    this.infrastructureConnection.on("pingaudiencescreen", (data: boolean) => {
      console.log("pingaudiencescreen: ", data);
      this.pingResponse(data);
    });

    this.infrastructureConnection.on("allianceselectionchanged", (data) => {
      console.log("allianceselectionchanged: ", data);
      this.emit("allianceSelectionChanged", data);
    });

    // A decline changes availableTeams (isDeclined flips) without an
    // AllianceSelectionChanged, so route it through the same refetch.
    this.infrastructureConnection.on("allianceselectiondecline", (...args: unknown[]) => {
      console.log("allianceselectiondecline: ", args);
      this.emit("allianceSelectionChanged", args);
    });

    this.infrastructureConnection.on("audiencealliancetimer", (data: AllianceTimerData) => {
      console.log("audiencealliancetimer: ", data);
      this.emit("allianceTimer", data);
    });

    this.infrastructureConnection.on("activetournamentlevelchanged", (data) => {
      console.log("activetournamentlevelchanged: ", data);
      this.emit("tournamentLevelChanged", data);
    });

    // Known-noisy / unused hub methods: intentional no-ops so the signalr client
    // doesn't warn about missing handlers for them (GlobalTimerChanged fires 1/s;
    // VideoSwitchOptionChanged duplicates systemconfigvaluechanged "VideoSwitchOption").
    const infrastructureNoOps = [
      "globaltimerchanged",
      "videoswitchoptionchanged",
      "matchposted",
      "matchcommitted",
      "currentlyactiveeventchanged",
      "currentlyactiveeventdbcreated",
      "scheduleaheadbehindchanged",
      "schedulechanged",
      "audienceshowmessage",
      "lastcycletimecalculated",
    ];
    for (const method of infrastructureNoOps) {
      this.infrastructureConnection.on(method, () => {});
    }

    this.infrastructureConnection.onreconnecting(() => {
      this.emit("disconnected", null);
      console.log("Reconnecting to FMS SignalR");
    });

    this.infrastructureConnection.onreconnected(() => {
      this.emit("connected", null);
      console.log("Reconnected to FMS SignalR");
      // Resync the screen; the FMS may have switched views while we were gone.
      this.refreshVideoSwitchOption();
    });

    this.infrastructureConnection.onclose(() => {
      this.emit("disconnected", null);
      console.log("Disconnected from FMS SignalR");
    });
  }

  private handleGameSpecificConnection() {
    this.gameSpecificConnection.on(
      "BlueScoreChanged",
      (matchData: ScoreChangedData) => {
        this.emit("blueScoreChanged", matchData);
      },
    );
    this.gameSpecificConnection.on(
      "RedScoreChanged",
      (matchData: ScoreChangedData) => {
        this.emit("redScoreChanged", matchData);
      },
    );
    // Scoring elements changed
    // Doesn't seem to work with offseason FMS?
    this.gameSpecificConnection.on(
      "BlueScoringElementsChanged",
      (data: ScoringElementChangedData) => {
        // console.log("BlueScoringElementsChanged", data);
      },
    );
    this.gameSpecificConnection.on(
      "RedScoringElementsChanged",
      (data: ScoringElementChangedData) => {
        // console.log("RedScoringElementsChanged", data);
      },
    );
    this.gameSpecificConnection.on(
      "SendGameSpecificMessage",
      (data: GameSpecificMessage) => {
        this.emit("gameSpecificMessage", data);
      },
    );
    // Known-noisy no-op (see infrastructure list above).
    this.gameSpecificConnection.on("hardwareerrors_requestupdate", () => {});
  }

  private handleFieldMonitorConnection() {
    this.fieldMonitorConnection.on(
      "fieldMonitorDataChanged",
      (data: Array<{ Alliance: string; TeamNumber: number }>) => {
        const teams: { red: number[]; blue: number[] } = {
          red: [],
          blue: [],
        };

        for (const team of data) {
          if (team.Alliance === "Red") {
            teams.red.push(team.TeamNumber);
          } else if (team.Alliance === "Blue") {
            teams.blue.push(team.TeamNumber);
          }
        }

        this.currentTeams = teams;
        this.emit("fieldMonitorTeamsChanged", {
          red: teams.red,
          blue: teams.blue,
        });
      },
    );

    // Known-noisy no-ops (this hub also mirrors match status; the display uses
    // the infrastructure hub's copy).
    const fieldMonitorNoOps = [
      "matchstatusinfochanged",
      "fieldmonitorpreviousmacaddresseschanged",
      "scheduleaheadbehindchanged",
    ];
    for (const method of fieldMonitorNoOps) {
      this.fieldMonitorConnection.on(method, () => {});
    }
  }

  on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void) {
    this.eventCallbacks[event].push(callback);
  }

  private emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    for (const callback of this.eventCallbacks[event]) {
      callback(data);
    }
  }

  private pingResponse(playSound: boolean) {
    this.infrastructureConnection
      .invoke("AudienceScreenPingResponse", {
        UtcNow: new Date().toISOString(),
        MachineName: "RR-AD",
        Version: "25.0.0",
        IsMuted: false,
        Volume: 100,
        IsUsingWifi: false,
      })
      .catch((err) => {
        console.log("AudienceScreenPingResponse failed:", err);
      });
  }

  private videoSwitch(option: string) {
    if (!isVideoSwitchOption(option)) {
      console.log(`Unknown video switch option "${option}"; showing idle screen`);
      this.emit("videoSwitch", "none");
      return;
    }
    const screen = VIDEO_SWITCH_SCREENS[option];
    if (screen === "none" && option !== "Background" && option !== "VideoOnly") {
      console.log(`No dedicated screen for video switch option "${option}"; showing idle screen`);
    }
    this.emit("videoSwitch", screen);
  }
}
