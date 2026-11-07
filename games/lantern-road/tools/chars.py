#!/usr/bin/env python3
"""Build animation strips for the playable characters and embed them in the game as CHAR_ART.
usage: chars.py game.html packs_dir preview_dir
For each character: the east-facing frames of each animation, optionally resized (palette-snapped so they
stay crisp), cropped to one shared box, and joined into one horizontal strip per animation.
Each entry: frames, fw, fh (frame size), ax/ay (feet anchor inside a frame), top (head top), src (PNG data URI)."""
import sys, os, glob, json, base64, io
import numpy as np
from PIL import Image

game, P, prev = sys.argv[1:]
os.makedirs(prev, exist_ok=True)
TARGET = 100  # every hero stands this many art pixels tall (idle pose), so they all match on the road
CHARS = {
    'swordswoman': {'anims': {
        'idle': f'{P}/sword/Animations/Idle/east',
        'walk': f'{P}/sword/Animations/Walk/east',
        'atk1': f'{P}/sword/Animations/Downward_Sword_Slash/east',
        'atk2': f'{P}/sword/Animations/Overhead_Slash/east',
        'skill': f'{P}/sword/Animations/Rising_Sword_Slash/east',
        'skill2': f'{P}/sword/Animations/Spell_Chant/east'}, 'ascale': {'atk1': 0.89, 'skill': 0.89}, 'steady': True},
    'scout': {'anims': {
        'idle': f'{P}/bow/Animations/Idle/east',
        'walk': f'{P}/bow/Animations/Walk/east',
        'atk1': f'{P}/bow/Animations/Shoot_Arrow/east',
        'skill': f'{P}/bow/Animations/Leaf_Vortex/east',
        'dash': f'{P}/bow/Animations/Wind_Dash/east',
        'death': f'{P}/bow/Animations/Death/east'}},
    'glacier': {'anims': {
        'idle': f'{P}/glacier/Animations/Idle/east',
        'walk': f'{P}/glacier/Animations/Walk/east',
        'atk1': f'{P}/hf/east2',  # Glacial_Hammerfall/east with the ice effects removed: a plain hammer swing
        'skill': f'{P}/glacier/Animations/Frozen_Cyclone/east',
        'death': f'{P}/glacier/Animations/Death/east'}},
    'plague': {'anims': {
        'idle': f'{P}/plague/Animations/Idle/east',
        'walk': f'{P}/plague/Animations/Walk/east',
        'atk1': f'{P}/plague/Animations/Basic_Attack/east',
        'skill': f'{P}/plague/Animations/Jump/east'}},
}


def resize_snap(im, scale, pal):
    if abs(scale - 1) < 1e-3:
        return im
    W, H = round(im.width * scale), round(im.height * scale)
    if scale > 1:
        return im.resize((W, H), Image.NEAREST)
    a = np.asarray(im).astype(np.int32)
    # premultiply so transparent pixels do not bleed dark edges
    rgb = Image.fromarray((a[..., :3] * (a[..., 3:] / 255)).astype(np.uint8), 'RGB').resize((W, H), Image.LANCZOS)
    al = np.asarray(Image.fromarray(a[..., 3].astype(np.uint8), 'L').resize((W, H), Image.LANCZOS)).astype(np.int32)
    rgbn = np.asarray(rgb).astype(np.int32) * 255 // np.maximum(al, 1)[..., None]
    out = np.zeros((H, W, 4), np.uint8)
    keep = al > 110
    d = ((rgbn[:, :, None, :] - pal[None, None, :, :]) ** 2).sum(-1)
    out[..., :3] = pal[d.argmin(-1)]
    out[..., 3] = keep * 255
    return Image.fromarray(out, 'RGBA')


