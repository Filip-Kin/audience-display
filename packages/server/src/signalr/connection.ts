import { HubConnectionBuilder, type HubConnection } from "@microsoft/signalr";

type Events = "videoSwitch" | "timer";

export class FMSSignalRConnection {
  private fmsUrl: string;
  private infrastructureConnection: HubConnection;

  private eventCallbacks: { [key in Events]: Function[] } = {
    videoSwitch: [],
    timer: [],
  };

  constructor(fmsUrl: string) {
    this.fmsUrl = fmsUrl;
    this.infrastructureConnection = new HubConnectionBuilder()
      .withUrl(`http://${fmsUrl}/infrastructureHub`)
      .withServerTimeout(30000) // 30 seconds, per FMS Audience Display
      .withKeepAliveInterval(15000) // 15 seconds per FMS Audience Display
      // .configureLogging({
      //   log: (logLevel, message) => {
      //     [
      //       console.debug,
      //       console.debug,
      //       console.log,
      //       console.warn,
      //       console.error,
      //     ][logLevel](`[SignalR ${logLevel}] ${message}`);
      //   },
      // })
      // .withHubProtocol(new MessagePackHubProtocol())
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds(retryContext) {
          console.warn("Retrying SignalR connection...");
          return Math.min(2_000 * retryContext.previousRetryCount, 120_000);
        },
      })
      .build();

    this.infrastructureConnection.start().then(async () => {
      console.log("Connected to FMS infrastructure hub");

      const videoSwitchOption = await fetch(
        `http://${this.fmsUrl}/api/v1.0/settings/get/get_VideoswitchOption`,
      );
      const option = (await videoSwitchOption.text()).replace(/"/g, "");
      console.log("Switching to", option);
      this.videoSwitch(option);
    });

    this.handleInfrastructureConnection();
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
    });

    // 90 seconds left
    this.infrastructureConnection.on("matchtimerwarning2", (data) => {
      //console.log('matchtimerwarning2: ', data);
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
    });

    this.infrastructureConnection.on("matchstatuschanged", (data) => {
      console.log("matchstatuschanged: ", data);
    });

    this.infrastructureConnection.on("pingaudiencescreen", (data) => {
      console.log("pingaudiencescreen: ", data);
      this.pingResponse(data);
    });

    this.infrastructureConnection.onreconnected(() => {
      console.log("Reconnected to FMS SignalR");
    });

    this.infrastructureConnection.onclose(() => {
      console.log("Disconnected from FMS SignalR");
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
      Version: "24.0.0",
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
    }
  }
}
