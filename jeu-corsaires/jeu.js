/* =========================================================
   LES CORSAIRES · sixième — jeu du chapitre « Les angles » : NOMMER un angle pour tirer
   Une carte au trésor : des îles (les sommets) d'où partent des demi-droites vers des bouées (les lettres).
   Des bateaux ennemis sont cachés dans les angles entre deux demi-droites voisines (un bateau peut occuper
   2 ou 3 angles voisins autour de la même île).
   Pour tirer, on écrit le NOM de l'angle visé en touchant 3 lettres sur la carte : un point, l'île (le sommet,
   AU MILIEU), un point. La case du milieu de la boîte est marquée « sommet ». Si le nom est bon, l'angle visé
   s'éclaire (viseur) : 💥 Feu !  Touché 🔥, coulé ☠ ou à l'eau 💦.
   Un nom faux (sommet pas au milieu, deux points sur la même demi-droite, un point d'une autre île) ou un angle
   trop large (une demi-droite dedans) : le boulet est perdu, avec l'explication dessinée.
   Plusieurs bouées sur une demi-droite : un même angle a plusieurs noms (déjà visé = pas de boulet perdu).
   Solo : couler toute la flotte avec un nombre limité de boulets ; ★ selon les boulets restants et les noms faux.
   Duel (tour par tour, moteur commun) : chacun cache d'abord sa flotte sur sa moitié (sans que l'autre voie),
   puis chacun son tour tire sur la flotte de l'autre. Le premier qui coule tout gagne.
   Adresse avec ?tout : toutes les cartes sont ouvertes (pour le professeur).
   ========================================================= */
