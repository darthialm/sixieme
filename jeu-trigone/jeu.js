/* =========================================================
   TRIGONE — jeu du chapitre « Triangles », en deux versions : sixième et cinquième.
   Le même fichier sert aux deux sites ; la page choisit la version : <body data-niveau="6"> ou "5".
   Ambiance : un bureau d'architecte (plans bleus, traits à la craie).
   1) LE TRIANGLE MYSTÈRE (un « Qui est-ce ? ») : 12 plans de triangles (codages, angles, longueurs). Un triangle
      est caché. On pose une question (boutons dessinés : isocèle ? rectangle ? angle obtus ?…), le tampon répond
      OUI / NON, puis le joueur barre lui-même les plans éliminés : il doit lire les codages ou calculer le
      3e angle (180°). Barrer un plan qui répond comme le mystère est refusé tout de suite (avec la raison) et
      compte comme une erreur. Peu de questions et aucune erreur = 3 étoiles.
   2) LES CONSTRUCTIONS : une réserve de tuiles d'angles (180°) ou de bâtons (5e : inégalité triangulaire).
      On choisit 3 pièces, on assemble : le dessin montre pourquoi ça tient ou non (les 3 angles mis bout à bout
      font un angle plat, ou il manque / il y a trop ; les deux arcs du compas se croisent, se touchent sur la
      base ou ne se rejoignent pas). Il faut tout utiliser.
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
  const S = U.store(`u${NIV}e-trigone3`);
  S.d.stars = S.d.stars || {};
  const ALL_OPEN = /[?&]tout\b/.test(location.search);
  const Snd = window.Moteur.makeSound(() => !!S.d.mute);
  Snd.flip = function () { this.noise(0.08, 0.12, 2500); };
  Snd.stamp = function () { this.tone(110, 0.15, 'square', 0.07, 60); this.noise(0.1, 0.2, 600); };
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
  /** un triangle d'angles (al, be, ga) dans une boîte w × h */
  function triangle(al, be, ga, margin = 34, w = W, h = H, rot = true) {
    const ac = Math.sin(be * D2R) / Math.sin(ga * D2R);
    let pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: ac * Math.cos(al * D2R), y: ac * Math.sin(al * D2R) }];
    const th = rot ? rand(0, 359) * D2R : 0, flip = rot && Math.random() < 0.5 ? -1 : 1;
    pts = pts.map((p) => ({ x: p.x * Math.cos(th) - p.y * Math.sin(th), y: -(p.x * Math.sin(th) + p.y * Math.cos(th)) * flip }));
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y), bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    const s = Math.min((w - 2 * margin) / bw, (h - 2 * margin) / bh), ox = (w - bw * s) / 2 - Math.min(...xs) * s, oy = (h - bh * s) / 2 - Math.min(...ys) * s;
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
    return `<path d="M${f(V.x)} ${f(V.y)} L${f(p.x)} ${f(p.y)} A${r} ${r} 0 0 0 ${f(q.x)} ${f(q.y)} Z" class="arc"/>` + txt(PA(V, a1 + d / 2 + 180, 30), label, 'val');
  }

  /* =========================================================
     LE TRIANGLE MYSTÈRE : les plans
     ========================================================= */
  function anglesQuelconque(obtus) {
    for (;;) {
      const a = obtus ? rand(105, 140) : rand(40, 80), b = rand(25, 75), c = 180 - a - b, all = [a, b, c];
      if (c < 22 || all.some((x) => Math.abs(x - 90) < 12) || all.some((x, i) => all.some((y, j) => i !== j && Math.abs(x - y) < 8)) || all.some((x) => Math.abs(x - 60) < 3)) continue;
      if (!obtus && Math.max(...all) > 80) continue;
      return shuffle(all);
    }
  }
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
      const sideOf = (i) => [(i + 1) % 3, (i + 2) % 3];
      const groups = [];
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (eq(i, j)) groups.push([i, j]);
      if (pres === 'code') {
        const marked = new Set(); groups.forEach(([i, j]) => { marked.add(i); marked.add(j); });
        marked.forEach((i) => { const [p, q] = sideOf(i); h += ticks(T[p], T[q], 1); });
      } else {
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
      let give;
      const diffPairs = [[0, 1], [0, 2], [1, 2]].filter(([i, j]) => A[i] !== A[j]);
      give = kind === 'equi' ? [0, 1] : diffPairs.length ? pick(diffPairs) : [0, 1];
      if (kind.startsWith('rect') && Math.random() < 0.5) { const r = A.indexOf(90); give = [r, (r + 1) % 3]; }
      c.give = give;
      give.forEach((i) => { h += arcAt(T, i, A[i] + '°'); });
    }
    c.svg = `<svg viewBox="0 0 ${W} ${H}" class="cfig" aria-hidden="true">${h}</svg>`;
    return c;
  }
  const DECK12 = ['equi', 'iso', 'iso', 'isoObt', 'rect', 'rect', 'rectIso', 'quel', 'quel', 'quel', 'quelObt', 'quelObt'];
  function deck(pres) { return shuffle([...DECK12]).map((k, i) => makeCard(k, typeof pres === 'function' ? pres(i, k) : pres)); }
  /** ce qu'on lit sur un plan (pour expliquer un refus) */
  function cardFacts(c) {
    if (c.pres === 'angles') {
      const [i, j] = c.give, k = 3 - i - j;
      return `180° − ${c.A[i]}° − ${c.A[j]}° = <b>${c.A[k]}°</b> : ses angles sont ${[...c.A].sort((a, b) => b - a).join('°, ')}°.`;
    }
    if (c.pres === 'long') return `Longueurs ${c.L.map(num).join(' ; ')}${c.A.includes(90) ? ' et un angle droit codé' : ''}.`;
    const eqs = new Set(c.A).size;
    return `${eqs === 1 ? '3 côtés égaux' : eqs === 2 ? '2 côtés égaux' : 'aucun côté égal'}${c.A.includes(90) ? ', un angle droit' : ''}${Math.max(...c.A) > 90 ? ', un angle obtus' : ''}.`;
  }
  /* les questions, avec leur dessin */
  const QI = {
    iso: '<path d="M22 4 L38 32 L6 32 Z" class="qt"/><path d="M11 16 L17 19 M27 19 L33 16" class="qk"/>',
    equi: '<path d="M22 4 L38 32 L6 32 Z" class="qt"/><path d="M11 16 L17 19 M27 19 L33 16 M22 29 L22 35" class="qk"/>',
    rect: '<path d="M8 4 L8 32 L38 32 Z" class="qt"/><path d="M8 25 L15 25 L15 32" class="qk"/>',
    obt: '<path d="M4 30 L40 30 L12 18 Z" class="qt"/><path d="M17.5 20.4 A6 6 0 0 0 6 22" class="qk"/>',
    aigu: '<path d="M22 5 L38 32 L6 32 Z" class="qt"/><path d="M12 32 A6 6 0 0 0 9 27 M32 32 A6 6 0 0 1 35 27 M19 10 A6 6 0 0 0 25 10" class="qk"/>',
    p80: '<path d="M4 32 L40 32 M4 32 L20 4" class="qt"/><path d="M16 32 A12 12 0 0 0 10 21.6" class="qk"/><text x="30" y="24" class="qx">&gt;80</text>',
    m40: '<path d="M4 32 L40 32 M4 32 L36 16" class="qt"/><path d="M20 32 A16 16 0 0 0 18.6 25" class="qk"/><text x="30" y="12" class="qx">&lt;40</text>',
    orth: '<path d="M4 30 L40 30 L12 18 Z" class="qt"/><path d="M12 18 L12 30 M40 30 L8 8" class="qk2"/><circle cx="12" cy="10" r="3" class="qd"/>',
    circ: '<circle cx="22" cy="19" r="14" class="qk"/><path d="M8 19 L36 19 L14 7 Z" class="qt"/><circle cx="22" cy="19" r="2.8" class="qd"/>',
  };
  const QUESTIONS = [
    { id: 'iso', q: 'Isocèle ?', test: (c) => new Set(c.A).size < 3, note: 'un triangle équilatéral est aussi isocèle' },
    { id: 'equi', q: 'Équilatéral ?', test: (c) => new Set(c.A).size === 1 },
    { id: 'rect', q: 'Rectangle ?', test: (c) => c.A.includes(90) },
    { id: 'obt', q: 'Un angle obtus ?', test: (c) => Math.max(...c.A) > 90 },
    { id: 'aigu', q: '3 angles aigus ?', test: (c) => Math.max(...c.A) < 90 },
    { id: 'p80', q: 'Un angle de plus de 80° ?', test: (c) => Math.max(...c.A) > 80, angles: true },
    { id: 'm40', q: 'Un angle de moins de 40° ?', test: (c) => Math.min(...c.A) < 40, angles: true },
    { id: 'orth', q: 'Orthocentre dehors ?', test: (c) => Math.max(...c.A) > 90, cinq: true, note: 'l’orthocentre est dehors quand le triangle a un angle obtus' },
    { id: 'circ', q: 'Centre du cercle circonscrit sur un côté ?', test: (c) => c.A.includes(90), cinq: true, note: 'c’est le cas quand le triangle est rectangle (milieu de l’hypoténuse)' },
  ];
  const qList = (o) => QUESTIONS.filter((q) => (!q.angles || o.angles) && (!q.cinq || o.cinq));
  const qBtn = (q, dis) => `<button type="button" class="qbtn" data-q="${q.id}" ${dis ? 'disabled' : ''}><svg viewBox="0 0 44 36" aria-hidden="true">${QI[q.id]}</svg><span>${q.q}</span></button>`;
  const consistent = (asked, c) => asked.every((a) => a.q.test(c) === a.ans);
  /** pourquoi on ne peut pas barrer ce plan : la première question à laquelle il répond comme le mystère */
  function whyKeep(asked, c) {
    const a = asked[asked.length - 1];
    return `Ce plan répond <b>${a.ans ? 'OUI' : 'NON'}</b> à « ${a.q.q} », comme le mystère : on le garde. ${cardFacts(c)}`;
  }

  /* =========================================================
     LES CONSTRUCTIONS : tuiles d'angles (180°) ou bâtons (inégalité triangulaire)
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
  function judge(kind, vals) {
    if (kind === 'angles') {
      const s = vals.reduce((x, y) => x + y, 0);
      return s === 180 ? { ok: true, why: `${vals.join('° + ')}° = 180° ✔` } : { ok: false, why: `${vals.join('° + ')}° = ${s}° : ${s < 180 ? `il manque ${180 - s}°` : `${s - 180}° de trop`} pour faire <b>180°</b>.` };
    }
    const v = [...vals].sort((a, b) => a - b), s = Math.round((v[0] + v[1]) * 10) / 10;
    if (v[2] < s) return { ok: true, why: `${num(v[2])} < ${num(v[0])} + ${num(v[1])} = ${num(s)} ✔` };
    if (v[2] === s) return { ok: false, flat: true, why: `${num(v[2])} = ${num(v[0])} + ${num(v[1])} : <b>aplati</b>, les arcs se touchent sur la base.` };
    return { ok: false, why: `${num(v[2])} > ${num(v[0])} + ${num(v[1])} = ${num(s)} : les deux petits bâtons sont <b>trop courts</b>, ils ne se rejoignent pas.` };
  }
  function solvable(kind, items) {
    if (!items.length) return true;
    if (items.length % 3) return false;
    const [x, ...rest] = items;
    for (let i = 0; i < rest.length; i++) for (let j = i + 1; j < rest.length; j++) {
      if (judge(kind, [x.v, rest[i].v, rest[j].v]).ok && solvable(kind, rest.filter((_, k) => k !== i && k !== j))) return true;
    }
    return false;
  }
  /* --- les dessins d'assemblage (l'explication en image) --- */
  const PIE = ['pa', 'pb', 'pc'];
  /** les 3 angles mis bout à bout sur une droite : angle plat ou pas */
  function anglesFig(vals, small) {
    const w = 260, h = 150, O = { x: 130, y: 128 }, r = 96;
    let h0 = `<svg viewBox="0 0 ${w} ${h}" class="afig${small ? ' small' : ''}" aria-hidden="true"><line x1="10" y1="${O.y}" x2="${w - 10}" y2="${O.y}" class="base"/>`;
    let a = 0;
    vals.forEach((v, i) => {
      const p = PA(O, a, r), q = PA(O, a + v, r), M = PA(O, a + v / 2, r * 0.62);
      h0 += `<path d="M${O.x} ${O.y} L${f(p.x)} ${f(p.y)} A${r} ${r} 0 ${v > 180 ? 1 : 0} 0 ${f(q.x)} ${f(q.y)} Z" class="pie ${PIE[i]}" style="animation-delay:${i * 0.25}s"/>`;
      h0 += `<text x="${f(M.x)}" y="${f(M.y)}" class="pv" text-anchor="middle" dominant-baseline="central" style="animation-delay:${i * 0.25}s">${v}°</text>`;
      a += v;
    });
    if (a !== 180) {
      const p = PA(O, Math.min(a, 180), r + 10), q = PA(O, Math.max(a, 180), r + 10);
      h0 += `<path d="M${f(p.x)} ${f(p.y)} A${r + 10} ${r + 10} 0 0 0 ${f(q.x)} ${f(q.y)}" class="gap"/>`;
      const T = PA(O, (a + 180) / 2, r + 24);
      h0 += `<text x="${f(T.x)}" y="${f(T.y)}" class="gapt" text-anchor="middle" dominant-baseline="central">${a < 180 ? `−${180 - a}°` : `+${a - 180}°`}</text>`;
    } else h0 += `<text x="${O.x}" y="${O.y + 14}" class="okt" text-anchor="middle">180° ✔</text>`;
    return h0 + '</svg>';
  }
  /** au compas : la plus grande base, deux arcs */
  function sticksFig(vals, small) {
    const w = 260, h = 150, v = [...vals].sort((a, b) => a - b), [a, b, c] = v;
    let h0 = `<svg viewBox="0 0 ${w} ${h}" class="afig${small ? ' small' : ''}" aria-hidden="true">`;
    if (v.length < 3) {
      // 1 ou 2 bâtons choisis : on les pose simplement
      const s1 = Math.min(200 / v[v.length - 1], 26);
      v.forEach((x, i) => { const y = 60 + i * 44, x0 = (w - x * s1) / 2; h0 += `<line x1="${f(x0)}" y1="${y}" x2="${f(x0 + x * s1)}" y2="${y}" class="stk ${i ? 'sb' : 'sa'}"/>` + txt({ x: w / 2, y: y - 14 }, num(x), 'pv dark'); });
      return h0 + '</svg>';
    }
    const s = Math.min(200 / c, 26), A = { x: (w - c * s) / 2, y: 128 }, B = { x: A.x + c * s, y: 128 };
    h0 += `<line x1="${f(A.x)}" y1="${A.y}" x2="${f(B.x)}" y2="${B.y}" class="stk sc"/>` + txt({ x: (A.x + B.x) / 2, y: 141 }, num(c), 'pv dark');
    const ra = a * s, rb = b * s;
    h0 += `<path d="M${f(A.x + ra)} ${A.y} A${f(ra)} ${f(ra)} 0 0 0 ${f(A.x - ra)} ${A.y}" class="cmp ca"/>`;
    h0 += `<path d="M${f(B.x + rb)} ${B.y} A${f(rb)} ${f(rb)} 0 0 0 ${f(B.x - rb)} ${B.y}" class="cmp cb"/>`;
    const d = c * s;
    if (ra + rb > d + 0.01) {
      const x = (d * d + ra * ra - rb * rb) / (2 * d), y = Math.sqrt(Math.max(0, ra * ra - x * x)), C = { x: A.x + x, y: A.y - y };
      h0 += `<path d="M${f(A.x)} ${A.y} L${f(C.x)} ${f(C.y)} L${f(B.x)} ${B.y}" class="stk sab"/><circle cx="${f(C.x)}" cy="${f(C.y)}" r="5" class="meet"/>`;
      h0 += txt(mid(A, C), num(a), 'pv') + txt(mid(B, C), num(b), 'pv');
    } else {
      const ea = { x: A.x + ra, y: A.y }, eb = { x: B.x - rb, y: B.y };
      h0 += `<line x1="${f(A.x)}" y1="${A.y}" x2="${f(ea.x)}" y2="${ea.y}" class="stk sa"/><line x1="${f(B.x)}" y1="${B.y}" x2="${f(eb.x)}" y2="${eb.y}" class="stk sb"/>`;
      h0 += txt({ x: (A.x + ea.x) / 2, y: 112 }, num(a), 'pv') + txt({ x: (B.x + eb.x) / 2, y: 112 }, num(b), 'pv');
      if (Math.abs(ra + rb - d) < 0.01) h0 += `<circle cx="${f(ea.x)}" cy="${A.y}" r="6" class="flatpt"/>`;
      else h0 += `<line x1="${f(ea.x)}" y1="${A.y - 6}" x2="${f(eb.x)}" y2="${A.y - 6}" class="gap"/>`;
    }
    return h0 + '</svg>';
  }
  const asmFig = (kind, vals, small) => (kind === 'angles' ? anglesFig(vals, small) : sticksFig(vals, small));
  /** une pièce de la réserve */
  function pieceHTML(kind, it, cls = '', dis = false) {
    let ic;
    if (kind === 'angles') {
      const r = 22, O = { x: 6, y: 30 }, q = PA(O, it.v, r);
      ic = `<svg viewBox="-20 0 54 34" class="pic" aria-hidden="true"><path d="M${O.x} ${O.y} L${O.x + r} ${O.y} A${r} ${r} 0 0 0 ${f(q.x)} ${f(q.y)} Z" class="pw"/><path d="M${O.x + 30} ${O.y} L${O.x} ${O.y} L${f(PA(O, it.v, 30).x)} ${f(PA(O, it.v, 30).y)}" class="pl"/></svg>`;
    } else ic = `<span class="stick" style="width:${Math.min(100, it.v * 6.5 + 8)}%"></span>`;
    return `<button type="button" class="item ${kind}${cls}" data-id="${it.id}" ${dis ? 'disabled' : ''}>${ic}<b>${kind === 'angles' ? `${it.v}°` : num(it.v)}</b></button>`;
  }

  /* =========================================================
     Les plans (étapes)
     ========================================================= */
  const pres6 = (i) => (i % 2 ? 'code' : 'angles');
  const STAGES = NIV === 6 ? [
    { id: 's1', name: 'Les codages', tag: 'Mystère · lire un codage', game: 'myst', deck: () => deck('code'), q: { angles: false }, rounds: 3, demo: true },
    { id: 's2', name: 'Les angles', tag: 'Mystère · 3e angle (180°)', game: 'myst', deck: () => deck('angles'), q: { angles: true }, rounds: 3 },
    { id: 's3', name: 'Plans mélangés', tag: 'Mystère · codages et angles', game: 'myst', deck: () => deck(pres6), q: { angles: false }, rounds: 3 },
    { id: 's4', name: 'La charpente', tag: 'Construire · 180°, 2 triangles', game: 'build', kind: 'angles', gen: () => anglesPuzzle(2, true), rounds: 3, demo: true },
    { id: 's5', name: 'Le toit', tag: 'Construire · 3 triangles', game: 'build', kind: 'angles', gen: () => anglesPuzzle(3, false), rounds: 3 },
    { id: 's6', name: 'Mystère expert', tag: 'Trouver en 4 questions', game: 'myst', deck: () => deck(pres6), q: { angles: true }, rounds: 3, expert: true },
    { id: 's7', name: 'La tour', tag: 'Construire · 4 triangles', game: 'build', kind: 'angles', gen: () => anglesPuzzle(4, false), rounds: 2, boss: true },
  ] : [
    { id: 's1', name: 'Les côtés', tag: 'Mystère · codages et longueurs', game: 'myst', deck: () => deck((i) => (i % 2 ? 'code' : 'long')), q: { angles: false }, rounds: 3, noObt: true, demo: true },
    { id: 's2', name: 'Le pont', tag: 'Construire · inégalité triangulaire', game: 'build', kind: 'sticks', gen: () => sticksPuzzle(3, false), rounds: 3, demo: true },
    { id: 's3', name: 'Les angles', tag: 'Mystère · 180°', game: 'myst', deck: () => deck('angles'), q: { angles: true }, rounds: 3 },
    { id: 's4', name: 'Le pont au mm', tag: 'Construire · décimaux', game: 'build', kind: 'sticks', gen: () => sticksPuzzle(3, true), rounds: 3 },
    { id: 's5', name: 'Points remarquables', tag: 'Mystère · orthocentre, cercle', game: 'myst', deck: () => deck('angles'), q: { angles: true, cinq: true }, rounds: 3 },
    { id: 's6', name: 'La charpente', tag: 'Construire · 180°', game: 'build', kind: 'angles', gen: () => anglesPuzzle(3, false), rounds: 3 },
    { id: 's7', name: 'Mystère expert', tag: 'Trouver en 4 questions', game: 'myst', deck: () => deck((i) => ['code', 'angles', 'long'][i % 3]), q: { angles: true, cinq: true }, rounds: 3, expert: true, boss: true },
  ];
  const unlocked = (i) => ALL_OPEN || i === 0 || (S.d.stars[STAGES[i - 1].id] || 0) > 0;
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;
  const LEGEND = '<div class="legend"><span><svg viewBox="0 0 40 20"><line x1="2" y1="14" x2="38" y2="14" class="lg"/><line x1="20" y1="6" x2="20" y2="20" class="lg"/></svg>même trait = côtés égaux</span><span><svg viewBox="0 0 24 20"><path d="M4 2 L4 18 L20 18 M4 10 L12 10 L12 18" class="lg"/></svg>angle droit</span><span>△ = 180°</span></div>';

  /* =========================================================
     Écrans
     ========================================================= */
  let G = null, demoT = null;
  const stopDemo = () => { if (demoT) clearTimeout(demoT); demoT = null; };
  function home() {
    G = null; stopDemo();
    const total = STAGES.reduce((s, z) => s + (S.d.stars[z.id] || 0), 0);
    const nextI = STAGES.findIndex((z, i) => unlocked(i) && !S.d.stars[z.id]);
    app.innerHTML = `<div class="screen home">
      <header class="brand"><svg viewBox="0 0 100 86" class="logo" aria-hidden="true"><path d="M50 4 L96 82 L4 82 Z"/><path d="M50 4 L50 82 M27 43 L73 43" class="lt"/></svg>
        <div><h1>TRIGONE</h1><p class="sub">l’atelier des triangles · ${NOM_NIV} · ★ ${total}/${STAGES.length * 3}</p></div></header>
      <div class="board">${STAGES.map((z, i) => { const lock = !unlocked(i), st = S.d.stars[z.id] || 0; return `<button type="button" class="sheet g-${z.game}${z.boss ? ' boss' : ''}${lock ? ' locked' : ''}${i === nextI ? ' next' : ''}" data-z="${i}" ${lock ? 'disabled' : ''}>
        <span class="no">PLAN ${String(i + 1).padStart(2, '0')}</span><span class="ico" aria-hidden="true">${lock ? '🔒' : z.game === 'myst' ? '🔍' : z.kind === 'sticks' ? '📏' : '📐'}</span><span class="nm">${z.name}</span><span class="rl">${z.tag}</span><span class="st">${starStr(st)}</span></button>`; }).join('')}</div>
      <button type="button" class="duel-btn" data-act="duel"><span aria-hidden="true">⚔️</span> <b>Duel</b><small>à deux, chacun son tour : triangle mystère ou course aux triangles</small></button></div>`;
    app.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => { Snd.init(); brief(STAGES[Number(b.dataset.z)]); }));
    app.querySelector('[data-act="duel"]').addEventListener('click', () => { Snd.init(); duel(); });
  }

  /* ---------- La règle, montrée ---------- */
  function brief(Z) {
    stopDemo();
    const myst = Z.game === 'myst';
    app.innerHTML = `<div class="screen brief"><p class="kicker">PLAN ${String(STAGES.indexOf(Z) + 1).padStart(2, '0')} · ${Z.tag}</p><h2 class="bt">${Z.name}</h2>
      <div class="demo"><div class="dstage" id="dstage"></div>
        <div class="steps">${myst ? `
          <div class="step" data-s="0"><span class="si">❓</span><span>Pose une <b>question</b></span></div>
          <div class="step" data-s="1"><span class="si stampi">OUI<br>NON</span><span>Le tampon répond</span></div>
          <div class="step" data-s="2"><span class="si">✗</span><span><b>Barre</b> les plans qui ne vont pas</span></div>
          <div class="step" data-s="3"><span class="si">☝️</span><span>Sûr de toi ? <b>C’est lui !</b></span></div>` : `
          <div class="step" data-s="0"><span class="si">👆👆👆</span><span>Choisis <b>3</b> ${Z.kind === 'angles' ? 'angles' : 'bâtons'}</span></div>
          <div class="step" data-s="1"><span class="si">🔨</span><span><b>Assemble</b> : ${Z.kind === 'angles' ? 'ils doivent faire un angle plat (180°)' : 'les deux arcs doivent se croiser'}</span></div>
          <div class="step" data-s="2"><span class="si">🏗️</span><span>Utilise <b>toutes</b> les pièces</span></div>`}
        </div></div>
      ${myst ? LEGEND : ''}
      <p class="goal">${myst ? `★★★ : ${Z.expert ? '4 questions au plus' : 'peu de questions'} et aucun plan barré à tort.` : '★★★ : aucun effondrement. Attention, un triangle qui tient peut bloquer la suite !'}</p>
      <div class="row"><button type="button" class="btn ghost" data-act="back">← Plans</button><button type="button" class="btn go" data-act="go">▶ Commencer</button></div></div>`;
    app.querySelector('[data-act="back"]').addEventListener('click', home);
    app.querySelector('[data-act="go"]').addEventListener('click', () => { stopDemo(); G = { Z, r: 0, stars: [] }; myst ? mystRound() : buildRound(); });
    app.querySelector('[data-act="go"]').focus();
    myst ? demoMyst() : demoBuild(Z.kind);
  }
  function loop(host, frames, render) {
    let k = 0;
    const step = () => {
      if (!document.body.contains(host)) return;
      const fr = frames[k % frames.length];
      host.innerHTML = render(fr);
      document.querySelectorAll('.step').forEach((e) => e.classList.toggle('on', Number(e.dataset.s) === fr.s));
      k++; demoT = setTimeout(step, fr.t || 1200);
    };
    step();
  }
  function demoMyst() {
    const cards = U.withSeed(5, () => [makeCard('rect', 'code'), makeCard('iso', 'code'), makeCard('quelObt', 'code'), makeCard('equi', 'code')]);
    const q = QUESTIONS.find((x) => x.id === 'rect');
    const frames = [{ s: 0, fq: true }, { s: 1, stamp: true }, { s: 2, stamp: true, fc: 1 }, { s: 2, stamp: true, out: [1], fc: 2 }, { s: 2, stamp: true, out: [1, 2], fc: 3 },
      { s: 3, stamp: true, out: [1, 2, 3], fc: 0, acc: true }, { s: 3, stamp: true, out: [1, 2, 3], win: true, t: 2000 }];
    loop(document.getElementById('dstage'), frames, (fr) => `<div class="dmyst"><div class="dq">${qBtn(q)}${fr.fq ? '<span class="dfinger">👆</span>' : ''}${fr.stamp ? '<span class="stamp no">NON</span>' : ''}</div>
      <div class="dcards">${cards.map((c, i) => `<div class="tcard${(fr.out || []).includes(i) ? ' out' : ''}${fr.win && i === 0 ? ' secret' : ''}${fr.acc ? ' acc' : ''}">${c.svg}${fr.fc === i ? '<span class="dfinger">👆</span>' : ''}</div>`).join('')}</div></div>`);
  }
  function demoBuild(kind) {
    const good = kind === 'angles' ? [70, 50, 60] : [4, 5, 7], bad = kind === 'angles' ? [70, 50, 40] : [2, 3, 7];
    const it = (v, i) => ({ id: i, v });
    const frames = [{ s: 0, sel: [0] }, { s: 0, sel: [0, 1] }, { s: 0, sel: [0, 1, 2] }, { s: 1, fig: bad, t: 2200 }, { s: 0, set: good, sel: [0, 1, 2] }, { s: 1, set: good, fig: good, t: 2200 }, { s: 2, set: good, fig: good, tri: true, t: 1800 }];
    loop(document.getElementById('dstage'), frames, (fr) => {
      const set = fr.set || bad;
      return `<div class="dbuild"><div class="pool">${set.map((v, i) => pieceHTML(kind, it(v, i), (fr.sel || []).includes(i) ? ' sel' : '', true)).join('')}</div>
        <div class="bench">${fr.fig ? asmFig(kind, fr.fig) : '<div class="bempty">🔨</div>'}${fr.tri ? '<span class="tri-ok">△ ✔</span>' : ''}</div></div>`;
    });
  }
  function hud() {
    const Z = G.Z;
    return `<div class="hud"><button type="button" class="quit" data-act="quit" aria-label="Arrêter">✕</button><span class="zn">${Z.name}</span><span class="dots">${Array.from({ length: Z.rounds }, (_, i) => `<i class="${G.stars[i] === 3 ? 'ok' : G.stars[i] ? 'mid' : i === G.r ? 'cur' : ''}"></i>`).join('')}</span><span class="zn right" id="hudinfo"></span></div>`;
  }
  const bindQuit = () => app.querySelector('[data-act="quit"]').addEventListener('click', () => { if (confirm('Quitter ce plan ?')) home(); });

  /* ---------- Triangle mystère (solo) ---------- */
  function mystRound() {
    const Z = G.Z;
    if (G.r >= Z.rounds) { endStage(); return; }
    G.m = { cards: Z.deck(), secret: rand(0, 11), out: new Set(), asked: [], accuse: false, done: false, err: 0, msg: '', refused: null,
      qs: qList(Z.q).filter((q) => !(Z.noObt && (q.id === 'obt' || q.id === 'aigu'))) };
    app.innerHTML = `<div class="screen play">${hud()}<div class="myst"><div class="grid" id="grid"></div>
      <div class="mside"><div class="answer" id="answer"></div><div class="qs" id="qs"></div>
      <div class="row"><button type="button" class="btn accuse" data-act="acc">☝️ C’est lui !</button></div><div class="msg" id="msg"></div><div class="asked" id="asked"></div></div></div>${LEGEND}</div>`;
    bindQuit();
    app.querySelector('[data-act="acc"]').addEventListener('click', () => { if (G.m.done) return; G.m.accuse = !G.m.accuse; mystDraw(); });
    mystDraw();
  }
  function mystDraw() {
    const M = G.m;
    document.getElementById('hudinfo').innerHTML = `❓ ${M.asked.length}${G.Z.expert ? '/4' : ''} · <span class="ko">✗ ${M.err}</span>`;
    const grid = document.getElementById('grid');
    grid.innerHTML = M.cards.map((c, i) => `<button type="button" class="tcard${M.out.has(i) ? ' out' : ''}${M.accuse && !M.out.has(i) ? ' acc' : ''}${M.done && i === M.secret ? ' secret' : ''}${M.refused === i ? ' refused' : ''}" data-i="${i}"><span class="cn">${i + 1}</span>${c.svg}</button>`).join('');
    grid.classList.toggle('accusing', M.accuse);
    grid.querySelectorAll('.tcard').forEach((b) => U.tap(b, () => cardTap(Number(b.dataset.i))));
    const last = M.asked[M.asked.length - 1];
    document.getElementById('answer').innerHTML = last ? `<span class="aq">${last.q.q}</span><span class="stamp ${last.ans ? 'yes' : 'no'}" key="${M.asked.length}">${last.ans ? 'OUI' : 'NON'}</span>` : '<span class="aq dim">Pose une question ↓</span>';
    document.getElementById('qs').innerHTML = M.qs.map((q) => qBtn(q, M.asked.some((a) => a.q.id === q.id) || M.done || M.accuse)).join('');
    document.querySelectorAll('#qs .qbtn').forEach((b) => U.tap(b, () => ask(b.dataset.q)));
    document.getElementById('asked').innerHTML = M.asked.slice(0, -1).map((a) => `<span class="qa"><svg viewBox="0 0 44 36">${QI[a.q.id]}</svg><b class="${a.ans ? 'yes' : 'no'}">${a.ans ? 'OUI' : 'NON'}</b></span>`).join('');
    const acc = app.querySelector('[data-act="acc"]'); if (acc) { acc.textContent = M.accuse ? '✋ Annuler' : '☝️ C’est lui !'; acc.disabled = M.done; acc.classList.toggle('on', M.accuse); }
    document.getElementById('msg').innerHTML = M.accuse && !M.done ? '<div class="explain warn">☝️ Touche le plan que tu accuses. Raté = manche perdue !</div>' : M.msg;
    M.refused = null;
  }
  function ask(id) {
    const M = G.m; if (M.done || M.accuse) return;
    const q = M.qs.find((x) => x.id === id), ans = q.test(M.cards[M.secret]);
    M.asked.push({ q, ans }); Snd.stamp();
    M.msg = `<div class="explain">${ans ? 'OUI' : 'NON'} : barre les plans qui ne répondent pas <b>${ans ? 'OUI' : 'NON'}</b>.</div>`;
    mystDraw();
  }
  function cardTap(i) {
    const M = G.m; if (M.done) return;
    if (M.accuse) { accuse(i); return; }
    if (M.out.has(i)) return;
    if (!M.asked.length) { M.msg = '<div class="explain warn">Pose d’abord une question !</div>'; mystDraw(); return; }
    if (consistent(M.asked, M.cards[i])) {
      M.err++; Snd.bad(); M.refused = i;
      M.msg = `<div class="explain bad">✗ Plan ${i + 1} : ${whyKeep(M.asked, M.cards[i])}</div>`;
      mystDraw(); return;
    }
    M.out.add(i); Snd.flip(); M.msg = '';
    const left = M.cards.filter((c, k) => !M.out.has(k)).length;
    if (left === 1) M.msg = '<div class="explain good">Il ne reste qu’un plan : ☝️ <b>C’est lui !</b></div>';
    mystDraw();
  }
  function accuse(i) {
    const M = G.m; M.done = true; M.accuse = false;
    const ok = i === M.secret, nq = M.asked.length, Z = G.Z;
    const base = !ok ? 0 : Z.expert ? (nq <= 4 ? 3 : nq <= 5 ? 2 : 1) : nq <= 5 ? 3 : nq <= 7 ? 2 : 1;
    const stars = ok ? Math.max(1, base - (M.err >= 3 ? 2 : M.err >= 1 ? 1 : 0)) : 0;
    G.stars[G.r] = stars; G.r++;
    if (ok) { Snd.win(); U.confetti(20 + stars * 15, ['#ffffff', '#ffd166', '#7fd3ff', '#ff8fa3']); } else Snd.lose();
    const sec = M.cards[M.secret];
    M.msg = `<div class="explain ${ok ? 'good' : 'bad'}"><b>${ok ? `Trouvé en ${nq} question${nq > 1 ? 's' : ''} !` : `Raté : c’était le plan ${M.secret + 1}.`}</b> <span class="stars">${starStr(stars)}</span><br>${cardFacts(sec)}${M.err ? `<br><small>Plans barrés à tort : ${M.err}.</small>` : ''}</div>
      <button type="button" class="btn go" data-act="nx">${G.r >= G.Z.rounds ? 'Bilan' : 'Manche suivante ▶'}</button>`;
    mystDraw();
    app.querySelector('[data-act="nx"]').addEventListener('click', mystRound);
  }

  /* ---------- Constructions (solo) ---------- */
  function buildRound() {
    const Z = G.Z;
    if (G.r >= Z.rounds) { endStage(); return; }
    G.b = { items: Z.gen(), built: [], sel: [], crash: 0, done: false, fig: '', msg: '' };
    G.b.start = G.b.items.map((x) => ({ ...x }));
    app.innerHTML = `<div class="screen play">${hud()}<div class="build">
      <div class="frame" id="frame"></div>
      <div class="bench" id="bench"></div>
      <div class="pool" id="pool"></div>
      <div class="row"><button type="button" class="btn go big" data-act="mk">🔨 Assembler</button><button type="button" class="btn ghost" data-act="reset">↺ Tout démonter</button></div><div class="msg" id="msg"></div></div></div>`;
    bindQuit();
    app.querySelector('[data-act="mk"]').addEventListener('click', assemble);
    app.querySelector('[data-act="reset"]').addEventListener('click', () => { const B = G.b; if (B.done) return; B.items = B.start.map((x) => ({ ...x })); B.built = []; B.sel = []; B.crash++; B.fig = ''; B.msg = '<div class="explain warn">Tout est démonté (compte comme un effondrement). Cherche une autre répartition !</div>'; buildDraw(); });
    buildDraw();
  }
  function frameHTML(kind, built, total) {
    return `<div class="slots">${Array.from({ length: total }, (_, k) => { const t = built[k]; return `<div class="slot${t ? ' full' : ''}">${t ? `<svg viewBox="0 0 120 90" aria-hidden="true">${(() => { const A = kind === 'angles' ? t : null; const T = A ? triangle(...A, 12, 120, 90, false) : null; if (T) return `<polygon points="${T.map((p) => `${f(p.x)},${f(p.y)}`).join(' ')}" class="tri"/>`; const v = [...t].sort((a, b) => a - b), [a, b, c] = v, x = (c * c + a * a - b * b) / (2 * c), y = Math.sqrt(Math.max(0, a * a - x * x)), s = Math.min(96 / c, 70 / (y || 1)); return `<polygon points="12,80 ${f(12 + c * s)},80 ${f(12 + x * s)},${f(80 - y * s)}" class="tri"/>`; })()}</svg><span>${t.map((v) => (kind === 'angles' ? `${v}°` : num(v))).join(' · ')}</span>` : '<span class="tri-empty">△</span>'}</div>`; }).join('')}</div>`;
  }
  function buildDraw() {
    const B = G.b, Z = G.Z;
    document.getElementById('hudinfo').innerHTML = `<span class="ko">💥 ${B.crash}</span>`;
    document.getElementById('frame').innerHTML = frameHTML(Z.kind, B.built, B.start.length / 3);
    document.getElementById('bench').innerHTML = B.fig || (B.sel.length ? asmFig(Z.kind, B.sel.map((id) => B.items.find((x) => x.id === id).v), false).replace('class="afig', 'class="afig preview') : `<div class="bempty">Choisis 3 ${Z.kind === 'angles' ? 'angles' : 'bâtons'} 👇</div>`);
    document.getElementById('pool').innerHTML = B.items.map((it) => pieceHTML(Z.kind, it, B.sel.includes(it.id) ? ' sel' : '', B.done)).join('');
    document.querySelectorAll('#pool .item').forEach((b) => U.tap(b, () => {
      if (B.done) return; const id = Number(b.dataset.id), k = B.sel.indexOf(id);
      if (k >= 0) B.sel.splice(k, 1); else if (B.sel.length < 3) B.sel.push(id);
      B.fig = ''; Snd.key(); buildDraw();
    }));
    document.getElementById('msg').innerHTML = B.msg;
    const mk = app.querySelector('[data-act="mk"]'); if (mk) mk.disabled = B.sel.length !== 3 || B.done;
  }
  function assemble() {
    const B = G.b, Z = G.Z;
    if (B.done || B.sel.length !== 3) return;
    const vals = B.sel.map((id) => B.items.find((x) => x.id === id).v), j = judge(Z.kind, vals);
    B.fig = asmFig(Z.kind, vals, false);
    if (!j.ok) {
      B.crash++; Snd.crash(); B.sel = [];
      B.msg = `<div class="explain bad">💥 <b>${j.flat ? 'Aplati !' : 'Ça ne tient pas !'}</b> ${j.why}</div>`;
      buildDraw();
      const be = document.getElementById('bench'); be.classList.remove('shake'); void be.offsetWidth; be.classList.add('shake');
      return;
    }
    B.items = B.items.filter((x) => !B.sel.includes(x.id)); B.built.push(vals); B.sel = [];
    Snd.build();
    if (!B.items.length) {
      B.done = true;
      const stars = B.crash === 0 ? 3 : B.crash === 1 ? 2 : 1;
      G.stars[G.r] = stars; G.r++; Snd.win(); U.confetti(stars * 20, ['#ffffff', '#ffd166', '#7fd3ff']);
      B.msg = `<div class="explain good"><b>🏗️ Construction terminée !</b> <span class="stars">${starStr(stars)}</span></div><button type="button" class="btn go" data-act="nx">${G.r >= Z.rounds ? 'Bilan' : 'Construction suivante ▶'}</button>`;
      buildDraw();
      app.querySelector('[data-act="nx"]').addEventListener('click', buildRound);
      return;
    }
    const stuck = !solvable(Z.kind, B.items);
    B.msg = `<div class="explain ${stuck ? 'warn' : 'good'}">✔ ${j.why}${stuck ? '<br>⚠️ Mais avec ce qui reste, impossible de tout assembler… <b>↺ Démonte</b> et répartis autrement.' : ''}</div>`;
    buildDraw();
  }
  function endStage() {
    const Z = G.Z, idx = STAGES.indexOf(Z), next = STAGES[idx + 1];
    const avg = G.stars.reduce((a, b) => a + b, 0) / G.stars.length, stars = avg >= 2.6 ? 3 : avg >= 1.6 ? 2 : avg > 0.5 ? 1 : 0;
    const old = S.d.stars[Z.id] || 0; S.d.stars[Z.id] = Math.max(old, stars); S.save();
    if (stars) { Snd.win(); U.confetti(stars * 30, ['#ffffff', '#ffd166', '#7fd3ff']); } else Snd.lose();
    app.innerHTML = `<div class="screen brief"><p class="kicker">PLAN ${String(idx + 1).padStart(2, '0')}</p><h2 class="bt">${stars ? `${Z.name} : validé` : 'À refaire'}</h2>
      <div class="bigstars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>
      ${stars ? '<span class="stamp big yes">APPROUVÉ</span>' : ''}
      <p class="goal">${Z.game === 'myst' ? 'La meilleure question coupe les plans en deux moitiés. Et on ne barre que ce qui est sûr !' : 'Astuce : commence par les plus grandes pièces, ce sont elles qui posent problème.'}</p>
      <div class="row"><button type="button" class="btn ghost" data-act="home">← Plans</button><button type="button" class="btn${next && stars ? '' : ' go'}" data-act="again">↻ Recommencer</button>${next && stars ? '<button type="button" class="btn go" data-act="next">Plan suivant ▶</button>' : ''}</div></div>`;
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
    { id: 'angles', nom: 'Course aux triangles : angles', desc: 'Des angles qui font 180°' },
  ];
  function duel() {
    window.Moteur.match({ jeu: `trigone-${NIV}e`, titre: 'Trigone', niveauScolaire: NOM_NIV, theme: 'trigone', icone: '📐', sound: Snd, modes: MODES, quitter: home,
      start: (ctx) => (ctx.mode === 'myst' ? duelMyst(ctx) : duelBuild(ctx)) });
  }
  function duelMyst(ctx) {
    const cards = deck(NIV === 5 ? (i) => ['code', 'angles', 'long'][i % 3] : pres6);
    const qs = qList({ angles: true, cinq: NIV === 5 });
    const secret = [rand(0, 11), 0]; do { secret[1] = rand(0, 11); } while (secret[1] === secret[0]);
    // le joueur k cherche secret[1 - k]
    const D = { turn: rand(0, 1), phase: 'ask', out: [new Set(), new Set()], asked: [[], []], accuse: [false, false], err: [0, 0], msg: ['', ''] };
    const nm = (k) => U.esc(ctx.P[k].nom);
    function render() {
      ctx.turn(D.turn);
      ctx.P.forEach((p) => {
        const k = p.k, mine = D.turn === k, el = p.el, last = D.asked[k][D.asked[k].length - 1];
        el.innerHTML = `<div class="dm"><div class="dmhead"><b>${nm(k)}</b><span>cherche le triangle de ${nm(1 - k)}</span><span class="ko">✗ ${D.err[k]}</span></div>
          <div class="dgrid${D.accuse[k] ? ' accusing' : ''}">${cards.map((c, i) => `<button type="button" class="tcard${D.out[k].has(i) ? ' out' : ''}${D.accuse[k] && mine && !D.out[k].has(i) ? ' acc' : ''}" data-i="${i}"><span class="cn">${i + 1}</span>${c.svg}</button>`).join('')}</div>
          <div class="dbar">${last ? `<span class="aq">${last.q.q}</span><span class="stamp ${last.ans ? 'yes' : 'no'}">${last.ans ? 'OUI' : 'NON'}</span>` : ''}
            <p class="m-turnmsg">${!mine ? `⏳ ${nm(1 - k)} joue…` : D.accuse[k] ? '☝️ Touche le plan accusé !' : D.phase === 'ask' ? '❓ Pose une question' : '✗ Barre les plans, puis « Fin du tour »'}</p></div>
          <div class="dqs">${mine && D.phase === 'ask' && !D.accuse[k] ? qs.map((q) => qBtn(q, D.asked[k].some((a) => a.q.id === q.id))).join('') : ''}</div>
          <div class="m-row"><button type="button" class="m-btn m-ghost dend" ${mine && D.phase === 'flip' ? '' : 'disabled'}>Fin du tour ▶</button><button type="button" class="m-btn dacc" ${mine ? '' : 'disabled'}>${D.accuse[k] ? '✋ Annuler' : '☝️ C’est lui !'}</button></div>
          <div class="dlog">${D.msg[k]}</div></div>`;
        el.querySelectorAll('.dgrid .tcard').forEach((b) => U.tap(b, () => tapCard(k, Number(b.dataset.i))));
        el.querySelectorAll('.dqs .qbtn').forEach((b) => U.tap(b, () => askD(k, b.dataset.q)));
        U.tap(el.querySelector('.dend'), () => { if (D.turn !== k || D.phase !== 'flip') return; D.turn = 1 - k; D.phase = 'ask'; D.msg = ['', '']; render(); });
        U.tap(el.querySelector('.dacc'), () => { if (D.turn !== k) return; D.accuse[k] = !D.accuse[k]; render(); });
      });
    }
    function askD(k, id) {
      if (D.turn !== k || D.phase !== 'ask') return;
      const q = qs.find((x) => x.id === id), ans = q.test(cards[secret[1 - k]]);
      D.asked[k].push({ q, ans }); D.phase = 'flip'; Snd.stamp();
      D.msg[1 - k] = `${nm(k)} demande « ${q.q} » : <b>${ans ? 'OUI' : 'NON'}</b>`; D.msg[k] = '';
      render();
    }
    function tapCard(k, i) {
      if (D.turn !== k) return;
      if (D.accuse[k]) {
        const ok = i === secret[1 - k], w = ok ? k : 1 - k;
        const sec = (j) => `<p class="m-dim">Le triangle de ${nm(j)} était le plan ${secret[j] + 1} : ${cardFacts(cards[secret[j]])}</p>`;
        ctx.end({ winner: w, text: ctx.P.map((p) => `<p class="m-kick">${ok ? `${nm(k)} a trouvé le plan ${i + 1} !` : `${nm(k)} a accusé le plan ${i + 1}… raté !`}</p>${sec(1 - p.k)}${sec(p.k)}<p class="m-dim">Plans barrés à tort : ${D.err[p.k]}.</p>`),
          score: ctx.P.map((p) => `${D.asked[p.k].length} question${D.asked[p.k].length > 1 ? 's' : ''}`),
          stats: ctx.P.map((p) => ({ questions: D.asked[p.k].length, erreurs: D.err[p.k] })) });
        return;
      }
      if (D.phase !== 'flip' || D.out[k].has(i)) return;
      if (consistent(D.asked[k], cards[i])) { D.err[k]++; Snd.bad(); D.msg[k] = `<span class="ko">✗ Plan ${i + 1} : ${whyKeep(D.asked[k], cards[i])}</span>`; render(); return; }
      D.out[k].add(i); Snd.flip(); D.msg[k] = ''; render();
    }
    render();
  }
  function duelBuild(ctx) {
    const kind = ctx.mode;
    const pool = kind === 'angles' ? anglesPuzzle(4, false) : sticksPuzzle(4, false);
    const D = { turn: rand(0, 1), pool, hand: [[], []], built: [[], []], lost: [0, 0], sel: [[], []], fig: ['', ''], log: '', took: false };
    const nm = (k) => U.esc(ctx.P[k].nom);
    function render() {
      ctx.turn(D.turn);
      ctx.P.forEach((p) => {
        const k = p.k, mine = D.turn === k, el = p.el;
        el.innerHTML = `<div class="db"><div class="dmhead"><b>${nm(k)}</b><span>△ <b>${D.built[k].length}</b> · ${nm(1 - k)} △ <b>${D.built[1 - k].length}</b></span></div>
          <p class="pick">📦 Réserve commune ${mine && !D.took ? '— prends une pièce' : ''}</p><div class="dpool">${D.pool.map((it) => pieceHTML(kind, it, '', !(mine && !D.took))).join('') || '<i class="dim">vide</i>'}</div>
          <p class="pick">✋ Ma main ${mine ? '— choisis 3 pièces' : ''}</p><div class="dhand">${D.hand[k].map((it) => pieceHTML(kind, it, D.sel[k].includes(it.id) ? ' sel' : '', !mine)).join('') || '<i class="dim">vide</i>'}</div>
          <div class="dbench">${D.fig[k] || (D.sel[k].length ? asmFig(kind, D.sel[k].map((id) => D.hand[k].find((x) => x.id === id).v), true) : '')}</div>
          <p class="m-turnmsg">${!mine ? `⏳ ${nm(1 - k)} joue…` : !D.took && D.pool.length ? '📦 Prends une pièce' : '🔨 Construis si tu peux, puis « Fin du tour »'}</p>
          <div class="m-row"><button type="button" class="m-btn m-go dmk" ${mine && D.sel[k].length === 3 ? '' : 'disabled'}>🔨 Construire</button><button type="button" class="m-btn m-ghost dend" ${mine && (D.took || !D.pool.length) ? '' : 'disabled'}>Fin du tour ▶</button></div>
          <div class="dlog">${D.log}</div></div>`;
        el.querySelectorAll('.dpool .item').forEach((b) => U.tap(b, () => takeD(k, Number(b.dataset.id))));
        el.querySelectorAll('.dhand .item').forEach((b) => U.tap(b, () => { if (D.turn !== k) return; const id = Number(b.dataset.id), s = D.sel[k], j = s.indexOf(id); if (j >= 0) s.splice(j, 1); else if (s.length < 3) s.push(id); D.fig[k] = ''; render(); }));
        U.tap(el.querySelector('.dmk'), () => build(k));
        U.tap(el.querySelector('.dend'), () => endTurn(k));
      });
    }
    function takeD(k, id) {
      if (D.turn !== k || D.took) return;
      const i = D.pool.findIndex((x) => x.id === id); if (i < 0) return;
      D.hand[k].push(D.pool.splice(i, 1)[0]); D.took = true; Snd.key();
      D.log = `${nm(k)} prend ${kind === 'angles' ? `${D.hand[k][D.hand[k].length - 1].v}°` : num(D.hand[k][D.hand[k].length - 1].v)}.`;
      render();
    }
    function build(k) {
      if (D.turn !== k || D.sel[k].length !== 3) return;
      const items = D.sel[k].map((id) => D.hand[k].find((x) => x.id === id)), vals = items.map((x) => x.v), j = judge(kind, vals);
      D.hand[k] = D.hand[k].filter((x) => !D.sel[k].includes(x.id)); D.sel[k] = []; D.fig[k] = asmFig(kind, vals, true);
      if (j.ok) { D.built[k].push(vals); Snd.build(); D.log = `🔨 ${nm(k)} construit un triangle : ${j.why}`; }
      else { D.lost[k] += 3; Snd.crash(); D.log = `💥 ${nm(k)} : ${j.why} Les 3 pièces sont perdues.`; }
      render();
    }
    function endTurn(k) {
      if (D.turn !== k || (!D.took && D.pool.length)) return;
      D.took = false; D.sel[k] = []; D.fig = ['', ''];
      if (!D.pool.length) { D.final = (D.final === undefined ? 2 : D.final) - 1; if (D.final <= 0) { finish(); return; } }
      D.turn = 1 - k; render();
    }
    function finish() {
      const a = D.built[0].length, b = D.built[1].length, w = a > b ? 0 : b > a ? 1 : null;
      ctx.end({ winner: w, text: ctx.P.map(() => `<p class="m-dim">${nm(0)} : <b>${a}</b> triangle${a > 1 ? 's' : ''} · ${nm(1)} : <b>${b}</b></p>`),
        score: ctx.P.map((p) => `${D.built[p.k].length} triangle${D.built[p.k].length > 1 ? 's' : ''}`),
        stats: ctx.P.map((p) => ({ triangles: D.built[p.k].length, perdus: D.lost[p.k] })) });
    }
    render();
  }

  window.__trigone = { deck, makeCard, QUESTIONS, sticksPuzzle, anglesPuzzle, judge, solvable, STAGES, NIV, get G() { return G; } };
  home();
})();
