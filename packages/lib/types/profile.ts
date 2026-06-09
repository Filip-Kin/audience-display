export type LogoPosition =
  | "top-left"
  | "top-right"
  | "top-center"
  | "bottom-left"
  | "bottom-right";

export type ProfileTheme = {
  primary: string;
  secondary: string;
  redAlliance: string;
  blueAlliance: string;
  accentWarn: string;
  background: string;
  surface: string;
  text: string;
};

export type ProfileAssets = {
  event?: string;
  livestream?: string;
  sponsors: string[];
};

export type ProfileLayout = {
  logoPosition: LogoPosition;
  sponsorRotateMs: number;
};
