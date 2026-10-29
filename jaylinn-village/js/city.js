// Jaylinn Village – spelregels: stad, gebouwen, gezinnen, banen, bewoners, taken.
(function (JV) {
  const G = JV.GRID;
  const C = JV.CATALOG;

  // --- kleine hulpjes -------------------------------------------------------
  const listeners = {};
  JV.on = (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); };
  JV.emit = (ev, data) => { (listeners[ev] || []).forEach((fn) => fn(data)); };
  const rnd = Math.random;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const idx = (gx, gy) => gy * G + gx;
  const inside = (gx, gy) => gx >= 0 && gy >= 0 && gx < G && gy < G;
  JV.inside = inside;

  let S = null; // spelstatus (wordt opgeslagen)
  const R = { occ: new Int32Array(G * G).fill(-1), byId: new Map(), pathCache: new Map(), agents: [], dirty: true };
  JV.R = R;
  JV.state = () => S;

  // --- nieuw spel -----------------------------------------------------------
  JV.newGame = function (player, houseStyle) {
    const terrain = new Array(G * G).fill(0);
    for (let gy = 0; gy < G; gy++) {
      const cx = 16 + Math.round(Math.sin(gy / 3) * 0.9);
      terrain[idx(cx, gy)] = 1; terrain[idx(cx + 1, gy)] = 1;
    }
    S = {
      v: 1, player, houseStyle, coins: JV.START_COINS, diamonds: 5, xp: 0, level: 1,
      terrain, objects: [], families: [], nextId: 1, time: 0.12, day: 1,
      tasks: [], tutorialStep: 0, worked: {}, usedSurnames: [], settings: { sound: true },
      tipsSeen: {},
    };
    const add = (type, gx, gy, extra) => { const o = Object.assign({ id: S.nextId++, type, gx, gy, flip: false }, extra || {}); S.objects.push(o); return o; };
    add('playerhouse', 6, 8);
    for (let gx = 3; gx <= 13; gx++) add('road', gx, 10);
    add('super', 9, 11, { pending: 0 });
    add('tree', 4, 8); add('tree', 5, 12); add('flowers', 8, 9);
    rebuild();
    // natuur: rotsen en struiken op vrije plekken
    let n = 0, tries = 0;
    while (n < 16 && tries++ < 400) {
      const gx = Math.floor(rnd() * G), gy = Math.floor(rnd() * G);
      if (terrain[idx(gx, gy)] !== 0 || R.occ[idx(gx, gy)] !== -1) continue;
      if (gx > 1 && gx < 15 && gy > 5 && gy < 15) continue; // houd het startgebied vrij
      add(rnd() < 0.45 ? 'rock' : 'bush', gx, gy); rebuild(); n++;
    }
    fillTasks();
    rebuild();
    return S;
  };

  JV.loadGame = function (saved) {
    S = saved;
    S.settings = S.settings || { sound: true };
    S.tipsSeen = S.tipsSeen || {};
    S.worked = S.worked || {};
    rebuild();
    fillTasks();
    initAgents();
    return S;
  };

  // --- indexen --------------------------------------------------------------
  function rebuild() {
    R.occ.fill(-1); R.byId.clear(); R.pathCache.clear();
    for (const o of S.objects) {
      R.byId.set(o.id, o);
      const d = C[o.type];
      for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) R.occ[idx(o.gx + x, o.gy + y)] = o.id;
    }
    R.dirty = true;
  }
  JV.rebuild = rebuild;
  JV.objAt = (gx, gy) => (inside(gx, gy) ? R.byId.get(R.occ[idx(gx, gy)]) || null : null);
  JV.isWater = (gx, gy) => inside(gx, gy) && S.terrain[idx(gx, gy)] === 1;
  JV.isRoad = (gx, gy) => { const o = JV.objAt(gx, gy); return !!o && o.type === 'road'; };
  JV.familyOf = (houseId) => S.families.find((f) => f.houseId === houseId) || null;

  function adjacentRoad(o, d) {
    d = d || C[o.type];
    for (let x = 0; x < d.w; x++) { if (JV.isRoad(o.gx + x, o.gy - 1) || JV.isRoad(o.gx + x, o.gy + d.h)) return true; }
    for (let y = 0; y < d.h; y++) { if (JV.isRoad(o.gx - 1, o.gy + y) || JV.isRoad(o.gx + d.w, o.gy + y)) return true; }
    return false;
  }
  JV.adjacentRoad = adjacentRoad;

  // --- bouwen ---------------------------------------------------------------
  JV.priceOf = function (type, gx, gy) {
    if (type === 'road' && JV.isWater(gx, gy)) return JV.BRIDGE_PRICE;
    return C[type].price;
  };

  JV.canPlace = function (type, gx, gy, ignoreId) {
    const d = C[type];
    for (let y = 0; y < d.h; y++) for (let x = 0; x < d.w; x++) {
      const tx = gx + x, ty = gy + y;
      if (!inside(tx, ty)) return { ok: false, reason: 'Dat past niet op de kaart.' };
      const id = R.occ[idx(tx, ty)];
      if (id !== -1 && id !== ignoreId) return { ok: false, reason: 'Daar staat al iets.' };
      if (S.terrain[idx(tx, ty)] === 1 && type !== 'road') return { ok: false, reason: 'Je kunt niet op het water bouwen. Een weg wordt hier een brug.' };
    }
    if (d.cat === 'woning' || d.cat === 'werk' || d.cat === 'eigen') {
      if (!adjacentRoad({ gx, gy, type }, d)) return { ok: false, reason: 'Een gebouw moet aan een weg liggen.' };
    }
    return { ok: true };
  };

  JV.place = function (type, gx, gy) {
    const check = JV.canPlace(type, gx, gy);
    if (!check.ok) return check;
    const price = JV.priceOf(type, gx, gy);
    if (S.coins < price) return { ok: false, reason: 'Je hebt niet genoeg munten. Ga werken om meer te verdienen!' };
    S.coins -= price;
    const d = C[type];
    const o = { id: S.nextId++, type, gx, gy, flip: false };
    if (d.cat === 'werk') o.pending = 0;
    if (d.cat === 'woning') { o.wall = pick(JV.HOUSE_WALLS); o.roof = pick(JV.HOUSE_ROOFS); o.movedIn = Date.now(); }
    S.objects.push(o);
    rebuild();
    JV.addXp(Math.max(1, Math.round(price / 10)));
    if (d.cat === 'woning') makeFamily(o);
    if (d.cat === 'werk') { assignJobs(); initAgents(); updateHearts(); }
    JV.emit('build', { type, obj: o });
    progressTasks('build', { type });
    return { ok: true, obj: o };
  };

  JV.moveObj = function (o, gx, gy) {
    const check = JV.canPlace(o.type, gx, gy, o.id);
    if (!check.ok) return check;
    o.gx = gx; o.gy = gy;
    rebuild(); initAgents();
    return { ok: true };
  };

  JV.flipObj = function (o) { o.flip = !o.flip; R.dirty = true; };

  JV.sellValue = (o) => {
    const d = C[o.type];
    if (d.cat === 'natuur') return -d.clear;
    if (o.type === 'road' && JV.isWater(o.gx, o.gy)) return Math.floor(JV.BRIDGE_PRICE / 2);
    return Math.floor(d.price / 2);
  };

  JV.sell = function (o) {
    const d = C[o.type];
    if (d.cat === 'eigen') return { ok: false, reason: 'Je eigen huis kun je niet verkopen.' };
    const v = JV.sellValue(o);
    if (v < 0 && S.coins < -v) return { ok: false, reason: 'Je hebt ' + (-v) + ' munten nodig om dit weg te halen.' };
    S.coins += v;
    S.objects = S.objects.filter((x) => x.id !== o.id);
    if (d.cat === 'woning') {
      S.families = S.families.filter((f) => f.houseId !== o.id);
    }
    if (d.cat === 'werk') {
      for (const f of S.families) for (const m of f.members) if (m.workId === o.id) { m.workId = null; m.job = null; }
    }
    rebuild();
    if (d.cat === 'werk') assignJobs();
    if (d.cat === 'natuur') JV.addXp(1);
    initAgents();
    return { ok: true, value: v };
  };

  // --- gezinnen -------------------------------------------------------------
  function freeSurname() {
    const free = JV.SURNAMES.filter((s) => !S.usedSurnames.includes(s));
    const s = free.length ? pick(free) : pick(JV.SURNAMES) + ' ' + (S.families.length + 1);
    S.usedSurnames.push(s);
    return s;
  }
  function firstName(g, used) {
    const list = g === 'm' ? JV.NAMES_M : JV.NAMES_V;
    for (let i = 0; i < 20; i++) { const n = pick(list); if (!used.includes(n)) { used.push(n); return n; } }
    return pick(list);
  }

  function makeFamily(house) {
    const d = C[house.type];
    const surname = freeSurname();
    const members = [];
    const used = [];
    const r = rnd();
    let parents;
    if (r < 0.22) parents = [rnd() < 0.5 ? 'm' : 'v'];
    else if (r < 0.34) parents = ['m', 'm'];
    else if (r < 0.46) parents = ['v', 'v'];
    else parents = ['m', 'v'];
    for (const g of parents) {
      members.push({ id: S.nextId++, first: firstName(g, used), look: JV.randomLook(rnd, 'volw', g), workId: null, job: null });
    }
    const kids = Math.floor(rnd() * (d.maxKids + 1));
    const ages = ['baby', 'peuter', 'kind', 'kind', 'tiener'];
    for (let i = 0; i < kids; i++) {
      const g = rnd() < 0.5 ? 'm' : 'v';
      const age = pick(ages);
      members.push({ id: S.nextId++, first: firstName(g, used), look: JV.randomLook(rnd, age, g), workId: null, job: null });
    }
    const fam = { id: S.nextId++, surname, houseId: house.id, members, pet: rnd() < 0.55 ? pick(JV.PETS).id : null, hearts: 2, giftReady: false };
    S.families.push(fam);
    assignJobs();
    updateHearts();
    initAgents();
    JV.emit('family', fam);
    progressTasks('family', {});
    return fam;
  }

  function workBuildings() { return S.objects.filter((o) => C[o.type].cat === 'werk'); }
  JV.workersOf = (b) => {
    const list = [];
    for (const f of S.families) for (const m of f.members) if (m.workId === b.id && m.look.age === 'volw') list.push({ m, f });
    return list;
  };
  JV.childrenAt = (b) => {
    const list = [];
    for (const f of S.families) for (const m of f.members) if (m.workId === b.id && m.look.age !== 'volw') list.push({ m, f });
    return list;
  };

  function assignJobs() {
    const builds = workBuildings();
    const count = new Map(builds.map((b) => [b.id, 0]));
    const kidCount = new Map(builds.map((b) => [b.id, 0]));
    for (const f of S.families) for (const m of f.members) {
      if (m.workId != null && !count.has(m.workId)) { m.workId = null; m.job = null; }
      if (m.workId != null) (m.look.age === 'volw' ? count : kidCount).set(m.workId, (m.look.age === 'volw' ? count : kidCount).get(m.workId) + 1);
    }
    for (const f of S.families) {
      const home = R.byId.get(f.houseId);
      for (const m of f.members) {
        if (m.workId != null) continue;
        const isAdult = m.look.age === 'volw';
        const isSmall = m.look.age === 'baby' || m.look.age === 'peuter';
        if (!isAdult && !isSmall) continue;
        let best = null, bestD = 1e9;
        for (const b of builds) {
          const d = C[b.type];
          if (isAdult && count.get(b.id) >= d.slots) continue;
          if (isSmall && (b.type !== 'opvang' || kidCount.get(b.id) >= d.childSlots)) continue;
          const dist = Math.abs(b.gx - home.gx) + Math.abs(b.gy - home.gy);
          if (dist < bestD) { bestD = dist; best = b; }
        }
        if (best) {
          m.workId = best.id;
          if (isAdult) { const jobs = C[best.type].jobs; m.job = jobs[count.get(best.id) % jobs.length]; count.set(best.id, count.get(best.id) + 1); }
          else { m.job = null; kidCount.set(best.id, kidCount.get(best.id) + 1); }
        }
      }
    }
  }
  JV.assignJobs = assignJobs;

  function updateHearts() {
    const decoTypes = ['tree', 'flowers', 'bench', 'lantern', 'fountain'];
    const nice = ['bench', 'lantern', 'fountain'];
    for (const f of S.families) {
      const h = R.byId.get(f.houseId);
      if (!h) continue;
      let hearts = 1;
      const adults = f.members.filter((m) => m.look.age === 'volw');
      if (adults.every((m) => m.workId != null)) hearts++;
      let deco = 0, hasNice = false;
      for (const o of S.objects) {
        if (!decoTypes.includes(o.type)) continue;
        const dist = Math.max(Math.abs(o.gx - h.gx - 0.5), Math.abs(o.gy - h.gy - 0.5));
        if (dist <= 4.5) deco++;
        if (nice.includes(o.type) && dist <= 5.5) hasNice = true;
      }
      if (deco >= 3) hearts++;
      if (hasNice) hearts++;
      const working = adults.filter((m) => m.workId != null);
      if (working.length && working.every((m) => findPath(f.houseId, m.workId))) hearts++;
      f.hearts = Math.min(5, hearts);
    }
  }
  JV.updateHearts = updateHearts;

  JV.unlocksForLevel = (lvl) => Object.keys(C).filter((k) => C[k].level === lvl);

  // --- munten en XP ---------------------------------------------------------
  JV.addCoins = function (n) {
    S.coins += n;
    if (n > 0) progressTasks('earn', { n });
  };
  JV.addXp = function (n) {
    S.xp += n;
    const lvl = JV.levelFromXp(S.xp);
    while (S.level < lvl) {
      S.level++;
      S.diamonds += 3;
      JV.emit('levelup', { level: S.level, unlocks: JV.unlocksForLevel(S.level) });
    }
    JV.emit('xp', n);
  };

  JV.collect = function (b) {
    const n = Math.floor(b.pending || 0);
    if (n <= 0) return 0;
    b.pending -= n;
    JV.addCoins(n);
    progressTasks('collect', {});
    return n;
  };

  JV.openGift = function (fam) {
    if (!fam.giftReady) return null;
    fam.giftReady = false;
    if (rnd() < 0.25) { S.diamonds += 1; return { diamonds: 1 }; }
    const coins = 30 + Math.floor(rnd() * 5) * 10;
    JV.addCoins(coins);
    return { coins };
  };

  JV.finishWork = function (game, stars, mult) {
    S.worked[game] = (S.worked[game] || 0) + 1;
    const coins = Math.round(JV.STAR_COINS[stars - 1] * (mult || 1));
    const xp = JV.STAR_XP[stars - 1];
    JV.addCoins(coins);
    JV.addXp(xp);
    progressTasks('work', { game, stars });
    return { coins, xp };
  };

  // --- wegen zoeken ---------------------------------------------------------
  function roadNeighborsOf(o) {
    const d = C[o.type], out = [];
    const tryAdd = (x, y) => { if (JV.isRoad(x, y)) out.push(idx(x, y)); };
    for (let x = 0; x < d.w; x++) { tryAdd(o.gx + x, o.gy - 1); tryAdd(o.gx + x, o.gy + d.h); }
    for (let y = 0; y < d.h; y++) { tryAdd(o.gx - 1, o.gy + y); tryAdd(o.gx + d.w, o.gy + y); }
    return out;
  }
  function findPath(fromId, toId) {
    const key = fromId + '-' + toId;
    if (R.pathCache.has(key)) return R.pathCache.get(key);
    const a = R.byId.get(fromId), b = R.byId.get(toId);
    let result = null;
    if (a && b) {
      const goals = new Set(roadNeighborsOf(b));
      const prev = new Map();
      const queue = roadNeighborsOf(a);
      queue.forEach((s) => prev.set(s, -1));
      let found = -1;
      for (let qi = 0; qi < queue.length; qi++) {
        const cur = queue[qi];
        if (goals.has(cur)) { found = cur; break; }
        const cx = cur % G, cy = Math.floor(cur / G);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (!JV.isRoad(nx, ny)) continue;
          const ni = idx(nx, ny);
          if (prev.has(ni)) continue;
          prev.set(ni, cur); queue.push(ni);
        }
      }
      if (found !== -1) {
        result = [];
        for (let c = found; c !== -1; c = prev.get(c)) result.push({ x: c % G, y: Math.floor(c / G) });
        result.reverse();
      }
    }
    R.pathCache.set(key, result);
    return result;
  }
  JV.findPath = findPath;

  // --- bewoners die rondlopen -----------------------------------------------
  function shouldBeAway(t, off, small) {
    return small ? t > 0.1 + off && t < 0.5 + off : t > 0.06 + off && t < 0.56 + off;
  }
  function initAgents() {
    R.agents = [];
    if (!S) return;
    for (const f of S.families) for (const m of f.members) {
      if (m.workId == null) continue;
      const off = ((m.id * 37) % 100) / 100 * 0.07;
      const small = m.look.age !== 'volw';
      const away = shouldBeAway(S.time, off, small);
      R.agents.push({ m, f, off, small, state: away ? 'away' : 'home', path: null, p: 0, walk: 0 });
    }
    // wie niet werkt of naar de opvang gaat, maakt overdag een wandelingetje
    for (const f of S.families) for (const m of f.members) {
      if (m.workId != null || m.look.age === 'baby' || m.look.age === 'peuter') continue;
      R.agents.push({ m, f, stroll: true, small: m.look.age !== 'volw', state: 'home', wait: 2 + rnd() * 20, path: null, p: 0, walk: 0 });
    }
  }
  JV.initAgents = initAgents;

  function updateAgents(dt) {
    const speed = 1.7; // tegels per seconde
    const day = S.time > 0.06 && S.time < 0.58;
    for (const a of R.agents) {
      if (a.stroll) { updateStroller(a, dt, day, speed); continue; }
      const want = shouldBeAway(S.time, a.off, a.small);
      if (a.state === 'home' && want) startWalk(a, a.f.houseId, a.m.workId, 'away');
      else if (a.state === 'away' && !want) startWalk(a, a.m.workId, a.f.houseId, 'home');
      if (a.state === 'walking') {
        a.p += speed * dt * (a.small ? 0.8 : 1);
        a.walk += dt * 10;
        if (a.p >= a.path.length - 1) a.state = a.target;
      }
    }
  }
  function updateStroller(a, dt, day, speed) {
    if (a.state === 'walking') {
      a.p += speed * dt * 0.75; a.walk += dt * 9;
      if (a.p >= a.path.length - 1) { a.state = a.target; a.wait = a.state === 'there' ? 4 + rnd() * 8 : 12 + rnd() * 25; }
      return;
    }
    a.wait -= dt;
    if (a.wait > 0) return;
    if (a.state === 'there') { startWalk(a, a.dest, a.f.houseId, 'home'); if (a.state !== 'walking') a.wait = 10; return; }
    if (!day) { a.wait = 5; return; }
    const spots = S.objects.filter((o) => o.id !== a.f.houseId && ['woning', 'werk', 'eigen'].includes(C[o.type].cat));
    if (!spots.length) { a.wait = 10; return; }
    a.dest = pick(spots).id;
    startWalk(a, a.f.houseId, a.dest, 'there');
    if (a.state !== 'walking') { a.state = 'home'; a.wait = 8 + rnd() * 10; }
  }
  function startWalk(a, from, to, target) {
    const path = findPath(from, to);
    if (!path || !path.length) { a.state = target; return; }
    a.path = path; a.p = 0; a.state = 'walking'; a.target = target;
  }
  JV.agentPos = function (a) {
    const i = Math.min(Math.floor(a.p), a.path.length - 1);
    const j = Math.min(i + 1, a.path.length - 1);
    const t = a.p - i;
    const p0 = a.path[i], p1 = a.path[j];
    return { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t, dx: p1.x - p0.x, dy: p1.y - p0.y };
  };

  // --- tijd en opbrengst ----------------------------------------------------
  let heartTimer = 0;
  JV.update = function (dt) {
    if (!S) return;
    S.time += dt / JV.DAY_SECONDS;
    if (S.time >= 1) {
      S.time -= 1; S.day++;
      for (const f of S.families) if (f.hearts >= 4) f.giftReady = true;
      JV.emit('newday', S.day);
    }
    for (const b of S.objects) {
      const d = C[b.type];
      if (d.cat !== 'werk') continue;
      const workers = JV.workersOf(b).length;
      if (!workers) continue;
      const perDay = workers * 25 * d.mult;
      b.pending = Math.min((b.pending || 0) + perDay * dt / JV.DAY_SECONDS, perDay * 3);
    }
    updateAgents(dt);
    heartTimer -= dt;
    if (heartTimer <= 0) { heartTimer = 3; updateHearts(); }
  };

  // 0 = dag, 1 = nacht
  JV.darkness = function () {
    const t = S.time;
    if (t < 0.6) return 0;
    if (t < 0.7) return (t - 0.6) / 0.1;
    if (t < 0.92) return 1;
    return 1 - (t - 0.92) / 0.08;
  };
  JV.clockText = function () {
    const mins = Math.floor(((S.time * 24 + 7) % 24) * 60);
    const h = Math.floor(mins / 60), m = Math.floor(mins % 60 / 10) * 10;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  };

  // --- taken ----------------------------------------------------------------
  const TUTORIAL = [
    { type: 'work', game: 'super', n: 1, text: 'Werk één keer in de supermarkt', coins: 60, xp: 15 },
    { type: 'build', what: 'road', n: 3, text: 'Leg 3 stukjes weg', coins: 40, xp: 10 },
    { type: 'build', what: 'tree', n: 1, text: 'Zet een boom neer', coins: 30, xp: 10 },
    { type: 'build', what: 'house_small', n: 1, text: 'Bouw een rijtjeshuis', coins: 100, xp: 25 },
    { type: 'family', n: 1, text: 'Laat een gezin in je stad wonen', coins: 80, xp: 20 },
  ];

  function randomTask() {
    const L = S.level;
    const options = [];
    const deco = ['tree', 'flowers', 'bench', 'lantern'].filter((k) => C[k].level <= L);
    const dk = pick(deco);
    const n = dk === 'tree' ? 3 + Math.floor(rnd() * 3) : 2;
    options.push({ type: 'build', what: dk, n, text: 'Zet ' + n + ' × ' + C[dk].name.toLowerCase() + ' neer', coins: 40 + n * 10, xp: 15 });
    options.push({ type: 'build', what: 'road', n: 5, text: 'Leg 5 stukjes weg', coins: 50, xp: 12 });
    const games = Object.keys(C).filter((k) => C[k].cat === 'werk' && S.objects.some((o) => o.type === k));
    if (games.length) {
      const g = C[pick(games)];
      options.push({ type: 'work', game: g.game, n: 2, text: 'Werk 2 keer in de ' + g.name.toLowerCase(), coins: 80, xp: 25 });
      options.push({ type: 'stars3', n: 1, text: 'Haal 3 sterren in een mini-game', coins: 70, xp: 20 });
    }
    const homes = Object.keys(C).filter((k) => C[k].cat === 'woning' && C[k].level <= L);
    const hk = pick(homes);
    options.push({ type: 'build', what: hk, n: 1, text: 'Bouw een ' + C[hk].name.toLowerCase(), coins: 120, xp: 30 });
    options.push({ type: 'earn', n: 200 + L * 50, text: 'Verdien ' + (200 + L * 50) + ' munten', coins: 60, xp: 20 });
    if (S.objects.some((o) => C[o.type].cat === 'werk' && JV.workersOf(o).length)) {
      options.push({ type: 'collect', n: 2, text: 'Haal 2 keer munten op bij een gebouw', coins: 50, xp: 15 });
    }
    const builds = Object.keys(C).filter((k) => C[k].cat === 'werk' && C[k].level <= L && !S.objects.some((o) => o.type === k));
    if (builds.length) {
      const bk = pick(builds);
      options.push({ type: 'build', what: bk, n: 1, text: 'Bouw een ' + C[bk].name.toLowerCase(), coins: 200, xp: 40 });
    }
    const active = new Set(S.tasks.map((t) => t.text));
    const fresh = options.filter((o) => !active.has(o.text));
    return Object.assign({ progress: 0, done: false }, pick(fresh.length ? fresh : options));
  }

  function fillTasks() {
    while (S.tasks.length < 3) {
      if (S.tutorialStep < TUTORIAL.length) {
        S.tasks.push(Object.assign({ progress: 0, done: false, tutorial: true }, TUTORIAL[S.tutorialStep]));
        S.tutorialStep++;
      } else S.tasks.push(randomTask());
    }
  }

  function progressTasks(kind, data) {
    if (!S) return;
    let changed = false;
    for (const t of S.tasks) {
      if (t.done) continue;
      let add = 0;
      if (t.type === kind) {
        if (kind === 'build' && t.what === data.type) add = 1;
        if (kind === 'work' && t.game === data.game) add = 1;
        if (kind === 'family' || kind === 'collect') add = 1;
        if (kind === 'earn') add = data.n;
      }
      if (t.type === 'stars3' && kind === 'work' && data.stars === 3) add = 1;
      if (add) { t.progress = Math.min(t.n, t.progress + add); if (t.progress >= t.n) t.done = true; changed = true; }
    }
    if (changed) JV.emit('tasks');
  }
  JV.claimTask = function (t) {
    if (!t.done) return null;
    S.tasks = S.tasks.filter((x) => x !== t);
    JV.addCoins(t.coins);
    JV.addXp(t.xp);
    fillTasks();
    JV.emit('tasks');
    return { coins: t.coins, xp: t.xp };
  };

  // --- ongedaan maken (alleen in de bouwmodus) ------------------------------
  const undoStack = [];
  JV.snapshot = function () {
    undoStack.push(JSON.stringify({ objects: S.objects, families: S.families, coins: S.coins, xp: S.xp, level: S.level, diamonds: S.diamonds, tasks: S.tasks, tutorialStep: S.tutorialStep, usedSurnames: S.usedSurnames, nextId: S.nextId }));
    if (undoStack.length > 25) undoStack.shift();
  };
  JV.canUndo = () => undoStack.length > 0;
  JV.undo = function () {
    const raw = undoStack.pop();
    if (!raw) return false;
    Object.assign(S, JSON.parse(raw));
    rebuild(); initAgents(); updateHearts();
    return true;
  };
  JV.clearUndo = () => { undoStack.length = 0; };
})(window.JV);
