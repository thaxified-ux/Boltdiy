// Jaylinn Village – de overige mini-games: bakkerij, ijssalon, café, bloemenwinkel, kapper,
// dierenopvang, school, ziekenhuis, dierenarts, brandweer en busstation.
(function (JV) {
  const { el, pick, shuffle, shake, pop, customer, rnd } = JV.mg;
  const byId = (list, id) => list.find((x) => x.id === id);

  // Een kleine ronde met sterren: geeft 3 / 2 / 1 sterren op basis van fouten.
  const starsByMistakes = (m, limits) => (m <= limits[0] ? 3 : m <= limits[1] ? 2 : 1);

  // ------------------------------------------------------------------------
  // Samenstellen: de klant bestelt iets, jij zet het uit losse onderdelen bij elkaar.
  // Wordt gebruikt voor de bakkerij, het café, de ijssalon en de bloemenwinkel.
  // ------------------------------------------------------------------------
  function assembleGame(cfg) {
    return {
      title: cfg.title,
      intro: cfg.intro,
      start(body, api, worked) {
        const orders = cfg.makeOrders(worked);
        const total = orders.length * cfg.perOrder;
        let elapsed = 0, oi = 0, tray = [], mistakes = 0, tries = 0, done = 0, finished = false, busy = false;
        body.innerHTML = '';
        const top = el('div', 'as-top');
        const cust = el('div', 'as-cust');
        const card = el('div', 'as-order');
        top.append(cust, card);
        const trayEl = el('div', 'as-tray');
        const msg = el('div', 'rs-msg', '');
        const grid = el('div', 'as-items');
        const btns = el('div', 'rs-btns');
        const ok = el('button', 'btn btn-primary', '✓ Klaar!'); ok.type = 'button';
        const clear = el('button', 'btn', '🗑️ Leeg'); clear.type = 'button';
        btns.append(ok, clear);
        const kit = el('div', 'rs-kitchen'); kit.append(grid, btns);
        body.append(top, trayEl, msg, kit);

        const itemBtns = cfg.items.map((it) => {
          const b = el('button', 'rs-ing', '<span class="e">' + it.e + '</span><span class="n">' + it.n + '</span>'); b.type = 'button';
          b.addEventListener('click', () => addItem(it, b));
          grid.append(b);
          return { it, b };
        });

        function renderOrder() {
          const o = orders[oi];
          const cu = o.cu;
          cust.innerHTML = '';
          const av = JV.personCanvas(cu.look, 92);
          cust.append(av, el('div', 'sm-name', cu.name), el('div', 'speech', cfg.greet));
          card.innerHTML = '';
          card.append(el('div', 'as-title', '<span class="big">' + o.e + '</span> ' + o.name));
          const parts = el('div', 'as-parts');
          o.parts.forEach((id, i) => {
            const chip = el('span', 'as-chip', (cfg.ordered ? '<i>' + (i + 1) + '</i>' : '') + byId(cfg.items, id).e);
            parts.append(chip);
            if (cfg.ordered && i < o.parts.length - 1) parts.append(el('span', 'as-arrow', '→'));
          });
          card.append(parts, el('div', 'muted small', cfg.ordered ? 'Tik de onderdelen in deze volgorde.' : 'Je hebt precies deze onderdelen nodig.'));
          api.setScore('Klant ' + (oi + 1) + ' van ' + orders.length);
          renderTray();
        }
        function renderTray() {
          const o = orders[oi];
          trayEl.innerHTML = '';
          for (let i = 0; i < o.parts.length; i++) {
            const slot = el('span', 'as-slot' + (tray[i] ? ' on' : ''), tray[i] ? byId(cfg.items, tray[i]).e : '');
            trayEl.append(slot);
          }
          const hintId = tries >= 2 && cfg.ordered ? o.parts[tray.length] : null;
          itemBtns.forEach(({ it, b }) => b.classList.toggle('hint', it.id === hintId));
        }
        function addItem(it, b) {
          if (finished || busy) return;
          const o = orders[oi];
          if (tray.length >= o.parts.length) { shake(trayEl); msg.textContent = 'Het is vol. Tik op Klaar! of Leeg.'; return; }
          tray.push(it.id); pop(b); JV.sfx('tap'); renderTray();
        }
        function check() {
          if (finished || busy) return;
          const o = orders[oi];
          if (tray.length < o.parts.length) { shake(trayEl); msg.textContent = 'Er ontbreekt nog iets.'; return; }
          const same = cfg.ordered ? tray.every((t, i) => t === o.parts[i]) : tray.slice().sort().join() === o.parts.slice().sort().join();
          if (same) {
            busy = true; done++; JV.sfx('coin');
            msg.textContent = pick(cfg.thanks);
            setTimeout(() => {
              busy = false; oi++; tray = []; tries = 0;
              if (oi >= orders.length) finish(); else { renderOrder(); msg.textContent = ''; }
            }, 800);
          } else {
            mistakes++; tries++; JV.sfx('nope'); shake(trayEl);
            msg.textContent = cfg.ordered ? 'Niet helemaal. Kijk goed naar de volgorde!' : 'Dat is niet wat de klant wilde. Kijk goed naar het plaatje!';
            tray = []; renderTray();
          }
        }
        function finish() {
          if (finished) return;
          finished = true;
          let stars;
          if (done >= orders.length) stars = elapsed <= total * 0.6 && mistakes <= 2 ? 3 : elapsed <= total * 0.85 ? 2 : 1;
          else stars = done >= orders.length / 2 ? 2 : 1;
          if (mistakes > 5) stars = Math.max(1, stars - 1);
          api.end(stars);
        }
        ok.addEventListener('click', check);
        clear.addEventListener('click', () => { tray = []; renderTray(); });
        renderOrder();
        const timer = setInterval(() => {
          if (finished) return;
          elapsed += 0.1;
          api.setTimer(Math.max(0, 1 - elapsed / total));
          if (elapsed >= total) finish();
        }, 100);
        return () => clearInterval(timer);
      },
    };
  }

  function makeOrders(n, recipes) {
    const out = []; let last = null;
    for (let i = 0; i < n; i++) {
      let r = recipes(); let guard = 0;
      while (last && r.name === last && guard++ < 8) r = recipes();
      last = r.name; out.push(Object.assign({ cu: customer() }, r));
    }
    return out;
  }

  const BAKERY_ITEMS = [
    { id: 'meel', e: '🌾', n: 'Meel' }, { id: 'ei', e: '🥚', n: 'Ei' }, { id: 'melk', e: '🥛', n: 'Melk' },
    { id: 'boter', e: '🧈', n: 'Boter' }, { id: 'suiker', e: '🍬', n: 'Suiker' }, { id: 'chocola', e: '🍫', n: 'Chocola' },
    { id: 'aardbei', e: '🍓', n: 'Aardbei' },
  ];
  const BAKERY = [
    { e: '🥐', name: 'Croissant', parts: ['meel', 'boter', 'ei'] }, { e: '🍰', name: 'Aardbeientaart', parts: ['meel', 'ei', 'aardbei'] },
    { e: '🍪', name: 'Koekje', parts: ['meel', 'suiker', 'chocola'] }, { e: '🍩', name: 'Donut', parts: ['meel', 'ei', 'suiker'] },
    { e: '🍞', name: 'Brood', parts: ['meel', 'melk'] }, { e: '🧁', name: 'Muffin', parts: ['meel', 'melk', 'chocola'] },
    { e: '🥧', name: 'Fruittaart', parts: ['meel', 'boter', 'aardbei'] },
  ];
  const bakkerij = assembleGame({
    title: '🥐 Bakkerij', ordered: true, perOrder: 15, items: BAKERY_ITEMS, greet: 'Mag ik graag iets lekkers?',
    thanks: ['Mmm, wat lekker!', 'Vers uit de oven!', 'Dankjewel!'],
    intro: '<p>De klant bestelt iets lekkers. Op het kaartje zie je het <b>recept</b> met nummers.</p><p>Tik de ingrediënten <b>in de goede volgorde</b> en tik dan op Klaar!</p><div class="mg-demo">① 🌾 → ② 🥛 = 🍞</div>',
    makeOrders: (w) => makeOrders(w >= 6 ? 6 : 5, () => pick(BAKERY.filter((r) => w >= 3 || r.parts.length <= 3))),
  });

  const ICE_ITEMS = [
    { id: 'aardbei', e: '🍓', n: 'Aardbei' }, { id: 'chocola', e: '🍫', n: 'Chocola' }, { id: 'citroen', e: '🍋', n: 'Citroen' },
    { id: 'banaan', e: '🍌', n: 'Banaan' }, { id: 'druif', e: '🍇', n: 'Druif' }, { id: 'mango', e: '🥭', n: 'Mango' },
  ];
  const ijssalon = assembleGame({
    title: '🍦 IJssalon', ordered: true, perOrder: 13, items: ICE_ITEMS, greet: 'Een ijsje alsjeblieft!',
    thanks: ['Wat een mooi ijsje!', 'Lekker koud!', 'Dankjewel!'],
    intro: '<p>De klant wil een ijsje met bolletjes. Tik de <b>smaken</b> van <b>onder naar boven</b>, in de volgorde van het kaartje.</p><div class="mg-demo">① 🍓 ② 🍫 = 🍦</div>',
    makeOrders: (w) => makeOrders(6, () => {
      const n = w >= 5 ? 3 + (rnd() < 0.4 ? 1 : 0) : 2 + (rnd() < 0.5 ? 1 : 0);
      const parts = Array.from({ length: n }, () => pick(ICE_ITEMS).id);
      return { e: '🍦', name: n + ' bolletjes', parts };
    }),
  });

  const CAFE_ITEMS = [
    { id: 'koffie', e: '☕', n: 'Koffie' }, { id: 'thee', e: '🫖', n: 'Thee' }, { id: 'melk', e: '🥛', n: 'Melk' },
    { id: 'ijs', e: '🧊', n: 'IJs' }, { id: 'honing', e: '🍯', n: 'Honing' }, { id: 'chocola', e: '🍫', n: 'Chocola' },
    { id: 'citroen', e: '🍋', n: 'Citroen' },
  ];
  const CAFE = [
    { e: '☕', name: 'Koffie met melk', parts: ['koffie', 'melk'] }, { e: '🥤', name: 'IJskoffie', parts: ['koffie', 'ijs', 'melk'] },
    { e: '🍵', name: 'Thee met honing', parts: ['thee', 'honing'] }, { e: '🍫', name: 'Chocolademelk', parts: ['melk', 'chocola'] },
    { e: '🥤', name: 'IJsthee', parts: ['thee', 'ijs', 'citroen'] }, { e: '☕', name: 'Cappuccino', parts: ['koffie', 'melk', 'chocola'] },
  ];
  const cafe = assembleGame({
    title: '☕ Café', ordered: false, perOrder: 14, items: CAFE_ITEMS, greet: 'Mag ik een drankje?',
    thanks: ['Gezellig!', 'Precies wat ik wilde!', 'Dankjewel!'],
    intro: '<p>De klant bestelt een drankje. Op het kaartje zie je wat erin moet.</p><p>Tik precies die <b>onderdelen</b> en tik op Klaar!</p><div class="mg-demo">☕ + 🥛 = Koffie met melk</div>',
    makeOrders: (w) => makeOrders(w >= 6 ? 6 : 5, () => pick(CAFE.filter((r) => w >= 3 || r.parts.length <= 2 || rnd() < 0.5))),
  });

  const FLOWER_ITEMS = [
    { id: 'roos', e: '🌹', n: 'Roos' }, { id: 'tulp', e: '🌷', n: 'Tulp' }, { id: 'zonnebloem', e: '🌻', n: 'Zonnebloem' },
    { id: 'madelief', e: '🌼', n: 'Madelief' }, { id: 'bloesem', e: '🌸', n: 'Bloesem' }, { id: 'hibiscus', e: '🌺', n: 'Hibiscus' },
  ];
  const bloemen = assembleGame({
    title: '💐 Bloemenwinkel', ordered: false, perOrder: 15, items: FLOWER_ITEMS, greet: 'Een boeket voor mijn buurvrouw!',
    thanks: ['Wat een mooi boeket!', 'Wat ruikt dat lekker!', 'Dankjewel!'],
    intro: '<p>De klant wil een boeket. Kijk goed <b>welke bloemen</b> en <b>hoeveel</b>.</p><p>Tik de bloemen in de vaas en tik op Klaar!</p><div class="mg-demo">🌹 🌹 🌻 = 💐</div>',
    makeOrders: (w) => makeOrders(5, () => {
      const n = w >= 5 ? 4 + (rnd() < 0.5 ? 1 : 0) : 3 + (rnd() < 0.4 ? 1 : 0);
      const kinds = shuffle(FLOWER_ITEMS).slice(0, 2 + (rnd() < 0.3 ? 1 : 0));
      const parts = Array.from({ length: n }, (_, i) => (i < kinds.length ? kinds[i].id : pick(kinds).id));
      return { e: '💐', name: 'Boeket van ' + n + ' bloemen', parts };
    }),
  });

  // ------------------------------------------------------------------------
  // Kapper: maak het kapsel van de foto na
  // ------------------------------------------------------------------------
  const kapper = {
    title: '💇 Kapper',
    intro: '<p>De klant laat een <b>foto</b> zien van het kapsel dat hij of zij wil.</p><p>Kies de goede <b>haarstijl</b> en <b>haarkleur</b> en tik op Klaar!</p><div class="mg-demo">📷 foto = 💇 jouw kapsel</div>',
    start(body, api, worked) {
      const styles = JV.HAIR_STYLES.filter((h) => h.id !== 'hoofddoek');
      const colors = JV.HAIR_COLORS;
      const nCust = 4;
      const total = 100;
      let ci = 0, elapsed = 0, mistakes = 0, done = 0, finished = false, busy = false;
      let cu, target, cur;
      body.innerHTML = '';
      const wrap = el('div', 'kp-wrap');
      const photo = el('div', 'kp-photo', '<div class="lbl">📷 De foto</div>');
      const mine = el('div', 'kp-mine', '<div class="lbl">💺 Jouw knipwerk</div>');
      const faces = el('div', 'kp-faces'); faces.append(photo, mine);
      const styleRow = el('div', 'kp-styles');
      const colorRow = el('div', 'swatches kp-colors');
      const msg = el('div', 'rs-msg', '');
      const ok = el('button', 'btn btn-primary btn-big', '✓ Klaar!'); ok.type = 'button';
      wrap.append(faces, el('div', 'opt-label', 'Haarstijl'), styleRow, el('div', 'opt-label', 'Haarkleur'), colorRow, msg, ok);
      body.append(wrap);
      let photoCv = null, mineCv = null;
      const thumbs = [];

      function look(style, color) { return Object.assign({}, cu.look, { hair: style, hairColor: color, glasses: false, beard: false, age: 'volw' }); }
      function newCustomer() {
        cu = customer();
        const startStyle = 'kort', startColor = colors[0];
        let ts, tc;
        do { ts = pick(styles).id; tc = pick(colors); } while (ts === startStyle && tc === startColor);
        target = { style: ts, color: tc }; cur = { style: startStyle, color: startColor };
        if (photoCv) photoCv.remove(); if (mineCv) mineCv.remove();
        photoCv = JV.personCanvas(look(ts, tc), 150); photoCv.className = 'kp-cv'; photo.append(photoCv);
        mineCv = JV.personCanvas(look(cur.style, cur.color), 150); mineCv.className = 'kp-cv'; mine.append(mineCv);
        photo.querySelector('.lbl').textContent = '📷 ' + cu.name;
        renderControls();
        api.setScore('Klant ' + (ci + 1) + ' van ' + nCust);
        msg.textContent = '';
      }
      function renderControls() {
        styleRow.innerHTML = ''; thumbs.length = 0;
        styles.forEach((h) => {
          const b = el('button', 'hairopt' + (cur.style === h.id ? ' on' : '')); b.type = 'button';
          const cv = JV.personCanvas(look(h.id, cur.color), 64);
          b.append(cv, el('span', '', h.label));
          b.addEventListener('click', () => { cur.style = h.id; JV.sfx('tap'); renderControls(); });
          styleRow.append(b);
        });
        colorRow.innerHTML = '';
        colors.forEach((c) => {
          const b = el('button', 'swatch' + (cur.color === c ? ' on' : '')); b.type = 'button'; b.style.background = c; b.setAttribute('aria-label', 'Haarkleur');
          b.addEventListener('click', () => { cur.color = c; JV.sfx('tap'); renderControls(); });
          colorRow.append(b);
        });
        JV.paintPersonCanvas(mineCv, look(cur.style, cur.color));
      }
      ok.addEventListener('click', () => {
        if (finished || busy) return;
        if (cur.style === target.style && cur.color === target.color) {
          busy = true; done++; ci++; JV.sfx('coin'); msg.textContent = pick(['Wat een mooi kapsel!', 'Precies zoals op de foto!', 'Dankjewel!']);
          setTimeout(() => { busy = false; if (ci >= nCust) finish(); else newCustomer(); }, 900);
        } else {
          mistakes++; JV.sfx('nope'); shake(mine);
          msg.textContent = cur.style !== target.style ? 'De haarstijl is nog niet goed. Kijk nog eens naar de foto.' : 'Bijna! Let op de kleur van het haar.';
        }
      });
      function finish() {
        if (finished) return;
        finished = true;
        api.end(done >= nCust ? starsByMistakes(mistakes, [1, 3]) : done >= 2 ? 2 : 1);
      }
      newCustomer();
      const timer = setInterval(() => {
        if (finished) return;
        elapsed += 0.1; api.setTimer(Math.max(0, 1 - elapsed / total));
        if (elapsed >= total) finish();
      }, 100);
      return () => clearInterval(timer);
    },
  };

  // ------------------------------------------------------------------------
  // Dierenopvang: voeren, wassen en knuffelen
  // ------------------------------------------------------------------------
  const dierenopvang = {
    title: '🐾 Dierenopvang',
    intro: '<p>Elk dier heeft 3 dingen nodig: <b>🍖 voeren</b>, <b>🛁 wassen</b> en <b>🤗 knuffelen</b>.</p><p>Kies onderaan wat je wilt doen. Voeren: <b>tik</b> op het dier. Wassen: <b>veeg</b> over het dier. Knuffelen: tik <b>3 keer</b>.</p>',
    start(body, api, worked) {
      const n = worked >= 4 ? 5 : 4;
      const total = 75;
      let elapsed = 0, finished = false, tool = null;
      body.innerHTML = '';
      const room = el('div', 'dp-room');
      const msg = el('div', 'rs-msg', 'Kies eerst wat je wilt doen.');
      const bar = el('div', 'op-actions dp-actions');
      body.append(room, msg, bar);
      const used = [];
      const animals = Array.from({ length: n }, () => {
        const pet = pick(JV.PETS);
        const g = rnd() < 0.5 ? JV.NAMES_M : JV.NAMES_V;
        let name = pick(g); while (used.includes(name)) name = pick(g); used.push(name);
        const node = el('div', 'dp-animal'); node.style.touchAction = 'none';
        const a = { pet, name, node, fed: false, wash: 0, cuddle: 0, node_: null };
        node.addEventListener('pointerdown', () => interact(a, 'tap'));
        node.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') interact(a, 'move'); });
        room.append(node);
        return a;
      });
      const tools = [{ id: 'voeren', e: '🍖', n: 'Voeren' }, { id: 'wassen', e: '🛁', n: 'Wassen' }, { id: 'knuffelen', e: '🤗', n: 'Knuffelen' }];
      const toolBtns = tools.map((t) => {
        const b = el('button', 'op-act', '<span class="e">' + t.e + '</span><span class="n">' + t.n + '</span>'); b.type = 'button';
        b.addEventListener('click', () => { tool = t.id; toolBtns.forEach((x) => x.b.classList.toggle('sel', x.t === t)); msg.textContent = t.id === 'wassen' ? 'Veeg met je vinger over het dier.' : 'Tik op het dier.'; JV.sfx('tap'); });
        bar.append(b);
        return { t, b };
      });
      const isDone = (a) => a.fed && a.wash >= 12 && a.cuddle >= 3;
      function render(a) {
        const st = (ok, e) => '<span class="' + (ok ? 'ok' : '') + '">' + e + '</span>';
        a.node.className = 'dp-animal' + (isDone(a) ? ' done' : '');
        a.node.innerHTML = '<div class="dp-pet">' + a.pet.icon + '</div><div class="op-name">' + a.name + '</div><div class="dp-steps">' +
          st(a.fed, '🍖') + st(a.wash >= 12, '🛁') + st(a.cuddle >= 3, '🤗') + '</div>' +
          (a.wash > 0 && a.wash < 12 ? '<div class="dp-foam">🫧</div>' : '') + (isDone(a) ? '<div class="dp-badge">😊</div>' : '');
      }
      function interact(a, kind) {
        if (finished || isDone(a)) return;
        if (!tool) { shake(a.node); msg.textContent = 'Kies eerst onderaan wat je wilt doen.'; return; }
        if (tool === 'voeren' && kind === 'tap' && !a.fed) { a.fed = true; JV.sfx('good'); msg.textContent = a.name + ' eet lekker!'; pop(a.node); }
        else if (tool === 'wassen' && a.wash < 12) { a.wash++; if (a.wash === 12) { JV.sfx('good'); msg.textContent = a.name + ' is lekker schoon!'; pop(a.node); } }
        else if (tool === 'knuffelen' && kind === 'tap' && a.cuddle < 3) { a.cuddle++; JV.sfx('tap'); pop(a.node); if (a.cuddle === 3) msg.textContent = a.name + ' geniet van de knuffel!'; }
        else return;
        render(a);
        if (isDone(a)) { JV.sfx('coin'); const left = animals.filter((x) => !isDone(x)).length; api.setScore('Klaar: ' + (n - left) + ' van ' + n); if (!left) finish(); }
      }
      function finish() {
        if (finished) return;
        finished = true;
        const c = animals.filter(isDone).length;
        api.end(c >= n ? (elapsed <= total * 0.6 ? 3 : elapsed <= total * 0.85 ? 2 : 1) : c >= n / 2 ? 2 : 1);
      }
      animals.forEach(render);
      api.setScore('Klaar: 0 van ' + n);
      const timer = setInterval(() => {
        if (finished) return;
        elapsed += 0.1; api.setTimer(Math.max(0, 1 - elapsed / total));
        if (elapsed >= total) finish();
      }, 100);
      return () => clearInterval(timer);
    },
  };

  // ------------------------------------------------------------------------
  // School: rekenen, tellen en woordjes
  // ------------------------------------------------------------------------
  const WORDS = [
    { e: '🐶', w: 'hond' }, { e: '🏠', w: 'huis' }, { e: '🌳', w: 'boom' }, { e: '🍎', w: 'appel' }, { e: '🚲', w: 'fiets' },
    { e: '☀️', w: 'zon' }, { e: '📚', w: 'boek' }, { e: '🐟', w: 'vis' }, { e: '🌙', w: 'maan' }, { e: '🐱', w: 'poes' },
  ];
  const school = {
    title: '🏫 School',
    intro: '<p>Help de kinderen in de klas! Op het bord staat een <b>som</b>, een <b>plaatje om te tellen</b> of een <b>woord</b>.</p><p>Tik op het goede antwoord.</p><div class="mg-demo">3 + 4 = ❓ → 7</div>',
    start(body, api, worked) {
      const nQ = 8, total = 90;
      let qi = 0, elapsed = 0, mistakes = 0, finished = false, answer = null;
      body.innerHTML = '';
      const board = el('div', 'sc-board');
      const opts = el('div', 'sc-opts');
      const msg = el('div', 'rs-msg', '');
      body.append(board, opts, msg);
      const distract = (c, lo, hi) => { const s = new Set([c]); let g = 0; while (s.size < 3 && g++ < 40) { const v = c + pick([-3, -2, -1, 1, 2, 3, 10, -10]); if (v >= lo && v <= hi) s.add(v); } let v = hi + 1; while (s.size < 3) s.add(v++); return [...s]; };
      function makeQ() {
        const kind = pick(['som', 'som', 'tel', 'woord']);
        if (kind === 'som') {
          const hard = worked >= 8, mid = worked >= 3;
          let a, b, op, c;
          const r = rnd();
          if (hard && r < 0.4) { a = 2 + Math.floor(rnd() * 4); b = 2 + Math.floor(rnd() * 5); op = '×'; c = a * b; }
          else if (r < 0.7) { a = 1 + Math.floor(rnd() * (mid ? 15 : 8)); b = 1 + Math.floor(rnd() * (mid ? 15 : 8)); op = '+'; c = a + b; }
          else { a = 5 + Math.floor(rnd() * (mid ? 15 : 6)); b = 1 + Math.floor(rnd() * (a - 1)); op = '−'; c = a - b; }
          return { text: a + ' ' + op + ' ' + b + ' = ?', answers: shuffle(distract(c, 0, 99).map(String)), right: String(c) };
        }
        if (kind === 'tel') {
          const e = pick(['🍎', '⭐', '🐟', '🎈', '🌷', '🐞']); const c = 3 + Math.floor(rnd() * 7);
          return { text: Array(c).fill(e).join(' '), small: 'Hoeveel zie je?', answers: shuffle(distract(c, 1, 12).map(String)), right: String(c) };
        }
        const w = pick(WORDS); const others = shuffle(WORDS.filter((x) => x !== w)).slice(0, 2);
        return { text: w.e, small: 'Welk woord hoort bij het plaatje?', answers: shuffle([w.w, others[0].w, others[1].w]), right: w.w };
      }
      function next() {
        if (qi >= nQ) { finish(); return; }
        const q = makeQ(); answer = q.right;
        board.innerHTML = '<div class="sc-q">' + q.text + '</div>' + (q.small ? '<div class="sc-small">' + q.small + '</div>' : '');
        opts.innerHTML = '';
        q.answers.forEach((a) => {
          const b = el('button', 'sc-opt', a); b.type = 'button';
          b.addEventListener('click', () => {
            if (finished) return;
            if (a === answer) { JV.sfx('good'); msg.textContent = pick(['Goed zo!', 'Juist!', 'Slim hoor!']); qi++; opts.querySelectorAll('button').forEach((x) => (x.disabled = true)); setTimeout(next, 500); }
            else { mistakes++; JV.sfx('nope'); shake(b); b.disabled = true; b.classList.add('wrong'); msg.textContent = 'Probeer het nog eens.'; }
          });
          opts.append(b);
        });
        api.setScore('Vraag ' + (qi + 1) + ' van ' + nQ);
      }
      function finish() {
        if (finished) return;
        finished = true;
        api.end(qi >= nQ ? starsByMistakes(mistakes, [1, 4]) : qi >= nQ / 2 ? 2 : 1);
      }
      next();
      const timer = setInterval(() => {
        if (finished) return;
        elapsed += 0.1; api.setTimer(Math.max(0, 1 - elapsed / total));
        if (elapsed >= total) finish();
      }, 100);
      return () => clearInterval(timer);
    },
  };

  // ------------------------------------------------------------------------
  // Ziekenhuis en dierenarts: kies het goede hulpmiddel en zoek de plek die pijn doet
  // ------------------------------------------------------------------------
  const TOOLS = [
    { id: 'pleister', e: '🩹', n: 'Pleister' }, { id: 'ijs', e: '🧊', n: 'IJskompres' },
    { id: 'medicijn', e: '💊', n: 'Medicijn' }, { id: 'zalf', e: '🧴', n: 'Zalf' },
  ];
  function doctorGame(cfg) {
    return {
      title: cfg.title,
      intro: cfg.intro,
      start(body, api, worked) {
        const n = 6, total = 90;
        let pi = 0, elapsed = 0, mistakes = 0, finished = false, busy = false, tool = null;
        const list = shuffle(cfg.complaints).slice(0, n);
        body.innerHTML = '';
        const stage = el('div', 'dx-stage');
        const fig = el('div', 'dx-fig');
        const speech = el('div', 'speech dx-say');
        const msg = el('div', 'rs-msg', 'Kies een hulpmiddel en tik op de plek die pijn doet.');
        const bar = el('div', 'op-actions dx-tools');
        stage.append(fig, speech);
        body.append(stage, msg, bar);
        const toolBtns = TOOLS.map((t) => {
          const b = el('button', 'op-act', '<span class="e">' + t.e + '</span><span class="n">' + t.n + '</span>'); b.type = 'button';
          b.addEventListener('click', () => { tool = t.id; toolBtns.forEach((x) => x.b.classList.toggle('sel', x.t === t)); JV.sfx('tap'); });
          bar.append(b);
          return { t, b };
        });
        function show() {
          const c = list[pi];
          fig.innerHTML = '';
          const box = el('div', 'dx-body');
          if (cfg.kind === 'human') { const cu = customer(); c.name = cu.name; box.append(JV.personCanvas(Object.assign({}, cu.look, { age: 'volw' }), 220)); }
          else { const pet = pick(JV.PETS); c.name = pet.name; box.append(el('div', 'dx-pet', pet.icon)); }
          Object.keys(cfg.zones).forEach((z) => {
            const pos = cfg.zones[z];
            const zb = el('button', 'dx-zone' + (z === c.zone ? ' hurt' : ''), z === c.zone ? '❗' : ''); zb.type = 'button';
            zb.style.left = pos.x + '%'; zb.style.top = pos.y + '%'; zb.setAttribute('aria-label', cfg.names[z]);
            zb.title = cfg.names[z];
            zb.addEventListener('click', () => treat(z, zb));
            box.append(zb);
          });
          fig.append(box, el('div', 'sm-name', c.name));
          speech.textContent = '"' + c.say + '"';
          api.setScore((cfg.kind === 'human' ? 'Patiënt ' : 'Dier ') + (pi + 1) + ' van ' + n);
        }
        function treat(z, zb) {
          if (finished || busy) return;
          const c = list[pi];
          if (!tool) { shake(zb); msg.textContent = 'Kies eerst een hulpmiddel onderaan.'; return; }
          if (z !== c.zone) { mistakes++; JV.sfx('nope'); shake(zb); msg.textContent = 'Daar doet het geen pijn. Kijk waar het ❗ staat.'; return; }
          if (tool !== c.tool) { mistakes++; JV.sfx('nope'); shake(zb); msg.textContent = 'Dat helpt hier niet. Probeer iets anders.'; return; }
          busy = true; JV.sfx('coin'); zb.textContent = '✅'; msg.textContent = pick(['Het voelt al beter!', 'Dankjewel!', 'Goed gedaan!']);
          setTimeout(() => { busy = false; pi++; tool = null; toolBtns.forEach((x) => x.b.classList.remove('sel')); if (pi >= n) finish(); else show(); }, 800);
        }
        function finish() {
          if (finished) return;
          finished = true;
          api.end(pi >= n ? starsByMistakes(mistakes, [1, 3]) : pi >= n / 2 ? 2 : 1);
        }
        show();
        const timer = setInterval(() => {
          if (finished) return;
          elapsed += 0.1; api.setTimer(Math.max(0, 1 - elapsed / total));
          if (elapsed >= total) finish();
        }, 100);
        return () => clearInterval(timer);
      },
    };
  }
  const HUMAN_ZONES = { hoofd: { x: 50, y: 38 }, arm: { x: 27, y: 66 }, buik: { x: 53, y: 66 }, been: { x: 50, y: 87 } };
  const ANIMAL_ZONES = { oor: { x: 30, y: 20 }, buik: { x: 50, y: 58 }, poot: { x: 34, y: 84 }, staart: { x: 82, y: 56 } };
  const ziekenhuis = doctorGame({
    title: '🏥 Ziekenhuis', kind: 'human', zones: HUMAN_ZONES, names: { hoofd: 'hoofd', arm: 'arm', buik: 'buik', been: 'been' },
    intro: '<p>De patiënt vertelt wat er aan de hand is. Kies het <b>goede hulpmiddel</b> en tik op de plek die pijn doet (het ❗).</p><div class="mg-demo">🤕 hoofd gestoten → 🧊 op het hoofd</div>',
    complaints: [
      { zone: 'hoofd', tool: 'ijs', say: 'Ik heb mijn hoofd gestoten!' }, { zone: 'hoofd', tool: 'medicijn', say: 'Ik heb zoveel hoofdpijn.' },
      { zone: 'arm', tool: 'pleister', say: 'Ik heb een schaafwond op mijn arm.' }, { zone: 'arm', tool: 'zalf', say: 'Ik heb een rode, jeukende plek.' },
      { zone: 'buik', tool: 'medicijn', say: 'Au, mijn buik doet pijn!' }, { zone: 'buik', tool: 'zalf', say: 'Ik ben verbrand in de zon.' },
      { zone: 'been', tool: 'pleister', say: 'Ik ben op mijn knie gevallen.' }, { zone: 'been', tool: 'ijs', say: 'Mijn been is opgezwollen.' },
      { zone: 'been', tool: 'zalf', say: 'Een mug heeft me gestoken.' },
    ],
  });
  const dierenarts = doctorGame({
    title: '🩺 Dierenarts', kind: 'animal', zones: ANIMAL_ZONES, names: { oor: 'oor', buik: 'buik', poot: 'poot', staart: 'staart' },
    intro: '<p>Het dier is ziek of gewond. Lees wat er aan de hand is, kies het <b>goede hulpmiddel</b> en tik op de plek die pijn doet (het ❗).</p><div class="mg-demo">🐶 gaatje in de poot → 🩹 op de poot</div>',
    complaints: [
      { zone: 'oor', tool: 'zalf', say: 'Piep… mijn oor jeukt zo.' }, { zone: 'oor', tool: 'medicijn', say: 'Mijn oor doet pijn.' },
      { zone: 'poot', tool: 'pleister', say: 'Ik heb me aan mijn poot gesneden.' }, { zone: 'poot', tool: 'ijs', say: 'Mijn poot is dik geworden.' },
      { zone: 'buik', tool: 'medicijn', say: 'Mijn buikje is niet lekker.' }, { zone: 'buik', tool: 'zalf', say: 'Ik heb een kale plek op mijn buik.' },
      { zone: 'staart', tool: 'pleister', say: 'Mijn staart zat in de deur.' }, { zone: 'staart', tool: 'ijs', say: 'Mijn staart is gekneusd.' },
    ],
  });

  // ------------------------------------------------------------------------
  // Brandweer: blus de branden voordat ze te groot worden
  // ------------------------------------------------------------------------
  const brandweer = {
    title: '🚒 Brandweer',
    intro: '<p>Er breekt brand uit in het flatgebouw! <b>Tik op het vuur</b> om het te blussen met je slang.</p><p>Hoe groter het vuur, hoe vaker je moet tikken. Blus snel, anders brandt het raam uit!</p><div class="mg-demo">🔥 → 💦 💦 → 💨</div>',
    start(body, api, worked) {
      const total = 45, cols = 4, rows = 3;
      let elapsed = 0, saved = 0, damage = 0, spawnT = 1, finished = false;
      body.innerHTML = '';
      const msg = el('div', 'rs-msg', 'Tik op het vuur!');
      const grid = el('div', 'bw-grid');
      body.append(grid, msg);
      const cells = Array.from({ length: cols * rows }, () => {
        const node = el('button', 'bw-win'); node.type = 'button';
        const c = { node, fire: null, state: 'ok' };
        node.addEventListener('pointerdown', () => spray(c));
        grid.append(node);
        return c;
      });
      const draw = (c) => {
        if (c.state === 'burned') { c.node.innerHTML = '<span class="bw-char">🏚️</span>'; return; }
        if (c.state === 'out') { c.node.innerHTML = '<span class="bw-char">💨</span>'; return; }
        c.node.innerHTML = c.fire ? '<span class="bw-fire l' + c.fire.level + '">🔥</span><span class="bw-hp">' + '💧'.repeat(c.fire.hp) + '</span>' : '';
      };
      function spray(c) {
        if (finished || !c.fire) return;
        c.fire.hp--; JV.sfx('tap'); pop(c.node);
        if (c.fire.hp <= 0) { c.fire = null; c.state = 'out'; saved++; JV.sfx('good'); api.setScore('Geblust: ' + saved + (damage ? ' · schade: ' + damage : '')); setTimeout(() => { if (c.state === 'out') { c.state = 'ok'; draw(c); } }, 600); }
        draw(c);
      }
      draw(cells[0]);
      api.setScore('Geblust: 0');
      const timer = setInterval(() => {
        if (finished) return;
        const dt = 0.1; elapsed += dt; api.setTimer(Math.max(0, 1 - elapsed / total));
        spawnT -= dt;
        if (spawnT <= 0) {
          const free = cells.filter((c) => c.state === 'ok' && !c.fire);
          if (free.length) { const c = pick(free); c.fire = { level: 1, hp: 1, age: 0, big: 0 }; draw(c); JV.sfx('bell'); }
          spawnT = Math.max(1.3, 2.4 - worked * 0.08);
        }
        for (const c of cells) {
          if (!c.fire) continue;
          c.fire.age += dt;
          if (c.fire.age > 3 && c.fire.level < 3) { c.fire.level++; c.fire.hp = c.fire.level; c.fire.age = 0; draw(c); }
          else if (c.fire.level === 3 && c.fire.age > 3.2) { c.fire = null; c.state = 'burned'; damage++; msg.textContent = 'Oei, een raam is uitgebrand. Blus sneller!'; JV.sfx('nope'); draw(c); api.setScore('Geblust: ' + saved + ' · schade: ' + damage); }
        }
        if (elapsed >= total) {
          finished = true;
          api.end(saved >= 9 && damage <= 1 ? 3 : saved >= 5 && damage <= 3 ? 2 : 1);
        }
      }, 100);
      return () => clearInterval(timer);
    },
  };

  // ------------------------------------------------------------------------
  // Busstation: zet de passagiers af bij de goede halte
  // ------------------------------------------------------------------------
  const STOPS = [{ id: 'school', e: '🏫', n: 'School' }, { id: 'ziekenhuis', e: '🏥', n: 'Ziekenhuis' }, { id: 'winkel', e: '🛒', n: 'Winkel' }, { id: 'park', e: '🌳', n: 'Park' }];
  const bus = {
    title: '🚌 Busstation',
    intro: '<p>Passagiers staan te wachten en vertellen waar ze naartoe moeten.</p><p>Tik op de <b>goede halte</b> voor de passagier vooraan in de rij. De bus rijdt er dan naartoe.</p><div class="mg-demo">"Naar 🏥" → tik op de halte 🏥</div>',
    start(body, api, worked) {
      const total = 50;
      let elapsed = 0, served = 0, mistakes = 0, lost = 0, spawnT = 0.5, finished = false;
      const queue = [];
      body.innerHTML = '';
      const road = el('div', 'bus-road');
      const busEl = el('div', 'bus-bus', '🚌'); road.append(busEl);
      const stopsEl = el('div', 'bus-stops');
      const qEl = el('div', 'bus-queue');
      const msg = el('div', 'rs-msg', 'Wie staat vooraan? Waar moet die persoon naartoe?');
      body.append(qEl, road, stopsEl, msg);
      STOPS.forEach((s, i) => {
        const b = el('button', 'bus-stop', '<span class="e">' + s.e + '</span><span class="n">' + s.n + '</span>'); b.type = 'button';
        b.addEventListener('click', () => {
          if (finished) return;
          busEl.style.left = (12.5 + i * 25) + '%';
          if (!queue.length) { msg.textContent = 'Er staat nog niemand te wachten.'; return; }
          if (queue[0].stop.id === s.id) { queue.shift(); served++; JV.sfx('coin'); msg.textContent = pick(['Dankjewel!', 'Fijne dag!', 'Precies goed!']); renderQ(); api.setScore('Gebracht: ' + served); }
          else { mistakes++; JV.sfx('nope'); shake(b); msg.textContent = 'Nee, deze persoon moet naar ' + queue[0].stop.n.toLowerCase() + '.'; }
        });
        stopsEl.append(b);
      });
      function renderQ() {
        qEl.innerHTML = '';
        queue.forEach((p, i) => {
          const node = el('div', 'bus-pass' + (i === 0 ? ' first' : ''));
          node.append(JV.personCanvas(p.look, i === 0 ? 84 : 60));
          if (i === 0) node.append(el('div', 'speech', 'Naar ' + p.stop.e + ' ' + p.stop.n));
          else node.append(el('div', 'bus-dest', p.stop.e));
          qEl.append(node);
        });
        if (!queue.length) qEl.append(el('div', 'muted', 'Even wachten op de volgende passagier…'));
      }
      renderQ(); api.setScore('Gebracht: 0');
      const timer = setInterval(() => {
        if (finished) return;
        const dt = 0.1; elapsed += dt; api.setTimer(Math.max(0, 1 - elapsed / total));
        spawnT -= dt;
        if (spawnT <= 0) {
          if (queue.length < 5) { queue.push({ look: customer().look, stop: pick(STOPS) }); renderQ(); JV.sfx('bell'); }
          else lost++;
          spawnT = Math.max(1.8, 3.1 - worked * 0.08);
        }
        if (elapsed >= total) {
          finished = true;
          api.end(served >= 12 && mistakes <= 3 ? 3 : served >= 7 ? 2 : 1);
        }
      }, 100);
      return () => clearInterval(timer);
    },
  };

  Object.assign(JV.GAMES, { bakkerij, ijssalon, cafe, bloemen, kapper, dierenopvang, school, ziekenhuis, dierenarts, brandweer, bus });
})(window.JV);
