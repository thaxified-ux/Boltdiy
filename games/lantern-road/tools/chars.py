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
CHARS = {
    'swordswoman': {'scale': 1.0, 'anims': {
        'idle': f'{P}/sword/Animations/Idle/east',
        'walk': f'{P}/sword/Animations/Walk/east',
        'atk1': f'{P}/sword/Animations/Downward_Sword_Slash/east',
        'atk2': f'{P}/sword/Animations/Overhead_Slash/east'}, 'ascale': {'atk1': 0.89}},
    'scout': {'scale': 1.0, 'anims': {
        'idle': f'{P}/bow/Animations/Idle/east',
        'walk': f'{P}/bow/Animations/Walk/east',
        'atk1': f'{P}/bow/Animations/Shoot_Arrow/east',
        'death': f'{P}/bow/Animations/Death/east'}},
    'glacier': {'scale': 1.0, 'anims': {
        'idle': f'{P}/glacier/Animations/Idle/east',
        'walk': f'{P}/glacier/Animations/Walk/east',
        'atk1': f'{P}/glacier/Animations/Glacial_Hammerfall/east',
        'atk2': f'{P}/glacier/Animations/Frozen_Cyclone/east',
        'death': f'{P}/glacier/Animations/Death/east'}},
    'plague': {'scale': 1.0, 'anims': {
        'idle': f'{P}/plague/Animations/Idle/east',
        'walk': f'{P}/plague/Animations/Walk/east',
        'atk1': f'{P}/plague/Animations/Basic_Attack/east'}},
}


def resize_snap(im, scale, pal):
    if scale == 1:
        return im
    W, H = round(im.width * scale), round(im.height * scale)
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
    if cfg['scale'] != 1 or cfg.get('ascale'):
        px = np.concatenate([np.asarray(f)[np.asarray(f)[..., 3] > 0][:, :3] for f in raw_all[:20]])
        pal = np.unique(px, axis=0).astype(np.int32)
        if len(pal) > 96:  # keep the palette small so snapping stays fast
            idx = np.random.default_rng(1).choice(len(pal), 96, replace=False); pal = pal[idx]
        frames = {an: [resize_snap(f, cfg['scale'] * cfg.get('ascale', {}).get(an, 1), pal) for f in fr] for an, fr in frames.items()}
    # line every animation up on the feet of its first frame (canvas sizes differ between animations)
    def feet(f):
        al = np.asarray(f)[..., 3] > 0; ys, xs = np.nonzero(al); bot = ys.max()
        low = xs[ys >= bot - 8]; return float((low.min() + low.max()) / 2), int(bot)
    shift = {}
    for an, fr in frames.items():
        fx0, _ = feet(fr[0]); bot = max(f.getbbox()[3] for f in fr if f.getbbox())
        shift[an] = (round(400 - fx0), 400 - bot)
    boxes = []
    for an, fr in frames.items():
        dx, dy = shift[an]
        for f in fr:
            bb = f.getbbox()
            if bb: boxes.append((bb[0] + dx, bb[1] + dy, bb[2] + dx, bb[3] + dy))
    x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes); x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
    fw, fh = x1 - x0, y1 - y0
    ib = frames['idle'][0].getbbox(); idx, idy = shift['idle']
    entry = {}
    for an, fr in frames.items():
        strip = Image.new('RGBA', (fw * len(fr), fh), (0, 0, 0, 0))
        clip = Image.new('RGBA', (fw * len(fr), fh), (0, 0, 0, 0))
        dx, dy = shift[an]
        for i, f in enumerate(fr):
            strip.alpha_composite(f, (i * fw + dx - x0, dy - y0))
        buf = io.BytesIO(); strip.save(buf, 'PNG', optimize=True)
        strip.save(f'{prev}/{name}-{an}.png')
        entry[an] = {'frames': len(fr), 'src': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()}
        print(name, an, len(fr), 'frames', fw, 'x', fh, len(buf.getvalue()) // 1024, 'KB')
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
