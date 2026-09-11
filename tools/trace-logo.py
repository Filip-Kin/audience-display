#!/usr/bin/env python3
"""Rebuild the Grand Rapids Girls event logo from the 2026 shirt front art.

The shirt is a 3-colour print for light fabric, so it needs two changes before it
can sit on the profile's near-black background, and it is far too small to use as
a raster:

  1. Recolour. The ring text is pure black and the ring is #07170D; both vanish
     on #090C09. The text becomes the same off-white as Rexi's lab coat and the
     ring becomes mid steel grey. Rexi's ink, the hat and the FIRST/REBUILT
     patches are left alone.
  2. Trace. The shirt file is 541x574 and the logo renders at size-[480px], so a
     raster goes soft as soon as the canvas scales past 1080p.

Neither step is a colour lookup. Pure black is also the hat, the wrench and the
patch art, and the ring ink is the same value as every outline on Rexi, so both
are picked out by shape:

  - The ring is a ~32px band and Rexi's ink is 3-5px lines, so a morphological
    opening keeps the band and drops the lines. A Kasa circle fit over what
    survives gives the radii, which is what tells the text apart from the hat.
  - Glyphs are small pure-black blobs lying wholly outside that circle. The hat
    fails on size, the wrench and the patches fail on radius.

Usage:  python3 tools/trace-logo.py tools/grand-rapids-girls-shirt-front-2026.png /tmp/out
        cp /tmp/out/logo.svg packages/ui/public/grand-rapids-girls/logo.svg
Needs:  potrace on PATH, Pillow.
"""
from PIL import Image
import math, os, sys
from collections import deque

if len(sys.argv) != 3:
    sys.exit(__doc__)
SHIRT, OUTDIR = sys.argv[1], sys.argv[2]
os.makedirs(OUTDIR, exist_ok=True)

# ---------------------------------------------------------------- recolour
SRC = SHIRT
RING_RGB = (0x8E, 0x97, 0x9C)   # mid steel, the porthole this always was
TEXT_RGB = (0xF6, 0xF8, 0xF8)   # same off-white as Rexi's lab coat
OUT = os.path.join(OUTDIR, 'recoloured.png')

im = Image.open(SRC).convert('RGBA')
w, h = im.size
px = im.load()

DARK = (7, 23, 13)
def is_dark(c):  return all(abs(c[i]-DARK[i]) <= 14 for i in range(3))
def is_black(c): return c[0] < 30 and c[1] < 30 and c[2] < 30 and not is_dark(c)

def build(pred):
    m = bytearray(w*h)
    for y in range(h):
        row = y*w
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 128 and pred((r, g, b)): m[row+x] = 1
    return m

# --- ring: morphological opening kills Rexi's thin ink, keeps the ~32px band ---
def pass1d(m, k, horiz, op):
    """Separable min/max over a run of length 2k+1."""
    out = bytearray(w*h)
    if horiz:
        for y in range(h):
            row = y*w
            for x in range(w):
                v = 0 if op == 'max' else 1
                for d in range(-k, k+1):
                    nx = x+d
                    s = m[row+nx] if 0 <= nx < w else 0
                    v = max(v, s) if op == 'max' else min(v, s)
                out[row+x] = v
    else:
        for x in range(w):
            for y in range(h):
                v = 0 if op == 'max' else 1
                for d in range(-k, k+1):
                    ny = y+d
                    s = m[ny*w+x] if 0 <= ny < h else 0
                    v = max(v, s) if op == 'max' else min(v, s)
                out[y*w+x] = v
    return out

def opening(m, k):
    e = pass1d(pass1d(m, k, True, 'min'), k, False, 'min')
    d = pass1d(pass1d(e, k, True, 'max'), k, False, 'max')
    return bytearray(d[i] & m[i] for i in range(w*h))

dark = build(is_dark)
ring = opening(dark, 3)
print('ring px', sum(ring))

# --- text: small pure-black blobs sitting outside the ring ---
black = build(is_black)
ring_pts = [i for i, v in enumerate(ring) if v]

# Drop specks (a goggle fragment survives the opening) so the circle fit and the
# recolour both see only the two ring arcs.
seen0 = bytearray(w*h); keep = bytearray(w*h)
for i in ring_pts:
    if seen0[i]: continue
    q = deque([i]); seen0[i] = 1; pts = []
    while q:
        j = q.popleft(); pts.append(j)
        jx, jy = j % w, j//w
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
            nx, ny = jx+dx, jy+dy
            if 0 <= nx < w and 0 <= ny < h:
                k2 = ny*w+nx
                if ring[k2] and not seen0[k2]: seen0[k2] = 1; q.append(k2)
    if len(pts) >= 500:
        for p in pts: keep[p] = 1
ring = keep
ring_pts = [i for i, v in enumerate(ring) if v]
print('ring px after speck drop', len(ring_pts))

