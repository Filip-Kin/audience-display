import type { GameConfig } from "lib";
import { defaultGameConfig } from "./score_mappers";

type FMSGameConfig = Omit<GameConfig, "transitionShiftLengthSeconds"> & {
  coopShiftLengthSeconds: number;
};

export async function fetchGameConfig(fmsUrl: string): Promise<GameConfig> {
  try {
    const res = await fetch(
      `http://${fmsUrl}/api/v1.0/audience_gs/get/GetGameConfig`
    );
    if (!res.ok) {
      console.warn(
        `GetGameConfig returned ${res.status}; using defaults`
      );
      return defaultGameConfig();
    }
    const { coopShiftLengthSeconds, ...rest } = (await res.json()) as FMSGameConfig;
    return { ...rest, transitionShiftLengthSeconds: coopShiftLengthSeconds };
  } catch (err) {
    console.warn("GetGameConfig fetch failed; using defaults", err);
    return defaultGameConfig();
  }
}
