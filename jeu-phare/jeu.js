/* =========================================================
   LE PHARE · sixième — jeu du chapitre « Les angles » (nommer un angle, un angle qui en contient d'autres)
   La nuit, autour d'un phare (le sommet), des demi-droites partent vers des bouées (les lettres). Des bateaux sont
   perdus dans les angles entre deux demi-droites voisines.
   Pour agir, on NOMME un angle en touchant 3 lettres sur la figure : un point, le phare (au milieu), un point.
     🔦 Combien ?  le phare éclaire l'angle nommé et dit combien de bateaux s'y cachent (même un grand angle,
                   qui contient d'autres demi-droites : c'est tout l'intérêt).
     ⚓ Trouver     on fouille UN angle sans demi-droite à l'intérieur : bateau trouvé, ou eau vide.
   Un nom faux (sommet pas au milieu, deux points sur la même demi-droite…) coûte un tour.
   Solo : trouver tous les bateaux en le moins de tours possible.
   Duel (tour par tour, moteur commun) : chaque joueur cache d'abord ses bateaux sur sa moitié, sans que l'autre
   voie ; puis chacun cherche la flotte de l'autre. Le premier qui a tout trouvé gagne.
   Adresse avec ?tout : toutes les missions sont ouvertes (pour le professeur).
   ========================================================= */
