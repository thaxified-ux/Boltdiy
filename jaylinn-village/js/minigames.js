// Jaylinn Village – de mini-games: supermarkt, restaurant en kinderopvang.
(function (JV) {
  const C = JV.CATALOG;
  const rnd = Math.random;
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  function residents() {
    const S = JV.state();
    const out = [];
    for (const f of S.families) for (const m of f.members) if (m.look.age === 'volw' || m.look.age === 'tiener') out.push({ name: m.first + ' ' + f.surname, look: m.look });
    return out;
  }
  function customer() {
    const r = residents();
    if (r.length && rnd() < 0.85) return pick(r);
    const g = rnd() < 0.5 ? 'm' : 'v';
    return { name: pick(g === 'm' ? JV.NAMES_M : JV.NAMES_V) + ' (bezoeker)', look: JV.randomLook(rnd, 'volw', g) };
  }
  function shake(node) { node.classList.remove('shake'); void node.offsetWidth; node.classList.add('shake'); }
  function pop(node) { node.classList.remove('pop'); void node.offsetWidth; node.classList.add('pop'); }

  // ------------------------------------------------------------------------
  // Supermarkt: verzamel de boodschappen van het lijstje
  // ------------------------------------------------------------------------
  const superGame = {
    title: '🛒 Supermarkt',
    intro: '<p>Een klant geeft je een <b>boodschappenlijstje</b>.</p><p>Tik in de schappen op de producten die op het lijstje staan. Let op hoeveel er nodig zijn!</p><div class="mg-demo">📝 🍎 × 2 &nbsp;→&nbsp; tik 2 keer op 🍎</div>',
    start(body, api, worked) {
      const nCustomers = worked >= 5 ? 3 : 2;
      const listLen = Math.min(5, 3 + Math.floor(worked / 3));
      const budget = nCustomers * (listLen * 4 + 7);
      const total = Math.round(budget * 2.2);
      let elapsed = 0, ci = 0, list = null, busy = false, finished = false;
      body.innerHTML = '';
      const wrap = el('div', 'sm-wrap');
      const left = el('div', 'sm-customer');
      const shelves = el('div', 'sm-shelves');
      wrap.append(left, shelves); body.append(wrap);

      function newCustomer() {
        const cu = customer();
        const items = shuffle(JV.PRODUCTS).slice(0, listLen);
        list = items.map((p) => ({ p, need: 1 + (rnd() < 0.35 + worked * 0.03 ? 1 : 0), have: 0 }));
        left.innerHTML = '';
        const card = el('div', 'sm-card');
        const av = JV.personCanvas(cu.look, 120);
        av.className = 'sm-avatar';
        const say = el('div', 'speech', 'Hoi! Wil jij mijn boodschappen pakken?');
        const name = el('div', 'sm-name', cu.name);
        const ul = el('ul', 'sm-list');
        card.append(av, name, say, ul);
        const basket = el('div', 'sm-basket', '🧺 <span></span>');
        left.append(card, basket);
        left._say = say; left._ul = ul; left._basket = basket.querySelector('span');
        renderList();
        const pool = shuffle(JV.PRODUCTS).filter((p) => !items.includes(p)).slice(0, 12 - items.length);
        const shelfItems = shuffle(items.concat(pool));
        shelves.innerHTML = '';
        shelfItems.forEach((p) => {
          const b = el('button', 'sm-item', '<span class="e">' + p.e + '</span><span class="n">' + p.n + '</span>');
          b.type = 'button';
          b.addEventListener('click', () => tapItem(p, b));
          shelves.append(b);
        });
        api.setScore('Klant ' + (ci + 1) + ' van ' + nCustomers);
      }
      function renderList() {
        left._ul.innerHTML = '';
        for (const it of list) {
          const li = el('li', it.have >= it.need ? 'done' : '', '<span class="e">' + it.p.e + '</span> ' + it.p.n + ' <b>' + it.have + '/' + it.need + '</b>');
          left._ul.append(li);
        }
        left._basket.textContent = list.map((it) => it.p.e.repeat(it.have)).join(' ');
      }
      function tapItem(p, b) {
        if (busy || finished) return;
        const it = list.find((x) => x.p === p);
        if (!it) { shake(b); left._say.textContent = p.n + ' staat niet op mijn lijstje.'; return; }
        if (it.have >= it.need) { shake(b); left._say.textContent = 'Ik heb al genoeg ' + p.n.toLowerCase() + '.'; return; }
        it.have++; pop(b); JV.sfx('tap');
        left._say.textContent = pick(['Super!', 'Dankjewel!', 'Ja, die!', 'Goed zo!']);
        renderList();
        if (list.every((x) => x.have >= x.need)) {
          busy = true; JV.sfx('good');
          left._say.textContent = 'Alles is er! Bedankt!';
          setTimeout(() => {
            busy = false; ci++;
            if (ci >= nCustomers) finish(); else newCustomer();
          }, 900);
        }
      }
      function finish() {
        if (finished) return;
        finished = true;
        let stars;
        if (ci >= nCustomers) stars = elapsed <= budget ? 3 : elapsed <= budget * 1.6 ? 2 : 1;
        else stars = 1;
        api.end(stars);
      }
      newCustomer();
      const timer = setInterval(() => {
        if (finished) return;
        elapsed += 0.1;
        api.setTimer(Math.max(0, 1 - elapsed / total));
        if (elapsed >= total) finish();
      }, 100);
      return () => clearInterval(timer);
    },
  };

  // ------------------------------------------------------------------------
  // Restaurant: kook het gerecht en breng het naar de goede tafel
  // ------------------------------------------------------------------------
  const restaurantGame = {
    title: '🍽️ Restaurant',
    intro: '<p>Gasten komen aan tafel en bestellen een gerecht.</p><p>1. Tik op de <b>ingrediënten</b> van het plaatje.<br>2. Tik op <b>Koken!</b><br>3. Tik op de <b>tafel</b> van de gast om het eten te brengen. Snel, voordat de gast weggaat!</p><div class="mg-demo">🍔 = 🍞 + 🥩 + 🥬</div>',
    start(body, api, worked) {
      const totalGuests = worked >= 4 ? 8 : 6;
      const patience = Math.max(22, 34 - worked);
      const dishes = JV.DISHES.slice(0, Math.min(JV.DISHES.length, 4 + Math.floor(worked / 2)));
      let spawned = 0, served = 0, gone = 0, finished = false, spawnT = 1.5;
      const pan = [], plates = [];
      body.innerHTML = '';
      const tablesEl = el('div', 'rs-tables');
      const counter = el('div', 'rs-counter', '<span class="lbl">Klaar om te brengen:</span><div class="rs-plates"></div>');
      const kitchen = el('div', 'rs-kitchen');
      const panEl = el('div', 'rs-pan', '<span class="lbl">Pan:</span><div class="rs-pan-items"></div>');
      const ingr = el('div', 'rs-ingr');
      const btns = el('div', 'rs-btns');
      const cook = el('button', 'btn btn-primary', '🔥 Koken!'); cook.type = 'button';
      const empty = el('button', 'btn', '🗑️ Leeg'); empty.type = 'button';
      btns.append(cook, empty);
      kitchen.append(panEl, ingr, btns);
      const msg = el('div', 'rs-msg', 'Wacht op de eerste gast…');
      body.append(tablesEl, counter, msg, kitchen);

      const tables = [0, 1, 2].map((i) => {
        const t = el('button', 'rs-table'); t.type = 'button';
        t.innerHTML = '<div class="rs-seat">Vrije tafel</div>';
        t.addEventListener('click', () => tapTable(i));
        tablesEl.append(t);
        return { el: t, guest: null };
      });
      JV.INGREDIENTS.forEach((ing) => {
        const b = el('button', 'rs-ing', '<span class="e">' + ing.e + '</span><span class="n">' + ing.n + '</span>'); b.type = 'button';
        b.addEventListener('click', () => {
          if (finished) return;
          if (pan.includes(ing.id)) { shake(b); msg.textContent = ing.n + ' zit al in de pan.'; return; }
          if (pan.length >= 3) { shake(b); msg.textContent = 'De pan is vol. Tik op Koken! of Leeg.'; return; }
          pan.push(ing.id); pop(b); JV.sfx('tap'); renderPan();
        });
        ingr.append(b);
      });
      cook.addEventListener('click', () => {
        if (!pan.length) { msg.textContent = 'Doe eerst ingrediënten in de pan.'; return; }
        const dish = JV.DISHES.find((d) => d.parts.length === pan.length && d.parts.every((p) => pan.includes(p)));
        if (!dish) { msg.textContent = 'Dat recept bestaat niet. Kijk goed naar het plaatje bij de gast!'; shake(panEl); pan.length = 0; renderPan(); return; }
        if (plates.length >= 3) { msg.textContent = 'Het aanrecht is vol. Breng eerst eten weg!'; return; }
        plates.push(dish.id); pan.length = 0; renderPan(); renderPlates(); JV.sfx('good');
        msg.textContent = dish.e + ' ' + dish.n + ' is klaar! Tik op de tafel van de gast.';
      });
      empty.addEventListener('click', () => { pan.length = 0; renderPan(); });

      function renderPan() {
        panEl.querySelector('.rs-pan-items').innerHTML = pan.map((id) => '<span>' + JV.INGREDIENTS.find((x) => x.id === id).e + '</span>').join('') || '<i>leeg</i>';
      }
      function renderPlates() {
        counter.querySelector('.rs-plates').innerHTML = plates.map((id) => '<span class="plate">' + JV.DISHES.find((x) => x.id === id).e + '</span>').join('') || '<i>nog niets</i>';
      }
      function renderTable(i) {
        const t = tables[i];
        if (!t.guest) { t.el.innerHTML = '<div class="rs-seat">Vrije tafel</div>'; t.el.classList.remove('has'); return; }
        const g = t.guest;
        t.el.classList.add('has');
        t.el.innerHTML = '';
        const av = JV.personCanvas(g.look, 64);
        const dish = JV.DISHES.find((d) => d.id === g.dish);
        const order = el('div', 'rs-order', g.happy ? '😋 Lekker!' : '<span class="big">' + dish.e + '</span><span class="recipe">' + dish.parts.map((p) => JV.INGREDIENTS.find((x) => x.id === p).e).join('+') + '</span>');
        const bar = el('div', 'rs-patience', '<i></i>');
        t.el.append(order, av, bar);
        g.bar = bar.firstChild; g.av = av;
      }
      function tapTable(i) {
        const t = tables[i];
        if (!t.guest || t.guest.happy || finished) return;
        const k = plates.indexOf(t.guest.dish);
        if (k === -1) { shake(t.el); const d = JV.DISHES.find((x) => x.id === t.guest.dish); msg.textContent = 'Deze gast wil ' + d.e + ' ' + d.n + '.'; return; }
        plates.splice(k, 1); renderPlates();
        t.guest.happy = true; served++; JV.sfx('coin');
        renderTable(i); pop(t.el);
        msg.textContent = pick(['De gast is blij!', 'Smakelijk eten!', 'Goed gedaan!']);
        setTimeout(() => { t.guest = null; renderTable(i); checkEnd(); }, 1100);
        api.setScore('Blije gasten: ' + served + ' van ' + totalGuests);
      }
      function checkEnd() {
        if (finished) return;
        if (served + gone >= totalGuests && tables.every((t) => !t.guest)) {
          finished = true;
          const r = served / totalGuests;
          api.end(r >= 0.85 ? 3 : r >= 0.5 ? 2 : 1);
        }
      }
      renderPan(); renderPlates();
      api.setScore('Blije gasten: 0 van ' + totalGuests);
      api.setTimer(null);
      let last = performance.now();
      const timer = setInterval(() => {
        if (finished) return;
        const now = performance.now(), dt = (now - last) / 1000; last = now;
        spawnT -= dt;
        if (spawnT <= 0 && spawned < totalGuests) {
          const free = tables.filter((t) => !t.guest);
          if (free.length) {
            const t = pick(free);
            const cu = customer();
            t.guest = { look: cu.look, dish: pick(dishes).id, left: patience, happy: false };
            spawned++; renderTable(tables.indexOf(t)); pop(t.el); JV.sfx('bell');
            if (spawned === 1) msg.textContent = 'Er is een gast! Kijk wat hij of zij wil eten.';
            spawnT = Math.max(4, 8 - worked * 0.4);
          } else spawnT = 1;
        }
        tables.forEach((t, i) => {
          const g = t.guest;
          if (!g || g.happy) return;
          g.left -= dt;
          if (g.bar) { g.bar.style.width = Math.max(0, g.left / patience * 100) + '%'; g.bar.parentNode.classList.toggle('low', g.left < patience * 0.3); }
          if (g.left <= 0) {
            gone++; t.guest = null; renderTable(i);
            msg.textContent = 'Oh nee, een gast had te lang gewacht en is weggegaan.';
            checkEnd();
          }
        });
      }, 100);
      return () => clearInterval(timer);
    },
  };

  // ------------------------------------------------------------------------
  // Kinderopvang: zorg voor de kinderen
  // ------------------------------------------------------------------------
  const opvangGame = {
    title: '🧸 Kinderopvang',
    intro: '<p>De kinderen laten met een <b>wolkje</b> zien wat ze nodig hebben.</p><p>Tik op het kind en daarna op wat het nodig heeft: eten, drinken, spelen, slapen of een schone luier.</p><div class="mg-demo">🍼 boven een kind → tik op het kind en dan op 🍼</div>',
    start(body, api, worked) {
      const nKids = Math.min(6, 4 + Math.floor(worked / 3));
      const total = 60;
      const needTime = Math.max(7, 11 - worked * 0.3);
      let elapsed = 0, helped = 0, missed = 0, finished = false, spawnT = 1, selKid = null, selNeed = null;
      body.innerHTML = '';
      const room = el('div', 'op-room');
      const msg = el('div', 'rs-msg', 'Kijk goed naar de wolkjes!');
      const bar = el('div', 'op-actions');
      body.append(room, msg, bar);
      const kids = [];
      const used = [];
      for (let i = 0; i < nKids; i++) {
        const g = rnd() < 0.5 ? 'm' : 'v';
        const list = g === 'm' ? JV.NAMES_M : JV.NAMES_V;
        let name = pick(list); while (used.includes(name)) name = pick(list); used.push(name);
        const look = JV.randomLook(rnd, rnd() < 0.6 ? 'peuter' : 'baby', g);
        const node = el('button', 'op-kid'); node.type = 'button';
        const cv = JV.personCanvas(look, 104);
        const bub = el('div', 'op-need');
        node.append(bub, cv, el('div', 'op-name', name));
        room.append(node);
        const kid = { look, node, cv, bub, name, need: null, left: 0, cool: rnd() * 2, mood: null, moodT: 0 };
        node.addEventListener('click', () => tapKid(kid));
        kids.push(kid);
      }
      const btns = JV.NEEDS.map((n) => {
        const b = el('button', 'op-act', '<span class="e">' + n.e + '</span><span class="n">' + n.n + '</span>'); b.type = 'button';
        b.addEventListener('click', () => tapNeed(n, b));
        bar.append(b);
        return { n, b };
      });
      function setMood(kid, mood, t) { kid.mood = mood; kid.moodT = t; JV.paintPersonCanvas(kid.cv, kid.look, { mood, noShadow: false }); }
      function renderKid(kid) {
        kid.bub.innerHTML = kid.need ? kid.need.e : (kid.mood === 'happy' ? '💖' : '');
        kid.bub.className = 'op-need' + (kid.need ? ' on' : kid.mood === 'happy' ? ' on heart' : '');
        kid.node.classList.toggle('sel', selKid === kid);
      }
      function clearSel() { selKid = null; selNeed = null; btns.forEach((x) => x.b.classList.remove('sel')); kids.forEach(renderKid); }
      function resolve(kid, need) {
        if (!kid.need) { shake(kid.node); msg.textContent = kid.name + ' heeft nu niets nodig.'; clearSel(); return; }
        if (kid.need.id !== need.id) { shake(kid.node); msg.textContent = kid.name + ': "Nee, ' + kid.need.say.toLowerCase() + '"'; JV.sfx('nope'); clearSel(); return; }
        helped++; JV.sfx('good');
        msg.textContent = pick(['Dankjewel!', kid.name + ' is blij!', 'Goed gedaan!', 'Hoera!']);
        kid.need = null; kid.cool = 2.5;
        setMood(kid, need.id === 'slapen' ? 'sleep' : 'happy', 2.5);
        pop(kid.node); clearSel();
        api.setScore('Geholpen: ' + helped);
      }
      function tapKid(kid) {
        if (finished) return;
        if (selNeed) { resolve(kid, selNeed); return; }
        selKid = kid; kids.forEach(renderKid);
        msg.textContent = kid.need ? 'Wat heeft ' + kid.name + ' nodig? Tik hieronder.' : kid.name + ' speelt lekker.';
      }
      function tapNeed(n, b) {
        if (finished) return;
        if (selKid) { resolve(selKid, n); return; }
        selNeed = n; btns.forEach((x) => x.b.classList.toggle('sel', x.b === b));
        msg.textContent = 'Tik nu op het kind dat ' + n.e + ' nodig heeft.';
      }
      api.setScore('Geholpen: 0');
      const timer = setInterval(() => {
        if (finished) return;
        const dt = 0.1;
        elapsed += dt;
        api.setTimer(Math.max(0, 1 - elapsed / total));
        spawnT -= dt;
        for (const kid of kids) {
          if (kid.moodT > 0) { kid.moodT -= dt; if (kid.moodT <= 0) { setMood(kid, null, 0); renderKid(kid); } }
          if (kid.cool > 0) kid.cool -= dt;
          if (kid.need) {
            kid.left -= dt;
            kid.bub.style.setProperty('--left', Math.max(0, kid.left / needTime));
            if (kid.left <= 0) {
              missed++; kid.need = null; kid.cool = 2; setMood(kid, 'sad', 2);
              if (selKid === kid) clearSel();
              msg.textContent = kid.name + ' moest te lang wachten.'; renderKid(kid);
            }
          }
        }
        if (spawnT <= 0) {
          const free = kids.filter((k) => !k.need && k.cool <= 0 && k.moodT <= 0);
          const busy = kids.filter((k) => k.need).length;
          if (free.length && busy < Math.ceil(nKids / 2)) {
            const k = pick(free);
            k.need = pick(k.look.age === 'baby' ? JV.NEEDS : JV.NEEDS.filter((n) => n.id !== 'verschonen' || rnd() < 0.5));
            k.left = needTime; renderKid(k); pop(k.bub); JV.sfx('bell');
          }
          spawnT = Math.max(1.4, 2.8 - worked * 0.1);
        }
        if (elapsed >= total) {
          finished = true;
          const r = helped / Math.max(1, helped + missed);
          api.end(helped === 0 ? 1 : r >= 0.85 ? 3 : r >= 0.6 ? 2 : 1);
        }
      }, 100);
      kids.forEach(renderKid);
      return () => clearInterval(timer);
    },
  };

  JV.GAMES = { super: superGame, restaurant: restaurantGame, opvang: opvangGame };

  // ------------------------------------------------------------------------
  // Het scherm om de mini-game heen: uitleg, timer, uitslag
  // ------------------------------------------------------------------------
  JV.openMinigame = function (building, onClose) {
    const d = C[building.type];
    const game = JV.GAMES[d.game];
    const root = document.getElementById('minigame');
    let cleanup = null;
    root.hidden = false;
    root.innerHTML = '';
    const head = el('div', 'mg-head');
    const close = el('button', 'icon-btn', '✕'); close.type = 'button'; close.setAttribute('aria-label', 'Stoppen');
    const title = el('div', 'mg-title', game.title);
    const timerEl = el('div', 'mg-timer', '<i></i>');
    const score = el('div', 'mg-score');
    head.append(close, title, timerEl, score);
    const body = el('div', 'mg-body');
    root.append(head, body);
    const worked = JV.state().worked[d.game] || 0;

    function showIntro() {
      body.innerHTML = '';
      timerEl.hidden = true; score.textContent = '';
      const card = el('div', 'mg-intro');
      card.innerHTML = '<h2>' + game.title + '</h2>' + game.intro + '<p class="mg-reward">Je verdient 🪙 ' + Math.round(JV.STAR_COINS[0] * d.mult) + ' tot ' + Math.round(JV.STAR_COINS[2] * d.mult) + ' munten.</p>';
      const go = el('button', 'btn btn-primary btn-big', 'Start!'); go.type = 'button';
      go.addEventListener('click', run);
      card.append(go);
      body.append(card);
      go.focus();
    }
    function run() {
      JV.sfx('tap');
      timerEl.hidden = false;
      const api = {
        setTimer(f) { timerEl.hidden = f == null; if (f != null) { timerEl.firstChild.style.width = (f * 100) + '%'; timerEl.classList.toggle('low', f < 0.25); } },
        setScore(t) { score.textContent = t; },
        end(stars) { if (cleanup) cleanup(); cleanup = null; setTimeout(() => showResult(stars), 400); },
      };
      cleanup = game.start(body, api, JV.state().worked[d.game] || worked);
    }
    function showResult(stars) {
      const r = JV.finishWork(d.game, stars, d.mult);
      JV.sfx(stars === 3 ? 'win' : 'good');
      body.innerHTML = '';
      timerEl.hidden = true;
      const card = el('div', 'mg-result');
      const msgs = ['Goed geprobeerd!', 'Goed gedaan!', 'Fantastisch!'];
      card.innerHTML = '<h2>' + msgs[stars - 1] + '</h2><div class="stars">' + [1, 2, 3].map((i) => '<span class="' + (i <= stars ? 'on' : '') + '" style="--d:' + i * 0.18 + 's">★</span>').join('') + '</div>' +
        '<div class="mg-gain"><span>🪙 +' + r.coins + '</span><span>⭐ +' + r.xp + ' XP</span></div>';
      const again = el('button', 'btn', '🔁 Nog een keer'); again.type = 'button';
      const back = el('button', 'btn btn-primary', '🏙️ Terug naar de stad'); back.type = 'button';
      again.addEventListener('click', () => { JV.save(); showIntro(); });
      back.addEventListener('click', done);
      const row = el('div', 'row'); row.append(again, back);
      card.append(row);
      body.append(card);
      JV.save();
      back.focus();
    }
    function done() {
      if (cleanup) cleanup();
      cleanup = null;
      root.hidden = true; root.innerHTML = '';
      if (onClose) onClose();
    }
    close.addEventListener('click', done);
    showIntro();
  };
})(window.JV);
