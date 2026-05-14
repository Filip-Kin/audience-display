export type LogoPosition =
  | "top-left"
  | "top-right"
  | "top-center"
  | "bottom-left"
  | "bottom-right";

export type EventConfigTheme = {
  primary: string;
  secondary: string;
  redAlliance: string;
  blueAlliance: string;
  accentWarn: string;
  background: string;
  surface: string;
  text: string;
};

export type EventConfigAssets = {
  logo?: string;
  logoSecondary?: string;
  sponsors: string[];
  backgroundImage?: string;
};

export type EventConfigLayout = {
  logoPosition: LogoPosition;
  sponsorRotateMs: number;
};

export type EventConfigEvent = {
  nameOverride?: string;
  matchCountOverride?: number;
};

export type EventConfig = {
  name: string;
  event: EventConfigEvent;
  theme: EventConfigTheme;
  assets: EventConfigAssets;
  animationPack: string;
  layout: EventConfigLayout;
};
