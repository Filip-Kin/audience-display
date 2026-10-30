// Renders the Bot Bash win clips: bun tools/bot-bash-win-animations/render.ts [outDir] [red blue tie]
// Needs Chrome, ffmpeg, python3 + numpy. Output goes to outDir (default: the
// profile's public animations folder), plus first-frame.png for the cover.
import puppeteer from "puppeteer-core";
import { spawn, spawnSync } from "child_process";
import { resolve, join } from "path";

const HERE = import.meta.dir;
const OUT = resolve(process.argv[2] ?? join(HERE, "../../packages/ui/public/animations/bot-bash"));
const modes = process.argv.slice(3).length ? process.argv.slice(3) : ["red", "blue", "tie"];
const FPS = 60, DUR = 7.5;

spawnSync("mkdir", ["-p", OUT]);
const sfx = join(OUT, "_sfx.wav");
if (spawnSync("python3", [join(HERE, "sfx.py"), sfx], { stdio: "inherit" }).status) process.exit(1);

const browser = await puppeteer.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  args: ["--allow-file-access-from-files"],
  defaultViewport: { width: 1920, height: 1080 },
});
await Promise.all(modes.map(async (mode) => {
  const page = await browser.newPage();
  await page.goto(`file://${join(HERE, "clip.html")}?mode=${mode}`);
  await page.evaluate(async () => { await document.fonts.load('56px "BB Display"'); });
  const ff = spawn("ffmpeg", ["-y", "-v", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-r", `${FPS}`, "-i", "-", "-i", sfx,
    "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-preset", "medium", "-crf", "21", "-maxrate", "6M", "-bufsize", "12M",
    "-movflags", "+faststart", "-c:a", "aac", "-b:a", "128k", "-shortest", join(OUT, `${mode === "tie" ? "tie" : mode + "wins"}.mp4`)], { stdio: ["pipe", "inherit", "inherit"] });
  const n = Math.round(DUR * FPS);
  for (let i = 0; i < n; i++) {
    const b64 = await page.evaluate((t) => { (window as any).draw(t); return (document.getElementById("c") as HTMLCanvasElement).toDataURL("image/jpeg", 0.97).split(",")[1]; }, i / FPS);
    if (!ff.stdin.write(Buffer.from(b64, "base64"))) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  await page.close();
  console.log("done", mode);
}));
await browser.close();
spawnSync("rm", [sfx]);
const first = join(OUT, modes.includes("red") ? "redwins.mp4" : `${modes[0] === "tie" ? "tie" : modes[0] + "wins"}.mp4`);
spawnSync("ffmpeg", ["-y", "-v", "error", "-i", first, "-frames:v", "1", "-update", "1", join(OUT, "first-frame.png")]);
