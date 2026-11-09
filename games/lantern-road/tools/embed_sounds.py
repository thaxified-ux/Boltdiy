#!/usr/bin/env python3
"""Lantern Road: recorded (CC0) sound effects embedded in the game, and streamed music files per zone.
usage: patch-samples.py game.html sfx_dir   (music is referenced as audio/<name>.mp3 next to the page)"""
import sys, os, glob, base64, json, re
p, sfx = sys.argv[1:]
s = open(p).read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:90]); s = s.replace(a, b)
snd = {os.path.basename(f)[:-4]: 'data:audio/mpeg;base64,' + base64.b64encode(open(f, 'rb').read()).decode() for f in sorted(glob.glob(sfx + '/*.mp3'))}
block = '/*SND-BEGIN*/\nconst SND = ' + json.dumps(snd, separators=(',', ':')) + ';\n/*SND-END*/\n'
if '/*SND-BEGIN*/' in s:
    a = s.index('/*SND-BEGIN*/'); b = s.index('/*SND-END*/') + len('/*SND-END*/\n'); s = s[:a] + block + s[b:]
    open(p, 'w').write(s); print('samples refreshed'); sys.exit()
rep("/* ---------- Sound ----------", block + "/* ---------- Sound ----------")
# sample player and streamed music inside the SFX module
rep("  function tone(f, dur, type, vol, opts) {", r"""  // recorded samples (SND, embedded above): several takes per sound, picked at random and pitched a little for variety
  const BUF = {}, TAKES = {};
  function loadSamples() {
    for (const k in SND) { const base = k.replace(/\d+$/, ''); (TAKES[base] = TAKES[base] || []).push(k);
      const bin = atob(SND[k].split(',')[1]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      try { const pr = ac.decodeAudioData(u.buffer, b => { BUF[k] = b; }, () => {}); if (pr && pr.catch) pr.catch(() => {}); } catch (e) {} }
  }
  function samp(name, vol, rate) {
    if (!ok() || S.gfx.sound === false) return true;   // muted counts as played, so no synth fallback either
    const list = (TAKES[name] || []).filter(k => BUF[k]); if (!list.length) return false;
    const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = BUF[list[Math.floor(Math.random() * list.length)]];
    src.playbackRate.value = (rate || 1) * (.94 + Math.random() * .12); g.gain.value = vol == null ? .8 : vol;
    src.connect(g); g.connect(sfxBus); src.start(); return true;
  }
  // streamed music: one track per zone and one for guardians, in audio/ next to the page; the synth tune plays if a file is missing
  const TRACKS = ['01-mossbarrow', '02-saltmarsh', '03-cinder', '04-dunes', '05-ruins', '06-frostfang', '07-archive', '08-thornveil', '09-citadel', '10-hollow'];
  const mus = { key: null, el: null, old: [], failed: {}, vol: 0 };
  function trackFor() { if (S.gfx.music === false || !G) return null; return S.wave === WAVES ? 'boss' : TRACKS[zoneOf(S.stage) % TRACKS.length]; }
  function musicTick() {
    const want = document.hidden ? null : trackFor();
    if (want !== mus.key && !(want && mus.failed[want])) {
      if (mus.el) mus.old.push(mus.el); mus.el = null; mus.key = want; mus.vol = 0;
      if (want) { const el = new Audio('audio/' + want + '.mp3'); el.loop = true; el.volume = 0; el.preload = 'auto';
        el.addEventListener('error', () => { mus.failed[want] = true; if (mus.el === el) { mus.el = null; mus.key = null; } });
        const pr = el.play(); if (pr && pr.catch) pr.catch(() => { mus.failed[want] = true; if (mus.el === el) { mus.el = null; mus.key = null; } });
        mus.el = el; }
    } else if (want && mus.failed[want] && mus.key) { if (mus.el) mus.old.push(mus.el); mus.el = null; mus.key = null; }
    const target = mus.el ? (G && G.hero.dead > 0 ? .12 : .42) : 0;
    if (mus.el) { mus.vol += (target - mus.vol) * .12; mus.el.volume = Math.max(0, Math.min(1, mus.vol)); }
    mus.old = mus.old.filter(el => { el.volume = Math.max(0, el.volume - .05); if (el.volume <= .01) { el.pause(); el.src = ''; return false; } return true; });
    return !!(mus.el && !mus.el.paused && mus.el.readyState >= 2);
  }
  function tone(f, dur, type, vol, opts) {""")
rep("    seqT = setInterval(tick, 60); applyPrefs();", "    loadSamples(); seqT = setInterval(tick, 60); applyPrefs();")
rep("  function tick() {\n", "  function tick() {\n    if (ok() && musicTick()) { nextT = ac.currentTime + .1; return; }   // a recorded track is playing: no synth tune\n")
# effects: recorded first, synth as fallback
rep("      const k = activeChar(), c = crit ? 1.5 : 1;\n", "      const k = activeChar(), c = crit ? 1.5 : 1;\n      if (samp({ glacier: 'hammer_hit', scout: 'arrow_hit', plague: 'fire_hit' }[k] || 'sword_hit', crit ? 1 : .7, crit ? .9 : 1)) return;\n")
rep("      if (!ok()) return; const k = activeChar();\n      if (k === 'plague') {", "      if (!ok()) return; const k = activeChar();\n      if (samp(k === 'plague' ? 'fire_cast' : 'bow', .8)) return;\n      if (k === 'plague') {")
rep("    hurt() { ", "    swing() { const k = activeChar(); if (k === 'glacier') samp('swing_heavy', .5); else if (k === 'swordswoman') samp('swing', .45); },\n    hurt() { if (samp('hurt', .6)) return; ")
rep("    kill() { ", "    kill() { if (samp('mon_die', .3)) return; ")
rep("    loot(r) { ", "    loot(r) { if (samp('gem', .5 + .12 * Math.min(3, r), 1 + .08 * Math.min(3, r))) return; ")
rep("    skill() { ", "    skill() { if (samp('magic', .7)) return; ")
rep("    parry() { ", "    parry() { samp('parry', .8); ")
rep("    guardian() { ", "    guardian() { samp('roar', .8, .8); ")
rep("    moth() { ", "    moth() { if (samp('coins', .8)) return; ")
rep("document.addEventListener('visibilitychange', () => { /* the browser pauses audio in hidden tabs on its own */ });", "")
rep("h.pending = { at: G.t", "SFX.play('swing'); h.pending = { at: G.t")
open(p, 'w').write(s); print('ok', len(block) // 1024, 'KB of samples')
