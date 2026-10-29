// Jaylinn Village – 3D weergave met three.js (lage-poly, gezellige stijl).
// Gebruikt dezelfde spelregels als de 2D-weergave en valt terug op 2D als WebGL niet werkt.
(function (JV) {
  const C = JV.CATALOG, G = JV.GRID, R = JV.R;
  JV.is3d = false;

  const SEASON_LOOK = [
    { g: ['#93CF73', '#8BC86B'], leaf: ['#4E9F4A', '#5DAE5B', '#3F8E45', '#6BB85A'], fruit: '#E2483D', sky: '#BFE8F7' },
    { g: ['#8CCB62', '#83C45A'], leaf: ['#4A9A3E', '#58A94C', '#3A8838', '#66B44E'], fruit: '#F6C445', sky: '#B5E4F8' },
    { g: ['#CDBC68', '#C3B25E'], leaf: ['#E2832F', '#D9602A', '#E8A93A', '#C84A2B'], fruit: '#8A4B2A', sky: '#D9DFE8' },
    { g: ['#EDF4F7', '#E2EDF2'], leaf: ['#DDE8EC', '#CFDDE3', '#E8F0F3', '#C5D6DD'], fruit: '#FFFFFF', sky: '#D6E6F0' },
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
      if (!matCache.has(k)) matCache.set(k, new THREE.MeshLambertMaterial(Object.assign({ color: new THREE.Color(color) }, o || {})));
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
            face([D, Cc, r2, r1], color, hint); face([A, B, r2, r1], color, hint); face([A, D, r1], color, hint); face([B, Cc, r2], color, hint);
          } else {
            const r1 = [xc, y, z0 + w / 2], r2 = [xc, y, z1 - w / 2];
            face([A, D, r2, r1], color, hint); face([B, Cc, r2, r1], color, hint); face([A, B, r1], color, hint); face([D, Cc, r2], color, hint);
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

    function houseParts(B, grp, w, d, o, wall, roof, opts) {
      opts = opts || {};
      const m = 0.1, H = opts.H || 1.0;
      const bb = { x0: m, x1: w - m, z0: m, z1: d - m };
      B.box(bb.x0, 0, bb.z0, bb.x1, H, bb.z1, wall);
      const doorSide = o.flip ? '+z' : '+x';
      for (const side of ['+x', '+z', '-x', '-z']) {
        if (side === doorSide) {
          B.panel(side, bb, 0.42, 0.62, 0, H * 0.66, opts.door || JV.shade(roof, -20), 'main', 0.02);
          B.panel(side, bb, 0.1, 0.3, H * 0.4, H * 0.8, '#9FD3EA', 'win');
          B.panel(side, bb, 0.72, 0.9, H * 0.4, H * 0.8, '#9FD3EA', 'win');
        } else {
          B.panel(side, bb, 0.14, 0.4, H * 0.4, H * 0.8, '#9FD3EA', 'win');
          B.panel(side, bb, 0.6, 0.86, H * 0.4, H * 0.8, '#9FD3EA', 'win');
        }
      }
      B.hip(bb.x0, bb.z0, bb.x1, bb.z1, H, opts.apex || 0.8, roof, 0.16);
      B.box(w - 0.5, H + 0.1, d - 0.55, w - 0.32, H + 0.75, d - 0.37, JV.shade(wall, -34));
      return bb;
    }

    function buildHouse(o, wall, roof, o2) {
      const d = C[o.type];
      const B = Builder(); const grp = new THREE.Group();
      houseParts(B, grp, d.w, d.h, o, wall, roof, o2 || {});
      const g = B.group(); g.userData.h = (o2 && o2.H || 1) + (o2 && o2.apex || 0.8);
      return g;
    }

    function buildApartment(o) {
      const d = C[o.type]; const B = Builder();
      const wall = o.wall || '#EFE2D2', H = 2.3, bb = { x0: 0.1, x1: d.w - 0.1, z0: 0.1, z1: d.h - 0.1 };
      B.box(bb.x0, 0, bb.z0, bb.x1, H, bb.z1, wall);
      B.box(bb.x0 - 0.04, H, bb.z0 - 0.04, bb.x1 + 0.04, H + 0.12, bb.z1 + 0.04, JV.shade(wall, -40));
      const door = o.flip ? '+z' : '+x';
      for (const side of ['+x', '+z', '-x', '-z']) for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) {
        const t0 = 0.12 + col * 0.44, y0 = 0.35 + row * 0.62;
        if (side === door && row === 0 && col === 1) { B.panel(side, bb, 0.5, 0.74, 0, 0.55, o.roof || '#7A5A44', 'main', 0.02); continue; }
        B.panel(side, bb, t0, t0 + 0.3, y0, y0 + 0.38, '#9FD3EA', 'win');
      }
      B.box(0.4, H + 0.12, 0.4, 0.8, H + 0.45, 0.8, '#7A7488'); B.box(1.1, H + 0.12, 1.0, 1.5, H + 0.5, 1.4, '#8A8498');
      const g = B.group(); g.userData.h = H + 0.5; return g;
    }

    function buildVilla(o) {
      const d = C[o.type]; const B = Builder(); const grp = new THREE.Group();
      const wall = o.wall || '#F5EBD3', roof = o.roof || '#E8708A';
      houseParts(B, grp, d.w, d.h, o, wall, roof, { H: 1.5, apex: 1.1 });
      B.box(d.w - 0.7, 1.3, 0.35, d.w - 0.45, 2.55, 0.6, JV.shade(wall, -34));
      B.box(d.w - 0.75, 2.5, 0.3, d.w - 0.4, 2.62, 0.65, '#6B4B33');
      const g = B.group(); g.userData.h = 2.6; return g;
    }

    function signFor(o, y, st) {
      const d = C[o.type];
      const lvl = o.lvl || 1;
      const sp = labelSprite(d.icon + ' ' + d.name + (lvl > 1 ? ' ' + '★'.repeat(lvl - 1) : ''), st.sign, 2.7);
      sp.position.set(d.w / 2, y, d.h / 2);
      return sp;
    }

    function buildWork(o) {
      const d = C[o.type], st = WORK[o.type], lvl = o.lvl || 1;
      const H = st.h + (lvl - 1) * 0.1;
      const B = Builder(); const grp = new THREE.Group();
      const bb = { x0: 0.06, x1: d.w - 0.06, z0: 0.06, z1: d.h - 0.06 };
      B.box(bb.x0, 0, bb.z0, bb.x1, H, bb.z1, st.wall, st.roof);
      B.box(bb.x0 + 0.12, H, bb.z0 + 0.12, bb.x1 - 0.12, H + 0.1, bb.z1 - 0.12, JV.shade(st.roof, -22));
      const door = o.flip ? '+z' : '+x';
      const wTop = Math.min(0.85, H - 0.55), glass = '#9FD3EA';
      for (const side of ['+x', '+z', '-x', '-z']) {
        const len = side === '+x' || side === '-x' ? d.h : d.w;
        const cols = Math.max(2, Math.round(len * 1.0));
        for (let i = 0; i < cols; i++) {
          const t0 = (i + 0.2) / cols, t1 = (i + 0.8) / cols;
          if (side === door && i === Math.floor(cols / 2)) {
            if (o.type === 'brandweer') { B.panel(side, bb, t0 - 0.1, t1 + 0.1, 0, 0.95, '#D9453A', 'main', 0.02); for (let k = 1; k < 5; k++) B.panel(side, bb, t0 - 0.1, t1 + 0.1, k * 0.19, k * 0.19 + 0.03, '#B23A31', 'main', 0.03); }
            else B.panel(side, bb, t0, t1, 0, wTop, '#B7DDEE', 'main', 0.02);
          } else B.panel(side, bb, t0, t1, 0.25, wTop, glass, 'win');
          if (H > 1.9) B.panel(side, bb, t0, t1, wTop + 0.35, H - 0.3, glass, 'win');
        }
      }
      // luifel
      const a0 = Math.min(0.95, H - 0.5), a1 = a0 + 0.22;
      for (const side of ['+x', '+z']) {
        const len = side === '+x' ? d.h : d.w, n = Math.max(6, Math.round(len * 3));
        for (let i = 0; i < n; i++) {
          const t0 = (i + 0.0) / n, t1 = (i + 1) / n, c = i % 2 ? st.a2 : st.a1;
          if (side === '+x') { const x = bb.x1; const za = bb.z0 + (bb.z1 - bb.z0) * t0, zb = bb.z0 + (bb.z1 - bb.z0) * t1; B.face([[x, a0, za], [x + 0.35, a0 - 0.1, za], [x + 0.35, a0 - 0.1, zb], [x, a0, zb]], c, [x - 1, a0, (za + zb) / 2]); B.face([[x + 0.35, a0 - 0.1, za], [x + 0.35, a1 - 0.1, za], [x + 0.35, a1 - 0.1, zb], [x + 0.35, a0 - 0.1, zb]], c, [x, a0, (za + zb) / 2]); }
          else { const z = bb.z1; const xa = bb.x0 + (bb.x1 - bb.x0) * t0, xb = bb.x0 + (bb.x1 - bb.x0) * t1; B.face([[xa, a0, z], [xa, a0 - 0.1, z + 0.35], [xb, a0 - 0.1, z + 0.35], [xb, a0, z]], c, [(xa + xb) / 2, a0, z - 1]); B.face([[xa, a0 - 0.1, z + 0.35], [xa, a1 - 0.1, z + 0.35], [xb, a1 - 0.1, z + 0.35], [xb, a0 - 0.1, z + 0.35]], c, [(xa + xb) / 2, a0, z]); }
        }
      }
      const g = B.group();
      const cx = d.w / 2, cz = d.h / 2, top = H + 0.1;
      switch (o.type) {
        case 'ziekenhuis': { const cr = new THREE.Group(); cr.position.set(cx, top + 0.06, cz); cr.rotation.y = Math.PI / 4; cr.add(bx('#E2483D', 0, 0, 0, 0.3, 0.12, 1.2), bx('#E2483D', 0, 0, 0, 1.2, 0.12, 0.3)); g.add(cr); break; }
        case 'school': g.add(cyl('#6B4B33', d.w - 0.5, top + 0.7, 0.5, 0.03, 1.4)); g.add(bx('#E2483D', d.w - 0.3, top + 1.25, 0.5, 0.4, 0.26, 0.03)); break;
        case 'brandweer': g.add(bx('#8A2A22', 0.6, top + 0.6, 0.6, 0.6, 1.2, 0.6), bx('#E8B84A', 0.6, top + 0.9, 0.9, 0.3, 0.25, 0.04)); break;
        case 'ijssalon': g.add(cone('#E8B66A', cx, top + 0.45, cz, 0.28, 0.9), sph('#F28BA8', cx, top + 1.05, cz, 0.34), sph('#9EE0F0', cx, top + 1.38, cz, 0.26), sph('#E2483D', cx, top + 1.64, cz, 0.09)); break;
        case 'kapper': g.add(cyl('#FFFFFF', 0.25, 0.6, d.h + 0.15, 0.1, 1.0), cyl('#E2483D', 0.25, 0.4, d.h + 0.15, 0.105, 0.2), cyl('#3F7FD8', 0.25, 0.8, d.h + 0.15, 0.105, 0.2)); break;
        case 'bakkerij': g.add(bx('#B8685A', d.w - 0.5, top + 0.35, 0.5, 0.35, 0.7, 0.35)); break;
        case 'restaurant': g.add(bx('#B8685A', d.w - 0.6, top + 0.4, 0.7, 0.4, 0.8, 0.4)); break;
        case 'opvang': g.add(bx('#E2483D', 0.7, top + 0.2, cz, 0.4, 0.4, 0.4), bx('#3F7FD8', 1.2, top + 0.2, cz, 0.4, 0.4, 0.4), bx('#F6C445', 0.95, top + 0.6, cz, 0.4, 0.4, 0.4)); break;
        case 'bloemen': for (let i = 0; i < 4; i++) { g.add(bx('#8A6248', 0.45 + i * 0.4, 0.15, d.h + 0.2, 0.3, 0.3, 0.3)); g.add(sph(['#E8708A', '#F6C445', '#FFFFFF', '#9B6FD6'][i], 0.45 + i * 0.4, 0.4, d.h + 0.2, 0.17)); } break;
        case 'dierenopvang': g.add(bx('#C9A27A', 0.5, 0.3, d.h + 0.35, 0.5, 0.6, 0.5), bx('#8A5A3A', 0.5, 0.65, d.h + 0.35, 0.6, 0.1, 0.6)); break;
        case 'bus': {
          g.add(bx('#F6C445', cx, top + 0.4, cz, 1.4, 0.5, 0.6), bx('#9FD3EA', cx, top + 0.5, cz + 0.31, 1.2, 0.22, 0.02), cyl('#3A3A48', cx - 0.4, top + 0.12, cz + 0.28, 0.12, 0.1).rotateX(Math.PI / 2), cyl('#3A3A48', cx + 0.4, top + 0.12, cz + 0.28, 0.12, 0.1).rotateX(Math.PI / 2));
          break;
        }
        default: break;
      }
      g.add(signFor(o, H + 1.0, st));
      g.userData.h = H + 1.4;
      return g;
    }

    // ---- versiering --------------------------------------------------------------
    function treeGroup(o, cxp, czp) {
      const g = new THREE.Group(); const h = hash(o.id), L = look(), sea = season();
      const x = cxp === undefined ? 0.5 : cxp, z = czp === undefined ? 0.5 : czp;
      g.add(cyl('#8A5A3A', x, 0.35, z, 0.07, 0.7, 0.07));
      if (h > 0.8) {
        const gc = '#3F8E45';
        g.add(cone(gc, x, 0.95, z, 0.42, 0.9), cone('#357D3B', x, 1.35, z, 0.34, 0.8));
        if (sea === 3) g.add(cone('#FFFFFF', x, 1.62, z, 0.2, 0.35));
      } else {
        const lc = L.leaf[Math.floor(h * 4)];
        g.add(sph(lc, x - 0.16, 0.95, z, 0.3), sph(JV.shade(lc, -8), x + 0.16, 0.95, z + 0.05, 0.28), sph(JV.shade(lc, 10), x, 1.2, z, 0.34));
        if (h < 0.25 && sea !== 3) { g.add(sph(L.fruit, x + 0.22, 1.05, z + 0.2, 0.05), sph(L.fruit, x - 0.2, 1.15, z + 0.22, 0.05)); }
        if (sea === 3) g.add(sph('#FFFFFF', x, 1.45, z, 0.2, 0.08, 0.2));
      }
      g.userData.h = 1.8; return g;
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
      g.add(sph(L.leaf[0], 0.35, 0.22, 0.5, 0.25), sph(L.leaf[2], 0.65, 0.22, 0.5, 0.25), sph(L.leaf[1], 0.5, 0.4, 0.45, 0.27));
      if (season() === 3) g.add(sph('#FFFFFF', 0.5, 0.62, 0.45, 0.2, 0.07, 0.2));
      g.userData.h = 0.8; return g;
    }
    function rockGroup() {
      const g = new THREE.Group();
      const r1 = mesh(geo('d', () => new THREE.DodecahedronGeometry(1)), mat('#9A98A6'), 0.45, 0.2, 0.5, 0.3, 0.22, 0.28); r1.rotation.y = 0.6;
      const r2 = mesh(geo('d', () => new THREE.DodecahedronGeometry(1)), mat('#B5B3BF'), 0.66, 0.14, 0.58, 0.18, 0.14, 0.17); g.add(r1, r2);
      g.userData.h = 0.5; return g;
    }

    function buildObject(o) {
      const t = o.type, S = S0();
      let g;
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
        col.set(L.g[(gx + gy) % 2]);
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
    }

    function disposeGroup(g) { g.traverse((c) => { if (c.geometry && c.geometry.userData && c.geometry.userData.own) c.geometry.dispose(); }); }
    let groundSig = '';
    function sigOf(o) {
      const S = S0();
      return [o.type, o.gx, o.gy, o.flip ? 1 : 0, o.lvl || 1, o.wall || '', o.roof || '', season(), o.type === 'playerhouse' ? JSON.stringify(S.houseColors || '') + S.houseStyle : ''].join('|');
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

    // ---- mensen -------------------------------------------------------------
    const personCache = new Map();
    function makePerson(look0, opts) {
      opts = opts || {};
      const lk = look0;
      const g = new THREE.Group();
      const inner = new THREE.Group(); g.add(inner);
      const skin = lk.skin, hairC = lk.hairColor;
      const legs = [];
      for (const sx of [-1, 1]) { const l = bx(lk.pants, sx * 0.1, 0.13, 0, 0.17, 0.27, 0.19); const pivot = new THREE.Group(); pivot.position.set(sx * 0.1, 0.27, 0); l.position.set(0, -0.135, 0); pivot.add(l); const shoe = bx('#FFFFFF', 0, -0.26, 0.03, 0.18, 0.06, 0.25); pivot.add(shoe); inner.add(pivot); legs.push(pivot); }
      const body = bx(lk.shirt, 0, 0.42, 0, 0.42, 0.3, 0.25); inner.add(body);
      if (lk.gender === 'v' && lk.dress && lk.age === 'volw') inner.add(cone(lk.shirt, 0, 0.3, 0, 0.32, 0.34));
      const arms = [];
      for (const sx of [-1, 1]) { const pivot = new THREE.Group(); pivot.position.set(sx * 0.27, 0.54, 0); pivot.add(bx(JV.shade(lk.shirt, -14), 0, -0.12, 0, 0.1, 0.26, 0.12)); pivot.add(sph(skin, 0, -0.27, 0, 0.065)); inner.add(pivot); arms.push(pivot); }
      const head = new THREE.Group(); head.position.set(0, 0.76, 0); inner.add(head);
      head.add(sph(skin, 0, 0, 0, 0.27));
      head.add(sph('#2B1B12', -0.09, 0.02, 0.235, 0.04, 0.055, 0.03), sph('#2B1B12', 0.09, 0.02, 0.235, 0.04, 0.055, 0.03));
      head.add(sph('#FFFFFF', -0.085, 0.04, 0.262, 0.012), sph('#FFFFFF', 0.095, 0.04, 0.262, 0.012));
      head.add(sph('#F2A0A8', -0.16, -0.05, 0.2, 0.04, 0.025, 0.02), sph('#F2A0A8', 0.16, -0.05, 0.2, 0.04, 0.025, 0.02));
      head.add(sph('#B05A4A', 0, -0.1, 0.24, 0.035, 0.012, 0.015));
      const cap = (r, extra) => { const m = new THREE.Mesh(geo('cap' + r, () => new THREE.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56)), mat(hairC)); m.position.set(0, 0.02, -0.01); m.rotation.x = -0.25; m.castShadow = true; return m; };
      switch (lk.hair) {
        case 'afro': head.add(sph(hairC, 0, 0.06, -0.04, 0.35, 0.33, 0.33)); break;
        case 'krul': head.add(cap(0.29)); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; head.add(sph(hairC, Math.cos(a) * 0.27, 0.1 + Math.sin(a * 2) * 0.04, Math.sin(a) * 0.2 - 0.04, 0.09)); } break;
        case 'lang': head.add(cap(0.29), bx(hairC, 0, -0.12, -0.17, 0.5, 0.5, 0.12), bx(hairC, -0.26, -0.08, 0, 0.07, 0.34, 0.2), bx(hairC, 0.26, -0.08, 0, 0.07, 0.34, 0.2)); break;
        case 'staart': head.add(cap(0.29), sph(hairC, 0.2, 0.18, -0.15, 0.1, 0.17, 0.09), sph('#F06A96', 0.17, 0.2, -0.1, 0.045)); break;
        case 'vlechtjes': head.add(cap(0.29), sph(hairC, -0.3, 0.1, -0.02, 0.1), sph(hairC, 0.3, 0.1, -0.02, 0.1), sph('#F06A96', -0.26, 0.16, 0, 0.04), sph('#F06A96', 0.26, 0.16, 0, 0.04)); break;
        case 'knot': head.add(cap(0.29), sph(hairC, 0, 0.33, -0.03, 0.12)); break;
        case 'hoofddoek': { const m = new THREE.Mesh(geo('scarf', () => new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.75)), mat(hairC)); m.position.set(0, 0.0, -0.03); m.rotation.x = -0.2; m.castShadow = true; head.add(m); head.add(bx(hairC, 0, -0.32, -0.05, 0.5, 0.2, 0.3)); break; }
        default: head.add(cap(0.29));
      }
      if (lk.glasses) { for (const sx of [-1, 1]) { const t = new THREE.Mesh(geo('ring', () => new THREE.TorusGeometry(0.075, 0.012, 6, 14)), mat('#3A2A2A')); t.position.set(sx * 0.09, 0.03, 0.26); head.add(t); } }
      if (lk.beard) head.add(sph(hairC, 0, -0.15, 0.17, 0.17, 0.12, 0.1));
      if (opts.sash) { const s = bx('#F6C445', 0, 0.42, 0.13, 0.5, 0.06, 0.03); s.rotation.z = 0.7; inner.add(s); }
      const sc = ({ volw: 1, tiener: 0.92, kind: 0.78, peuter: 0.62, baby: 0.5 }[lk.age] || 1) * (opts.scale || 0.8);
      g.scale.set(sc, sc, sc);
      g.userData = { legs, arms, inner };
      return g;
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
        if (!e) { e = { g: makePerson(a.m.look) }; peopleGroup.add(e.g); agentMap.set(a.m.id, e); }
        const walking = a.state === 'walking' && a.path;
        e.g.visible = !!walking;
        if (walking) {
          const p = JV.agentPos(a);
          const off = a.small ? 0.12 : -0.1;
          e.g.position.set(p.x + 0.5 + off * (p.dy ? 1 : 0), 0.0, p.y + 0.5 + off * (p.dx ? 1 : 0));
          if (p.dx || p.dy) { const target = Math.atan2(p.dx, p.dy); let d = target - e.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); e.g.rotation.y += d * Math.min(1, dt * 12); }
          const sw = Math.sin(a.walk) * 0.7;
          const u = e.g.userData; u.legs[0].rotation.x = sw; u.legs[1].rotation.x = -sw; u.arms[0].rotation.x = -sw * 0.8; u.arms[1].rotation.x = sw * 0.8; u.inner.position.y = Math.abs(Math.sin(a.walk)) * 0.03;
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
        if (e.g.userData.kid) e.g.userData.kid.position.y = Math.max(0, Math.sin(t * 3 + f.id) * 0.04);
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
        playerFig.userData.p.position.y = Math.max(0, Math.sin(t * 2.4) * 0.02);
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
      sun.intensity = 0.34 + 0.45 * (1 - dark);
      hemi.intensity = 0.52 + 0.16 * (1 - dark);
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
    updateCam();
    JV._three = { scene, camera, renderer };
  }
})(window.JV);
