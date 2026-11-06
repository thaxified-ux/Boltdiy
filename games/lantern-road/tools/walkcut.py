#!/usr/bin/env python3
"""Cut an animation strip (one row of frames on magenta) into frames that match an existing still sprite:
same height, same colors (snapped to the still's palette), aligned on the hood so the head stays steady.
usage: walkcut.py strip.jpg still.png outdir basename
Writes basename-1.png ... and adds each frame's feet anchor (fx) to outdir/meta.json."""
import sys, os, json
import numpy as np
from PIL import Image

src, still_path, outdir, base = sys.argv[1:]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.int32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
fg = ~(((r - g > 60) & (b - g > 60)) | ((b - g > 40) & (r - g > 40) & (b > 150)))
still = np.asarray(Image.open(still_path).convert('RGBA'))
sh, sw = still.shape[:2]

# palette of the still sprite
pal = np.unique(still[still[..., 3] > 0][:, :3], axis=0).astype(np.int32)


def hood_center(op):
    rows = op[: max(3, int(op.shape[0] * .22))]
    w = rows.sum(0)
    return float((np.arange(op.shape[1]) * w).sum() / max(1, w.sum()))


meta_s = json.load(open(os.path.join(os.path.dirname(still_path), 'meta.json'))) if os.path.exists(os.path.join(os.path.dirname(still_path), 'meta.json')) else {}
# the still's own feet anchor, measured the same way embed.py does it
op_s = still[..., 3] > 0
rows = op_s[int(sh * .62):int(sh * .8)]
wts = rows.sum(0)
fx_still = float((np.arange(sw) * wts).sum() / wts.sum())
hood_off = fx_still - hood_center(op_s)

# split into frames by empty columns
cols = fg.sum(0) > 2
segs, start = [], None
for x, on in enumerate(list(cols) + [False]):
    if on and start is None:
        start = x
    if not on and start is not None:
        if x - start > 20:
            segs.append((start, x))
        start = None
ys = np.nonzero(fg[:, segs[0][0]:segs[-1][1]].any(1))[0]
top, bot = ys.min(), ys.max() + 1
scale = sh / (bot - top)
print(len(segs), 'frames, scale', round(scale, 3))
meta = json.load(open(os.path.join(outdir, 'meta.json'))) if os.path.exists(os.path.join(outdir, 'meta.json')) else {}
for i, (x0, x1) in enumerate(segs):
    crop = im[top:bot, x0:x1].astype(np.uint8)
    m = fg[top:bot, x0:x1]
    W = max(1, round((x1 - x0) * scale))
    rgb = np.asarray(Image.fromarray(crop, 'RGB').resize((W, sh), Image.LANCZOS)).astype(np.int32)
    al = np.asarray(Image.fromarray((m * 255).astype(np.uint8), 'L').resize((W, sh), Image.BOX)) > 140
    # snap to the still's palette
    d = ((rgb[:, :, None, :] - pal[None, None, :, :]) ** 2).sum(-1)
    snapped = pal[d.argmin(-1)]
    out = np.zeros((sh, W, 4), np.uint8)
    out[..., :3] = snapped
    out[..., 3] = al * 255
    xs = np.nonzero(al.any(0))[0]
    out = out[:, xs.min():xs.max() + 1]
    op = out[..., 3] > 0
    name = f'{base}-{i + 1}'
    Image.fromarray(out, 'RGBA').save(os.path.join(outdir, name + '.png'))
    meta[name] = round(hood_center(op) + hood_off, 1)
    print(name, out.shape[1], 'x', out.shape[0], 'fx', meta[name])
json.dump(meta, open(os.path.join(outdir, 'meta.json'), 'w'))
