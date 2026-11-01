// Jaylinn Village – 3D weergave met three.js (lage-poly, gezellige stijl).
// Gebruikt dezelfde spelregels als de 2D-weergave en valt terug op 2D als WebGL niet werkt.
(function (JV) {
  const C = JV.CATALOG, G = JV.GRID, R = JV.R;
  JV.is3d = false;

  const SEASON_LOOK = [
    { g: ['#86C167', '#7FBB60'], leaf: ['#4E9F4A', '#5DAE5B', '#3F8E45', '#6BB85A'], fruit: '#E2483D', sky: '#BFE8F7' },
    { g: ['#80BC57', '#79B64F'], leaf: ['#4A9A3E', '#58A94C', '#3A8838', '#66B44E'], fruit: '#F6C445', sky: '#B5E4F8' },
    { g: ['#C2B05F', '#BAA857'], leaf: ['#E2832F', '#D9602A', '#E8A93A', '#C84A2B'], fruit: '#8A4B2A', sky: '#D9DFE8' },
    { g: ['#E7EFF3', '#DDE8EE'], leaf: ['#DDE8EC', '#CFDDE3', '#E8F0F3', '#C5D6DD'], fruit: '#FFFFFF', sky: '#D6E6F0' },
  ];
  const WORK = {
    super: { wall: '#F4F1E6', a1: '#4DAA57', a2: '#FFFFFF', sign: '#3E8E48', roof: '#C9D7C2', h: 1.5 },
    restaurant: { wall: '#FBE6D4', a1: '#E2483D', a2: '#FFFFFF', sign: '#A8322B', roof: '#E3C7B4', h: 1.5 },
    opvang: { wall: '#FFF3C4', a1: '#9B6FD6', a2: '#F6C445', sign: '#7B4FB8', roof: '#E9DDB0', h: 1.5 },
    bakkerij: { wall: '#FCEBD2', a1: '#E8A040', a2: '#FFFFFF', sign: '#B66A1E', roof: '#E7CFA8', h: 1.15 },
    kapper: { wall: '#F8E0F0', a1: '#E8708A', a2: '#FFFFFF', sign: '#B5476B', roof: '#E9CCE0', h: 1.15 },
    cafe: { wall: '#EFE3D3', a1: '#8B5A3C', a2: '#F1E7D8', sign: '#5E3B28', roof: '#D5C3AE', h: 1.15 },
    dierenopvang: { wall: '#E6F2E0', a1: '#4DAA57', a2: '#F6C445', sign: '#3A7D42', roof: '#C8DEC0', h: 1.4 },
    bloemen: { wall: '#FFF0F5', a1: '#E8708A', a2: '#4DAA57', sign: '#B5476B', roof: '#F0D5DD', h: 1.15 },
    ziekenhuis: { wall: '#F2F6FA', a1: '#3F7FD8', a2: '#FFFFFF', sign: '#2F5FA8', roof: '#D5E0EE', h: 2.6 },
    school: { wall: '#EBB48F', a1: '#F6C445', a2: '#FFFFFF', sign: '#B8402F', roof: '#C97A62', h: 1.8 },
    dierenarts: { wall: '#E3F5F3', a1: '#33B7B0', a2: '#FFFFFF', sign: '#1F8A84', roof: '#C5E3E0', h: 1.4 },
    ijssalon: { wall: '#FFF3F8', a1: '#F28BA8', a2: '#9EE0F0', sign: '#C2527A', roof: '#F5DCE6', h: 1.15 },
    brandweer: { wall: '#F5D5D0', a1: '#E2483D', a2: '#FFFFFF', sign: '#A8322B', roof: '#C45A50', h: 1.8 },
    bus: { wall: '#E8F0F8', a1: '#F6C445', a2: '#3F7FD8', sign: '#2F5FA8', roof: '#C9D6E6', h: 1.35 },
  };

  JV.try3D = function (canvas) {
    if (typeof THREE === 'undefined') return false;
    if (/[#&?]2d\b/.test(location.hash + location.search)) return false;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { return false; }
    if (!renderer || !renderer.getContext()) return false;
    init(renderer, canvas);
    JV.is3d = true;
    return true;
  };

  function init(renderer, canvas) {
    const S0 = () => JV.state();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 220);
    const cam = JV.cam = { x: 14, y: 14, zoom: 1, yaw: Math.PI / 4, yawT: Math.PI / 4, pitch: 0.92 };
    const BASE = 25;
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const tmpV = new THREE.Vector3();

    // ---- licht --------------------------------------------------------------
    const hemi = new THREE.HemisphereLight(0xdff3ff, 0x8a9a6a, 0.6);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffffff, 0.9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 130;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
    sun.target.position.set(G / 2, 0, G / 2);
    scene.add(sun, sun.target);

    // ---- materialen en geometrie --------------------------------------------
    const vcMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const winMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, emissive: new THREE.Color(0xffd873), emissiveIntensity: 0 });
    const matCache = new Map();
    const mat = (color, o) => {
      const k = color + (o ? JSON.stringify(o) : '');
      if (!matCache.has(k)) {
        const opt = Object.assign({ color: new THREE.Color(color) }, o || {});
        matCache.set(k, opt.flatShading ? new THREE.MeshPhongMaterial(Object.assign(opt, { shininess: 0, specular: 0x000000 })) : new THREE.MeshLambertMaterial(opt));
      }
      return matCache.get(k);
    };
    const geoCache = {};
    const geo = (k, f) => geoCache[k] || (geoCache[k] = f());
    const sphereG = () => geo('s', () => new THREE.SphereGeometry(1, 14, 10));
    const boxG = () => geo('b', () => new THREE.BoxGeometry(1, 1, 1));
    const cylG = () => geo('c', () => new THREE.CylinderGeometry(1, 1, 1, 14));
    const coneG = () => geo('k', () => new THREE.ConeGeometry(1, 1, 8));

    function mesh(g, m, x, y, z, sx, sy, sz, shadow) {
      const me = new THREE.Mesh(g, m);
      me.position.set(x, y, z); me.scale.set(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
      me.castShadow = shadow !== false; me.receiveShadow = true;
      return me;
    }
    const sph = (c, x, y, z, r, sy, sz) => mesh(sphereG(), mat(c), x, y, z, r, sy === undefined ? r : sy, sz === undefined ? r : sz);
    const bx = (c, x, y, z, w, h, d, o) => mesh(boxG(), mat(c, o), x, y, z, w, h, d);
    const cyl = (c, x, y, z, rx, h, rz, o) => mesh(cylG(), mat(c, o), x, y, z, rx, h, rz === undefined ? rx : rz);
    const cone = (c, x, y, z, r, h) => mesh(coneG(), mat(c), x, y, z, r, h, r);

    function Builder() {
      const main = { p: [], n: [], c: [] }, win = { p: [], n: [], c: [] };
      const col = new THREE.Color();
      function face(pts, color, hint, tgt) {
        const t = tgt === 'win' ? win : main; col.set(color);
        const a = pts[0], b = pts[1], c = pts[2];
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        if (hint) {
          let cx = 0, cy = 0, cz = 0; for (const p of pts) { cx += p[0]; cy += p[1]; cz += p[2]; }
          cx = cx / pts.length - hint[0]; cy = cy / pts.length - hint[1]; cz = cz / pts.length - hint[2];
          if (nx * cx + ny * cy + nz * cz < 0) { nx = -nx; ny = -ny; nz = -nz; pts = pts.slice().reverse(); }
        }
        for (let i = 1; i < pts.length - 1; i++) for (const v of [pts[0], pts[i], pts[i + 1]]) { t.p.push(v[0], v[1], v[2]); t.n.push(nx, ny, nz); t.c.push(col.r, col.g, col.b); }
      }
      const api = {
        face,
        box(x0, y0, z0, x1, y1, z1, color, top) {
          const h = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
          face([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], top || color, h);
          face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], color, h);
          face([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], color, h);
          face([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], color, h);
          face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], color, h);
        },
        hip(x0, z0, x1, z1, y0, hgt, color, over) {
          x0 -= over; z0 -= over; x1 += over; z1 += over;
          const w = x1 - x0, d = z1 - z0, xc = (x0 + x1) / 2, zc = (z0 + z1) / 2, y = y0 + hgt, hint = [xc, y0 - 0.4, zc];
          const A = [x0, y0, z0], B = [x1, y0, z0], Cc = [x1, y0, z1], D = [x0, y0, z1];
          if (w >= d) {
            const r1 = [x0 + d / 2, y, zc], r2 = [x1 - d / 2, y, zc];
            api.strips([D, Cc, r2, r1], 5, color, JV.shade(color, -16), hint); api.strips([B, A, r1, r2], 5, color, JV.shade(color, -16), hint); face([A, D, r1], color, hint); face([B, Cc, r2], color, hint);
          } else {
            const r1 = [xc, y, z0 + w / 2], r2 = [xc, y, z1 - w / 2];
            api.strips([A, D, r2, r1], 5, color, JV.shade(color, -16), hint); api.strips([Cc, B, r1, r2], 5, color, JV.shade(color, -16), hint); face([A, B, r1], color, hint); face([D, Cc, r2], color, hint);
          }
        },
        // rechthoek op een muur. side: '+x' '-x' '+z' '-z'; t0..t1 langs de muur (0..1)
        panel(side, bb, t0, t1, y0, y1, color, tgt, off) {
          off = off === undefined ? 0.012 : off;
          let pts, hint;
          if (side === '+z' || side === '-z') {
            const z = side === '+z' ? bb.z1 + off : bb.z0 - off, a = bb.x0 + (bb.x1 - bb.x0) * t0, b = bb.x0 + (bb.x1 - bb.x0) * t1;
            pts = [[a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z]]; hint = [(a + b) / 2, (y0 + y1) / 2, z + (side === '+z' ? -1 : 1)];
          } else {
            const x = side === '+x' ? bb.x1 + off : bb.x0 - off, a = bb.z0 + (bb.z1 - bb.z0) * t0, b = bb.z0 + (bb.z1 - bb.z0) * t1;
            pts = [[x, y0, a], [x, y0, b], [x, y1, b], [x, y1, a]]; hint = [x + (side === '+x' ? -1 : 1), (y0 + y1) / 2, (a + b) / 2];
          }
          face(pts, color, hint, tgt);
        },
        lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; },
        // vlak in n strepen (dakpannen); pts = [onderA, onderB, bovenB, bovenA]
        strips(pts, n, c1, c2, hint) {
          for (let i = 0; i < n; i++) {
            const t0 = i / n, t1 = (i + 1) / n;
            face([api.lerp(pts[0], pts[3], t0), api.lerp(pts[1], pts[2], t0), api.lerp(pts[1], pts[2], t1), api.lerp(pts[0], pts[3], t1)], i % 2 ? c2 : c1, hint);
          }
        },
        gable(x0, z0, x1, z1, y0, hgt, color, over, axis, endColor) {
          const sh = JV.shade(color, -16);
          if (axis === 'x') {
            x0 -= over * 0.5; x1 += over * 0.5; z0 -= over; z1 += over;
            const zc = (z0 + z1) / 2, y = y0 + hgt, hint = [(x0 + x1) / 2, y0 - 0.4, zc];
            api.strips([[x0, y0, z1], [x1, y0, z1], [x1, y, zc], [x0, y, zc]], 6, color, sh, hint);
            api.strips([[x1, y0, z0], [x0, y0, z0], [x0, y, zc], [x1, y, zc]], 6, color, sh, hint);
            face([[x0, y0, z0], [x0, y0, z1], [x0, y, zc]], endColor, hint); face([[x1, y0, z0], [x1, y0, z1], [x1, y, zc]], endColor, hint);
          } else {
            x0 -= over; x1 += over; z0 -= over * 0.5; z1 += over * 0.5;
            const xc = (x0 + x1) / 2, y = y0 + hgt, hint = [xc, y0 - 0.4, (z0 + z1) / 2];
            api.strips([[x1, y0, z0], [x1, y0, z1], [xc, y, z1], [xc, y, z0]], 6, color, sh, hint);
            api.strips([[x0, y0, z1], [x0, y0, z0], [xc, y, z0], [xc, y, z1]], 6, color, sh, hint);
            face([[x0, y0, z0], [x1, y0, z0], [xc, y, z0]], endColor, hint); face([[x0, y0, z1], [x1, y0, z1], [xc, y, z1]], endColor, hint);
          }
        },
        faceAt(side, bb, t, d, y) {
          if (side === '+x') return [bb.x1 + d, y, bb.z0 + (bb.z1 - bb.z0) * t];
          if (side === '-x') return [bb.x0 - d, y, bb.z0 + (bb.z1 - bb.z0) * t];
          if (side === '+z') return [bb.x0 + (bb.x1 - bb.x0) * t, y, bb.z1 + d];
          return [bb.x0 + (bb.x1 - bb.x0) * t, y, bb.z0 - d];
        },
        len(side, bb) { return side === '+x' || side === '-x' ? bb.z1 - bb.z0 : bb.x1 - bb.x0; },
        protrude(side, bb, tA, tB, y0, y1, depth, color) {
          const zA = bb.z0 + (bb.z1 - bb.z0) * tA, zB = bb.z0 + (bb.z1 - bb.z0) * tB, xA = bb.x0 + (bb.x1 - bb.x0) * tA, xB = bb.x0 + (bb.x1 - bb.x0) * tB;
          if (side === '+x') api.box(bb.x1, y0, zA, bb.x1 + depth, y1, zB, color);
          else if (side === '-x') api.box(bb.x0 - depth, y0, zA, bb.x0, y1, zB, color);
          else if (side === '+z') api.box(xA, y0, bb.z1, xB, y1, bb.z1 + depth, color);
          else api.box(xA, y0, bb.z0 - depth, xB, y1, bb.z0, color);
        },
        windowRect(side, bb, t0, t1, y0, y1, o) {
          o = o || {};
          const L = api.len(side, bb), fw = 0.035, ft = fw / L, trim = o.frame || '#FFFDF6';
          api.panel(side, bb, t0 - ft, t1 + ft, y0 - fw, y1 + fw, trim, 'main', 0.018);
          api.panel(side, bb, t0, t1, y0, y1, o.glass || '#9FD3EA', 'win', 0.032);
          if (o.mullion !== false) { const tm = (t0 + t1) / 2, ym = (y0 + y1) / 2; api.panel(side, bb, tm - ft * 0.5, tm + ft * 0.5, y0, y1, trim, 'main', 0.04); api.panel(side, bb, t0, t1, ym - fw * 0.5, ym + fw * 0.5, trim, 'main', 0.04); }
          if (o.sill !== false) api.protrude(side, bb, t0 - ft * 1.5, t1 + ft * 1.5, y0 - fw - 0.04, y0 - fw, 0.07, trim);
          if (o.shutter) { const sw = (t1 - t0) * 0.42; api.protrude(side, bb, t0 - ft - sw, t0 - ft, y0 - fw, y1 + fw, 0.03, o.shutter); api.protrude(side, bb, t1 + ft, t1 + ft + sw, y0 - fw, y1 + fw, 0.03, o.shutter); }
        },
        doorAt(side, bb, t0, t1, h, color, o) {
          o = o || {};
          const L = api.len(side, bb), ft = 0.04 / L;
          api.panel(side, bb, t0 - ft, t1 + ft, 0, h + 0.04, o.frame || '#FFFDF6', 'main', 0.02);
          api.panel(side, bb, t0, t1, 0, h, color, 'main', 0.035);
          if (o.glass) api.panel(side, bb, t0 + (t1 - t0) * 0.18, t1 - (t1 - t0) * 0.18, h * 0.4, h * 0.92, '#9FD3EA', 'win', 0.05);
          if (o.double) api.panel(side, bb, (t0 + t1) / 2 - ft * 0.4, (t0 + t1) / 2 + ft * 0.4, 0, h, o.frame || '#FFFDF6', 'main', 0.055);
          else api.protrude(side, bb, t1 - (t1 - t0) * 0.22, t1 - (t1 - t0) * 0.14, h * 0.45, h * 0.52, 0.07, '#E8C25A');
          api.protrude(side, bb, t0 - ft * 2.5, t1 + ft * 2.5, 0, 0.06, 0.2, '#CFC7BA');
          if (o.canopy) api.protrude(side, bb, t0 - ft * 6, t1 + ft * 6, h + 0.08, h + 0.14, 0.34, o.canopy);
        },
        awning(side, bb, y, depth, c1, c2) {
          const L = api.len(side, bb), n = Math.max(6, Math.round(L * 3.5)), inside = api.faceAt(side, bb, 0.5, -1, y - 0.3);
          for (let i = 0; i < n; i++) {
            const t0 = i / n, t1 = (i + 1) / n, c = i % 2 ? c2 : c1, drop = i % 2 ? 0.07 : 0.12;
            face([api.faceAt(side, bb, t0, 0, y), api.faceAt(side, bb, t1, 0, y), api.faceAt(side, bb, t1, depth, y - 0.12), api.faceAt(side, bb, t0, depth, y - 0.12)], c, inside);
            face([api.faceAt(side, bb, t0, depth, y - 0.12), api.faceAt(side, bb, t1, depth, y - 0.12), api.faceAt(side, bb, t1, depth, y - 0.12 - drop), api.faceAt(side, bb, t0, depth, y - 0.12 - drop)], c, api.faceAt(side, bb, 0.5, depth - 1, y - 0.1));
          }
        },
        quoins(bb, H, c) {
          for (const [x, z] of [[bb.x0, bb.z0], [bb.x1, bb.z0], [bb.x0, bb.z1], [bb.x1, bb.z1]]) api.box(x === bb.x0 ? x - 0.02 : x - 0.09, 0, z === bb.z0 ? z - 0.02 : z - 0.09, x === bb.x0 ? x + 0.09 : x + 0.02, H, z === bb.z0 ? z + 0.09 : z + 0.02, c);
        },
        geometry(which) {
          const t = which === 'win' ? win : main;
          if (!t.p.length) return null;
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(t.p, 3));
          g.setAttribute('normal', new THREE.Float32BufferAttribute(t.n, 3));
          g.setAttribute('color', new THREE.Float32BufferAttribute(t.c, 3));
          g.userData.own = true;
          return g;
        },
        group() {
          const grp = new THREE.Group();
          const g1 = api.geometry('main'); if (g1) { const m = new THREE.Mesh(g1, vcMat); m.castShadow = true; m.receiveShadow = true; grp.add(m); }
          const g2 = api.geometry('win'); if (g2) { const m = new THREE.Mesh(g2, winMat); m.receiveShadow = true; grp.add(m); }
          return grp;
        },
      };
      return api;
    }

    // ---- teksten als plaatjes -------------------------------------------------
    const texCache = new Map();
    function labelSprite(text, bg, scale) {
      const key = text + bg;
      let tex = texCache.get(key);
      if (!tex) {
        const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
        const x = cv.getContext('2d');
        x.font = '700 54px Fredoka, Nunito, system-ui, sans-serif';
        const w = Math.min(500, x.measureText(text).width + 56);
        x.fillStyle = 'rgba(40,20,40,0.25)'; x.beginPath(); x.roundRect ? x.roundRect(256 - w / 2 + 3, 19, w, 84, 30) : x.rect(256 - w / 2 + 3, 19, w, 84); x.fill();
        x.fillStyle = bg; x.beginPath(); x.roundRect ? x.roundRect(256 - w / 2, 14, w, 84, 30) : x.rect(256 - w / 2, 14, w, 84); x.fill();
        x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 58);
        tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4; texCache.set(key, tex);
      }
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      sp.scale.set(scale || 2.4, (scale || 2.4) / 4, 1);
      sp.raycast = () => {};
      return sp;
    }
    function emojiSprite(e, size) {
      const key = 'emoji' + e;
      let tex = texCache.get(key);
      if (!tex) {
        const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96;
        const x = cv.getContext('2d'); x.font = '70px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 48, 52);
        tex = new THREE.CanvasTexture(cv); texCache.set(key, tex);
      }
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      sp.scale.set(size, size, 1); sp.raycast = () => {};
      return sp;
    }
    const glowTex = (() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64;
      const x = cv.getContext('2d'); const g = x.createRadialGradient(32, 32, 2, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,235,160,0.95)'); g.addColorStop(1, 'rgba(255,235,160,0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(cv);
    })();
    const dotTex = (() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 32;
      const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.beginPath(); x.arc(16, 16, 14, 0, 7); x.fill(); return new THREE.CanvasTexture(cv);
    })();

    // ---- gebouwen -------------------------------------------------------------
    const hash = (n) => ((n * 2654435761) >>> 0) / 4294967296;
    const season = () => JV.season();
    const look = () => SEASON_LOOK[season()];
    const TRIM = '#FFFDF6';
    const WCFG = {
      super: { fd: 0.55, roof: 'flat' }, bakkerij: { fd: 0.5, roof: 'gable' }, kapper: { fd: 0.4, roof: 'gable' }, cafe: { fd: 0.6, roof: 'flat' },
      dierenopvang: { fd: 0.65, roof: 'gable' }, restaurant: { fd: 0.6, roof: 'flat' }, opvang: { fd: 0.6, roof: 'gable' }, bloemen: { fd: 0.55, roof: 'gable' },
      ziekenhuis: { fd: 0.9, roof: 'flat' }, school: { fd: 0.7, roof: 'flat' }, dierenarts: { fd: 0.5, roof: 'gable' }, ijssalon: { fd: 0.5, roof: 'gable' },
      brandweer: { fd: 0.9, roof: 'flat' }, bus: { fd: 0.9, roof: 'flat' },
    };

    const plinth = (B, bb, wall) => B.box(bb.x0 - 0.03, 0, bb.z0 - 0.03, bb.x1 + 0.03, 0.12, bb.z1 + 0.03, JV.shade(wall, -34));
    const chimney = (B, x, z, H, c) => { B.box(x, H - 0.1, z, x + 0.22, H + 0.52, z + 0.22, c); B.box(x - 0.035, H + 0.52, z - 0.035, x + 0.255, H + 0.6, z + 0.255, '#6B5A52'); };
    function pot(g, x, z, c) { g.add(cyl('#B8685A', x, 0.07, z, 0.07, 0.14), sph(c || look().leaf[1], x, 0.2, z, 0.1)); }
    function table(g, x, z, umb) {
      g.add(cyl('#8A6A4A', x, 0.2, z, 0.02, 0.4), cyl('#F1E7D8', x, 0.4, z, 0.14, 0.03));
      for (const [dx, dz] of [[0.2, 0], [-0.2, 0], [0, 0.2], [0, -0.2]]) g.add(bx('#C9A27A', x + dx, 0.13, z + dz, 0.09, 0.26, 0.09));
      if (umb) { g.add(cyl('#8A6A4A', x, 0.5, z, 0.015, 1.0)); g.add(cone(umb, x, 1.0, z, 0.38, 0.2)); }
    }
    function crate(B, x, z, c) { B.box(x - 0.11, 0, z - 0.11, x + 0.11, 0.14, z + 0.11, c || '#A9764F'); }
    function vehicle(g, color, accent, len) {
      const v = new THREE.Group();
      v.add(bx(color, 0, 0.3, 0, len, 0.34, 0.42), bx(accent, 0, 0.3, 0, len + 0.01, 0.05, 0.43), bx('#9FD3EA', len * 0.3, 0.43, 0, len * 0.28, 0.14, 0.43), bx(color, len * 0.32, 0.38, 0, len * 0.3, 0.3, 0.42));
      for (const sx of [-0.3, 0.3]) for (const sz of [-1, 1]) { const wh = cyl('#2E2E3A', sx * len, 0.12, sz * 0.2, 0.1, 0.07); wh.rotation.x = Math.PI / 2; v.add(wh); }
      return v;
    }

    function buildHouse(o, wall, roof, opts) {
      opts = opts || {};
      const d = C[o.type], w = d.w, dd = d.h, big = o.type === 'house_big' || o.type === 'playerhouse';
      const B = Builder(), g = new THREE.Group(), m = 0.14, H = big ? 1.1 : 0.95, bb = { x0: m, x1: w - m, z0: m, z1: dd - m };
      const door = o.flip ? '+z' : '+x', shutter = JV.shade(roof, -8);
      plinth(B, bb, wall);
      B.box(bb.x0, 0.1, bb.z0, bb.x1, H, bb.z1, wall);
      B.box(bb.x0 - 0.04, H - 0.07, bb.z0 - 0.04, bb.x1 + 0.04, H, bb.z1 + 0.04, TRIM);
      if (big) B.quoins(bb, H, TRIM);
      for (const side of ['+x', '+z', '-x', '-z']) {
        const sh = big ? shutter : null;
        if (side === door) {
          B.windowRect(side, bb, 0.1, 0.3, 0.42, 0.82, { shutter: sh }); B.windowRect(side, bb, 0.7, 0.9, 0.42, 0.82, { shutter: sh });
          B.doorAt(side, bb, 0.42, 0.58, 0.68, opts.door || JV.shade(roof, -22), { canopy: roof });
        } else { B.windowRect(side, bb, 0.14, 0.4, 0.42, 0.82, { shutter: sh }); B.windowRect(side, bb, 0.6, 0.86, 0.42, 0.82, { shutter: sh }); }
      }
      if (big) B.hip(bb.x0, bb.z0, bb.x1, bb.z1, H, 0.85, roof, 0.18);
      else B.gable(bb.x0, bb.z0, bb.x1, bb.z1, H, 0.72, roof, 0.16, door === '+x' ? 'z' : 'x', JV.shade(wall, -8));
      chimney(B, bb.x1 - 0.5, bb.z0 + 0.3, H + 0.2, JV.shade(wall, -34));
      const grp = B.group();
      for (const t of [0.3, 0.7]) { const p = B.faceAt(door, bb, t, 0.22, 0); pot(grp, p[0], p[2], t < 0.5 ? '#F28BA8' : '#F6C445'); }
      const mb = B.faceAt(door, bb, 0.04, 0.1, 0); grp.add(cyl('#6B4B33', mb[0], 0.22, mb[2], 0.02, 0.44), bx('#E2483D', mb[0], 0.47, mb[2], 0.14, 0.1, 0.1));
      grp.userData.h = H + 1.0; return grp;
    }

    function buildApartment(o) {
      const d = C[o.type], B = Builder(), wall = o.wall || '#EFE2D2', accent = o.roof || '#7A5A44', m = 0.12;
      const FL = 0.72, N = 3, H = FL * N + 0.16, bb = { x0: m, x1: d.w - m, z0: m, z1: d.h - m }, door = o.flip ? '+z' : '+x';
      plinth(B, bb, wall);
      B.box(bb.x0, 0.1, bb.z0, bb.x1, H, bb.z1, wall);
      for (let f = 1; f < N; f++) B.box(bb.x0 - 0.03, 0.16 + f * FL - 0.03, bb.z0 - 0.03, bb.x1 + 0.03, 0.16 + f * FL + 0.03, bb.z1 + 0.03, JV.shade(wall, -24));
      B.box(bb.x0 - 0.06, H, bb.z0 - 0.06, bb.x1 + 0.06, H + 0.1, bb.z1 + 0.06, accent);
      B.quoins(bb, H, accent);
      for (const side of ['+x', '+z', '-x', '-z']) for (let f = 0; f < N; f++) {
        const y0 = 0.16 + f * FL + 0.22, y1 = y0 + 0.34;
        if (side === door && f === 0) { B.windowRect(side, bb, 0.1, 0.3, y0, y1); B.windowRect(side, bb, 0.7, 0.9, y0, y1); B.doorAt(side, bb, 0.4, 0.6, 0.62, '#3F5F8A', { glass: true, canopy: accent }); continue; }
        B.windowRect(side, bb, 0.12, 0.38, y0, y1);
        B.windowRect(side, bb, 0.62, 0.88, y0, y1);
        if (f > 0 && (side === '+x' || side === '+z')) { B.protrude(side, bb, 0.56, 0.94, y0 - 0.2, y0 - 0.15, 0.26, '#DCD6CC'); B.protrude(side, bb, 0.56, 0.94, y0 - 0.15, y0 - 0.03, 0.26, accent); }
      }
      B.box(bb.x0 + 0.08, H, bb.z0 + 0.08, bb.x1 - 0.08, H + 0.04, bb.z1 - 0.08, '#8A8498');
      B.box(0.35, H + 0.04, 0.4, 0.75, H + 0.3, 0.7, '#B8B4C4'); B.box(1.0, H + 0.04, 1.1, 1.5, H + 0.26, 1.5, '#A8A4B4');
      const g = B.group();
      g.add(cyl('#9A8A7A', d.w - 0.55, H + 0.4, 0.55, 0.2, 0.55), cone('#7A6A5A', d.w - 0.55, H + 0.78, 0.55, 0.24, 0.22));
      g.userData.h = H + 1.0; return g;
    }

    function buildVilla(o) {
      const d = C[o.type], B = Builder(), wall = o.wall || '#F5EBD3', roof = o.roof || '#E8708A', m = 0.22, H = 1.45, door = o.flip ? '+z' : '+x';
      const bb = { x0: m, x1: d.w - m, z0: m, z1: d.h - m };
      plinth(B, bb, wall);
      B.box(bb.x0, 0.1, bb.z0, bb.x1, H, bb.z1, wall);
      B.box(bb.x0 - 0.03, 0.78, bb.z0 - 0.03, bb.x1 + 0.03, 0.84, bb.z1 + 0.03, TRIM);
      B.box(bb.x0 - 0.05, H - 0.07, bb.z0 - 0.05, bb.x1 + 0.05, H + 0.02, bb.z1 + 0.05, TRIM);
      B.quoins(bb, H, TRIM);
      for (const side of ['+x', '+z', '-x', '-z']) {
        const up = (t0, t1) => B.windowRect(side, bb, t0, t1, 1.0, 1.32, { shutter: JV.shade(roof, -8) });
        if (side === door) {
          B.windowRect(side, bb, 0.08, 0.26, 0.28, 0.66); B.windowRect(side, bb, 0.74, 0.92, 0.28, 0.66);
          B.doorAt(side, bb, 0.43, 0.57, 0.66, JV.shade(roof, -24), { double: true, canopy: roof });
          up(0.1, 0.26); up(0.74, 0.9); B.windowRect(side, bb, 0.4, 0.6, 1.0, 1.32, { shutter: JV.shade(roof, -8) });
          B.protrude(side, bb, 0.34, 0.66, 0.84, 0.9, 0.3, '#DCD6CC');
        } else { B.windowRect(side, bb, 0.1, 0.28, 0.28, 0.66); B.windowRect(side, bb, 0.42, 0.58, 0.28, 0.66); B.windowRect(side, bb, 0.72, 0.9, 0.28, 0.66); up(0.12, 0.3); up(0.7, 0.88); }
      }
      B.gable(bb.x0, bb.z0, bb.x1, bb.z1, H, 0.95, roof, 0.22, door === '+x' ? 'z' : 'x', JV.shade(wall, -8));
      chimney(B, bb.x1 - 0.6, bb.z0 + 0.4, H + 0.35, JV.shade(wall, -34)); chimney(B, bb.x0 + 0.4, bb.z1 - 0.6, H + 0.35, JV.shade(wall, -34));
      const g = B.group();
      const tw = B.faceAt(door === '+x' ? '-x' : '-z', bb, 0.0, 0, 0);
      const tx = door === '+x' ? bb.x0 + 0.1 : bb.x0 + 0.1, tz = bb.z0 + 0.1;
      g.add(cyl(JV.shade(wall, -4), tx, H / 2 + 0.1, tz, 0.4, H + 0.3), cone(roof, tx, H + 0.75, tz, 0.5, 0.9), sph('#E8C25A', tx, H + 1.25, tz, 0.05)); void tw;
      for (const t of [0.4, 0.6]) { const p = B.faceAt(door, bb, t, 0.3, 0); g.add(cyl(TRIM, p[0], 0.45, p[2], 0.05, 0.78)); }
      for (const t of [0.15, 0.85]) { const p = B.faceAt(door, bb, t, 0.28, 0); pot(g, p[0], p[2], t < 0.5 ? '#F28BA8' : '#9B6FD6'); }
      g.userData.h = H + 1.5; return g;
    }

    function signFor(o, y, st) {
      const d = C[o.type], lvl = o.lvl || 1;
      const sp = labelSprite(d.icon + ' ' + d.name + (lvl > 1 ? ' ' + '★'.repeat(lvl - 1) : ''), st.sign, 2.7);
      sp.position.set(d.w / 2, y, d.h / 2);
      return sp;
    }

    function buildWork(o) {
      const d = C[o.type], st = WORK[o.type], cfg = WCFG[o.type], lvl = o.lvl || 1, t = o.type;
      const H = st.h + (lvl - 1) * 0.1, m = 0.06, fd = cfg.fd, door = o.flip ? '+z' : '+x', gable = cfg.roof === 'gable';
      const B = Builder(), g = new THREE.Group();
      const bb = { x0: m, x1: d.w - m, z0: m, z1: d.h - m };
      if (door === '+x') bb.x1 = d.w - m - fd; else bb.z1 = d.h - m - fd;
      const yp = (u, v) => (door === '+x' ? [bb.x1 + v * fd, bb.z0 + u * (bb.z1 - bb.z0)] : [bb.x0 + u * (bb.x1 - bb.x0), bb.z1 + v * fd]);
      // voortuin met plaveisel
      if (door === '+x') B.box(bb.x1, 0, bb.z0, d.w - 0.02, 0.03, bb.z1, '#DDD7CC'); else B.box(bb.x0, 0, bb.z1, bb.x1, 0.03, d.h - 0.02, '#DDD7CC');
      plinth(B, bb, st.wall);
      B.box(bb.x0, 0.1, bb.z0, bb.x1, H, bb.z1, st.wall, st.roof);
      B.box(bb.x0 - 0.06, H - 0.1, bb.z0 - 0.06, bb.x1 + 0.06, H, bb.z1 + 0.06, TRIM);
      if (t === 'school') for (let k = 1; k < 9; k++) for (const side of ['+x', '+z', '-x', '-z']) B.panel(side, bb, 0, 1, k * 0.2 - 0.01, k * 0.2 + 0.01, JV.shade(st.wall, -26), 'main', 0.008);
      const floors = Math.max(1, Math.floor((H - 0.2) / 0.8));
      for (const side of ['+x', '+z', '-x', '-z']) {
        const L = B.len(side, bb), n = Math.max(2, Math.round(L / 0.95)), isDoor = side === door;
        for (let f = 0; f < floors; f++) for (let i = 0; i < n; i++) {
          const t0 = (i + 0.16) / n, t1 = (i + 0.84) / n;
          if (isDoor && f === 0) {
            if (t === 'brandweer') continue;
            if (t === 'bus') continue;
            if (i === Math.floor(n / 2) && n % 2 === 1) continue;
            B.windowRect(side, bb, t0, t1, 0.22, 0.92, { sill: false });
            continue;
          }
          const y0 = f === 0 ? 0.3 : 0.3 + f * 0.8, y1 = y0 + (f === 0 ? 0.5 : 0.42);
          B.windowRect(side, bb, t0, t1, y0, Math.min(y1, H - 0.2), { sill: true });
        }
      }
      // deuren per soort
      const hd = Math.min(0.9, H - 0.5);
      if (t === 'brandweer') { for (const [a, b] of [[0.07, 0.46], [0.54, 0.93]]) { B.panel(door, bb, a - 0.01, b + 0.01, 0, 0.99, TRIM, 'main', 0.02); B.panel(door, bb, a, b, 0, 0.95, '#D9453A', 'main', 0.035); for (let k = 1; k < 6; k++) B.panel(door, bb, a, b, k * 0.15, k * 0.15 + 0.025, '#A8322B', 'main', 0.05); } }
      else if (t === 'bus') { B.panel(door, bb, 0.04, 0.96, 0.1, H - 0.2, '#9FD3EA', 'win', 0.03); for (let k = 0; k <= 4; k++) B.panel(door, bb, k * 0.24 - 0.006, k * 0.24 + 0.006, 0.1, H - 0.2, TRIM, 'main', 0.045); }
      else if (t === 'school' || t === 'ziekenhuis') B.doorAt(door, bb, 0.4, 0.6, hd, st.a1, { double: true, glass: true, canopy: st.sign });
      else B.doorAt(door, bb, 0.43, 0.57, hd, st.a1, { glass: true });
      // luifel + gevelbord
      const aw = Math.min(0.3, fd * 0.55), ay = Math.min(1.0, H - 0.45);
      if (!['brandweer', 'bus', 'school', 'ziekenhuis'].includes(t)) { B.awning(door, bb, ay, aw, st.a1, st.a2); B.protrude(door, bb, 0.08, 0.92, ay + 0.04, ay + 0.3, 0.06, st.sign); }
      if (t === 'school' || t === 'ziekenhuis') { for (const tt of [0.36, 0.64]) { const p = B.faceAt(door, bb, tt, 0.3, 0); g.add(cyl(TRIM, p[0], hd / 2 + 0.05, p[2], 0.045, hd + 0.1)); } }
      // dak
      const top = H;
      if (gable) {
        B.gable(bb.x0, bb.z0, bb.x1, bb.z1, H, 0.72, st.roof, 0.14, door === '+x' ? 'z' : 'x', st.wall);
        if (['bakkerij', 'dierenarts', 'opvang'].includes(t)) chimney(B, bb.x1 - 0.5, bb.z0 + 0.28, H + 0.2, JV.shade(st.wall, -40));
      } else {
        const ring = JV.shade(st.wall, -14);
        B.box(bb.x0 - 0.04, H, bb.z0 - 0.04, bb.x1 + 0.04, H + 0.14, bb.z0 + 0.06, ring); B.box(bb.x0 - 0.04, H, bb.z1 - 0.06, bb.x1 + 0.04, H + 0.14, bb.z1 + 0.04, ring);
        B.box(bb.x0 - 0.04, H, bb.z0 + 0.06, bb.x0 + 0.06, H + 0.14, bb.z1 - 0.06, ring); B.box(bb.x1 - 0.06, H, bb.z0 + 0.06, bb.x1 + 0.04, H + 0.14, bb.z1 - 0.06, ring);
        B.box(bb.x0 + 0.06, H, bb.z0 + 0.06, bb.x1 - 0.06, H + 0.04, bb.z1 - 0.06, JV.shade(st.roof, -22));
      }
      const cx = (bb.x0 + bb.x1) / 2, cz = (bb.z0 + bb.z1) / 2;
      let signY = H + (gable ? 1.45 : 0.95);
      // extra's per gebouw
      switch (t) {
        case 'super': B.box(bb.x0 + 0.3, top + 0.04, bb.z0 + 0.3, bb.x0 + 0.8, top + 0.3, bb.z0 + 0.7, '#B8B4C4'); B.box(bb.x0 + 1.0, top + 0.04, bb.z0 + 0.35, bb.x0 + 1.4, top + 0.26, bb.z0 + 0.7, '#A8A4B4');
          for (const u of [0.2, 0.5, 0.8]) { const p = yp(u, 0.78); crate(B, p[0], p[1]); g.add(sph(['#E2483D', '#F6C445', '#4DAA57'][Math.round(u * 2)], p[0], 0.2, p[1], 0.09)); } break;
        case 'bakkerij': { for (const u of [0.25, 0.75]) { const p = yp(u, 0.8); g.add(cyl('#8A5A3A', p[0], 0.15, p[1], 0.1, 0.3), cyl('#E8B66A', p[0], 0.31, p[1], 0.08, 0.03)); } const bp = yp(0.5, 0.82); B.box(bp[0] - 0.2, 0.18, bp[1] - 0.06, bp[0] + 0.2, 0.24, bp[1] + 0.06, '#B07A4F'); break; }
        case 'kapper': { const p = yp(0.1, 0.72); g.add(cyl('#FFFFFF', p[0], 0.4, p[1], 0.06, 0.8), cyl('#E2483D', p[0], 0.25, p[1], 0.065, 0.12), cyl('#3F7FD8', p[0], 0.5, p[1], 0.065, 0.12), sph('#F6C445', p[0], 0.84, p[1], 0.07)); const q = yp(0.9, 0.72); pot(g, q[0], q[1], '#F28BA8'); break; }
        case 'cafe': for (const u of [0.28, 0.72]) { const p = yp(u, 0.74); table(g, p[0], p[1], st.a1); } break;
        case 'restaurant': for (const u of [0.22, 0.5, 0.78]) { const p = yp(u, 0.74); if (u === 0.5) pot(g, p[0], p[1], '#4DAA57'); else table(g, p[0], p[1], st.a1); } chimney(B, bb.x0 + 0.4, bb.z0 + 0.4, H + 0.04, '#B8685A'); break;
        case 'dierenopvang': for (const u of [0.18, 0.78]) { const p = yp(u, 0.7); B.box(p[0] - 0.17, 0, p[1] - 0.17, p[0] + 0.17, 0.26, p[1] + 0.17, '#C9A27A'); B.gable(p[0] - 0.17, p[1] - 0.17, p[0] + 0.17, p[1] + 0.17, 0.26, 0.2, '#8A5A3A', 0.04, 'x', '#C9A27A'); } break;
        case 'opvang': { const p = yp(0.3, 0.7); B.box(p[0] - 0.22, 0, p[1] - 0.22, p[0] + 0.22, 0.07, p[1] + 0.22, '#E8D3A8'); g.add(sph('#E2483D', p[0], 0.15, p[1], 0.07)); const q = yp(0.78, 0.7); g.add(cyl('#F6C445', q[0], 0.35, q[1], 0.03, 0.7), cyl('#9B6FD6', q[0], 0.7, q[1], 0.16, 0.04)); g.add(bx('#E2483D', cx - 0.4, top + 0.2 + 0.7, cz, 0.3, 0.3, 0.3), bx('#3F7FD8', cx, top + 0.2 + 0.7, cz, 0.3, 0.3, 0.3), bx('#F6C445', cx - 0.2, top + 0.55 + 0.7, cz, 0.3, 0.3, 0.3)); break; }
        case 'bloemen': for (const u of [0.2, 0.5, 0.8]) { const p = yp(u, 0.8); g.add(cyl('#8A6248', p[0], 0.1, p[1], 0.1, 0.2)); for (let k = 0; k < 4; k++) g.add(sph(['#E8708A', '#F6C445', '#FFFFFF', '#9B6FD6'][(k + Math.round(u * 5)) % 4], p[0] + (k % 2 - 0.5) * 0.09, 0.27, p[1] + (Math.floor(k / 2) - 0.5) * 0.09, 0.065)); } break;
        case 'ziekenhuis': {
          const cr = new THREE.Group(); cr.position.set(cx, top + 0.09, cz); cr.add(bx('#E2483D', 0, 0, 0, 0.3, 0.06, 1.1), bx('#E2483D', 0, 0, 0, 1.1, 0.06, 0.3)); cr.rotation.y = Math.PI / 4; g.add(cr);
          B.panel(door, bb, 0.45, 0.55, H - 0.55, H - 0.2, '#E2483D', 'main', 0.045); B.panel(door, bb, 0.38, 0.62, H - 0.43, H - 0.32, '#E2483D', 'main', 0.045);
          const p = yp(0.78, 0.62); const amb = vehicle(g, '#FFFFFF', '#E2483D', 0.9); amb.position.set(p[0], 0, p[1]); amb.rotation.y = door === '+x' ? Math.PI / 2 : 0; g.add(amb); signY = H + 1.0; break; }
        case 'school': { const tx = cx, tz = cz; g.add(bx(st.wall, tx, top + 0.6, tz, 0.6, 1.2, 0.6), bx(TRIM, tx, top + 1.22, tz, 0.7, 0.06, 0.7), cone(st.roof, tx, top + 1.65, tz, 0.5, 0.8)); g.add(bx('#FFFFFF', tx + 0.31, top + 0.9, tz, 0.02, 0.34, 0.34), bx('#2B1B12', tx + 0.325, top + 0.9, tz, 0.01, 0.1, 0.02));
          g.add(cyl('#6B4B33', bb.x0 + 0.3, top + 0.55, bb.z0 + 0.3, 0.025, 1.1), bx('#E2483D', bb.x0 + 0.55, top + 1.0, bb.z0 + 0.3, 0.4, 0.26, 0.03)); signY = H + 2.35; break; }
        case 'dierenarts': { const p = yp(0.2, 0.72); g.add(bx('#C9A27A', p[0], 0.15, p[1], 0.28, 0.3, 0.2)); const q = yp(0.8, 0.7); pot(g, q[0], q[1], '#33B7B0'); break; }
        case 'ijssalon': { for (const u of [0.3, 0.72]) { const p = yp(u, 0.72); table(g, p[0], p[1], st.a1); } g.add(cone('#E8B66A', cx, H + 0.72 + 0.45, cz, 0.26, 0.9), sph('#F28BA8', cx, H + 0.72 + 1.0, cz, 0.32), sph('#9EE0F0', cx, H + 0.72 + 1.3, cz, 0.24), sph('#E2483D', cx, H + 0.72 + 1.52, cz, 0.08)); signY = H + 3.0; break; }
        case 'brandweer': { B.box(bb.x0 + 0.15, top + 0.04, bb.z0 + 0.15, bb.x0 + 0.65, top + 1.2, bb.z0 + 0.65, '#E9C9C2'); B.panel('+x', {x0: bb.x0 + 0.15, x1: bb.x0 + 0.65, z0: bb.z0 + 0.15, z1: bb.z0 + 0.65}, 0.25, 0.75, top + 0.8, top + 1.05, '#9FD3EA', 'win'); B.box(bb.x0 + 0.1, top + 1.2, bb.z0 + 0.1, bb.x0 + 0.7, top + 1.28, bb.z0 + 0.7, '#A8322B'); g.add(cone('#8A2A22', bb.x0 + 0.4, top + 1.6, bb.z0 + 0.4, 0.5, 0.6));
          const p = yp(0.5, 0.64); const tr = vehicle(g, '#D9453A', '#FFFFFF', 1.1); tr.add(bx('#C9C9D4', -0.1, 0.55, 0, 0.8, 0.05, 0.1)); tr.position.set(p[0], 0, p[1]); tr.rotation.y = door === '+x' ? Math.PI / 2 : 0; g.add(tr); signY = H + 1.7; break; }
        case 'bus': { const p = yp(0.5, 0.6); const bus = vehicle(g, '#F6C445', '#3F7FD8', 1.3); bus.position.set(p[0], 0, p[1]); bus.rotation.y = door === '+x' ? Math.PI / 2 : 0; g.add(bus);
          const q = yp(0.08, 0.85); g.add(cyl('#5A6A8A', q[0], 0.45, q[1], 0.025, 0.9), bx('#3F7FD8', q[0], 0.9, q[1], 0.26, 0.26, 0.04)); signY = H + 0.9; break; }
        default: break;
      }
      g.add(B.group());
      const sp = signFor(o, signY, st); g.add(sp);
      g.userData.h = signY + 0.5;
      return g;
    }

    // ---- versiering --------------------------------------------------------------
    const icoG = () => geo('ico', () => new THREE.IcosahedronGeometry(1, 1));
    const blob = (c, x, y, z, r, sy) => mesh(icoG(), mat(c, { flatShading: true }), x, y, z, r, sy === undefined ? r : sy, r);
    function treeGroup(o, cxp, czp) {
      const g = new THREE.Group(); const h = hash(o.id), L = look(), sea = season();
      const x = cxp === undefined ? 0.5 : cxp, z = czp === undefined ? 0.5 : czp;
      g.add(cyl('#8A5A3A', x, 0.32, z, 0.065, 0.64));
      if (h > 0.78) {
        g.add(cone('#3F8E45', x, 0.9, z, 0.44, 0.8), cone('#357D3B', x, 1.28, z, 0.35, 0.7), cone('#2E6E34', x, 1.62, z, 0.24, 0.6));
        if (sea === 3) g.add(cone('#FFFFFF', x, 1.86, z, 0.14, 0.26), cone('#F2F7F9', x, 1.5, z, 0.25, 0.14));
      } else if (h > 0.5) {
        const lc = L.leaf[Math.floor(h * 4) % 4];
        g.add(blob(lc, x, 1.0, z, 0.3, 0.46), blob(JV.shade(lc, 10), x + 0.05, 1.3, z, 0.24, 0.3));
        if (sea === 3) g.add(blob('#FFFFFF', x, 1.5, z, 0.2, 0.08));
      } else {
        const lc = sea === 0 && h < 0.18 ? '#F2B3C6' : L.leaf[Math.floor(h * 8) % 4];
        g.add(blob(lc, x - 0.17, 0.92, z + 0.02, 0.3), blob(JV.shade(lc, -10), x + 0.18, 0.9, z - 0.04, 0.28), blob(JV.shade(lc, 8), x, 1.2, z, 0.34));
        if (h < 0.3 && sea !== 3 && sea !== 0) { g.add(sph(L.fruit, x + 0.22, 1.05, z + 0.2, 0.045), sph(L.fruit, x - 0.2, 1.12, z + 0.22, 0.045), sph(L.fruit, x + 0.05, 1.3, z + 0.3, 0.045)); }
        if (sea === 3) g.add(blob('#FFFFFF', x, 1.5, z, 0.22, 0.08));
      }
      g.userData.h = 1.9; return g;
    }
    function benchGroup(o, x, z, rot) {
      const g = new THREE.Group();
      g.add(bx('#B07A4F', 0, 0.28, 0, 0.7, 0.07, 0.28), bx('#C68D5D', 0, 0.5, -0.12, 0.7, 0.3, 0.05), bx('#6B4B33', -0.28, 0.14, 0, 0.06, 0.28, 0.24), bx('#6B4B33', 0.28, 0.14, 0, 0.06, 0.28, 0.24));
      g.position.set(x === undefined ? 0.5 : x, 0, z === undefined ? 0.5 : z); g.rotation.y = rot === undefined ? 0 : rot; g.userData.h = 0.8; return g;
    }
    function lanternGroup() {
      const g = new THREE.Group();
      g.add(cyl('#4A3F52', 0.5, 0.7, 0.5, 0.04, 1.4), cyl('#4A3F52', 0.5, 0.04, 0.5, 0.12, 0.08), bx('#4A3F52', 0.5, 1.45, 0.5, 0.26, 0.05, 0.26));
      const lamp = bx('#FFE9A8', 0.5, 1.32, 0.5, 0.2, 0.2, 0.2, { emissive: new THREE.Color(0xffe9a8), emissiveIntensity: 0.9 }); lamp.castShadow = false;
      g.add(lamp);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0 })); glow.scale.set(2.6, 2.6, 1); glow.position.set(0.5, 1.3, 0.5); glow.userData.glow = true; glow.raycast = () => {};
      g.add(glow); g.userData.h = 1.6; return g;
    }
    function fountainGroup() {
      const g = new THREE.Group();
      g.add(cyl('#B8B4C4', 1, 0.2, 1, 0.95, 0.4), cyl('#D7D3E0', 1, 0.42, 1, 0.85, 0.08), cyl('#7CC7E8', 1, 0.4, 1, 0.74, 0.07, 0.74, { transparent: true, opacity: 0.92 }));
      g.add(cyl('#D7D3E0', 1, 0.7, 1, 0.1, 0.8), cyl('#C5C1D0', 1, 1.12, 1, 0.34, 0.08), cyl('#C5C1D0', 1, 1.2, 1, 0.1, 0.12));
      const drops = new THREE.Group(); drops.userData.drops = true;
      for (let i = 0; i < 10; i++) { const s = sph('#BFE6F8', 1, 1.3, 1, 0.05); s.castShadow = false; s.userData.i = i; drops.add(s); }
      g.add(drops); g.userData.h = 1.8; return g;
    }
    function speeltuinGroup() {
      const g = new THREE.Group();
      g.add(bx('#E8D3A8', 1, 0.03, 1, 1.9, 0.06, 1.9));
      g.add(bx('#8A6A4A', 0.45, 0.6, 0.5, 0.08, 1.2, 0.08), bx('#8A6A4A', 0.95, 0.6, 0.5, 0.08, 1.2, 0.08), bx('#E8708A', 0.7, 1.2, 0.5, 0.7, 0.1, 0.5));
      const slide = bx('#F6C445', 1.25, 0.6, 0.5, 0.5, 0.06, 0.4); slide.rotation.z = -0.75; g.add(slide);
      g.add(bx('#5A6A8A', 1.2, 0.8, 1.5, 0.07, 1.6, 0.07), bx('#5A6A8A', 1.9, 0.8, 1.5, 0.07, 1.6, 0.07), bx('#5A6A8A', 1.55, 1.58, 1.5, 0.8, 0.07, 0.07));
      const sw = new THREE.Group(); sw.position.set(1.55, 1.55, 1.5); sw.userData.swing = true;
      sw.add(bx('#8A8A9A', -0.12, -0.5, 0, 0.02, 1.0, 0.02), bx('#8A8A9A', 0.12, -0.5, 0, 0.02, 1.0, 0.02), bx('#E2483D', 0, -1.0, 0, 0.34, 0.05, 0.14));
      g.add(sw); g.userData.h = 1.7; return g;
    }
    function parkGroup(o) {
      const g = new THREE.Group();
      g.add(bx(season() === 3 ? '#E2EEF2' : '#7FC264', 1.5, 0.03, 1.5, 2.9, 0.06, 2.9));
      const path = bx('#E8DCC0', 1.5, 0.07, 1.5, 3, 0.04, 0.5); path.rotation.y = 0.5; g.add(path);
      g.add(cyl(season() === 3 ? '#C7E4F0' : '#7CC7E8', 0.9, 0.08, 0.8, 0.55, 0.06, 0.4));
      for (const [x, z, id] of [[0.5, 2.4, 1], [2.5, 0.6, 5], [2.4, 2.4, 8]]) g.add(treeGroup({ id: o.id * 7 + id }, x, z));
      g.add(benchGroup(o, 2.0, 1.6, 0.6)); g.userData.h = 1.8; return g;
    }
    function strandGroup() {
      const g = new THREE.Group();
      g.add(bx('#F3DEAA', 2, 0.03, 2, 3.9, 0.06, 3.9));
      g.add(bx(season() === 3 ? '#C7E4F0' : '#7CC7E8', 2, 0.05, 0.45, 3.9, 0.06, 0.9));
      for (const [x, z, c] of [[0.8, 1.6, '#E8708A'], [2.6, 2.4, '#F6C445'], [1.6, 3.2, '#4F8FD8']]) {
        g.add(cyl('#8A6A4A', x, 0.55, z, 0.03, 1.1), cone(c, x, 1.25, z, 0.65, 0.4));
        g.add(bx('#FFFFFF', x + 0.6, 0.08, z + 0.2, 0.5, 0.04, 0.8), bx(c, x + 0.6, 0.1, z + 0.2, 0.5, 0.02, 0.2));
      }
      g.add(emojiSprite('🐚', 0.4).translateX(3.2).translateY(0.3).translateZ(1.6));
      g.userData.h = 1.6; return g;
    }
    function standbeeldGroup() {
      const g = new THREE.Group();
      g.add(bx('#B8B4C4', 0.5, 0.25, 0.5, 0.5, 0.5, 0.5), bx('#D7D3E0', 0.5, 0.53, 0.5, 0.58, 0.07, 0.58));
      g.add(cyl('#E0B84A', 0.5, 0.95, 0.5, 0.16, 0.7), sph('#E0B84A', 0.5, 1.4, 0.5, 0.17), bx('#F2D470', 0.68, 1.15, 0.5, 0.08, 0.5, 0.08));
      g.userData.h = 1.7; return g;
    }
    function flowersGroup(o) {
      const g = new THREE.Group(); g.add(bx('#8A6248', 0.5, 0.06, 0.5, 0.82, 0.12, 0.82));
      const cols = ['#F28BA8', '#F6C445', '#FFFFFF', '#9B6FD6', '#E2483D'];
      for (let i = 0; i < 9; i++) { const a = hash(o.id * 13 + i), b = hash(o.id * 7 + i * 3); g.add(cyl('#3F8E45', 0.15 + a * 0.7, 0.2, 0.15 + b * 0.7, 0.015, 0.2), sph(cols[(o.id + i) % 5], 0.15 + a * 0.7, 0.32, 0.15 + b * 0.7, 0.07)); }
      g.userData.h = 0.4; return g;
    }
    function bushGroup() {
      const L = look(); const g = new THREE.Group();
      g.add(blob(L.leaf[0], 0.34, 0.2, 0.5, 0.24), blob(L.leaf[2], 0.66, 0.2, 0.52, 0.23), blob(L.leaf[1], 0.5, 0.36, 0.45, 0.25));
      if (season() === 0) g.add(sph('#F2B3C6', 0.4, 0.45, 0.6, 0.04), sph('#FFFFFF', 0.6, 0.4, 0.62, 0.04));
      if (season() === 3) g.add(blob('#FFFFFF', 0.5, 0.58, 0.45, 0.18, 0.06));
      g.userData.h = 0.8; return g;
    }
    function rockGroup() {
      const g = new THREE.Group();
      const r1 = mesh(geo('d', () => new THREE.DodecahedronGeometry(1)), mat('#9A98A6'), 0.45, 0.2, 0.5, 0.3, 0.22, 0.28); r1.rotation.y = 0.6;
      const r2 = mesh(geo('d', () => new THREE.DodecahedronGeometry(1)), mat('#B5B3BF'), 0.66, 0.14, 0.58, 0.18, 0.14, 0.17); g.add(r1, r2);
      g.userData.h = 0.5; return g;
    }

    // eigen modellen: JV.MODELS = { house_small: 'models/house_small.glb' }  (zie models/README.md)
    const modelCache = new Map();
    function instantiateModel(spec, o) {
      const d = C[o.type];
      const src = spec.scene.clone(true);
      const wrap = new THREE.Group(); wrap.add(src);
      if (spec.rotY) src.rotation.y = spec.rotY;
      const box = new THREE.Box3().setFromObject(src), size = box.getSize(new THREE.Vector3());
      const s = (spec.scale || 1) * Math.min((d.w - 0.1) / Math.max(size.x, 0.001), (d.h - 0.1) / Math.max(size.z, 0.001));
      src.scale.setScalar(s);
      const b2 = new THREE.Box3().setFromObject(wrap);
      src.position.set(d.w / 2 - (b2.min.x + b2.max.x) / 2, -b2.min.y, d.h / 2 - (b2.min.z + b2.max.z) / 2);
      const out = new THREE.Group(); out.add(wrap);
      if (o.flip) { wrap.position.set(d.w / 2, 0, d.h / 2); src.position.x -= d.w / 2; src.position.z -= d.h / 2; wrap.rotation.y = -Math.PI / 2; }
      out.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      out.userData.h = size.y * s;
      if (WORK[o.type]) { const sp = signFor(o, size.y * s + 0.5, WORK[o.type]); out.add(sp); out.userData.h += 1.0; }
      return out;
    }
    JV.setModel = function (type, spec) {
      if (typeof spec === 'string') spec = { url: spec };
      if (!THREE.GLTFLoader || !spec || !spec.url) return;
      new THREE.GLTFLoader().load(spec.url, (gltf) => { modelCache.set(type, Object.assign({}, spec, { scene: gltf.scene })); R.dirty = true; }, undefined, (e) => console.warn('Model niet geladen: ' + spec.url, e && e.message));
    };
    JV.clearModel = (type) => { modelCache.delete(type); R.dirty = true; };
    function buildObject(o) {
      const t = o.type, S = S0();
      let g;
      if (modelCache.has(t) && t !== 'road') {
        g = instantiateModel(modelCache.get(t), o);
        g.position.set(o.gx, 0, o.gy); g.userData.objId = o.id;
        g.traverse((c) => { if (c.isMesh) c.userData.objId = o.id; });
        return g;
      }
      switch (t) {
        case 'tree': g = treeGroup(o); break;
        case 'bush': g = bushGroup(); break;
        case 'rock': g = rockGroup(); break;
        case 'flowers': g = flowersGroup(o); break;
        case 'bench': g = benchGroup(o); break;
        case 'lantern': g = lanternGroup(); break;
        case 'fountain': g = fountainGroup(); break;
        case 'speeltuin': g = speeltuinGroup(); break;
        case 'park': g = parkGroup(o); break;
        case 'strand': g = strandGroup(); break;
        case 'standbeeld': g = standbeeldGroup(); break;
        case 'apartment': g = buildApartment(o); break;
        case 'villa': g = buildVilla(o); break;
        case 'playerhouse': {
          const hs = JV.STARTER_HOUSES.find((h) => h.id === S.houseStyle) || JV.STARTER_HOUSES[0];
          const hc = S.houseColors || { wall: hs.wall, roof: hs.roof };
          g = buildHouse(o, hc.wall, hc.roof, { door: '#E8708A' });
          const heart = emojiSprite('💖', 0.7); heart.position.set(1, 2.05, 1); g.add(heart); g.userData.h = 2.2;
          break;
        }
        case 'road': return null;
        default:
          if (WORK[t]) g = buildWork(o);
          else g = buildHouse(o, o.wall || '#F5EBD3', o.roof || '#E8708A');
      }
      if (o.flip && ['bench', 'tree'].includes(t)) g.rotation.y = Math.PI;
      g.position.set(o.gx, 0, o.gy);
      g.userData.objId = o.id;
      g.traverse((c) => { if (c.isMesh) { c.userData.objId = o.id; } });
      return g;
    }

    // ---- scene-onderdelen -----------------------------------------------------
    const objGroup = new THREE.Group(); scene.add(objGroup);
    const objMap = new Map();     // id -> {g, sig}
    let groundMesh = null, waterMesh = null, roadMesh = null, fenceGroup = null, gridLines = null, islandMesh = null;
    const waterTex = (() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d');
      x.fillStyle = '#7CC7E8'; x.fillRect(0, 0, 128, 128); x.strokeStyle = 'rgba(255,255,255,0.45)'; x.lineWidth = 3; x.lineCap = 'round';
      for (let i = 0; i < 6; i++) { const yy = 12 + i * 21, xx = (i * 37) % 80; x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + 26, yy); x.stroke(); x.beginPath(); x.moveTo(xx + 64, yy + 10); x.lineTo(xx + 84, yy + 10); x.stroke(); }
      const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
    })();

    function rebuildGround() {
      const S = S0(); const L = look();
      [groundMesh, waterMesh, islandMesh, fenceGroup, gridLines].forEach((m) => { if (m) { scene.remove(m); m.traverse && m.traverse((c) => { if (c.geometry) c.geometry.dispose(); }); } });
      const B = Builder(); const W = { p: [], n: [], uv: [] };
      const col = new THREE.Color(), dim = new THREE.Color('#3A4860');
      const pos = [], nor = [], colr = [];
      const quad = (pts, c, n) => { for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(pts[i][0], pts[i][1], pts[i][2]); nor.push(n[0], n[1], n[2]); colr.push(c.r, c.g, c.b); } };
      const isW = (x, y) => x >= 0 && y >= 0 && x < G && y < G && S.terrain[y * G + x] === 1;
      for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
        const water = S.terrain[gy * G + gx] === 1;
        if (water) {
          const y = -0.14;
          for (const i of [0, 1, 2, 0, 2, 3]) { const p = [[gx, y, gy], [gx + 1, y, gy], [gx + 1, y, gy + 1], [gx, y, gy + 1]][i]; W.p.push(p[0], p[1], p[2]); W.n.push(0, 1, 0); W.uv.push(p[0] * 0.3, p[2] * 0.3); }
          continue;
        }
        col.set(L.g[(gx + gy) % 2]); col.offsetHSL(0, 0, (hash(gx * 31 + gy * 57) - 0.5) * 0.035);
        if (!JV.inLand(gx, gy)) col.lerp(dim, 0.34);
        quad([[gx, 0, gy + 1], [gx + 1, 0, gy + 1], [gx + 1, 0, gy], [gx, 0, gy]], col, [0, 1, 0]);
        const bank = new THREE.Color('#9C7A55');
        if (isW(gx + 1, gy)) quad([[gx + 1, 0, gy], [gx + 1, 0, gy + 1], [gx + 1, -0.14, gy + 1], [gx + 1, -0.14, gy]], bank, [1, 0, 0]);
        if (isW(gx - 1, gy)) quad([[gx, 0, gy + 1], [gx, 0, gy], [gx, -0.14, gy], [gx, -0.14, gy + 1]], bank, [-1, 0, 0]);
        if (isW(gx, gy + 1)) quad([[gx + 1, 0, gy + 1], [gx, 0, gy + 1], [gx, -0.14, gy + 1], [gx + 1, -0.14, gy + 1]], bank, [0, 0, 1]);
        if (isW(gx, gy - 1)) quad([[gx, 0, gy], [gx + 1, 0, gy], [gx + 1, -0.14, gy], [gx, -0.14, gy]], bank, [0, 0, -1]);
      }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); gg.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
      groundMesh = new THREE.Mesh(gg, vcMat); groundMesh.receiveShadow = true; scene.add(groundMesh);
      const wg = new THREE.BufferGeometry();
      wg.setAttribute('position', new THREE.Float32BufferAttribute(W.p, 3)); wg.setAttribute('normal', new THREE.Float32BufferAttribute(W.n, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(W.uv, 2));
      waterMesh = new THREE.Mesh(wg, new THREE.MeshLambertMaterial({ map: waterTex, color: season() === 3 ? 0xcfe9f5 : 0xffffff })); waterMesh.receiveShadow = true; scene.add(waterMesh);
      // eilandrand
      const IB = Builder(); const k = '#B9845A', k2 = '#9C6B47', dp = 0.7;
      IB.face([[0, 0, G], [G, 0, G], [G, -dp, G], [0, -dp, G]], k, [G / 2, 0, G / 2]); IB.face([[G, 0, 0], [G, 0, G], [G, -dp, G], [G, -dp, 0]], k2, [G / 2, 0, G / 2]);
      IB.face([[0, 0, 0], [G, 0, 0], [G, -dp, 0], [0, -dp, 0]], k, [G / 2, 0, G / 2]); IB.face([[0, 0, 0], [0, 0, G], [0, -dp, G], [0, -dp, 0]], k2, [G / 2, 0, G / 2]);
      islandMesh = IB.group(); scene.add(islandMesh);
      // hek om je grond
      const Lr = JV.land(); fenceGroup = new THREE.Group();
      const FB = Builder();
      const rail = (x0, z0, x1, z1) => { FB.box(Math.min(x0, x1) - 0.04, 0.22, Math.min(z0, z1) - 0.04, Math.max(x0, x1) + 0.04, 0.3, Math.max(z0, z1) + 0.04, '#FFFFFF'); };
      rail(Lr.x0, Lr.y0, Lr.x1, Lr.y0); rail(Lr.x0, Lr.y1, Lr.x1, Lr.y1); rail(Lr.x0, Lr.y0, Lr.x0, Lr.y1); rail(Lr.x1, Lr.y0, Lr.x1, Lr.y1);
      for (let x = Lr.x0; x <= Lr.x1; x += 2) { FB.box(x - 0.05, 0, Lr.y0 - 0.05, x + 0.05, 0.4, Lr.y0 + 0.05, '#B58B5E'); FB.box(x - 0.05, 0, Lr.y1 - 0.05, x + 0.05, 0.4, Lr.y1 + 0.05, '#B58B5E'); }
      for (let z = Lr.y0; z <= Lr.y1; z += 2) { FB.box(Lr.x0 - 0.05, 0, z - 0.05, Lr.x0 + 0.05, 0.4, z + 0.05, '#B58B5E'); FB.box(Lr.x1 - 0.05, 0, z - 0.05, Lr.x1 + 0.05, 0.4, z + 0.05, '#B58B5E'); }
      fenceGroup = FB.group(); scene.add(fenceGroup);
      // bouwraster
      const lp = [];
      for (let x = Lr.x0; x <= Lr.x1; x++) lp.push(x, 0.05, Lr.y0, x, 0.05, Lr.y1);
      for (let z = Lr.y0; z <= Lr.y1; z++) lp.push(Lr.x0, 0.05, z, Lr.x1, 0.05, z);
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
      gridLines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 })); gridLines.visible = false; scene.add(gridLines);
      groundSig = season() + '|' + (S.landStep || 0);
    }

    let tufts = null, bloom = null;
    function rebuildTufts() {
      [tufts, bloom].forEach((m) => { if (m) { scene.remove(m); m.dispose(); } });
      const S = S0(), L = look(), sea = season(), spots = [], fl = [];
      for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
        if (S.terrain[gy * G + gx] === 1 || R.occ[gy * G + gx] !== -1) continue;
        for (let k = 0; k < 2; k++) {
          const a = hash(gx * 131 + gy * 17 + k * 7 + 1), b = hash(gx * 29 + gy * 211 + k * 13 + 5), c = hash(gx * 53 + gy * 97 + k * 31 + 9);
          if (c > 0.3) spots.push([gx + 0.08 + a * 0.84, gy + 0.08 + b * 0.84, c]);
          if (c > 0.9 && sea < 2) fl.push([gx + 0.1 + b * 0.8, gy + 0.1 + a * 0.8, c]);
        }
      }
      const tg = geo('tuft', () => new THREE.ConeGeometry(0.04, 0.15, 4));
      tufts = new THREE.InstancedMesh(tg, new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, spots.length));
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
      spots.forEach((p, i) => { e.set((p[2] - 0.5) * 0.4, p[2] * 6.28, 0); q.setFromEuler(e); const sc = 0.7 + p[2] * 0.9; m4.compose(new THREE.Vector3(p[0], 0.08 * sc, p[1]), q, new THREE.Vector3(sc, sc, sc)); tufts.setMatrixAt(i, m4); c.set(L.g[i % 2]).offsetHSL(0, 0.04, -0.06 + (p[2] - 0.5) * 0.05); tufts.setColorAt(i, c); });
      tufts.count = spots.length; tufts.receiveShadow = true; scene.add(tufts);
      const fg = geo('fl', () => new THREE.SphereGeometry(0.045, 6, 5));
      bloom = new THREE.InstancedMesh(fg, new THREE.MeshLambertMaterial({ color: 0xffffff }), Math.max(1, fl.length));
      const cols = sea === 0 ? ['#FFFFFF', '#F6C445', '#F28BA8', '#C9A3E8'] : ['#FFFFFF', '#F6C445', '#FF9E6B', '#9EC3FF'];
      fl.forEach((p, i) => { m4.compose(new THREE.Vector3(p[0], 0.16, p[1]), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)); bloom.setMatrixAt(i, m4); bloom.setColorAt(i, c.set(cols[i % 4])); });
      bloom.count = fl.length; bloom.visible = fl.length > 0; scene.add(bloom);
    }

    function rebuildRoads() {
      if (roadMesh) { scene.remove(roadMesh); roadMesh.traverse((c) => { if (c.geometry) c.geometry.dispose(); }); }
      const S = S0(); const B = Builder();
      const road = (x, y) => JV.isRoad(x, y);
      for (const o of S.objects) {
        if (o.type !== 'road') continue;
        const x = o.gx, z = o.gy, water = JV.isWater(x, z);
        if (water) {
          B.box(x, 0.0, z, x + 1, 0.06, z + 1, '#C79A68', '#C79A68');
          for (let i = 1; i < 5; i++) B.box(x + 0.02, 0.065, z + i / 5 - 0.01, x + 0.98, 0.075, z + i / 5 + 0.01, '#9C6E45');
          B.box(x - 0.01, 0.06, z, x + 0.03, 0.3, z + 1, '#8A5A3A'); B.box(x + 0.97, 0.06, z, x + 1.01, 0.3, z + 1, '#8A5A3A');
          continue;
        }
        B.box(x, 0, z, x + 1, 0.025, z + 1, '#D9D2C7', '#D9D2C7');
        const e = 0.1, y1 = 0.032;
        B.face([[x + e, y1, z + 1 - e], [x + 1 - e, y1, z + 1 - e], [x + 1 - e, y1, z + e], [x + e, y1, z + e]], '#8D8794', [x + .5, 0, z + .5]);
        const arm = (dx, dz) => {
          if (!road(x + dx, z + dz)) return;
          if (dx) { const xa = dx > 0 ? x + 1 - e : x, xb = dx > 0 ? x + 1 : x + e; B.face([[xa, y1, z + 1 - e], [xb, y1, z + 1 - e], [xb, y1, z + e], [xa, y1, z + e]], '#8D8794', [x + .5, 0, z + .5]); }
          else { const za = dz > 0 ? z + 1 - e : z, zb = dz > 0 ? z + 1 : z + e; B.face([[x + e, y1, za], [x + 1 - e, y1, za], [x + 1 - e, y1, zb], [x + e, y1, zb]], '#8D8794', [x + .5, 0, z + .5]); }
          const dash = (a0, a1, fixed, horiz) => { if (horiz) B.face([[a0, y1 + 0.003, fixed - 0.025], [a1, y1 + 0.003, fixed - 0.025], [a1, y1 + 0.003, fixed + 0.025], [a0, y1 + 0.003, fixed + 0.025]], '#FFFFFF', [0, -1, 0]); else B.face([[fixed - 0.025, y1 + 0.003, a0], [fixed + 0.025, y1 + 0.003, a0], [fixed + 0.025, y1 + 0.003, a1], [fixed - 0.025, y1 + 0.003, a1]], '#FFFFFF', [0, -1, 0]); };
          if (dx) dash(dx > 0 ? x + 0.5 : x, dx > 0 ? x + 1 : x + 0.5, z + 0.5, true);
          else dash(dz > 0 ? z + 0.5 : z, dz > 0 ? z + 1 : z + 0.5, x + 0.5, false);
        };
        arm(1, 0); arm(-1, 0); arm(0, 1); arm(0, -1);
      }
      roadMesh = B.group(); roadMesh.traverse((c) => { if (c.isMesh) { c.castShadow = false; } }); scene.add(roadMesh);
      rebuildTufts();
    }

    function disposeGroup(g) { g.traverse((c) => { if (c.geometry && c.geometry.userData && c.geometry.userData.own) c.geometry.dispose(); }); }
    let groundSig = '';
    function sigOf(o) {
      const S = S0();
      return [o.type, o.gx, o.gy, o.flip ? 1 : 0, o.lvl || 1, o.wall || '', o.roof || '', season(), modelCache.has(o.type) ? 'm' : '', o.type === 'playerhouse' ? JSON.stringify(S.houseColors || '') + S.houseStyle : ''].join('|');
    }
    function syncObjects() {
      const S = S0();
      const seen = new Set();
      for (const o of S.objects) {
        if (o.type === 'road') continue;
        seen.add(o.id);
        const sig = sigOf(o); const cur = objMap.get(o.id);
        if (cur && cur.sig === sig) continue;
        if (cur) { objGroup.remove(cur.g); disposeGroup(cur.g); }
        const g = buildObject(o);
        if (!g) continue;
        objGroup.add(g); objMap.set(o.id, { g, sig, o });
      }
      for (const [id, v] of objMap) if (!seen.has(id)) { objGroup.remove(v.g); disposeGroup(v.g); objMap.delete(id); }
      rebuildRoads();
    }

    // ---- poppetjes -------------------------------------------------------------
    // Alle vaste onderdelen van een lichaamsdeel worden tot één mesh samengevoegd (weinig draw calls).
    const smoothG = {
      sph: () => geo('p-sph', () => new THREE.SphereGeometry(1, 18, 14).toNonIndexed()),
      cyl: () => geo('p-cyl', () => new THREE.CylinderGeometry(1, 1, 1, 14).toNonIndexed()),
      tap: () => geo('p-tap', () => new THREE.CylinderGeometry(0.82, 1, 1, 14).toNonIndexed()),
      box: () => geo('p-box', () => new THREE.BoxGeometry(1, 1, 1).toNonIndexed()),
      cone: () => geo('p-cone', () => new THREE.ConeGeometry(1, 1, 14).toNonIndexed()),
      cap: () => geo('p-cap', () => new THREE.SphereGeometry(1, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58).toNonIndexed()),
      arc: () => geo('p-arc', () => new THREE.TorusGeometry(1, 0.14, 6, 14, Math.PI).toNonIndexed()),
      ring: () => geo('p-ring', () => new THREE.TorusGeometry(1, 0.12, 6, 16).toNonIndexed()),
      scarf: () => geo('p-scarf', () => new THREE.SphereGeometry(1, 18, 12, 2.32, 4.78, 0, Math.PI * 0.8).toNonIndexed()),
    };
    function bake(parts) {
      const pos = [], nor = [], col = [], m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), nm = new THREE.Matrix3(), c = new THREE.Color(), v = new THREE.Vector3(), one = new THREE.Vector3();
      for (const p of parts) {
        e.set(p.rot ? p.rot[0] : 0, p.rot ? p.rot[1] : 0, p.rot ? p.rot[2] : 0); q.setFromEuler(e);
        const s = p.s; one.set(s[0], s[1] === undefined ? s[0] : s[1], s[2] === undefined ? s[0] : s[2]);
        m.compose(v.set(p.p[0], p.p[1], p.p[2]), q, one); nm.getNormalMatrix(m);
        const g = smoothG[p.k](), P = g.attributes.position, N = g.attributes.normal; c.set(p.c);
        for (let i = 0; i < P.count; i++) {
          v.fromBufferAttribute(P, i).applyMatrix4(m); pos.push(v.x, v.y, v.z);
          v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize(); nor.push(v.x, v.y, v.z); col.push(c.r, c.g, c.b);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.userData.own = true;
      const me = new THREE.Mesh(g, vcMat); me.castShadow = true; me.receiveShadow = true;
      return me;
    }
    const part = (k, c, p, s, rot) => ({ k, c, p, s, rot });

    // kleding en hoofddeksels per beroep
    const UNIF = {
      Kassamedewerker: { shirt: '#4DAA57', apron: '#FFFFFF' }, Vakkenvuller: { shirt: '#3E8E48' }, Bakker: { shirt: '#FFFFFF', hat: 'bakker', apron: '#E8D7B5' }, Verkoper: { shirt: '#E8A040', apron: '#FFFFFF' },
      Kapper: { shirt: '#2F2F3A', apron: '#E8708A' }, Kapster: { shirt: '#2F2F3A', apron: '#E8708A' }, Barista: { shirt: '#F1E7D8', apron: '#5E3B28' }, Bediening: { shirt: '#FFFFFF', vest: '#2F2F3A' },
      Dierenverzorger: { shirt: '#4DAA57' }, Kok: { shirt: '#FFFFFF', hat: 'kok' }, Ober: { shirt: '#FFFFFF', vest: '#2F2F3A' }, 'Pedagogisch medewerker': { shirt: '#9B6FD6', apron: '#F6C445' },
      Leidster: { shirt: '#F6C445', apron: '#9B6FD6' }, Bloemist: { shirt: '#F8E0F0', apron: '#4DAA57' }, Arts: { shirt: '#FFFFFF', coat: '#FFFFFF' }, Verpleegkundige: { shirt: '#7FC8E8', hat: 'zuster' },
      Juf: { shirt: '#E8708A' }, Meester: { shirt: '#3F7FD8', glasses: true }, Dierenarts: { shirt: '#33B7B0', coat: '#FFFFFF' }, Assistent: { shirt: '#7FC8E8' },
      IJsverkoper: { shirt: '#F28BA8', hat: 'papier', apron: '#FFFFFF' }, Brandweerman: { shirt: '#D9453A', hat: 'helm' }, Brandweervrouw: { shirt: '#D9453A', hat: 'helm' },
      Buschauffeur: { shirt: '#3F7FD8', hat: 'pet' }, Buschauffeuse: { shirt: '#3F7FD8', hat: 'pet' },
    };

    function makePerson(look0, opts) {
      opts = opts || {};
      const lk = look0, u = opts.job ? UNIF[opts.job] || {} : {};
      const skin = lk.skin, skinD = JV.shade(skin, -22), hairC = lk.hairColor;
      const shirt = u.shirt || lk.shirt, pants = u.coat ? '#3A3F58' : lk.pants, shoe = lk.age === 'baby' ? skin : '#F4F1EA';
      const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);

      // benen
      const legs = [];
      for (const sx of [-1, 1]) {
        const piv = new THREE.Group(); piv.position.set(sx * 0.095, 0.3, 0);
        piv.add(bake([part('cyl', pants, [0, -0.14, 0], [0.078, 0.28, 0.078]), part('sph', shoe, [0, -0.285, 0.035], [0.09, 0.055, 0.135]), part('sph', JV.shade(shoe, -30), [0, -0.3, 0.035], [0.092, 0.03, 0.137])]));
        inner.add(piv); legs.push(piv);
      }
      // romp
      const tp = [part('tap', shirt, [0, 0.46, 0], [0.19, 0.34, 0.15]), part('sph', shirt, [0, 0.62, 0], [0.2, 0.08, 0.15]), part('cyl', skinD, [0, 0.68, 0], [0.045, 0.06, 0.045]),
        part('cyl', '#FFFDF6', [0, 0.645, 0], [0.085, 0.03, 0.07])];
      if (lk.gender === 'v' && lk.dress && lk.age === 'volw') tp.push(part('tap', JV.shade(shirt, -6), [0, 0.27, 0], [0.34, 0.2, 0.28]));
      else tp.push(part('box', JV.shade(pants, -20), [0, 0.3, 0], [0.4, 0.035, 0.3]));
      if (u.apron) tp.push(part('box', u.apron, [0, 0.42, 0.135], [0.25, 0.3, 0.03]));
      if (u.vest) tp.push(part('box', u.vest, [0, 0.46, 0.14], [0.3, 0.3, 0.03]));
      if (u.coat) tp.push(part('tap', u.coat, [0, 0.38, 0], [0.215, 0.5, 0.17]), part('box', '#E2483D', [0.09, 0.5, 0.17], [0.07, 0.02, 0.02]));
      if (opts.sash) tp.push(part('box', '#F6C445', [0, 0.46, 0.15], [0.46, 0.06, 0.03], [0, 0, 0.75]), part('sph', '#E8708A', [-0.1, 0.38, 0.17], [0.045, 0.045, 0.02]));
      const torso = bake(tp); inner.add(torso);
      // armen
      const arms = [];
      for (const sx of [-1, 1]) {
        const piv = new THREE.Group(); piv.position.set(sx * 0.235, 0.6, 0);
        piv.add(bake([part('sph', shirt, [0, 0, 0], [0.075, 0.075, 0.075]), part('cyl', u.coat || shirt, [0, -0.13, 0], [0.06, 0.26, 0.06]), part('sph', skin, [0, -0.28, 0], [0.058, 0.058, 0.058])]));
        inner.add(piv); arms.push(piv);
      }
      // hoofd
      const head = new THREE.Group(); head.position.set(0, 0.83, 0); inner.add(head);
      const hp = [part('sph', skin, [0, 0, 0], [0.275, 0.26, 0.26]),
        part('sph', skin, [-0.27, -0.02, 0], [0.045, 0.06, 0.04]), part('sph', skin, [0.27, -0.02, 0], [0.045, 0.06, 0.04]),
        part('sph', skinD, [0, -0.045, 0.265], [0.04, 0.032, 0.035]),
        part('sph', '#F59AA4', [-0.165, -0.065, 0.19], [0.05, 0.03, 0.02]), part('sph', '#F59AA4', [0.165, -0.065, 0.19], [0.05, 0.03, 0.02]),
        part('arc', '#9A4A44', [0, -0.085, 0.25], [0.07, 0.07, 0.05], [-0.25, 0, Math.PI])];
      const brow = (sx) => part('box', hairC === '#ECA2C4' ? '#7A4A5A' : JV.shade(hairC, -10), [sx * 0.095, 0.115, 0.245], [0.075, 0.016, 0.02], [0, 0, sx * -0.12]);
      if (lk.gender === 'v') hp.push(part('box', '#2B1B12', [-0.14, 0.04, 0.235], [0.03, 0.01, 0.02], [0, 0, 0.5]), part('box', '#2B1B12', [0.14, 0.04, 0.235], [0.03, 0.01, 0.02], [0, 0, -0.5]));
      hp.push(brow(-1), brow(1));
      const cap = (r) => part('cap', hairC, [0, 0.03, -0.015], [r, r * 0.97, r * 1.02], [-0.32, 0, 0]);
      const fringe = () => [part('sph', hairC, [0, 0.15, 0.195], [0.13, 0.07, 0.07]), part('sph', hairC, [-0.14, 0.11, 0.18], [0.09, 0.07, 0.07]), part('sph', hairC, [0.14, 0.11, 0.18], [0.09, 0.07, 0.07])];
      const hairStyle = ['helm', 'pet', 'kok'].includes(u.hat) && lk.hair !== 'hoofddoek' ? 'kort' : lk.hair;
      switch (hairStyle) {
        case 'afro': hp.push(part('sph', hairC, [0, 0.09, -0.04], [0.4, 0.37, 0.37]), part('sph', hairC, [0, 0.19, 0.17], [0.2, 0.09, 0.1]), part('sph', hairC, [-0.2, 0.15, 0.16], [0.11, 0.1, 0.09]), part('sph', hairC, [0.2, 0.15, 0.16], [0.11, 0.1, 0.09])); break;
        case 'krul': hp.push(cap(0.3)); for (let i = 0; i < 11; i++) { const a = i / 11 * Math.PI * 2; hp.push(part('sph', hairC, [Math.cos(a) * 0.27, 0.12 + Math.sin(a * 2) * 0.05, Math.sin(a) * 0.22 - 0.03], [0.095, 0.095, 0.095])); } hp.push(part('sph', hairC, [0, 0.27, 0], [0.11, 0.1, 0.11]), ...fringe()); break;
        case 'lang': hp.push(cap(0.3), part('sph', hairC, [0, -0.17, -0.16], [0.3, 0.44, 0.15]), part('sph', hairC, [-0.255, -0.1, 0.0], [0.075, 0.27, 0.13]), part('sph', hairC, [0.255, -0.1, 0.0], [0.075, 0.27, 0.13]), ...fringe()); break;
        case 'staart': hp.push(cap(0.3), part('sph', hairC, [0.0, 0.1, -0.29], [0.1, 0.1, 0.1]), part('cone', hairC, [0, -0.1, -0.32], [0.1, 0.46, 0.1], [Math.PI + 0.12, 0, 0]), part('ring', '#F06A96', [0, 0.08, -0.27], [0.08, 0.08, 0.08], [0.3, 0, 0]), ...fringe()); break;
        case 'vlechtjes': hp.push(cap(0.3), ...fringe()); for (const sx of [-1, 1]) { hp.push(part('sph', hairC, [sx * 0.29, -0.02, 0.0], [0.08, 0.08, 0.08]), part('sph', hairC, [sx * 0.3, -0.13, 0.0], [0.075, 0.075, 0.075]), part('sph', hairC, [sx * 0.3, -0.23, 0.0], [0.07, 0.07, 0.07]), part('sph', hairC, [sx * 0.3, -0.31, 0.0], [0.06, 0.06, 0.06]), part('sph', '#F06A96', [sx * 0.29, 0.07, 0.04], [0.055, 0.04, 0.04])); } break;
        case 'knot': hp.push(cap(0.3), part('sph', hairC, [0, 0.31, -0.06], [0.125, 0.115, 0.125]), part('ring', '#F06A96', [0, 0.25, -0.05], [0.11, 0.11, 0.11], [Math.PI / 2, 0, 0]), ...fringe()); break;
        case 'hoofddoek': hp.push(part('scarf', hairC, [0, 0.02, -0.01], [0.325, 0.3, 0.32], [-0.1, 0, 0]), part('sph', hairC, [0, 0.2, 0.17], [0.2, 0.07, 0.1]), part('sph', JV.shade(hairC, -12), [0, -0.2, -0.04], [0.3, 0.17, 0.26])); break;
        default: hp.push(cap(0.3), ...fringe(), part('sph', hairC, [-0.26, 0.0, 0.0], [0.05, 0.1, 0.1]), part('sph', hairC, [0.26, 0.0, 0.0], [0.05, 0.1, 0.1]));
      }
      if (lk.beard) hp.push(part('sph', hairC, [0, -0.15, 0.15], [0.17, 0.11, 0.1]), part('sph', hairC, [0, -0.07, 0.235], [0.09, 0.025, 0.03]));
      if (lk.glasses || u.glasses) { for (const sx of [-1, 1]) hp.push(part('ring', '#3A2A2A', [sx * 0.095, 0.03, 0.262], [0.075, 0.075, 0.03])); hp.push(part('box', '#3A2A2A', [0, 0.04, 0.265], [0.04, 0.012, 0.012])); }
      switch (u.hat) {
        case 'kok': hp.push(part('cyl', '#FFFFFF', [0, 0.3, -0.02], [0.17, 0.16, 0.17]), part('sph', '#FFFFFF', [0, 0.42, -0.02], [0.21, 0.13, 0.21]), part('sph', '#FFFFFF', [-0.12, 0.38, -0.02], [0.1, 0.09, 0.1])); break;
        case 'bakker': hp.push(part('sph', '#FFFFFF', [0, 0.25, -0.03], [0.24, 0.12, 0.24])); break;
        case 'zuster': hp.push(part('box', '#FFFFFF', [0, 0.27, 0.02], [0.26, 0.09, 0.14]), part('box', '#E2483D', [0, 0.275, 0.095], [0.05, 0.05, 0.01])); break;
        case 'papier': hp.push(part('cone', '#FFFFFF', [0, 0.32, -0.02], [0.15, 0.2, 0.15]), part('box', '#F28BA8', [0, 0.23, 0.0], [0.28, 0.035, 0.2])); break;
        case 'helm': hp.push(part('cap', '#F6C445', [0, 0.06, -0.015], [0.32, 0.3, 0.33], [-0.1, 0, 0]), part('box', '#F6C445', [0, 0.1, 0.27], [0.34, 0.03, 0.12]), part('box', '#D9453A', [0, 0.28, -0.02], [0.05, 0.04, 0.3])); break;
        case 'pet': hp.push(part('cap', '#2F4F8A', [0, 0.07, -0.01], [0.31, 0.27, 0.31], [-0.1, 0, 0]), part('box', '#1F2F5A', [0, 0.11, 0.28], [0.26, 0.025, 0.12], [0.2, 0, 0]), part('box', '#F6C445', [0, 0.17, 0.22], [0.07, 0.04, 0.01])); break;
        default: break;
      }
      head.add(bake(hp));
      // ogen apart, zodat ze kunnen knipperen
      const eyes = bake([part('sph', '#2B1B12', [-0.095, 0.02, 0.232], [0.05, 0.066, 0.034]), part('sph', '#2B1B12', [0.095, 0.02, 0.232], [0.05, 0.066, 0.034]),
        part('sph', '#FFFFFF', [-0.082, 0.042, 0.262], [0.016, 0.016, 0.01]), part('sph', '#FFFFFF', [0.108, 0.042, 0.262], [0.016, 0.016, 0.01]),
        part('sph', '#5A3A26', [-0.095, 0.005, 0.255], [0.03, 0.04, 0.01]), part('sph', '#5A3A26', [0.095, 0.005, 0.255], [0.03, 0.04, 0.01])]);
      eyes.castShadow = false; head.add(eyes);
      const age = lk.age || 'volw';
      head.scale.setScalar(age === 'baby' ? 1.3 : age === 'peuter' ? 1.2 : age === 'kind' ? 1.1 : 1);
      const sc = ({ volw: 1, tiener: 0.92, kind: 0.78, peuter: 0.62, baby: 0.5 }[age] || 1) * (opts.scale || 0.8);
      g.scale.set(sc, sc, sc);
      g.userData = { legs, arms, inner, head, eyes, torso, seed: Math.random() * 10 };
      return g;
    }

    // bewegingen: wandelen of rustig staan (ademen, knipperen, af en toe zwaaien)
    function animatePerson(g, t, walkPhase, wave) {
      const u = g.userData; if (!u) return;
      const ph = u.seed + t;
      const blink = (ph % 4.3) < 0.12 ? 0.1 : 1; u.eyes.scale.y += (blink - u.eyes.scale.y) * 0.6;
      if (walkPhase !== null) {
        const sw = Math.sin(walkPhase) * 0.75;
        u.legs[0].rotation.x = sw; u.legs[1].rotation.x = -sw; u.arms[0].rotation.x = -sw * 0.9; u.arms[1].rotation.x = sw * 0.9;
        u.arms[0].rotation.z = 0.06; u.arms[1].rotation.z = -0.06;
        u.inner.position.y = Math.abs(Math.sin(walkPhase)) * 0.035; u.inner.rotation.y = Math.sin(walkPhase) * 0.1; u.inner.rotation.x = 0.06; u.head.rotation.z = Math.sin(walkPhase) * 0.04;
      } else {
        const br = Math.sin(ph * 2.2) * 0.012;
        u.legs[0].rotation.x = 0; u.legs[1].rotation.x = 0; u.inner.position.y = 0; u.inner.rotation.y = Math.sin(ph * 0.7) * 0.08; u.inner.rotation.x = 0;
        u.torso.scale.set(1 + br, 1 + br * 1.5, 1 + br); u.head.rotation.z = Math.sin(ph * 0.9) * 0.05;
        u.arms[0].rotation.x = Math.sin(ph * 1.6) * 0.06; u.arms[0].rotation.z = 0.08 + br * 2;
        if (wave) { const w = (ph % 7) < 1.6; u.arms[1].rotation.z = w ? -2.5 + Math.sin(ph * 12) * 0.3 : -0.08; u.arms[1].rotation.x = 0; }
        else { u.arms[1].rotation.x = -Math.sin(ph * 1.6) * 0.06; u.arms[1].rotation.z = -0.08 - br * 2; }
      }
    }

    // ---- bewoners en poppetjes in de scene ---------------------------------------
    const peopleGroup = new THREE.Group(); scene.add(peopleGroup);
    const agentMap = new Map();
    const homeMap = new Map();
    let playerFig = null, playerSig = '';

    function updatePeople(t, dt) {
      const S = S0();
      const live = new Set();
      for (const a of R.agents) {
        live.add(a.m.id);
        let e = agentMap.get(a.m.id);
        if (e && e.job !== a.m.job) { peopleGroup.remove(e.g); disposeGroup(e.g); e = null; }
        if (!e) { e = { g: makePerson(a.m.look, { job: a.m.job }), job: a.m.job }; peopleGroup.add(e.g); agentMap.set(a.m.id, e); }
        const walking = a.state === 'walking' && a.path;
        e.g.visible = !!walking;
        if (walking) {
          const p = JV.agentPos(a);
          const off = a.small ? 0.12 : -0.1;
          e.g.position.set(p.x + 0.5 + off * (p.dy ? 1 : 0), 0.0, p.y + 0.5 + off * (p.dx ? 1 : 0));
          if (p.dx || p.dy) { const target = Math.atan2(p.dx, p.dy); let d = target - e.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); e.g.rotation.y += d * Math.min(1, dt * 12); }
          animatePerson(e.g, t, a.walk, false);
        }
      }
      for (const [id, e] of agentMap) if (!live.has(id)) { peopleGroup.remove(e.g); agentMap.delete(id); }
      // kinderen en huisdieren bij het huis overdag
      const dark = JV.darkness();
      const famIds = new Set();
      for (const f of S.families) {
        famIds.add(f.id);
        const h = R.byId.get(f.houseId); if (!h) continue;
        const kid = f.members.find((m) => m.look.age === 'kind' || m.look.age === 'tiener');
        const sig = [f.id, h.gx, h.gy, h.flip ? 1 : 0, kid ? kid.id : 0, f.pet || ''].join('|');
        let e = homeMap.get(f.id);
        if (!e || e.sig !== sig) {
          if (e) peopleGroup.remove(e.g);
          const g = new THREE.Group(); const dd = C[h.type];
          const door = h.flip ? 'z' : 'x';
          const px = door === 'x' ? h.gx + dd.w + 0.25 : h.gx + dd.w * 0.3, pz = door === 'x' ? h.gy + dd.h * 0.3 : h.gy + dd.h + 0.25;
          if (kid) { const p = makePerson(kid.look); p.position.set(px, 0, pz); p.rotation.y = door === 'x' ? Math.PI / 2 : 0; g.add(p); g.userData.kid = p; }
          if (f.pet) { const pet = JV.PETS.find((x) => x.id === f.pet); const s = emojiSprite(pet.icon, 0.5); s.position.set(door === 'x' ? px : px + 0.5, 0.3, door === 'x' ? pz + 0.5 : pz); g.add(s); g.userData.pet = s; }
          peopleGroup.add(g); e = { g, sig }; homeMap.set(f.id, e);
        }
        e.g.visible = dark < 0.6;
        if (e.g.userData.kid) { animatePerson(e.g.userData.kid, t, null, false); e.g.userData.kid.position.y = Math.max(0, Math.sin(t * 3 + f.id) * 0.04); }
        if (e.g.userData.pet) e.g.userData.pet.position.y = 0.3 + Math.abs(Math.sin(t * 2.2 + f.id)) * 0.06;
      }
      for (const [id, e] of homeMap) if (!famIds.has(id)) { peopleGroup.remove(e.g); homeMap.delete(id); }
      // de speler zelf
      const ph = S.objects.find((o) => o.type === 'playerhouse');
      if (ph) {
        const sig = [ph.gx, ph.gy, ph.flip ? 1 : 0, JSON.stringify(S.player.look), S.player.pet || ''].join('|');
        if (sig !== playerSig) {
          if (playerFig) peopleGroup.remove(playerFig);
          playerFig = new THREE.Group();
          const door = ph.flip ? 'z' : 'x';
          const px = door === 'x' ? ph.gx + 2.75 : ph.gx + 1.0, pz = door === 'x' ? ph.gy + 1.0 : ph.gy + 2.75;
          const p = makePerson(S.player.look, { sash: true, scale: 0.9 }); p.position.set(px, 0, pz); p.rotation.y = door === 'x' ? Math.PI / 2 : 0; playerFig.add(p); playerFig.userData.p = p;
          if (S.player.pet) { const pet = JV.PETS.find((x) => x.id === S.player.pet); const s = emojiSprite(pet.icon, 0.55); s.position.set(px + (door === 'x' ? 0.1 : 0.5), 0.3, pz + (door === 'x' ? 0.5 : 0.1)); playerFig.add(s); playerFig.userData.pet = s; }
          peopleGroup.add(playerFig); playerSig = sig;
        }
        playerFig.visible = dark < 0.6;
        animatePerson(playerFig.userData.p, t, null, true);
        if (playerFig.userData.pet) playerFig.userData.pet.position.y = 0.3 + Math.abs(Math.sin(t * 2.6)) * 0.07;
      }
    }

    // ---- spook, selectie, bouwraster -------------------------------------------
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xf6c445, transparent: true, opacity: 0.45, depthWrite: false });
    const hl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), hlMat); hl.position.y = 0.06; hl.visible = false; scene.add(hl);
    const gm = new THREE.MeshBasicMaterial({ color: 0x5dae5b, transparent: true, opacity: 0.5, depthWrite: false });
    const ghostPad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), gm); ghostPad.position.y = 0.07; ghostPad.visible = false; scene.add(ghostPad);
    let ghostObj = null, ghostKey = '';
    function setGhostObj(type, flip, gx, gy) {
      const d = C[type];
      const key = type + '|' + flip + '|' + season();
      if (key !== ghostKey) {
        if (ghostObj) scene.remove(ghostObj); ghostObj = null; ghostKey = key;
        if (type !== 'road') {
          const fake = { id: 424242, type, gx: 0, gy: 0, flip, wall: '#F5EBD3', roof: '#E8708A', lvl: 1 };
          const g = buildObject(fake);
          if (g) {
            g.traverse((c) => { if (c.isMesh && c.material && !c.isSprite) { c.material = c.material.clone(); c.material.transparent = true; c.material.opacity = 0.7; c.castShadow = false; c.userData.objId = undefined; } });
            g.userData.objId = undefined; scene.add(g); ghostObj = g;
          }
        }
      }
      if (ghostObj) ghostObj.position.set(gx, 0, gy);
      ghostPad.scale.set(d.w, 1, d.h); ghostPad.position.x = gx + d.w / 2; ghostPad.position.z = gy + d.h / 2;
    }

    // ---- bubbels (HTML boven de scene) -------------------------------------------
    const bubbleLayer = document.getElementById('bubbles');
    const bubbleEls = new Map();
    function worldToScreenV(x, y, z) {
      tmpV.set(x, y, z).project(camera);
      return { x: (tmpV.x * 0.5 + 0.5) * JV.view.w, y: (-tmpV.y * 0.5 + 0.5) * JV.view.h, behind: tmpV.z > 1 };
    }
    function bubbleFor(o) {
      const d = C[o.type];
      if (d.cat === 'werk') {
        if ((o.pending || 0) >= 5) return ['🪙 ' + Math.floor(o.pending), 'coin'];
        if (JV.workersOf(o).length === 0 && S0().families.length && cam.zoom > 0.85) return ['👷 Geen personeel', ''];
      }
      if (d.cat === 'woning') {
        const fam = JV.familyOf(o.id);
        if (o.movedIn && Date.now() - o.movedIn < 9000) return ['📦 Nieuw!', ''];
        if (fam && fam.giftReady) return [fam.birthday ? '🎂' : '🎁', 'gift'];
      }
      return null;
    }
    function updateBubbles(t) {
      const S = S0(); const used = new Set();
      if (!JV.ui.build && bubbleLayer) {
        for (const o of S.objects) {
          const b = bubbleFor(o); if (!b) continue;
          const ent = objMap.get(o.id); if (!ent) continue;
          const d = C[o.type];
          const p = worldToScreenV(o.gx + d.w / 2, (ent.g.userData.h || 1.5) + 0.7 + Math.sin(t * 3 + o.id) * 0.05, o.gy + d.h / 2);
          if (p.behind) continue;
          let el = bubbleEls.get(o.id);
          if (!el) { el = document.createElement('div'); el.className = 'bubble3d'; bubbleLayer.appendChild(el); bubbleEls.set(o.id, el); }
          if (el._t !== b[0]) { el.textContent = b[0]; el._t = b[0]; el.dataset.k = b[1]; }
          el.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) translate(-50%,-100%) scale(' + Math.max(0.7, Math.min(1, cam.zoom)).toFixed(2) + ')';
          used.add(o.id);
        }
      }
      for (const [id, el] of bubbleEls) if (!used.has(id)) { el.remove(); bubbleEls.delete(id); }
    }
    JV.floatAt = function (o, text, color) {
      if (!bubbleLayer) return;
      const d = C[o.type]; const ent = objMap.get(o.id);
      const p = worldToScreenV(o.gx + d.w / 2, ((ent && ent.g.userData.h) || 1.5) + 0.5, o.gy + d.h / 2);
      const el = document.createElement('div'); el.className = 'floater3d'; el.textContent = text; if (color) el.style.color = color;
      el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; bubbleLayer.appendChild(el);
      setTimeout(() => el.remove(), 1700);
    };

    // ---- weer ---------------------------------------------------------------------
    const FLAKES = 520;
    const flakePos = new Float32Array(FLAKES * 3);
    for (let i = 0; i < FLAKES; i++) { flakePos[i * 3] = (Math.random() - 0.5) * 44; flakePos[i * 3 + 1] = Math.random() * 22; flakePos[i * 3 + 2] = (Math.random() - 0.5) * 44; }
    const flakeGeo = new THREE.BufferGeometry(); flakeGeo.setAttribute('position', new THREE.BufferAttribute(flakePos, 3));
    const flakeMat = new THREE.PointsMaterial({ size: 0.2, map: dotTex, transparent: true, depthWrite: false, color: 0xffffff });
    const flakes = new THREE.Points(flakeGeo, flakeMat); flakes.frustumCulled = false; flakes.visible = false; scene.add(flakes);

    // ---- licht, lucht en seizoen --------------------------------------------------
    const cDay = new THREE.Color('#BFE8F7'), cNight = new THREE.Color('#1D2150'), tmpC = new THREE.Color(), tmpC2 = new THREE.Color();
    function updateLighting() {
      const S = S0(); const dark = JV.darkness(), tt = S.time;
      tmpC.set(SEASON_LOOK[season()].sky).lerp(cNight, dark);
      if (tt > 0.5 && tt < 0.65) tmpC.lerp(tmpC2.set('#F4B98A'), 0.35 * (1 - Math.abs(tt - 0.58) / 0.08 > 0 ? 1 - Math.abs(tt - 0.58) / 0.08 : 0));
      scene.background = tmpC.clone(); scene.fog = new THREE.Fog(tmpC.getHex(), 55, 120);
      const arc = Math.min(1, Math.max(0, tt / 0.62));
      const el = 0.35 + Math.sin(arc * Math.PI) * 0.9;
      const az = -0.9 + arc * 1.8;
      sun.position.set(G / 2 + Math.sin(az) * 40, 12 + Math.sin(el) * 34, G / 2 + 24);
      sun.color.set(dark > 0.5 ? '#9FB0FF' : (tt < 0.08 || tt > 0.5) ? '#FFD9A8' : '#FFF4E0');
      sun.intensity = 0.34 + 0.3 * (1 - dark);
      hemi.intensity = 0.52 + 0.06 * (1 - dark);
      hemi.color.set(dark > 0.5 ? '#8E9CF0' : '#E2F4FF'); hemi.groundColor.set(dark > 0.5 ? '#3A3E66' : '#8A9A6A');
      winMat.emissiveIntensity = dark * 0.95;
      scene.traverse && 0;
      for (const [, v] of objMap) if (v.o.type === 'lantern') v.g.traverse((c) => { if (c.userData && c.userData.glow) c.material.opacity = dark * 0.9; });
      const sea = season();
      flakes.visible = sea === 3 || sea === 2;
      flakeMat.color.set(sea === 3 ? 0xffffff : 0xe2832f); flakeMat.size = sea === 3 ? 0.2 : 0.32;
    }

    // ---- kamera ---------------------------------------------------------------------
    function updateCam() {
      const dist = BASE / cam.zoom, cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
      camera.position.set(cam.x + dist * cp * Math.sin(cam.yaw), dist * sp, cam.y + dist * cp * Math.cos(cam.yaw));
      camera.lookAt(cam.x, 0, cam.y);
      camera.updateMatrixWorld(true);
    }
    function groundPoint(sx, sy) {
      tmpV.set((sx / JV.view.w) * 2 - 1, -(sy / JV.view.h) * 2 + 1, 0.5);
      raycaster.setFromCamera({ x: tmpV.x, y: tmpV.y }, camera);
      const out = new THREE.Vector3();
      return raycaster.ray.intersectPlane(plane, out) ? out : null;
    }
    JV.clampCam = function () {
      cam.zoom = Math.max(0.45, Math.min(2.6, cam.zoom));
      cam.pitch = Math.max(0.5, Math.min(1.25, cam.pitch));
      cam.x = Math.max(0, Math.min(G, cam.x)); cam.y = Math.max(0, Math.min(G, cam.y));
    };
    let panRef = null;
    JV.camPanStart = (sx, sy) => { updateCam(); panRef = groundPoint(sx, sy); };
    JV.camPanMove = (sx, sy) => {
      if (!panRef) return;
      const g1 = groundPoint(sx, sy); if (!g1) return;
      cam.x += panRef.x - g1.x; cam.y += panRef.z - g1.z; JV.clampCam(); updateCam();
    };
    JV.camZoom = (f, sx, sy) => {
      updateCam(); const g0 = groundPoint(sx, sy);
      cam.zoom *= f; JV.clampCam(); updateCam();
      const g1 = g0 && groundPoint(sx, sy);
      if (g0 && g1) { cam.x += g0.x - g1.x; cam.y += g0.z - g1.z; JV.clampCam(); updateCam(); }
    };
    JV.camRotate = (d, instant) => { cam.yawT += d; if (instant) cam.yaw = cam.yawT; };
    JV.camTilt = (d) => { cam.pitch += d; JV.clampCam(); };
    JV.focusOn = (gx, gy) => { cam.x = gx + 0.5; cam.y = gy + 0.5; JV.clampCam(); };
    JV.tileCenter = (gx, gy) => ({ x: gx + 0.5, y: gy + 0.5 });
    JV.worldToScreen = (x, y) => { updateCam(); const p = worldToScreenV(x, 0, y); return { x: p.x, y: p.y }; };
    JV.screenToTile = (sx, sy) => { const g = groundPoint(sx, sy); return g ? { gx: Math.floor(g.x), gy: Math.floor(g.z) } : { gx: -99, gy: -99 }; };
    JV.pickObjectAt = (sx, sy) => {
      tmpV.set((sx / JV.view.w) * 2 - 1, -(sy / JV.view.h) * 2 + 1, 0.5);
      raycaster.setFromCamera({ x: tmpV.x, y: tmpV.y }, camera);
      const hits = raycaster.intersectObject(objGroup, true);
      for (const h of hits) { let n = h.object; while (n) { if (n.userData && n.userData.objId) { return R.byId.get(n.userData.objId) || null; } n = n.parent; } }
      return null;
    };
    JV.onResize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(JV.view.w, JV.view.h, false);
      camera.aspect = JV.view.w / Math.max(1, JV.view.h);
      camera.updateProjectionMatrix();
    };

    // ---- elk beeld ------------------------------------------------------------------
    let lastT = 0;
    JV.render = function (ctx, t, ui) {
      const S = S0(); if (!S) return;
      const dt = Math.min(0.1, Math.max(0.001, t - lastT)); lastT = t;
      if (!groundMesh || groundSig !== season() + '|' + (S.landStep || 0)) { rebuildGround(); R.dirty = true; objMap.forEach((v) => objGroup.remove(v.g)); objMap.clear(); }
      if (R.dirty) { R.dirty = false; syncObjects(); }
      // kamera glijdt naar de gewenste draaihoek
      const dy = cam.yawT - cam.yaw; cam.yaw += dy * Math.min(1, dt * 9);
      updateCam();
      updateLighting();
      updatePeople(t, dt);
      for (const [, v] of objMap) {
        const o = v.o;
        v.g.visible = !(ui.moving && ui.moving.id === o.id);
        if (o.type === 'fountain') v.g.traverse((c) => { if (c.userData && c.userData.drops) c.children.forEach((s) => { const ph = (t * 0.9 + s.userData.i / 10) % 1; const a = s.userData.i / 10 * Math.PI * 2; s.position.set(1 + Math.cos(a) * 0.5 * ph, 1.25 + Math.sin(ph * Math.PI) * 0.35 - ph * 0.7 + 0.15, 1 + Math.sin(a) * 0.5 * ph); }); });
        if (o.type === 'speeltuin') v.g.traverse((c) => { if (c.userData && c.userData.swing) c.rotation.x = Math.sin(t * 2.2) * 0.5; });
      }
      waterTex.offset.x = (t * 0.02) % 1; waterTex.offset.y = (t * 0.012) % 1;
      // sneeuw / bladeren
      if (flakes.visible) {
        const winter = season() === 3, sp = winter ? 2.2 : 1.4;
        const a = flakeGeo.attributes.position.array;
        for (let i = 0; i < FLAKES; i++) { a[i * 3 + 1] -= dt * sp * (0.6 + (i % 5) * 0.2); a[i * 3] += Math.sin(t * 0.8 + i) * dt * 0.4; if (a[i * 3 + 1] < 0) a[i * 3 + 1] = 22; }
        flakeGeo.attributes.position.needsUpdate = true;
        flakes.position.set(cam.x, 0, cam.y);
      }
      // bouwraster, selectie en voorbeeld
      gridLines.visible = !!ui.build;
      if (ui.selected) { const d = C[ui.selected.type]; hl.visible = true; hl.scale.set(d.w, 1, d.h); hl.position.set(ui.selected.gx + d.w / 2, 0.06, ui.selected.gy + d.h / 2); } else hl.visible = false;
      if (ui.ghost) {
        const gh = ui.ghost; setGhostObj(gh.type, gh.flip, gh.gx, gh.gy);
        gm.color.set(gh.ok ? 0x5dae5b : 0xe2483d); ghostPad.visible = true; if (ghostObj) ghostObj.visible = true;
      } else { ghostPad.visible = false; if (ghostObj) ghostObj.visible = false; }
      updateBubbles(t);
      renderer.render(scene, camera);
    };
    JV.floaters = [];
    JV.drawHousePreview = JV.drawHousePreview; // blijft de 2D-voorbeeldtekening
    Object.keys(JV.MODELS || {}).forEach((k) => JV.setModel(k, JV.MODELS[k]));
    updateCam();
    JV._three = { scene, camera, renderer };
    JV._people = { makePerson, animatePerson };
  }
})(window.JV);
