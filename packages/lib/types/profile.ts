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

export type SponsorLogo = {
  src: string;
  /** Logo needs a white card behind it to read on a dark background. */
  light?: boolean;
};

export type ProfileAssets = {
  event?: string;
  livestream?: string;
  /**
   * Sponsor art rotated on the chrome screens. The entry whose src matches
   * `livestream` is excluded from the results-screen carousel, since the
   * livestream partner has its own dedicated spot there.
   */
  sponsors: SponsorLogo[];
};

export type ProfileLayout = {
  logoPosition: LogoPosition;
  sponsorRotateMs: number;
};
