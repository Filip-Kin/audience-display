"""Halloween cut of the official Bot Bash art (official.webp, black ink on white).
The sky inside each badge becomes night with the alliance rays still in it, the
robots stay pale so they stand out, the eyes glow lime, VS turns lime and drips.
The page outside the badges goes transparent, so it works on dark screens.

  python3 tools/bot-bash-logo/spookify.py <out.png>     (needs ffmpeg + numpy)
"""
import subprocess
import sys
from pathlib import Path
import numpy as np

SRC = Path(__file__).with_name("official.webp")
probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(SRC)], capture_output=True, text=True).stdout
W, H = map(int, probe.strip().split(",")[:2])
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(SRC), "-f", "rawvideo", "-pix_fmt", "rgba", "-"], capture_output=True).stdout
src = np.frombuffer(raw, np.uint8)[: W * H * 4].reshape(H, W, 4).astype(float) / 255
# The file's page is transparent, not white: flatten onto white so the floods
# below see ink on paper.
rgb = src[..., :3] * src[..., 3:] + (1 - src[..., 3:])
sx, sy = W / 1700, H / 830  # seeds and shapes below are in 1700x830 art coordinates

hi, lo = rgb.max(2), rgb.min(2)
ink = hi < 0.42
vivid = (hi - lo) > 0.55
wall = ink | vivid


def flood(seeds, walls):
    seen = np.zeros((H, W), bool)
    stack = [(int(y * sy), int(x * sx)) for x, y in seeds]
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= H or x >= W or seen[y, x] or walls[y, x]:
            continue
        seen[y, x] = True
        stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    return seen


def dilate(m, n=1):
    for _ in range(n):
        m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
    return m


def blur(a, n):
    for _ in range(n):
        a = (a + np.roll(a, 1, 0) + np.roll(a, -1, 0) + np.roll(a, 1, 1) + np.roll(a, -1, 1)) / 5
    return a


def mix(a, b, t):
    return a + (b - a) * t[..., None]


# The sky is as transparent as the page and the ring has gaps, so the two are
# told apart by the badge circles.
yy, xx = np.mgrid[0:H, 0:W]
disk = lambda cx, cy, r: ((xx - cx * sx) / sx) ** 2 + ((yy - cy * sy) / sy) ** 2 < r ** 2
# Cut at the banners: below them the circle runs past the art.
above = yy < 640 * sy
red_disk, blue_disk = disk(420, 392, 360) & above, disk(1278, 392, 360) & above
outside = flood([(2, 2), (W / sx - 3, 2), (2, H / sy - 3), (W / sx - 3, H / sy - 3), (850, 200), (850, 700)], wall | red_disk | blue_disk)
red_sky = flood([(130, 330), (120, 480), (640, 170), (700, 420), (620, 520)], wall | ~red_disk)
blue_sky = flood([(990, 480), (1000, 300), (1560, 330), (1540, 480), (1180, 130), (1450, 130)], wall | ~blue_disk)
eyes = flood([(375, 155), (428, 160), (1288, 160), (1335, 158)], ink)

# Paper and robots: moonlit, not white. Banners and bodies share this grade.
out = rgb * np.array([0.9, 0.87, 0.98])

for sky, tint in ((red_sky, np.array([0.75, 0.1, 0.16])), (blue_sky, np.array([0.14, 0.2, 0.85]))):
    grown = dilate(sky, 2) & ~ink
    ray = np.clip((1 - lo) * 1.6, 0, 1)
    night = np.array([0.07, 0.03, 0.15]) + ray[..., None] * tint * 0.75
    out[grown] = night[grown]

lime = np.array([0.72, 0.95, 0.3])
out[eyes] = lime
# VS: lime with a dark keyline, taken by flood so the badge rings stay out of it.
box = np.ones((H, W), bool)
box[int(300 * sy):int(432 * sy), int(738 * sx):int(962 * sx)] = False
vs = flood([(775, 320), (825, 320), (905, 340), (900, 395), (800, 395)], ~(hi < 0.5) | box)
keyline = dilate(vs, 5)
page = keyline & ~vs
out[page] = np.array([0.05, 0.02, 0.1])
out[vs] = lime

alpha = (~outside).astype(float)
alpha[keyline] = 1
alpha[red_disk | blue_disk] = 1

# Slime hugs the art: for each column find the real bottom edge, then run a wavy
# coat along it with drips grown out of that edge, so nothing has a top of its own.
def smooth(y, n):
    k = np.ones(n) / n
    return np.convolve(np.pad(y, n, mode="edge"), k, "same")[n:-n]


def coat(x0, x1, edge_of, drips, thick):
    global out, alpha
    cols = np.arange(int(x0 * sx), int(x1 * sx))
    edge = np.array([edge_of(c) for c in cols], float)
    known = ~np.isnan(edge)
    edge = smooth(np.interp(cols, cols[known], edge[known]), int(9 * sx) | 1)
    u = cols / sx
    top = edge - thick * (0.75 + 0.25 * np.sin(u / 23) + 0.2 * np.sin(u / 9.3))
    bottom = edge + 3 * sy
    taper = np.minimum(np.clip((u - x0) / 30, 0, 1), np.clip((x1 - u) / 30, 0, 1))
    top = edge - (edge - top) * taper
    bottom = edge + (bottom - edge) * taper
    beads = []
    for x, length, width in drips:
        bottom = bottom + length * sy * np.exp(-(np.abs((u - x) / (width * 1.25)) ** 3))
        i = int(np.argmin(np.abs(u - x)))
        beads.append((cols[i], bottom[i] - width * 0.3 * sy, width * 0.82 * sx))
    mask = np.zeros((H, W), bool)
    for c, t, b in zip(cols, top, bottom):
        mask[int(t):int(b) + 1, c] = True
    for bx, by, r in beads:
        mask |= (xx - bx) ** 2 + (yy - by) ** 2 < r ** 2
    return mask


def lowest(mask):
    def edge_of(c):
        ys = np.nonzero(mask[:, c])[0]
        return ys.max() if len(ys) else np.nan
    return edge_of


# Banner bottoms: the last ink going up from under the banner, on the band the
# lower edge can occupy.
band = ink.copy()
band[:int(610 * sy)] = False
band[int(700 * sy):] = False
slime = coat(240, 640, lowest(band), [(300, 46, 11), (395, 26, 8), (470, 60, 12), (575, 34, 9)], 9)
slime |= coat(1065, 1465, lowest(band), [(1130, 34, 9), (1235, 62, 12), (1320, 28, 8), (1410, 44, 11)], 9)
# VS: drips off the feet of the letters, which are lime already, so they merge.
for x0, x1, drops in ((752, 835, [(792, 46, 8)]), (872, 950, [(910, 56, 9)])):
    slime |= coat(x0, x1, lowest(vs), drops, 2)

edge = dilate(slime, 2) & ~slime
out[edge & (alpha < 1)] = np.array([0.05, 0.02, 0.1])
alpha[edge] = 1
out[slime] = lime
alpha[slime] = 1

# Glow from the eyes, added last so it spills onto the faces.
glow = blur(eyes.astype(float), 30) * 3
out = np.clip(out + glow[..., None] * lime * 0.8, 0, 1)
alpha = blur(alpha, 1)

rgba = np.dstack([out, alpha])
pix = (rgba * 255 + 0.5).astype(np.uint8).tobytes()
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-i", "-", "-frames:v", "1", "-update", "1", sys.argv[1]], input=pix, check=True)