(function () {
  'use strict';
  const { U } = window.Moteur;
  const { rand, shuffle } = U;
  const app = document.getElementById('app');
  const S = U.store('u6e-phare');
  S.d.stars = S.d.stars || {}; S.d.best = S.d.best || {};
  const ALL_OPEN = /[?&]tout\b/.test(location.search);
  const Snd = window.Moteur.makeSound(() => !!S.d.mute);
  Snd.beam = function () { this.tone(180, 0.6, 'sine', 0.05, 540); };
  Snd.found = function () { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.06, 0, i * 0.08)); };
  Snd.splash = function () { this.noise(0.35, 0.16, 900); };
  Snd.pt = function (k) { this.tone(440 * Math.pow(1.26, k), 0.07, 'triangle', 0.05); };
  const muteBtn = document.getElementById('mute');
  const syncMute = () => { muteBtn.textContent = S.d.mute ? '🔇' : '🔊'; };
  muteBtn.addEventListener('click', () => { S.d.mute = !S.d.mute; S.save(); syncMute(); Snd.init(); });
  syncMute();

  /* =========================================================
     La mer : un phare (sommet), des demi-droites, des bouées
     sea = { V, rays: [{ d, pts: [lettre extérieure, lettre intérieure ?] }], cases: [{ a, v }] }
     case i = l'angle entre la demi-droite i et la suivante (sens direct)
     ========================================================= */
  const W = 440, C = { x: 220, y: 220 }, R = 150;
  const norm = (a) => ((a % 360) + 360) % 360;
  const ccw = (a, b) => norm(b - a);
  const P = (a, L) => ({ x: C.x + L * Math.cos((a * Math.PI) / 180), y: C.y - L * Math.sin((a * Math.PI) / 180) });
  const f = (n) => n.toFixed(1);
  const LET = 'ABCDEFGHJKLMNPRSTUVXYZ';
  function makeSea(o) {
    let dirs;
    for (;;) {
      const n = o.rays; dirs = [];
      for (let t = 0; t < 500 && dirs.length < n; t++) { const d = rand(0, 359); if (dirs.every((x) => Math.min(ccw(x, d), ccw(d, x)) >= 30)) dirs.push(d); }
      if (dirs.length !== n) continue;
      dirs.sort((a, b) => a - b);
      // aucun angle de 160° ou plus entre voisines, aucune paire de demi-droites presque opposées (nom ambigu)
      if (dirs.every((d, i) => ccw(d, dirs[(i + 1) % n]) < 160) && !dirs.some((d) => dirs.some((e) => Math.abs(ccw(d, e) - 180) < 10))) break;
    }
    const L = shuffle([...LET]);
    const V = L.pop();
    const rays = dirs.map((d) => ({ d, pts: [L.pop()] }));
    if (o.double) shuffle([...rays]).slice(0, o.double).forEach((r) => r.pts.push(L.pop()));
    const cases = rays.map((r, i) => ({ a: r.d, v: ccw(r.d, rays[(i + 1) % rays.length].d) }));
    return { V, rays, cases };
  }
  const randomBoats = (sea, n) => new Set(shuffle([...sea.cases.keys()]).slice(0, n));

  /* ---------- Lire un nom d'angle : [X, V, Y] ---------- */
  const ang = (s) => `<span class="m-ang">${s}</span>`;
  function readName(sea, name) {
    const [X, V, Y] = name;
    if (V !== sea.V) return { ok: false, code: 'mid', why: `Le sommet, c’est le phare <b>${sea.V}</b> : il s’écrit <b>au milieu</b>.` };
    const rayOf = (L) => sea.rays.findIndex((r) => r.pts.includes(L));
    const rx = rayOf(X), ry = rayOf(Y);
    if (rx < 0 || ry < 0) return { ok: false, code: 'side', why: `Il faut un point de chaque côté : <b>point – ${sea.V} – point</b>.` };
    if (rx === ry) return { ok: false, code: 'same', why: `${X} et ${Y} sont sur la <b>même</b> demi-droite : ça ne fait pas d’angle.` };
    const n = sea.rays.length, fwd = ccw(sea.rays[rx].d, sea.rays[ry].d);
    const [s, e] = fwd < 180 ? [rx, ry] : [ry, rx];
    const cells = [];
    for (let i = s; i !== e; i = (i + 1) % n) cells.push(i);
    return { ok: true, cells, s, e, inside: cells.slice(1) };
  }
  const nameOfCase = (sea, i) => sea.rays[i].pts[0] + sea.V + sea.rays[(i + 1) % sea.rays.length].pts[0];

  /* =========================================================
     Dessin
     st = { taps: [lettres], light: { s, e, cells, n }, found: Map(case → 'me'|'p0'|'p1'), empty: Set,
            mine: Set (mes bateaux, placement), hidden: Set (bateaux à montrer à la fin), flash: [rayons],
            finger: lettre | null, place: bool (cases touchables pour placer) }
     ========================================================= */
  function wedge(a1, v, r, cls, attr = '') {
    const p = P(a1, r), q = P(a1 + v, r);
    return `<path d="M${C.x} ${C.y} L${f(p.x)} ${f(p.y)} A${r} ${r} 0 ${v > 180 ? 1 : 0} 0 ${f(q.x)} ${f(q.y)} Z" class="${cls}" ${attr}/>`;
  }
  const boatG = (x, y, cls) => `<g transform="translate(${f(x)} ${f(y)})"><g class="boat ${cls}"><path d="M-15 3 L15 3 L10 11 L-10 11 Z" class="hull"/><path d="M-1 -16 L-1 3 M1 -15 L13 0 L1 0 Z" class="sail"/></g></g>`;
  function ptPos(sea, ri, k) { return P(sea.rays[ri].d, k === 0 ? R - 8 : R * 0.56); }
  function ptLabel(sea, ri, k) {
    const d = sea.rays[ri].d;
    return k === 0 ? P(d, R + 14) : (() => { const Q = P(d, R * 0.56); const o = (d + 90) * Math.PI / 180; return { x: Q.x + 15 * Math.cos(o), y: Q.y - 15 * Math.sin(o) }; })();
  }
  function seaSVG(sea, st) {
    const n = sea.rays.length;
    let h = `<svg viewBox="0 0 ${W} ${W}" class="sea" role="img" aria-label="Le phare ${sea.V} et ses demi-droites">
      <defs><radialGradient id="beamG" cx="${C.x}" cy="${C.y}" r="${R + 20}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset=".55" stop-color="#ffd85a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb000" stop-opacity=".08"/></radialGradient></defs>
      <circle cx="${C.x}" cy="${C.y}" r="${R + 30}" class="disc"/>
      <circle cx="${C.x}" cy="${C.y}" r="${R * 0.78}" class="swell"/><circle cx="${C.x}" cy="${C.y}" r="${R * 0.4}" class="swell"/>`;
    sea.cases.forEach((c, i) => {
      const cls = st.found && st.found.has(i) ? 'got' : st.empty && st.empty.has(i) ? 'void' : st.mine && st.mine.has(i) ? 'mine' : '';
      h += wedge(c.a, c.v, R - 2, `cs ${cls}`, st.place ? `data-case="${i}"` : '');
    });
    // le faisceau : l'angle éclairé
    if (st.light) {
      const { s, e } = st.light, a = sea.rays[s].d, v = ccw(a, sea.rays[e].d);
      h += `<g class="beam">${wedge(a, v, R + 26, 'bm')}</g>`;
    }
    // l'angle nommé (aperçu)
    if (st.prev) { const a = sea.rays[st.prev.s].d, v = ccw(a, sea.rays[st.prev.e].d); h += wedge(a, v, R - 2, 'prev'); }
    sea.rays.forEach((r, i) => { const E = P(r.d, R + 2); h += `<line x1="${C.x}" y1="${C.y}" x2="${f(E.x)}" y2="${f(E.y)}" class="ray${st.flash && st.flash.includes(i) ? ' flash' : ''}"/>`; });
    // bateaux et eau vide
    sea.cases.forEach((c, i) => {
      const M = P(c.a + c.v / 2, R * 0.74);
      if (st.found && st.found.has(i)) h += boatG(M.x, M.y, st.found.get(i));
      else if (st.mine && st.mine.has(i)) h += boatG(M.x, M.y, 'me');
      else if (st.hidden && st.hidden.has(i)) h += boatG(M.x, M.y, 'ghost');
      else if (st.empty && st.empty.has(i)) h += `<text x="${f(M.x)}" y="${f(M.y)}" class="splash" text-anchor="middle" dominant-baseline="central">〰</text>`;
    });
    if (st.light) {
      const { s, e } = st.light, a = sea.rays[s].d, v = ccw(a, sea.rays[e].d), M = P(a + v / 2, R * 0.42);
      h += `<g class="count"><circle cx="${f(M.x)}" cy="${f(M.y)}" r="21"/><text x="${f(M.x)}" y="${f(M.y + 1)}" text-anchor="middle" dominant-baseline="central">${st.light.n}</text></g>`;
    }
    // bouées (lettres) : zones à toucher
    const taps = st.taps || [];
    sea.rays.forEach((r, ri) => r.pts.forEach((L, k) => {
      const Q = ptPos(sea, ri, k), T = ptLabel(sea, ri, k), ti = taps.indexOf(L);
      h += `<g class="pt${ti >= 0 ? ' on' : ''}${st.finger === L ? ' fing' : ''}" ${st.place ? '' : `data-pt="${L}"`}><circle cx="${f(Q.x)}" cy="${f(Q.y)}" r="5.5" class="buoy"/>
        <text x="${f(T.x)}" y="${f(T.y)}" class="lbl" text-anchor="middle" dominant-baseline="central">${L}</text>
        <circle cx="${f((Q.x + T.x) / 2)}" cy="${f((Q.y + T.y) / 2)}" r="22" class="hit"/></g>`;
    }));
    // le phare
    const vi = taps.indexOf(sea.V);
    h += `<g class="pt tower${vi >= 0 ? ' on' : ''}${st.finger === sea.V ? ' fing' : ''}" ${st.place ? '' : `data-pt="${sea.V}"`}>
      <circle cx="${C.x}" cy="${C.y}" r="17" class="tw"/><circle cx="${C.x}" cy="${C.y}" r="10" class="tw2"/><circle cx="${C.x}" cy="${C.y}" r="4.5" class="lamp"/>
      <text x="${C.x + 22}" y="${C.y + 22}" class="lbl vlbl" text-anchor="middle" dominant-baseline="central">${sea.V}</text><circle cx="${C.x + 6}" cy="${C.y + 6}" r="26" class="hit"/></g>`;
    if (st.finger) {
      let Q = null;
      if (st.finger === sea.V) Q = { x: C.x + 8, y: C.y + 12 };
      else sea.rays.forEach((r, ri) => r.pts.forEach((L, k) => { if (L === st.finger) Q = ptPos(sea, ri, k); }));
      if (Q) h += `<text x="${f(Q.x + 6)}" y="${f(Q.y + 22)}" class="finger" text-anchor="middle">👆</text>`;
    }
    if (st.fingerCase !== undefined && st.fingerCase !== null) { const c = sea.cases[st.fingerCase], M = P(c.a + c.v / 2, R * 0.6); h += `<text x="${f(M.x)}" y="${f(M.y + 18)}" class="finger" text-anchor="middle">👆</text>`; }
    return h + '</svg>';
  }
  /** la boîte du nom : 3 cases, le chapeau quand le nom est complet */
  function nameBox(taps, bad) {
    const slots = [0, 1, 2].map((i) => `<span class="slot${taps[i] ? ' full' : ''}${i === taps.length ? ' cur' : ''}">${taps[i] || ''}</span>`).join('');
    return `<div class="nbox${taps.length === 3 ? ' done' : ''}${bad ? ' bad' : ''}"><span class="hat" aria-hidden="true"></span><span class="slots">${slots}</span></div>`;
  }
  const TOWER = '<svg class="tow" viewBox="0 0 24 32" aria-hidden="true"><path d="M12 1 L16 6 L8 6 Z" fill="#ff5a4a"/><rect x="8" y="6" width="8" height="5" fill="#ffd85a"/><path d="M8 11 L16 11 L18 30 L6 30 Z" fill="#fff"/><path d="M7.4 17 L16.6 17 L17.2 22 L6.8 22 Z" fill="#ff5a4a"/><rect x="4" y="29" width="16" height="3" rx="1" fill="#93a3cc"/></svg>';
  const fleetRow = (total, got, cls = 'p') => `<span class="fleet">${Array.from({ length: total }, (_, i) => `<i class="${i < got ? `ok ${cls}` : ''}">⛵</i>`).join('')}</span>`;

  /* =========================================================
     Missions (solo)
     ========================================================= */
  const MISSIONS = [
    { id: 'm1', name: 'Première lueur', tag: '5 demi-droites · 2 bateaux', sea: { rays: 5 }, boats: 2, demo: true },
    { id: 'm2', name: 'Nuit claire', tag: '6 demi-droites · 2 bateaux', sea: { rays: 6 }, boats: 2 },
    { id: 'm3', name: 'Deux bouées', tag: 'Un angle, plusieurs noms', sea: { rays: 6, double: 3 }, boats: 3 },
    { id: 'm4', name: 'Brouillard', tag: '7 demi-droites · 3 bateaux', sea: { rays: 7, double: 2 }, boats: 3 },
    { id: 'm5', name: 'La tempête', tag: '8 demi-droites · 3 bateaux', sea: { rays: 8, double: 4 }, boats: 3, boss: true },
  ];
  const unlocked = (i) => ALL_OPEN || i === 0 || (S.d.stars[MISSIONS[i - 1].id] || 0) > 0;
  const par = (M) => M.boats + Math.ceil((M.sea.rays - M.boats) / 2);
  const starsFor = (M, t) => (t <= par(M) ? 3 : t <= M.sea.rays + 1 ? 2 : 1);
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;

  let G = null, demoT = null;
  const stopDemo = () => { if (demoT) clearTimeout(demoT); demoT = null; };

  function home() {
    G = null; stopDemo();
    const total = MISSIONS.reduce((s, z) => s + (S.d.stars[z.id] || 0), 0);
    const nextI = MISSIONS.findIndex((z, i) => unlocked(i) && !S.d.stars[z.id]);
    app.innerHTML = `<div class="screen home">
      <div class="sky" aria-hidden="true"><div class="sweep"></div></div>
      <header class="brand"><h1>Le Phare</h1><p class="sub">Nomme l’angle · éclaire · trouve les bateaux</p><span class="lvl">sixième · ★ ${total}/${MISSIONS.length * 3}</span></header>
      <div class="coast">${MISSIONS.map((z, i) => { const lock = !unlocked(i), st = S.d.stars[z.id] || 0; return `<button type="button" class="light${z.boss ? ' boss' : ''}${lock ? ' locked' : ''}${i === nextI ? ' next' : ''}" data-z="${i}" ${lock ? 'disabled' : ''}>
        <span class="lamp-ic" aria-hidden="true">${lock ? '🔒' : TOWER}</span><span class="nm">${i + 1}. ${z.name}</span><span class="rl">${z.tag}</span><span class="st">${starStr(st)}</span>${S.d.best[z.id] ? `<span class="rec">record : ${S.d.best[z.id]} tours</span>` : ''}</button>`; }).join('')}</div>
      <button type="button" class="duel-btn" data-act="duel"><span aria-hidden="true">⚔️</span> <b>Duel</b><small>chacun cache ses bateaux, puis cherche ceux de l’autre</small></button>
      <button type="button" class="howbtn" data-act="how">❔ Comment jouer</button></div>`;
    app.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => { Snd.init(); brief(MISSIONS[Number(b.dataset.z)]); }));
    app.querySelector('[data-act="duel"]').addEventListener('click', () => { Snd.init(); duel(); });
    app.querySelector('[data-act="how"]').addEventListener('click', () => { Snd.init(); brief(null); });
  }

  /* ---------- La règle, montrée (démo animée qui tourne en boucle) ---------- */
  function brief(M) {
    stopDemo();
    app.innerHTML = `<div class="screen brief">
      <h2 class="bt">${M ? `${TOWER} ${M.name}` : 'Comment jouer'}</h2>
      <div class="demo"><div class="dfig" id="dfig"></div>
        <div class="steps">
          <div class="step" data-s="0"><span class="si">👆</span><span class="st2"><span class="mini"><i>A</i><i class="v">O</i><i>B</i></span>3 lettres : le <b>phare au milieu</b></span></div>
          <div class="step" data-s="1"><span class="si">🔦</span><span class="st2"><b>Combien ?</b><br>le nombre de bateaux dans l’angle</span></div>
          <div class="step" data-s="2"><span class="si">⚓</span><span class="st2"><b>Trouver</b><br>un angle sans demi-droite dedans</span></div>
        </div></div>
      <p class="goal">🎯 Trouve tous les ⛵ en <b>le moins de tours</b>. Un nom faux = un tour perdu.</p>
      <div class="row"><button type="button" class="btn ghost" data-act="back">← Retour</button>${M ? '<button type="button" class="btn go" data-act="go">▶ Jouer</button>' : ''}</div></div>`;
    app.querySelector('[data-act="back"]').addEventListener('click', home);
    const go = app.querySelector('[data-act="go"]');
    if (go) { go.addEventListener('click', () => { stopDemo(); start(M); }); go.focus(); }
    runDemo(document.getElementById('dfig'));
  }
  function runDemo(host) {
    const sea = U.withSeed(7, () => makeSea({ rays: 5 }));
    sea.V = 'O';
    const boats = new Set([1, 3]);
    const A = sea.rays[0].pts[0], B = sea.rays[3].pts[0], big = readName(sea, [A, 'O', B]);
    const c1 = sea.rays[1].pts[0], c2 = sea.rays[2].pts[0], one = readName(sea, [c1, 'O', c2]);
    const nb = big.cells.filter((c) => boats.has(c)).length;
    const frames = [
      { st: { taps: [], finger: A }, s: 0 }, { st: { taps: [A], finger: 'O' }, s: 0 }, { st: { taps: [A, 'O'], finger: B }, s: 0 },
      { st: { taps: [A, 'O', B], prev: big }, s: 0, t: 1100 },
      { st: { taps: [A, 'O', B], light: { ...big, n: nb } }, s: 1, t: 2200, snd: 'beam' },
      { st: { taps: [], finger: c1, last: big }, s: 2 }, { st: { taps: [c1], finger: 'O' }, s: 2 }, { st: { taps: [c1, 'O'], finger: c2 }, s: 2 },
      { st: { taps: [c1, 'O', c2], prev: one }, s: 2, t: 1000 },
      { st: { taps: [], found: new Map([[1, 'me']]) }, s: 2, t: 2400 },
    ];
    let k = 0;
    const step = () => {
      if (!document.body.contains(host)) return;
      const fr = frames[k % frames.length];
      host.innerHTML = seaSVG(sea, fr.st);
      document.querySelectorAll('.step').forEach((e) => e.classList.toggle('on', Number(e.dataset.s) === fr.s));
      k++;
      demoT = setTimeout(step, fr.t || 750);
    };
    step();
  }

  /* ---------- Une partie solo ---------- */
  function start(M) {
    const sea = makeSea(M.sea);
    G = { M, sea, boats: randomBoats(sea, M.boats), taps: [], found: new Map(), empty: new Set(), light: null, turns: 0, bad: 0, log: [], msg: '', flash: null, over: false };
    draw();
  }
  function draw() {
    const { M, sea } = G, pr = G.taps.length === 3 ? readName(sea, G.taps) : null, ready = pr && pr.ok && !G.over;
    app.innerHTML = `<div class="screen play">
      <div class="hud"><button type="button" class="quit" data-act="quit" aria-label="Arrêter">✕</button><span class="zn">${TOWER} ${M.name}</span>
        ${fleetRow(M.boats, G.found.size)}<span class="turns" title="tours">⏱ ${G.turns}<small>/${par(M)}</small></span></div>
      <div class="game"><div class="field" id="field">${seaSVG(sea, { taps: G.taps, prev: ready ? pr : null, light: G.light, found: G.found, empty: G.empty, flash: G.flash, hidden: G.over ? G.boats : null })}</div>
        <div class="side">
          ${nameBox(G.taps, pr && !pr.ok)}
          <div class="acts"><button type="button" class="act a-light" data-act="light" ${ready ? '' : 'disabled'}><span>🔦</span>Combien ?</button>
            <button type="button" class="act a-find" data-act="find" ${ready ? '' : 'disabled'}><span>⚓</span>Trouver</button></div>
          <button type="button" class="clr" data-act="clr" ${G.taps.length && !G.over ? '' : 'disabled'}>⌫ effacer</button>
          <div class="msg">${G.msg}</div>
          <div class="log">${G.log.map((l) => `<span>${l}</span>`).join('')}</div>
        </div></div></div>`;
    app.querySelector('[data-act="quit"]').addEventListener('click', () => { if (G.over || confirm('Quitter la partie ?')) home(); });
    app.querySelectorAll('#field [data-pt]').forEach((el) => U.tap(el, () => tapPt(el.dataset.pt)));
    U.tap(app.querySelector('[data-act="light"]'), () => act('light'));
    U.tap(app.querySelector('[data-act="find"]'), () => act('find'));
    U.tap(app.querySelector('[data-act="clr"]'), () => { if (G.over) return; G.taps = []; draw(); });
    G.flash = null;
  }
  function tapPt(L) {
    if (G.over) return;
    if (G.taps.length === 3) G.taps = [];
    G.taps.push(L); Snd.pt(G.taps.length - 1);
    G.msg = '';
    if (G.taps.length === 3) {
      const r = readName(G.sea, G.taps);
      if (!r.ok) {
        G.turns++; G.bad++; Snd.bad();
        G.msg = `<div class="explain bad">✗ ${ang(G.taps.join(''))} : un tour perdu. ${r.why}</div>`;
        G.log.unshift(`✗ ${ang(G.taps.join(''))}`);
      }
    }
    draw();
  }
  function act(kind) {
    const r = readName(G.sea, G.taps), nm = ang(G.taps.join(''));
    if (!r.ok || G.over) return;
    if (kind === 'light') {
      const n = r.cells.filter((c) => G.boats.has(c) && !G.found.has(c)).length;
      G.turns++; Snd.beam();
      G.light = { ...r, n };
      G.msg = `<div class="explain">🔦 ${nm} : <b>${n}</b> bateau${n > 1 ? 'x' : ''} perdu${n > 1 ? 's' : ''}${r.inside.length ? ` <small>(cet angle contient ${r.inside.length} demi-droite${r.inside.length > 1 ? 's' : ''})</small>` : ''}.</div>`;
      G.log.unshift(`🔦 ${nm} → ${n}`);
    } else {
      if (r.cells.length > 1) {
        G.turns++; Snd.bad(); G.flash = r.inside;
        const ins = r.inside.map((i) => `[${G.sea.V}${G.sea.rays[i].pts[0]})`).join(', ');
        G.msg = `<div class="explain bad">✗ ${nm} est trop large : il contient ${ins}. <b>⚓ Trouver</b> ne fouille qu’un angle <b>sans demi-droite dedans</b>. Un tour perdu.</div>`;
        G.log.unshift(`✗ ⚓ ${nm}`);
      } else {
        const c = r.cells[0];
        if (G.found.has(c) || G.empty.has(c)) { G.msg = `<div class="explain">Cet angle est déjà fouillé.</div>`; G.taps = []; draw(); return; }
        G.turns++; G.light = null;
        if (G.boats.has(c)) { G.found.set(c, 'me'); Snd.found(); G.msg = `<div class="explain good">⚓ ${nm} : <b>bateau trouvé !</b></div>`; G.log.unshift(`⛵ ${nm}`); }
        else { G.empty.add(c); Snd.splash(); G.msg = `<div class="explain">⚓ ${nm} : rien, de l’eau.</div>`; G.log.unshift(`〰 ${nm}`); }
      }
    }
    G.taps = [];
    if (G.found.size === G.M.boats) { finish(); return; }
    draw();
  }
  function finish() {
    const M = G.M; G.over = true;
    const stars = starsFor(M, G.turns), old = S.d.stars[M.id] || 0, oldBest = S.d.best[M.id] || 0, rec = !oldBest || G.turns < oldBest;
    S.d.stars[M.id] = Math.max(old, stars); if (rec) S.d.best[M.id] = G.turns; S.save();
    Snd.win(); U.confetti(stars * 25, ['#ffd85a', '#fff6c8', '#ff8a3d', '#7fd7ff']);
    const next = MISSIONS[MISSIONS.indexOf(M) + 1];
    G.msg = `<div class="explain good big">⛵ Tous trouvés en <b>${G.turns}</b> tours ! <span class="stars">${starStr(stars)}</span>${rec ? ' 🏅 record' : ''}<br><small>3 ★ en ${par(M)} tours ou moins.${G.bad ? ` Noms faux : ${G.bad}.` : ''}</small></div>
      <div class="row"><button type="button" class="btn ghost" data-act="home">← Phares</button><button type="button" class="btn${next ? '' : ' go'}" data-act="again">↻ Rejouer</button>${next ? '<button type="button" class="btn go" data-act="next">Suivant ▶</button>' : ''}</div>`;
    draw();
    app.querySelector('[data-act="home"]').addEventListener('click', home);
    app.querySelector('[data-act="again"]').addEventListener('click', () => start(M));
    app.querySelector('[data-act="next"]')?.addEventListener('click', () => brief(next));
  }

  /* =========================================================
     DUEL : chacun cache ses bateaux (sur sa moitié), puis cherche ceux de l'autre, chacun son tour
     ========================================================= */
  const MODES = [
    { id: '1', nom: 'Petite mer', desc: '6 demi-droites · 2 bateaux chacun', sea: { rays: 6 }, boats: 2 },
    { id: '2', nom: 'Grande mer', desc: '7 demi-droites · 3 bateaux chacun', sea: { rays: 7, double: 2 }, boats: 3 },
    { id: '3', nom: 'La tempête', desc: '8 demi-droites · 3 bateaux · plusieurs noms', sea: { rays: 8, double: 4 }, boats: 3 },
  ];
  function duel() {
    window.Moteur.match({ jeu: 'phare-6e', titre: 'Le Phare', niveauScolaire: 'sixième', theme: 'phare', icone: '🗼', sound: Snd, modes: MODES, quitter: home,
      start: (ctx) => duelPlay(ctx) });
  }
  function duelPlay(ctx) {
    const M = MODES.find((m) => m.id === ctx.mode) || MODES[0];
    const sea = makeSea(M.sea), B = M.boats;
    // fleet[k] = les bateaux cachés par k ; found[k] / empty[k] = ce que k a trouvé chez l'adversaire
    const D = { phase: 'place', fleet: [new Set(), new Set()], ready: [false, false], turn: rand(0, 1), taps: [[], []], found: [new Map(), new Map()], empty: [new Set(), new Set()],
      light: [null, null], flash: [null, null], msg: ['', ''], turns: [0, 0], bad: [0, 0] };
    const nm = (k) => U.esc(ctx.P[k].nom), col = (k) => (k === 0 ? 'p0' : 'p1');
    function render() {
      ctx.turn(D.phase === 'play' ? D.turn : null);
      ctx.P.forEach((p) => (D.phase === 'place' ? renderPlace(p) : renderPlay(p)));
    }
    /* --- placement : chacun touche les angles où il cache ses bateaux --- */
    function renderPlace(p) {
      const k = p.k, mine = D.fleet[k];
      if (D.ready[k]) {
        p.el.innerHTML = `<div class="dz wait"><p class="dbig">🙈 Bateaux cachés !</p><p class="m-dim m-pulse">${nm(1 - k)} cache les siens…</p><button type="button" class="m-btn m-ghost" data-a="undo">Changer</button></div>`;
        U.tap(p.el.querySelector('[data-a="undo"]'), () => { D.ready[k] = false; render(); });
        return;
      }
      p.el.innerHTML = `<div class="dz"><div class="dhead"><b class="${col(k)}">${nm(k)}</b><span>🙈 cache ${B} bateaux : touche ${B} angles</span></div>
        <div class="dfield">${seaSVG(sea, { mine, place: true })}</div>
        <div class="drow">${fleetRow(B, mine.size, col(k))}<button type="button" class="m-btn m-go" data-a="ok" ${mine.size === B ? '' : 'disabled'}>✔ Prêt</button></div>
        <p class="m-dim small">Cache bien ta moitié ! L’autre ne doit pas voir.</p></div>`;
      p.el.querySelectorAll('[data-case]').forEach((el) => U.tap(el, () => {
        const c = Number(el.dataset.case);
        if (mine.has(c)) mine.delete(c); else if (mine.size < B) mine.add(c);
        Snd.key(); renderPlace(p);
      }));
      U.tap(p.el.querySelector('[data-a="ok"]'), () => {
        if (mine.size !== B) return;
        D.ready[k] = true; Snd.tone(660, 0.1, 'square', 0.04);
        if (D.ready[0] && D.ready[1]) { D.phase = 'play'; D.msg = [0, 1].map((x) => (x === D.turn ? 'À toi de commencer !' : `${nm(D.turn)} commence.`)); }
        render();
      });
    }
    /* --- recherche --- */
    function renderPlay(p) {
      const k = p.k, myTurn = D.turn === k, taps = D.taps[k], pr = taps.length === 3 ? readName(sea, taps) : null, ready = myTurn && pr && pr.ok;
      p.el.innerHTML = `<div class="dz"><div class="dhead"><b class="${col(k)}">${nm(k)}</b>${fleetRow(B, D.found[k].size, col(k))}<span class="vs">vs</span>${fleetRow(B, D.found[1 - k].size, col(1 - k))}</div>
        <div class="dfield">${seaSVG(sea, { taps, prev: ready ? pr : null, light: D.light[k], found: D.found[k], empty: D.empty[k], flash: D.flash[k] })}</div>
        <div class="dctl">${nameBox(taps, pr && !pr.ok)}
          <div class="acts"><button type="button" class="act a-light" data-a="light" ${ready ? '' : 'disabled'}><span>🔦</span>Combien ?</button><button type="button" class="act a-find" data-a="find" ${ready ? '' : 'disabled'}><span>⚓</span>Trouver</button></div></div>
        <div class="dmsg">${myTurn ? '' : `<span class="m-dim">⏳ ${nm(1 - k)} joue…</span> `}${D.msg[k]}</div></div>`;
      if (myTurn) p.el.querySelectorAll('.dfield [data-pt]').forEach((el) => U.tap(el, () => tapD(k, el.dataset.pt)));
      U.tap(p.el.querySelector('[data-a="light"]'), () => actD(k, 'light'));
      U.tap(p.el.querySelector('[data-a="find"]'), () => actD(k, 'find'));
      D.flash[k] = null;
    }
    function pass(k) { D.taps[k] = []; D.turn = 1 - k; render(); }
    function tapD(k, L) {
      if (D.turn !== k || D.phase !== 'play') return;
      const t = D.taps[k];
      if (t.length === 3) t.length = 0;
      t.push(L); Snd.pt(t.length - 1);
      if (t.length === 3) {
        const r = readName(sea, t);
        if (!r.ok) {
          D.bad[k]++; D.turns[k]++; Snd.bad();
          D.msg[k] = `<span class="bad">✗ ${ang(t.join(''))} : tour perdu. ${r.why}</span>`;
          D.msg[1 - k] = `${nm(k)} a écrit un nom faux (${ang(t.join(''))}) : à toi !`;
          renderPlay(ctx.P[k]);
          ctx.later(() => pass(k), 900);
          return;
        }
      }
      renderPlay(ctx.P[k]);
    }
    function actD(k, kind) {
      if (D.turn !== k || D.phase !== 'play') return;
      const t = D.taps[k], r = readName(sea, t), name = ang(t.join('')), enemy = D.fleet[1 - k];
      if (!r.ok) return;
      D.turns[k]++;
      if (kind === 'light') {
        const n = r.cells.filter((c) => enemy.has(c) && !D.found[k].has(c)).length;
        Snd.beam(); D.light[k] = { ...r, n };
        D.msg[k] = `🔦 ${name} : <b>${n}</b> bateau${n > 1 ? 'x' : ''} de ${nm(1 - k)}.`;
        D.msg[1 - k] = `${nm(k)} éclaire ${name} : il y voit <b>${n}</b> de tes bateaux.`;
      } else if (r.cells.length > 1) {
        Snd.bad(); D.flash[k] = r.inside;
        D.msg[k] = `<span class="bad">✗ ${name} est trop large (il contient une demi-droite) : ⚓ ne fouille qu’un petit angle. Tour perdu.</span>`;
        D.msg[1 - k] = `${nm(k)} a fouillé un angle trop large : tour perdu !`;
      } else {
        const c = r.cells[0];
        if (D.found[k].has(c) || D.empty[k].has(c)) { D.turns[k]--; D.msg[k] = 'Déjà fouillé : choisis un autre angle.'; D.taps[k] = []; renderPlay(ctx.P[k]); return; }
        D.light[k] = null;
        if (enemy.has(c)) {
          D.found[k].set(c, col(k)); Snd.found();
          D.msg[k] = `⚓ ${name} : <b>trouvé !</b>`; D.msg[1 - k] = `😱 ${nm(k)} a trouvé ton bateau en ${name} !`;
          if (D.found[k].size === B) { end(k); return; }
        } else {
          D.empty[k].add(c); Snd.splash();
          D.msg[k] = `⚓ ${name} : de l’eau.`; D.msg[1 - k] = `${nm(k)} fouille ${name} : raté 😌`;
        }
      }
      pass(k);
    }
    function end(w) {
      const show = (x) => seaSVG(sea, { found: D.found[1 - x], empty: D.empty[1 - x], hidden: D.fleet[x] });
      ctx.end({ winner: w,
        score: [0, 1].map((x) => `${D.found[x].size}/${B} trouvés en ${D.turns[x]} tours`),
        stats: [0, 1].map((x) => ({ trouves: D.found[x].size, tours: D.turns[x], nomsFaux: D.bad[x] })),
        text: [0, 1].map((x) => `<p class="m-dim">${nm(w)} a trouvé les ${B} bateaux en ${D.turns[w]} tours. Noms faux : ${D.bad[x]}.</p><p class="m-dim">Ta flotte et les recherches de ${nm(1 - x)} :</p><div class="endsea">${show(x)}</div>`) });
    }
    render();
  }

  window.__phare = { makeSea, readName, nameOfCase, MISSIONS, MODES, par };
  home();
})();
