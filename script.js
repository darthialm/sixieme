'use strict';

/* =========================================================
   RÉGLAGE DU PROFESSEUR
   Code d'accès à l'Espace professeur : remplace « prof6e » par ton propre code.
   (Protection légère : un élève très curieux peut lire ce fichier.)
   ========================================================= */
const CODE_PROF = 'prof6e';

/** Version du site : doit être la même que dans index.html (sinon le navigateur utilise un ancien fichier) */
const SITE_VERSION = '2026-11-10.2';

/* =========================================================
   Outils
   ========================================================= */
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
const eq = (a, b) => Math.abs(a - b) < 1e-9;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round1 = (v) => Math.round(v * 10) / 10;
const P10 = (k) => 10 ** k;
const NB = ' '; // espace fine insécable (séparateur des milliers)

/** Groupe les chiffres d'un entier par tranches de trois : "4819035621" -> "4 819 035 621" */
const groupInt = (s) => String(s).replace(/\B(?=(\d{3})+(?!\d))/g, NB);

/** Écriture décimale à la française : 2.5 -> "2,5", 7418 -> "7 418" */
function fmt(x) {
  const neg = x < 0;
  const s = (Math.round(Math.abs(x) * 1e6) / 1e6).toFixed(6).replace(/\.?0+$/, '');
  const [i, d] = s.split('.');
  return (neg ? '−' : '') + groupInt(i) + (d ? ',' + d : '');
}
/** Nombre m / 10^k écrit avec exactement k décimales (garde les zéros) */
function decStr(m, k, group = true) {
  if (k === 0) return group ? groupInt(String(m)) : String(m);
  const s = String(m).padStart(k + 1, '0');
  const i = s.slice(0, s.length - k), d = s.slice(s.length - k);
  return (group ? groupInt(i) : i) + ',' + d;
}

/** Fraction affichée (HTML) */
function F(n, d) {
  if (typeof n === 'number' && n < 0) return '−' + F(-n, d);
  return `<span class="frac"><span>${typeof n === 'number' ? groupInt(n) : n}</span><span>${typeof d === 'number' ? groupInt(d) : d}</span></span>`;
}

/** Lit une réponse : "7/3", "2,5", "4 819", "4" */
function parse(str) {
  if (str == null) return null;
  const s = String(str).trim().replace(/\s+/g, '').replace(/,/g, '.').replace(/[−–]/g, '-').replace(/[÷:]/g, '/');
  if (!s) return null;
  const m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (m) {
    const n = Number(m[1]), d = Number(m[2]);
    if (d === 0) return null;
    return { value: n / d, n, d, isFrac: true, raw: s };
  }
  if (/^-?\d+(\.\d+)?$/.test(s) || /^-?\.\d+$/.test(s)) return { value: Number(s), isFrac: false, raw: s };
  return null;
}

/** Champ de réponse */
function inp(kind = 'frac', label = 'Réponse') {
  const mode = kind === 'num' ? 'decimal' : 'text';
  return `<input class="ans ${kind}" type="text" inputmode="${mode}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${label}">`;
}
const val = (root, i = 0) => parse(root.querySelectorAll('.ans')[i]?.value);
const markInput = (root, i, ok) => root.querySelectorAll('.ans')[i]?.classList.add(ok ? 'right' : 'wrong');
const ficheLink = (ch, t = 'la fiche') => `<a href="#/${ch}/fiche">${t}</a>`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- Nombres en lettres (orthographe rectifiée : traits d'union partout) ---------- */
const UNITS_W = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
const TENS_W = { 2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante' };
function under100(n) {
  if (n < 17) return UNITS_W[n];
  if (n < 20) return 'dix-' + UNITS_W[n - 10];
  const t = Math.floor(n / 10), u = n % 10;
  if (t === 7) return n === 71 ? 'soixante-et-onze' : 'soixante-' + under100(n - 60);
  if (t === 8) return u === 0 ? 'quatre-vingts' : 'quatre-vingt-' + UNITS_W[u];
  if (t === 9) return 'quatre-vingt-' + under100(n - 80);
  if (u === 0) return TENS_W[t];
  return TENS_W[t] + (u === 1 ? '-et-un' : '-' + UNITS_W[u]);
}
function under1000(n) {
  const h = Math.floor(n / 100), r = n % 100;
  let s = h === 0 ? '' : h === 1 ? 'cent' : UNITS_W[h] + '-cent' + (r === 0 ? 's' : '');
  if (r) s = s ? s + '-' + under100(r) : under100(r);
  return s || 'zéro';
}
function numWords(n) {
  if (n < 1000) return under1000(n);
  const t = Math.floor(n / 1000), r = n % 1000;
  const tw = t === 1 ? 'mille' : under1000(t).replace(/(cent|vingt)s$/, '$1') + '-mille';
  return r ? tw + '-' + under1000(r) : tw;
}

/* =========================================================
   Briques de questions
   ========================================================= */
const withHints = (o, h) => { o.hints = h; return o; };
/** Remédiation d'un QCM : fn(indexChoisi, texteChoisi) renvoie un message (ou null) si la réponse est fausse */
const withRemed = (o, fn) => {
  o.remediate = (r) => {
    const sel = r.querySelector('.rb:checked'); if (!sel) return null;
    const i = Number(sel.dataset.o);
    return i === o._correct ? null : fn(i, o._opts[i]);
  };
  return o;
};

/** QCM générique (boutons radio) ; options : HTML. order: false pour garder l'ordre */
function mcq(prompt, options, correct, explain, { col = false, label, keepOrder = false, cls = '' } = {}) {
  const order = keepOrder ? options.map((_, i) => i) : shuffle(options.map((_, i) => i));
  const name = 'q' + Math.random().toString(36).slice(2);
  return {
    label,
    _correct: correct,
    _opts: options,
    q: `${prompt}<div class="choices${col ? ' col' : ''} ${cls}">${order.map((oi) => `<label class="choice${col ? ' text' : ''}"><input type="radio" name="${name}" class="rb" data-o="${oi}"> <span>${options[oi]}</span></label>`).join('')}</div>`,
    check(r) {
      const sel = r.querySelector('.rb:checked');
      if (!sel) return null;
      const ok = Number(sel.dataset.o) === correct;
      r.querySelectorAll('.rb').forEach((x) => {
        x.disabled = true;
        if (Number(x.dataset.o) === correct) x.parentElement.classList.add('is-good');
        else if (x.checked) x.parentElement.classList.add('is-bad');
      });
      return { ok, msg: typeof explain === 'function' ? explain(ok) : explain };
    },
  };
}

/** Cases à cocher : items [{html, ok, kind}] ; remed(kind, item) pour une case fausse cochée */
function multiQ(prompt, items, explain, remed, { col = false } = {}) {
  return {
    _items: items,
    q: `${prompt}<div class="choices${col ? ' col' : ''}">${items.map((it, j) => `<label class="choice${col ? ' text' : ''}"><input type="checkbox" class="cb" data-j="${j}"> <span>${it.html}</span></label>`).join('')}</div>`,
    remediate(r) {
      const cbs = [...r.querySelectorAll('.cb')];
      if (!cbs.some((c) => c.checked)) return null;
      const wrong = items.find((it, j) => !it.ok && cbs[j].checked);
      if (wrong) return remed(wrong.kind, wrong);
      const missing = items.filter((it, j) => it.ok && !cbs[j].checked).length;
      if (missing) return `Ce que tu as coché est juste, mais il en manque ${missing > 1 ? 'plusieurs' : 'une'}. Regarde à nouveau chaque proposition.`;
      return null;
    },
    check(r) {
      const cbs = [...r.querySelectorAll('.cb')];
      if (!cbs.some((c) => c.checked)) return null;
      let ok = true;
      cbs.forEach((c, j) => {
        const it = items[j];
        if (c.checked !== it.ok) ok = false;
        if (it.ok) c.parentElement.classList.add('is-good');
        else if (c.checked) c.parentElement.classList.add('is-bad');
        c.disabled = true;
      });
      return { ok, msg: explain };
    },
  };
}

/** Choisir des éléments dans l'ordre (ranger) : renvoie la liste des index cliqués */
function orderPicker(r) { return (r.dataset.order || '').split(',').filter((x) => x !== '').map(Number); }
function mountOrder(r) {
  const btns = [...r.querySelectorAll('.ordbtn')];
  const refresh = () => {
    const ord = orderPicker(r);
    btns.forEach((b) => {
      const k = ord.indexOf(Number(b.dataset.i));
      b.classList.toggle('sel', k >= 0);
      b.querySelector('.rk').textContent = k >= 0 ? k + 1 : '';
    });
    const out = r.querySelector('.ord-out');
    if (out) out.innerHTML = ord.length ? ord.map((i) => btns[i].dataset.txt).join(` <span class="sym">${r.dataset.sym || ''}</span> `) : '<span class="muted">Clique sur les nombres dans l\'ordre.</span>';
  };
  btns.forEach((b) => b.addEventListener('click', () => {
    let ord = orderPicker(r); const i = Number(b.dataset.i);
    ord = ord.includes(i) ? ord.filter((x) => x !== i) : [...ord, i];
    r.dataset.order = ord.join(',');
    refresh();
  }));
  r.querySelector('.ord-reset')?.addEventListener('click', () => { r.dataset.order = ''; refresh(); });
  refresh();
}
/* =========================================================
   GÉOMÉTRIE : calcul, planche de tracé, figures, animations
   ========================================================= */
const G = {
  add: (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  mul: (a, k) => ({ x: a.x * k, y: a.y * k }),
  dot: (a, b) => a.x * b.x + a.y * b.y,
  cross: (a, b) => a.x * b.y - a.y * b.x,
  len: (a) => Math.hypot(a.x, a.y),
  dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
  norm: (a) => { const l = Math.hypot(a.x, a.y) || 1; return { x: a.x / l, y: a.y / l }; },
  rot: (a, deg) => { const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r); return { x: a.x * c - a.y * s, y: a.x * s + a.y * c }; },
  perp: (a) => ({ x: -a.y, y: a.x }),
  mid: (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }),
};
const angDeg = (u, v) => (Math.acos(clamp(G.dot(u, v) / (G.len(u) * G.len(v) || 1), -1, 1)) * 180) / Math.PI;
const cm = (x) => `${fmt(x)} cm`;
const centroid = (...p) => ({ x: p.reduce((s, q) => s + q.x, 0) / p.length, y: p.reduce((s, q) => s + q.y, 0) / p.length });
/** distance d'un point à la droite qui porte l'objet linéaire */
const distToLine = (L, p) => Math.abs(G.cross(G.norm(L.d), G.sub(p, L.P)));
/** angle entre deux directions de droites, entre 0 et 90° */
const lineAngle = (d1, d2) => { const a = angDeg(d1, d2); return Math.min(a, 180 - a); };
const isPerp = (d1, d2, tol = 2) => Math.abs(lineAngle(d1, d2) - 90) <= tol;
const isPar = (d1, d2, tol = 2) => lineAngle(d1, d2) <= tol;
const okMark = (b) => (b ? '✔' : '✘');

function interLL(a, b) {
  const den = G.cross(a.d, b.d);
  if (Math.abs(den) < 1e-9) return [];
  const w = G.sub(b.P, a.P);
  const t = G.cross(w, b.d) / den, s = G.cross(w, a.d) / den;
  const e = 1e-6;
  if (t < a.t0 - e || t > a.t1 + e || s < b.t0 - e || s > b.t1 + e) return [];
  return [G.add(a.P, G.mul(a.d, t))];
}
function interLC(l, c) {
  const f = G.sub(l.P, c.c);
  const A = G.dot(l.d, l.d), B = 2 * G.dot(f, l.d), C = G.dot(f, f) - c.r * c.r;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return [];
  const sq = Math.sqrt(disc), out = [];
  for (const t of [(-B - sq) / (2 * A), (-B + sq) / (2 * A)]) if (t >= l.t0 - 1e-6 && t <= l.t1 + 1e-6) out.push(G.add(l.P, G.mul(l.d, t)));
  return out;
}
function interCC(a, b) {
  const d = G.dist(a.c, b.c);
  if (d < 1e-9 || d > a.r + b.r + 1e-9 || d < Math.abs(a.r - b.r) - 1e-9) return [];
  const x = (d * d + a.r * a.r - b.r * b.r) / (2 * d);
  const h = Math.sqrt(Math.max(0, a.r * a.r - x * x));
  const u = G.norm(G.sub(b.c, a.c)), m = G.add(a.c, G.mul(u, x)), p = G.perp(u);
  return h < 1e-9 ? [m] : [G.add(m, G.mul(p, h)), G.sub(m, G.mul(p, h))];
}

/* ---------- Codage des points (comme dans le cours) ---------- */
/** croix × centrée en p ; s = demi-taille */
const crossSVG = (p, s, cls) => `<path d="M${(p.x - s).toFixed(3)} ${(p.y - s).toFixed(3)} L${(p.x + s).toFixed(3)} ${(p.y + s).toFixed(3)} M${(p.x - s).toFixed(3)} ${(p.y + s).toFixed(3)} L${(p.x + s).toFixed(3)} ${(p.y - s).toFixed(3)}" class="${cls}"/>`;
/** petit trait qui coupe la droite de direction dir */
const dashSVG = (p, dir, s, cls) => { const n = G.mul(G.norm(G.perp(dir)), s); return `<line x1="${(p.x - n.x).toFixed(3)}" y1="${(p.y - n.y).toFixed(3)}" x2="${(p.x + n.x).toFixed(3)}" y2="${(p.y + n.y).toFixed(3)}" class="${cls}"/>`; };

/* =========================================================
   Planche de construction
   ========================================================= */
const TOOLS = [
  { id: 'seg', icon: '📏', label: 'Règle' },
  { id: 'hray', icon: '↗', label: 'Demi-droite' },
  { id: 'line', icon: '⟷', label: 'Droite' },
  { id: 'circle', icon: '◯', label: 'Compas' },
  { id: 'point', icon: '×', label: 'Point' },
  { id: 'perp', icon: '⊥', label: 'Équerre' },
  { id: 'par', icon: '∥', label: 'Parallèle' },
  { id: 'pan', icon: '✋', label: 'Déplacer' },
  { id: 'prot', icon: '◠', label: 'Rapporteur', extra: true },
];
const HELP = {
  seg: ['Règle : clique sur le point de départ.', 'Déplace, puis clique pour placer l\'extrémité.'],
  hray: ['Demi-droite : clique sur son origine.', 'Clique sur un point par lequel elle passe.'],
  line: ['Droite : clique sur un premier point.', 'Clique sur un second point de la droite.'],
  circle: ['Compas : clique sur le centre (pointe sèche).', 'Écarte le compas, puis clique pour tracer le cercle.'],
  point: ['Point : clique pour placer un point. Il s\'accroche aux intersections et aux tracés.'],
  pan: ['Déplacer : fais glisser la feuille pour déplacer toute la figure (si elle sort du cadre).'],
  perp: ['Équerre : clique sur la droite ou le segment de référence.', 'Clique sur le point par lequel doit passer la perpendiculaire.'],
  par: ['Parallèle (règle + équerre) : clique sur la droite de référence.', 'Clique sur le point par lequel doit passer la parallèle.'],
  prot: ['Rapporteur : clique sur le sommet de l\'angle (le centre du rapporteur se place dessus).', 'Clique sur un point du côté de départ : le 0° du rapporteur se place sur ce côté.', 'Tourne jusqu\'à la mesure voulue, puis clique pour faire une petite marque. Relie-la ensuite au sommet (outil Demi-droite).'],
};

function createBoard(host, opts = {}) {
  const W = 16, H = 11;
  const st = { points: [], objs: [], hist: [], tool: 'seg', step: 0, tmp: {}, cur: null, next: null, adj: null, uid: 1 };
  const taskNames = opts.names || [];
  const tools = TOOLS.filter((t) => (opts.tools ? opts.tools.includes(t.id) : !t.extra || opts.prot));

  host.innerHTML = `<div class="geo">
    <div class="geo-tools" role="toolbar" aria-label="Instruments">
      ${tools.map((t) => `<button type="button" class="tool" data-t="${t.id}">${t.icon}<span>${t.label}</span></button>`).join('')}
      <span class="sep"></span>
      <button type="button" class="tool" data-a="undo">↶<span>Annuler</span></button>
      <button type="button" class="tool" data-a="clear">✕<span>Effacer</span></button>
    </div>
    <div class="geo-names"></div>
    <div class="geo-status"><span class="geo-msg"></span><span class="geo-read"></span><span class="geo-adj" hidden><button type="button" data-d="-1" aria-label="Diminuer">−</button><button type="button" data-d="1" aria-label="Augmenter">+</button></span></div>
    <div class="geo-wrap"><svg class="geo-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Feuille de construction">
      <g class="g-grid"></g><g class="g-objs"></g><g class="g-prev"></g><g class="g-pts"></g></svg></div>
  </div>`;
  const svg = host.querySelector('.geo-svg');
  const gObjs = svg.querySelector('.g-objs'), gPts = svg.querySelector('.g-pts'), gPrev = svg.querySelector('.g-prev');
  const elMsg = host.querySelector('.geo-msg'), elRead = host.querySelector('.geo-read'), elAdj = host.querySelector('.geo-adj');
  const elNames = host.querySelector('.geo-names');

  let grid = '';
  for (let x = 1; x < W; x++) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" class="grid"/>`;
  for (let y = 1; y < H; y++) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" class="grid"/>`;
  svg.querySelector('.g-grid').innerHTML = grid;

  const pt = (id) => st.points.find((p) => p.id === id);
  const byName = (n) => st.points.find((p) => p.name === n);
  const used = (n) => st.points.some((p) => p.name === n);

  /* ----- noms des points ----- */
  function autoName() {
    const pool = [...taskNames, ...'ABCDEFGHIJKLMNPQRSTUVWXYZ'.split('')];
    return pool.find((n) => !used(n)) || 'P' + st.uid;
  }
  function takeName() {
    const n = st.next && !used(st.next) ? st.next : autoName();
    st.next = taskNames.find((x) => !used(x) && x !== n) || null;
    return n;
  }
  function renderNames() {
    if (!taskNames.length) { elNames.innerHTML = '<span>Les points sont nommés automatiquement.</span>'; return; }
    if (!st.next || used(st.next)) st.next = taskNames.find((x) => !used(x)) || null;
    elNames.innerHTML = `<span>Prochain point :</span>${taskNames.map((n) => `<button type="button" class="chip${st.next === n ? ' on' : ''}" data-n="${n}"${used(n) ? ' disabled' : ''}>${n}</button>`).join('')}${st.next ? '' : '<span>(lettres suivantes automatiques)</span>'}`;
  }
  elNames.addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b || b.disabled) return;
    st.next = b.dataset.n; renderNames();
  });

  function addPoint(x, y, created, locked = false, name = null, hidden = false) {
    const p = { id: st.uid++, x, y, name: name || takeName(), locked, hidden };
    st.points.push(p);
    if (created) created.push(p.id);
    return p;
  }

  /* ----- géométrie des objets ----- */
  function lin(o) {
    if (o.kind === 'seg') { const A = pt(o.a), B = pt(o.b); return { P: A, d: G.sub(B, A), t0: 0, t1: 1 }; }
    if (o.kind === 'line') { const A = pt(o.a), B = pt(o.b); return { P: A, d: G.sub(B, A), t0: -Infinity, t1: Infinity }; }
    if (o.kind === 'hray') { const A = pt(o.a), B = pt(o.b); return { P: A, d: G.sub(B, A), t0: 0, t1: Infinity }; }
    if (o.kind === 'perp' || o.kind === 'par') return { P: pt(o.p), d: o.d, t0: -Infinity, t1: Infinity };
    return null;
  }
  const circ = (o) => ({ c: pt(o.c), r: o.r });
  function project(o, p) {
    if (o.kind === 'circle') { const c = circ(o); return G.add(c.c, G.mul(G.norm(G.sub(p, c.c)), c.r)); }
    const L = lin(o); const dd = G.dot(L.d, L.d); if (dd < 1e-12) return null;
    const t = clamp(G.dot(G.sub(p, L.P), L.d) / dd, L.t0, L.t1);
    return G.add(L.P, G.mul(L.d, t));
  }
  function intersections() {
    const out = [];
    for (let i = 0; i < st.objs.length; i++) for (let j = i + 1; j < st.objs.length; j++) {
      const a = st.objs[i], b = st.objs[j];
      const ca = a.kind === 'circle', cb = b.kind === 'circle';
      if (ca && cb) out.push(...interCC(circ(a), circ(b)));
      else if (ca) out.push(...interLC(lin(b), circ(a)));
      else if (cb) out.push(...interLC(lin(a), circ(b)));
      else out.push(...interLL(lin(a), lin(b)));
    }
    return out.filter((p) => p.x > -0.01 && p.y > -0.01 && p.x < W + 0.01 && p.y < H + 0.01);
  }
  const th = () => { const m = svg.getScreenCTM(); return 16 / (m && m.a ? m.a : 40); };
  function snap(p, o = {}) {
    const T = th();
    let best = null, bd = T;
    for (const q of st.points) { if (q.hidden || q.id === o.exclude) continue; const d = G.dist(p, q); if (d < bd) { bd = d; best = { x: q.x, y: q.y, type: 'point', pid: q.id }; } }
    if (best) return best;
    bd = T;
    for (const q of intersections()) { const d = G.dist(p, q); if (d < bd) { bd = d; best = { x: q.x, y: q.y, type: 'inter' }; } }
    if (best) return best;
    bd = T * 0.75;
    for (const ob of st.objs) { const pr = project(ob, p); if (!pr) continue; const d = G.dist(p, pr); if (d < bd) { bd = d; best = { x: pr.x, y: pr.y, type: 'on' }; } }
    if (best) return best;
    return { x: clamp(p.x, 0.1, W - 0.1), y: clamp(p.y, 0.1, H - 0.1), type: 'free' };
  }
  function nearestLinear(p) {
    let best = null, bd = th();
    for (const o of st.objs) { if (o.kind === 'circle') continue; const pr = project(o, p); const d = G.dist(p, pr); if (d < bd) { bd = d; best = o; } }
    return best;
  }

  /* ----- instruments ----- */
  function rulerEnd(p) {
    const A = pt(st.tmp.a);
    const s = snap(p, { exclude: st.tmp.a });
    if (s.type === 'point' || s.type === 'inter') return { ...s, L: G.dist(A, s) };
    const v = G.sub(s, A), L = G.len(v);
    if (L < 1e-6) return { ...s, L: 0 };
    const Lr = Math.max(0.1, round1(L));
    const u = G.mul(v, 1 / L);
    return { x: A.x + u.x * Lr, y: A.y + u.y * Lr, type: s.type, L: Lr };
  }
  function compassR(p) {
    const C = pt(st.tmp.c);
    const s = snap(p, { exclude: st.tmp.c });
    if (s.type === 'point' || s.type === 'inter') return G.dist(C, s);
    return Math.max(0.1, round1(G.dist(C, p)));
  }

  /* ----- actions ----- */
  function msg(t, warn = false) { elMsg.textContent = t; elMsg.classList.toggle('warn', warn); }
  function help() { msg(HELP[st.tool][st.step] || HELP[st.tool][0]); }
  function commit(ids) { st.hist.push(ids); st.adj = null; }
  function cancel() {
    if (st.step > 0 && st.tmp.created) {
      const ids = new Set(st.tmp.created);
      st.points = st.points.filter((p) => !ids.has(p.id));
    }
    st.step = 0; st.tmp = {};
  }
  function setTool(t) {
    cancel(); st.tool = t; st.adj = null;
    host.querySelectorAll('.tool[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === t));
    svg.classList.toggle('panning', t === 'pan');
    help(); render();
  }
  function startPoint(s) {
    if (s.pid) return s.pid;
    return addPoint(s.x, s.y, st.tmp.created).id;
  }

  /** rapporteur : angle entier (en degrés) entre le côté de départ et la direction du pointeur */
  function protAt(p) {
    const C = pt(st.tmp.c), ref = st.tmp.ref; if (!C || !ref) return null;
    const v = G.sub(p, C), r = G.len(v); if (r < 0.2) return null;
    const a = Math.round(angDeg(ref, v)), sg = G.cross(ref, v) >= 0 ? 1 : -1;
    const R = clamp(r, 1.2, 9);
    const d = G.rot(ref, sg * a);
    return { x: C.x + d.x * R, y: C.y + d.y * R, a, sg, r: R };
  }
  function protSVG(C, ref, sg, a) {
    const R = 3.2, n = G.mul(G.perp(ref), sg);
    const at = (deg, rr) => G.add(C, G.add(G.mul(ref, rr * Math.cos((deg * Math.PI) / 180)), G.mul(n, rr * Math.sin((deg * Math.PI) / 180))));
    const e0 = at(0, R), e1 = at(180, R);
    let s = `<path d="M${e0.x} ${e0.y} A ${R} ${R} 0 0 ${sg > 0 ? 1 : 0} ${e1.x} ${e1.y} Z" class="prot"/>`;
    for (let k = 0; k <= 180; k += 5) { const q0 = at(k, R), q1 = at(k, R - (k % 10 ? 0.15 : 0.32)); s += `<line x1="${q0.x}" y1="${q0.y}" x2="${q1.x}" y2="${q1.y}" class="prot-tk"/>`; if (k % 30 === 0) { const q = at(k, R - 0.6); s += `<text x="${q.x}" y="${q.y}" class="prot-txt">${k}</text>`; } }
    if (a != null) { const q = at(a, R + 0.4); s += `<line x1="${C.x}" y1="${C.y}" x2="${q.x}" y2="${q.y}" class="pv-dash"/>`; }
    return s;
  }

  function handle(p) {
    const t = st.tool;
    if (t === 'point') {
      const s = snap(p);
      if (s.type === 'point') {
        const q = pt(s.pid);
        if (q && q.tick) { q.tick = false; q.name = takeName(); st.adj = null; commit([]); help(); render(); return; }
        msg('Il y a déjà un point ici.', true); return;
      }
      const c = []; addPoint(s.x, s.y, c); commit(c); help(); render(); return;
    }
    if (t === 'seg' || t === 'line' || t === 'hray') {
      if (st.step === 0) { st.tmp = { created: [] }; st.tmp.a = startPoint(snap(p)); st.step = 1; help(); render(); return; }
      const e = t === 'seg' ? rulerEnd(p) : snap(p, { exclude: st.tmp.a });
      if (e.pid === st.tmp.a || G.dist(e, pt(st.tmp.a)) < 0.05) { msg('Choisis un autre point.', true); return; }
      const b = e.pid || addPoint(e.x, e.y, st.tmp.created).id;
      const o = { id: st.uid++, kind: t, a: st.tmp.a, b };
      st.objs.push(o); st.tmp.created.push(o.id);
      commit(st.tmp.created);
      if (t === 'seg' && !e.pid && e.type !== 'inter') st.adj = { kind: 'len', o };
      st.step = 0; st.tmp = {}; help(); render(); return;
    }
    if (t === 'circle') {
      if (st.step === 0) { st.tmp = { created: [] }; st.tmp.c = startPoint(snap(p)); st.step = 1; help(); render(); return; }
      const r = compassR(p);
      const o = { id: st.uid++, kind: 'circle', c: st.tmp.c, r };
      st.objs.push(o); st.tmp.created.push(o.id); commit(st.tmp.created);
      st.adj = { kind: 'rad', o }; st.step = 0; st.tmp = {}; help(); render(); return;
    }
    if (t === 'prot') {
      if (st.step === 0) {
        const s = snap(p);
        if (s.type !== 'point') { msg('Clique sur un point : le sommet de l\'angle.', true); return; }
        st.tmp = { created: [], c: s.pid }; st.step = 1; help(); render(); return;
      }
      if (st.step === 1) {
        const s = snap(p, { exclude: st.tmp.c });
        const C = pt(st.tmp.c);
        if (s.type === 'free' || G.dist(s, C) < 0.3) { msg('Clique sur un point ou sur un tracé du côté de départ.', true); return; }
        st.tmp.ref = G.norm(G.sub(s, C)); st.step = 2; help(); render(); return;
      }
      const g = protAt(p); if (!g) return;
      const q = { id: st.uid++, x: g.x, y: g.y, name: '', tick: true };
      st.points.push(q); commit([q.id]);
      st.adj = { kind: 'ang', q, c: st.tmp.c, ref: st.tmp.ref, a: g.a, sg: g.sg, r: g.r };
      st.step = 0; st.tmp = {}; help(); render(); return;
    }
    if (t === 'perp' || t === 'par') {
      if (st.step === 0) {
        const o = nearestLinear(p); if (!o) { msg('Clique d\'abord sur un segment ou une droite déjà tracé.', true); return; }
        st.tmp = { created: [], l: o.id }; st.step = 1; help(); render(); return;
      }
      const ref = st.objs.find((o) => o.id === st.tmp.l);
      const pid = startPoint(snap(p));
      const u = G.norm(lin(ref).d);
      const o = { id: st.uid++, kind: t, p: pid, d: t === 'perp' ? G.perp(u) : u };
      st.objs.push(o); st.tmp.created.push(o.id); commit(st.tmp.created);
      st.step = 0; st.tmp = {}; help(); render();
    }
  }

  function undo() {
    if (st.step > 0) { cancel(); help(); render(); return; }
    const ids = st.hist.pop(); if (!ids) return;
    const s = new Set(ids);
    st.objs = st.objs.filter((o) => !s.has(o.id));
    st.points = st.points.filter((p) => !s.has(p.id));
    st.adj = null; render();
  }
  function clearAll() {
    cancel();
    st.objs = st.objs.filter((o) => o.locked);
    st.points = st.points.filter((p) => p.locked);
    st.hist = []; st.adj = null; render();
  }
  function adjust(d) {
    const a = st.adj; if (!a) return;
    if (a.kind === 'len') {
      const A = pt(a.o.a), B = pt(a.o.b);
      const L = round1(G.dist(A, B) + d * 0.1); if (L < 0.1) return;
      const u = G.norm(G.sub(B, A)); B.x = A.x + u.x * L; B.y = A.y + u.y * L;
    } else if (a.kind === 'rad') {
      a.o.r = Math.max(0.1, round1(a.o.r + d * 0.1));
    } else if (a.kind === 'ang') {
      const na = clamp(a.a + d, 0, 180); a.a = na;
      const C = pt(a.c), dd = G.rot(a.ref, a.sg * na);
      a.q.x = C.x + dd.x * a.r; a.q.y = C.y + dd.y * a.r;
    }
    render();
  }

  /* ----- affichage ----- */
  const L2 = (a, b, cls) => `<line x1="${a.x.toFixed(3)}" y1="${a.y.toFixed(3)}" x2="${b.x.toFixed(3)}" y2="${b.y.toFixed(3)}" class="${cls}"/>`;
  const far = (P, d, k) => G.add(P, G.mul(G.norm(d), k));
  function objSVG(o, cls) {
    if (o.kind === 'circle') { const c = circ(o); return `<circle cx="${c.c.x}" cy="${c.c.y}" r="${c.r}" class="${cls || 'g-circ'}"/>`; }
    const L = lin(o);
    let s;
    if (o.kind === 'seg') s = L2(L.P, G.add(L.P, L.d), cls || (o.locked ? 'g-given' : 'g-seg'));
    else if (o.kind === 'hray') s = L2(L.P, far(L.P, L.d, 40), cls || 'g-ray');
    else s = L2(far(L.P, L.d, -40), far(L.P, L.d, 40), cls || (o.locked ? 'g-given-line' : o.kind === 'line' ? 'g-line' : 'g-built'));
    if (o.lbl && !cls) {
      const q = G.add(o.lblAt, G.mul(G.norm(G.perp(L.d)), -0.45));
      s += `<text x="${q.x}" y="${q.y}" class="g-lbl g-lname">${o.lbl}</text>`;
    }
    return s;
  }
  function readout() {
    const a = st.adj;
    if (a && st.step === 0) {
      elAdj.hidden = false;
      if (a.kind === 'len') elRead.textContent = `Longueur : ${cm(G.dist(pt(a.o.a), pt(a.o.b)))}`;
      if (a.kind === 'rad') elRead.textContent = `Rayon : ${cm(a.o.r)}`;
      if (a.kind === 'ang') elRead.textContent = `Marque à ${a.a}°`;
    } else if (st.step === 0) { elAdj.hidden = true; elRead.textContent = ''; }
    else elAdj.hidden = true;
  }
  function render() {
    gObjs.innerHTML = st.objs.map((o) => objSVG(o)).join('');
    const all = st.points.filter((p) => !p.hidden);
    const named = all.filter((p) => !p.tick);
    const c = named.length ? centroid(...named) : { x: 8, y: 5 };
    gPts.innerHTML = all.map((p) => {
      let d = G.sub(p, c); d = G.len(d) < 0.3 ? { x: 0.3, y: -1 } : d;
      const l = G.add(p, G.mul(G.norm(G.add(G.mul(G.norm(d), 0.6), { x: 0.7, y: -0.7 })), 0.45));
      if (p.tick) return `<circle cx="${p.x}" cy="${p.y}" r="0.09" class="snap"/>`;
      return `${p.mark && p.mark.dash ? dashSVG(p, p.mark.dash, 0.2, 'g-pt') : crossSVG(p, 0.11, 'g-pt')}<text x="${l.x}" y="${l.y}" class="g-lbl">${p.name}</text>`;
    }).join('');
    renderNames(); readout(); preview();
  }
  function preview() {
    const p = st.cur;
    let s = '';
    if (st.step > 0) {
      const A = pt(st.tmp.a || st.tmp.c);
      if (A) s += `<circle cx="${A.x}" cy="${A.y}" r="0.22" class="pv-ring"/>`;
    }
    if (!p) { gPrev.innerHTML = s; return; }
    const t = st.tool;
    if ((t === 'seg' || t === 'line' || t === 'hray') && st.step === 1) {
      const A = pt(st.tmp.a);
      if (t === 'seg') {
        const e = rulerEnd(p);
        s += L2(A, e, 'pv') + `<circle cx="${e.x}" cy="${e.y}" r="0.09" class="snap"/>`;
        const m = G.mid(A, e), n = G.norm(G.perp(G.sub(e, A)));
        const lp = G.add(m, G.mul(n, -0.45));
        s += `<text x="${lp.x}" y="${lp.y}" class="pv-txt">${cm(e.L)}</text>`;
        elRead.textContent = `Longueur : ${cm(e.L)}`;
      } else {
        const e = snap(p, { exclude: st.tmp.a });
        if (G.dist(A, e) > 0.05) s += L2(t === 'hray' ? A : far(A, G.sub(e, A), -40), far(A, G.sub(e, A), 40), 'pv-dash');
        elRead.textContent = '';
      }
    } else if (t === 'circle' && st.step === 1) {
      const C = pt(st.tmp.c), r = compassR(p);
      const e = G.add(C, G.mul(G.norm(G.sub(p, C)), r));
      s += `<circle cx="${C.x}" cy="${C.y}" r="${r}" class="pv"/>` + L2(C, e, 'pv-dash');
      elRead.textContent = `Rayon : ${cm(r)}`;
    } else if (t === 'prot' && st.step === 1) {
      const C = pt(st.tmp.c), sp = snap(p, { exclude: st.tmp.c });
      if (sp.type !== 'free') s += `<circle cx="${sp.x}" cy="${sp.y}" r="0.12" class="snap"/>` + L2(C, far(C, G.sub(sp, C), 40), 'hl');
      elRead.textContent = '';
    } else if (t === 'prot' && st.step === 2) {
      const C = pt(st.tmp.c), g = protAt(p);
      if (g) { s += protSVG(C, st.tmp.ref, g.sg, g.a) + `<circle cx="${g.x}" cy="${g.y}" r="0.1" class="snap"/>`; elRead.textContent = `Angle : ${g.a}°`; }
    } else if ((t === 'perp' || t === 'par') && st.step === 0) {
      const o = nearestLinear(p); if (o) s += objSVG(o, 'hl');
    } else if ((t === 'perp' || t === 'par') && st.step === 1) {
      const ref = st.objs.find((o) => o.id === st.tmp.l);
      const sp = snap(p);
      s += objSVG(ref, 'hl');
      const u = G.norm(lin(ref).d), d = t === 'perp' ? G.perp(u) : u;
      s += L2(far(sp, d, -40), far(sp, d, 40), 'pv-dash');
    }
    if (st.step === 0 && t === 'prot') { const sp = snap(p); if (sp.type === 'point') s += `<circle cx="${sp.x}" cy="${sp.y}" r="0.14" class="snap"/>`; }
    if (st.step === 0 && t !== 'perp' && t !== 'par' && t !== 'prot') {
      const sp = snap(p);
      if (sp.type === 'point' || sp.type === 'inter') s += `<circle cx="${sp.x}" cy="${sp.y}" r="0.12" class="snap"/>`;
    }
    gPrev.innerHTML = s;
  }

  /* ----- souris et doigt ----- */
  function toCm(e) {
    const m = svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
    const q = svg.createSVGPoint(); q.x = e.clientX; q.y = e.clientY;
    const r = q.matrixTransform(m.inverse()); return { x: r.x, y: r.y };
  }
  let down = null;
  svg.addEventListener('pointerdown', (e) => {
    if (e.button && e.button !== 0) return;
    e.preventDefault();
    try { svg.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
    const p = toCm(e); st.cur = p;
    if (st.tool === 'pan') { down = { p, pan: true }; svg.classList.add('grabbing'); return; }
    down = { p, started: st.step === 0 };
    if (st.step === 0) handle(p);
  });
  svg.addEventListener('pointermove', (e) => {
    st.cur = toCm(e);
    if (down && down.pan) {
      const dx = st.cur.x - down.p.x, dy = st.cur.y - down.p.y;
      st.points.forEach((q) => { q.x += dx; q.y += dy; });
      st.objs.forEach((o) => { if (o.lblAt) o.lblAt = G.add(o.lblAt, { x: dx, y: dy }); });
      down.p = st.cur; render(); return;
    }
    preview();
  });
  svg.addEventListener('pointerup', (e) => {
    if (!down) return;
    if (down.pan) { down = null; svg.classList.remove('grabbing'); return; }
    const p = toCm(e); st.cur = p;
    const moved = G.dist(p, down.p) > 0.35;
    if (!down.started) handle(p);
    else if (moved && st.step > 0) handle(p);
    down = null;
  });
  svg.addEventListener('pointerleave', () => { if (!down) { st.cur = null; preview(); } });

  host.querySelector('.geo-tools').addEventListener('click', (e) => {
    const b = e.target.closest('.tool'); if (!b) return;
    if (b.dataset.t) setTool(b.dataset.t);
    else if (b.dataset.a === 'undo') undo();
    else if (b.dataset.a === 'clear') clearAll();
  });
  elAdj.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) adjust(Number(b.dataset.d)); });

  /* ----- éléments imposés par l'énoncé ----- */
  if (opts.given) {
    (opts.given.points || []).forEach((g) => { const q = addPoint(g.x, g.y, null, true, g.name, !!g.hidden); q.mark = g.mark || null; });
    (opts.given.segs || []).forEach(([a, b]) => st.objs.push({ id: st.uid++, kind: 'seg', a: byName(a).id, b: byName(b).id, locked: true }));
    (opts.given.lines || []).forEach(([a, b, lbl]) => {
      const A = byName(a), B = byName(b);
      st.objs.push({ id: st.uid++, kind: 'line', a: A.id, b: B.id, locked: true, lbl, lblAt: { x: B.x, y: B.y } });
    });
  }
  setTool(opts.tool || 'seg');

  /* ----- API pour la correction ----- */
  return {
    byName,
    hasSeg(n1, n2) {
      const a = byName(n1), b = byName(n2); if (!a || !b) return false;
      return st.objs.some((o) => o.kind === 'seg' && ((o.a === a.id && o.b === b.id) || (o.a === b.id && o.b === a.id)));
    },
    linears(includeLocked = false) {
      return st.objs.filter((o) => o.kind !== 'circle' && (includeLocked || !o.locked)).map((o) => ({ kind: o.kind, ...lin(o) }));
    },
    circles() { return st.objs.filter((o) => o.kind === 'circle').map((o) => ({ c: { x: pt(o.c).x, y: pt(o.c).y }, r: o.r })); },
    lockedLine(i = 0) { const o = st.objs.filter((x) => x.locked && x.kind === 'line')[i]; return o ? lin(o) : null; },
    drawnCount: () => st.hist.length,
  };
}

/* =========================================================
   Petites figures (fiches et corrections) — unités en cm
   marks : { A: 'x' | 'none' | {dash: direction} } ; par défaut une croix
   ========================================================= */
function figure(pts, items, { pad = 0.9, labels = true, center = null, extra = [], marks = {}, box = null, cls = '' } = {}) {
  const P = Object.values(pts).concat(extra);
  let minx, maxx, miny, maxy;
  if (box) [minx, miny, maxx, maxy] = box;
  else {
    minx = Math.min(...P.map((p) => p.x)) - pad; maxx = Math.max(...P.map((p) => p.x)) + pad;
    miny = Math.min(...P.map((p) => p.y)) - pad; maxy = Math.max(...P.map((p) => p.y)) + pad;
  }
  const named = Object.entries(pts).filter(([n]) => !n.startsWith('_'));
  const c = center || (named.length ? centroid(...named.map(([, p]) => p)) : { x: (minx + maxx) / 2, y: (miny + maxy) / 2 });
  let lbl = '';
  if (labels) {
    for (const [n, p] of named) {
      const mk = marks[n] === undefined ? 'x' : marks[n];
      if (mk === 'x') lbl += crossSVG(p, 0.12, 'f-cross');
      else if (mk && mk.dash) lbl += dashSVG(p, mk.dash, 0.18, 'f-mark f-dash');
      let u = G.len(G.sub(p, c)) < 0.2 ? { x: 0, y: -1 } : G.norm(G.sub(p, c));
      if (mk && mk.dash) { const n2 = G.norm(G.perp(mk.dash)); u = G.dot(n2, u) >= 0 ? n2 : G.mul(n2, -1); u = G.norm(G.add(u, G.mul(G.norm(mk.dash), 0.5))); }
      const q = G.add(p, G.mul(u, 0.42));
      lbl += `<text x="${q.x}" y="${q.y}" class="f-lbl">${n}</text>`;
    }
  }
  const k = Math.max(1, (maxx - minx) / 8.5).toFixed(2);
  return `<svg class="fig ${cls}" style="--k:${k}" viewBox="${minx.toFixed(2)} ${miny.toFixed(2)} ${(maxx - minx).toFixed(2)} ${(maxy - miny).toFixed(2)}" role="img" aria-label="Figure">${items.join('')}${lbl}</svg>`;
}
const F2 = {
  seg: (a, b, c = 'f-seg') => `<line x1="${a.x.toFixed(3)}" y1="${a.y.toFixed(3)}" x2="${b.x.toFixed(3)}" y2="${b.y.toFixed(3)}" class="${c}"/>`,
  xline: (p, d, c = 'f-red', k = 30) => { const u = G.norm(d); return F2.seg(G.sub(p, G.mul(u, k)), G.add(p, G.mul(u, k)), c); },
  ray: (o, through, c = 'f-seg', k = 30) => F2.seg(o, G.add(o, G.mul(G.norm(G.sub(through, o)), k)), c),
  circle: (c, r, cls = 'f-circ') => `<circle cx="${c.x}" cy="${c.y}" r="${r}" class="${cls}"/>`,
  disk: (c, r) => `<circle cx="${c.x}" cy="${c.y}" r="${r}" class="f-disk"/>`,
  arcAround: (c, r, toward, spread = 18, cls = 'f-arc') => {
    const u = G.norm(G.sub(toward, c));
    const a = G.add(c, G.mul(G.rot(u, -spread), r)), b = G.add(c, G.mul(G.rot(u, spread), r));
    return `<path d="M${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}" class="${cls}"/>`;
  },
  arcPts: (c, r, a, b, cls = 'f-arc') => `<path d="M${a.x} ${a.y} A ${r} ${r} 0 0 ${G.cross(G.sub(a, c), G.sub(b, c)) > 0 ? 1 : 0} ${b.x} ${b.y}" class="${cls}"/>`,
  right: (f, u, v, s = 0.28) => {
    const a = G.add(f, G.mul(G.norm(u), s)), b = G.add(a, G.mul(G.norm(v), s)), c = G.add(f, G.mul(G.norm(v), s));
    return `<path d="M${a.x} ${a.y} L${b.x} ${b.y} L${c.x} ${c.y}" class="f-mark"/>`;
  },
  ticks: (a, b, n = 2) => {
    const m = G.mid(a, b), u = G.norm(G.sub(b, a)), v = G.perp(u);
    let s = '';
    for (let i = 0; i < n; i++) {
      const o = G.add(m, G.mul(u, (i - (n - 1) / 2) * 0.12));
      s += F2.seg(G.add(G.add(o, G.mul(v, 0.16)), G.mul(u, 0.05)), G.sub(G.sub(o, G.mul(v, 0.16)), G.mul(u, 0.05)), 'f-mark');
    }
    return s;
  },
  len: (a, b, txt, c) => {
    const m = G.mid(a, b);
    let n = G.norm(G.perp(G.sub(b, a)));
    if (c && G.dot(n, G.sub(m, c)) < 0) n = G.mul(n, -1);
    const q = G.add(m, G.mul(n, 0.38));
    return `<text x="${q.x}" y="${q.y}" class="f-len">${txt}</text>`;
  },
  text: (p, txt, cls = 'f-len') => `<text x="${p.x}" y="${p.y}" class="${cls}">${txt}</text>`,
  /** extrémité d'un segment : petit trait perpendiculaire (├──┤) */
  end: (p, dir) => dashSVG(p, dir, 0.3, 'f-seg'),
};

/* =========================================================
   ANIMATIONS DES CONSTRUCTIONS
   ========================================================= */
const ln = (a, b, cls) => `<line x1="${a.x.toFixed(3)}" y1="${a.y.toFixed(3)}" x2="${b.x.toFixed(3)}" y2="${b.y.toFixed(3)}" class="${cls}"/>`;
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const ang2 = (v) => Math.atan2(v.y, v.x);
function arcPath(c, r, a0, a1) {
  const p0 = { x: c.x + r * Math.cos(a0), y: c.y + r * Math.sin(a0) };
  const p1 = { x: c.x + r * Math.cos(a1), y: c.y + r * Math.sin(a1) };
  return `M${p0.x.toFixed(3)} ${p0.y.toFixed(3)} A ${r} ${r} 0 ${Math.abs(a1 - a0) > Math.PI ? 1 : 0} ${a1 > a0 ? 1 : 0} ${p1.x.toFixed(3)} ${p1.y.toFixed(3)}`;
}
/** point nommé ; mark : 'x' (croix), 'none' (intersection, sommet), {dash: dir} */
function ptSVG(name, p, center, alpha = 1, mark = 'x') {
  let u = G.len(G.sub(p, center)) < 0.2 ? { x: 0, y: -1 } : G.norm(G.sub(p, center));
  if (mark && mark.dash) { const n2 = G.norm(G.perp(mark.dash)); u = G.dot(n2, u) >= 0 ? n2 : G.mul(n2, -1); }
  const q = G.add(p, G.mul(u, 0.42));
  const m = mark === 'x' ? crossSVG(p, 0.12, 'f-cross') : mark && mark.dash ? dashSVG(p, mark.dash, 0.18, 'f-mark f-dash') : '';
  return `<g style="opacity:${alpha.toFixed(2)}">${m}<text x="${q.x}" y="${q.y}" class="f-lbl">${name}</text></g>`;
}

/** Les instruments dessinés */
const INSTR = {
  pencil(p) {
    const q = { x: p.x + 0.45, y: p.y - 1.05 };
    return ln(p, q, 'a-pencil') + `<circle cx="${p.x}" cy="${p.y}" r="0.07" class="a-tip"/>`;
  },
  ruler(A, B, side) {
    const u = G.norm(G.sub(B, A)), L = G.dist(A, B);
    const a = G.sub(A, G.mul(u, 0.4)), b = G.add(B, G.mul(u, 0.7)), w = 0.85;
    const poly = [a, b, G.add(b, G.mul(side, w)), G.add(a, G.mul(side, w))];
    let s = `<polygon points="${poly.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ')}" class="a-ruler"/>`;
    const n = Math.floor((L + 0.6) * 2);
    for (let k = 0; k <= n; k++) {
      const p = G.add(A, G.mul(u, k * 0.5));
      s += ln(p, G.add(p, G.mul(side, k % 2 ? 0.16 : 0.3)), 'a-tick');
      if (k % 2 === 0) { const q = G.add(p, G.mul(side, 0.52)); s += `<text x="${q.x}" y="${q.y}" class="a-txt">${k / 2}</text>`; }
    }
    return s;
  },
  compass(C, P) {
    const r = G.dist(C, P), m = G.mid(C, P);
    let n = G.norm(G.perp(G.sub(P, C)));
    if (n.y > 0) n = G.mul(n, -1);
    const H = G.add(m, G.mul(n, Math.max(0.8, r * 0.4)));
    return ln(C, H, 'a-leg') + ln(P, H, 'a-leg') + ln(H, G.add(H, G.mul(n, 0.45)), 'a-leg')
      + `<circle cx="${H.x}" cy="${H.y}" r="0.13" class="a-hinge"/><circle cx="${P.x}" cy="${P.y}" r="0.07" class="a-tip"/>`;
  },
  square(F, u, v, a = 1.7, b = 2.6) {
    const p = [F, G.add(F, G.mul(G.norm(u), a)), G.add(F, G.mul(G.norm(v), b))];
    return `<polygon points="${p.map((q) => `${q.x.toFixed(3)},${q.y.toFixed(3)}`).join(' ')}" class="a-square"/>` + F2.right(F, u, v, 0.3);
  },
};

/** Fabriques d'étapes : draw(t, final) renvoie le dessin à l'avancement t (0 → 1) */
const STEP = {
  seg(A, B, text, { side, ends = [], center, cls = 'f-seg', endMarks = false }) {
    return {
      text,
      draw(t, final) {
        const E = lerp(A, B, final ? 1 : t);
        let s = F2.seg(A, E, cls);
        ends.forEach(([n, p, mk], i) => { if (i === 0 || final || t >= 1) s += ptSVG(n, p, center, 1, mk || 'x'); });
        if (!final) s += INSTR.ruler(A, B, G.mul(side, -1)) + INSTR.pencil(E);
        return s;
      },
    };
  },
  arc(C, r, a0, a1, text) {
    return {
      text,
      draw(t, final) {
        const a = a0 + (a1 - a0) * (final ? 1 : t);
        let s = t > 0.01 || final ? `<path d="${arcPath(C, r, a0, a)}" class="f-arc"/>` : '';
        if (!final) s += INSTR.compass(C, { x: C.x + r * Math.cos(a), y: C.y + r * Math.sin(a) });
        return s;
      },
    };
  },
  fullCircle(C, r, text, a0 = -Math.PI / 2) {
    return {
      text, dur: 2600,
      draw(t, final) {
        if (final || t >= 0.999) return F2.circle(C, r, 'f-circ');
        const a = a0 + 2 * Math.PI * t;
        return (t > 0.01 ? `<path d="${arcPath(C, r, a0, a)}" class="f-circ"/>` : '') + INSTR.compass(C, { x: C.x + r * Math.cos(a), y: C.y + r * Math.sin(a) });
      },
    };
  },
  point(name, p, center, text, extra = '', mark = 'none') {
    return { text, dur: 900, draw: (t, final) => (final ? extra : '') + ptSVG(name, p, center, final ? 1 : Math.min(1, t * 1.6), mark) };
  },
  measure(B, C, M, text, side) {
    return { text, draw: (t, final) => (final ? '' : INSTR.ruler(B, C, G.mul(side, -1)) + INSTR.pencil(lerp(B, M, t))) };
  },
  xline(P, Q, text, side, cls = 'f-red', ext = 1) {
    return {
      text,
      draw(t, final) {
        const u = G.norm(G.sub(Q, P)), a = G.sub(P, G.mul(u, ext)), b = G.add(Q, G.mul(u, ext));
        const E = lerp(a, b, final ? 1 : t);
        return F2.seg(a, E, cls) + (final ? '' : INSTR.ruler(a, b, side) + INSTR.pencil(E));
      },
    };
  },
  slide(start, F, u, v, text) {
    return { text, draw: (t, final) => (final ? '' : INSTR.square(lerp(start, F, t), u, v)) };
  },
  /** équerre qui glisse le long d'une règle fixe (tracé d'une parallèle) */
  slideRuler(R0, R1, side, start, F, u, v, text) {
    return { text, dur: 2200, draw: (t, final) => (final ? '' : INSTR.ruler(R0, R1, side) + INSTR.square(lerp(start, F, t), u, v)) };
  },
  marks(svg, text) { return { text, dur: 900, draw: () => svg }; },
};
const awayFrom = (A, B, other) => { let n = G.norm(G.perp(G.sub(B, A))); if (G.dot(n, G.sub(other, A)) > 0) n = G.mul(n, -1); return n; };

/* ---------- Lecteur ---------- */
function makePlayer(host, scene, { atEnd = false } = {}) {
  const P = scene.pts, pad = 1.4;
  let minx = Math.min(...P.map((p) => p.x)) - pad, maxx = Math.max(...P.map((p) => p.x)) + pad;
  let miny = Math.min(...P.map((p) => p.y)) - pad - 0.8, maxy = Math.max(...P.map((p) => p.y)) + pad;
  if (scene.box) [minx, miny, maxx, maxy] = scene.box;
  const k = Math.max(1, (maxx - minx) / 8.5).toFixed(2);
  host.innerHTML = `<div class="player">
    <svg class="fig anim-svg" style="--k:${k}" viewBox="${minx.toFixed(2)} ${miny.toFixed(2)} ${(maxx - minx).toFixed(2)} ${(maxy - miny).toFixed(2)}" role="img" aria-label="Animation de la construction"></svg>
    <p class="pl-text" aria-live="polite"></p>
    <div class="pl-bar">
      <button type="button" data-a="restart" title="Recommencer" aria-label="Recommencer">⏮</button>
      <button type="button" data-a="prev" title="Étape précédente" aria-label="Étape précédente">◀</button>
      <button type="button" data-a="play" class="pl-play" aria-label="Lecture">▶ Lecture</button>
      <button type="button" data-a="next" title="Étape suivante" aria-label="Étape suivante">▶|</button>
    </div></div>`;
  const svg = host.querySelector('svg'), txt = host.querySelector('.pl-text'), bPlay = host.querySelector('.pl-play');
  const n = scene.steps.length;
  let cur = atEnd ? n : 0, t = 0, playing = false, last = 0, pause = 0;
  function draw() {
    let s = (scene.base || []).join('');
    for (let i = 0; i < Math.min(cur, n); i++) s += scene.steps[i].draw(1, true);
    if (cur < n) s += scene.steps[cur].draw(t, false);
    s += (scene.top || []).join('');
    svg.innerHTML = s;
    txt.innerHTML = cur < n ? `<b>Étape ${cur + 1} / ${n} :</b> ${scene.steps[cur].text}` : `<b>${scene.endText || 'Construction terminée.'}</b> Clique sur ▶ pour la revoir.`;
    bPlay.textContent = playing ? '⏸ Pause' : '▶ Lecture';
  }
  function frame(ts) {
    if (!playing || !svg.isConnected) { playing = false; return; }
    const dt = last ? ts - last : 16; last = ts;
    if (pause > 0) {
      pause -= dt;
      if (pause <= 0) { cur++; t = 0; if (cur >= n) { playing = false; draw(); return; } }
    } else {
      t = Math.min(1, t + dt / (scene.steps[cur].dur || 1800));
      if (t >= 1) pause = 700;
    }
    draw();
    requestAnimationFrame(frame);
  }
  function play() { if (cur >= n) { cur = 0; t = 0; } playing = true; last = 0; pause = 0; requestAnimationFrame(frame); draw(); }
  host.querySelector('.pl-bar').addEventListener('click', (e) => {
    const a = e.target.closest('button')?.dataset.a; if (!a) return;
    if (a === 'play') { if (playing) { playing = false; draw(); } else play(); return; }
    playing = false;
    if (a === 'restart') { cur = 0; t = 0; play(); return; }
    if (a === 'prev') { if (cur >= n) { cur = n - 1; t = 1; } else if (cur > 0) { cur--; t = 1; } else t = 0; }
    if (a === 'next') { if (cur < n && t < 1) t = 1; else if (cur < n) { cur++; t = cur < n ? 1 : 0; } }
    draw();
  });
  draw();
  return { play };
}
/* =========================================================
   CHAPITRE 1 — DROITES (parallèles et perpendiculaires)
   ========================================================= */
const PRIME = '′';
const dName = (s) => `(${s})`;
const BOX = [0, 0, 10, 6];
const dirDeg = (deg) => G.rot({ x: 1, y: 0 }, deg);
/** nom d'une droite écrit sur la figure, près du bord droit de la boîte */
function lineLabel(P, u, txt, box = BOX, off = 0.35) {
  const [x0, y0, x1, y1] = box;
  let best = null;
  for (let t = -20; t <= 20; t += 0.05) {
    const q = G.add(P, G.mul(u, t));
    if (q.x > x0 + 0.4 && q.x < x1 - 0.5 && q.y > y0 + 0.45 && q.y < y1 - 0.45 && (!best || q.x > best.x)) best = q;
  }
  if (!best) return '';
  let n = G.norm(G.perp(u)); if (n.y > 0) n = G.mul(n, -1);
  const q = G.add(G.add(best, G.mul(u, u.x > 0 ? -0.25 : 0.25)), G.mul(n, off));
  return F2.text(q, txt, 'f-lname');
}

/* ---------- 1. Codage d'un point ---------- */
const CODAGE = {
  seul: { good: ['x', 'plus'], bad: ['under', 'glued', 'square', 'letter'], q: 'Quel est le bon codage pour un point P <b>seul</b> sur la feuille ?' },
  droite: { good: ['dash'], bad: ['xon', 'near'], q: 'Le point P est <b>sur la droite</b>. Quel est le bon codage ?' },
  inter: { good: ['plain'], bad: ['xadd', 'vbar'], q: 'P est le point d\'<b>intersection</b> des deux droites. Quel est le bon codage ?' },
  sommet: { good: ['plain'], bad: ['xall'], q: 'A, B et C sont les <b>sommets</b> du triangle. Quel est le bon codage ?' },
};
const CODAGE_MSG = {
  under: 'La lettre est juste sous la croix, collée à elle : le dessin devient confus. On écrit le nom <b>à côté</b> de la croix, un peu décalé.',
  glued: 'La lettre est collée à la croix. On l\'écrit un peu à côté, sans la toucher.',
  square: 'On ne marque pas un point avec un carré : on trace une petite croix (× ou +).',
  letter: 'Une lettre seule ne montre pas où est exactement le point : il faut une croix.',
  xon: 'Sur une droite, on ne fait pas de croix : on marque le point par un <b>petit trait</b> qui coupe la droite.',
  near: 'Sans marque, on ne sait pas où est P sur la droite. On trace un <b>petit trait</b> qui coupe la droite.',
  xadd: 'À l\'intersection de deux droites, le croisement marque déjà le point : on <b>n\'ajoute rien</b>, on écrit seulement son nom.',
  vbar: 'À l\'intersection, le croisement suffit : on n\'ajoute pas de trait, on écrit seulement le nom.',
  xall: 'Les sommets sont déjà marqués par les « coins » de la figure : on n\'ajoute pas de croix.',
};
const CODAGE_RULE = {
  seul: 'Un point seul se marque par une petite croix (× ou +), avec son nom écrit à côté, un peu décalé.',
  droite: 'Un point sur une droite se marque par un petit trait qui coupe la droite, avec son nom à côté.',
  inter: 'Un point à l\'intersection de deux droites est déjà marqué par le croisement : on écrit seulement son nom.',
  sommet: 'Les sommets d\'une figure sont déjà marqués par les coins : on écrit seulement les noms.',
};
function codageSVG(ctx, kind) {
  const X = (x, y, s = 4) => `<path d="M${x - s} ${y - s} L${x + s} ${y + s} M${x - s} ${y + s} L${x + s} ${y - s}" class="cd-mk"/>`;
  const T = (x, y, t) => `<text x="${x}" y="${y}" class="cd-lbl">${t}</text>`;
  let s = '';
  if (ctx === 'seul') {
    if (kind === 'x') s = X(28, 25) + T(38, 17, 'P');
    if (kind === 'plus') s = `<path d="M23 25 H33 M28 20 V30" class="cd-mk"/>` + T(38, 17, 'P');
    if (kind === 'under') s = X(30, 16) + T(30, 29, 'P');
    if (kind === 'glued') s = T(24, 26, 'P') + X(33, 24);
    if (kind === 'square') s = `<rect x="23" y="19" width="12" height="12" class="cd-mk"/>` + T(29, 26, 'P');
    if (kind === 'letter') s = T(30, 25, 'P');
  } else if (ctx === 'droite') {
    s = '<line x1="4" y1="34" x2="56" y2="12" class="cd-ln"/>';
    const p = { x: 30, y: 23 }, n = G.norm({ x: 22, y: 52 });
    if (kind === 'dash') s += `<line x1="${p.x - n.x * 5}" y1="${p.y - n.y * 5}" x2="${p.x + n.x * 5}" y2="${p.y + n.y * 5}" class="cd-mk"/>` + T(25, 14, 'P');
    if (kind === 'xon') s += X(p.x, p.y) + T(25, 14, 'P');
    if (kind === 'near') s += T(25, 14, 'P');
  } else if (ctx === 'inter') {
    s = '<line x1="6" y1="36" x2="54" y2="8" class="cd-ln"/><line x1="8" y1="8" x2="52" y2="36" class="cd-ln"/>';
    const c = { x: 30.4, y: 22 };
    if (kind === 'xadd') s += X(c.x, c.y, 4.5);
    if (kind === 'vbar') s += `<line x1="${c.x}" y1="${c.y - 6}" x2="${c.x}" y2="${c.y + 6}" class="cd-mk"/>`;
    s += T(c.x, c.y - 9, 'P');
  } else {
    s = '<path d="M10 36 L50 36 L26 8 Z" class="cd-ln"/>';
    if (kind === 'xall') s += X(10, 36) + X(50, 36) + X(26, 8);
    s += T(5, 40, 'A') + T(55, 40, 'B') + T(26, 4.5, 'C');
  }
  return `<svg class="cd-svg" viewBox="0 0 60 42" role="img" aria-label="Codage">${s}</svg>`;
}
function genCodage() {
  const ctx = pick(Object.keys(CODAGE)), C = CODAGE[ctx];
  const good = pick(C.good);
  const bads = shuffle([...C.bad]).slice(0, Math.min(3, C.bad.length));
  const kinds = [good, ...bads];
  const o = mcq(`<p class="statement">${C.q}</p>`, kinds.map((k) => codageSVG(ctx, k)), 0,
    `${CODAGE_RULE[ctx]}`, { cls: 'pics' });
  return withRemed(withHints(o, [
    `Relis « Partie 1 : le point » dans ${ficheLink('droites')}. Où se trouve le point : seul, sur une droite, à une intersection, ou comme sommet ?`,
    'Exemple : pour un point M seul, on trace une petite croix et on écrit M à côté, un peu décalé (et pas collé à la croix).',
    'Outil — le codage dépend de la situation :<ul><li>point seul → une croix × ou + ;</li><li>point sur une droite → un petit trait qui coupe la droite ;</li><li>intersection ou sommet → rien à ajouter, juste le nom.</li></ul>',
  ]), (i) => CODAGE_MSG[kinds[i]]);
}

/* ---------- Figures de droites ---------- */
/** droite de direction aléatoire passant près du centre de la boîte */
function randLine(maxDeg = 28, c = { x: 5, y: 3 }) {
  const u = dirDeg(rand(-maxDeg, maxDeg) || 7);
  return { P: c, u };
}
const NAMESETS = [['A', 'B', 'C', 'D', 'E'], ['M', 'N', 'P', 'R', 'S'], ['E', 'F', 'G', 'H', 'K'], ['R', 'S', 'T', 'U', 'V'], ['I', 'J', 'K', 'L', 'M']];

/** droite (d) avec des points dessus (petit trait) et en dehors (croix) */
function membershipScene() {
  const L = randLine(25), names = shuffle([...pick(NAMESETS)]);
  const nOn = 3, on = names.slice(0, nOn), off = names.slice(nOn);
  const pts = {}, marks = {};
  const ts = shuffle([-3.6, -1.9, -0.2, 1.3, 2.6]).slice(0, nOn).sort((a, b) => a - b);
  on.forEach((n, i) => { pts[n] = G.add(L.P, G.mul(L.u, ts[i])); marks[n] = { dash: L.u }; });
  const nrm = G.perp(L.u);
  off.forEach((n, i) => {
    const t = [-2.4, 1.2][i] + rand(-4, 4) / 10, s = (i ? -1 : 1) * (rand(9, 15) / 10);
    pts[n] = G.add(G.add(L.P, G.mul(L.u, t)), G.mul(nrm, s)); marks[n] = 'x';
  });
  const fig = (lbl = dName('d')) => figure(pts, [F2.xline(L.P, L.u, 'f-seg'), lineLabel(L.P, L.u, lbl)], { box: BOX, marks });
  return { L, on, off, pts, fig };
}

/* ---------- 2. Appartenance et alignement ---------- */
function genAppartient(hard = false) {
  const S = membershipScene();
  const v = hard ? rand(1, 2) : rand(0, 2); // ★ : droite nommée par deux de ses points, ou points alignés
  if (v < 2) {
    const isOn = Math.random() < 0.5;
    const X = isOn ? pick(S.on) : pick(S.off);
    let lineTxt = dName('d'), figHtml = S.fig();
    if (v === 1) { const [a, b] = shuffle(S.on.filter((n) => n !== X)).slice(0, 2); lineTxt = `(${a}${b})`; figHtml = S.fig(''); }
    return withRemed(withHints(mcq(`<p>Regarde la figure, puis complète avec ∈ ou ∉.</p>${figHtml}<p class="big">${X} … ${lineTxt}</p>`,
      [`${X} ∈ ${lineTxt}`, `${X} ∉ ${lineTxt}`], isOn ? 0 : 1,
      `${X} ${isOn ? 'est' : 'n\'est pas'} sur la droite ${lineTxt}, donc on écrit <b>${X} ${isOn ? '∈' : '∉'} ${lineTxt}</b> (« ${X} ${isOn ? 'appartient' : 'n\'appartient pas'} à la droite ${lineTxt} »).`, { keepOrder: true }),
    [`Que veulent dire les symboles ∈ et ∉ ? Relis « Appartenance » dans ${ficheLink('droites')}.`,
      'Exemple : si le point K est sur la droite (d), on écrit K ∈ (d) ; s\'il n\'y est pas, on écrit K ∉ (d).',
      'Outil : regarde le codage. Un point marqué par un petit trait est sur la droite ; un point marqué par une croix à l\'écart n\'y est pas.']),
    () => (isOn ? `Le point ${X} est marqué par un petit trait qui coupe la droite : il est <b>sur</b> la droite.` : `Le point ${X} est marqué par une croix, à l\'écart de la droite : il n'est <b>pas</b> dessus. ∈ veut dire « appartient à ».`));
  }
  const yes = Math.random() < 0.5;
  const trio = yes ? shuffle([...S.on]) : shuffle([...shuffle([...S.on]).slice(0, 2), pick(S.off)]);
  return withRemed(withHints(mcq(`<p>Les points ${trio.join(', ')} sont-ils alignés ?</p>${S.fig()}`,
    ['Oui', 'Non'], yes ? 0 : 1,
    yes ? `${trio.join(', ')} sont tous les trois sur la droite (d) : ils sont <b>alignés</b>.` : `${trio.find((n) => S.off.includes(n))} n'est pas sur la droite (d) qui passe par les deux autres : les points ne sont <b>pas alignés</b>.`, { keepOrder: true }),
  ['Des points alignés sont des points qui se trouvent sur une même droite. Est-ce le cas ici ?', 'Outil : pose ta règle sur deux des points. Le troisième est-il le long de la règle ?']),
  () => (yes ? 'Regarde bien : les trois points sont marqués d\'un petit trait sur la même droite.' : 'Un des trois points n\'est pas sur la droite : regarde les croix.'));
}

/* ---------- 3. Tous les noms d'une droite ---------- */
function genNoms() {
  const S = membershipScene();
  const [a, b, c] = S.on, [x, y] = S.off;
  const goods = shuffle([[a, b], [b, a], [a, c], [c, a], [b, c], [c, b]]).slice(0, 4).map(([p, q]) => ({ html: `(${p}${q})`, ok: true }));
  const bads = shuffle([
    { html: `(${a}${x})`, ok: false, kind: 'off', n: x },
    { html: `(${y}${c})`, ok: false, kind: 'off', n: y },
    { html: `[${a}${c}]`, ok: false, kind: 'seg' },
    { html: `(${x}${y})`, ok: false, kind: 'off', n: x },
  ]).slice(0, 3);
  const items = shuffle([...goods, ...bads]);
  const o = multiQ(`<p>Coche <b>tous</b> les noms possibles de la droite (h).</p>${S.fig('(h)')}`, items,
    `Les points ${a}, ${b} et ${c} sont sur (h). Deux de ces points suffisent pour nommer la droite, dans n'importe quel ordre : (${a}${b}), (${b}${a}), (${a}${c}), (${c}${a}), (${b}${c}), (${c}${b}).`,
    (kind, it) => (kind === 'seg' ? `${it.html} : les crochets désignent un <b>segment</b>. Une droite se note avec des <b>parenthèses</b>.`
      : `Dans ${it.html}, le point ${it.n} n'est pas sur la droite (h) : regarde, il est marqué par une croix à l'écart.`), { col: false });
  return withHints(o, [
    `Quels points sont sur la droite (h) ? Relis « La droite » dans ${ficheLink('droites')}.`,
    'Exemple : si M, N et P sont sur une droite, on peut l\'appeler (MN), (NM), (MP), (PM), (NP) ou (PN).',
    'Outil : une droite se nomme avec deux de ses points, entre parenthèses. L\'ordre des lettres ne compte pas.',
  ]);
}

/* ---------- 4. Position de deux droites ---------- */
function genPosition(hard = false) {
  // ★ : sécantes en dehors du cadre, ou sécantes presque perpendiculaires (à vérifier à l'équerre)
  const kind = hard ? pick(['out', 'sec']) : pick(['par', 'perp', 'sec', 'out', 'out']);
  const c = { x: rand(40, 60) / 10, y: rand(26, 34) / 10 };
  let L1, L2, X = null, extBox = null;
  if (kind === 'par') {
    const u = dirDeg(rand(-30, 30)), n = G.perp(u), h = rand(14, 22) / 10;
    L1 = { P: G.add(c, G.mul(n, -h / 2)), u }; L2 = { P: G.add(c, G.mul(n, h / 2)), u };
  } else if (kind === 'perp' || kind === 'sec') {
    const a = rand(-60, 60), u = dirDeg(a);
    const v = kind === 'perp' ? G.perp(u) : dirDeg(a + pick([1, -1]) * (hard ? rand(72, 80) : rand(32, 62)));
    L1 = { P: c, u }; L2 = { P: c, u: v }; X = c;
  } else {
    // sécantes en dehors du cadre : elles ont l'air parallèles
    const right = Math.random() < 0.5;
    X = { x: right ? rand(130, 170) / 10 : -rand(70, 110) / 10, y: rand(25, 35) / 10 };
    const xe = right ? 0 : 10, y1 = rand(5, 18) / 10, y2 = rand(42, 55) / 10;
    L1 = { P: X, u: G.norm(G.sub({ x: xe, y: y1 }, X)) }; L2 = { P: X, u: G.norm(G.sub({ x: xe, y: y2 }, X)) };
    extBox = right ? [0, -0.5, X.x + 1.2, 6.5] : [X.x - 1.2, -0.5, 10, 6.5];
  }
  const items = [F2.xline(L1.P, L1.u, 'f-seg'), F2.xline(L2.P, L2.u, 'f-blue'), lineLabel(L1.P, L1.u, '(d)'), lineLabel(L2.P, L2.u, `(d${PRIME})`)];
  if (kind === 'perp') items.push(F2.right(X, L1.u, L2.u, 0.32));
  let fig = figure({}, items, { box: BOX, labels: false });
  if (extBox) fig = fig.replace('</svg>', `<g class="ext" style="display:none">${F2.xline(L1.P, L1.u, 'f-dashed')}${F2.xline(L2.P, L2.u, 'f-dashed')}<circle cx="${X.x}" cy="${X.y}" r="0.12" class="f-special"/></g></svg>`);
  const correct = kind === 'par' ? 0 : kind === 'perp' ? 1 : 2;
  const opts = [`(d) // (d${PRIME}) : elles sont parallèles`, `(d) ⊥ (d${PRIME}) : elles sont perpendiculaires`, 'Elles sont sécantes, mais pas perpendiculaires'];
  const expl = ['Les deux droites ne se coupent jamais : elles sont <b>parallèles</b>, on note (d) // (d′).',
    'Les deux droites se coupent en formant un <b>angle droit</b> (le petit carré le code) : elles sont perpendiculaires, on note (d) ⊥ (d′).',
    kind === 'out' ? 'Si on prolonge les deux droites, elles finissent par se couper, en dehors du cadre : elles sont <b>sécantes</b>. Une droite est illimitée : ce qu\'on voit n\'en est qu\'un morceau !'
      : 'Les deux droites se coupent, mais sans angle droit : elles sont <b>sécantes</b> (pas de notation particulière).'][correct];
  const o = mcq(`<p>Quelle est la position des droites (d) et (d${PRIME}) ?</p><div class="figwrap">${fig}</div>`, opts, correct, expl, { col: true, keepOrder: true });
  return withRemed(withHints(o, [
    `Relis le tableau « Position » dans ${ficheLink('droites')}. Les droites se coupent-elles ? Si oui, forment-elles un angle droit ?`,
    extBox ? { html: 'Outil : une droite est illimitée. Regarde ce qui se passe si on <b>prolonge</b> les deux droites (en pointillés sur la figure).', act: (r) => { const s = r.querySelector('.figwrap svg'); s.setAttribute('viewBox', extBox.map((x, i) => (i > 1 ? x - extBox[i - 2] : x)).join(' ')); s.querySelector('.ext').style.display = ''; } }
      : 'Outil : une droite est illimitée. Imagine-les prolongées avec ta règle : se coupent-elles ? Regarde aussi s\'il y a un angle droit codé.',
  ]), (i) => {
    if (kind === 'out' && i === 0) return 'Elles ont l\'air parallèles… mais l\'écart entre elles diminue ! Une droite est illimitée : prolonge-les avec ta règle, se coupent-elles en dehors du cadre ?';
    if (kind === 'perp') return 'Regarde le petit carré à l\'intersection : il code un <b>angle droit</b>.';
    if (kind === 'sec' && i === 1) return 'Il n\'y a pas d\'angle droit codé, et l\'angle formé n\'est pas droit (vérifie avec ton équerre).';
    if (kind === 'sec' && i === 0) return 'Les deux droites se coupent sur la figure : peuvent-elles être parallèles ?';
    if (kind === 'par') return 'Mesure l\'écart entre les deux droites à gauche et à droite : il est le même. Se coupent-elles un jour ?';
    return 'Les droites se coupent-elles (même en dehors du cadre) ? Si oui, forment-elles un angle droit ?';
  });
}

/* ---------- 5. Propriété : deux perpendiculaires à une même droite ---------- */
function genPropPar(hard = false) {
  const sub = (k) => `(d<sub>${k}</sub>)`;
  const v = hard ? 1 : rand(0, 1); // ★ : perpendiculaire à une perpendiculaire
  const stmt = v === 0 ? `${sub(1)} ⊥ (d) et ${sub(2)} ⊥ (d).<br>Que peut-on dire des droites ${sub(1)} et ${sub(2)} ?`
    : `${sub(1)} ⊥ (d) et ${sub(2)} ⊥ ${sub(1)}.<br>Que peut-on dire des droites (d) et ${sub(2)} ?`;
  const pair = v === 0 ? `${sub(1)} et ${sub(2)}` : `(d) et ${sub(2)}`;
  const common = v === 0 ? '(d)' : sub(1);
  const opts = ['Elles sont parallèles', 'Elles sont perpendiculaires', 'Elles sont sécantes, mais pas perpendiculaires', 'On ne peut pas savoir'];
  // schéma (indice 2)
  const u = { x: 1, y: 0 }, base = { x: 5, y: 3 };
  const schema = v === 0
    ? figure({}, [F2.xline(base, u, 'f-seg'), F2.xline({ x: 3.4, y: 3 }, { x: 0, y: 1 }, 'f-blue'), F2.xline({ x: 6.6, y: 3 }, { x: 0, y: 1 }, 'f-red'), F2.right({ x: 3.4, y: 3 }, { x: 1, y: 0 }, { x: 0, y: -1 }), F2.right({ x: 6.6, y: 3 }, { x: 1, y: 0 }, { x: 0, y: -1 }), F2.text({ x: 9.3, y: 2.6 }, '(d)', 'f-lname'), F2.text({ x: 3.95, y: 0.6 }, '(d₁)', 'f-lname'), F2.text({ x: 7.15, y: 0.6 }, '(d₂)', 'f-lname')], { box: BOX, labels: false })
    : figure({}, [F2.xline(base, u, 'f-seg'), F2.xline({ x: 4, y: 3 }, { x: 0, y: 1 }, 'f-blue'), F2.xline({ x: 4, y: 1.4 }, u, 'f-red'), F2.right({ x: 4, y: 3 }, { x: 1, y: 0 }, { x: 0, y: -1 }), F2.right({ x: 4, y: 1.4 }, { x: 1, y: 0 }, { x: 0, y: 1 }), F2.text({ x: 9.3, y: 3.45 }, '(d)', 'f-lname'), F2.text({ x: 4.55, y: 5.6 }, '(d₁)', 'f-lname'), F2.text({ x: 9.3, y: 1.0 }, '(d₂)', 'f-lname')], { box: BOX, labels: false });
  const o = mcq(`<p class="statement">${stmt}</p>`, opts, 0,
    `${pair} sont toutes les deux perpendiculaires à la même droite ${common}. Or, deux droites perpendiculaires à une même droite sont <b>parallèles</b>. Donc ${pair} sont parallèles.${schema}`, { col: true, keepOrder: true });
  return withRemed(withHints(o, [
    `Relis la phrase sous « Tracer des droites parallèles » dans ${ficheLink('droites')} : que sait-on de deux droites perpendiculaires à une même droite ?`,
    { html: `Outil : fais un schéma à main levée, en traçant d'abord ${common}. Le voici :`, act: (r) => { r.insertAdjacentHTML('beforeend', `<div class="hint-fig">${schema}</div>`); } },
  ]), (i) => (i === 3 ? 'On peut savoir ! Il existe une propriété : deux droites perpendiculaires à une <b>même</b> droite sont toujours…'
    : `Fais un schéma : trace ${common}, puis les deux autres droites qui lui sont perpendiculaires. Se coupent-elles ?`));
}

/* ---------- 6. Tracer une perpendiculaire / une parallèle (planche) ---------- */
function boardLine() {
  const u = dirDeg(rand(-28, 28) || 6), c = { x: 8, y: rand(55, 75) / 10 };
  return { P: c, u, A1: G.add(c, G.mul(u, -9)), A2: G.add(c, G.mul(u, 6.6)) };
}
function placeA(L, onLine) {
  if (onLine) return G.add(L.P, G.mul(L.u, rand(-30, 30) / 10));
  let n = G.perp(L.u); if (n.y > 0) n = G.mul(n, -1);
  const h = rand(22, 38) / 10 * (Math.random() < 0.8 ? 1 : -1);
  return G.add(G.add(L.P, G.mul(L.u, rand(-25, 25) / 10)), G.mul(n, h));
}
function scenePerp(L, A, nA = 'A', onLine = false, nameD = '(d)') {
  const u = L.u, H = G.add(L.P, G.mul(u, G.dot(G.sub(A, L.P), u)));
  let v = onLine ? G.perp(u) : G.norm(G.sub(A, H)); if (onLine && v.y > 0) v = G.mul(v, -1);
  const top = onLine ? G.add(H, G.mul(v, 2.4)) : A;
  const box = [H.x - 4.6, Math.min(H.y, top.y, A.y) - 2.2, H.x + 4.6, Math.max(H.y, top.y, A.y) + 1.8];
  return {
    pts: [], box,
    base: [F2.xline(L.P, u, 'f-seg', 40), lineLabel(L.P, u, nameD, box), ptSVG(nA, A, G.add(A, G.mul(v, -1)), 1, onLine ? { dash: u } : 'x')],
    steps: [
      STEP.slide(G.add(H, G.mul(u, -2.4)), H, u, v, `Pose un côté de l'angle droit de l'équerre bien le long de ${nameD}, puis fais glisser l'équerre jusqu'au point ${nA}.`),
      STEP.xline(H, top, `Trace la droite le long de l'autre côté de l'angle droit : elle passe par ${nA}.`, G.mul(u, -1), 'f-red', 1.6),
      STEP.marks(F2.right(H, G.mul(u, H.x - A.x > 0 ? -1 : 1), v), `Code l'angle droit : la droite tracée est perpendiculaire à ${nameD}.`),
    ],
  };
}
function scenePar(L, A, nA = 'A', nameD = '(d)') {
  const u = L.u, H = G.add(L.P, G.mul(u, G.dot(G.sub(A, L.P), u)));
  const v = G.norm(G.sub(A, H)), h = G.dist(A, H);
  const F0 = G.add(H, G.mul(u, -0.9)), F1 = G.add(F0, G.mul(v, h));
  const R0 = G.add(F0, G.mul(v, -0.9)), R1 = G.add(F1, G.mul(v, 0.9)), side = G.mul(u, -1);
  const box = [H.x - 4.8, Math.min(H.y, A.y) - 1.8, H.x + 4.8, Math.max(H.y, A.y) + 1.8];
  return {
    pts: [], box,
    base: [F2.xline(L.P, u, 'f-seg', 40), lineLabel(L.P, u, nameD, box), ptSVG(nA, A, G.add(A, G.mul(v, -1)), 1, 'x')],
    steps: [
      { text: `Place un côté de l'équerre le long de ${nameD}, et la règle contre l'autre côté de l'équerre.`, dur: 1600, draw: (t, final) => (final ? '' : INSTR.ruler(R0, R1, side) + INSTR.square(F0, u, v)) },
      STEP.slideRuler(R0, R1, side, F0, F1, u, v, `Tiens bien la règle et fais glisser l'équerre le long de la règle, jusqu'au point ${nA}.`),
      STEP.xline(G.add(A, G.mul(u, -2.6)), G.add(A, G.mul(u, 2.6)), `Trace la droite le long de l'équerre : c'est la parallèle à ${nameD} passant par ${nA}.`, v, 'f-red', 1.2),
    ],
    endText: `La droite rouge est parallèle à ${nameD}.`,
  };
}
function traceExercise(kind) {
  const L = boardLine();
  const onLine = kind === 'perp' && Math.random() < 0.3;
  const A = placeA(L, onLine), nA = pick(['A', 'M', 'K', 'E']);
  const isPerpK = kind === 'perp';
  const goodLine = (Lx) => distToLine(Lx, A) <= 0.12 && (isPerpK ? isPerp(Lx.d, L.u) : isPar(Lx.d, L.u));
  const word = isPerpK ? 'perpendiculaire' : 'parallèle';
  const figFix = (cls) => {
    const H = G.add(L.P, G.mul(L.u, G.dot(G.sub(A, L.P), L.u)));
    const d = isPerpK ? G.perp(L.u) : L.u;
    const items = [F2.xline(L.P, L.u, 'f-seg'), F2.xline(A, d, 'f-red', 30), lineLabel(L.P, L.u, '(d)', [H.x - 5, H.y - 4, H.x + 5, H.y + 3])];
    if (isPerpK) items.push(F2.right(H, L.u, G.perp(L.u)));
    return figure({ [nA]: A }, items, { box: [H.x - 5, Math.min(A.y, H.y) - 2, H.x + 5, Math.max(A.y, H.y) + 2], marks: { [nA]: onLine ? { dash: L.u } : 'x' }, cls });
  };
  return {
    hints: isPerpK ? [
      `Relis « Tracer des droites perpendiculaires » dans ${ficheLink('droites')}. Quel instrument permet de tracer un angle droit ?`,
      'Outil : l\'Équerre de la planche. On clique d\'abord sur la droite de référence, puis sur le point par lequel la perpendiculaire doit passer.',
      'Clique sur « 🎬 Voir un exemple » pour voir l\'équerre en action sur une autre droite.',
    ] : [
      `Relis « Tracer des droites parallèles » dans ${ficheLink('droites')}. Quels instruments utilise-t-on ?`,
      'Outil : l\'outil Parallèle (règle + équerre). Autre méthode : deux perpendiculaires successives avec l\'Équerre, car deux droites perpendiculaires à une même droite sont parallèles.',
      'Clique sur « 🎬 Voir un exemple » pour voir la règle et l\'équerre en action.',
    ],
    anim: () => (isPerpK ? scenePerp(L, A, nA, onLine) : scenePar(L, A, nA)),
    example: () => { const L2 = boardLine(); L2.P = { x: 0, y: 0 }; const A2 = placeA(L2, false); return isPerpK ? scenePerp(L2, A2, 'Z') : scenePar(L2, A2, 'Z'); },
    remediate(r) {
      const lins = r._board.linears(); if (!lins.length) return null;
      if (lins.some(goodLine)) return null;
      const via = lins.some((Lx) => distToLine(Lx, A) <= 0.12), dirOk = lins.some((Lx) => (isPerpK ? isPerp(Lx.d, L.u) : isPar(Lx.d, L.u)));
      if (via) {
        const best = lins.filter((Lx) => distToLine(Lx, A) <= 0.12)[0];
        return `Ta droite passe bien par ${nA}, mais elle n'est pas ${word} à (d) : elle fait un angle de ${Math.round(lineAngle(best.d, L.u))}° avec (d)${isPerpK ? ' au lieu de 90°' : ''}. ${isPerpK ? 'Utilise l\'équerre plutôt que de tracer à l\'œil.' : 'Utilise la règle et l\'équerre plutôt que de tracer à l\'œil.'}`;
      }
      if (dirOk) return `Ta droite est bien ${word} à (d), mais elle ne passe pas par le point ${nA}. Clique bien sur ${nA} en deuxième.`;
      return null;
    },
    _t: { L, A, nA, kind },
    q: `<p class="statement">Trace la droite <b>${word}</b> à (d) passant par le point ${nA}.</p><div class="board"></div>`,
    mount(r) {
      r._board = createBoard(r.querySelector('.board'), {
        tool: kind, names: [],
        given: { points: [{ name: '_d1', ...L.A1, hidden: true }, { name: '_d2', ...L.A2, hidden: true }, { name: nA, ...A, mark: onLine ? { dash: L.u } : null }], lines: [['_d1', '_d2', '(d)']] },
      });
    },
    check(r) {
      const lins = r._board.linears();
      if (!lins.length) return r._board.drawnCount() ? { retry: true, msg: 'Trace une droite (avec l\'Équerre, l\'outil Parallèle ou l\'outil Droite).' } : null;
      const good = lins.some(goodLine);
      return {
        ok: good,
        msg: good ? `Ta droite passe par ${nA} et elle est bien ${word} à (d).${isPerpK ? '' : ' On note (d′) // (d).'}`
          : `La droite cherchée passe par ${nA} et elle est ${word} à (d).<b> Méthode :</b><ol class="method">${isPerpK
            ? '<li>Équerre : clique sur la droite (d).</li><li>Clique sur le point ' + nA + ' : la perpendiculaire est tracée.</li>'
            : '<li>Outil Parallèle : clique sur la droite (d).</li><li>Clique sur le point ' + nA + ' : la parallèle est tracée.</li><li>Autre méthode : trace la perpendiculaire à (d) passant par ' + nA + ', puis la perpendiculaire à cette nouvelle droite passant par ' + nA + '.</li>'}</ol>${figFix()}`,
      };
    },
  };
}
const genTracePerp = () => traceExercise('perp');
const genTracePar = () => traceExercise('par');

/** Figures de la fiche « Droites » */
function renderDroitesFiche() {
  const box = (id) => document.querySelector(`[data-fig="${id}"]`);
  document.querySelectorAll('[data-cd]').forEach((el) => { const [c, k] = el.dataset.cd.split(':'); el.innerHTML = codageSVG(c, k); });
  // positions
  const par = figure({}, [F2.xline({ x: 5, y: 2 }, dirDeg(-12), 'f-seg'), F2.xline({ x: 5, y: 4 }, dirDeg(-12), 'f-blue'), F2.text({ x: 1.3, y: 1.9 }, '(d)', 'f-lname'), F2.text({ x: 1.3, y: 3.9 }, '(d′)', 'f-lname')], { box: BOX, labels: false });
  const sec = figure({ O: { x: 5, y: 3 } }, [F2.xline({ x: 5, y: 3 }, dirDeg(-20), 'f-seg'), F2.xline({ x: 5, y: 3 }, dirDeg(35), 'f-blue'), F2.text({ x: 1.3, y: 3.9 }, '(d)', 'f-lname'), F2.text({ x: 1.7, y: 0.9 }, '(d′)', 'f-lname')], { box: BOX, marks: { O: 'none' } });
  const per = figure({}, [F2.xline({ x: 5, y: 3 }, dirDeg(-15), 'f-seg'), F2.xline({ x: 5, y: 3 }, dirDeg(75), 'f-blue'), F2.right({ x: 5, y: 3 }, dirDeg(-15), dirDeg(-105), 0.35), F2.text({ x: 1.3, y: 4.5 }, '(d)', 'f-lname'), F2.text({ x: 6.4, y: 0.7 }, '(d′)', 'f-lname')], { box: BOX, labels: false });
  if (box('pos-par')) box('pos-par').innerHTML = par;
  if (box('pos-sec')) box('pos-sec').innerHTML = sec;
  if (box('pos-perp')) box('pos-perp').innerHTML = per;
  // exemple de la méthode (points A, C, E sur (h))
  if (box('ex-noms')) {
    const u = dirDeg(20), A = { x: 1.3, y: 1.1 }, C = G.add(A, G.mul(u, 3.4)), E = G.add(A, G.mul(u, 6.6));
    const B = { x: 7.6, y: 1.1 }, D = { x: 7.6, y: 5.3 };
    box('ex-noms').innerHTML = figure({ A, C, E, B, D }, [F2.xline(A, u, 'f-seg'), F2.seg({ x: 0, y: 1.1 }, { x: 10, y: 1.1 }, 'f-blue'), F2.seg({ x: 0, y: 5.3 }, { x: 10, y: 5.3 }, 'f-blue'), F2.seg({ x: 7.6, y: 0 }, { x: 7.6, y: 6 }, 'f-red'),
      F2.right(B, { x: 1, y: 0 }, { x: 0, y: 1 }), F2.right(D, { x: 1, y: 0 }, { x: 0, y: -1 }),
      F2.text({ x: 9.4, y: 0.75 }, '(d)', 'f-lname'), F2.text({ x: 9.4, y: 4.95 }, '(d′)', 'f-lname'), F2.text({ x: 5.4, y: 4.2 }, '(h)', 'f-lname')], { box: BOX, marks: { A: 'none', C: { dash: u }, E: { dash: u }, B: 'none', D: 'none' } });
  }
  const L = { P: { x: 0, y: 0 }, u: dirDeg(-22) };
  if (box('anim-perp')) makePlayer(box('anim-perp'), scenePerp(L, G.add(G.mul(L.u, 0.6), G.mul(G.perp(L.u), -2.6)), 'A'), { atEnd: true });
  if (box('anim-par')) makePlayer(box('anim-par'), scenePar(L, G.add(G.mul(L.u, 0.4), G.mul(G.perp(L.u), -2.4)), 'A'), { atEnd: true });
}
/* =========================================================
   CHAPITRE 2 — NOMBRES DÉCIMAUX (PARTIE 1) : écriture des nombres
   ========================================================= */
const INT_RANKS = ['unités', 'dizaines', 'centaines', 'unités de mille', 'dizaines de mille', 'centaines de mille', 'unités de millions', 'dizaines de millions', 'centaines de millions', 'unités de milliards'];
const DEC_RANKS = ['dixièmes', 'centièmes', 'millièmes'];
const rankName = (p) => (p >= 0 ? INT_RANKS[p] : DEC_RANKS[-p - 1]);
const des = (r) => (/^[aeiouéu]/.test(r) ? 'des ' + r : 'des ' + r);
const CLASSES = ['unités', 'mille', 'millions', 'milliards'];

/** Nombre aléatoire : chaîne de chiffres (premier non nul) */
function digitsStr(n, { first = true, zeros = 0.15 } = {}) {
  let s = '';
  for (let i = 0; i < n; i++) s += i === 0 && first ? rand(1, 9) : Math.random() < zeros ? 0 : rand(1, 9);
  return s;
}

/** Tableau de numération (HTML) ; intS, decS : chaînes de chiffres ; hl : position surlignée */
function numTable(intS, decS = '', { hl = null, empty = false } = {}) {
  const nCls = Math.max(1, Math.ceil(intS.length / 3));
  const intCols = nCls * 3;
  const padded = intS.padStart(intCols, ' ');
  let h1 = '', h2 = '', row = '';
  for (let c = nCls - 1; c >= 0; c--) h1 += `<th colspan="3" class="cls">Classe des ${CLASSES[c]}</th>`;
  if (decS.length) h1 += `<th colspan="${decS.length}" class="cls dec">Partie décimale</th>`;
  for (let i = 0; i < intCols; i++) {
    const p = intCols - 1 - i, k = p % 3;
    h2 += `<th class="${k === 0 ? 'u' : ''}">${['U', 'D', 'C'][k]}</th>`;
    const d = padded[i] === ' ' ? '' : padded[i];
    row += `<td class="${k === 0 ? 'u' : ''}${hl === p ? ' hl' : ''}${p === 0 && decS.length ? ' comma' : ''}">${empty ? '' : d}</td>`;
  }
  for (let j = 0; j < decS.length; j++) {
    h2 += `<th>${['dixièmes', 'centièmes', 'millièmes', 'dix-millièmes', 'cent-millièmes'][j] || ''}</th>`;
    row += `<td class="${hl === -j - 1 ? 'hl' : ''}">${empty ? '' : decS[j]}</td>`;
  }
  return `<div class="table-wrap"><table class="numtab"><thead><tr>${h1}</tr><tr>${h2}</tr></thead><tbody><tr>${row}</tr></tbody></table></div>`;
}
const numStr = (intS, decS) => groupInt(intS) + (decS ? ',' + decS : '');

/* ---------- 1. Rang d'un chiffre ---------- */
function genRang(hard = false) {
  // ★ : grands nombres (rang des millions ou plus) ou rang des centièmes / millièmes
  const isDec = Math.random() < 0.5;
  const intS = isDec ? digitsStr(hard ? rand(2, 3) : rand(1, 3)) : digitsStr(hard ? rand(8, 10) : rand(4, 10));
  const decS = isDec ? digitsStr(hard ? 3 : rand(1, 3), { first: false, zeros: 0.1 }).replace(/0$/, String(rand(1, 9))) : '';
  // position : p >= 0 partie entière (0 = unités), p < 0 partie décimale
  const choices = [];
  for (let p = 0; p < intS.length; p++) if (intS[intS.length - 1 - p] !== '0') choices.push(p);
  for (let j = 0; j < decS.length; j++) if (decS[j] !== '0') choices.push(-j - 1);
  let p = pick(choices);
  if (isDec && Math.random() < 0.6 && decS.length) p = pick(choices.filter((x) => x < 0)) ?? p;
  if (hard) p = pick(choices.filter((x) => (isDec ? x <= -2 : x >= 6))) ?? p;
  const fromLeft = p >= 0 ? intS.length - 1 - p : null;
  const opts = [{ p, kind: 'ok' }];
  const add = (q, kind) => { if (q !== undefined && q !== null && rankName(q) && !opts.some((o) => o.p === q)) opts.push({ p: q, kind }); };
  if (p >= 1 && p <= 3) add(-p, 'swap');
  if (p <= -1 && p >= -3) add(-p, 'swap');
  if (fromLeft !== null && fromLeft !== p) add(fromLeft, 'left');
  add(p + 1, 'adj'); add(p - 1, 'adj'); add(p + 2, 'adj');
  const o4 = opts.slice(0, 4);
  // affichage avec le chiffre souligné
  let html = '';
  const g = groupInt(intS);
  let cnt = 0;
  for (let i = g.length - 1; i >= 0; i--) {
    const ch = g[i];
    if (/\d/.test(ch)) { html = (cnt === p ? `<u class="ul">${ch}</u>` : ch) + html; cnt++; } else html = ch + html;
  }
  if (decS) html += ',' + [...decS].map((d, j) => (-j - 1 === p ? `<u class="ul">${d}</u>` : d)).join('');
  const digit = p >= 0 ? intS[intS.length - 1 - p] : decS[-p - 1];
  const exI = isDec ? '309' : '72450000', exD = isDec ? '175' : '';
  const o = mcq(`<p>Quel est le rang du chiffre souligné ?</p><p class="big"><span class="numdisp">${html}</span></p>`,
    o4.map((x) => `chiffre ${des(rankName(x.p))}`), 0,
    `${digit} est le chiffre ${des(rankName(p))}.${numTable(intS, decS, { hl: p })}`, { col: true });
  return withRemed(withHints(o, [
    `Repère d'abord le chiffre des unités${decS ? ' (juste avant la virgule)' : ' (le dernier chiffre à droite)'}. Ensuite, compte les rangs à partir de lui. Relis ${ficheLink('decimaux1')}.`,
    `Exemple : dans ${numStr(exI, exD)}, ${isDec ? '7 est le chiffre des centièmes' : '7 est le chiffre des dizaines de millions'} :${numTable(exI, exD, { hl: isDec ? -2 : 7 })}`,
    `Outil — recopie le nombre dans un tableau de numération, en plaçant le chiffre des unités dans la colonne U de la classe des unités :${numTable(intS, decS, { empty: true })}`,
  ]), (i) => {
    const k = o4[i].kind;
    if (k === 'swap') return 'Attention aux terminaisons : les <b>dizaines, centaines</b> sont à <b>gauche</b> de la virgule ; les <b>dixièmes, centièmes</b> sont à <b>droite</b>.';
    if (k === 'left') return 'Tu as compté les rangs à partir de la gauche. On repère les rangs à partir du chiffre des <b>unités</b>.';
    return 'Tu es à un rang près. Repars du chiffre des unités et compte un rang à la fois.';
  });
}

/* ---------- 2. Nombre de dizaines, de dixièmes… ---------- */
function genCombien(hard = false) {
  // ★ : nombre de dixièmes / centièmes dans un nombre décimal
  if (!hard && Math.random() < 0.5) {
    const n = Number(digitsStr(rand(4, 6), { zeros: 0.1 }));
    const p = pick([1, 2, 3]);
    const word = ['', 'dizaines', 'centaines', 'milliers'][p];
    const ans = Math.floor(n / 10 ** p), digit = Math.floor(n / 10 ** p) % 10;
    const exN = 9382;
    return {
      hints: [
        `Ne confonds pas « le chiffre des ${word} » (un seul chiffre) et « le nombre de ${word} » (combien de ${word} en tout). Relis ${ficheLink('decimaux1')}.`,
        n === exN ? 'Exemple : dans 7 418, il y a 741 dizaines, car 741 × 10 = 7 410.' : `Exemple : dans 9 382, il y a 938 dizaines (938 × 10 = 9 380) et 93 centaines (93 × 100 = 9 300).`,
        `Outil : cache tous les chiffres situés à droite du chiffre des ${word}. Le nombre qui reste, c'est le nombre de ${word}.`,
      ],
      remediate(r) {
        const x = val(r); if (!x || eq(x.value, ans)) return null;
        if (eq(x.value, digit)) return `${digit} est le <b>chiffre</b> des ${word}. Mais on demande le <b>nombre</b> de ${word} : combien de ${word} y a-t-il en tout dans ${fmt(n)} ?`;
        if ([1, 2, 3, 4].some((q) => q !== p && eq(x.value, Math.floor(n / 10 ** q)))) return 'Tu t\'es arrêté(e) au mauvais rang. Où est le chiffre des ' + word + ' ?';
        return null;
      },
      q: `<p class="statement">Dans le nombre <b>${fmt(n)}</b>, combien y a-t-il de <b>${word}</b> ?</p><p class="big">${inp('num', 'Nombre')} ${word}</p>`,
      check(r) {
        const x = val(r); if (!x) return null;
        const ok = eq(x.value, ans); markInput(r, 0, ok);
        return { ok, msg: `Dans ${fmt(n)}, il y a <b>${fmt(ans)} ${word}</b>, car ${fmt(ans)} × ${fmt(10 ** p)} = ${fmt(ans * 10 ** p)}. (Le chiffre des ${word} est ${digit}.)` };
      },
    };
  }
  const m = Number(digitsStr(rand(4, 5), { zeros: 0.1 }).replace(/0$/, '7')); // 3 décimales
  const x = m / 1000, k = hard ? 2 : pick([1, 2]);
  const word = ['', 'dixièmes', 'centièmes'][k];
  const ans = Math.floor(m / 10 ** (3 - k)), digit = ans % 10;
  return {
    hints: [
      `Combien de ${word} dans une unité ? (1 unité, c'est ${k === 1 ? '10 dixièmes' : '100 centièmes'}.) Relis ${ficheLink('decimaux1')}.`,
      'Exemple : dans 83,614, il y a 836 dixièmes et 8 361 centièmes.',
      `Outil : écris le nombre sans la virgule, puis garde tous les chiffres jusqu'au chiffre des ${word} (inclus).`,
    ],
    remediate(r) {
      const v = val(r); if (!v || eq(v.value, ans)) return null;
      if (eq(v.value, digit)) return `${digit} est le <b>chiffre</b> des ${word}. On demande le <b>nombre</b> de ${word} : combien y en a-t-il en tout ?`;
      if (eq(v.value, Math.floor(x))) return 'Tu as donné le nombre d\'unités. Une unité contient beaucoup de ' + word + ' !';
      if (eq(v.value, Math.floor(m / 10 ** (2 - k))) || eq(v.value, Math.floor(m / 10 ** (4 - k)))) return 'Tu t\'es arrêté(e) au mauvais rang. Où est le chiffre des ' + word + ' ?';
      return null;
    },
    q: `<p class="statement">Dans le nombre <b>${fmt(x)}</b>, combien y a-t-il de <b>${word}</b> ?</p><p class="big">${inp('num', 'Nombre')} ${word}</p>`,
    check(r) {
      const v = val(r); if (!v) return null;
      const ok = eq(v.value, ans); markInput(r, 0, ok);
      return { ok, msg: `Dans ${fmt(x)}, il y a <b>${fmt(ans)} ${word}</b> : ${fmt(x)} = ${F(ans, 10 ** k)} + … (le chiffre des ${word} est ${digit}).` };
    },
  };
}

/* ---------- 3. Tranches de trois chiffres ---------- */
function genTranches(hard = false) {
  const s = digitsStr(hard ? rand(10, 12) : rand(7, 10), { zeros: hard ? 0.4 : 0.25 }), L = s.length;
  const good = new Set(), left = new Set();
  for (let i = 0; i < L - 1; i++) { if ((L - 1 - i) % 3 === 0) good.add(i); if ((i + 1) % 3 === 0) left.add(i); }
  const html = [...s].map((d, i) => `<span class="dg">${d}</span>${i < L - 1 ? `<button type="button" class="gap" data-i="${i}" aria-label="Espace après le chiffre ${i + 1}"></button>` : ''}`).join('');
  const sel = (r) => new Set([...r.querySelectorAll('.gap.on')].map((b) => Number(b.dataset.i)));
  const same = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
  return {
    hints: [
      `Par quel côté du nombre commence-t-on les tranches ? Relis « Principes de numération » dans ${ficheLink('decimaux1')}.`,
      'Exemple : 4819035621 s\'écrit 4 819 035 621 : on fait des paquets de 3 chiffres en partant de la <b>droite</b>.',
      `Outil — le tableau de numération : chaque classe contient 3 chiffres.${numTable('481903', '')}`,
    ],
    remediate(r) {
      const S = sel(r); if (!S.size || same(S, good)) return null;
      if (same(S, left)) return 'Tu as fait les tranches à partir de la <b>gauche</b>. On les fait à partir de la <b>droite</b> (du chiffre des unités).';
      return 'Les tranches doivent avoir exactement 3 chiffres, en partant de la droite (seule la tranche de gauche peut en avoir moins).';
    },
    q: `<p>Clique entre les chiffres pour placer les espaces, afin que le nombre soit facile à lire.</p><div class="digits">${html}</div>`,
    mount(r) { r.querySelectorAll('.gap').forEach((b) => b.addEventListener('click', () => b.classList.toggle('on'))); },
    check(r) {
      const S = sel(r); if (!S.size) return null;
      const ok = same(S, good);
      r.querySelectorAll('.gap').forEach((b) => { const i = Number(b.dataset.i); if (good.has(i)) b.classList.add('good'); else if (b.classList.contains('on')) b.classList.add('bad'); });
      return { ok, msg: `On regroupe les chiffres par tranches de trois en partant de la droite : <b>${groupInt(s)}</b>.${numTable(s, '')}` };
    },
  };
}

/* ---------- 4. Décomposer / recomposer ---------- */
const P10S = (p) => fmt(10 ** p);
function genDecomp(hard = false) {
  // ★ : 6 à 7 chiffres avec des rangs vides, parenthèses dans le désordre
  let s; do { s = digitsStr(hard ? rand(6, 7) : rand(4, 6), { zeros: 0.35 }); } while (!/0/.test(s.slice(1)) && (hard || Math.random() < 0.7));
  const L = s.length, n = Number(s);
  const terms = [...s].map((d, i) => ({ d: Number(d), p: L - 1 - i }));
  const full = terms.filter((t) => t.d).map((t) => `(${t.d} × ${P10S(t.p)})`).join(' + ');
  if (!hard && Math.random() < 0.5) {
    return {
      hints: [
        `Quel est le chiffre des unités, des dizaines, des centaines… ? Relis « Décomposition » dans ${ficheLink('decimaux1')}.`,
        'Exemple : 7 418 = (7 × 1 000) + (4 × 100) + (1 × 10) + (8 × 1).',
        `Outil — place le nombre dans le tableau de numération :${numTable(s, '', { empty: true })}`,
      ],
      remediate(r) {
        const vs = terms.map((_, i) => val(r, i)); if (vs.some((v) => !v)) return null;
        const bad = terms.filter((t, i) => !eq(vs[i].value, t.d));
        if (!bad.length) return null;
        if (bad.some((t) => t.d === 0)) return `Attention : un rang peut être vide. Quel est le chiffre des ${rankName(bad.find((t) => t.d === 0).p)} dans ${fmt(n)} ? Il faut alors écrire 0.`;
        return `Regarde le chiffre des ${rankName(bad[0].p)} : place ${fmt(n)} dans un tableau de numération pour le trouver.`;
      },
      q: `<p>Décompose le nombre selon ses rangs :</p><p class="big decomp">${fmt(n)} = ${terms.map((t) => `(${inp('num', 'Chiffre des ' + rankName(t.p))} × ${P10S(t.p)})`).join(' + ')}</p>`,
      check(r) {
        const vs = terms.map((_, i) => val(r, i)); if (vs.some((v) => !v)) return null;
        let ok = true;
        terms.forEach((t, i) => { const g = eq(vs[i].value, t.d); ok = ok && g; markInput(r, i, g); });
        return { ok, msg: `${fmt(n)} = ${terms.map((t) => `(${t.d} × ${P10S(t.p)})`).join(' + ')}<br>On écrit souvent seulement les rangs non nuls : ${fmt(n)} = ${full}.` };
      },
    };
  }
  const shown = terms.filter((t) => t.d);
  const order = hard || Math.random() < 0.5 ? shuffle([...shown]) : shown;
  const concat = Number(order.map((t) => t.d).join(''));
  return {
    hints: [
      'Chaque parenthèse donne le chiffre d\'un rang. Quel est le plus grand rang ? Quels rangs manquent ?',
      'Exemple : (3 × 100 000) + (6 × 10 000) + (5 × 100) + (2 × 10) = 360 520. Les rangs des milliers et des unités sont vides : on y écrit 0.',
      `Outil — remplis un tableau de numération : un chiffre par parenthèse, puis des 0 dans les colonnes vides.${numTable(s, '', { empty: true })}`,
    ],
    remediate(r) {
      const x = val(r); if (!x || eq(x.value, n)) return null;
      if (eq(x.value, concat)) return 'Tu as écrit les chiffres les uns après les autres. Mais certains rangs sont vides (il faut y écrire 0), et l\'ordre des parenthèses peut être mélangé : regarde par quoi chaque chiffre est multiplié.';
      if (eq(x.value, Number(shown.map((t) => t.d).join('')))) return 'Il manque des zéros : certains rangs n\'apparaissent pas dans la décomposition. Leur chiffre est 0.';
      return null;
    },
    q: `<p>Écris le nombre correspondant :</p><p class="big decomp">${order.map((t) => `(${t.d} × ${P10S(t.p)})`).join(' + ')} = ${inp('num', 'Nombre')}</p>`,
    check(r) {
      const x = val(r); if (!x) return null;
      const ok = eq(x.value, n); markInput(r, 0, ok);
      return { ok, msg: `${order.map((t) => `(${t.d} × ${P10S(t.p)})`).join(' + ')} = <b>${fmt(n)}</b>${numTable(s, '')}` };
    },
  };
}

/* ---------- 5. Zéros inutiles ---------- */
function genZeros(hard = false) {
  const t = hard ? pick(['mid', 'small']) : pick(['lead', 'mid', 'unit', 'small', 'int']);
  let intS, decS;
  if (t === 'lead') { intS = '0'.repeat(rand(1, 2)) + digitsStr(rand(1, 2), { zeros: 0 }); decS = String(rand(1, 9)) + '0'.repeat(rand(1, 2)); }
  else if (t === 'mid') { intS = String(rand(1, 9)) + '0' + rand(1, 9); decS = '0' + rand(1, 9) + '0'.repeat(rand(1, 2)); }
  else if (t === 'unit') { intS = '0' + rand(1, 9); decS = String(rand(1, 9)) + '0'.repeat(rand(1, 2)); }
  else if (t === 'small') { intS = '0'.repeat(rand(1, 2)) + '0'; decS = '0' + rand(1, 9) + '0'.repeat(rand(1, 2)); }
  else { intS = String(rand(1, 9)) + rand(1, 9) + '0'; decS = '0'.repeat(rand(1, 2)); }
  if (Math.random() < 0.3 && t !== 'small' && !intS.startsWith('0')) intS = '0' + intS;
  // rôle de chaque chiffre
  const chars = [];
  const intCore = intS.replace(/^0+(?=\d)/, '');
  const nLead = intS.length - intCore.length;
  [...intS].forEach((c, i) => chars.push({ c, part: 'int', i, useless: i < nLead, why: i < nLead ? '' : c === '0' ? (i === intS.length - 1 ? (intCore === '0' ? 'unit0' : 'units') : 'intmid') : '' }));
  const decCore = decS.replace(/0+$/, '');
  [...decS].forEach((c, j) => chars.push({ c, part: 'dec', j, useless: j >= decCore.length, why: j < decCore.length && c === '0' ? 'decmid' : '' }));
  const result = intCore + (decCore ? ',' + decCore : '');
  const html = chars.map((ch, k) => (ch.c === '0' ? `<button type="button" class="zbtn" data-k="${k}">0</button>` : `<span class="dg">${ch.c}</span>`) + (ch.part === 'int' && ch.i === intS.length - 1 ? '<span class="dg">,</span>' : '')).join('');
  const sel = (r) => [...r.querySelectorAll('.zbtn.on')].map((b) => Number(b.dataset.k));
  const WHY = {
    units: `Ce zéro est le chiffre des <b>unités</b> : si on l'enlève, ${groupInt(intCore)} devient ${groupInt(intCore.slice(0, -1))} !`,
    intmid: 'Ce zéro est entre deux chiffres : il occupe un rang. Si on l\'enlève, tous les chiffres changent de rang (402 deviendrait 42).',
    unit0: 'On garde toujours un chiffre avant la virgule : on écrit 0,5 et pas ,5.',
    decmid: `Ce zéro est avant un autre chiffre de la partie décimale : si on l'enlève, le nombre change (0,05 n'est pas 0,5).`,
  };
  return {
    _forme: t,
    hints: [
      `Où peut-on enlever des zéros sans changer la valeur du nombre ? Relis la « Règle des zéros inutiles » dans ${ficheLink('decimaux1')}.`,
      'Exemple : 0402,0800 = 402,08. Les zéros tout au début de la partie entière et tout à la fin de la partie décimale sont inutiles. Le 0 de 402 et le 0 de ,08 sont utiles.',
      `Outil — place le nombre dans le tableau : un zéro inutile est un zéro qui ne sert à rien pour situer les autres chiffres.${numTable(intCore, decS)}`,
    ],
    remediate(r) {
      const S = sel(r); if (!S.length) return null;
      const wrong = S.map((k) => chars[k]).find((ch) => !ch.useless);
      if (wrong) return WHY[wrong.why] || 'Ce zéro est utile : il occupe un rang.';
      if (S.length < chars.filter((c) => c.useless).length) return 'C\'est juste, mais il reste des zéros inutiles : regarde au <b>début</b> de la partie entière et à la <b>fin</b> de la partie décimale.';
      return null;
    },
    q: `<p>Clique sur les <b>zéros inutiles</b> pour les barrer.</p><div class="digits zeros">${html}</div>`,
    mount(r) { r.querySelectorAll('.zbtn').forEach((b) => b.addEventListener('click', () => b.classList.toggle('on'))); },
    check(r) {
      const S = new Set(sel(r));
      if (!S.size) return null;
      const ok = chars.every((ch, k) => ch.useless === S.has(k));
      r.querySelectorAll('.zbtn').forEach((b) => { const ch = chars[Number(b.dataset.k)]; if (ch.useless) b.classList.add('good'); else if (b.classList.contains('on')) b.classList.add('bad'); });
      const extra = !decCore ? ' Toute la partie décimale est faite de zéros : on enlève aussi la virgule.' : '';
      return { ok, msg: `${intS},${decS} = <b>${groupInt(intCore)}${decCore ? ',' + decCore : ''}</b>.${extra}` };
    },
    _result: result,
  };
}

/* ---------- 6. Fractions décimales ---------- */
function randDec(kMax = 3) {
  const k = rand(1, kMax), I = rand(0, 99);
  const d = digitsStr(k, { first: false, zeros: 0.2 }).replace(/0$/, String(rand(1, 9)));
  return { I, d, k, m: Number(String(I) + d), x: Number(`${I}.${d}`) };
}
const RANKW = ['', 'dixièmes', 'centièmes', 'millièmes'];
function genFracDec() {
  if (Math.random() < 0.5) {
    const D = randDec(), den = 10 ** D.k, last = D.d[D.k - 1];
    return {
      hints: [
        `Quel est le rang du <b>dernier</b> chiffre après la virgule ? Relis « Fractions décimales » dans ${ficheLink('decimaux1')}.`,
        D.x === 3.7 ? 'Exemple : 82,19 = 8 219/100, car 9 est le chiffre des centièmes.' : `Exemple : 3,7 = ${F(37, 10)}, car 7 est le chiffre des dixièmes ; 82,19 = ${F(8219, 100)}, car 9 est le chiffre des centièmes.`,
        'Outil : 1 chiffre après la virgule → dénominateur 10 ; 2 chiffres → 100 ; 3 chiffres → 1 000. Au numérateur, on écrit le nombre sans la virgule.',
      ],
      remediate(r) {
        const v = val(r); if (!v || !v.isFrac || eq(v.value, D.x)) return null;
        if (v.n === D.I && v.d === Number(D.d)) return `Attention : la virgule n'est pas une barre de fraction ! ${fmt(D.x)} n'est pas ${F(v.n, v.d)}. Combien de ${RANKW[D.k]} y a-t-il dans ${fmt(D.x)} ?`;
        if (eq(v.value, D.x / 10) || eq(v.value, D.x * 10) || eq(v.value, D.x / 100) || eq(v.value, D.x * 100)) return `Vérifie le dénominateur : le dernier chiffre, ${last}, est le chiffre des ${RANKW[D.k]}. Le dénominateur est donc ${fmt(den)}.`;
        return null;
      },
      q: `<p class="big">${fmt(D.x)} = ${inp('frac')}</p><p class="hint">Écris ce nombre sous forme de fraction décimale (exemple de saisie : 37/10).</p>`,
      check(r) {
        const v = val(r); if (!v) return null;
        if (!v.isFrac) return { retry: true, msg: 'On attend une fraction, écrite avec une barre : 37/10.' };
        if (![10, 100, 1000, 10000].includes(v.d) || !Number.isInteger(v.n)) return { retry: true, msg: 'Une fraction décimale a pour dénominateur 10, 100 ou 1 000. Corrige ta fraction.' };
        const ok = eq(v.value, D.x); markInput(r, 0, ok);
        return { ok, msg: `${fmt(D.x)} = <b>${F(D.m, den)}</b> (car ${last} est le chiffre des ${RANKW[D.k]}).` };
      },
    };
  }
  const k = rand(1, 3), den = 10 ** k;
  let n; do { n = rand(3, 9999); } while (n % 10 === 0);
  const x = n / den;
  return {
    hints: [
      `Que vaut ${F(1, den)} en écriture décimale ? Relis le tableau des fractions décimales dans ${ficheLink('decimaux1')}.`,
      k === 2 && n === 73 ? `Exemple : ${F(841, 10)} = 84,1.` : `Exemple : ${F(73, 100)} = 0,73 et ${F(841, 10)} = 84,1.`,
      `Outil : diviser par ${fmt(den)}, c'est décaler la virgule de ${k} rang${k > 1 ? 's' : ''} vers la gauche (le dernier chiffre devient le chiffre des ${RANKW[k]}).`,
    ],
    remediate(r) {
      const v = val(r); if (!v || v.isFrac || eq(v.value, x)) return null;
      if (eq(v.value, Number(`${n}.${den}`))) return `${F(n, den)} ne s'écrit pas ${n},${den} : la barre de fraction n'est pas une virgule. Elle veut dire « divisé par ».`;
      if ([10, 100, 0.1, 0.01].some((f) => eq(v.value, x * f))) return `La virgule n'est pas au bon endroit : le dernier chiffre de ${n} doit être le chiffre des <b>${RANKW[k]}</b>.`;
      return null;
    },
    q: `<p class="big">${F(n, den)} = ${inp('num')}</p><p class="hint">Donne l'écriture décimale.</p>`,
    check(r) {
      const v = val(r); if (!v) return null;
      if (v.isFrac) return { retry: true, msg: 'On attend une écriture décimale, par exemple 0,73.' };
      const ok = eq(v.value, x); markInput(r, 0, ok);
      return { ok, msg: `${F(n, den)} = <b>${fmt(x)}</b> : ${n} ${RANKW[k]}, le dernier chiffre est au rang des ${RANKW[k]}.` };
    },
  };
}

/* ---------- 7. Des lettres aux chiffres ---------- */
function genLettres(hard = false) {
  // ★ : « … unités et … millièmes » avec des zéros à placer (12 unités et 7 millièmes = 12,007)
  if (!hard && Math.random() < 0.55) {
    const k = rand(1, 3);
    let N = pick([rand(2, 19), rand(20, 99), rand(100, 999)]);
    if (N % 10 === 0) N++;
    const x = N / 10 ** k, rk = RANKW[k];
    const words = `${numWords(N)} ${rk}`;
    return {
      hints: [
        `Combien de chiffres après la virgule pour des ${rk} ? Relis le tableau des fractions décimales dans ${ficheLink('decimaux1')}.`,
        'Exemple : seize centièmes = 16/100 = 0,16 ; trois-cent-deux dixièmes = 302/10 = 30,2.',
        `Outil : écris d'abord la fraction : ${numWords(N)} ${rk} = ${F('…', 10 ** k)}.`,
      ],
      remediate(r) {
        const v = val(r); if (!v || eq(v.value, x)) return null;
        if (eq(v.value, N)) return `Tu as écrit ${N} unités. Mais ce sont des <b>${rk}</b> : le nombre est beaucoup plus petit.`;
        if (eq(v.value, x * 10) || eq(v.value, x / 10)) return `Vérifie le rang : le dernier chiffre doit être le chiffre des <b>${rk}</b> (${k === 1 ? '1er' : k + 'e'} chiffre après la virgule).`;
        return null;
      },
      q: `<p class="statement">Écris en chiffres (écriture décimale) :</p><p class="big"><i>${cap(words)}</i> = ${inp('num')}</p>`,
      check(r) {
        const v = val(r); if (!v) return null;
        if (v.isFrac) { if (eq(v.value, x)) return { retry: true, msg: `C'est la bonne fraction ! Écris maintenant ce nombre en écriture décimale.` }; return { retry: true, msg: 'On attend une écriture décimale, avec une virgule.' }; }
        const ok = eq(v.value, x); markInput(r, 0, ok);
        return { ok, msg: `${cap(words)} = ${F(N, 10 ** k)} = <b>${fmt(x)}</b>.` };
      },
    };
  }
  const E = pick([rand(1, 20), rand(21, 999)]), k = hard ? 3 : rand(2, 3);
  const N = hard ? (() => { let v; do { v = rand(1, 99); } while (v % 10 === 0); return v; })() : Math.random() < 0.5 ? rand(1, 9) : rand(10, 10 ** k - 1);
  const x = E + N / 10 ** k, rk = RANKW[k];
  const words = `${numWords(E)} unité${E > 1 ? 's' : ''} et ${numWords(N)} ${N > 1 ? rk : rk.slice(0, -1)}`;
  return {
    hints: [
      `Écris d'abord la partie entière, puis cherche où placer les ${rk}.`,
      'Exemple : 614 unités et 28 centièmes = 614,28 ; 3 unités et 5 centièmes = 3,05 (le 5 est au 2e rang après la virgule).',
      `Outil : ${N} ${rk} = ${F(N, 10 ** k)} = ${fmt(N / 10 ** k)}.`,
    ],
    remediate(r) {
      const v = val(r); if (!v || eq(v.value, x)) return null;
      if (eq(v.value, Number(`${E}.${N}`))) return `${numWords(N)} ${rk}, ce n'est pas 0,${N} ! Le dernier chiffre doit être au rang des <b>${rk}</b> : il faut peut-être des zéros après la virgule.`;
      return null;
    },
    q: `<p class="statement">Écris en chiffres (écriture décimale) :</p><p class="big"><i>${cap(words)}</i> = ${inp('num')}</p>`,
    check(r) {
      const v = val(r); if (!v) return null;
      if (v.isFrac) return { retry: true, msg: 'On attend une écriture décimale, avec une virgule.' };
      const ok = eq(v.value, x); markInput(r, 0, ok);
      return { ok, msg: `${cap(words)} = ${fmt(E)} + ${F(N, 10 ** k)} = <b>${decStr(Math.round(x * 10 ** k), k)}</b>.` };
    },
  };
}

/* ---------- 8. Différentes écritures d'un nombre ---------- */
function genFormes(hard = false) {
  // ★ : trois décimales, avec des zéros (5,047)
  const k = hard ? 3 : pick([1, 2, 2, 3]), I = rand(1, 999);
  const d = digitsStr(k, { first: false, zeros: hard ? 0.45 : 0.2 }).replace(/0$/, String(rand(1, 9)));
  const den = 10 ** k, dn = Number(d), m = Number(String(I) + d), x = m / den;
  const exk = (I === 614 ? '12,35' : '614,28');
  return {
    hints: [
      `Combien de chiffres après la virgule ? C'est ce qui donne le dénominateur. Relis « À retenir » dans ${ficheLink('decimaux1')}.`,
      exk === '614,28' ? `Exemple : 614,28 = ${F(61428, 100)} = 614 + ${F(28, 100)}.` : `Exemple : 12,35 = ${F(1235, 100)} = 12 + ${F(35, 100)}.`,
      `Outil : la partie entière de ${fmt(x)} est ${fmt(I)} ; sa partie décimale est 0,${d}.`,
    ],
    remediate(r) {
      const a = val(r, 0), e = val(r, 1), f = val(r, 2);
      if (!a || !e || !f) return null;
      const msgs = [];
      if (!(a.isFrac && [10, 100, 1000].includes(a.d) && eq(a.value, x))) {
        markInput(r, 0, false);
        msgs.push(a.isFrac && a.n === I ? 'Ligne 1 : au numérateur, on écrit <b>tout</b> le nombre sans la virgule.' : `Ligne 1 : combien de chiffres après la virgule dans ${fmt(x)} ? Cela donne le dénominateur.`);
      }
      if (!eq(e.value, I)) { markInput(r, 1, false); msgs.push('Ligne 2 : la partie entière, c\'est le nombre écrit avant la virgule.'); }
      if (!(f.isFrac && [10, 100, 1000].includes(f.d) && eq(f.value, dn / den))) { markInput(r, 2, false); msgs.push(`Ligne 2 : la fraction décimale doit valoir la partie décimale, 0,${d}.`); }
      return msgs.length ? `<ul>${msgs.map((t) => `<li>${t}</li>`).join('')}</ul>` : null;
    },
    q: `<p>Écris le nombre <b>${fmt(x)}</b> de deux autres façons :</p>
      <div class="form-lines">
        <div class="form-line">${fmt(x)} = ${inp('frac', 'Fraction décimale')}<small>une fraction décimale</small></div>
        <div class="form-line">${fmt(x)} = ${inp('num', 'Partie entière')} + ${inp('frac', 'Fraction décimale inférieure à 1')}<small>la somme d'un entier et d'une fraction décimale</small></div>
      </div>`,
    check(r) {
      const a = val(r, 0), e = val(r, 1), f = val(r, 2);
      if (!a || !e || !f) return null;
      const ok1 = a.isFrac && [10, 100, 1000].includes(a.d) && eq(a.value, x);
      const ok2 = eq(e.value, I), ok3 = f.isFrac && [10, 100, 1000].includes(f.d) && eq(f.value, dn / den);
      [ok1, ok2, ok3].forEach((o, i) => markInput(r, i, o));
      return { ok: ok1 && ok2 && ok3, msg: `${fmt(x)} = ${F(m, den)} = ${fmt(I)} + ${F(dn, den)}` };
    },
  };
}

/** Tableaux de la fiche */
function renderDec1Fiche() {
  document.querySelectorAll('[data-numtab]').forEach((el) => { const [i, d] = el.dataset.numtab.split(','); el.innerHTML = numTable(i, d || ''); });
}
/* =========================================================
   CHAPITRE 3 — DISTANCE ET CERCLE
   ========================================================= */
const PAIRS = [['A', 'B'], ['E', 'F'], ['M', 'N'], ['R', 'S'], ['C', 'D'], ['K', 'L']];

/** Figure pour une notation : kind = seg | ray (origine a, passe par b) | line | len */
function notationFig(kind, nA, nB, len = null) {
  const A = { x: 2.6, y: 2.2 }, B = { x: 6.2, y: 1.6 }, u = G.norm(G.sub(B, A));
  const box = [0, 0, 10, 3.6];
  const items = [];
  let marks = { [nA]: 'none', [nB]: 'none' };
  if (kind === 'seg' || kind === 'len') {
    items.push(F2.seg(A, B), F2.end(A, u), F2.end(B, u));
    if (kind === 'len') items.push(F2.len(A, B, len, { x: 4.4, y: 3 }));
  } else if (kind === 'line') {
    items.push(F2.xline(A, u, 'f-seg'));
    marks = { [nA]: { dash: u }, [nB]: { dash: u } };
  } else {
    const [O, T] = kind === 'ray' ? [A, B] : [B, A];
    items.push(F2.ray(O, T, 'f-seg'), F2.end(O, u));
    marks = { [nA]: 'none', [nB]: 'none' };
    marks[kind === 'ray' ? nB : nA] = { dash: u };
  }
  return figure({ [nA]: A, [nB]: B }, items, { box, marks, center: { x: 4.4, y: 4 } });
}

/* ---------- 1. Notations : segment, demi-droite, droite ---------- */
function genNotation() {
  const [a, b] = pick(PAIRS);
  const kinds = ['seg', 'ray', 'rayr', 'line'];
  const NOT = { seg: `[${a}${b}]`, ray: `[${a}${b})`, rayr: `[${b}${a})`, line: `(${a}${b})` };
  const NOM = { seg: `le segment [${a}${b}]`, ray: `la demi-droite [${a}${b}) d'origine ${a}, qui passe par ${b}`, rayr: `la demi-droite [${b}${a}) d'origine ${b}, qui passe par ${a}`, line: `la droite (${a}${b})` };
  const k = pick(kinds), ci = kinds.indexOf(k);
  const MSG = {
    seg: 'Les deux crochets [ ] désignent un <b>segment</b> : il s\'arrête à ses deux extrémités.',
    ray: `[${a}${b}) est une demi-droite d'origine <b>${a}</b> : elle part de ${a} et continue après ${b}.`,
    rayr: `[${b}${a}) est une demi-droite d'origine <b>${b}</b> : elle part de ${b} et continue après ${a}.`,
    line: 'Les parenthèses ( ) désignent une <b>droite</b> : elle est illimitée des deux côtés.',
  };
  const hints = [
    `Relis le tableau des notations dans ${ficheLink('cercle')}. Le tracé s'arrête-t-il d'un côté ? des deux côtés ? d'aucun côté ?`,
    'Outil : le crochet [ se met du côté où le tracé s\'arrête ; la parenthèse ( ou ) du côté où il continue. Pour une demi-droite, la première lettre est l\'origine.',
  ];
  if (Math.random() < 0.5) {
    const kk = kinds.map((x) => x === 'rayr' ? 'rayr' : x);
    const o = mcq(`<p>Quelle est la notation de la figure tracée ?</p>${notationFig(k === 'rayr' ? 'rayr' : k, a, b)}`, kk.map((x) => NOT[x]), ci,
      `C'est ${NOM[k]} : on note <b>${NOT[k]}</b>.`, { keepOrder: false });
    return withRemed(withHints(o, hints), (i) => {
      if (k.startsWith('ray') && kinds[i].startsWith('ray')) return 'Regarde d\'où part le tracé : la première lettre d\'une demi-droite est son <b>origine</b>, le point où elle commence.';
      if (k === 'seg') return 'Ici, le tracé s\'arrête des deux côtés : il a deux extrémités.';
      if (k === 'line') return 'Ici, le tracé ne s\'arrête d\'aucun côté : il est illimité.';
      return 'Ici, le tracé s\'arrête d\'un côté seulement, et continue de l\'autre.';
    });
  }
  const o = mcq(`<p>Quelle figure représente <b>${NOT[k]}</b> ?</p>`, kinds.map((x) => notationFig(x, a, b)), ci,
    `${NOT[k]} : c'est ${NOM[k]}. ${MSG[k]}`, { cls: 'pics wide' });
  return withRemed(withHints(o, hints), (i) => `Tu as choisi ${NOM[kinds[i]]}. ${MSG[k]}`);
}

/* ---------- 2. Écrire correctement ---------- */
function genEcrire() {
  const [a, b] = pick(PAIRS), L = rand(15, 95) / 10, M = pick(['M', 'P', 'T']), I = 'I';
  const v = rand(0, 2);
  if (v === 0) {
    const opts = [`${a}${b} = ${cm(L)}`, `[${a}${b}] = ${cm(L)}`, `(${a}${b}) = ${cm(L)}`, `[${a}${b}) = ${cm(L)}`];
    return withRemed(withHints(mcq(`<p class="statement">Le segment [${a}${b}] mesure ${cm(L)}. Quelle écriture est correcte ?</p>`, opts, 0,
      `[${a}${b}] désigne la figure (le segment) ; ${a}${b}, sans crochets, désigne un <b>nombre</b> : sa longueur. On écrit donc <b>${a}${b} = ${cm(L)}</b>, jamais [${a}${b}] = ${cm(L)}.`, { col: true }),
    [`Relis « Attention aux notations » dans ${ficheLink('cercle')} : laquelle de ces écritures désigne un nombre ?`, 'Outil : une figure ne peut pas être égale à un nombre. Seule la longueur (sans crochets ni parenthèses) peut valoir 5 cm.']),
    (i) => (i === 1 ? `[${a}${b}] est le segment, c'est-à-dire un dessin. Il ne peut pas être égal à un nombre ! Sa longueur s'écrit ${a}${b}.` : `Une droite ou une demi-droite est illimitée : elle n'a pas de longueur. Et c'est la longueur ${a}${b} qu'on cherche à écrire.`));
  }
  if (v === 1) {
    const opts = [`${M} ∈ [${a}${b}]`, `${M} ∈ ${a}${b}`, `${M} = [${a}${b}]`, `${M} ∉ [${a}${b}]`];
    return withRemed(withHints(mcq(`<p class="statement">Le point ${M} est <b>sur</b> le segment [${a}${b}]. Quelle écriture est correcte ?</p>`, opts, 0,
      `Le symbole ∈ veut dire « appartient à ». ${M} appartient au segment [${a}${b}] (la figure, avec ses crochets) : on écrit <b>${M} ∈ [${a}${b}]</b>.`, { col: true }),
    ['Que veut dire le symbole ∈ ? Et ∉ ?', `Outil : un point appartient à une <b>figure</b> (un segment, une droite…). ${a}${b} sans crochets est un nombre : un point ne peut pas lui appartenir.`]),
    (i) => (i === 1 ? `${a}${b} sans crochets est une longueur, un nombre. Le point appartient au <b>segment</b> [${a}${b}].` : i === 2 ? 'Un point n\'est pas égal à un segment : il est <b>sur</b> le segment. On utilise le symbole ∈.' : '∉ veut dire « n\'appartient pas à ». Or le point est sur le segment.'));
  }
  const opts = [`${I} ∈ [${a}${b}] et ${a}${I} = ${I}${b}`, `${a}${I} = ${I}${b}`, `${I} ∈ [${a}${b}]`, `[${a}${I}] = [${I}${b}]`];
  return withRemed(withHints(mcq(`<p class="statement">« ${I} est le milieu du segment [${a}${b}] » signifie :</p>`, opts, 0,
    `Le milieu est un point <b>du segment</b> qui le partage en deux longueurs <b>égales</b> : ${I} ∈ [${a}${b}] et ${a}${I} = ${I}${b}. Les deux conditions sont nécessaires.`, { col: true }),
  [`Relis la définition du milieu dans ${ficheLink('cercle')}. Combien de conditions faut-il ?`, 'Outil : dessine un point à égale distance de A et de B, mais pas sur [AB]. Est-ce le milieu ? Dessine un point de [AB] plus près de A. Est-ce le milieu ?']),
  (i) => (i === 1 ? `Un point peut être à la même distance de ${a} et de ${b} sans être sur le segment (au-dessus, par exemple). Il manque une condition.` : i === 2 ? `Beaucoup de points sont sur [${a}${b}] ! Lequel est le milieu ? Il manque une condition.` : `[${a}${I}] et [${I}${b}] sont des figures : on compare leurs <b>longueurs</b>, ${a}${I} et ${I}${b}.`));
}

/* ---------- 3. Milieu d'un segment ---------- */
function genMilieu(hard = false) {
  const [a, b] = pick(PAIRS);
  // ★ : longueur avec un nombre impair de dixièmes (7,3 cm → 3,65 cm)
  if (hard || Math.random() < 0.4) {
    const half = hard ? (2 * rand(12, 48) + 1) / 20 : rand(12, 48) / 10;
    const fromWhole = hard ? true : Math.random() < 0.5;
    const ans = fromWhole ? half : 2 * half;
    const given = fromWhole ? `${a}${b} = ${cm(2 * half)}` : `${a}I = ${cm(half)}`;
    const asked = fromWhole ? `${a}I` : `${a}${b}`;
    return {
      hints: [`Que sais-tu des longueurs ${a}I et I${b} quand I est le milieu de [${a}${b}] ?`,
        fromWhole ? 'Exemple : si EF = 7 cm et K est le milieu de [EF], alors EK = KF = 7 ÷ 2 = 3,5 cm.' : 'Exemple : si K est le milieu de [EF] et EK = 3,5 cm, alors EF = 2 × 3,5 = 7 cm.',
        { html: 'Outil : fais un schéma codé.', act: (r) => r.insertAdjacentHTML('beforeend', `<div class="hint-fig">${figure({ [a]: { x: 1, y: 1 }, I: { x: 5, y: 1 }, [b]: { x: 9, y: 1 } }, [F2.seg({ x: 1, y: 1 }, { x: 9, y: 1 }), F2.end({ x: 1, y: 1 }, { x: 1, y: 0 }), F2.end({ x: 9, y: 1 }, { x: 1, y: 0 }), F2.ticks({ x: 1, y: 1 }, { x: 5, y: 1 }), F2.ticks({ x: 5, y: 1 }, { x: 9, y: 1 })], { box: [0, 0, 10, 2], marks: { [a]: 'none', [b]: 'none', I: { dash: { x: 1, y: 0 } } }, center: { x: 5, y: 3 } })}</div>`) }],
      remediate(r) {
        const v = val(r); if (!v || eq(v.value, ans)) return null;
        if (fromWhole && eq(v.value, 2 * half)) return `${a}${b} est la longueur du segment entier. ${a}I n'en est qu'une partie.`;
        if (fromWhole && eq(v.value, 4 * half)) return `Le milieu partage le segment en deux : faut-il multiplier ou diviser par 2 ?`;
        if (!fromWhole && eq(v.value, half)) return `${a}I n'est que la moitié du segment. Combien mesure le segment entier ?`;
        if (!fromWhole && eq(v.value, half / 2)) return 'Le segment entier est plus long que sa moitié : faut-il multiplier ou diviser par 2 ?';
        return null;
      },
      q: `<p class="statement">I est le milieu du segment [${a}${b}] et ${given}.</p><p class="big">${asked} = ${inp('num', 'Longueur')} cm</p>`,
      check(r) {
        const v = val(r); if (!v) return null;
        const ok = eq(v.value, ans); markInput(r, 0, ok);
        return { ok, msg: fromWhole ? `I est le milieu de [${a}${b}], donc ${a}I = I${b} = ${fmt(2 * half)} ÷ 2 = <b>${cm(half)}</b>.` : `I est le milieu de [${a}${b}], donc I${b} = ${a}I = ${cm(half)} et ${a}${b} = 2 × ${fmt(half)} = <b>${cm(2 * half)}</b>.` };
      },
    };
  }
  const kind = pick(['yes', 'notOn', 'unequal']);
  const A = { x: 1.2, y: 3 }, B = { x: 8.8, y: 2.4 }, u = G.norm(G.sub(B, A)), Lab = G.dist(A, B);
  const scale = rand(16, 22) / 10 / (Lab / 2); // longueur affichée en cm
  let I, l1, l2;
  if (kind === 'yes') { I = G.mid(A, B); l1 = l2 = round1((Lab / 2) * scale); }
  else if (kind === 'unequal') { const t = pick([0.42, 0.57]); I = lerp(A, B, t); l1 = round1(Lab * t * scale); l2 = round1(Lab * (1 - t) * scale); if (eq(l1, l2)) l2 = round1(l2 + 0.2); }
  else { I = G.add(G.mid(A, B), G.mul(G.perp(u), -1.5)); l1 = l2 = round1(G.dist(A, I) * scale); }
  const items = [F2.seg(A, B), F2.end(A, u), F2.end(B, u)];
  if (kind === 'notOn') items.push(F2.seg(A, I, 'f-dashed'), F2.seg(I, B, 'f-dashed'));
  items.push(F2.len(A, I, cm(l1), kind === 'notOn' ? B : { x: 5, y: 6 }), F2.len(I, B, cm(l2), kind === 'notOn' ? A : { x: 5, y: 6 }));
  const fig = figure({ [a]: A, [b]: B, I }, items, { box: [0, 0, 10, 4.4], marks: { [a]: 'none', [b]: 'none', I: kind === 'notOn' ? 'x' : { dash: u } }, center: { x: 5, y: 1 } });
  const yes = kind === 'yes';
  const expl = { yes: `I est sur [${a}${b}] et ${a}I = I${b} = ${cm(l1)} : I est bien le milieu de [${a}${b}].`,
    notOn: `${a}I = I${b}, mais I n'est <b>pas sur</b> le segment [${a}${b}] : ce n'est pas son milieu.`,
    unequal: `I est sur [${a}${b}], mais ${a}I = ${cm(l1)} et I${b} = ${cm(l2)} : les longueurs ne sont <b>pas égales</b>. Ce n'est pas le milieu.` }[kind];
  return withRemed(withHints(mcq(`<p>Le point I est-il le milieu du segment [${a}${b}] ?</p>${fig}`, ['Oui', 'Non'], yes ? 0 : 1, expl, { keepOrder: true }),
    [`Relis la définition du milieu dans ${ficheLink('cercle')} : il y a <b>deux</b> conditions. Vérifie-les une par une.`, 'Outil : 1) I est-il sur le segment ? 2) Les deux longueurs sont-elles égales ?']),
  () => ({ yes: 'Vérifie les deux conditions : I est-il sur [' + a + b + '] ? Les deux longueurs sont-elles égales ? Ici, les deux sont vraies.',
    notOn: 'Les deux longueurs sont égales… mais I est-il <b>sur</b> le segment ?',
    unequal: 'I est bien sur le segment… mais compare les deux longueurs écrites.' })[kind]);
}

/* ---------- 4. Tracer : demi-droite, milieu (planche) ---------- */
function sceneRay(nO, nT, O, T) {
  const u = G.norm(G.sub(T, O)), E = G.add(O, G.mul(u, G.dist(O, T) + 2.6)), c = G.add(G.mid(O, T), G.mul(G.perp(u), -3));
  return {
    pts: [O, T, E],
    base: [ptSVG(nO, O, c), ptSVG(nT, T, c)],
    steps: [STEP.seg(O, E, `Place la règle sur ${nO} et ${nT}. Pars de ${nO} et trace en <b>dépassant</b> ${nT}, jusqu'au bord.`, { side: G.perp(u), center: c }),
      STEP.marks(F2.end(O, u), `Le tracé s'arrête en ${nO} (l'origine) et continue après ${nT} : c'est la demi-droite [${nO}${nT}).`)],
  };
}
function sceneMilieu(nA, nB, A, B, L, nI = 'I') {
  const M = G.mid(A, B), u = G.norm(G.sub(B, A)), c = G.add(M, G.mul(G.perp(u), 3));
  return {
    pts: [A, B],
    base: [F2.seg(A, B), F2.end(A, u), F2.end(B, u), ptSVG(nA, A, c, 1, 'none'), ptSVG(nB, B, c, 1, 'none')],
    steps: [
      STEP.measure(A, B, M, `${nA}${nB} = ${cm(L)}. La moitié : ${fmt(L)} ÷ 2 = ${cm(L / 2)}. Pose la règle avec le 0 sur ${nA} et repère ${cm(L / 2)}.`, awayFrom(A, B, c)),
      STEP.point(nI, M, c, `Place ${nI} à ${cm(L / 2)} de ${nA} : ${nA}${nI} = ${nI}${nB} = ${cm(L / 2)}.`, F2.ticks(A, M) + F2.ticks(M, B), { dash: u }),
    ],
  };
}
function genTracer() {
  if (Math.random() < 0.5) {
    const [a, b] = pick(PAIRS), rev = Math.random() < 0.5;
    const [nO, nT] = rev ? [b, a] : [a, b];
    const phi = rand(-25, 25), u = dirDeg(phi), c = { x: 7, y: 5.5 }, dd = rand(30, 45) / 10;
    const A = G.add(c, G.mul(u, -dd / 2)), B = G.add(c, G.mul(u, dd / 2));
    const P = { [a]: A, [b]: B }, O = P[nO], T = P[nT];
    const isGood = (Lx) => Lx.kind === 'hray' && G.dist(Lx.P, O) < 0.12 && distToLine(Lx, T) < 0.12 && G.dot(Lx.d, G.sub(T, O)) > 0;
    return {
      hints: [`Quelle est l'origine de la demi-droite [${nO}${nT}) ? Relis le tableau des notations dans ${ficheLink('cercle')}.`,
        `Exemple : [ST) part de S, passe par T et continue après T. [TS) part de T, passe par S et continue après S.`,
        'Clique sur « 🎬 Voir un exemple » pour voir le tracé à la règle.'],
      anim: () => sceneRay(nO, nT, O, T),
      example: () => sceneRay('S', 'T', { x: 0, y: 0 }, { x: 3.4, y: -0.8 }),
      remediate(r) {
        const lins = r._board.linears(); if (!lins.length || lins.some(isGood)) return null;
        if (lins.some((Lx) => Lx.kind === 'hray' && G.dist(Lx.P, T) < 0.12 && distToLine(Lx, O) < 0.12)) return `Ta demi-droite part de ${nT}. Mais [${nO}${nT}) a pour <b>origine ${nO}</b> : la première lettre, à côté du crochet.`;
        if (lins.some((Lx) => Lx.kind === 'line')) return `Tu as tracé une <b>droite</b>, illimitée des deux côtés. Une demi-droite s'arrête d'un côté : utilise l'outil Demi-droite.`;
        if (lins.some((Lx) => Lx.kind === 'seg')) return `Tu as tracé un <b>segment</b> : il s'arrête des deux côtés. La demi-droite continue après ${nT}.`;
        return null;
      },
      _t: { kind: 'ray', O, T },
      q: `<p class="statement">Trace la demi-droite <b>[${nO}${nT})</b>.</p><div class="board"></div>`,
      mount(r) { r._board = createBoard(r.querySelector('.board'), { tool: 'hray', names: [], given: { points: [{ name: a, ...A }, { name: b, ...B }] } }); },
      check(r) {
        const lins = r._board.linears(); if (!lins.length) return null;
        const good = lins.some(isGood);
        return { ok: good, msg: good ? `C'est bien la demi-droite [${nO}${nT}) : elle part de ${nO} et continue après ${nT}.` : `[${nO}${nT}) est la demi-droite d'<b>origine ${nO}</b> qui passe par ${nT} : elle s'arrête en ${nO} et continue après ${nT}.<br>Outil Demi-droite : clique sur ${nO}, puis sur ${nT}.${notationFig(nO === a ? 'ray' : 'rayr', a, b)}` };
      },
    };
  }
  const [a, b] = pick(PAIRS), L = (2 * rand(20, 52)) / 10;
  const phi = rand(-25, 25), u = dirDeg(phi), c = { x: 8, y: 5.5 };
  const A = G.add(c, G.mul(u, -L / 2)), B = G.add(c, G.mul(u, L / 2)), M = G.mid(A, B);
  const segL = { P: A, d: G.sub(B, A), t0: 0, t1: 1 };
  const onSeg = (p) => { const t = clamp(G.dot(G.sub(p, A), segL.d) / G.dot(segL.d, segL.d), 0, 1); return G.dist(p, G.add(A, G.mul(segL.d, t))) < 0.1; };
  return {
    hints: [`Le milieu partage [${a}${b}] en deux longueurs égales. Quelle est la moitié de ${cm(L)} ?`,
      'Exemple : si EF = 7,4 cm, le milieu K est sur [EF] à 7,4 ÷ 2 = 3,7 cm de E.',
      'Outil : avec la Règle, pars de ' + a + ' et glisse le long de [' + a + b + '] : la longueur s\'affiche. Arrête-toi à la moitié. Le point créé prend le nom choisi dans « Prochain point ».'],
    anim: () => sceneMilieu(a, b, A, B, L),
    example: () => sceneMilieu('E', 'F', { x: 0, y: 0 }, { x: 7.4, y: 0 }, 7.4, 'K'),
    remediate(r) {
      const I = r._board.byName('I'); if (!I || G.dist(I, M) <= 0.12) return null;
      if (!onSeg(I)) return `Le point I doit être <b>sur</b> le segment [${a}${b}].`;
      return `I est bien sur [${a}${b}], mais ${a}I = ${cm(round1(G.dist(A, I)))} et I${b} = ${cm(round1(G.dist(I, B)))} : ce n'est pas le milieu. Combien mesure la moitié de ${cm(L)} ?`;
    },
    _t: { kind: 'mil', A, B, M },
    q: `<p class="statement">Le segment [${a}${b}] mesure ${cm(L)}. Place son milieu <b>I</b>.</p><div class="board"></div>`,
    mount(r) { r._board = createBoard(r.querySelector('.board'), { tool: 'seg', names: ['I'], given: { points: [{ name: a, ...A }, { name: b, ...B }], segs: [[a, b]] } }); },
    check(r) {
      const I = r._board.byName('I');
      if (!I) return r._board.drawnCount() ? { retry: true, msg: 'Aucun point ne s\'appelle I. Choisis « I » dans « Prochain point » avant de le placer.' } : null;
      const good = G.dist(I, M) <= 0.12;
      return { ok: good, msg: good ? `${a}I = I${b} = ${cm(L / 2)} et I est sur [${a}${b}] : c'est bien le milieu.` : `Le milieu I est sur [${a}${b}], à ${fmt(L)} ÷ 2 = ${cm(L / 2)} de ${a}.${figure({ [a]: A, [b]: B, I: M }, [F2.seg(A, B), F2.end(A, u), F2.end(B, u), F2.ticks(A, M), F2.ticks(M, B), F2.len(A, M, cm(L / 2), G.add(M, G.mul(G.perp(u), 4)))], { marks: { [a]: 'none', [b]: 'none', I: { dash: u } }, center: G.add(M, G.mul(G.perp(u), -3)) })}` };
    },
  };
}

/* ---------- 5. Médiatrice : propriété et réciproque ---------- */
function genMedProp(hard = false) {
  const [A, B] = pick(PAIRS), M = pick(['M', 'P', 'K']);
  const x = rand(15, 95) / 10;
  // ★ : la réciproque
  if (!hard && Math.random() < 0.6) {
    return {
      hints: [`Relis la propriété d'équidistance de la médiatrice dans ${ficheLink('cercle')}.`,
        A === 'R' ? 'Exemple : P est sur la médiatrice de [EF] et PE = 3 cm. Alors PF = 3 cm.' : 'Exemple : P est sur la médiatrice de [RS] et PR = 3 cm. Alors PS = 3 cm.',
        'Outil : « équidistant » veut dire « à égale distance ».'],
      remediate(r) {
        const v = val(r); if (!v || eq(v.value, x)) return null;
        if (eq(v.value, 2 * x) || eq(v.value, x / 2)) return `${M} est sur la médiatrice : que dit la propriété sur les distances ${M}${A} et ${M}${B} ? Le milieu n'a rien à voir ici.`;
        return null;
      },
      q: `<p class="statement">Le point ${M} est sur la médiatrice du segment [${A}${B}] et ${M}${A} = ${cm(x)}.</p><p class="big">${M}${B} = ${inp('num', 'Longueur')} cm</p>`,
      check(r) {
        const v = val(r); if (!v) return null;
        const ok = eq(v.value, x); markInput(r, 0, ok);
        return { ok, msg: `${M} est sur la médiatrice de [${A}${B}], donc il est à égale distance de ${A} et de ${B} : ${M}${B} = ${M}${A} = <b>${cm(x)}</b>.` };
      },
    };
  }
  const opts = [`${M} est sur la médiatrice de [${A}${B}]`, `${M} est le milieu de [${A}${B}]`, `${M} est sur le segment [${A}${B}]`, 'On ne peut rien dire'];
  return withRemed(withHints(mcq(`<p class="statement">${M}${A} = ${M}${B} = ${cm(x)}. Que peut-on dire du point ${M} ?</p>`, opts, 0,
    `${M} est équidistant de ${A} et de ${B}. D'après la <b>réciproque</b> de la propriété, ${M} est sur la médiatrice de [${A}${B}].`, { col: true }),
  [`Relis la réciproque dans ${ficheLink('cercle')} : que sait-on d'un point équidistant de deux points ?`, 'Outil : dessine plusieurs points à égale distance de A et de B. Où sont-ils tous ?']),
  (i) => (i === 1 || i === 2 ? `Rien ne dit que ${M} est sur le segment : ${M} peut être au-dessus ou en dessous de [${A}${B}], tout en étant à la même distance de ${A} et de ${B}.` : 'On peut dire quelque chose : relis la réciproque de la propriété de la médiatrice.'));
}

/* ---------- 6. Tracer la médiatrice au compas ---------- */
function sceneMediatrice6([nA, nB], A, B, [nE, nF]) {
  const L = G.dist(A, B), r = round1(L * 0.72), ctr = G.mid(A, B);
  const u = G.norm(G.sub(B, A)), n = G.perp(u), h = Math.sqrt(r * r - (L / 2) ** 2);
  const E = G.add(ctr, G.mul(n, -h)), Fp = G.add(ctr, G.mul(n, h));
  const aE = ang2(G.sub(E, A)), aF = ang2(G.sub(Fp, A)), bE = ang2(G.sub(E, B)), bF = ang2(G.sub(Fp, B)), e = 0.32;
  return {
    pts: [A, B, E, Fp], center: ctr,
    base: [F2.seg(A, B), F2.end(A, u), F2.end(B, u), ptSVG(nA, A, ctr, 1, 'none'), ptSVG(nB, B, ctr, 1, 'none')],
    steps: [
      STEP.arc(A, r, aE - e, aE + e, `Prends un écartement de compas <b>plus grand que la moitié</b> de ${nA}${nB} (ici ${cm(r)}). Pique en ${nA} : trace un arc au-dessus…`),
      STEP.arc(A, r, aF - e, aF + e, `… et un arc en dessous du segment.`),
      STEP.arc(B, r, bE - e, bE + e, `Garde le <b>même écartement</b> et pique en ${nB} : un arc au-dessus…`),
      STEP.arc(B, r, bF - e, bF + e, '… et un arc en dessous.'),
      STEP.point(nE, E, ctr, `Les arcs se coupent en deux points : ${nE}…`),
      STEP.point(nF, Fp, ctr, `… et ${nF}.`),
      STEP.xline(E, Fp, `Trace la droite (${nE}${nF}) : c'est la médiatrice de [${nA}${nB}].`, G.mul(u, -1)),
      STEP.marks(F2.right(ctr, u, n) + F2.ticks(A, ctr) + F2.ticks(ctr, B), `Elle est perpendiculaire à [${nA}${nB}] et passe par son milieu.`),
    ],
  };
}
function genMedTrace() {
  const set = pick(PAIRS);
  const L = (rand(20, 40) * 2) / 10, phi = rand(-30, 30);
  const u = dirDeg(phi), C = { x: 8, y: 5.5 };
  const A = G.sub(C, G.mul(u, L / 2)), B = G.add(C, G.mul(u, L / 2));
  const [nA, nB] = set;
  const names = ['E', 'F', 'G', 'H'].filter((n) => !set.includes(n)).slice(0, 2);
  const M = G.mid(A, B);
  const good = (Lx) => distToLine(Lx, M) <= 0.15 && isPerp(Lx.d, u);
  return {
    hints: [
      `Relis la méthode « Tracer la médiatrice au compas » dans ${ficheLink('cercle')}. Quel écartement de compas faut-il prendre ?`,
      'Outil : tous les points de la médiatrice sont à égale distance des deux extrémités du segment. Le compas trace justement des points à une même distance d\'un point.',
      'Clique sur « 🎬 Voir un exemple » pour voir la méthode sur un autre segment.',
    ],
    anim: () => sceneMediatrice6([nA, nB], A, B, names),
    example: () => { const v = dirDeg(rand(-30, 30)), l = rand(4, 7); return sceneMediatrice6(['R', 'S'], G.mul(v, -l / 2), G.mul(v, l / 2), ['E', 'F']); },
    remediate(r) {
      const b = r._board, lins = b.linears(), circs = b.circles();
      const cA = circs.filter((c) => G.dist(c.c, A) < 0.05), cB = circs.filter((c) => G.dist(c.c, B) < 0.05);
      if (!lins.length && cA.length && cB.length) {
        if (cA.concat(cB).some((c) => c.r <= L / 2 + 0.05)) return `Ton écartement de compas est trop petit : il doit être <b>plus grand que la moitié</b> de ${nA}${nB} (${cm(L / 2)}), sinon les arcs ne se coupent pas.`;
        if (!cA.some((c) => cB.some((d) => Math.abs(c.r - d.r) < 0.05))) return `Garde le <b>même écartement</b> de compas pour l'arc de centre ${nA} et pour l'arc de centre ${nB}.`;
        return null;
      }
      if (!lins.length || lins.some(good)) return null;
      if (lins.some((Lx) => distToLine(Lx, M) <= 0.15)) return `Ta droite passe bien par le milieu de [${nA}${nB}], mais elle n'est pas perpendiculaire à [${nA}${nB}].`;
      if (lins.some((Lx) => isPerp(Lx.d, u))) return `Ta droite est bien perpendiculaire à [${nA}${nB}], mais passe-t-elle par son milieu ?`;
      return null;
    },
    _t: { A, B },
    q: `<p class="statement">Trace la <b>médiatrice</b> du segment [${nA}${nB}] (${nA}${nB} = ${cm(L)}) au compas.</p><div class="board"></div>`,
    mount(r) { r._board = createBoard(r.querySelector('.board'), { names, tool: 'circle', given: { points: [{ name: nA, ...A }, { name: nB, ...B }], segs: [[nA, nB]] } }); },
    check(r) {
      const b = r._board, lins = b.linears();
      if (!lins.length) return b.drawnCount() ? { retry: true, msg: 'Il manque la médiatrice : place les deux points d\'intersection des arcs, puis trace la droite qui passe par eux (outil Droite).' } : null;
      const ok = lins.some(good);
      const R = round1(L * 0.75);
      return { ok, msg: ok ? `Ta droite est bien perpendiculaire à [${nA}${nB}] et passe par son milieu.`
        : `La médiatrice doit être <b>perpendiculaire</b> à [${nA}${nB}] et passer par son <b>milieu</b>.<b> Méthode :</b><ol class="method"><li>Compas : cercle de centre ${nA}, de rayon plus grand que la moitié de ${nA}${nB} (par exemple ${cm(R)}).</li><li>Même rayon, cercle de centre ${nB}.</li><li>Place les deux points d'intersection.</li><li>Outil Droite : trace la droite qui passe par ces deux points.</li></ol>${figure({ [nA]: A, [nB]: B }, [F2.circle(A, R, 'f-thin'), F2.circle(B, R, 'f-thin'), F2.seg(A, B), F2.xline(M, G.perp(u), 'f-red', 3), F2.right(M, u, G.perp(u)), F2.ticks(A, M), F2.ticks(M, B)], { extra: [G.add(M, G.mul(G.perp(u), 2.2)), G.sub(M, G.mul(G.perp(u), 2.2))], marks: { [nA]: 'none', [nB]: 'none' } })}` };
    },
  };
}

/* ---------- 7. Vocabulaire du cercle ---------- */
function circleScene() {
  const O = { x: 0, y: 0 }, R = 2.4;
  const at = (deg) => ({ x: R * Math.cos((deg * Math.PI) / 180), y: -R * Math.sin((deg * Math.PI) / 180) });
  // D au moins 28° après C (sinon les lettres C et D se chevauchent), E à plus de 30° de B
  const a1 = rand(150, 200), a2 = rand(100, 130), a3 = a2 - 180 + rand(28, 40), a4 = a3 + rand(75, 105);
  return { O, R, A: at(a1), B: at(a2), C: at(a2 + 180), D: at(a3), E: at(a4) };
}
function circleFig(S, hl, names = true) {
  const { O, R, A, B, C, D, E } = S;
  const cls = (k) => (hl === k ? 'f-hl' : 'f-seg');
  const items = [F2.circle(O, R, hl === 'cercle' ? 'f-hl' : 'f-circ'), F2.seg(O, A, cls('rayon')), F2.seg(B, C, cls('diametre')), F2.seg(D, E, cls('corde')), F2.arcPts(O, R, D, E, hl === 'arc' ? 'f-hlarc' : 'f-none')];
  const pts = names ? { O, A, B, C, D, E } : { O };
  return figure(pts, items, { pad: 0.9, marks: { O: 'x', A: 'none', B: 'none', C: 'none', D: 'none', E: 'none' }, center: O, extra: [{ x: -R, y: -R }, { x: R, y: R }] });
}
function genVocCercle(hard = false) {
  const S = circleScene();
  const terms = ['un rayon', 'un diamètre', 'une corde', 'un arc de cercle'];
  const keys = ['rayon', 'diametre', 'corde', 'arc'];
  const k = rand(0, 3);
  const DEF = ['un segment qui relie le centre O à un point du cercle', 'un segment qui passe par le centre O et relie deux points du cercle', 'un segment qui relie deux points du cercle', 'une portion du cercle comprise entre deux points'];
  const NM = ['[OA]', '[BC]', '[DE]', 'l\'arc DE'];
  const v = hard ? false : Math.random() < 0.5; // ★ : élément donné par son nom, sans couleur
  const prompt = v ? `<p>Comment s'appelle l'élément tracé en <b class="red">rouge</b> ?</p>${circleFig(S, keys[k])}` : `<p>Sur la figure, O est le centre du cercle. Que représente <b>${NM[k]}</b> ?</p>${circleFig(S, null)}`;
  return withRemed(withHints(mcq(prompt, terms, k, `C'est ${terms[k]} : ${DEF[k]}.`, { keepOrder: true }),
    [`Relis « Vocabulaire du cercle » dans ${ficheLink('cercle')}. Est-ce un segment ou une partie du cercle ? Passe-t-il par le centre O ?`,
      'Outil : rayon → du centre au cercle ; diamètre → d\'un point du cercle à un autre en passant par le centre ; corde → d\'un point du cercle à un autre ; arc → un morceau du cercle lui-même.']),
  (i) => {
    if (k === 2 && i === 1) return 'Cette corde passe-t-elle par le centre O ? Un diamètre doit passer par O.';
    if (k === 1 && i === 2) return 'C\'est bien un segment qui relie deux points du cercle… mais il passe par le centre O : il a un nom particulier.';
    if (k === 0) return 'Regarde les extrémités : l\'une d\'elles est le centre O.';
    if (k === 3) return 'Ce n\'est pas un segment (tout droit) : c\'est un morceau du cercle lui-même, courbe.';
    if (i === 3) return 'Un arc est courbe : c\'est un morceau du cercle. Ici, l\'élément est un segment tout droit.';
    return 'Regarde les deux extrémités de l\'élément : le centre ? des points du cercle ?';
  });
}

/* ---------- 8. Rayon et diamètre ---------- */
function genRayonDiam(hard = false) {
  // ★ : du diamètre au rayon, avec un nombre impair de dixièmes (7,3 cm → 3,65 cm)
  const rr = hard ? (2 * rand(10, 60) + 1) / 20 : rand(10, 60) / 10;
  const toD = hard ? false : Math.random() < 0.5;
  const ctx = Math.random() < 0.5;
  const [a, b] = pick([['A', 'B'], ['E', 'F'], ['M', 'N']]);
  const q = toD
    ? (ctx ? `[${a}${b}] est un diamètre du cercle de centre O, et O${a} = ${cm(rr)}. Combien mesure ${a}${b} ?` : `Un cercle a pour rayon ${cm(rr)}. Quelle est la longueur de son diamètre ?`)
    : (ctx ? `[${a}${b}] est un diamètre du cercle de centre O, et ${a}${b} = ${cm(2 * rr)}. Combien mesure O${a} ?` : `Un cercle a pour diamètre ${cm(2 * rr)}. Quelle est la longueur de son rayon ?`);
  const ans = toD ? 2 * rr : rr;
  return {
    hints: [`Relis « Propriétés des longueurs » dans ${ficheLink('cercle')}. Lequel est le plus long : le rayon ou le diamètre ?`,
      toD ? 'Exemple : un cercle de rayon 4 cm a un diamètre de 2 × 4 = 8 cm.' : 'Exemple : un cercle de diamètre 9 cm a un rayon de 9 ÷ 2 = 4,5 cm.',
      'Outil : le centre O est le milieu de chaque diamètre. Un diamètre est donc fait de deux rayons.'],
    remediate(r) {
      const v = val(r); if (!v || eq(v.value, ans)) return null;
      if (eq(v.value, toD ? rr : 2 * rr)) return 'Tu as recopié la longueur de l\'énoncé. Le diamètre et le rayon n\'ont pas la même longueur !';
      if (eq(v.value, toD ? rr / 2 : 4 * rr)) return toD ? 'Le diamètre est <b>plus long</b> que le rayon : faut-il multiplier ou diviser par 2 ?' : 'Le rayon est <b>plus court</b> que le diamètre : faut-il multiplier ou diviser par 2 ?';
      return null;
    },
    q: `<p class="statement">${q}</p><p class="big">${inp('num', 'Longueur')} cm</p>`,
    check(r) {
      const v = val(r); if (!v) return null;
      const ok = eq(v.value, ans); markInput(r, 0, ok);
      return { ok, msg: toD ? `Le diamètre est le double du rayon : 2 × ${fmt(rr)} = <b>${cm(2 * rr)}</b>.` : `Le rayon est la moitié du diamètre : ${fmt(2 * rr)} ÷ 2 = <b>${cm(rr)}</b>.` };
    },
  };
}

/* ---------- 9. Cercle ou disque ---------- */
function genDisque() {
  const v = rand(0, 2), r = rand(15, 50) / 10;
  if (v === 0) {
    const c = rand(0, 2); // 0 sur, 1 dedans, 2 dehors
    const d = c === 0 ? r : c === 1 ? round1(r - rand(3, 12) / 10) : round1(r + rand(3, 15) / 10);
    const M = pick(['M', 'P', 'K']);
    const opts = [`${M} est sur le cercle`, `${M} est à l'intérieur du cercle, sans être dessus`, `${M} est à l'extérieur du disque`];
    return withRemed(withHints(mcq(`<p class="statement">On a tracé le cercle de centre O et de rayon ${cm(r)}. Le point ${M} est tel que O${M} = ${cm(d)}. Où est ${M} ?</p>`,
      opts, c, `On compare O${M} = ${cm(d)} au rayon ${cm(r)} : ${c === 0 ? `ils sont égaux, donc ${M} est <b>sur le cercle</b>` : c === 1 ? `O${M} est plus petit, donc ${M} est <b>à l'intérieur</b> (dans le disque)` : `O${M} est plus grand, donc ${M} est <b>à l'extérieur</b>`}.`, { col: true, keepOrder: true }),
    [`Relis la définition du cercle dans ${ficheLink('cercle')} : tous ses points sont à quelle distance du centre ?`, 'Outil : compare la distance au centre et le rayon.']),
    () => (c === 0 ? 'Le cercle est formé de tous les points situés à exactement ' + cm(r) + ' de O.' : 'Compare bien les deux nombres : ' + cm(d) + ' et ' + cm(r) + '.'));
  }
  if (v === 1) {
    const isDisk = Math.random() < 0.5;
    const fig = figure({ O: { x: 0, y: 0 } }, [isDisk ? F2.disk({ x: 0, y: 0 }, 2) : F2.circle({ x: 0, y: 0 }, 2, 'f-circ f-thick')], { extra: [{ x: -2.2, y: -2.2 }, { x: 2.2, y: 2.2 }], pad: 0.4 });
    return withRemed(withHints(mcq(`<p>La figure verte est-elle un cercle ou un disque ?</p>${fig}`, ['Un cercle', 'Un disque'], isDisk ? 1 : 0,
      isDisk ? 'C\'est un <b>disque</b> : la surface intérieure, le « plein ».' : 'C\'est un <b>cercle</b> : le contour, la ligne.', { keepOrder: true }),
    [`Relis « Différence entre cercle et disque » dans ${ficheLink('cercle')}.`, 'Outil : un cercle, c\'est comme un anneau (le contour) ; un disque, c\'est comme une pizza (le plein).']),
    () => (isDisk ? 'Ici, tout l\'intérieur est colorié : ce n\'est pas seulement le contour.' : 'Ici, seule la ligne est tracée : l\'intérieur est vide.'));
  }
  const opts = [`le cercle de centre O et de rayon ${cm(r)}`, `le disque de centre O et de rayon ${cm(r)}`, `le cercle de centre O et de diamètre ${cm(r)}`, `le segment de longueur ${cm(r)}`];
  return withRemed(withHints(mcq(`<p class="statement">Tous les points situés à <b>exactement</b> ${cm(r)} du point O forment…</p>`, opts, 0,
    `Le cercle de centre O est l'ensemble des points situés à la même distance de O : cette distance est son <b>rayon</b>.`, { col: true }),
  [`Relis la définition du cercle dans ${ficheLink('cercle')}.`, 'Outil : avec le compas écarté de ' + cm(r) + ', la mine trace tous les points situés à ' + cm(r) + ' de la pointe.']),
  (i) => (i === 1 ? 'Le disque contient aussi les points situés à moins de ' + cm(r) + ' de O (tout l\'intérieur). Ici, on veut exactement ' + cm(r) + '.' : i === 2 ? 'La distance entre le centre et un point du cercle, c\'est le rayon, pas le diamètre.' : 'Ces points sont tout autour de O, pas alignés.'));
}

/* ---------- 10. Tracer un cercle (planche) ---------- */
function sceneCircle(nO, O, r) {
  const P = { x: O.x + r, y: O.y };
  return {
    pts: [G.add(O, { x: -r, y: -r }), G.add(O, { x: r, y: r })],
    base: [ptSVG(nO, O, G.add(O, { x: 1, y: 1 }))],
    steps: [
      { text: `Écarte le compas de ${cm(r)} sur la règle.`, dur: 1500, draw: (t, final) => (final ? '' : INSTR.ruler(O, P, { x: 0, y: 1 }) + INSTR.compass(O, P)) },
      STEP.fullCircle(O, r, `Pique la pointe sèche sur ${nO} et fais tourner le compas : c'est le cercle de centre ${nO} et de rayon ${cm(r)}.`, 0),
    ],
  };
}
function genTraceCercle() {
  const nO = pick(['O', 'C', 'K']);
  const r = rand(15, 42) / 10, useD = Math.random() < 0.45;
  const O = { x: rand(70, 90) / 10, y: rand(50, 60) / 10 };
  const fit = (c) => G.dist(c.c, O) < 0.08 && Math.abs(c.r - r) <= 0.1;
  return {
    hints: [`Où place-t-on la pointe sèche du compas ? Quel écartement faut-il ?${useD ? ' Attention : l\'énoncé donne le diamètre.' : ''}`,
      useD ? 'Exemple : pour un cercle de diamètre 7 cm, on écarte le compas de 7 ÷ 2 = 3,5 cm (le rayon).' : 'Exemple : pour un cercle de centre P et de rayon 2,5 cm, on pique en P et on écarte le compas de 2,5 cm.',
      'Clique sur « 🎬 Voir un exemple ».'],
    anim: () => sceneCircle(nO, O, r),
    example: () => sceneCircle('P', { x: 0, y: 0 }, 2.5),
    remediate(r2) {
      const cs = r2._board.circles(); if (!cs.length || cs.some(fit)) return null;
      if (cs.some((c) => G.dist(c.c, O) < 0.08 && Math.abs(c.r - 2 * r) <= 0.1)) return useD ? `Tu as pris le diamètre comme écartement. L'écartement du compas, c'est le <b>rayon</b> : la moitié du diamètre.` : 'Ton cercle a pour diamètre ' + cm(2 * r) + ' : c\'est le rayon qui doit mesurer ' + cm(r) + '.';
      if (cs.some((c) => G.dist(c.c, O) < 0.08 && Math.abs(c.r - r / 2) <= 0.1)) return 'Ton écartement est la moitié de ce qu\'il faut : relis l\'énoncé, est-ce le rayon ou le diamètre qui est donné ?';
      if (!cs.some((c) => G.dist(c.c, O) < 0.08)) return `La pointe sèche du compas doit être sur le centre ${nO} : clique d'abord exactement sur ${nO}.`;
      return `Le centre est bon, mais l'écartement n'est pas juste. Utilise les boutons − et + pour l'ajuster au millimètre.`;
    },
    _t: { O, r, useD },
    q: `<p class="statement">Trace le cercle de centre ${nO} et de ${useD ? `<b>diamètre</b> ${cm(2 * r)}` : `<b>rayon</b> ${cm(r)}`}.</p><div class="board"></div>`,
    mount(r2) { r2._board = createBoard(r2.querySelector('.board'), { tool: 'circle', names: [], given: { points: [{ name: nO, ...O }] } }); },
    check(r2) {
      const cs = r2._board.circles(); if (!cs.length) return null;
      const ok = cs.some(fit);
      const c = cs[cs.length - 1];
      return { ok, msg: ok ? `Ton cercle a pour centre ${nO} et pour rayon ${cm(r)}${useD ? ` (diamètre ${cm(2 * r)})` : ''}.` : `${useD ? `Le diamètre est ${cm(2 * r)}, donc le rayon vaut ${fmt(2 * r)} ÷ 2 = ${cm(r)}. ` : ''}On pique la pointe sèche en ${nO} et on écarte le compas de <b>${cm(r)}</b>. (Ton dernier cercle : rayon ${cm(round1(c.r))}.)` };
    },
  };
}

/** Figures de la fiche « Distance et cercle » */
function renderCercleFiche() {
  const box = (id) => document.querySelector(`[data-fig="${id}"]`);
  const set = (id, html) => { if (box(id)) box(id).innerHTML = html; };
  set('n-seg', notationFig('seg', 'A', 'B'));
  set('n-ray', notationFig('ray', 'A', 'B'));
  set('n-rayr', notationFig('rayr', 'A', 'B'));
  set('n-len', notationFig('len', 'A', 'B', '3,5 cm'));
  const A = { x: 1, y: 1 }, I = { x: 5, y: 1 }, B = { x: 9, y: 1 }, u = { x: 1, y: 0 };
  set('milieu', figure({ A, I, B }, [F2.seg(A, B), F2.end(A, u), F2.end(B, u), F2.ticks(A, I), F2.ticks(I, B)], { box: [0, 0, 10, 2], marks: { A: 'none', B: 'none', I: { dash: u } }, center: { x: 5, y: 3 } }));
  if (box('anim-med')) makePlayer(box('anim-med'), sceneMediatrice6(['A', 'B'], { x: 0, y: 0 }, { x: 6, y: 0 }, ['E', 'F']), { atEnd: true });
  const S = { O: { x: 0, y: 0 }, R: 2.4 };
  const at = (deg) => ({ x: 2.4 * Math.cos((deg * Math.PI) / 180), y: -2.4 * Math.sin((deg * Math.PI) / 180) });
  Object.assign(S, { A: at(180), B: at(130), C: at(-50), D: at(80), E: at(-20) });
  set('voc', figure({ O: S.O, A: S.A, B: S.B, C: S.C, D: S.D, E: S.E }, [F2.circle(S.O, 2.4, 'f-circ'), F2.seg(S.O, S.A, 'f-blue'), F2.seg(S.B, S.C, 'f-red'), F2.seg(S.D, S.E, 'f-orange'), F2.arcPts(S.O, 2.4, S.D, S.E, 'f-hlarc'),
    F2.text({ x: -1.25, y: 0.35 }, 'rayon', 'f-len f-blue-t'), F2.text({ x: -0.5, y: -1.05 }, 'diamètre', 'f-len f-red-t'), F2.text({ x: 0.9, y: -0.25 }, 'corde', 'f-len f-orange-t'), F2.text({ x: 3.15, y: -1.7 }, 'arc', 'f-len f-green-t')],
  { marks: { O: 'x', A: 'none', B: 'none', C: 'none', D: 'none', E: 'none' }, center: S.O, extra: [{ x: -2.8, y: -2.8 }, { x: 3.6, y: 2.8 }] }));
  set('cercle', figure({}, [F2.circle({ x: 0, y: 0 }, 2, 'f-circ f-thick')], { labels: false, extra: [{ x: -2.3, y: -2.3 }, { x: 2.3, y: 2.3 }], pad: 0 }));
  set('disque', figure({}, [F2.disk({ x: 0, y: 0 }, 2)], { labels: false, extra: [{ x: -2.3, y: -2.3 }, { x: 2.3, y: 2.3 }], pad: 0 }));
}
/* =========================================================
   CHAPITRE 4 — NOMBRES DÉCIMAUX (PARTIE 2)
   demi-droite graduée, comparer, ranger, intercaler, encadrer, arrondir
   ========================================================= */

/** Demi-droite graduée. Les valeurs sont des entiers en unités de 10^-k :
    graduation i ↔ (a + i·s) / 10^k. Une graduation est étiquetée si sa valeur est un multiple de s·every. */
function drawHalfLine({ a, s = 1, k = 0, n, every = 10, labelAll = false, points = [], clickable = false, small = false, origin = false }) {
  const W = 720, H = 124, m = 36, y = 60, x1 = W - m - 26;
  const sc = (x1 - m) / n, X = (i) => m + i * sc;
  const v = (i) => (a + i * s) / 10 ** k;
  const lab = (i) => labelAll || i === 0 || (a + i * s) % (s * every) === 0;
  let out = `<svg class="nl-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Demi-droite graduée">`;
  out += `<line x1="${X(0) - (origin ? 0 : 14)}" y1="${y}" x2="${W - m + 6}" y2="${y}" class="axis"/>`;
  out += `<path d="M${W - m + 12} ${y} l-11 -6.5 v13 z" class="arrow"/>`;
  for (let i = 0; i <= n; i++) {
    const x = X(i).toFixed(1), major = lab(i) && !labelAll ? true : (a + i * s) % (s * every) === 0;
    out += `<line x1="${x}" y1="${y - (major ? 15 : 9)}" x2="${x}" y2="${y + (major ? 15 : 9)}" class="tk${major ? ' major' : ''}"/>`;
    if (lab(i)) out += `<text x="${x}" y="${y + 42}" class="lbl${small ? ' sm' : ''}">${fmt(v(i))}</text>`;
    if (clickable) {
      out += `<circle cx="${x}" cy="${y}" r="10" class="mark" data-i="${i}"/>`;
      out += `<rect x="${(X(i) - sc / 2).toFixed(1)}" y="${y - 40}" width="${sc.toFixed(1)}" height="80" class="hit" data-i="${i}"/>`;
    }
  }
  if (origin) out += `<text x="${X(0)}" y="${y - 26}" class="pt-lbl muted-lbl">origine</text>`;
  points.forEach((p) => {
    const x = X(p.i).toFixed(1);
    out += `<path d="M${x - 7} ${y - 7} L${+x + 7} ${y + 7} M${x - 7} ${y + 7} L${+x + 7} ${y - 7}" class="pt-x"/><text x="${x}" y="${y - 22}" class="pt-lbl">${p.label}</text>`;
  });
  return out + '</svg>';
}
/** Surligne l'intervalle entre deux étiquettes et numérote ses parts (outil d'indice) */
function intervalOverlay(r, cfg, j0, j1) {
  const svg = r.querySelector('.nl-svg'); if (!svg) return;
  const W = 720, m = 36, y = 60, x1 = W - m - 26, sc = (x1 - m) / cfg.n, X = (i) => m + i * sc;
  let o = `<rect x="${X(j0)}" y="${y - 22}" width="${X(j1) - X(j0)}" height="44" class="u-zone"/>`;
  for (let q = 1; q <= j1 - j0; q++) o += `<text x="${X(j0 + q - 0.5)}" y="${y - 26}" class="u-num">${q}</text>`;
  svg.insertAdjacentHTML('beforeend', o);
}

const HL_CFG = {
  half: () => ({ k: 0, s: 1, every: 1, n: 7, a: rand(10, 60), half: true, stepTxt: '1' }),
  dix: () => ({ k: 1, s: 1, every: 10, n: 16, a: rand(1, 60) * 10 + rand(3, 7), stepTxt: '0,1' }),
  cent: () => ({ k: 2, s: 1, every: 10, n: 16, a: rand(10, 600) * 10 + rand(3, 7), stepTxt: '0,01' }),
  diz: () => ({ k: 0, s: 10, every: 10, n: 16, a: rand(1, 40) * 100 + rand(3, 7) * 10, stepTxt: '10' }),
};
const hlVal = (c, i) => (c.a + i * c.s) / 10 ** c.k;
const hlLab = (c, i) => i === 0 || (c.a + i * c.s) % (c.s * c.every) === 0;
const prevLab = (c, i) => { let j = Math.floor(i); while (j > 0 && !hlLab(c, j)) j--; return j; };
const nextLab = (c, i) => { let j = Math.ceil(i + 1e-9); while (j < c.n && !hlLab(c, j)) j++; return j; };
/** graduation non étiquetée, située ENTRE deux nombres écrits (jamais après le dernier) */
function pickTickHL(c) {
  const opts = [];
  for (let i = 1; i < c.n; i++) if (!hlLab(c, i) && hlLab(c, nextLab(c, i))) opts.push(i);
  return pick(opts);
}

/* ---------- 1. Lire une abscisse ---------- */
function genLireHL(hard = false) {
  // ★ : graduations de 0,01
  const type = hard ? 'cent' : pick(['half', 'dix', 'dix', 'cent', 'diz']);
  const c = HL_CFG[type]();
  const i = c.half ? rand(0, c.n - 1) + 0.5 : pickTickHL(c);
  const x = c.half ? hlVal(c, Math.floor(i)) + 0.5 : hlVal(c, i);
  const j0 = c.half ? Math.floor(i) : prevLab(c, i), j1 = c.half ? Math.ceil(i) : nextLab(c, i);
  const step = c.s / 10 ** c.k, P = pick(['A', 'B', 'M', 'E']);
  const ex = type === 'dix' ? 'Exemple : entre 7 et 8, il y a 10 graduations, donc chacune vaut 0,1. Le point situé 3 graduations après 7 a pour abscisse 7,3.'
    : type === 'cent' ? 'Exemple : entre 2,4 et 2,5, il y a 10 graduations, donc chacune vaut 0,01. Le point situé 6 graduations après 2,4 a pour abscisse 2,46.'
      : type === 'diz' ? 'Exemple : entre 300 et 400, il y a 10 graduations, donc chacune vaut 10. Le point situé 4 graduations après 300 a pour abscisse 340.'
        : 'Exemple (fiche) : B est situé au milieu entre 14 et 15, donc son abscisse est 14,5.';
  return {
    _forme: type,
    hints: [
      `Regarde deux nombres écrits sous la demi-droite. Combien de graduations y a-t-il entre eux ? Combien vaut alors <b>une</b> graduation ? Relis la Méthode 1 dans ${ficheLink('decimaux2')}.`,
      ex,
      { html: 'Outil : sur la demi-droite, l\'intervalle où se trouve le point est colorié et ses parts sont numérotées.', act: (r) => intervalOverlay(r, c, j0, j1) },
    ],
    remediate(r) {
      const v = val(r); if (!v || eq(v.value, x)) return null;
      const vj = hlVal(c, j0), d = i - j0;
      if (c.half && Number.isInteger(v.value)) return 'Le point n\'est pas sur une graduation : il est exactement <b>au milieu</b> entre deux nombres.';
      if (!c.half && step !== 1 && eq(v.value, vj + d)) return `Tu as compté chaque graduation comme 1 unité. Mais ici, entre ${fmt(vj)} et ${fmt(hlVal(c, j1))}, il y a ${j1 - j0} graduations : une graduation vaut ${c.stepTxt}.`;
      if (!c.half && (eq(v.value, vj + d * step * 10) || eq(v.value, vj + d * step / 10))) return `Vérifie la valeur d'<b>une</b> graduation : ici, elle vaut ${c.stepTxt}.`;
      if (!c.half && (eq(v.value, x + step) || eq(v.value, x - step))) return 'Tu es à une graduation près : recompte bien à partir du nombre écrit juste avant le point.';
      if (!c.half && eq(v.value, d * step)) return `La demi-droite ne commence pas à 0 : pars du nombre écrit ${fmt(vj)}.`;
      return null;
    },
    q: `<p>Quelle est l'abscisse du point <b>${P}</b> ?</p><div class="nl">${drawHalfLine({ ...c, points: [{ i, label: P }] })}</div><p class="big">${P}( ${inp('num', 'Abscisse')} )</p>`,
    check(r) {
      const v = val(r); if (!v) return null;
      const ok = eq(v.value, x); markInput(r, 0, ok);
      if (c.half) return { ok, msg: `${P} est au milieu entre ${fmt(hlVal(c, j0))} et ${fmt(hlVal(c, j1))}, donc ${P}(<b>${fmt(x)}</b>).` };
      return { ok, msg: `Entre ${fmt(hlVal(c, j0))} et ${fmt(hlVal(c, j1))}, il y a ${j1 - j0} graduations : chacune vaut ${c.stepTxt}. ${P} est à ${i - j0} graduation${i - j0 > 1 ? 's' : ''} après ${fmt(hlVal(c, j0))}, donc ${P}(<b>${fmt(x)}</b>).` };
    },
  };
}

/* ---------- 2. Placer un point ---------- */
function genPlacerHL(hard = false) {
  // ★ : le nombre est donné sous forme de fraction décimale (ou entier + fraction)
  const type = hard ? pick(['dix', 'cent']) : pick(['dix', 'dix', 'cent', 'diz']);
  const c = HL_CFG[type]();
  const i = pickTickHL(c), x = hlVal(c, i), units = c.a + i * c.s;
  let disp = fmt(x);
  const r = hard ? (type === 'dix' ? pick([0.1, 0.4]) : 0.1) : Math.random();
  if (type === 'dix' && r < 0.3) disp = `${fmt(Math.floor(x))} + ${F(units % 10, 10)}`;
  else if (type === 'dix' && r < 0.55) disp = F(units, 10);
  else if (type === 'cent' && r < 0.35) disp = F(units, 100);
  const P = pick(['D', 'E', 'K', 'R']);
  const j0 = prevLab(c, i), j1 = nextLab(c, i);
  const isFr = disp !== fmt(x);
  return {
    _forme: type + (isFr ? '-fraction' : ''),
    hints: [
      `${isFr ? `Écris d'abord ${disp} en écriture décimale. ` : ''}Puis cherche les deux nombres écrits qui l'entourent : combien vaut une graduation ?`,
      type === 'diz' ? 'Exemple : pour placer 360 entre 300 et 400 (10 graduations de 10), on compte 6 graduations après 300.' : `Exemple (fiche) : B(41 + ${F(9, 10)}) : 41 + ${F(9, 10)} = 41,9 ; C(${F(433, 10)}) : ${F(433, 10)} = 43,3.`,
      { html: 'Outil : l\'intervalle utile est colorié sur la demi-droite et ses parts sont numérotées.', act: (r2) => intervalOverlay(r2, c, j0, j1) },
    ],
    remediate(r2) {
      const nl = r2.querySelector('.nl'); if (nl.dataset.sel === undefined) return null;
      const sel = Number(nl.dataset.sel); if (sel === i) return null;
      if (Math.abs(sel - i) === 1) return 'Tu es à une graduation près : recompte à partir du nombre écrit le plus proche.';
      return `Une graduation vaut ${c.stepTxt}. ${fmt(x)} est entre ${fmt(hlVal(c, j0))} et ${fmt(hlVal(c, j1))}.`;
    },
    q: `<p>Place le point <b>${P}(${disp})</b> : clique sur la bonne graduation.</p><div class="nl">${drawHalfLine({ ...c, clickable: true })}</div>`,
    mount(r2) {
      const nl = r2.querySelector('.nl');
      nl.querySelectorAll('.hit').forEach((h) => h.addEventListener('click', () => {
        nl.dataset.sel = h.dataset.i;
        nl.querySelectorAll('.mark').forEach((m) => m.classList.toggle('on', m.dataset.i === h.dataset.i));
      }));
    },
    check(r2) {
      const nl = r2.querySelector('.nl');
      if (nl.dataset.sel === undefined) return null;
      const ok = Number(nl.dataset.sel) === i;
      nl.querySelector(`.mark[data-i="${i}"]`)?.classList.add('good');
      return { ok, msg: `${isFr ? `${disp} = ${fmt(x)}. ` : ''}Une graduation vaut ${c.stepTxt} : ${P} est à ${i - j0} graduation${i - j0 > 1 ? 's' : ''} après ${fmt(hlVal(c, j0))}${ok ? '.' : ' (point vert).'}` };
    },
  };
}

/* ---------- Outils de comparaison ---------- */
/** nombre décimal {I, d} (d : chaîne des décimales) */
const D = (I, d = '') => ({ I, d, v: Number(`${I}.${d || 0}`), s: groupInt(String(I)) + (d ? ',' + d : '') });
/** comparaison « naïve » : parties décimales comparées comme des entiers (erreur classique) */
function naiveCmp(x, y) {
  if (x.I !== y.I) return x.I < y.I ? -1 : 1;
  const a = Number(x.d || 0), b = Number(y.d || 0);
  return a === b ? 0 : a < b ? -1 : 1;
}
const realCmp = (x, y) => (eq(x.v, y.v) ? 0 : x.v < y.v ? -1 : 1);
const SIGN = { '-1': '<', 0: '=', 1: '>' };
const padZeros = (list) => { const L = Math.max(...list.map((x) => (x.d || '').length)); return list.map((x) => groupInt(String(x.I)) + (L ? ',' + (x.d || '').padEnd(L, '0') : '')); };
const nz = () => String(rand(1, 9));

/* ---------- 3. Comparer ---------- */
function genComparer(hard = false) {
  // ★ : seulement des cas « piège » (nombres de décimales différents, zéro après la virgule)
  const t = hard ? pick(['long', 'zero', 'eqz']) : pick(['long', 'long', 'zero', 'eqz', 'int', 'same']);
  const I = rand(1, 60);
  let x, y;
  if (t === 'long') { const a = rand(2, 9); let b; do { b = rand(10, a * 10 - 1); } while (b % 10 === 0 || b <= a); x = D(I, String(b).padStart(2, '0')); y = D(I, String(a)); }
  else if (t === 'zero') { const a = nz(); x = D(I, '0' + a); y = D(I, a); }
  else if (t === 'eqz') { const a = nz(); x = D(I, a); y = D(I, a + '0'.repeat(rand(1, 2))); }
  else if (t === 'int') { x = D(I, nz() + nz() + nz()); y = D(I + 1, nz()); }
  else { const a = rand(11, 98); let b; do { b = rand(11, 98); } while (b === a); x = D(I, String(a)); y = D(I, String(b)); }
  if (Math.random() < 0.5) [x, y] = [y, x];
  const c = realCmp(x, y), nv = naiveCmp(x, y);
  const opts = ['<', '=', '>'], correct = c + 1;
  const [px, py] = padZeros([x, y]);
  const expl = x.I !== y.I ? `Les parties entières sont différentes : ${x.I} ${SIGN[x.I < y.I ? -1 : 1]} ${y.I}, donc <b>${x.s} ${SIGN[c]} ${y.s}</b>.`
    : `Les parties entières sont égales (${x.I}). On écrit les deux nombres avec autant de chiffres après la virgule : ${px} et ${py}. Donc <b>${x.s} ${SIGN[c]} ${y.s}</b>.`;
  const cmpQ = withRemed(withHints(mcq(`<p>Complète avec &lt;, &gt; ou =.</p><p class="big">${x.s} … ${y.s}</p>`, opts, correct, expl, { keepOrder: true, cls: 'signs' }),
    [`Compare d'abord les parties entières. Si elles sont égales, que faut-il faire ? Relis la Méthode 3 dans ${ficheLink('decimaux2')}.`,
      'Exemple (fiche) : 14,52 et 14,6. Parties entières égales. On ajoute un zéro inutile : 14,6 = 14,60. Comme 52 &lt; 60, 14,52 &lt; 14,6.',
      `Outil — les deux nombres avec le même nombre de décimales :<p class="big">${px} … ${py}</p>`]),
  (i) => {
    const ch = i - 1;
    if (ch === nv && nv !== c) {
      if (t === 'eqz') return `${x.s} et ${y.s} : un zéro à la fin de la partie décimale est un zéro <b>inutile</b>. Ces deux nombres sont-ils différents ?`;
      if (t === 'zero') return `Attention : ${x.s} et ${y.s} n'ont pas le même chiffre des dixièmes ! Écris-les avec autant de décimales pour comparer.`;
      return 'Tu as comparé les parties décimales comme des nombres entiers. Mais un nombre avec plus de chiffres n\'est pas forcément plus grand : ajoute des zéros inutiles pour avoir autant de décimales.';
    }
    if (ch === -c && c !== 0) return 'Attention au sens du signe : la pointe est du côté du plus <b>petit</b> nombre (&lt; se lit « est inférieur à »).';
    return 'Compare d\'abord les parties entières, puis les chiffres des dixièmes, des centièmes…';
  });
  cmpQ._forme = t;
  return cmpQ;
}

/* ---------- 4. Ranger ---------- */
function genRanger(hard = false) {
  const I = rand(2, 40);
  const pool = [D(I, nz()), D(I, nz() + nz()), D(I, '0' + nz()), D(I + 1, ''), D(I, nz() + nz() + nz()), D(I - 1, nz() + nz())];
  let list;
  for (let t = 0; t < 50; t++) {
    list = shuffle([...pool]).slice(0, hard ? 6 : rand(4, 5)); // ★ : les 6 nombres
    const vs = list.map((x) => x.v);
    if (new Set(vs.map((v) => v.toFixed(6))).size === vs.length && list.filter((x) => x.I === I).length >= 3) break;
  }
  const up = Math.random() < 0.5;
  const sorted = [...list.keys()].sort((p, q) => (up ? 1 : -1) * (list[p].v - list[q].v));
  const naive = [...list.keys()].sort((p, q) => (up ? 1 : -1) * naiveCmp(list[p], list[q]) || 0);
  const rev = [...sorted].reverse();
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const sym = up ? '&lt;' : '&gt;';
  const res = sorted.map((i) => list[i].s).join(` ${sym} `);
  return {
    hints: [
      `${up ? 'Croissant : du plus petit au plus grand' : 'Décroissant : du plus grand au plus petit'}. Commence par comparer les parties entières. Relis la Méthode 4 dans ${ficheLink('decimaux2')}.`,
      up ? 'Exemple (fiche) : 6 ; 5,42 ; 5,7 ; 4,8 → 4,8 &lt; 5,42 &lt; 5,7 &lt; 6.' : 'Exemple (fiche) : 12,4 ; 11,8 ; 13 ; 11,75 → 13 &gt; 12,4 &gt; 11,8 &gt; 11,75.',
      `Outil — les mêmes nombres, avec autant de décimales :<p class="big">${padZeros(list).join(' ; ')}</p>`,
    ],
    remediate(r) {
      const o = orderPicker(r); if (o.length < list.length || same(o, sorted)) return null;
      if (same(o, rev)) return `Ton rangement est à l'envers : ${up ? '« croissant », c\'est du plus <b>petit</b> au plus grand' : '« décroissant », c\'est du plus <b>grand</b> au plus petit'}.`;
      if (same(o, naive)) return 'Tu as comparé les parties décimales comme des nombres entiers. Ajoute des zéros inutiles pour que tous les nombres aient autant de décimales.';
      return null;
    },
    q: `<p>Range ces nombres dans l'ordre <b>${up ? 'croissant' : 'décroissant'}</b> : clique-les dans l'ordre.</p>
      <div class="ord">${list.map((x, i) => `<button type="button" class="ordbtn" data-i="${i}" data-txt="${x.s}"><span class="rk"></span>${x.s}</button>`).join('')}</div>
      <p class="ord-out big"></p><button type="button" class="mini ord-reset">Effacer mon rangement</button>`,
    mount(r) { r.dataset.sym = up ? '<' : '>'; r.dataset.order = ''; mountOrder(r); },
    check(r) {
      const o = orderPicker(r); if (o.length < list.length) return null;
      const ok = same(o, sorted);
      return { ok, msg: `Ordre ${up ? 'croissant' : 'décroissant'} : <b>${res}</b>.` };
    },
  };
}

/* ---------- 5. Intercaler ---------- */
function genIntercaler(hard = false) {
  const t = hard ? pick(['cent', 'mixed', 'border']) : pick(['cent', 'dix', 'int', 'mixed', 'border']);
  const I = rand(1, 40);
  let a, b;
  if (t === 'cent') { const n = rand(10, 98); a = D(I, String(n)); b = D(I, String(n + 1)); if (n % 10 === 9) b = D(I, String(n + 1)); }
  else if (t === 'dix') { const n = rand(1, 8); a = D(I, String(n)); b = D(I, String(n + 1)); }
  else if (t === 'int') { a = D(I); b = D(I + 1); }
  else if (t === 'mixed') { const n = nz(); a = D(I, n); b = D(I, n + '1'); }
  else { a = D(I, '99'); b = D(I + 1); }
  if (b.d && /0$/.test(b.d)) b = D(b.I, b.d.replace(/0+$/, ''));
  const [pa, pb] = padZeros([a, b]);
  return {
    _forme: t,
    hints: [
      `Y a-t-il vraiment un nombre entre ${a.s} et ${b.s} ? Relis la Méthode 5 dans ${ficheLink('decimaux2')}.`,
      'Exemple (fiche) : entre 7,83 et 7,84, on écrit 7,830 et 7,840. On peut choisir 7,835 : 7,83 &lt; 7,835 &lt; 7,84.',
      `Outil — ajoute un zéro inutile à chaque nombre : ${pa}0 et ${pb}0. Quels nombres sont entre les deux ?`,
    ],
    remediate(r) {
      const v = val(r); if (!v || (v.value > a.v + 1e-9 && v.value < b.v - 1e-9)) return null;
      if (eq(v.value, a.v) || eq(v.value, b.v)) return `Ton nombre est égal à l'un des deux. Il doit être <b>strictement</b> entre ${a.s} et ${b.s}.`;
      return `Ton nombre n'est pas entre ${a.s} et ${b.s}. Compare-le à chacun des deux. Astuce : ajoute des zéros inutiles (${pa}0 et ${pb}0).`;
    },
    q: `<p>Écris un nombre décimal compris <b>entre</b> ${a.s} et ${b.s}.</p><p class="big">${a.s} &lt; ${inp('num', 'Nombre intercalé')} &lt; ${b.s}</p>`,
    check(r) {
      const v = val(r); if (!v) return null;
      if (v.isFrac) return { retry: true, msg: 'Écris un nombre décimal, avec une virgule.' };
      const ok = v.value > a.v + 1e-9 && v.value < b.v - 1e-9; markInput(r, 0, ok);
      const ex = fmt(Math.round(((a.v + b.v) / 2) * 1e6) / 1e6);
      return { ok, msg: `${ok ? `${a.s} &lt; ${fmt(v.value)} &lt; ${b.s} : c'est juste ! ` : ''}On peut écrire ${pa}0 et ${pb}0 : par exemple <b>${a.s} &lt; ${ex} &lt; ${b.s}</b>. Il existe une infinité de réponses.` };
    },
  };
}

/* ---------- 6. Encadrer ---------- */
function genEncadrer(hard = false) {
  // ★ : encadrement au dixième d'un nombre dont le chiffre des dixièmes est 9 (4,96 → 4,9 < 4,96 < 5)
  const unit = hard ? false : Math.random() < 0.5;
  let m, x, lo, hi, k;
  if (unit) { k = pick([1, 2]); do { m = rand(10, 999) * (k === 1 ? 1 : 1) + rand(0, 9); } while (m % 10 ** k === 0); x = m / 10 ** k; lo = Math.floor(x); hi = lo + 1; }
  else { k = 2; do { m = rand(100, 9999); } while (m % 10 === 0 || (hard && Math.floor(m / 10) % 10 !== 9)); x = m / 100; lo = Math.floor(m / 10) / 10; hi = round1(lo + 0.1); }
  const prec = unit ? 'deux nombres entiers consécutifs' : 'deux nombres qui ont un seul chiffre après la virgule (au dixième)';
  return {
    hints: [
      unit ? `Quelle est la partie entière de ${fmt(x)} ? Quel est l'entier suivant ? Relis la Méthode 6 dans ${ficheLink('decimaux2')}.` : `Garde la partie entière et le chiffre des dixièmes de ${fmt(x)}. Quel est le dixième suivant ? Relis la Méthode 6 dans ${ficheLink('decimaux2')}.`,
      unit ? 'Exemple (fiche) : 56 &lt; 56,7 &lt; 57 (encadrement à l\'unité).' : 'Exemple (fiche) : 56,7 &lt; 56,73 &lt; 56,8 (encadrement au dixième).',
      unit ? '« Consécutifs » veut dire « qui se suivent » : par exemple 56 et 57.' : 'Au dixième, les deux nombres se suivent de 0,1 en 0,1 : par exemple 56,7 et 56,8.',
    ],
    remediate(r) {
      const a = val(r, 0), b = val(r, 1); if (!a || !b) return null;
      if (eq(a.value, lo) && eq(b.value, hi)) return null;
      if (eq(a.value, hi) && eq(b.value, lo)) return 'Le plus petit nombre se met à gauche : « … &lt; nombre &lt; … ».';
      if (!unit && eq(a.value, Math.floor(x)) && eq(b.value, Math.floor(x) + 1)) return 'C\'est un encadrement à l\'unité. On demande un encadrement <b>au dixième</b> : un chiffre après la virgule.';
      if (a.value < x && b.value > x) return `Tes nombres encadrent bien ${fmt(x)}, mais ils ne se suivent pas : il faut ${prec}.`;
      return `Vérifie : ton premier nombre doit être plus petit que ${fmt(x)}, et le second plus grand.`;
    },
    q: `<p>Encadre <b>${fmt(x)}</b> par ${prec}.</p><p class="big">${inp('num', 'Borne inférieure')} &lt; ${fmt(x)} &lt; ${inp('num', 'Borne supérieure')}</p>`,
    check(r) {
      const a = val(r, 0), b = val(r, 1); if (!a || !b) return null;
      const ok1 = eq(a.value, lo), ok2 = eq(b.value, hi);
      markInput(r, 0, ok1); markInput(r, 1, ok2);
      return { ok: ok1 && ok2, msg: `<b>${fmt(lo)} &lt; ${fmt(x)} &lt; ${fmt(hi)}</b> : ce sont ${unit ? 'deux entiers consécutifs' : 'deux dixièmes consécutifs'}.` };
    },
  };
}

/* ---------- 7. Arrondir ---------- */
const PREC = ['à l\'unité', 'au dixième', 'au centième'];
const PRECR = ['unités', 'dixièmes', 'centièmes'];
/** affichage « règle du chiffre suivant » : chiffre du rang encadré, chiffre suivant coloré */
function arrDemo(m, k, p) {
  const s = decStr(m, k, false), comma = s.indexOf(',');
  const idxRank = p === 0 ? comma - 1 : comma + p, idxNext = idxRank === comma - 1 ? comma + 1 : idxRank + 1;
  return `<span class="arr">${[...s].map((ch, i) => (i === idxRank ? `<b class="arr-rk">${ch}</b>` : i === idxNext ? `<b class="arr-nx">${ch}</b>` : ch)).join('')}</span>`;
}
function genArrondir(hard = false) {
  const k = pick([2, 3, 3]), p = rand(0, k - 1);
  // ★ : la retenue se propage (chiffre du rang = 9 et chiffre suivant ≥ 5 : 3,96 → 4,0)
  const carry = (mm) => Math.floor(mm / 10 ** (k - p)) % 10 === 9 && Math.floor(mm / 10 ** (k - p - 1)) % 10 >= 5;
  let m, t = 0; do { m = rand(10 ** (k + 0), 10 ** (k + 2) * 9); t++; } while (m % 10 === 0 || (hard && !carry(m) && t < 2000));
  const x = m / 10 ** k;
  const q = Math.floor(m / 10 ** (k - p)), next = Math.floor(m / 10 ** (k - p - 1)) % 10;
  const res = (q + (next >= 5 ? 1 : 0)) / 10 ** p, trunc = q / 10 ** p, up = (q + 1) / 10 ** p;
  const roundAt = (pp) => { const qq = Math.floor(m / 10 ** (k - pp)), nn = Math.floor(m / 10 ** (k - pp - 1)) % 10; return (qq + (nn >= 5 ? 1 : 0)) / 10 ** pp; };
  const nxRank = p === 0 ? 'dixièmes' : p === 1 ? 'centièmes' : 'millièmes';
  return {
    hints: [
      `Repère le chiffre des ${PRECR[p]}, puis regarde le chiffre juste après (celui des ${nxRank}). Relis « La règle du chiffre suivant » dans ${ficheLink('decimaux2')}.`,
      'Exemple (fiche) : arrondi au centième de 12,848. On regarde le chiffre des millièmes : 8, c\'est 5 ou plus, donc on ajoute 1 au chiffre des centièmes : 12,85.',
      `Outil — le chiffre du rang est encadré, le chiffre suivant est en orange : ${arrDemo(m, k, p)}<br>0, 1, 2, 3, 4 → le chiffre du rang ne change pas ; 5, 6, 7, 8, 9 → on lui ajoute 1.`,
    ],
    remediate(r) {
      const v = val(r); if (!v || eq(v.value, res)) return null;
      if (next >= 5 && eq(v.value, trunc)) return `Tu as simplement coupé le nombre. Mais le chiffre suivant est ${next} : c'est 5 ou plus, donc il faut <b>ajouter 1</b> au chiffre des ${PRECR[p]}.`;
      if (next < 5 && eq(v.value, up)) return `Le chiffre suivant est ${next} : c'est moins que 5, donc le chiffre des ${PRECR[p]} <b>ne change pas</b>.`;
      if ([0, 1, 2].some((pp) => pp !== p && pp < k && eq(v.value, roundAt(pp)))) return `Tu as arrondi au mauvais rang. On demande l'arrondi <b>${PREC[p]}</b>.`;
      return null;
    },
    q: `<p>Donne l'arrondi <b>${PREC[p]}</b> de <b>${fmt(x)}</b>.</p><p class="big">${inp('num', 'Arrondi')}</p>`,
    check(r) {
      const v = val(r); if (!v) return null;
      const ok = eq(v.value, res); markInput(r, 0, ok);
      return { ok, msg: `${arrDemo(m, k, p)} : le chiffre suivant est ${next}, ${next >= 5 ? 'donc on ajoute 1' : 'donc le chiffre ne change pas'}. L'arrondi ${PREC[p]} de ${fmt(x)} est <b>${fmt(res)}</b> (${fmt(trunc)} &lt; ${fmt(x)} &lt; ${fmt(up)}, et ${fmt(res)} est le plus proche).` };
    },
  };
}

/** Figures de la fiche */
function renderDec2Fiche() {
  const box = (id) => document.getElementById(id);
  const set = (id, html) => { if (box(id)) box(id).innerHTML = html; };
  set('hl-intro', drawHalfLine({ a: 0, s: 1, k: 0, n: 7, every: 1, origin: true, points: [{ i: 4, label: 'A' }] }));
  set('hl-m1a', drawHalfLine({ a: 12, s: 1, k: 0, n: 6, every: 1, points: [{ i: 1, label: 'A' }, { i: 2.5, label: 'B' }] }));
  set('hl-m1b', drawHalfLine({ a: 12, s: 1, k: 0, n: 6, every: 1, points: [{ i: 1, label: 'A' }, { i: 2.5, label: 'B' }, { i: 3, label: 'D' }, { i: 5.5, label: 'E' }] }));
  set('hl-m2', drawHalfLine({ a: 415, s: 1, k: 1, n: 19, every: 5, points: [{ i: 4, label: 'B' }, { i: 13, label: 'A' }, { i: 18, label: 'C' }] }));
  set('hl-enc1', drawHalfLine({ a: 51, s: 1, k: 0, n: 10, every: 1, points: [{ i: 5.7, label: '56,7' }] }));
  set('hl-enc2', drawHalfLine({ a: 561, s: 1, k: 1, n: 10, every: 10, labelAll: true, small: true, points: [{ i: 6.3, label: '56,73' }] }));
  document.querySelectorAll('[data-arr]').forEach((el) => { const [m, k, p] = el.dataset.arr.split(',').map(Number); el.innerHTML = arrDemo(m, k, p); });
}
/* =========================================================
   LECTURE À VOIX HAUTE
   ========================================================= */
const CAN_SPEAK = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
const FRAC_NAMES = { 2: ['demi', 'demis'], 3: ['tiers', 'tiers'], 4: ['quart', 'quarts'], 10: ['dixième', 'dixièmes'], 100: ['centième', 'centièmes'], 1000: ['millième', 'millièmes'] };
function fracWords(a, b) {
  const A = a.replace(/\s/g, ''), B = b.replace(/\s/g, '');
  if (/^\d+$/.test(A) && /^\d+$/.test(B)) {
    const N = Number(A), Dn = Number(B);
    if (FRAC_NAMES[Dn]) return `${N === 1 ? 'un' : N} ${FRAC_NAMES[Dn][N > 1 ? 1 : 0]}`;
    return `${N} sur ${Dn}`;
  }
  return `${a} sur ${b}`;
}
function mathWords(s) {
  s = s
    .replace(/\[([A-Z])([A-Z])\)/g, ' la demi-droite d\'origine $1 passant par $2 ')
    .replace(/\[([A-Z])([A-Z])\]/g, ' le segment $1 $2 ')
    .replace(/\(d([′']?)(₁|₂|1|2)?\)/g, (m, p, k) => ` la droite d${k ? ' ' + ({ '₁': 1, '₂': 2 }[k] || k) : ''}${p ? ' prime' : ''} `)
    .replace(/\(h\)/g, ' la droite h ')
    .replace(/\(([A-Z])([A-Z])\)/g, ' la droite $1 $2 ')
    .replace(/\b([A-Z])\(\s*([\d,\s]+)\s*\)/g, ' $1 d\'abscisse $2 ')
    .replace(/\b([A-Z])([A-Z])\b/g, '$1 $2')
    .replace(/(\d)[\s  ](?=\d{3}(?!\d))/g, '$1')
    .replace(/(\d)[\s  ](?=\d{3}(?!\d))/g, '$1')
    .replace(/(\d)\s*cm\b/g, '$1 centimètres')
    .replace(/°/g, ' degrés')
    .replace(/×/g, ' fois ').replace(/÷/g, ' divisé par ')
    .replace(/∉/g, ' n\'appartient pas à ').replace(/∈/g, ' appartient à ')
    .replace(/\/\//g, ' est parallèle à ').replace(/⊥/g, ' est perpendiculaire à ')
    .replace(/(\d)\s*\/\s*(\d)/g, '$1 sur $2');
  return s
    .replace(/[()]/g, ' ')
    .replace(/−/g, ' moins ').replace(/\+/g, ' plus ').replace(/=/g, ' égale ')
    .replace(/</g, ' est inférieur à ').replace(/>/g, ' est supérieur à ')
    .replace(/[✔✘←→✨💡🎬🔊▶⏮◀⏸↶✕✋📏◯⟷↗∥●…]/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1').replace(/\s+/g, ' ').trim();
}
function speechText(node) {
  const c = node.cloneNode(true);
  c.querySelectorAll('svg, .ex-bar, .geo-tools, .geo-names, .geo-status, .geo-wrap, .pl-bar, button:not(.ordbtn):not(.zbtn), .ex-actions, .table-wrap').forEach((e) => e.remove());
  c.querySelectorAll('.frac').forEach((f) => { const [a, b] = f.children; f.replaceWith(` ${fracWords(a.textContent.trim(), b.textContent.trim())} `); });
  c.querySelectorAll('u.ul').forEach((u) => u.replaceWith(` ${u.textContent}, le chiffre souligné, `));
  c.querySelectorAll('input.ans').forEach((i) => i.replaceWith(' combien ? '));
  c.querySelectorAll('input').forEach((i) => i.remove());
  c.querySelectorAll('.choice').forEach((ch, i) => { ch.prepend(` Réponse ${i + 1} : `); ch.append('. '); });
  c.querySelectorAll('p, li, h1, h2, h3, .statement, .rule, .example, .tip, .warnbox, .hint, td, th, .memo > div').forEach((e) => e.append('. '));
  c.querySelectorAll('br').forEach((e) => e.replaceWith('. '));
  return mathWords(c.textContent.replace(/\.\s*\./g, '.'));
}
let speakingBtn = null;
function stopSpeaking() {
  if (!CAN_SPEAK) return;
  window.speechSynthesis.cancel();
  if (speakingBtn) { speakingBtn.classList.remove('on'); speakingBtn = null; }
}
function speak(text, btn) {
  if (!CAN_SPEAK) return;
  const wasSame = speakingBtn === btn;
  stopSpeaking();
  if (wasSame) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR'; u.rate = 0.92;
  const v = window.speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith('fr'));
  if (v) u.voice = v;
  u.onend = u.onerror = () => { if (speakingBtn === btn) { btn.classList.remove('on'); speakingBtn = null; } };
  speakingBtn = btn; btn.classList.add('on');
  window.speechSynthesis.speak(u);
}

/* =========================================================
   Registre des exercices
   ========================================================= */
const GENS = {
  // Chapitre 1 — Droites
  'd-codage': { ch: 'droites', f: genCodage, label: 'Coder un point' },
  'd-appartient': { ch: 'droites', f: genAppartient, label: 'Appartenance et alignement', hard: true },
  'd-noms': { ch: 'droites', f: genNoms, label: 'Nommer une droite' },
  'd-position': { ch: 'droites', f: genPosition, label: 'Position de deux droites', hard: true },
  'd-prop': { ch: 'droites', f: genPropPar, label: 'Deux perpendiculaires à une même droite', hard: true },
  'd-perp': { ch: 'droites', f: genTracePerp, label: 'Tracer une perpendiculaire', slow: true },
  'd-par': { ch: 'droites', f: genTracePar, label: 'Tracer une parallèle', slow: true },
  // Chapitre 2 — Nombres décimaux (partie 1)
  'n-rang': { ch: 'decimaux1', f: genRang, label: 'Rang d\'un chiffre', hard: true },
  'n-combien': { ch: 'decimaux1', f: genCombien, label: 'Nombre de dizaines, de dixièmes…', hard: true },
  'n-tranches': { ch: 'decimaux1', f: genTranches, label: 'Tranches de trois chiffres', hard: true },
  'n-decomp': { ch: 'decimaux1', f: genDecomp, label: 'Décomposer un nombre', hard: true },
  'n-zeros': { ch: 'decimaux1', f: genZeros, label: 'Zéros inutiles', hard: true },
  'n-fracdec': { ch: 'decimaux1', f: genFracDec, label: 'Fractions décimales' },
  'n-lettres': { ch: 'decimaux1', f: genLettres, label: 'Des lettres aux chiffres', hard: true },
  'n-formes': { ch: 'decimaux1', f: genFormes, label: 'Différentes écritures', hard: true },
  // Chapitre 3 — Distance et cercle
  'c-notation': { ch: 'cercle', f: genNotation, label: 'Segment, demi-droite, droite' },
  'c-ecrire': { ch: 'cercle', f: genEcrire, label: 'Bien écrire les notations' },
  'c-milieu': { ch: 'cercle', f: genMilieu, label: 'Milieu d\'un segment', hard: true },
  'c-tracer': { ch: 'cercle', f: genTracer, label: 'Tracer une demi-droite, un milieu', slow: true },
  'c-med-prop': { ch: 'cercle', f: genMedProp, label: 'Propriété de la médiatrice', hard: true },
  'c-med-trace': { ch: 'cercle', f: genMedTrace, label: 'Tracer une médiatrice', slow: true },
  'c-voc': { ch: 'cercle', f: genVocCercle, label: 'Vocabulaire du cercle', hard: true },
  'c-rd': { ch: 'cercle', f: genRayonDiam, label: 'Rayon et diamètre', hard: true },
  'c-disque': { ch: 'cercle', f: genDisque, label: 'Cercle et disque' },
  'c-trace-cercle': { ch: 'cercle', f: genTraceCercle, label: 'Tracer un cercle', slow: true },
  // Chapitre 4 — Nombres décimaux (partie 2)
  'e-lire': { ch: 'decimaux2', f: genLireHL, label: 'Lire une abscisse', hard: true },
  'e-placer': { ch: 'decimaux2', f: genPlacerHL, label: 'Placer un point', hard: true },
  'e-comparer': { ch: 'decimaux2', f: genComparer, label: 'Comparer deux nombres', hard: true },
  'e-ranger': { ch: 'decimaux2', f: genRanger, label: 'Ranger des nombres', hard: true },
  'e-intercaler': { ch: 'decimaux2', f: genIntercaler, label: 'Intercaler un nombre', hard: true },
  'e-encadrer': { ch: 'decimaux2', f: genEncadrer, label: 'Encadrer un nombre', hard: true },
  'e-arrondir': { ch: 'decimaux2', f: genArrondir, label: 'Arrondir un nombre', hard: true },
};

const CHAPTERS = [
  { id: 'droites', num: 1, title: 'Droites', symbol: '⊥', desc: 'Codage des points, appartenance, droites parallèles et perpendiculaires, tracés à l\'équerre.' },
  { id: 'decimaux1', num: 2, title: 'Nombres décimaux (partie 1)', symbol: '0,1', desc: 'Rangs des chiffres, décomposition, zéros inutiles, fractions décimales.' },
  { id: 'cercle', num: 3, title: 'Distance et cercle', symbol: '◯', desc: 'Segment, demi-droite, milieu, médiatrice, vocabulaire du cercle.' },
  { id: 'decimaux2', num: 4, title: 'Nombres décimaux (partie 2)', symbol: '≈', desc: 'Demi-droite graduée, comparer, ranger, intercaler, encadrer, arrondir.' },
];

/* =========================================================
   Progression et points faibles (enregistrés dans le navigateur)
   ========================================================= */
const STORE = 'revisions6e-v1';
let stats = {};
try { stats = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { stats = {}; }
function persist() { try { localStorage.setItem(STORE, JSON.stringify(stats)); } catch (e) { /* stockage indisponible */ } }
function saveStat(key, good, helped) {
  const s = stats[key] || (stats[key] = { ok: 0, total: 0, hint: 0 });
  s.total++; s.last = Date.now();
  if (good) { s.ok++; if (helped) s.hint = (s.hint || 0) + 1; }
  persist();
}
const NEED = 2;
function updateWeak(key, good, helped) {
  const w = stats._weak || (stats._weak = {});
  let out = null;
  if (!good) { out = key in w ? 'still' : 'added'; w[key] = 0; }
  else if (key in w) {
    if (helped) out = 'helped';
    else { w[key]++; if (w[key] >= NEED) { delete w[key]; out = 'fixed'; } else out = 'progress'; }
  }
  persist();
  return out;
}
const weakKeys = (ch) => Object.keys(stats._weak || {}).filter((k) => GENS[k] && GENS[k].ch === ch);
function weakListHTML(ch) {
  const ks = weakKeys(ch);
  if (!ks.length) return '';
  return `<ul class="weak-list">${ks.map((k) => `<li>${GENS[k].label}${stats._weak[k] ? ` <span class="small muted">(${stats._weak[k]}/${NEED})</span>` : ''}</li>`).join('')}</ul>`;
}
function refreshWeakBadge(ch) {
  const a = document.querySelector(`#nav a[href="#/${ch}/erreurs"]`);
  const n = weakKeys(ch).length;
  if (a) a.innerHTML = 'Mes erreurs' + (n ? ` <span class="count">${n}</span>` : '');
  const sum = document.querySelector(`.page[data-ch="${ch}"][data-p="erreurs"] .weak-summary`);
  if (sum) sum.innerHTML = n ? `<p><b>Tes points faibles :</b></p>${weakListHTML(ch)}` : '';
}
const weakNote = {
  added: (l) => `<p class="weak-note">📌 « ${l} » est ajouté à <b>Mes erreurs</b> pour le retravailler.</p>`,
  still: (l) => `<p class="weak-note">📌 « ${l} » reste dans <b>Mes erreurs</b>.</p>`,
  helped: () => '<p class="weak-note">Réussi avec de l\'aide : réessaie sans indice pour corriger ce point faible.</p>',
  progress: () => `<p class="weak-note">Encore ${NEED - 1} réussite sans indice pour corriger ce point faible.</p>`,
  fixed: (l) => `<p class="weak-note fixed">✨ Point faible corrigé : « ${l} » sort de <b>Mes erreurs</b> !</p>`,
};

/* =========================================================
   Moteur d'exercice
   opts : key, limit (nombre de questions), exam (contrôle blanc : sans aide),
          devoir (série donnée par le professeur), makeGen, ch
   ========================================================= */
function makeExercise(root, gen, opts = {}) {
  const limit = opts.limit || 0, noHelp = !!opts.exam;
  let cur = null, answered = false, count = 0, good = 0, history = [], used = 0, animSeen = false, tries = 0, helpedCount = 0;
  if (opts.makeGen) gen = opts.makeGen();

  root.innerHTML = `
    <div class="ex-bar"><span class="ex-count"></span>${CAN_SPEAK ? '<button type="button" class="mini ex-say" title="Écouter l\'énoncé">🔊 Écouter</button>' : ''}<span class="ex-score"></span></div>
    <div class="ex-q"></div>
    <div class="ex-hints" aria-live="polite"></div>
    <div class="ex-anim"></div>
    <div class="ex-fb" aria-live="polite"></div>
    <div class="ex-actions">
      <button type="button" class="btn primary ex-check">Vérifier</button>
      <button type="button" class="btn ex-hint">💡 Un indice</button>
      <button type="button" class="btn ex-film">🎬 Voir la construction</button>
      <button type="button" class="btn ex-next">Question suivante →</button>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const qEl = $('.ex-q'), fb = $('.ex-fb'), hEl = $('.ex-hints'), aEl = $('.ex-anim');
  const bCheck = $('.ex-check'), bNext = $('.ex-next'), bHint = $('.ex-hint'), bFilm = $('.ex-film'), bSay = $('.ex-say');
  const cEl = $('.ex-count'), sEl = $('.ex-score');
  let restart = null;
  const label = () => cur.label || GENS[cur.key || opts.key]?.label || '';
  const helped = () => used > 0 || animSeen || tries > 0;

  function bar() {
    sEl.textContent = count && !opts.weakCh ? `Score : ${good} / ${count}` : count ? `Réussies : ${good} / ${count}` : '';
    cEl.textContent = limit ? `Question ${Math.min(answered ? count : count + 1, limit)} / ${limit}` : '';
  }
  function hintButton() {
    const n = cur.hints ? cur.hints.length : 0;
    bHint.hidden = noHelp || !n || answered || !!cur.empty;
    bHint.disabled = used >= n;
    bHint.textContent = used === 0 ? `💡 Un indice (${n})` : used < n ? `💡 Indice suivant (${used + 1}/${n})` : '💡 Plus d\'indice';
  }
  function filmButton() {
    const can = answered ? !!cur.anim : !!cur.example && !noHelp;
    bFilm.hidden = !can;
    bFilm.textContent = answered ? '🎬 Voir la construction' : '🎬 Voir un exemple';
  }

  function render(focus) {
    stopSpeaking();
    cur = gen();
    answered = false; used = 0; animSeen = false; tries = 0;
    root.classList.remove('done');
    delete qEl.dataset.sel; delete qEl.dataset.order;
    qEl.innerHTML = cur.q;
    hEl.innerHTML = ''; aEl.innerHTML = '';
    fb.className = 'ex-fb'; fb.innerHTML = '';
    bCheck.hidden = !!cur.empty; bCheck.disabled = false;
    filmButton();
    bNext.textContent = cur.empty ? 'Actualiser' : limit ? 'Passer cette question →' : 'Question suivante →';
    bNext.disabled = false;
    if (bSay) bSay.hidden = !!cur.empty;
    hintButton();
    if (cur.mount) cur.mount(qEl);
    bar();
    if (focus) qEl.querySelector('input.ans')?.focus({ preventScroll: true });
  }
  function showHint() {
    if (!cur.hints || used >= cur.hints.length) return;
    const h = cur.hints[used];
    const html = typeof h === 'string' ? h : h.html;
    hEl.insertAdjacentHTML('beforeend', `<div class="hint-box"><b>Indice ${used + 1} :</b> ${html}</div>`);
    if (h && h.act) h.act(h.target === 'hint' ? hEl : qEl);
    used++;
    hintButton();
  }
  function showFilm() {
    if (!(answered ? cur.anim : cur.example)) return;
    if (!answered) animSeen = true;
    const sc = answered ? cur.anim() : cur.example();
    const p = makePlayer(aEl, sc);
    if (!answered) aEl.insertAdjacentHTML('afterbegin', '<p class="small muted">Exemple avec d\'autres données : à toi ensuite de faire la même chose avec les tiennes.</p>');
    p.play();
    aEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function check() {
    if (answered || cur.empty) return;
    if (!noHelp && tries === 0 && cur.remediate) {
      const m = cur.remediate(qEl);
      if (m) {
        tries = 1;
        fb.className = 'ex-fb remed';
        fb.innerHTML = `<strong>🤔 Regarde bien…</strong> ${m}<p class="small">Corrige ta réponse, puis clique à nouveau sur « Vérifier ». C'est ton deuxième essai.</p>`;
        return;
      }
    }
    const res = cur.check(qEl);
    if (!res) { fb.className = 'ex-fb warn'; fb.innerHTML = 'Complète ta réponse avant de vérifier.'; return; }
    if (res.retry) { fb.className = 'ex-fb warn'; fb.innerHTML = res.msg; return; }
    answered = true; count++;
    if (res.ok) good++;
    const k = cur.key || opts.key;
    const h = helped();
    if (res.ok && h) helpedCount++;
    if (k && !noHelp) saveStat(k, res.ok, h);
    const w = k ? updateWeak(k, res.ok, h) : null;
    if (w && GENS[k]) refreshWeakBadge(GENS[k].ch);
    if (limit) history.push({ label: label(), ok: res.ok, helped: res.ok && h });
    if (opts.onResult) opts.onResult(k, res.ok, w, label());
    root.classList.add('done');
    qEl.querySelectorAll('input').forEach((i) => { i.disabled = true; });
    fb.className = 'ex-fb ' + (res.ok ? 'ok' : 'ko');
    const head = res.ok ? (h ? '<strong>✔ Bravo, avec un peu d\'aide !</strong> ' : '<strong>✔ Bravo !</strong> ') : '<strong>✘ Pas tout à fait.</strong> ';
    fb.innerHTML = head + res.msg + (w && !noHelp ? weakNote[w](label()) : '');
    bCheck.disabled = true;
    filmButton();
    hintButton();
    bNext.disabled = false;
    bNext.textContent = limit && count >= limit ? (opts.exam ? 'Voir ma note' : 'Voir mon résultat') : 'Question suivante →';
    bar();
    bNext.focus({ preventScroll: true });
  }

  function summary() {
    const weak = history.filter((x) => !x.ok).length;
    let head;
    if (opts.summary) {
      head = opts.summary({ good, limit, helpedCount, history });    } else {
      const note = Math.round((good / limit) * 20 * 2) / 2;
      const k = opts.examKey;
      stats[k] = { last: note, best: Math.max(note, stats[k]?.best ?? 0), n: (stats[k]?.n ?? 0) + 1 };
      persist();
      const advice = note >= 16 ? 'Excellent, tu es prêt(e) pour le devoir !' : note >= 12 ? 'Bon travail ! Revois les points en rouge.' : 'Reprends la fiche puis entraîne-toi sur les points en rouge.';
      head = `<p class="note">${fmt(note)} / 20</p><p>${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''} sur ${limit}. ${advice}</p>`;
    }
    const chs = [...new Set(history.map(() => opts.ch).filter(Boolean))];
    const list = `<ul class="res-list">${history.map((x) => `<li class="${x.ok ? 'ok' : 'ko'}">${x.label}${x.helped ? ' <span class="small muted">(avec aide)</span>' : ''}</li>`).join('')}</ul>`;
    qEl.innerHTML = opts.summary ? head.replace('{{LIST}}', list) : `<div class="result">${head}${list}
      ${weak && chs.length ? `<p><a class="btn primary" href="#/${chs[0]}/erreurs">Retravailler mes erreurs →</a></p>` : ''}</div>`;
    fb.className = 'ex-fb'; fb.innerHTML = ''; hEl.innerHTML = ''; aEl.innerHTML = '';
    bCheck.hidden = true; bHint.hidden = true; bFilm.hidden = true;
    bNext.textContent = opts.restartLabel || 'Recommencer un contrôle';
    sEl.textContent = ''; cEl.textContent = '';
    restart = () => {
      restart = null; count = 0; good = 0; history = []; helpedCount = 0;
      if (opts.onRestart) opts.onRestart();
      if (opts.makeGen) gen = opts.makeGen();
      render(true);
    };
  }

  function next() {
    if (restart) { restart(); return; }
    if (limit && !answered && !cur.empty) {
      count++; history.push({ label: label() + ' (passée)', ok: false });
      const k = cur.key || opts.key; if (k) { updateWeak(k, false, false); if (GENS[k]) refreshWeakBadge(GENS[k].ch); }
    }
    if (limit && count >= limit) { summary(); return; }
    render(true);
  }

  bCheck.addEventListener('click', check);
  bNext.addEventListener('click', next);
  bHint.addEventListener('click', showHint);
  qEl.addEventListener('input', (e) => { if (e.target.classList) e.target.classList.remove('wrong', 'right'); });
  bFilm.addEventListener('click', showFilm);
  if (bSay) bSay.addEventListener('click', () => {
    const parts = [qEl, hEl, fb].filter((x) => x.textContent.trim());
    speak(parts.map((x) => speechText(x)).join('. '), bSay);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !answered) { e.preventDefault(); check(); }
  });
  render(false);
  return { renew: () => { restart = null; render(false); }, _test: { get cur() { return cur; }, check, next, showHint, qEl, fb } };
}

/* =========================================================
   Accueil général et accueils de chapitre
   ========================================================= */
function chapterStats(ch) {
  let ok = 0, total = 0;
  Object.entries(GENS).forEach(([k, g]) => { if (g.ch === ch) { ok += stats[k]?.ok || 0; total += stats[k]?.total || 0; } });
  return { ok, total, exam: stats[ch + ':controle'], weak: weakKeys(ch).length };
}
function renderChapters() {
  document.getElementById('chapters').innerHTML = CHAPTERS.map((c) => {
    if (c.locked) return `<div class="chapter-card locked" data-ch="${c.id}" aria-disabled="true">
      <span class="symbol">🔒</span><span class="num">Chapitre ${c.num}</span><h2>${c.title}</h2>
      <p>${c.desc}</p><span class="stat">Bientôt : on le verra d'abord en classe.</span></div>`;
    const s = chapterStats(c.id);
    const pct = s.total ? Math.round((s.ok / s.total) * 100) : 0;
    const parts = [];
    if (s.total) parts.push(`${s.ok} / ${s.total} exercices réussis`);
    if (s.exam) parts.push(`contrôle : ${fmt(s.exam.best)}/20`);
    if (s.weak) parts.push(`📌 ${s.weak} point${s.weak > 1 ? 's' : ''} à retravailler`);
    return `<a class="chapter-card" data-ch="${c.id}" href="#/${c.id}">
      <span class="symbol">${c.symbol}</span>
      <span class="num">Chapitre ${c.num}</span>
      <h2>${c.title}</h2>
      <p>${c.desc}</p>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <span class="stat">${parts.length ? parts.join(' · ') : 'Pas encore commencé'}</span>${c.hiddenNote ? `<span class="hidden-note">${c.hiddenNote}</span>` : ''}</a>`;
  }).join('');
}
function renderChapterHome(ch) {
  const host = document.querySelector(`.page[data-ch="${ch}"][data-p="accueil"] .ch-cards`);
  const pages = [...document.querySelectorAll(`.page[data-ch="${ch}"]`)].filter((p) => p.dataset.p !== 'accueil');
  host.innerHTML = pages.map((p) => {
    const keys = [...p.querySelectorAll('.exercise[data-gen]')].map((e) => e.dataset.gen);
    const desc = p.querySelector('.lead')?.textContent.trim().split('. ')[0] || '';
    let body = '<div class="stat">À relire avant chaque séance →</div>';
    let cls = 'tile';
    if (p.dataset.p === 'erreurs') {
      const n = weakKeys(ch).length;
      cls += n ? ' tile-weak' : '';
      body = n ? `<div class="stat"><b>📌 ${n} point${n > 1 ? 's' : ''} à retravailler</b></div>${weakListHTML(ch)}` : '<div class="stat">Aucun point faible pour l\'instant 🎉</div>';
    } else if (p.dataset.exam) {
      const c = stats[ch + ':controle'];
      body = `<div class="bar"><span style="width:${c ? Math.round((c.best / 20) * 100) : 0}%"></span></div><div class="stat">${c ? `Meilleure note : ${fmt(c.best)} / 20` : 'Pas encore fait'}</div>`;
    } else if (keys.length) {
      let ok = 0, total = 0, hint = 0;
      keys.forEach((k) => { ok += stats[k]?.ok || 0; total += stats[k]?.total || 0; hint += stats[k]?.hint || 0; });
      const pct = total ? Math.round((ok / total) * 100) : 0;
      body = `<div class="bar"><span style="width:${pct}%"></span></div><div class="stat">${total ? `${ok} / ${total} réussies${hint ? ` (dont ${hint} avec indice)` : ''}` : 'Pas encore commencé'}</div>`;
    }
    return `<a class="${cls}" href="#/${ch}/${p.dataset.p}"><h3>${p.dataset.title}</h3><p>${desc.length > 90 ? desc.slice(0, 88) + '…' : desc}${desc.endsWith('.') || desc.endsWith('!') ? '' : '.'}</p>${body}</a>`;
  }).join('');
}

/* =========================================================
   Devoirs : liens directs vers une ou plusieurs notions
   #/devoir/clé1,clé2/nombre
   ========================================================= */
const siteURL = () => location.href.split('#')[0];
const devoirHash = (keys, n, extra = '') => `#/devoir/${keys.join(',')}/${n}${extra}`;
/** Nom du devoir tel qu'il arrive dans la colonne « Devoir » (le même pour les résultats et pour « devoir donné ») */
const devoirLabel = (keys, rem = false) => (rem ? 'Remédiation — ' : '') + (keys.length === 1 ? GENS[keys[0]].label : `Révisions ciblées : ${keys.map((k) => GENS[k].label).join(', ')}`);

/* ---------- Envoi automatique des résultats dans un formulaire Google ----------
   Le professeur colle le « lien prérempli » de son formulaire (6 questions, dans l'ordre :
   Prénom, Code, Classe, Devoir, Score, Détail). Le lien du devoir transporte l'identifiant
   du formulaire : /f=<id>~<entrée1>~…~<entrée6>. */
const FORM_FIELDS = ['Prénom', 'Code', 'Classe', 'Devoir', 'Score', 'Détail'];
function parsePrefill(url) {
  const m = String(url).match(/forms\/d\/e\/([\w-]+)\/(?:viewform|formResponse)/);
  if (!m) return null;
  const entries = [...String(url).matchAll(/entry\.(\d+)=/g)].map((x) => x[1]);
  return { id: m[1], entries };
}
const formToSeg = (f) => `/f=${f.id}~${f.entries.join('~')}`;
function segToForm(seg) { const p = seg.split('~'); return p.length === 7 && /^[\w-]{20,}$/.test(p[0]) && p.slice(1).every((x) => /^\d+$/.test(x)) ? { id: p[0], entries: p.slice(1) } : null; }
function sendToForm(form, values) {
  const body = new URLSearchParams();
  form.entries.forEach((e, i) => body.append('entry.' + e, values[i] ?? ''));
  return fetch(`https://docs.google.com/forms/d/e/${form.id}/formResponse`, { method: 'POST', mode: 'no-cors', body });
}
/* ---------- Grist (grist.numerique.gouv.fr) ----------
   Lien d'un formulaire publié : https://…/o/docs/forms/<clé>/<n° de vue>
   Un formulaire publié accepte l'ajout de lignes sans clé secrète (pas de lecture possible). */
function parseGristUrl(url) {
  const m = String(url).trim().match(/^(https:\/\/[^\s?#]+?)\/forms\/([A-Za-z0-9]+)\/(\d+)/);
  return m ? { a: m[1], k: m[2], v: m[3] } : null;
}
const gristFormUrl = (g) => `${g.a}/forms/${g.k}/${g.v}`;
const b64e = (str) => btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64d = (str) => decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
const gristToSeg = (g) => '/g=' + b64e(JSON.stringify(g));
function segToGrist(seg) {
  try { const g = JSON.parse(b64d(seg)); return g && /^https:\/\//.test(g.a) && /^[A-Za-z0-9]+$/.test(g.k) ? g : null; } catch (e) { return null; }
}
const GRIST_WANT = ['prenom', 'code', 'classe', 'devoir', 'score', 'detail'];
async function gristStructure(g) {
  const r = await fetch(`${g.a}/api/s/${g.k}/forms/${g.v}`);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  const fields = Object.values(j.formFieldsById || {});
  const cols = GRIST_WANT.map((w) => (fields.find((f) => normName(f.question || '') === w) || fields.find((f) => normName(f.colId || '') === w) || {}).colId || null);
  return { t: j.formTableId, cols };
}
async function gristSend(g, values) {
  const fields = {};
  g.c.forEach((c, i) => { if (c) fields[c] = values[i] ?? ''; });
  const r = await fetch(`${g.a}/api/s/${g.k}/tables/${encodeURIComponent(g.t)}/records`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records: [{ fields }] }),
  });
  if (!r.ok) { let t = ''; try { t = (await r.text()).slice(0, 160); } catch (e) { /* rien */ } throw new Error(`refus de Grist (${r.status}) ${t}`); }
  return r;
}
const nowStr = (d = new Date()) => `le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Code de résultat (vérifiable par le professeur) ----------
   14 caractères = score, nombre de questions, réussites avec aide, numéro d'essai,
   date et heure (à la minute), empreinte du devoir, empreinte du prénom, clé de contrôle. */
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const EPOCH = Date.UTC(2026, 0, 1);
function h8(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return ((h >>> 0) ^ (h >>> 8) ^ (h >>> 16) ^ (h >>> 24)) & 255; }
const normName = (s) => String(s).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
function makeCode({ good, n, helped, attempt, time, spec, name }) {
  const mins = clamp(Math.floor((time - EPOCH) / 60000), 0, 2 ** 21 - 1);
  let v = 0n;
  const push = (x, b) => { v = (v << BigInt(b)) | BigInt(x & (2 ** b - 1)); };
  push(good, 6); push(n, 6); push(helped, 6); push(Math.min(attempt, 31), 5); push(mins, 21); push(h8(spec), 8); push(h8(normName(name)), 8);
  push(h8('v6e:' + v.toString(36)), 8);
  let s = '';
  for (let i = 0; i < 14; i++) { s = B32[Number(v & 31n)] + s; v >>= 5n; }
  return `${s.slice(0, 4)}-${s.slice(4, 9)}-${s.slice(9)}`;
}
function readCode(str) {
  const s = String(str).toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V').replace(/[^0-9A-Z]/g, '');
  if (s.length !== 14) return null;
  let v = 0n;
  for (const c of s) { const i = B32.indexOf(c); if (i < 0) return null; v = (v << 5n) | BigInt(i); }
  const take = (b) => { const x = Number(v & ((1n << BigInt(b)) - 1n)); v >>= BigInt(b); return x; };
  const chk = take(8);
  if (h8('v6e:' + v.toString(36)) !== chk) return { invalid: true };
  const name = take(8), spec = take(8), mins = take(21), attempt = take(5), helped = take(6), n = take(6), good = take(6);
  if (v !== 0n || good > n || helped > good || n === 0) return { invalid: true };
  return { good, n, helped, attempt, time: EPOCH + mins * 60000, spec, name };
}

/* ---------- Devoir : prénom, série, carte de résultat ---------- */
let devoirSpec = null;
function routeDevoir(spec) {
  const [ks, nS, ...more] = spec.split('/');
  const keys = (ks || '').split(',').filter((k) => GENS[k]);
  const n = clamp(parseInt(nS, 10) || 10, 1, 40);
  let classe = '', form = null;
  const once = more.includes('u'), rem = more.includes('r'); // r : remédiation proposée après un contrôle (étiquette QR)
  more.forEach((seg) => {
    if (seg.startsWith('c=')) { try { classe = decodeURIComponent(seg.slice(2)).slice(0, 80); } catch (e) { classe = ''; } }
    if (seg.startsWith('f=')) { const f = segToForm(seg.slice(2)); if (f) form = { kind: 'google', ...f }; }
    if (seg.startsWith('g=')) { const g = segToGrist(seg.slice(2)); if (g) form = { kind: g.t ? 'grist' : 'manual', ...g }; }
  });
  // plusieurs classes séparées par des virgules : l'élève choisit la sienne
  const classes = [...new Set(classe.split(',').map((x) => x.trim()).filter(Boolean))];
  classe = classes.length === 1 ? classes[0] : '';
  const page = document.querySelector('.page[data-p="devoir"]');
  const head = page.querySelector('.devoir-head'), ex = page.querySelector('.devoir-ex'), start = page.querySelector('.devoir-start');
  if (!keys.length) {
    head.innerHTML = '<h1>Devoir introuvable</h1><p class="lead">Ce lien ne correspond à aucun exercice. Vérifie que tu as copié le lien en entier, ou demande-le à nouveau à ton professeur.</p><p><a class="btn" href="#/">Retour à l\'accueil</a></p>';
    ex.hidden = true; start.hidden = true; devoirSpec = null;
    return { ch: '' };
  }
  const chs = [...new Set(keys.map((k) => GENS[k].ch))];
  const canon = `${keys.join(',')}/${n}`;
  if (spec === devoirSpec) return { ch: chs[0] };
  devoirSpec = spec;
  const title = keys.length === 1 ? GENS[keys[0]].label : 'Révisions ciblées', dLabel = devoirLabel(keys, rem);
  head.innerHTML = `<p class="kicker">Devoir</p><h1>${title}</h1>
    <p class="lead">${n} question${n > 1 ? 's' : ''} sur : ${keys.map((k) => `<b>${GENS[k].label}</b>`).join(', ')}. Tu as droit aux indices et à un deuxième essai.${once ? ' <b>Seul ton premier essai compte</b> : tu pourras ensuite refaire le devoir pour t\'entraîner.' : ''} ${form && form.kind !== 'manual' ? 'À la fin, ton résultat sera <b>envoyé automatiquement</b> à ton professeur.' : form ? 'À la fin, tu recopieras ton <b>code</b> dans le formulaire de ton professeur (un lien te sera donné).' : 'À la fin, tu obtiendras ton résultat et un code pour ton professeur.'}</p>${classe ? `<p class="small">Classe : <b>${esc(classe)}</b></p>` : ''}
    <p class="small">Besoin de revoir le cours ? ${chs.map((c) => `<a href="#/${c}/fiche">Fiche « ${CHAPTERS.find((x) => x.id === c).title} »</a>`).join(' · ')}</p>`;
  ex.hidden = true; ex.innerHTML = '';
  start.hidden = false;
  start.innerHTML = `<label for="dv-name"><b>Écris ton prénom${classes.length > 1 ? ' et choisis ta classe' : ''} pour commencer :</b></label>
    <div class="prof-row"><input type="text" id="dv-name" autocomplete="given-name" maxlength="30" value="${esc(stats._name || '')}" aria-label="Ton prénom">
    ${classes.length > 1 ? `<select id="dv-classe" aria-label="Ta classe"><option value="">Ta classe…</option>${classes.map((c) => `<option${c === stats._classe ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select>` : ''}
    <button type="button" class="btn primary" id="dv-go">Commencer le devoir →</button></div>
    <p><button type="button" class="linkbtn" id="dv-paper">📝 Je préfère faire ce devoir sur papier</button></p>
    <p class="small muted">${form ? 'Ton prénom et ton résultat seront transmis à ton professeur, et à personne d\'autre.' : 'Ton prénom reste sur cet appareil : il s\'affiche seulement sur ta carte de résultat.'}</p>`;
  const go = () => {
    const name = start.querySelector('#dv-name').value.trim();
    if (!normName(name)) { start.querySelector('#dv-name').classList.add('wrong'); start.querySelector('#dv-name').focus(); return; }
    if (classes.length > 1) {
      const sel = start.querySelector('#dv-classe');
      if (!sel.value) { sel.classList.add('wrong'); sel.focus(); return; }
      classe = sel.value; stats._classe = classe;
    }
    stats._name = name; persist();
    const rec = stats['devoir:' + canon] || (stats['devoir:' + canon] = { tries: 0 });
    rec.tries = (rec.tries || 0) + 1; persist();
    start.hidden = true; ex.hidden = false;
    makeExercise(ex, null, {
      limit: n, ch: chs[0],
      restartLabel: 'Recommencer le devoir',
      onRestart() { rec.tries++; persist(); },
      summary({ good, limit, helpedCount }) {
        const d = new Date();
        const code = makeCode({ good, n: limit, helped: helpedCount, attempt: rec.tries, time: d.getTime(), spec: canon, name });
        rec.best = Math.max(rec.best || 0, good); rec.last = good; rec.at = d.getTime(); persist();
        const training = once && rec.tries > 1;
        if (form && !training) {
          const values = [name, code, classe, dLabel, `${good}/${limit}`,
            `${helpedCount} avec aide · essai ${rec.tries} · terminé ${nowStr(d)}`];
          const planB = (el, why, cls = 'ko') => {
            el.className = 'rc-send ' + cls;
            el.innerHTML = `${why} Ouvre le <a href="${gristFormUrl(form)}" target="_blank" rel="noopener"><b>formulaire de ton professeur</b></a> et recopie ton prénom, ton score (${good}/${limit}) et ton code : <b>${code}</b> <button type="button" class="mini">Copier le code</button>`;
            el.querySelector('button').addEventListener('click', (e) => { navigator.clipboard?.writeText(code).then(() => { e.target.textContent = '✔ Copié'; }).catch(() => {}); });
          };
          const doSend = () => {
            const el = document.getElementById('rc-send'); if (!el) return;
            if (form.kind === 'manual') { planB(el, '📝', 'todo'); return; }
            el.className = 'rc-send'; el.textContent = '📨 Envoi du résultat à ton professeur…';
            (form.kind === 'grist' ? gristSend(form, values) : sendToForm(form, values))
              .then(() => { el.className = 'rc-send ok'; el.textContent = '✔ Résultat envoyé à ton professeur.'; })
              .catch((e) => {
                if (form.kind === 'grist') { planB(el, `⚠ L'envoi automatique n'a pas marché <span class="small muted">(${esc(e instanceof TypeError ? 'réponse de Grist illisible ou pas de connexion' : e.message)})</span>.`); return; }
                el.className = 'rc-send ko'; el.innerHTML = '⚠ Envoi impossible (pas de connexion ?). <button type="button" class="mini">Réessayer</button> Sinon, fais une capture d\'écran.'; el.querySelector('button').addEventListener('click', doSend);
              });
          };
          setTimeout(doSend, 0);
        }
        return `<div class="result-card" id="result-card">
          <p class="rc-kicker">Révisions 6<sup>e</sup> · ${training ? 'Entraînement' : 'Devoir'}</p>
          <p class="rc-name">${esc(name)}${classe ? ` <span class="rc-cl">${esc(classe)}</span>` : ''}</p>
          <p class="rc-title">${title}</p>
          <p class="note">${good} / ${limit}</p>
          <p>${good} réussite${good > 1 ? 's' : ''} sur ${limit} question${limit > 1 ? 's' : ''}${helpedCount ? `, dont ${helpedCount} avec de l'aide` : ', sans aide'}.</p>
          <p class="rc-meta">Terminé ${nowStr(d)} · essai n° ${rec.tries}</p>
          <p class="rc-code">Code : <b>${code}</b></p>
          ${training ? '<p class="rc-send todo">🏋️ Essai d\'entraînement : seul ton premier essai compte, il a déjà été transmis.</p>' : form ? '<p class="rc-send" id="rc-send"></p>' : ''}
          {{LIST}}
        </div>
        ${form ? '' : '<p class="small center">📸 Fais une <b>capture d\'écran</b> de ce cadre, ou recopie le <b>code</b> pour ton professeur.</p>'}`;
      },
      makeGen() {
        let bag = [], last = null;
        return () => {
          if (!bag.length) bag = shuffle([...keys]);
          let k = bag.shift();
          if (k === last && keys.length > 1 && bag.length) { bag.push(k); k = bag.shift(); }
          last = k;
          return wrapGen(k, keys.length > 1);
        };
      },
    });
    ex.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  start.querySelector('#dv-go').addEventListener('click', go);
  // ---------- Version papier : feuille à imprimer + ligne « sur papier, à vérifier » pour le professeur ----------
  start.querySelector('#dv-paper').addEventListener('click', () => {
    const name = start.querySelector('#dv-name').value.trim();
    if (!normName(name)) { start.querySelector('#dv-name').classList.add('wrong'); start.querySelector('#dv-name').focus(); return; }
    if (classes.length > 1) {
      const sel = start.querySelector('#dv-classe');
      if (!sel.value) { sel.classList.add('wrong'); sel.focus(); return; }
      classe = sel.value; stats._classe = classe;
    }
    stats._name = name; persist();
    let bag = [];
    const qs = [];
    for (let i = 0; i < n; i++) { if (!bag.length) bag = shuffle([...keys]); const k = bag.shift(); qs.push({ k, o: wrapGen(k, false) }); }
    const paperize = (html) => {
      const d = document.createElement('div'); d.innerHTML = html;
      d.querySelectorAll('input.ans').forEach((i) => { const sp = document.createElement('span'); sp.className = 'blank'; sp.textContent = ' '; i.replaceWith(sp); });
      d.querySelectorAll('input[type=radio], input[type=checkbox]').forEach((i) => { const sp = document.createElement('span'); sp.className = 'box'; sp.textContent = '☐'; i.replaceWith(sp); });

      d.querySelectorAll('button').forEach((b) => { const sp = document.createElement('span'); sp.className = b.className + ' as-text'; sp.textContent = b.textContent; b.replaceWith(sp); });
      d.querySelectorAll('.ord-out, .ord-reset').forEach((e) => e.remove());
      return d.innerHTML
        .replace(/Clique sur les nombres dans l'ordre\./g, '')
        .replace(/ : clique-les dans l'ordre\./g, '. Écris-les dans l\'ordre : <span class="blank long"></span>')
        .replace(/Clique sur les <b>zéros inutiles<\/b> pour les barrer\./g, 'Barre les <b>zéros inutiles</b>.')
        .replace(/Clique entre les chiffres pour placer les espaces, afin que le nombre soit facile à lire\./g, 'Recopie ce nombre en plaçant les espaces, pour qu\'il soit facile à lire : <span class="blank long"></span>')
        .replace(/ : clique sur la bonne graduation\./g, ' sur la demi-droite graduée.')
        .replace(/Clique sur l'opération/g, 'Entoure l\'opération');
    };
    const d = new Date();
    start.hidden = true; ex.hidden = false; ex.classList.remove('done');
    ex.innerHTML = `<div class="no-print paper-bar">
        <p class="paper-st" id="paper-st"></p>
        <p><button type="button" class="btn primary" id="paper-print">🖨️ Imprimer la feuille</button> <button type="button" class="btn" id="paper-back">Finalement, je le fais en ligne</button></p>
        <p class="small muted">Pas d'imprimante ? Recopie les questions sur ta feuille. Quand une question dit « clique », entoure ou écris ta réponse sur la feuille.</p>
      </div>
      <div class="paper-sheet">
        <div class="paper-head"><b>${esc(name)}</b>${classe ? ` — ${esc(classe)}` : ''}<span>Devoir : ${esc(title)} · ${n} questions · ${d.toLocaleDateString('fr-FR')}</span></div>
        ${qs.map((x, i) => `<section class="pq" data-i="${i}"><h3>Question ${i + 1}${keys.length > 1 ? ` <span class="small muted">— ${GENS[x.k].label}</span>` : ''}</h3>${x.o.q.includes('class="board"') ? '<div class="pq-body"></div>' : paperize(x.o.q)}</section>`).join('')}
      </div>`;
    // Constructions : on dessine la figure de départ (en vraie grandeur), sans les instruments
    ex.querySelectorAll('.pq').forEach((sec) => {
      const x = qs[Number(sec.dataset.i)], body = sec.querySelector('.pq-body'); if (!body) return;
      body.innerHTML = x.o.q;
      try { x.o.mount(body); } catch (e) { /* rien */ }
      const svg = body.querySelector('.geo-svg');
      const fig = svg ? svg.cloneNode(true) : null;
      if (fig) { fig.querySelector('.g-prev')?.remove(); fig.classList.add('paper-geo'); fig.removeAttribute('style'); }
      body.querySelector('.board').innerHTML = '';
      if (fig) body.querySelector('.board').appendChild(fig);
      body.querySelector('.board').insertAdjacentHTML('beforeend', '<p class="small muted">Figure en vraie grandeur (carreaux de 1 cm) : fais la construction dessus, ou reproduis-la sur ta feuille.</p>');
      body.innerHTML = paperize(body.innerHTML);
    });
    const st = ex.querySelector('#paper-st');
    if (form && form.kind !== 'manual') {
      const values = [name, `PAPIER-${n}`, classe, dLabel, 'sur papier', `déclaré ${nowStr(d)} · à vérifier sur la feuille`];
      st.className = 'paper-st'; st.textContent = '📨 J\'informe ton professeur que tu fais ce devoir sur papier…';
      (form.kind === 'grist' ? gristSend(form, values) : sendToForm(form, values))
        .then(() => { st.className = 'paper-st ok-t'; st.textContent = '✔ Ton professeur sait que tu fais ce devoir sur papier. N\'oublie pas de lui rendre ta feuille !'; })
        .catch((e) => { st.className = 'paper-st warn-t'; st.innerHTML = `⚠ Je n'ai pas pu prévenir ton professeur. Dis-lui toi-même que tu as fait ce devoir sur papier.<br><span class="small muted">Détail : ${esc(e instanceof TypeError ? 'réponse de Grist illisible ou pas de connexion' : e.message)}</span>`; });
    } else st.textContent = '📝 Fais ce devoir sur ta feuille et rends-la à ton professeur.';
    ex.querySelector('#paper-print').addEventListener('click', () => window.print());
    ex.querySelector('#paper-back').addEventListener('click', () => { ex.innerHTML = ''; go(); });
    ex.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  start.querySelector('#dv-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  start.querySelector('#dv-name').addEventListener('input', (e) => e.target.classList.remove('wrong'));
  start.querySelector('#dv-classe')?.addEventListener('change', (e) => e.target.classList.remove('wrong'));
  return { ch: chs[0] };
}

/* ---------- Espace professeur ---------- */
const PROF_KEY = 'revisions6e-prof';
const profOpen = () => { try { return localStorage.getItem(PROF_KEY) === normName(CODE_PROF) + ':ok'; } catch (e) { return false; } };
function renderProfLock() {
  const lock = document.getElementById('prof-lock'), content = document.getElementById('prof-content');
  const open = profOpen();
  lock.hidden = open; content.hidden = !open;
  if (open) {
    const first = !document.getElementById('prof-list').dataset.ready;
    try { renderProf(); if (!first && window._bilanAuto) window._bilanAuto(); }
    catch (e) { content.insertAdjacentHTML('afterbegin', `<p class="ex-fb ko">⚠ Problème dans l'Espace professeur : ${esc(e.message)}. Recharge la page avec <kbd>Ctrl</kbd>+<kbd>F5</kbd> ; si le message reste, envoie-le à la personne qui gère le site.</p>`); }
    return;
  }
  if (lock.dataset.ready) return;
  lock.dataset.ready = '1';
  const inpC = lock.querySelector('#prof-code'), msg = lock.querySelector('.lock-msg');
  const tryCode = () => {
    if (normName(inpC.value) && inpC.value.trim().toLowerCase() === CODE_PROF.trim().toLowerCase()) {
      try { localStorage.setItem(PROF_KEY, normName(CODE_PROF) + ':ok'); } catch (e) { /* rien */ }
      inpC.value = ''; msg.textContent = ''; renderProfLock();
    } else { msg.textContent = 'Code incorrect.'; inpC.classList.add('wrong'); inpC.select(); }
  };
  lock.querySelector('#prof-unlock').addEventListener('click', tryCode);
  inpC.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryCode(); });
  inpC.addEventListener('input', () => inpC.classList.remove('wrong'));
}
function renderProf() {
  const host = document.getElementById('prof-list');
  if (host.dataset.ready) return;
  host.dataset.ready = '1';
  let folded = {};
  try { folded = JSON.parse(localStorage.getItem('revisions6e-prof-plie') || 'null') || {}; } catch (e) { folded = {}; }
  host.innerHTML = CHAPTERS.slice().reverse().map((c) => {
    const keys = Object.keys(GENS).filter((k) => GENS[k].ch === c.id);
    const shut = c.id in folded ? folded[c.id] : c.num <= 4;
    return `<fieldset class="prof-ch${shut ? ' folded' : ''}" data-ch="${c.id}"><legend><button type="button" class="prof-fold" aria-expanded="${!shut}">Chapitre ${c.num} · ${c.title} <span class="prof-nb"></span></button>
      <button type="button" class="mini prof-all">tout cocher</button></legend>
      ${keys.map((k) => `<label class="prof-k"><input type="checkbox" value="${k}"> <span>${GENS[k].label}${GENS[k].slow ? ' <span class="small muted">(tracé)</span>' : ''}</span>
        <button type="button" class="mini prof-one" data-k="${k}" title="Copier le lien de cette seule notion">🔗 lien seul</button></label>`).join('')}
      <p class="small">Fiche de cours : <code class="prof-url">${siteURL()}#/${c.id}/fiche</code> <button type="button" class="mini prof-copy" data-url="${siteURL()}#/${c.id}/fiche">Copier</button></p>
    </fieldset>`;
  }).join('');
  const out = document.getElementById('prof-link'), nSel = document.getElementById('prof-n'), open = document.getElementById('prof-open'), projo = document.getElementById('prof-projo');
  const sel = () => [...host.querySelectorAll('input[type=checkbox]:checked')].map((i) => i.value);
  const update = () => {
    const ks = sel();
    host.querySelectorAll('.prof-ch').forEach((fs) => { const n = fs.querySelectorAll('input[type=checkbox]:checked').length; fs.querySelector('.prof-nb').textContent = n ? `(${n} cochée${n > 1 ? 's' : ''})` : ''; });
    if (!ks.length) { out.value = ''; out.placeholder = 'Coche au moins une notion ci-dessous.'; open.hidden = true; projo.hidden = true; return; }
    out.value = siteURL() + devoirHash(ks, nSel.value, profExtra());
    open.href = devoirHash(ks, nSel.value, profExtra()); open.hidden = false;
    projo.href = `#/projo/${ks.join(',')}`; projo.hidden = false;
  };
  host.addEventListener('change', update);
  nSel.addEventListener('change', update);
  // Classe et formulaire (Grist ou Google)
  const clInp = document.getElementById('prof-classe'), fInp = document.getElementById('prof-form'), fUse = document.getElementById('prof-form-use'), fSt = document.getElementById('prof-form-status'), fTest = document.getElementById('prof-form-test');
  const FKEY = 'revisions6e-form', GKEY = 'revisions6e-grist';
  const loadG = () => { try { return JSON.parse(localStorage.getItem(GKEY) || 'null'); } catch (e) { return null; } };
  const saveG = (g) => { try { if (g) localStorage.setItem(GKEY, JSON.stringify(g)); else localStorage.removeItem(GKEY); } catch (e) { /* rien */ } };
  /** destination actuellement reliée : segment à ajouter aux liens, ou null */
  const destSeg = () => {
    const pf = parsePrefill(fInp.value);
    if (pf && pf.entries.length === 6) return formToSeg(pf);
    const pg = parseGristUrl(fInp.value), g = loadG();
    if (pg && g && g.k === pg.k && g.v === pg.v) return gristToSeg(g);
    return null;
  };
  const say = (cls, html) => { fSt.className = 'small ' + cls; fSt.innerHTML = html; };
  const showForm = () => {
    const v = fInp.value.trim(), pf = parsePrefill(v), pg = parseGristUrl(v), g = loadG();
    fTest.hidden = !pg;
    fUse.disabled = !destSeg();
    if (!v) say('muted', 'Aucun formulaire relié : les élèves te donneront leur code ou une capture d\'écran.');
    else if (pf) say(pf.entries.length === 6 ? 'ok-t' : 'ko-t', pf.entries.length === 6 ? '✔ Formulaire Google relié : 6 questions détectées.' : `Il faut exactement 6 questions remplies dans le lien prérempli (j'en trouve ${pf.entries.length}).`);
    else if (pg && g && g.k === pg.k && g.v === pg.v) say(g.t ? 'ok-t' : 'warn-t', g.t ? '✔ Formulaire Grist relié : les résultats arriveront automatiquement dans ta table.' : '⚠ Formulaire Grist relié en <b>mode manuel</b> : à la fin du devoir, l\'élève a un lien vers ton formulaire pour y recopier son code. Tu pourras retester une fois le site en ligne.');
    else if (pg) say('muted', 'Lien Grist reconnu. Clique sur « Relier et tester ».');
    else say('ko-t', 'Je ne reconnais pas ce lien : colle le lien du formulaire Grist publié (…/forms/…/…) ou le lien prérempli d\'un formulaire Google.');
  };
  fTest.addEventListener('click', async () => {
    const pg = parseGristUrl(fInp.value); if (!pg) return;
    fTest.disabled = true; say('muted', '⏳ Lecture du formulaire Grist…');
    let st;
    try { st = await gristStructure(pg); }
    catch (e) {
      saveG({ ...pg }); fTest.disabled = false; showForm(); fUse.checked = true; update();
      say('warn-t', `⚠ Grist ne laisse pas ce site lire le formulaire (${esc(e.message)}). <b>Plan B activé</b> : à la fin du devoir, l'élève aura un lien vers ton formulaire pour y recopier son code ; tu vérifieras ensuite tous les codes dans la partie 3. Si tu déplaces le site (sur la Forge par exemple), clique à nouveau sur « Relier et tester » depuis la nouvelle adresse.`);
      return;
    }
    const missing = GRIST_WANT.filter((w, i) => !st.cols[i]);
    if (!st.t || missing.length) { fTest.disabled = false; say('ko-t', `Il manque des champs dans ton formulaire : ${missing.map((w) => FORM_FIELDS[GRIST_WANT.indexOf(w)]).join(', ')}. Ajoute-les (avec ces noms exacts), publie à nouveau, puis reteste.`); return; }
    const g = { ...pg, t: st.t, c: st.cols };
    say('muted', '⏳ Envoi d\'une ligne d\'essai…');
    try { await gristSend(g, ['TEST', '—', '', 'Test de liaison du site', '', 'envoyé ' + nowStr()]); saveG(g); say('ok-t', '✔ Ça marche ! Une ligne « TEST » vient d\'arriver dans ta table Grist (tu peux la supprimer). Les liens de devoir enverront désormais les résultats automatiquement.'); }
    catch (e) { saveG({ ...pg }); say('warn-t', `⚠ Grist a refusé la ligne d'essai (${esc(e.message)}). <b>Plan B activé</b> : l'élève aura un lien vers ton formulaire pour y recopier son code.`); }
    fTest.disabled = false; fUse.disabled = false; fUse.checked = true; update();
    if (!fSt.className.includes('ok-t') && !fSt.className.includes('warn-t')) showForm();
  });
  window.profExtra = () => {
    let x = '';
    const c = (clInp.value || '').trim().replace(/\//g, '-').replace(/,/g, ' ');
    if (c) x += '/c=' + encodeURIComponent(c);
    if (document.getElementById('prof-once').checked) x += '/u';
    const d = destSeg();
    if (d && fUse.checked) x += d;
    return x;
  };
  try { fInp.value = localStorage.getItem(FKEY) || ''; } catch (e) { /* rien */ }
  fUse.checked = !!destSeg();
  fInp.addEventListener('input', () => { try { localStorage.setItem(FKEY, fInp.value.trim()); } catch (e) { /* rien */ } fUse.checked = !!destSeg(); showForm(); update(); });
  // Liste des classes du professeur (menu déroulant)
  const CKEY = 'revisions6e-classes', CLAST = 'revisions6e-classe-choisie';
  const clBox = document.getElementById('prof-classes-box'), clList = document.getElementById('prof-classes-list');
  const getClasses = () => { try { return (localStorage.getItem(CKEY) || '').split('\n').map((x) => x.trim()).filter(Boolean); } catch (e) { return []; } };
  const fillClasses = () => {
    const cl = getClasses(); let last = ''; try { last = localStorage.getItem(CLAST) || ''; } catch (e) { /* rien */ }
    clInp.innerHTML = `<option value="">${cl.length ? '— sans classe —' : '— ajoute tes classes avec ✏️ —'}</option>` + cl.map((c) => `<option${c === last ? ' selected' : ''}>${esc(c)}</option>`).join('');
  };
  fillClasses();
  if (!getClasses().length) clBox.hidden = false;
  document.getElementById('prof-classes-edit').addEventListener('click', () => { clList.value = getClasses().join('\n'); clBox.hidden = !clBox.hidden; if (!clBox.hidden) clList.focus(); });
  document.getElementById('prof-classes-save').addEventListener('click', () => {
    const cl = [...new Set(clList.value.split('\n').map((x) => x.trim()).filter(Boolean))];
    try { localStorage.setItem(CKEY, cl.join('\n')); } catch (e) { /* rien */ }
    clBox.hidden = true; fillClasses(); update();
  });
  clInp.addEventListener('change', () => { try { localStorage.setItem(CLAST, clInp.value); } catch (e) { /* rien */ } update(); });
  document.getElementById('prof-once').addEventListener('change', update);
  fUse.addEventListener('change', update);
  showForm();
  const copy = async (txt, btn) => {
    try { await navigator.clipboard.writeText(txt); } catch (e) { out.value = txt; out.select(); try { document.execCommand('copy'); } catch (_) { /* rien */ } }
    const old = btn.textContent; btn.textContent = '✔ Copié'; setTimeout(() => { btn.textContent = old; }, 1500);
  };
  host.addEventListener('click', (e) => {
    const fold = e.target.closest('.prof-fold');
    if (fold) {
      const fs = fold.closest('fieldset'); fs.classList.toggle('folded'); fold.setAttribute('aria-expanded', String(!fs.classList.contains('folded')));
      try { const f = JSON.parse(localStorage.getItem('revisions6e-prof-plie') || 'null') || {}; f[fs.dataset.ch] = fs.classList.contains('folded'); localStorage.setItem('revisions6e-prof-plie', JSON.stringify(f)); } catch (_) { /* rien */ }
      return;
    }
    const all = e.target.closest('.prof-all');
    if (all) { const fs = all.closest('fieldset'), cbs = [...fs.querySelectorAll('input')], on = !cbs.every((c) => c.checked); cbs.forEach((c) => { c.checked = on; }); update(); return; }
    const one = e.target.closest('.prof-one');
    if (one) { e.preventDefault(); copy(siteURL() + devoirHash([one.dataset.k], nSel.value, profExtra()), one); noteGiven([one.dataset.k], nSel.value); return; }
    const cp = e.target.closest('.prof-copy');
    if (cp) copy(cp.dataset.url, cp);
  });
  /* Devoir donné : quand le lien est copié pour une classe, une ligne DONNE-n part dans Grist (formulaire en mode automatique).
     Le widget « Mes devoirs » sait ainsi ce qui a été donné à chaque classe, et qui ne l'a pas encore fait, dès le premier jour. */
  const givenSt = document.getElementById('prof-given');
  const noteGiven = (keys, n) => {
    const dest = typeof profDest === 'function' ? profDest() : null, raw = (clInp.value || '').trim();
    if (!dest?.send || !fUse.checked || !raw || !keys.length) return;
    let sent = {}; try { sent = JSON.parse(localStorage.getItem('revisions6e-donnes') || '{}'); } catch (e) { sent = {}; }
    const d = new Date(), label = devoirLabel(keys), done = [];
    raw.split(',').map((x) => x.trim()).filter(Boolean).forEach((c) => {
      const k = `${normName(c)}|${label}|${n}`;
      if (sent[k] && d.getTime() - sent[k] < 3 * 864e5) { done.push(c); return; } // déjà noté ces 3 derniers jours
      sent[k] = d.getTime();
      dest.send(['(devoir donné)', `DONNE-${n}`, c, label, '', `donné ${nowStr(d)} · t=${d.getTime()}`])
        .then(() => { if (givenSt) { givenSt.className = 'small ok-t'; givenSt.textContent = `📌 Noté dans Grist : devoir donné à ${raw}.`; } })
        .catch(() => { delete sent[k]; try { localStorage.setItem('revisions6e-donnes', JSON.stringify(sent)); } catch (e) { /* rien */ } });
    });
    try { localStorage.setItem('revisions6e-donnes', JSON.stringify(sent)); } catch (e) { /* rien */ }
    if (givenSt && done.length) { givenSt.className = 'small muted'; givenSt.textContent = `📌 Déjà noté dans Grist pour ${done.join(', ')}.`; }
  };
  document.getElementById('prof-copy-link').addEventListener('click', (e) => { if (out.value) { copy(out.value, e.currentTarget); noteGiven(sel(), nSel.value); } });
  document.getElementById('prof-relock').addEventListener('click', () => { try { localStorage.removeItem(PROF_KEY); localStorage.removeItem('revisions6e-grist-key'); } catch (e) { /* rien */ } document.getElementById('gr-key').value = ''; document.getElementById('bilan-in').value = ''; document.getElementById('bilan-out').innerHTML = ''; renderProfLock(); });
  // Bilan des résultats (lignes copiées depuis Grist ou Google Sheets)
  setupBilan();
  const wUrl = siteURL().replace(/index\.html$/, '').replace(/\/?$/, '/') + 'bilan.html';
  document.getElementById('widget-url').textContent = wUrl;
  document.getElementById('widget-copy').addEventListener('click', (e) => copy(wUrl, e.currentTarget));
  // Bouton « Voir le bilan » : lien de la page Grist qui contient le widget
  const bl = document.getElementById('bilan-link'), bRow = document.getElementById('bilan-open-row'), bBtn = document.getElementById('bilan-open');
  const showBL = () => { const u = bl.value.trim(); const ok = /^https:\/\/\S+$/.test(u); bRow.hidden = !ok; if (ok) bBtn.href = u; };
  try { bl.value = localStorage.getItem('revisions6e-bilan-link') || ''; } catch (e) { /* rien */ }
  bl.addEventListener('input', () => { try { localStorage.setItem('revisions6e-bilan-link', bl.value.trim()); } catch (e) { /* rien */ } showBL(); });
  showBL();
  setupControles();
  update();
}

/* ---------- Bilan : une ligne par élève, à partir des lignes copiées ---------- */
const CODE_CELL = /^[0-9A-Za-z]{4}-?[0-9A-Za-z]{5}-?[0-9A-Za-z]{5}$/;
/** devoir déclaré « fait sur papier » : la colonne Code contient PAPIER-<nombre de questions> */
const PAPER_CELL = /^PAPIER-(\d+)$/;
/** Lit des lignes copiées (Grist : Prénom, Code, Classe, Devoir, Score, Détail ; Google Sheets : horodatage en plus ; ou « Prénom CODE ») */
function parseResultRows(text) {
  const rows = [];
  for (const line of String(text).split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = line.split('\t').map((x) => x.trim());
    const pi = cells.findIndex((x) => PAPER_CELL.test(x));
    if (pi > 0) { rows.push({ name: cells[pi - 1] || '', classe: cells[pi + 1] || '', devoir: cells[pi + 2] || '', paper: Number(cells[pi].match(PAPER_CELL)[1]), valid: false, nameOk: false }); continue; }
    const ci = cells.findIndex((x) => CODE_CELL.test(x));
    let codeStr, name, classe = '', devoir = '';
    if (ci >= 0) { codeStr = cells[ci]; name = cells[ci - 1] || ''; classe = cells[ci + 1] || ''; devoir = cells[ci + 2] || ''; }
    else {
      const m = line.match(/([0-9A-Za-z]{4})[\s-]*([0-9A-Za-z]{5})[\s-]*([0-9A-Za-z]{5})\s*$/);
      if (!m) continue;
      codeStr = m[1] + m[2] + m[3]; name = line.slice(0, m.index).replace(/[:;,\-–\t]+\s*$/, '').trim();
    }
    const r = readCode(codeStr);
    const valid = !!r && !r.invalid;
    rows.push({ name, classe, devoir, code: codeStr, r: valid ? r : null, valid, nameOk: valid && !!normName(name) && h8(normName(name)) === r.name });
  }
  return rows;
}
/** Regroupe par devoir puis par élève (les devoirs « sur papier » sont gardés à part, à vérifier) */
function buildBilan(rows) {
  const ok = rows.filter((x) => (x.valid && x.nameOk) || x.paper);
  const devoirs = {};
  for (const x of ok) {
    const n = x.paper || x.r.n;
    const dk = `${x.devoir || 'Devoir'} — ${n} questions`;
    const D = devoirs[dk] || (devoirs[dk] = { label: dk, n, students: {}, last: 0 });
    if (!x.paper) D.last = Math.max(D.last, x.r.time);
    const sk = `${normName(x.classe)}|${normName(x.name)}`;
    const S = D.students[sk] || (D.students[sk] = { name: x.name, classe: x.classe, tries: [], paper: false });
    if (x.paper) S.paper = true; else S.tries.push(x.r);
  }
  for (const D of Object.values(devoirs)) {
    for (const S of Object.values(D.students)) {
      if (!S.tries.length) continue;
      S.tries.sort((p, q) => p.time - q.time);
      S.first = S.tries[0]; S.lastT = S.tries[S.tries.length - 1];
      S.best = S.tries.reduce((m, t) => (t.good > m.good || (t.good === m.good && t.helped < m.helped) ? t : m), S.tries[0]);
    }
  }
  return { devoirs: Object.values(devoirs).sort((p, q) => q.last - p.last), suspects: rows.filter((x) => !x.paper && (!x.valid || !x.nameOk)) };
}
/** Le prénom de la liste correspond-il au nom tapé par l'élève ? « Léa M. » = « Léa Martin » = « léa » (même prénom, initiale compatible) */
function sameStudent(listName, typed) {
  const tok = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-']/g, '').replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const a = tok(listName), b = tok(typed);
  if (!a.length || !b.length) return false;
  if (a.join('') === b.join('')) return true;
  if (a[0] !== b[0]) return false;
  const ra = a.slice(1).join(''), rb = b.slice(1).join('');
  return !ra || !rb || ra.startsWith(rb) || rb.startsWith(ra);
}
const ROSTER_KEY = (c) => 'revisions6e-liste-' + normName(c || 'sans');
function setupBilan() {
  const ta = document.getElementById('bilan-in'), out = document.getElementById('bilan-out');
  let data = null, fDevoir = '', fClasse = '', crit = 'best';
  const scoreCls = (g, n) => { const r = g / n; return r >= 0.8 ? 'sc-ok' : r >= 0.5 ? 'sc-mid' : 'sc-ko'; };
  const pick2 = (S) => (crit === 'first' ? S.first : crit === 'last' ? S.lastT : S.best);
  function render() {
    if (!data) { out.innerHTML = ''; return; }
    const { devoirs, suspects } = data;
    if (!devoirs.length && !suspects.length) { out.innerHTML = '<p class="small ko-t">Je ne trouve aucun code dans ce que tu as collé. Copie bien les lignes de ta table (avec la colonne Code).</p>'; return; }
    let mine = []; try { mine = (localStorage.getItem('revisions6e-classes') || '').split('\n').map((x) => x.trim()); } catch (e) { /* rien */ }
    const classes = [...new Set([...devoirs.flatMap((D) => Object.values(D.students).map((S) => S.classe)), ...mine].filter(Boolean))].sort((p, q) => p.localeCompare(q, 'fr'));
    if (fDevoir && !devoirs.some((D) => D.label === fDevoir)) fDevoir = '';
    const D = devoirs.find((x) => x.label === fDevoir) || devoirs[0];
    if (D) fDevoir = D.label;
    let html = `<div class="bilan-filters">
      <label>Devoir : <select id="bf-dev">${devoirs.map((x) => `<option${x.label === fDevoir ? ' selected' : ''}>${esc(x.label)}</option>`).join('')}</select></label>
      <label>Classe : <select id="bf-cl"><option value="">Toutes</option>${classes.map((c) => `<option${c === fClasse ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
      <label>Score retenu : <select id="bf-crit"><option value="best"${crit === 'best' ? ' selected' : ''}>le meilleur essai</option><option value="first"${crit === 'first' ? ' selected' : ''}>le premier essai</option><option value="last"${crit === 'last' ? ' selected' : ''}>le dernier essai</option></select></label>
    </div>`;
    if (D) {
      const studs = Object.values(D.students).filter((S) => !fClasse || S.classe === fClasse).sort((p, q) => p.name.localeCompare(q.name, 'fr'));
      const online = studs.filter((S) => S.tries.length), paperOnly = studs.filter((S) => !S.tries.length);
      const sc = online.map((S) => pick2(S));
      const avg = sc.length ? sc.reduce((m, t) => m + t.good, 0) / sc.length : 0;
      const low = online.filter((S) => pick2(S).good / D.n < 0.5);
      html += `<p class="bilan-sum"><b>${online.length}</b> élève${online.length > 1 ? 's ont' : ' a'} fait ce devoir en ligne${fClasse ? ` en ${esc(fClasse)}` : ''}${online.length ? ` · moyenne <b>${fmt(Math.round(avg * 10) / 10)} / ${D.n}</b>` : ''}${low.length ? ` · <span class="ko-t">${low.length} sous la moitié</span>` : ''}${paperOnly.length ? ` · <span class="warn-t">📝 ${paperOnly.length} sur papier, à vérifier</span>` : ''}</p>`;
      html += `<div class="table-wrap"><table class="voc res-tab bilan"><thead><tr><th>Élève</th><th>Classe</th><th>Score retenu</th><th>Aide</th><th>Essais</th><th>Meilleur</th><th>Dernier envoi</th></tr></thead><tbody>${studs.map((S) => {
        const t = pick2(S);
        if (!S.tries.length) return `<tr class="paper-row"><td><b>${esc(S.name)}</b></td><td>${esc(S.classe || '—')}</td><td colspan="5"><span class="sc sc-paper">📝 Sur papier — à vérifier</span></td></tr>`;
        return `<tr><td><b>${esc(S.name)}</b></td><td>${esc(S.classe || '—')}</td><td><span class="sc ${scoreCls(t.good, D.n)}">${t.good} / ${D.n}</span>${S.paper ? ' <span class="small muted">+ papier</span>' : ''}</td><td>${t.helped ? `${t.helped} avec aide` : 'sans aide'}</td><td>${S.tries.length}</td><td>${S.best.good} / ${D.n}</td><td>${nowStr(new Date(S.lastT.time)).replace(/^le /, '')}</td></tr>`;
      }).join('')}</tbody></table></div>`;
      // Liste de classe : qui n'a pas fait le devoir ?
      if (fClasse) {
        let roster = ''; try { roster = localStorage.getItem(ROSTER_KEY(fClasse)) || ''; } catch (e) { /* rien */ }
        const names = roster.split(/\n+/).map((x) => x.trim()).filter(Boolean);
        const missing = names.filter((x) => !studs.some((S) => sameStudent(x, S.name)));
        html += `<div class="bilan-roster"><p>${names.length ? (missing.length ? `<b class="ko-t">Pas encore fait (${missing.length}) :</b> ${missing.map(esc).join(', ')}` : '<b class="ok-t">✔ Toute la classe a fait le devoir.</b>') : `Colle la liste des prénoms de la ${esc(fClasse)} pour voir qui n'a pas encore fait le devoir :`}</p>
          <details${names.length ? '' : ' open'}><summary class="small">Liste des élèves de ${esc(fClasse)} (un prénom par ligne, à coller une seule fois : elle sert pour tous les devoirs, sur cet appareil)</summary><textarea id="bf-roster" rows="5">${esc(roster)}</textarea></details></div>`;
      } else html += '<p class="small muted">Choisis une classe pour voir aussi qui n\'a pas encore fait le devoir.</p>';
      html += `<p><button type="button" class="btn" id="bf-copy">Copier ce bilan</button> <span class="small muted">(à coller dans un tableur ou pour Pronote)</span></p>`;
    }
    if (suspects.length) html += `<div class="bilan-sus"><p><b class="warn-t">⚠ ${suspects.length} ligne${suspects.length > 1 ? 's' : ''} à vérifier</b> <span class="small muted">(non comptée${suspects.length > 1 ? 's' : ''} dans le bilan)</span></p><ul class="small">${suspects.map((x) => `<li><b>${esc(x.name || '—')}</b> ${x.classe ? `(${esc(x.classe)})` : ''} : ${!x.valid ? `code « ${esc(x.code)} » non valide (erreur de recopie ou code inventé)` : 'ce code a été obtenu avec un autre prénom'}</li>`).join('')}</ul></div>`;
    out.innerHTML = html;
    out.querySelector('#bf-dev')?.addEventListener('change', (e) => { fDevoir = e.target.value; render(); });
    out.querySelector('#bf-cl')?.addEventListener('change', (e) => { fClasse = e.target.value; render(); });
    out.querySelector('#bf-crit')?.addEventListener('change', (e) => { crit = e.target.value; render(); });
    out.querySelector('#bf-roster')?.addEventListener('change', (e) => { try { localStorage.setItem(ROSTER_KEY(fClasse), e.target.value); } catch (_) { /* rien */ } render(); });
    out.querySelector('#bf-copy')?.addEventListener('click', async (e) => {
      const studs = Object.values(D.students).filter((S) => !fClasse || S.classe === fClasse).sort((p, q) => p.name.localeCompare(q.name, 'fr'));
      const tsv = ['Élève\tClasse\tScore\tSur\tAide\tEssais', ...studs.map((S) => { const t = pick2(S); return t ? `${S.name}\t${S.classe}\t${t.good}\t${D.n}\t${t.helped}\t${S.tries.length}` : `${S.name}\t${S.classe}\tpapier (à vérifier)\t${D.n}\t\t0`; })].join('\n');
      try { await navigator.clipboard.writeText(tsv); e.target.textContent = '✔ Copié'; } catch (_) { e.target.textContent = 'Copie impossible'; }
    });
  }
  const run = () => { data = ta.value.trim() ? buildBilan(parseResultRows(ta.value)) : null; render(); };
  ta.addEventListener('input', run);
  // Chargement automatique depuis Grist (clé API du professeur, gardée sur cet appareil)
  const DKEY = 'revisions6e-grist-doc', AKEY = 'revisions6e-grist-key', GKEY2 = 'revisions6e-grist';
  const dIn = document.getElementById('gr-doc'), kIn = document.getElementById('gr-key'), gSt = document.getElementById('gr-status'), gGo = document.getElementById('gr-load'), gForget = document.getElementById('gr-forget');
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) { return ''; } return ''; };
  const parseDoc = (u) => { const m = String(u).trim().match(/^(https:\/\/[^\s?#]+?)\/(?:o\/[^/]+\/)?([A-Za-z0-9]{10,})(?:\/|$|\?|#)/); if (!m) return null; const base = String(u).trim().match(/^(https:\/\/[^/]+(?:\/o\/[^/]+)?)/)[1]; return { a: base, d: m[2] }; };
  const gsay = (cls, h) => { gSt.className = 'gr-status ' + cls; gSt.innerHTML = h; };
  async function loadGrist() {
    const doc = parseDoc(dIn.value), key = kIn.value.trim();
    if (!doc) { gsay('ko-t', 'Colle le lien de ton <b>document</b> Grist (l\'adresse affichée quand la table est ouverte).'); return; }
    if (!key) { gsay('ko-t', 'Colle ta clé API Grist.'); return; }
    let g = null; try { g = JSON.parse(ls(GKEY2) || 'null'); } catch (e) { g = null; }
    const table = (g && g.t) || 'Resultats';
    const cols = (g && g.c && g.c.every(Boolean)) ? g.c : ['Prenom', 'Code', 'Classe', 'Devoir', 'Score', 'Detail'];
    gGo.disabled = true; gsay('muted', '⏳ Chargement des résultats depuis Grist…');
    try {
      const r = await fetch(`${doc.a}/api/docs/${doc.d}/tables/${encodeURIComponent(table)}/records`, { headers: { Authorization: 'Bearer ' + key } });
      if (r.status === 401 || r.status === 403) throw new Error('clé refusée');
      if (r.status === 404) throw new Error(`table « ${table} » introuvable dans ce document`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      const recs = j.records || [];
      ls(DKEY, dIn.value.trim()); ls(AKEY, key);
      ta.value = recs.map((x) => cols.map((c) => String(x.fields?.[c] ?? '').replace(/[\t\n]/g, ' ')).join('\t')).join('\n');
      run();
      gsay('ok-t', `✔ ${recs.length} ligne${recs.length > 1 ? 's' : ''} chargée${recs.length > 1 ? 's' : ''} depuis Grist ${nowStr()}. Le bilan se mettra à jour tout seul à chaque ouverture de cet espace.`);
      gForget.hidden = false;
    } catch (e) {
      const cors = e instanceof TypeError;
      if (cors) {
        // la clé ne peut pas servir depuis ce site : on ne la garde pas
        ls(AKEY, null); kIn.value = ''; gForget.hidden = true;
        const det = ta.closest('details'); if (det) det.open = true;
      }
      gsay('warn-t', cors ? '⚠ Grist ne laisse pas ce site lire tes données (réglage de sécurité du serveur). J\'ai effacé ta clé de cet appareil ; tu peux aussi la supprimer dans Grist (Paramètres du profil → Clé API). Utilise le copier-coller juste en dessous : <kbd>Ctrl</kbd>+<kbd>A</kbd> et <kbd>Ctrl</kbd>+<kbd>C</kbd> dans ta table Grist, puis <kbd>Ctrl</kbd>+<kbd>V</kbd> dans la zone.'
        : `⚠ Chargement impossible : ${esc(e.message)}. Vérifie le lien du document et la clé, ou utilise le copier-coller ci-dessous.`);
    }
    gGo.disabled = false;
  }
  dIn.value = ls(DKEY); kIn.value = ls(AKEY);
  gForget.hidden = !kIn.value;
  gGo.addEventListener('click', loadGrist);
  gForget.addEventListener('click', () => { ls(AKEY, null); kIn.value = ''; gForget.hidden = true; gsay('muted', 'Clé oubliée sur cet appareil.'); });
  window._bilanAuto = () => { if (dIn.value && kIn.value) loadGrist(); };
  window._bilanAuto();
  document.getElementById('bilan-clear').addEventListener('click', () => { ta.value = ''; run(); });
  window._bilanTest = { parseResultRows, buildBilan };
}

/* =========================================================
   Mode vidéoprojecteur : #/projo/clé1,clé2
   ========================================================= */
/** Affiche la correction d'une question sans réponse de l'élève */
function revealAnswer(cur, q) {
  if (cur.reveal) return cur.reveal(q); // opérations posées pour de vrai (poser.js)
  if (q.querySelector('.board')) return { anim: !!cur.anim, msg: cur.anim ? '' : 'Construction à faire au tableau.' };
  if (cur._correct !== undefined) {
    q.querySelector(`.rb[data-o="${cur._correct}"]`).checked = true;
    return cur.check(q);
  }
  if (cur._items) {
    q.querySelectorAll('.cb').forEach((c, j) => { c.checked = cur._items[j].ok; });
    return cur.check(q);
  }
  if (cur._rb !== undefined) { const rb = q.querySelector(`.rb[data-o="${cur._rb}"]`); if (rb) rb.checked = true; }
  q.querySelectorAll('.ans').forEach((i) => { if (!i.value) i.value = i.classList.contains('frac') ? '1/10' : '0'; });
  const z = q.querySelector('.zbtn:not(.on), .gap:not(.on)'); if (z) z.click();
  q.querySelectorAll('.ordbtn').forEach((b) => b.click());
  const nl = q.querySelector('.nl'); if (nl && q.querySelector('.hit') && nl.dataset.sel === undefined) nl.dataset.sel = '-1';
  const res = cur.check(q) || { msg: '' };
  q.querySelectorAll('.ans').forEach((i) => { i.value = ''; i.classList.remove('wrong', 'right'); i.placeholder = '?'; });
  q.querySelectorAll('.bad, .on, .sel').forEach((e) => { if (!e.classList.contains('good')) e.classList.remove('bad', 'on', 'sel'); });
  q.querySelectorAll('.rk').forEach((e) => { e.textContent = ''; });
  const out = q.querySelector('.ord-out'); if (out) out.innerHTML = '';
  return res;
}
/** Réponse courte et bien visible pour le vidéoprojecteur ; remplit aussi les cases avec la bonne réponse si on peut la vérifier */
function projoShortAnswer(cur, q, res) {
  try {
    if (cur._correct !== undefined) { const t = document.createElement('div'); t.innerHTML = cur._opts[cur._correct]; return t.querySelector('svg, .p2-pose') ? '' : t.innerHTML; }
    if (cur._items) { const ok = cur._items.filter((it) => it.ok); return ok.every((it) => !/<svg/.test(it.html)) ? ok.map((it) => it.html).join(' &nbsp;·&nbsp; ') : ''; }
    const ins = [...q.querySelectorAll('.ans')];
    if (!ins.length || !res || !res.msg) return '';
    let vals = [];
    if (ins.length === 1) {
      const nums = [...res.msg.matchAll(/<b>([^<]*)<\/b>/g)].map((m) => { const x = m[1].replace(/[\s\u202f\u00a0]/g, '').match(/-?\d+(,\d+)?(\/\d+)?/); return x && x[0]; }).filter(Boolean);
      vals = nums.length ? [nums[nums.length - 1]] : [];
    } else vals = [...res.msg.matchAll(/<li>[^<]*=\s*([\d\s\u202f,]+)/g)].map((m) => m[1].replace(/[\s\u202f]/g, ''));
    if (vals.length !== ins.length) return '';
    // on vérifie sur une copie que ces valeurs sont bien acceptées
    const box = document.createElement('div'); box.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px';
    document.body.appendChild(box); box.innerHTML = cur.q; if (cur.mount) cur.mount(box);
    [...box.querySelectorAll('.ans')].forEach((i, j) => { i.value = vals[j]; });
    const chk = cur.check(box); box.remove();
    if (!chk || !chk.ok) return '';
    ins.forEach((i, j) => { i.value = vals[j]; i.classList.add('right'); });
    const last = ins[ins.length - 1], after = (last.nextSibling && last.nextSibling.nodeType === 3 ? last.nextSibling.textContent : '').trim().split(/\s/)[0];
    const unit = /^(°|cm|m|€|mm|km)$/.test(after) ? (after === '°' ? '°' : ' ' + after) : '';
    return vals[vals.length - 1] + unit;
  } catch (e) { return ''; }
}
let projo = null;
function routeProjo(spec) {
  const keys = (spec || '').split(',').filter((k) => GENS[k]);
  const page = document.querySelector('.page[data-p="projo"]');
  if (projo && projo.spec === spec) return keys.length ? GENS[keys[0]].ch : '';
  if (projo) projo.stop();
  const stage = page.querySelector('.projo-stage');
  if (!keys.length) { stage.innerHTML = '<p class="lead">Aucune notion choisie. Passe par l\'<a href="#/prof">Espace professeur</a>.</p>'; projo = null; return ''; }
  stage.innerHTML = `<div class="pj-bar">
      <span class="pj-tag"></span><span class="pj-count"></span><span class="pj-timer" aria-live="polite"></span>
      <span class="sep"></span>
      <select class="pj-time" aria-label="Minuteur"><option value="0">Sans minuteur</option><option value="30">30 s</option><option value="60">1 min</option><option value="90">1 min 30</option><option value="120">2 min</option></select>
      <button type="button" class="btn pj-full" title="Plein écran (F)">⛶ Plein écran</button>
      <a class="btn" href="#/prof" title="Quitter">✕</a>
    </div>
    <div class="pj-layout">
      <div class="pj-main"><div class="ex-q pj-q"></div></div>
      <aside class="pj-side">
        <div class="pj-answer" aria-live="polite"></div>
        <div class="ex-fb pj-fb"></div>
        <div class="ex-anim pj-anim"></div>
        <div class="ex-actions pj-actions">
          <button type="button" class="btn primary pj-reveal">👁 Afficher la réponse <kbd>R</kbd></button>
          <button type="button" class="btn pj-next">Question suivante <kbd>→</kbd></button>
        </div>
      </aside>
    </div>`;
  const $ = (s) => stage.querySelector(s);
  let cur = null, n = 0, last = null, t0 = 0, tick = null, revealed = false;
  const timeSel = $('.pj-time');
  try { timeSel.value = localStorage.getItem('revisions6e-projo-t') || '0'; } catch (e) { /* rien */ }
  function timer() {
    clearInterval(tick); const T = Number(timeSel.value); const el = $('.pj-timer');
    if (!T) { el.textContent = ''; el.className = 'pj-timer'; return; }
    t0 = Date.now();
    const upd = () => { const r = Math.max(0, T - Math.floor((Date.now() - t0) / 1000)); el.textContent = r ? `⏱ ${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}` : '⏰ Temps écoulé'; el.className = 'pj-timer' + (r <= 10 ? ' hot' : ''); if (!r) clearInterval(tick); };
    upd(); tick = setInterval(upd, 250);
  }
  function next() {
    const choices = keys.length > 1 ? keys.filter((k) => k !== last) : keys;
    last = pick(choices); n++;
    cur = wrapGen(last, false);
    revealed = false;
    $('.pj-tag').textContent = GENS[last].label; $('.pj-count').textContent = `Question ${n}`;
    $('.pj-q').innerHTML = cur.q; if (cur.mount) cur.mount($('.pj-q'));
    $('.pj-fb').className = 'ex-fb pj-fb'; $('.pj-fb').innerHTML = ''; $('.pj-anim').innerHTML = '';
    $('.pj-answer').className = 'pj-answer wait'; $('.pj-answer').innerHTML = '<p class="pj-wait">À vous de chercher…</p>';
    $('.pj-reveal').disabled = false; $('.pj-reveal').hidden = false;
    timer();
  }
  function reveal() {
    if (revealed) return; revealed = true;
    clearInterval(tick);
    const res = revealAnswer(cur, $('.pj-q'));
    const short = projoShortAnswer(cur, $('.pj-q'), res);
    $('.pj-q').querySelectorAll('input').forEach((i) => { i.disabled = true; });
    $('.pj-q').closest('.page').classList.add('done');
    $('.pj-answer').className = 'pj-answer';
    $('.pj-answer').innerHTML = short ? `<p class="pj-kicker">Réponse</p><p class="pj-big">${short}</p>` : res.anim ? '<p class="pj-kicker">Correction</p><p class="pj-mid">Regardez la construction :</p>' : (cur._correct !== undefined || cur._items) ? '<p class="pj-kicker">Réponse</p><p class="pj-mid">La bonne réponse est entourée en vert.</p>' : '';
    if (res.msg) { $('.pj-fb').className = 'ex-fb pj-fb pj-expl'; $('.pj-fb').innerHTML = res.msg; }
    if (res.anim) makePlayer($('.pj-anim'), cur.anim()).play();
    $('.pj-reveal').hidden = true;
  }
  const nextQ = () => { $('.pj-q').closest('.page').classList.remove('done'); next(); };
  $('.pj-reveal').addEventListener('click', reveal);
  $('.pj-next').addEventListener('click', nextQ);
  timeSel.addEventListener('change', () => { try { localStorage.setItem('revisions6e-projo-t', timeSel.value); } catch (e) { /* rien */ } if (!revealed) timer(); });
  const full = () => { if (document.fullscreenElement) document.exitFullscreen?.(); else document.documentElement.requestFullscreen?.(); };
  $('.pj-full').addEventListener('click', full);
  const onKey = (e) => {
    if (!page.classList.contains('active') || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); reveal(); }
    else if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') { e.preventDefault(); nextQ(); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); full(); }
  };
  document.addEventListener('keydown', onKey);
  projo = { spec, stop() { clearInterval(tick); document.removeEventListener('keydown', onKey); } };
  next();
  return GENS[keys[0]].ch;
}

/* =========================================================
   Automatismes du jour : en priorité les points faibles,
   puis les notions déjà travaillées les moins réussies ou les plus anciennes
   ========================================================= */
const AUTO_N = 5, AUTO_WEAK = 3;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const dayDiff = (a, b) => Math.round((new Date(b.replace(/-/g, '/')) - new Date(a.replace(/-/g, '/'))) / 86400000);
function autoPlan() {
  const quick = Object.keys(GENS).filter((k) => !GENS[k].slow && !GENS[k].locked);
  const weak = shuffle(Object.keys(stats._weak || {}).filter((k) => quick.includes(k))).slice(0, AUTO_WEAK);
  const now = Date.now();
  const practiced = quick.filter((k) => stats[k]?.total && !weak.includes(k));
  const score = (k) => { const s = stats[k]; const rate = s.ok / s.total; const age = Math.min(14, (now - (s.last || 0)) / 86400000); return (1 - rate) * 2 + age / 7 + Math.random() * 0.6; };
  const rev = practiced.sort((a, b) => score(b) - score(a)).slice(0, AUTO_N - weak.length);
  const plan = [...weak.map((k) => ({ k, why: 'weak' })), ...rev.map((k) => ({ k, why: 'rev' }))];
  if (plan.length < AUTO_N) {
    const seenCh = new Set(Object.keys(stats).filter((k) => GENS[k] && stats[k].total).map((k) => GENS[k].ch));
    if (!seenCh.size) seenCh.add(CHAPTERS[0].id);
    const pool = shuffle(quick.filter((k) => seenCh.has(GENS[k].ch) && !plan.some((p) => p.k === k)));
    while (plan.length < AUTO_N && pool.length) plan.push({ k: pool.shift(), why: 'new' });
  }
  return shuffle(plan);
}
function autoStatus() {
  const a = stats._auto || {};
  const t = today();
  const done = a.last === t;
  const alive = a.last && dayDiff(a.last, t) <= 1;
  return { done, streak: alive ? a.streak || 0 : 0 };
}
function renderAutoCard() {
  const el = document.getElementById('auto-card'); if (!el) return;
  const { done, streak } = autoStatus();
  const nWeak = Object.keys(stats._weak || {}).filter((k) => GENS[k] && !GENS[k].slow).length;
  el.innerHTML = `<a class="auto-card${done ? ' done' : ''}" href="#/auto">
    <span class="auto-ico">⚡</span>
    <span class="auto-txt"><b>Automatismes du jour</b><br><span class="small">${AUTO_N} questions rapides pour ne rien oublier${nWeak ? ` — en priorité tes ${nWeak} point${nWeak > 1 ? 's' : ''} faible${nWeak > 1 ? 's' : ''}` : ''}.</span></span>
    <span class="auto-st">${done ? '✔ Fait aujourd\'hui' : 'À faire'}${streak ? `<br><span class="small">🔥 ${streak} jour${streak > 1 ? 's' : ''} de suite</span>` : ''}</span></a>`;
}
let autoCtl = null;
function routeAuto() {
  const page = document.querySelector('.page[data-p="auto"]');
  const info = page.querySelector('.auto-info'), ex = page.querySelector('.auto-ex');
  let plan = autoPlan(), fixed = [];
  const describe = () => {
    const w = plan.filter((p) => p.why === 'weak').length, r = plan.length - w;
    info.innerHTML = `${w ? `<b>${w}</b> question${w > 1 ? 's' : ''} sur tes points faibles` : 'Aucun point faible en ce moment 🎉'}${r ? `, et <b>${r}</b> pour réviser des notions déjà travaillées` : ''}.
      ${plan.length ? '' : ''}<span class="small muted"> Les tracés (règle, compas…) restent dans « Mes erreurs » de chaque chapitre.</span>`;
  };
  describe();
  autoCtl = makeExercise(ex, null, {
    limit: plan.length,
    restartLabel: 'Encore 5 questions',
    onResult(k, ok, w, lab) { if (w === 'fixed') fixed.push(lab); },
    onRestart() { plan = autoPlan(); fixed = []; describe(); },
    summary({ good, limit, helpedCount }) {
      const a = stats._auto || (stats._auto = {});
      const t = today();
      if (a.last !== t) { a.streak = a.last && dayDiff(a.last, t) === 1 ? (a.streak || 0) + 1 : 1; a.last = t; }
      a.best = Math.max(a.best || 0, a.streak); persist();
      const left = Object.keys(stats._weak || {}).filter((k) => GENS[k]).length;
      return `<div class="result">
        <p class="note">${good} / ${limit}</p>
        <p>${good === limit ? 'Parfait !' : good >= limit - 1 ? 'Très bien !' : 'Continue, c\'est en répétant qu\'on retient.'}${helpedCount ? ` (${helpedCount} avec de l'aide)` : ''}</p>
        <p>🔥 Série : <b>${a.streak} jour${a.streak > 1 ? 's' : ''}</b> d'automatismes${a.best > a.streak ? ` (record : ${a.best})` : ''}.</p>
        ${fixed.length ? `<p class="weak-note fixed">✨ Point${fixed.length > 1 ? 's' : ''} faible${fixed.length > 1 ? 's' : ''} corrigé${fixed.length > 1 ? 's' : ''} : ${fixed.join(', ')}</p>` : ''}
        {{LIST}}
        ${left ? `<p class="small">Il te reste ${left} point${left > 1 ? 's' : ''} faible${left > 1 ? 's' : ''} : ils reviendront demain.</p>` : ''}
        <p><a class="btn" href="#/">Retour à l'accueil</a></p></div>`;
    },
    makeGen() { let i = 0; return () => { const p = plan[i++] || plan[plan.length - 1]; return wrapGen(p.k); }; },
  });
}

/* =========================================================
   Navigation : #/chapitre/page, #/devoir/…, #/prof, #/projo/…, #/auto
   ========================================================= */
const WEAK_CTL = {};
function setChrome(ch, page, { pill = null, nav = '' } = {}) {
  document.querySelectorAll('.page').forEach((x) => x.classList.toggle('active', x === page));
  document.body.dataset.ch = ch || '';
  document.body.classList.toggle('projo-mode', page.dataset.p === 'projo');
  const chap = CHAPTERS.find((c) => c.id === ch);
  const elPill = document.getElementById('chap-pill');
  document.getElementById('logo-mark').innerHTML = chap ? chap.symbol : '<span>6<sup>e</sup></span>';
  elPill.hidden = !pill; if (pill) elPill.textContent = pill;
  document.getElementById('nav').innerHTML = nav;
}
function route() {
  stopSpeaking();
  let h = location.hash.replace(/^#\/?/, '');
  const special = (p, ch, title) => { setChrome(ch, document.querySelector(`.page[data-p="${p}"]`), { pill: 'Accueil' }); document.title = `${title} — Révisions 6e`; window.scrollTo(0, 0); };
  if (!h.startsWith('projo') && projo) { projo.stop(); projo = null; }
  if (h.startsWith('devoir/')) { const { ch } = routeDevoir(h.slice(7)); special('devoir', ch, 'Devoir'); return; }
  if (h === 'prof') { renderProfLock(); special('prof', '', 'Espace professeur'); return; }
  if (h.startsWith('projo')) { const ch = routeProjo(h.split('/')[1] || ''); special('projo', ch, 'Vidéoprojecteur'); return; }
  if (h === 'auto') { routeAuto(); special('auto', '', 'Automatismes du jour'); return; }
  if (h.startsWith('r/')) { const ch = routeRetour(h.slice(2)); special('retour', ch, 'Mon contrôle'); return; }
  if (h === 'accueil') h = '';
  let [ch, p] = h.split('/');
  if (!CHAPTERS.some((c) => c.id === ch && !c.locked)) { ch = ''; p = ''; }
  p = p || 'accueil';
  let page = document.querySelector(`.page[data-ch="${ch}"][data-p="${p}"]`);
  if (!page) { p = 'accueil'; page = document.querySelector(`.page[data-ch="${ch}"][data-p="accueil"]`); }
  const chap = CHAPTERS.find((c) => c.id === ch);
  if (chap) {
    const nWeak = weakKeys(ch).length;
    const nav = [...document.querySelectorAll(`.page[data-ch="${ch}"]`)].map((x) =>
      `<a href="#/${ch}/${x.dataset.p}"${x === page ? ' aria-current="page"' : ''}${x.dataset.exam ? ' class="nav-exam"' : ''}>${x.dataset.title}${x.dataset.p === 'erreurs' && nWeak ? ` <span class="count">${nWeak}</span>` : ''}</a>`).join('');
    setChrome(ch, page, { pill: `Chapitre ${chap.num} · ${chap.title}`, nav });
    document.querySelector('#nav [aria-current]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
    document.title = `${chap.title} — Révisions 6e`;
  } else {
    setChrome('', page);
    document.title = 'Révisions 6e — Mathématiques';
  }
  if (!ch) { renderChapters(); renderAutoCard(); }
  else if (p === 'accueil') renderChapterHome(ch);
  else if (p === 'erreurs') WEAK_CTL[ch]?.renew();
  window.scrollTo(0, 0);
}

/* =========================================================
   Démarrage
   ========================================================= */
/** Prépare une question « mélangée » (contrôle blanc, mes erreurs, devoir) */
function wrapGen(k, tag = true, hard = false, prog = true) {
  const useHard = !!(hard && (prog ? ctlHard(k, 2) : GENS[k].hard));
  const o = prog ? progDraw(k, useHard) : GENS[k].f(useHard);
  o.key = k;
  o.label = GENS[k].label;
  if (tag) o.q = `<p class="tag">${useHard ? '★ ' : ''}${GENS[k].label}</p>` + o.q;
  return o;
}

/** Ce qui n'est pas dans la fiche du chapitre ne sort plus, nulle part sur le site.
    Seule exception : les contrôles papier créés avant cette règle (sans « g »), dont les sujets et les pages QR doivent rester identiques.
    - hardOut : aucune question ★ pour ce type
    - out : questions écartées, repérées dans leur texte
    ⚠ Les contrôles papier « g: 2 » sont recalculés avec ces règles : ne plus les modifier une fois ces contrôles distribués.
    Pour changer la liste, créer PROG_RULES3 et une génération « g: 3 » (les anciens contrôles garderaient celle-ci). */
const PROG_RULES = {
  'd-noms': { hardOut: true }, // les segments ne sont vus qu'au chapitre 3
  'o-voc': { hardOut: true }, // « l'opération faite en dernier » : programme de 5e
  'o-par2': { out: /× \(\d+ \+ \(\d+ ×/ },
  'a-nature': { out: /le double|bissectrice|supplémentaire|complémentaire/ },
  'a-mesure': { out: /aucun côté/ },
  'a-calcul': { out: /supplémentaire de son complémentaire|bissectrice/ },
  't-3cotes': { out: /Peut-on construire/ }, // l'inégalité triangulaire : programme de 5e
  't-voc': { out: /Combien de triangles|quel angle est opposé/ },
  't-nature': { out: /rectangle isocèle|= 60°/ },
  't-180': { out: /prolonge|bissectrice/ },
  't-natang': { out: /prolonge|rectangle isocèle/ },
};
/** Ce type peut-il avoir une question ★ ? g : génération de règles (absente pour un ancien contrôle papier) */
const ctlHard = (k, g) => !!GENS[k]?.hard && !(g && PROG_RULES[k]?.hardOut);
/** Tire une question en écartant ce qui n'est pas dans la fiche (sans autre hasard que Math.random : fonctionne aussi avec une graine) */
function progDraw(k, hard) {
  const out = PROG_RULES[k]?.out;
  if (!out) return GENS[k].f(hard);
  for (let i = 0; i < 300; i++) { const o = GENS[k].f(hard); if (!out.test(plain(o.q))) return o; }
  return GENS[k].f(false);
}

/** Entraînement : une série finie et progressive (d'abord les bases, puis les ★), au lieu d'un compteur sans fin.
    La série doit faire voir tous les mots et toutes les subtilités du programme, sans en sortir (voir PROG_RULES).
    Les règles ci-dessous ne concernent que l'entraînement. Les fonctions d'exercice ne changent pas (sujets papier recalculés à partir d'une graine).
    - noHard : pas de ★ dans la série (les questions de base couvrent déjà tout)
    - qcm : nombre de questions à choix permises dans une série de tracés (1 par défaut)
    - key : ce qui distingue deux questions, quand le texte seul ne suffit pas (sinon le texte, et _forme si la fonction en donne une) */
const TRAIN_EASY = 4, TRAIN_HARD = 2, TRAIN_SLOW = 3, TRAIN_TRIES = 120;
const TRAIN_RULES = {
  't-cercle': { qcm: 2 }, // tous les mots de la définition, et un tracé
  // les questions de base contiennent déjà tous les cas ; les ★ n'en reprennent qu'une partie, et en feraient manquer dans la série
  'n-zeros': { noHard: true }, 'e-placer': { noHard: true }, 'e-comparer': { noHard: true }, 'e-intercaler': { noHard: true },
  'n-lettres': { key: (t) => (t.match(/unités? et|dixièmes?|centièmes?|millièmes?/g) || []).join(' ') },
};
const TRAIN_NAMES = /^(?:[A-Z]{1,3}|Léa|Tom|Inès|Noah|Jade|Yanis|Emma|Lucas|Noa|Sacha|Camille|Alix)$/;
const trainNorm = (s) => s.replace(/\d+(?:[,. ]\d+)*/g, '#').replace(/\p{L}+/gu, (w) => (TRAIN_NAMES.test(w) ? 'X' : w)).toLowerCase();
const trainLen = (k) => (GENS[k].slow ? TRAIN_SLOW : TRAIN_EASY + (GENS[k].hard ? TRAIN_HARD : 0));
/** Tire les questions d'une série : à chaque fois, celle qui apporte une bonne réponse ou une forme de question pas encore vue */
function trainDraw(k) {
  const G0 = GENS[k], R = { ...PROG_RULES[k], ...TRAIN_RULES[k] }, seen = new Set();
  let n = 0, qcm = 0;
  return () => {
    n++;
    let hard = ctlHard(k, 2) && !R.noHard && n > TRAIN_EASY, best = null, bestScore = -1, bestKeys = [];
    for (let i = 0; i < TRAIN_TRIES && bestScore < 3; i++) {
      const o = G0.f(hard), text = plain(o.q);
      if (R.out?.test(text)) continue;
      // série de tracés : l'élève doit surtout tracer ; une seule question à choix, sauf règle contraire
      if (G0.slow && !o.q.includes('class="board"') && qcm >= (R.qcm ?? 1)) continue;
      const stem = plain(o.q.replace(/<div class="choices[\s\S]*$/, ''));
      const shape = `s:${R.key ? R.key(text) : trainNorm(stem)}|${o._forme || ''}`;
      const answer = o._opts && o._correct !== undefined ? `a:${trainNorm(plain(o._opts[o._correct]))}` : '';
      const score = (answer && !seen.has(answer) ? 2 : 0) + (seen.has(shape) ? 0 : 1);
      if (score > bestScore) { best = o; bestScore = score; bestKeys = [shape, answer]; }
      if (!seen.size) break; // première question : pas de choix à faire (le site en prépare une par exercice à l'ouverture)
    }
    if (!best) { hard = false; best = G0.f(false); }
    if (G0.slow && !best.q.includes('class="board"')) qcm++;
    bestKeys.filter(Boolean).forEach((x) => seen.add(x));
    return { hard, o: best };
  };
}
function trainGen(k) {
  const draw = trainDraw(k);
  return () => {
    const { hard, o } = draw();
    if (hard) o.q = '<p class="tag">★ Question plus difficile</p>' + o.q;
    return o;
  };
}
function trainSummary(k, { good, limit, helpedCount }) {
  const ch = GENS[k].ch, missed = limit - good;
  const msg = !missed ? `Tu as tout vu sur ce point${helpedCount ? '' : ', et sans aide'} : pas besoin d'aller plus loin. Passe à la suite !`
    : `Il reste ${missed} question${missed > 1 ? 's' : ''} à retravailler : ${missed > 1 ? 'elles t\'attendent' : 'elle t\'attend'} dans « Mes erreurs ».`;
  return `<div class="result"><p class="note">${good} / ${limit}</p><p><b>Série terminée.</b> ${msg}</p>{{LIST}}
    <p>${missed ? `<a class="btn primary" href="#/${ch}/erreurs">Retravailler mes erreurs →</a> ` : ''}<a class="btn${missed ? '' : ' primary'}" href="#/${ch}/controle">Faire le contrôle blanc →</a></p></div>`;
}

/** Contrôle blanc : chaque compétence une fois, les autres questions dans les compétences rapides en ★, et au moins 40 % de ★ */
const EXAM_N = 15, EXAM_HARD = 0.4;
function examPlan(keys) {
  const canHard = (k) => ctlHard(k, 2);
  const plan = shuffle([...keys]).slice(0, EXAM_N).map((k) => ({ k, hard: false }));
  const fast = keys.filter((k) => !GENS[k].slow), hardFast = fast.filter(canHard);
  let bag = shuffle([...(hardFast.length ? hardFast : fast.length ? fast : keys)]);
  while (plan.length < EXAM_N) {
    if (!bag.length) bag = shuffle([...(fast.length ? fast : keys)]);
    const k = bag.shift();
    plan.push({ k, hard: canHard(k) });
  }
  const missing = Math.ceil(EXAM_N * EXAM_HARD) - plan.filter((x) => x.hard).length;
  if (missing > 0) shuffle(plan.filter((x) => !x.hard && canHard(x.k))).slice(0, missing).forEach((x) => { x.hard = true; });
  return shuffle(plan);
}

document.addEventListener('DOMContentLoaded', () => {
  // Fichiers d'âges différents (cache du navigateur) : on prévient au lieu de laisser des boutons muets
  const vHtml = document.querySelector('meta[name="site-version"]')?.content;
  document.getElementById('site-version').textContent = 'version ' + SITE_VERSION;
  if (vHtml !== SITE_VERSION) {
    document.body.insertAdjacentHTML('afterbegin', `<div class="update-banner">🔄 Le site vient d'être mis à jour, mais ton navigateur garde une partie de l'ancienne version. Appuie sur <kbd>Ctrl</kbd>+<kbd>F5</kbd> (ou <kbd>Cmd</kbd>+<kbd>Maj</kbd>+<kbd>R</kbd> sur Mac). Si ce message revient, attends quelques minutes : GitHub met parfois un peu de temps à publier.</div>`);
  }
  // [[a|b]] -> fractions
  document.querySelectorAll('.page').forEach((el) => {
    if (el.innerHTML.includes('[[')) el.innerHTML = el.innerHTML.replace(/\[\[(.+?)\|(.+?)\]\]/g, (m, a, b) => F(a, b));
  });

  renderDroitesFiche();
  renderDec1Fiche();
  renderCercleFiche();
  renderDec2Fiche();

  // Lecture à voix haute des fiches
  if (CAN_SPEAK) {
    document.querySelectorAll('.page[data-p="fiche"] .card').forEach((card) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mini say'; b.textContent = '🔊 Écouter';
      b.title = 'Écouter cette partie de la fiche';
      card.querySelector('h2').appendChild(b);
      b.addEventListener('click', () => speak(speechText(card), b));
    });
  }

  // Exercices d'entraînement
  document.querySelectorAll('.exercise[data-gen]').forEach((el) => {
    const id = el.dataset.gen;
    makeExercise(el, null, {
      key: id, limit: trainLen(id),
      makeGen: () => trainGen(id),
      summary: (r) => trainSummary(id, r),
      restartLabel: 'Refaire une autre série',
    });
    el.querySelector('.ex-score').insertAdjacentHTML('beforebegin', '<button type="button" class="mini ex-paper" title="Obtenir ces exercices sur une feuille à imprimer ou en PDF">📄 PDF</button>');
    el.querySelector('.ex-paper').addEventListener('click', () => printTraining(id));
  });

  // Contrôles blancs : voir examPlan
  document.querySelectorAll('.exercise[data-exam]').forEach((el) => {
    const ch = el.dataset.exam;
    makeExercise(el, null, {
      limit: EXAM_N, exam: true, ch,
      examKey: ch + ':controle',
      makeGen() {
        let keys = Object.keys(GENS).filter((k) => GENS[k].ch === ch && !GENS[k].locked);
        if (!keys.length) keys = Object.keys(GENS).filter((k) => GENS[k].ch === ch);
        const queue = examPlan(keys);
        return () => { const x = queue.shift(); return x ? wrapGen(x.k, true, x.hard) : wrapGen(pick(keys)); };
      },
    });
  });

  // Mes erreurs : uniquement les types de questions ratés
  document.querySelectorAll('.exercise[data-weak]').forEach((el) => {
    const ch = el.dataset.weak;
    let last = null;
    WEAK_CTL[ch] = makeExercise(el, () => {
      const ks = weakKeys(ch);
      const sum = document.querySelector(`.page[data-ch="${ch}"][data-p="erreurs"] .weak-summary`);
      if (sum) sum.innerHTML = ks.length ? `<p><b>Tes points faibles :</b></p>${weakListHTML(ch)}` : '';
      if (!ks.length) {
        return { empty: true, q: `<div class="empty-state"><p class="big-emoji">🎉</p><p><b>Aucun point faible pour l'instant.</b></p><p>Quand tu rates une question, son type arrive ici. Il disparaît après ${NEED} réussites d'affilée sans indice.</p><p><a class="btn" href="#/${ch}/controle">Faire le contrôle blanc</a></p></div>` };
      }
      const choices = ks.length > 1 ? ks.filter((k) => k !== last) : ks;
      last = pick(choices);
      return wrapGen(last);
    }, { weakCh: ch });
  });

  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Effacer toute ta progression, dans tous les chapitres ?')) { stats = {}; persist(); route(); }
  });

  window.addEventListener('hashchange', route);
  route();
});

/* =========================================================
   Contrôles sur papier, évalués par compétences
   - le professeur coche des compétences (= types d'exercices du site) et colle sa liste d'élèves ;
   - le site imprime une feuille par élève (bande prénom à détacher + code anonyme), un corrigé,
     et un fichier texte pour la correction assistée par l'IA ;
   - après correction, il colle les niveaux (TB, MS, MF, MI) et imprime des étiquettes QR ;
   - le QR ouvre la page « Mon contrôle » (#/r/…) : corrigé de SON sujet, bilan, exercices de remédiation.
   Rien n'est stocké sur un serveur : le sujet est recréé à partir d'une « graine ».
   ========================================================= */
const CTL_STORE = 'revisions6e-controles', CTL_AMEN = 'revisions6e-amenages';
const LEVELS = ['TB', 'MS', 'MF', 'MI'];
const LEVEL_TXT = { TB: 'Très bonne maîtrise', MS: 'Maîtrise satisfaisante', MF: 'Maîtrise fragile', MI: 'Maîtrise insuffisante' };
const LV1 = { TB: 'T', MS: 'S', MF: 'F', MI: 'I' }, LV1R = { T: 'TB', S: 'MS', F: 'MF', I: 'MI' };

/* ---------- Hasard reproductible ---------- */
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash32(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function withSeed(seed, fn) { const orig = Math.random; Math.random = mulberry32(seed); try { return fn(); } finally { Math.random = orig; } }

/* ---------- Durée : temps estimé par question (minutes, version standard ; une question ★ compte 1,5 fois) ----------
   Estimations pour des 6e sur papier, à ajuster après quelques contrôles. Un nouveau type d'exercice peut
   donner son temps dans GENS (t: 2) ; sinon : 6 min pour un tracé, 2 min pour le reste. */
const CTL_T = {
  'd-codage': 1.5, 'd-appartient': 2, 'd-noms': 2.5, 'd-position': 1.5, 'd-prop': 2, 'd-perp': 6, 'd-par': 7,
  'n-rang': 1.5, 'n-combien': 2, 'n-tranches': 2, 'n-decomp': 2.5, 'n-zeros': 1.5, 'n-fracdec': 2, 'n-lettres': 2, 'n-formes': 2.5,
  'c-notation': 1.5, 'c-ecrire': 1.5, 'c-milieu': 2, 'c-tracer': 4, 'c-med-prop': 1.5, 'c-med-trace': 7, 'c-voc': 1.5, 'c-rd': 1.5, 'c-disque': 1, 'c-trace-cercle': 4,
  'e-lire': 2, 'e-placer': 2, 'e-comparer': 1.5, 'e-ranger': 3, 'e-intercaler': 2, 'e-encadrer': 2, 'e-arrondir': 2,
  'o-voc': 1.5, 'o-gauche': 1.5, 'o-par': 1.5, 'o-par2': 2, 'o-add': 3, 'o-mul': 4, 'o-pb': 4, 'o-pa': 3, 'o-ps': 3, 'o-pm': 4,
  'a-nom': 1.5, 'a-nature': 1, 'a-mesure': 2, 'a-construire': 4, 'a-calcul': 2.5, 'a-reco': 1.5, 'a-biss': 5,
  't-voc': 1.5, 't-nature': 1.5, 't-3cotes': 6, 't-angles': 6, 't-iso': 6, 't-rect': 6, 't-180': 2, 't-natang': 2, 't-cercle': 7,
};
const ctlT = (k) => GENS[k]?.t ?? CTL_T[k] ?? (GENS[k]?.slow ? 6 : 2);
const HARD_X = 1.5;

/** Plan d'un contrôle (version standard) : n = questions par compétence, h = combien sont ★ (plus difficiles) */
function ctlPlan(c) {
  if (Array.isArray(c.n)) return { n: c.n.map(Number), h: (c.h || c.n.map(() => 0)).map(Number), a: Array.isArray(c.a) ? c.a.map(Number) : null };
  return { n: c.k.map((k) => (GENS[k]?.slow ? 1 : Number(c.q) || 3)), h: c.k.map(() => 0) }; // anciens contrôles : q questions partout
}
/** Plan d'une copie : la version aménagée a une question de moins par compétence (sauf les tracés), parfois moins
    pour tenir sur la page (plan.a), et pas de ★ */
function ctlVer(plan, keys, ver) {
  return {
    n: plan.n.map((x, i) => (ver !== 'a' || GENS[keys[i]]?.slow ? x : plan.a ? plan.a[i] : Math.max(1, x - 1))),
    h: plan.h.map((x, i) => (ver === 'a' || !GENS[keys[i]]?.hard ? 0 : Math.min(x, plan.n[i]))),
  };
}
const ctlMinutes = (keys, p) => keys.reduce((s, k, i) => s + ctlT(k) * (p.n[i] + (HARD_X - 1) * (GENS[k]?.hard ? Math.min(p.h[i], p.n[i]) : 0)), 0);
const planStr = (p) => p.n.map((x, i) => x + (p.h[i] ? 'h' + p.h[i] : '') + (p.a ? 'a' + p.a[i] : '')).join('-');
const planParse = (str) => {
  const parts = String(str || '').split('-').map((t) => t.match(/^(\d)(?:h(\d))?(?:a(\d))?$/));
  if (!parts.every(Boolean)) return null;
  return { n: parts.map((m) => Number(m[1])), h: parts.map((m) => Number(m[2] || 0)), a: parts.every((m) => m[3]) ? parts.map((m) => Number(m[3])) : null };
};

const ctlWide = (x) => !!GENS[x.k].slow; // les demi-droites graduées restent dans les colonnes (place)
/** Les questions d'une copie : toujours les mêmes pour le même contrôle et le même numéro d'élève.
    Dans chaque compétence, les questions ★ sont les dernières. salt : autre tirage pour une copie qui ne tenait pas sur la page. */
function ctlQuestions(id, n, ver, keys, plan, salt = 0, g = 0) {
  const p = ctlVer(plan, keys, ver);
  // une graine par question : ajouter une question ou en rendre une ★ ne change pas les autres
  const all = keys.flatMap((k, ci) => (GENS[k] ? Array.from({ length: p.n[ci] }, (_, m) => {
    const hard = m >= p.n[ci] - p.h[ci] && (!g || ctlHard(k, g));
    return { k, ci, m, hard, o: withSeed(hash32(`${id}#${n}#${ci}#${m}${salt ? '#' + salt : ''}`), () => wrapGen(k, false, hard, !!g)) };
  }) : []));
  // en pleine largeur à la fin de la feuille : placer un point sur une demi-droite graduée, puis les tracés (grande figure) ; le reste sur deux colonnes au-dessus
  const rank = (x) => (GENS[x.k].slow ? 2 : ctlWide(x) ? 1 : 0);
  return [0, 1, 2].flatMap((r) => all.filter((x) => rank(x) === r));
}
const ctlSalt = (c, n) => Number(c.r?.[n]) || 0;
const ctlCode = (id, n) => `${id}-${String(n).padStart(2, '0')}`;
const newCtlId = () => { let s = ''; for (let i = 0; i < 3; i++) s += B32[Math.floor(Math.random() * 32)]; return s; };

/** Niveau proposé à partir des réponses justes (1) / fausses (0) */
function levelFromBits(bits) {
  const n = bits.length, g = [...bits].filter((b) => b === '1').length;
  if (!n) return '';
  if (g === n) return 'TB';
  const r = g / n;
  return r >= 2 / 3 - 1e-9 ? 'MS' : r >= 1 / 3 - 1e-9 && g > 0 ? 'MF' : 'MI';
}

/* ---------- Mise en forme « papier » d'une question ---------- */
function paperHTML(html) {
  const d = document.createElement('div'); d.innerHTML = html;
  // ranger : la liste des nombres, puis une ligne de cases séparées par < ou >
  d.querySelectorAll('.ord').forEach((ord) => {
    const items = [...ord.querySelectorAll('.ordbtn')].map((b) => b.dataset.txt || b.textContent.trim());
    const sign = /décroissant/.test(d.textContent) ? ' &gt; ' : ' &lt; ';
    const p = document.createElement('div');
    p.innerHTML = `<p class="ord-list">${items.join(' ; ')}</p><p class="ord-ans">${items.map(() => '<span class="blank sm"></span>').join(sign)}</p>`;
    ord.replaceWith(...p.childNodes);
  });
  // rapporteur à lire : figure plus grande, pour lire les graduations
  if (/rapporteur/i.test(d.textContent)) d.querySelectorAll('svg.fig').forEach((f) => f.classList.add('fig-big'));
  // opération à poser (poser.js) : un cadre quadrillé à la place de la grille
  d.querySelectorAll('.pz-host').forEach((h) => { const w = document.createElement('div'); w.className = 'work tall'; h.replaceWith(w); });
  // « sur ton cahier » : sur la copie, un cadre quadrillé pour poser l'opération ou écrire les étapes
  const cahier = [...d.querySelectorAll('p')].find((x) => /sur ton cahier/.test(x.textContent));
  if (cahier) {
    cahier.innerHTML = cahier.innerHTML.replace(/ sur ton cahier/g, ' dans le cadre');
    const w = document.createElement('div'); w.className = /multiplication|Pose/.test(cahier.textContent) ? 'work tall' : 'work';
    d.appendChild(w);
  } else if (d.querySelector('.form-lines') && !d.querySelector('svg') && /\?/.test(d.querySelector('.statement')?.textContent || '')) {
    // problème : un cadre pour les calculs, sous les réponses
    const w = document.createElement('div'); w.className = 'work'; d.appendChild(w);
  }
  // demi-droites graduées : on retire le blanc au-dessus et au-dessous
  d.querySelectorAll('svg.nl-svg').forEach((sv) => sv.setAttribute('viewBox', sv.querySelector('.pt-lbl') ? '0 10 720 102' : '0 14 720 98'));
  // comparer (<, > ou =) : on écrit le signe dans une case, à la place de « … » ; pas de cases à cocher
  d.querySelectorAll('.choices.signs').forEach((ch) => {
    const big = [...d.querySelectorAll('p.big')].find((x) => x.innerHTML.includes('…'));
    if (!big) return;
    big.innerHTML = big.innerHTML.replace('…', '<span class="blank sign"></span>');
    ch.remove();
  });
  d.querySelectorAll('input.ans').forEach((i) => { const sp = document.createElement('span'); sp.className = 'blank'; sp.textContent = ' '; i.replaceWith(sp); });
  d.querySelectorAll('input[type=radio], input[type=checkbox]').forEach((i) => { const sp = document.createElement('span'); sp.className = 'box'; sp.textContent = '☐'; i.replaceWith(sp); });
  d.querySelectorAll('button').forEach((b) => { const sp = document.createElement('span'); sp.className = b.className + ' as-text'; sp.textContent = b.textContent; b.replaceWith(sp); });
  d.querySelectorAll('.ord-out, .ord-reset').forEach((e) => e.remove());
  d.querySelectorAll('a').forEach((a) => a.replaceWith(document.createTextNode(a.textContent)));
  // choix longs : un par ligne
  d.querySelectorAll('.choices').forEach((ch) => {
    const t = [...ch.querySelectorAll('.choice')].map((c) => c.textContent.trim());
    if (t.some((x) => x.length > 24)) ch.classList.add('long');
    else if (!ch.querySelector('svg') && t.every((x) => x.length <= 8)) ch.classList.add('short'); // (AB), <, Oui… : plusieurs par ligne
  });
  // une ligne qui ne contient qu'une case (et un peu de texte) remonte à la fin de la consigne : gain de place
  d.querySelectorAll('p').forEach((pp) => {
    const prev = pp.previousElementSibling;
    if (!prev || prev.tagName !== 'P' || pp.classList.contains('ord-ans') || !pp.querySelector('.blank') || pp.querySelector('svg, img, table') || pp.textContent.trim().length > 16) return;
    prev.append(' ', ...pp.childNodes); pp.remove();
  });
  return d.innerHTML
    .replace(/Clique sur les nombres dans l'ordre\./g, '')
    .replace(/ : clique-les dans l'ordre\./g, '.')
    .replace(/Clique sur les <b>zéros inutiles<\/b> pour les barrer\./g, 'Barre les <b>zéros inutiles</b>.')
    .replace(/Clique entre les chiffres pour placer les espaces, afin que le nombre soit facile à lire\./g, 'Recopie ce nombre en plaçant les espaces, pour qu\'il soit facile à lire : <span class="blank long"></span>')
    .replace(/ : clique sur la bonne graduation\./g, ' sur la demi-droite graduée.')
    .replace(/Clique sur l'opération/g, 'Entoure l\'opération')
    .replace(/Clique entre deux chiffres du résultat pour placer la virgule\./g, 'Écris la virgule au bon endroit dans le résultat.');
}
/** Texte brut d'un morceau de HTML (fichier pour la correction assistée) ; strip = on retire tableaux et figures */
function plain(html, strip = false) {
  const d = document.createElement('div'); d.innerHTML = String(html || '');
  d.querySelectorAll('.frac').forEach((f) => { const [a, b] = f.children; if (a && b) f.textContent = ` ${a.textContent}/${b.textContent} `; });
  d.querySelectorAll(strip ? 'svg, table, .player, .nl, .p2-grid' : 'svg').forEach((e) => e.remove());
  d.querySelectorAll('u').forEach((u) => { u.textContent = `[${u.textContent}]`; });
  d.querySelectorAll('.ordbtn').forEach((e) => e.append(' ; '));
  d.querySelectorAll('td, th').forEach((e) => e.append(' | '));
  d.querySelectorAll('p, div, li, label, tr, br, h3, h4').forEach((e) => e.after(' '));
  return d.textContent.replace(/\s+/g, ' ').replace(/ ([.,;)])(?=\s|$)/g, '$1').trim();
}
const stripLinks = (html) => String(html || '').replace(/<a\b[^>]*>(.*?)<\/a>/g, '$1');

/** Zone de travail invisible, pour monter les figures avant de les copier */
function ctlWork() {
  let w = document.getElementById('ctl-work');
  if (!w) { w = document.createElement('div'); w.id = 'ctl-work'; w.setAttribute('aria-hidden', 'true'); document.body.appendChild(w); }
  return w;
}
/** HTML papier d'une question (les tracés : figure de départ en vraie grandeur) */
function questionPaper(o) {
  if (!o.q.includes('class="board"')) return paperHTML(o.q);
  const body = ctlWork(); body.innerHTML = o.q;
  try { o.mount(body); } catch (e) { /* rien */ }
  const svg = body.querySelector('.geo-svg'), fig = svg ? svg.cloneNode(true) : null;
  if (fig) {
    // Vraie grandeur (1 unité = 1 cm). On ne garde en hauteur que la bande utile : figure de départ + construction attendue + marge
    let y0 = 0, h = 11;
    try {
      const boxes = [svg.querySelector('.g-objs'), svg.querySelector('.g-pts')].map((g) => g.getBBox()).filter((b) => b.width || b.height);
      let lo = Math.min(...boxes.map((b) => b.y)), hi = Math.max(...boxes.map((b) => b.y + b.height));
      const sc = o.anim?.(), P = sc?.pts || [];
      if (P.length) { lo = Math.min(lo, ...P.map((p) => p.y)); hi = Math.max(hi, ...P.map((p) => p.y)); }
      // tracés de droites (perpendiculaire, parallèle) : la droite traverse la feuille ; la zone utile est le cadre de l'animation
      if (!isFinite(lo - hi) || hi - lo > 10) { if (sc?.box) { lo = sc.box[1]; hi = sc.box[3]; } }
      lo = Math.max(0, lo - 0.9); hi = Math.min(11, hi + 0.9);
      if (isFinite(lo) && isFinite(hi) && hi - lo <= 10) { h = Math.max(6, Math.ceil(hi - lo)); y0 = Math.min(11 - h, Math.max(0, Math.floor((lo + hi) / 2 - h / 2))); }
    } catch (e) { /* figure entière */ }
    fig.querySelector('.g-prev')?.remove(); fig.classList.add('paper-geo'); fig.removeAttribute('style');
    if (h < 11) { fig.setAttribute('viewBox', `0 ${y0} 16 ${h}`); fig.style.height = h + 'cm'; }
  }
  const board = body.querySelector('.board'); board.innerHTML = '';
  if (fig) board.appendChild(fig);
  const html = paperHTML(body.innerHTML); body.innerHTML = '';
  return html;
}
/** Correction d'une question (texte de la correction, et bonne réponse pour les QCM) */
function questionAnswer(o) {
  const body = ctlWork(); body.innerHTML = o.q;
  try { o.mount?.(body); } catch (e) { /* rien */ }
  let msg = '', good = '';
  if (body.querySelector('.board')) msg = 'Construction : vérifier le tracé sur la copie.';
  else if (o.reveal) { try { msg = o.reveal(body, true).msg; } catch (e) { msg = ''; } good = o._good || ''; }
  else {
    try { const r = revealAnswer(o, body); msg = typeof r?.msg === 'string' ? r.msg : ''; } catch (e) { msg = ''; }
    if (o._correct !== undefined) {
      const order = [...o.q.matchAll(/data-o="(\d+)"/g)].map((m) => Number(m[1]));
      good = /choices[^"]*signs/.test(o.q) ? `signe écrit dans la case : ${plain(o._opts[o._correct])}` : `choix n° ${order.indexOf(o._correct) + 1} (dans l'ordre de la copie) : ${plain(o._opts[o._correct])}`;
    }
    if (o._holes) good = `cases à compléter, dans l'ordre de lecture (de haut en bas, de gauche à droite ; la case de retenue est en haut) : ${o._holes.join(' ; ')}`;
    if (o._items) {
      const ok = o._items.map((it, j) => (it.ok ? `n° ${j + 1} (${plain(it.html)})` : '')).filter(Boolean);
      good = ok.length ? 'cases à cocher : ' + ok.join(', ') : 'aucune case à cocher';
    }
  }
  body.innerHTML = '';
  return { msg, good };
}

/* ---------- Stockage des contrôles (sur cet appareil, et une copie dans Grist) ---------- */
const ctlAll = () => { try { return JSON.parse(localStorage.getItem(CTL_STORE) || '[]'); } catch (e) { return []; } };
function ctlSave(c) {
  const all = ctlAll().filter((x) => x.id !== c.id); all.unshift(c);
  try { localStorage.setItem(CTL_STORE, JSON.stringify(all.slice(0, 40))); } catch (e) { /* rien */ }
}
const ctlFind = (id) => ctlAll().find((c) => c.id === id);
function ctlValid(c) { return c && /^[0-9A-Z]{3}$/.test(c.id) && Array.isArray(c.k) && Array.isArray(c.s) && c.k.every((k) => typeof k === 'string'); }
/** Destination des résultats configurée dans l'Espace prof (pour les devoirs de remédiation) */
function profDest() {
  let url = '', g = null;
  try { url = localStorage.getItem('revisions6e-form') || ''; g = JSON.parse(localStorage.getItem('revisions6e-grist') || 'null'); } catch (e) { /* rien */ }
  const pf = parsePrefill(url);
  if (pf && pf.entries.length === 6) return { seg: formToSeg(pf), send: (v) => sendToForm(pf, v) };
  const pg = parseGristUrl(url);
  if (pg && g && g.k === pg.k && g.v === pg.v) return { seg: gristToSeg(g), send: g.t ? (v) => gristSend(g, v) : null };
  return null;
}
const amenGet = (classe) => { try { return (JSON.parse(localStorage.getItem(CTL_AMEN) || '{}'))[normName(classe || 'sans')] || []; } catch (e) { return []; } };
function amenSet(classe, list) {
  try { const all = JSON.parse(localStorage.getItem(CTL_AMEN) || '{}'); all[normName(classe || 'sans')] = list; localStorage.setItem(CTL_AMEN, JSON.stringify(all)); } catch (e) { /* rien */ }
}

/* ---------- Fenêtre d'impression ---------- */
function printWindow(title, bodyHTML, extraCSS = '', after, backHash = '#/prof') {
  const w = window.open('', '_blank');
  if (!w) { alert('Ton navigateur a bloqué la fenêtre d\'impression. Autorise les fenêtres pop-up pour ce site, puis recommence.'); return null; }
  const css = new URL('style.css?v=' + SITE_VERSION, location.href).href;
  w.document.open();
  // bouton « Revenir au site » : ferme cette fenêtre (ouverte par le site) ; sinon, recharge le site à cet endroit
  const back = `<div class="no-print ctl-back"><button type="button" class="btn" onclick="window.close(); setTimeout(function () { location.href = '${siteURL()}${backHash}'; }, 400);">← Revenir au site</button></div>`;
  w.document.write(`<!doctype html><html lang="fr" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap"><link rel="stylesheet" href="${css}"><link rel="stylesheet" href="${css.replace('style.css', 'chapitres-p2.css')}"><style>${extraCSS}</style></head><body class="print-doc">${back}${bodyHTML}</body></html>`);
  w.document.close();
  const go = () => { try { after?.(w); } catch (e) { /* rien */ } };
  if (w.document.readyState === 'complete') setTimeout(go, 300); else w.addEventListener('load', go);
  return w;
}

/* ---------- Sujets ---------- */
function sheetHTML(c, i) {
  const [name, ver] = c.s[i], n = i + 1, code = ctlCode(c.id, n);
  const qs = ctlQuestions(c.id, n, ver, c.k, ctlPlan(c), ctlSalt(c, n), c.g);
  const date =new Date(c.d).toLocaleDateString('fr-FR');
  return `<div class="ctl-sheet${ver === 'a' ? ' ver-a' : ''}" data-code="${code}"><div class="ctl-in">
    <div class="ctl-band"><span>Prénom : <b>${esc(name)}</b></span><span>${[c.c, c.t, date].filter(Boolean).map(esc).join(' · ')}</span></div>
    <div class="ctl-cut"></div>
    <div class="ctl-head">
      <div class="ctl-code">${window.qrSVG ? qrSVG(code, 'M') : ''}<b>${code}</b></div>
      <div class="ctl-title"><b>${esc(c.t)}</b><br><span class="small">Écris tes réponses dans les cases.</span></div>
      <table class="ctl-grid"><tr><th>Compétence</th><th>TB</th><th>MS</th><th>MF</th><th>MI</th></tr>
        ${c.k.map((k, ci) => `<tr><td>C${ci + 1} · ${esc(GENS[k]?.label || k)}</td><td></td><td></td><td></td><td></td></tr>`).join('')}</table>
    </div>
    <div class="ctl-qs ctl-cols"><div class="ctl-col">${qs.map((x, j) => {
      const first = j === 0 || qs[j - 1].ci !== x.ci;
      return `${ctlWide(x) && (j === 0 || !ctlWide(qs[j - 1])) ? '</div><div class="ctl-col"></div></div><div class="ctl-wide">' : ''}<section class="pq ctl-q">${first ? `<h3 class="ctl-ch">C${x.ci + 1} · ${esc(GENS[x.k].label)}</h3>` : ''}<div class="ctl-qb"><span class="ctl-num"><span class="qn">${j + 1}</span>${x.hard ? '<span class="ctl-star" title="Question un peu plus difficile">★</span>' : ''}</span><div class="ctl-qt">${questionPaper(x.o)}</div></div>${ver === 'a' && first && x.o.hints?.[0] ? `<p class="ctl-aide">💡 <b>Aide :</b> ${stripLinks(x.o.hints[0])}</p>` : ''}</section>`;
    }).join('')}${qs.some(ctlWide) ? '' : '</div><div class="ctl-col"></div>'}</div>
  </div></div>`;
}
/* Mise en page à l'impression.
   Chrome / Edge : marges de page à 0 (pas d'adresse imprimée), copie = page A4 entière avec marges intérieures.
   Safari, Firefox… (qui imposent parfois leurs propres marges) : copie un peu plus petite, qui tient dans la zone imprimable. */
const CTL_BLINK = typeof navigator !== 'undefined' && !!(navigator.userAgentData || /(Chrome|Chromium|Edg)\//.test(navigator.userAgent)) && !/Firefox|CriOS|FxiOS/.test(navigator.userAgent);
const CTL_MODE = CTL_BLINK ? 'pm-full' : 'pm-safe';
const CTL_LIMIT = CTL_BLINK ? 275 : 258;
/** Deux colonnes construites à la main (les colonnes CSS ne s'impriment pas pareil partout) :
    toutes les questions sont d'abord dans la colonne de gauche ; on coupe la liste là où les deux colonnes sont le plus égales. */
function balanceSheet(sheet) {
  sheet.querySelectorAll('.ctl-cols').forEach((cols) => {
    const [L, R] = cols.querySelectorAll(':scope > .ctl-col'); if (!L || !R) return;
    while (R.firstChild) L.appendChild(R.firstChild);
    const qs = [...L.children], h = qs.map((q) => q.getBoundingClientRect().height);
    const tot = h.reduce((a, b) => a + b, 0);
    let best = qs.length, bestMax = tot, acc = 0;
    for (let k = 1; k < qs.length; k++) { acc += h[k - 1]; const m = Math.max(acc, tot - acc); if (m < bestMax - 0.5) { bestMax = m; best = k; } }
    qs.slice(best).forEach((q) => R.appendChild(q));
  });
}
/** Copies mises en page (colonnes équilibrées), rendues hors écran dans cette page */
function renderSheets(c, idx) {
  const box = document.createElement('div'); box.className = CTL_MODE; box.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden';
  document.body.appendChild(box);
  const out = idx.map((i) => { box.innerHTML = sheetHTML(c, i); balanceSheet(box.firstElementChild); return box.innerHTML; });
  box.remove(); return out;
}
/** Codes des copies qui dépassent une page A4 (mesure hors écran, largeur imprimable 190 mm) */
function ctlOverflow(c, only) {
  const box = document.createElement('div'); box.className = CTL_MODE; box.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden';
  box.innerHTML = '<div style="height:100mm;width:1px"></div>'; document.body.appendChild(box);
  const mm = box.firstElementChild.getBoundingClientRect().height / 100, over = [];
  // une copie = une page A4 de 296 mm, marges intérieures 9 mm : 278 mm utiles ; on garde 3 mm de sécurité
  (only || c.s.map((_, i) => i)).forEach((i) => { box.innerHTML = sheetHTML(c, i); balanceSheet(box.firstElementChild); if (box.querySelector('.ctl-in').getBoundingClientRect().height > CTL_LIMIT * mm) over.push(ctlCode(c.id, i + 1)); });
  box.remove(); return over;
}
/** Plan automatique : on ajoute des questions (compétences les moins fournies d'abord) tant que la durée visée
    n'est pas atteinte et que la page tient ; si la page est pleine avant, des questions deviennent ★ (plus difficiles).
    La mise en page est testée sur quelques copies (3 standard + 1 aménagée), puis vérifiée sur toutes. */
function ctlAutoPlan(c, target = 30) {
  const K = c.k, am = [], st = [];
  c.s.forEach(([, v], i) => (v === 'a' ? am : st).push(i));
  const idx = st.length ? st.slice(0, 3) : am.slice(0, 1); // échantillon pour aller vite
  const p = { n: K.map(() => 1), h: K.map(() => 0), a: null };
  const T = () => ctlMinutes(K, p);
  // Une copie qui déborde peut recevoir un autre tirage (d'autres nombres, une autre figure) : salts[numéro] = tirage
  let salts = {};
  const cfg = () => ({ ...c, n: p.n, h: p.h, a: p.a, r: salts });
  const overIdx = (list) => ctlOverflow(cfg(), list).map((code) => parseInt(code.split('-')[1], 10) - 1);
  const fixCopies = (list, tries = 8) => {
    const bad = [];
    for (const i of overIdx(list)) {
      let ok = false;
      for (let sl = 1; sl <= tries && !ok; sl++) { salts[i + 1] = sl; ok = !overIdx([i]).length; }
      if (!ok) { delete salts[i + 1]; bad.push(i); }
    }
    return bad;
  };
  const fits = (list) => !fixCopies(list, 3).length;
  const full = new Set(), hfull = new Set();
  const startOk = fits(idx);
  // 1. on ajoute des questions (compétences les moins fournies d'abord) tant que la durée n'est pas atteinte et que la page tient
  for (let g = 0; g < 60 && startOk && T() < target - 1; g++) {
    const cand = K.map((_, i) => i).filter((i) => !GENS[K[i]]?.slow && !full.has(i) && p.n[i] < 6);
    if (!cand.length) break;
    const i = cand.reduce((a, b) => (p.n[b] < p.n[a] || (p.n[b] === p.n[a] && ctlT(K[b]) < ctlT(K[a])) ? b : a));
    if (T() + ctlT(K[i]) > target + 2 && T() >= target - 3) break; // déjà assez près : on ne dépasse pas trop
    p.n[i]++;
    if (!fits(idx)) { p.n[i]--; full.add(i); }
  }
  // 2. page pleine avant la durée visée : des questions deviennent ★ (même place, plus de temps)
  const upgrade = (list) => {
    for (let g = 0; g < 60 && T() < target - 1; g++) {
      const cand = K.map((_, i) => i).filter((i) => ctlHard(K[i], c.g) && p.h[i] < p.n[i] && !hfull.has(i));
      if (!cand.length) break;
      const i = cand.reduce((a, b) => (p.h[b] / p.n[b] < p.h[a] / p.n[a] ? b : a));
      p.h[i]++;
      if (!fits(list)) { p.h[i]--; hfull.add(i); }
    }
  };
  if (startOk) upgrade(idx);
  // 3. toutes les copies standard : autres tirages si besoin ; sinon une question de moins pour tout le monde
  for (let g = 0; g < 12 && st.length && fixCopies(st).length; g++) {
    const cand = K.map((_, i) => i).filter((i) => !GENS[K[i]]?.slow && p.n[i] > 1);
    if (!cand.length) break;
    const i = cand.reduce((a, b) => (p.n[b] > p.n[a] ? b : a));
    p.n[i]--; p.h[i] = Math.min(p.h[i], p.n[i]); salts = {};
  }
  hfull.clear(); if (st.length) upgrade(st);
  // 4. version aménagée : une question de moins par compétence ; si sa page déborde (police plus grande, aides), encore une de moins
  let amOver = false;
  if (am.length) {
    p.a = K.map((k, i) => (GENS[k]?.slow ? 1 : Math.max(1, p.n[i] - 1)));
    for (let g = 0; g < 20 && fixCopies(am).length; g++) {
      const cand = K.map((_, i) => i).filter((i) => !GENS[K[i]]?.slow && p.a[i] > 1);
      if (!cand.length) { amOver = true; break; }
      p.a[cand.reduce((a, b) => (p.a[b] > p.a[a] ? b : a))]--;
      am.forEach((i) => delete salts[i + 1]);
    }
    if (p.a.every((x, i) => GENS[K[i]]?.slow || x === Math.max(1, p.n[i] - 1))) p.a = null; // règle habituelle : pas besoin de l'écrire
  }
  // on ne garde que les tirages utiles
  Object.keys(salts).forEach((nn) => { const keep = salts[nn]; delete salts[nn]; if (overIdx([Number(nn) - 1]).length) salts[nn] = keep; });
  p.r = salts;
  if (st.length && overIdx(st).length) return { p, tooMany: true };
  const t = T();
  return { p, short: t < target - 3, long: t > target + 5, amOver };
}
/* ---------- Plan de classe : ordre de distribution des copies ----------
   Disposition « 2 4 2 » = dans chaque rangée, une table de 2, une de 4, une de 2, séparées par des allées.
   Chaque place est servie depuis l'allée la plus proche. On passe par les allées de gauche à droite, rangée par rangée
   (du tableau vers le fond ; en boucle, la 2e allée se fait du fond vers le tableau). À chaque arrêt : côté gauche de la
   salle, de la place la plus à gauche vers l'allée ; côté droit, de la place la plus à droite vers l'allée.
   (En 2 4 2 : la table de 2 de gauche, puis les 2 places les plus proches dans la table de 4 ; ensuite l'autre côté.) */
const SEAT_STORE = 'revisions6e-plans-classe';
const seatAll = () => { try { return JSON.parse(localStorage.getItem(SEAT_STORE) || '{}'); } catch (e) { return {}; } };
const seatGet = (classe) => ({ lay: '2 4 2', rows: 5, loop: false, rev: false, seats: {}, ...(seatAll()[normName(classe || 'sans')] || {}) });
function seatSet(classe, p) { const all = seatAll(); all[normName(classe || 'sans')] = p; try { localStorage.setItem(SEAT_STORE, JSON.stringify(all)); } catch (e) { /* rien */ } }
const layBlocks = (lay) => { const b = String(lay || '').split(/[^0-9]+/).map(Number).filter((x) => x > 0 && x <= 8).slice(0, 6); return b.length ? b : [2, 4, 2]; };
/** Places (« rangée-table-place ») dans l'ordre de distribution */
function seatOrder(p) {
  const B = layBlocks(p.lay), R = Math.max(1, Math.min(12, Number(p.rows) || 1)), nb = B.length;
  const x0 = B.map((_, b) => B.slice(0, b).reduce((a, v) => a + v, 0)), tot = B.reduce((a, v) => a + v, 0), mid = (tot - 1) / 2;
  const out = [];
  if (nb < 2) { for (let r = 0; r < R; r++) for (let s = 0; s < B[0]; s++) out.push(`${r}-0-${s}`); return out; }
  const aisle = (b, s) => (b === 0 ? 0 : b === nb - 1 ? nb - 2 : (s + 1 <= B[b] - s ? b - 1 : b));
  for (let j = 0; j < nb - 1; j++) {
    const ltr = x0[j + 1] - 0.5 <= mid; // allée dans la moitié gauche : de gauche à droite ; sinon de droite à gauche
    const here = [];
    B.forEach((m, b) => { for (let s = 0; s < m; s++) if (aisle(b, s) === j) here.push({ b, s, x: x0[b] + s }); });
    here.sort((u, v) => (ltr ? u.x - v.x : v.x - u.x));
    const rows = [...Array(R).keys()]; if (p.loop && j % 2 === 1) rows.reverse();
    rows.forEach((r) => here.forEach((t) => out.push(`${r}-${t.b}-${t.s}`)));
  }
  return out;
}
/** Ordre d'impression des copies d'un contrôle d'après le plan de sa classe (élèves hors plan à la fin) */
function ctlPrintOrder(c) {
  const p = seatGet(c.c), idx = new Map(c.s.map(([n], i) => [n, i])), order = [], seen = new Set();
  for (const id of seatOrder(p)) { const i = idx.get(p.seats[id]); if (i !== undefined && !seen.has(i)) { order.push(i); seen.add(i); } }
  const placed = order.length, rest = c.s.map((_, i) => i).filter((i) => !seen.has(i));
  let all = [...order, ...rest];
  if (p.rev) all = all.reverse();
  return { order: all, placed, rest: rest.map((i) => c.s[i][0]), plan: placed > 0 };
}
// Marges de page à 0 : chaque copie est une boîte A4 qui ne peut pas déborder sur une 2e page,
// et le navigateur n'a plus de place pour imprimer l'adresse du site en bas de page.
const PRINT_CSS = CTL_BLINK ? '@page { size: A4; margin: 0; } body.print-doc { background: #fff; margin: 0; }' : '@page { size: A4; margin: 15mm 17mm; } body.print-doc { background: #fff; margin: 0; }';
/** Dans la fenêtre d'impression : une copie qui dépasserait (police différente…) est resserrée (taille du texte un peu réduite) */
function fitSheets(doc) {
  const bad = [];
  doc.querySelectorAll('.ctl-sheet').forEach((sh) => {
    const inn = sh.querySelector('.ctl-in'); if (!inn) return;
    const room = () => sh.clientHeight - parseFloat(getComputedStyle(sh).paddingTop) - parseFloat(getComputedStyle(sh).paddingBottom);
    const base = parseFloat(getComputedStyle(sh).fontSize);
    for (let f = 1; inn.scrollHeight > room() + 0.5 && f > 0.84; f -= 0.03) { inn.style.fontSize = (base * (f - 0.03)) + 'px'; sh.dataset.fit = String(Math.round((f - 0.03) * 100)); }
    if (inn.scrollHeight > room() + 0.5) bad.push(sh.dataset.code);
  });
  return bad;
}
function printSheets(c) {
  const po = ctlPrintOrder(c);
  const ord = po.plan ? `Ordre de distribution : plan de classe${c.c ? ' de la ' + esc(c.c) : ''} (${po.placed} copie${po.placed > 1 ? 's' : ''}${po.rest.length ? ` ; hors plan, à la fin : ${po.rest.map(esc).join(', ')}` : ''})${seatGet(c.c).rev ? ', en ordre inverse' : ''}.` : 'Ordre alphabétique (pas de plan de classe pour cette classe).';
  const bar = `<div class="no-print ctl-bar"><p id="ctl-fit" class="small">Vérification de la mise en page…</p><p class="small">${ord}</p><p><button type="button" class="btn primary" id="ctl-go" onclick="print()">🖨️ Imprimer</button> <span class="small muted">Recto seul, marges : aucune, échelle 100 %. Si l'adresse du site apparaît encore en bas, décoche « En-têtes et pieds de page » dans la fenêtre d'impression.</span></p></div>`;
  const body = bar + `<div class="${CTL_MODE}">` + renderSheets(c, po.order).join('') + '</div>';
  printWindow(`Sujets ${c.id} — ${c.t}`, body, PRINT_CSS, async (w) => {
    // Une copie = une page : on attend la police, puis on resserre les rares copies qui dépasseraient
    const btn = w.document.getElementById('ctl-go'); if (btn) btn.disabled = true;
    try { await Promise.race([w.document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* rien */ }
    const bad = fitSheets(w.document), tight = w.document.querySelectorAll('.ctl-sheet[data-fit]').length;
    const el = w.document.getElementById('ctl-fit');
    el.className = bad.length ? 'ko-t' : 'ok-t';
    el.textContent = bad.length ? `⚠ ${bad.length} copie(s) ne tiennent pas sur une page (${bad.slice(0, 8).join(', ')}${bad.length > 8 ? '…' : ''}) : la fin serait coupée. Reviens au site et enlève une question.`
      : `✔ ${c.s.length} copies, une page chacune${tight ? ` (${tight} copie${tight > 1 ? 's' : ''} un peu resserrée${tight > 1 ? 's' : ''})` : ''}.`;
    if (btn) btn.disabled = false;
  });
}

/* ---------- Entraînement sur papier : une feuille à imprimer ou à enregistrer en PDF ---------- */
/** Répartit des blocs sur des pages A4 (mêmes boîtes que les contrôles), en deux colonnes ou en pleine largeur */
function paperPages(items, head, cls, oneCol) {
  const box = document.createElement('div'); box.className = CTL_MODE; box.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden';
  box.innerHTML = '<div style="height:100mm;width:1px"></div>'; document.body.appendChild(box);
  const limit = CTL_LIMIT * box.firstElementChild.getBoundingClientRect().height / 100;
  const place = (parts, h) => {
    box.innerHTML = `<div class="ctl-sheet tr-sheet ${cls}"><div class="ctl-in">${h}${oneCol ? `<div class="ctl-wide">${parts.join('')}</div>` : `<div class="ctl-qs ctl-cols"><div class="ctl-col">${parts.join('')}</div><div class="ctl-col"></div></div>`}</div></div>`;
    if (!oneCol) balanceSheet(box.firstElementChild);
  };
  const pages = []; let cur = [];
  items.forEach((it) => {
    place([...cur, it], pages.length ? '' : head);
    if (cur.length && box.querySelector('.ctl-in').getBoundingClientRect().height > limit) { pages.push(cur); cur = []; }
    cur.push(it);
  });
  pages.push(cur);
  const out = pages.map((p, i) => { place(p, i ? '' : head); return box.innerHTML; });
  box.remove(); return out;
}
/** true si un bloc déborde d'une colonne (grand tableau, figure large) : la feuille passe alors en pleine largeur */
function paperTooWide(items) {
  const box = document.createElement('div'); box.className = CTL_MODE; box.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden';
  box.innerHTML = `<div class="ctl-sheet tr-sheet"><div class="ctl-in"><div class="ctl-qs ctl-cols"><div class="ctl-col">${items.join('')}</div><div class="ctl-col"></div></div></div></div>`;
  document.body.appendChild(box);
  const wide = [...box.querySelectorAll('.ctl-qt')].some((q) => q.scrollWidth > q.clientWidth + 1);
  box.remove(); return wide;
}
function printTraining(k) {
  const G0 = GENS[k], ch = CHAPTERS.find((x) => x.id === G0.ch);
  const draw = trainDraw(k), qs = Array.from({ length: trainLen(k) }, () => draw());
  const items = qs.map((x, j) => `<section class="pq ctl-q"><div class="ctl-qb"><span class="ctl-num"><span class="qn">${j + 1}</span>${x.hard ? '<span class="ctl-star">★</span>' : ''}</span><div class="ctl-qt">${questionPaper(x.o)}</div></div></section>`);
  const corr = qs.map((x, j) => {
    const a = questionAnswer(x.o);
    let fig = '', end = '';
    if (x.o.anim) { const h = ctlWork(); try { const sc = x.o.anim(); end = sc?.endText || ''; makePlayer(h, sc, { atEnd: true }); fig = h.querySelector('svg')?.outerHTML || ''; } catch (e) { /* rien */ } h.innerHTML = ''; }
    const msg = fig ? 'Compare ton tracé à cette figure (ici réduite).' : stripLinks(String(a.msg));
    return `<section class="pq ctl-q"><div class="ctl-qb"><span class="ctl-num"><span class="qn">${j + 1}</span></span><div class="ctl-qt">${a.good ? `<p><b>${esc(a.good)}</b></p>` : ''}${msg}${fig ? `<div class="ctl-corr-fig">${fig}</div>` : ''}${end ? `<p>${end}</p>` : ''}</div></div></section>`;
  });
  // tracés et rapporteurs à lire : pleine largeur, pour la vraie grandeur et la lisibilité des graduations
  const slow = !!G0.slow, oneCol = slow || items.some((h) => h.includes('fig-big')) || paperTooWide(items);
  const head = `<div class="ctl-head tr-head"><div class="ctl-title"><b>${esc(G0.label)}</b><br><span class="small">Entraînement · ${esc(ch?.title || '')}${slow ? ' · Figures en vraie grandeur : fais les tracés dessus, avec tes instruments.' : ''}${qs.some((x) => x.hard) ? ' · ★ : question plus difficile' : ''}</span></div><div class="tr-name">Prénom : <span class="tr-line"></span><br>Date : <span class="tr-line"></span></div></div>`;
  const sujet = paperPages(items, head, '', oneCol);
  const corrige = paperPages(corr, `<div class="ctl-head tr-head"><div class="ctl-title"><b>Corrigé — ${esc(G0.label)}</b></div></div>`, 'tr-corr-sheet', false);
  const bar = `<div class="no-print ctl-bar"><p><button type="button" class="btn primary" id="ctl-go" onclick="print()">🖨️ Imprimer ou enregistrer en PDF</button> <label class="small"><input type="checkbox" checked onchange="document.body.classList.toggle('no-corr', !this.checked)"> Ajouter le corrigé à la fin</label></p></div>`;
  printWindow(`${G0.label} — entraînement`, `${bar}<div class="${CTL_MODE}"><div class="tr-part">${sujet.join('')}</div><div class="tr-part tr-corr">${corrige.join('')}</div></div>`, PRINT_CSS, async (w) => {
    try { await Promise.race([w.document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch (e) { /* rien */ }
    fitSheets(w.document);
  }, `#/${G0.ch}`);
}

/* ---------- Corrigé du professeur, et fichier pour la correction assistée ---------- */
function printCorrige(c) {
  const parts = c.s.map(([name, ver], i) => {
    const n = i + 1, qs = ctlQuestions(c.id, n, ver, c.k, ctlPlan(c), ctlSalt(c, n), c.g);
    return `<section class="ctl-corr"><h3>${ctlCode(c.id, n)} — ${esc(name)}${ver === 'a' ? ' <span class="small muted">(aménagé)</span>' : ''}</h3><ol>${qs.map((x) => {
      const a = questionAnswer(x.o);
      let fig = '';
      if (x.o.anim) { const h = ctlWork(); try { makePlayer(h, x.o.anim(), { atEnd: true }); fig = h.querySelector('svg')?.outerHTML || ''; } catch (e) { /* rien */ } h.innerHTML = ''; }
      return `<li><span class="small muted">C${x.ci + 1}${x.hard ? ' ★' : ''}</span> ${a.good ? `<b>${esc(a.good)}</b> — ` : ''}${String(a.msg).replace(/<table[\s\S]*?<\/table>/g, '')}${fig ? `<div class="ctl-corr-fig">${fig}</div>` : ''}</li>`;
    }).join('')}</ol></section>`;
  }).join('');
  printWindow(`Corrigé ${c.id}`, `<div class="no-print ctl-bar"><p><button type="button" class="btn primary" onclick="print()">🖨️ Imprimer le corrigé</button></p></div><h1>Corrigé — ${esc(c.t)}${c.c ? ` (${esc(c.c)})` : ''}</h1>${parts}`, '@page { size: A4; margin: 10mm; } .ctl-corr { break-inside: avoid; }');
}
function aiText(c) {
  const L = [];
  L.push(`CONTRÔLE ${c.id} — ${c.t} — ${c.c || ''} — ${new Date(c.d).toLocaleDateString('fr-FR')}`);
  L.push('Compétences : ' + c.k.map((k, i) => `C${i + 1} = ${GENS[k]?.label || k}`).join(' ; '));
  L.push('');
  L.push('CONSIGNES POUR LA CORRECTION');
  L.push('- Chaque copie porte un code (ex. ' + ctlCode(c.id, 1) + '). Les réponses sont écrites dans des cases ; les cases à cocher sont des ☐.');
  L.push('- Les questions marquées ★ sont un peu plus difficiles ; elles comptent comme les autres.');
  L.push('- Pour chaque question : 1 si la réponse est juste, 0 sinon. Les tracés se jugent sur la copie (instrument, précision à 1 mm près, codage).');
  L.push('- Niveau par compétence : tout juste = TB ; au moins 2/3 = MS ; au moins 1/3 = MF ; sinon MI.');
  L.push('  (2 questions : 2/2 = TB, 1/2 = MF, 0/2 = MI ; 1 question : juste = TB, faux = MI.) Le professeur peut ajuster.');
  L.push('- RÉPONDRE avec une ligne par copie, exactement sous cette forme :');
  const ps = ctlVer(ctlPlan(c), c.k, 's');
  L.push(`  ${ctlCode(c.id, 1)} ${c.k.map((k, i) => `C${i + 1}=TB(${'1'.repeat(ps.n[i])})`).join(' ')}`);
  L.push('  (un chiffre par question, dans l\'ordre des questions de la compétence ; la version aménagée a une question de moins par compétence, sauf pour les tracés)');
  { const n1 = ps.n[0], b = n1 > 1 ? '1'.repeat(n1 - 1) + '0' : '0';
    L.push(`  Ajouter « ? » après un niveau en cas de doute (ex. C1=${levelFromBits(b)}?(${b})), et une courte remarque après « // » si utile.`); }
  L.push('');
  c.s.forEach(([, ver], i) => {
    const n = i + 1, qs = ctlQuestions(c.id, n, ver, c.k, ctlPlan(c), ctlSalt(c, n), c.g);
    L.push(`=== ${ctlCode(c.id, n)} (version ${ver === 'a' ? 'aménagée' : 'standard'}) ===`);
    qs.forEach((x, j) => {
      const a = questionAnswer(x.o);
      L.push(`${j + 1}. [C${x.ci + 1}]${x.hard ? ' ★' : ''} Énoncé : ${plain(paperHTML(x.o.q))}${x.o.q.includes('<u') ? ' (chiffre souligné entre crochets)' : ''}`);
      L.push(`   Attendu : ${a.good ? a.good + ' — ' : ''}${plain(a.msg, true)}`);
    });
    L.push('');
  });
  return L.join('\n');
}
function download(name, text, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- Résultats collés et étiquettes ---------- */
/** Lit les lignes « CODE C1=TB(111) C2=MS?(110) … » (renvoyées par l'IA ou tapées à la main) */
function parseCtlResults(text, c) {
  const res = {};
  for (const line of String(text).split(/\r?\n/)) {
    const m = line.toUpperCase().match(/\b([0-9A-Z]{3})\s*-\s*(\d{1,2})\b/);
    if (!m || m[1] !== c.id) continue;
    const n = Number(m[2]); if (n < 1 || n > c.s.length) continue;
    const r = res[n] = res[n] || { lv: [], bits: [], doubt: [], note: '' };
    const body = line.slice(line.toUpperCase().indexOf(m[0]) + m[0].length);
    const [main, note] = body.split('//');
    for (const x of main.toUpperCase().matchAll(/C\s*(\d+)\s*=\s*(TB|MS|MF|MI)?\s*(\?)?\s*(?:\(\s*([01\s]+)\s*\))?/g)) {
      const ci = Number(x[1]) - 1; if (ci < 0 || ci >= c.k.length) continue;
      const bits = (x[4] || '').replace(/\s/g, '');
      r.bits[ci] = bits; r.lv[ci] = x[2] || levelFromBits(bits); r.doubt[ci] = !!x[3];
    }
    if (note) r.note = note.trim();
  }
  return res;
}
/** Lien de la page « Mon contrôle » d'un élève */
function retourURL(c, n, levels, bits, dest) {
  const ver = c.s[n - 1][1];
  const plan = ctlPlan(c), pv = ctlVer(plan, c.k, ver);
  const allBits = c.k.map((k, i) => { const b = bits[i] || ''; const want = pv.n[i]; return b.length === want ? b : '-'.repeat(want); }).join('');
  const cl = encodeURIComponent(c.c || '').replace(/\./g, '%2E');
  return siteURL() + `#/r/${c.g ? 3 : 2}.${c.id}.${n}.${ver}${ctlSalt(c, n) || ''}.${planStr(plan)}.${c.k.join('+')}.${levels.map((l) => LV1[l] || '-').join('')}.${/[01]/.test(allBits) ? allBits : '-'}.${cl}${dest ? dest.seg : ''}`;
}
function printLabels(c, rows, skip, dest) {
  const W = 63.5, H = 38.1, TOP = 15.15, LEFT = 7.21, GAP = 2.54, PER = 21;
  const cells = [...Array(skip).fill(null), ...rows];
  const pages = [];
  for (let p = 0; p * PER < cells.length; p++) pages.push(cells.slice(p * PER, (p + 1) * PER));
  const body = `<div class="no-print ctl-bar"><p><button type="button" class="btn primary" onclick="print()">🖨️ Imprimer les étiquettes</button></p>
    <p class="small">Planche A4 de 21 étiquettes (3 × 7, 63,5 × 38,1 mm, type L7160). Dans la fenêtre d'impression : <b>marges : aucune</b>, <b>échelle : 100 %</b>. Fais d'abord un essai sur une feuille blanche, posée sur la planche, à contre-jour.</p></div>`
    + pages.map((pg) => `<div class="lbl-page">${pg.map((r, i) => {
      const x = LEFT + (i % 3) * (W + GAP), y = TOP + Math.floor(i / 3) * H;
      if (!r) return '';
      const url = retourURL(c, r.n, r.lv, r.bits, dest);
      return `<div class="lbl" style="left:${x}mm;top:${y}mm;width:${W}mm;height:${H}mm">${qrSVG(url, 'L')}<div class="lbl-txt"><b>${esc(r.name)}</b><span>${ctlCode(c.id, r.n)}</span><span class="lbl-lv">${r.lv.map((l, ci) => `C${ci + 1} ${l}`).join(' · ')}</span><span class="lbl-hint">📱 Scanne-moi : ton corrigé et tes exercices</span></div></div>`;
    }).join('')}</div>`).join('');
  printWindow(`Étiquettes ${c.id}`, body, `@page { size: A4; margin: 0; } body.print-doc { margin: 0; background: #fff; }`);
}

/* ---------- Espace professeur : la carte « Contrôle sur papier » ---------- */
function setupControles() {
  const after = document.getElementById('prof-list');
  if (!after || document.getElementById('ctl-card')) return;
  after.insertAdjacentHTML('afterend', `<div class="card" id="ctl-card">
    <h2>📝 Contrôle sur papier, par compétences</h2>
    <p class="small">Chaque compétence = un type d'exercice du site : <b>coche-les dans la liste ci-dessus</b>. Chaque élève reçoit son propre sujet (mêmes exercices que sur le site, nombres différents), avec son prénom sur une bande à détacher et un <b>code anonyme</b>.</p>
    <p id="ctl-sel" class="small"></p>
    <div class="prof-opts">
      <span><label for="ctl-title"><b>Titre :</b></label> <input type="text" id="ctl-title" maxlength="60" placeholder="Contrôle — décimaux"></span>
      <span><label for="ctl-classe"><b>Classe :</b></label> <select id="ctl-classe" class="cl-select"></select></span>
      <span><label for="ctl-date"><b>Date du contrôle :</b></label> <input type="date" id="ctl-date"></span>
      <span><label for="ctl-q"><b>Durée :</b></label> <select id="ctl-q"><option value="a30" selected>≈ 30 min (automatique)</option><option value="a20">≈ 20 min (automatique)</option><option value="1">1 question par compétence</option><option value="2">2 questions par compétence</option><option value="3">3 questions par compétence</option><option value="4">4 questions par compétence</option></select></span>
    </div>
    <p class="small muted">Automatique : le site choisit le nombre de questions par compétence pour arriver à la durée voulue, sur une seule page. Si la page est pleine avant, certaines questions deviennent <b>★ un peu plus difficiles</b> (même compétence). Un tracé compte pour 1 question. Version aménagée : une question de moins par compétence, pas de ★, police plus grande et une aide sous la première question de chaque compétence.</p>
    <label for="ctl-names"><b>Élèves</b> (un prénom par ligne ; tu peux coller ta liste depuis Grist) :</label>
    <textarea id="ctl-names" rows="5" placeholder="Léa M.&#10;Tom B.&#10;…"></textarea>
    <div id="ctl-students"></div>
    <details class="seat-box" id="seat-box"><summary><b>🪑 Plan de classe</b> <span class="small muted">— les copies sortent de l'imprimante dans l'ordre où tu les distribues</span></summary><div id="seat-ui"></div></details>
    <div class="prof-row">
      <button type="button" class="btn primary" id="ctl-make">🧮 Préparer le contrôle</button>
    </div>
    <p id="ctl-status" class="small"></p>
    <div id="ctl-plan"></div>
    <h3>📁 Mes contrôles</h3>
    <div id="ctl-list"></div>
    <details class="howto small"><summary>Comment corriger avec l'IA</summary><ol class="steps-form">
      <li>Avant de scanner, détache (ou replie) les bandes avec les prénoms : les copies ne portent plus que leur code.</li>
      <li>Scanne la pile avec ton téléphone (un seul PDF) et envoie-le à Claude avec le <b>fichier pour la correction assistée</b>.</li>
      <li>Claude répond une ligne par copie (<code>${'ABC'}-07 C1=TB(111) C2=MS(110)…</code>) : colle-la plus bas, vérifie, puis imprime les étiquettes.</li>
    </ol><p>Les copies scannées sont anonymes. Fais valider cet usage par ton établissement.</p></details>
    <h3>Après la correction : étiquettes QR</h3>
    <div class="prof-opts">
      <span><label for="ctl-pick"><b>Contrôle :</b></label> <select id="ctl-pick"></select></span>
      <span><label for="ctl-skip"><b>Commencer à l'étiquette n°</b></label> <select id="ctl-skip">${Array.from({ length: 21 }, (_, i) => `<option value="${i}">${i + 1}</option>`).join('')}</select></span>
    </div>
    <label for="ctl-res"><b>Résultats</b> (colle la réponse de Claude, ou tape : <code>CODE C1=TB C2=MF…</code>) :</label>
    <textarea id="ctl-res" rows="4"></textarea>
    <div id="ctl-table"></div>
    <details class="howto small"><summary>Ce contrôle a été créé sur un autre appareil</summary>
      <p>Dans ta table Grist, retrouve la ligne dont le code est <b>CTRL-…</b>, copie la cellule « Détail » et colle-la ici :</p>
      <textarea id="ctl-import" rows="2"></textarea> <button type="button" class="mini" id="ctl-import-go">Importer</button> <span id="ctl-import-st" class="small"></span>
    </details>
  </div>`);
  const $ = (id) => document.getElementById(id);
  const card = $('ctl-card');
  const sel = () => [...document.querySelectorAll('#prof-list input[type=checkbox]:checked')].map((i) => i.value);
  // classes : même liste que pour les devoirs
  const fillClasses = () => {
    let cl = []; try { cl = (localStorage.getItem('revisions6e-classes') || '').split('\n').map((x) => x.trim()).filter(Boolean); } catch (e) { /* rien */ }
    let mem = ''; try { mem = localStorage.getItem('revisions6e-ctl-classe') || ''; } catch (e) { /* rien */ }
    const cur = $('ctl-classe').value || mem || $('prof-classe')?.value || '';
    $('ctl-classe').innerHTML = '<option value="">— classe —</option>' + cl.map((c) => `<option${c === cur ? ' selected' : ''}>${esc(c)}</option>`).join('');
  };
  fillClasses();
  $('prof-classes-save')?.addEventListener('click', () => setTimeout(fillClasses, 0));
  /* Liste des élèves : mémorisée par classe (sur cet appareil). Si elle manque, on la reprend du plan de classe. */
  const loadNames = () => {
    const cl = $('ctl-classe').value;
    let r = ''; try { r = localStorage.getItem(ROSTER_KEY(cl)) || ''; } catch (e) { /* rien */ }
    if (!r.trim()) r = [...new Set(Object.values(seatGet(cl).seats || {}))].sort((a, b) => a.localeCompare(b, 'fr')).join('\n');
    if (r.trim() && !$('ctl-names').value.trim()) $('ctl-names').value = r;
    drawStudents();
  };
  const saveNames = () => { const cl = $('ctl-classe').value; if (!cl) return; try { localStorage.setItem(ROSTER_KEY(cl), $('ctl-names').value.trim()); } catch (e) { /* rien */ } };
  $('ctl-classe').addEventListener('change', () => { try { localStorage.setItem('revisions6e-ctl-classe', $('ctl-classe').value); } catch (e) { /* rien */ } $('ctl-names').value = ''; loadNames(); });
  $('ctl-names').addEventListener('change', saveNames);
  const names = () => [...new Set($('ctl-names').value.split(/\n+/).map((x) => x.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
  function drawStudents() {
    const ns = names(), am = new Set(amenGet($('ctl-classe').value));
    $('ctl-students').innerHTML = ns.length ? `<p class="small"><b>${ns.length} élève${ns.length > 1 ? 's' : ''}</b> — coche la version aménagée pour ceux qui en ont besoin (mémorisé pour cette classe) :</p><div class="ctl-studs">${ns.map((n) => `<label><input type="checkbox" data-n="${esc(n)}"${am.has(normName(n)) ? ' checked' : ''}> ${esc(n)}</label>`).join('')}</div>` : '';
  }
  $('ctl-names').addEventListener('change', drawStudents);
  $('ctl-students').addEventListener('change', () => amenSet($('ctl-classe').value, [...$('ctl-students').querySelectorAll('input:checked')].map((i) => normName(i.dataset.n))));
  const showSel = () => { const ks = sel(); $('ctl-sel').innerHTML = ks.length ? `Compétences : ${ks.map((k, i) => `<b>C${i + 1}</b> ${esc(GENS[k].label)}`).join(' · ')}` : '<span class="warn-t">Coche au moins une compétence dans la liste ci-dessus.</span>'; };
  document.getElementById('prof-list').addEventListener('change', showSel); showSel();
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dateOf = (v) => { const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(+m[1], +m[2] - 1, +m[3], 12).getTime() : Date.now(); };
  const ymd = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  $('ctl-date').value = today();
  // ---- plan de classe ----
  function drawSeats() {
    const cl = $('ctl-classe').value, p = seatGet(cl), ns = names(), B = layBlocks(p.lay), R = Math.max(1, Math.min(12, Number(p.rows) || 1));
    const ord = seatOrder(p), num = new Map(ord.map((id, i) => [id, i + 1]));
    const placed = new Set(Object.values(p.seats).filter((n) => ns.includes(n)));
    const out = ns.filter((n) => !placed.has(n));
    const seat = (r, b, s) => { const id = `${r}-${b}-${s}`, v = p.seats[id] || ''; return `<label class="seat${v && ns.includes(v) ? ' on' : ''}"><span class="seat-n">${num.get(id) || ''}</span><select data-id="${id}" aria-label="Rangée ${r + 1}, place ${s + 1} de la table ${b + 1}"><option value=""></option>${ns.map((n) => `<option${n === v ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>`; };
    $('seat-ui').innerHTML = `<div class="prof-opts small">
        <span><label for="seat-lay"><b>Tables par rangée</b> (places, de gauche à droite) :</label> <input id="seat-lay" size="9" value="${esc(p.lay)}" placeholder="2 4 2"></span>
        <span><label for="seat-rows"><b>Rangées :</b></label> <input id="seat-rows" type="number" min="1" max="12" value="${R}" style="width:4em"></span>
        <label><input type="checkbox" id="seat-loop"${p.loop ? ' checked' : ''}> allée suivante faite du fond vers le tableau</label>
        <label><input type="checkbox" id="seat-rev"${p.rev ? ' checked' : ''}> imprimer en ordre inverse</label></div>
      <div class="seat-wrap"><div class="seat-room"><div class="seat-board">Tableau</div>
        ${[...Array(R).keys()].map((r) => `<div class="seat-row">${B.map((m, b) => `<div class="seat-table">${[...Array(m).keys()].map((s2) => seat(r, b, s2)).join('')}</div>`).join('<div class="seat-aisle"></div>')}</div>`).join('')}
      </div></div>
      <p class="small">Le petit numéro = ordre de distribution des copies. ${ns.length ? `<b>${placed.size}</b> élève${placed.size > 1 ? 's' : ''} placé${placed.size > 1 ? 's' : ''}${out.length ? ` · pas encore placé${out.length > 1 ? 's' : ''} (imprimé${out.length > 1 ? 's' : ''} à la fin) : ${out.map(esc).join(', ')}` : ''}` : 'Colle d\'abord la liste des élèves.'}</p>
      <p><button type="button" class="mini" id="seat-fill">Placer les élèves non placés dans les places vides</button> <button type="button" class="mini" id="seat-clear">Vider le plan</button>
      <span class="small muted">Plan mémorisé pour ${cl ? esc(cl) : 'cette classe'}, sur cet appareil.</span></p>`;
    const save = () => { seatSet(cl, p); drawSeats(); };
    $('seat-lay').addEventListener('change', (e) => { p.lay = layBlocks(e.target.value).join(' '); save(); });
    $('seat-rows').addEventListener('change', (e) => { p.rows = Math.max(1, Math.min(12, parseInt(e.target.value, 10) || 1)); save(); });
    $('seat-loop').addEventListener('change', (e) => { p.loop = e.target.checked; save(); });
    $('seat-rev').addEventListener('change', (e) => { p.rev = e.target.checked; save(); });
    $('seat-ui').querySelectorAll('select[data-id]').forEach((se) => se.addEventListener('change', () => {
      const v = se.value; Object.keys(p.seats).forEach((k) => { if (p.seats[k] === v) delete p.seats[k]; });
      if (v) p.seats[se.dataset.id] = v; else delete p.seats[se.dataset.id];
      save();
    }));
    $('seat-fill').addEventListener('click', () => {
      // places vides dans l'ordre des rangées (devant d'abord), de gauche à droite
      const free = [];
      for (let r = 0; r < R; r++) B.forEach((m, b) => { for (let s2 = 0; s2 < m; s2++) { const id = `${r}-${b}-${s2}`; if (!p.seats[id] || !ns.includes(p.seats[id])) free.push(id); } });
      out.forEach((n, i) => { if (free[i]) p.seats[free[i]] = n; });
      save();
    });
    $('seat-clear').addEventListener('click', () => { if (confirm('Vider le plan de classe ?')) { p.seats = {}; save(); } });
  }
  $('ctl-names').addEventListener('change', drawSeats);
  $('ctl-classe').addEventListener('change', () => setTimeout(drawSeats, 0));
  // ---- liste des contrôles enregistrés : réimprimer, corrigé, fichier IA, date, suppression ----
  function drawList(hl) {
    const all = ctlAll();
    $('ctl-list').innerHTML = all.length ? `<div class="table-wrap"><table class="voc ctl-ltab"><thead><tr><th>Date</th><th>Contrôle</th><th>Copies</th><th></th></tr></thead><tbody>${all.map((c) => `<tr${c.id === hl ? ' class="hl"' : ''}><td><input type="date" data-date="${c.id}" value="${ymd(c.d)}" aria-label="Date du contrôle ${c.id}"></td>
        <td><b>${esc(c.t)}</b><br><span class="small muted">${esc(c.c || 'sans classe')} · ${c.id} · ${c.k.length} compétence${c.k.length > 1 ? 's' : ''}</span></td><td>${c.s.length}</td>
        <td class="ctl-acts"><button type="button" class="mini" data-act="print" data-id="${c.id}">🖨️ Sujets</button> <button type="button" class="mini" data-act="corr" data-id="${c.id}">📄 Corrigé</button> <button type="button" class="mini" data-act="ai" data-id="${c.id}">🤖 Fichier IA</button> <button type="button" class="mini" data-act="del" data-id="${c.id}" title="Supprimer ce contrôle">🗑</button></td></tr>`).join('')}</tbody></table></div>
      <p class="small muted">Changer la date ne change pas les questions : réimprime les sujets pour l'avoir à jour.</p>` : '<p class="small muted">Aucun contrôle enregistré sur cet appareil.</p>';
  }
  $('ctl-list').addEventListener('change', (e) => {
    const id = e.target.dataset.date; if (!id) return;
    const c = ctlFind(id); if (!c) return;
    c.d = dateOf(e.target.value); ctlSave(c); fillPick($('ctl-pick').value || id);
    status('ok-t', `✔ Date du contrôle ${c.id} : ${new Date(c.d).toLocaleDateString('fr-FR')}.`);
  });
  $('ctl-list').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const c = ctlFind(b.dataset.id); if (!c) return;
    if (b.dataset.act === 'print') printSheets(c);
    else if (b.dataset.act === 'corr') printCorrige(c);
    else if (b.dataset.act === 'ai') download(`controle-${c.id}-correction.txt`, aiText(c));
    else if (b.dataset.act === 'del') {
      if (!confirm(`Supprimer le contrôle « ${c.t} » (${c.id}, ${c.s.length} copies) ?\nTu ne pourras plus imprimer ses corrigés ni ses étiquettes depuis cet appareil.`)) return;
      try { localStorage.setItem(CTL_STORE, JSON.stringify(ctlAll().filter((x) => x.id !== c.id))); } catch (err) { /* rien */ }
      if (last?.id === c.id) last = null;
      fillPick(ctlAll()[0]?.id);
      status('ok-t', `🗑 Contrôle ${c.id} supprimé de cet appareil.${profDest()?.send ? ` Sa ligne CTRL-${c.id} reste dans Grist : supprime-la là-bas si tu veux.` : ''}`);
    }
  });
  loadNames();
  drawSeats();
  let last = null;
  const status = (cls, html) => { $('ctl-status').className = 'small ' + cls; $('ctl-status').innerHTML = html; };
  function create(c) {
    ctlSave(c); last = c;
    printSheets(c);
    status('ok-t', `✔ Contrôle <b>${c.id}</b> créé (${c.s.length} copies, codes ${ctlCode(c.id, 1)} à ${ctlCode(c.id, c.s.length)}). Il est enregistré sur cet appareil.`);
    const dest = profDest();
    if (dest?.send) {
      dest.send([`(contrôle ${c.id})`, 'CTRL-' + c.id, c.c, c.t, '', JSON.stringify(c)])
        .then(() => status('ok-t', `✔ Contrôle <b>${c.id}</b> créé (${c.s.length} copies) et sauvegardé dans Grist (ligne CTRL-${c.id}).`))
        .catch(() => { /* reste enregistré sur cet appareil */ });
    }
    fillPick(c.id);
  }
  // ---- préparation : plan (questions par compétence, ★), durée estimée, puis impression ----
  let prep = null; // { c, p } : contrôle préparé (id, élèves, compétences) et son plan
  const planBox = $('ctl-plan');
  const invalidate = () => { if (prep) { prep = null; planBox.innerHTML = ''; status('', 'Liste ou compétences modifiées : clique à nouveau sur « Préparer le contrôle ».'); } };
  ['ctl-names', 'ctl-students', 'ctl-classe', 'ctl-q', 'ctl-title'].forEach((id) => $(id).addEventListener('change', invalidate));
  document.getElementById('prof-list').addEventListener('change', invalidate);
  function drawPlan(msg = '') {
    const { c, p } = prep, K = c.k;
    const T = ctlMinutes(K, p), pa = ctlVer(p, K, 'a'), hasA = c.s.some(([, v]) => v === 'a');
    const nq = (pp) => pp.n.reduce((a, b) => a + b, 0);
    planBox.innerHTML = `<div class="ctl-plan"><table class="voc"><thead><tr><th>Compétence</th><th>Questions</th><th>dont ★ plus difficiles</th><th>≈ min</th>${hasA ? '<th>Version aménagée</th>' : ''}</tr></thead><tbody>${K.map((k, i) => {
      const slow = GENS[k]?.slow, hard = ctlHard(k, c.g);
      return `<tr><td><b>C${i + 1}</b> ${esc(GENS[k]?.label || k)}</td>
        <td>${slow ? '1 (tracé)' : `<button type="button" class="mini" data-a="n" data-d="-1" data-i="${i}" aria-label="Une question de moins">−</button> <b>${p.n[i]}</b> <button type="button" class="mini" data-a="n" data-d="1" data-i="${i}" aria-label="Une question de plus">+</button>`}</td>
        <td>${hard ? `<button type="button" class="mini" data-a="h" data-d="-1" data-i="${i}" aria-label="Une question ★ de moins">−</button> <b>${p.h[i]}</b> <button type="button" class="mini" data-a="h" data-d="1" data-i="${i}" aria-label="Une question ★ de plus">+</button>` : '<span class="small muted">—</span>'}</td>
        <td>${fmt(Math.round(ctlT(k) * (p.n[i] + (HARD_X - 1) * (hard ? p.h[i] : 0)) * 2) / 2)}</td>${hasA ? `<td>${pa.n[i]}</td>` : ''}</tr>`;
    }).join('')}</tbody></table>
      <p><b>Durée estimée : ≈ ${Math.round(T)} min</b> (${nq(p)} questions)${hasA ? ` · version aménagée : ${nq(pa)} questions, sans ★, avec des aides` : ''}. <span class="small muted">Temps estimés : à ajuster après un premier contrôle.</span></p>
      ${msg ? `<p class="small">${msg}</p>` : ''}
      <p><button type="button" class="btn primary" id="ctl-print">🖨️ Imprimer les sujets</button> <span class="small muted">${c.s.length} copies · contrôle ${c.id}</span></p></div>`;
    planBox.querySelectorAll('button[data-a]').forEach((bt) => bt.addEventListener('click', () => {
      const i = Number(bt.dataset.i), d = Number(bt.dataset.d);
      if (bt.dataset.a === 'n') { p.n[i] = Math.min(6, Math.max(1, p.n[i] + d)); p.h[i] = Math.min(p.h[i], p.n[i]); p.a = null; }
      else p.h[i] = Math.min(p.n[i], Math.max(0, p.h[i] + d));
      drawPlan();
    }));
    $('ctl-print').addEventListener('click', () => {
      const cc = { ...c, d: dateOf($('ctl-date').value), n: [...p.n], h: [...p.h], a: p.a ? [...p.a] : null, r: { ...(p.r || {}) } };
      const over = ctlOverflow(cc);
      if (!over.length) { create(cc); return; }
      drawPlan(`<span class="warn-t">⚠ ${over.length} copie${over.length > 1 ? 's' : ''} sur ${cc.s.length} dépasse${over.length > 1 ? 'nt' : ''} une page (${over.slice(0, 6).join(', ')}${over.length > 6 ? '…' : ''}) : enlève une question (−), ou</span> <button type="button" class="mini" id="ctl-force">imprime quand même</button>`);
      $('ctl-force').addEventListener('click', () => create(cc));
    });
  }
  $('ctl-make').addEventListener('click', () => {
    const ks = sel(), ns = names();
    if (!ks.length) { status('ko-t', 'Coche au moins une compétence dans la liste ci-dessus.'); return; }
    if (!ns.length) { status('ko-t', 'Colle la liste des élèves.'); $('ctl-names').focus(); return; }
    const am = new Set(amenGet($('ctl-classe').value));
    const c = { id: newCtlId(), g: 2, t: $('ctl-title').value.trim() || 'Contrôle', c: $('ctl-classe').value, d: dateOf($('ctl-date').value), k: ks, s: ns.map((n) => [n, am.has(normName(n)) ? 'a' : 's']) };
    const mode = $('ctl-q').value;
    status('', '🧮 Calcul du contrôle (mise en page de chaque copie)…'); planBox.innerHTML = '';
    setTimeout(() => {
      let p, msg = '';
      if (mode.startsWith('a')) {
        const r = ctlAutoPlan(c, Number(mode.slice(1)));
        p = r.p;
        if (r.tooMany) msg = '<span class="warn-t">⚠ Même avec une seule question par compétence, la page déborde : enlève une compétence.</span>';
        else if (r.short) msg = `<span class="warn-t">La page est pleine à ≈ ${Math.round(ctlMinutes(c.k, p))} min.</span> Pour aller jusqu'à ${mode.slice(1)} min sans déborder : ajoute une compétence de tracé, ou une compétence qui a des questions ★.`;
        else if (r.long) msg = '<span class="warn-t">Ces compétences demandent déjà plus de temps que prévu, même avec une seule question chacune.</span>';
        if (r.amOver) msg += ' <span class="warn-t">La version aménagée dépasse une page même avec une question par compétence : enlève une compétence, ou imprime-la en recto-verso.</span>';
      } else p = { n: ks.map((k) => (GENS[k]?.slow ? 1 : Number(mode))), h: ks.map(() => 0) };
      prep = { c, p };
      status('ok-t', `Contrôle ${c.id} préparé. Vérifie la durée, ajuste si besoin avec − et +, puis imprime.`);
      drawPlan(msg);
    }, 30);
  });
  // ---- étiquettes ----
  function fillPick(id) {
    const all = ctlAll();
    $('ctl-pick').innerHTML = all.length ? all.map((c) => `<option value="${c.id}"${c.id === id ? ' selected' : ''}>${c.id} · ${esc(c.t)} · ${esc(c.c || '')} · ${new Date(c.d).toLocaleDateString('fr-FR')}</option>`).join('') : '<option value="">(aucun contrôle sur cet appareil)</option>';
    drawList(id);
    drawTable();
  }
  let edits = {};
  function drawTable() {
    const c = ctlFind($('ctl-pick').value); const host = $('ctl-table');
    if (!c) { host.innerHTML = ''; return; }
    const res = parseCtlResults($('ctl-res').value, c);
    const rows = c.s.map(([name, ver], i) => {
      const n = i + 1, r = res[n] || { lv: [], bits: [], doubt: [] }, e = edits[c.id + n] || {};
      return { n, name, ver, lv: c.k.map((_, ci) => e[ci] || r.lv[ci] || ''), bits: r.bits, doubt: r.doubt, note: r.note };
    });
    const done = rows.filter((r) => r.lv.every(Boolean));
    host.innerHTML = `<div class="table-wrap"><table class="voc res-tab ctl-res"><thead><tr><th>Élève</th><th>Code</th>${c.k.map((k, i) => `<th title="${esc(GENS[k]?.label || k)}">C${i + 1}</th>`).join('')}<th>Remarque</th></tr></thead><tbody>${rows.map((r) => `<tr><td><b>${esc(r.name)}</b>${r.ver === 'a' ? ' <span class="small muted">(am.)</span>' : ''}</td><td>${ctlCode(c.id, r.n)}</td>${r.lv.map((l, ci) => `<td class="${r.doubt[ci] ? 'doubt' : ''}"><select data-n="${r.n}" data-ci="${ci}" class="lv-${l}"><option value="">—</option>${LEVELS.map((x) => `<option${x === l ? ' selected' : ''}>${x}</option>`).join('')}</select>${r.bits[ci] ? `<span class="small muted"> ${r.bits[ci]}</span>` : ''}</td>`).join('')}<td class="small">${esc(r.note || '')}</td></tr>`).join('')}</tbody></table></div>
      <p class="small muted">Cases orangées : Claude a un doute, vérifie la copie. Tu peux changer chaque niveau.</p>
      <p><button type="button" class="btn primary" id="ctl-print-lbl"${done.length ? '' : ' disabled'}>🏷️ Imprimer ${done.length} étiquette${done.length > 1 ? 's' : ''}</button> <button type="button" class="btn" id="ctl-copy">Copier le tableau</button> <span class="small muted">Seuls les élèves dont toutes les compétences ont un niveau ont une étiquette.</span></p>`;
    host.querySelectorAll('select').forEach((s) => s.addEventListener('change', () => { const k = c.id + s.dataset.n; edits[k] = edits[k] || {}; edits[k][s.dataset.ci] = s.value; drawTable(); }));
    $('ctl-print-lbl')?.addEventListener('click', () => printLabels(c, done, Number($('ctl-skip').value), profDest()));
    $('ctl-copy').addEventListener('click', async (ev) => {
      const tsv = [['Élève', 'Code', ...c.k.map((k, i) => `C${i + 1} ${GENS[k]?.label || k}`)].join('\t'), ...rows.map((r) => [r.name, ctlCode(c.id, r.n), ...r.lv].join('\t'))].join('\n');
      try { await navigator.clipboard.writeText(tsv); ev.target.textContent = '✔ Copié'; } catch (_) { ev.target.textContent = 'Copie impossible'; }
    });
  }
  $('ctl-pick').addEventListener('change', () => { edits = {}; drawTable(); });
  $('ctl-res').addEventListener('input', drawTable);
  $('ctl-import-go').addEventListener('click', () => {
    let c = null; try { c = JSON.parse($('ctl-import').value.trim()); } catch (e) { c = null; }
    if (!ctlValid(c)) { $('ctl-import-st').className = 'small ko-t'; $('ctl-import-st').textContent = 'Je ne reconnais pas ce contenu : copie bien toute la cellule « Détail » de la ligne CTRL-….'; return; }
    ctlSave(c); fillPick(c.id); $('ctl-import-st').className = 'small ok-t'; $('ctl-import-st').textContent = `✔ Contrôle ${c.id} importé.`;
  });
  fillPick(ctlAll()[0]?.id);
}

/* ---------- Page « Mon contrôle » : #/r/2.ID.n.ver.plan.clés.niveaux.réponses.classe[/g=…] (v1 : q au lieu du plan) ---------- */
let retourSpec = null;
function routeRetour(spec) {
  const page = document.querySelector('.page[data-p="retour"]'), host = page.querySelector('.retour');
  if (spec === retourSpec) return '';
  retourSpec = spec;
  const [main, ...segs] = spec.split('/');
  const [v, id, nS, verS, qS, ksS, lvS, bitsS, clS] = main.split('.');
  const ver = (verS || 's')[0], salt = parseInt((verS || '').slice(1), 10) || 0;
  const keys = (ksS || '').split('+'), n = parseInt(nS, 10);
  // lien v1 : q questions par compétence ; lien v2 : plan détaillé (ex. 3-4h1-1) ; lien v3 : pareil, contrôle créé avec PROG_RULES
  const plan = v === '1' ? ctlPlan({ k: keys, q: parseInt(qS, 10) }) : v === '2' || v === '3' ? planParse(qS) : null;
  if (!plan || plan.n.length !== keys.length || !/^[0-9A-Z]{3}$/.test(id || '') || !n || !keys.length) {
    host.innerHTML = '<h1>Lien illisible</h1><p class="lead">Ce QR code n\'a pas pu être lu en entier. Réessaie de le scanner, bien à plat et bien éclairé.</p><p><a class="btn" href="#/">Accueil du site</a></p>';
    return '';
  }
  let classe = ''; try { classe = decodeURIComponent(clS || ''); } catch (e) { classe = ''; }
  const extra = (classe ? '/c=' + encodeURIComponent(classe) : '') + segs.filter((s) => /^[fg]=/.test(s)).map((s) => '/' + s).join('');
  const levels = keys.map((_, i) => LV1R[(lvS || '')[i]] || '');
  const qs = ctlQuestions(id, n, ver === 'a' ? 'a' : 's', keys, plan, salt, v === '3' ? 2 : 0);
  // réponses : une suite de 0/1 rangée par compétence (dans l'ordre des compétences)
  const counts = ctlVer(plan, keys, ver === 'a' ? 'a' : 's').n, starts = counts.map((_, i) => counts.slice(0, i).reduce((a, b) => a + b, 0));
  const bitOf = (x) => ((bitsS || '').length === qs.length ? bitsS[starts[x.ci] + x.m] || '-' : '-');
  const tone = { TB: 'ok', MS: 'ok2', MF: 'mid', MI: 'ko' };
  host.innerHTML = `<div class="hero"><p class="kicker">Mon contrôle · ${ctlCode(id, n)}</p><h1>Ton corrigé et tes exercices</h1>
    <p class="lead">Regarde d'abord ton bilan, puis refais les exercices proposés : c'est comme ça qu'une compétence fragile devient acquise.</p></div>
    <div class="card"><h2>Ton bilan</h2><ul class="ctl-bilan">${keys.map((k, i) => {
      const l = levels[i], lab = GENS[k]?.label || 'Notion inconnue';
      const link = GENS[k] ? `#/devoir/${k}/5/r${extra}` : ''; // r : remédiation (rangée à part dans le bilan Grist)
      const act = !GENS[k] || !l ? '' : l === 'TB' ? '<span class="ok-t">✔ Bravo !</span>' : `<a class="btn${l === 'MS' ? '' : ' primary'}" href="${link}">${l === 'MS' ? '💪 Je m\'entraîne encore' : '🔁 Je refais ces exercices'}</a>`;
      return `<li><span class="lv lv-${tone[l] || 'none'}">${l || '?'}</span> <b>${esc(lab)}</b> <span class="small muted">${l ? LEVEL_TXT[l] : ''}</span> ${act}</li>`;
    }).join('')}</ul>
    <p class="small muted">Les exercices s'ouvrent comme un devoir : écris ton prénom au début, ton professeur verra que tu les as faits.</p></div>
    <div class="card"><h2>Le corrigé de ton sujet</h2><div class="ctl-ret"></div></div>`;
  const list = host.querySelector('.ctl-ret');
  qs.forEach((x, j) => {
    const sec = document.createElement('section'); sec.className = 'ctl-rq';
    const b = bitOf(x);
    sec.innerHTML = `<h3><span class="qn">${j + 1}</span> <span class="small muted">${esc(GENS[x.k].label)}${x.hard ? ' · ★ plus difficile' : ''}</span> ${b === '1' ? '<span class="ok-t">✔ juste</span>' : b === '0' ? '<span class="ko-t">✘ à revoir</span>' : ''}</h3><div class="ex-q"></div><div class="ex-fb ok"></div><div class="ex-anim"></div>`;
    list.appendChild(sec);
    const qd = sec.querySelector('.ex-q'), fb = sec.querySelector('.ex-fb');
    qd.innerHTML = x.o.q;
    try { x.o.mount?.(qd); } catch (e) { /* rien */ }
    let res = { msg: '' };
    try { res = revealAnswer(x.o, qd) || res; } catch (e) { /* rien */ }
    qd.querySelectorAll('input, button').forEach((i) => { i.disabled = true; });
    if (qd.querySelector('.board')) {
      fb.innerHTML = x.o.anim ? '<button type="button" class="btn">▶ Voir la construction</button>' : '';
      fb.querySelector('button')?.addEventListener('click', () => { fb.innerHTML = ''; makePlayer(sec.querySelector('.ex-anim'), x.o.anim()).play(); });
    } else fb.innerHTML = res.msg ? '<strong>Correction :</strong> ' + res.msg : '';
    if (!fb.innerHTML) fb.remove();
  });
  return GENS[keys.find((k) => GENS[k])]?.ch || '';
}
