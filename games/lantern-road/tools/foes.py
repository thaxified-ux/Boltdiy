#!/usr/bin/env python3
"""Embed pack monsters (west-facing frames with their shadow layer) as FOE_PACK strips.
usage: foes.py game.html fungal_dir preview_dir
Each monster: per state a horizontal strip; fw/fh frame size; ax/ay the pack's ground point (x=80, y=128) inside a frame;
top (head top in idle); hit (impact frame of the attack: where it reaches furthest left)."""
import sys, os, glob, json, base64, io
import numpy as np
from PIL import Image
game, F, prev = sys.argv[1:]
os.makedirs(prev, exist_ok=True)
MONS = {'Blightbloat': ['Idle', 'Walk', 'Attack', 'Death'], 'Thorncap': ['Idle', 'Walk', 'Attack', 'Death'],
        'Bloodstalker': ['Idle', 'Walk', 'Attack', 'Death'], 'Lanterncap': ['Idle', 'Explode', 'Death'],
        'Ironcap': ['Idle', 'Walk', 'Charge', 'Attack', 'Death']}
out = {}
for m, states in MONS.items():
    fr = {}
    for st in states:
        fs = sorted(glob.glob(f'{F}/{m}/{st}/west/*.png'))
        imgs = []
        for f in fs:
            sh = f.replace(f'{F}/{m}/', f'{F}/Shadows/{m}/')
            im = Image.open(f).convert('RGBA')
            if os.path.exists(sh): base = Image.open(sh).convert('RGBA'); base.alpha_composite(im); im = base
            imgs.append(im)
        fr[st.lower()] = imgs
    bbs = [f.getbbox() for v in fr.values() for f in v if f.getbbox()]
    x0 = min(b[0] for b in bbs); y0 = min(b[1] for b in bbs); x1 = max(b[2] for b in bbs); y1 = max(b[3] for b in bbs)
    fw, fh = x1 - x0, y1 - y0
    e = {'fw': fw, 'fh': fh, 'ax': 80 - x0, 'ay': 128 - y0, 'top': fr['idle'][0].getbbox()[1] - y0}
    if 'attack' in fr:
        lefts = [f.getbbox()[0] for f in fr['attack']]; e['hit'] = int(np.argmin(lefts))
    for st, imgs in fr.items():
        strip = Image.new('RGBA', (fw * len(imgs), fh))
        for i, im in enumerate(imgs): strip.alpha_composite(im.crop((x0, y0, x1, y1)), (i * fw, 0))
        strip.save(f'{prev}/{m}-{st}.png')
        buf = io.BytesIO(); strip.save(buf, 'PNG', optimize=True)
        e[st] = {'frames': len(imgs), 'src': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()}
    out[m] = e
    print(m, fw, 'x', fh, {k: v['frames'] for k, v in e.items() if isinstance(v, dict)}, 'hit', e.get('hit'))
s = open(game).read()
block = '/*FOES-BEGIN*/\nconst FOE_PACK = ' + json.dumps(out, separators=(',', ':')) + ';\n/*FOES-END*/'
if '/*FOES-BEGIN*/' in s:  # move it above the code that reads it
    a = s.index('/*FOES-BEGIN*/'); b = s.index('/*FOES-END*/') + len('/*FOES-END*/') + 1; s = s[:a] + s[b:]
if True:
    s = s.replace('/* Monsters from art packs', block + '\n/* Monsters from art packs', 1)
open(game, 'w').write(s); print('embedded', len(block) // 1024, 'KB')
