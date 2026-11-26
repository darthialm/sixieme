/* =========================================================
   Région 7 — LE CHANTIER DES CHARPENTIERS · chapitre « Triangles »
   Attendus : vocabulaire (côté, sommet, angle) ; triangles rectangle, isocèle, équilatéral ; codages ;
   construire un triangle à partir de 3 longueurs (règle et compas) ; programme de construction ;
   isocèle : angles à la base égaux. (Différent de Trigone : ici on construit vraiment au compas.)
   Énigmes :
     commande   des plans à main levée (le dessin ment, le codage dit vrai) : donner chaque plan à la bonne
                maison, puis coder soi-même un plan sans codage.
     compas     construire la charpente : [AB] à la règle graduée, écartement du compas réglé sur une règle,
                arc depuis A, arc depuis B, toucher l'intersection. Puis un isocèle : sommet principal.
     programme  les étapes de Ferdinand dans le désordre : l'apprenti les suit TELLES QUELLES ; puis une étape
                à compléter d'après une figure à main levée codée.
   Gardien : la Grande Charpente (commande « dure » + construction d'un isocèle et angles à la base).
   ========================================================= */
(function () {
  'use strict';
  const { h, svg: S, geo } = Atlas;
  const VW = 800, VH = 500, SC = 32, YB = 320;   // SC : pixels par centimètre
  const cm = (x) => Atlas.fmt(x) + ' cm';
  const halves = (r, a, b) => r.int(a * 2, b * 2) / 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const U = (p, q) => { const d = Math.hypot(q.x - p.x, q.y - p.y) || 1; return { x: (q.x - p.x) / d, y: (q.y - p.y) / d }; };
  const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
  const later = (host, f, ms) => setTimeout(() => { if (host.isConnected) f(); }, ms);
  const ORANGE = '#d9480f';

  /* ---------- Données : triangles constructibles, ni plats ni trop grands ---------- */
  function triOK(a, b, c) {
    if (a + b < c + 1 || a + c < b + 1 || b + c < a + 1) return false;
    const s = (a + b + c) / 2, area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
    const hgt = (2 * area) / c;                 // hauteur au-dessus de [AB]
    return hgt >= 2.5 && hgt <= 8;
  }
  // AB = c (posé à la règle), AC = b, BC = a
  function genScal(r) {
    for (let i = 0; i < 500; i++) {
      const a = halves(r, 3, 9), b = halves(r, 3, 9), c = halves(r, 3, 9);
      if (Math.abs(a - b) < 1 || Math.abs(a - c) < 1 || Math.abs(b - c) < 1) continue;
      if (triOK(a, b, c)) return { a, b, c };
    }
    return { a: 5, b: 7, c: 6 };
  }
  // isocèle : sommet principal A, B ou C (les deux côtés égaux s'y rejoignent)
  function genIso(r, fix) {
    for (let i = 0; i < 500; i++) {
      const L = halves(r, 3, 9), base = halves(r, 3, 9);
      if (Math.abs(L - base) < 1) continue;
      const princ = fix || r.pick(['A', 'B', 'C']);
      const T = princ === 'C' ? { a: L, b: L, c: base } : princ === 'A' ? { a: base, b: L, c: L } : { a: L, b: base, c: L };
      if (triOK(T.a, T.b, T.c)) return Object.assign(T, { princ, L, base });
    }
    return { a: 5, b: 5, c: 6, princ: 'C', L: 5, base: 6 };
  }
  function layout(T, cx = 400) {
    const { a, b, c } = T;
    const ax = (b * b - a * a + c * c) / (2 * c);
    const hh = Math.sqrt(Math.max(0, b * b - ax * ax));
    const m = (Math.min(0, ax) + Math.max(c, ax)) / 2;
    const xA = Math.round(cx - m * SC);
    return { xA, A: { x: xA, y: YB }, B: { x: xA + c * SC, y: YB }, C: { x: xA + ax * SC, y: YB - hh * SC }, ax, hh };
  }
  const sideName = (T, k) => ['AB', 'AC', 'BC'][k];
  const sideLen = (T) => ({ AB: T.c, AC: T.b, BC: T.a });

  /* ---------- Dessin ---------- */
  function ticks(parent, P, Q, n, color = ORANGE) {
    const M = mid(P, Q), u = U(P, Q), nr = { x: -u.y, y: u.x };
    for (let k = 0; k < n; k++) {
      const o = (k - (n - 1) / 2) * 7, cx = M.x + u.x * o, cy = M.y + u.y * o;
      S.el('line', { x1: cx - nr.x * 7, y1: cy - nr.y * 7, x2: cx + nr.x * 7, y2: cy + nr.y * 7, stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }, parent);
    }
  }
  function rightMark(parent, V, P, Q, size = 14, color = ORANGE) {
    const u = U(V, P), v = U(V, Q);
    const a = { x: V.x + u.x * size, y: V.y + u.y * size }, c = { x: a.x + v.x * size, y: a.y + v.y * size }, b = { x: V.x + v.x * size, y: V.y + v.y * size };
    return S.el('path', { d: `M${a.x},${a.y} L${c.x},${c.y} L${b.x},${b.y}`, fill: 'none', stroke: color, 'stroke-width': 3 }, parent);
  }
  function angleMark(parent, V, P, Q, r, n, color = '#1c7ed6') {
    const u = U(V, P), v = U(V, Q), sw = u.x * v.y - u.y * v.x > 0 ? 1 : 0;
    for (let k = 0; k < n; k++) {
      const rr = r + k * 6;
      S.el('path', { d: `M${V.x + u.x * rr},${V.y + u.y * rr} A${rr},${rr} 0 0 ${sw} ${V.x + v.x * rr},${V.y + v.y * rr}`, fill: 'none', stroke: color, 'stroke-width': 3 }, parent);
    }
  }
  function vlabel(parent, P, text, dx = 0, dy = 0, color = '#1864ab') {
    return S.el('text', { x: P.x + dx, y: P.y + dy, 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 800, fill: color, stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', text }, parent);
  }
  function dot(parent, P, color = '#1864ab') {
    return S.el('circle', { cx: P.x, cy: P.y, r: 6, fill: color, stroke: '#fff', 'stroke-width': 2 }, parent);
  }
  function ruler(parent, x0, y, lenCm, maxX) {
    const g = S.el('g', {}, parent);
    S.el('rect', { x: x0 - 14, y, width: Math.min(maxX, x0 + lenCm * SC + 14) - (x0 - 14), height: 26, rx: 4, fill: '#f4d58d', stroke: '#a8842f', 'stroke-width': 2 }, g);
    for (let k = 0; k <= lenCm * 2; k++) {
      const x = x0 + (k * SC) / 2;
      if (x > maxX - 6) break;
      S.el('line', { x1: x, y1: y, x2: x, y2: y + (k % 2 ? 8 : 14), stroke: '#6b4f2a', 'stroke-width': 1.5 }, g);
      if (k % 2 === 0) S.el('text', { x, y: y + 24, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#5b4318', text: k / 2 }, g);
    }
    return g;
  }
  // demi-cercle supérieur (centre C, rayon en px), animé
  function arcUpper(parent, C, rpx, color) {
    const len = Math.PI * rpx;
    const p = S.el('path', { d: `M${C.x - rpx},${C.y} A${rpx},${rpx} 0 0 1 ${C.x + rpx},${C.y}`, fill: 'none', stroke: color, 'stroke-width': 3.5, 'stroke-linecap': 'round',
      'stroke-dasharray': len, 'stroke-dashoffset': len, style: 'transition:stroke-dashoffset .9s ease-in-out' }, parent);
    setTimeout(() => p.setAttribute('stroke-dashoffset', 0), 30);
    return p;
  }
  const upper = (c1, r1, c2, r2) => {
    const pts = geo.circles(c1, r1, c2, r2);
    if (!pts.length) return null;
    const p = pts.reduce((m, q) => (q.y < m.y ? q : m));
    return p.y < c1.y - 8 ? p : null;
  };
  function beam(parent, P, Q, color = '#8a5a2b', w = 9) {
    return S.el('line', { x1: P.x, y1: P.y, x2: Q.x, y2: Q.y, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round' }, parent);
  }
  function paper(svg, x, y, w, hgt) {
    S.el('rect', { x, y, width: w, height: hgt, rx: 10, fill: '#fffdf5', stroke: '#c8b88a', 'stroke-width': 3 }, svg);
  }

  /* ================================================================
     ÉNIGME « commande » : lire les codages (le dessin à main levée ment)
     ================================================================ */
  const TYPES = {
    iso: { label: 'ISOCÈLE', sub: '2 côtés égaux' },
    equi: { label: 'ÉQUILATÉRAL', sub: '3 côtés égaux' },
    rect: { label: 'RECTANGLE', sub: '1 angle droit' },
  };
  const LOOKS = {
    equi: [[22, 114], [148, 114], [85, 8]],
    isoflat: [[12, 112], [158, 112], [88, 50]],
    scal: [[18, 112], [150, 86], [62, 10]],
    rect: [[22, 112], [152, 112], [22, 14]],
  };
  function makePlan(r, type, hard) {
    const look = type === 'iso' ? r.pick(['equi', 'scal']) : type === 'equi' ? r.pick(['scal', 'isoflat'])
      : type === 'rect' ? r.pick(['rect', 'scal', 'isoflat']) : r.pick(['isoflat', 'equi']);
    const flip = r.chance(0.5);
    let pts = LOOKS[look].map(([x, y]) => ({ x: clamp((flip ? 170 - x : x) + r.int(-4, 4), 6, 164), y: clamp(y + r.int(-4, 4), 6, 124) }));
    const rot = r.int(0, 2);
    pts = pts.map((_, i) => pts[(i + rot) % 3]);
    let tk = [0, 0, 0], right = null;
    if (type === 'iso') {
      const odd = r.int(0, 2), n = r.pick([1, 2]);
      tk = [0, 1, 2].map((i) => (i === odd ? (hard && r.chance(0.5) ? 3 - n : 0) : n));
    } else if (type === 'equi') { const n = r.pick([1, 2]); tk = [n, n, n]; }
    else if (type === 'rect') right = look === 'rect' ? (3 - rot) % 3 : r.int(0, 2);
    else tk = r.shuffle([1, 2, 3]);
    return { type, look, pts, tk, right };
  }
  function drawPlan(parent, plan, x, y, labelTxt) {
    const g = S.el('g', { transform: `translate(${x},${y})`, style: 'cursor:pointer;touch-action:manipulation' }, parent);
    plan.bg = S.el('rect', { width: 170, height: 130, rx: 10, fill: '#fffaf0', stroke: '#c8a96a', 'stroke-width': 3 }, g);
    S.el('polygon', { points: plan.pts.map((p) => `${p.x},${p.y}`).join(' '), fill: 'rgba(240,160,70,.25)', stroke: '#6b4f2a', 'stroke-width': 3.5, 'stroke-linejoin': 'round' }, g);
    for (let i = 0; i < 3; i++) if (plan.tk[i]) ticks(g, plan.pts[i], plan.pts[(i + 1) % 3], plan.tk[i]);
    if (plan.right != null) { const v = plan.right; rightMark(g, plan.pts[v], plan.pts[(v + 1) % 3], plan.pts[(v + 2) % 3], 14); }
    if (labelTxt) S.el('text', { x: 8, y: 20, 'font-size': 14, 'font-weight': 800, fill: '#8a6a3e', text: labelTxt }, g);
    plan.g = g;
    return g;
  }
  function whyNot(plan, house) {
    const draw = plan.look !== plan.type && plan.type !== 'quel' ? '' : '';
    let msg;
    if (plan.type === 'quel') msg = 'Ce plan ne va à aucun toit : ses côtés portent <b>1, 2 et 3 traits</b> (tous différents) et il n\'a pas de petit carré. C\'est un triangle quelconque.';
    else if (plan.type === 'equi' && house === 'iso') msg = 'Ce plan a <b>3 côtés codés pareil</b> : c\'est un équilatéral. Le toit demandé n\'a que <b>2 côtés égaux</b>.';
    else if (plan.type === 'equi') msg = 'Ce plan a <b>3 côtés codés pareil</b>, mais aucun petit carré : pas d\'angle droit.';
    else if (plan.type === 'iso' && house === 'equi') msg = 'Seuls <b>2 côtés</b> ont le même codage : le troisième est différent. Il faudrait <b>3</b> côtés égaux pour un équilatéral.';
    else if (plan.type === 'iso') msg = 'Ce plan a 2 côtés codés pareil, mais <b>aucun petit carré</b> : pas d\'angle droit codé.';
    else msg = 'Ce plan a un <b>petit carré</b> (angle droit) mais aucun côté codé pareil : ce n\'est ni isocèle ni équilatéral.';
    return msg + ' Le dessin est fait à main levée : il peut tromper, c\'est le <b>codage</b> qui compte.' + draw;
  }

  /* coder soi-même : on touche un côté pour ajouter des traits, un sommet pour le petit carré */
  function codeRound(ctx, host, kind, prefix, done) {
    const r = ctx.rng;
    host.innerHTML = '';
    const svg = S.root(host, VW, VH);
    S.el('rect', { x: 0, y: 0, width: VW, height: VH, fill: '#e9ecef' }, svg);
    paper(svg, 6, 6, VW - 12, VH - 12);
    const J = () => r.int(-25, 25);
    const pos = [{ x: 150 + J(), y: 380 + J() / 2 }, { x: 660 + J(), y: 390 + J() / 2 }, { x: 330 + J(), y: 120 + J() }];
    const names = r.shuffle(['A', 'B', 'C']);
    const V = pos.map((p, i) => ({ n: names[i], p }));
    const sides = [0, 1, 2].map((i) => ({ i, a: V[i], b: V[(i + 1) % 3], name: [V[i].n, V[(i + 1) % 3].n].sort().join(''), len: null }));
    let vi = -1, sentence;
    if (kind === 'iso') {
      const L = r.int(3, 8); let base = r.int(3, 9); if (base === L) base = L + 1;
      const odd = r.int(0, 2);
      sides.forEach((s) => { s.len = s.i === odd ? base : L; });
      sentence = `Ferdinand a mesuré : ${sides.map((s) => `${s.name} = ${s.len} cm`).join(', ')}. <b>Code</b> la figure.`;
    } else {
      vi = r.int(0, 2);
      const L = r.int(3, 8);
      const legs = [vi, (vi + 2) % 3];
      sides.forEach((s) => { s.len = legs.includes(s.i) ? L : L * 1.4142; s.hyp = !legs.includes(s.i); });
      const w = V[vi].n, others = legs.map((k) => (k === vi ? sides[k].b.n : sides[k].a.n));
      sentence = `Le triangle ${names.slice().sort().join('')} est <b>rectangle en ${w}</b> et ${w}${others[0]} = ${w}${others[1]} = ${L} cm. <b>Code</b> la figure.`;
    }
    ctx.consigne.innerHTML = prefix + sentence;
    ctx.pi('Touche un <b>côté</b> pour ajouter des traits (0, 1, 2, 3). Touche un <b>sommet</b> pour poser ou enlever le petit carré. Les côtés égaux portent les <b>mêmes</b> traits.');
    const tk = [0, 0, 0], rt = [false, false, false];
    const body = S.el('polygon', { points: pos.map((p) => `${p.x},${p.y}`).join(' '), fill: 'rgba(240,160,70,.2)', stroke: 'none' }, svg);
    const lines = sides.map((s) => beam(svg, s.a.p, s.b.p, '#6b4f2a', 5));
    const marks = S.el('g', {}, svg);
    const hitL = S.el('g', {}, svg), hitV = S.el('g', {}, svg);
    const lens = S.el('g', {}, svg);
    sides.forEach((s) => {
      if (kind === 'rectiso' && s.hyp) return;
      const M = mid(s.a.p, s.b.p), u = U(s.a.p, s.b.p);
      const c0 = mid(pos[0], mid(pos[1], pos[2]));
      let nx = -u.y, ny = u.x; if ((M.x + nx - c0.x) * (M.x - c0.x) + (M.y + ny - c0.y) * (M.y - c0.y) < 0) { nx = -nx; ny = -ny; }
      S.el('text', { x: M.x + nx * (22 + Math.abs(nx) * 56 + Math.abs(ny) * 12), y: M.y + ny * (22 + Math.abs(nx) * 56 + Math.abs(ny) * 12) + 6, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 800, fill: '#495057', stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', text: `${s.name} = ${s.len} cm` }, lens);
    });
    V.forEach((v, i) => {
      const out = U(mid(pos[0], mid(pos[1], pos[2])), v.p);
      vlabel(svg, { x: v.p.x + out.x * 26, y: v.p.y + out.y * 26 + 8 }, v.n);
      dot(svg, v.p);
    });
    const render = () => {
      marks.innerHTML = '';
      sides.forEach((s) => { if (tk[s.i]) ticks(marks, s.a.p, s.b.p, tk[s.i]); });
      rt.forEach((on, i) => { if (on) rightMark(marks, V[i].p, V[(i + 1) % 3].p, V[(i + 2) % 3].p, 20); });
    };
    sides.forEach((s) => {
      const hl = S.el('line', { x1: s.a.p.x, y1: s.a.p.y, x2: s.b.p.x, y2: s.b.p.y, stroke: 'transparent', 'stroke-width': 44, 'stroke-linecap': 'round', style: 'cursor:pointer;touch-action:manipulation' }, hitL);
      hl.addEventListener('click', () => { tk[s.i] = (tk[s.i] + 1) % 4; render(); });
    });
    V.forEach((v, i) => {
      const c = S.el('circle', { cx: v.p.x, cy: v.p.y, r: 26, fill: 'transparent', style: 'cursor:pointer;touch-action:manipulation' }, hitV);
      c.addEventListener('click', () => { rt[i] = !rt[i]; render(); });
    });
    const tools = h('div', { class: 'puz-tools' },
      h('button', { class: 'btn', onclick: () => { tk.fill(0); rt.fill(false); render(); } }, '🧽 Tout effacer'),
      h('button', { class: 'btn btn-go', onclick: () => check() }, '✔ Valider le codage'));
    host.append(tools);
    const flash = (idx) => { idx.forEach((k) => lines[k].setAttribute('stroke', '#e03131')); setTimeout(() => lines.forEach((l) => l.setAttribute('stroke', '#6b4f2a')), 2400); };
    const check = () => {
      // angle droit
      if (kind === 'iso') {
        const bad = rt.findIndex((x) => x);
        if (bad >= 0) return ctx.fail(`Rien n'indique un angle droit ici : le petit carré en ${V[bad].n} est de trop. On ne code que ce que l'énoncé dit, pas ce que le dessin semble montrer.`);
      } else {
        const wrong = rt.findIndex((x, i) => x && i !== vi);
        if (wrong >= 0) return ctx.fail(`Le petit carré est au mauvais sommet : le triangle est rectangle en <b>${V[vi].n}</b>, pas en ${V[wrong].n}.`);
        if (!rt[vi]) return ctx.fail(`Il manque le <b>petit carré</b> de l'angle droit, au sommet ${V[vi].n} (touche ce sommet).`);
      }
      for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
        const eq = Math.abs(sides[i].len - sides[j].len) < 1e-6;
        if (eq && !(tk[i] > 0 && tk[i] === tk[j])) { flash([i, j]); return ctx.fail(`${sides[i].name} et ${sides[j].name} ont la <b>même longueur</b> : elles doivent porter le <b>même nombre de traits</b> (au moins un).`); }
        if (!eq && tk[i] > 0 && tk[i] === tk[j]) { flash([i, j]); return ctx.fail(`${sides[i].name} et ${sides[j].name} n'ont <b>pas la même longueur</b> : elles ne doivent pas porter les mêmes traits.`); }
      }
      Atlas.UI.toast('Figure bien codée !', 'good');
      later(host, done, 900);
    };
  }

  function buildCommande(ctx, host, { hard = false, codeRounds = [], prefix = '', onSolved }) {
    const r = ctx.rng;
    host.innerHTML = '';
    ctx.consigne.innerHTML = prefix + 'Donne à chaque maison <b>le plan qui correspond à son toit</b>. Touche un plan, puis une maison. Un plan ne sert pas.';
    const svg = S.root(host, VW, VH);
    S.el('rect', { x: 0, y: 0, width: VW, height: VH, fill: '#dff0c8' }, svg);
    const order = r.shuffle(['iso', 'equi', 'rect']);
    const plans = r.shuffle(['iso', 'equi', 'rect', 'quel']).map((t) => makePlan(r, t, hard));
    const HX = [20, 280, 540];
    const houses = order.map((t, j) => ({ type: t, j, plan: null, locked: false }));
    const home = (i) => ({ x: 15 + i * 195, y: 14 });
    const slot = (j) => ({ x: HX[j] + 40, y: 218 });
    houses.forEach((H) => {
      const hx = HX[H.j];
      const g = S.el('g', {}, svg);
      S.el('text', { x: hx + 125, y: 178, 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 800, fill: '#7c2d12', text: 'Toit ' + TYPES[H.type].label }, g);
      S.el('text', { x: hx + 125, y: 202, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: '#495057', text: TYPES[H.type].sub }, g);
      S.el('polygon', { points: `${hx + 50},${218 + 120} ${hx + 200},${218 + 120} ${hx + 125},${218 + 10}`, fill: 'rgba(255,255,255,.5)', stroke: '#adb5bd', 'stroke-width': 3, 'stroke-dasharray': '8 6' }, g);
      S.el('rect', { x: hx + 30, y: 352, width: 190, height: 84, fill: '#f6e6c4', stroke: '#9a6a3e', 'stroke-width': 3 }, g);
      S.el('rect', { x: hx + 105, y: 382, width: 40, height: 54, fill: '#7a4b24' }, g);
      S.el('rect', { x: hx + 45, y: 372, width: 40, height: 30, fill: '#9fd8ff', stroke: '#9a6a3e', 'stroke-width': 3 }, g);
      H.hit = S.el('rect', { x: hx, y: 160, width: 250, height: 290, fill: 'transparent', style: 'cursor:pointer;touch-action:manipulation' }, g);
      H.fx = S.el('g', {}, svg);
      H.hit.addEventListener('click', () => put(H));
    });
    let sel = null;
    const move = (pl, pos) => pl.g.setAttribute('transform', `translate(${pos.x},${pos.y})`);
    const refresh = () => plans.forEach((pl, i) => { pl.bg.setAttribute('stroke', pl === sel ? '#f08c00' : '#c8a96a'); pl.bg.setAttribute('stroke-width', pl === sel ? 6 : 3); pl.bg.setAttribute('fill', '#fffaf0'); });
    plans.forEach((pl, i) => {
      pl.i = i;
      drawPlan(svg, pl, home(i).x, home(i).y, 'Plan ' + (i + 1));
      pl.g.addEventListener('click', () => {
        if (pl.house) { if (pl.house.locked) return; pl.house.plan = null; pl.house = null; move(pl, home(i)); sel = null; refresh(); return; }
        sel = sel === pl ? null : pl; refresh();
      });
    });
    function put(H) {
      if (H.locked) return;
      if (!sel) return Atlas.UI.toast('Touche d\'abord un plan.');
      if (H.plan) { const old = H.plan; old.house = null; move(old, home(old.i)); }
      if (sel.house) sel.house.plan = null;
      H.plan = sel; sel.house = H; move(sel, slot(H.j)); sel = null; refresh();
    }
    const go = h('button', { class: 'btn btn-go' }, '🔨 Monter les toits');
    host.append(h('div', { class: 'puz-tools' }, go));
    let busy = false;
    go.onclick = () => {
      if (busy) return;
      if (houses.some((H) => !H.plan)) return Atlas.UI.toast('Il faut un plan sur chaque maison.', 'bad');
      busy = true;
      const bad = houses.filter((H) => H.plan.type !== H.type);
      houses.forEach((H) => {
        H.fx.innerHTML = '';
        const ok = H.plan.type === H.type;
        const hx = HX[H.j];
        if (ok) {
          S.el('polygon', { points: `${hx + 50},${218 + 120} ${hx + 200},${218 + 120} ${hx + 125},${218 + 10}`, fill: 'rgba(47,158,68,.35)', stroke: '#2f9e44', 'stroke-width': 4 }, H.fx);
          S.el('text', { x: hx + 215, y: 250, 'font-size': 34, fill: '#2f9e44', 'font-weight': 800, text: '✓' }, H.fx);
        } else {
          S.el('text', { x: hx + 215, y: 250, 'font-size': 34, fill: '#e03131', 'font-weight': 800, text: '✗' }, H.fx);
          H.plan.bg.setAttribute('stroke', '#e03131'); H.plan.bg.setAttribute('stroke-width', 6); H.plan.bg.setAttribute('fill', '#ffe3e3');
        }
      });
      if (!bad.length) {
        houses.forEach((H) => { H.locked = true; });
        Atlas.UI.toast('Les trois toits sont montés !', 'good');
        const next = (i) => { if (i >= codeRounds.length) return onSolved(); codeRound(ctx, host, codeRounds[i], prefix, () => next(i + 1)); };
        return later(host, () => next(0), 1300);
      }
      houses.forEach((H) => { if (H.plan.type === H.type) H.locked = true; });
      const B = bad[0];
      ctx.fail(`Toit ${TYPES[B.type].label.toLowerCase()} : ${whyNot(B.plan, B.type)}`);
      later(host, () => {
        bad.forEach((H) => { const pl = H.plan; H.fx.innerHTML = ''; pl.house = null; H.plan = null; move(pl, home(pl.i)); });
        refresh(); busy = false;
      }, 2800);
    };
    ctx.pi('Regarde les <b>traits</b> et les <b>petits carrés</b>. Les plans sont dessinés à main levée : le dessin peut mentir !');
  }

  /* ================================================================
     ÉNIGME « compas » : construire la charpente à la règle et au compas
     ================================================================ */
  function compasRound(ctx, host, spec, done) {
    const r = ctx.rng;
    const T = spec.iso ? genIso(r) : genScal(r);
    const { a, b, c } = T;
    const Lt = layout(T), A = Lt.A, B = Lt.B, Cc = Lt.C, xA = Lt.xA;
    const pre = spec.prefix || '';
    ctx.consigne.innerHTML = pre + `Construis le triangle <b>ABC</b> : <b>AB = ${cm(c)}</b>, <b>AC = ${cm(b)}</b>, <b>BC = ${cm(a)}</b>.`;
    host.innerHTML = '';
    const svg = S.root(host, VW, VH);
    const cid = 'cp' + r.int(1, 999999);
    S.el('rect', { x: 6, y: 6, width: VW - 12, height: 340 }, S.el('clipPath', { id: cid }, S.el('defs', {}, svg)));
    S.el('rect', { x: 0, y: 0, width: VW, height: VH, fill: '#d9c9a3' }, svg);
    paper(svg, 6, 6, VW - 12, 340);
    ruler(svg, xA, YB + 2, 14, 786);
    const arcL = S.el('g', { 'clip-path': `url(#${cid})` }, svg);
    const ab = S.el('line', { x1: A.x, y1: A.y, x2: A.x, y2: A.y, stroke: '#868e96', 'stroke-width': 3, 'stroke-dasharray': '6 5' }, svg);
    const frame = S.el('g', {}, svg);
    const hitPaper = S.el('rect', { x: 6, y: 6, width: VW - 12, height: 340, fill: 'transparent' }, svg);
    // point A et poignée B
    dot(svg, A, '#1864ab'); vlabel(svg, A, 'A', -4, -14);
    const maxT = Math.floor(((786 - xA) / SC) * 2) / 2;
    let Bt = r.pick([1.5, 2, 2.5, 4, 5, 6, 10, 11].filter((v) => v !== c && v <= maxT));
    const bG = S.el('g', {}, svg);
    const bC = S.el('circle', { r: 11, fill: '#f08c00', stroke: '#fff', 'stroke-width': 3 }, bG);
    const bH = S.el('circle', { r: 28, fill: 'transparent' }, bG);
    const bT = vlabel(bG, { x: 0, y: 0 }, 'B', 0, -18);
    let traced = false;
    const placeB = () => {
      const x = xA + Bt * SC;
      [bC, bH].forEach((e) => { e.setAttribute('cx', x); e.setAttribute('cy', YB); });
      bT.setAttribute('x', x); bT.setAttribute('y', YB - 18);
      ab.setAttribute('x2', x); ab.setAttribute('y2', YB);
    };
    placeB();
    S.drag(bG, svg, { move: (p) => { if (traced) return; Bt = clamp(Math.round(((p.x - xA) / SC) * 2) / 2, 0.5, maxT); placeB(); } });
    // règle du compas (en bas)
    const X0 = 60, YS = 456;
    ruler(svg, X0, YS, 10, 440);
    S.el('text', { x: 440, y: YS + 18, 'font-size': 15, 'font-weight': 700, fill: '#5b4318', text: '← règle du compas' }, svg);
    let open = r.pick([1.5, 2.5, 3.5, 5.5, 8.5, 9.5].filter((v) => v !== a && v !== b));
    const comp = S.el('g', {}, svg);
    const legN = S.el('line', { stroke: '#495057', 'stroke-width': 7, 'stroke-linecap': 'round' }, comp);
    const legP = S.el('line', { stroke: '#e8590c', 'stroke-width': 7, 'stroke-linecap': 'round' }, comp);
    const hinge = S.el('circle', { r: 10, fill: '#adb5bd', stroke: '#495057', 'stroke-width': 3 }, comp);
    S.el('polygon', { points: `${X0 - 4},${YS - 8} ${X0 + 4},${YS - 8} ${X0},${YS + 4}`, fill: '#343a40' }, comp);
    const pG = S.el('g', {}, svg);
    const pC = S.el('circle', { r: 11, fill: '#fab005', stroke: '#fff', 'stroke-width': 3 }, pG);
    const pH = S.el('circle', { r: 28, fill: 'transparent' }, pG);
    const upd = () => {
      const px = X0 + open * SC, H = { x: (X0 + px) / 2, y: YS - 82 };
      legN.setAttribute('x1', X0); legN.setAttribute('y1', YS - 6); legN.setAttribute('x2', H.x); legN.setAttribute('y2', H.y);
      legP.setAttribute('x1', px); legP.setAttribute('y1', YS - 6); legP.setAttribute('x2', H.x); legP.setAttribute('y2', H.y);
      hinge.setAttribute('cx', H.x); hinge.setAttribute('cy', H.y);
      [pC, pH].forEach((e) => { e.setAttribute('cx', px); e.setAttribute('cy', YS - 6); });
    };
    upd();
    S.drag(pG, svg, { move: (p) => { open = clamp(Math.round(((p.x - X0) / SC) * 2) / 2, 0, 10); upd(); } });

    const arcs = [];
    let apex = null, stage = 0;
    const clearArcs = () => { arcL.innerHTML = ''; frame.innerHTML = ''; arcs.length = 0; apex = null; };
    const bTrace = h('button', { class: 'btn btn-go' }, '✏️ Tracer [AB]');
    const bA = h('button', { class: 'btn', disabled: true }, '📍 Piquer en A');
    const bB = h('button', { class: 'btn', disabled: true }, '📍 Piquer en B');
    const bClr = h('button', { class: 'btn', disabled: true, onclick: () => { if (stage === 1) clearArcs(); } }, '🧽 Effacer les arcs');
    host.append(h('div', { class: 'puz-tools' }, bTrace, bA, bB, bClr));
    ctx.pi('Pose d\'abord le côté [AB] : fais glisser <b>B</b> sur la règle jusqu\'à la bonne graduation (le zéro est sur A).');

    bTrace.onclick = () => {
      if (traced) return;
      if (Bt !== c) {
        return ctx.fail(`Ton segment [AB] mesure ${cm(Bt)}, il en faut ${cm(c)}. Le <b>zéro</b> de la règle est sur A : lis la graduation juste sous B.`);
      }
      traced = true; stage = 1; bC.setAttribute('fill', '#1864ab'); bG.style.cursor = 'default';
      ab.setAttribute('stroke', '#6b4f2a'); ab.setAttribute('stroke-width', 6); ab.removeAttribute('stroke-dasharray');
      bTrace.disabled = true; bA.disabled = false; bB.disabled = false; bClr.disabled = false;
      Atlas.UI.toast(`[AB] tracé : ${cm(c)}`, 'good');
      ctx.pi(`Règle le compas sur la règle du bas (pointe sèche sur le 0), puis pique-le en A ou en B. Il faut ${cm(b)} et ${cm(a)} : deux arcs.`);
    };
    const pique = (at) => {
      if (stage !== 1) return;
      if (arcs.length >= 2) return Atlas.UI.toast('Deux arcs suffisent. Touche leur point de croisement.');
      if (arcs.some((x) => x.at === at)) return Atlas.UI.toast(`Il y a déjà un arc centré en ${at} : pique le compas sur l'autre extrémité.`);
      if (open === 0) return Atlas.UI.toast('Écarte d\'abord le compas : glisse le crayon sur la règle.');
      const ctr = at === 'A' ? A : B;
      arcs.push({ at, r: open, g: arcUpper(arcL, ctr, open * SC, at === 'A' ? '#1c7ed6' : '#2f9e44') });
      if (arcs.length === 2) {
        const rA = arcs.find((x) => x.at === 'A').r, rB = arcs.find((x) => x.at === 'B').r;
        const I = upper(A, rA * SC, B, rB * SC);
        if (!I) {
          later(host, () => {
            ctx.fail(`Tes deux arcs (rayons ${cm(rA)} et ${cm(rB)}) <b>ne se croisent pas</b> ! ` + (rA + rB < c ? `Mis bout à bout, ils font ${cm(rA + rB)} : c'est moins que [AB] (${cm(c)}).` : 'Un arc passe entièrement à l\'intérieur ou à côté de l\'autre.') + ' Vérifie l\'écartement lu sur la règle.');
            setTimeout(() => { if (host.isConnected) clearArcs(); }, 1500);
          }, 1000);
        } else ctx.pi('Les deux arcs se croisent. <b>Touche ce point</b> : ce sera le sommet C.');
      }
    };
    bA.onclick = () => pique('A');
    bB.onclick = () => pique('B');
    hitPaper.addEventListener('pointerdown', (e) => {
      if (stage !== 1 || arcs.length < 2 || apex) return;
      const rA = arcs.find((x) => x.at === 'A').r, rB = arcs.find((x) => x.at === 'B').r;
      const I = upper(A, rA * SC, B, rB * SC);
      if (!I) return;
      const p = S.pt(svg, e);
      if (geo.dist(p, I) > 28) return Atlas.UI.toast('Touche le point où les deux arcs se croisent.');
      apex = I;
      const ok = (rA === b && rB === a) || (rA === a && rB === b);
      const g = frame;
      S.el('polygon', { points: `${A.x},${A.y} ${B.x},${B.y} ${I.x},${I.y}`, fill: ok ? 'rgba(47,158,68,.18)' : 'rgba(224,49,49,.12)' }, g);
      beam(g, A, I, ok ? '#6b4f2a' : '#e03131', 6); beam(g, B, I, ok ? '#6b4f2a' : '#e03131', 6);
      dot(g, I, ok ? '#1864ab' : '#e03131'); vlabel(g, I, 'C', 0, -14);
      const lab = (P, Q, len, good) => { const M = mid(P, Q), G = { x: (A.x + B.x + I.x) / 3, y: (A.y + B.y + I.y) / 3 }, u = U(G, M); S.el('text', { x: M.x + u.x * 26, y: M.y + u.y * 22 + 6, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: good ? '#2f9e44' : '#e03131', stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', text: Atlas.fmt(len) + ' cm' }, g); };
      if (ok) {
        lab(A, I, rA, true); lab(B, I, rB, true);
        const sw = rA !== b;
        Atlas.UI.toast('La charpente est montée et elle tient !', 'good');
        if (spec.iso) later(host, () => askSommet(sw), 1400); else later(host, done, 1500);
      } else {
        lab(A, I, rA, rA === b || rA === a); lab(B, I, rB, rB === b || rB === a);
        ctx.fail(`Ta charpente a <b>AB = ${cm(c)}, AC = ${cm(rA)}, BC = ${cm(rB)}</b>. La commande était ${cm(c)}, ${cm(b)} et ${cm(a)}. Regarde bien l'écartement du compas sur la règle (pointe sèche sur le 0).`);
        later(host, () => { clearArcs(); }, 2600);
      }
    });

    /* sommet principal puis angles à la base */
    function askSommet() {
      stage = 2;
      const Vp = { A, B, C: apex }, P = T.princ;
      const eqPairs = { C: ['AC', 'BC'], A: ['AB', 'AC'], B: ['AB', 'BC'] }[P];
      ctx.consigne.innerHTML = pre + 'Ce triangle est <b>isocèle</b>. Touche son <b>sommet principal</b>.';
      ctx.pi('Le sommet principal est le sommet où <b>se rejoignent les deux côtés égaux</b>.');
      const hits = S.el('g', {}, svg);
      let finished = false;
      ['A', 'B', 'C'].forEach((n) => {
        const cc = S.el('circle', { cx: Vp[n].x, cy: Vp[n].y, r: 30, fill: 'transparent', style: 'cursor:pointer;touch-action:manipulation' }, hits);
        cc.addEventListener('click', () => {
          if (finished) return;
          const endp = (nm) => ({ A: A, B: B, C: apex }[nm]);
          const showTicks = () => { eqPairs.forEach((p) => ticks(frame, endp(p[0]), endp(p[1]), 2)); };
          if (n === P) {
            finished = true;
            showTicks();
            S.el('circle', { cx: Vp[n].x, cy: Vp[n].y, r: 20, fill: 'none', stroke: '#2f9e44', 'stroke-width': 5 }, frame);
            ctx.pi(`Oui : <b>${P}</b> est le sommet principal, car ${eqPairs[0]} = ${eqPairs[1]} (mêmes traits). Le côté opposé s'appelle la <b>base</b>.`, 'good');
            if (spec.angles) later(host, () => askAngles(P, endp), 1800); else later(host, done, 2200);
          } else {
            showTicks();
            ctx.fail(`Le sommet principal est là où se rejoignent les <b>deux côtés égaux</b> (mêmes traits) : ${eqPairs[0]} et ${eqPairs[1]}, donc le sommet <b>${P}</b>.` + (P !== 'C' ? ' Le sommet « du haut » n\'est pas forcément le sommet principal !' : ''));
          }
        });
      });
    }
    function askAngles(P, endp) {
      ctx.consigne.innerHTML = pre + `Dans le triangle isocèle de sommet principal <b>${P}</b>, les <b>angles à la base</b> ont la même mesure.`;
      const base = ['A', 'B', 'C'].filter((n) => n !== P);
      const x = r.int(35, 70);
      const [V1, V2] = r.chance(0.5) ? base : base.slice().reverse();
      const other = (n) => ['A', 'B', 'C'].filter((m) => m !== n);
      const mk = S.el('g', {}, frame);
      const wedge = (V, color, n) => { const [p, q] = other(V); angleMark(mk, endp(V), endp(p), endp(q), 26, n, color); };
      wedge(V1, '#e03131', 1);
      wedge(V2, '#1c7ed6', 1);
      const t1 = endp(V1), t2 = endp(V2);
      const place = (P0, txt, color) => { const cen = { x: (A.x + B.x + apex.x) / 3, y: (A.y + B.y + apex.y) / 3 }; const u = U(P0, cen); S.el('text', { x: P0.x + u.x * 60, y: P0.y + u.y * 60 + 6, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 800, fill: color, stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', text: txt }, mk); };
      place(t1, `${x}°`, '#e03131');
      place(t2, '?', '#1c7ed6');
      ctx.pi(`L'angle en ${V1} mesure ${x}°. Combien mesure l'angle en ${V2} ?`);
      const box = h('div', { class: 'puz-tools' });
      host.append(box);
      Atlas.UI.answer(box, {
        label: `Angle en <b>${V2}</b> :`, unit: '°',
        onSubmit: (v) => {
          if (v === x) { Atlas.UI.toast('Juste !', 'good'); box.remove(); return later(host, done, 600); }
          angleMark(mk, endp(V1), endp(other(V1)[0]), endp(other(V1)[1]), 34, 2, '#2f9e44');
          angleMark(mk, endp(V2), endp(other(V2)[0]), endp(other(V2)[1]), 34, 2, '#2f9e44');
          ctx.fail(v === 180 - 2 * x ? `Ça, c'est l'angle au sommet principal ${P}. Ici on veut un angle <b>à la base</b> : il est <b>égal</b> à celui en ${V1} (${x}°).`
            : `Dans un triangle isocèle, les <b>deux angles à la base</b> ont la <b>même mesure</b> : ${V1} et ${V2} sont les sommets de la base, donc l'angle en ${V2} mesure ${x}°.`);
        },
      });
    }
  }

  function buildCompas(ctx, host, { rounds, onSolved }) {
    let k = 0;
    const next = () => {
      if (k >= rounds.length) return onSolved();
      const spec = rounds[k++];
      compasRound(ctx, host, spec, next);
    };
    next();
  }

  /* ================================================================
     ÉNIGME « programme » : l'apprenti suit le programme TEL QUEL
     ================================================================ */
  function progRound(ctx, host, kind, prefix, done) {
    const r = ctx.rng;
    host.innerHTML = '';
    const hole = kind === 'hole';
    const T = hole ? genIso(r, 'C') : genScal(r);
    const { a, b, c } = T;                       // AC = b, BC = a
    const rA = b, rBgood = a;
    const CX = 520, Lt = layout(T, CX), A = Lt.A, B = Lt.B;
    ctx.consigne.innerHTML = prefix + (hole
      ? 'Ferdinand a dessiné la figure à main levée. <b>Complète</b> son programme, puis regarde l\'apprenti l\'exécuter.'
      : 'Les étapes de Ferdinand sont dans le désordre. <b>Remets-les dans l\'ordre</b> : l\'apprenti les suivra exactement.');
    const svg = S.root(host, VW, 350);
    const cid = 'pg' + r.int(1, 999999);
    S.el('rect', { x: 250, y: 6, width: 544, height: 338 }, S.el('clipPath', { id: cid }, S.el('defs', {}, svg)));
    S.el('rect', { x: 0, y: 0, width: VW, height: 350, fill: '#d9c9a3' }, svg);
    // figure à main levée (à gauche)
    paper(svg, 6, 6, 236, 338);
    S.el('text', { x: 124, y: 30, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: '#8a6a3e', text: 'Figure à main levée' }, svg);
    const sk = hole ? [{ x: 30, y: 240 }, { x: 205, y: 262 }, { x: 140, y: 80 }] : [{ x: 48, y: 250 }, { x: 214, y: 240 }, { x: 105, y: 76 }];
    S.el('polygon', { points: sk.map((p) => `${p.x},${p.y}`).join(' '), fill: 'rgba(240,160,70,.2)', stroke: '#6b4f2a', 'stroke-width': 4, 'stroke-linejoin': 'round' }, svg);
    ['A', 'B', 'C'].forEach((n, i) => {
      const cen = { x: (sk[0].x + sk[1].x + sk[2].x) / 3, y: (sk[0].y + sk[1].y + sk[2].y) / 3 }, u = U(cen, sk[i]);
      vlabel(svg, { x: sk[i].x + u.x * 18, y: sk[i].y + u.y * 18 + 8 }, n);
    });
    const slab = (P, Q, txt, out) => { const M = mid(P, Q); S.el('text', { x: M.x + out.x * 12, y: M.y + out.y * 12 + 5, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: '#495057', stroke: '#fff', 'stroke-width': 3.5, 'paint-order': 'stroke', text: txt }, svg); };
    if (hole) {
      slab(sk[0], sk[1], `AB = ${cm(c)}`, { x: 0, y: 1.6 });
      slab(sk[0], sk[2], `AC = ${cm(b)}`, { x: -2, y: 0 });
      ticks(svg, sk[0], sk[2], 1); ticks(svg, sk[1], sk[2], 1);
    } else {
      slab(sk[0], sk[1], `AB = ${cm(c)}`, { x: 0, y: 1.6 });
      slab(sk[0], sk[2], `AC = ${cm(b)}`, { x: -2.2, y: 0 });
      slab(sk[1], sk[2], `BC = ${cm(a)}`, { x: 2.2, y: 0 });
    }
    // papier de l'apprenti
    paper(svg, 250, 6, 544, 338);
    S.el('text', { x: 522, y: 30, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: '#8a6a3e', text: 'Papier de l\'apprenti' }, svg);
    const L = S.el('g', { 'clip-path': `url(#${cid})` }, svg);

    // étapes
    const txt = {
      1: `Trace le segment [AB] de ${cm(c)}.`,
      2: `Trace un arc de cercle de centre A et de rayon ${cm(rA)}.`,
      3: hole ? null : `Trace un arc de cercle de centre B et de rayon ${cm(rBgood)}.`,
      4: 'Place le point C à l\'intersection des deux arcs.',
      5: 'Trace les segments [AC] et [BC].',
    };
    const valid = (q) => { const p = (n) => q.indexOf(n); return p(1) < p(2) && p(1) < p(3) && p(4) > p(2) && p(4) > p(3) && p(5) > p(4); };
    let seq = [1, 2, 3, 4, 5];
    if (!hole) do { seq = r.shuffle([1, 2, 3, 4, 5]); } while (valid(seq));
    const list = h('div', { style: 'display:flex;flex-direction:column;gap:6px;width:100%;max-width:640px;margin-top:6px' });
    const cards = {};
    let input = null;
    const renderList = () => {
      list.innerHTML = '';
      seq.forEach((id, i) => {
        const row = h('div', { style: 'display:flex;align-items:center;gap:8px;background:#fff8e6;border:2px solid #c8a96a;border-radius:10px;padding:5px 8px;font-size:17px' });
        cards[id] = row;
        row.append(h('b', { style: 'min-width:22px;color:#8a6a3e' }, (i + 1) + '.'));
        if (id === 3 && hole) {
          input = h('input', { class: 'answer-input', inputmode: 'decimal', autocomplete: 'off', placeholder: '?', style: 'width:4.2em;font-size:18px', onkeydown: (e) => e.stopPropagation() });
          row.append(h('span', { style: 'flex:1' }, 'Trace un arc de cercle de centre B et de rayon ', input, ' cm.'));
        } else row.append(h('span', { style: 'flex:1' }, txt[id]));
        if (!hole) {
          row.append(
            h('button', { class: 'btn', style: 'padding:2px 12px', disabled: i === 0 || null, onclick: () => { if (running) return; [seq[i - 1], seq[i]] = [seq[i], seq[i - 1]]; renderList(); } }, '▲'),
            h('button', { class: 'btn', style: 'padding:2px 12px', disabled: i === 4 || null, onclick: () => { if (running) return; [seq[i + 1], seq[i]] = [seq[i], seq[i + 1]]; renderList(); } }, '▼'));
        }
        list.append(row);
      });
    };
    let running = false;
    renderList();
    const go = h('button', { class: 'btn btn-go' }, '▶ L\'apprenti exécute');
    host.append(list, h('div', { class: 'puz-tools', style: 'margin-top:8px' }, go,
      h('button', { class: 'btn', onclick: () => { if (!running) L.innerHTML = ''; } }, '🧽 Nettoyer le papier')));
    ctx.pi(hole ? 'Les deux côtés qui portent <b>le même codage</b> ont la même longueur. Utilise-le pour compléter l\'étape 3.' : 'Pour planter le compas en A ou en B, il faut déjà que ces points existent !');

    go.onclick = () => {
      if (running) return;
      let radB = rBgood;
      if (hole) {
        radB = Atlas.parseNum(input.value);
        if (Number.isNaN(radB) || radB <= 0 || radB > 14) return Atlas.UI.toast('Écris le rayon manquant dans l\'étape 3 (un nombre de cm).', 'bad');
      }
      running = true; L.innerHTML = '';
      const st = { AB: false, arcA: false, arcB: false, C: false };
      let C = null, i = 0;
      const stuck = (id, msg) => {
        cards[id].style.background = '#ffc9c9'; cards[id].style.borderColor = '#e03131';
        const q = S.el('text', { x: 522, y: 190, 'text-anchor': 'middle', 'font-size': 80, 'font-weight': 800, fill: '#e03131', text: '?' }, L);
        ctx.fail(msg);
        later(host, () => { running = false; renderList(); L.innerHTML = ''; }, 3000);
      };
      const step = () => {
        if (!host.isConnected) return;
        if (i >= 5) {
          if (hole && radB !== rA) {
            const bad = S.el('g', {}, L);
            beam(bad, A, C, '#e03131', 6); beam(bad, B, C, '#e03131', 6);
            S.el('text', { x: C.x + 14, y: C.y - 8, 'font-size': 20, 'font-weight': 800, fill: '#e03131', text: `CB = ${Atlas.fmt(radB)} cm` }, bad);
            ctx.fail(`Avec ton programme, <b>CA = ${cm(rA)}</b> mais <b>CB = ${cm(radB)}</b>. Sur le dessin, CA et CB portent <b>le même trait</b> : elles doivent avoir la même longueur.` + (radB === c ? ' Tu as repris la longueur de [AB] : regarde plutôt le codage.' : ''));
            return later(host, () => { running = false; renderList(); L.innerHTML = ''; }, 3200);
          }
          Atlas.UI.toast('Le programme marche !', 'good');
          S.el('text', { x: C.x, y: C.y - 14, 'text-anchor': 'middle', 'font-size': 30, text: '🏠' }, L);
          return later(host, done, 1600);
        }
        const id = seq[i];
        Object.values(cards).forEach((row) => { row.style.background = '#fff8e6'; row.style.borderColor = '#c8a96a'; });
        cards[id].style.background = '#ffe8a3'; cards[id].style.borderColor = '#f08c00';
        if (id === 1) { beam(L, A, B, '#6b4f2a', 6); dot(L, A); dot(L, B); vlabel(L, A, 'A', -4, -14); vlabel(L, B, 'B', 4, -14); st.AB = true; }
        else if (id === 2 || id === 3) {
          if (!st.AB) return stuck(id, `L'apprenti doit piquer son compas en ${id === 2 ? 'A' : 'B'}, mais <b>le segment [AB] n'est pas encore tracé</b> : il ne sait pas où sont A et B. Il faut tracer [AB] d'abord.`);
          const ctr = id === 2 ? A : B, rr = (id === 2 ? rA : radB) * SC;
          arcUpper(L, ctr, rr, id === 2 ? '#1c7ed6' : '#2f9e44');
          if (id === 2) st.arcA = true; else st.arcB = true;
        } else if (id === 4) {
          if (!st.arcA || !st.arcB) return stuck(id, `Pour placer C à l'intersection, il faut <b>deux arcs</b> : l'apprenti n'en a ${st.arcA || st.arcB ? 'qu\'un' : 'aucun'} pour l'instant. Les arcs doivent être tracés avant.`);
          C = upper(A, rA * SC, B, radB * SC);
          if (!C) return stuck(id, `Les deux arcs (rayons ${cm(rA)} et ${cm(radB)}) <b>ne se croisent pas</b> : l'apprenti ne trouve pas C. ` + (hole ? 'Regarde le codage de la figure : quelle longueur doit avoir CB ?' : ''));
          st.C = true;
          dot(L, C, '#e03131'); vlabel(L, C, 'C', 0, -14);
        } else if (id === 5) {
          if (!st.C) return stuck(id, `L'apprenti ne peut pas tracer [AC] et [BC] : le point <b>C n'est pas encore placé</b>. Il faut d'abord trouver C à l'intersection des arcs.`);
          beam(L, A, C, '#6b4f2a', 6); beam(L, B, C, '#6b4f2a', 6);
        }
        i++;
        setTimeout(step, 1100);
      };
      step();
    };
  }
  function buildProgramme(ctx, host, { rounds, prefix = '', onSolved }) {
    let k = 0;
    const next = () => { if (k >= rounds.length) return onSolved(); progRound(ctx, host, rounds[k++], prefix, next); };
    next();
  }

  /* ---------- La carte du chantier ---------- */
  const W = 26, H = 18;
  const map = Atlas.buildMap(W, H, (m) => {
    m.border('T');
    m.rect(3, 4, 22, 14, ':');            // cour du chantier
    m.rect(12, 0, 13, 3, '=');            // chemin vers le village (nord)
    m.rect(12, 4, 13, 13, '=');           // allée centrale
    m.sprinkle(',', 6, 5);
    m.sprinkle('*', 14, 9);
    m.rect(3, 15, 9, 15, 'F'); m.rect(17, 15, 22, 15, 'F');
    m.set(3, 13, 'f'); m.set(3, 14, 'f'); m.set(22, 13, 'f'); m.set(22, 14, 'f');
    [[2, 2], [4, 1], [8, 1], [16, 1], [20, 1], [23, 2], [2, 8], [24, 11], [2, 16], [10, 16], [14, 16], [24, 16]].forEach(([x, y], i) => m.set(x, y, ['T', 'Y', 'B', 'T', 'a', 'A', 'T', 'B', 'a', 'T', 'Y', 'T'][i]));
    [[9, 4], [16, 8], [4, 7], [21, 8], [8, 9], [4, 12], [21, 12], [11, 10]].forEach(([x, y]) => m.set(x, y, 'L'));
    m.set(11, 2, 'S');
    m.set(20, 14, 'b'); m.set(21, 14, 'k'); m.set(6, 14, 'k');
    m.set(23, 14, 'B');
  });

  Atlas.region({
    id: 'chantier', num: 7, name: 'Le Chantier des Charpentiers', chapter: 'Triangles',
    map, spawn: { x: 12, y: 2 },
    theme: { sky: '#f6e3b4', grass: ['#b4de7a', '#aad770', '#bce483'], path: '#e8cf9c', tuft: '#92c455', outside: '#a6d16c' },
    signs: { '11,2': '<b>Chantier des Charpentiers</b><br>« Un toit bien codé tient toute la tempête. » Casque obligatoire !' },
    exits: [{ x: 12, y: 0, to: 'village' }, { x: 13, y: 0, to: 'village' }],
    props: [
      { x: 5, y: 5, stamp: 'maison_rouge' },
      { x: 17, y: 5, stamp: 'maison_bois' },
      { x: 17, y: 10, stamp: 'maison_grise' },
      { x: 5, y: 10, stamp: 'maison_bois' },
      { x: 8, y: 6, t: 'town:116', solid: true },
      { x: 20, y: 6, t: 'town:106', solid: true },
      { x: 15, y: 13, t: 'town:57', solid: true },
    ],
    npcs: [
      {
        id: 'leonie', x: 9, y: 12, t: 'dungeon:88', name: 'Léonie, l\'apprentie',
        talk: (A) => A.done('programme')
          ? ['Mon programme marche, l\'apprenti trace tout juste ! Mais quand on lui oublie une étape, il reste planté devant sa feuille…']
          : ['Je suis l\'apprentie de Ferdinand. Je fais exactement ce qu\'il écrit… alors ses étapes dans le désordre, ça tourne mal !', 'Le chariot, près de l\'allée, porte son programme.'],
      },
      {
        id: 'gustave', x: 20, y: 8, t: 'dungeon:111', name: 'Gustave, le maçon',
        talk: (A) => A.done('commande')
          ? ['Les toits tombent pile sur mes murs. Un isocèle, un équilatéral, un rectangle : chacun sa maison !']
          : ['Mes murs sont prêts, mais je ne sais plus quel toit va où. Les plans sont à main levée…', 'Regarde les petits traits et les petits carrés : le dessin peut tromper, pas le codage.'],
      },
      {
        id: 'pauline', x: 3, y: 6, t: 'dungeon:100', name: 'Madame Pauline',
        talk: (A) => A.done('compas')
          ? ['Mon toit tient enfin ! Trois poutres, et pas une de trop.']
          : ['La tempête a emporté mon toit ! Il faut le reconstruire avec des poutres de 3 longueurs précises.', 'Ferdinand a une pile de planches et un compas. Va voir.'],
      },
    ],
    objects: [
      { id: 'o-commande', x: 10, y: 6, t: 'town:116', kind: 'enigme', enigme: 'commande' },
      { id: 'o-compas', x: 15, y: 8, t: 'town:106', kind: 'enigme', enigme: 'compas' },
      { id: 'o-programme', x: 10, y: 11, t: 'town:57', kind: 'enigme', enigme: 'programme' },
      {
        id: 'o-gardien', x: 14, y: 11, t: 'dungeon:86', name: 'Ferdinand', kind: 'gardien',
        notReady: 'Je suis Ferdinand, le charpentier. Reviens quand tu auras servi la commande des toits, monté la charpente de Madame Pauline et remis mon programme en ordre.',
        intro: ['Ha ! Mes trois travaux sont faits, apprenti. Il reste la plus grande charpente : le toit de la mairie.', 'Plusieurs plans à lire, un triangle à construire au compas, et des angles à retrouver. Prêt ?'],
      },
    ],
    treasure: {
      x: 23, y: 14, needs: 'rapporteur',
      hint: 'Un buisson cache une vieille caisse de charpentier… Il faudrait un <b>rapporteur</b> pour savoir où creuser. (On le gagne au Port des Voiles.)',
      text: 'Avec le rapporteur, l\'angle est exact : ici ! Une équerre ancienne, gravée de triangles.',
    },
    lesson: [
      {
        text: 'Un triangle a <b>3 sommets</b>, <b>3 côtés</b> et <b>3 angles</b>. On le nomme par ses sommets : le triangle <b>ABC</b>.',
        svg: `<svg viewBox="0 0 400 230"><polygon points="70,190 330,190 230,40" fill="rgba(240,160,70,.25)" stroke="#6b4f2a" stroke-width="5" stroke-linejoin="round"/><circle cx="70" cy="190" r="7" fill="#1864ab"/><circle cx="330" cy="190" r="7" fill="#1864ab"/><circle cx="230" cy="40" r="7" fill="#e03131"/><text x="42" y="212" font-size="24" font-weight="800" fill="#1864ab">A</text><text x="336" y="212" font-size="24" font-weight="800" fill="#1864ab">B</text><text x="242" y="40" font-size="24" font-weight="800" fill="#e03131">C</text><text x="212" y="36" text-anchor="end" font-size="14" font-weight="800" fill="#e03131">sommet</text><path d="M300,190 A30,30 0 0 0 312,166" fill="none" stroke="#2f9e44" stroke-width="4"/><text x="262" y="160" font-size="15" font-weight="800" fill="#2f9e44">angle</text><text x="118" y="108" text-anchor="middle" font-size="15" font-weight="800" fill="#6b4f2a" transform="rotate(-43 118 108)">côté [AC]</text></svg>`,
      },
      {
        text: 'Les <b>codages</b> disent la vérité : des <b>traits identiques</b> = côtés de même longueur ; un <b>petit carré</b> = angle droit. Le dessin à main levée peut mentir !',
        svg: `<svg viewBox="0 0 420 230"><g stroke="#6b4f2a" stroke-width="4" fill="rgba(240,160,70,.25)" stroke-linejoin="round"><polygon points="20,150 130,150 75,50"/><polygon points="150,150 270,150 150,50"/><polygon points="290,150 400,150 345,60"/></g><g stroke="#d9480f" stroke-width="3" fill="none" stroke-linecap="round"><path d="M42,98 l8,8 M46,94 l8,8"/><path d="M108,98 l8,-8 M104,102 l8,-8"/><path d="M150,150 m0,-14 h14 v14"/><path d="M315,100 l10,0 M315,106 l10,0 M375,100 l-4,-9 M375,106 l-4,-9"/><path d="M340,150 l0,-9 M346,150 l0,-9"/></g><g font-size="15" font-weight="800" fill="#495057" text-anchor="middle"><text x="75" y="180">isocèle</text><text x="75" y="200" font-size="13">2 côtés égaux</text><text x="210" y="180">rectangle</text><text x="210" y="200" font-size="13">1 angle droit</text><text x="345" y="180">équilatéral</text><text x="345" y="200" font-size="13">3 côtés égaux</text></g></svg>`,
      },
      {
        text: 'Pour construire avec <b>3 longueurs</b> : <b>1.</b> le côté [AB] à la règle · <b>2.</b> un arc de centre A · <b>3.</b> un arc de centre B · <b>4.</b> C est à l\'intersection.',
        svg: (el) => {
          const sv = S.root(el, 400, 230);
          const A = { x: 60, y: 200 }, B = { x: 300, y: 200 }, C = { x: 210, y: 68 };
          const rA = geo.dist(A, C), rB = geo.dist(B, C);
          const win = (ctr, rr, col) => {
            const th = Math.atan2(C.y - ctr.y, C.x - ctr.x), d = 0.3;
            const len = rr * 2 * d;
            const p = S.el('path', { d: `M${ctr.x + rr * Math.cos(th - d)},${ctr.y + rr * Math.sin(th - d)} A${rr},${rr} 0 0 1 ${ctr.x + rr * Math.cos(th + d)},${ctr.y + rr * Math.sin(th + d)}`, fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': len + 2, 'stroke-dashoffset': len + 2 }, sv);
            return { p, len: len + 2 };
          };
          const ab = S.el('line', { x1: A.x, y1: A.y, x2: A.x, y2: A.y, stroke: '#6b4f2a', 'stroke-width': 5, 'stroke-linecap': 'round' }, sv);
          const a1 = win(A, rA, '#1c7ed6'), a2 = win(B, rB, '#2f9e44');
          const g = S.el('g', { opacity: 0 }, sv);
          beam(g, A, C, '#6b4f2a', 5); beam(g, B, C, '#6b4f2a', 5); dot(g, C, '#e03131'); vlabel(g, C, 'C', 0, -12);
          dot(sv, A); dot(sv, B); vlabel(sv, A, 'A', -4, 24); vlabel(sv, B, 'B', 4, 24);
          const cap = S.el('text', { x: 200, y: 224, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: '#495057' }, sv);
          const t0 = performance.now();
          const iv = setInterval(() => {
            if (!sv.isConnected) return clearInterval(iv);
            const t = ((performance.now() - t0) / 1000) % 9, k = (x0, x1) => clamp((t - x0) / (x1 - x0), 0, 1);
            ab.setAttribute('x2', A.x + (B.x - A.x) * k(0, 1));
            a1.p.setAttribute('stroke-dashoffset', a1.len * (1 - k(1.5, 3)));
            a2.p.setAttribute('stroke-dashoffset', a2.len * (1 - k(3.5, 5)));
            g.setAttribute('opacity', k(6, 6.6));
            cap.textContent = t < 1.4 ? '1. la règle : [AB]' : t < 3.4 ? '2. arc de centre A' : t < 5.4 ? '3. arc de centre B' : t < 6 ? '4. l\'intersection…' : 'C est trouvé !';
          }, 40);
        },
      },
      {
        text: 'Dans un triangle <b>isocèle</b>, le <b>sommet principal</b> est où se rejoignent les 2 côtés égaux. Les <b>2 angles à la base</b> ont la même mesure.',
        svg: `<svg viewBox="0 0 400 230"><polygon points="70,190 330,190 200,40" fill="rgba(240,160,70,.25)" stroke="#6b4f2a" stroke-width="5" stroke-linejoin="round"/><g stroke="#d9480f" stroke-width="3" stroke-linecap="round"><path d="M122,112 l10,9 M117,118 l10,9"/><path d="M278,112 l-10,9 M283,118 l-10,9"/></g><path d="M105,190 A35,35 0 0 0 92,163" fill="none" stroke="#1c7ed6" stroke-width="4"/><path d="M295,190 A35,35 0 0 1 308,163" fill="none" stroke="#1c7ed6" stroke-width="4"/><circle cx="200" cy="40" r="14" fill="none" stroke="#2f9e44" stroke-width="4"/><text x="226" y="48" font-size="16" font-weight="800" fill="#2f9e44">sommet principal</text><text x="200" y="215" text-anchor="middle" font-size="16" font-weight="800" fill="#1c7ed6">base : 2 angles égaux</text></svg>`,
      },
      {
        text: 'À toi ! Fais glisser le point <b>C</b> jusqu\'à l\'<b>intersection des deux arcs</b>.',
        act: (el, done) => {
          const sv = S.root(el, 600, 300);
          S.el('rect', { x: 0, y: 0, width: 600, height: 300, rx: 12, fill: '#fffdf5' }, sv);
          const A = { x: 140, y: 250 }, B = { x: 380, y: 250 }, Ct = { x: 290, y: 118 };
          const rA = geo.dist(A, Ct), rB = geo.dist(B, Ct);
          const win = (ctr, rr, col) => { const th = Math.atan2(Ct.y - ctr.y, Ct.x - ctr.x), d = 0.35; S.el('path', { d: `M${ctr.x + rr * Math.cos(th - d)},${ctr.y + rr * Math.sin(th - d)} A${rr},${rr} 0 0 1 ${ctr.x + rr * Math.cos(th + d)},${ctr.y + rr * Math.sin(th + d)}`, fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round' }, sv); };
          win(A, rA, '#1c7ed6'); win(B, rB, '#2f9e44');
          beam(sv, A, B, '#6b4f2a', 6); dot(sv, A); dot(sv, B); vlabel(sv, A, 'A', -4, 26); vlabel(sv, B, 'B', 4, 26);
          const rest = S.el('g', {}, sv);
          const cg = S.el('g', {}, sv);
          S.el('circle', { r: 11, fill: '#f08c00', stroke: '#fff', 'stroke-width': 3 }, cg);
          S.el('circle', { r: 30, fill: 'transparent' }, cg);
          const lab = vlabel(cg, { x: 0, y: 0 }, 'C', 0, -18);
          let P = { x: 470, y: 150 }, ok = false;
          const pl = () => cg.setAttribute('transform', `translate(${P.x},${P.y})`);
          pl();
          S.drag(cg, sv, {
            move: (p) => {
              if (ok) return;
              P = { x: clamp(p.x, 10, 590), y: clamp(p.y, 10, 290) }; pl();
              if (geo.dist(P, Ct) < 16) { ok = true; P = Ct; pl(); beam(rest, A, Ct, '#6b4f2a', 6); beam(rest, B, Ct, '#6b4f2a', 6); done(); }
            },
          });
        },
      },
    ],
    enigmes: {
      commande: {
        title: 'La commande des toits',
        consigne: '',
        build: (ctx) => buildCommande(ctx, ctx.el, {
          codeRounds: ['iso'],
          onSolved: () => ctx.win('Les toits sont commandés et la figure est bien codée ! Retiens : <b>le codage compte plus que le dessin</b>.'),
        }),
      },
      compas: {
        title: 'La charpente de Madame Pauline',
        consigne: '',
        build: (ctx) => buildCompas(ctx, ctx.el, {
          rounds: [{ iso: false }, { iso: true }],
          onSolved: () => ctx.win('Deux charpentes montées au compas ! Trois longueurs, deux arcs : le point C est à l\'intersection.'),
        }),
      },
      programme: {
        title: 'Le programme de construction',
        consigne: '',
        build: (ctx) => buildProgramme(ctx, ctx.el, {
          rounds: ['order', 'hole'],
          onSolved: () => ctx.win('L\'apprenti a construit les deux triangles : l\'ordre des étapes et le codage comptent !'),
        }),
      },
    },
    gardien: {
      title: 'La Grande Charpente',
      consigne: '',
      build: (ctx) => {
        const P1 = '<b>Étape 1 / 2</b> — ', P2 = '<b>Étape 2 / 2</b> — ';
        buildCommande(ctx, ctx.el, {
          hard: true, codeRounds: ['rectiso'], prefix: P1,
          onSolved: () => {
            Atlas.UI.toast('Étape 1 réussie !', 'good');
            setTimeout(() => {
              buildCompas(ctx, ctx.el, {
                rounds: [{ iso: true, angles: true, prefix: P2 }],
                onSolved: () => ctx.win('Ma mairie a un toit ! Bien lu, bien construit. Voici la page de l\'Atlas, et mon Sceau du triangle.'),
              });
            }, 900);
          },
        });
      },
    },
    tool: {
      id: 'sceau', name: 'Sceau du triangle',
      icon: '<svg viewBox="0 0 30 30"><circle cx="15" cy="15" r="13" fill="#f6d365" stroke="#a8842f" stroke-width="2"/><polygon points="15,7 23,21 7,21" fill="#fff7e6" stroke="#7c2d12" stroke-width="2" stroke-linejoin="round"/><path d="M12,17 l6,0" stroke="#d9480f" stroke-width="2"/></svg>',
    },
  });
})();
