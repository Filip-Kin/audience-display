# audience-display

Renders FRC match preview/results, the playoff bracket, alliance selection, and rankings from FMS
(SignalR hubs + REST). Not yet validated against real 2026 FMS.

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
