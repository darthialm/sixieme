/* =========================================================
   SUIVI DES ÉLÈVES — côté site (6e, 5e, jeux)
   - connexion avec le code personnel de l'élève (carte ou QR) ;
   - envoie chaque réponse au serveur (file d'attente gardée sur l'appareil si le réseau coupe) ;
   - garde une copie en ligne de la progression, SANS JAMAIS l'effacer de l'appareil.

   Deux sortes d'appareils :
   - « mon appareil à moi » : au premier passage, la progression déjà sur l'appareil part sur le compte de l'élève
     (fusionnée avec celle qui est en ligne). Le site continue d'utiliser ses clés habituelles.
   - « tablette de la classe » : la progression de la tablette (celle des élèves non connectés) est mise de côté,
     l'élève retrouve la sienne, et à la déconnexion la tablette reprend exactement son état d'avant.

   Utilisation (avant script.js) :
     <script src="suivi.js"></script>
     <script>Suivi.init({ niveau: '6', keys: ['revisions6e-v1'] });</script>
   puis Suivi.log({ src: 'exo', ch: 'cercle', comp: 'rayon', ok: false, rep: '8', att: '4', err: 'diametre-rayon' });
   ========================================================= */
(function () {
  'use strict';
  const API = 'https://aurarush.alwaysdata.net/suivi/api.php';
  const L = {                                   // clés du navigateur (communes à tous les sites de darthialm.github.io)
    session: 'suivi-session', file: 'suivi-file', appareil: 'suivi-appareil', proprio: 'suivi-proprio',
    anon: (k) => 'suivi-anon:' + k, sync: (k) => 'suivi-sync:' + k, attente: 'suivi-attente',
  };
  const IDLE_CLASSE = 2 * 3600 * 1000;          // tablette de la classe : déconnexion après 2 h sans activité
  const FLUSH_MS = 20000;

  /* Toutes les progressions gardées dans le navigateur par les sites et leurs jeux (6e et 5e : même adresse,
     darthialm.github.io). Elles sont TOUTES échangées sur une tablette de la classe, quelle que soit la page où
     l'élève se connecte. Un nouveau jeu qui garde une progression doit ajouter sa clé ici. */
  const CLES = [
    'revisions6e-v1', 'revisions5e-v2',                                       // sites (statistiques, Mes erreurs, automatismes)
    'revisions6e-jeu-fractions', 'revisions6e-droite-parfaite', 'revisions6e-estimangle-1deg', // Pont des fractions, jeux.js
    'atlas6.v1', 'u6e-corsaires', 'u6e-vitrail',                              // jeux de 6e
    'u5e-alchimix2', 'u5e-z-ou-f', 'u5e-code-rouge', 'u5e-juniper',           // jeux de 5e
  ];
  let cfg = { niveau: '', keys: CLES.slice(), merge: {}, api: API };
  let flushing = false, listeners = [];

  /* ---------- petits outils ---------- */
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { if (v === null || v === undefined) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e) { return false; } };
  const getJ = (k, d) => { try { const v = JSON.parse(get(k)); return v === null ? d : v; } catch (e) { return d; } };
  const setJ = (k, v) => set(k, JSON.stringify(v));
  const cid = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  const parse = (s) => { try { return JSON.parse(s); } catch (e) { return null; } };

  async function call(a, body) {
    let r;
    try {
      r = await fetch(cfg.api + '?a=' + a, {
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // requête simple : pas de pré-vérification CORS
        body: JSON.stringify(body || {}), cache: 'no-store',
      });
    } catch (e) { throw Object.assign(new Error('Pas de connexion au serveur. Vérifie le réseau, ou réessaie plus tard.'), { status: 0 }); }
    let j = null; try { j = await r.json(); } catch (e) { /* réponse illisible */ }
    if (!j) throw Object.assign(new Error('Le serveur ne répond pas.'), { status: r.status });
    if (!j.ok) throw Object.assign(new Error(j.error || 'Erreur.'), { status: r.status });
    return j;
  }

  /* Fusion par défaut de deux progressions : nombres → le plus grand, listes → réunion, objets → clé par clé,
     le reste → la version de l'appareil. Un site peut donner sa propre fusion par clé (cfg.merge[clé]). */
  function deepMerge(a, b) {
    if (a === null || a === undefined) return b;
    if (b === null || b === undefined) return a;
    if (typeof a === 'number' && typeof b === 'number') return Math.max(a, b);
    if (Array.isArray(a) && Array.isArray(b)) {
      const seen = new Set(a.map((x) => JSON.stringify(x))); const out = a.slice();
      for (const x of b) { const s = JSON.stringify(x); if (!seen.has(s)) { seen.add(s); out.push(x); } }
      return out;
    }
    if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      const out = Object.assign({}, b);
      for (const k of Object.keys(a)) out[k] = deepMerge(a[k], b[k]);
      return out;
    }
    return a;
  }
  const merge = (k, local, online) => (cfg.merge[k] || deepMerge)(local, online);

  /* Fusion de la progression des sites de révision (revisions6e-v1, revisions5e-v2) :
     - par type d'exercice { ok, total, hint, last } : la version qui a le plus de réponses ;
     - « Mes erreurs » (_weak) : pour chaque type, la version de l'appareil où il a été travaillé le plus récemment
       (_wt garde l'heure) : un point faible corrigé sur un appareil ne revient pas à cause d'un autre ;
     - contrôles blancs, devoirs : la version la plus avancée, meilleure note gardée ;
     - automatismes (_auto) : la série du jour le plus récent, record gardé ;
     - prénom, classe : ceux de l'appareil. */
  const dayNum = (s) => { const m = /^(\d+)-(\d+)-(\d+)$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : 0; };
  function fusionRevisions(a, b) {
    a = a || {}; b = b || {};
    const out = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (k === '_weak' || k === '_wt') continue;
      const va = a[k], vb = b[k];
      if (vb === undefined) { out[k] = va; continue; }
      if (va === undefined) { out[k] = vb; continue; }
      if (k === '_name' || k === '_classe') out[k] = va || vb;
      else if (k === '_auto') {
        const na = dayNum(va.last), nb = dayNum(vb.last);
        out[k] = Object.assign({}, nb > na ? vb : va, { best: Math.max(va.best || 0, vb.best || 0) });
      } else if (va && vb && typeof va === 'object' && 'total' in va && 'total' in vb) {
        out[k] = Object.assign({}, (vb.total || 0) > (va.total || 0) ? vb : va);
        if (va.last || vb.last) out[k].last = Math.max(va.last || 0, vb.last || 0);
      } else if (/:controle$/.test(k)) {
        out[k] = Object.assign({}, (vb.n || 0) > (va.n || 0) ? vb : va, { best: Math.max(va.best || 0, vb.best || 0) });
      } else if (/^devoir:/.test(k)) {
        out[k] = Object.assign({}, (vb.tries || 0) > (va.tries || 0) ? vb : va, { best: Math.max(va.best || 0, vb.best || 0) });
      } else out[k] = deepMerge(va, vb);
    }
    const wa = a._weak || {}, wb = b._weak || {}, ta = a._wt || {}, tb = b._wt || {};
    const weak = {}, wt = {};
    for (const k of [...new Set([...Object.keys(wa), ...Object.keys(wb), ...Object.keys(ta), ...Object.keys(tb)])].sort()) {   // trié : fusionner deux fois donne le même texte
      const tA = ta[k] || (a[k] && a[k].last) || 0, tB = tb[k] || (b[k] && b[k].last) || 0;
      const win = tB > tA ? wb : wa;                        // à égalité : l'appareil
      if (k in win) weak[k] = win[k];
      if (tA || tB) wt[k] = Math.max(tA, tB);
    }
    if (Object.keys(weak).length || a._weak || b._weak) out._weak = weak;
    if (Object.keys(wt).length) out._wt = wt;
    return out;
  }

  /* Ce que l'élève a répondu, lu dans la zone de la question (champs, cases, choix) */
  function reponse(qEl) {
    if (!qEl) return null;
    const parts = [];
    qEl.querySelectorAll('input, select, textarea').forEach((i) => {
      if (i.type === 'checkbox' || i.type === 'radio') { if (i.checked) parts.push(i.value && i.value !== 'on' ? i.value : (i.closest('label')?.textContent || '✓').trim()); }
      else if (i.type !== 'button' && i.type !== 'hidden' && i.value !== '') parts.push(i.value);
    });
    if (qEl.dataset.sel) parts.push(qEl.dataset.sel);
    if (qEl.dataset.order) parts.push(qEl.dataset.order);
    qEl.querySelectorAll('.sel, .selected, [aria-pressed="true"]').forEach((e) => { const t = (e.dataset.v || e.textContent || '').trim(); if (t && parts.length < 12) parts.push(t); });
    return parts.length ? parts.join(' | ').slice(0, 200) : null;
  }
  const texte = (html) => { if (!html) return null; const d = document.createElement('div'); d.innerHTML = String(html); d.querySelectorAll('svg, script, style, table, canvas').forEach((e) => e.remove()); d.querySelectorAll('*').forEach((e) => e.append(' ')); return d.textContent.replace(/\s+/g, ' ').trim() || null; };

  /* ---------- session ---------- */
  const session = () => getJ(L.session, null);
  function touch() { const s = session(); if (s) { s.act = Date.now(); setJ(L.session, s); } }
  const appareil = () => get(L.appareil);       // 'perso' | 'classe' | null (pas encore demandé)
  /* sur un appareil perso déjà utilisé par un autre élève (tablette familiale), on travaille comme sur une tablette de classe */
  const modeEchange = (s) => !s.perso || (getJ(L.proprio, null) !== null && getJ(L.proprio, null) !== s.me.id);

  /* ---------- progression ---------- */
  async function pull(s) {
    const j = await call('progress_get', { token: s.token, keys: cfg.keys });
    return j.progress || {};
  }
  async function push(s, k, value) {
    await call('progress_put', { token: s.token, k, v: value });
    setJ(L.sync(k), { sid: s.me.id, s: JSON.stringify(value), at: Date.now() });
  }
  /* Envoie ce qui a changé sur l'appareil depuis le dernier envoi (après fusion avec la version en ligne). */
  async function syncUp() {
    const s = session(); if (!s) return;
    const changed = cfg.keys.filter((k) => { const raw = get(k); const last = getJ(L.sync(k), null); return raw !== null && (!last || last.sid !== s.me.id || last.s !== raw); });
    if (!changed.length) return;
    const online = await pull(s);
    for (const k of changed) {
      const local = parse(get(k)); if (local === null) continue;
      const m = online[k] ? merge(k, local, online[k].v) : local;
      await push(s, k, m);
    }
  }
  /* Au chargement d'une page : si un autre appareil a avancé entre-temps, on récupère sa progression. */
  async function syncDown() {
    const s = session(); if (!s) return false;
    const online = await pull(s); let changed = false;
    for (const k of cfg.keys) {
      if (!online[k]) continue;
      const last = getJ(L.sync(k), null);
      if (last && last.sid === s.me.id && online[k].updated * 1000 <= last.at) continue;   // rien de neuf en ligne
      const raw = get(k); const local = parse(raw);
      const m = local === null ? online[k].v : merge(k, local, online[k].v);
      const ms = JSON.stringify(m);
      if (ms !== raw) { set(k, ms); changed = true; }
      if (ms !== JSON.stringify(online[k].v)) await push(s, k, m); else setJ(L.sync(k), { sid: s.me.id, s: ms, at: Date.now() });
    }
    return changed;
  }

  /* ---------- connexion / déconnexion ---------- */
  async function login(code, perso) {
    const j = await call('login', { code, perso: perso ? 1 : 0 });
    const s = { token: j.token, me: j.me, perso: !!j.perso, since: Date.now(), act: Date.now() };
    const online = await pull(s).catch(() => ({}));
    if (!modeEchange(s)) {
      /* appareil de l'élève : on fusionne ce qui est déjà ici avec ce qui est en ligne, et on envoie */
      for (const k of cfg.keys) {
        const local = parse(get(k));
        const m = online[k] ? (local === null ? online[k].v : merge(k, local, online[k].v)) : local;
        if (m === null) continue;
        set(k, JSON.stringify(m));
        await push(s, k, m).catch(() => {});
      }
      setJ(L.proprio, s.me.id);
    } else {
      /* tablette de la classe : on met de côté la progression de la tablette, puis on charge celle de l'élève */
      for (const k of cfg.keys) {
        if (get(L.anon(k)) === null) setJ(L.anon(k), { v: get(k) });   // déjà de côté (session précédente interrompue) : on garde l'ancienne
        if (online[k]) { const ms = JSON.stringify(online[k].v); set(k, ms); setJ(L.sync(k), { sid: s.me.id, s: ms, at: Date.now() }); }
        else set(k, null);
      }
    }
    setJ(L.session, s);
    emit();
    return s;
  }
  function restoreAnon() {
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith('suivi-anon:')) continue;
      const key = k.slice('suivi-anon:'.length); const saved = getJ(k, { v: null });
      set(key, saved.v); set(k, null); set(L.sync(key), null);
    }
  }
  async function logout() {
    const s = session();
    if (s) {
      await flush().catch(() => {});
      let synced = true;
      await syncUp().catch(() => { synced = false; });
      if (modeEchange(s)) {
        /* pas de réseau : la progression de l'élève attend sur la tablette et partira plus tard */
        if (!synced) {
          const att = getJ(L.attente, []);
          for (const k of cfg.keys) { const v = parse(get(k)); if (v !== null) att.push({ t: s.token, k, v }); }
          setJ(L.attente, att.slice(-50));
        }
        restoreAnon();
      }
      call('logout', { token: s.token }).catch(() => {});
    }
    set(L.session, null);
    emit();
  }

  /* ---------- journal des réponses ---------- */
  function log(ev) {
    const s = session(); if (!s || !ev || !ev.src) return;
    push1(s.token, s.me.niveau, ev);
    touch();
  }
  function push1(token, niveau, ev) {
    const q = getJ(L.file, []);
    q.push({ t: token, e: Object.assign({ cid: cid(), ts: Math.floor(Date.now() / 1000), niveau: cfg.niveau || niveau }, ev) });
    setJ(L.file, q.slice(-3000));
    if (q.length >= 10) flush();
  }

  /* ---------- joueurs d'un duel : chacun tape son code sur sa moitié de tablette ----------
     Ne touche pas à la progression de la tablette : seules les réponses sont enregistrées sur le compte du joueur. */
  async function joueur(code) {
    const j = await call('login', { code, perso: 0 });
    return { token: j.token, me: j.me };
  }
  /* ---------- Espace professeur des sites : envoyer les résultats d'un contrôle papier au suivi ----------
     payload = { niveau, id, titre, date, classe, keys: [clé GENS…], chs: [chapitre…], copies: [{ n, name, lv: [..], bits: [..], lien }] }
     host : l'élément où afficher l'état (code prof si besoin, copies non reconnues à rattacher à la main). */
  function envoyerControle(host, payload) {
    const mapKey = `suivi-map:${payload.niveau}-${payload.id}`;
    const esc2 = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const say = (html, cls) => { host.className = 'small ' + (cls || ''); host.innerHTML = html; };
    const askCode = (msg) => {
      say(`${msg ? `<span class="ko-t">${esc2(msg)}</span><br>` : ''}<b>Code prof du suivi</b> (le même que pour Aura Rush) :
        <input type="password" class="sv-pcode" autocomplete="current-password" style="width:10em"> <button type="button" class="mini sv-pgo">Envoyer</button>`);
      const i = host.querySelector('.sv-pcode'), go = async () => {
        try { const j = await call('prof_login', { code: i.value }); try { sessionStorage.setItem('suivi-ptoken', j.ptoken); } catch (e) { /* rien */ } send(); }
        catch (e) { askCode(e.message); }
      };
      host.querySelector('.sv-pgo').onclick = go; i.onkeydown = (e) => { if (e.key === 'Enter') go(); }; i.focus();
    };
    async function send() {
      let pt = null; try { pt = sessionStorage.getItem('suivi-ptoken'); } catch (e) { /* rien */ }
      if (!pt) { askCode(); return; }
      say('⏳ Envoi au suivi…');
      let j;
      try { j = await call('prof_controle', Object.assign({ ptoken: pt, map: getJ(mapKey, {}) }, payload)); }
      catch (e) {
        if (e.status === 401) { try { sessionStorage.removeItem('suivi-ptoken'); } catch (x) { /* rien */ } askCode('Session prof terminée : retape ton code.'); return; }
        say('⚠ ' + esc2(e.message), 'warn'); return;
      }
      let html = `✔ <b>${j.saved}</b> copie${j.saved > 1 ? 's' : ''} enregistrée${j.saved > 1 ? 's' : ''} dans le suivi des élèves.`;
      if (j.unmatched.length) {
        const opts = (u) => {
          const byId = new Map(j.eleves.map((s) => [s.id, s])), first = u.cands.map((id) => byId.get(id)).filter(Boolean);
          const rest = j.eleves.filter((s) => !u.cands.includes(s.id)).sort((a, b) => (a.classe + a.nom).localeCompare(b.classe + b.nom, 'fr'));
          return `<option value="">— choisir l'élève —</option>${first.map((s) => `<option value="${s.id}">${esc2(s.nom)} (${esc2(s.classe)})</option>`).join('')}
            ${first.length ? '<option disabled>──────────</option>' : ''}${rest.map((s) => `<option value="${s.id}">${esc2(s.nom)} (${esc2(s.classe)})</option>`).join('')}
            <option value="-1">✕ ne pas enregistrer cette copie</option>`;
        };
        html += `<br>⚠ ${j.unmatched.length} copie${j.unmatched.length > 1 ? 's' : ''} à rattacher (prénom pas trouvé, ou plusieurs élèves possibles) :
          ${j.unmatched.map((u) => `<br>Copie ${u.n} « ${esc2(u.name)} » → <select data-n="${u.n}">${opts(u)}</select>`).join('')}
          <br><button type="button" class="mini sv-remap">Enregistrer ces copies</button>`;
      }
      say(html, j.unmatched.length ? 'warn' : 'ok-t');
      const b = host.querySelector('.sv-remap');
      if (b) b.onclick = () => {
        const m = getJ(mapKey, {});
        host.querySelectorAll('select[data-n]').forEach((s) => { if (s.value) m[s.dataset.n] = Number(s.value); });
        setJ(mapKey, m); send();
      };
    }
    send();
  }

  /** une décision dans un jeu SOLO (jeux sans le moteur commun) : ev = { jeu, ch, comp, ok, rep, att, err, extra } */
  function jeu(ev) {
    if (!ev || !session()) return;
    try { log(Object.assign({ src: 'jeu' }, ev, { extra: Object.assign({ jeu: ev.jeu }, ev.extra || {}) })); } catch (e) { /* rien */ }
  }
  function logPour(j, ev) { if (j && j.token && ev && ev.src) push1(j.token, j.me && j.me.niveau, ev); }
  async function finJoueur(j) {
    if (!j || !j.token) return;
    await flush().catch(() => {});
    call('logout', { token: j.token }).catch(() => {});
  }
  async function flush() {
    if (flushing) return; flushing = true;
    try {
      let q = getJ(L.file, []);
      while (q.length) {
        const tok = q[0].t; const lot = q.filter((x) => x.t === tok).slice(0, 200);
        try { await call('events', { token: tok, events: lot.map((x) => x.e) }); }
        catch (e) {
          if (e.status === 401) { /* jeton trop vieux (plus de 14 jours) : ces réponses ne peuvent plus être rattachées */ }
          else break;                                                         // pas de réseau : on réessaiera
        }
        const sent = new Set(lot.map((x) => x.e.cid));
        q = getJ(L.file, []).filter((x) => !sent.has(x.e.cid)); setJ(L.file, q);
      }
      /* progressions restées sur une tablette de classe déconnectée sans réseau */
      let att = getJ(L.attente, []);
      while (att.length) {
        const p = att[0];
        try {
          const j = await call('progress_get', { token: p.t, keys: [p.k], late: 1 });
          const on = (j.progress || {})[p.k];
          await call('progress_put', { token: p.t, k: p.k, v: on ? merge(p.k, p.v, on.v) : p.v, late: 1 });
        } catch (e) { if (e.status !== 401) break; }
        att = getJ(L.attente, []).slice(1); setJ(L.attente, att);
      }
    } finally { flushing = false; }
  }

  /* ---------- fenêtre de connexion ---------- */
  const CSS = `
.sv-veil{position:fixed;inset:0;background:rgba(10,20,40,.55);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;font-family:inherit}
.sv-box{background:#fff;color:#1a2233;border-radius:16px;max-width:380px;width:100%;padding:22px 22px 18px;box-shadow:0 12px 40px rgba(0,0,0,.25)}
.sv-box h2{margin:0 0 12px;font-size:20px}
.sv-box p{margin:6px 0;font-size:15px;line-height:1.45}
.sv-code{width:100%;box-sizing:border-box;font-size:28px;letter-spacing:.18em;text-align:center;text-transform:uppercase;padding:10px;border:2px solid #b9c4d6;border-radius:12px;margin:8px 0;font-family:ui-monospace,monospace}
.sv-code:focus{outline:none;border-color:#2a78d6}
.sv-row{display:flex;gap:8px;margin-top:10px}
.sv-btn{flex:1;font:inherit;font-size:15px;padding:11px 10px;border-radius:12px;border:2px solid #2a78d6;background:#2a78d6;color:#fff;cursor:pointer}
.sv-btn.sv-sec{background:#fff;color:#2a78d6}
.sv-btn:disabled{opacity:.6}
.sv-err{color:#b3261e;min-height:1.3em;font-size:14px}
.sv-pick{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
.sv-pick button{font:inherit;font-size:15px;padding:14px 8px;border-radius:12px;border:2px solid #b9c4d6;background:#f5f8fc;color:#1a2233;cursor:pointer;line-height:1.3}
.sv-pick button b{display:block;font-size:26px}
.sv-small{font-size:13px;color:#5a6478;background:none;border:0;padding:0;margin-top:12px;cursor:pointer;text-decoration:underline}
.sv-badge{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:14px;padding:6px 12px;border-radius:999px;border:1.5px solid currentColor;background:transparent;color:inherit;cursor:pointer}
`;
  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function ensureCss() { if (!document.getElementById('sv-css')) { const s = document.createElement('style'); s.id = 'sv-css'; s.textContent = CSS; document.head.appendChild(s); } }
  const fmt = (c) => { c = c.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6); return c.length > 3 ? c.slice(0, 3) + '-' + c.slice(3) : c; };

  function ouvrir(prefill) {
    ensureCss();
    const s = session();
    const veil = el('<div class="sv-veil"><div class="sv-box" role="dialog" aria-modal="true"></div></div>');
    const box = veil.firstChild;
    const close = () => veil.remove();
    veil.addEventListener('click', (e) => { if (e.target === veil) close(); });
    document.body.appendChild(veil);

    if (s) {
      box.innerHTML = `<h2>👤 ${esc(s.me.prenom)} ${esc(s.me.nom.charAt(0))}.</h2>
        <p>Tu es connecté${s.perso ? ' sur ton appareil' : ' sur une tablette de la classe'}. Ton travail est enregistré sur ton compte.</p>
        <div class="sv-row"><button class="sv-btn sv-sec" data-x>Fermer</button><button class="sv-btn" data-out>Me déconnecter</button></div>`;
      box.querySelector('[data-x]').onclick = close;
      box.querySelector('[data-out]').onclick = async (e) => { e.target.disabled = true; await logout(); location.reload(); };
      return;
    }
    const step2 = (code) => {
      box.innerHTML = `<h2>Sur quel appareil es-tu ?</h2>
        <div class="sv-pick"><button data-p="perso"><b>📱</b>Mon appareil à moi</button><button data-p="classe"><b>🏫</b>Une tablette de la classe</button></div>
        <p style="font-size:13px;color:#5a6478;margin-top:12px">La question n'est posée qu'une fois sur cet appareil.</p>`;
      box.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { set(L.appareil, b.dataset.p); go(code); });
    };
    const go = async (code) => {
      box.innerHTML = '<p>Connexion…</p>';
      try { await login(code, appareil() === 'perso'); location.reload(); }
      catch (e) { step1(code, e.message); }
    };
    const step1 = (code, err) => {
      box.innerHTML = `<h2>Me connecter</h2><p>Tape le code de ta carte.</p>
        <input class="sv-code" maxlength="7" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC-123">
        <div class="sv-err">${esc(err || '')}</div>
        <div class="sv-row"><button class="sv-btn sv-sec" data-x>Annuler</button><button class="sv-btn" data-ok>Valider</button></div>
        ${appareil() ? `<button class="sv-small" data-dev>Cet appareil : ${appareil() === 'perso' ? 'appareil personnel' : 'tablette de la classe'} (changer)</button>` : ''}`;
      const inp = box.querySelector('.sv-code'); inp.value = fmt(code || '');
      inp.oninput = () => { inp.value = fmt(inp.value); box.querySelector('.sv-err').textContent = ''; };
      const ok = () => {
        const c = inp.value.replace(/-/g, '');
        if (c.length !== 6) { box.querySelector('.sv-err').textContent = 'Le code a 6 caractères.'; return; }
        if (!appareil()) step2(c); else go(c);
      };
      inp.onkeydown = (e) => { if (e.key === 'Enter') ok(); };
      box.querySelector('[data-ok]').onclick = ok;
      box.querySelector('[data-x]').onclick = close;
      const dev = box.querySelector('[data-dev]'); if (dev) dev.onclick = () => { set(L.appareil, null); step1(inp.value); };
      setTimeout(() => inp.focus(), 50);
    };
    step1(prefill);
  }
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Bouton à placer dans la page : Suivi.bouton(document.querySelector('#ici')) */
  function bouton(where) {
    ensureCss();
    const b = el('<button class="sv-badge" type="button"></button>');
    const paint = () => { const s = session(); b.textContent = s ? '👤 ' + s.me.prenom : '👤 Me connecter'; };
    b.onclick = () => ouvrir();
    paint(); listeners.push(paint);
    if (where) where.appendChild(b);
    return b;
  }
  const emit = () => listeners.forEach((f) => { try { f(session()); } catch (e) { /* rien */ } });

  /* ---------- démarrage ---------- */
  async function init(opts) {
    opts = opts || {};
    cfg = Object.assign(cfg, opts, { keys: [...new Set([...CLES, ...(opts.keys || [])])] });
    cfg.merge = Object.assign({ 'revisions6e-v1': fusionRevisions, 'revisions5e-v2': fusionRevisions }, opts.merge || {});
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && get('suivi-api')) cfg.api = get('suivi-api');   // essais en local
    const s = session();
    /* tablette de la classe oubliée connectée (plus de 2 h sans activité) : on rend la tablette */
    if (s && modeEchange(s) && Date.now() - (s.act || s.since) > IDLE_CLASSE) { await logout(); location.reload(); return; }
    /* session perdue pendant un échange (onglet fermé au mauvais moment) : la tablette retrouve sa progression */
    if (!s) restoreAnon();
    /* lien d'une carte : ?eleve=ABC123 */
    const u = new URL(location.href); const code = u.searchParams.get('eleve');
    if (code) {
      u.searchParams.delete('eleve'); history.replaceState(null, '', u.pathname + u.search + u.hash);
      const go = () => { if (!session() || session().me.id === undefined) ouvrir(code); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
    }
    if (session()) {
      ['click', 'keydown', 'touchstart'].forEach((t) => document.addEventListener(t, touch, { passive: true, capture: true }));
      syncDown().then((changed) => { if (changed) location.reload(); }).catch(() => {});
      setInterval(() => { flush().catch(() => {}); syncUp().catch(() => {}); }, FLUSH_MS);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { flush().catch(() => {}); syncUp().catch(() => {}); } });
      window.addEventListener('online', () => flush().catch(() => {}));
      flush().catch(() => {});
    } else if (getJ(L.file, []).length || getJ(L.attente, []).length) {
      flush().catch(() => {});                                            // réponses d'élèves déjà déconnectés
    }
  }

  window.Suivi = {
    init, log, login, logout, ouvrir, bouton, flush, fusionRevisions, reponse, texte, joueur, logPour, finJoueur, jeu, envoyerControle, CLES,
    session: () => { const s = session(); return s ? Object.assign({}, s.me, { perso: s.perso }) : null; },
    connecte: () => !!session(),
    onChange: (f) => listeners.push(f),
    _deepMerge: deepMerge,
  };
})();
