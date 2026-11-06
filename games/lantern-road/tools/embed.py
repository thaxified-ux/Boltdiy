#!/usr/bin/env python3
"""Clean the cut sprites, save them to the repo's art folder, and embed them (base64) in the game file.
usage: embed.py game.html artdir out-repo-artdir
Each sprite gets: w, h, fx (x of the feet center) and, for heroes, lx/ly (lantern center)."""
import sys, os, json, base64, colorsys, io
import numpy as np
from PIL import Image

game, src, dst = sys.argv[1:]
os.makedirs(dst, exist_ok=True)
LANTERN = {'hero-blade': (46, 49), 'hero-bow': (15, 58), 'hero-lamp': (48, 18)}
art = {}
for fn in sorted(os.listdir(src)):
    if not fn.endswith('.png') or fn == 'preview.png':
        continue
    name = fn[:-4]
    a = np.asarray(Image.open(os.path.join(src, fn)).convert('RGBA')).copy()
    op = a[..., 3] > 0
    # remove specks: opaque pixels with at most one opaque neighbor
    n = np.zeros(op.shape, int)
    p = np.pad(op, 1)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dy or dx:
                n += p[1 + dy:1 + dy + op.shape[0], 1 + dx:1 + dx + op.shape[1]]
    a[op & (n <= 1), 3] = 0
    op = a[..., 3] > 0
    ys, xs = np.nonzero(op)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    op = a[..., 3] > 0
    h, w = op.shape
    # feet center: middle of the opaque pixels in the bottom tenth, ignoring a long staff or bow
    rows = op[int(h * .62):int(h * .8)]
    cols = np.nonzero(rows.any(0))[0]
    weights = rows.sum(0)
    fx = float((np.arange(w) * weights).sum() / max(1, weights.sum()))
    im = Image.fromarray(a, 'RGBA')
    im.save(os.path.join(dst, fn))
    buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
    meta = {'w': w, 'h': h, 'fx': round(fx, 1), 'src': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()}
    if name in LANTERN:
        meta['lx'], meta['ly'] = LANTERN[name]
    art[name] = meta
    print(name, w, h, 'feet x', round(fx, 1), len(buf.getvalue()), 'bytes')

s = open(game).read()
block = '/*ART-BEGIN*/\nconst ART = ' + json.dumps(art, separators=(',', ':')) + ';\n/*ART-END*/'
if '/*ART-BEGIN*/' in s:
    a0 = s.index('/*ART-BEGIN*/'); a1 = s.index('/*ART-END*/') + len('/*ART-END*/')
    s = s[:a0] + block + s[a1:]
else:
    s = s.replace('function drawHero() {', block + '\nfunction drawHero() {', 1)
open(game, 'w').write(s)
print('embedded', len(art))
