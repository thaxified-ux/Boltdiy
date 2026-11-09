#!/usr/bin/env python3
"""Convert AI monster images on magenta into game sprites: cut out, trim, shrink to a target height, reduce colors.
usage: convert_mon.py src_dir out_dir   (writes <name>.png and sizes.json)"""
import sys, os, glob, json
from collections import deque
import numpy as np
from PIL import Image
src, out = sys.argv[1:]; os.makedirs(out, exist_ok=True)
SMALL = {'moss-slime', 'burrow-rat', 'mire-leech', 'cinder-tick', 'glass-scarab', 'ink-slime', 'candle-ghost', 'ember-wisp', 'bog-lantern', 'void-eye', 'star-moth', 'page-swarm'}
FLY = {'bog-lantern', 'ember-wisp', 'mirage', 'star-moth', 'frost-wraith', 'page-swarm', 'ash-bat', 'void-eye', 'sky-serpent'}
sizes = {}
for f in sorted(glob.glob(f'{src}/*/*.png')):
    name = os.path.basename(f)[:-4]
    if name == 'road': continue
    boss = name.endswith('-guardian'); key = name.replace('-guardian', '')
    a = np.asarray(Image.open(f).convert('RGBA')).copy(); c = a[..., :3].astype(int); r, g, b = c[..., 0], c[..., 1], c[..., 2]
    # background: colors close to pure magenta, plus the soft fringe right next to it (purple monsters keep their colors)
    dist = np.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2)
    bg = dist < 110
    near = bg.copy()
    for _ in range(2):
        n2 = near.copy(); n2[1:] |= near[:-1]; n2[:-1] |= near[1:]; n2[:, 1:] |= near[:, :-1]; n2[:, :-1] |= near[:, 1:]; near = n2
    bg |= near & (dist < 190) & (g < np.minimum(r, b) - 40)
    a[bg, 3] = 0
    op = a[..., 3] > 0
    e = op.copy(); e[1:] &= op[:-1]; e[:-1] &= op[1:]; e[:, 1:] &= op[:, :-1]; e[:, :-1] &= op[:, 1:]; op = e
    lab = np.zeros(op.shape, int); sz = {}; n = 0
    for y, x in zip(*np.nonzero(op)):
        if lab[y, x]: continue
        n += 1; q = deque([(y, x)]); lab[y, x] = n; s = 0
        while q:
            cy, cx = q.popleft(); s += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = cy + dy, cx + dx
                if 0 <= yy < op.shape[0] and 0 <= xx < op.shape[1] and op[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; q.append((yy, xx))
        sz[n] = s
    big = max(sz.values()); keep = np.isin(lab, [i for i, s in sz.items() if s > big * .02])
    a[..., 3] = np.where(keep, 255, 0)
    im = Image.fromarray(a, 'RGBA'); im = im.crop(im.getbbox())
    h = 140 if boss else 50 if key in SMALL else 62
    if im.width > im.height * 1.9: h = round(h * .8)          # long, low creatures (serpents) stay modest
    w = max(1, round(im.width * h / im.height))
    pre = Image.new('RGB', im.size, (30, 22, 18)); pre.paste(im, mask=im.getchannel('A'))
    rgb = pre.resize((w, h), Image.LANCZOS); al = im.getchannel('A').resize((w, h), Image.LANCZOS)
    q = rgb.quantize(colors=32, method=Image.Quantize.MEDIANCUT).convert('RGB')
    Image.merge('RGBA', (*q.split(), al.point(lambda v: 255 if v > 140 else 0))).save(f'{out}/{key}.png')
    sizes[key] = {'w': w, 'h': h, 'boss': boss, 'fly': key in FLY, 'zone': os.path.basename(os.path.dirname(f))}
json.dump(sizes, open(f'{out}/sizes.json', 'w'), indent=0); print(len(sizes), 'sprites')
