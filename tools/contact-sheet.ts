// Event approval contact sheet: the 12 screens that carry an event's look,
// plus every sponsor logo the profile ships, on one PNG per profile. This is
// the sheet Filip sends organisers to approve the look and the sponsor list.
//
//   bun run ui:build
//   bun tools/contact-sheet.ts goonettes bgrc c3 [--out <dir>] [--fms 10.0.100.5]
//
// Drives the fake-fms test sequence (http://<fms>:3010/control/test), so
// nothing else may be stepping it while this runs. Needs /usr/bin/chromium
// and ImageMagick (montage, convert). One display server per profile runs
// from this checkout on ports 3201+, each with its own throwaway app-data
// dir, and vMix / live-captions pointed at a dead port so nothing live is
// touched.
import puppeteer from "puppeteer-core";
import { spawn, spawnSync, type ChildProcess } from "child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";

const ROOT = resolve(import.meta.dir, "..");
const PUBLIC = join(ROOT, "packages/ui/public");

const args = process.argv.slice(2);
const flag = (name: string, fallback: string) => {
	const i = args.indexOf(name);
	if (i === -1) return fallback;
	const [, value] = args.splice(i, 2);
	return value;
};
const OUT = resolve(flag("--out", join(ROOT, "contact-sheets")));
const FMS_HOST = flag("--fms", "10.0.100.5");
const FMS = `http://${FMS_HOST}:3010`;
const profiles = args;
if (!profiles.length) {
	console.error("usage: bun tools/contact-sheet.ts <profile>... [--out dir] [--fms host]");
	process.exit(1);
}

// [fake-fms step, ms to wait after goto, label]. Waits are tuned: reveals are
// video-gated (15 s), rankings and the timeout are shot early, before the
// table scrolls and the countdown runs out; under review is shot after the
// buzzer, while the ref's flag is still latched.
const KEY: [number, number, string][] = [
	[0, 4000, "Match preview"],
	[9, 6000, "Score bar"],
	[14, 10500, "Match under review"],
	[15, 6000, "Waiting for scores"],
	[18, 15000, "Qual results"],
	[23, 15000, "Playoff results"],
	[27, 15000, "Finals champion"],
	[46, 6000, "Alliance selection"],
	[47, 2500, "Rankings"],
	[48, 6000, "Playoff bracket"],
	[49, 6000, "Schedule"],
	[50, 2500, "Timeout"],
];

/** Name and sponsor deck straight from the profile source, so the sheet shows
 *  exactly what ships. */
function readProfile(id: string) {
	const src = readFileSync(join(ROOT, "packages/ui/src/profiles", id, "index.ts"), "utf-8");
	const name = /\bname:\s*"([^"]+)"/.exec(src)?.[1] ?? id;
	const deck = /sponsors:\s*\[([\s\S]*?)\]/.exec(src)?.[1] ?? "";
	const sponsors = [...deck.matchAll(/\{\s*src:\s*"([^"]+)"([^}]*)\}/g)]
		.filter((m) => !m.input!.slice(0, m.index).split("\n").pop()!.trim().startsWith("//"))
		.map((m) => ({ src: m[1], light: /light:\s*true/.test(m[2]) }));
	return { name, sponsors };
}

function run(cmd: string, argv: string[]) {
	const r = spawnSync(cmd, argv, { stdio: "inherit" });
	if (r.status !== 0) throw new Error(`${cmd} failed`);
}

const dist = join(ROOT, "packages/ui/dist");
if (!existsSync(dist)) throw new Error("no packages/ui/dist: run `bun run ui:build` first");
rmSync(join(ROOT, "packages/server/.temp/dist"), { recursive: true, force: true });
cpSync(dist, join(ROOT, "packages/server/.temp/dist"), { recursive: true });

const work = mkdtempSync(join(tmpdir(), "contact-sheet-"));
const servers: ChildProcess[] = [];
const browsers: Awaited<ReturnType<typeof puppeteer.launch>>[] = [];

