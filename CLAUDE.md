# audience-display

Renders FRC match preview/results, the playoff bracket, alliance selection, and rankings from FMS
(SignalR hubs + REST). Not yet validated against real 2026 FMS.

Bun + Svelte (Vite). Workspaces: `packages/server` (FMS bridge + static host, port **3001**),
`packages/ui` (Svelte UI), `packages/lib` (shared types).

## Profiles (per-event branding + screen overrides)

> **BE CAREFUL WHEN MAKING CHANGES.** For every change, stop and decide its scope FIRST. This is NOT
> a flat rule you can apply mechanically — think about the specific change, and if you can't work out
> which scope is intended, ASK the user.
> - **All-profiles change:** edit a shared default screen / `app.css` / shared code and every profile
>   inherits it. Right when the change is a genuine improvement to shared behavior or layout.
> - **Per-profile change:** put it ONLY in that profile. Right when the change is specific to one
>   event. Do NOT edit a shared file or another profile's assets, and do NOT overwrite a shared asset
>   in place; give the asset a per-profile path with a default fallback instead.
>
> Anything can be either scope, including screen layout and behavior. A layout/behavior change can be
> all-profiles (edit the default screen) OR per-profile (override just that screen via
> `profiles/<id>/screens/...`, see below). Assets/colors/copy likewise: shared default vs. per-profile
> override. So the question is never "is this the kind of thing that's shared?" but "for THIS change,
> is it meant for one event or all of them?" When it's ambiguous, ask.
>
> Getting scope wrong breaks other profiles silently. Real example: the loading cover was one shared
> `/animations/first-frame.png`; regenerating it for WRC clobbered the stock cover for the default
> profile (whose videos still expect the stock frame). The cover is now per-profile (see below) for
> exactly this reason.

Profiles live in `packages/ui/src/profiles/`. Each profile is a `ProfileDefinition`
(`profiles/types.ts`): `id`, `name`, optional `eventName`, `theme`, `assets`, `animations`, and a
`screens` map. Register new profiles in `profiles/index.ts`.

**There is one canonical set of screen components: `profiles/default/screens/`.** Other profiles are
branding overrides (theme colors, event/livestream logos, victory animations) that reuse those
components. This means any change to a component in `profiles/default/screens/` or to `app.css`, or
anything driven off `activeProfile`, is global and applies to every profile automatically. That is
the intended way to keep all profiles in sync: put shared behavior in the default screens / `app.css`,
and reference `activeProfile.assets` / theme vars for anything logo- or color-specific.

**Per-screen override:** `resolveScreen(profileId, screen)` (in `profiles/index.ts`) checks
`profile.screens[screen]` first and falls back to `defaultProfile.screens[screen]` if the profile does
not define it. So a profile's `screens` map is **override-only**: list only the screens you want to
replace, and everything omitted falls back to default. To override one screen for a profile, create the
component under `profiles/<id>/screens/...` and add it to that profile's `screens` map keyed by the
`Screen` id (e.g. `screens: { "scores-ready": MyScoresReady }`). Do NOT set
`screens: defaultProfile.screens` (that hard-copies the whole map and removes the ability to override).

### WRC profile (`profiles/wrc/`)

Wolverine Robotics Competition. `id: "wrc"`. Override-only `screens: {}` (all fall back to default).
Branding: event logo `/wrc.png`, livestream `/pitpodcast.png`, theme reuses default's. `eventName`
is left unset so the live FMS event name shows; set it to override. Victory animations are custom:
`/animations/wrc/{redwins,bluewins,tie}.mp4` (see below).

### Animations and the loading cover

`animation_pack.ts` resolves victory videos: `packUrl(profile, key)` returns
`profile.animations[key]` if set, else `/animations/default/<file>`. Keys: `victoryRed`,
`victoryBlue`, `victoryTie`, `bgIdle`. `ScoresReveal.svelte` picks the video by match winner and, on a
video error, falls back to the default pack.

