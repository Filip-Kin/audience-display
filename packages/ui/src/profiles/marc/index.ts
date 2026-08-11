import type { ProfileDefinition } from "../types";
import defaultProfile from "../default";

/**
 * MARC profile — Michigan-area offseason event, run as a Pit Podcast show.
 *
 * Pure re-theme of the default profile (screens: {}), same as WRC: it only
 * swaps the event branding and pins the avatar event code. Everything else
 * (all screen layouts, the RR-era fixes, caption auto-positioning) is inherited
 * from the default profile via resolveScreen().
 *
 * Branding decisions (Filip, MARC prep):
 *  - Event logo only, NO event sponsors (the event has none). The Pit Podcast
 *    stays as the livestream partner in its dedicated reveal spot since Pit
 *    Podcast is broadcasting the show.
 *  - Colors stay the stock red/blue shutter (no custom theme requested).
 */
const profile: ProfileDefinition = {
  id: "marc",
  name: "MARC (Pit Podcast)",
  // eventName omitted -> uses the live FMS event name. Set a string here to
  // force the on-screen title if FMS reports an odd name.
  // TBA-style event code so the avatar store serves the 2026marc event scope
  // (incl. the custom 9992/9993 avatars for the second 503 / 1502 entries).
  eventCode: "2026marc",
  theme: {
    // Stock default red/blue shutter, but the accent (match name, top-bar trim,
    // breakdown header) is the MARC logo red instead of the default gold. Lifted
    // from the logo's #910B0A so it reads as text on the dark screens.
    ...defaultProfile.theme,
    // Brighter MARC red for the accent (match name, breakdown header, etc.).
    accentWarn: "oklch(0.63 0.245 25)",
    // The scorebar accent bars/borders would blend with the red alliance if they
    // were the red accent, so keep them white there.
    scoreBarAccent: "white",
  },
  assets: {
    // Center logo on the score-reveal screen. DROP THE FILE at
    // packages/ui/public/marc.png before building (high-res, transparent PNG).
    event: "/marc.png",
    // No event sponsors -> empty carousel on the reveal / chrome screens.
    sponsors: [],
    // Pit Podcast is the broadcaster; keep it in the dedicated livestream slot.
    livestream: "/pitpodcast.png",
  },
  // Override-only: omitted screens fall back to the default profile.
  screens: {},
};

export default profile;
