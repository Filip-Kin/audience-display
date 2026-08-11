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
  /**
   * Accent for the SCORE-BAR bars/borders (top-bar trim, the shift bar, the
   * shift/bug highlights). Defaults to `accentWarn`. Set it (e.g. to white) when
   * the accent color would blend with the red/blue alliance on the bar.
   */
  scoreBarAccent?: string;
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
  /**
   * Optional event-feedback QR. Shown ONLY on the full-screen sponsor
   * slideshow (breaks/timeout/background/schedule), never in the score-reveal
   * carousel. Rendered on a white card with its label beneath.
   */
  feedbackQr?: { src: string; label: string };
};

export type ProfileLayout = {
  logoPosition: LogoPosition;
  sponsorRotateMs: number;
};