(function () {
  'use strict';
  const { U } = window.Moteur;
  const { rand, shuffle } = U;
  const app = document.getElementById('app');
  const S = U.store('u6e-corsaires');
  S.d.stars = S.d.stars || {};
  const ALL_OPEN = /[?&]tout\b/.test(location.search);
  const Snd = window.Moteur.makeSound(() => !!S.d.mute);
  Snd.boom = function () { this.noise(0.5, 0.4, 500); this.tone(90, 0.4, 'sawtooth', 0.06, 40); };
  Snd.splash = function () { this.noise(0.4, 0.16, 1200); };
  Snd.sink = function () { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.25, 'square', 0.05, 0, i * 0.12)); };
  Snd.pt = function (k) { this.tone(392 * Math.pow(1.26, k), 0.07, 'triangle', 0.05); };
  const muteBtn = document.getElementById('mute');
  const syncMute = () => { muteBtn.textContent = S.d.mute ? '🔇' : '🔊'; };
  muteBtn.addEventListener('click', () => { S.d.mute = !S.d.mute; S.save(); syncMute(); Snd.init(); });
  syncMute();

  /* =========================================================
     La carte
     sea = { W, H, islands: [{ C, V, len, rays: [{ d, pts: [lettres] }] }], cases: [{ is, r, a, v }] }
     case = l'angle entre la demi-droite r de l'île is et la suivante (sens direct)
     ========================================================= */
  const norm = (a) => ((a % 360) + 360) % 360;
  const ccw = (a, b) => norm(b - a);
  const P = (C, a, L) => ({ x: C.x + L * Math.cos((a * Math.PI) / 180), y: C.y - L * Math.sin((a * Math.PI) / 180) });
  const f = (n) => n.toFixed(1);
  const LET = 'ABCDEFGHJKLMNPRSTUVXYZ';
  const W = 480, H = 340;
  const SPOTS = { 1: [{ x: 240, y: 170 }], 2: [{ x: 128, y: 170 }, { x: 352, y: 170 }], 3: [{ x: 112, y: 104 }, { x: 368, y: 104 }, { x: 240, y: 238 }] };
  const LENS = { 1: 120, 2: 92, 3: 78 };
  function makeSea(o) {
    const L = shuffle([...LET]);
    const islands = SPOTS[o.islands].map((C) => {
      let dirs;
      for (;;) {
        const n = rand(o.rays[0], o.rays[1]); dirs = [];
        for (let t = 0; t < 400 && dirs.length < n; t++) { const d = rand(0, 359); if (dirs.every((x) => Math.min(ccw(x, d), ccw(d, x)) >= 34)) dirs.push(d); }
        if (dirs.length !== n) continue;
        dirs.sort((a, b) => a - b);
        if (dirs.every((d, i) => ccw(d, dirs[(i + 1) % n]) < 160) && !dirs.some((d) => dirs.some((e) => Math.abs(ccw(d, e) - 180) < 10))) break;
      }
      return { C, V: L.pop(), len: LENS[o.islands], rays: dirs.map((d) => ({ d, pts: [L.pop()] })) };
    });
    if (o.double) islands.forEach((is) => shuffle([...is.rays]).slice(0, o.double).forEach((r) => r.pts.push(L.pop())));
    const cases = [];
    islands.forEach((is, k) => is.rays.forEach((r, i) => cases.push({ is: k, r: i, a: r.d, v: ccw(r.d, is.rays[(i + 1) % is.rays.length].d) })));
    return { islands, cases, o };
  }
  const caseOf = (sea, k, r) => sea.cases.findIndex((c) => c.is === k && c.r === r);
  /** les cases de `size` angles voisins autour d'une île, en partant de la demi-droite s */
  function runOf(sea, k, s, size) { const n = sea.islands[k].rays.length; if (size > n - 1) return null; return Array.from({ length: size }, (_, j) => caseOf(sea, k, (s + j) % n)); }
  function randomFleet(sea, sizes) {
    for (let t = 0; t < 500; t++) {
      const used = new Set(), ships = [];
      let ok = true;
      for (const L of sizes) {
        let placed = false;
        for (let u = 0; u < 60 && !placed; u++) {
          const k = rand(0, sea.islands.length - 1), cells = runOf(sea, k, rand(0, sea.islands[k].rays.length - 1), L);
          if (!cells || cells.some((c) => used.has(c))) continue;
          cells.forEach((c) => used.add(c)); ships.push({ cells, hits: new Set() }); placed = true;
        }
        if (!placed) { ok = false; break; }
      }
      if (ok) return ships;
    }
    return null;
  }
  const isSunk = (s) => s.hits.size === s.cells.length;

  /* ---------- Lire un nom [X, V, Y] ---------- */
  const ang = (s) => `<span class="m-ang">${s}</span>`;
  function readName(sea, name) {
    const [X, V, Y] = name;
    const k = sea.islands.findIndex((is) => is.V === V);
    if (k < 0) {
      const isl = sea.islands.find((is) => is.V === X || is.V === Y);
      return { ok: false, code: 'mid', why: isl ? `L’île (le <b>sommet</b>) s’écrit <b>au milieu</b> : ici ${isl.V} doit être la 2<sup>e</sup> lettre.` : `La lettre du milieu doit être une <b>île</b> (le sommet de l’angle).` };
    }
    const is = sea.islands[k], rayOf = (L) => is.rays.findIndex((r) => r.pts.includes(L));
    const rx = rayOf(X), ry = rayOf(Y);
    if (rx < 0 || ry < 0) { const bad = rx < 0 ? X : Y; return { ok: false, code: 'side', why: `${bad} n’est pas sur une demi-droite de l’île ${V} : les deux autres lettres doivent être des bouées de <b>cette</b> île.` }; }
    if (rx === ry) return { ok: false, code: 'same', why: `${X} et ${Y} sont sur la <b>même</b> demi-droite : il faut un point sur <b>chaque côté</b> de l’angle.` };
    const n = is.rays.length, fwd = ccw(is.rays[rx].d, is.rays[ry].d), s = fwd < 180 ? rx : ry, e = fwd < 180 ? ry : rx;
    const cells = []; for (let i = s; i !== e; i = (i + 1) % n) cells.push(caseOf(sea, k, i));
    if (cells.length > 1) {
      const inside = []; for (let i = (s + 1) % n; i !== e; i = (i + 1) % n) inside.push(i);
      return { ok: false, code: 'wide', k, s, e, inside, why: `${ang(name.join(''))} contient la demi-droite [${V}${is.rays[inside[0]].pts[0]})${inside.length > 1 ? ' et d’autres' : ''} : c’est <b>trop large</b>. Vise un angle <b>sans demi-droite à l’intérieur</b>.` };
    }
    return { ok: true, cell: cells[0], k, s, e };
  }

  /* =========================================================
     Dessin de la carte
     st = { taps, aim: case, shots: Map(case → 'hit'|'miss'), sunk: Set, show: Set (bateaux à montrer), mine: Set,
            wide: { k, s, e, inside }, place: bool, finger: lettre, boom: case }
     ========================================================= */
  function wedge(C, a1, v, r, cls, attr = '') {
    const p = P(C, a1, r), q = P(C, a1 + v, r);
    return `<path d="M${f(C.x)} ${f(C.y)} L${f(p.x)} ${f(p.y)} A${r} ${r} 0 ${v > 180 ? 1 : 0} 0 ${f(q.x)} ${f(q.y)} Z" class="${cls}" ${attr}/>`;
  }
  const ptPos = (is, r, j) => P(is.C, is.rays[r].d, j === 0 ? is.len : is.len * 0.55);
  function ptLabel(is, r, j) {
    const d = is.rays[r].d;
    if (j === 0) return P(is.C, d, is.len + 14);
    const Q = ptPos(is, r, j), o = ((d + 90) * Math.PI) / 180;
    return { x: Q.x + 13 * Math.cos(o), y: Q.y - 13 * Math.sin(o) };
  }
  const shipG = (x, y, cls) => `<g transform="translate(${f(x)} ${f(y)})"><g class="ship ${cls}"><path d="M-13 2 L13 2 L9 9 L-9 9 Z" class="hull"/><path d="M-1 -14 L-1 2 M1 -13 L11 0 L1 0 Z" class="sail"/><path d="M-1 -14 L-7 -12 L-1 -10" class="flag"/></g></g>`;
  function mapSVG(sea, st) {
    const taps = st.taps || [], shots = st.shots || new Map(), sunk = st.sunk || new Set();
    let h = `<svg viewBox="0 0 ${W} ${H}" class="map" role="img" aria-label="Carte : îles et demi-droites">
      <defs><pattern id="hatch" width="14" height="10" patternUnits="userSpaceOnUse"><path d="M0 6 Q3.5 3 7 6 T14 6" class="wave"/></pattern>
        <radialGradient id="vig" cx="50%" cy="50%" r="75%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#5a3a14" stop-opacity=".35"/></radialGradient></defs>
      <rect width="${W}" height="${H}" class="paper"/><rect width="${W}" height="${H}" fill="url(#hatch)" opacity=".5"/>
      <g class="rose-v" transform="translate(${W - 34} ${H - 34})"><circle r="20" class="cr"/><path d="M0 -22 L5 0 L0 22 L-5 0 Z M-22 0 L0 5 L22 0 L0 -5 Z" class="cs"/><text y="-26" text-anchor="middle" class="cn">N</text></g>`;
    sea.cases.forEach((c, i) => {
      const is = sea.islands[c.is], s = shots.get(i);
      const cls = sunk.has(i) ? 'sunk' : s === 'hit' ? 'hit' : s === 'miss' ? 'miss' : st.mine && st.mine.has(i) ? 'mine' : '';
      h += wedge(is.C, c.a, c.v, is.len - 4, `cs ${cls}`, st.place ? `data-case="${i}"` : '');
    });
    if (st.aim !== undefined && st.aim !== null) { const c = sea.cases[st.aim], is = sea.islands[c.is]; h += wedge(is.C, c.a, c.v, is.len - 2, 'aim'); }
    if (st.wide) { const is = sea.islands[st.wide.k], a = is.rays[st.wide.s].d; h += wedge(is.C, a, ccw(a, is.rays[st.wide.e].d), is.len - 2, 'wide'); }
    sea.islands.forEach((is, k) => is.rays.forEach((r, ri) => {
      const E = P(is.C, r.d, is.len + 4), fl = st.wide && st.wide.k === k && st.wide.inside.includes(ri);
      h += `<line x1="${f(is.C.x)}" y1="${f(is.C.y)}" x2="${f(E.x)}" y2="${f(E.y)}" class="ray${fl ? ' flash' : ''}"/>`;
    }));
    // impacts et bateaux
    sea.cases.forEach((c, i) => {
      const is = sea.islands[c.is], M = P(is.C, c.a + c.v / 2, is.len * (c.v < 45 ? 0.72 : 0.62)), s = shots.get(i);
      if (sunk.has(i)) h += shipG(M.x, M.y, 'wreck') + `<text x="${f(M.x)}" y="${f(M.y + 4)}" class="mk skull" text-anchor="middle" dominant-baseline="central">☠</text>`;
      else if (st.show && st.show.has(i)) h += shipG(M.x, M.y, 'ghost');
      else if (st.mine && st.mine.has(i)) h += shipG(M.x, M.y, 'mine');
      if (!sunk.has(i) && s === 'hit') h += `<text x="${f(M.x)}" y="${f(M.y)}" class="mk${st.boom === i ? ' pop' : ''}" text-anchor="middle" dominant-baseline="central">🔥</text>`;
      if (s === 'miss') h += `<g class="${st.boom === i ? 'pop' : ''}"><circle cx="${f(M.x)}" cy="${f(M.y)}" r="8" class="spl"/><circle cx="${f(M.x)}" cy="${f(M.y)}" r="15" class="spl s2"/></g>`;
    });
    // bouées
    sea.islands.forEach((is, k) => is.rays.forEach((r, ri) => r.pts.forEach((L, j) => {
      const Q = ptPos(is, ri, j), T = ptLabel(is, ri, j), ti = taps.indexOf(L);
      h += `<g class="pt${ti >= 0 ? ' on' : ''}" ${st.place ? '' : `data-pt="${L}"`}><circle cx="${f(Q.x)}" cy="${f(Q.y)}" r="4.5" class="buoy"/><text x="${f(T.x)}" y="${f(T.y)}" class="lbl" text-anchor="middle" dominant-baseline="central">${L}</text>
        <circle cx="${f((Q.x + T.x) / 2)}" cy="${f((Q.y + T.y) / 2)}" r="16" class="hit"/>${ti >= 0 ? `<text x="${f(T.x + 10)}" y="${f(T.y - 11)}" class="ord" text-anchor="middle">${ti + 1}</text>` : ''}</g>`;
    })));
    // les îles (sommets)
    sea.islands.forEach((is) => {
      const ti = taps.indexOf(is.V);
      h += `<g class="pt isl${ti >= 0 ? ' on' : ''}" ${st.place ? '' : `data-pt="${is.V}"`}><path d="M${f(is.C.x - 15)} ${f(is.C.y + 3)} Q${f(is.C.x - 13)} ${f(is.C.y - 13)} ${f(is.C.x + 2)} ${f(is.C.y - 12)} Q${f(is.C.x + 17)} ${f(is.C.y - 9)} ${f(is.C.x + 14)} ${f(is.C.y + 5)} Q${f(is.C.x + 6)} ${f(is.C.y + 16)} ${f(is.C.x - 6)} ${f(is.C.y + 13)} Q${f(is.C.x - 16)} ${f(is.C.y + 11)} ${f(is.C.x - 15)} ${f(is.C.y + 3)} Z" class="sand"/>
        <circle cx="${f(is.C.x)}" cy="${f(is.C.y)}" r="3.5" class="vtx"/><text x="${f(is.C.x)}" y="${f(is.C.y + 26)}" class="lbl vl" text-anchor="middle" dominant-baseline="central">${is.V}</text>
        <circle cx="${f(is.C.x)}" cy="${f(is.C.y + 8)}" r="22" class="hit"/>${ti >= 0 ? `<text x="${f(is.C.x + 14)}" y="${f(is.C.y + 18)}" class="ord" text-anchor="middle">${ti + 1}</text>` : ''}</g>`;
    });
    if (st.finger) {
      let Q = null;
      sea.islands.forEach((is) => { if (is.V === st.finger) Q = { x: is.C.x, y: is.C.y + 6 }; is.rays.forEach((r, ri) => r.pts.forEach((L, j) => { if (L === st.finger) Q = ptPos(is, ri, j); })); });
      if (Q) h += `<text x="${f(Q.x + 6)}" y="${f(Q.y + 24)}" class="finger" text-anchor="middle">👆</text>`;
    }
    return h + `<rect width="${W}" height="${H}" fill="url(#vig)" pointer-events="none"/></svg>`;
  }
  /** la boîte du nom, avec « sommet » sous la case du milieu */
  function nameBox(taps, bad) {
    const sl = [0, 1, 2].map((i) => `<span class="slot${i === 1 ? ' mid' : ''}${taps[i] ? ' full' : ''}${i === taps.length ? ' cur' : ''}${bad === 'mid' && i === 1 ? ' red' : ''}">${taps[i] || ''}<small>${i === 1 ? 'sommet' : 'point'}</small></span>`).join('');
    return `<div class="nbox${taps.length === 3 && !bad ? ' done' : ''}${bad ? ' bad' : ''}"><span class="hat" aria-hidden="true"></span><span class="slots">${sl}</span></div>`;
  }
  const fleetRow = (ships, cls = '') => `<span class="fleet">${ships.map((s) => `<i class="${isSunk(s) ? 'dead' : ''} ${cls}">${'▰'.repeat(s.cells.length)}</i>`).join('')}</span>`;

  /* =========================================================
     Cartes (solo)
     ========================================================= */
  const MISSIONS = [
    { id: 'c1', name: 'L’îlot', tag: '1 île · 2 bateaux', sea: { islands: 1, rays: [5, 5] }, fleet: [2, 1], demo: true },
    { id: 'c2', name: 'Les deux îles', tag: 'Quelle île au milieu ?', sea: { islands: 2, rays: [4, 5] }, fleet: [2, 1, 1] },
    { id: 'c3', name: 'Les bouées doubles', tag: 'Un angle, plusieurs noms', sea: { islands: 2, rays: [4, 5], double: 2 }, fleet: [2, 2, 1] },
    { id: 'c4', name: 'L’archipel', tag: '3 îles · 3 bateaux', sea: { islands: 3, rays: [4, 5], double: 1 }, fleet: [3, 2, 1] },
    { id: 'c5', name: 'Le repaire', tag: '3 îles · grande flotte', sea: { islands: 3, rays: [5, 5], double: 2 }, fleet: [3, 2, 2, 1], boss: true },
  ];
  const unlocked = (i) => ALL_OPEN || i === 0 || (S.d.stars[MISSIONS[i - 1].id] || 0) > 0;
  const ammoFor = (sea, M) => M.fleet.reduce((a, b) => a + b, 0) + Math.ceil(sea.cases.length * 0.55) + 1;
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;

  let G = null, demoT = null;
  const stopDemo = () => { if (demoT) clearTimeout(demoT); demoT = null; };
  function home() {
    G = null; stopDemo();
    const total = MISSIONS.reduce((s, z) => s + (S.d.stars[z.id] || 0), 0);
    const nextI = MISSIONS.findIndex((z, i) => unlocked(i) && !S.d.stars[z.id]);
    app.innerHTML = `<div class="screen home">
      <header class="brand"><span class="skull-b" aria-hidden="true">☠</span><div><h1>Les Corsaires</h1><p class="sub">Nomme l’angle… et feu !</p></div><span class="lvl">sixième · ★ ${total}/${MISSIONS.length * 3}</span></header>
      <div class="charts">${MISSIONS.map((z, i) => { const lock = !unlocked(i), st = S.d.stars[z.id] || 0; return `<button type="button" class="chart${z.boss ? ' boss' : ''}${lock ? ' locked' : ''}${i === nextI ? ' next' : ''}" data-z="${i}" ${lock ? 'disabled' : ''}>
        <span class="xmark" aria-hidden="true">${lock ? '🔒' : '✕'}</span><span class="nm">${i + 1}. ${z.name}</span><span class="rl">${z.tag}</span><span class="st">${starStr(st)}</span></button>`; }).join('')}</div>
      <button type="button" class="duel-btn" data-act="duel"><span aria-hidden="true">⚔️</span> <b>Duel</b><small>chacun cache sa flotte, puis on se tire dessus chacun son tour</small></button>
      <button type="button" class="howbtn" data-act="how">❔ Comment jouer</button></div>`;
    app.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => { Snd.init(); brief(MISSIONS[Number(b.dataset.z)]); }));
    app.querySelector('[data-act="duel"]').addEventListener('click', () => { Snd.init(); duel(); });
    app.querySelector('[data-act="how"]').addEventListener('click', () => { Snd.init(); brief(null); });
  }

  /* ---------- La règle, montrée ---------- */
  function brief(M) {
    stopDemo();
    app.innerHTML = `<div class="screen brief"><h2 class="bt">${M ? M.name : 'Comment jouer'}</h2>
      <div class="demo"><div class="dleft"><div class="dfig" id="dfig"></div><div id="dbox"></div></div>
        <div class="steps">
          <div class="step" data-s="0"><span class="si">👆</span><span>Touche <b>3 lettres</b> : un point, l’<b>île au milieu</b>, un point</span></div>
          <div class="step" data-s="1"><span class="si">🎯</span><span>L’angle visé s’éclaire : <b>Feu !</b></span></div>
          <div class="step" data-s="2"><span class="si">🔥</span><span>Touché ! (ou 💦 à l’eau)</span></div>
          <div class="step" data-s="3"><span class="si">✗</span><span>L’île pas au milieu ? Le boulet est <b>perdu</b></span></div>
        </div></div>
      <p class="goal">☠ Coule tous les bateaux avant d’avoir vidé ta réserve de boulets. Un bateau peut tenir dans 2 ou 3 angles voisins.</p>
      <div class="row"><button type="button" class="btn ghost" data-act="back">← Retour</button>${M ? '<button type="button" class="btn go" data-act="go">⚓ À l’abordage</button>' : ''}</div></div>`;
    app.querySelector('[data-act="back"]').addEventListener('click', home);
    const go = app.querySelector('[data-act="go"]');
    if (go) { go.addEventListener('click', () => { stopDemo(); start(M); }); go.focus(); }
    runDemo();
  }
  function runDemo() {
    const sea = U.withSeed(3, () => makeSea({ islands: 1, rays: [5, 5] }));
    const is = sea.islands[0]; is.V = 'O';
    const A = is.rays[1].pts[0], B = is.rays[2].pts[0], cell = caseOf(sea, 0, 1);
    const frames = [
      { st: { taps: [], finger: A }, b: [], s: 0 }, { st: { taps: [A], finger: 'O' }, b: [A], s: 0 }, { st: { taps: [A, 'O'], finger: B }, b: [A, 'O'], s: 0 },
      { st: { taps: [A, 'O', B], aim: cell }, b: [A, 'O', B], s: 1, t: 1300, fire: true },
      { st: { taps: [], shots: new Map([[cell, 'hit']]), boom: cell }, b: [], s: 2, t: 1700 },
      { st: { taps: ['O', A, B], shots: new Map([[cell, 'hit']]) }, b: ['O', A, B], bad: 'mid', s: 3, t: 2200 },
    ];
    const fig = document.getElementById('dfig'), box = document.getElementById('dbox');
    let k = 0;
    const step = () => {
      if (!document.body.contains(fig)) return;
      const fr = frames[k % frames.length];
      fig.innerHTML = mapSVG(sea, fr.st);
      box.innerHTML = nameBox(fr.b, fr.bad) + (fr.fire ? '<span class="firedemo">💥 Feu !</span>' : '');
      document.querySelectorAll('.step').forEach((e) => e.classList.toggle('on', Number(e.dataset.s) === fr.s));
      k++; demoT = setTimeout(step, fr.t || 800);
    };
    step();
  }

  /* ---------- Une partie solo ---------- */
  function start(M) {
    let sea, fleet;
    do { sea = makeSea(M.sea); fleet = randomFleet(sea, M.fleet); } while (!fleet);
    G = { M, sea, fleet, ammo: ammoFor(sea, M), shots: new Map(), taps: [], fired: 0, bad: 0, msg: '', boom: null, wide: null, over: false, log: [] };
    draw();
  }
  function current() {
    if (G.taps.length < 3) return { r: null };
    const r = readName(G.sea, G.taps);
    return { r };
  }
  function draw() {
    const { M, sea, fleet } = G, { r } = current(), sunk = new Set(fleet.filter(isSunk).flatMap((s) => s.cells));
    const ready = r && r.ok && !G.over;
    app.innerHTML = `<div class="screen play">
      <div class="hud"><button type="button" class="quit" data-act="quit" aria-label="Arrêter">✕</button><span class="zn">${M.name}</span>${fleetRow(fleet)}
        <span class="ammo" title="boulets">${'●'.repeat(Math.max(0, G.ammo))}<b>${G.ammo}</b></span></div>
      <div class="game"><div class="field" id="field">${mapSVG(sea, { taps: G.taps, aim: ready ? r.cell : null, shots: G.shots, sunk, boom: G.boom, wide: G.wide, show: G.over ? new Set(fleet.flatMap((s) => s.cells)) : null })}</div>
        <div class="side">
          ${nameBox(G.taps, r && !r.ok ? r.code : null)}
          <div class="row"><button type="button" class="fire" data-act="fire" ${ready ? '' : 'disabled'}>💥 Feu !</button><button type="button" class="clr" data-act="clr" ${G.taps.length && !G.over ? '' : 'disabled'}>⌫</button></div>
          <div class="msg">${G.msg}</div>
          <div class="log">${G.log.slice(0, 12).map((l) => `<span>${l}</span>`).join('')}</div>
        </div></div></div>`;
    app.querySelector('[data-act="quit"]').addEventListener('click', () => { if (G.over || confirm('Quitter la partie ?')) home(); });
    app.querySelectorAll('#field [data-pt]').forEach((el) => U.tap(el, () => tapPt(el.dataset.pt)));
    U.tap(app.querySelector('[data-act="fire"]'), fire);
    U.tap(app.querySelector('[data-act="clr"]'), () => { if (G.over) return; G.taps = []; G.msg = ''; G.wide = null; draw(); });
    G.boom = null;
  }
  function tapPt(L) {
    if (G.over) return;
    if (G.taps.length === 3) { G.taps = []; G.wide = null; }
    G.taps.push(L); Snd.pt(G.taps.length - 1); G.msg = '';
    if (G.taps.length === 3) {
      const r = readName(G.sea, G.taps), nm = ang(G.taps.join(''));
      if (!r.ok) {
        // nom faux ou angle trop large : le boulet est perdu
        G.ammo--; G.bad++; Snd.bad(); G.wide = r.code === 'wide' ? r : null;
        G.msg = `<div class="explain bad">✗ <b>${nm}</b> : boulet perdu ! ${r.why}</div>`;
        G.log.unshift(`✗ ${nm}`);
        if (G.ammo <= 0) { lose(); return; }
      } else if (G.shots.has(r.cell)) {
        G.msg = `<div class="explain">Cet angle a déjà été visé. Choisis-en un autre.</div>`;
      } else G.msg = `<div class="explain ok">🎯 ${nm} : c’est bien un angle de la carte. <b>Feu !</b></div>`;
    }
    draw();
  }
  function fire() {
    if (G.over) return;
    const r = readName(G.sea, G.taps); if (!r.ok || G.shots.has(r.cell)) return;
    const nm = ang(G.taps.join('')), ship = G.fleet.find((s) => s.cells.includes(r.cell));
    G.ammo--; G.fired++; G.boom = r.cell; G.taps = [];
    if (ship) {
      G.shots.set(r.cell, 'hit'); ship.hits.add(r.cell); Snd.boom();
      if (isSunk(ship)) { setTimeout(() => Snd.sink(), 300); G.msg = `<div class="explain good">☠ ${nm} : <b>coulé !</b></div>`; G.log.unshift(`☠ ${nm}`); }
      else { G.msg = `<div class="explain good">🔥 ${nm} : <b>touché !</b> Le bateau continue peut-être dans un angle voisin…</div>`; G.log.unshift(`🔥 ${nm}`); }
    } else { G.shots.set(r.cell, 'miss'); Snd.splash(); G.msg = `<div class="explain">💦 ${nm} : à l’eau.</div>`; G.log.unshift(`💦 ${nm}`); }
    if (G.fleet.every(isSunk)) { win(); return; }
    if (G.ammo <= 0) { lose(); return; }
    draw();
  }
  function win() {
    const M = G.M; G.over = true;
    const stars = G.bad === 0 && G.ammo >= 2 ? 3 : G.bad <= 1 ? 2 : 1, old = S.d.stars[M.id] || 0;
    S.d.stars[M.id] = Math.max(old, stars); S.save();
    Snd.win(); U.confetti(stars * 25, ['#b3261e', '#f2c14e', '#2b5d8a', '#3b2a1a']);
    const next = MISSIONS[MISSIONS.indexOf(M) + 1];
    G.msg = `<div class="explain good big">☠ Toute la flotte est coulée ! <span class="stars">${starStr(stars)}</span><br><small>${G.ammo} boulet${G.ammo > 1 ? 's' : ''} en réserve · ${G.bad} nom${G.bad > 1 ? 's' : ''} faux${stars < 3 ? ' — 3 ★ : aucun nom faux et au moins 2 boulets en réserve' : ''}</small></div>
      <div class="row"><button type="button" class="btn ghost" data-act="home">← Cartes</button><button type="button" class="btn${next ? '' : ' go'}" data-act="again">↻ Rejouer</button>${next ? '<button type="button" class="btn go" data-act="next">Carte suivante ▶</button>' : ''}</div>`;
    endBind(next);
  }
  function lose() {
    G.over = true; Snd.lose();
    G.msg = `<div class="explain bad big">Plus de boulets… la flotte ennemie s’échappe ! <small>(les bateaux restants sont dessinés)</small></div>
      <div class="row"><button type="button" class="btn ghost" data-act="home">← Cartes</button><button type="button" class="btn go" data-act="again">↻ Réessayer</button></div>`;
    endBind(null);
  }
  function endBind(next) {
    const M = G.M; draw();
    app.querySelector('[data-act="home"]').addEventListener('click', home);
    app.querySelector('[data-act="again"]').addEventListener('click', () => start(M));
    app.querySelector('[data-act="next"]')?.addEventListener('click', () => brief(next));
  }

  /* =========================================================
     DUEL : chacun cache sa flotte (sur sa moitié), puis chacun son tour tire sur celle de l'autre
     ========================================================= */
  const MODES = [
    { id: '1', nom: 'Deux îles', desc: 'Flotte : ▰▰ ▰ ▰', sea: { islands: 2, rays: [4, 5] }, fleet: [2, 1, 1] },
    { id: '2', nom: 'Bouées doubles', desc: 'Plusieurs noms · ▰▰ ▰▰ ▰', sea: { islands: 2, rays: [5, 5], double: 2 }, fleet: [2, 2, 1] },
    { id: '3', nom: 'L’archipel', desc: '3 îles · ▰▰▰ ▰▰ ▰', sea: { islands: 3, rays: [4, 5], double: 1 }, fleet: [3, 2, 1] },
  ];
  function duel() {
    window.Moteur.match({ jeu: 'corsaires-6e', titre: 'Les Corsaires', niveauScolaire: 'sixième', theme: 'corsaires', icone: '☠', sound: Snd, modes: MODES, quitter: home,
      start: (ctx) => duelPlay(ctx) });
  }
  function duelPlay(ctx) {
    const M = MODES.find((m) => m.id === ctx.mode) || MODES[0];
    let sea; do { sea = makeSea(M.sea); } while (!randomFleet(sea, M.fleet));
    const D = { phase: 'place', fleet: [[], []], cur: [[], []], ready: [false, false], turn: rand(0, 1), taps: [[], []], shots: [new Map(), new Map()],
      msg: ['', ''], boom: [null, null], wide: [null, null], fired: [0, 0], bad: [0, 0] };
    const nm = (k) => U.esc(ctx.P[k].nom), col = (k) => (k === 0 ? 'p0' : 'p1');
    const usedBy = (k) => new Set(D.fleet[k].flatMap((s) => s.cells));
    function render() { ctx.turn(D.phase === 'play' ? D.turn : null); ctx.P.forEach((p) => (D.phase === 'place' ? renderPlace(p) : renderPlay(p))); }
    /* --- placement : chaque bateau dans des angles voisins autour d'une même île --- */
    function renderPlace(p) {
      const k = p.k, placed = D.fleet[k], size = M.fleet[placed.length];
      if (D.ready[k]) {
        p.el.innerHTML = `<div class="dz wait"><p class="dbig">🙈 Flotte cachée !</p><p class="m-dim m-pulse">${nm(1 - k)} cache la sienne…</p><button type="button" class="m-btn m-ghost" data-a="undo">Recommencer le placement</button></div>`;
        U.tap(p.el.querySelector('[data-a="undo"]'), () => { D.ready[k] = false; D.fleet[k] = []; D.cur[k] = []; render(); });
        return;
      }
      const mine = new Set([...usedBy(k), ...D.cur[k]]);
      p.el.innerHTML = `<div class="dz"><div class="dhead"><b class="${col(k)}">${nm(k)}</b><span>🙈 cache ta flotte</span></div>
        <p class="placeask">${size ? `Place un bateau de <b>${size} angle${size > 1 ? 's' : ''}</b> ${'▰'.repeat(size)}${size > 1 ? ' : touche des angles <b>voisins</b> autour de la même île' : ''}` : 'Ta flotte est prête !'}</p>
        <div class="dfield">${mapSVG(sea, { mine, place: true })}</div>
        <div class="drow"><button type="button" class="m-btn m-ghost" data-a="undo">↺ Recommencer</button><button type="button" class="m-btn m-go" data-a="ok" ${size ? 'disabled' : ''}>✔ Prêt</button></div>
        <p class="m-dim small">Cache bien ta moitié : l’autre ne doit pas voir !</p></div>`;
      p.el.querySelectorAll('[data-case]').forEach((el) => U.tap(el, () => {
        const c = Number(el.dataset.case);
        if (!size || usedBy(k).has(c)) return;
        const cur = D.cur[k];
        if (cur.includes(c)) { cur.splice(cur.indexOf(c), 1); Snd.key(); renderPlace(p); return; }
        const test = [...cur, c];
        if (!runOK(test)) { Snd.bad(); return; }
        cur.push(c); Snd.key();
        if (cur.length === size) { D.fleet[k].push({ cells: [...cur], hits: new Set() }); D.cur[k] = []; Snd.tone(660, 0.1, 'square', 0.04); }
        renderPlace(p);
      }));
      U.tap(p.el.querySelector('[data-a="undo"]'), () => { D.fleet[k] = []; D.cur[k] = []; renderPlace(p); });
      U.tap(p.el.querySelector('[data-a="ok"]'), () => {
        if (D.fleet[k].length !== M.fleet.length) return;
        D.ready[k] = true;
        if (D.ready[0] && D.ready[1]) { D.phase = 'play'; D.msg = [0, 1].map((x) => (x === D.turn ? 'À toi de tirer en premier !' : `${nm(D.turn)} tire en premier.`)); }
        render();
      });
    }
    /** des cases forment-elles une suite d'angles voisins autour d'une même île ? */
    function runOK(cells) {
      const c0 = sea.cases[cells[0]];
      if (cells.some((c) => sea.cases[c].is !== c0.is)) return false;
      const n = sea.islands[c0.is].rays.length, rs = cells.map((c) => sea.cases[c].r);
      if (rs.length > n - 1) return false;
      for (let s = 0; s < n; s++) { const run = Array.from({ length: rs.length }, (_, j) => (s + j) % n); if (rs.every((r) => run.includes(r))) return true; }
      return false;
    }
    /* --- les tirs --- */
    function renderPlay(p) {
      const k = p.k, myTurn = D.turn === k, taps = D.taps[k], r = taps.length === 3 ? readName(sea, taps) : null, enemy = D.fleet[1 - k];
      const ready = myTurn && r && r.ok && !D.shots[k].has(r.cell), sunk = new Set(enemy.filter(isSunk).flatMap((s) => s.cells));
      p.el.innerHTML = `<div class="dz"><div class="dhead"><b class="${col(k)}">${nm(k)}</b><span>flotte de ${nm(1 - k)} :</span>${fleetRow(enemy)}<span class="m-dim">· la tienne :</span>${fleetRow(D.fleet[k], 'small')}</div>
        <div class="dfield">${mapSVG(sea, { taps, aim: ready ? r.cell : null, shots: D.shots[k], sunk, boom: D.boom[k], wide: D.wide[k] })}</div>
        <div class="dctl">${nameBox(taps, r && !r.ok ? r.code : null)}<button type="button" class="fire" data-a="fire" ${ready ? '' : 'disabled'}>💥 Feu !</button></div>
        <div class="dmsg">${myTurn ? '' : `<span class="m-dim">⏳ ${nm(1 - k)} vise…</span> `}${D.msg[k]}</div></div>`;
      if (myTurn) p.el.querySelectorAll('.dfield [data-pt]').forEach((el) => U.tap(el, () => tapD(k, el.dataset.pt)));
      U.tap(p.el.querySelector('[data-a="fire"]'), () => fireD(k));
      D.boom[k] = null;
    }
    function pass(k) { D.lock = false; D.taps[k] = []; D.wide[k] = null; D.turn = 1 - k; render(); }
    function tapD(k, L) {
      if (D.turn !== k || D.phase !== 'play' || D.lock) return;
      const t = D.taps[k];
      if (t.length === 3) { t.length = 0; D.wide[k] = null; }
      t.push(L); Snd.pt(t.length - 1); D.msg[k] = '';
      if (t.length === 3) {
        const r = readName(sea, t), name = ang(t.join(''));
        if (!r.ok) {
          D.bad[k]++; D.fired[k]++; Snd.bad(); D.wide[k] = r.code === 'wide' ? r : null;
          D.msg[k] = `<span class="bad">✗ ${name} : boulet perdu ! ${r.why}</span>`;
          D.msg[1 - k] = `${nm(k)} a écrit ${name} : nom faux, boulet perdu. À toi !`;
          D.lock = true;
          renderPlay(ctx.P[k]);
          ctx.later(() => pass(k), 1800);
          return;
        }
        if (D.shots[k].has(r.cell)) D.msg[k] = 'Déjà visé : choisis un autre angle.';
      }
      renderPlay(ctx.P[k]);
    }
    function fireD(k) {
      if (D.turn !== k || D.phase !== 'play' || D.lock) return;
      const t = D.taps[k], r = readName(sea, t); if (!r.ok || D.shots[k].has(r.cell)) return;
      const name = ang(t.join('')), ship = D.fleet[1 - k].find((s) => s.cells.includes(r.cell));
      D.fired[k]++; D.boom[k] = r.cell;
      if (ship) {
        D.shots[k].set(r.cell, 'hit'); ship.hits.add(r.cell); Snd.boom();
        const sk = isSunk(ship); if (sk) setTimeout(() => Snd.sink(), 300);
        D.msg[k] = `${name} : <b>${sk ? 'coulé ☠' : 'touché 🔥'}</b>`; D.msg[1 - k] = `😱 ${nm(k)} tire en ${name} : ${sk ? 'ton bateau est coulé' : 'touché'} !`;
        if (D.fleet[1 - k].every(isSunk)) { end(k); return; }
      } else {
        D.shots[k].set(r.cell, 'miss'); Snd.splash();
        D.msg[k] = `${name} : à l’eau 💦`; D.msg[1 - k] = `${nm(k)} tire en ${name} : raté 😌`;
      }
      pass(k);
    }
    function end(w) {
      const show = (x) => mapSVG(sea, { shots: D.shots[1 - x], sunk: new Set(D.fleet[x].filter(isSunk).flatMap((s) => s.cells)), show: new Set(D.fleet[x].flatMap((s) => s.cells)) });
      ctx.end({ winner: w,
        score: [0, 1].map((x) => `${D.fired[x]} tirs, ${D.bad[x]} nom${D.bad[x] > 1 ? 's' : ''} faux`),
        stats: [0, 1].map((x) => ({ tirs: D.fired[x], nomsFaux: D.bad[x] })),
        text: [0, 1].map((x) => `<p class="m-dim">${nm(w)} a coulé toute la flotte en ${D.fired[w]} tirs. Tes noms faux : ${D.bad[x]}.</p><p class="m-dim">Ta flotte et les tirs de ${nm(1 - x)} :</p><div class="endsea">${show(x)}</div>`) });
    }
    render();
  }

  window.__corsaires = { makeSea, readName, randomFleet, MISSIONS, MODES, get G() { return G; } };
  home();
})();
