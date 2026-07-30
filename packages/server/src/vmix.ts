import { readFileSync } from "fs";
import { join } from "path";
import { appDataDir } from "./fms_logger";

// vMix HTTP-API client + the two audience-display automation actions used by the
// landing page (/):
//
//   1. ensureFmsInput()  - make sure a Browser input titled "FMS" points at the
//      display URL. This is the input operators drop on overlay 7 as normal.
//
//   2. setupAllianceCamera() - build a SEPARATE composite input that shows the
//      live alliance-selection camera behind the display's transparent cut-out:
//        layer 1 = the chosen camera, positioned/zoomed into the cut-out rect
//        layer 2 = the FMS display, full-frame (its box-shadow cut-out is a
//                  transparent hole, so the camera below shows through it).
//
// The camera rect is derived from the alliance-selection layout (see boxRect)
// in the display's fixed 1920x1080 logical space, then mapped to vMix canvas
// pixels. The canvas resolution is discovered at runtime by self-calibration
// (set a known zoom on the layer, read back the rendered width), so it adapts
// to any vMix output resolution (1080p / 1440p / 4K) with no hard-coding.

// #region config
let baseUrl = "http://127.0.0.1:8088";

function readSettings(): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(join(appDataDir(), "settings.json"), "utf-8"));
  } catch {
    return {};
  }
}

export function initVmix(): void {
  const s = readSettings();
  if (typeof s.vmixUrl === "string" && s.vmixUrl) baseUrl = s.vmixUrl.replace(/\/+$/, "");
  if (process.env.VMIX_URL) baseUrl = process.env.VMIX_URL.replace(/\/+$/, "");
}
// #endregion

