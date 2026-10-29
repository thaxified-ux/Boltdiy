// Jaylinn Village – schermen, knoppen, kaartjes, bouwmodus en invoer.
(function (JV) {
  const C = JV.CATALOG;
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const ui = { screen: 'start', build: false, tab: 'weg', tool: null, ghost: null, selected: null, moving: null, modalOpen: false };
  JV.ui = ui;

  const JAYLINN = { gender: 'v', age: 'kind', skin: '#B57A4C', hair: 'lang', hairColor: '#2A1A12', shirt: '#F1E7D8', pants: '#7F9BCB' };

  // --- geluidjes ------------------------------------------------------------
  let actx = null;
  function tone(freq, start, dur, type, vol) {
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, actx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, actx.currentTime + start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + start + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(actx.currentTime + start); o.stop(actx.currentTime + start + dur + 0.05);
  }
  JV.sfx = function (name) {
    const S = JV.state();
    if (S && S.settings && !S.settings.sound) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      switch (name) {
        case 'tap': tone(660, 0, 0.08, 'triangle', 0.08); break;
        case 'good': tone(660, 0, 0.12, 'triangle'); tone(990, 0.09, 0.16, 'triangle'); break;
        case 'coin': tone(1180, 0, 0.08, 'square', 0.05); tone(1580, 0.07, 0.18, 'square', 0.05); break;
        case 'bell': tone(880, 0, 0.25, 'sine', 0.08); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.22, 'triangle')); break;
        case 'nope': tone(220, 0, 0.18, 'sawtooth', 0.04); break;
        case 'build': tone(200, 0, 0.12, 'triangle', 0.14); tone(300, 0.06, 0.12, 'triangle', 0.1); break;
        case 'level': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.3, 'triangle')); break;
      }
    } catch (e) { /* geen geluid beschikbaar */ }
  };

  // --- opslaan --------------------------------------------------------------
  let saveTimer = null;
  JV.save = function (now) {
    const S = JV.state();
    if (!S) return;
    clearTimeout(saveTimer);
    if (now) JV.storage.save(S);
    else saveTimer = setTimeout(() => JV.storage.save(S), 400);
  };

  // --- meldingen en gids ----------------------------------------------------
  JV.toast = function (text, kind) {
    const t = el('div', 'toast' + (kind ? ' ' + kind : ''), esc(text));
    $('#toasts').append(t);
    setTimeout(() => t.classList.add('out'), 2300);
    setTimeout(() => t.remove(), 2800);
  };

  let guideCanvas = null;
  JV.tip = function (key, text, force) {
    const S = JV.state();
    if (!force && S.tipsSeen[key]) return;
    S.tipsSeen[key] = true;
    const g = $('#guide');
    if (!guideCanvas) { guideCanvas = JV.personCanvas(JAYLINN, 84); $('#guide .g-face').append(guideCanvas); }
    $('#guide .g-text').textContent = text;
    g.hidden = false;
    g.classList.remove('in'); void g.offsetWidth; g.classList.add('in');
    JV.save();
  };
  function hideGuide() { $('#guide').hidden = true; }

  // --- schermen -------------------------------------------------------------
  function show(screen) {
    ui.screen = screen;
    for (const s of ['start', 'creator', 'house']) $('#screen-' + s).hidden = s !== screen;
    $('#hud').hidden = screen !== 'game';
    if (screen !== 'game') { $('#buildbar').hidden = true; $('#placebar').hidden = true; hideGuide(); }
    if (screen === 'game') resize();
  }
  JV.show = show;

  // Startscherm
  JV.showStart = function (saved) {
    show('start');
    const ppl = $('#start-people');
    if (!ppl.childElementCount) {
      [['volw', 'm', 124], ['volw', 'v', 124], ['tiener', 'v', 112], ['kind', 'm', 98], ['peuter', 'v', 84], ['volw', 'v', 124]].forEach(([a, g, s]) => {
        ppl.append(JV.personCanvas(JV.randomLook(Math.random, a, g), s));
      });
    }
    const box = $('#start-actions');
    box.innerHTML = '';
    if (saved) {
      const cont = el('button', 'btn btn-primary btn-big', 'Verder spelen'); cont.type = 'button';
      cont.addEventListener('click', () => { JV.sfx('tap'); JV.loadGame(saved); enterGame(); });
      const info = el('p', 'start-info', 'Burgemeester <b>' + esc(saved.player.name) + '</b> · level ' + saved.level + ' · dag ' + saved.day);
      const fresh = el('button', 'btn btn-quiet', 'Nieuwe stad beginnen'); fresh.type = 'button';
      fresh.addEventListener('click', () => confirmBox('Weet je het zeker? Je huidige stad wordt gewist.', 'Ja, nieuwe stad', async () => { await JV.storage.clear(); openCreator(null); }));
      box.append(cont, info, fresh);
      cont.focus();
    } else {
      const go = el('button', 'btn btn-primary btn-big', 'Begin je stad!'); go.type = 'button';
      go.addEventListener('click', () => { JV.sfx('tap'); openCreator(null); });
      box.append(go);
      go.focus();
    }
  };

  // Poppetje maken
  let draft = null, creatorDone = null;
  function openCreator(existing, onDone) {
    draft = existing ? JSON.parse(JSON.stringify(existing)) : { name: '', look: { gender: 'v', age: 'volw', skin: JV.SKINS[3], hair: 'lang', hairColor: JV.HAIR_COLORS[0], shirt: JV.CLOTH_COLORS[8], pants: JV.PANTS_COLORS[1], glasses: false, beard: false, dress: false } };
    creatorDone = onDone || null;
    show('creator');
    $('#creator-title').textContent = existing ? 'Pas je poppetje aan' : 'Maak je eigen poppetje';
    $('#creator-done').textContent = existing ? 'Opslaan' : 'Klaar!';
    $('#player-name').value = draft.name;
    buildCreator();
  }
  JV.openCreator = openCreator;

  function swatches(container, colors, current, onPick) {
    container.innerHTML = '';
    colors.forEach((c) => {
      const b = el('button', 'swatch' + (c === current ? ' on' : '')); b.type = 'button';
      b.style.background = c; b.setAttribute('aria-label', 'Kleur ' + c);
      b.addEventListener('click', () => { onPick(c); JV.sfx('tap'); buildCreator(); });
      container.append(b);
    });
  }
  function buildCreator() {
    const L = draft.look;
    const prev = $('#creator-preview');
    if (!prev._c) { prev._c = JV.personCanvas(L, 220); prev.append(prev._c); }
    JV.paintPersonCanvas(prev._c, L, { sash: true });
    $('#c-gender').querySelectorAll('button').forEach((b) => {
      b.classList.toggle('on', b.dataset.g === L.gender);
      b.onclick = () => { L.gender = b.dataset.g; if (L.gender === 'v') L.beard = false; else L.dress = false; JV.sfx('tap'); buildCreator(); };
    });
    swatches($('#c-skin'), JV.SKINS, L.skin, (c) => { L.skin = c; });
    const hs = $('#c-hair'); hs.innerHTML = '';
    JV.HAIR_STYLES.forEach((h) => {
      const b = el('button', 'hairopt' + (h.id === L.hair ? ' on' : '')); b.type = 'button';
      const lk = Object.assign({}, L, { hair: h.id, beard: false, glasses: false });
      if (h.id === 'hoofddoek' && JV.HAIR_COLORS.includes(L.hairColor)) lk.hairColor = '#C9A3C9';
      const cv = JV.personCanvas(lk, 64);
      b.append(cv, el('span', '', h.label));
      b.addEventListener('click', () => {
        const wasScarf = L.hair === 'hoofddoek';
        L.hair = h.id;
        if (h.id === 'hoofddoek' && !wasScarf) L.hairColor = '#C9A3C9';
        if (h.id !== 'hoofddoek' && wasScarf) L.hairColor = JV.HAIR_COLORS[0];
        JV.sfx('tap'); buildCreator();
      });
      hs.append(b);
    });
    $('#c-haircolor-label').textContent = L.hair === 'hoofddoek' ? 'Kleur hoofddoek' : 'Haarkleur';
    const hairCols = L.hair === 'hoofddoek' ? ['#C9A3C9', '#9EC3E6', '#E8B5A6', '#7C6FA8', '#E8D7B5', '#4A4A5A', '#F28BA8'] : JV.HAIR_COLORS;
    swatches($('#c-haircolor'), hairCols, L.hairColor, (c) => { L.hairColor = c; });
    swatches($('#c-shirt'), JV.CLOTH_COLORS, L.shirt, (c) => { L.shirt = c; });
    swatches($('#c-pants'), JV.PANTS_COLORS, L.pants, (c) => { L.pants = c; });
    const ex = $('#c-extra'); ex.innerHTML = '';
    const toggles = [['glasses', '👓 Bril']];
    if (L.gender === 'm') toggles.push(['beard', '🧔 Baard']);
    if (L.gender === 'v') toggles.push(['dress', '👗 Jurk']);
    toggles.forEach(([k, label]) => {
      const b = el('button', 'chip' + (L[k] ? ' on' : ''), label); b.type = 'button';
      b.setAttribute('aria-pressed', L[k] ? 'true' : 'false');
      b.addEventListener('click', () => { L[k] = !L[k]; JV.sfx('tap'); buildCreator(); });
      ex.append(b);
    });
  }
  function creatorFinish() {
    const name = $('#player-name').value.trim();
    if (!name) { JV.toast('Geef je poppetje eerst een naam.', 'warn'); $('#player-name').focus(); return; }
    draft.name = name.slice(0, 16);
    JV.sfx('good');
    if (creatorDone) { creatorDone(draft); return; }
    openHousePicker();
  }

  // Huis kiezen
  let houseChoice = null;
  function openHousePicker() {
    show('house');
    houseChoice = null;
    const list = $('#house-list'); list.innerHTML = '';
    JV.STARTER_HOUSES.forEach((h) => {
      const b = el('button', 'house-card'); b.type = 'button';
      const cv = document.createElement('canvas'); cv.width = 300; cv.height = 240; cv.className = 'house-cv';
      b.append(cv, el('span', 'house-name', h.name));
      b.addEventListener('click', () => {
        houseChoice = h.id; JV.sfx('tap');
        list.querySelectorAll('.house-card').forEach((x) => x.classList.toggle('on', x === b));
        $('#house-done').disabled = false;
      });
      list.append(b);
      requestAnimationFrame(() => JV.drawHousePreview(cv, h));
    });
    $('#house-done').disabled = true;
  }
  function houseFinish() {
    if (!houseChoice) return;
    JV.newGame({ name: draft.name, look: draft.look }, houseChoice);
    JV.initAgents();
    JV.save(true);
    enterGame(true);
  }

  function enterGame(isNew) {
    show('game');
    const S = JV.state();
    JV.focusOn(8, 10);
    JV.cam.zoom = Math.min(1.25, Math.max(0.7, window.innerWidth / 900));
    refreshHud();
    if (isNew) setTimeout(() => JV.tip('welcome', 'Welkom in jouw stad, burgemeester ' + S.player.name + '! Ik ben Jaylinn. Tik op de supermarkt om te werken en munten te verdienen.'), 500);
  }

  // --- HUD ------------------------------------------------------------------
  let lastHud = '';
  function refreshHud() {
    const S = JV.state();
    if (!S) return;
    const lvlStart = JV.xpForLevel(S.level), lvlEnd = JV.xpForLevel(S.level + 1);
    const key = [S.coins, S.diamonds, S.level, S.xp, S.tasks.filter((t) => t.done).length].join('|');
    if (key !== lastHud) {
      lastHud = key;
      $('#coins').textContent = Math.floor(S.coins).toLocaleString('nl-NL');
      $('#gems').textContent = S.diamonds;
      $('#lvl').textContent = S.level;
      $('#xpfill').style.width = Math.min(100, (S.xp - lvlStart) / (lvlEnd - lvlStart) * 100) + '%';
      $('#xptext').textContent = (S.xp - lvlStart) + ' / ' + (lvlEnd - lvlStart) + ' XP';
      const done = S.tasks.filter((t) => t.done).length;
      const badge = $('#task-badge');
      badge.hidden = !done; badge.textContent = done;
      if (ui.build) renderShop();
    }
    $('#clock').textContent = (JV.darkness() > 0.5 ? '🌙 ' : '☀️ ') + JV.clockText() + ' · dag ' + S.day;
  }
  JV.refreshHud = refreshHud;

  // --- kaartjes (modal) -----------------------------------------------------
  function openModal(build, opts) {
    opts = opts || {};
    const m = $('#modal');
    const sheet = m.querySelector('.sheet');
    sheet.innerHTML = '';
    sheet.className = 'sheet' + (opts.wide ? ' wide' : '');
    const close = el('button', 'icon-btn sheet-close', '✕'); close.type = 'button'; close.setAttribute('aria-label', 'Sluiten');
    close.addEventListener('click', closeModal);
    sheet.append(close);
    build(sheet);
    m.hidden = false; ui.modalOpen = true;
    const f = sheet.querySelector('.btn-primary') || close; f.focus();
  }
  function closeModal() { $('#modal').hidden = true; ui.modalOpen = false; refreshHud(); setTimeout(JV.flushPending, 250); }
  JV.closeModal = closeModal;

  function confirmBox(text, yes, onYes) {
    openModal((s) => {
      s.append(el('p', 'confirm-text', esc(text)));
      const row = el('div', 'row');
      const no = el('button', 'btn', 'Nee'); no.type = 'button'; no.addEventListener('click', closeModal);
      const ok = el('button', 'btn btn-danger', esc(yes)); ok.type = 'button'; ok.addEventListener('click', () => { closeModal(); onYes(); });
      row.append(no, ok); s.append(row);
    });
  }

  function personRow(m, f, sub) {
    const row = el('div', 'person-row');
    const cv = JV.personCanvas(m.look, 56);
    const txt = el('div', 'person-txt', '<b>' + esc(m.first) + ' ' + esc(f.surname) + '</b><span>' + esc(sub) + '</span>');
    row.append(cv, txt);
    return row;
  }
  function memberSub(m) {
    const S = JV.state();
    const age = JV.AGE_LABEL[m.look.age];
    if (m.look.age === 'volw') {
      if (m.workId == null) return age + ' · zoekt werk';
      const b = S.objects.find((o) => o.id === m.workId);
      return m.job + ' in de ' + C[b.type].name.toLowerCase();
    }
    if (m.workId != null) return age + ' · gaat naar de kinderopvang';
    if (m.look.age === 'kind' || m.look.age === 'tiener') return age + ' · speelt graag buiten';
    return age + ' · is thuis';
  }
  function heartsHtml(n) { return '<span class="hearts" aria-label="' + n + ' van 5 hartjes">' + [1, 2, 3, 4, 5].map((i) => '<i class="' + (i <= n ? 'on' : '') + '">♥</i>').join('') + '</span>'; }

  function openWorkCard(b) {
    const d = C[b.type];
    openModal((s) => {
      s.append(el('h2', '', d.icon + ' ' + esc(d.name)));
      const workers = JV.workersOf(b);
      s.append(el('p', 'muted', 'Werkplekken: ' + workers.length + ' van ' + d.slots + ' · je werkte hier ' + (JV.state().worked[d.game] || 0) + ' keer'));
      const go = el('button', 'btn btn-primary btn-big', '▶ Ga werken'); go.type = 'button';
      go.addEventListener('click', () => { closeModal(); JV.openMinigame(b, () => { refreshHud(); checkTips(); }); });
      s.append(go);
      const pend = Math.floor(b.pending || 0);
      const coll = el('button', 'btn', pend > 0 ? '🪙 Ophalen: ' + pend + ' munten' : '🪙 Nog geen munten om op te halen'); coll.type = 'button';
      coll.disabled = pend <= 0;
      coll.addEventListener('click', () => {
        const n = JV.collect(b);
        if (n) { JV.sfx('coin'); JV.floatAt(b, '+' + n + ' 🪙', '#B07A00'); JV.save(); }
        closeModal();
      });
      s.append(coll);
      if (!JV.adjacentRoad(b)) s.append(el('p', 'warnline', 'Dit gebouw ligt niet aan een weg.'));
      s.append(el('h3', '', 'Personeel'));
      if (!workers.length) s.append(el('p', 'muted', 'Nog niemand werkt hier. Bouw woningen, dan komen er nieuwe bewoners die hier kunnen werken.'));
      const list = el('div', 'people');
      workers.forEach(({ m, f }) => list.append(personRow(m, f, m.job)));
      s.append(list);
      if (b.type === 'opvang') {
        const kids = JV.childrenAt(b);
        s.append(el('h3', '', 'Kinderen (' + kids.length + ' van ' + d.childSlots + ')'));
        const kl = el('div', 'people');
        kids.forEach(({ m, f }) => kl.append(personRow(m, f, JV.AGE_LABEL[m.look.age])));
        s.append(kl);
      }
      s.append(el('p', 'muted small', 'Met personeel verdient een gebouw elke dag vanzelf munten. Haal ze hier op.'));
    });
  }

  function openHouseCard(h) {
    const fam = JV.familyOf(h.id);
    if (!fam) return;
    if (fam.giftReady) {
      const r = JV.openGift(fam);
      if (r) {
        JV.sfx('coin');
        JV.floatAt(h, r.coins ? '+' + r.coins + ' 🪙' : '+1 💎', '#B07A00');
        JV.toast('Familie ' + fam.surname + ' geeft je een cadeautje: ' + (r.coins ? r.coins + ' munten' : '1 diamant') + '!');
        JV.save();
      }
    }
    openModal((s) => {
      s.append(el('h2', '', '🏠 Familie ' + esc(fam.surname)));
      const pet = fam.pet ? JV.PETS.find((p) => p.id === fam.pet) : null;
      s.append(el('p', 'muted', C[h.type].name + ' · ' + fam.members.length + (fam.members.length === 1 ? ' persoon' : ' personen') + (pet ? ' · ' + pet.icon + ' ' + pet.name : '')));
      s.append(el('div', 'happy', 'Tevredenheid ' + heartsHtml(fam.hearts)));
      const list = el('div', 'people');
      fam.members.forEach((m) => list.append(personRow(m, fam, memberSub(m))));
      s.append(list);
      const tips = [];
      const adults = fam.members.filter((m) => m.look.age === 'volw');
      if (adults.some((m) => m.workId == null)) tips.push('Bouw een werkgebouw, dan kan iedereen werken.');
      if (fam.hearts < 5) tips.push('Bomen, bloemen, bankjes, lantaarns en een fontein bij hun huis maken het gezin blijer.');
      if (adults.some((m) => m.workId != null && !JV.findPath(h.id, m.workId))) tips.push('Verbind hun huis met een weg naar hun werk.');
      if (tips.length) s.append(el('p', 'tipline', '💡 ' + esc(tips[0])));
      if (fam.hearts >= 4) s.append(el('p', 'muted small', 'Blije gezinnen geven je elke dag een cadeautje.'));
    });
  }

  function openPlayerCard() {
    const S = JV.state();
    openModal((s) => {
      s.append(el('h2', '', '💖 Jouw huis'));
      const wrap = el('div', 'player-card');
      wrap.append(JV.personCanvas(S.player.look, 120));
      const txt = el('div', '', '<b>Burgemeester ' + esc(S.player.name) + '</b><p class="muted">Je woont hier alleen. Je stad heeft ' + S.families.length + ' ' + (S.families.length === 1 ? 'gezin' : 'gezinnen') + ' en ' + S.families.reduce((a, f) => a + f.members.length, 0) + ' bewoners.</p>');
      const edit = el('button', 'btn', '✏️ Poppetje aanpassen'); edit.type = 'button';
      edit.addEventListener('click', () => { closeModal(); editPlayer(); });
      txt.append(edit);
      wrap.append(txt);
      s.append(wrap);
    });
  }
  function editPlayer() {
    const S = JV.state();
    openCreator(S.player, (d) => { S.player = d; JV.save(); show('game'); refreshHud(); });
  }

  function openTasks() {
    const S = JV.state();
    openModal((s) => {
      s.append(el('h2', '', '📋 Taken'));
      s.append(el('p', 'muted', 'Maak taken af voor extra munten en XP. Er komen steeds nieuwe bij.'));
      S.tasks.forEach((t) => {
        const row = el('div', 'task' + (t.done ? ' done' : ''));
        const pct = Math.round(t.progress / t.n * 100);
        row.innerHTML = '<div class="task-main"><b>' + esc(t.text) + '</b><div class="bar"><i style="width:' + pct + '%"></i></div><span class="muted small">' + (t.type === 'earn' ? t.progress + ' / ' + t.n : t.progress + ' van ' + t.n) + ' · beloning 🪙 ' + t.coins + ' + ' + t.xp + ' XP</span></div>';
        if (t.done) {
          const b = el('button', 'btn btn-primary', 'Ophalen'); b.type = 'button';
          b.addEventListener('click', () => {
            const r = JV.claimTask(t);
            if (r) { JV.sfx('coin'); JV.toast('+' + r.coins + ' munten en +' + r.xp + ' XP'); JV.save(); }
            closeModal(); openTasks();
          });
          row.append(b);
        }
        s.append(row);
      });
    });
  }

  function openResidents() {
    const S = JV.state();
    openModal((s) => {
      s.append(el('h2', '', '👪 Bewoners'));
      if (!S.families.length) { s.append(el('p', 'muted', 'Er wonen nog geen gezinnen in je stad. Bouw een woning in de bouwmodus (🔨), dan komt er een gezin wonen.')); return; }
      const total = S.families.reduce((a, f) => a + f.members.length, 0);
      s.append(el('p', 'muted', S.families.length + ' gezinnen · ' + total + ' bewoners. Tik op een gezin om hun huis te zien.'));
      const list = el('div', 'fam-list');
      S.families.slice().sort((a, b) => a.surname.localeCompare(b.surname, 'nl')).forEach((f) => {
        const b = el('button', 'fam-row'); b.type = 'button';
        const faces = el('div', 'faces');
        f.members.slice(0, 5).forEach((m) => faces.append(JV.personCanvas(m.look, 40)));
        b.append(faces, el('div', 'fam-txt', '<b>Familie ' + esc(f.surname) + '</b><span>' + f.members.map((m) => esc(m.first)).join(', ') + '</span>'), el('div', '', heartsHtml(f.hearts)));
        b.addEventListener('click', () => {
          closeModal();
          const h = S.objects.find((o) => o.id === f.houseId);
          if (h) { JV.focusOn(h.gx + 0.5, h.gy + 0.5); openHouseCard(h); }
        });
        list.append(b);
      });
      s.append(list);
    }, { wide: true });
  }

  function openSettings() {
    const S = JV.state();
    openModal((s) => {
      s.append(el('h2', '', '⚙️ Instellingen'));
      const snd = el('button', 'btn', S.settings.sound ? '🔊 Geluid staat aan' : '🔇 Geluid staat uit'); snd.type = 'button';
      snd.addEventListener('click', () => { S.settings.sound = !S.settings.sound; JV.save(); closeModal(); openSettings(); });
      s.append(snd);
      const edit = el('button', 'btn', '✏️ Poppetje aanpassen'); edit.type = 'button';
      edit.addEventListener('click', () => { closeModal(); editPlayer(); });
      s.append(edit);
      s.append(el('p', 'muted small', 'Je stad wordt na elke actie automatisch opgeslagen' + (JV.storage.isCloud() ? ', ook in je Claude-account.' : ' in deze browser.')));
      const fresh = el('button', 'btn btn-quiet', 'Nieuwe stad beginnen'); fresh.type = 'button';
      fresh.addEventListener('click', () => confirmBox('Weet je het zeker? Je huidige stad wordt gewist.', 'Ja, nieuwe stad', async () => {
        await JV.storage.clear(); stopBuild(); openCreator(null);
      }));
      s.append(fresh);
    });
  }

  function openLevelUp(ev) {
    JV.sfx('level');
    openModal((s) => {
      s.append(el('div', 'levelburst', '⭐'));
      s.append(el('h2', 'center', 'Level ' + ev.level + '!'));
      s.append(el('p', 'center', 'Je krijgt 💎 3 diamanten.'));
      if (ev.unlocks.length) {
        s.append(el('h3', 'center', 'Nieuw in de bouwwinkel'));
        const row = el('div', 'unlocks');
        ev.unlocks.forEach((k) => row.append(el('div', 'unlock', '<span class="e">' + C[k].icon + '</span><span>' + esc(C[k].name) + '</span>')));
        s.append(row);
      }
      const ok = el('button', 'btn btn-primary', 'Super!'); ok.type = 'button'; ok.addEventListener('click', closeModal);
      s.append(ok);
    });
  }

  function openFamilyArrived(f) {
    JV.sfx('win');
    openModal((s) => {
      s.append(el('h2', '', '📦 Welkom, familie ' + esc(f.surname) + '!'));
      s.append(el('p', 'muted', 'Er is een nieuw gezin in je stad komen wonen.'));
      const list = el('div', 'people');
      f.members.forEach((m) => list.append(personRow(m, f, memberSub(m))));
      s.append(list);
      if (f.pet) { const p = JV.PETS.find((x) => x.id === f.pet); s.append(el('p', '', 'Ze hebben een ' + p.icon + ' ' + p.name.toLowerCase() + ' meegenomen.')); }
      const ok = el('button', 'btn btn-primary', 'Hoi!'); ok.type = 'button'; ok.addEventListener('click', closeModal);
      s.append(ok);
    });
  }

  // --- bouwmodus ------------------------------------------------------------
  function startBuild() {
    ui.build = true; ui.tool = null; ui.ghost = null; ui.selected = null; ui.moving = null;
    JV.clearUndo();
    $('#buildbar').hidden = false;
    $('#app').classList.add('building');
    $('#btn-build').classList.add('on');
    $('#btn-build').setAttribute('aria-label', 'Bouwmodus sluiten');
    renderShop();
    hidePlacebar();
    JV.tip('build', 'Kies iets uit de winkel. Wegen teken je door te slepen. Gebouwen en huizen moeten aan een weg liggen. Tik op iets in je stad om het te verplaatsen of te verkopen.');
  }
  function stopBuild() {
    if (ui.moving) cancelMove();
    ui.build = false; ui.tool = null; ui.ghost = null; ui.selected = null;
    $('#buildbar').hidden = true; hidePlacebar();
    $('#app').classList.remove('building');
    $('#btn-build').classList.remove('on');
    $('#btn-build').setAttribute('aria-label', 'Bouwen');
    JV.clearUndo();
    JV.save();
  }
  function renderShop() {
    const S = JV.state();
    const tabs = $('#shop-tabs'); tabs.innerHTML = '';
    JV.SHOP_TABS.forEach((t) => {
      const b = el('button', 'tab' + (t.id === ui.tab ? ' on' : ''), t.icon + ' ' + t.label); b.type = 'button';
      b.setAttribute('aria-pressed', t.id === ui.tab ? 'true' : 'false');
      b.addEventListener('click', () => { ui.tab = t.id; renderShop(); });
      tabs.append(b);
    });
    const items = $('#shop-items'); items.innerHTML = '';
    Object.keys(C).filter((k) => C[k].cat === ui.tab).sort((a, b) => C[a].level - C[b].level || C[a].price - C[b].price).forEach((k) => {
      const d = C[k];
      const locked = d.level > S.level;
      const poor = !locked && S.coins < d.price;
      const b = el('button', 'shop-item' + (ui.tool === k ? ' on' : '') + (locked ? ' locked' : '') + (poor ? ' poor' : ''));
      b.type = 'button';
      b.innerHTML = '<span class="e">' + d.icon + '</span><span class="n">' + esc(d.name) + '</span><span class="p">' + (locked ? '🔒 Level ' + d.level : '🪙 ' + d.price) + '</span>' + (d.w > 1 ? '<span class="size">' + d.w + '×' + d.h + '</span>' : '');
      b.addEventListener('click', () => {
        if (locked) { JV.toast(d.name + ' komt vrij bij level ' + d.level + '.'); return; }
        if (ui.moving) cancelMove();
        ui.selected = null;
        ui.tool = ui.tool === k ? null : k;
        ui.ghost = null;
        JV.sfx('tap');
        renderShop();
        if (ui.tool) showPlaceHint(); else hidePlacebar();
      });
      items.append(b);
    });
    $('#btn-undo').disabled = !JV.canUndo();
  }

  function hidePlacebar() { $('#placebar').hidden = true; }
  function placebar(html, buttons) {
    const pb = $('#placebar');
    pb.innerHTML = '';
    pb.append(el('div', 'pb-text', html));
    const row = el('div', 'pb-btns');
    buttons.forEach(([label, cls, fn, disabled]) => {
      const b = el('button', 'btn ' + (cls || ''), label); b.type = 'button'; b.disabled = !!disabled;
      b.addEventListener('click', fn); row.append(b);
    });
    pb.append(row);
    pb.hidden = false;
  }
  function showPlaceHint() {
    const d = C[ui.tool];
    const one = d.w === 1;
    const S = JV.state();
    let txt = '<b>' + d.icon + ' ' + esc(d.name) + '</b> · 🪙 ' + d.price + '<br>';
    if (ui.tool === 'road') txt += 'Tik of sleep over de kaart om wegen te tekenen. Over water wordt het een brug (🪙 ' + JV.BRIDGE_PRICE + ').';
    else if (one) txt += 'Tik op een plek in je stad om te plaatsen.';
    else if (ui.ghost) txt += ui.ghost.ok ? 'Goede plek! Tik op Plaatsen.' : esc(ui.ghost.reason);
    else txt += 'Tik op de plek waar het moet komen.';
    if (d.cat === 'woning') txt += '<br><span class="small">Er komt een nieuw gezin wonen.</span>';
    const btns = [];
    if (!one && ui.ghost) {
      btns.push(['↔️ Draaien', '', () => { ui.ghost.flip = !ui.ghost.flip; }]);
      btns.push(['✓ Plaatsen', 'btn-primary', () => confirmPlace(), !ui.ghost.ok || S.coins < d.price]);
    }
    btns.push(['Stop', 'btn-quiet', () => { ui.tool = null; ui.ghost = null; renderShop(); hidePlacebar(); }]);
    placebar(txt, btns);
  }

  function setGhost(type, gx, gy, keepFlip) {
    const d = C[type];
    const ax = gx - Math.floor((d.w - 1) / 2), ay = gy - Math.floor((d.h - 1) / 2);
    const chk = JV.canPlace(type, ax, ay, ui.moving ? ui.moving.id : undefined);
    const flip = keepFlip != null ? keepFlip : (ui.ghost ? ui.ghost.flip : false);
    ui.ghost = { type, gx: ax, gy: ay, ok: chk.ok, reason: chk.reason, flip };
  }

  function placeAt(type, gx, gy, flip) {
    const S = JV.state();
    const price = JV.priceOf(type, gx, gy);
    const chk = JV.canPlace(type, gx, gy);
    if (!chk.ok) { JV.toast(chk.reason, 'warn'); JV.sfx('nope'); return null; }
    if (S.coins < price) { JV.toast('Niet genoeg munten. Ga werken om meer te verdienen!', 'warn'); JV.sfx('nope'); return null; }
    JV.snapshot();
    const r = JV.place(type, gx, gy);
    if (!r.ok) { JV.undo(); JV.toast(r.reason, 'warn'); return null; }
    if (flip) r.obj.flip = true;
    JV.sfx('build');
    JV.floatAt(r.obj, '-' + price + ' 🪙', '#A8322B');
    refreshHud(); renderShop();
    JV.save();
    return r.obj;
  }
  function confirmPlace() {
    const g = ui.ghost;
    if (!g) return;
    if (ui.moving) { finishMove(); return; }
    const obj = placeAt(g.type, g.gx, g.gy, g.flip);
    if (obj) {
      ui.ghost = null;
      if (C[g.type].w > 1) { ui.tool = null; renderShop(); hidePlacebar(); }
      else showPlaceHint();
    }
  }

  function selectObj(o) {
    ui.selected = o; ui.tool = null; ui.ghost = null; renderShop();
    const d = C[o.type];
    const v = JV.sellValue(o);
    const btns = [];
    if (d.cat !== 'natuur') btns.push(['✋ Verplaatsen', '', () => startMove(o)]);
    if (['woning', 'werk', 'eigen', 'deco'].includes(d.cat) && o.type !== 'tree' && o.type !== 'flowers') btns.push(['↔️ Draaien', '', () => { JV.snapshot(); JV.flipObj(o); JV.save(); renderShop(); }]);
    if (d.cat === 'natuur') btns.push(['🪓 Weghalen (🪙 ' + (-v) + ')', 'btn-primary', () => doSell(o)]);
    else if (d.cat !== 'eigen') btns.push(['💰 Verkopen (+' + v + ')', 'btn-danger', () => doSell(o)]);
    btns.push(['Sluiten', 'btn-quiet', () => { ui.selected = null; hidePlacebar(); }]);
    let name = d.icon ? d.icon + ' ' + d.name : d.name;
    if (d.cat === 'woning') { const f = JV.familyOf(o.id); if (f) name += ' · familie ' + esc(f.surname); }
    placebar('<b>' + name + '</b>', btns);
  }
  function doSell(o) {
    const d = C[o.type];
    const go = () => {
      JV.snapshot();
      const r = JV.sell(o);
      if (!r.ok) { JV.undo(); JV.toast(r.reason, 'warn'); return; }
      JV.sfx(r.value > 0 ? 'coin' : 'build');
      ui.selected = null; hidePlacebar(); refreshHud(); renderShop(); JV.save();
    };
    if (d.cat === 'woning') {
      const f = JV.familyOf(o.id);
      confirmBox('Als je dit huis verkoopt, verhuist familie ' + (f ? f.surname : '') + ' uit je stad. Weet je het zeker?', 'Ja, verkopen', go);
    } else if (d.cat === 'werk' && JV.workersOf(o).length) {
      confirmBox('De mensen die hier werken, moeten dan ander werk zoeken. Weet je het zeker?', 'Ja, verkopen', go);
    } else go();
  }
  function startMove(o) {
    ui.moving = o; ui.selected = null;
    const d = C[o.type];
    setGhost(o.type, o.gx + Math.floor((d.w - 1) / 2), o.gy + Math.floor((d.h - 1) / 2), o.flip);
    moveHint();
  }
  function moveHint() {
    const g = ui.ghost;
    placebar('<b>Verplaatsen</b><br>' + (g.ok ? 'Tik op een nieuwe plek en dan op Hier neerzetten.' : esc(g.reason)), [
      ['✓ Hier neerzetten', 'btn-primary', finishMove, !g.ok],
      ['Annuleren', 'btn-quiet', cancelMove],
    ]);
  }
  function finishMove() {
    const o = ui.moving, g = ui.ghost;
    if (!o || !g || !g.ok) return;
    JV.snapshot();
    const r = JV.moveObj(o, g.gx, g.gy);
    if (!r.ok) { JV.undo(); JV.toast(r.reason, 'warn'); return; }
    o.flip = g.flip;
    JV.sfx('build');
    ui.moving = null; ui.ghost = null; hidePlacebar(); renderShop(); JV.save();
  }
  function cancelMove() { ui.moving = null; ui.ghost = null; hidePlacebar(); }

  // --- invoer op de kaart ---------------------------------------------------
  const pointers = new Map();
  let dragStart = null, panning = false, painting = false, pinchStart = null, lastPaint = null;

  function tileFromEvent(e) {
    const r = JV.canvas.getBoundingClientRect();
    return JV.screenToTile(e.clientX - r.left, e.clientY - r.top);
  }
  function paintRoad(t) {
    const key = t.gx + ',' + t.gy;
    if (lastPaint === key) return;
    lastPaint = key;
    if (!JV.inside(t.gx, t.gy)) return;
    const o = JV.objAt(t.gx, t.gy);
    if (o) return;
    const S = JV.state();
    const price = JV.priceOf('road', t.gx, t.gy);
    if (S.coins < price) { if (!paintRoad.warned) { JV.toast('Niet genoeg munten voor meer weg.', 'warn'); paintRoad.warned = true; } return; }
    JV.snapshot();
    const r = JV.place('road', t.gx, t.gy);
    if (r.ok) { JV.sfx('tap'); refreshHud(); }
    else JV.undo();
  }

  function onTap(e) {
    const t = tileFromEvent(e);
    if (ui.build) {
      if (ui.moving) { setGhost(ui.moving.type, t.gx, t.gy); moveHint(); return; }
      if (ui.tool) {
        const d = C[ui.tool];
        if (ui.tool === 'road') { paintRoad.warned = false; lastPaint = null; paintRoad(t); renderShop(); JV.save(); return; }
        if (d.w === 1) { placeAt(ui.tool, t.gx, t.gy); return; }
        const prev = ui.ghost;
        const ax = t.gx - Math.floor((d.w - 1) / 2), ay = t.gy - Math.floor((d.h - 1) / 2);
        if (prev && prev.gx === ax && prev.gy === ay && prev.ok) { confirmPlace(); return; }
        setGhost(ui.tool, t.gx, t.gy);
        showPlaceHint();
        return;
      }
      const o = JV.objAt(t.gx, t.gy);
      if (o) { JV.sfx('tap'); selectObj(o); } else { ui.selected = null; hidePlacebar(); }
      return;
    }
    const o = JV.objAt(t.gx, t.gy);
    if (!o) return;
    const d = C[o.type];
    JV.sfx('tap');
    if (d.cat === 'werk') openWorkCard(o);
    else if (d.cat === 'woning') openHouseCard(o);
    else if (d.cat === 'eigen') openPlayerCard();
    else if (d.cat === 'natuur') JV.toast('Wil je dit weghalen? Open de bouwmodus 🔨 en tik erop.');
    else if (o.type === 'fountain') JV.toast('Wat een mooie fontein!');
  }

  function bindCanvas(cv) {
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        dragStart = { x: e.clientX, y: e.clientY, cx: JV.cam.x, cy: JV.cam.y };
        panning = false; painting = false; lastPaint = null; paintRoad.warned = false;
        if (ui.build && ui.tool === 'road' && e.button === 0) painting = 'maybe';
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: JV.cam.zoom };
        painting = false; panning = true;
      }
    });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && ui.build && !pointers.size) {
        const t = tileFromEvent(e);
        if (ui.moving) { setGhost(ui.moving.type, t.gx, t.gy); }
        else if (ui.tool) {
          const d = C[ui.tool];
          if (d.w === 1) setGhost(ui.tool, t.gx, t.gy);
        }
      }
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && pinchStart) {
        const [a, b] = [...pointers.values()];
        JV.cam.zoom = pinchStart.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinchStart.d;
        JV.clampCam();
        return;
      }
      if (!dragStart) return;
      const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
      if (painting) {
        if (painting === 'maybe' && Math.hypot(dx, dy) > 4) painting = true;
        if (painting === true) paintRoad(tileFromEvent(e));
        return;
      }
      if (!panning && Math.hypot(dx, dy) > 7) panning = true;
      if (panning) {
        JV.cam.x = dragStart.cx - dx / JV.cam.zoom;
        JV.cam.y = dragStart.cy - dy / JV.cam.zoom;
        JV.clampCam();
      }
    });
    const end = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      if (pointers.size === 0) {
        if (painting === true) { renderShop(); JV.save(); }
        else if (!panning && dragStart && e.type === 'pointerup') onTap(e);
        dragStart = null; panning = false; painting = false; pinchStart = null;
      }
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && ui.build && ui.tool && C[ui.tool].w === 1) ui.ghost = null; });
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const sx = e.clientX - r.left, sy = e.clientY - r.top;
      const before = { x: (sx - JV.view.w / 2) / JV.cam.zoom + JV.cam.x, y: (sy - JV.view.h / 2) / JV.cam.zoom + JV.cam.y };
      JV.cam.zoom *= Math.exp(-e.deltaY * 0.0015);
      JV.clampCam();
      JV.cam.x = before.x - (sx - JV.view.w / 2) / JV.cam.zoom;
      JV.cam.y = before.y - (sy - JV.view.h / 2) / JV.cam.zoom;
      JV.clampCam();
    }, { passive: false });
  }

  // --- tips op het juiste moment --------------------------------------------
  function checkTips() {
    const S = JV.state();
    if (!S || ui.screen !== 'game' || ui.modalOpen || !$('#minigame').hidden) return;
    if (S.worked.super >= 1 && !S.tipsSeen.afterwork) JV.tip('afterwork', 'Goed gewerkt! Met je munten kun je bouwen. Tik op de hamer 🔨 rechtsonder en bouw een huis, dan komt er een gezin wonen.');
    else if (S.objects.some((o) => C[o.type].cat === 'werk' && (o.pending || 0) >= 5) && !S.tipsSeen.collect) JV.tip('collect', 'Er liggen munten klaar! Gebouwen met personeel verdienen elke dag vanzelf geld. Tik op het gebouw om ze op te halen.');
    else if (JV.darkness() > 0.5 && !S.tipsSeen.night) JV.tip('night', 'Het is nacht. Iedereen is thuis. Lantaarns maken je stad \'s avonds extra mooi.');
    else if (S.tasks.some((t) => t.done) && !S.tipsSeen.task) JV.tip('task', 'Je hebt een taak af! Tik op 📋 Taken om je beloning op te halen.');
  }
  JV.checkTips = checkTips;

  // --- canvas-grootte -------------------------------------------------------
  function resize() {
    const cv = JV.canvas;
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    JV.view.w = r.width; JV.view.h = r.height; JV.view.dpr = dpr;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  }
  JV.resize = resize;

  // --- alles aan elkaar knopen ----------------------------------------------
  JV.initUI = function () {
    JV.canvas = $('#city');
    bindCanvas(JV.canvas);
    window.addEventListener('resize', resize);
    $('#creator-done').addEventListener('click', creatorFinish);
    $('#player-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') creatorFinish(); });
    $('#creator-back').addEventListener('click', () => { if (creatorDone) { show('game'); } else JV.boot(); });
    $('#house-done').addEventListener('click', houseFinish);
    $('#house-back').addEventListener('click', () => openCreator(draft));
    $('#btn-build').addEventListener('click', () => { JV.sfx('tap'); ui.build ? stopBuild() : startBuild(); });
    $('#btn-tasks').addEventListener('click', () => { JV.sfx('tap'); openTasks(); });
    $('#btn-people').addEventListener('click', () => { JV.sfx('tap'); openResidents(); });
    $('#btn-settings').addEventListener('click', () => { JV.sfx('tap'); openSettings(); });
    $('#btn-undo').addEventListener('click', () => { if (JV.undo()) { JV.sfx('tap'); ui.selected = null; ui.ghost = null; hidePlacebar(); refreshHud(); renderShop(); JV.save(); } });
    $('#btn-done').addEventListener('click', stopBuild);
    $('#guide-close').addEventListener('click', hideGuide);
    $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (ui.modalOpen) closeModal();
      else if (ui.moving) cancelMove();
      else if (ui.tool) { ui.tool = null; ui.ghost = null; renderShop(); hidePlacebar(); }
      else if (ui.build) stopBuild();
    });
    // het creator-veld voor jongen/meisje
    JV.on('levelup', (ev) => { modalQueue.push(() => openLevelUp(ev)); setTimeout(JV.flushPending, 300); });
    JV.on('family', (f) => {
      modalQueue.push(() => openFamilyArrived(f));
      setTimeout(() => { JV.flushPending(); JV.tip('family', 'Er is een nieuw gezin komen wonen! Iedereen in een gezin heeft dezelfde achternaam. De volwassenen gaan werken in jouw gebouwen.'); }, 700);
    });
    JV.on('tasks', refreshHud);
    JV.on('xp', refreshHud);
  };
  const modalQueue = [];
  JV.flushPending = function () {
    if (modalQueue.length && $('#minigame').hidden && !ui.modalOpen && ui.screen === 'game') modalQueue.shift()();
  };
})(window.JV);