result = {}
for name, cfg in CHARS.items():
    frames = {}
    raw_all = []
    for an, d in cfg['anims'].items():
        fs = sorted(glob.glob(f'{d}/*.png'))
        assert fs, d
        frames[an] = [Image.open(f).convert('RGBA') for f in fs]
        raw_all += frames[an]
    ib0 = frames['idle'][0].getbbox(); base = TARGET / (ib0[3] - ib0[1])
    # the most common colors of this hero, for snapping shrunk frames back to crisp pixels
    cnt = {}
    for f in raw_all[::3]:
        px = np.asarray(f); px = px[px[..., 3] > 0][:, :3]
        u, c = np.unique(px, axis=0, return_counts=True)
        for col, n in zip(map(tuple, u), c): cnt[col] = cnt.get(col, 0) + n
    pal = np.array(sorted(cnt, key=lambda k: -cnt[k])[:160], np.int32)
    frames = {an: [resize_snap(f, base * cfg.get('ascale', {}).get(an, 1), pal) for f in fr] for an, fr in frames.items()}
    print(name, 'scale', round(base, 3))
    # line every animation up on the feet of its first frame (canvas sizes differ between animations)
    def feet(f):
        al = np.asarray(f)[..., 3] > 0; ys, xs = np.nonzero(al); bot = ys.max()
        low = xs[ys >= bot - 8]; return float((low.min() + low.max()) / 2), int(bot)
    shift = {}
    # idle is placed by its feet; every other animation is lined up to idle by matching the shape of its first frame
    # (the character's body) against idle's, so a wide fighting stance does not make the hero jump sideways
    def mask(f):
        return np.asarray(f)[..., 3] > 0
    def best_offset(m, ref):
        # start from the canvas centers (the art is centered on each canvas), then search around that guess
        gx, gy = round((ref.shape[1] - m.shape[1]) / 2), round((ref.shape[0] - m.shape[0]) / 2)
        pad = 60; H = max(m.shape[0], ref.shape[0]) + 2 * pad + abs(gy); Wd = max(m.shape[1], ref.shape[1]) + 2 * pad + abs(gx)
        R = np.zeros((H + m.shape[0], Wd + m.shape[1]), bool); oy, ox = pad + m.shape[0], pad + m.shape[1]
        R[oy:oy + ref.shape[0], ox:ox + ref.shape[1]] = ref
        best = (-1, 0, 0)
        for dy in range(gy - 28, gy + 29):
            for dx in range(gx - 36, gx + 37):
                y0, x0 = oy + dy, ox + dx
                if y0 < 0 or x0 < 0 or y0 + m.shape[0] > R.shape[0] or x0 + m.shape[1] > R.shape[1]: continue
                sc = np.logical_and(R[y0:y0 + m.shape[0], x0:x0 + m.shape[1]], m).sum()
                if sc > best[0]: best = (sc, dx, dy)
        return best[1], best[2]
    fx0, _ = feet(frames['idle'][0]); bot = max(f.getbbox()[3] for f in frames['idle'] if f.getbbox())
    shift['idle'] = (round(400 - fx0), 400 - bot)
    ref = mask(frames['idle'][0])
    for an, fr in frames.items():
        if an == 'idle': continue
        dx, dy = best_offset(mask(fr[0]), ref)
        shift[an] = (shift['idle'][0] + dx, shift['idle'][1] + dy)
    # keep the body in one place through every attack and skill: each frame is moved sideways so the center of its
    # thick parts (the body, not the thin sword or swoosh) stays where it is in frame 1
    def body_cx(f):
        m = np.asarray(f)[..., 3] > 0
        for _ in range(3):  # erode: thin weapons and trails disappear, the body stays
            e = m.copy(); e[1:] &= m[:-1]; e[:-1] &= m[1:]; e[:, 1:] &= m[:, :-1]; e[:, :-1] &= m[:, 1:]; m = e
        xs = np.nonzero(m)[1]
        return float(xs.mean()) if len(xs) else None
    fdx = {}
    for an, fr in frames.items():
        fdx[an] = [0] * len(fr)
        if an in ('idle', 'walk', 'death') or not cfg.get('steady'): continue  # only where it is checked to help
        c0 = body_cx(fr[0])
        for i, f in enumerate(fr):
            c = body_cx(f)
            if c0 is not None and c is not None: fdx[an][i] = int(round(c0 - c))
    boxes = []
    for an, fr in frames.items():
        dx, dy = shift[an]
        for i, f in enumerate(fr):
            bb = f.getbbox(); ddx = dx + fdx[an][i]
            if bb: boxes.append((bb[0] + ddx, bb[1] + dy, bb[2] + ddx, bb[3] + dy))
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes); x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    fw, fh = x1 - x0, y1 - y0
    ib = frames['idle'][0].getbbox(); idx, idy = shift['idle']
    entry = {}
    for an, fr in frames.items():
        strip = Image.new('RGBA', (fw * len(fr), fh), (0, 0, 0, 0))
        clip = Image.new('RGBA', (fw * len(fr), fh), (0, 0, 0, 0))
        dx, dy = shift[an]
        for i, f in enumerate(fr):
            strip.alpha_composite(f, (i * fw + dx + fdx[an][i] - x0, dy - y0))
        buf = io.BytesIO(); strip.save(buf, 'PNG', optimize=True)
        strip.save(f'{prev}/{name}-{an}.png')
        entry[an] = {'frames': len(fr), 'src': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()}
        print(name, an, len(fr), 'frames', fw, 'x', fh, len(buf.getvalue()) // 1024, 'KB', 'steady' if an not in ('idle', 'walk', 'death') else '', fdx[an] if an not in ('idle', 'walk', 'death') else '')
    entry.update({'fw': fw, 'fh': fh, 'ax': 400 - x0, 'ay': 400 - y0, 'top': ib[1] + idy - y0})
    result[name] = entry

s = open(game).read()
block = '/*CHARS-BEGIN*/\nconst CHAR_ART = ' + json.dumps(result, separators=(',', ':')) + ';\n/*CHARS-END*/'
if '/*CHARS-BEGIN*/' in s:
    a0 = s.index('/*CHARS-BEGIN*/'); a1 = s.index('/*CHARS-END*/') + len('/*CHARS-END*/')
    s = s[:a0] + block + s[a1:]
else:
    s = s.replace('/*ART-END*/', '/*ART-END*/\n' + block, 1)
open(game, 'w').write(s)
print('embedded', len(result), 'characters, total', len(block) // 1024, 'KB')
