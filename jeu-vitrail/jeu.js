/* =========================================================
   LE VITRAIL · sixième — jeu du chapitre « Les angles » (trouver des angles de proche en proche)
   Une rosace de cathédrale : des demi-droites de même origine O découpent des vitres (les angles). Quelques vitres
   sont allumées (leur mesure est donnée), les autres sont éteintes (« ? »).
   Pour allumer une vitre : la toucher, choisir l'OUTIL (la propriété) qui donne sa mesure, taper la mesure.
   Outils : ✕ opposés par le sommet · ━ points alignés (180°) · ⌐ angle droit (90°) · ⫽ bissectrice · ＋ somme (adjacents).
   L'outil doit permettre de trouver CETTE vitre maintenant, avec les vitres déjà allumées.
   À partir de l'étape 4, les outils sont COMPTÉS : il faut prévoir l'ordre et l'outil de chaque vitre (une vraie
   énigme : un outil gâché ailleurs peut manquer plus tard).
   Duel (tour par tour, moteur commun) : même rosace ; chacun son tour allume une vitre (mesure juste ET bon outil)
   et gagne ses degrés. Allumer une vitre en débloque d'autres… pour l'adversaire aussi. Le plus de degrés gagne.
   Adresse avec ?tout : toutes les étapes sont ouvertes (pour le professeur).
   ========================================================= */
