// Jaylinn Village – de stad tekenen in schuin bovenaanzicht (isometrisch).
(function (JV) {
  const G = JV.GRID;
  const C = JV.CATALOG;
  const TW = 64, TH = 32;
  JV.TW = TW; JV.TH = TH;
  const R = JV.R;

  JV.cam = { x: 0, y: 300, zoom: 1 };
  JV.view = { w: 0, h: 0, dpr: 1 };
  JV.floaters = [];

  const center = (gx, gy) => ({ x: (gx - gy) * TW / 2, y: (gx + gy) * TH / 2 });
  JV.tileCenter = center;
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const up = (p, h) => ({ x: p.x, y: p.y - h });

  JV.screenToTile = function (sx, sy) {
    const cam = JV.cam, v = JV.view;
    const wx = (sx - v.w / 2) / cam.zoom + cam.x;
    const wy = (sy - v.h / 2) / cam.zoom + cam.y;
    const a = wx / (TW / 2), b = wy / (TH / 2);
    return { gx: Math.floor((a + b) / 2 + 0.5), gy: Math.floor((b - a) / 2 + 0.5) };
  };
  JV.worldToScreen = function (wx, wy) {
    const cam = JV.cam, v = JV.view;
    return { x: (wx - cam.x) * cam.zoom + v.w / 2, y: (wy - cam.y) * cam.zoom + v.h / 2 };
  };

  function footprint(gx, gy, w, h, inset) {
    const T = { x: center(gx, gy).x, y: center(gx, gy).y - TH / 2 };
    const Rr = { x: center(gx + w - 1, gy).x + TW / 2, y: center(gx + w - 1, gy).y };
    const B = { x: center(gx + w - 1, gy + h - 1).x, y: center(gx + w - 1, gy + h - 1).y + TH / 2 };
    const L = { x: center(gx, gy + h - 1).x - TW / 2, y: center(gx, gy + h - 1).y };
    if (inset) {
      const c = { x: (T.x + B.x) / 2, y: (T.y + B.y) / 2 };
      const k = 1 - inset;
      for (const p of [T, Rr, B, L]) { p.x = c.x + (p.x - c.x) * k; p.y = c.y + (p.y - c.y) * k; }
    }
    return { T, R: Rr, B, L };
  }

  function poly(ctx, pts, fill, stroke) {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function circ(ctx, x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }

  function box(ctx, f, H, cl) {
    poly(ctx, [f.L, f.B, up(f.B, H), up(f.L, H)], cl.left);
    poly(ctx, [f.B, f.R, up(f.R, H), up(f.B, H)], cl.right);
    poly(ctx, [up(f.T, H), up(f.R, H), up(f.B, H), up(f.L, H)], cl.top);
  }
  // punt op een gevel: face 'L' loopt van L naar B, face 'R' van B naar R
  function fp(f, face, t, h) {
    const p = face === 'L' ? lerp(f.L, f.B, t) : lerp(f.B, f.R, t);
    return { x: p.x, y: p.y - h };
  }
  function faceQuad(ctx, f, face, t1, t2, h1, h2, fill, stroke) {
    const pts = [fp(f, face, t1, h1), fp(f, face, t2, h1), fp(f, face, t2, h2), fp(f, face, t1, h2)];
    poly(ctx, pts, fill, stroke);
    return pts;
  }

  // --- grond (in een buffer, opnieuw als de stad verandert) ------------------
  let ground = null, groundScale = 2;
  const MINX = -G * TW / 2 - 8, MINY = -TH / 2 - 8, GW = G * TW + 16, GH = G * TH + 16;
  function roadCenterline(ctx, gx, gy) {
    const c = center(gx, gy);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]);
    let n = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!JV.isRoad(gx + dx, gy + dy)) continue;
      n++;
      const m = center(gx + dx, gy + dy);
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo((c.x + m.x) / 2, (c.y + m.y) / 2); ctx.stroke();
    }
    ctx.restore();
    return n;
  }
  function buildGround() {
    if (!ground) { ground = document.createElement('canvas'); ground.width = GW * groundScale; ground.height = GH * groundScale; }
    const ctx = ground.getContext('2d');
    ctx.setTransform(groundScale, 0, 0, groundScale, -MINX * groundScale, -MINY * groundScale);
    ctx.clearRect(MINX, MINY, GW, GH);
    const S = JV.state();
    // zijkant van het eiland
    const fAll = footprint(0, 0, G, G, 0);
    poly(ctx, [fAll.L, fAll.B, up(fAll.B, -10), up(fAll.L, -10)], '#B9845A');
    poly(ctx, [fAll.B, fAll.R, up(fAll.R, -10), up(fAll.B, -10)], '#9C6B47');
    for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
      const f = footprint(gx, gy, 1, 1, 0);
      const water = S.terrain[gy * G + gx] === 1;
      const road = JV.isRoad(gx, gy);
      if (water) {
        poly(ctx, [f.T, f.R, f.B, f.L], '#7CC7E8');
      } else {
        poly(ctx, [f.T, f.R, f.B, f.L], (gx + gy) % 2 ? '#93CF73' : '#8BC86B');
      }
      if (road && water) {
        const fi = footprint(gx, gy, 1, 1, 0.08);
        poly(ctx, [fi.T, fi.R, fi.B, fi.L], '#C79A68', '#9C6E45');
        ctx.strokeStyle = 'rgba(120,80,50,0.5)';
        for (let i = 1; i < 5; i++) { const a = lerp(fi.L, fi.B, i / 5), b = lerp(fi.T, fi.R, i / 5); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      } else if (road) {
        poly(ctx, [f.T, f.R, f.B, f.L], '#D9D2C7');
        const fi = footprint(gx, gy, 1, 1, 0.16);
        poly(ctx, [fi.T, fi.R, fi.B, fi.L], '#8D8794');
        // wegdek doortrekken naar buurwegen
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (!JV.isRoad(gx + dx, gy + dy)) continue;
          const ff = footprint(gx, gy, 1, 1, 0);
          let a, b;
          if (dx === 1) { a = lerp(ff.R, ff.B, 0.16); b = lerp(ff.R, ff.B, 0.84); }
          if (dx === -1) { a = lerp(ff.T, ff.L, 0.16); b = lerp(ff.T, ff.L, 0.84); }
          if (dy === 1) { a = lerp(ff.L, ff.B, 0.16); b = lerp(ff.L, ff.B, 0.84); }
          if (dy === -1) { a = lerp(ff.T, ff.R, 0.16); b = lerp(ff.T, ff.R, 0.84); }
          const c = center(gx, gy);
          const k = 0.84;
          poly(ctx, [a, b, { x: c.x + (b.x - c.x) * k, y: c.y + (b.y - c.y) * k }, { x: c.x + (a.x - c.x) * k, y: c.y + (a.y - c.y) * k }], '#8D8794');
        }
      }
    }
    for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) if (JV.isRoad(gx, gy) && !JV.isWater(gx, gy)) roadCenterline(ctx, gx, gy);
  }

  // --- volgorde van tekenen (achter naar voor) ------------------------------
  let order = [];
  function bbox(o) {
    const d = C[o.type];
    const f = footprint(o.gx, o.gy, d.w, d.h, 0);
    return { x0: f.L.x, x1: f.R.x, y0: f.T.y - (d.cat === 'werk' ? 110 : 80), y1: f.B.y };
  }
  function behind(a, b) {
    const da = C[a.type], db = C[b.type];
    if (a.gx + da.w <= b.gx || a.gy + da.h <= b.gy) return true;
    return false;
  }
  function sortObjects() {
    const S = JV.state();
    const objs = S.objects.filter((o) => o.type !== 'road');
    objs.sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    const n = objs.length;
    const boxes = objs.map(bbox);
    const indeg = new Array(n).fill(0), out = objs.map(() => []);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const A = boxes[i], B = boxes[j];
      if (A.x1 <= B.x0 || B.x1 <= A.x0 || A.y1 <= B.y0 || B.y1 <= A.y0) continue;
      if (behind(objs[i], objs[j])) { out[i].push(j); indeg[j]++; }
      else if (behind(objs[j], objs[i])) { out[j].push(i); indeg[i]++; }
    }
    const res = [], ready = [];
    for (let i = 0; i < n; i++) if (!indeg[i]) ready.push(i);
    const done = new Array(n).fill(false);
    while (res.length < n) {
      if (!ready.length) { for (let i = 0; i < n; i++) if (!done[i]) { ready.push(i); break; } }
      ready.sort((a, b) => b - a);
      const i = ready.pop();
      if (done[i]) continue;
      done[i] = true; res.push(objs[i]);
      for (const j of out[i]) if (--indeg[j] === 0) ready.push(j);
    }
    order = res;
  }

  // --- objecten -------------------------------------------------------------
  function drawHouse(ctx, f, wall, roof, o, lights, opts) {
    opts = opts || {};
    const H = 34;
    const wallL = JV.shade(wall, -26), wallR = JV.shade(wall, -8);
    box(ctx, f, H, { left: wallL, right: wallR, top: wall });
    const doorFace = o.flip ? 'L' : 'R', winFace = o.flip ? 'R' : 'L';
    const glass = '#9FD3EA';
    const w1 = faceQuad(ctx, f, winFace, 0.18, 0.4, 12, 25, glass, '#FFFFFF');
    const w2 = faceQuad(ctx, f, winFace, 0.6, 0.82, 12, 25, glass, '#FFFFFF');
    const w3 = faceQuad(ctx, f, doorFace, 0.12, 0.3, 14, 25, glass, '#FFFFFF');
    faceQuad(ctx, f, doorFace, 0.44, 0.62, 0, 22, opts.door || JV.shade(roof, -20));
    const knob = fp(f, doorFace, 0.58, 10); circ(ctx, knob.x, knob.y, 1.4, '#F6C445');
    const w4 = faceQuad(ctx, f, doorFace, 0.74, 0.9, 14, 25, glass, '#FFFFFF');
    lights.push(w1, w2, w3, w4);
    // dak (schilddak met overstek)
    const e = { T: up(f.T, H), R: up(f.R, H), B: up(f.B, H), L: up(f.L, H) };
    const c = { x: (e.T.x + e.B.x) / 2, y: (e.T.y + e.B.y) / 2 };
    for (const k of ['T', 'R', 'B', 'L']) { e[k] = { x: c.x + (e[k].x - c.x) * 1.12, y: c.y + (e[k].y - c.y) * 1.12 + 2 }; }
    const apex = { x: c.x, y: c.y - 30 };
    poly(ctx, [e.T, e.R, apex], JV.shade(roof, 10));
    poly(ctx, [e.L, e.T, apex], JV.shade(roof, -5));
    poly(ctx, [e.L, e.B, apex], JV.shade(roof, -18));
    poly(ctx, [e.B, e.R, apex], roof);
    if (opts.heart) {
      ctx.save(); ctx.translate(apex.x, apex.y + 16); ctx.scale(0.9, 0.9);
      ctx.beginPath(); ctx.moveTo(0, 4); ctx.bezierCurveTo(-9, -4, -5, -11, 0, -6); ctx.bezierCurveTo(5, -11, 9, -4, 0, 4);
      ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();
    }
  }

  const WORK_STYLE = {
    super: { wall: '#F4F1E6', a1: '#4DAA57', a2: '#FFFFFF', sign: '#3E8E48', roof: '#C9D7C2' },
    restaurant: { wall: '#FBE6D4', a1: '#E2483D', a2: '#FFFFFF', sign: '#A8322B', roof: '#E3C7B4' },
    opvang: { wall: '#FFF3C4', a1: '#9B6FD6', a2: '#F6C445', sign: '#7B4FB8', roof: '#E9DDB0' },
  };
  function drawWork(ctx, o, f, lights) {
    const st = WORK_STYLE[o.type];
    const H = 46;
    box(ctx, f, H, { left: JV.shade(st.wall, -28), right: JV.shade(st.wall, -10), top: st.roof });
    const inner = footprint(o.gx, o.gy, 3, 3, 0.12);
    poly(ctx, [up(inner.T, H), up(inner.R, H), up(inner.B, H), up(inner.L, H)], JV.shade(st.roof, -14));
    const doorFace = o.flip ? 'L' : 'R', winFace = o.flip ? 'R' : 'L';
    lights.push(faceQuad(ctx, f, winFace, 0.08, 0.46, 6, 27, '#9FD3EA', '#FFFFFF'));
    lights.push(faceQuad(ctx, f, winFace, 0.54, 0.92, 6, 27, '#9FD3EA', '#FFFFFF'));
    lights.push(faceQuad(ctx, f, doorFace, 0.08, 0.32, 6, 27, '#9FD3EA', '#FFFFFF'));
    faceQuad(ctx, f, doorFace, 0.42, 0.6, 0, 26, '#B7DDEE', '#FFFFFF');
    lights.push(faceQuad(ctx, f, doorFace, 0.7, 0.92, 6, 27, '#9FD3EA', '#FFFFFF'));
    // luifel
    for (const face of ['L', 'R']) {
      for (let i = 0; i < 10; i++) {
        faceQuad(ctx, f, face, i / 10, (i + 1) / 10, 30, 39, i % 2 ? st.a2 : st.a1);
      }
    }
    // bord op het dak
    const top = up(f.B, H);
    const label = C[o.type].icon + ' ' + C[o.type].name;
    ctx.font = '700 11px Fredoka, Nunito, system-ui, sans-serif';
    const w = ctx.measureText(label).width + 16;
    const x = top.x - w / 2, y = top.y - 34;
    ctx.fillStyle = JV.shade(st.sign, -30); ctx.fillRect(top.x - 9, y + 18, 3, 14); ctx.fillRect(top.x + 6, y + 18, 3, 14);
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, 20, 7) : ctx.rect(x, y, w, 20); ctx.fillStyle = st.sign; ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, top.x, y + 10.5);
    if (o.type === 'opvang') {
      // klein speeltuintje: glijbaan naast de deur
      const p = fp(f, doorFace === 'R' ? 'L' : 'R', 0.5, 0);
      ctx.strokeStyle = '#E8708A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p.x - 8, p.y + 6); ctx.lineTo(p.x + 6, p.y - 8); ctx.stroke();
    }
  }

  function hash(n) { return ((n * 2654435761) >>> 0) / 4294967296; }

  function drawTree(ctx, o) {
    const c = center(o.gx, o.gy);
    const h = hash(o.id);
    ctx.fillStyle = 'rgba(40,70,30,0.18)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 2, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8A5A3A'; ctx.fillRect(c.x - 3, c.y - 16, 6, 18);
    const g = ['#4E9F4A', '#5DAE5B', '#3F8E45', '#6BB85A'][Math.floor(h * 4)];
    if (h > 0.8) {
      // dennenboom
      poly(ctx, [{ x: c.x, y: c.y - 54 }, { x: c.x + 15, y: c.y - 22 }, { x: c.x - 15, y: c.y - 22 }], '#3F8E45');
      poly(ctx, [{ x: c.x, y: c.y - 40 }, { x: c.x + 19, y: c.y - 12 }, { x: c.x - 19, y: c.y - 12 }], '#357D3B');
      return;
    }
    circ(ctx, c.x - 8, c.y - 22, 11, JV.shade(g, -14));
    circ(ctx, c.x + 8, c.y - 22, 11, JV.shade(g, -6));
    circ(ctx, c.x, c.y - 34, 13, g);
    circ(ctx, c.x - 4, c.y - 38, 5, JV.shade(g, 25));
    if (h < 0.25) { circ(ctx, c.x + 6, c.y - 26, 2.5, '#E2483D'); circ(ctx, c.x - 7, c.y - 30, 2.5, '#E2483D'); }
  }
  function drawBush(ctx, o) {
    const c = center(o.gx, o.gy);
    circ(ctx, c.x - 7, c.y - 4, 8, '#4E9F4A'); circ(ctx, c.x + 7, c.y - 4, 8, '#3F8E45'); circ(ctx, c.x, c.y - 10, 9, '#5DAE5B');
  }
  function drawRock(ctx, o) {
    const c = center(o.gx, o.gy);
    ctx.fillStyle = '#9A98A6'; ctx.beginPath(); ctx.ellipse(c.x - 3, c.y - 5, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#B5B3BF'; ctx.beginPath(); ctx.ellipse(c.x + 6, c.y - 3, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#CDCBD5'; ctx.beginPath(); ctx.ellipse(c.x - 6, c.y - 9, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawFlowers(ctx, o) {
    const f = footprint(o.gx, o.gy, 1, 1, 0.22);
    poly(ctx, [f.T, f.R, f.B, f.L], '#8A6248');
    const cols = ['#F28BA8', '#F6C445', '#FFFFFF', '#9B6FD6', '#E2483D'];
    const c = center(o.gx, o.gy);
    for (let i = 0; i < 9; i++) {
      const a = hash(o.id * 13 + i), b = hash(o.id * 7 + i * 3);
      const x = c.x + (a - 0.5) * 30, y = c.y + (b - 0.5) * 14 - 3;
      ctx.fillStyle = '#3F8E45'; ctx.fillRect(x - 0.6, y, 1.2, 4);
      circ(ctx, x, y, 3, cols[(o.id + i) % cols.length]);
    }
  }
  function drawBench(ctx, o) {
    const c = center(o.gx, o.gy);
    const s = o.flip ? -1 : 1;
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(s, 1);
    ctx.fillStyle = '#6B4B33'; ctx.fillRect(-12, -4, 2, 8); ctx.fillRect(10, -10, 2, 8);
    poly(ctx, [{ x: -16, y: -4 }, { x: 8, y: -16 }, { x: 16, y: -12 }, { x: -8, y: 0 }], '#B07A4F');
    poly(ctx, [{ x: -16, y: -4 }, { x: 8, y: -16 }, { x: 8, y: -26 }, { x: -16, y: -14 }], '#C68D5D');
    ctx.restore();
  }
  function drawLantern(ctx, o) {
    const c = center(o.gx, o.gy);
    ctx.fillStyle = '#4A3F52'; ctx.fillRect(c.x - 1.5, c.y - 44, 3, 44);
    ctx.fillRect(c.x - 5, c.y - 2, 10, 3);
    ctx.fillStyle = '#4A3F52'; ctx.fillRect(c.x - 6, c.y - 52, 12, 3);
    ctx.fillStyle = '#FFE9A8'; ctx.fillRect(c.x - 5, c.y - 49, 10, 9);
  }
  function drawFountain(ctx, o, t) {
    const f = footprint(o.gx, o.gy, 2, 2, 0);
    const c = { x: (f.T.x + f.B.x) / 2, y: (f.T.y + f.B.y) / 2 };
    ctx.fillStyle = '#B8B4C4'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 4, 44, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#D7D3E0'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 44, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7CC7E8'; ctx.beginPath(); ctx.ellipse(c.x, c.y, 36, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#D7D3E0'; ctx.fillRect(c.x - 4, c.y - 30, 8, 30);
    ctx.fillStyle = '#C5C1D0'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 30, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(160,215,240,0.9)';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2, ph = ((t * 0.9 + i / 8) % 1);
      const x = c.x + Math.cos(a) * 14 * (0.3 + ph), y = c.y - 34 + Math.sin(a) * 5 * ph - Math.sin(ph * Math.PI) * 12 + ph * 30;
      circ(ctx, x, y, 2.2, 'rgba(160,215,240,' + (1 - ph * 0.6) + ')');
    }
    circ(ctx, c.x, c.y - 38, 4, 'rgba(190,230,248,0.95)');
  }

  function bubble(ctx, x, y, text, bg) {
    ctx.save();
    ctx.font = '700 13px Fredoka, Nunito, system-ui, sans-serif';
    const w = Math.max(26, ctx.measureText(text).width + 14);
    ctx.fillStyle = 'rgba(70,40,60,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 18, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - 12, w, 24, 12) : ctx.rect(x - w / 2, y - 12, w, 24);
    ctx.fillStyle = bg || '#FFFFFF'; ctx.fill();
    ctx.strokeStyle = 'rgba(80,40,60,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, y + 11); ctx.lineTo(x, y + 17); ctx.lineTo(x + 5, y + 11); ctx.fillStyle = bg || '#FFFFFF'; ctx.fill();
    ctx.fillStyle = '#4A2E3C'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1);
    ctx.restore();
  }

  function drawObject(ctx, o, t, lights, ghost) {
    const d = C[o.type];
    const f = footprint(o.gx, o.gy, d.w, d.h, d.cat === 'werk' ? 0.06 : 0.12);
    const S = JV.state();
    switch (o.type) {
      case 'tree': drawTree(ctx, o); break;
      case 'bush': drawBush(ctx, o); break;
      case 'rock': drawRock(ctx, o); break;
      case 'flowers': drawFlowers(ctx, o); break;
      case 'bench': drawBench(ctx, o); break;
      case 'lantern': drawLantern(ctx, o); break;
      case 'fountain': drawFountain(ctx, o, t); break;
      case 'super': case 'restaurant': case 'opvang': drawWork(ctx, o, f, lights); break;
      case 'playerhouse': {
        const hs = JV.STARTER_HOUSES.find((h) => h.id === S.houseStyle) || JV.STARTER_HOUSES[0];
        drawHouse(ctx, f, hs.wall, hs.roof, o, lights, { heart: true, door: '#E8708A' });
        break;
      }
      case 'road': {
        const ff = footprint(o.gx, o.gy, 1, 1, 0.16);
        poly(ctx, [ff.T, ff.R, ff.B, ff.L], '#8D8794');
        break;
      }
      default:
        drawHouse(ctx, f, o.wall || '#F5EBD3', o.roof || '#E8708A', o, lights);
    }
    if (ghost) return;
    // bewoners bij hun huis, huisdieren en de speler
    const dark = JV.darkness();
    if (o.type === 'playerhouse' && dark < 0.6) {
      const p = fp(footprint(o.gx, o.gy, 2, 2, 0), o.flip ? 'L' : 'R', 0.15, -6);
      JV.drawPerson(ctx, p.x + 4, p.y + 6, 0.3, S.player.look, { sash: true });
    }
    if (d.cat === 'woning') {
      const fam = JV.familyOf(o.id);
      if (fam && dark < 0.6) {
        const ff = footprint(o.gx, o.gy, 2, 2, 0);
        const kid = fam.members.find((m) => m.look.age === 'kind' || m.look.age === 'tiener');
        const p = fp(ff, o.flip ? 'R' : 'L', 0.3, -6);
        if (kid) JV.drawPerson(ctx, p.x, p.y + 6, 0.3, kid.look, { bob: Math.sin(t * 3 + o.id) > 0.7 ? -2 : 0 });
        if (fam.pet) {
          const pet = JV.PETS.find((x) => x.id === fam.pet);
          ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          const q = fp(ff, o.flip ? 'R' : 'L', 0.62, -7);
          ctx.fillText(pet.icon, q.x, q.y + 7);
        }
      }
    }
  }

  function drawBubbles(ctx, o, t) {
    const d = C[o.type];
    const f = footprint(o.gx, o.gy, d.w, d.h, 0);
    const topY = (f.T.y + f.B.y) / 2 - (d.cat === 'werk' ? 70 : 86) + Math.sin(t * 3 + o.id) * 2;
    const cx = (f.L.x + f.R.x) / 2;
    if (d.cat === 'werk' && (o.pending || 0) >= 5) bubble(ctx, cx, topY, '🪙 ' + Math.floor(o.pending), '#FFF4C9');
    if (d.cat === 'werk' && JV.workersOf(o).length === 0 && JV.state().families.length) bubble(ctx, cx, topY, '👷 Geen personeel', '#FFFFFF');
    if (d.cat === 'woning') {
      const fam = JV.familyOf(o.id);
      if (o.movedIn && Date.now() - o.movedIn < 9000) bubble(ctx, cx, topY, '📦 Nieuw!', '#FFFFFF');
      else if (fam && fam.giftReady) bubble(ctx, cx, topY, '🎁', '#FFE3EC');
    }
  }

  // --- hoofdtekenfunctie ----------------------------------------------------
  JV.render = function (ctx, t, ui) {
    const S = JV.state();
    const v = JV.view, cam = JV.cam, dpr = v.dpr;
    if (R.dirty) { buildGround(); sortObjects(); R.dirty = false; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sky = ctx.createLinearGradient(0, 0, 0, v.h);
    sky.addColorStop(0, '#CDEFFB'); sky.addColorStop(1, '#FBE7EF');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, v.w, v.h);

    const z = cam.zoom;
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (v.w / 2 - cam.x * z), dpr * (v.h / 2 - cam.y * z));
    ctx.drawImage(ground, MINX, MINY, GW, GH);

    // water glinstert
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.2;
    for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
      if (S.terrain[gy * G + gx] !== 1 || JV.isRoad(gx, gy)) continue;
      const c = center(gx, gy);
      const ph = Math.sin(t * 1.6 + gx * 1.3 + gy * 0.7);
      ctx.beginPath(); ctx.moveTo(c.x - 8 + ph * 3, c.y - 2); ctx.lineTo(c.x + 2 + ph * 3, c.y - 2); ctx.stroke();
    }

    // bouwmodus: raster + plaats-voorbeeld
    if (ui.build) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
      for (let i = 0; i <= G; i++) {
        let a = center(i - 0.5, -0.5), b = center(i - 0.5, G - 0.5);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        a = center(-0.5, i - 0.5); b = center(G - 0.5, i - 0.5);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    if (ui.selected) {
      const o = ui.selected, d = C[o.type];
      const f = footprint(o.gx, o.gy, d.w, d.h, 0);
      poly(ctx, [f.T, f.R, f.B, f.L], 'rgba(246,196,69,0.35)', '#F6C445');
    }
    if (ui.ghost) {
      const gh = ui.ghost, d = C[gh.type];
      const f = footprint(gh.gx, gh.gy, d.w, d.h, 0);
      poly(ctx, [f.T, f.R, f.B, f.L], gh.ok ? 'rgba(93,174,91,0.45)' : 'rgba(226,72,61,0.45)', gh.ok ? '#3E8E48' : '#A8322B');
    }

    // objecten + bewoners in de juiste volgorde
    const lights = [];
    const people = [];
    for (const a of R.agents) {
      if (a.state !== 'walking') continue;
      const p = JV.agentPos(a);
      people.push({ a, p });
    }
    const slots = new Array(order.length + 1).fill(null).map(() => []);
    for (const pp of people) {
      const { x, y } = pp.p;
      let at = 0;
      const c = center(x, y);
      for (let i = 0; i < order.length; i++) {
        const o = order[i], d = C[o.type];
        const f = footprint(o.gx, o.gy, d.w, d.h, 0);
        if (c.x < f.L.x - 10 || c.x > f.R.x + 10 || c.y < f.T.y - 40 || c.y - 40 > f.B.y) continue;
        if (x >= o.gx + d.w - 0.5 || y >= o.gy + d.h - 0.5) at = i + 1;
      }
      slots[at].push(pp);
    }
    const drawPeople = (list) => {
      list.sort((a, b) => (a.p.x + a.p.y) - (b.p.x + b.p.y));
      for (const { a, p } of list) {
        const c = center(p.x, p.y);
        const side = (p.dx - p.dy) < 0;
        const off = a.small ? 4 : -3;
        JV.drawPerson(ctx, c.x + off, c.y + off * 0.5, 0.27, a.m.look, { walk: a.walk, flip: side, bob: Math.abs(Math.sin(a.walk)) * -1.5 });
      }
    };
    drawPeople(slots[0]);
    for (let i = 0; i < order.length; i++) {
      const o = order[i];
      if (ui.moving && ui.moving.id === o.id) { drawPeople(slots[i + 1]); continue; }
      drawObject(ctx, o, t, lights);
      drawPeople(slots[i + 1]);
    }

    if (ui.ghost) {
      ctx.globalAlpha = 0.72;
      drawObject(ctx, { id: 0, type: ui.ghost.type, gx: ui.ghost.gx, gy: ui.ghost.gy, flip: ui.ghost.flip, wall: '#F5EBD3', roof: '#E8708A', pending: 0 }, t, [], true);
      ctx.globalAlpha = 1;
    }

    // nacht
    const dark = JV.darkness();
    if (dark > 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = 'rgba(32,24,84,' + (0.48 * dark) + ')';
      ctx.fillRect(0, 0, v.w, v.h);
      ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (v.w / 2 - cam.x * z), dpr * (v.h / 2 - cam.y * z));
      ctx.globalAlpha = dark;
      for (const q of lights) poly(ctx, q, '#FFD873');
      for (const o of S.objects) {
        if (o.type !== 'lantern') continue;
        const c = center(o.gx, o.gy);
        const g = ctx.createRadialGradient(c.x, c.y - 44, 2, c.x, c.y - 30, 60);
        g.addColorStop(0, 'rgba(255,225,140,0.75)'); g.addColorStop(1, 'rgba(255,225,140,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y - 30, 60, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFF3C4'; ctx.fillRect(c.x - 5, c.y - 49, 10, 9);
      }
      ctx.globalAlpha = 1;
    }

    // tekstballonnen + zwevende teksten
    if (!ui.build) for (const o of order) drawBubbles(ctx, o, t);
    for (let i = JV.floaters.length - 1; i >= 0; i--) {
      const fl = JV.floaters[i];
      fl.t += 1 / 60;
      if (fl.t > 1.6) { JV.floaters.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, 2 - fl.t * 1.2);
      ctx.font = '700 15px Fredoka, Nunito, system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = '#FFFFFF'; ctx.strokeText(fl.text, fl.x, fl.y - fl.t * 30);
      ctx.fillStyle = fl.color || '#4A2E3C'; ctx.fillText(fl.text, fl.x, fl.y - fl.t * 30);
      ctx.globalAlpha = 1;
    }
  };

  JV.floatAt = function (o, text, color) {
    const d = C[o.type];
    const f = footprint(o.gx, o.gy, d.w, d.h, 0);
    JV.floaters.push({ x: (f.L.x + f.R.x) / 2, y: f.T.y - 40, text, color, t: 0 });
  };

  JV.objectScreenTop = function (o) {
    const d = C[o.type];
    const f = footprint(o.gx, o.gy, d.w, d.h, 0);
    return JV.worldToScreen((f.L.x + f.R.x) / 2, f.T.y - 30);
  };

  JV.focusOn = function (gx, gy) { const c = center(gx, gy); JV.cam.x = c.x; JV.cam.y = c.y; };
  JV.clampCam = function () {
    const cam = JV.cam;
    cam.zoom = Math.max(0.45, Math.min(2.4, cam.zoom));
    cam.x = Math.max(-G * TW / 2, Math.min(G * TW / 2, cam.x));
    cam.y = Math.max(0, Math.min(G * TH, cam.y));
  };

  // Voorbeeldplaatje van een huis (voor het kiezen van je huis)
  JV.drawHousePreview = function (canvas, style) {
    const ctx = canvas.getContext('2d');
    const dpr = canvas.width / canvas.clientWidth || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const s = canvas.width / 150;
    ctx.setTransform(s, 0, 0, s, canvas.width / 2, canvas.height * 0.48);
    const f = footprint(0, 0, 2, 2, 0);
    const shift = { x: -(f.T.x + f.B.x) / 2, y: -(f.T.y + f.B.y) / 2 + 22 };
    ctx.translate(shift.x, shift.y);
    poly(ctx, [f.T, f.R, f.B, f.L], '#8BC86B');
    const fi = footprint(0, 0, 2, 2, 0.12);
    drawHouse(ctx, fi, style.wall, style.roof, { flip: false }, [], { heart: true, door: style.roof });
    void dpr;
  };
})(window.JV);
