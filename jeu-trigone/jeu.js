/* =========================================================
   TRIGONE — jeu du chapitre « Triangles », en deux versions : sixième et cinquième.
   Le même fichier sert aux deux sites ; la page choisit la version : <body data-niveau="6"> ou "5".
   Deux jeux dans le même donjon :
   1) LE TRIANGLE MYSTÈRE (un « Qui est-ce ? ») : 16 cartes de triangles, avec codages, mesures d'angles
      ou longueurs. Un triangle est caché. On pose des questions (« Est-il isocèle ? », « A-t-il un angle
      obtus ? »…) et c'est le joueur qui retourne les cartes éliminées : il doit lire les codages et calculer
      le troisième angle (180°) pour savoir si chaque carte répond oui ou non. Les étoiles récompensent
      les bonnes questions (peu de questions) et les éliminations justes. Fin de manche : relecture des erreurs.
   2) LES CONSTRUCTIONS : une réserve de bâtons (5e : inégalité triangulaire) ou de tuiles d'angles (180°).
      Il faut tout répartir en triangles. Un mauvais assemblage s'effondre, avec l'explication.
   Duels (tour par tour, moteur commun) : Triangle mystère à deux (chacun cherche le triangle de l'autre),
   ou course aux triangles (on pioche à tour de rôle dans une réserve commune et on construit).
   Adresse avec ?tout : tout est ouvert (pour le professeur).
   ========================================================= */
