#!/usr/bin/env python3
"""Cut an AI-made sprite sheet into clean pixel-art PNGs.
usage: cut.py sheet.jpg m|g outdir name1 name2 ...   (m = magenta background, g = green)
Finds the pixel grid, samples one color per art pixel, removes the background and its halo,
splits the sheet into sprites (left to right, top to bottom) and saves each one trimmed."""
import sys
import numpy as np
from PIL import Image
from collections import deque


def dilate(m, it):
    for _ in range(it):
        o = m.copy()
        o[1:] |= m[:-1]; o[:-1] |= m[1:]; o[:, 1:] |= m[:, :-1]; o[:, :-1] |= m[:, 1:]
        o[1:, 1:] |= m[:-1, :-1]; o[:-1, :-1] |= m[1:, 1:]; o[1:, :-1] |= m[:-1, 1:]; o[:-1, 1:] |= m[1:, :-1]
        m = o
    return m


def label(m):
    lab = np.zeros(m.shape, np.int32); n = 0; boxes = []
    for y, x in zip(*np.nonzero(m)):
        if lab[y, x]: continue
        n += 1; q = deque([(y, x)]); lab[y, x] = n; y0 = y1 = y; x0 = x1 = x
        while q:
            cy, cx = q.popleft()
            y0, y1, x0, x1 = min(y0, cy), max(y1, cy), min(x0, cx), max(x1, cx)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = cy + dy, cx + dx
                if 0 <= yy < m.shape[0] and 0 <= xx < m.shape[1] and m[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; q.append((yy, xx))
        boxes.append((slice(y0, y1 + 1), slice(x0, x1 + 1)))
    return lab, boxes

src, key, outdir, *names = sys.argv[1:]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.int32)
H, W, _ = im.shape


def is_bg(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if key == 'm':
        return (r - g > 70) & (b - g > 70)
    return (g - r > 70) & (g - b > 70)


def halo(a):  # background color blended into the sprite edge or a glow
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if key == 'm':
        return (b - g > 45) & (r - g > 45) & (b > 120)
    return (g - r > 45) & (g - b > 45) & (g > 120)


def grid(axis):
    """Best block size and offset along one axis (columns if axis=1)."""
    fg = ~is_bg(im)
    ys, xs = np.nonzero(fg)
    sub = im[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    if axis == 0:
        sub = sub.transpose(1, 0, 2)
    n = sub.shape[1]
    best = None
    for bs in np.arange(2.5, 14.01, .05):
        for ox in np.arange(0, bs, .25):
            cols = np.clip(((np.arange(n) - ox) // bs * bs + ox + bs / 2).astype(int), 0, n - 1)
            err = np.abs(sub - sub[:, cols]).mean()
            if best is None or err < best[0]:
                best = (err, bs, ox)
    start = ys.min() if axis == 0 else xs.min()
    return best[1], best[2] + start


bx, ox = grid(1)
by, oy = grid(0)
bs = (bx + by) / 2  # pixels are square
print(f'grid {bx:.2f} x {by:.2f}')
# sample the center of every art pixel (median of a small core to dodge JPEG noise)
nx, ny = int((W - ox) // bs), int((H - oy) // bs)
small = np.zeros((ny, nx, 3), np.int32)
k = max(1, int(bs * .25))
for j in range(ny):
    cy = int(oy + (j + .5) * bs)
    for i in range(nx):
        cx = int(ox + (i + .5) * bs)
        small[j, i] = np.median(im[max(0, cy - k):cy + k + 1, max(0, cx - k):cx + k + 1].reshape(-1, 3), axis=0)
mask = ~(is_bg(small) | halo(small))
# drop specks, then split into sprites
lab, boxes = label(dilate(mask, 2))
objs = []
for i, sl in enumerate(boxes):
    area = (lab[sl] == i + 1).sum()
    if area > 40:
        objs.append(sl)
# reading order: rows (by vertical center), then left to right
objs.sort(key=lambda s: (round((s[0].start + s[0].stop) / 2 / (ny / 3)), s[1].start))
print(len(objs), 'sprites found')
for name, sl in zip(names, objs):
    m = mask[sl] & (lab[sl] > 0)
    rgba = np.zeros(m.shape + (4,), np.uint8)
    rgba[..., :3] = small[sl].clip(0, 255)
    rgba[..., 3] = m * 255
    ys, xs = np.nonzero(m)
    rgba = rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(rgba, 'RGBA').save(f'{outdir}/{name}.png')
    print(name, rgba.shape[1], 'x', rgba.shape[0])
