/* =========================================================
   Région 5 — LA FORGE AUX MACHINES · chapitre 5 « Addition, soustraction, multiplication »
   Attendus : additionner, soustraire, multiplier des décimaux ; ordre de grandeur ; ×10, ×100, ×0,1, ×0,5 ;
   écrire un calcul en une ligne avec des parenthèses ; priorité de la multiplication ; calcul malin.
   Énigmes :
     machine  on construit un calcul en une ligne avec des cartes (nombres, + − ×, parenthèses). La machine
              l'évalue EXACTEMENT comme écrit (priorités) et forge une barre ; on la compare à la commande.
     balance  des bons déjà calculés : justes ou virgule mal placée. On trie par ORDRE DE GRANDEUR (temps compté,
              2 calculs exacts seulement) puis on replace la virgule des bons absurdes.
     malin    chaque calcul brûle du charbon (plus c'est compliqué, plus ça coûte) : regrouper malin
              (25 × 4 d'abord) ou mettre en facteur (13 × 7 + 13 × 3) économise le charbon.
   Gardien : la Grande Commande du château (commande à programmer, puis calculs à budget de charbon serré).
   Calculs EXACTS : décimaux = entiers {n, s} (n / 10^s), jamais de flottants pour juger.
   ========================================================= */
(function () {
  'use strict';
  const { h, svg: S } = Atlas;

  /* ---------- Style propre à la forge ---------- */
  (function css() {
    if (typeof document === 'undefined' || document.getElementById('forge-css')) return;
    const st = document.createElement('style');
    st.id = 'forge-css';
    st.textContent = `
.fg-line{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;min-height:60px;width:min(820px,100%);box-sizing:border-box;padding:8px 10px;background:#fff;border:3px solid #8b5a2b;border-radius:12px;font:800 26px ui-monospace,Consolas,monospace}
.fg-chip{padding:2px 10px;border-radius:8px;background:#f1f3f5;border:2px solid #adb5bd;min-width:20px;text-align:center;transition:transform .15s,background .15s}
.fg-chip.num{background:#fff3bf;border-color:#f59f00}
.fg-chip.op{background:#e7f5ff;border-color:#339af0}
.fg-chip.par{background:#ebfbee;border-color:#51cf66}
.fg-chip.hl{background:#ffa94d;border-color:#d9480f;transform:scale(1.1)}
.fg-chip.sel{background:#a5d8ff;border-color:#1864ab;transform:scale(1.1)}
.fg-leaf{font:800 26px ui-monospace,Consolas,monospace;cursor:pointer;color:#2b1d0e;min-height:48px;touch-action:manipulation}
.fg-op{font:800 26px ui-monospace,Consolas,monospace;color:#1864ab}
.fg-tray{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;width:min(820px,100%)}
.fg-card{font:800 22px "Trebuchet MS",system-ui,sans-serif;color:#2b1d0e;min-width:64px;min-height:54px;padding:6px 12px;border:3px solid #8b5a2b;border-radius:10px;background:linear-gradient(#fffdf6,#f3e4c0);box-shadow:0 3px 0 #4a2f14;cursor:pointer;touch-action:manipulation}
.fg-card.num{background:linear-gradient(#fff9db,#ffe066)}
.fg-card.op{background:linear-gradient(#e7f5ff,#a5d8ff);min-width:54px;font-size:28px}
.fg-card:active{transform:translateY(2px);box-shadow:0 1px 0 #4a2f14}
.fg-card:disabled{opacity:.3;box-shadow:none}
.fg-card small{font-size:14px;font-weight:700;opacity:.75}
.fg-bon{width:min(560px,100%);box-sizing:border-box;background:#fff6dc;border:3px solid #8b5a2b;border-radius:6px;padding:10px 14px;text-align:center;box-shadow:0 4px 0 rgba(0,0,0,.25);background-image:repeating-linear-gradient(transparent,transparent 31px,rgba(139,90,43,.12) 32px)}
.fg-bon .eq{font:800 34px ui-monospace,Consolas,monospace;margin:6px 0;word-break:break-word}
.fg-bon .eq .cl{color:#c92a2a;border-bottom:4px double #c92a2a}
.fg-time{width:min(560px,100%);height:12px;border-radius:6px;background:#dee2e6;overflow:hidden;border:2px solid #8b5a2b;box-sizing:border-box}
.fg-time i{display:block;height:100%;background:linear-gradient(90deg,#ff922b,#fa5252);width:100%}
.fg-dig{display:flex;justify-content:center;align-items:center;font:800 40px ui-monospace,Consolas,monospace;margin:6px 0}
.fg-gap{min-width:34px;height:56px;border:2px dashed #339af0;border-radius:8px;background:#e7f5ff;color:#1864ab;font:800 30px ui-monospace,monospace;cursor:pointer;margin:0 1px;padding:0;touch-action:manipulation}
.fg-gap:active{background:#74c0fc}
.fg-box{width:min(820px,100%);box-sizing:border-box;background:#fff;border:2px solid #8b5a2b;border-radius:10px;padding:8px 12px;font-size:17px;line-height:1.45}
.fg-dots{display:flex;gap:6px;justify-content:center}
.fg-dots i{width:18px;height:18px;border-radius:50%;border:2px solid #8b5a2b;background:#fff}
.fg-dots i.on{background:#40c057;border-color:#1b5e20}
`;
    document.head.append(st);
  })();

  /* =====================================================================
     DÉCIMAUX EXACTS : {n, s} = n / 10^s  (n entier, s >= 0)
     ===================================================================== */
  const Dd = (n, s = 0) => ({ n, s });
  const P10 = (k) => Math.pow(10, k);
  const align = (a, b) => { const s = Math.max(a.s, b.s); return [a.n * P10(s - a.s), b.n * P10(s - b.s), s]; };
  const addD = (a, b) => { const [x, y, s] = align(a, b); return Dd(x + y, s); };
  const subD = (a, b) => { const [x, y, s] = align(a, b); return Dd(x - y, s); };
  const mulD = (a, b) => Dd(a.n * b.n, a.s + b.s);
  const cmpD = (a, b) => { const [x, y] = align(a, b); return x - y; };
  const eqD = (a, b) => cmpD(a, b) === 0;
  const normD = (d) => { let n = d.n, s = d.s; while (s > 0 && n % 10 === 0) { n /= 10; s--; } return Dd(n, s); };
  const toF = (d) => d.n / P10(d.s);
  /* Écriture française. raw : garde les décimales écrites (7,50) ; minDec : au moins ce nombre de décimales. */
  function strD(d, o = {}) {
    let { n, s } = o.raw ? d : normD(d);
    if (o.minDec && s < o.minDec) { n *= P10(o.minDec - s); s = o.minDec; }
    const neg = n < 0;
    let t = String(Math.abs(n));
    while (t.length <= s) t = '0' + t;
    const ent = t.slice(0, t.length - s).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? '−' : '') + ent + (s ? ',' + t.slice(t.length - s) : '');
  }
  const eur = (d) => strD(d, { minDec: 2 }) + ' €';

  /* =====================================================================
     ÉVALUATEUR D'EXPRESSIONS : cartes -> arbre -> étapes (exactement comme écrit)
     Jetons : {k:'num', d, label, ci} | {k:'op', v:'+'|'−'|'×'} | {k:'('} | {k:')'}
     ===================================================================== */
  function parseExpr(toks) {
    let i = 0;
    const fail = (msg) => { throw { msg }; };
    const isOp = (t, ...vs) => t && t.k === 'op' && vs.includes(t.v);
    const expr = () => {
      let l = term();
      while (isOp(toks[i], '+', '−')) {
        const op = toks[i].v; i++;
        const r = term();
        l = { t: 'bin', op, l, r, i0: l.i0, i1: r.i1 };
      }
      return l;
    };
    const term = () => {
      let l = fac();
      while (isOp(toks[i], '×')) {
        i++;
        const r = fac();
        l = { t: 'bin', op: '×', l, r, i0: l.i0, i1: r.i1 };
      }
      return l;
    };
    const fac = () => {
      const t = toks[i];
      if (!t) fail('Le calcul n\'est pas fini : il manque un nombre à la fin.');
      if (t.k === 'num') {
        i++;
        const nx = toks[i];
        if (nx && (nx.k === 'num' || nx.k === '(')) fail('Il manque un signe (+, − ou ×) entre deux nombres.');
        return { t: 'num', d: t.d, i0: i - 1, i1: i - 1 };
      }
      if (t.k === '(') {
        const o = i; i++;
        const e = expr();
        if (!toks[i] || toks[i].k !== ')') fail('Il manque une parenthèse fermante.');
        const c = i; i++;
        if (toks[i] && (toks[i].k === 'num' || toks[i].k === '(')) fail('Il manque un signe (+, − ou ×) après la parenthèse.');
        e.i0 = o; e.i1 = c;
        return e;
      }
      if (t.k === ')') fail('Une parenthèse fermante est mal placée.');
      return fail('Un signe est mal placé : il faut d\'abord un nombre ou une parenthèse.');
    };
    if (!toks.length) fail('Écris d\'abord ton calcul avec les cartes.');
    const ast = expr();
    if (i < toks.length) fail(toks[i].k === ')' ? 'Il y a une parenthèse fermante en trop.' : 'Le calcul est mal écrit.');
    return ast;
  }
  /* Évalue en notant les étapes dans l'ordre exact où la machine les fait. */
  function evalNode(n, steps) {
    if (n.t === 'num') return n.d;
    const a = evalNode(n.l, steps), b = evalNode(n.r, steps);
    const res = n.op === '+' ? addD(a, b) : n.op === '−' ? subD(a, b) : mulD(a, b);
    steps.push({ a, b, op: n.op, res, i0: n.i0, i1: n.i1 });
    return res;
  }
  const stepTxt = (s, f = strD) => `${f(s.a)} ${s.op} ${f(s.b)} = ${f(s.res)}`;
  function exprStr(toks) {
    return toks.map((t) => (t.k === 'num' ? t.label : t.k === 'op' ? t.v : t.k)).join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
  }
  function calcLigne(toks) { const steps = []; const ast = parseExpr(toks); const res = evalNode(ast, steps); return { res, steps }; }

  /* =====================================================================
     ÉDITEUR DE LIGNE : des cartes à toucher (nombres, + − ×, parenthèses)
     ===================================================================== */
  function lineEditor(host, cards, { maxTokens = 17 } = {}) {
    const line = [];
    let hl = null, locked = false;
    const box = h('div', { class: 'fg-line' });
    const tray = h('div', { class: 'fg-tray' });
    const ops = h('div', { class: 'fg-tray' });
    const ctrl = h('div', { class: 'puz-tools' });
    host.append(box, tray, ops, ctrl);
    const btn = new Map();
    const render = () => {
      box.innerHTML = '';
      if (!line.length) box.append(h('span', { style: 'font:700 17px "Trebuchet MS",sans-serif;color:#adb5bd' }, 'Touche les cartes pour écrire ton calcul…'));
      line.forEach((t, i) => {
        const cls = 'fg-chip ' + (t.k === 'num' ? 'num' : t.k === 'op' ? 'op' : 'par') + (hl && i >= hl[0] && i <= hl[1] ? ' hl' : '');
        box.append(h('span', { class: cls }, t.k === 'num' ? t.label : t.k === 'op' ? t.v : t.k));
      });
      cards.forEach((c) => { btn.get(c.ci).disabled = locked || line.some((t) => t.k === 'num' && t.ci === c.ci); });
      opBtns.forEach((b) => { b.disabled = locked; });
    };
    const push = (t) => {
      if (locked) return;
      if (line.length >= maxTokens) return Atlas.UI.toast('Ton calcul est déjà très long.', 'bad');
      line.push(t); hl = null; render();
    };
    cards.forEach((c) => {
      const b = h('button', { class: 'fg-card num', onclick: () => push({ k: 'num', ci: c.ci, d: c.d, label: c.label }) }, c.label, c.unit ? h('small', {}, ' ' + c.unit) : null);
      btn.set(c.ci, b); tray.append(b);
    });
    const opBtns = [['+', '+'], ['−', '−'], ['×', '×'], ['(', '('], [')', ')']].map(([v, lab]) => {
      const b = h('button', { class: 'fg-card op', onclick: () => push(v.length && '+−×'.includes(v) ? { k: 'op', v } : { k: v }) }, lab);
      ops.append(b); return b;
    });
    ctrl.append(
      h('button', { class: 'btn', onclick: () => { if (!locked) { line.pop(); hl = null; render(); } } }, '⌫ Effacer le dernier'),
      h('button', { class: 'btn', onclick: () => { if (!locked) { line.length = 0; hl = null; render(); } } }, '🗑 Tout effacer'));
    render();
    return {
      tokens: () => line.slice(), ctrl, box,
      hl: (a, b) => { hl = a == null ? null : [a, b]; render(); },
      lock: (v) => { locked = v; render(); },
    };
  }

  /* =====================================================================
     ÉNIGME « machine » : programmer la machine
     ===================================================================== */
  const eur10 = (r, lo, hi) => Dd(r.int(lo, hi) * 10, 2);          // 3,50 .. : multiples de 10 centimes
  const num = (d, ci, unit) => ({ d, ci, label: strD(d, { raw: true }), unit });
  const B = (t) => `<b>${t}</b>`;

  /* Une commande : texte, cartes, valeur juste, dessin de la vraie commande, erreurs classiques. */
  function makeOrder(r, kind) {
    for (let guard = 0; guard < 200; guard++) {
      let O = null;
      if (kind === 'A') { // a + n × b
        const a = eur10(r, 35, 125), b = eur10(r, 25, 95), n = r.int(2, 5);
        O = {
          unit: '€', cards: [num(a, 0, '€'), num(Dd(n), 1), num(b, 2, '€')],
          text: `Un manche à ${B(eur(a))} et ${B(n)} lames à ${B(eur(b))} chacune. Quel est le prix total ?`,
          correct: addD(a, mulD(Dd(n), b)),
          segs: [{ v: a, col: '#f59f00', lab: 'manche' }, ...Array.from({ length: n }, () => ({ v: b, col: '#74c0fc', lab: 'lame' }))],
          wrongs: [{ v: mulD(addD(a, Dd(n)), b), why: `Elle a d'abord additionné ${strD(a)} + ${n} (un prix et un nombre de lames !), puis multiplié par ${strD(b)}.` }],
        };
      } else if (kind === 'B') { // n × (a + b)
        const a = eur10(r, 35, 95), b = eur10(r, 25, 75), n = r.int(3, 6);
        O = {
          unit: '€', cards: [num(a, 0, '€'), num(b, 1, '€'), num(Dd(n), 2)],
          text: `Une épée, c'est ${B('1 manche à ' + eur(a))} et ${B('1 lame à ' + eur(b))}. Quel est le prix de ${B(n)} épées ?`,
          correct: mulD(Dd(n), addD(a, b)),
          segs: Array.from({ length: n }, () => [{ v: a, col: '#f59f00', lab: 'manche' }, { v: b, col: '#74c0fc', lab: 'lame' }]).flat(),
          wrongs: [
            { v: addD(mulD(Dd(n), a), b), why: `La multiplication passe <b>avant</b> l'addition : elle a calculé ${n} × ${strD(a)} puis ajouté ${strD(b)}. Une seule lame au lieu de ${n} ! Pour additionner d'abord, il faut des <b>parenthèses</b>.` },
            { v: addD(mulD(Dd(n), b), a), why: `La multiplication passe <b>avant</b> l'addition : elle a calculé ${n} × ${strD(b)} puis ajouté ${strD(a)}. Un seul manche au lieu de ${n} ! Pour additionner d'abord, il faut des <b>parenthèses</b>.` },
          ],
        };
      } else if (kind === 'C') { // a − n × b  (longueurs)
        const b = Dd(r.int(12, 45), 1), n = r.int(2, 4);
        const a = addD(mulD(Dd(n), b), Dd(r.int(8, 60), 1));
        O = {
          unit: 'm', cards: [num(a, 0, 'm'), num(Dd(n), 1), num(b, 2, 'm')],
          text: `Une barre de ${B(strD(a) + ' m')}. On y coupe ${B(n)} morceaux de ${B(strD(b) + ' m')} chacun. Quelle longueur reste-t-il ?`,
          correct: subD(a, mulD(Dd(n), b)),
          segs: [...Array.from({ length: n }, () => ({ v: b, col: '#adb5bd', lab: 'coupé', gray: true })), { v: subD(a, mulD(Dd(n), b)), col: '#69db7c', lab: 'reste' }],
          from: mulD(Dd(n), b),
          wrongs: [{ v: mulD(subD(a, Dd(n)), b), why: `Elle a d'abord retiré ${n} mètres (le nombre de morceaux !) de ${strD(a)}, puis multiplié par ${strD(b)}.` }],
        };
      } else if (kind === 'D') { // (a − b) × n
        const a = eur10(r, 60, 120), d = eur10(r, 10, 30), n = r.int(3, 6);
        const b = subD(a, d);
        O = {
          unit: '€', cards: [num(a, 0, '€'), num(b, 1, '€'), num(Dd(n), 2)],
          text: `Une lame passe de ${B(eur(a))} à ${B(eur(b))}. Combien économise-t-on sur ${B(n)} lames ?`,
          correct: mulD(subD(a, b), Dd(n)),
          segs: Array.from({ length: n }, () => ({ v: d, col: '#69db7c', lab: 'économie' })),
          wrongs: [{ v: subD(a, mulD(b, Dd(n))), why: `La multiplication passe <b>avant</b> la soustraction : elle a calculé ${strD(b)} × ${n} puis l'a retiré de ${strD(a)}. Pour soustraire d'abord, il faut des <b>parenthèses</b>.` }],
        };
      } else if (kind === 'E') { // (a + b) × n − c
        const a = eur10(r, 35, 95), b = eur10(r, 25, 75), n = r.int(3, 6), c = Dd(r.int(2, 5) * 2);
        O = {
          unit: '€', cards: [num(a, 0, '€'), num(b, 1, '€'), num(Dd(n), 2), num(c, 3, '€')],
          text: `Le château commande ${B(n)} épées (chacune : ${B('1 manche à ' + eur(a))} et ${B('1 lame à ' + eur(b))}). Il a une remise de ${B(eur(c))} sur le tout. Combien doit-il payer ?`,
          correct: subD(mulD(addD(a, b), Dd(n)), c),
          segs: Array.from({ length: n }, () => [{ v: a, col: '#f59f00', lab: 'manche' }, { v: b, col: '#74c0fc', lab: 'lame' }]).flat(),
          cut: c,
          wrongs: [
            { v: subD(addD(a, mulD(b, Dd(n))), c), why: `La multiplication passe <b>avant</b> l'addition : seule la lame (${strD(b)}) a été multipliée par ${n}. Il faut des <b>parenthèses</b> autour de « manche + lame ».` },
            { v: subD(addD(mulD(a, Dd(n)), b), c), why: `La multiplication passe <b>avant</b> l'addition : seul le manche (${strD(a)}) a été multiplié par ${n}. Il faut des <b>parenthèses</b> autour de « manche + lame ».` },
          ],
        };
      } else if (kind === 'F') { // a × n + b × m
        const a = eur10(r, 25, 95), b = eur10(r, 35, 95), n = r.int(2, 5), m = r.int(2, 4);
        O = {
          unit: '€', cards: [num(a, 0, '€'), num(Dd(n), 1), num(b, 2, '€'), num(Dd(m), 3)],
          text: `On commande ${B(n)} lames à ${B(eur(a))} et ${B(m)} manches à ${B(eur(b))}. Quel est le prix total ?`,
          correct: addD(mulD(a, Dd(n)), mulD(b, Dd(m))),
          segs: [...Array.from({ length: n }, () => ({ v: a, col: '#74c0fc', lab: 'lame' })), ...Array.from({ length: m }, () => ({ v: b, col: '#f59f00', lab: 'manche' }))],
          wrongs: [
            { v: mulD(addD(mulD(a, Dd(n)), b), Dd(m)), why: `Avec ces parenthèses, la machine additionne d'abord le prix des lames et un manche, puis multiplie le tout par ${m}. Ce n'est pas la commande !` },
            { v: addD(mulD(a, addD(Dd(n), b)), Dd(m)), why: `La machine a additionné ${n} (un nombre de lames) et ${strD(b)} (un prix) : ça n'a pas de sens !` },
          ],
        };
      }
      if (O.correct.n < 0 || O.wrongs.some((w) => eqD(w.v, O.correct))) continue;
      O.kind = kind;
      O.cards = r.shuffle(O.cards);
      return O;
    }
    throw new Error('commande impossible');
  }

  /* La machine : deux engrenages, un écran qui affiche les étapes, et deux barres (commande / résultat). */
  function machineView(host) {
    const svg = S.root(host, 800, 300);
    S.el('rect', { x: 0, y: 0, width: 800, height: 300, rx: 14, fill: '#2a1f1a' }, svg);
    S.el('rect', { x: 20, y: 14, width: 320, height: 150, rx: 12, fill: '#6b7280', stroke: '#343a40', 'stroke-width': 4 }, svg);
    S.el('rect', { x: 40, y: 120, width: 120, height: 34, rx: 6, fill: '#ff6b00', opacity: 0.85 }, svg);
    S.el('text', { x: 100, y: 143, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: '#fff3bf', text: 'FOURNEAU' }, svg);
    const gear = (cx, cy, r, teeth, fill, rev) => {
      const g = S.el('g', {}, svg);
      let d = '';
      for (let i = 0; i < teeth; i++) {
        const a = (2 * Math.PI * i) / teeth, st = (2 * Math.PI) / teeth, R = r * 1.25;
        [[0, r], [0.12, R], [0.38, R], [0.5, r]].forEach(([f, rr], j) => {
          d += (i === 0 && j === 0 ? 'M' : 'L') + (cx + rr * Math.cos(a + f * st)).toFixed(1) + ',' + (cy + rr * Math.sin(a + f * st)).toFixed(1);
        });
      }
      S.el('path', { d: d + 'Z', fill, stroke: '#212529', 'stroke-width': 3 }, g);
      S.el('circle', { cx, cy, r: r * 0.35, fill: '#343a40' }, g);
      S.el('animateTransform', { attributeName: 'transform', type: 'rotate', from: `0 ${cx} ${cy}`, to: `${rev ? -360 : 360} ${cx} ${cy}`, dur: '2s', repeatCount: 'indefinite' }, g);
    };
    gear(80, 62, 30, 10, '#fab005'); gear(148, 48, 22, 8, '#ced4da', true); gear(215, 70, 34, 12, '#e8590c'); gear(285, 52, 20, 8, '#74c0fc', true);
    S.el('rect', { x: 356, y: 14, width: 424, height: 150, rx: 12, fill: '#10261a', stroke: '#2f9e44', 'stroke-width': 4 }, svg);
    const lines = [0, 1, 2, 3, 4].map((k) => S.el('text', { x: 372, y: 58 + k * 26, 'font-size': 20, 'font-weight': 700, fill: '#8ce99a', 'font-family': 'ui-monospace,Consolas,monospace' }, svg));
    const head = S.el('text', { x: 372, y: 34, 'font-size': 13, fill: '#51cf66', 'font-weight': 800, text: '' }, svg);
    const layer = S.el('g', {}, svg);
    svg.pauseAnimations && svg.pauseAnimations();
    return {
      svg, layer,
      screen: (arr) => lines.forEach((t, k) => { t.textContent = arr[k] || ''; }),
      head: (t) => { head.textContent = t; },
      spin: (on) => { if (!svg.pauseAnimations) return; if (on) svg.unpauseAnimations(); else svg.pauseAnimations(); },
    };
  }

  /* Dessine la vraie commande (segments) puis la barre forgée par la machine. */
  function drawBars(V, O, res) {
    const L = V.layer; L.innerHTML = '';
    const X0 = 40, W = 720;
    const segs = O.segs.map((s) => ({ ...s, f: toF(s.v) }));
    const total = segs.reduce((a, s) => a + s.f, 0);
    const from = O.from ? toF(O.from) : 0;
    const rf = toF(res);
    const max = Math.max(total, from + Math.max(rf, 0)) * 1.02;
    const k = W / max;
    S.el('text', { x: X0, y: 192, 'font-size': 17, 'font-weight': 800, fill: '#ffd8a8', text: 'La commande, en vrai :' }, L);
    let x = X0;
    segs.forEach((s) => {
      const w = s.f * k;
      S.el('rect', { x, y: 200, width: Math.max(1, w - 2), height: 30, rx: 4, fill: s.col, stroke: '#212529', 'stroke-width': 1.5 }, L);
      if (w > 44) S.el('text', { x: x + w / 2 - 1, y: 221, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: '#212529', text: strD(s.v) }, L);
      x += w;
    });
    if (O.cut) {
      const cw = toF(O.cut) * k;
      S.el('rect', { x: X0 + total * k - cw, y: 198, width: cw, height: 34, fill: 'rgba(224,49,49,.55)', stroke: '#e03131', 'stroke-width': 2, 'stroke-dasharray': '5 3' }, L);
      S.el('text', { x: X0 + total * k - cw / 2, y: 250, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800, fill: '#ffa8a8', text: 'remise' }, L);
    }
    S.el('text', { x: X0, y: 266, 'font-size': 17, 'font-weight': 800, fill: '#ffd8a8', text: 'La barre forgée par la machine :' }, L);
    const endGood = X0 + (from + toF(O.correct)) * k;
    S.el('line', { x1: endGood, y1: 196, x2: endGood, y2: 292, stroke: '#69db7c', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }, L);
    if (rf < 0) {
      S.el('text', { x: X0, y: 288, 'font-size': 17, 'font-weight': 800, fill: '#ff8787', text: `Résultat négatif (${strD(res)}) : impossible de forger une barre !` }, L);
      return;
    }
    const bx = X0 + from * k, bw = rf * k;
    const bar = S.el('rect', { x: bx, y: 272, width: 0, height: 20, rx: 4, fill: '#ff922b', stroke: '#fff', 'stroke-width': 2 }, L);
    const lab = S.el('text', { x: bx + 6, y: 288, 'font-size': 16, 'font-weight': 800, fill: '#212529', text: '' }, L);
    const anim = () => {
      let p = 0;
      const tick = () => {
        p = Math.min(1, p + 0.12);
        bar.setAttribute('width', Math.max(0, bw * p));
        if (p < 1) setTimeout(tick, 30);
        else {
          const ok = eqD(res, O.correct);
          bar.setAttribute('fill', ok ? '#40c057' : '#fa5252');
          lab.textContent = eur2(res, O);
          lab.setAttribute('x', bx + 8);
        }
      };
      tick();
    };
    anim();
  }
  const eur2 = (d, O) => (O.unit === '€' ? eur(d) : strD(d) + ' ' + O.unit);

  function buildMachine(ctx, host, { kinds, prefix = '', onSolved }) {
    const r = ctx.rng;
    let k = 0;
    const next = () => {
      if (k >= kinds.length) return onSolved();
      const O = makeOrder(r, kinds[k]);
      host.innerHTML = '';
      ctx.consigne.innerHTML = `${prefix}<b>Commande ${k + 1} / ${kinds.length}</b> — ${O.text}<br><span class="muted">Écris le calcul en <b>une ligne</b> avec les cartes. La machine le fait <b>exactement</b> comme il est écrit.</span>`;
      const V = machineView(host);
      V.head('ÉCRAN DE LA MACHINE');
      V.screen(['Prête.', 'Écris ton calcul', 'puis lance la machine.']);
      const E = lineEditor(host, O.cards);
      let busy = false;
      const go = h('button', { class: 'btn btn-go', style: 'font-size:20px' }, '⚙️ Lancer la machine');
      E.ctrl.append(go);
      go.onclick = () => {
        if (busy) return;
        const toks = E.tokens();
        let out;
        try { out = calcLigne(toks); } catch (e) { return Atlas.UI.toast(e.msg || 'Ce calcul est mal écrit.', 'bad'); }
        const used = toks.filter((t) => t.k === 'num').length;
        if (used < O.cards.length) return Atlas.UI.toast(`Utilise toutes les cartes-nombres : il t'en reste ${O.cards.length - used}.`, 'bad');
        busy = true; E.lock(true);
        const { res, steps } = out;
        V.layer.innerHTML = '';
        V.spin(true);
        const shown = [];
        let i = 0;
        const play = () => {
          if (i >= steps.length) return end();
          const s = steps[i];
          E.hl(s.i0, s.i1);
          shown.push(`${i + 1}. ${stepTxt(s)}`);
          V.screen(shown);
          i++;
          setTimeout(play, 850);
        };
        const end = () => {
          V.spin(false);
          E.hl(null);
          V.screen([...shown, '→ ' + eur2(res, O)]);
          drawBars(V, O, res);
          setTimeout(() => judge(toks, res, steps), 1300);
        };
        const judge = (toks2, res2, steps2) => {
          if (eqD(res2, O.correct)) {
            Atlas.UI.toast('La commande est parfaite !', 'good');
            ctx.pi(`Bravo ! Les deux barres ont la même longueur. Tu as écrit <b>${exprStr(toks2)}</b>.`, 'good');
            k++;
            setTimeout(next, 1700);
            return;
          }
          const ex = exprStr(toks2);
          const hit = O.wrongs.find((w) => eqD(w.v, res2));
          const first = `La machine a commencé par <b>${stepTxt(steps2[0])}</b>.`;
          let msg;
          if (hit) msg = `Tu as écrit <b>${ex}</b> : la machine a trouvé <b>${eur2(res2, O)}</b>. ${hit.why}`;
          else if (res2.n < 0) msg = `Tu as écrit <b>${ex}</b> : la machine trouve <b>${strD(res2)}</b>, un résultat négatif ! ${first}`;
          else msg = `Tu as écrit <b>${ex}</b> : la machine a forgé une barre <b>${cmpD(res2, O.correct) > 0 ? 'trop longue' : 'trop courte'}</b> (regarde le trait vert). ${first} Rappel : la multiplication passe avant l'addition et la soustraction, les parenthèses passent avant tout.`;
          const hl = ctx.fail(msg);
          if (hl > 0) setTimeout(() => { busy = false; E.lock(false); }, 1500);
        };
        play();
      };
      ctx.pi(k === 0 ? 'La machine fait les <b>×</b> avant les <b>+</b> et les <b>−</b>. Les <b>( )</b> passent en premier. Elle ne devine jamais : elle fait ce qui est écrit !' : 'Même règle : les parenthèses d\'abord, puis les ×, puis + et −.');
    };
    next();
  }

  /* =====================================================================
     ÉNIGME « balance » : contrôle par ordre de grandeur
     ===================================================================== */
  const digitsOf = (d) => String(Math.abs(normD(d).n));
  const sig1 = (x) => { // arrondi à 1 chiffre significatif (affichage et estimation)
    if (x === 0) return 0;
    const e = Math.floor(Math.log10(Math.abs(x)) + 1e-9), u = Math.pow(10, e);
    return Math.round(x / u) * u;
  };
  const fF = (x) => Atlas.fmt(Math.round(x * 1e6) / 1e6, 6);

  function claimStr(digits, pos) {
    const n = digits.length;
    if (pos <= 0) return '0,' + '0'.repeat(-pos) + digits;
    if (pos >= n) return digits + '0'.repeat(pos - n);
    return digits.slice(0, pos) + ',' + digits.slice(pos);
  }

  function makeBon(r) {
    for (let guard = 0; guard < 500; guard++) {
      const kind = r.pick(['mul', 'mul', 'mul', 'add', 'sub', 'shift', 'shift']);
      let a, b, res, sym, rule = '';
      if (kind === 'mul') {
        const sty = r.int(0, 3);
        if (sty === 0) { a = Dd(r.int(12, 99), 1); b = Dd(r.int(12, 60)); }
        else if (sty === 1) { a = Dd(r.int(2, 9), 1); b = Dd(r.int(2, 9), 1); }
        else if (sty === 2) { a = Dd(r.int(102, 999), 2); b = Dd(r.int(110, 999), 1); }
        else { a = Dd(r.int(11, 99), 1); b = Dd(r.int(11, 99), 1); }
        if (a.n % 10 === 0 || b.n % 10 === 0) continue;
        sym = '×'; res = mulD(a, b);
        rule = `Dans un produit, on calcule comme avec des entiers : ${a.n} × ${b.n} = ${a.n * b.n}. Puis on compte les chiffres après la virgule des deux facteurs : ${a.s} + ${b.s} = ${a.s + b.s}. Donc le résultat est ${strD(res)}.`;
      } else if (kind === 'add') {
        a = Dd(r.int(120, 990), 1); b = Dd(r.int(105, 990), 2);
        if (a.n % 10 === 0 || b.n % 10 === 0) continue;
        sym = '+'; res = addD(a, b);
        rule = 'Pour additionner des décimaux, on aligne les virgules : le résultat reste du même ordre de grandeur que le plus grand nombre.';
      } else if (kind === 'sub') {
        a = Dd(r.int(205, 990), 1); b = Dd(r.int(15, 190), 2);
        if (a.n % 10 === 0 || b.n % 10 === 0) continue;
        sym = '−'; res = subD(a, b);
        rule = 'Pour soustraire des décimaux, on aligne les virgules : le résultat est un peu plus petit que le premier nombre.';
      } else {
        a = Dd(r.int(12, 990), r.pick([1, 2]));
        if (a.n % 10 === 0) continue;
        const f = r.pick([[Dd(10), '× 10'], [Dd(100), '× 100'], [Dd(1, 1), '× 0,1'], [Dd(5, 1), '× 0,5']]);
        b = f[0]; sym = '×'; res = mulD(a, b);
        rule = f[1] === '× 10' ? 'Multiplier par 10 : chaque chiffre gagne un rang, la virgule se décale d\'un rang vers la <b>droite</b>.'
          : f[1] === '× 100' ? 'Multiplier par 100 : la virgule se décale de deux rangs vers la <b>droite</b>.'
            : f[1] === '× 0,1' ? 'Multiplier par 0,1, c\'est diviser par 10 : la virgule se décale d\'un rang vers la <b>gauche</b>. Ce n\'est pas « ajouter un zéro » !'
              : 'Multiplier par 0,5, c\'est prendre la <b>moitié</b> : le résultat est plus petit que le nombre de départ.';
      }
      const nr = normD(res);
      const digits = digitsOf(res), n = digits.length, p0 = n - nr.s;
      if (p0 < 0 || p0 > n + 0) continue;
      if (nr.s === 0 && digits.length < 2) continue;
      // positions possibles pour une virgule fausse (0..n) : pas de zéro final après la virgule
      const okPos = (p) => p !== p0 && (p >= n || digits[n - 1] !== '0') && Math.abs(p - p0) <= 2;
      const cands = [];
      for (let p = 0; p <= n; p++) if (okPos(p)) cands.push(p);
      if (!cands.length || n < 2) continue;
      const plausible = r.chance(0.4);
      const pc = plausible ? p0 : r.pick(cands);
      const slots = [];
      for (let p = 0; p <= n; p++) if (p >= n || digits[n - 1] !== '0') slots.push(p);
      if (!slots.includes(p0)) slots.push(p0);
      slots.sort((x, y) => x - y);
      const ra = sig1(toF(a)), rb = sig1(toF(b));
      const est = kind === 'add' ? ra + rb : kind === 'sub' ? ra - rb : ra * rb;
      const estTxt = `${fF(ra)} ${sym} ${fF(rb)} = ${fF(est)}`;
      if (est <= 0) continue;
      const val = (p) => Number(claimStr(digits, p).replace(',', '.'));
      return {
        kind, a, b, sym, res, rule, digits, n, p0, pc, plausible, slots, est, estTxt, ra, rb,
        A: strD(a, { raw: true }), Bs: strD(b, { raw: true }), claimed: claimStr(digits, pc), truth: claimStr(digits, p0),
        val, estVal: est,
      };
    }
    throw new Error('bon impossible');
  }

  /* Règle des ordres de grandeur : chaque nombre est placé selon sa puissance de 10. */
  function ruler(parent, items) {
    const svg = S.root(parent, 640, 128, 'fg-ruler');
    svg.style.cssText = 'width:min(640px,100%);height:auto;background:#fffdf6;border:2px solid #8b5a2b;border-radius:10px';
    const lgs = items.map((i) => Math.log10(i.v));
    let lo = Math.floor(Math.min(...lgs)) - 1, hi = Math.ceil(Math.max(...lgs)) + 1;
    if (hi - lo < 4) hi = lo + 4;
    const X = (lg) => 36 + ((lg - lo) / (hi - lo)) * 568;
    S.el('line', { x1: 24, y1: 64, x2: 616, y2: 64, stroke: '#495057', 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);
    for (let kx = lo; kx <= hi; kx++) {
      S.el('line', { x1: X(kx), y1: 54, x2: X(kx), y2: 74, stroke: '#495057', 'stroke-width': 3 }, svg);
      S.el('text', { x: X(kx), y: 94, 'text-anchor': 'middle', 'font-size': 15, fill: '#495057', 'font-weight': 700, text: Atlas.fmt(Math.pow(10, kx), 4) }, svg);
    }
    items.forEach((it) => {
      const x = Math.min(590, Math.max(50, X(Math.log10(it.v))));
      S.el('circle', { cx: X(Math.log10(it.v)), cy: 64, r: 10, fill: it.col, stroke: '#fff', 'stroke-width': 3 }, svg);
      S.el('text', { x, y: it.up ? 30 : 118, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: it.col, text: it.label, stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke' }, svg);
    });
    return svg;
  }
  const tooWords = (ratio) => {
    const k = Math.round(Math.log10(ratio));
    if (k === 0) return 'à peu près de la bonne taille';
    const f = Atlas.fmt(Math.pow(10, Math.abs(k)));
    return k > 0 ? `environ ${f} fois trop grand` : `environ ${f} fois trop petit`;
  };

  function buildBalance(ctx, host, { need = 6, secs = 25, checks = 2, onSolved }) {
    const r = ctx.rng;
    let good = 0, left = checks, bon = null, timer = null, over = false, t0 = 0, seq = 0;
    ctx.consigne.innerHTML = `Chaque bon porte un résultat <b>déjà calculé</b> : certains sont justes, d'autres ont la <b>virgule mal placée</b>. Sans poser le calcul, repère les bons <b>absurdes</b> grâce à l'<b>ordre de grandeur</b> ! Il faut contrôler <b>${need}</b> bons.`;
    ctx.onCleanup(() => clearInterval(timer));
    const root = h('div', { style: 'width:100%;display:flex;flex-direction:column;gap:10px;align-items:center' });
    host.append(root);

    const next = () => {
      if (good >= need) return onSolved();
      bon = makeBon(r); seq++; over = false;
      draw();
    };
    const stop = () => { clearInterval(timer); timer = null; };

    function draw() {
      stop();
      root.innerHTML = '';
      const dots = h('div', { class: 'fg-dots' }, Array.from({ length: need }, (_, i) => h('i', { class: i < good ? 'on' : '' })));
      const eq = h('div', { class: 'eq' }, `${bon.A} ${bon.sym} ${bon.Bs} = `, h('span', { class: 'cl' }, bon.claimed));
      const aid = h('div', { style: 'min-height:24px;font-size:17px;color:#1864ab;font-weight:700' });
      const card = h('div', { class: 'fg-bon' }, h('div', { style: 'font-weight:800;color:#8b5a2b;font-size:14px;letter-spacing:1px' }, `BON DE COMMANDE n° ${seq}`), eq, aid);
      const bar = h('i', {});
      const time = h('div', { class: 'fg-time' }, bar);
      const lower = h('div', { style: 'width:100%;display:flex;flex-direction:column;gap:10px;align-items:center' });
      const expl = h('div', { style: 'width:100%;display:flex;flex-direction:column;gap:10px;align-items:center' });
      root.append(dots, card, time, lower, expl);

      const aids = h('div', { class: 'puz-tools' },
        h('button', { class: 'btn', onclick: () => { aid.innerHTML = `Arrondis : ${fF(bon.ra)} et ${fF(bon.rb)} → ${bon.estTxt}`; } }, '💡 Arrondir les nombres'),
        h('button', {
          class: 'btn', onclick: (e) => {
            if (over) return;
            if (left <= 0) return Atlas.UI.toast('Plus de calcul exact : estime avec des nombres ronds !', 'bad');
            left--; e.target.textContent = `🧮 Calcul exact (${left})`;
            aid.innerHTML = `Calcul exact : ${bon.A} ${bon.sym} ${bon.Bs} = <b>${bon.truth}</b>`;
          },
        }, `🧮 Calcul exact (${left})`));
      const verdict = () => {
        lower.innerHTML = '';
        lower.append(
          h('div', { class: 'puz-tools' },
            h('button', { class: 'btn btn-go', style: 'font-size:20px;min-height:54px', onclick: () => pass() }, '✅ Ça passe'),
            h('button', { class: 'btn', style: 'font-size:20px;min-height:54px;background:linear-gradient(#ffe3e3,#ff8787)', onclick: () => absurd() }, '🚫 Absurde')),
          aids);
      };
      verdict();

      const finish = (okFlag, msg, kind, chosen) => {
        if (over) return;
        over = true; stop();
        lower.innerHTML = '';
        if (okFlag) {
          good++;
          Atlas.UI.toast('Bien vu !', 'good');
          ctx.pi(`Bien vu ! ${bon.plausible ? 'Ce bon était juste.' : 'La bonne écriture est <b>' + bon.truth + '</b>.'}`, 'good');
          dots.children[good - 1].className = 'on';
          return setTimeout(next, 900);
        }
        const hl = ctx.fail(msg);
        // explication dessinée : la règle des ordres de grandeur
        const items = [{ v: bon.est, label: `estimation ≈ ${fF(bon.est)}`, col: '#1c7ed6', up: true }];
        const cv = chosen != null ? bon.val(chosen) : bon.val(bon.pc);
        if (cv > 0) items.push({ v: cv, label: `${chosen != null ? 'ton résultat' : 'le bon'} : ${chosen != null ? claimStr(bon.digits, chosen) : bon.claimed}`, col: '#e03131', up: false });
        ruler(expl, items);
        expl.append(h('div', { class: 'fg-box', html: `<b>Estimation :</b> ${bon.estTxt}.<br>${bon.rule}` }));
        if (hl > 0) expl.append(h('button', { class: 'btn btn-go', onclick: next }, 'Bon suivant ▶'));
      };

      const pass = () => {
        if (over) return;
        if (bon.plausible) return finish(true);
        finish(false, `Ce bon était <b>faux</b> ! Estimation : ${bon.estTxt}. Le bon dit <b>${bon.claimed}</b>, c'est ${tooWords(bon.val(bon.pc) / bon.est)}.`, 'missed');
      };
      const absurd = () => {
        if (over) return;
        if (bon.plausible) return finish(false, `Ce bon était <b>juste</b> : ${bon.estTxt}, et <b>${bon.claimed}</b> est bien de cet ordre de grandeur.`, 'falsealarm');
        lower.innerHTML = '';
        const row = h('div', { class: 'fg-dig' });
        // chiffres avec des créneaux « virgule » entre chaque chiffre
        const d = bon.digits;
        for (let p = 0; p <= d.length; p++) {
          if (bon.slots.includes(p)) {
            row.append(h('button', { class: 'fg-gap', onclick: () => place(p) }, p >= d.length ? '·' : p === 0 ? '0,' : ','));
          } else row.append(h('span', { style: 'width:30px' }));
          if (p < d.length) row.append(h('span', {}, d[p]));
        }
        lower.append(h('div', { style: 'font-size:19px;font-weight:700' }, 'Où faut-il mettre la virgule ? Touche un créneau.'), row,
          h('div', { class: 'muted', style: 'font-size:15px' }, 'Le premier créneau veut dire « 0, … » ; le dernier : pas de virgule.'), aids);
      };
      const place = (p) => {
        if (over) return;
        if (p === bon.p0) return finish(true);
        finish(false, `Avec ta virgule, le résultat est <b>${claimStr(bon.digits, p)}</b> : c'est ${tooWords(bon.val(p) / bon.est)}. Estimation : ${bon.estTxt}.`, 'wrongpos', p);
      };

      // chronomètre
      t0 = Date.now();
      timer = setInterval(() => {
        const used = (Date.now() - t0) / 1000;
        bar.style.width = Math.max(0, 100 - (used / secs) * 100) + '%';
        if (used >= secs && !over) {
          const hl = ctx.fail(`Trop lent ! Pour aller vite, arrondis les nombres : ${bon.estTxt}. Touche 💡 pour t'aider.`);
          over = true; stop();
          lower.innerHTML = '';
          if (hl > 0) expl.append(h('button', { class: 'btn btn-go', onclick: next }, 'Bon suivant ▶'));
        }
      }, 100);
    }
    ctx.pi('<b>Ordre de grandeur</b> : arrondis chaque nombre (touche 💡), calcule de tête avec des nombres ronds, et compare avec le bon. Tu n\'as que 2 calculs exacts !');
    next();
  }

  /* =====================================================================
     ÉNIGME « malin » : le calcul qui économise le charbon
     Arbre : {t:'n', d, id} | {t:'×'|'+'|'−', k:[…]}
     ===================================================================== */
  let uid = 0;
  const leaf = (d) => ({ t: 'n', d, id: ++uid });
  const node = (t, k) => ({ t, k });
  const nz = (d) => { const s = String(Math.abs(normD(d).n)); return /^10*$/.test(s) ? 0 : s.replace(/0/g, '').length; };
  const costMul = (a, b) => Math.max(1, nz(a) * nz(b));
  const replaceNode = (root, target, rep) => (root === target ? rep : root.t === 'n' ? root : node(root.t, root.k.map((c) => replaceNode(c, target, rep))));
  const findParent = (root, id) => {
    if (root.t === 'n') return null;
    if (root.k.some((c) => c.id === id)) return root;
    for (const c of root.k) { const p = findParent(c, id); if (p) return p; }
    return null;
  };
  const ser = (n) => (n.t === 'n' ? strD(n.d) : n.t === '×' ? '×[' + n.k.map(ser).sort().join(';') + ']' : n.t + '[' + n.k.map(ser).join(';') + ']');

  function mergeLeaves(root, idA, idB) {
    const P = findParent(root, idA);
    if (!P || !P.k.some((c) => c.id === idB) || P.k.find((c) => c.id === idA).t !== 'n' || P.k.find((c) => c.id === idB).t !== 'n') return { err: 'sib' };
    const ia = P.k.findIndex((c) => c.id === idA), ib = P.k.findIndex((c) => c.id === idB);
    const [i1, i2] = ia < ib ? [ia, ib] : [ib, ia];
    const a = P.k[i1], b = P.k[i2];
    const val = P.t === '×' ? mulD(a.d, b.d) : P.t === '+' ? addD(a.d, b.d) : subD(a.d, b.d);
    const cost = P.t === '×' ? costMul(a.d, b.d) : 1;
    const nl = leaf(val);
    const kids = P.k.filter((_, i) => i !== i2).map((c, i) => (i === i1 ? nl : c));
    const repl = kids.length === 1 ? kids[0] : node(P.t, kids);
    return { root: replaceNode(root, P, repl), cost, val, op: P.t, a, b, desc: `${strD(a.d)} ${P.t} ${strD(b.d)} = ${strD(val)}` };
  }
  function factorise(root, idA, idB) {
    const PA = findParent(root, idA), PB = findParent(root, idB);
    if (!PA || !PB || PA === PB || PA.t !== '×' || PB.t !== '×') return { err: 'fact' };
    // le nœud + / − dont PA et PB sont les deux enfants
    let SN = null;
    const seek = (n) => { if (n.t === 'n') return; if ((n.t === '+' || n.t === '−') && n.k.length === 2 && n.k.includes(PA) && n.k.includes(PB)) SN = n; else n.k.forEach(seek); };
    seek(root);
    if (!SN) return { err: 'fact' };
    const A = PA.k.find((c) => c.id === idA), Bn = PB.k.find((c) => c.id === idB);
    if (!eqD(A.d, Bn.d)) return { err: 'fact' };
    const rest = (P, x) => { const k = P.k.filter((c) => c !== x); return k.length === 1 ? k[0] : node('×', k); };
    const first = SN.k[0] === PA ? [PA, A] : [PB, Bn], second = SN.k[0] === PA ? [PB, Bn] : [PA, A];
    const inner = node(SN.t, [rest(first[0], first[1]), rest(second[0], second[1])]);
    const nn = node('×', [A, inner]);
    const f = (n) => (n.t === 'n' ? strD(n.d) : n.t === '×' ? n.k.map((c) => (c.t === '+' || c.t === '−' ? '(' + f(c) + ')' : f(c))).join(' × ') : n.k.map(f).join(` ${n.t} `));
    return { root: replaceNode(root, SN, nn), cost: 1, desc: `${f(SN)} = ${f(nn)}`, factor: A };
  }
  function actionsOf(root) {
    const acts = [];
    const visit = (n) => {
      if (n.t === 'n') return;
      const lv = n.k.filter((c) => c.t === 'n');
      if (n.t === '×') { for (let i = 0; i < lv.length; i++) for (let j = i + 1; j < lv.length; j++) acts.push(mergeLeaves(root, lv[i].id, lv[j].id)); }
      else if (lv.length === 2) acts.push(mergeLeaves(root, lv[0].id, lv[1].id));
      if ((n.t === '+' || n.t === '−') && n.k.length === 2 && n.k.every((c) => c.t === '×')) {
        const seen = new Set();
        n.k[0].k.filter((c) => c.t === 'n').forEach((A) => n.k[1].k.filter((c) => c.t === 'n').forEach((Bn) => {
          if (eqD(A.d, Bn.d) && !seen.has(strD(A.d))) { seen.add(strD(A.d)); acts.push(factorise(root, A.id, Bn.id)); }
        }));
      }
      n.k.forEach(visit);
    };
    visit(root);
    return acts.filter((a) => a && !a.err);
  }
  const memo = new Map();
  function solve(root) {
    if (root.t === 'n') return { cost: 0, path: [] };
    const key = ser(root);
    if (memo.has(key)) return memo.get(key);
    memo.set(key, { cost: Infinity, path: [] });
    let best = { cost: Infinity, path: [] };
    for (const a of actionsOf(root)) {
      const s = solve(a.root);
      if (a.cost + s.cost < best.cost) best = { cost: a.cost + s.cost, path: [{ desc: a.desc, cost: a.cost }, ...s.path] };
    }
    memo.set(key, best);
    return best;
  }

  const PAIRS = [[Dd(25), Dd(4)], [Dd(5), Dd(2)], [Dd(50), Dd(2)], [Dd(125), Dd(8)], [Dd(20), Dd(5)], [Dd(250), Dd(4)], [Dd(25, 1), Dd(4)], [Dd(5, 1), Dd(2)], [Dd(25, 2), Dd(4)], [Dd(125, 2), Dd(8)]];
  function genMalin(r, kind) {
    for (let guard = 0; guard < 300; guard++) {
      let root, naive;
      if (kind === 'mul3' || kind === 'mul4') {
        const [p, q] = r.pick(PAIRS);
        const f = r.chance(0.6) ? Dd(r.int(112, 998), 2) : Dd(r.int(13, 99), 1);
        if (f.n % 10 === 0 || nz(f) < 2) continue;
        let fs = [p, q, f];
        if (kind === 'mul4') { const g = Dd(r.int(3, 9)); fs = [p, q, f, g]; }
        fs = r.shuffle(fs);
        if (kind === 'mul3' && Math.abs(fs.indexOf(p) - fs.indexOf(q)) === 1) continue; // la paire amie ne se touche pas
        root = node('×', fs.map(leaf));
        let acc = fs[0]; naive = 0;
        for (let i = 1; i < fs.length; i++) { naive += costMul(acc, fs[i]); acc = mulD(acc, fs[i]); }
      } else { // fact : a × x ± a × y avec x ± y rond
        const plus = kind === 'fact+' || (kind === 'fact' && r.chance(0.5));
        const a = r.chance(0.7) ? Dd(r.int(12, 98)) : Dd(r.int(12, 98), 1);
        if (a.n % 10 === 0) continue;
        let x, y;
        if (plus) { x = Dd(r.int(11, 89), 1); if (x.n % 10 === 0) continue; y = subD(Dd(10), x); }
        else { y = Dd(r.int(11, 89), 1); if (y.n % 10 === 0) continue; x = addD(y, Dd(10)); }
        if (eqD(a, x) || eqD(a, y)) continue;
        const t1 = r.chance(0.5) ? [a, x] : [x, a], t2 = r.chance(0.5) ? [a, y] : [y, a];
        root = node(plus ? '+' : '−', [node('×', t1.map(leaf)), node('×', t2.map(leaf))]);
        naive = costMul(a, x) + costMul(a, y) + 1;
      }
      const best = solve(root);
      const budget = best.cost + 1;
      if (naive < budget + 2) continue;
      return { root, budget, best, naive };
    }
    throw new Error('calcul malin impossible');
  }

  function buildMalin(ctx, host, { rounds, prefix = '', onSolved }) {
    const r = ctx.rng;
    let ri = 0;
    const timers = [];
    ctx.onCleanup(() => timers.forEach(clearTimeout));
    const later = (f, ms) => { timers.push(setTimeout(f, ms)); };
    const startRound = () => {
      if (ri >= rounds.length) return onSolved();
      const G = genMalin(r, rounds[ri]);
      host.innerHTML = '';
      let root = G.root, remaining = G.budget, sel = [], hist = [], log = [], locked = false;
      ctx.consigne.innerHTML = `${prefix}<b>Calcul ${ri + 1} / ${rounds.length}</b> — La machine brûle du <b>charbon</b> à chaque calcul : plus c'est compliqué, plus ça coûte. Tu as <b>${G.budget} charbons</b>. Choisis <b>quoi calculer en premier</b> pour en économiser.`;

      const fsvg = S.root(host, 800, 100);
      const coals = S.el('g', {}, fsvg);
      const drawCoals = () => {
        coals.innerHTML = '';
        S.el('rect', { x: 14, y: 12, width: 150, height: 76, rx: 10, fill: '#6b7280', stroke: '#343a40', 'stroke-width': 4 }, coals);
        S.el('rect', { x: 30, y: 40, width: 118, height: 40, rx: 6, fill: remaining > 0 ? '#ff6b00' : '#495057' }, coals);
        S.el('text', { x: 89, y: 66, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: '#fff3bf', text: 'FOURNEAU' }, coals);
        for (let i = 0; i < G.budget; i++) {
          const on = i < remaining;
          S.el('circle', { cx: 210 + i * 46, cy: 48, r: 18, fill: on ? '#212529' : '#e9ecef', stroke: on ? '#ff922b' : '#adb5bd', 'stroke-width': on ? 4 : 2, 'stroke-dasharray': on ? '' : '4 3' }, coals);
          if (on) S.el('circle', { cx: 210 + i * 46 - 5, cy: 42, r: 4, fill: '#ffd8a8' }, coals);
        }
        S.el('text', { x: 400 + Math.max(0, G.budget - 6) * 46, y: 56, 'font-size': 21, 'font-weight': 800, fill: '#7c2d12', text: `Charbon : ${remaining} / ${G.budget}` }, coals);
      };
      const box = h('div', { class: 'fg-line' });
      const status = h('div', { class: 'fg-box', style: 'text-align:center;min-height:26px' });
      const logEl = h('div', { class: 'fg-box', style: 'font-size:16px;min-height:24px' });
      const bCalc = h('button', { class: 'btn btn-go', style: 'min-height:48px;font-size:18px' }, '⚙️ Calculer');
      const bFact = h('button', { class: 'btn', style: 'min-height:48px;font-size:18px' }, '🧩 Mettre en facteur');
      const bUndo = h('button', { class: 'btn', style: 'min-height:48px;font-size:18px' }, '↩ Annuler');
      const bReset = h('button', { class: 'btn', style: 'min-height:48px;font-size:18px' }, '🔁 Recommencer');
      const tools = h('div', { class: 'puz-tools' }, bCalc, bFact, bUndo, bReset);
      host.append(box, status, tools, logEl);

      const analyse = () => {
        if (sel.length !== 2) return { m: null, f: null };
        const m = mergeLeaves(root, sel[0], sel[1]);
        const f = factorise(root, sel[0], sel[1]);
        return { m: m.err ? null : m, f: f.err ? null : f };
      };
      const renderNode = (n) => {
        if (n.t === 'n') {
          return [h('button', { class: 'fg-chip num fg-leaf' + (sel.includes(n.id) ? ' sel' : ''), onclick: () => toggle(n.id) }, strD(n.d))];
        }
        const out = [];
        n.k.forEach((c, i) => {
          if (i) out.push(h('span', { class: 'fg-op' }, n.t));
          const paren = n.t === '×' && (c.t === '+' || c.t === '−');
          if (paren) out.push(h('span', { class: 'fg-op' }, '('));
          out.push(...renderNode(c));
          if (paren) out.push(h('span', { class: 'fg-op' }, ')'));
        });
        return out;
      };
      const update = () => {
        drawCoals();
        box.innerHTML = '';
        renderNode(root).forEach((e) => box.append(e));
        const { m, f } = analyse();
        bCalc.disabled = locked || !m; bFact.disabled = locked || !f;
        bUndo.disabled = locked || !hist.length;
        bReset.disabled = locked;
        if (root.t === 'n') status.innerHTML = `🔨 Résultat : <b>${strD(root.d)}</b>`;
        else if (sel.length < 2) status.innerHTML = 'Touche <b>deux nombres</b> à calculer ensemble.';
        else if (m) status.innerHTML = `<b>${m.desc}</b> — ça coûte <b>${m.cost}</b> charbon${m.cost > 1 ? 's' : ''}`;
        else if (f) status.innerHTML = `Même nombre <b>${strD(f.factor.d)}</b> des deux côtés : on peut le <b>mettre en facteur</b> (coût 1).`;
        else status.innerHTML = 'Ces deux nombres ne sont pas reliés par la même opération. Choisis-en deux autres.';
        logEl.innerHTML = log.length ? log.map((l, i) => `${i + 1}. ${l}`).join('<br>') : '<span class="muted">Tes calculs apparaîtront ici.</span>';
      };
      function toggle(id) {
        if (locked) return;
        if (sel.includes(id)) sel = sel.filter((x) => x !== id);
        else sel = sel.length >= 2 ? [sel[1], id] : [...sel, id];
        update();
      }
      const apply = (a) => {
        if (a.cost > remaining) {
          return ctx.fail(`Ce calcul coûte <b>${a.cost}</b> charbon${a.cost > 1 ? 's' : ''} et il ne t'en reste que <b>${remaining}</b> ! Cherche un calcul plus malin : quels nombres s'arrangent bien ensemble ?`);
        }
        hist.push({ root, remaining, log: log.slice() });
        root = a.root; remaining -= a.cost; sel = [];
        log.push(`${a.desc} <span class="muted">(${a.cost} charbon${a.cost > 1 ? 's' : ''})</span>`);
        update();
        if (root.t === 'n') {
          locked = true; update();
          const spent = G.budget - remaining;
          ctx.pi(`Bravo ! <b>${strD(root.d)}</b> avec seulement <b>${spent}</b> charbon${spent > 1 ? 's' : ''} sur ${G.budget}. Le secret : ${G.best.path.map((p) => p.desc).join(' puis ')}.`, 'good');
          Atlas.UI.toast('Calcul réussi !', 'good');
          ri++;
          later(startRound, 2600);
          return;
        }
        const need = solve(root).cost;
        if (need > remaining) {
          locked = true; update();
          const smart = G.best.path.map((p) => `${p.desc} <i>(${p.cost})</i>`).join(' → ');
          const hl = ctx.fail(`Plus assez de charbon pour finir : il en reste <b>${remaining}</b> et il en faut au moins <b>${need}</b>. Le chemin malin coûtait ${G.best.cost} : ${smart}. On recommence avec d'autres nombres !`);
          if (hl > 0) later(() => startRound(), 4200);
        }
      };
      bCalc.onclick = () => { const { m } = analyse(); if (m && !locked) apply(m); };
      bFact.onclick = () => { const { f } = analyse(); if (f && !locked) apply(f); };
      bUndo.onclick = () => { const s = hist.pop(); if (s && !locked) { root = s.root; remaining = s.remaining; log = s.log; sel = []; update(); } };
      bReset.onclick = () => { if (locked) return; root = G.root; remaining = G.budget; sel = []; hist = []; log = []; update(); };
      update();
      ctx.pi(ri === 0 ? 'Touche deux nombres : la machine te dit <b>combien de charbon</b> coûte leur calcul. Les nombres « ronds » (10, 100…) coûtent presque rien !' : 'Même idée : cherche les calculs qui tombent « rond », ou le nombre qu\'on peut mettre en facteur.');
    };
    startRound();
  }

  /* ---------- Interface de test (laboratoire) ---------- */
  Atlas.forge = { Dd, addD, subD, mulD, eqD, strD, normD, toF, calcLigne, parseExpr, makeOrder, makeBon, genMalin, solve, costMul, mergeLeaves, factorise, claimStr };

  /* =====================================================================
     LA CARTE DE LA FORGE
     ===================================================================== */
  const W = 26, H = 18;
  const map = Atlas.buildMap(W, H, (m) => {
    m.border('T');
    m.rect(12, 0, 13, 4, '=');            // chemin vers le village (nord)
    m.rect(5, 5, 20, 13, '#');            // cour pavée de la forge
    m.rect(1, 8, 4, 12, ':');             // terre noircie : tas de charbon
    m.rect(21, 8, 24, 12, ':');           // terre : réserve
    m.sprinkle(',', 6, 4);
    m.sprinkle('*', 22, 9);
    [[2, 2], [4, 3], [23, 2], [24, 5], [2, 15], [22, 15], [24, 14], [6, 16]].forEach(([x, y], i) => m.set(x, y, ['T', 'a', 'Y', 'T', 'a', 'B', 'T', 'A'][i]));
    m.rect(21, 6, 22, 7, 'W');            // fourneau de pierre
    m.set(12, 9, 'W');                    // enclume (bloc de pierre)
    m.set(11, 4, 'S');                    // panneau
    [[2, 9], [3, 9], [2, 10], [3, 10], [3, 11]].forEach(([x, y]) => m.set(x, y, 'k'));   // sacs de charbon
    [[22, 10], [23, 10], [22, 11]].forEach(([x, y]) => m.set(x, y, 'b'));                  // tonneaux
    m.set(23, 12, 'C');
    m.rect(7, 15, 9, 15, 'F');            // clôture
    m.set(23, 4, 'B');                    // buisson : le trésor
    m.set(6, 14, 'R'); m.set(19, 15, 'R');
    // les cases autour de la sortie nord restent libres
    m.rect(12, 0, 13, 1, '=');
  });

  Atlas.region({
    id: 'forge', num: 5, name: 'La Forge aux Machines', chapter: 'Addition, soustraction, multiplication',
    map, spawn: { x: 12, y: 3 },
    theme: { sky: '#f08a5d', grass: ['#4d5a3a', '#556440', '#485436'], path: '#9c7c5b', tuft: '#364529', outside: '#3b4630' },
    signs: { '11,4': '<b>La Forge aux Machines</b><br>« La machine fait exactement ce qu\'on lui écrit. À toi d\'écrire juste ! »' },
    exits: [{ x: 12, y: 0, to: 'village' }, { x: 13, y: 0, to: 'village' }],
    props: [
      { x: 6, y: 1, stamp: 'maison_grise' },
      { x: 17, y: 1, stamp: 'maison_bois' },
      { x: 11, y: 12, t: 'town:57', solid: true },
    ],
    npcs: [
      {
        id: 'magda', x: 11, y: 7, t: 'dungeon:86', name: 'Magda, la forgeronne',
        look: { top: '#b5441f', bottom: '#3b3f4a', hair: '#e8590c', style: 'queue', hat: 'bandana', hatColor: '#c92a2a', apron: '#5a4a3a', scale: 1.02 },
        talk: (A) => A.done('machine')
          ? ['Ma machine refait enfin des pièces justes ! Elle suit mes calculs à la lettre, priorités comprises.', 'Rappelle-toi : <b>×</b> avant <b>+</b> et <b>−</b>. Et les parenthèses passent avant tout.']
          : ['Depuis la tempête, toutes mes commandes sortent fausses ! Ma machine fait <b>exactement</b> le calcul qu\'on lui écrit… y compris les priorités.', 'Va à l\'établi, juste à côté : écris-lui les bons calculs.'],
      },
      {
        id: 'tom', x: 15, y: 9, t: 'dungeon:88', name: 'Tom, l\'apprenti',
        talk: (A) => A.done('balance')
          ? ['Tu as vu ? 4,8376 pour 9,52 × 51,3 : même moi j\'aurais dû le repérer !', 'Un calcul rapide avec des nombres ronds, et hop.']
          : ['Les bons de commande sont tous mélangés. Certains ont la virgule au mauvais endroit…', 'La balance, près du signal, sert à les contrôler. Sans calculer tout !'],
      },
      {
        id: 'hugo', x: 5, y: 10, t: 'dungeon:111', name: 'Hugo, le charbonnier',
        talk: (A) => A.done('malin')
          ? ['Merci ! 25 × 4 d\'abord, c\'est tout de suite 100. Je brûle bien moins de charbon.']
          : ['Chaque calcul de la machine me coûte du charbon. Et le charbon, ça ne pousse pas !', 'Mon chariot est là : trouve les calculs malins.'],
      },
    ],
    objects: [
      { id: 'o-machine', x: 9, y: 7, t: 'town:116', kind: 'enigme', enigme: 'machine' },
      { id: 'o-balance', x: 15, y: 7, t: 'town:95', kind: 'enigme', enigme: 'balance' },
      { id: 'o-malin', x: 6, y: 10, t: 'dungeon:54', kind: 'enigme', enigme: 'malin' },
      { id: 'pierre-forge', x: 19, y: 12, t: 'rock', kind: 'mental' },
      {
        id: 'o-gardien', x: 19, y: 10, t: 'dungeon:98', name: 'L\'intendant du château', kind: 'gardien',
        notReady: 'Je suis l\'intendant du château. Je repasserai quand cette forge saura calculer : la machine, la balance et le charbon.',
        intro: ['Bonjour ! J\'apporte la <b>Grande Commande</b> du château : des centaines d\'épées, avec une remise !', 'La machine doit la forger exactement, et mon budget de charbon est serré. Prêt ?'],
      },
    ],
    treasure: {
      x: 23, y: 4, needs: 'loupe',
      hint: 'Ce buisson cache quelque chose, mais c\'est trop fin à voir… Il faudrait une <b>loupe</b> pour le trouver. (On la gagne à la Mine aux Graduations.)',
      text: 'Avec la loupe, on distingue une petite pièce gravée au pied du buisson : un vieux lingot de forgeron !',
    },
    lesson: [
      {
        text: 'La machine de Magda fait <b>exactement</b> ce qui est écrit. Elle fait la <b>multiplication d\'abord</b>, puis l\'addition ou la soustraction.',
        svg: `<svg viewBox="0 0 400 220"><rect x="10" y="8" width="380" height="64" rx="12" fill="#2a1f1a"/><g font-family="ui-monospace,Consolas,monospace" font-size="38" font-weight="800" text-anchor="middle" fill="#ffd8a8"><text x="120" y="52">3</text><text x="160" y="52">+</text><text x="200" y="52" fill="#ffa94d">4</text><text x="240" y="52" fill="#ffa94d">×</text><text x="280" y="52" fill="#ffa94d">8</text></g><path d="M184,62 L184,70 L296,70 L296,62" fill="none" stroke="#ff922b" stroke-width="4"/><text x="40" y="120" font-size="24" font-weight="800" fill="#e8590c">① 4 × 8 = 32</text><text x="40" y="160" font-size="24" font-weight="800" fill="#1c7ed6">② 3 + 32 = 35</text><text x="40" y="200" font-size="18" font-weight="700" fill="#495057">Pas (3 + 4) × 8 = 56 !</text></svg>`,
      },
      {
        text: 'Pour changer l\'ordre, on utilise des <b>parenthèses</b> : la machine calcule ce qu\'il y a dedans <b>en premier</b>.',
        svg: `<svg viewBox="0 0 400 220"><rect x="10" y="8" width="380" height="64" rx="12" fill="#2a1f1a"/><g font-family="ui-monospace,Consolas,monospace" font-size="38" font-weight="800" text-anchor="middle" fill="#ffd8a8"><text x="90" y="52" fill="#69db7c">(</text><text x="125" y="52" fill="#69db7c">3</text><text x="162" y="52" fill="#69db7c">+</text><text x="199" y="52" fill="#69db7c">4</text><text x="236" y="52" fill="#69db7c">)</text><text x="275" y="52">×</text><text x="315" y="52">8</text></g><path d="M78,62 L78,70 L248,70 L248,62" fill="none" stroke="#40c057" stroke-width="4"/><text x="40" y="120" font-size="24" font-weight="800" fill="#2f9e44">① 3 + 4 = 7</text><text x="40" y="160" font-size="24" font-weight="800" fill="#1c7ed6">② 7 × 8 = 56</text><text x="40" y="200" font-size="18" font-weight="700" fill="#495057">Les parenthèses changent le résultat.</text></svg>`,
      },
      {
        text: '<b>×10</b> décale la virgule vers la <b>droite</b>, <b>×0,1</b> vers la <b>gauche</b>. Et pour vérifier un résultat : arrondis les nombres (<b>ordre de grandeur</b>).',
        svg: `<svg viewBox="0 0 400 220"><g font-family="ui-monospace,Consolas,monospace" font-weight="800"><text x="20" y="38" font-size="26" fill="#2b1d0e">4,7 × 10 = <tspan fill="#2f9e44">47</tspan></text><text x="250" y="38" font-size="17" fill="#2f9e44" font-family="sans-serif">virgule →</text><text x="20" y="80" font-size="26" fill="#2b1d0e">4,7 × 0,1 = <tspan fill="#e03131">0,47</tspan></text><text x="250" y="80" font-size="17" fill="#e03131" font-family="sans-serif">← virgule</text></g><text x="20" y="110" font-size="16" font-weight="700" fill="#e03131">(ce n'est pas « ajouter un zéro » !)</text><line x1="10" y1="124" x2="390" y2="124" stroke="#8b5a2b" stroke-width="2" stroke-dasharray="6 4"/><text x="20" y="152" font-size="21" font-weight="800" fill="#2b1d0e">9,52 × 51,3 ≈ 10 × 50 = <tspan fill="#1c7ed6">500</tspan></text><text x="20" y="184" font-size="20" font-weight="800" fill="#2f9e44">488,376 : oui ✔</text><text x="20" y="210" font-size="20" font-weight="800" fill="#e03131">48,376 : absurde ✘</text></svg>`,
      },
      {
        text: 'Chaque calcul brûle du <b>charbon</b>. Un calcul <b>malin</b> en dépense moins : cherche les nombres qui font un nombre rond (25 × 4 = 100).',
        svg: `<svg viewBox="0 0 400 220"><text x="14" y="34" font-size="21" font-weight="800" fill="#2b1d0e">25 × 7 × 4</text><text x="14" y="76" font-size="19" font-weight="700" fill="#e03131">25 × 7 = 175 puis × 4 = 700</text><g fill="#212529" stroke="#ff922b" stroke-width="3"><circle cx="40" cy="104" r="12"/><circle cx="76" cy="104" r="12"/><circle cx="112" cy="104" r="12"/><circle cx="148" cy="104" r="12"/><circle cx="184" cy="104" r="12"/><circle cx="220" cy="104" r="12"/></g><text x="14" y="150" font-size="19" font-weight="700" fill="#2f9e44">25 × 4 = 100 puis × 7 = 700</text><g fill="#212529" stroke="#ff922b" stroke-width="3"><circle cx="40" cy="178" r="12"/><circle cx="76" cy="178" r="12"/></g><text x="110" y="185" font-size="18" font-weight="800" fill="#2f9e44">Moins de charbon !</text></svg>`,
      },
      {
        text: 'À toi ! Avec les cartes <b>3</b>, <b>4</b> et <b>8</b>, programme la machine pour qu\'elle fabrique <b>56</b>. Essaie d\'abord sans parenthèses…',
        act: (el, done) => {
          const cards = [3, 4, 8].map((v, i) => ({ d: Dd(v), ci: i, label: String(v) }));
          const out = h('div', { class: 'fg-box', style: 'text-align:center;min-height:90px;font:700 20px ui-monospace,Consolas,monospace' }, 'La machine attend ton calcul…');
          const E = lineEditor(el, cards);
          const go = h('button', { class: 'btn btn-go', style: 'font-size:20px' }, '⚙️ Lancer');
          E.ctrl.append(go);
          el.append(out);
          let ok = false;
          go.onclick = () => {
            if (ok) return;
            let r2;
            try { r2 = calcLigne(E.tokens()); } catch (e) { out.textContent = e.msg; return; }
            const used = E.tokens().filter((t) => t.k === 'num').length;
            out.innerHTML = r2.steps.map((s, i) => `${i + 1}. ${stepTxt(s)}`).join('<br>') + `<br>→ <b>${strD(r2.res)}</b>`;
            if (used < 3) { out.innerHTML += '<br><span style="font-family:sans-serif;font-size:16px">Utilise les trois cartes.</span>'; return; }
            if (eqD(r2.res, Dd(56))) { ok = true; E.lock(true); done(); }
            else out.innerHTML += '<br><span style="font-family:sans-serif;font-size:16px;color:#e03131">Ce n\'est pas 56 : ajoute des parenthèses pour changer l\'ordre.</span>';
          };
        },
      },
    ],
    enigmes: {
      machine: {
        title: 'Programmer la machine',
        consigne: '',
        build: (ctx) => buildMachine(ctx, ctx.el, {
          kinds: [ctx.rng.pick(['A', 'C']), 'B', 'D'],
          onSolved: () => ctx.win('Les trois commandes sont parfaites ! La machine fait toujours <b>exactement</b> ce qui est écrit : les × d\'abord, sauf si des parenthèses changent l\'ordre.'),
        }),
      },
      balance: {
        title: 'Le contrôle de la balance',
        consigne: '',
        build: (ctx) => buildBalance(ctx, ctx.el, {
          need: 6, secs: 25, checks: 2,
          onSolved: () => ctx.win('Tous les bons sont contrôlés ! L\'<b>ordre de grandeur</b> permet de voir tout de suite un résultat absurde, sans poser le calcul.'),
        }),
      },
      malin: {
        title: 'Le calcul malin',
        consigne: '',
        build: (ctx) => buildMalin(ctx, ctx.el, {
          rounds: ['mul3', 'fact', ctx.rng.pick(['mul3', 'fact'])],
          onSolved: () => ctx.win('Hugo économise du charbon ! Regrouper les nombres qui font un nombre rond, ou mettre en facteur, rend le calcul bien plus simple.'),
        }),
      },
    },
    gardien: {
      title: 'La Grande Commande',
      consigne: '',
      build: (ctx) => buildMachine(ctx, ctx.el, {
        kinds: ['E', 'F'],
        prefix: '<b>Étape 1 / 2</b> — Programme la machine. ',
        onSolved: () => {
          Atlas.UI.toast('Étape 1 réussie !', 'good');
          setTimeout(() => buildMalin(ctx, ctx.el, {
            rounds: ['mul4', 'fact'],
            prefix: '<b>Étape 2 / 2</b> — Budget de charbon serré. ',
            onSolved: () => ctx.win('La commande du château est prête ! Voici la page de l\'Atlas… et ma plus belle <b>balance</b>, pour contrôler les ordres de grandeur.'),
          }), 900);
        },
      }),
    },
    tool: {
      id: 'balance', name: 'Balance',
      icon: '<svg viewBox="0 0 30 30"><line x1="15" y1="5" x2="15" y2="24" stroke="#495057" stroke-width="2.5"/><rect x="9" y="24" width="12" height="3" fill="#495057"/><line x1="4" y1="9" x2="26" y2="7" stroke="#495057" stroke-width="2.5"/><path d="M4,9 L1,17 L9,17 Z" fill="#fab005" stroke="#7c4a00" stroke-width="1.5"/><path d="M26,7 L23,15 L29,15 Z" fill="#74c0fc" stroke="#1864ab" stroke-width="1.5"/><circle cx="15" cy="5" r="2.5" fill="#e8590c"/></svg>',
    },
  });
})();