// #region low-level API
async function call(params: Record<string, string>): Promise<void> {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${baseUrl}/api/?${qs}`);
  if (!r.ok) throw new Error(`vMix ${params.Function} -> HTTP ${r.status}`);
}

async function state(): Promise<string> {
  const r = await fetch(`${baseUrl}/api`);
  if (!r.ok) throw new Error(`vMix state -> HTTP ${r.status}`);
  return r.text();
}

export interface VmixInput {
  key: string;
  number: number;
  type: string;
  title: string;
}

function parseInputs(xml: string): VmixInput[] {
  return [...xml.matchAll(/<input key="([^"]*)"[^>]*number="(\d+)"[^>]*type="([^"]*)"[^>]*title="([^"]*)"/g)].map(
    (m) => ({ key: m[1], number: Number(m[2]), type: m[3], title: m[4] })
  );
}

/** XML for a single input by key. */
function inputXml(xml: string, key: string): string {
  return xml.match(new RegExp(`<input key="${key}"[\\s\\S]*?</input>`))?.[0] ?? "";
}

/** Rendered pixel rect of a layer (overlay index) inside a composite input. */
function layerRect(inputBlock: string, overlayIndex: number): { w: number; h: number } | null {
  const overlay = inputBlock.match(
    new RegExp(`<overlay index="${overlayIndex}"[\\s\\S]*?(?:</overlay>|/>)`)
  )?.[0];
  const pos = overlay?.match(/<position[^>]*width="([\d.]+)"[^>]*height="([\d.]+)"/);
  if (!pos) return null;
  return { w: Number(pos[1]), h: Number(pos[2]) };
}
// #endregion

// #region status
export async function vmixStatus(): Promise<{
  reachable: boolean;
  url: string;
  inputs: VmixInput[];
  fmsInput: VmixInput | null;
  error?: string;
}> {
  try {
    const inputs = parseInputs(await state());
    return {
      reachable: true,
      url: baseUrl,
      inputs,
      fmsInput: inputs.find((i) => i.type === "Browser" && i.title === "FMS") ?? null,
    };
  } catch (e) {
    return { reachable: false, url: baseUrl, inputs: [], fmsInput: null, error: String(e) };
  }
}
// #endregion

// #region action 1: FMS browser input
const DEFAULT_DISPLAY_URL = "http://localhost:3001/display";

/** Ensure a Browser input titled "FMS" exists pointing at the display. Returns its key. */
export async function ensureFmsInput(displayUrl = DEFAULT_DISPLAY_URL): Promise<{ key: string; created: boolean }> {
  const existing = parseInputs(await state()).find((i) => i.type === "Browser" && i.title === "FMS");
  if (existing) return { key: existing.key, created: false };

  const before = new Set(parseInputs(await state()).map((i) => i.key));
  await call({ Function: "AddInput", Value: `Browser|${displayUrl}` });
  const created = await waitForNewInput(before);
  await call({ Function: "SetInputName", Input: created.key, Value: "FMS" });
  return { key: created.key, created: true };
}
// #endregion

// #region action 2: alliance-selection camera composite
const COMPOSITE_TITLE = "Alliance Cam";

/**
 * Camera cut-out rectangle in the display's 1920x1080 logical space, derived
 * from the alliance-selection layout. rankRows = ceil(teamCount / 7) fixes the
 * team-grid height, which sets where the camera area starts and how tall it is;
 * the box is the 16:9 rectangle centered in that area.
 *
 * Constants come straight from AllianceSelection.svelte and are pinned by a
 * measured render (box 1067x600 @ (102,452) at rankRows=5):
 *   header 170px, body pt-5 20px / pb-14 56px, left col px-14 (x=56, w=1158),
 *   grid-rows gap-3.5 14px, section label ~20px, rank rows 44px each
 *   (minmax(38px) + gap-1.5 6px).
 */
export function boxRect(teamCount: number): { x: number; y: number; w: number; h: number; rankRows: number } {
  const rankRows = Math.max(1, Math.ceil(Math.max(1, teamCount) / 7));
  const camX = 56;
  const camW = 1158;
  const camY = 232 + 44 * rankRows;
  const camH = 820 - 44 * rankRows;
  // 16:9 contained inside the camera area (whichever dimension limits).
  const boxW = Math.min(camW, (camH * 16) / 9);
  const boxH = Math.min(camH, (camW * 9) / 16);
  return {
    x: camX + (camW - boxW) / 2,
    y: camY + (camH - boxH) / 2,
    w: boxW,
    h: boxH,
    rankRows,
  };
}

async function waitForNewInput(before: Set<string>): Promise<VmixInput> {
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 150));
    const found = parseInputs(await state()).find((inp) => !before.has(inp.key));
    if (found) return found;
  }
  throw new Error("timed out waiting for vMix to create the input");
}

export async function setupAllianceCamera(opts: {
  cameraKey: string;
  teamCount: number;
  displayUrl?: string;
}): Promise<{
  compositeKey: string;
  canvas: { w: number; h: number };
  box: ReturnType<typeof boxRect>;
  layer: { zoom: number; x: number; y: number };
}> {
  const displayUrl = opts.displayUrl ?? DEFAULT_DISPLAY_URL;

  // The composite's top layer is the same FMS browser input operators use.
  const fms = await ensureFmsInput(displayUrl);

  // Replace a previous "Alliance Cam" so re-running is idempotent.
  for (const old of parseInputs(await state()).filter((i) => i.title === COMPOSITE_TITLE)) {
    await call({ Function: "RemoveInput", Input: old.key });
  }

  // Black base; camera on layer 1 (behind), FMS on layer 2 (in front, with its
  // transparent cut-out letting the camera show through).
  const before = new Set(parseInputs(await state()).map((i) => i.key));
  await call({ Function: "AddInput", Value: "Colour|000000" });
  const composite = await waitForNewInput(before);
  await call({ Function: "SetInputName", Input: composite.key, Value: COMPOSITE_TITLE });
  await call({ Function: "SetLayer", Input: composite.key, Value: `1,${opts.cameraKey}` });
  await call({ Function: "SetLayer", Input: composite.key, Value: `2,${fms.key}` });

  // Self-calibrate the canvas resolution: put layer 1 at a known zoom and read
  // back its rendered width. width = canvasW * zoom  ->  canvasW = width / zoom.
  const CAL = 0.5;
  await call({ Function: "SetLayer1Zoom", Input: composite.key, Value: String(CAL) });
  await new Promise((r) => setTimeout(r, 250));
  const rect = layerRect(inputXml(await state(), composite.key), 0);
  if (!rect) throw new Error("could not read back layer rect to calibrate canvas resolution");
  const canvasW = rect.w / CAL;
  const canvasH = rect.h / CAL;

  // Map the logical box rect into canvas pixels. Zoom is a fraction of width so
  // it is resolution-independent; X/Y are the layer's top-left in canvas pixels.
  const box = boxRect(opts.teamCount);
  const sx = canvasW / 1920;
  const sy = canvasH / 1080;
  const zoom = box.w / 1920;
  const x = Math.round(box.x * sx);
  const y = Math.round(box.y * sy);

  await call({ Function: "SetLayer1Zoom", Input: composite.key, Value: zoom.toFixed(4) });
  await call({ Function: "SetLayer1X", Input: composite.key, Value: String(x) });
  await call({ Function: "SetLayer1Y", Input: composite.key, Value: String(y) });

  return {
    compositeKey: composite.key,
    canvas: { w: canvasW, h: canvasH },
    box,
    layer: { zoom, x, y },
  };
}
// #endregion
