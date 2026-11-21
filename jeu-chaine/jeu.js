/* =========================================================
   LES ANGLES EN CHAÎNE · sixième — jeu du chapitre « Les angles » de 6e
   Une figure : des droites et des demi-droites de même origine O, avec des codages (angle droit,
   bissectrice) et deux ou trois mesures données. Il faut trouver TOUS les angles marqués « ? », de proche
   en proche. Pour remplir un angle, l'élève tape sa mesure ET choisit la propriété qui la justifie :
   opposés par le sommet, points alignés (180°), angle droit (90°), bissectrice, angles adjacents (somme).
   La propriété doit permettre de trouver CET angle maintenant (avec les angles déjà connus) : on construit
   la chaîne de déductions, comme dans une rédaction (« … et … sont opposés par le sommet, donc … »).
   Duel (tour par tour, moteur commun) : même figure ; chacun son tour remplit un angle juste ET bien
   justifié pour le gagner ; une erreur passe la main. Celui qui gagne le plus d'angles l'emporte.
   Adresse avec ?tout : toutes les figures sont ouvertes (pour le professeur).
   ========================================================= */
(function () {
  'use strict';
  const { U } = window.Moteur;
  const { rand, pick, shuffle } = U;
  const app = document.getElementById('app');
  const S = U.store('u6e-angles-chaine');
  S.d.stars = S.d.stars || {};
  const ALL_OPEN = /[?&]tout\b/.test(location.search);
  const Snd = window.Moteur.makeSound(() => !!S.d.mute);
  Snd.link = function () { [523, 659, 784].forEach((f, i) => this.tone(f, 0.1, 'triangle', 0.06, 0, i * 0.06)); };
  const muteBtn = document.getElementById('mute');
  const syncMute = () => { muteBtn.textContent = S.d.mute ? '🔇' : '🔊'; };
  muteBtn.addEventListener('click', () => { S.d.mute = !S.d.mute; S.save(); syncMute(); Snd.init(); });
  syncMute();

  /* =========================================================
     La figure
     F = { dirs: [angles des demi-droites, triés], L: [lettres], cases: [{ i, j, v }] (angle entre la demi-droite i et la suivante),
           cons: [contraintes], given: Set(cases données), comp: [{ from, n, v }] (angles composés donnés) }
     Contraintes :  { t: 'opp', a, b }        case a = case b (opposés par le sommet)
                    { t: 'bis', a, b, ray }   case a = case b ([O ray) bissectrice)
                    { t: 'plat', set, from, to } somme des cases = 180 (de la demi-droite from à son opposée to)
                    { t: 'droit', set, from, to } somme = 90 (angle droit codé)
                    { t: 'adj', set, v, from, to } somme = v (angle composé donné)
     ========================================================= */
  const norm = (a) => ((a % 360) + 360) % 360;
  const ccw = (a, b) => norm(b - a); // écart de a vers b dans le sens direct
  const LET = 'ABCDEFGHIJKLMNPRSTUVZ'.replace('O', '');

  function buildFigure(o) {
    for (let tries = 0; tries < 400; tries++) {
      const dirs = new Set(), pairs = [], rights = [], bisec = [];
      const a = rand(0, 179);
      const add = (d) => { d = norm(Math.round(d)); for (const x of dirs) { const g = Math.min(ccw(x, d), ccw(d, x)); if (g < 16) return null; } dirs.add(d); return d; };
      add(a); add(a + 180); pairs.push([norm(a), norm(a + 180)]);
      if (o.lines >= 2) { const b = a + pick([1, -1]) * rand(35, 75); if (add(b) !== null && add(b + 180) !== null) pairs.push([norm(b), norm(b + 180)]); else continue; }
      if (o.perp) { const up = Math.random() < 0.5, p = norm(a + (up ? 90 : -90)); if (add(p) === null) continue; rights.push(up ? [norm(a), p] : [p, norm(a)]); } // [début, fin] dans le sens direct
      for (let k = 0; k < (o.extra || 0); k++) add(a + rand(10, 350));
      let D = [...dirs].sort((x, y) => x - y);
      if (o.bis) {
        // une bissectrice dans un angle assez grand, de mesure paire
        const cand = D.map((d, i) => ({ d, e: D[(i + 1) % D.length] })).filter(({ d, e }) => ccw(d, e) >= 44 && ccw(d, e) <= 150 && ccw(d, e) % 2 === 0);
        if (!cand.length) continue;
        const c = pick(cand), m = norm(c.d + ccw(c.d, c.e) / 2);
        dirs.add(m); bisec.push({ u: c.d, b: m, w: c.e });
        D = [...dirs].sort((x, y) => x - y);
      }
      if (D.length > (o.maxRays || 8) || D.length < 3) continue;
      // les cases : angles entre deux demi-droites consécutives (plus petits que 180°)
      const n = D.length, cases = D.map((d, i) => ({ i, j: (i + 1) % n, v: ccw(d, D[(i + 1) % n]) }));
      if (cases.some((c) => c.v >= 180 || c.v < 14)) continue;
      const idx = (d) => D.indexOf(norm(d));
      const span = (from, to) => { const out = []; let i = idx(from); while (D[i] !== norm(to)) { out.push(i); i = (i + 1) % n; } return out; };
      const cons = [];
      pairs.forEach(([p, q]) => { cons.push({ t: 'plat', set: span(p, q), from: idx(p), to: idx(q) }); cons.push({ t: 'plat', set: span(q, p), from: idx(q), to: idx(p) }); });
      rights.forEach(([p, q]) => cons.push({ t: 'droit', set: span(p, q), from: idx(p), to: idx(q) }));
      // opposés par le sommet : une case (p, q) dont les demi-droites opposées existent et sont consécutives
      cases.forEach((c, i) => { const op = D.indexOf(norm(D[c.i] + 180)), oq = D.indexOf(norm(D[c.j] + 180)); if (op >= 0 && oq >= 0 && (op + 1) % n === oq && i < op) cons.push({ t: 'opp', a: i, b: op }); });
      bisec.forEach(({ u, b, w }) => cons.push({ t: 'bis', a: idx(u), b: idx(b), ray: idx(b), from: idx(u), to: idx(w) }));
      // angles composés donnés (adjacents)
      const comp = [];
      for (let k = 0; k < (o.comp || 0); k++) {
        const s = rand(0, n - 1), m = 2, set = [s, (s + 1) % n], v = set.reduce((t, i) => t + cases[i].v, 0);
        if (v >= 180 || comp.some((c) => c.set.some((x) => set.includes(x)))) continue;
        comp.push({ set, v, from: s, to: (s + m) % n });
        cons.push({ t: 'adj', set, v, from: s, to: (s + m) % n });
      }
      if (!cons.some((c) => c.t === 'opp' || c.t === 'bis' || c.t === 'droit' || c.t === 'adj') && !o.lines) continue;
      const F = { dirs: D, L: shuffle([...LET]).slice(0, n), cases, cons, comp, bisec, rights: rights.map(([p, q]) => [idx(p), idx(q)]) };
      if (!chooseGivens(F, o)) continue;
      return F;
    }
    return null;
  }
  /** cases qu'une contrainte permet de trouver, connaissant `known` */
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
    // longueur de la chaîne : nombre d'étapes successives nécessaires
    let known = new Set(given), steps = 0;
    while (known.size < n) { const nx = new Set(known); for (const c of F.cons) for (const i of deducible(c, known)) nx.add(i); known = nx; steps++; }
    if (n - given.size < (o.minFind || 3) || steps < (o.minSteps || 1)) return false;
    F.given = given; F.steps = steps;
    return true;
  }

  /* ---------- Noms et phrases ---------- */
  const ang = (s) => `<span class="m-ang">${s}</span>`;
  const caseName = (F, i) => F.L[F.cases[i].i] + 'O' + F.L[F.cases[i].j];
  const rayName = (F, r) => `[O${F.L[r]})`;
  const angleFromTo = (F, from, to) => F.L[from] + 'O' + F.L[to];
  const RULES = [
    { id: 'opp', nom: 'Opposés par le sommet' },
    { id: 'plat', nom: 'Points alignés (180°)' },
    { id: 'droit', nom: 'Angle droit (90°)' },
    { id: 'bis', nom: 'Bissectrice' },
    { id: 'adj', nom: 'Adjacents (somme)' },
  ];
  /** la contrainte de type t qui permet de trouver la case i maintenant (ou null) */
  const usable = (F, t, i, known) => F.cons.find((c) => c.t === t && deducible(c, known).includes(i)) || null;
  function sentence(F, c, i) {
    const v = F.cases[i].v, nm = ang(caseName(F, i));
    if (c.t === 'opp' || c.t === 'bis') {
      const o = c.a === i ? c.b : c.a;
      return c.t === 'opp' ? `${nm} et ${ang(caseName(F, o))} sont opposés par le sommet, donc ${nm} = ${ang(caseName(F, o))} = ${v}°.`
        : `${rayName(F, c.ray)} est la bissectrice de ${ang(angleFromTo(F, c.from, c.to))}, donc ${nm} = ${ang(caseName(F, o))} = ${v}°.`;
    }
    const others = c.set.filter((x) => x !== i), tot = c.t === 'plat' ? 180 : c.t === 'droit' ? 90 : c.v;
    const head = c.t === 'plat' ? `${F.L[c.from]}, O et ${F.L[c.to]} sont alignés, donc ${ang(angleFromTo(F, c.from, c.to))} = 180°.`
      : c.t === 'droit' ? `${ang(angleFromTo(F, c.from, c.to))} est un angle droit (90°).` : `${ang(angleFromTo(F, c.from, c.to))} = ${c.v}° et ses angles adjacents s’ajoutent.`;
    const parts = c.set.map((x) => ang(caseName(F, x))).join(' + ');
    return `${head} ${parts} = ${tot}°, donc ${nm} = ${tot}° − ${others.map((x) => F.cases[x].v + '°').join(' − ')} = ${v}°.`;
  }

  /* ---------- Dessin ---------- */
  const W = 400, H = 300, O = { x: 200, y: 150 }, R = 128;
  const P = (a, L) => ({ x: O.x + L * Math.cos((a * Math.PI) / 180), y: O.y - L * Math.sin((a * Math.PI) / 180) });
  const f = (n) => n.toFixed(1);
  function wedge(a1, a2, r, cls, attrs = '') {
    const p = P(a1, r), q = P(a2, r), big = ccw(a1, a2) > 180 ? 1 : 0;
    return `<path d="M${O.x} ${O.y} L${f(p.x)} ${f(p.y)} A${r} ${r} 0 ${big} 0 ${f(q.x)} ${f(q.y)} Z" class="${cls}" ${attrs}/>`;
  }
  /** st = { known: Map(i → { by: k }), sel, owner: Map(i → k) } */
  function figSVG(F, st) {
    const D = F.dirs, n = D.length;
    let h = `<svg viewBox="0 0 ${W} ${H}" class="cfig" role="img" aria-label="Figure : demi-droites de même origine O">`;
    // angles composés donnés : grand arc
    F.comp.forEach((c) => {
      const a1 = D[c.from], a2 = D[c.to];
      // l'étiquette se place à côté de la demi-droite du milieu (et pas dessus)
      let m = a1 + ccw(a1, a2) / 2; if (D.some((d) => Math.min(ccw(d, m), ccw(m, d)) < 7)) m += Math.min(9, ccw(a1, a2) / 4);
      const T = P(m, 106);
      h += wedge(a1, a2, 96, 'comp') + `<text x="${f(T.x)}" y="${f(T.y)}" class="cval" text-anchor="middle" dominant-baseline="central">${c.v}°</text>`;
    });
    F.cases.forEach((c, i) => {
      const a1 = D[c.i], mid = a1 + c.v / 2, r = c.v < 30 ? 66 : 52;
      const isGiven = F.given.has(i), k = st.known.get(i);
      const cls = isGiven ? 'cg' : k ? `cf p${k.by}` : `cu${st.sel === i ? ' sel' : ''}`;
      h += wedge(a1, a1 + c.v, r - 14, `case ${cls}`, isGiven || k ? '' : `data-i="${i}"`);
      const lp = P(mid, r + (c.v < 30 ? 12 : 4));
      h += `<text x="${f(lp.x)}" y="${f(lp.y)}" class="v ${cls}" text-anchor="middle" dominant-baseline="central">${isGiven || k ? c.v + '°' : '?'}</text>`;
    });
    // codages
    F.rights.forEach(([p, q]) => { const a = D[p], s = 13, A = P(a, s), B = P(a + 90, s), C = { x: A.x + B.x - O.x, y: A.y + B.y - O.y }; h += `<path d="M${f(A.x)} ${f(A.y)} L${f(C.x)} ${f(C.y)} L${f(B.x)} ${f(B.y)}" class="sq"/>`; void q; });
    F.bisec.forEach(({ u, b, w }) => { [[u, b], [b, w]].forEach(([x, y]) => { const m = x + ccw(x, y) / 2; for (const dd of [-3, 3]) { const A = P(m + dd, 30), B = P(m + dd, 40); h += `<line x1="${f(A.x)}" y1="${f(A.y)}" x2="${f(B.x)}" y2="${f(B.y)}" class="tick"/>`; } }); });
    D.forEach((d, i) => { const E = P(d, R); h += `<line x1="${O.x}" y1="${O.y}" x2="${f(E.x)}" y2="${f(E.y)}" class="ray${F.bisec.some((b) => b.b === d) ? ' bis' : ''}"/>`; const T = P(d, R + 14); h += `<text x="${f(T.x)}" y="${f(T.y)}" class="lbl" text-anchor="middle" dominant-baseline="central">${F.L[i]}</text>`; });
    h += `<circle cx="${O.x}" cy="${O.y}" r="3.5" class="dot"/><text x="${O.x + 10}" y="${O.y + 14}" class="lbl">O</text>`;
    // zones à toucher (au-dessus du reste)
    F.cases.forEach((c, i) => { if (!F.given.has(i) && !st.known.has(i)) h += wedge(D[c.i], D[c.i] + c.v, R - 6, 'hit', `data-i="${i}"`); });
    return h + '</svg>';
  }
  /** les données de la figure, écrites en texte (pour lire « points alignés », « bissectrice »…) */
  function factsHTML(F) {
    const D = F.dirs, out = [];
    const seen = new Set();
    F.cons.filter((c) => c.t === 'plat').forEach((c) => { const k = [c.from, c.to].sort().join(); if (seen.has(k)) return; seen.add(k); out.push(`${F.L[c.from]}, O, ${F.L[c.to]} alignés`); });
    F.rights.forEach(([p, q]) => out.push(`${ang(angleFromTo(F, p, q))} droit`));
    F.bisec.forEach(({ u, b, w }) => out.push(`${rayName(F, D.indexOf(b))} bissectrice de ${ang(angleFromTo(F, D.indexOf(u), D.indexOf(w)))}`));
    F.comp.forEach((c) => out.push(`${ang(angleFromTo(F, c.from, c.to))} = ${c.v}°`));
    return out.length ? `<p class="facts">${out.join(' · ')}</p>` : '';
  }

  /* =========================================================
     Les étapes (solo)
     ========================================================= */
  const LEVELS = [
    { id: 'n1', icon: '✖️', name: 'Deux droites', tag: 'Opposés par le sommet, points alignés', o: { lines: 2, minFind: 3 } },
    { id: 'n2', icon: '➖', name: 'Points alignés', tag: 'Supplémentaires (180°)', o: { lines: 1, extra: 2, minFind: 2 } },
    { id: 'n3', icon: '📐', name: 'Angle droit', tag: 'Complémentaires (90°)', o: { lines: 1, perp: true, extra: 1, minFind: 3 } },
    { id: 'n4', icon: '✂️', name: 'Bissectrice', tag: 'Deux angles égaux', o: { lines: 1, extra: 2, bis: true, minFind: 3 } },
    { id: 'n5', icon: '➕', name: 'Adjacents', tag: 'Un grand angle découpé', o: { lines: 1, extra: 2, comp: 1, minFind: 3 } },
    { id: 'n6', icon: '🔗', name: 'Longues chaînes', tag: 'Plusieurs étapes', o: { lines: 2, extra: 2, bis: true, minFind: 5, minSteps: 3, maxRays: 8 } },
    { id: 'n7', icon: '🏆', name: 'Le grand défi', tag: 'Tout le chapitre', boss: true, o: { lines: 2, perp: true, bis: true, comp: 1, minFind: 5, minSteps: 3, maxRays: 8 } },
  ];
  const ROUNDS = 3;
  const unlocked = (i) => ALL_OPEN || i === 0 || (S.d.stars[LEVELS[i - 1].id] || 0) > 0;
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;
  const figure = (o) => { for (let t = 0; t < 30; t++) { const F = buildFigure(o); if (F) return F; } return buildFigure({ lines: 2, minFind: 2 }); };

  let G = null;
  const guide = (html) => `<div class="guide"><span class="face" aria-hidden="true">🦉</span><div class="say">${html}</div></div>`;
  function home() {
    G = null;
    const total = LEVELS.reduce((s, z) => s + (S.d.stars[z.id] || 0), 0);
    const nextI = LEVELS.findIndex((z, i) => unlocked(i) && !S.d.stars[z.id]);
    app.innerHTML = `<div class="screen">
      <header class="brand"><h1>Angles <span>en chaîne</span></h1><span class="lvl">sixième</span></header>
      <p class="tag">Trouve tous les angles… et dis pourquoi. · <b>⭐ ${total} / ${LEVELS.length * 3}</b></p>
      ${guide(!S.d.intro ? 'Une figure, deux ou trois mesures… et des <b>?</b> partout. Touche un angle, tape sa mesure et choisis la <b>propriété</b> qui permet de la trouver. Il faut trouver le bon ordre : certains angles ne se calculent qu’après d’autres !' : pick(['Un angle juste mais mal justifié ne compte pas !', 'Par où commencer ? Cherche un angle qu’on peut trouver <b>tout de suite</b>.', 'Défie un camarade en <b>duel</b> : chacun son tour, le plus d’angles gagne.']))}
      <button type="button" class="duel-btn" data-act="duel">⚔️ <b>Duel</b> <small>à deux sur la tablette, chacun son tour : gagne le plus d’angles</small></button>
      <div class="map">${LEVELS.map((z, i) => { const lock = !unlocked(i), st = S.d.stars[z.id] || 0; return `<button type="button" class="zone${z.boss ? ' boss' : ''}${lock ? ' locked' : ''}${i === nextI ? ' next' : ''}" data-z="${i}" ${lock ? 'disabled' : ''}>
        <span class="num">${i + 1}</span><span class="ico">${lock ? '🔒' : z.icon}</span><span class="nm">${z.name}</span><span class="rl">${z.tag}</span><span class="st">${starStr(st)}</span></button>`; }).join('')}</div>
      <p class="foot">3 figures par étape. ⭐⭐⭐ = aucune erreur. Ta progression reste sur cet appareil.</p></div>`;
    app.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => { Snd.init(); S.d.intro = true; S.save(); G = { Z: LEVELS[Number(b.dataset.z)], r: 0, stars: [] }; round(); }));
    app.querySelector('[data-act="duel"]').addEventListener('click', () => { Snd.init(); duel(); });
  }
  function round() {
    if (G.r >= ROUNDS) { endLevel(); return; }
    G.F = figure(G.Z.o); G.st = { known: new Map(), sel: null }; G.err = 0; G.wrong = new Map(); G.log = [];
    draw();
  }
  function draw(msg = '') {
    const F = G.F, Z = G.Z, left = F.cases.length - F.given.size - G.st.known.size;
    app.innerHTML = `<div class="screen play"><div class="hud"><button type="button" class="quit" data-act="quit" aria-label="Arrêter">✕</button><span class="zn">${Z.icon} ${Z.name}</span>
      <span class="dots">${Array.from({ length: ROUNDS }, (_, i) => `<i class="${G.stars[i] === 3 ? 'ok' : G.stars[i] ? 'mid' : i === G.r ? 'cur' : ''}"></i>`).join('')}</span><span class="zn right">❓ ${left} · ✗ ${G.err}</span></div>
      <div class="game"><div class="field">${figSVG(F, G.st)}${factsHTML(F)}</div>
      <div class="side" id="side">${G.st.sel === null ? '<p class="ask">Touche un angle « ? » de la figure.</p>' : ''}<div id="form"></div><div class="msg" id="msg">${msg}</div>
      <div class="log">${G.log.map((l) => `<p>${l}</p>`).join('')}</div></div></div></div>`;
    app.querySelector('[data-act="quit"]').addEventListener('click', () => { if (confirm('Quitter cette figure ?')) home(); });
    app.querySelectorAll('.field [data-i]').forEach((el) => U.tap(el, () => { G.st.sel = Number(el.dataset.i); Snd.key(); draw(); }));
    if (G.st.sel !== null) form(document.getElementById('form'), F, G.st.sel, (v, rule) => submit(v, rule), true);
  }
  /** le formulaire : mesure + propriété */
  function form(host, F, i, cb, keyboard) {
    let rule = null;
    host.innerHTML = `<p class="ask">${ang(caseName(F, i))} = <b>?</b></p><div class="rules">${RULES.map((r) => `<button type="button" class="rule-b" data-r="${r.id}">${r.nom}</button>`).join('')}</div><div class="fpad"></div>`;
    host.querySelectorAll('.rule-b').forEach((b) => U.tap(b, () => { rule = b.dataset.r; host.querySelectorAll('.rule-b').forEach((x) => x.classList.toggle('on', x === b)); Snd.key(); }));
    window.Moteur.pad(host.querySelector('.fpad'), { unit: '°', ok: '✔ Valider', keyboard, sound: Snd, onSubmit: (v) => { if (!rule) { host.querySelector('.rules').classList.add('need'); return; } cb(v, rule); } });
  }
  /** vérifie une réponse ; renvoie { ok, half, msg, sentence } */
  function judge(F, known, i, v, rule) {
    const c = F.cases[i], cons = usable(F, rule, i, known);
    if (v !== c.v) return { ok: false, msg: `Non, ${ang(caseName(F, i))} ne mesure pas ${v}°.${cons ? ' La propriété choisie est la bonne : refais le calcul.' : ''}` };
    if (!cons) {
      const good = RULES.filter((r) => usable(F, r.id, i, known));
      return { ok: false, half: true, msg: `La mesure ${v}° est juste, mais « ${RULES.find((r) => r.id === rule).nom} » ne permet pas de la trouver ici${good.length ? '' : ' (aucune propriété ne permet de la trouver pour l’instant : commence par un autre angle !)'}.` };
    }
    return { ok: true, sentence: sentence(F, cons, i) };
  }
  function submit(v, rule) {
    const i = G.st.sel, F = G.F, known = new Set([...F.given, ...G.st.known.keys()]);
    const r = judge(F, known, i, v, rule);
    if (!r.ok) {
      G.err++; Snd.bad();
      const w = (G.wrong.get(i) || 0) + 1; G.wrong.set(i, w);
      if (w >= 3) {
        // troisième erreur sur le même angle : on montre la solution (s'il est trouvable maintenant)
        const how = RULES.map((x) => usable(F, x.id, i, known)).find(Boolean);
        if (how) { G.st.known.set(i, { by: 0 }); G.log.push('💡 ' + sentence(F, how, i)); G.st.sel = null; draw(`<div class="explain">${r.msg}<br>💡 La solution : ${sentence(F, how, i)}</div>`); checkDone(); return; }
      }
      draw(`<div class="explain">${r.msg}</div>`);
      return;
    }
    Snd.link();
    G.st.known.set(i, { by: 1 }); G.st.sel = null; G.log.push('✔ ' + r.sentence);
    draw(`<div class="explain good">✔ ${r.sentence}</div>`);
    checkDone();
  }
  function checkDone() {
    const F = G.F;
    if (F.given.size + G.st.known.size < F.cases.length) return;
    const stars = G.err === 0 ? 3 : G.err <= 2 ? 2 : 1;
    G.stars[G.r] = stars; G.r++;
    Snd.win(); U.confetti(stars * 20);
    document.getElementById('msg').insertAdjacentHTML('beforeend', `<div class="explain good"><b>🎉 Tous les angles sont trouvés !</b> ${'⭐'.repeat(stars)}</div><button type="button" class="btn go" data-act="nx">${G.r >= ROUNDS ? 'Bilan' : 'Figure suivante ▶'}</button>`);
    app.querySelector('[data-act="nx"]').addEventListener('click', round);
  }
  function endLevel() {
    const Z = G.Z, idx = LEVELS.indexOf(Z), next = LEVELS[idx + 1];
    const avg = G.stars.reduce((a, b) => a + b, 0) / G.stars.length, stars = avg >= 2.6 ? 3 : avg >= 1.6 ? 2 : 1;
    const old = S.d.stars[Z.id] || 0; S.d.stars[Z.id] = Math.max(old, stars); S.save();
    app.innerHTML = `<div class="screen"><div class="card"><p class="kicker">Étape ${idx + 1} · ${Z.name}</p><h1 class="center">${stars === 3 ? 'Chaîne parfaite !' : 'Étape réussie'}</h1>
      <div class="stars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>
      ${guide(stars === 3 ? 'Toutes les mesures, toutes les justifications : bravo !' : 'Pour 3 étoiles : aucune erreur. Avant de taper une mesure, demande-toi quelle propriété la donne.')}
      ${!old && next ? `<p class="center unlock">🔓 Étape ouverte : ${next.icon} ${next.name}</p>` : ''}
      <div class="row"><button type="button" class="btn ghost" data-act="home">← Étapes</button><button type="button" class="btn${next ? '' : ' go'}" data-act="again">↻ Rejouer</button>${next ? '<button type="button" class="btn go" data-act="next">Étape suivante ▶</button>' : ''}</div></div></div>`;
    app.querySelector('[data-act="home"]').addEventListener('click', home);
    app.querySelector('[data-act="again"]').addEventListener('click', () => { G = { Z, r: 0, stars: [] }; round(); });
    app.querySelector('[data-act="next"]')?.addEventListener('click', () => { G = { Z: next, r: 0, stars: [] }; round(); });
  }

  /* =========================================================
     DUEL : une figure commune, chacun son tour remplit un angle (juste ET justifié) pour le gagner
     ========================================================= */
  const MODES = [
    { id: '1', nom: 'Figure simple', desc: 'Opposés, alignés', o: { lines: 2, extra: 2, minFind: 4, maxRays: 7 } },
    { id: '2', nom: 'Figure moyenne', desc: 'Avec angle droit ou bissectrice', o: { lines: 2, perp: true, extra: 2, minFind: 5, minSteps: 2, maxRays: 8 } },
    { id: '3', nom: 'Grande figure', desc: 'Tout le chapitre, longues chaînes', o: { lines: 2, bis: true, extra: 3, comp: 1, minFind: 6, minSteps: 3, maxRays: 10 } },
  ];
  function duel() {
    window.Moteur.match({ jeu: 'angles-chaine-6e', titre: 'Angles en chaîne', niveauScolaire: 'sixième', theme: 'chaine', icone: '🔗', sound: Snd, modes: MODES, quitter: home,
      start: (ctx) => duelPlay(ctx) });
  }
  function duelPlay(ctx) {
    const M = MODES.find((m) => m.id === ctx.mode) || MODES[0];
    const F = figure(M.o);
    const D = { turn: rand(0, 1), known: new Map(), sel: [null, null], score: [0, 0], errors: [0, 0], log: '' };
    ctx.P.forEach((p) => {
      p.el.innerHTML = `<div class="dz"><div class="dhead"><span>${p.k === 0 ? '🟦' : '🟥'} ${U.esc(p.nom)}</span><span class="dsc"></span></div><div class="dfield"></div><p class="m-turnmsg"></p><div class="dform"></div><div class="dmsg"></div></div>`;
    });
    function render() {
      ctx.turn(D.turn);
      ctx.P.forEach((p) => {
        const k = p.k, mine = D.turn === k, el = p.el;
        el.querySelector('.dsc').innerHTML = `Angles : 🟦 ${D.score[0]} · 🟥 ${D.score[1]}`;
        el.querySelector('.dfield').innerHTML = figSVG(F, { known: D.known, sel: mine ? D.sel[k] : null }) + factsHTML(F);
        el.querySelector('.m-turnmsg').textContent = mine ? (D.sel[k] === null ? 'À toi : touche un angle « ? ».' : 'Mesure et propriété :') : `Au tour de ${ctx.P[1 - k].nom}…`;
        if (mine) el.querySelectorAll('.dfield [data-i]').forEach((x) => U.tap(x, () => { D.sel[k] = Number(x.dataset.i); Snd.key(); render(); }));
        const fh = el.querySelector('.dform');
        if (mine && D.sel[k] !== null) form(fh, F, D.sel[k], (v, rule) => play(k, v, rule), false); else fh.innerHTML = '';
        el.querySelector('.dmsg').innerHTML = D.log;
      });
    }
    function play(k, v, rule) {
      if (D.turn !== k) return;
      const i = D.sel[k], known = new Set([...F.given, ...D.known.keys()]), r = judge(F, known, i, v, rule);
      D.sel[k] = null;
      if (r.ok) { D.known.set(i, { by: k === 0 ? 'A' : 'B' }); D.score[k]++; Snd.link(); D.log = `✔ ${U.esc(ctx.P[k].nom)} gagne ${ang(caseName(F, i))} : ${r.sentence}`; }
      else { D.errors[k]++; Snd.bad(); D.log = `✗ ${U.esc(ctx.P[k].nom)} se trompe sur ${ang(caseName(F, i))}${r.half ? ' (mesure juste, mauvaise justification)' : ''}. À l’autre !`; }
      if (F.given.size + D.known.size >= F.cases.length) {
        const w = D.score[0] > D.score[1] ? 0 : D.score[1] > D.score[0] ? 1 : null;
        ctx.end({ winner: w, score: [0, 1].map((x) => `${D.score[x]} angle${D.score[x] > 1 ? 's' : ''}`), stats: [0, 1].map((x) => ({ angles: D.score[x], erreurs: D.errors[x] })),
          text: [0, 1].map(() => `<p class="m-dim">🟦 ${U.esc(ctx.P[0].nom)} : <b>${D.score[0]}</b> angle${D.score[0] > 1 ? 's' : ''} · 🟥 ${U.esc(ctx.P[1].nom)} : <b>${D.score[1]}</b></p><p class="m-dim">Erreurs : ${D.errors[0]} et ${D.errors[1]}.</p>`) });
        return;
      }
      D.turn = 1 - k; render();
    }
    render();
  }

  window.__chaine = { buildFigure, closure, judge, sentence, LEVELS, MODES, figure, usable, RULES, caseName };
  home();
})();