The loading cover is the still shown while the victory video buffers (`ScreenRouter.svelte`, via
`coverUrl($activeProfile)` in `animation_pack.ts`). It is **per-profile**: `coverUrl(profile)` returns
`profile.animations.cover` if set, else the stock `/animations/first-frame.png` (which matches the
default `/animations/default/*` videos). A profile with custom victory videos MUST ship its own cover
(the first frame of ITS clips) and must NOT overwrite the shared stock cover. WRC's cover is
`/animations/wrc/first-frame.png`. Regenerate a profile's cover from its own clip:
`ffmpeg -y -i packages/ui/public/animations/wrc/redwins.mp4 -frames:v 1 -update 1 packages/ui/public/animations/wrc/first-frame.png`
(the WRC red/blue/tie clips share an identical opening frame).

Optimize new victory videos for fast load with faststart:
`ffmpeg -y -i IN -c:v libx264 -profile:v high -pix_fmt yuv420p -preset medium -crf 21 -maxrate 6M -bufsize 12M -movflags +faststart -c:a aac -b:a 128k OUT`

### Glint (glimmer) sweep

The logo shimmer on the scores-ready screen is a masked gradient in `app.css` (`.glint-wrapper::before`).
The mask must be the **profile's** event logo, passed in via the `--glint-mask` CSS var set on the
wrapper in `ScoresReady.svelte` (`style="--glint-mask: url('{eventLogo}')"`). Do not hardcode a logo
path in `app.css` (a stale `/logo.png` there silently masked out the whole effect).

## Building and running the demo

The server (`packages/server/src/index.ts`) serves the built UI from `./.temp/dist` (relative to its
cwd, `packages/server`) and hosts the WebSocket on port **3001**. It reads the active profile from a
`.active-profile` marker file in that cwd, defaulting to `default`. FMS target: `FMS_URL` (default
`10.0.100.5`); `FAKE_FMS=true` points at a local dotnet fake at `127.0.0.1:8080` instead.

Build + run against the live `fake-fms` at `10.0.100.5`:

```bash
bun install
bun run ui:build                                  # vite build + repack ui-dist.zip
cp -r packages/ui/dist packages/server/.temp/dist # stage what the server serves in dev
echo wrc > packages/server/.active-profile        # pick the profile
cd packages/server && FMS_URL=10.0.100.5 bun src/index.ts
# open http://<server-ip>:3001/display  (server LAN IP is 192.168.1.2)
```

The server only serves `./.temp/dist` in dev (the compiled `.exe` build unzips `ui-dist.zip` itself),
so after a UI change rebuild and re-copy into `packages/server/.temp/dist`; the running process serves
assets live with no restart.

## Testing with the Fake FMS emulator (MCP)

`fake-fms` (repo `Filip-Kin/fake-fms`) emulates real 2026 FMS at **`10.0.100.5`** (same SignalR hubs +
REST), so the display can run a whole event with no real field. It exposes an MCP server you (Claude)
can drive to set up scenarios. If the tools/endpoint aren't reachable, the emulator just isn't running
— fall back to asking.

- FMS API + SignalR: `http://10.0.100.5` · operator console: `http://10.0.100.5:3010`
- Add the MCP server if it isn't configured:
  `claude mcp add --transport http fake-fms http://10.0.100.5:3010/mcp`

### Tools

- Read: `get_state`, `list_matches`, `get_alliance_selection`, `get_bracket`
- Match: `select_match` → `prestart` → `set_audience` (preview) → `arm_match` → `start_match` →
  `commit_scores` → `post_results` (results screen) → `next_match`; `abort_match`
- Scoring: `set_score`, `reset_scores` · Level: `set_level`
- Alliance selection: `alliance_start`, `alliance_pick`, `alliance_decline`, `alliance_skip`,
  `alliance_undo`, `alliance_save`
- Field monitor: `cycle_station`, `set_station_flag`, `reset_stations`
- Autoplay: `set_autoplay { replayLogs, autoFaults }`

### Scenarios

- Preview/results: `select_match` → `set_audience` → `set_score` → `commit_scores` → `post_results`
- Alliance selection screen: `alliance_start`, then pick/decline/skip (fires `AllianceSelectionChanged`)
- Bracket: after `alliance_save`, run playoff matches and `commit_scores`; the double-elim bracket
  auto-advances
- Rankings: run Qualification matches + `commit_scores`; `GetQualRankings` recomputes

Read the current match from `GET /api/v1.0/audience/get/GetCurrentMatchAndPlayNumber`
(`{item1: level string, item2: matchNumber, item3: playNumber}`, 204 when idle) — not the removed 2025
route `/FieldMonitor/MatchNumberAndPlay`.
