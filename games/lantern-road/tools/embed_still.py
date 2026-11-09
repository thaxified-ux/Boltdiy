#!/usr/bin/env python3
"""Embed converted still monster sprites as FOE_STILL {name: {w,h,src}}. usage: embed_still.py game.html sprites_dir"""
import sys, os, glob, json, base64, io
from PIL import Image
game, d = sys.argv[1:]
FIX = {'the-light-eater': 'The Light-Eater', 'the-warden-of-ash': 'The Warden of Ash'}
def nice(k):
    if k in FIX: return FIX[k]
    return ' '.join(w if w in ('of',) else w.capitalize() for w in k.split('-'))
out = {}
for f in sorted(glob.glob(f'{d}/*.png')):
    k = os.path.basename(f)[:-4]; im = Image.open(f).convert('RGBA'); buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
    out[nice(k)] = {'w': im.width, 'h': im.height, 'src': 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()}
s = open(game).read()
block = '/*STILL-BEGIN*/\nconst FOE_STILL = ' + json.dumps(out, separators=(',', ':')) + ';\n/*STILL-END*/\n'
if '/*STILL-BEGIN*/' in s:
    a = s.index('/*STILL-BEGIN*/'); b = s.index('/*STILL-END*/') + len('/*STILL-END*/\n'); s = s[:a] + s[b:]
s = s.replace('/*FOES-BEGIN*/', block + '/*FOES-BEGIN*/', 1)
open(game, 'w').write(s); print(len(out), 'monsters,', len(block) // 1024, 'KB'); print(sorted(out))
