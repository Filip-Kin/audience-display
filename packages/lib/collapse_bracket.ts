import type { AudienceDoubleElimMatch, BracketData } from "./types/bracket";

// #region collapse a filler-backfilled 8-alliance bracket
//
// A small offseason event can't fill 8 playoff alliances, so it runs the
// STANDARD FRC 8-alliance double elimination anyway and backfills the empty
// seats with "filler" alliances (the seeds beyond the real count). Every match
// a real alliance plays against a filler is a foregone 1-0 forfeit. This module
// takes the fixed 8-alliance topology, marks the filler seeds, and keeps ONLY
// the real-vs-real matches - the ones actually worth watching - then rewires the
// advancement links so the surviving matches connect through the pruned ones.
// The result is a compact bracket (a 4-real event collapses to a clean
// 4-alliance double elim; 5-real to a valid irregular ladder).
//
// realAllianceCount === 8 means no fillers, so nothing collapses and callers
// should keep the normal hardcoded layout.

/** A slot is fed by a seed, or the winner/loser of another match. */
type Feed = { seed: number } | { win: MatchId } | { lose: MatchId };
type MatchId =
  | "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7"
  | "M8" | "M9" | "M10" | "M11" | "M12" | "M13" | "F";
type Track = "upper" | "lower" | "m13" | "finals";

type TopoEntry = { track: Track; red: Feed; blue: Feed };

// Standard FRC 8-alliance double elimination. Seeding: M1 1v8, M2 4v5, M3 2v7,
// M4 3v6 (halves {1,4,5,8} and {2,3,6,7}); winner/loser flow matches the
// hardcoded advancement graph in BracketGrid.
const TOPO: Record<MatchId, TopoEntry> = {
  M1: { track: "upper", red: { seed: 1 }, blue: { seed: 8 } },
  M2: { track: "upper", red: { seed: 4 }, blue: { seed: 5 } },
  M3: { track: "upper", red: { seed: 2 }, blue: { seed: 7 } },
  M4: { track: "upper", red: { seed: 3 }, blue: { seed: 6 } },
  M5: { track: "lower", red: { lose: "M1" }, blue: { lose: "M2" } },
  M6: { track: "lower", red: { lose: "M3" }, blue: { lose: "M4" } },
  M7: { track: "upper", red: { win: "M1" }, blue: { win: "M2" } },
  M8: { track: "upper", red: { win: "M3" }, blue: { win: "M4" } },
  M9: { track: "lower", red: { lose: "M7" }, blue: { win: "M6" } },
  M10: { track: "lower", red: { lose: "M8" }, blue: { win: "M5" } },
  M11: { track: "upper", red: { win: "M7" }, blue: { win: "M8" } },
  M12: { track: "lower", red: { win: "M9" }, blue: { win: "M10" } },
  M13: { track: "m13", red: { lose: "M11" }, blue: { win: "M12" } },
  F: { track: "finals", red: { win: "M11" }, blue: { win: "M13" } },
};

const ORDER: MatchId[] = [
  "M1", "M2", "M3", "M4", "M5", "M6", "M7",
  "M8", "M9", "M10", "M11", "M12", "M13", "F",
];

// Where each match's WINNER goes (the inverse of the win: feeds above). Bracket
// lines drawn on screen represent winner advancement ONLY - "the winner of A
// plays in B" - never a loser dropping to the lower bracket. F is terminal.
const WINNER_DEST: Record<MatchId, MatchId | null> = {
  M1: "M7", M2: "M7", M3: "M8", M4: "M8", M5: "M10", M6: "M9", M7: "M11",
  M8: "M11", M9: "M12", M10: "M12", M11: "F", M12: "M13", M13: "F", F: null,
};

/** Match number (1..13) for a body match id; F resolves to bracket.finals. */
const idToNumber = (id: MatchId): number | null =>
  id === "F" ? null : Number(id.slice(1));

export type CollapsedNode = {
  id: MatchId;
  match: AudienceDoubleElimMatch;
  track: Track;
  /** Round depth in the surviving graph (0 = first real matches). */
  depth: number;
};

export type CollapsedBracket = {
  nodes: CollapsedNode[];
  /** Advancement links between surviving matches ([from, to]). */
  links: [MatchId, MatchId][];
};

/**
 * Collapse a filler-backfilled bracket to just its real-vs-real matches.
 * Returns null when nothing should collapse (count >= 8, or no real matches are
 * populated yet) so callers fall back to the standard layout.
 */
