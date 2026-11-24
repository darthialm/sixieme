/* =========================================================
   LE VITRAIL · sixième — jeu du chapitre « Les angles » (trouver des angles de proche en proche)
   Un vitrail de cathédrale : des demi-droites de même origine O découpent la rosace en vitres (les angles).
   Quelques vitres sont allumées (leur mesure est donnée), les autres sont éteintes (« ? »).
   Pour allumer une vitre : la toucher, choisir la PROPRIÉTÉ qui donne sa mesure, taper la mesure.
   Propriétés : opposés par le sommet · angle plat (180°) · angle droit (90°) · bissectrice · angles adjacents.
   La propriété doit permettre de trouver CETTE vitre maintenant, avec les vitres déjà allumées.
   Indice en 3 marches (💡) : les vitres à regarder brillent et la propriété est montrée ; puis le calcul avec « ? » ;
   puis la solution. Les explications parlent avec la figure et des nombres, sans notation ; la rédaction avec les
   notations reste disponible dans « Ma rédaction ». Après 2 erreurs sur une vitre, l'indice s'ouvre tout seul.
   À partir de l'étape 4, chaque propriété ne sert qu'un nombre de fois limité : il faut prévoir l'ordre.
   La couronne de lobes autour de la rosace s'allume au fur et à mesure.
   Duel (tour par tour, moteur commun) : même rosace ; chacun son tour allume une vitre (mesure juste ET bonne
   propriété) et gagne ses degrés. Le plus de degrés gagne.
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

  /* ---------- Les propriétés ---------- */
  const ICON = {
    opp: '<path d="M6 11 L34 29 M6 29 L34 11" class="il"/><path d="M20 20 L9.3 13.1 A12.7 12.7 0 0 0 9.3 26.9 Z" class="ia"/><path d="M20 20 L30.7 26.9 A12.7 12.7 0 0 0 30.7 13.1 Z" class="ia"/>',
    plat: '<path d="M3 28 L37 28 M20 28 L30 9" class="il"/><path d="M8 28 A12 12 0 0 1 32 28" class="ic"/><circle cx="20" cy="28" r="2.2" class="id"/>',
    droit: '<path d="M8 33 L36 33 M8 33 L8 5 M8 33 L28 12" class="il"/><path d="M8 25 L16 25 L16 33" class="ic"/>',
    bis: '<path d="M5 33 L37 33 M5 33 L25 6" class="il"/><path d="M5 33 L37 17" class="il ib"/><path d="M25 27 L26 31 M27 26 L28 30 M20 18 L23 20 M21 16 L24 18" class="ic"/>',
    adj: '<path d="M5 33 L37 33 M5 33 L35 19 M5 33 L20 6" class="il"/><path d="M19 33 A14 14 0 0 0 17.7 27" class="ic"/><path d="M17.7 27 A14 14 0 0 0 12.5 21.2" class="ic ic2"/><path d="M31 33 A26 26 0 0 0 18 10.5" class="ic ic3"/>',
  };
  const TOOLS = [
    { id: 'opp', nom: 'Opposés par le sommet', sub: 'même mesure' },
    { id: 'plat', nom: 'Angle plat', sub: '180°' },
    { id: 'droit', nom: 'Angle droit', sub: '90°' },
    { id: 'bis', nom: 'Bissectrice', sub: '2 moitiés égales' },
    { id: 'adj', nom: 'Angles adjacents', sub: 'ils s’ajoutent' },
  ];
  const icon = (id) => `<svg viewBox="0 0 40 40" class="tic" aria-hidden="true">${ICON[id]}</svg>`;
  const ang = (s) => `<span class="m-ang">${s}</span>`;
  const caseName = (F, i) => F.L[F.cases[i].i] + 'O' + F.L[F.cases[i].j];
  const rayName = (F, r) => `[O${F.L[r]})`;
  const angleFromTo = (F, from, to) => F.L[from] + 'O' + F.L[to];
  /** la rédaction, avec les notations (pour le cahier) */
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
  /** l'explication SANS notation : on montre les vitres en surbrillance sur la figure et on parle avec des nombres.
      hide = true : le calcul avec « ? » (indice), sinon avec la réponse. */
  function plain(F, c, i, hide) {
    const v = F.cases[i].v, res = hide ? '<b class="qm">?</b>' : `<b>${v}°</b>`;
    if (c.t === 'opp') { const o = c.a === i ? c.b : c.a; return `Les deux vitres qui brillent sont <b>opposées par le sommet</b> (elles se font face, en pointe). Elles ont <b>la même mesure</b> : ${F.cases[o].v}°. Donc ${res}`; }
    if (c.t === 'bis') { const o = c.a === i ? c.b : c.a; return `La demi-droite en pointillés est une <b>bissectrice</b> : elle coupe l’angle en <b>deux vitres égales</b>. L’autre moitié mesure ${F.cases[o].v}°. Donc ${res}`; }
    const others = c.set.filter((x) => x !== i), tot = c.t === 'plat' ? 180 : c.t === 'droit' ? 90 : c.v;
    const why = c.t === 'plat' ? `Les vitres qui brillent sont collées le long d’une <b>droite</b> : ensemble, elles font un <b>angle plat, 180°</b>.`
      : c.t === 'droit' ? `Le petit carré veut dire <b>angle droit</b> : les vitres qui brillent font <b>90°</b> ensemble.`
        : `Le grand arc doré mesure <b>${c.v}°</b> : les vitres qui brillent font ${c.v}° ensemble.`;
    return `${why}<span class="calc">${tot} − ${others.map((x) => F.cases[x].v).join(' − ')} = ${hide ? '<b class="qm">?</b>' : `<b>${v}</b>`}</span>`;
  }

  /* ---------- Dessin du vitrail ---------- */
  const W = 400, O = { x: 200, y: 200 }, R = 150, RL = 172;
  const P = (a, L) => ({ x: O.x + L * Math.cos((a * Math.PI) / 180), y: O.y - L * Math.sin((a * Math.PI) / 180) });
  const f = (n) => n.toFixed(1);
  function wedge(a1, v, r, cls, attrs = '') {
    const p = P(a1, r), q = P(a1 + v, r);
    return `<path d="M${O.x} ${O.y} L${f(p.x)} ${f(p.y)} A${r} ${r} 0 ${v > 180 ? 1 : 0} 0 ${f(q.x)} ${f(q.y)} Z" class="${cls}" ${attrs}/>`;
  }
  /** un morceau de vitre : entre les rayons r1 et r2 */
  function piece(a1, v, r1, r2, cls) {
    if (!r1) return wedge(a1, v, r2, cls);
    const big = v > 180 ? 1 : 0, a = P(a1, r1), b = P(a1, r2), c = P(a1 + v, r2), d = P(a1 + v, r1);
    return `<path d="M${f(a.x)} ${f(a.y)} L${f(b.x)} ${f(b.y)} A${r2} ${r2} 0 ${big} 0 ${f(c.x)} ${f(c.y)} L${f(d.x)} ${f(d.y)} A${r1} ${r1} 0 ${big} 1 ${f(a.x)} ${f(a.y)} Z" class="${cls}"/>`;
  }
  const JEWELS = ['j1', 'j2', 'j3', 'j4', 'j5', 'j6'];
  const DEFS = `<defs>
    <filter id="glass" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" seed="7" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.9 0 0 0 -0.38" result="w"/><feComposite in="w" in2="SourceGraphic" operator="in" result="wi"/>
      <feBlend in="SourceGraphic" in2="wi" mode="screen"/></filter>
    <radialGradient id="shine" cx="42%" cy="36%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <radialGradient id="stoneG" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#5a4838"/><stop offset="1" stop-color="#2c2118"/></radialGradient></defs>`;
  /** st = { lit: Map(i → couleur), sel, flash: [cases], hint: [cases], bad, finger, point } ; progrès = vitres allumées */
  function roseSVG(F, st) {
    const D = F.dirs, n = F.cases.length, lit = st.lit || new Map();
    const done = F.given.size + lit.size, frac = done / n;
    let h = `<svg viewBox="0 0 ${W} ${W}" class="rose" role="img" aria-label="Vitrail : demi-droites de même origine O">${DEFS}
      <rect x="2" y="2" width="${W - 4}" height="${W - 4}" rx="10" class="frame"/>`;
    // écoinçons sculptés
    [[34, 34], [W - 34, 34], [34, W - 34], [W - 34, W - 34]].forEach(([x, y]) => { h += `<circle cx="${x}" cy="${y}" r="20" class="spand"/><circle cx="${x}" cy="${y}" r="9" class="spand2${frac >= 1 ? ' on' : ''}"/>`; });
    h += `<circle cx="${O.x}" cy="${O.y}" r="${RL + 22}" fill="url(#stoneG)" class="ring"/>`;
    // couronne de lobes : ils s'allument avec le progrès
    const NL = 16;
    for (let k = 0; k < NL; k++) { const a = (k * 360) / NL + 11.25, C = P(a, RL); h += `<circle cx="${f(C.x)}" cy="${f(C.y)}" r="13" class="lobe ${k / NL < frac ? JEWELS[k % 6] : 'off'}"/>`; }
    // les vitres, en trois morceaux chacune
    let lum = '', dark = '';
    F.cases.forEach((c, i) => {
      const g = F.given.has(i), L = lit.get(i), a1 = D[c.i];
      const base = g ? 'g' : L ? `lit ${L}` : `u${st.sel === i ? ' sel' : ''}${st.bad === i ? ' bad' : ''}`;
      const g0 = `<g class="pane ${base}${st.fresh === i ? ' fresh' : ''}${st.flash && st.flash.includes(i) ? ' flash' : ''}">${piece(a1, c.v, 0, R * 0.36, 'pc p0')}${piece(a1, c.v, R * 0.36, R * 0.8, 'pc p1')}${piece(a1, c.v, R * 0.8, R, 'pc p2')}</g>`;
      if (g || L) lum += g0; else dark += g0;
    });
    h += `${dark}<g filter="url(#glass)">${lum}</g><circle cx="${O.x}" cy="${O.y}" r="${R}" fill="url(#shine)" pointer-events="none"/>`;
    // les plombs : cercles et demi-droites
    h += `<circle cx="${O.x}" cy="${O.y}" r="${R * 0.36}" class="leadc"/><circle cx="${O.x}" cy="${O.y}" r="${R * 0.8}" class="leadc"/><circle cx="${O.x}" cy="${O.y}" r="${R}" class="leadc big"/>`;
    D.forEach((d) => { const E = P(d, R); h += `<line x1="${O.x}" y1="${O.y}" x2="${f(E.x)}" y2="${f(E.y)}" class="lead"/>`; });
    F.bisec.forEach(({ b }) => { const E = P(b, R - 2); h += `<line x1="${O.x}" y1="${O.y}" x2="${f(E.x)}" y2="${f(E.y)}" class="bisl"/>`; });
    // surbrillance (indice / correction)
    (st.hint || []).forEach((i) => { const c = F.cases[i]; h += wedge(D[c.i], c.v, R - 3, 'hl'); });
    // codages
    F.rights.forEach(([p]) => { const a = D[p], s = 19, A = P(a, s), B = P(a + 90, s), Cc = { x: A.x + B.x - O.x, y: A.y + B.y - O.y }; h += `<path d="M${f(A.x)} ${f(A.y)} L${f(Cc.x)} ${f(Cc.y)} L${f(B.x)} ${f(B.y)}" class="code"/>`; });
    F.comp.forEach((c) => {
      const a1 = D[c.from], v = ccw(a1, D[c.to]), r = R * 0.9, p = P(a1, r), q = P(a1 + v, r);
      let m = a1 + v / 2; if (D.some((d) => Math.min(ccw(d, m), ccw(m, d)) < 8)) m += Math.min(10, v / 4);
      const T = P(m, R * 0.9);
      h += `<path d="M${f(p.x)} ${f(p.y)} A${r} ${r} 0 0 0 ${f(q.x)} ${f(q.y)}" class="carc"/><g class="medal"><circle cx="${f(T.x)}" cy="${f(T.y)}" r="17"/><text x="${f(T.x)}" y="${f(T.y + 1)}" text-anchor="middle" dominant-baseline="central">${c.v}°</text></g>`;
    });
    // médaillon central
    h += `<circle cx="${O.x}" cy="${O.y}" r="15" class="boss"/>${Array.from({ length: 6 }, (_, k) => { const C = P(k * 60, 8); return `<circle cx="${f(C.x)}" cy="${f(C.y)}" r="3.4" class="petal"/>`; }).join('')}<circle cx="${O.x}" cy="${O.y}" r="3" class="bossc"/>`;
    // mesures
    F.cases.forEach((c, i) => {
      const g = F.given.has(i), L = lit.has(i), M = P(D[c.i] + c.v / 2, c.v < 30 ? R * 0.66 : R * 0.58);
      h += `<text x="${f(M.x)}" y="${f(M.y)}" class="val${g ? ' gv' : L ? '' : ' q'}" text-anchor="middle" dominant-baseline="central" pointer-events="none">${g || L ? c.v + '°' : '?'}</text>`;
    });
    D.forEach((d, i) => { const T = P(d, R + 9); h += `<text x="${f(T.x)}" y="${f(T.y)}" class="lbl" text-anchor="middle" dominant-baseline="central">${F.L[i]}</text>`; });
    // zones à toucher (au-dessus de tout)
    F.cases.forEach((c, i) => { if (!F.given.has(i) && !lit.has(i)) h += wedge(D[c.i], c.v, R, 'hit', `data-i="${i}"`); });
    const fg = st.finger ?? st.point;
    if (fg !== undefined && fg !== null) { const c = F.cases[fg], M = P(D[c.i] + c.v / 2, R * 0.6); h += `<text x="${f(M.x + 8)}" y="${f(M.y + 30)}" class="finger" text-anchor="middle" pointer-events="none">👆</text>`; }
    return h + '</svg>';
  }
  /** les cartes « propriété » ; kit = null (illimité) ou { t: nombre } */
  function trayHTML(F, kit, sel, opts = {}) {
    const present = new Set(F.cons.map((c) => c.t));
    return `<p class="trayt">Quelle <b>propriété</b> donne sa mesure ?</p><div class="tray">${TOOLS.filter((t) => present.has(t.id)).map((t) => {
      const n = kit ? kit[t.id] || 0 : null;
      return `<button type="button" class="tool${sel === t.id ? ' on' : ''}${opts.finger === t.id || opts.hint === t.id ? ' fing' : ''}" data-t="${t.id}" ${n === 0 || opts.off ? 'disabled' : ''}>${icon(t.id)}<span class="tn">${t.nom}</span><span class="ts">${t.sub}</span>${n !== null ? `<span class="cnt">×${n}</span>` : ''}</button>`;
    }).join('')}</div>`;
  }

  /* =========================================================
     Étapes (solo)
     ========================================================= */
  const LEVELS = [
    { id: 'n1', name: 'La croisée', tag: 'Opposés · angle plat', o: { lines: 2, minFind: 3 } },
    { id: 'n2', name: 'Le soleil', tag: 'Angle plat (180°)', o: { lines: 1, extra: 2, minFind: 2 } },
    { id: 'n3', name: 'L’équerre', tag: 'Angle droit (90°)', o: { lines: 1, perp: true, extra: 1, minFind: 3 } },
    { id: 'n4', name: 'Le partage', tag: 'Bissectrice · propriétés comptées', o: { lines: 1, extra: 2, bis: true, minFind: 3 }, kit: true },
    { id: 'n5', name: 'La gerbe', tag: 'Adjacents · propriétés comptées', o: { lines: 1, extra: 2, comp: 1, minFind: 3 }, kit: true },
    { id: 'n6', name: 'La grande rose', tag: 'Longues chaînes · comptées', o: { lines: 2, extra: 2, bis: true, minFind: 5, minSteps: 3, maxRays: 8 }, kit: true },
    { id: 'n7', name: 'La cathédrale', tag: 'Tout le chapitre · comptées', boss: true, o: { lines: 2, perp: true, bis: true, comp: 1, minFind: 5, minSteps: 3, maxRays: 8 }, kit: true },
  ];
  const ROUNDS = 3;
  const unlocked = (i) => ALL_OPEN || i === 0 || (S.d.stars[LEVELS[i - 1].id] || 0) > 0;
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;
  const figure = (o) => { for (let t = 0; t < 30; t++) { const F = buildFigure(o); if (F) return F; } return buildFigure({ lines: 2, minFind: 2 }); };

  let G = null, demoT = null;
  const stopDemo = () => { if (demoT) clearTimeout(demoT); demoT = null; };
  const ROSE_MINI = (n, lock) => `<svg viewBox="0 0 60 60" class="mini" aria-hidden="true"><circle cx="30" cy="30" r="28" class="ms"/>${Array.from({ length: n }, (_, k) => { const a = (k * 360) / n, b = ((k + 1) * 360) / n, p = [30 + 24 * Math.cos(a * Math.PI / 180), 30 - 24 * Math.sin(a * Math.PI / 180)], q = [30 + 24 * Math.cos(b * Math.PI / 180), 30 - 24 * Math.sin(b * Math.PI / 180)]; return `<path d="M30 30 L${f(p[0])} ${f(p[1])} A24 24 0 0 0 ${f(q[0])} ${f(q[1])} Z" class="${lock ? 'mu' : JEWELS[k % 6]}"/>`; }).join('')}<circle cx="30" cy="30" r="13" class="mring"/><circle cx="30" cy="30" r="4" class="mboss"/></svg>`;

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
          <div class="step" data-s="1"><span class="si">${icon('opp')}</span><span>Choisis la <b>propriété</b> qui donne sa mesure</span></div>
          <div class="step" data-s="2"><span class="si">🔢</span><span>Tape la <b>mesure</b> ✔</span></div>
          <div class="step" data-s="3"><span class="si">✨</span><span>La vitre s’allume… et aide à trouver les autres</span></div>
          <div class="step" data-s="4"><span class="si">💡</span><span>Bloqué ? Demande un <b>indice</b></span></div>
        </div></div>
      ${Z && Z.kit ? `<p class="goal">⚠️ Ici, chaque propriété ne sert qu’un nombre de fois limité (×2, ×1…) : réfléchis à l’ordre !</p>` : '<p class="goal">Mesure juste <b>et</b> bonne propriété, sinon la vitre se fêle.</p>'}
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
      { st: { lit: new Map([[target, 'j3']]), flash: consCells(cons) }, s: 3, tool: null, t: 2200 },
      { st: { lit: new Map([[target, 'j3']]), hint: consCells(cons) }, s: 4, tool: null, t: 1800 },
    ];
    let k = 0;
    const step = () => {
      if (!document.body.contains(fig)) return;
      const fr = frames[k % frames.length];
      fig.innerHTML = roseSVG(F, fr.st);
      tray.innerHTML = trayHTML(F, null, fr.tool, { finger: fr.finger }).replace(/<p class="trayt">.*?<\/p>/, '') + (fr.typed ? `<div class="typed">${fr.typed} ✔</div>` : '');
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
    G.lit = new Map(); G.sel = null; G.tool = null; G.err = 0; G.hints = 0; G.hl = 0; G.wrong = new Map(); G.log = []; G.msg = ''; G.flash = null; G.hint = null; G.hintTool = null; G.point = null; G.bad = null;
    draw();
  }
  const knownSet = () => new Set([...G.F.given, ...G.lit.keys()]);
  function draw() {
    const F = G.F, Z = G.Z, left = F.cases.length - F.given.size - G.lit.size;
    app.innerHTML = `<div class="screen play">
      <div class="hud"><button type="button" class="quit" data-act="quit" aria-label="Arrêter">✕</button><span class="zn">${Z.name}</span>
        <span class="dots">${Array.from({ length: ROUNDS }, (_, i) => `<i class="${G.stars[i] === 3 ? 'ok' : G.stars[i] ? 'mid' : i === G.r ? 'cur' : ''}"></i>`).join('')}</span>
        <span class="right">? ${left} · <span class="crack">💔 ${G.err}</span> · 💡 ${G.hints}</span></div>
      <div class="game"><div class="field" id="field">${roseSVG(F, { lit: G.lit, sel: G.sel, flash: G.flash, bad: G.bad, hint: G.hint, point: G.point, fresh: G.fresh })}</div>
        <div class="side">
          ${G.sel === null ? '<p class="ask">👆 Touche une vitre <b>?</b></p>' : ''}
          ${trayHTML(F, G.kit, G.tool, { off: G.sel === null, hint: G.hintTool })}
          <div class="padrow"><div id="pad" class="${G.sel === null ? 'off' : ''}"></div>
            <button type="button" class="hintb" data-act="hint" ${G.sel === null && left ? '' : ''}>💡<span>Indice</span></button></div>
          ${G.kit ? '<button type="button" class="reset" data-act="reset">↺ Tout éteindre et recommencer</button>' : ''}
          <div class="msg">${G.msg}</div>
          ${G.log.length ? `<details class="log"><summary>📜 Ma rédaction (${G.log.length})</summary>${G.log.map((l) => `<p>${l}</p>`).join('')}</details>` : ''}</div></div></div>`;
    app.querySelector('[data-act="quit"]').addEventListener('click', () => { if (confirm('Quitter cette rosace ?')) home(); });
    app.querySelectorAll('#field [data-i]').forEach((el) => U.tap(el, () => {
      const i = Number(el.dataset.i);
      if (G.sel !== i) { G.hl = 0; G.hint = null; G.hintTool = null; G.msg = ''; }
      G.sel = i; G.bad = null; G.point = null; Snd.key(); draw();
    }));
    app.querySelectorAll('.tray .tool').forEach((b) => U.tap(b, () => { if (b.disabled) return; G.tool = b.dataset.t; Snd.key(); app.querySelectorAll('.tray .tool').forEach((x) => x.classList.toggle('on', x === b)); }));
    const pad = window.Moteur.pad(document.getElementById('pad'), { unit: '°', ok: '✔ Allumer', keyboard: true, sound: Snd, onSubmit: (v) => submit(v) });
    pad.enable(G.sel !== null);
    U.tap(app.querySelector('[data-act="hint"]'), hint);
    app.querySelector('[data-act="reset"]')?.addEventListener('click', () => {
      G.lit = new Map(); G.kit = { ...G.kit0 }; G.err++; G.sel = null; G.tool = null; G.log = []; G.hint = null; G.hintTool = null; G.point = null;
      G.msg = '<div class="explain">↺ Rosace éteinte (compte comme une fêlure). Cherche un autre ordre !</div>'; draw();
    });
    G.flash = null; G.fresh = null;
  }
  /** une contrainte qui permet de trouver la vitre i maintenant (et dont la propriété est encore disponible) */
  function wayFor(F, i, known, kit) {
    for (const t of TOOLS) { if (kit && !(kit[t.id] > 0)) continue; const c = usable(F, t.id, i, known); if (c) return c; }
    return null;
  }
  /** une vitre qu'on peut trouver tout de suite (en gardant la rosace faisable) */
  function nextFindable(F, known, kit) {
    for (const c of F.cons) {
      if (kit && !(kit[c.t] > 0)) continue;
      for (const i of deducible(c, known)) { if (!kit) return i; const k2 = new Set(known); k2.add(i); if (canFinish(F, k2, { ...kit, [c.t]: kit[c.t] - 1 })) return i; }
    }
    return null;
  }
  /* L'indice, en 3 marches : 1) quelles vitres regarder et quelle propriété ; 2) le calcul avec « ? » ; 3) la réponse */
  function hint() {
    const F = G.F, known = knownSet();
    if (F.given.size + G.lit.size >= F.cases.length) return;
    if (G.sel === null) {
      const j = nextFindable(F, known, G.kit);
      G.point = j; G.msg = '<div class="explain hint">💡 Commence par la vitre que montre la main 👆 : on peut la trouver tout de suite.</div>';
      Snd.key(); draw(); return;
    }
    const i = G.sel, c = wayFor(F, i, known, G.kit);
    if (!c) {
      const j = nextFindable(F, known, G.kit);
      G.point = j; G.hint = null;
      G.msg = `<div class="explain hint">💡 Cette vitre ne peut <b>pas encore</b> être trouvée : il manque des mesures autour. Commence par celle que montre la main 👆.</div>`;
      Snd.key(); draw(); return;
    }
    G.hl++; G.hints++; Snd.key();
    G.hint = consCells(c);
    if (G.hl === 1) {
      G.hintTool = c.t;
      const tn = TOOLS.find((t) => t.id === c.t);
      G.msg = `<div class="explain hint">💡 Regarde les vitres qui brillent. La propriété à utiliser : <b>${tn.nom}</b> ${icon(c.t)}<br><small>Encore bloqué ? Touche 💡 à nouveau.</small></div>`;
    } else if (G.hl === 2) {
      G.hintTool = c.t;
      G.msg = `<div class="explain hint">💡 ${plain(F, c, i, true)}</div>`;
    } else {
      // la solution : la vitre s'allume, on explique
      if (G.kit) G.kit[c.t]--;
      G.lit.set(i, 'j0'); G.fresh = i; G.flash = consCells(c); G.log.unshift('💡 ' + sentence(F, c, i));
      G.msg = `<div class="explain">💡 La solution : ${plain(F, c, i, false)}</div>`;
      G.sel = null; G.tool = null; G.hl = 0; G.hint = null; G.hintTool = null;
      draw(); checkDone(); return;
    }
    draw();
  }
  /** vérifie : { ok, kind, cons } */
  function judge(F, known, i, v, tool) {
    const c = F.cases[i], cons = usable(F, tool, i, known);
    if (v !== c.v) return { ok: false, kind: cons ? 'calc' : 'both', cons };
    if (!cons) return { ok: false, kind: 'prop' };
    return { ok: true, cons };
  }
  function failMsg(r, v) {
    if (r.kind === 'calc') return `💔 Bonne propriété ! Mais ce n’est pas ${v}°. <b>Refais le calcul</b> avec les vitres qui brillent.`;
    if (r.kind === 'prop') return `💔 ${v}° est la bonne mesure, mais ce n’est pas <b>cette propriété</b> qui la donne ici. Regarde les vitres voisines.`;
    return '💔 Pas encore. Touche <b>💡 Indice</b> si tu es bloqué.';
  }
  function submit(v) {
    const F = G.F, i = G.sel;
    if (i === null) return;
    if (!G.tool) { const tr = app.querySelector('.tray'); tr.classList.remove('need'); void tr.offsetWidth; tr.classList.add('need'); return; }
    const known = knownSet(), r = judge(F, known, i, v, G.tool);
    if (!r.ok) {
      G.err++; Snd.crack(); G.bad = i;
      const w = (G.wrong.get(i) || 0) + 1; G.wrong.set(i, w);
      G.msg = `<div class="explain bad">${failMsg(r, v)}</div>`;
      if (r.kind === 'calc') G.hint = consCells(r.cons);
      // après 2 erreurs sur la même vitre, l'indice s'ouvre tout seul
      if (w >= 2 && wayFor(F, i, known, G.kit)) { draw(); hint(); return; }
      draw(); return;
    }
    if (G.kit) G.kit[G.tool]--;
    Snd.glass();
    G.lit.set(i, JEWELS[(i * 5 + 2) % 6]); G.fresh = i; G.flash = consCells(r.cons); G.sel = null; G.tool = null; G.bad = null; G.hint = null; G.hintTool = null; G.hl = 0; G.point = null;
    G.log.unshift('✨ ' + sentence(F, r.cons, i));
    G.msg = `<div class="explain good">✨ ${plain(F, r.cons, i, false)}</div>`;
    if (G.kit && G.lit.size + F.given.size < F.cases.length && !canFinish(F, knownSet(), G.kit)) {
      G.msg += `<div class="explain bad">⚠️ Avec les propriétés qui restent, impossible d’allumer toute la rosace… Une propriété a servi là où une autre marchait aussi. <b>↺ Recommence</b> dans un autre ordre.</div>`;
    }
    draw(); checkDone();
  }
  function checkDone() {
    const F = G.F;
    if (F.given.size + G.lit.size < F.cases.length) return;
    const pen = G.err + G.hints / 2, stars = pen === 0 ? 3 : pen <= 2 ? 2 : 1;
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
      <p class="goal">${stars === 3 ? 'Aucune fêlure, aucun indice : bravo, maître verrier !' : 'Pour 3 ★ : aucune fêlure et pas d’indice. Avant de taper, regarde les vitres voisines : laquelle te donne la mesure ?'}</p>
      <div class="row"><button type="button" class="btn ghost" data-act="home">← Rosaces</button><button type="button" class="btn${next ? '' : ' go'}" data-act="again">↻ Rejouer</button>${next ? '<button type="button" class="btn go" data-act="next">Suivant ▶</button>' : ''}</div></div>`;
    app.querySelector('[data-act="home"]').addEventListener('click', home);
    app.querySelector('[data-act="again"]').addEventListener('click', () => { G = { Z, r: 0, stars: [] }; round(); });
    app.querySelector('[data-act="next"]')?.addEventListener('click', () => brief(next));
  }

  /* =========================================================
     DUEL : une rosace commune ; chacun son tour allume une vitre et gagne ses degrés
     ========================================================= */
  const MODES = [
    { id: '1', nom: 'Petite rose', desc: 'Opposés, angle plat', o: { lines: 2, extra: 2, minFind: 4, maxRays: 7 } },
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
    const D = { turn: rand(0, 1), lit: new Map(), sel: [null, null], tool: [null, null], pts: [0, 0], errors: [0, 0], msg: ['', ''], flash: null, bad: null, hint: null };
    const nm = (k) => U.esc(ctx.P[k].nom);
    function render() {
      ctx.turn(D.turn);
      ctx.P.forEach((p) => {
        const k = p.k, mine = D.turn === k, el = p.el;
        el.innerHTML = `<div class="dz"><div class="dhead"><b class="c0">${nm(0)} ${D.pts[0]}°</b><span class="vs">·</span><b class="c1">${nm(1)} ${D.pts[1]}°</b></div>
          <div class="dbody"><div class="dfield">${roseSVG(F, { lit: D.lit, sel: mine ? D.sel[k] : null, flash: D.flash, bad: D.bad, hint: D.hint, fresh: D.fresh })}</div>
          <div class="dside"><p class="m-turnmsg">${mine ? (D.sel[k] === null ? '👆 À toi : touche une vitre ?' : 'Propriété + mesure') : `⏳ ${nm(1 - k)} joue…`}</p>
            ${mine && D.sel[k] !== null ? `${trayHTML(F, null, D.tool[k]).replace(/<p class="trayt">.*?<\/p>/, '')}<div class="dpad"></div>` : ''}
            <div class="dmsg">${D.msg[k]}</div></div></div></div>`;
        if (mine) {
          el.querySelectorAll('.dfield [data-i]').forEach((x) => U.tap(x, () => { D.sel[k] = Number(x.dataset.i); D.bad = null; D.hint = null; Snd.key(); render(); }));
          el.querySelectorAll('.tray .tool').forEach((b) => U.tap(b, () => { D.tool[k] = b.dataset.t; Snd.key(); el.querySelectorAll('.tray .tool').forEach((x) => x.classList.toggle('on', x === b)); }));
          const ph = el.querySelector('.dpad');
          if (ph) window.Moteur.pad(ph, { unit: '°', ok: '✔', sound: Snd, onSubmit: (v) => play(k, v) });
        }
      });
      D.flash = null; D.fresh = null;
    }
    function play(k, v) {
      if (D.turn !== k) return;
      const i = D.sel[k];
      if (!D.tool[k]) { const tr = ctx.P[k].el.querySelector('.tray'); tr.classList.remove('need'); void tr.offsetWidth; tr.classList.add('need'); return; }
      const known = new Set([...F.given, ...D.lit.keys()]), r = judge(F, known, i, v, D.tool[k]);
      D.sel[k] = null; D.tool[k] = null;
      if (r.ok) {
        const deg = F.cases[i].v;
        D.lit.set(i, k === 0 ? 'c0' : 'c1'); D.fresh = i; D.pts[k] += deg; D.flash = consCells(r.cons); D.bad = null; D.hint = null; Snd.glass();
        D.msg[k] = `✨ +${deg}° ! ${plain(F, r.cons, i, false)}`; D.msg[1 - k] = `${nm(k)} allume une vitre : +${deg}°.`;
      } else {
        D.errors[k]++; Snd.crack(); D.bad = i;
        const c = wayFor(F, i, known, null);
        D.hint = c ? consCells(c) : null;
        D.msg[k] = `${failMsg(r, v).replace(' Touche <b>💡 Indice</b> si tu es bloqué.', '')} À l’autre !`; D.msg[1 - k] = `${nm(k)} a fêlé une vitre : à toi !`;
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

  window.__vitrail = { buildFigure, closure, judge, sentence, plain, LEVELS, MODES, figure, usable, toolKit, canFinish, get G() { return G; } };
  home();
})();
