'use strict';
/* =========================================================
   POSER ET CALCULER POUR DE VRAI (chapitre 5)
   L'élève pose lui-même l'opération dans une grille de cahier : il touche une case, puis le chiffre.
   - Retenues : bouton « Ajouter une retenue », écrites en haut ou à droite (au choix de l'élève, les deux sont justes).
     Une retenue comptée doit être barrée : le site le rappelle si l'élève l'oublie.
   - Soustraction : l'élève choisit sa méthode au début de la question, en images
     (« je casse » : on barre le chiffre de gauche ; « 1 en haut, 1 en bas » : conservation des écarts).
   - Des questions où un des nombres est entier.
   Clés : o-pa (addition), o-ps (soustraction), o-pm (multiplication). Ce fichier se charge en dernier.
   ========================================================= */
(function () {
  const RET_KEY = 'revisions6e-retenues'; // 'haut' | 'droite' : simple préférence d'affichage
  const SUB_KEY = 'revisions6e-soustraction'; // méthode montrée dans la fiche
  const DIR_KEY = 'revisions6e-pose-direct'; // '1' : l'élève pose sur son cahier et donne seulement le résultat
  const pref = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  const setPref = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* rien */ } };

  const RANGS = ['unités', 'dizaines', 'centaines', 'milliers', 'dizaines de mille', 'centaines de mille'];
  const DRANGS = ['dixièmes', 'centièmes', 'millièmes', 'dix-millièmes'];
  const rang = (c, u) => (c >= u ? RANGS[c - u] || 'grands chiffres' : DRANGS[u - c - 1] || 'derniers chiffres');
  const colName = (c, u) => `la colonne des <b>${rang(c, u)}</b>`;
  const val = (x) => x.m / P10(x.k);
  const nStr = (x) => decStr(x.m, x.k, false);
  let SEQ = 0; // ordre d'écriture des retenues (retenues « à droite », sur le côté)
  const range = (a, b) => { const t = []; for (let i = a; i <= b; i++) t.push(i); return t; };
  /** chiffres de m (k décimales) placés avec les unités dans la colonne u : {col: chiffre} */
  function place(m, k, u) {
    const s = String(m).padStart(k + 1, '0'), out = {};
    [...s].reverse().forEach((d, j) => { out[u - k + j] = d; });
    return { cols: out, lo: u - k, hi: u - k + s.length - 1 };
  }

  /* ---------------- État d'une grille ---------------- */
  function newState(spec) {
    const rows = spec.op === '×' ? ['A', 'B', ...Array.from({ length: spec.nL }, (_, i) => 'L' + i), 'R'] : ['A', 'B', 'R'];
    const cells = {}, comma = {};
    rows.forEach((r) => { cells[r] = Array(spec.W).fill(''); comma[r] = null; });
    return {
      ...spec, rows, cells, comma, ghost: {},
      carries: Array.from({ length: spec.W }, () => []),
      top: Array.from({ length: spec.W }, () => ({ rew: [], one: null })),
      plus: Array(spec.W).fill(false),
      sel: null, locked: false, nudged: new Set(), reminded: false, heads: false, marks: {}, hl: new Set(), blink: null,
    };
  }
  const shiftOf = (r) => (r && r[0] === 'L' ? Number(r.slice(1)) : 0);
  const dg = (st, r, c) => (st.cells[r][c] === '' ? 0 : Number(st.cells[r][c]));

  /** Lecture d'une ligne de la grille */
  function parseRow(st, r) {
    const cells = st.cells[r], filled = range(0, st.W - 1).filter((c) => cells[c] !== '');
    if (!filled.length) return null;
    const lo = filled[0], hi = filled[filled.length - 1];
    const gap = range(lo, hi).some((c) => cells[c] === '');
    const cm = st.comma[r], commaBad = cm !== null && (cm < lo || cm > hi);
    const digits = range(lo, hi).reverse().map((c) => cells[c] || '0').join('');
    const k = cm !== null && !commaBad ? cm - lo : 0;
    const m = Number(digits);
    return { lo, hi, gap, cm, commaBad, m, k, u: cm !== null && !commaBad ? cm : lo, value: m / P10(k), digits };
  }

  /* ---------------- Dessin ---------------- */
  const CLS = (o) => Object.keys(o).filter((k) => o[k]).join(' ');
  /** HTML de la grille. live : grille à remplir (cases cliquables). */
  function gridHTML(st, live = true) {
    const W = st.W, cols = range(0, W - 1).reverse(), style = st.style || 'haut';
    const isSel = (t, a, b) => live && st.sel && st.sel.t === t && st.sel.a === a && st.sel.b === b;
    const showTop = st.op !== '−' ? style === 'haut' : st.method === 'cassage';
    let h = '';
    // en-têtes du tableau de numération (outil)
    if (st.heads) {
      const u = st.headsU;
      h += `<div class="pz-row pz-H"><span class="pz-sign"></span>${cols.map((c) => `<span class="pz-h${c === u ? ' u' : ''}">${c >= u ? ['u', 'd', 'c', 'm', 'dm', 'cm'][c - u] || '' : ['di', 'ce', 'mi'][u - c - 1] || ''}</span>`).join('')}</div>`;
    }
    // zone au-dessus du nombre du haut : retenues (en haut) ou chiffres réécrits (je casse)
    if (showTop) {
      h += `<div class="pz-row pz-T"><span class="pz-sign"></span>${cols.map((c) => {
        let items = '';
        if (st.op !== '−') {
          items = st.carries[c].map((k, i) => `<span class="pz-k${k.x ? ' pz-x' : ''}${k.v === '' ? ' pz-empty' : ''}${isSel('carry', c, i) ? ' sel' : ''}${st.blink === `${c}:${i}` ? ' pz-blink' : ''}" data-carry="${c}:${i}">${k.v || '&nbsp;'}</span>`).join('');
        } else {
          const T = st.top[c];
          items = T.rew.map((v, i) => `<span class="pz-k pz-rw${i < T.rew.length - 1 ? ' pz-x' : ''}${v === '' ? ' pz-empty' : ''}${isSel('rew', c, i) ? ' sel' : ''}" data-rew="${c}:${i}">${T.one === i + 1 ? '<i class="pz-one1">1</i>' : ''}${v || '&nbsp;'}</span>`).join('');
        }
        return `<span class="pz-t">${items}</span>`;
      }).join('')}</div>`;
    }
    const sign = { A: '', B: st.op, R: '' };
    // retenues « à droite » : sur le côté, à droite de la ligne qu'on calcule, dans l'ordre où on les écrit
    const side = st.op !== '−' && style === 'droite';
    const sideCarries = (r) => {
      const list = [];
      st.carries.forEach((l, c) => l.forEach((k, i) => { if (k.row === r) list.push({ k, c, i }); }));
      list.sort((p, q) => (p.k.n || 0) - (q.k.n || 0));
      return list.map(({ k, c, i }) => `<span class="pz-k${k.x ? ' pz-x' : ''}${k.v === '' ? ' pz-empty' : ''}${isSel('carry', c, i) ? ' sel' : ''}${st.blink === `${c}:${i}` ? ' pz-blink' : ''}" data-carry="${c}:${i}">${k.v || '&nbsp;'}</span>`).join('');
    };
    st.rows.forEach((r) => {
      const sg = r[0] === 'L' ? (r !== 'L0' ? '+' : '') : sign[r];
      h += `<div class="pz-row pz-r-${r}"><span class="pz-sign">${sg}</span>${cols.map((c) => {
        const v = st.cells[r][c], mk = st.marks[`${r}:${c}`];
        const T = st.top[c];
        const crossed = r === 'A' && st.op === '−' && T.rew.length > 0;
        const cls = CLS({ 'pz-c': 1, sel: isSel('cell', r, c), 'pz-hl': st.hl.has(c), ok: mk === 1, ko: mk === 0, gz: st.ghost[`${r}:${c}`], 'pz-crossed': crossed, live });
        let inner = v === '' ? '' : v;
        if (r === 'A' && st.op === '−' && T.one === 0) inner = `<i class="pz-one${crossed ? ' pz-x' : ''}">1</i>` + inner;
        if (r === 'B' && st.op === '−' && st.plus[c]) inner += '<i class="pz-plus">+1</i>';
        if (st.comma[r] === c) inner += '<i class="pz-comma">,</i>';
        return `<span class="${cls}" ${live ? `data-r="${r}" data-c="${c}"` : ''}>${inner}</span>`;
      }).join('')}${side ? `<span class="pz-side">${sideCarries(r)}</span>` : ''}</div>`;
    });
    return `<div class="pz-grid${live ? '' : ' pz-static'}${st.op === '×' ? ' pz-mul' : ''}" ${live ? 'tabindex="0" aria-label="Grille pour poser l\'opération"' : ''}>${h}</div>`;
  }

  /* ---------------- Images des choix (retenues, méthodes de soustraction) ---------------- */
  function demoState(op, a, b, opts = {}) {
    const st = newState({ op, a, b, W: opts.W || 3, nL: 0, style: opts.style || 'haut', method: opts.method || null });
    fillOperands(st, opts.u ?? Math.max(a.k, b.k));
    return st;
  }
  const subDemo = (method, step = 3, a = dv(82, 0), b = dv(25, 0), W = 2) => {
    const st = demoState('−', a, b, { method, W });
    solveSub(st, step);
    return st;
  };
  const carryDemo = (style) => {
    const st = demoState('+', dv(58, 0), dv(27, 0), { style, W: 2 });
    solveAdd(st); st.carries[1][0].x = true;
    return st;
  };
  const METH = {
    cassage: { short: 'Je barre le chiffre d\'à côté', icon: '✂️' },
    compensation: { short: 'J\'ajoute 1 en haut et 1 en bas', icon: '⚖️' },
  };

  /* ---------------- Remplissage « solution » (corrigé, vidéoprojecteur, fiche) ---------------- */
  function fillOperands(st, u) {
    const K = Math.max(st.a.k, st.b.k);
    [['A', st.a], ['B', st.b]].forEach(([r, x]) => {
      const p = place(x.m * P10(K - x.k), K, u);
      Object.entries(p.cols).forEach(([c, d]) => { st.cells[r][c] = d; if (Number(c) < u - x.k) st.ghost[`${r}:${c}`] = true; });
      if (K) st.comma[r] = u;
    });
    return K;
  }
  function solveAdd(st) {
    const u = st.solU ?? Math.max(st.a.k, st.b.k);
    const K = fillOperands(st, u);
    const A = parseRow(st, 'A'), B = parseRow(st, 'B');
    const res = Math.round(A.value * P10(K)) + Math.round(B.value * P10(K));
    const p = place(res, K, u);
    Object.entries(p.cols).forEach(([c, d]) => { st.cells.R[c] = d; });
    if (K) st.comma.R = u;
    let cin = 0;
    for (let c = u - K; c < st.W; c++) {
      if (cin) st.carries[c] = [{ v: String(cin), x: true, row: 'R', n: ++SEQ }];
      cin = Math.floor((dg(st, 'A', c) + dg(st, 'B', c) + cin) / 10);
    }
  }
  /** soustraction : marques de la méthode ; step (fiche) : 1 = posée, 2 = marques de la 1re colonne, 3 = tout */
  function solveSub(st, step = 3) {
    const u = st.solU ?? Math.max(st.a.k, st.b.k);
    const K = fillOperands(st, u);
    if (step < 2) return;
    const lo = u - K;
    const x = range(0, st.W - 1).map((c) => dg(st, 'A', c)), y = range(0, st.W - 1).map((c) => dg(st, 'B', c));
    const out = {};
    if (st.method === 'compensation') {
      let add = 0;
      for (let c = lo; c < st.W; c++) {
        const yy = y[c] + add; add = 0;
        if (x[c] < yy) { st.top[c].one = 0; if (c + 1 < st.W) st.plus[c + 1] = true; add = 1; out[c] = x[c] + 10 - yy; } else out[c] = x[c] - yy;
        if (step === 2) break;
      }
    } else {
      const cur = [...x];
      const take = (c) => { if (cur[c] === 0) { take(c + 1); st.top[c].one = st.top[c].rew.length; cur[c] = 10; } cur[c] -= 1; st.top[c].rew.push(String(cur[c])); };
      for (let c = lo; c < st.W; c++) {
        if (cur[c] < y[c]) { take(c + 1); st.top[c].one = st.top[c].rew.length; cur[c] += 10; }
        out[c] = cur[c] - y[c];
        if (step === 2) break;
      }
    }
    if (step < 3) { if (out[lo] !== undefined) st.cells.R[lo] = String(out[lo]); return; }
    const A = parseRow(st, 'A'), B = parseRow(st, 'B');
    const res = Math.round(A.value * P10(K)) - Math.round(B.value * P10(K));
    const p = place(res, K, u);
    Object.entries(p.cols).forEach(([c, d]) => { st.cells.R[c] = d; });
    if (K) st.comma.R = u;
  }
  function solveMul(st) {
    const { a, b } = st;
    [['A', a], ['B', b]].forEach(([r, x]) => {
      const p = place(x.m, x.k, x.k);
      Object.entries(p.cols).forEach(([c, d]) => { st.cells[r][c] = d; });
      if (x.k) st.comma[r] = x.k;
    });
    const M1 = a.m, bd = String(b.m).split('').reverse().map(Number);
    const xs = String(M1).split('').reverse().map(Number);
    const lineCarries = (d, row) => {
      let cin = 0;
      xs.forEach((xd, c) => {
        if (cin && c > 0) st.carries[c].push({ v: String(cin), x: true, row, n: ++SEQ });
        cin = Math.floor((xd * d + cin) / 10);
      });
    };
    if (st.nL) {
      bd.forEach((d, i) => {
        const p = place(M1 * d, 0, i);
        Object.entries(p.cols).forEach(([c, dd]) => { st.cells['L' + i][c] = dd; });
        for (let c = 0; c < i; c++) { st.cells['L' + i][c] = '0'; st.ghost[`L${i}:${c}`] = true; }
        lineCarries(d, 'L' + i);
      });
    } else lineCarries(bd[0], 'R');
    const K = a.k + b.k, p = place(M1 * b.m, 0, 0);
    Object.entries(p.cols).forEach(([c, d]) => { st.cells.R[c] = d; });
    if (K) st.comma.R = K;
  }

  /* ---------------- Correction ---------------- */
  const err = (msg, extra = {}) => ({ ok: false, msg, ...extra });
  /** commun : les deux nombres sont-ils bien recopiés ? */
  function checkCopy(st, A, B, want) {
    if (A.gap || B.gap) return err('Un nombre s\'écrit <b>sans case vide</b> entre ses chiffres : vérifie les deux nombres.', { hlRows: ['A', 'B'] });
    if (A.commaBad || B.commaBad) return err('La virgule se place <b>juste à droite du chiffre des unités</b>, collée au nombre.');
    for (const [P, x, name] of [[A, want[0], 'en haut'], [B, want[1], 'en bas']]) {
      if (eq(P.value, val(x))) continue;
      if (P.digits.replace(/^0+/, '') === String(x.m) || P.digits.replace(/0+$/, '') === String(x.m).replace(/0+$/, '')) {
        return err(x.k ? `Le nombre ${name} doit être <b>${nStr(x)}</b> : place la virgule juste après le chiffre des unités.` : `Le nombre ${name} doit être <b>${nStr(x)}</b> : c'est un nombre entier, il n'a pas de chiffres après la virgule.`);
      }
      return err(`Recopie bien le nombre ${name} : <b>${nStr(x)}</b>.`);
    }
    return null;
  }

  function evalAS(st) {
    const A = parseRow(st, 'A'), B = parseRow(st, 'B'), R = parseRow(st, 'R');
    if (!A || !B || !R) return { incomplete: true };
    const { a, b, op } = st;
    let want = [a, b];
    if (op === '+' && !eq(A.value, val(a)) && eq(A.value, val(b))) want = [b, a];
    if (op === '−' && eq(A.value, val(b)) && eq(B.value, val(a))) return err('Dans une soustraction, le premier nombre (le plus grand) s\'écrit <b>en haut</b>.', { pose: 1 });
    const e = checkCopy(st, A, B, want); if (e) return { ...e, pose: 1 };
    if (A.u !== B.u) {
      const ent = a.k === 0 ? a : b.k === 0 ? b : null;
      let msg;
      if (ent) msg = `<b>${nStr(ent)}</b> est un nombre entier : sa virgule est « cachée » juste après le chiffre des unités (${nStr(ent)} = ${nStr(ent)},00). Mets son chiffre des <b>unités</b> dans la même colonne que les unités de l'autre nombre.`;
      else if (A.lo === B.lo) msg = 'Tu as aligné les nombres à droite. Il faut aligner les <b>virgules</b> : les unités sous les unités, les dixièmes sous les dixièmes…';
      else msg = 'Les <b>virgules</b> doivent être l\'une sous l\'autre : les unités sous les unités, les dixièmes sous les dixièmes…';
      return err(msg, { pose: 1, cols: [A.u, B.u] });
    }
    const u = A.u, K = Math.max(A.k, B.k), lo = u - K;
    const toM = (P) => Math.round(P.value * P10(K));
    const resM = op === '+' ? toM(A) + toM(B) : toM(A) - toM(B);
    const ex = place(resM, K, u);
    // zéros de fin (après la virgule) qu'on peut ne pas écrire
    const trail = new Set(); for (let c = ex.lo; c < u && ex.cols[c] === '0'; c++) trail.add(c);
    const marks = {}; let bad = null;
    const top = Math.max(ex.hi, R.hi);
    for (let c = Math.min(lo, R.lo); c <= top; c++) {
      const s = st.cells.R[c], e2 = ex.cols[c] ?? '';
      const good = s === e2 || (s === '' && trail.has(c) && range(ex.lo, c).every((z) => st.cells.R[z] === ''));
      if (s !== '') marks[`R:${c}`] = good ? 1 : 0;
      if (!good && bad === null) bad = c;
    }
    const decWritten = range(0, u - 1).some((c) => st.cells.R[c] !== '');
    const commaOk = R.cm === u || (R.cm === null && !decWritten);
    if (bad === null && commaOk) return { ok: true, marks };
    if (bad === null) return err('Les chiffres sont justes, mais <b>la virgule</b> du résultat n\'est pas au bon endroit : elle se place sous les autres virgules.', { marks, cols: [u] });
    // la colonne fausse : quelle erreur ?
    const c = bad, x = dg(st, 'A', c), y = dg(st, 'B', c), s = st.cells.R[c], where = colName(c, u);
    let cin = 0; for (let z = lo; z < c; z++) cin = op === '+' ? Math.floor((dg(st, 'A', z) + dg(st, 'B', z) + cin) / 10) : (dg(st, 'A', z) - dg(st, 'B', z) - cin < 0 ? 1 : 0);
    let msg;
    if (s === '') msg = op === '+' && c > A.hi && c > B.hi ? `Il reste une <b>retenue</b> à la fin : écris-la dans le résultat, dans ${where}.` : `Il manque un chiffre dans ${where}.`;
    else if (op === '+') {
      if (cin && Number(s) === (x + y) % 10) msg = `Dans ${where}, tu as oublié la <b>retenue</b> qui vient de la colonne de droite.`;
      else if (!cin && Number(s) === (x + y + 1) % 10) msg = `Dans ${where}, il n'y a pas de retenue : la colonne de droite ne dépasse pas 9.`;
      else msg = `Refais ${where} : chiffre du haut + chiffre du bas${cin ? ' + la retenue' : ''}. Si ça dépasse 9, on écrit le chiffre des unités et on retient 1.`;
    } else {
      const blankTop = st.cells.A[c] === '' && st.cells.B[c] !== '';
      if (blankTop) msg = `Dans ${where}, il n'y a rien en haut : écris un <b>0</b> dans la case vide (${nStr(st.a)} = ${decStr(st.a.m * P10(K - st.a.k), K, false)}).`;
      else if (!cin && x < y && Number(s) === y - x) msg = `Dans ${where}, tu as calculé ${y} − ${x} : c'est <b>à l'envers</b> ! On enlève toujours le chiffre du bas au chiffre du haut. ${x} − ${y} est impossible : ${st.method === 'compensation' ? 'ajoute 10 en haut (un petit 1 devant) et 1 en bas dans la colonne de gauche (+1).' : 'casse le chiffre de la colonne de gauche (barre-le et réécris-le en enlevant 1) et mets un petit 1 devant.'}`;
      else if (cin && Number(s) === (x - y + 10) % 10) msg = st.method === 'compensation'
        ? `Dans ${where}, tu as oublié le <b>+1 en bas</b> : dans la colonne de droite, tu as ajouté 10 en haut ; il faut donc ajouter 1 au chiffre du bas ici.`
        : `Dans ${where}, tu as oublié que ce chiffre du haut a été <b>cassé</b> : il a perdu 1. Barre-le et écris au-dessus le nouveau chiffre.`;
      else msg = `Refais ${where} : chiffre du haut − chiffre du bas. Si le chiffre du haut est trop petit, ${st.method === 'compensation' ? 'ajoute 10 en haut et 1 en bas dans la colonne suivante.' : 'casse une dizaine de la colonne de gauche.'}`;
    }
    return err(msg, { marks, cols: [c] });
  }

  function evalMul(st) {
    const A = parseRow(st, 'A'), B = parseRow(st, 'B'), R = parseRow(st, 'R');
    if (!A || !B || !R) return { incomplete: true };
    const { a, b } = st;
    if (eq(A.value, val(b)) && eq(B.value, val(a)) && !eq(val(a), val(b))) return err('Écris <b>en haut</b> le nombre qui a le plus de chiffres : il y aura moins de lignes à calculer.', { pose: 1 });
    const e = checkCopy(st, A, B, [a, b]); if (e) return { ...e, pose: 1 };
    if (A.lo !== B.lo) return err(A.u === B.u ? 'Dans une multiplication, on n\'aligne pas les virgules : on écrit les deux nombres <b>calés à droite</b>, comme des nombres entiers.' : 'Écris les deux nombres <b>calés à droite</b> : le dernier chiffre de l\'un sous le dernier chiffre de l\'autre.', { pose: 1, cols: [A.lo, B.lo] });
    const o = A.lo, M1 = Number(A.digits), bd = B.digits.split('').reverse().map(Number);
    const marks = {};
    const nL = st.nL;
    for (let i = 0; i < nL; i++) {
      const r = 'L' + i, P = parseRow(st, r);
      if (!P) return { incomplete: true };
      if (st.comma[r] !== null) return err(`Pas de virgule dans les lignes du calcul : on multiplie <b>sans s'occuper des virgules</b>. Efface la virgule de la ligne ${i + 1}.`, { marks });
      const d = bd[i] ?? 0, ex = place(M1 * d, 0, o + i);
      let bad = null;
      for (let c = Math.min(o, P.lo); c <= Math.max(ex.hi, P.hi); c++) {
        const s = st.cells[r][c], want = c < o + i && c >= o ? ['', '0'] : [ex.cols[c] ?? ''];
        const good = want.includes(s);
        if (s !== '') marks[`${r}:${c}`] = good ? 1 : 0;
        if (!good && bad === null) bad = c;
      }
      if (bad !== null) {
        const unshifted = place(M1 * d, 0, o);
        const same = range(o, unshifted.hi).every((c) => st.cells[r][c] === unshifted.cols[c]);
        if (i > 0 && same) return err(`Ligne ${i + 1} : tu multiplies par le chiffre des <b>${RANGS[i]}</b> (${d}). On décale d'un rang vers la gauche : écris d'abord un <b>0</b> dans la colonne de droite.`, { marks, cols: [o] });
        // retenue oubliée ?
        let cin = 0, forgot = false;
        const xs = A.digits.split('').reverse().map(Number);
        for (let j = 0; j < xs.length; j++) {
          const c = o + i + j;
          if (c === bad && cin && st.cells[r][c] === String((xs[j] * d) % 10)) forgot = true;
          cin = Math.floor((xs[j] * d + cin) / 10);
        }
        if (forgot) return err(`Ligne ${i + 1} : tu as oublié d'ajouter une <b>retenue</b>.`, { marks, cols: [bad] });
        return err(`Ligne ${i + 1} : on calcule ${groupInt(String(M1))} × ${d}${i ? ` (et on décale d'un rang : un 0 à droite)` : ''}. Multiplie chaque chiffre du haut par ${d}, en partant de la droite, sans oublier les retenues.`, { marks, cols: [bad] });
      }
    }
    const K = A.k + B.k, P = M1 * Number(B.digits), ex = place(P, 0, o);
    let bad = null;
    for (let c = Math.min(o, R.lo); c <= Math.max(ex.hi, R.hi); c++) {
      const s = st.cells.R[c], e2 = ex.cols[c] ?? '';
      const trailing = c < o + K && e2 === '0' && range(o, c).every((z) => ex.cols[z] === '0' && st.cells.R[z] === '');
      const good = s === e2 || (s === '' && trailing);
      if (s !== '') marks[`R:${c}`] = good ? 1 : 0;
      if (!good && bad === null) bad = c;
    }
    const decWritten = range(0, o + K - 1).some((c) => st.cells.R[c] !== '');
    const commaOk = K === 0 ? R.cm === null || R.cm === o : R.cm === o + K || (R.cm === null && !decWritten);
    if (bad === null && commaOk) return { ok: true, marks };
    if (bad === null) return err(`Les chiffres sont justes ! Reste <b>la virgule</b> : ${nStr(a)} a ${a.k} chiffre${a.k > 1 ? 's' : ''} après la virgule, ${nStr(b)} en a ${b.k} : ${a.k} + ${b.k} = ${K}. Le résultat a donc ${K} chiffre${K > 1 ? 's' : ''} après la virgule (on compte en partant de la droite).`, { marks, cols: [o + K] });
    if (nL) return err(`Le résultat est la <b>somme des ${nL} lignes</b>. Refais l'addition dans ${colName(bad, o)}, sans oublier les retenues.`, { marks, cols: [bad] });
    let cin = 0, forgot = false; const xs = A.digits.split('').reverse().map(Number), d = bd[0];
    for (let j = 0; j < xs.length; j++) { const c = o + j; if (c === bad && cin && st.cells.R[c] === String((xs[j] * d) % 10)) forgot = true; cin = Math.floor((xs[j] * d + cin) / 10); }
    if (forgot) return err('Tu as oublié d\'ajouter une <b>retenue</b> dans la colonne surlignée.', { marks, cols: [bad] });
    if (st.cells.R[bad] === '' && bad > A.hi) return err('Il reste une <b>retenue</b> à la fin : écris-la au début du résultat.', { marks, cols: [bad] });
    return err(`Refais la colonne surlignée : ${d} × le chiffre du haut, plus la retenue éventuelle.`, { marks, cols: [bad] });
  }
  const evaluate = (st) => (st.op === '×' ? evalMul(st) : evalAS(st));

  /** retenues comptées mais pas barrées */
  function usedUncrossed(st) {
    const out = [];
    st.carries.forEach((list, c) => list.forEach((k, i) => {
      if (k.x || k.v === '' || !st.cells[k.row]) return;
      const useC = c + shiftOf(k.row);
      if (st.cells[k.row][useC] !== '') out.push({ c, i, k, useC });
    }));
    return out;
  }

  /* ---------------- La grille interactive ---------------- */
  function createPose(host, spec) {
    const st = newState({ ...spec, style: pref(RET_KEY, 'haut') });
    const P = { st, render, lock, reveal, host };
    const msgSet = (html, kind = '') => { const m = host.querySelector('.pz-msg'); if (m) { m.className = 'pz-msg ' + kind; m.innerHTML = html || ''; } };

    function chooserHTML() {
      return `<p class="pz-ask"><b>Comment fais-tu</b> quand le chiffre du haut est trop petit ? Choisis :</p>
        <div class="pz-meth">${['cassage', 'compensation'].map((m) => `<button type="button" class="pz-mcard" data-meth="${m}">${gridHTML(subDemo(m), false)}<span>${METH[m].short}</span></button>`).join('')}</div>`;
    }
    function toolsHTML() {
      const t = [];
      if (st.op !== '−') {
        t.push('<button type="button" class="btn pz-tool" data-tool="carry">＋ Ajouter une retenue</button>');
        t.push('<button type="button" class="btn pz-tool" data-tool="cross">✏️ Barrer la retenue</button>');
      } else if (st.method === 'cassage') {
        t.push('<button type="button" class="btn pz-tool" data-tool="casse">✂️ Barrer ce chiffre et le réécrire</button>');
        t.push('<button type="button" class="btn pz-tool" data-tool="one">Petit 1 devant</button>');
      } else {
        t.push('<button type="button" class="btn pz-tool" data-tool="one">Petit 1 devant (en haut)</button>');
        t.push('<button type="button" class="btn pz-tool" data-tool="plus">+1 (en bas)</button>');
      }
      return t.join('');
    }
    function headHTML() {
      if (st.op === '−') return `<div class="pz-head"><span class="small muted">Ta méthode :</span> <span class="pz-mini">${METH[st.method].icon} ${METH[st.method].short}</span> <button type="button" class="mini pz-change">changer</button></div>`;
      return `<div class="pz-head"><span class="small"><b>Je préfère</b> écrire mes retenues :<br><span class="muted">c'est toi qui choisis, les deux sont justes</span></span><span class="pz-style">${['haut', 'droite'].map((s) => `<button type="button" class="pz-sbtn${st.style === s ? ' on' : ''}" data-style="${s}" title="Retenues ${s === 'haut' ? 'en haut' : 'à droite, sur le côté'}">${gridHTML(carryDemo(s), false)}<span>${s === 'haut' ? 'en haut' : 'à droite, sur le côté'}</span></button>`).join('')}</span></div>`;
    }
    function render() {
      if (st.op === '−' && !st.method) { host.innerHTML = `<div class="pz">${chooserHTML()}</div>`; return; }
      const keep = host.querySelector('.pz-msg')?.outerHTML || '<div class="pz-msg" aria-live="polite"></div>';
      host.innerHTML = `<div class="pz${st.locked ? ' pz-locked' : ''}">${headHTML()}${gridHTML(st, true)}${keep}${st.locked ? '' : `<div class="pz-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => `<button type="button" class="pz-key" data-k="${d}">${d}</button>`).join('')}<button type="button" class="pz-key" data-k="," title="Virgule">,</button><button type="button" class="pz-key pz-del" data-k="del" title="Effacer">⌫</button></div><div class="pz-tools">${toolsHTML()}</div>`}</div>`;
      updTools();
    }
    function updTools() {
      const s = st.sel;
      host.querySelectorAll('.pz-tool').forEach((b) => {
        const t = b.dataset.tool;
        let on = !!s;
        if (t === 'cross') on = !!s && (s.t === 'carry' || (s.t === 'cell' && st.carries[colFor(s)]?.some((k) => !k.x)));
        if (t === 'casse' || t === 'one') on = !!s && (s.t === 'cell' ? s.a === 'A' : s.t === 'rew');
        if (t === 'plus') on = !!s && s.t === 'cell' && s.a === 'B';
        b.disabled = !on;
      });
    }
    const colFor = (s) => (s.t === 'cell' ? s.b - shiftOf(s.a) : s.a);
    function select(s) { st.sel = s; st.blink = null; render(); host.querySelector('.pz-grid')?.focus({ preventScroll: true }); }
    function clearCheckMarks() { st.marks = {}; st.hl = new Set(); }

    function typeDigit(d) {
      const s = st.sel; if (!s) { msgSet('Touche d\'abord une case de la grille.', 'warn'); return; }
      clearCheckMarks();
      if (!host.querySelector('.pz-msg.nudge')) msgSet('');
      if (s.t === 'carry') { st.carries[s.a][s.b].v = d; st.sel = st.carries[s.a][s.b].from || null; render(); return; }
      if (s.t === 'rew') { st.top[s.a].rew[s.b] = d; st.sel = { t: 'cell', a: 'A', b: s.a }; render(); return; }
      const r = s.a, c = s.b;
      st.cells[r][c] = d;
      nudge(r, c);
      // case suivante : vers la droite pour recopier un nombre, vers la gauche pour calculer
      if (r === 'A' || r === 'B') { if (c > 0) st.sel = { t: 'cell', a: r, b: c - 1 }; } else if (c < st.W - 1) st.sel = { t: 'cell', a: r, b: c + 1 };
      render();
    }
    /** rappel : une retenue déjà comptée doit être barrée */
    function nudge(r, c) {
      if (st.op === '−') return;
      const list = usedUncrossed(st).filter((z) => !(z.k.row === r && z.useC === c) && !st.nudged.has(z.k));
      if (!list.length) return;
      const z = list[0]; st.nudged.add(z.k); st.blink = `${z.c}:${z.i}`;
      msgSet('✏️ Tu as compté la retenue qui clignote ? <b>Barre-la</b> : touche-la, puis « Barrer la retenue ».', 'nudge');
    }
    function comma() {
      const s = st.sel; if (!s || s.t !== 'cell') return;
      clearCheckMarks();
      const r = s.a, c = s.b;
      const target = st.cells[r][c] !== '' ? c : c + 1 < st.W && st.cells[r][c + 1] !== '' ? c + 1 : c;
      st.comma[r] = st.comma[r] === target ? null : target;
      render();
    }
    function del() {
      const s = st.sel; if (!s) return;
      clearCheckMarks();
      if (s.t === 'carry') { const from = st.carries[s.a][s.b].from; st.carries[s.a].splice(s.b, 1); st.sel = from || null; render(); return; }
      if (s.t === 'rew') { const T = st.top[s.a]; T.rew.splice(s.b, 1); if (T.one !== null && T.one > T.rew.length) T.one = null; st.sel = { t: 'cell', a: 'A', b: s.a }; render(); return; }
      const r = s.a, c = s.b;
      if (st.cells[r][c] !== '') st.cells[r][c] = '';
      else if (st.comma[r] === c) st.comma[r] = null;
      else if (r === 'A' && (st.top[c].rew.length || st.top[c].one !== null)) st.top[c] = { rew: [], one: null };
      else if (r === 'B' && st.plus[c]) st.plus[c] = false;
      else if (st.comma[r] === c + 1 || (c + 1 < st.W && st.cells[r][c + 1] !== '' && (r === 'A' || r === 'B'))) { st.sel = { t: 'cell', a: r, b: c + 1 }; if (st.comma[r] === c + 1) st.comma[r] = null; else st.cells[r][c + 1] = ''; }
      render();
    }
    function tool(t) {
      const s = st.sel; if (!s) { msgSet('Touche d\'abord une case de la grille.', 'warn'); return; }
      clearCheckMarks();
      if (t === 'carry') {
        const c = colFor(s);
        if (c < 0 || c >= st.W) { msgSet('Pas de retenue possible ici.', 'warn'); return; }
        const from = s.t === 'cell' ? s : null;
        const row = s.t === 'cell' ? s.a : s.t === 'carry' ? st.carries[s.a][s.b].row : 'R';
        st.carries[c].push({ v: '', x: false, row: row === 'A' || row === 'B' ? (st.op === '×' ? (st.nL ? 'L0' : 'R') : 'R') : row, from, n: ++SEQ });
        st.sel = { t: 'carry', a: c, b: st.carries[c].length - 1 };
        msgSet('Touche le chiffre de la retenue.', '');
        render(); return;
      }
      if (t === 'cross') {
        let c, i;
        if (s.t === 'carry') { c = s.a; i = s.b; } else { c = colFor(s); i = st.carries[c]?.map((k) => !k.x).lastIndexOf(true); }
        if (c === undefined || i === undefined || i < 0 || !st.carries[c]?.[i]) return;
        st.carries[c][i].x = !st.carries[c][i].x; st.blink = null;
        if (st.carries[c][i].x && host.querySelector('.pz-msg.nudge')) msgSet('');
        st.sel = s.t === 'carry' ? (st.carries[c][i].from || s) : s;
        render(); return;
      }
      const c = s.t === 'rew' ? s.a : s.b;
      if (t === 'casse') {
        if (st.cells.A[c] === '') { msgSet('Écris d\'abord un chiffre dans cette case (un <b>0</b> s\'il n\'y a rien).', 'warn'); return; }
        const T = st.top[c];
        if (T.rew.length && T.rew[T.rew.length - 1] === '') return;
        T.rew.push('');
        st.sel = { t: 'rew', a: c, b: T.rew.length - 1 };
        msgSet('Écris au-dessus le nouveau chiffre (il a perdu 1).', '');
        render(); return;
      }
      if (t === 'one') {
        if (st.cells.A[c] === '') { msgSet('Écris d\'abord un chiffre dans cette case (un <b>0</b> s\'il n\'y a rien).', 'warn'); return; }
        const T = st.top[c], layer = st.method === 'cassage' ? T.rew.length : 0;
        T.one = T.one === layer ? null : layer;
        st.sel = { t: 'cell', a: 'A', b: c };
        render(); return;
      }
      if (t === 'plus') { st.plus[c] = !st.plus[c]; render(); }
    }

    host.addEventListener('click', (e) => {
      const mc = e.target.closest('[data-meth]');
      if (mc) { st.method = mc.dataset.meth; render(); host.querySelector('.pz-grid')?.focus({ preventScroll: true }); return; }
      if (e.target.closest('.pz-change')) {
        if (st.locked) return;
        st.method = null; st.top = st.top.map(() => ({ rew: [], one: null })); st.plus = st.plus.map(() => false); st.sel = null; render(); return;
      }
      const sb = e.target.closest('[data-style]');
      if (sb) { st.style = sb.dataset.style; setPref(RET_KEY, st.style); render(); return; }
      if (st.locked) return;
      const k = e.target.closest('[data-carry]');
      if (k) { const [c, i] = k.dataset.carry.split(':').map(Number); const already = st.sel && st.sel.t === 'carry' && st.sel.a === c && st.sel.b === i; if (already && st.carries[c][i].v !== '') { tool('cross'); return; } select({ t: 'carry', a: c, b: i }); return; }
      const rw = e.target.closest('[data-rew]');
      if (rw) { const [c, i] = rw.dataset.rew.split(':').map(Number); select({ t: 'rew', a: c, b: i }); return; }
      const cell = e.target.closest('.pz-c[data-r]');
      if (cell) { select({ t: 'cell', a: cell.dataset.r, b: Number(cell.dataset.c) }); return; }
      const key = e.target.closest('.pz-key');
      if (key) { const v = key.dataset.k; if (v === 'del') del(); else if (v === ',') comma(); else typeDigit(v); host.querySelector('.pz-grid')?.focus({ preventScroll: true }); return; }
      const tl = e.target.closest('.pz-tool');
      if (tl) { tool(tl.dataset.tool); }
    });
    host.addEventListener('keydown', (e) => {
      if (st.locked || !e.target.closest('.pz-grid')) return;
      const s = st.sel;
      if (/^[0-9]$/.test(e.key)) { e.preventDefault(); typeDigit(e.key); return; }
      if (e.key === ',' || e.key === '.') { e.preventDefault(); comma(); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); del(); return; }
      if (e.key === 'Enter') { e.preventDefault(); host.closest('.exercise')?.querySelector('.ex-check')?.click(); return; }
      const mv = { ArrowLeft: [0, 1], ArrowRight: [0, -1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
      if (mv) {
        e.preventDefault();
        if (!s || s.t !== 'cell') { select({ t: 'cell', a: 'A', b: st.W - 1 }); return; }
        const ri = Math.max(0, Math.min(st.rows.length - 1, st.rows.indexOf(s.a) + mv[0]));
        select({ t: 'cell', a: st.rows[ri], b: Math.max(0, Math.min(st.W - 1, s.b + mv[1])) });
      }
    });

    function lock() { st.locked = true; st.sel = null; render(); }
    function reveal() {
      // on repart d'une grille vide, remplie avec la solution
      const keep = { style: st.style, method: st.method || (st.op === '−' ? pref(SUB_KEY, 'cassage') : null) };
      Object.assign(st, newState({ ...spec, ...keep }));
      st.solU = spec.solU;
      if (st.op === '+') solveAdd(st); else if (st.op === '−') solveSub(st); else solveMul(st);
      st.locked = true; render();
    }
    render();
    return P;
  }

  /* ---------------- Les questions ---------------- */
  function poseQuestion(op, a, b, { forme, W, nL = 0, solU }) {
    const expr = `${fmt(val(a))} ${op} ${fmt(val(b))}`;
    const res = op === '+' ? val(a) + val(b) : op === '−' ? val(a) - val(b) : val(a) * val(b);
    const spec = { op, a, b, W, nL, solU };
    const vid = op === '+' ? 'add' : op === '−' ? 'sub' : 'mul';
    const corr = (st) => {
      const s2 = newState({ ...spec, style: st?.style || pref(RET_KEY, 'haut'), method: op === '−' ? st?.method || pref(SUB_KEY, 'cassage') : null });
      s2.solU = solU; if (op === '+') solveAdd(s2); else if (op === '−') solveSub(s2); else solveMul(s2);
      return gridHTML(s2, false);
    };
    const exK = op === '+' ? 'Exemple avec d\'autres nombres : 8,6 + 4,75. On écrit 8,60 au-dessus de 4,75, virgule sous virgule. Centièmes : 0 + 5 = 5. Dixièmes : 6 + 7 = 13 → on écrit 3 et on met une retenue 1 sur la colonne des unités. Unités : 1 + 8 + 4 = 13 → on barre la retenue et on écrit 13. Résultat : 13,35.'
      : op === '×' ? 'Exemple avec d\'autres nombres : 4,7 × 23. On pose 47 × 23, calés à droite. Ligne 1 : 47 × 3 = 141. Ligne 2 : on écrit un 0 à droite, puis 47 × 2 = 94 → 940. On additionne : 141 + 940 = 1 081. 4,7 a 1 chiffre après la virgule et 23 n\'en a pas : 1 chiffre après la virgule → 108,1.'
        : null;
    const near = (x) => Math.abs(x - res) < 1e-9;
    const directVal = (r) => parse(r.querySelector('.pz-dbox .ans')?.value);
    /** remédiation quand l'élève donne seulement le résultat : on cherche l'erreur la plus probable, sans donner la réponse */
    const directRemed = (v) => {
      const cm = commaDiag(v.raw, (c) => near(parse(c).value)); if (cm) return cm;
      if (op !== '×') {
        const K = Math.max(a.k, b.k), mis = (op === '+' ? a.m + b.m : a.m - b.m) / P10(K);
        if (a.k !== b.k && near(mis) === false && Math.abs(v.value - mis) < 1e-9) return 'Tu as calculé comme si les nombres étaient <b>alignés à droite</b>. Il faut aligner les <b>virgules</b> : unités sous unités, dixièmes sous dixièmes… Un nombre entier a sa virgule « cachée » après le chiffre des unités.';
        if (op === '−' && Math.abs(v.value - (val(b) - val(a))) < 1e-9) return 'Dans une soustraction, le plus grand nombre s\'écrit <b>en haut</b>.';
      }
      const d = Math.abs(v.value - res);
      for (let k = -3; k <= 5; k++) if (Math.abs(d - P10(k)) < 1e-9 * Math.max(1, P10(k))) {
        return op === '−' ? 'Un seul chiffre est faux, de 1 : as-tu bien tenu compte du chiffre <b>cassé</b> (ou du <b>+1 en bas</b>) dans la colonne d\'à côté ?'
          : 'Un seul chiffre est faux, de 1 : as-tu oublié une <b>retenue</b> (ou l\'as-tu comptée deux fois) ?';
      }
      const ra = Math.round(val(a)) || Math.round(val(a) * 10) / 10, rb = Math.round(val(b)) || Math.round(val(b) * 10) / 10;
      const og = op === '+' ? ra + rb : op === '−' ? ra - rb : ra * rb;
      const close = og > 0 && v.value > og * 0.6 && v.value < og * 1.6;
      return (close ? 'Ton résultat a le bon <b>ordre de grandeur</b> : l\'erreur est dans un chiffre. Refais ton opération colonne par colonne, en partant de la droite.'
        : `Vérifie avec un <b>ordre de grandeur</b> : ${fmt(ra)} ${op} ${fmt(rb)} = ${fmt(Math.round(og * 100) / 100)}. Ton résultat doit être proche de ça.`)
        + ' Tu peux aussi poser l\'opération ici, dans la grille (bouton au-dessus).';
    };
    let o;
    const subEx = () => (o?._mount?.st?.method === 'compensation'
      ? 'Exemple avec d\'autres nombres : 6,4 − 2,75. On écrit 6,40 au-dessus de 2,75. Centièmes : 0 − 5 impossible → petit 1 devant le 0 (10) et +1 sous le 7 (7 + 1 = 8) : 10 − 5 = 5. Dixièmes : 4 − 8 impossible → petit 1 devant le 4 (14) et +1 sous le 2 (3) : 14 − 8 = 6. Unités : 6 − 3 = 3. Résultat : 3,65.'
      : 'Exemple avec d\'autres nombres : 6,4 − 2,75. On écrit 6,40 au-dessus de 2,75. Centièmes : 0 − 5 impossible → je barre le 4 et j\'écris 3 au-dessus, puis un petit 1 devant le 0 (10) : 10 − 5 = 5. Dixièmes : 3 − 7 impossible → je barre le 6, j\'écris 5, et un petit 1 devant le 3 (13) : 13 − 7 = 6. Unités : 5 − 2 = 3. Résultat : 3,65.');
    o = {
      _forme: forme,
      _good: `${expr} = ${fmt(res)}`,
      q: `<p class="statement">Pose et calcule : <b>${expr}</b></p><div class="pz-dir"><button type="button" class="mini pz-dtog"></button><p class="pz-dbox" hidden><span class="small muted">Pose l'opération sur ton cahier, puis écris le résultat :</span><br>${expr} = ${inp('num', 'Résultat')}</p></div><div class="pz-host"></div>`,
      hints: [
        op === '×' ? `Relis « Les calculs posés » dans ${ficheLink('operations')}. Dans une multiplication, est-ce qu'on aligne les virgules ? Quand s'occupe-t-on des virgules ?`
          : `Relis « Les calculs posés » dans ${ficheLink('operations')}. Qu'est-ce qu'on aligne quand on pose une ${op === '+' ? 'addition' : 'soustraction'} ? Par quelle colonne commence-t-on le calcul ?`,
        op === '−' ? { get html() { return subEx(); } } : exK,
        op === '×' ? `Outil : compte les chiffres après la virgule dans les deux facteurs et additionne. Revois la méthode en vidéo : ${videoBox(vid)}`
          : { html: `Outil : le tableau de numération est affiché au-dessus de la grille (u = unités). La virgule se place juste après la colonne des unités. ${videoBox(vid)}`, act: (r) => { const p = r._pz; if (!p) return; const A = parseRow(p.st, 'A'); p.st.heads = true; p.st.headsU = A && !A.commaBad ? A.u : Math.max(a.k, b.k); p.render(); } },
      ],
      mount(r) {
        const host = r.querySelector('.pz-host'); if (!host) return;
        r._pz = createPose(host, spec); o._mount = r._pz;
        const tog = r.querySelector('.pz-dtog'), box = r.querySelector('.pz-dbox');
        const setDir = (on, save) => {
          r._pz.direct = on; box.hidden = !on; host.hidden = on;
          tog.textContent = on ? '▦ Je préfère poser l\'opération ici, dans la grille' : '✍️ J\'ai posé sur mon cahier : je donne juste le résultat';
          if (save) setPref(DIR_KEY, on ? '1' : '0');
          if (on && save) box.querySelector('.ans')?.focus({ preventScroll: true });
        };
        tog.addEventListener('click', () => { if (!r._pz.st.locked && !box.querySelector('.ans').disabled) setDir(!r._pz.direct, true); });
        setDir(pref(DIR_KEY, '0') === '1', false);
      },
      remediate(r) {
        const p = r._pz; if (!p || p.st.locked) return null;
        if (p.direct) { const v = directVal(r); return v && !near(v.value) ? directRemed(v) : null; }
        if (op === '−' && !p.st.method) return null;
        const ev = evaluate(p.st); if (ev.incomplete || ev.ok) return null;
        p.st.hl = new Set((ev.cols || []).filter((c) => c >= 0)); p.render();
        return ev.msg;
      },
      check(r) {
        const p = r._pz; if (!p) return null;
        if (p.direct) {
          const v = directVal(r); if (!v) return null;
          const ok = near(v.value); markInput(r, 0, ok);
          p.st.locked = true; r.querySelector('.pz-dtog').disabled = true;
          return { ok, msg: ok ? `${expr} = <b>${fmt(res)}</b>.` : `${expr} = <b>${fmt(res)}</b>. Voici l'opération posée :${corr(p.st)}` };
        }
        const st = p.st;
        if (op === '−' && !st.method) return { retry: true, msg: 'Choisis d\'abord <b>ta façon</b> de faire la soustraction (touche une des deux images).' };
        const ev = evaluate(st); if (ev.incomplete) return null;
        const un = usedUncrossed(st);
        if (un.length && !st.reminded) {
          st.reminded = true; st.blink = `${un[0].c}:${un[0].i}`; p.render();
          return { retry: true, msg: '✏️ Avant de vérifier : as-tu <b>barré les retenues</b> que tu as comptées ? Touche une retenue, puis « Barrer la retenue ». (Clique ensuite à nouveau sur « Vérifier ».)' };
        }
        st.marks = ev.marks || {}; st.hl = new Set(ev.ok ? [] : (ev.cols || [])); p.lock();
        const left = un.length && ev.ok ? '<p class="small">✏️ Pense à barrer chaque retenue dès que tu l\'as comptée : tu ne risques pas de la compter deux fois.</p>' : '';
        return { ok: !!ev.ok, msg: ev.ok ? `${expr} = <b>${fmt(res)}</b>.${left}` : `${ev.msg}<br>${expr} = <b>${fmt(res)}</b>. Voici l'opération posée :${corr(st)}` };
      },
      reveal(r, withGrid = false) {
        const p = r && r._pz;
        if (p) p.reveal();
        return { ok: true, msg: `${expr} = <b>${fmt(res)}</b>.${withGrid || !p ? corr(p ? p.st : null) : ''}` };
      },
    };
    return o;
  }

  /** nombre décimal au hasard : n chiffres avant la virgule, k après (dernier chiffre non nul) */
  function rnd(n, k) {
    for (;;) {
      const m = rand(P10(n - 1) * P10(k), P10(n) * P10(k) - 1);
      if (k === 0 || m % 10) return dv(m, k);
    }
  }
  const intLen = (x) => String(Math.floor(val(x))).length;
  const carriesAdd = (a, b) => { const K = Math.max(a.k, b.k); let A = a.m * P10(K - a.k), B = b.m * P10(K - b.k), c = 0, n = 0; while (A || B) { c = (A % 10 + B % 10 + c) >= 10 ? 1 : 0; n += c; A = Math.floor(A / 10); B = Math.floor(B / 10); } return n; };
  const borrowsSub = (a, b) => { const K = Math.max(a.k, b.k); let A = a.m * P10(K - a.k), B = b.m * P10(K - b.k), c = 0, n = 0, z = 0; while (A) { const d = A % 10 - B % 10 - c; c = d < 0 ? 1 : 0; n += c; if (A % 10 === 0 && A >= 10 && c) z++; A = Math.floor(A / 10); B = Math.floor(B / 10); } return { n, z }; };
  const widthAS = (a, b) => Math.max(intLen(a), intLen(b)) + Math.max(a.k, b.k) + 2;

  function genPoseA(hard = false) {
    const forme = pick(['entier', 'dec', 'dec']);
    let a, b;
    for (let t = 0; t < 500; t++) {
      if (forme === 'entier') { const e = rnd(hard ? 3 : rand(2, 3), 0), d = rnd(hard ? rand(2, 3) : rand(1, 2), rand(1, 2)); [a, b] = Math.random() < 0.5 ? [e, d] : [d, e]; }
      else { const k1 = rand(1, 2), k2 = k1 === 1 ? 2 : pick([1, 3].slice(0, hard ? 2 : 1)); a = rnd(hard ? rand(2, 3) : rand(1, 2), k1); b = rnd(hard ? rand(2, 3) : rand(1, 2), k2); }
      if (carriesAdd(a, b) >= (hard ? 3 : 2)) break;
    }
    return poseQuestion('+', a, b, { forme, W: widthAS(a, b) });
  }
  function genPoseS(hard = false) {
    const forme = hard ? pick(['entier-haut', 'zero', 'dec']) : pick(['entier-haut', 'entier-bas', 'dec']);
    let a, b;
    for (let t = 0; t < 800; t++) {
      if (forme === 'entier-haut') { a = rnd(hard ? 3 : 2, 0); b = rnd(hard ? 2 : rand(1, 2), rand(1, 2)); }
      else if (forme === 'entier-bas') { a = rnd(2, rand(1, 2)); b = rnd(rand(1, 2), 0); }
      else if (forme === 'zero') { a = dv(rand(2, 9) * 1000 + rand(1, 9) * 10 + rand(1, 9), 1); b = rnd(rand(2, 3), 2); } // un 0 au milieu du nombre du haut
      else { a = rnd(hard ? 3 : 2, 1); b = rnd(hard ? 2 : rand(1, 2), 2); }
      if (val(a) - val(b) < 1.5) continue;
      const { n, z } = borrowsSub(a, b);
      if (forme === 'entier-bas' ? n >= 1 : n >= (hard ? 3 : 2)) { if (forme !== 'zero' || z >= 1) break; }
    }
    return poseQuestion('−', a, b, { forme, W: widthAS(a, b) });
  }
  function genPoseM(hard = false) {
    const forme = hard ? pick(['dec×dec', 'dec×2']) : pick(['dec×1', 'dec×2', 'dec×dec', 'entier×dec']);
    let a, b;
    const noZero = (x) => !String(x.m).includes('0');
    for (let t = 0; t < 500; t++) {
      if (forme === 'dec×1') { a = rnd(rand(1, 2), rand(1, 2)); b = dv(rand(3, 9), 0); }
      else if (forme === 'dec×2') { a = hard ? rnd(rand(1, 2), 2) : rnd(1, rand(1, 2)); b = dv(rand(12, 49), 0); }
      else if (forme === 'entier×dec') { a = rnd(2, 0); b = rnd(1, 1); }
      else { a = hard ? rnd(2, 1) : rnd(1, 1); b = rnd(1, 1); }
      if (!noZero(b) || String(a.m).length < String(b.m).length) continue;
      if (a.m % 10 === 0) continue;
      const P = a.m * b.m;
      if (hard && forme === 'dec×dec' && !(P % 10 === 0) && Math.random() < 0.6) continue; // ★ : souvent un produit qui finit par 0
      break;
    }
    const nL = String(b.m).length > 1 ? String(b.m).length : 0;
    const W = String(a.m * b.m).length + 1;
    return poseQuestion('×', a, b, { forme, W, nL });
  }

  Object.assign(GENS, {
    'o-pa': { ch: 'operations', f: genPoseA, label: 'Poser et calculer une addition', hard: true, t: 3 },
    'o-ps': { ch: 'operations', f: genPoseS, label: 'Poser et calculer une soustraction', hard: true, t: 3 },
    'o-pm': { ch: 'operations', f: genPoseM, label: 'Poser et calculer une multiplication', hard: true, t: 4 },
  });

  /* ---------------- Fiche ---------------- */
  function renderFiche() {
    const box = (id) => document.querySelector(`[data-fig="${id}"]`);
    const ret = box('pz-retenues');
    if (ret) {
      const draw = () => {
        const cur = pref(RET_KEY, 'haut');
        ret.innerHTML = `<div class="pz-fchoice">${['haut', 'droite'].map((s) => `<button type="button" class="pz-sbtn big${cur === s ? ' on' : ''}" data-style="${s}">${gridHTML(carryDemo(s), false)}<span>${s === 'haut' ? 'En haut' : 'À droite, sur le côté'}${cur === s ? ' ✔ c\'est ma façon' : ''}</span></button>`).join('')}</div>`;
      };
      draw();
      ret.addEventListener('click', (e) => { const b = e.target.closest('[data-style]'); if (b) { setPref(RET_KEY, b.dataset.style); draw(); } });
    }
    const ent = box('pz-entier');
    if (ent) {
      const st = demoState('+', dv(25, 0), dv(747, 2), { W: 5 }); solveAdd(st); st.carries.forEach((l) => l.forEach((k) => { k.x = true; }));
      ent.innerHTML = gridHTML(st, false);
    }
    const sub = box('pz-sous');
    if (sub) {
      const STEPS = {
        cassage: { a: dv(682, 0), b: dv(337, 0), W: 3, t: ['2 − 7, c\'est impossible !', 'Je <b>casse une dizaine</b> : je barre le 8 et j\'écris 7 au-dessus. La dizaine cassée va dans les unités : j\'écris un <b>petit 1</b> devant le 2 → 12. Et 12 − 7 = 5.', 'Puis les dizaines : 7 − 3 = 4. Enfin les centaines : 6 − 3 = 3. Résultat : <b>345</b>.'] },
        compensation: { a: dv(82, 0), b: dv(25, 0), W: 2, t: ['2 − 5, c\'est impossible !', 'J\'ajoute une dizaine <b>en haut</b> : un petit 1 devant le 2 → 12. Et j\'ajoute une dizaine <b>en bas</b> : +1 sous le 2 de 25. L\'écart entre les deux nombres ne change pas. 12 − 5 = 7.', 'Puis les dizaines : 8 − (2 + 1) = 8 − 3 = 5. Résultat : <b>57</b>.'] },
      };
      const draw = () => {
        const cur = pref(SUB_KEY, '');
        let h = `<p class="pz-ask"><b>Quand le chiffre du haut est trop petit</b>, il y a deux façons de faire. Les deux sont justes : touche celle que tu utilises.</p><div class="pz-meth">${['cassage', 'compensation'].map((m) => `<button type="button" class="pz-mcard${cur === m ? ' on' : ''}" data-meth="${m}">${gridHTML(subDemo(m), false)}<span>${METH[m].icon} ${METH[m].short}</span></button>`).join('')}</div>`;
        if (cur) {
          const S = STEPS[cur];
          h += `<div class="pz-steps">${S.t.map((txt, i) => `<div class="pz-step"><span class="badge">${i + 1}</span>${gridHTML(subDemo(cur, i + 1, S.a, S.b, S.W), false)}<p>${txt}</p></div>`).join('')}</div>`;
          h += '<p class="small muted">Avec des nombres décimaux, c\'est pareil : on aligne les virgules, on complète avec des zéros, puis on fait la même chose dans chaque colonne.</p>';
        }
        sub.innerHTML = h;
      };
      draw();
      sub.addEventListener('click', (e) => { const b = e.target.closest('[data-meth]'); if (b) { setPref(SUB_KEY, b.dataset.meth); draw(); } });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderFiche); else renderFiche();

  // pour les tests
  window.PZ = { createPose, evaluate, newState, solveAdd, solveSub, solveMul, parseRow, gridHTML, usedUncrossed, genPoseA, genPoseS, genPoseM };
}());