(function () {
  'use strict';
  const { U } = window.Moteur;
  const { rand, pick, shuffle } = U;
  const NIV = document.body.dataset.niveau === '5' ? 5 : 6;
  const NOM_NIV = NIV === 5 ? 'cinquième' : 'sixième';
  const app = document.getElementById('app');
  const S = U.store(`u${NIV}e-trigone2`);
  S.d.stars = S.d.stars || {};
  const ALL_OPEN = /[?&]tout\b/.test(location.search);
  const Snd = window.Moteur.makeSound(() => !!S.d.mute);
  Snd.flip = function () { this.tone(500, 0.05, 'triangle', 0.04, 300); };
  Snd.build = function () { [330, 440, 550].forEach((f, i) => this.tone(f, 0.12, 'square', 0.04, 0, i * 0.07)); };
  Snd.crash = function () { this.noise(0.45, 0.35, 700); this.tone(120, 0.4, 'sawtooth', 0.05, 50); };
  const muteBtn = document.getElementById('mute');
  const syncMute = () => { muteBtn.textContent = S.d.mute ? '🔇' : '🔊'; };
  muteBtn.addEventListener('click', () => { S.d.mute = !S.d.mute; S.save(); syncMute(); Snd.init(); });
  syncMute();

  /* =========================================================
     Géométrie
     ========================================================= */
  const D2R = Math.PI / 180, W = 300, H = 220;
  const f = (n) => n.toFixed(1);
  const sub = (P, Q) => ({ x: P.x - Q.x, y: P.y - Q.y });
  const len = (v) => Math.hypot(v.x, v.y);
  const unit = (v) => { const l = len(v) || 1; return { x: v.x / l, y: v.y / l }; };
  const add = (P, v, k = 1) => ({ x: P.x + v.x * k, y: P.y + v.y * k });
  const mid = (P, Q) => ({ x: (P.x + Q.x) / 2, y: (P.y + Q.y) / 2 });
  const dirA = (V, P) => Math.atan2(-(P.y - V.y), P.x - V.x) / D2R;
  const PA = (V, a, L) => ({ x: V.x + L * Math.cos(a * D2R), y: V.y - L * Math.sin(a * D2R) });
  const norm = (a) => ((a % 360) + 360) % 360;
  const seg = (A, B, cls = 'side') => `<line x1="${f(A.x)}" y1="${f(A.y)}" x2="${f(B.x)}" y2="${f(B.y)}" class="${cls}"/>`;
  const txt = (Q, t, cls = 'lbl') => `<text x="${f(Q.x)}" y="${f(Q.y)}" class="${cls}" text-anchor="middle" dominant-baseline="central">${t}</text>`;
  const num = U.num;
  function triangle(al, be, ga, margin = 34) {
    const ac = Math.sin(be * D2R) / Math.sin(ga * D2R);
    let pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: ac * Math.cos(al * D2R), y: ac * Math.sin(al * D2R) }];
    const th = rand(0, 359) * D2R, flip = Math.random() < 0.5 ? -1 : 1;
    pts = pts.map((p) => ({ x: p.x * Math.cos(th) - p.y * Math.sin(th), y: -(p.x * Math.sin(th) + p.y * Math.cos(th)) * flip }));
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y), bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    const s = Math.min((W - 2 * margin) / bw, (H - 2 * margin) / bh), ox = (W - bw * s) / 2 - Math.min(...xs) * s, oy = (H - bh * s) / 2 - Math.min(...ys) * s;
    return pts.map((p) => ({ x: p.x * s + ox, y: p.y * s + oy }));
  }
  function ticks(P, Q, n) {
    const M = mid(P, Q), t = unit(sub(Q, P)), nn = { x: -t.y, y: t.x };
    let h = '';
    for (let k = 0; k < n; k++) { const C = add(M, t, (k - (n - 1) / 2) * 7); h += seg(add(C, nn, -9), add(C, nn, 9), 'tick'); }
    return h;
  }
  function square(V, P, Q, s = 16) { const u = unit(sub(P, V)), v = unit(sub(Q, V)), a = add(V, u, s), b = add(a, v, s), c = add(V, v, s); return `<path d="M${f(a.x)} ${f(a.y)} L${f(b.x)} ${f(b.y)} L${f(c.x)} ${f(c.y)}" class="sq"/>`; }
  function arcAt(T, v, label) {
    const V = T[v], P = T[(v + 1) % 3], Q = T[(v + 2) % 3];
    let a1 = dirA(V, P), d = norm(dirA(V, Q) - a1);
    if (d > 180) { a1 = dirA(V, Q); d = 360 - d; }
    const r = 26, p = PA(V, a1, r), q = PA(V, a1 + d, r);
    // l'étiquette est posée à l'extérieur du triangle, de l'autre côté du sommet : elle ne gêne jamais
    return `<path d="M${f(V.x)} ${f(V.y)} L${f(p.x)} ${f(p.y)} A${r} ${r} 0 0 0 ${f(q.x)} ${f(q.y)} Z" class="arc"/>` + txt(PA(V, a1 + d / 2 + 180, 30), label, 'val');
  }

  /* =========================================================
     LE TRIANGLE MYSTÈRE : les cartes
     carte = { A: [3 angles], kind, pres: 'code'|'angles'|'long', give: [indices d'angles écrits], L: longueurs, svg }
     ========================================================= */
  function anglesQuelconque(obtus) {
    for (;;) {
      const a = obtus ? rand(105, 140) : rand(40, 80), b = rand(25, 75), c = 180 - a - b, all = [a, b, c];
      if (c < 22 || all.some((x) => Math.abs(x - 90) < 12) || all.some((x, i) => all.some((y, j) => i !== j && Math.abs(x - y) < 8)) || all.some((x) => Math.abs(x - 60) < 3)) continue;
      if (!obtus && Math.max(...all) > 80) continue;
      return shuffle(all);
    }
  }
  const KINDS = ['equi', 'iso', 'isoObt', 'rect', 'rectIso', 'quel', 'quelObt'];
  function cardAngles(kind) {
    if (kind === 'equi') return [60, 60, 60];
    if (kind === 'iso') { let a; do { a = rand(2, 8) * 10; } while (a === 60); return shuffle([a, (180 - a) / 2, (180 - a) / 2]); }
    if (kind === 'isoObt') { const a = rand(11, 14) * 10; return shuffle([a, (180 - a) / 2, (180 - a) / 2]); }
    if (kind === 'rect') { let x; do { x = rand(22, 68); } while (Math.abs(x - 45) < 6); return shuffle([90, x, 90 - x]); }
    if (kind === 'rectIso') return shuffle([90, 45, 45]);
    return anglesQuelconque(kind === 'quelObt');
  }
  function makeCard(kind, pres) {
    const A = cardAngles(kind), T = triangle(...A, pres === 'angles' ? 54 : 40);
    const c = { A, kind, pres, T };
    const eq = (i, j) => A[i] === A[j];
    let h = `<polygon points="${T.map((p) => `${f(p.x)},${f(p.y)}`).join(' ')}" class="tri"/>`;
    if (pres === 'code' || pres === 'long') {
      // côtés égaux : le côté opposé au sommet i a la même longueur que celui opposé à j si A[i] = A[j]
      const sideOf = (i) => [(i + 1) % 3, (i + 2) % 3];
      const groups = [];
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (eq(i, j)) groups.push([i, j]);
      if (pres === 'code') {
        const marked = new Set(); groups.forEach(([i, j]) => { marked.add(i); marked.add(j); });
        marked.forEach((i) => { const [p, q] = sideOf(i); h += ticks(T[p], T[q], 1); });
      } else {
        // longueurs au demi-centimètre, proportionnelles au sinus de l'angle opposé ; on vérifie que les égalités
        // de longueurs sont exactement celles des angles, et que le triangle existe (inégalité triangulaire stricte)
        let LL = null;
        for (let t = 0; t < 60 && !LL; t++) {
          const k = (rand(50, 95) / 10) / Math.sin(60 * D2R), L = A.map((x) => Math.round(Math.sin(x * D2R) * k * 2) / 2);
          const okEq = [[0, 1], [0, 2], [1, 2]].every(([a, b]) => (L[a] === L[b]) === eq(a, b));
          const srt = [...L].sort((a, b) => a - b);
          if (okEq && srt[2] < srt[0] + srt[1] && srt[0] >= 1.5) LL = L;
        }
        if (!LL) return makeCard(kind, 'code');
        c.L = LL;
        for (let i = 0; i < 3; i++) { const [p, q] = sideOf(i), M = mid(T[p], T[q]), G = { x: (T[0].x + T[1].x + T[2].x) / 3, y: (T[0].y + T[1].y + T[2].y) / 3 }; h += txt(add(M, unit(sub(M, G)), 20), num(LL[i]), 'val small'); }
      }
      const r = A.indexOf(90); if (r >= 0) h += square(T[r], T[(r + 1) % 3], T[(r + 2) % 3]);
    } else {
      // deux angles écrits ; on préfère montrer deux angles différents (il faut calculer le troisième)
      let give = [0, 1, 2];
      const diffPairs = [[0, 1], [0, 2], [1, 2]].filter(([i, j]) => A[i] !== A[j]);
      give = kind === 'equi' ? [0, 1] : diffPairs.length ? pick(diffPairs) : [0, 1];
      if (kind.startsWith('rect') && Math.random() < 0.5) { const r = A.indexOf(90); give = [r, (r + 1) % 3]; }
      c.give = give;
      give.forEach((i) => { h += A[i] === 90 && Math.random() < 0.0 ? '' : arcAt(T, i, A[i] + '°'); });
    }
    c.svg = `<svg viewBox="0 0 ${W} ${H}" class="cfig" aria-hidden="true">${h}</svg>`;
    return c;
  }
  function deck(pres) {
    const kinds = shuffle(['equi', 'iso', 'iso', 'iso', 'isoObt', 'isoObt', 'rect', 'rect', 'rectIso', 'quel', 'quel', 'quel', 'quel', 'quelObt', 'quelObt', 'quelObt']);
    return kinds.map((k, i) => makeCard(k, typeof pres === 'function' ? pres(i, k) : pres));
  }
  /** pourquoi une carte répond oui / non à une question */
  function cardFacts(c) {
    if (c.pres === 'angles') {
      const [i, j] = c.give, k = 3 - i - j;
      return `Angles écrits : ${c.A[i]}° et ${c.A[j]}°, donc le 3<sup>e</sup> mesure 180° − ${c.A[i]}° − ${c.A[j]}° = ${c.A[k]}°. Ses angles : ${[...c.A].sort((a, b) => b - a).join('°, ')}°.`;
    }
    if (c.pres === 'long') return `Longueurs : ${c.L.map(num).join(' ; ')}${c.A.includes(90) ? ', et un angle droit codé' : ''}.`;
    const eqs = new Set(c.A).size;
    return `Codage : ${eqs === 1 ? '3 côtés égaux' : eqs === 2 ? '2 côtés égaux' : 'aucun côté égal'}${c.A.includes(90) ? ', un angle droit' : ''}${Math.max(...c.A) > 90 ? ', un angle visiblement obtus' : ''}.`;
  }
  const QUESTIONS = [
    { id: 'iso', q: 'Est-il isocèle ?', test: (c) => new Set(c.A).size < 3, note: 'un triangle équilatéral est aussi isocèle' },
    { id: 'equi', q: 'Est-il équilatéral ?', test: (c) => new Set(c.A).size === 1 },
    { id: 'rect', q: 'Est-il rectangle ?', test: (c) => c.A.includes(90) },
    { id: 'obt', q: 'A-t-il un angle obtus ?', test: (c) => Math.max(...c.A) > 90 },
    { id: 'aigu', q: 'Ses trois angles sont-ils aigus ?', test: (c) => Math.max(...c.A) < 90 },
    { id: 'p80', q: 'A-t-il un angle de plus de 80° ?', test: (c) => Math.max(...c.A) > 80, angles: true },
    { id: 'm40', q: 'A-t-il un angle de moins de 40° ?', test: (c) => Math.min(...c.A) < 40, angles: true },
    { id: 'orth', q: 'Son orthocentre est-il à l’extérieur du triangle ?', test: (c) => Math.max(...c.A) > 90, cinq: true, note: 'l’orthocentre est dehors quand le triangle a un angle obtus' },
    { id: 'circ', q: 'Le centre de son cercle circonscrit est-il sur un côté ?', test: (c) => c.A.includes(90), cinq: true, note: 'c’est le cas quand le triangle est rectangle : le centre est le milieu de l’hypoténuse' },
  ];
  const qList = (o) => QUESTIONS.filter((q) => (!q.angles || o.angles) && (!q.cinq || o.cinq));

  /* =========================================================
     LES CONSTRUCTIONS : bâtons (inégalité triangulaire) ou tuiles d'angles (180°)
     ========================================================= */
  function sticksPuzzle(nTri, dec) {
    const items = [];
    for (let t = 0; t < nTri; t++) {
      let a, b, c;
      do {
        a = dec ? rand(20, 80) / 10 : rand(2, 9); b = dec ? rand(20, 80) / 10 : rand(2, 9);
        const s = Math.round((a + b) * 10) / 10, tight = Math.random() < 0.6;
        c = tight ? Math.round((s - (dec ? pick([0.1, 0.2, 0.3]) : 1)) * 10) / 10 : Math.round((Math.max(a, b) + (dec ? rand(1, 9) / 10 : 1)) * 10) / 10;
      } while (c <= Math.max(a, b) - 0.01 || c >= a + b - 0.001 || c > 15);
      items.push(a, b, c);
    }
    return shuffle(items.map((v, i) => ({ id: i, v })));
  }
  function anglesPuzzle(nTri, easy) {
    const items = [];
    for (let t = 0; t < nTri; t++) {
      let a, b; do { a = easy ? rand(2, 12) * 10 : rand(15, 120); b = easy ? rand(2, 12) * 10 : rand(15, 120); } while (180 - a - b < (easy ? 20 : 12));
      items.push(a, b, 180 - a - b);
    }
    return shuffle(items.map((v, i) => ({ id: i, v })));
  }
  /** jugement d'un assemblage de 3 éléments */
  function judge(kind, vals) {
    if (kind === 'angles') {
      const s = vals.reduce((x, y) => x + y, 0);
      return s === 180 ? { ok: true, why: `${vals.join('° + ')}° = 180° ✔` } : { ok: false, why: `${vals.join('° + ')}° = ${s}° : la somme des angles d’un triangle doit faire <b>180°</b>.` };
    }
    const v = [...vals].sort((a, b) => a - b), s = Math.round((v[0] + v[1]) * 10) / 10;
    if (v[2] < s) return { ok: true, why: `${num(v[2])} < ${num(v[0])} + ${num(v[1])} = ${num(s)} ✔` };
    if (v[2] === s) return { ok: false, flat: true, why: `${num(v[2])} = ${num(v[0])} + ${num(v[1])} : le triangle est <b>aplati</b> (les points sont alignés).` };
    return { ok: false, why: `${num(v[2])} > ${num(v[0])} + ${num(v[1])} = ${num(s)} : le plus grand côté est trop long, impossible de fermer le triangle.` };
  }
  /** les éléments restants peuvent-ils encore tous être répartis en triangles ? */
  function solvable(kind, items) {
    if (!items.length) return true;
    if (items.length % 3) return false;
    const [x, ...rest] = items;
    for (let i = 0; i < rest.length; i++) for (let j = i + 1; j < rest.length; j++) {
      if (judge(kind, [x.v, rest[i].v, rest[j].v]).ok && solvable(kind, rest.filter((_, k) => k !== i && k !== j))) return true;
    }
    return false;
  }

  /* =========================================================
     Les étages
     ========================================================= */
  const pres6 = (i) => (i % 2 ? 'code' : 'angles');
  const STAGES = NIV === 6 ? [
    { id: 's1', icon: '🃏', name: 'Le mystère des codages', tag: 'Qui est-ce ? Lire un codage', game: 'myst', deck: () => deck('code'), q: { angles: false }, rounds: 3 },
    { id: 's2', icon: '🔢', name: 'Le mystère des angles', tag: 'Qui est-ce ? Calculer le 3e angle', game: 'myst', deck: () => deck('angles'), q: { angles: true }, rounds: 3 },
    { id: 's3', icon: '🧩', name: 'Mystère mélangé', tag: 'Codages et angles', game: 'myst', deck: () => deck(pres6), q: { angles: false }, rounds: 3 },
    { id: 's4', icon: '🏚️', name: 'La charpente', tag: '180° : tuiles faciles', game: 'build', kind: 'angles', gen: () => anglesPuzzle(2, true), rounds: 3 },
    { id: 's5', icon: '🏠', name: 'La grande charpente', tag: '180° : 3 triangles', game: 'build', kind: 'angles', gen: () => anglesPuzzle(3, false), rounds: 3 },
    { id: 's6', icon: '🎯', name: 'Le mystère expert', tag: 'Trouver en 4 questions', game: 'myst', deck: () => deck(pres6), q: { angles: true }, rounds: 3, expert: true },
    { id: 's7', icon: '🏰', name: 'Le château', tag: '180° : 4 triangles', game: 'build', kind: 'angles', gen: () => anglesPuzzle(4, false), rounds: 2, boss: true },
  ] : [
    { id: 's1', icon: '🃏', name: 'Le mystère des côtés', tag: 'Qui est-ce ? Codages et longueurs', game: 'myst', deck: () => deck((i) => (i % 2 ? 'code' : 'long')), q: { angles: false }, rounds: 3, noObt: true },
    { id: 's2', icon: '🌉', name: 'Le pont', tag: 'Inégalité triangulaire', game: 'build', kind: 'sticks', gen: () => sticksPuzzle(3, false), rounds: 3 },
    { id: 's3', icon: '🔢', name: 'Le mystère des angles', tag: 'Qui est-ce ? 180°', game: 'myst', deck: () => deck('angles'), q: { angles: true }, rounds: 3 },
    { id: 's4', icon: '🌁', name: 'Le pont des décimaux', tag: 'Inégalité, au millimètre', game: 'build', kind: 'sticks', gen: () => sticksPuzzle(3, true), rounds: 3 },
    { id: 's5', icon: '📍', name: 'Les points remarquables', tag: 'Orthocentre, cercle circonscrit', game: 'myst', deck: () => deck('angles'), q: { angles: true, cinq: true }, rounds: 3 },
    { id: 's6', icon: '🏠', name: 'La charpente', tag: '180° : 3 triangles', game: 'build', kind: 'angles', gen: () => anglesPuzzle(3, false), rounds: 3 },
    { id: 's7', icon: '🎯', name: 'Le mystère expert', tag: 'Trouver en 4 questions', game: 'myst', deck: () => deck((i) => ['code', 'angles', 'long'][i % 3]), q: { angles: true, cinq: true }, rounds: 3, expert: true, boss: true },
  ];
  const unlocked = (i) => ALL_OPEN || i === 0 || (S.d.stars[STAGES[i - 1].id] || 0) > 0;
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;
  const RULE_MYST = 'Sur ces cartes, <b>tout ce qui est vrai est codé ou écrit</b> : mêmes petits traits = côtés égaux ; petit carré = angle droit ; deux angles écrits → le troisième se calcule (180°). Un triangle équilatéral est aussi isocèle.';
  const RULE_BUILD = { sticks: '<b>Inégalité triangulaire</b> : trois bâtons forment un triangle si le plus grand est <b>plus petit</b> que la somme des deux autres. Égal : aplati. Plus grand : impossible.', angles: 'Trois tuiles forment un triangle si leurs angles font <b>180°</b> en tout.' };

  /* =========================================================
     Écrans
     ========================================================= */
  let G = null;
  const sage = (html) => `<div class="sage"><span class="face" aria-hidden="true">🧙</span><div class="say">${html}</div></div>`;
  function home() {
    G = null;
    const total = STAGES.reduce((s, z) => s + (S.d.stars[z.id] || 0), 0);
    const nextI = STAGES.findIndex((z, i) => unlocked(i) && !S.d.stars[z.id]);
    app.innerHTML = `<div class="screen">
      <header class="brand"><span class="rune" aria-hidden="true">△</span><h1>Trigone</h1><span class="lvl">${NOM_NIV}</span></header>
      <p class="tag">Le donjon des triangles · <b>⭐ ${total} / ${STAGES.length * 3}</b></p>
      ${sage(!S.d.intro ? 'Bienvenue, jeune mage. Dans mon donjon, deux épreuves : le <b>Triangle mystère</b> (pose les bonnes questions et élimine les cartes… sans te tromper) et les <b>constructions</b> (assemble des triangles qui tiennent debout).' : pick(['La meilleure question élimine <b>la moitié</b> des cartes.', 'Deux angles écrits ? Le troisième se calcule : 180° !', 'Un équilatéral est aussi isocèle.', 'Défie un ami en <b>duel</b> !']))}
      <button type="button" class="duel-btn" data-act="duel">⚔️ <b>Duel de mages</b> <small>à deux, chacun son tour : triangle mystère ou course aux triangles</small></button>
      <div class="tower">${STAGES.map((z, i) => { const lock = !unlocked(i), st = S.d.stars[z.id] || 0; return `<button type="button" class="floor${z.boss ? ' boss' : ''}${lock ? ' locked' : ''}${i === nextI ? ' next' : ''}" data-z="${i}" ${lock ? 'disabled' : ''}>
        <span class="num">Salle ${i + 1}</span><span class="ico">${lock ? '🔒' : z.icon}</span><span class="nm">${z.name}</span><span class="rl">${z.tag}</span><span class="st">${starStr(st)}</span></button>`; }).join('')}</div>
      <p class="foot">Une étoile ouvre la salle suivante. Ta progression reste sur cet appareil.</p></div>`;
    app.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => { Snd.init(); S.d.intro = true; S.save(); brief(STAGES[Number(b.dataset.z)]); }));
    app.querySelector('[data-act="duel"]').addEventListener('click', () => { Snd.init(); duel(); });
  }
  function brief(Z) {
    const idx = STAGES.indexOf(Z);
    app.innerHTML = `<div class="screen"><div class="card"><p class="kicker">Salle ${idx + 1} / ${STAGES.length} · ${Z.tag}</p><h1>${Z.icon} ${Z.name}</h1>
      <div class="rule">${Z.game === 'myst' ? RULE_MYST : RULE_BUILD[Z.kind]}</div>
      ${sage(Z.game === 'myst' ? `Un triangle est caché parmi les 16 cartes. Pose une question, puis <b>touche les cartes à éliminer</b> : celles qui ne correspondent pas à la réponse. Quand tu es sûr, <b>accuse</b> une carte. ${Z.expert ? 'Ici, il faut trouver en <b>4 questions</b> au plus pour 3 étoiles !' : 'Moins de questions = plus d’étoiles.'}`
        : `Touche 3 ${Z.kind === 'angles' ? 'tuiles' : 'bâtons'}, puis <b>Assembler</b>. Il faut tout utiliser : attention, un triangle qui tient peut quand même bloquer la suite !`)}
      <div class="row"><button type="button" class="btn ghost" data-act="back">← Donjon</button><button type="button" class="btn go" data-act="go">▶ Entrer</button></div></div></div>`;
    app.querySelector('[data-act="back"]').addEventListener('click', home);
    app.querySelector('[data-act="go"]').addEventListener('click', () => { G = { Z, r: 0, stars: [] }; Z.game === 'myst' ? mystRound() : buildRound(); });
    app.querySelector('[data-act="go"]').focus();
  }
  function hud() {
    const Z = G.Z;
    return `<div class="hud"><button type="button" class="quit" data-act="quit" aria-label="Arrêter">✕</button><span class="zn">${Z.icon} ${Z.name}</span><span class="dots">${Array.from({ length: Z.rounds }, (_, i) => `<i class="${G.stars[i] === 3 ? 'ok' : G.stars[i] ? 'mid' : i === G.r ? 'cur' : ''}"></i>`).join('')}</span><span class="zn right" id="hudinfo"></span></div>`;
  }
  const bindQuit = () => app.querySelector('[data-act="quit"]').addEventListener('click', () => { if (confirm('Quitter la salle ?')) home(); });

  /* ---------- Triangle mystère (solo) ---------- */
  function mystRound() {
    const Z = G.Z;
    if (G.r >= Z.rounds) { endStage(); return; }
    const cards = Z.deck();
    G.m = { cards, secret: rand(0, 15), out: new Set(), asked: [], accuse: false, done: false, qs: qList(Z.q).filter((q) => !(Z.noObt && (q.id === 'obt' || q.id === 'aigu'))) };
    app.innerHTML = `<div class="screen play">${hud()}<div class="myst"><div class="grid" id="grid"></div>
      <div class="mside"><div class="asked" id="asked"></div><p class="pick">Pose une question :</p><div class="qs" id="qs"></div>
      <div class="row"><button type="button" class="btn danger" data-act="acc">☝️ Accuser une carte</button></div><div class="msg" id="msg"></div></div></div></div>`;
    bindQuit();
    app.querySelector('[data-act="acc"]').addEventListener('click', () => { G.m.accuse = !G.m.accuse; mystDraw(); });
    mystDraw();
  }
  function mystDraw() {
    const M = G.m;
    document.getElementById('hudinfo').textContent = `❓ ${M.asked.length} question${M.asked.length > 1 ? 's' : ''}`;
    document.getElementById('grid').innerHTML = M.cards.map((c, i) => `<button type="button" class="tcard${M.out.has(i) ? ' out' : ''}${M.accuse && !M.out.has(i) ? ' acc' : ''}${M.done && i === M.secret ? ' secret' : ''}" data-i="${i}"><span class="cn">${i + 1}</span>${c.svg}</button>`).join('');
    document.getElementById('grid').classList.toggle('accusing', M.accuse);
    document.querySelectorAll('.tcard').forEach((b) => U.tap(b, () => cardTap(Number(b.dataset.i))));
    document.getElementById('asked').innerHTML = M.asked.length ? M.asked.map((a) => `<div class="qa"><span>${a.q.q}</span><b class="${a.ans ? 'yes' : 'no'}">${a.ans ? 'OUI' : 'NON'}</b></div>`).join('') : '<p class="dim">Aucune question pour l’instant.</p>';
    document.getElementById('qs').innerHTML = M.qs.map((q) => `<button type="button" class="qbtn" data-q="${q.id}" ${M.asked.some((a) => a.q.id === q.id) || M.done ? 'disabled' : ''}>${q.q}</button>`).join('');
    document.querySelectorAll('.qbtn').forEach((b) => U.tap(b, () => ask(b.dataset.q)));
    const acc = app.querySelector('[data-act="acc"]'); if (acc) { acc.textContent = M.accuse ? '✋ Annuler l’accusation' : '☝️ Accuser une carte'; acc.disabled = M.done; }
    if (M.accuse && !M.done) document.getElementById('msg').innerHTML = '<div class="explain warn">Touche la carte que tu accuses. Si tu te trompes, la manche est perdue !</div>';
  }
  function ask(id) {
    const M = G.m; if (M.done) return;
    const q = M.qs.find((x) => x.id === id), ans = q.test(M.cards[M.secret]);
    M.asked.push({ q, ans }); Snd.key();
    document.getElementById('msg').innerHTML = `<div class="explain ${ans ? 'good' : ''}">« ${q.q} » → <b>${ans ? 'OUI' : 'NON'}</b>. Touche les cartes qui ne correspondent pas pour les retourner.</div>`;
    mystDraw();
  }
  function cardTap(i) {
    const M = G.m; if (M.done) return;
    if (M.accuse) { accuse(i); return; }
    if (M.out.has(i)) M.out.delete(i); else M.out.add(i);
    Snd.flip(); mystDraw();
  }
  /** les cartes éliminées à tort (elles répondaient comme le secret à toutes les questions posées) */
  const consistent = (M, c) => M.asked.every((a) => a.q.test(c) === a.ans);
  function accuse(i) {
    const M = G.m; M.done = true; M.accuse = false;
    const ok = i === M.secret, wrongOut = [...M.out].filter((k) => consistent(M, M.cards[k]));
    const nq = M.asked.length, Z = G.Z;
    const stars = !ok ? 0 : wrongOut.length ? 1 : Z.expert ? (nq <= 4 ? 3 : nq <= 5 ? 2 : 1) : nq <= 5 ? 3 : nq <= 7 ? 2 : 1;
    G.stars[G.r] = stars; G.r++;
    if (ok) { Snd.win(); U.confetti(20 + stars * 15); } else Snd.lose();
    const sec = M.cards[M.secret];
    const review = wrongOut.map((k) => { const c = M.cards[k], bad = M.asked.map((a) => `${a.q.q} → ${a.q.test(c) ? 'oui' : 'non'}`).join(' ; '); return `<li><b>Carte ${k + 1}</b> éliminée à tort. ${cardFacts(c)} Elle répondait comme le mystère : ${bad}.</li>`; }).join('');
    mystDraw();
    document.getElementById('msg').innerHTML = `<div class="explain ${ok ? 'good' : ''}"><b>${ok ? `🎉 Trouvé en ${nq} question${nq > 1 ? 's' : ''} !` : `Raté : le triangle mystère était la carte ${M.secret + 1}.`}</b> ${'⭐'.repeat(stars)}<br>${cardFacts(sec)}
      ${M.asked.map((a) => `<br>• ${a.q.q} ${a.ans ? 'Oui' : 'Non'}${a.q.note && a.ans ? ` (${a.q.note})` : ''}.`).join('')}
      ${review ? `<ul class="review">${review}</ul>` : ''}</div><button type="button" class="btn go" data-act="nx">${G.r >= G.Z.rounds ? 'Bilan' : 'Manche suivante ▶'}</button>`;
    app.querySelector('[data-act="nx"]').addEventListener('click', mystRound);
  }

  /* ---------- Constructions (solo) ---------- */
  function buildRound() {
    const Z = G.Z;
    if (G.r >= Z.rounds) { endStage(); return; }
    G.b = { items: Z.gen(), built: [], sel: [], crash: 0, done: false };
    G.b.start = G.b.items.map((x) => ({ ...x }));
    app.innerHTML = `<div class="screen play">${hud()}<div class="build"><div class="bridge" id="bridge"></div><p class="pick">${Z.kind === 'angles' ? 'Choisis 3 tuiles d’angles :' : 'Choisis 3 bâtons (en cm) :'}</p><div class="pool" id="pool"></div>
      <div class="row"><button type="button" class="btn go" data-act="mk">🔨 Assembler</button><button type="button" class="btn ghost" data-act="reset">↺ Tout démonter</button></div><div class="msg" id="msg"></div></div></div>`;
    bindQuit();
    app.querySelector('[data-act="mk"]').addEventListener('click', assemble);
    app.querySelector('[data-act="reset"]').addEventListener('click', () => { const B = G.b; if (B.done) return; B.items = B.start.map((x) => ({ ...x })); B.built = []; B.sel = []; B.crash++; buildDraw('<div class="explain warn">Tout est démonté (cela compte comme une erreur). Cherche une autre répartition !</div>'); });
    buildDraw();
  }
  const itemLabel = (kind, v) => (kind === 'angles' ? `${v}°` : num(v));
  function buildDraw(msg) {
    const B = G.b, Z = G.Z;
    document.getElementById('hudinfo').textContent = `💥 ${B.crash}`;
    document.getElementById('bridge').innerHTML = `<div class="slots">${Array.from({ length: B.start.length / 3 }, (_, k) => { const t = B.built[k]; return `<div class="slot${t ? ' full' : ''}">${t ? `<span class="tri-ok">△</span><span>${t.map((v) => itemLabel(Z.kind, v)).join(' · ')}</span>` : '<span class="tri-empty">△</span>'}</div>`; }).join('')}</div>`;
    document.getElementById('pool').innerHTML = B.items.map((it) => `<button type="button" class="item ${Z.kind}${B.sel.includes(it.id) ? ' sel' : ''}" data-id="${it.id}" ${B.done ? 'disabled' : ''}>${Z.kind === 'sticks' ? `<span class="stick" style="width:${Math.min(100, it.v * 8 + 14)}%"></span>` : '<span class="tile">∠</span>'}<b>${itemLabel(Z.kind, it.v)}</b></button>`).join('');
    document.querySelectorAll('.item').forEach((b) => U.tap(b, () => { if (B.done) return; const id = Number(b.dataset.id); const k = B.sel.indexOf(id); if (k >= 0) B.sel.splice(k, 1); else if (B.sel.length < 3) B.sel.push(id); Snd.key(); buildDraw(); }));
    if (msg !== undefined) document.getElementById('msg').innerHTML = msg;
  }
  function assemble() {
    const B = G.b, Z = G.Z;
    if (B.done || B.sel.length !== 3) { document.getElementById('msg').innerHTML = '<div class="explain warn">Choisis exactement 3 éléments.</div>'; return; }
    const vals = B.sel.map((id) => B.items.find((x) => x.id === id).v), j = judge(Z.kind, vals);
    if (!j.ok) {
      B.crash++; Snd.crash(); B.sel = [];
      const br = document.getElementById('bridge'); br.classList.remove('shake'); void br.offsetWidth; br.classList.add('shake');
      buildDraw(`<div class="explain">💥 <b>${j.flat ? 'Aplati !' : 'Ça s’écroule !'}</b> ${j.why}</div>`);
      return;
    }
    B.items = B.items.filter((x) => !B.sel.includes(x.id)); B.built.push(vals); B.sel = [];
    Snd.build();
    if (!B.items.length) {
      B.done = true;
      const stars = B.crash === 0 ? 3 : B.crash === 1 ? 2 : 1;
      G.stars[G.r] = stars; G.r++; Snd.win(); U.confetti(stars * 20);
      buildDraw(`<div class="explain good"><b>🏆 Construction terminée !</b> ${'⭐'.repeat(stars)} ${j.why}</div><button type="button" class="btn go" data-act="nx">${G.r >= Z.rounds ? 'Bilan' : 'Construction suivante ▶'}</button>`);
      app.querySelector('[data-act="nx"]').addEventListener('click', buildRound);
      return;
    }
    const stuck = !solvable(Z.kind, B.items);
    buildDraw(`<div class="explain ${stuck ? 'warn' : 'good'}">✔ Ce triangle tient : ${j.why}${stuck ? `<br>⚠️ Mais avec ce qui reste, impossible de tout assembler… Il fallait répartir autrement : <b>démonte</b> pour recommencer.` : ''}</div>`);
  }
  function endStage() {
    const Z = G.Z, idx = STAGES.indexOf(Z), next = STAGES[idx + 1];
    const avg = G.stars.reduce((a, b) => a + b, 0) / G.stars.length, stars = avg >= 2.6 ? 3 : avg >= 1.6 ? 2 : avg > 0.5 ? 1 : 0;
    const old = S.d.stars[Z.id] || 0; S.d.stars[Z.id] = Math.max(old, stars); S.save();
    if (stars) { Snd.win(); U.confetti(stars * 30); } else Snd.lose();
    app.innerHTML = `<div class="screen"><div class="card"><p class="kicker">Salle ${idx + 1} · ${Z.name}</p><h1 class="center">${stars === 3 ? 'Maître du donjon !' : stars ? 'Salle réussie' : 'Salle à refaire'}</h1>
      <div class="stars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>
      <p class="center dim">Manches : ${G.stars.map((s) => (s ? '⭐'.repeat(s) : '✗')).join(' · ')}</p>
      ${sage(Z.game === 'myst' ? 'Pour 3 étoiles : peu de questions, et aucune carte éliminée à tort. Cherche la question qui coupe le paquet en deux !' : 'Pour 3 étoiles : aucun effondrement. Commence par les plus grands éléments : ce sont eux qui posent problème.')}
      ${!old && stars && next ? `<p class="center unlock">🔓 Salle ouverte : ${next.icon} ${next.name}</p>` : ''}
      <div class="row"><button type="button" class="btn ghost" data-act="home">← Donjon</button><button type="button" class="btn${next && stars ? '' : ' go'}" data-act="again">↻ Recommencer</button>${next && stars ? '<button type="button" class="btn go" data-act="next">Salle suivante ▶</button>' : ''}</div></div></div>`;
    app.querySelector('[data-act="home"]').addEventListener('click', home);
    app.querySelector('[data-act="again"]').addEventListener('click', () => brief(Z));
    app.querySelector('[data-act="next"]')?.addEventListener('click', () => brief(next));
  }

  /* =========================================================
     DUELS (tour par tour)
     ========================================================= */
  const MODES = [
    { id: 'myst', nom: 'Triangle mystère', desc: 'Chacun cherche le triangle caché de l’autre' },
    ...(NIV === 5 ? [{ id: 'sticks', nom: 'Course aux triangles : bâtons', desc: 'Inégalité triangulaire' }] : []),
    { id: 'angles', nom: 'Course aux triangles : angles', desc: 'Des tuiles qui font 180°' },
  ];
  function duel() {
    window.Moteur.match({ jeu: `trigone-${NIV}e`, titre: 'Trigone', niveauScolaire: NOM_NIV, theme: 'trigone', icone: '🧙', sound: Snd, modes: MODES, quitter: home,
      start: (ctx) => (ctx.mode === 'myst' ? duelMyst(ctx) : duelBuild(ctx)) });
  }
  function duelMyst(ctx) {
    const cards = deck(NIV === 5 ? (i) => ['code', 'angles', 'long'][i % 3] : pres6);
    const qs = qList({ angles: true, cinq: NIV === 5 });
    const secret = [rand(0, 15), 0]; do { secret[1] = rand(0, 15); } while (secret[1] === secret[0]);
    // le joueur k cherche secret[1 - k] (le triangle de l'adversaire)
    const D = { turn: rand(0, 1), phase: 'ask', out: [new Set(), new Set()], asked: [[], []], accuse: [false, false], log: '' };
    ctx.P.forEach((p) => {
      p.el.innerHTML = `<div class="dm"><div class="dmhead"><b>${U.esc(p.nom)}</b><span>cherche le triangle de ${U.esc(ctx.P[1 - p.k].nom)}</span></div><div class="dgrid"></div>
        <p class="m-turnmsg"></p><div class="dqs"></div><div class="m-row"><button type="button" class="m-btn m-ghost dend">Fin du tour ▶</button><button type="button" class="m-btn dacc">☝️ Accuser</button></div><div class="dasked"></div></div>`;
      U.tap(p.el.querySelector('.dend'), () => { if (D.turn !== p.k || D.phase !== 'flip') return; D.turn = 1 - p.k; D.phase = 'ask'; D.log = ''; render(); });
      U.tap(p.el.querySelector('.dacc'), () => { if (D.turn !== p.k) return; D.accuse[p.k] = !D.accuse[p.k]; render(); });
    });
    function render() {
      ctx.turn(D.turn);
      ctx.P.forEach((p) => {
        const k = p.k, mine = D.turn === k, el = p.el;
        el.querySelector('.dgrid').innerHTML = cards.map((c, i) => `<button type="button" class="tcard${D.out[k].has(i) ? ' out' : ''}${D.accuse[k] && mine && !D.out[k].has(i) ? ' acc' : ''}" data-i="${i}"><span class="cn">${i + 1}</span>${c.svg}</button>`).join('');
        el.querySelectorAll('.dgrid .tcard').forEach((b) => U.tap(b, () => tapCard(k, Number(b.dataset.i))));
        el.querySelector('.m-turnmsg').textContent = !mine ? `Au tour de ${ctx.P[1 - k].nom}…` : D.accuse[k] ? 'Touche la carte que tu accuses !' : D.phase === 'ask' ? 'Pose une question (ou accuse une carte).' : 'Retourne les cartes éliminées, puis « Fin du tour ».';
        el.querySelector('.dqs').innerHTML = mine && D.phase === 'ask' && !D.accuse[k] ? qs.map((q) => `<button type="button" class="qbtn" data-q="${q.id}" ${D.asked[k].some((a) => a.q.id === q.id) ? 'disabled' : ''}>${q.q}</button>`).join('') : '';
        el.querySelectorAll('.dqs .qbtn').forEach((b) => U.tap(b, () => askD(k, b.dataset.q)));
        el.querySelector('.dend').disabled = !(mine && D.phase === 'flip');
        el.querySelector('.dacc').disabled = !mine; el.querySelector('.dacc').textContent = D.accuse[k] ? '✋ Annuler' : '☝️ Accuser';
        el.querySelector('.dasked').innerHTML = (D.log ? `<p class="dlog">${D.log}</p>` : '') + D.asked[k].map((a) => `<span class="qa small"><span>${a.q.q}</span><b class="${a.ans ? 'yes' : 'no'}">${a.ans ? 'OUI' : 'NON'}</b></span>`).join('');
      });
    }
    function askD(k, id) {
      if (D.turn !== k || D.phase !== 'ask') return;
      const q = qs.find((x) => x.id === id), ans = q.test(cards[secret[1 - k]]);
      D.asked[k].push({ q, ans }); D.phase = 'flip'; Snd.key();
      D.log = `${U.esc(ctx.P[k].nom)} : « ${q.q} » → <b>${ans ? 'OUI' : 'NON'}</b>`;
      render();
    }
    function tapCard(k, i) {
      if (D.turn !== k) return;
      if (D.accuse[k]) {
        const ok = i === secret[1 - k], w = ok ? k : 1 - k;
        const sec = (j) => `<p class="m-dim">Le triangle de ${U.esc(ctx.P[j].nom)} était la carte ${secret[j] + 1}. ${cardFacts(cards[secret[j]])}</p>`;
        const wrong = (j) => { const M = { asked: D.asked[j] }, list = [...D.out[j]].filter((x) => consistent(M, cards[x])); return list.length ? `<p class="m-dim">⚠️ Cartes éliminées à tort : ${list.map((x) => x + 1).join(', ')}.</p>` : ''; };
        ctx.end({ winner: w, text: ctx.P.map((p) => `<p class="m-kick">${ok ? `${U.esc(ctx.P[k].nom)} a trouvé la carte ${i + 1} !` : `${U.esc(ctx.P[k].nom)} a accusé la carte ${i + 1}… raté !`}</p>${sec(1 - p.k)}${sec(p.k)}${wrong(p.k)}`),
          score: ctx.P.map((p) => `${D.asked[p.k].length} question${D.asked[p.k].length > 1 ? 's' : ''}`),
          stats: ctx.P.map((p) => ({ questions: D.asked[p.k].length })) });
        return;
      }
      if (D.phase !== 'flip') return;
      if (D.out[k].has(i)) D.out[k].delete(i); else D.out[k].add(i);
      Snd.flip(); render();
    }
    render();
  }
  function duelBuild(ctx) {
    const kind = ctx.mode;
    const pool = kind === 'angles' ? anglesPuzzle(4, false) : sticksPuzzle(4, false);
    const D = { turn: rand(0, 1), pool, hand: [[], []], built: [[], []], lost: [0, 0], sel: [[], []], log: '', took: false };
    ctx.P.forEach((p) => {
      p.el.innerHTML = `<div class="db"><div class="dmhead"><b>${U.esc(p.nom)}</b><span class="dscore"></span></div>
        <p class="pick">Réserve commune — prends ${kind === 'angles' ? 'une tuile' : 'un bâton'} :</p><div class="dpool"></div>
        <p class="pick">Ma main — choisis 3 éléments pour construire :</p><div class="dhand"></div>
        <p class="m-turnmsg"></p><div class="m-row"><button type="button" class="m-btn m-go dmk">🔨 Construire</button><button type="button" class="m-btn m-ghost dend">Fin du tour ▶</button></div><div class="dlog"></div></div>`;
      U.tap(p.el.querySelector('.dmk'), () => build(p.k));
      U.tap(p.el.querySelector('.dend'), () => endTurn(p.k));
    });
    function render() {
      ctx.turn(D.turn);
      ctx.P.forEach((p) => {
        const k = p.k, mine = D.turn === k, el = p.el;
        el.querySelector('.dscore').innerHTML = `Triangles : <b>${D.built[k].length}</b> · ${U.esc(ctx.P[1 - k].nom)} : <b>${D.built[1 - k].length}</b>`;
        el.querySelector('.dpool').innerHTML = D.pool.map((it) => `<button type="button" class="item ${kind}" data-id="${it.id}" ${mine && !D.took ? '' : 'disabled'}>${kind === 'sticks' ? `<span class="stick" style="width:${Math.min(100, it.v * 8 + 14)}%"></span>` : '<span class="tile">∠</span>'}<b>${itemLabel(kind, it.v)}</b></button>`).join('') || '<i class="dim">La réserve est vide.</i>';
        el.querySelectorAll('.dpool .item').forEach((b) => U.tap(b, () => takeD(k, Number(b.dataset.id))));
        el.querySelector('.dhand').innerHTML = D.hand[k].map((it) => `<button type="button" class="item ${kind}${D.sel[k].includes(it.id) ? ' sel' : ''}" data-id="${it.id}" ${mine ? '' : 'disabled'}>${kind === 'sticks' ? `<span class="stick" style="width:${Math.min(100, it.v * 8 + 14)}%"></span>` : '<span class="tile">∠</span>'}<b>${itemLabel(kind, it.v)}</b></button>`).join('') || '<i class="dim">vide</i>';
        el.querySelectorAll('.dhand .item').forEach((b) => U.tap(b, () => { if (D.turn !== k) return; const id = Number(b.dataset.id), s = D.sel[k], j = s.indexOf(id); if (j >= 0) s.splice(j, 1); else if (s.length < 3) s.push(id); render(); }));
        el.querySelector('.m-turnmsg').textContent = !mine ? `Au tour de ${ctx.P[1 - k].nom}…` : !D.took && D.pool.length ? 'Prends un élément dans la réserve.' : 'Construis un triangle si tu peux, puis « Fin du tour ».';
        el.querySelector('.dmk').disabled = !mine || D.sel[k].length !== 3;
        el.querySelector('.dend').disabled = !mine || (!D.took && D.pool.length > 0);
        el.querySelector('.dlog').innerHTML = D.log;
      });
    }
    function takeD(k, id) {
      if (D.turn !== k || D.took) return;
      const i = D.pool.findIndex((x) => x.id === id); if (i < 0) return;
      D.hand[k].push(D.pool.splice(i, 1)[0]); D.took = true; Snd.key();
      D.log = `${U.esc(ctx.P[k].nom)} prend ${itemLabel(kind, D.hand[k][D.hand[k].length - 1].v)}.`;
      render();
    }
    function build(k) {
      if (D.turn !== k || D.sel[k].length !== 3) return;
      const items = D.sel[k].map((id) => D.hand[k].find((x) => x.id === id)), j = judge(kind, items.map((x) => x.v));
      D.hand[k] = D.hand[k].filter((x) => !D.sel[k].includes(x.id)); D.sel[k] = [];
      if (j.ok) { D.built[k].push(items.map((x) => x.v)); Snd.build(); D.log = `🔨 ${U.esc(ctx.P[k].nom)} construit un triangle : ${j.why}`; }
      else { D.lost[k] += 3; Snd.crash(); D.log = `💥 ${U.esc(ctx.P[k].nom)} : ${j.flat ? 'aplati' : 'effondré'} ! ${j.why} Les 3 éléments sont perdus.`; }
      render();
    }
    function endTurn(k) {
      if (D.turn !== k || (!D.took && D.pool.length)) return;
      D.took = false; D.sel[k] = [];
      // quand la réserve est vide, chacun a encore un dernier tour pour construire
      if (!D.pool.length) { D.final = (D.final === undefined ? 2 : D.final) - 1; if (D.final <= 0) { finish(); return; } }
      D.turn = 1 - k; render();
    }
    function finish() {
      const a = D.built[0].length, b = D.built[1].length, w = a > b ? 0 : b > a ? 1 : null;
      ctx.end({ winner: w, text: ctx.P.map(() => `<p class="m-dim">${U.esc(ctx.P[0].nom)} : <b>${a}</b> triangle${a > 1 ? 's' : ''} · ${U.esc(ctx.P[1].nom)} : <b>${b}</b></p>${[0, 1].map((x) => D.built[x].length ? `<p class="m-dim">${U.esc(ctx.P[x].nom)} : ${D.built[x].map((t) => `(${t.map((v) => itemLabel(kind, v)).join(', ')})`).join(' ')}</p>` : '').join('')}`),
        score: ctx.P.map((p) => `${D.built[p.k].length} triangle${D.built[p.k].length > 1 ? 's' : ''}`),
        stats: ctx.P.map((p) => ({ triangles: D.built[p.k].length, perdus: D.lost[p.k] })) });
    }
    render();
  }

  window.__trigone = { deck, makeCard, QUESTIONS, sticksPuzzle, anglesPuzzle, judge, solvable, STAGES, NIV };
  home();
})();
