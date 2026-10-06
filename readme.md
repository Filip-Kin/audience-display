# Audience Display

Custom FRC audience display used for offseason events (built for Rainbow Rumble, themeable for
others). A Bun server connects to FMS over SignalR + REST and drives a Svelte UI that renders
every audience screen: match preview, live score bar, score reveal, alliance selection,
selection break timer, rankings, playoff bracket, and field timeout.

Screens follow the FMS **video switch** directly, so the display is operated entirely from the
normal FMS match control page (including the alliance-selection wizard's Break Timer button).

## Profiles

The look is defined by a profile; screens a profile doesn't override fall back to `default`.

| Profile | Notes |
| --- | --- |
| `default` | Red/blue theme, all screens |
| `wrc` | Re-theme of default (colors/assets only) |
| `rainbow-rumble` | Full restyle of every screen |

Pick the profile from the gear menu on the display page (bottom-right hover); the choice is
stored server-side, so every connected display switches together.

**By FMS event code:** a profile can list the FMS event codes it belongs to (`eventCodes` in
`packages/lib/profile_index.ts`). When the FMS event code becomes known or changes and exactly one
profile lists it (case-insensitive), the server selects that profile. No match leaves the current
choice alone. A manual pick made after an automatic one stands until the event code changes again,
across restarts too (the code that made the last automatic pick is kept in `.active-profile-event`
next to `.active-profile`). The server reads the code from FMS
(`/api/v1.0/systembase/get/get_CurrentlyActiveEventCode`) at boot, on every reconnect, and when FMS
pushes `CurrentlyActiveEventChanged`.

## FIM AV Assistant event channel

Optional; the display runs the same with nothing connected.

- `GET /api/events`: `text/event-stream`. The first message is
  `{"type":"hello","addon":"audience-display","protocol":1,"version":"<version>","profile":{...},"fms":{...},"companion":{...}}`,
  then one `data: <json>` message per change (no `event:` field) and `: ping` every 15 s. Lasting
  problems (UI bundle missing, unknown profile) follow the hello as `error` messages.
  - `{"type":"profile","id","name","source"}`, source `"event"`, `"manual"` or `"default"`
  - `{"type":"fms","connected","eventCode"}` (`eventCode` is `null` until FMS reports one)
  - `{"type":"companion","enabled"}` when the Bitfocus Companion setting changes
  - `{"type":"error","message"}` for FMS connection lost, profile save failure, unknown profile
- `POST /api/control/event` `{"eventCode":"MIBIG1"}`: an event code from AV Assistant, same
  selection rule as an FMS code. Returns `{"ok":true}` or `{"ok":false,"error":"..."}`. It does not
  change the `fms.eventCode` FMS reports.

## Running an event (Windows exe)

Grab `audience-display-<version>.exe` from the
[latest release](https://github.com/Filip-Kin/audience-display/releases/latest) and run it on a
machine that can reach FMS. Open `http://localhost:3001/display` in a fullscreen browser (OBS
browser source works too).

- FMS is expected at `10.0.100.5`. For a local FMS install:
  `$env:FMS_URL = "127.0.0.1"` (PowerShell) before launching the exe.
- **Auto-update:** on startup the exe checks the latest GitHub release, downloads the new
  versioned exe next to itself, relaunches, and cleans up old versions on the following boot.
  Set `AUTO_UPDATE=0` to disable.
- Display URL parameters: `?inverted=true` (swap red/blue sides), `?top=true` (score bar at the
  top), `?transitionAfterMatchEnd=<seconds>` (auto-switch to the waiting screen after the match
  ends; default `-1` keeps the score bar up until scores are committed).

## FMS traffic logging

The server records every SignalR frame and REST response to a SQLite database
(`%APPDATA%\audience-display\fms-log.sqlite`) for protocol reverse-engineering. If sync
credentials are configured (baked into release exes via CI secrets, or a `log-sync.json` /
`LOG_SYNC_USER`/`LOG_SYNC_PASS`/`LOG_SYNC_URL` env vars), new rows are uploaded as gzipped
NDJSON chunks every 10 minutes and after every finals match. Merge chunks back into one
database with `bun tools/import-fms-log-chunks.ts`.

## Development

Requires [bun](https://bun.sh/). Install once with `bun install`, then run the server and UI in
separate terminals:

```bash
bun run server:dev   # display server on :3001
bun run ui:dev       # vite dev server on :5173, proxies the websocket to :3001
```

The server targets `FMS_URL` (default `10.0.100.5`). For development without a real field, run
[fake-fms](https://github.com/Filip-Kin/fake-fms) - a Bun/TypeScript FMS emulator with a control
panel, scripted test scenarios, and wire-faithful SignalR/REST behavior - and point the server
at it with `FAKE_FMS=1`.

### Building the exe

```bash
bun run exe:build   # bundles the UI, embeds it, cross-compiles to audience-display.exe
```

Releases are automated: pushing a `v*` tag builds the exe (with log-sync credentials baked from
repo secrets) and publishes it as a versioned GitHub release asset, which running installs then
pick up via auto-update.

## Repo layout

```
packages/lib      shared types (FMS wire DTOs, display state)
packages/server   Bun server: FMS SignalR/REST client, state, logging, auto-update
packages/ui       Svelte UI: profiles, screens, sounds
tools/            log-chunk import utility
```
