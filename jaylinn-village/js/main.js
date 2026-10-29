// Jaylinn Village – opstarten en de spellus.
(function (JV) {
  let last = performance.now();
  let t = 0;
  let saveClock = 0, tipClock = 0, hudClock = 0;

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    t += dt;
    const S = JV.state();
    if (S && JV.ui.screen === 'game') {
      const playing = document.getElementById('minigame').hidden;
      if (playing) JV.update(dt);
      const ctx = JV.canvas.getContext('2d');
      JV.render(ctx, t, JV.ui);
      hudClock -= dt;
      if (hudClock <= 0) { hudClock = 0.25; JV.refreshHud(); JV.flushPending(); }
      tipClock -= dt;
      if (tipClock <= 0) { tipClock = 2; JV.checkTips(); }
      saveClock -= dt;
      if (saveClock <= 0) { saveClock = 30; JV.save(true); }
    }
    requestAnimationFrame(frame);
  }

  JV.boot = async function () {
    JV.show('start');
    const box = document.getElementById('start-actions');
    box.innerHTML = '<p class="start-info">Laden…</p>';
    if (!JV.storage.ready) await JV.storage.init();
    const saved = await JV.storage.load();
    JV.showStart(saved && (saved.v === 1 || saved.v === 2) ? saved : null);
  };

  function start() {
    JV.initUI();
    document.addEventListener('visibilitychange', () => { if (document.hidden) JV.save(true); });
    window.addEventListener('pagehide', () => JV.save(true));
    requestAnimationFrame(frame);
    JV.boot();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window.JV);