(function () {
  'use strict';
  const { U } = window.Moteur;
  const { rand, pick, shuffle } = U;
  const app = document.getElementById('app');
  const S = U.store('u6e-vitrail');
  S.d.stars = S.d.stars || {};
  const ALL_OPEN = /[?&]tout\b/.test(location.search);
  const Snd = window.Moteur.makeSound(() => !!S.d.mute);
  Snd.glass = function () { [1568, 2093, 2637].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.04, 0, i * 0.05)); };
  Snd.crack = function () { this.noise(0.18, 0.25, 3000); this.tone(140, 0.2, 'sawtooth', 0.04, 80); };
  const muteBtn = document.getElementById('mute');
  const syncMute = () => { muteBtn.textContent = S.d.mute ? '🔇' : '🔊'; };
  muteBtn.addEventListener('click', () => { S.d.mute = !S.d.mute; S.save(); syncMute(); Snd.init(); });
  syncMute();

  /* =========================================================
     La figure (même construction que l'ancien « Angles en chaîne »)
     F = { dirs, L, cases: [{ i, j, v }], cons, comp, bisec, rights, given: Set }
     Contraintes : opp (a = b) · bis (a = b) · plat (somme = 180) · droit (somme = 90) · adj (somme = v)
     ========================================================= */
  const norm = (a) => ((a % 360) + 360) % 360;
  const ccw = (a, b) => norm(b - a);
  const LET = 'ABCDEFGHJKLMNPRSTUVZ';
  function buildFigure(o) {
    for (let tries = 0; tries < 400; tries++) {
      const dirs = new Set(), pairs = [], rights = [], bisec = [];
      const a = rand(0, 179);
      const add = (d) => { d = norm(Math.round(d)); for (const x of dirs) { const g = Math.min(ccw(x, d), ccw(d, x)); if (g < 16) return null; } dirs.add(d); return d; };
      add(a); add(a + 180); pairs.push([norm(a), norm(a + 180)]);
      if (o.lines >= 2) { const b = a + pick([1, -1]) * rand(35, 75); if (add(b) !== null && add(b + 180) !== null) pairs.push([norm(b), norm(b + 180)]); else continue; }
      if (o.perp) { const up = Math.random() < 0.5, p = norm(a + (up ? 90 : -90)); if (add(p) === null) continue; rights.push(up ? [norm(a), p] : [p, norm(a)]); }
      for (let k = 0; k < (o.extra || 0); k++) add(a + rand(10, 350));
      let D = [...dirs].sort((x, y) => x - y);
      if (o.bis) {
        const cand = D.map((d, i) => ({ d, e: D[(i + 1) % D.length] })).filter(({ d, e }) => ccw(d, e) >= 44 && ccw(d, e) <= 150 && ccw(d, e) % 2 === 0);
        if (!cand.length) continue;
        const c = pick(cand), m = norm(c.d + ccw(c.d, c.e) / 2);
        dirs.add(m); bisec.push({ u: c.d, b: m, w: c.e });
        D = [...dirs].sort((x, y) => x - y);
      }
      if (D.length > (o.maxRays || 8) || D.length < 3) continue;
      const n = D.length, cases = D.map((d, i) => ({ i, j: (i + 1) % n, v: ccw(d, D[(i + 1) % n]) }));
      if (cases.some((c) => c.v >= 180 || c.v < 14)) continue;
      const idx = (d) => D.indexOf(norm(d));
      const span = (from, to) => { const out = []; let i = idx(from); while (D[i] !== norm(to)) { out.push(i); i = (i + 1) % n; } return out; };
      const cons = [];
      pairs.forEach(([p, q]) => { cons.push({ t: 'plat', set: span(p, q), from: idx(p), to: idx(q) }); cons.push({ t: 'plat', set: span(q, p), from: idx(q), to: idx(p) }); });
      rights.forEach(([p, q]) => cons.push({ t: 'droit', set: span(p, q), from: idx(p), to: idx(q) }));
      cases.forEach((c, i) => { const op = D.indexOf(norm(D[c.i] + 180)), oq = D.indexOf(norm(D[c.j] + 180)); if (op >= 0 && oq >= 0 && (op + 1) % n === oq && i < op) cons.push({ t: 'opp', a: i, b: op }); });
      bisec.forEach(({ u, b, w }) => cons.push({ t: 'bis', a: idx(u), b: idx(b), ray: idx(b), from: idx(u), to: idx(w) }));
      const comp = [];
      for (let k = 0; k < (o.comp || 0); k++) {
        const s = rand(0, n - 1), set = [s, (s + 1) % n], v = set.reduce((t, i) => t + cases[i].v, 0);
        if (v >= 180 || comp.some((c) => c.set.some((x) => set.includes(x)))) continue;
        comp.push({ set, v, from: s, to: (s + 2) % n });
        cons.push({ t: 'adj', set, v, from: s, to: (s + 2) % n });
      }
      if (!cons.some((c) => c.t === 'opp' || c.t === 'bis' || c.t === 'droit' || c.t === 'adj') && !o.lines) continue;
      const F = { dirs: D, L: shuffle([...LET]).slice(0, n), cases, cons, comp, bisec, rights: rights.map(([p, q]) => [idx(p), idx(q)]) };
      if (!chooseGivens(F, o)) continue;
      return F;
    }
    return null;
  }
  function deducible(c, known) {
    if (c.t === 'opp' || c.t === 'bis') { if (known.has(c.a) && !known.has(c.b)) return [c.b]; if (known.has(c.b) && !known.has(c.a)) return [c.a]; return []; }
    const un = c.set.filter((i) => !known.has(i));
    return un.length === 1 ? un : [];
  }
  function closure(F, start) {
    const known = new Set(start);
    let grew = true;
    while (grew) { grew = false; for (const c of F.cons) for (const i of deducible(c, known)) { known.add(i); grew = true; } }
    return known;
  }
  function chooseGivens(F, o) {
    const n = F.cases.length, all = [...Array(n).keys()];
    let given = new Set();
    for (const i of shuffle([...all])) { if (closure(F, given).size === n) break; if (!closure(F, given).has(i)) given.add(i); }
    if (closure(F, given).size !== n) return false;
    for (const i of shuffle([...given])) { const g2 = new Set(given); g2.delete(i); if (closure(F, g2).size === n) given = g2; }
    let known = new Set(given), steps = 0;
    while (known.size < n) { const nx = new Set(known); for (const c of F.cons) for (const i of deducible(c, known)) nx.add(i); known = nx; steps++; }
    if (n - given.size < (o.minFind || 3) || steps < (o.minSteps || 1)) return false;
    F.given = given; F.steps = steps;
    return true;
  }
  const usable = (F, t, i, known) => F.cons.find((c) => c.t === t && deducible(c, known).includes(i)) || null;
  /** un chemin de solution au hasard → le nombre d'outils de chaque sorte qu'il utilise */
  function toolKit(F) {
    const known = new Set(F.given), kit = {};
    while (known.size < F.cases.length) {
      const opts = [];
      F.cons.forEach((c) => deducible(c, known).forEach((i) => opts.push({ c, i })));
      const o = pick(opts); kit[o.c.t] = (kit[o.c.t] || 0) + 1; known.add(o.i);
    }
    return kit;
  }
  /** avec ces outils restants, peut-on encore tout allumer ? (recherche complète, figures petites) */
  function canFinish(F, known, kit, memo = new Map()) {
    if (known.size === F.cases.length) return true;
    const key = [...known].sort((a, b) => a - b).join() + '|' + TOOLS.map((t) => kit[t.id] || 0).join();
    if (memo.has(key)) return memo.get(key);
    let ok = false;
    for (const c of F.cons) {
      if (!(kit[c.t] > 0)) continue;
      for (const i of deducible(c, known)) {
        const k2 = new Set(known); k2.add(i);
        if (canFinish(F, k2, { ...kit, [c.t]: kit[c.t] - 1 }, memo)) { ok = true; break; }
      }
      if (ok) break;
    }
    memo.set(key, ok);
    return ok;
  }

  /* ---------- Les outils (propriétés) et les phrases ---------- */
  const ICON = {
    opp: '<path d="M6 11 L34 29 M6 29 L34 11" class="il"/><path d="M20 20 L9.3 13.1 A12.7 12.7 0 0 0 9.3 26.9 Z" class="ia"/><path d="M20 20 L30.7 26.9 A12.7 12.7 0 0 0 30.7 13.1 Z" class="ia"/>',
    plat: '<path d="M3 28 L37 28 M20 28 L30 9" class="il"/><path d="M8 28 A12 12 0 0 1 32 28" class="ic"/><circle cx="20" cy="28" r="2.2" class="id"/>',
    droit: '<path d="M8 33 L36 33 M8 33 L8 5 M8 33 L28 12" class="il"/><path d="M8 25 L16 25 L16 33" class="ic"/>',
    bis: '<path d="M5 33 L37 33 M5 33 L25 6" class="il"/><path d="M5 33 L37 17" class="il ib"/><path d="M25 27 L26 31 M27 26 L28 30 M20 18 L23 20 M21 16 L24 18" class="ic"/>',
    adj: '<path d="M5 33 L37 33 M5 33 L35 19 M5 33 L20 6" class="il"/><path d="M19 33 A14 14 0 0 0 17.7 27" class="ic"/><path d="M17.7 27 A14 14 0 0 0 12.5 21.2" class="ic ic2"/><path d="M31 33 A26 26 0 0 0 18 10.5" class="ic ic3"/>',
  };
  const TOOLS = [
    { id: 'opp', nom: 'Opposés', sub: 'par le sommet' },
    { id: 'plat', nom: 'Alignés', sub: '180°' },
    { id: 'droit', nom: 'Droit', sub: '90°' },
    { id: 'bis', nom: 'Bissectrice', sub: '2 moitiés' },
    { id: 'adj', nom: 'Somme', sub: 'adjacents' },
  ];
  const icon = (id) => `<svg viewBox="0 0 40 40" class="tic" aria-hidden="true">${ICON[id]}</svg>`;
  const ang = (s) => `<span class="m-ang">${s}</span>`;
  const caseName = (F, i) => F.L[F.cases[i].i] + 'O' + F.L[F.cases[i].j];
  const rayName = (F, r) => `[O${F.L[r]})`;
  const angleFromTo = (F, from, to) => F.L[from] + 'O' + F.L[to];
  function sentence(F, c, i) {
    const v = F.cases[i].v, nm = ang(caseName(F, i));
    if (c.t === 'opp' || c.t === 'bis') {
      const o = c.a === i ? c.b : c.a;
      return c.t === 'opp' ? `${nm} et ${ang(caseName(F, o))} sont opposés par le sommet, donc ${nm} = ${ang(caseName(F, o))} = ${v}°.`
        : `${rayName(F, c.ray)} est la bissectrice de ${ang(angleFromTo(F, c.from, c.to))}, donc ${nm} = ${ang(caseName(F, o))} = ${v}°.`;
    }
    const others = c.set.filter((x) => x !== i), tot = c.t === 'plat' ? 180 : c.t === 'droit' ? 90 : c.v;
    const head = c.t === 'plat' ? `${F.L[c.from]}, O et ${F.L[c.to]} sont alignés, donc ${ang(angleFromTo(F, c.from, c.to))} = 180°.`
      : c.t === 'droit' ? `${ang(angleFromTo(F, c.from, c.to))} est un angle droit.` : `${ang(angleFromTo(F, c.from, c.to))} = ${c.v}°.`;
    return `${head} ${nm} = ${tot}° − ${others.map((x) => F.cases[x].v + '°').join(' − ')} = ${v}°.`;
  }
  const consCells = (c) => (c.t === 'opp' || c.t === 'bis' ? [c.a, c.b] : c.set);

  /* ---------- Dessin de la rosace ---------- */
  const W = 400, O = { x: 200, y: 200 }, R = 168;
  const P = (a, L) => ({ x: O.x + L * Math.cos((a * Math.PI) / 180), y: O.y - L * Math.sin((a * Math.PI) / 180) });
  const f = (n) => n.toFixed(1);
  function wedge(a1, v, r, cls, attrs = '') {
    const p = P(a1, r), q = P(a1 + v, r);
    return `<path d="M${O.x} ${O.y} L${f(p.x)} ${f(p.y)} A${r} ${r} 0 ${v > 180 ? 1 : 0} 0 ${f(q.x)} ${f(q.y)} Z" class="${cls}" ${attrs}/>`;
  }
  const JEWELS = ['j1', 'j2', 'j3', 'j4', 'j5', 'j6'];
  /** st = { lit: Map(i → classe de couleur), sel, flash: [cases], bad: case, finger: case } */
  function roseSVG(F, st) {
    const D = F.dirs;
    let h = `<svg viewBox="0 0 ${W} ${W}" class="rose" role="img" aria-label="Rosace : demi-droites de même origine O">
      <defs><radialGradient id="shine" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <circle cx="${O.x}" cy="${O.y}" r="${R + 22}" class="stone"/><circle cx="${O.x}" cy="${O.y}" r="${R + 22}" class="stone2"/>`;
    F.cases.forEach((c, i) => {
      const g = F.given.has(i), lit = st.lit && st.lit.get(i);
      const cls = g ? 'g' : lit ? `lit ${lit}` : `u${st.sel === i ? ' sel' : ''}${st.bad === i ? ' bad' : ''}`;
      h += wedge(D[c.i], c.v, R, `pane ${cls}${st.flash && st.flash.includes(i) ? ' flash' : ''}`, !g && !lit ? `data-i="${i}"` : '');
    });
    h += `<circle cx="${O.x}" cy="${O.y}" r="${R}" fill="url(#shine)" pointer-events="none"/>`;
    // angles composés donnés : un arc doré
    F.comp.forEach((c) => {
      const a1 = D[c.from], v = ccw(a1, D[c.to]), r = R * 0.9, p = P(a1, r), q = P(a1 + v, r);
      let m = a1 + v / 2; if (D.some((d) => Math.min(ccw(d, m), ccw(m, d)) < 8)) m += Math.min(10, v / 4);
      const T = P(m, R * 0.9);
      h += `<path d="M${f(p.x)} ${f(p.y)} A${r} ${r} 0 0 0 ${f(q.x)} ${f(q.y)}" class="carc"/><g class="medal"><circle cx="${f(T.x)}" cy="${f(T.y)}" r="17"/><text x="${f(T.x)}" y="${f(T.y + 1)}" text-anchor="middle" dominant-baseline="central">${c.v}°</text></g>`;
    });
    // les plombs (demi-droites)
    D.forEach((d) => { const E = P(d, R + 2); h += `<line x1="${O.x}" y1="${O.y}" x2="${f(E.x)}" y2="${f(E.y)}" class="lead"/><line x1="${O.x}" y1="${O.y}" x2="${f(E.x)}" y2="${f(E.y)}" class="lead2"/>`; });
    // codages
    F.rights.forEach(([p]) => { const a = D[p], s = 17, A = P(a, s), B = P(a + 90, s), Cc = { x: A.x + B.x - O.x, y: A.y + B.y - O.y }; h += `<path d="M${f(A.x)} ${f(A.y)} L${f(Cc.x)} ${f(Cc.y)} L${f(B.x)} ${f(B.y)}" class="code"/>`; });
    F.bisec.forEach(({ u, b, w }) => { [[u, b], [b, w]].forEach(([x, y]) => { const m = x + ccw(x, y) / 2; for (const dd of [-3, 3]) { const A = P(m + dd, 36), B = P(m + dd, 48); h += `<line x1="${f(A.x)}" y1="${f(A.y)}" x2="${f(B.x)}" y2="${f(B.y)}" class="code"/>`; } }); });
    // mesures
    F.cases.forEach((c, i) => {
      const g = F.given.has(i), lit = st.lit && st.lit.has(i), M = P(D[c.i] + c.v / 2, c.v < 34 ? R * 0.74 : R * 0.6);
      h += `<text x="${f(M.x)}" y="${f(M.y)}" class="val${g ? ' gv' : lit ? '' : ' q'}" text-anchor="middle" dominant-baseline="central" pointer-events="none">${g || lit ? c.v + '°' : '?'}</text>`;
    });
    D.forEach((d, i) => { const T = P(d, R + 12); h += `<text x="${f(T.x)}" y="${f(T.y)}" class="lbl" text-anchor="middle" dominant-baseline="central">${F.L[i]}</text>`; });
    h += `<circle cx="${O.x}" cy="${O.y}" r="9" class="boss"/><text x="${O.x}" y="${O.y + 1}" class="olbl" text-anchor="middle" dominant-baseline="central">O</text>`;
    if (st.finger !== undefined && st.finger !== null) { const c = F.cases[st.finger], M = P(D[c.i] + c.v / 2, R * 0.6); h += `<text x="${f(M.x + 8)}" y="${f(M.y + 30)}" class="finger" text-anchor="middle">👆</text>`; }
    return h + '</svg>';
  }
  /** le plateau d'outils ; kit = null (illimité) ou { t: nombre } */
  function trayHTML(F, kit, sel, opts = {}) {
    const present = new Set(F.cons.map((c) => c.t));
    return `<div class="tray">${TOOLS.filter((t) => present.has(t.id)).map((t) => {
      const n = kit ? kit[t.id] || 0 : null;
      return `<button type="button" class="tool${sel === t.id ? ' on' : ''}${opts.finger === t.id ? ' fing' : ''}" data-t="${t.id}" ${n === 0 || opts.off ? 'disabled' : ''}>${icon(t.id)}<span class="tn">${t.nom}</span><span class="ts">${t.sub}</span>${n !== null ? `<span class="cnt">×${n}</span>` : ''}</button>`;
    }).join('')}</div>`;
  }

  /* =========================================================
     Étapes (solo)
     ========================================================= */
  const LEVELS = [
    { id: 'n1', name: 'La croisée', tag: 'Opposés · alignés', o: { lines: 2, minFind: 3 } },
    { id: 'n2', name: 'Le soleil', tag: 'Points alignés (180°)', o: { lines: 1, extra: 2, minFind: 2 } },
    { id: 'n3', name: 'L’équerre', tag: 'Angle droit (90°)', o: { lines: 1, perp: true, extra: 1, minFind: 3 } },
    { id: 'n4', name: 'Le partage', tag: 'Bissectrice · outils comptés', o: { lines: 1, extra: 2, bis: true, minFind: 3 }, kit: true },
    { id: 'n5', name: 'La gerbe', tag: 'Somme · outils comptés', o: { lines: 1, extra: 2, comp: 1, minFind: 3 }, kit: true },
    { id: 'n6', name: 'La grande rose', tag: 'Longues chaînes · outils comptés', o: { lines: 2, extra: 2, bis: true, minFind: 5, minSteps: 3, maxRays: 8 }, kit: true },
    { id: 'n7', name: 'La cathédrale', tag: 'Tout le chapitre · outils comptés', boss: true, o: { lines: 2, perp: true, bis: true, comp: 1, minFind: 5, minSteps: 3, maxRays: 8 }, kit: true },
  ];
  const ROUNDS = 3;
  const unlocked = (i) => ALL_OPEN || i === 0 || (S.d.stars[LEVELS[i - 1].id] || 0) > 0;
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;
  const figure = (o) => { for (let t = 0; t < 30; t++) { const F = buildFigure(o); if (F) return F; } return buildFigure({ lines: 2, minFind: 2 }); };

  let G = null, demoT = null;
  const stopDemo = () => { if (demoT) clearTimeout(demoT); demoT = null; };
  const ROSE_MINI = (n, lock) => `<svg viewBox="0 0 60 60" class="mini" aria-hidden="true"><circle cx="30" cy="30" r="27" class="ms"/>${Array.from({ length: n }, (_, k) => { const a = (k * 360) / n, b = ((k + 1) * 360) / n, p = [30 + 24 * Math.cos(a * Math.PI / 180), 30 - 24 * Math.sin(a * Math.PI / 180)], q = [30 + 24 * Math.cos(b * Math.PI / 180), 30 - 24 * Math.sin(b * Math.PI / 180)]; return `<path d="M30 30 L${f(p[0])} ${f(p[1])} A24 24 0 0 0 ${f(q[0])} ${f(q[1])} Z" class="${lock ? 'mu' : JEWELS[k % 6]}"/>`; }).join('')}</svg>`;

  function home() {
    G = null; stopDemo();
    const total = LEVELS.reduce((s, z) => s + (S.d.stars[z.id] || 0), 0);
    const nextI = LEVELS.findIndex((z, i) => unlocked(i) && !S.d.stars[z.id]);
    app.innerHTML = `<div class="screen home">
      <header class="brand"><h1>Le Vitrail</h1><p class="sub">Rallume la rosace, vitre par vitre</p><span class="lvl">sixième · ★ ${total}/${LEVELS.length * 3}</span></header>
      <div class="nave">${LEVELS.map((z, i) => { const lock = !unlocked(i), st = S.d.stars[z.id] || 0; return `<button type="button" class="win${z.boss ? ' boss' : ''}${lock ? ' locked' : ''}${i === nextI ? ' next' : ''}" data-z="${i}" ${lock ? 'disabled' : ''}>
        ${ROSE_MINI(4 + i, lock || !st)}<span class="nm">${i + 1}. ${z.name}</span><span class="rl">${z.tag}</span><span class="st">${starStr(st)}</span></button>`; }).join('')}</div>
      <button type="button" class="duel-btn" data-act="duel"><span aria-hidden="true">⚔️</span> <b>Duel</b><small>chacun son tour allume une vitre et gagne ses degrés</small></button>
      <button type="button" class="howbtn" data-act="how">❔ Comment jouer</button></div>`;
    app.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => { Snd.init(); brief(LEVELS[Number(b.dataset.z)]); }));
    app.querySelector('[data-act="duel"]').addEventListener('click', () => { Snd.init(); duel(); });
    app.querySelector('[data-act="how"]').addEventListener('click', () => { Snd.init(); brief(null); });
  }

  /* ---------- La règle, montrée ---------- */
  function brief(Z) {
    stopDemo();
    app.innerHTML = `<div class="screen brief"><h2 class="bt">${Z ? `${Z.name}` : 'Comment jouer'}</h2>
      <div class="demo"><div class="dleft"><div class="dfig" id="dfig"></div><div id="dtray"></div></div>
        <div class="steps">
          <div class="step" data-s="0"><span class="si">👆</span><span>Touche une vitre <b>?</b></span></div>
          <div class="step" data-s="1"><span class="si">${icon('opp')}</span><span>Choisis l’<b>outil</b> qui donne sa mesure</span></div>
          <div class="step" data-s="2"><span class="si">🔢</span><span>Tape la <b>mesure</b> ✔</span></div>
          <div class="step" data-s="3"><span class="si">✨</span><span>La vitre s’allume… et en débloque d’autres</span></div>
        </div></div>
      ${Z && Z.kit ? `<p class="goal">⚠️ Ici, les outils sont <b>comptés</b> (×2, ×1…) : réfléchis avant de les utiliser !</p>` : '<p class="goal">Mesure juste <b>et</b> bon outil, sinon la vitre se fêle.</p>'}
      <div class="row"><button type="button" class="btn ghost" data-act="back">← Retour</button>${Z ? '<button type="button" class="btn go" data-act="go">▶ Jouer</button>' : ''}</div></div>`;
    app.querySelector('[data-act="back"]').addEventListener('click', home);
    const go = app.querySelector('[data-act="go"]');
    if (go) { go.addEventListener('click', () => { stopDemo(); G = { Z, r: 0, stars: [] }; round(); }); go.focus(); }
    runDemo();
  }
  function runDemo() {
    const F = U.withSeed(11, () => figure({ lines: 2, minFind: 3 }));
    const known = new Set(F.given);
    let target = null, cons = null;
    for (const c of F.cons) { if (c.t !== 'opp') continue; const d = deducible(c, known); if (d.length) { target = d[0]; cons = c; break; } }
    if (target === null) { for (const c of F.cons) { const d = deducible(c, known); if (d.length) { target = d[0]; cons = c; break; } } }
    const fig = document.getElementById('dfig'), tray = document.getElementById('dtray');
    const frames = [
      { st: { finger: target }, s: 0, tool: null },
      { st: { sel: target }, s: 1, tool: null, finger: cons.t },
      { st: { sel: target }, s: 2, tool: cons.t, typed: `${F.cases[target].v}°` },
      { st: { lit: new Map([[target, 'j3']]), flash: consCells(cons) }, s: 3, tool: null, t: 2400, snd: true },
    ];
    let k = 0;
    const step = () => {
      if (!document.body.contains(fig)) return;
      const fr = frames[k % frames.length];
      fig.innerHTML = roseSVG(F, fr.st);
      tray.innerHTML = trayHTML(F, null, fr.tool, { finger: fr.finger, off: false }) + (fr.typed ? `<div class="typed">${fr.typed} ✔</div>` : '');
      document.querySelectorAll('.step').forEach((e) => e.classList.toggle('on', Number(e.dataset.s) === fr.s));
      k++;
      demoT = setTimeout(step, fr.t || 1300);
    };
    step();
  }

  /* ---------- Une rosace (solo) ---------- */
  function round() {
    if (G.r >= ROUNDS) { endLevel(); return; }
    const F = figure(G.Z.o);
    G.F = F; G.kit = G.Z.kit ? toolKit(F) : null; G.kit0 = G.kit ? { ...G.kit } : null;
    G.lit = new Map(); G.sel = null; G.tool = null; G.err = 0; G.wrong = new Map(); G.log = []; G.msg = ''; G.flash = null; G.bad = null; G.stuck = false;
    draw();
  }
  const knownSet = () => new Set([...G.F.given, ...G.lit.keys()]);
  function draw() {
    const F = G.F, Z = G.Z, left = F.cases.length - F.given.size - G.lit.size;
    app.innerHTML = `<div class="screen play">
      <div class="hud"><button type="button" class="quit" data-act="quit" aria-label="Arrêter">✕</button><span class="zn">${Z.name}</span>
        <span class="dots">${Array.from({ length: ROUNDS }, (_, i) => `<i class="${G.stars[i] === 3 ? 'ok' : G.stars[i] ? 'mid' : i === G.r ? 'cur' : ''}"></i>`).join('')}</span>
        <span class="right">? ${left} · <span class="crack">✗ ${G.err}</span></span></div>
      <div class="game"><div class="field" id="field">${roseSVG(F, { lit: G.lit, sel: G.sel, flash: G.flash, bad: G.bad })}</div>
        <div class="side">
          <p class="ask">${G.sel === null ? '👆 Touche une vitre <b>?</b>' : `${ang(caseName(F, G.sel))} = <b>?</b>`}</p>
          ${trayHTML(F, G.kit, G.tool, { off: G.sel === null })}
          <div id="pad" class="${G.sel === null ? 'off' : ''}"></div>
          ${G.kit ? '<button type="button" class="reset" data-act="reset">↺ Tout éteindre et recommencer</button>' : ''}
          <div class="msg">${G.msg}</div>
          <div class="log">${G.log.map((l) => `<p>${l}</p>`).join('')}</div></div></div></div>`;
    app.querySelector('[data-act="quit"]').addEventListener('click', () => { if (confirm('Quitter cette rosace ?')) home(); });
    app.querySelectorAll('#field [data-i]').forEach((el) => U.tap(el, () => { G.sel = Number(el.dataset.i); G.bad = null; Snd.key(); draw(); }));
    app.querySelectorAll('.tray .tool').forEach((b) => U.tap(b, () => { if (b.disabled) return; G.tool = b.dataset.t; Snd.key(); app.querySelectorAll('.tray .tool').forEach((x) => x.classList.toggle('on', x === b)); }));
    const pad = window.Moteur.pad(document.getElementById('pad'), { unit: '°', ok: '✔ Allumer', keyboard: true, sound: Snd, onSubmit: (v) => submit(v) });
    pad.enable(G.sel !== null);
    app.querySelector('[data-act="reset"]')?.addEventListener('click', () => {
      G.lit = new Map(); G.kit = { ...G.kit0 }; G.err++; G.sel = null; G.tool = null; G.stuck = false; G.log = [];
      G.msg = '<div class="explain">↺ Rosace éteinte (compte comme une fêlure). Cherche un autre ordre !</div>'; draw();
    });
    G.flash = null;
  }
  /** vérifie : { ok, half, msg, cons } */
  function judge(F, known, i, v, tool) {
    const c = F.cases[i], cons = usable(F, tool, i, known);
    if (v !== c.v) return { ok: false, msg: `${ang(caseName(F, i))} ne mesure pas ${v}°.${cons ? ' Le bon outil, mais refais le calcul.' : ''}` };
    if (!cons) {
      const good = TOOLS.filter((t) => usable(F, t.id, i, known));
      return { ok: false, half: true, msg: `${v}° est juste, mais l’outil « ${TOOLS.find((t) => t.id === tool).nom} » ne permet pas de le trouver ici${good.length ? '' : ' (et aucun outil pour l’instant : commence par une autre vitre !)'}.` };
    }
    return { ok: true, cons };
  }
  function submit(v) {
    const F = G.F, i = G.sel;
    if (i === null) return;
    if (!G.tool) { const tr = app.querySelector('.tray'); tr.classList.remove('need'); void tr.offsetWidth; tr.classList.add('need'); return; }
    const known = knownSet(), r = judge(F, known, i, v, G.tool);
    if (!r.ok) {
      G.err++; Snd.crack(); G.bad = i;
      const w = (G.wrong.get(i) || 0) + 1; G.wrong.set(i, w);
      G.msg = `<div class="explain bad">💔 ${r.msg}</div>`;
      if (w >= 3 && !G.kit) {
        const how = TOOLS.map((t) => usable(F, t.id, i, known)).find(Boolean);
        if (how) { G.lit.set(i, 'j0'); G.log.unshift('💡 ' + sentence(F, how, i)); G.msg += `<div class="explain">💡 ${sentence(F, how, i)}</div>`; G.sel = null; G.tool = null; G.bad = null; }
      }
      draw(); checkDone(); return;
    }
    if (G.kit) G.kit[G.tool]--;
    Snd.glass();
    G.lit.set(i, JEWELS[(i * 5 + 2) % 6]); G.flash = consCells(r.cons); G.sel = null; G.tool = null; G.bad = null;
    const s = sentence(F, r.cons, i);
    G.log.unshift('✨ ' + s);
    G.msg = `<div class="explain good">✨ ${s}</div>`;
    if (G.kit && G.lit.size + F.given.size < F.cases.length && !canFinish(F, knownSet(), G.kit)) {
      G.stuck = true;
      G.msg += `<div class="explain bad">⚠️ Avec les outils qui restent, impossible d’allumer toute la rosace… Un outil a été utilisé là où un autre marchait aussi. <b>↺ Recommence</b> dans un autre ordre.</div>`;
    }
    draw(); checkDone();
  }
  function checkDone() {
    const F = G.F;
    if (F.given.size + G.lit.size < F.cases.length) return;
    const stars = G.err === 0 ? 3 : G.err <= 2 ? 2 : 1;
    G.stars[G.r] = stars; G.r++;
    Snd.win(); U.confetti(stars * 20, ['#e0453a', '#2f6fd6', '#f2b632', '#3aa66b', '#9b4fd1', '#fff3c4']);
    app.querySelector('.rose').classList.add('glow');
    app.querySelector('.msg').insertAdjacentHTML('afterbegin', `<div class="explain good big">🌹 Rosace rallumée ! <span class="stars">${starStr(stars)}</span></div><button type="button" class="btn go" data-act="nx">${G.r >= ROUNDS ? 'Bilan' : 'Rosace suivante ▶'}</button>`);
    app.querySelector('[data-act="nx"]').addEventListener('click', round);
    const pad = document.getElementById('pad'); if (pad) pad.innerHTML = '';
  }
  function endLevel() {
    const Z = G.Z, idx = LEVELS.indexOf(Z), next = LEVELS[idx + 1];
    const avg = G.stars.reduce((a, b) => a + b, 0) / G.stars.length, stars = avg >= 2.6 ? 3 : avg >= 1.6 ? 2 : 1;
    const old = S.d.stars[Z.id] || 0; S.d.stars[Z.id] = Math.max(old, stars); S.save();
    app.innerHTML = `<div class="screen brief"><h2 class="bt">${Z.name}</h2>${ROSE_MINI(4 + idx, false).replace('class="mini"', 'class="mini big"')}
      <div class="bigstars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>
      <p class="goal">${stars === 3 ? 'Aucune fêlure : bravo, maître verrier !' : 'Pour 3 ★ : aucune fêlure. Avant de taper, demande-toi quel outil donne la mesure.'}</p>
      <div class="row"><button type="button" class="btn ghost" data-act="home">← Rosaces</button><button type="button" class="btn${next ? '' : ' go'}" data-act="again">↻ Rejouer</button>${next ? '<button type="button" class="btn go" data-act="next">Suivant ▶</button>' : ''}</div></div>`;
    app.querySelector('[data-act="home"]').addEventListener('click', home);
    app.querySelector('[data-act="again"]').addEventListener('click', () => { G = { Z, r: 0, stars: [] }; round(); });
    app.querySelector('[data-act="next"]')?.addEventListener('click', () => brief(next));
  }

  /* =========================================================
     DUEL : une rosace commune ; chacun son tour allume une vitre et gagne ses degrés
     ========================================================= */
  const MODES = [
    { id: '1', nom: 'Petite rose', desc: 'Opposés, alignés', o: { lines: 2, extra: 2, minFind: 4, maxRays: 7 } },
    { id: '2', nom: 'Rose moyenne', desc: 'Avec angle droit', o: { lines: 2, perp: true, extra: 2, minFind: 5, minSteps: 2, maxRays: 8 } },
    { id: '3', nom: 'Grande rose', desc: 'Tout le chapitre', o: { lines: 2, bis: true, extra: 3, comp: 1, minFind: 6, minSteps: 3, maxRays: 10 } },
  ];
  function duel() {
    window.Moteur.match({ jeu: 'vitrail-6e', titre: 'Le Vitrail', niveauScolaire: 'sixième', theme: 'vitrail', icone: '🌹', sound: Snd, modes: MODES, quitter: home,
      start: (ctx) => duelPlay(ctx) });
  }
  function duelPlay(ctx) {
    const M = MODES.find((m) => m.id === ctx.mode) || MODES[0];
    const F = figure(M.o);
    const D = { turn: rand(0, 1), lit: new Map(), owner: new Map(), sel: [null, null], tool: [null, null], pts: [0, 0], errors: [0, 0], msg: ['', ''], flash: null, bad: null };
    const nm = (k) => U.esc(ctx.P[k].nom);
    function render() {
      ctx.turn(D.turn);
      ctx.P.forEach((p) => {
        const k = p.k, mine = D.turn === k, el = p.el;
        el.innerHTML = `<div class="dz"><div class="dhead"><b class="c0">${nm(0)} ${D.pts[0]}°</b><span class="vs">·</span><b class="c1">${nm(1)} ${D.pts[1]}°</b></div>
          <div class="dbody"><div class="dfield">${roseSVG(F, { lit: D.lit, sel: mine ? D.sel[k] : null, flash: D.flash, bad: D.bad })}</div>
          <div class="dside"><p class="m-turnmsg">${mine ? (D.sel[k] === null ? '👆 À toi : touche une vitre ?' : `${ang(caseName(F, D.sel[k]))} = ?`) : `⏳ ${nm(1 - k)} joue…`}</p>
            ${mine && D.sel[k] !== null ? `${trayHTML(F, null, D.tool[k])}<div class="dpad"></div>` : ''}
            <div class="dmsg">${D.msg[k]}</div></div></div></div>`;
        if (mine) {
          el.querySelectorAll('.dfield [data-i]').forEach((x) => U.tap(x, () => { D.sel[k] = Number(x.dataset.i); D.bad = null; Snd.key(); render(); }));
          el.querySelectorAll('.tray .tool').forEach((b) => U.tap(b, () => { D.tool[k] = b.dataset.t; Snd.key(); el.querySelectorAll('.tray .tool').forEach((x) => x.classList.toggle('on', x === b)); }));
          const ph = el.querySelector('.dpad');
          if (ph) window.Moteur.pad(ph, { unit: '°', ok: '✔', sound: Snd, onSubmit: (v) => play(k, v) });
        }
      });
      D.flash = null;
    }
    function play(k, v) {
      if (D.turn !== k) return;
      const i = D.sel[k];
      if (!D.tool[k]) { const tr = ctx.P[k].el.querySelector('.tray'); tr.classList.remove('need'); void tr.offsetWidth; tr.classList.add('need'); return; }
      const r = judge(F, new Set([...F.given, ...D.lit.keys()]), i, v, D.tool[k]), name = ang(caseName(F, i));
      D.sel[k] = null; D.tool[k] = null;
      if (r.ok) {
        const deg = F.cases[i].v;
        D.lit.set(i, k === 0 ? 'c0' : 'c1'); D.pts[k] += deg; D.flash = consCells(r.cons); D.bad = null; Snd.glass();
        D.msg[k] = `✨ +${deg}° ! ${sentence(F, r.cons, i)}`; D.msg[1 - k] = `${nm(k)} allume ${name} : +${deg}°.`;
      } else {
        D.errors[k]++; Snd.crack(); D.bad = i;
        D.msg[k] = `💔 ${r.msg} À l’autre !`; D.msg[1 - k] = `${nm(k)} a fêlé ${name}${r.half ? ' (mauvais outil)' : ''} : à toi !`;
      }
      if (F.given.size + D.lit.size >= F.cases.length) {
        const w = D.pts[0] > D.pts[1] ? 0 : D.pts[1] > D.pts[0] ? 1 : null;
        ctx.end({ winner: w, score: [0, 1].map((x) => `${D.pts[x]}°`), stats: [0, 1].map((x) => ({ degres: D.pts[x], vitres: [...D.lit.values()].filter((c) => c === `c${x}`).length, erreurs: D.errors[x] })),
          text: [0, 1].map(() => `<p class="m-dim"><b>${nm(0)}</b> : ${D.pts[0]}° · <b>${nm(1)}</b> : ${D.pts[1]}° · fêlures : ${D.errors[0]} et ${D.errors[1]}</p><div class="endrose">${roseSVG(F, { lit: D.lit })}</div>`) });
        return;
      }
      D.turn = 1 - k; render();
    }
    render();
  }

  window.__vitrail = { buildFigure, closure, judge, sentence, LEVELS, MODES, figure, usable, toolKit, canFinish, get G() { return G; } };
  home();
})();
