#!/usr/bin/env python3
"""Make a 4-frame walk cycle from a standing sprite by swinging each leg from the hip.
usage: stride.py still.png outdir basename hipY backX0 backX1 frontX0 frontX1
Frames: 1 contact (legs apart), 2 passing (back leg lifted), 3 contact (legs swapped), 4 passing (other leg lifted).
Writes basename-1..4.png and records each frame's feet anchor in outdir/meta.json."""
import sys, os, json
import numpy as np
from PIL import Image

src, outdir, base = sys.argv[1:4]
hip, bx0, bx1, fx0, fx1 = map(int, sys.argv[4:9])
a = np.asarray(Image.open(src).convert('RGBA'))
h, w = a.shape[:2]
PAD = 8
op = a[..., 3] > 0


def leg_mask(x0, x1):
    m = np.zeros(op.shape, bool)
    m[hip:, x0:x1 + 1] = op[hip:, x0:x1 + 1]
    return m


back, front = leg_mask(bx0, bx1), leg_mask(fx0, fx1)
static = a.copy(); static[back | front, 3] = 0
# each frame: (back swing, back lift, front swing, front lift) in art pixels at the foot
POSES = [(-4, 0, 5, 0), (2, 5, 0, 0), (6, 0, -3, 0), (-2, 0, 2, 5)]
# feet anchor of the still, measured like embed.py
rows = op[int(h * .62):int(h * .8)]; wts = rows.sum(0)
fx_still = float((np.arange(w) * wts).sum() / wts.sum())
meta = json.load(open(os.path.join(outdir, 'meta.json'))) if os.path.exists(os.path.join(outdir, 'meta.json')) else {}


def paste_leg(out, mask, swing, lift):
    ys, xs = np.nonzero(mask)
    t = (ys - hip) / max(1, (h - 1 - hip))
    nx = xs + PAD + np.round(swing * t).astype(int)
    ny = ys - np.round(lift * t * t * 1.0).astype(int)
    # draw from the hip down so the boot ends on top
    for i in np.argsort(ys):
        out[ny[i], nx[i]] = a[ys[i], xs[i]]


for k, (bs, bl, fs, fl) in enumerate(POSES):
    out = np.zeros((h, w + 2 * PAD, 4), np.uint8)
    out[:, PAD:PAD + w] = static
    paste_leg(out, back, bs, bl)    # far leg first
    paste_leg(out, front, fs, fl)   # near leg on top
    name = f'{base}-{k + 1}'
    Image.fromarray(out, 'RGBA').save(os.path.join(outdir, name + '.png'))
    meta[name] = round(fx_still + PAD, 1)
    print(name, out.shape[1], 'x', out.shape[0])
json.dump(meta, open(os.path.join(outdir, 'meta.json'), 'w'))