try {
	const pages = [];
	for (const [i, id] of profiles.entries()) {
		const port = 3201 + i;
		const server = spawn("bun", ["src/index.ts"], {
			cwd: join(ROOT, "packages/server"),
			env: {
				...process.env,
				PORT: String(port),
				XDG_DATA_HOME: join(work, `data-${id}`),
				FMS_URL: FMS_HOST,
				VMIX_URL: "http://127.0.0.1:9",
				LIVE_CAPTIONS_URL: "http://127.0.0.1:9",
			},
			stdio: "ignore",
		});
		servers.push(server);
		for (let t = 0; t < 60; t++) {
			const up = await fetch(`http://127.0.0.1:${port}/`).then(() => true, () => false);
			if (up) break;
			await Bun.sleep(500);
		}
		await new Promise<void>((done, fail) => {
			const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
			ws.onopen = () => {
				ws.send(JSON.stringify({ type: "selectProfile", id }));
				setTimeout(() => (ws.close(), done()), 500);
			};
			ws.onerror = () => fail(new Error(`display server for ${id} did not start`));
		});
		// One browser per profile: several pages in one Chromium crash it.
		const browser = await puppeteer.launch({
			executablePath: "/usr/bin/chromium",
			args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required", "--disable-dev-shm-usage"],
		});
		browsers.push(browser);
		const page = await browser.newPage();
		await page.setViewport({ width: 1280, height: 720 });
		await page.goto(`http://127.0.0.1:${port}/display`, { waitUntil: "networkidle2", timeout: 60000 });
		pages.push(page);
		mkdirSync(join(work, id), { recursive: true });
	}
	await Bun.sleep(4000);

	for (const [step, wait, label] of KEY) {
		await fetch(`${FMS}/control/test/goto`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ index: step }),
		});
		await Bun.sleep(wait);
		await Promise.all(pages.map((p, k) => p.screenshot({ path: join(work, profiles[k], `${step}.png`) })));
		console.log(`${step} ${label}`);
	}

	mkdirSync(OUT, { recursive: true });
	for (const id of profiles) {
		const { name, sponsors } = readProfile(id);
		const d = join(work, id);
		run("montage", [
			...KEY.flatMap(([step, , label]) => ["-label", label, join(d, `${step}.png`)]),
			"-tile", "4x", "-geometry", "560x315+8+8", "-pointsize", "16",
			"-background", "#1b1b1b", "-fill", "white", join(d, "screens.png"),
		]);
		// Light logos get the white card the display gives them; the rest sit on
		// a dark card, as they do on screen.
		const tiles = sponsors.map((s, k) => {
			const tile = join(d, `sponsor-${k}.png`);
			run("convert", [
				"-background", "none", join(PUBLIC, s.src), "-resize", "300x150",
				"-background", s.light ? "white" : "#2a2a2a", "-gravity", "center", "-extent", "340x180", tile,
			]);
			return ["-label", s.src.split("/").pop()!.replace(/\.[^.]+$/, ""), tile];
		});
		if (tiles.length) {
			run("montage", [
				...tiles.flat(), "-tile", "6x", "-geometry", "+8+8", "-pointsize", "14",
				"-background", "#1b1b1b", "-fill", "white", join(d, "sponsors.png"),
			]);
		} else {
			run("convert", ["-size", "600x80", "xc:#1b1b1b", "-fill", "#999", "-pointsize", "22",
				"-gravity", "center", "-annotate", "0", "No sponsors", join(d, "sponsors.png")]);
		}
		run("convert", ["-size", "2304x70", "xc:#1b1b1b", "-fill", "white", "-pointsize", "34",
			"-gravity", "west", "-annotate", "+16+0", name, join(d, "title.png")]);
		run("convert", ["-size", "600x50", "xc:#1b1b1b", "-fill", "white", "-pointsize", "22",
			"-gravity", "west", "-annotate", "+16+0", "Sponsors", join(d, "sponsors-head.png")]);
		const out = join(OUT, `${id}.png`);
		run("convert", ["-background", "#1b1b1b",
			join(d, "title.png"), join(d, "screens.png"), join(d, "sponsors-head.png"), join(d, "sponsors.png"),
			"-gravity", "west", "-append", out]);
		console.log(out);
	}
} finally {
	for (const b of browsers) await b.close();
	for (const s of servers) s.kill();
	rmSync(work, { recursive: true, force: true });
}