# Kasa algebraic circle fit. The arcs are partial (the hat and Rexi cover the top
# and bottom), so a plain centroid would sit low; the fit does not care.
n = len(ring_pts)
sx = sy = sxx = syy = sxy = sxz = syz = sz = 0.0
for i in ring_pts:
    x, y = float(i % w), float(i//w); z = x*x + y*y
    sx += x; sy += y; sxx += x*x; syy += y*y; sxy += x*y
    sxz += x*z; syz += y*z; sz += z
A = [[sxx, sxy, sx], [sxy, syy, sy], [sx, sy, float(n)]]
B = [sxz, syz, sz]
for c in range(3):                      # Gaussian elimination
    p = max(range(c, 3), key=lambda r: abs(A[r][c]))
    A[c], A[p] = A[p], A[c]; B[c], B[p] = B[p], B[c]
    for r in range(c+1, 3):
        f = A[r][c]/A[c][c]
        for k2 in range(c, 3): A[r][k2] -= f*A[c][k2]
        B[r] -= f*B[c]
sol = [0.0]*3
for r in (2, 1, 0):
    sol[r] = (B[r] - sum(A[r][k2]*sol[k2] for k2 in range(r+1, 3)))/A[r][r]
cx, cy = sol[0]/2, sol[1]/2
radii = sorted(math.hypot(i % w - cx, i//w - cy) for i in ring_pts)
r_inner = radii[len(radii)//100]
r_outer = radii[len(radii)*99//100]
print('ring centre', round(cx,1), round(cy,1), 'r', round(r_inner,1), '->', round(r_outer,1))

seen = bytearray(w*h)
text = bytearray(w*h)
kept = 0
for i in range(w*h):
    if not black[i] or seen[i]: continue
    q = deque([i]); seen[i] = 1; pts = []
    while q:
        j = q.popleft(); pts.append(j)
        jx, jy = j % w, j//w
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
            nx, ny = jx+dx, jy+dy
            if 0 <= nx < w and 0 <= ny < h:
                k2 = ny*w+nx
                if black[k2] and not seen[k2]: seen[k2] = 1; q.append(k2)
    # A glyph is small and lies wholly outside the ring. That drops the hat
    # (huge), the wrench and the FIRST/REBUILT patches (inside the ring).
    if len(pts) > 4000: continue
    if min(math.hypot(p % w - cx, p//w - cy) for p in pts) < r_outer + 1: continue
    for p in pts: text[p] = 1
    kept += 1
print('glyph blobs', kept, 'px', sum(text))

out = im.copy(); op = out.load()
for i in range(w*h):
    x, y = i % w, i//w
    a = px[x, y][3]
    if ring[i]: op[x, y] = (*RING_RGB, a)
    elif text[i]: op[x, y] = (*TEXT_RGB, a)
out.save(OUT)
print('wrote', OUT)

# ------------------------------------------------------------------- trace
import subprocess, re

SRC   = os.path.join(OUTDIR, 'recoloured.png')
SCALE = 4
OUT   = os.path.join(OUTDIR, 'logo.svg')

# Back to front. Each layer is painted over the union of itself and every layer
# above it, so the boundary pixels are always covered by whatever sits on top.
PALETTE = [
    ('green',  (0x00, 0xA9, 0x3F)),
    ('white',  (0xF6, 0xF8, 0xF8)),
    ('ring',   (0x8E, 0x97, 0x9C)),
    ('black',  (0x00, 0x00, 0x00)),
    ('ink',    (0x07, 0x17, 0x0D)),
]

im = Image.open(SRC).convert('RGBA')
im = im.resize((im.width*SCALE, im.height*SCALE), Image.LANCZOS)
w, h = im.size
px = im.load()
print('trace canvas', w, h)

def nearest(c):
    best, bi = None, 0
    for i, (_, p) in enumerate(PALETTE):
        d = sum((c[k]-p[k])**2 for k in range(3))
        if best is None or d < best: best, bi = d, i
    return bi

idx = bytearray(w*h)
opaque = bytearray(w*h)
for y in range(h):
    row = y*w
    for x in range(w):
        r, g, b, a = px[x, y]
        if a > 128:
            opaque[row+x] = 1
            idx[row+x] = nearest((r, g, b))

for i, (name, _) in enumerate(PALETTE):
    print(name, sum(1 for j in range(w*h) if opaque[j] and idx[j] == i))

def trace(mask, name):
    """potrace one binary layer -> a single <path d=...>."""
    pbm = os.path.join(OUTDIR, f'layer-{name}.pbm')
    with open(pbm, 'wb') as f:
        f.write(b'P4\n%d %d\n' % (w, h))
        stride = (w + 7)//8
        buf = bytearray(stride*h)
        for j in range(w*h):
            if mask[j]:
                y, x = j//w, j % w
                buf[y*stride + x//8] |= 0x80 >> (x % 8)
        f.write(bytes(buf))
    svg = os.path.join(OUTDIR, f'layer-{name}.svg')
    subprocess.run(['potrace', '-s', '-o', svg, '--flat',
                    '-t', '2', '-a', '1.0', '-O', '0.2', pbm], check=True)
    body = open(svg).read()
    paths = re.findall(r'<path[^>]*\sd="([^"]+)"', body)
    g = re.search(r'<g([^>]*)>', body)
    return paths, (g.group(1) if g else '')

parts = []
gattr = ''
for i, (name, rgb) in enumerate(PALETTE):
    mask = bytearray(w*h)
    any_px = False
    for j in range(w*h):
        if opaque[j] and idx[j] >= i:
            mask[j] = 1; any_px = True
    if not any_px: continue
    paths, gattr = trace(mask, name)
    hexc = '#%02X%02X%02X' % rgb
    for d in paths:
        parts.append(f'<path fill="{hexc}" stroke="none" d="{d}"/>')
    print('layer', name, 'paths', len(paths))

svg = (f'<?xml version="1.0" encoding="UTF-8"?>\n'
       f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">\n'
       f'<g{gattr}>\n' + '\n'.join(parts) + '\n</g>\n</svg>\n')
open(OUT, 'w').write(svg)
print('wrote', OUT, os.path.getsize(OUT), 'bytes')
