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
  /**
   * REFEREE attention colour: the MATCH UNDER REVIEW card in the score bar, the
   * same banner on the reveal, and the alliance-pick clock warning. This is the
   * FRC attention yellow and a profile should leave it alone - it is field
   * semantics, not branding. To give a profile a brand accent, set `accent`.
   */
  accentWarn: string;
  /**
   * CHROME accent: screen headers and their rules, section bars, bullets, the
   * up-next match name, the bracket's current-match highlight, confetti. Falls
   * back to `accentWarn`, so a profile that sets neither looks stock.
   *
   * Must be LIGHT (L >= 0.75). It carries near-black ink at ~14 sites.
   */
  accent?: string;
  background: string;
  surface: string;
  text: string;
  /**
   * Accent for the SCORE-BAR bars/borders (top-bar trim, the shift bar, the
   * shift/bug highlights). Defaults to `accentWarn`. Set it (e.g. to white) when
   * the accent color would blend with the red/blue alliance on the bar.
   */
  scoreBarAccent?: string;
  /**
   * Color of the MATCH-LABEL text (the match number/name in the top bar and on
   * the results/reveal screen). Defaults to `accentWarn`. Set it (e.g. to white)
   * when a dark accent reads with poor contrast on the dark bars.
   */
  matchLabel?: string;
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
