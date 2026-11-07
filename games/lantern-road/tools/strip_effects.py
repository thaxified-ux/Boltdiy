import sys, glob, os
from collections import deque
import numpy as np
from PIL import Image
src, dst, idle_dir = sys.argv[1:]
os.makedirs(dst, exist_ok=True)
# colors the knight himself uses (idle and walk): these are never removed
body_cols = set()
for f in glob.glob(idle_dir + '/*.png'):
    a = np.asarray(Image.open(f).convert('RGBA')); body_cols |= set(map(tuple, a[a[..., 3] > 0][:, :3]))
body_pal = np.array(sorted(body_cols), int)


def largest(mask):
    lab = np.zeros(mask.shape, int); best = (0, 0); n = 0
    for y, x in zip(*np.nonzero(mask)):
        if lab[y, x]: continue
        n += 1; q = deque([(y, x)]); lab[y, x] = n; size = 0
        while q:
            cy, cx = q.popleft(); size += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = cy + dy, cx + dx
                    if 0 <= yy < mask.shape[0] and 0 <= xx < mask.shape[1] and mask[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = n; q.append((yy, xx))
        if size > best[0]: best = (size, n)
    return lab == best[1]


for f in sorted(glob.glob(src + '/*.png')):
    a = np.asarray(Image.open(f).convert('RGBA')).copy(); op = a[..., 3] > 0
    px = a[..., :3].astype(int); r, g, b = px[..., 0], px[..., 1], px[..., 2]
    ys, xs = np.nonzero(op)
    d = np.min(((px[ys, xs][:, None, :] - body_pal[None, :, :]) ** 2).sum(-1), axis=1)
    effect = np.zeros(op.shape, bool)
    cyan = ((b > 140) & (b >= r + 30)) | ((r > 200) & (g > 200) & (b > 200))
    effect[ys, xs] = (d > 60) & cyan[ys, xs]   # ice colors the knight never wears
    keep = largest(op & ~effect)             # the knight and his hammer, without detached shards
    # holes inside his body (gems lit by the ice glow) come back: whatever the outside cannot reach
    outside = np.zeros(op.shape, bool); H, W = op.shape; q = deque()
    for y in range(H):
        for x in (0, W - 1):
            if not keep[y, x] and not outside[y, x]: outside[y, x] = True; q.append((y, x))
    for x in range(W):
        for y in (0, H - 1):
            if not keep[y, x] and not outside[y, x]: outside[y, x] = True; q.append((y, x))
    while q:
        cy, cx = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = cy + dy, cx + dx
            if 0 <= yy < H and 0 <= xx < W and not keep[yy, xx] and not outside[yy, xx]: outside[yy, xx] = True; q.append((yy, xx))
    keep = keep | (op & ~outside)
    a[~keep, 3] = 0
    Image.fromarray(a).save(os.path.join(dst, os.path.basename(f)))
print('ok', len(body_pal), 'body colors')
