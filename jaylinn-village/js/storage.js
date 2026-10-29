// Jaylinn Village – opslaan. Altijd in de browser; in een Claude-artifact ook in de
// privé-opslag van de speler, zodat de stad op een ander apparaat verder kan.
(function (JV) {
  const KEY = 'jaylinn-village-save-v1';
  const S = { db: null, uid: null, ready: false, writing: false, pending: null };

  function withTimeout(p, ms) {
    return Promise.race([p, new Promise((res) => setTimeout(() => res(null), ms))]);
  }

  S.init = async function () {
    try {
      if (window.claude && typeof window.claude.use === 'function') {
        const [db, user] = await withTimeout(Promise.all([window.claude.use('db'), window.claude.use('user')]), 4000) || [];
        if (db && user) {
          const uid = await withTimeout(user.id(), 3000);
          if (uid) { S.db = db; S.uid = uid; }
        }
      }
    } catch (e) { S.db = null; }
    S.ready = true;
  };

  function docRef() { return S.db.collection('data/users/' + S.uid).doc('save'); }

  function readLocal() {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  S.load = async function () {
    const local = readLocal();
    let remote = null;
    if (S.db) {
      try {
        const snap = await withTimeout(docRef().get(), 5000);
        if (snap && snap.exists) remote = JSON.parse(snap.data().json);
      } catch (e) { remote = null; }
    }
    if (local && remote) return (remote.savedAt || 0) > (local.savedAt || 0) ? remote : local;
    return remote || local;
  };

  async function flushRemote() {
    if (!S.db || S.writing || !S.pending) return;
    S.writing = true;
    const json = S.pending; S.pending = null;
    try { await docRef().set({ json, savedAt: Date.now() }); } catch (e) { /* lokaal staat het al */ }
    S.writing = false;
    if (S.pending) setTimeout(flushRemote, 1500);
  }

  let remoteTimer = null;
  S.save = function (state) {
    state.savedAt = Date.now();
    const json = JSON.stringify(state);
    try { localStorage.setItem(KEY, json); } catch (e) { /* privévenster: alleen in geheugen */ }
    if (S.db) {
      S.pending = json;
      clearTimeout(remoteTimer);
      remoteTimer = setTimeout(flushRemote, 2000);
    }
  };

  S.clear = async function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* niets */ }
    if (S.db) { try { await docRef().delete(); } catch (e) { /* niets */ } }
  };

  S.isCloud = function () { return !!S.db; };

  JV.storage = S;
})(window.JV);
