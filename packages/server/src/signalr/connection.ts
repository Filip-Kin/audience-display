import { HubConnectionBuilder, type HubConnection } from "@microsoft/signalr";
import { type ScoreChangedData, type ScoringElementChangedData } from "lib";

type Events =
  | "videoSwitch"
  | "timer"
  | "blueScoreChanged"
  | "redScoreChanged"
  | "matchCommit"
  | "showResults"
  | "endgameWarning"
  | "matchReady"
  | "matchStart"
  | "matchEnd"
  | "matchAbort"
  | "teleopStart"
  | "autoEnd"
  | "allianceSelectionChanged"
  | "connected"
  | "disconnected"
  | "timeout"
  | "fieldMonitorTeamsChanged";

export class FMSSignalRConnection {
  private fmsUrl: string;
  private infrastructureConnection: HubConnection;
  private gameSpecificConnection: HubConnection;
  private fieldMonitorConnection: HubConnection;
  private currentTeams: {
    red: number[];
    blue: number[];
  } = { red: [], blue: [] };

  private eventCallbacks: { [key in Events]: Function[] } = {
    videoSwitch: [],
    timer: [],
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
    connected: [],
    disconnected: [],
    timeout: [],
    fieldMonitorTeamsChanged: [],
  };

  constructor(fmsUrl: string) {
    this.fmsUrl = fmsUrl;
    this.infrastructureConnection = new HubConnectionBuilder()
      .withUrl(`http://${fmsUrl}/infrastructureHub`)
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
      .withUrl(`http://${fmsUrl}/gameSpecificHub`)
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
      .withUrl(`http://${fmsUrl}/fieldMonitorHub`)
      .withServerTimeout(30000) // 30 seconds, per FMS Audience Display
      .withKeepAliveInterval(15000) // 15 seconds per FMS Audience Display
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds(retryContext) {
          console.warn("Retrying SignalR connection...");
          return Math.min(2_000 * retryContext.previousRetryCount, 120_000);
        },
      })
      .build();

    this.infrastructureConnection.start().then(async () => {
      console.log("Connected to FMS infrastructure hub");
      this.emit("connected", null);

      const videoSwitchOption = await fetch(
        `http://${this.fmsUrl}/api/v1.0/settings/get/get_VideoswitchOption`,
      );
      const option = (await videoSwitchOption.text()).replace(/"/g, "");
      console.log("Switching to", option);
      this.videoSwitch(option);
    });

    this.gameSpecificConnection.start().then(() => {
      console.log("Connected to FMS game specific hub");
    });

    this.fieldMonitorConnection.start().then(() => {
      console.log("Connected to FMS field monitor hub");
    });

    this.handleInfrastructureConnection();
    this.handleGameSpecificConnection();
    this.handleFieldMonitorConnection();
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
      async (data) => {
        console.log("systemconfigvaluechanged: ", data);
        if (data === "VideoSwitchOption") {
          const videoSwitchOption = await fetch(
            `http://${this.fmsUrl}/api/v1.0/settings/get/get_VideoswitchOption`,
          );
          const option = (await videoSwitchOption.text()).replace(/"/g, "");
          console.log("Switching to", option);
          this.videoSwitch(option);
        }
      },
    );

    // Constant countdown timer 14-0 for auto then 135-0 for teleop
    // Also countdown for breaks during playoffs in seconds
    this.infrastructureConnection.on("matchtimerchanged", (data) => {
      console.log("matchtimerchanged: ", data);
      this.emit("timer", data);
    });

    // 20 seconds left
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

    this.infrastructureConnection.on("plc_match_status_changed", (data) => {
      console.log("plc_match_status_changed: ", data);
    });

    this.infrastructureConnection.on("matchstatusinfochanged", (data) => {
      console.log("matchstatusinfochanged: ", data);

      if (data.MatchState.endsWith("TO")) {
        this.emit("timeout", null);
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

    this.infrastructureConnection.on("audienceshowmatchresult", (data) => {
      console.log("audienceshowmatchresult: ", data);
      this.emit("showResults", {
        matchNumber: data.MatchNumber,
        level: data.TournamentLevel
      });
    });

    this.infrastructureConnection.on("matchstatuschanged", (data) => {
      console.log("matchstatuschanged: ", data);
    });

    this.infrastructureConnection.on("pingaudiencescreen", (data) => {
      console.log("pingaudiencescreen: ", data);
      this.pingResponse(data);
    });

    this.infrastructureConnection.on("allianceselectionchanged", (data) => {
      console.log("allianceselectionchanged: ", data);
      this.emit("allianceSelectionChanged", null);
    });

    this.infrastructureConnection.onreconnecting(() => {
      this.emit("disconnected", null);
      console.log("Reconnecting to FMS SignalR");
    });

    this.infrastructureConnection.onreconnected(() => {
      this.emit("connected", null);
      console.log("Reconnected to FMS SignalR");
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
  }

  private handleFieldMonitorConnection() {
    this.fieldMonitorConnection.on("fieldMonitorDataChanged", (data) => {
      const teams = {
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
    });
  }

  on(event: Events, callback: (data: any) => void) {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }
    this.eventCallbacks[event].push(callback);
  }

  private emit(event: Events, data: any) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event].forEach((callback) => {
        callback(data);
      });
    }
  }

  private async pingResponse(playSound: boolean) {
    this.infrastructureConnection.invoke("AudienceScreenPingResponse", {
      UtcNow: new Date().toISOString(),
      MachineName: "RR-AD",
      Version: "25.0.0",
      IsMuted: false,
      Volume: 100,
      IsUsingWifi: false,
    });
  }

  private videoSwitch(option: string) {
    if (option === "VideoOnly") {
      this.emit("videoSwitch", "none");
    } else if (option === "VideoAndScore") {
      this.emit("videoSwitch", "match-ready");
    } else if (option === "MatchPreview") {
      this.emit("videoSwitch", "match-preview");
    } else if (option === "MatchResults") {
      this.emit("videoSwitch", "score-reveal");
    } else if (option === "AllianceHybrid") {
      this.emit("videoSwitch", "alliance-selection");
    } else if (option === "AllianceFullscreen") {
      this.emit("videoSwitch", "alliance-selection-fullscreen");
    } else if (option === "Timeout") {
      this.emit("videoSwitch", "timeout");
    }
  }
}