export function collapseBracket(
  bracket: BracketData,
  realAllianceCount: number
): CollapsedBracket | null {
  const n = Math.max(2, Math.min(8, Math.round(realAllianceCount || 8)));
  if (n >= 8) return null;

  // classifySlot / classifyMatch decide whether a slot ends up holding a real
  // alliance or a filler, assuming every filler loses its matches 1-0.
  const matchCache = new Map<MatchId, { red: "real" | "filler"; blue: "real" | "filler" }>();
  const classifyMatch = (id: MatchId) => {
    const cached = matchCache.get(id);
    if (cached) return cached;
    const t = TOPO[id];
    const res = { red: classifySlot(t.red), blue: classifySlot(t.blue) };
    matchCache.set(id, res);
    return res;
  };
  const classifySlot = (f: Feed): "real" | "filler" => {
    if ("seed" in f) return f.seed <= n ? "real" : "filler";
    const c = classifyMatch("win" in f ? f.win : f.lose);
    if ("win" in f) {
      // Winner is a filler only if BOTH sides were fillers.
      return c.red === "filler" && c.blue === "filler" ? "filler" : "real";
    }
    // Loser is a real alliance only if BOTH sides were real.
    return c.red === "real" && c.blue === "real" ? "real" : "filler";
  };

  const shown = (id: MatchId): boolean => {
    const c = classifyMatch(id);
    return c.red === "real" && c.blue === "real";
  };

  // Trace a slot's feed back to the surviving match (or seed) that actually
  // supplies it, skipping over pruned filler matches (where the real side always
  // advances). Returns the shown match id that should draw a connector, if any.
  const traceSource = (f: Feed): MatchId | null => {
    if ("seed" in f) return null; // entry seed, no connector
    const m = "win" in f ? f.win : f.lose;
    if (shown(m)) return m;
    if ("win" in f) {
      // Pruned winner-feed: follow the one real side of the pruned match.
      const c = classifyMatch(m);
      const t = TOPO[m];
      const realFeed = c.red === "real" ? t.red : c.blue === "real" ? t.blue : null;
      return realFeed ? traceSource(realFeed) : null;
    }
    // A pruned loser-feed only ever supplies a filler, so it never reaches a
    // shown match's real slot.
    return null;
  };

  const numberToMatch = new Map(
    bracket.doubleElimMatchesList.map((m) => [m.matchNumber, m])
  );
  const matchFor = (id: MatchId): AudienceDoubleElimMatch | null => {
    if (id === "F") return bracket.finals;
    return numberToMatch.get(idToNumber(id)!) ?? null;
  };

  const shownIds = ORDER.filter(shown);

  // Feed graph INCLUDING loser drops - used ONLY to place matches in the right
  // round (column depth). A lower-bracket match is fed by losers, so it draws no
  // incoming winner line, but it must still sit in its proper round, not column 0.
  const feedLinks: [MatchId, MatchId][] = [];
  for (const id of shownIds) {
    for (const f of [TOPO[id].red, TOPO[id].blue]) {
      const src = traceSource(f);
      if (src && shown(src)) feedLinks.push([src, id]);
    }
  }

  // Winner-advancement links - the ONLY ones drawn. Follow each shown match's
  // winner through pruned filler matches to the next shown match.
  const seen = new Set<string>();
  const winnerLinks: [MatchId, MatchId][] = [];
  for (const id of shownIds) {
    let dest: MatchId | null = WINNER_DEST[id];
    while (dest && !shown(dest)) dest = WINNER_DEST[dest];
    if (dest && shown(dest)) {
      const k = `${id}>${dest}`;
      if (!seen.has(k)) {
        seen.add(k);
        winnerLinks.push([id, dest]);
      }
    }
  }

  // Longest-path round depth over the FULL feed graph (loser drops included).
  const depthCache = new Map<MatchId, number>();
  const preds = (id: MatchId) => feedLinks.filter(([, to]) => to === id).map(([from]) => from);
  const depthOf = (id: MatchId): number => {
    const cached = depthCache.get(id);
    if (cached !== undefined) return cached;
    const p = preds(id);
    const d = p.length ? 1 + Math.max(...p.map(depthOf)) : 0;
    depthCache.set(id, d);
    return d;
  };

  const nodes: CollapsedNode[] = [];
  for (const id of shownIds) {
    const match = matchFor(id);
    if (!match) continue; // FMS hasn't populated this match yet
    nodes.push({ id, match, track: TOPO[id].track, depth: depthOf(id) });
  }
  // Nothing real to show yet (e.g. bracket not built): let caller fall back.
  if (!nodes.length) return null;

  // Only keep winner links whose endpoints both survived as nodes.
  const present = new Set(nodes.map((no) => no.id));
  const finalLinks = winnerLinks.filter(([a, b]) => present.has(a) && present.has(b));

  return { nodes, links: finalLinks };
}
// #endregion
