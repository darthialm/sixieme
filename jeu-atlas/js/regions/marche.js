/* =========================================================
   Région 2 — LE MARCHÉ AUX CRISTAUX · chapitre « Nombres entiers et décimaux (1) »
   Attendus : grands nombres entiers (écrire, lire, décomposer) ; décimaux jusqu'aux millièmes ;
   valeur de chaque chiffre ; fractions décimales ; passer d'une écriture à une autre.
   Cristaux : lingot = 10, gros = 1, moyen = 0,1, petit = 0,01, poussière = 0,001.
   Énigmes :
     payer    le prix est écrit en mots, en fraction décimale ou en décomposition ; on pose les cristaux
              sur le comptoir (+/−), on peut échanger 10 contre 1 ; la balance n'accepte que le montant exact.
     coffre   ranger des cartes pour écrire le plus grand puis le plus petit nombre ; puis lire un grand
              nombre écrit en lettres et le composer chiffre par chiffre (tranches de 3 chiffres, zéros).
     mystere  Rosa cache un nombre ; questions « plus grand que… ? » en nombre limité : il faut couper
              l'intervalle (entier, un décimal, deux décimales).
   Gardien : la Grande Vente (payer 3 achats avec une bourse limitée en échangeant, puis un coffre de 5 cartes).
   ========================================================= */
(function () {
  'use strict';
  const { h, svg: S } = Atlas;

  // ctx.fail, puis on fait défiler jusqu'à la bulle de Pi (l'explication doit rester visible)
  const failv = (ctx, html) => {
    const hl = ctx.fail(html);
    setTimeout(() => { const b = document.querySelector('.pi-bubble'); if (b && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60);
    return hl;
  };

  /* ---------- Les cristaux ---------- */
  const COLS = [
    { nom: 'lingot', pl: 'lingots', v: 10000, lab: '10', col: '#f5c518', dark: '#9c6d00' },
    { nom: 'gros', pl: 'gros', v: 1000, lab: '1', col: '#4dabf7', dark: '#1864ab' },
    { nom: 'moyen', pl: 'moyens', v: 100, lab: '0,1', col: '#51cf66', dark: '#2b8a3e' },
    { nom: 'petit', pl: 'petits', v: 10, lab: '0,01', col: '#ff922b', dark: '#c2410c' },
    { nom: 'poussière', pl: 'poussières', v: 1, lab: '0,001', col: '#b197fc', dark: '#6741d9' },
  ];
  const SCALE = [1, 1, 0.78, 0.58, 0.4];
  const gemInner = (i) => {
    const c = COLS[i];
    if (i === 0) return `<rect x="4" y="12" width="32" height="18" rx="4" fill="${c.col}" stroke="${c.dark}" stroke-width="2.5"/><rect x="8" y="15" width="24" height="4" rx="2" fill="#fff" opacity=".55"/>`;
    const k = SCALE[i];
    return `<g transform="translate(20 20) scale(${k}) translate(-20 -20)"><polygon points="20,2 36,14 20,38 4,14" fill="${c.col}" stroke="${c.dark}" stroke-width="${2.6 / k}" stroke-linejoin="round"/><polygon points="20,2 28,14 20,38 12,14" fill="#fff" opacity=".28"/><line x1="4" y1="14" x2="36" y2="14" stroke="${c.dark}" stroke-width="${1.6 / k}" opacity=".6"/></g>`;
  };
  const gem = (i, size = 28) => `<svg viewBox="0 0 40 40" width="${size}" height="${size}" style="display:inline-block;vertical-align:middle;width:${size}px;height:${size}px;max-height:none;flex:none">${gemInner(i)}</svg>`;
  const gemG = (i, x, y, size) => `<g transform="translate(${x} ${y}) scale(${size / 40})">${gemInner(i)}</g>`;
  const lib = (i, n) => `${n} ${n > 1 ? COLS[i].pl : COLS[i].nom}`;
  const digitsOf = (m) => [Math.floor(m / 10000), Math.floor(m / 1000) % 10, Math.floor(m / 100) % 10, Math.floor(m / 10) % 10, m % 10];
  const fmtM = (m) => Atlas.fmt(m / 1000, 3);
  const NB = (s) => s.replace(/ /g, ' ');
  const intFmt = (s) => NB(String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
  const frac = (n, d) => `<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 4px;line-height:1.15"><span style="border-bottom:3px solid currentColor;padding:0 5px">${n}</span><span>${d}</span></span>`;
  const parseMilli = (str) => Math.round(parseFloat(str) * 1000);

  /* ---------- Les nombres en lettres (français) ---------- */
  const UW = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const TW = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
  function below100(n, s) {
    if (n < 20) return UW[n];
    const t = Math.floor(n / 10), u = n % 10;
    if (t <= 6) return u === 0 ? TW[t] : u === 1 ? TW[t] + ' et un' : TW[t] + '-' + UW[u];
    if (t === 7) return u === 1 ? 'soixante et onze' : 'soixante-' + UW[10 + u];
    if (t === 8) return u === 0 ? (s ? 'quatre-vingts' : 'quatre-vingt') : 'quatre-vingt-' + UW[u];
    return 'quatre-vingt-' + UW[10 + u];
  }
  function below1000(n, s) {
    const c = Math.floor(n / 100), r = n % 100;
    let out = '';
    if (c) { out = c === 1 ? 'cent' : UW[c] + ' cent'; if (r === 0 && c > 1 && s) out += 's'; }
    if (r) out += (out ? ' ' : '') + below100(r, s);
    return out;
  }
  const frWords = (n) => (n === 0 ? 'zéro' : below1000(n, true));
  function frClasses(cl) {
    const [a, b, c, d] = cl, parts = [];
    if (a) parts.push(below1000(a, true) + ' milliard' + (a > 1 ? 's' : ''));
    if (b) parts.push(below1000(b, true) + ' million' + (b > 1 ? 's' : ''));
    if (c) parts.push(c === 1 ? 'mille' : below1000(c, false) + ' mille');
    if (d) parts.push(below1000(d, true));
    return parts.join(' ') || 'zéro';
  }
  Atlas.frWords = frWords;

  /* ---------- Tableau de numération dessiné (SVG) ---------- */
  const MK = { ok: ['#d3f9d8', '#2f9e44'], bad: ['#ffe3e3', '#e03131'], zero: ['#fff3bf', '#f59f00'], none: ['#ffffff', '#adb5bd'] };
  function gridSvg({ heads, rows, cw = 54, lw = 64, groups = null, comma = -1, hh = 30, rh = 40, fs = 26, hfs = 14, headColors = null, maxw = 470 }) {
    const n = heads.length, gap = comma >= 0 ? 12 : 0;
    const gh = groups ? 24 : 0;
    const W = lw + n * cw + gap + 6, H = gh + hh + rows.length * rh + 6;
    const xOf = (i) => lw + i * cw + (comma >= 0 && i > comma ? gap : 0);
    let s = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${Math.min(Math.round(W * 1.35), maxw)}px;height:auto;max-height:none;display:block;margin:6px auto" font-family="inherit">`;
    if (groups) {
      let i0 = 0;
      groups.forEach((g) => {
        const x = xOf(i0), w = g.n * cw;
        s += `<rect x="${x + 2}" y="1" width="${w - 4}" height="${gh - 4}" rx="6" fill="#ffe8cc" stroke="#e8590c" stroke-width="1.5"/><text x="${x + w / 2}" y="${gh - 8}" text-anchor="middle" font-size="${hfs}" font-weight="800" fill="#7c2d12">${g.name}</text>`;
        i0 += g.n;
      });
    }
    heads.forEach((t, i) => {
      s += `<text x="${xOf(i) + cw / 2}" y="${gh + hh - 9}" text-anchor="middle" font-size="${hfs}" font-weight="800" fill="${headColors ? headColors[i] : '#495057'}">${t}</text>`;
    });
    rows.forEach((row, j) => {
      const y = gh + hh + j * rh;
      if (row.label) s += `<text x="${lw - 8}" y="${y + rh / 2 + 6}" text-anchor="end" font-size="16" font-weight="800" fill="#2b1d0e">${row.label}</text>`;
      row.cells.forEach((t, i) => {
        const mk = MK[(row.mark && row.mark[i]) || 'none'];
        s += `<rect x="${xOf(i) + 2}" y="${y + 1}" width="${cw - 4}" height="${rh - 4}" rx="6" fill="${mk[0]}" stroke="${mk[1]}" stroke-width="2"/>`;
        if (t !== '' && t != null) s += `<text x="${xOf(i) + cw / 2}" y="${y + rh / 2 + fs * 0.36}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#2b1d0e">${t}</text>`;
      });
      if (comma >= 0) s += `<text x="${xOf(comma) + cw + 6}" y="${y + rh - 8}" text-anchor="middle" font-size="${fs}" font-weight="900" fill="#e8590c">,</text>`;
    });
    return s + '</svg>';
  }
  const PV_HEADS = ['10', '1', '0,1', '0,01', '0,001'];
  const PV_COLORS = COLS.map((c) => c.dark);
  const CLASSES = [{ name: 'milliards', n: 3 }, { name: 'millions', n: 3 }, { name: 'mille', n: 3 }, { name: 'unités', n: 3 }];
  const CL_HEADS = ['c', 'd', 'u', 'c', 'd', 'u', 'c', 'd', 'u', 'c', 'd', 'u'];
  const padCells = (str, n = 12) => Array.from(str.padStart(n, ' ')).map((c) => (c === ' ' ? '' : c));

  /* ---------- Une balance qui penche (après le paiement) ---------- */
  function balance(parent) {
    const svg = S.el('svg', { viewBox: '0 0 300 112' }, parent);
    svg.style.cssText = 'width:170px;max-width:50%;height:auto;max-height:none';
    S.el('line', { x1: 150, y1: 30, x2: 150, y2: 96, stroke: '#7a5230', 'stroke-width': 6, 'stroke-linecap': 'round' }, svg);
    S.el('rect', { x: 108, y: 96, width: 84, height: 11, rx: 4, fill: '#7a5230' }, svg);
    const tr = 'transition:transform .8s ease';
    const beam = S.el('g', { style: tr + ';transform-origin:150px 30px' }, svg);
    S.el('line', { x1: 50, y1: 30, x2: 250, y2: 30, stroke: '#9a6a3e', 'stroke-width': 7, 'stroke-linecap': 'round' }, beam);
    const pan = (x, label) => {
      const g = S.el('g', { style: tr }, svg);
      S.el('line', { x1: x, y1: 30, x2: x - 28, y2: 74, stroke: '#6b4f2a', 'stroke-width': 2 }, g);
      S.el('line', { x1: x, y1: 30, x2: x + 28, y2: 74, stroke: '#6b4f2a', 'stroke-width': 2 }, g);
      S.el('path', { d: `M${x - 34},74 Q${x},96 ${x + 34},74 Z`, fill: '#c9a66b', stroke: '#6b4f2a', 'stroke-width': 2.5 }, g);
      S.el('text', { x, y: 70, 'text-anchor': 'middle', 'font-size': 22, text: label }, g);
      return g;
    };
    const L = pan(50, '🏷️'), R = pan(250, '💎');
    return {
      tilt(s) { // +1 : les cristaux sont trop lourds ; -1 : pas assez ; 0 : juste
        beam.style.transform = `rotate(${s * 10}deg)`;
        R.style.transform = `translateY(${s * 17}px)`;
        L.style.transform = `translateY(${-s * 17}px)`;
      },
    };
  }

  /* ---------- Le comptoir : cristaux à poser (+/−), échanges 10 contre 1 ---------- */
  function payBoard(host, { reserve = null, onPay, label = '⚖️ Payer' }) {
    const res = reserve ? reserve.slice() : null;
    const cnt = [0, 0, 0, 0, 0];
    const root = h('div', { style: 'width:100%;display:flex;flex-direction:column;align-items:center;gap:8px' });
    host.append(root);
    const bal = balance(root);
    const row = h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;width:100%' });
    root.append(row);
    const cap = (i) => (res ? res[i] : i === 0 ? 9 : 19);
    const BIG = 'min-width:50px;min-height:48px;font-size:26px;padding:0 6px';
    const SM = 'font-size:14px;padding:6px 8px;min-height:40px';
    const els = COLS.map((c, i) => {
      const num = h('div', { style: 'font:800 30px/1 inherit;min-width:2ch;text-align:center' }, '0');
      const stack = h('div', { style: 'display:flex;flex-wrap:wrap;gap:1px;min-height:30px;justify-content:center;max-width:118px' });
      const resBox = res ? h('div', { style: 'background:#f1e7d0;border-radius:8px;padding:3px 5px;min-height:24px;max-width:118px;display:flex;flex-wrap:wrap;gap:1px;justify-content:center;align-items:center;font-size:13px;font-weight:700' }) : null;
      const minus = h('button', { class: 'btn', style: BIG, onclick: () => { if (cnt[i] > 0) { cnt[i]--; changed(); } } }, '−');
      const plus = h('button', { class: 'btn', style: BIG, onclick: () => { if (cnt[i] < cap(i)) { cnt[i]++; changed(); } } }, '+');
      const grp = i > 0 ? h('button', {
        class: 'btn', style: SM, html: `10 ${gem(i, 16)} → ${gem(i - 1, 20)}`, title: `Échanger 10 ${COLS[i].pl} contre 1 ${COLS[i - 1].nom}`,
        onclick: () => {
          if (res) { res[i] -= 10; res[i - 1]++; } else { cnt[i] -= 10; cnt[i - 1]++; }
          changed();
        },
      }) : null;
      const brk = res && i < 4 ? h('button', {
        class: 'btn', style: SM, html: `${gem(i, 20)} → 10 ${gem(i + 1, 16)}`, title: `Échanger 1 ${COLS[i].nom} contre 10 ${COLS[i + 1].pl}`,
        onclick: () => { res[i]--; res[i + 1] += 10; changed(); },
      }) : null;
      const card = h('div', { style: `background:#fff;border:3px solid ${c.col};border-radius:14px;padding:6px 4px;width:126px;display:flex;flex-direction:column;align-items:center;gap:5px` },
        h('div', { style: 'display:flex;align-items:center;gap:4px;font-weight:800;color:' + c.dark, html: `${gem(i, 30)} ${c.nom}` }),
        h('div', { style: 'font-size:14px;font-weight:700;color:#7a5230' }, `vaut ${c.lab}`),
        resBox,
        num,
        h('div', { style: 'display:flex;gap:6px' }, minus, plus),
        stack, brk, grp);
      row.append(card);
      return { num, stack, resBox, minus, plus, grp, brk, card };
    });
    function changed() {
      for (let i = 0; i < 5; i++) {
        if (res && cnt[i] > res[i]) cnt[i] = res[i];
        const e = els[i];
        e.num.textContent = String(cnt[i]);
        e.stack.innerHTML = gem(i, 22).repeat(cnt[i]);
        e.plus.disabled = cnt[i] >= cap(i);
        e.minus.disabled = cnt[i] <= 0;
        if (e.resBox) e.resBox.innerHTML = `<span>bourse :</span> <b>${res[i] - cnt[i]}</b> ` + gem(i, 14).repeat(Math.min(res[i] - cnt[i], 24));
        if (e.grp) e.grp.disabled = res ? res[i] - cnt[i] < 10 : cnt[i] < 10 || cnt[i - 1] >= cap(i - 1);
        if (e.brk) e.brk.disabled = res[i] - cnt[i] < 1;
        e.grp && (e.grp.style.display = res || cnt[i] >= 10 ? '' : 'none');
      }
      bal.tilt(0);
    }
    const go = h('button', { class: 'btn btn-go', style: 'min-height:56px;font-size:22px;padding:0 26px' }, label);
    root.append(go);
    const api = {
      cnt, res, bal,
      paid: () => cnt.reduce((a, n, i) => a + n * COLS[i].v, 0),
      spend() { cnt.forEach((n, i) => { if (res) res[i] -= n; cnt[i] = 0; }); changed(); },
      clear() { cnt.fill(0); changed(); },
      refresh: changed,
    };
    go.onclick = () => onPay(api);
    changed();
    return api;
  }

  /* ---------- Les prix : tirage et écritures ---------- */
  // zero : true = au moins un zéro avant le dernier chiffre décimal, false = aucun zéro, null = peu importe
  function genPrice(r, { dec, zero, Imin, Imax }) {
    for (let t = 0; t < 500; t++) {
      const I = r.int(Imin, Imax);
      const d = [];
      for (let k = 0; k < dec; k++) d.push(r.int(0, 9));
      if (d[dec - 1] === 0) continue;
      const hasZero = d.slice(0, dec - 1).includes(0);
      if (zero === true && !hasZero) continue;
      if (zero === false && d.includes(0)) continue;
      const milli = I * 1000 + d.reduce((a, x, k) => a + x * [100, 10, 1][k], 0);
      return { I, d, dec, milli };
    }
    return { I: 3, d: [4, 2], dec: 2, milli: 3420 };
  }
  function priceForm(r, P, form) {
    const { I, d, dec } = P;
    const X = parseInt(d.join(''), 10);
    const unitName = dec === 2 ? 'centième' : 'millième';
    const den = dec === 2 ? 100 : 1000;
    const out = { form, P, X, den, unitName, mis: null };
    if (form === 'mots') {
      const letters = r.chance(0.4);
      const num = (n) => (letters ? frWords(n) : String(n));
      out.html = `<b>${num(I)}</b> unité${I > 1 ? 's' : ''} et <b>${num(X)}</b> ${unitName}${X > 1 ? 's' : ''}`;
      out.mis = parseMilli(`${I}.${X}`);
      out.kind = 'mots';
    } else if (form === 'fraction') {
      if (r.chance(0.5)) {
        out.html = frac(Atlas.fmt(I * den + X, 0), den);
        out.kind = 'fracN';
      } else {
        out.html = `<b>${I}</b> + ${frac(X, den)}`;
        out.mis = parseMilli(`${I}.${X}`);
        out.kind = 'mots';
      }
    } else {
      const terms = [`<b>${I}</b>`];
      d.forEach((x, k) => { if (x) terms.push(frac(x, [10, 100, 1000][k])); });
      out.html = terms.join(' + ');
      out.mis = parseMilli(`${I}.${d.filter((x) => x).join('')}`);
      out.kind = 'decomp';
    }
    if (out.mis === P.milli) out.mis = null;
    return out;
  }
  const priceTag = (html) => h('div', {
    style: 'background:#fff8e1;border:3px dashed #c9a66b;border-radius:14px;padding:10px 18px;font-size:26px;text-align:center;line-height:1.5;max-width:100%',
    html: `<div style="font-size:15px;font-weight:800;color:#7a5230">🏷️ Étiquette de Rosa</div>${html}`,
  });

  function payDiag(F, paid) {
    const P = F.P, price = P.milli;
    let head;
    if (F.mis != null && paid === F.mis) {
      if (F.kind === 'decomp') {
        head = `Tu as payé <b>${fmtM(paid)}</b> : tu as seulement collé les chiffres. Mais chaque fraction a sa colonne : 1/10 → moyens, 1/100 → petits, 1/1000 → poussières. Une colonne vide vaut 0 !`;
      } else {
        head = `Tu as lu « ${P.I} et ${F.X} » comme le nombre ${P.I},${F.X}. Mais ${F.X} ${F.unitName}s s'écrit <b>${Atlas.fmt(F.X / F.den, P.dec)}</b> : il faut des zéros pour remplir les colonnes.`;
      }
    } else {
      let shift = 0;
      for (let j = 1; j <= 3 && !shift; j++) {
        if (paid > 0 && paid * 10 ** j === price) shift = -j;
        else if (paid > 0 && paid === price * 10 ** j) shift = j;
      }
      if (shift && F.kind === 'fracN') head = `Compte les zéros du dénominateur : ${F.den} → <b>${P.dec} chiffres</b> après la virgule. Ton paiement est ${10 ** Math.abs(shift)} fois ${shift < 0 ? 'trop petit' : 'trop grand'}.`;
      else if (shift) head = `Ton paiement est ${10 ** Math.abs(shift)} fois ${shift < 0 ? 'trop petit' : 'trop grand'} : tu as décalé d'une colonne. Un cristal vaut 10 fois plus que celui de droite.`;
      else head = paid > price ? 'Tu paies trop : la balance penche de ton côté.' : 'Il n\'y a pas assez de cristaux : la balance penche du côté du prix.';
    }
    const A = digitsOf(price), B = digitsOf(paid);
    const tab = gridSvg({
      heads: PV_HEADS, headColors: PV_COLORS, lw: 66, comma: 1,
      rows: [
        { label: 'Prix', cells: A.map(String), mark: A.map((x, i) => (x === B[i] ? 'ok' : 'bad')) },
        { label: 'Toi', cells: B.map(String), mark: A.map((x, i) => (x === B[i] ? 'ok' : 'bad')) },
      ],
    });
    return head + tab + '<div style="font-size:14px">Les colonnes en rouge sont à corriger.</div>';
  }

  /* ================================================================
     ÉNIGME « payer » : poser les cristaux exacts
     ================================================================ */
  function buildPayer(ctx, host, { onSolved }) {
    const r = ctx.rng;
    const specs = [
      { dec: 2, zero: false, Imin: 1, Imax: 9 },
      { dec: 3, zero: true, Imin: 2, Imax: 19 },
      { dec: 3, zero: true, Imin: 10, Imax: 39 },
    ];
    const forms = r.shuffle(['mots', 'fraction', 'decomp']);
    let k = 0;
    const round = () => {
      if (k >= 3) return onSolved();
      host.innerHTML = '';
      const F = priceForm(r, genPrice(r, specs[k]), forms[k]);
      ctx.consigne.innerHTML = `Achat ${k + 1} / 3 — Pose sur le comptoir les cristaux du <b>prix exact</b>. Si une colonne en a 10, échange-les contre 1 cristal à gauche.`;
      host.append(priceTag(F.html));
      payBoard(host, {
        onPay(api) {
          if (api.paid() === 0) return Atlas.UI.toast('Pose d\'abord des cristaux avec + !', 'bad');
          if (api.cnt.some((n, i) => i > 0 && n >= 10)) return Atlas.UI.toast('Trop de cristaux ! Échange 10 contre 1 (bouton sous la colonne).', 'bad');
          const paid = api.paid();
          api.bal.tilt(Math.sign(paid - F.P.milli));
          if (paid === F.P.milli) {
            Atlas.UI.toast('La balance est en équilibre !', 'good');
            ctx.pi(`Juste : <b>${fmtM(paid)}</b> ! ${k < 2 ? 'Au suivant.' : ''}`, 'good');
            k++;
            setTimeout(round, 1500);
          } else failv(ctx, payDiag(F, paid));
        },
      });
      ctx.pi(k === 0
        ? 'Un gros = 1, un moyen = 0,1, un petit = 0,01, une poussière = 0,001. Une colonne sans cristal : laisse 0, le zéro compte !'
        : 'Lis bien chaque chiffre : où est sa colonne ? Les zéros sont importants.');
    };
    round();
  }

  /* ================================================================
     GARDIEN, étape 1 : la liste de courses, bourse limitée
     ================================================================ */
  function buildVente(ctx, host, { onSolved }) {
    const r = ctx.rng;
    const NAMES = [['🍯', 'du miel'], ['🔔', 'une clochette'], ['🧣', 'une écharpe'], ['🏮', 'une lanterne'], ['🎩', 'un chapeau'], ['🧺', 'un panier'], ['🍎', 'des pommes'], ['🕯️', 'une bougie']];
    let items = null, reserve = null;
    for (let t = 0; t < 300 && !items; t++) {
      const forms = r.shuffle(['mots', 'fraction', 'decomp']);
      const names = r.shuffle(NAMES);
      const its = forms.map((f, i) => ({ F: priceForm(r, genPrice(r, { dec: r.pick([2, 3]), zero: i === 0 ? null : r.chance(0.5) ? true : null, Imin: 1, Imax: 9 }), f), nom: names[i], done: false }));
      const sum = its.reduce((a, it) => a + it.F.P.milli, 0);
      const sd = [0, 0, 0, 0, 0];
      its.forEach((it) => digitsOf(it.F.P.milli).forEach((x, i) => { sd[i] += x; }));
      const carries = sd.filter((x) => x > 9).length;
      if (carries >= 2 && its.some((it) => it.F.P.d.includes(0)) && new Set(its.map((it) => it.F.P.milli)).size === 3) { items = its; reserve = digitsOf(sum); }
    }
    if (!items) { // repli : tirage sans contrainte
      items = ['mots', 'fraction', 'decomp'].map((f, i) => ({ F: priceForm(r, genPrice(r, { dec: 3, zero: null, Imin: 1, Imax: 9 }), f), nom: NAMES[i], done: false }));
      reserve = digitsOf(items.reduce((a, it) => a + it.F.P.milli, 0));
    }
    let cur = 0;
    host.innerHTML = '';
    ctx.consigne.innerHTML = '<b>Étape 1 / 2</b> — Paie les <b>3 achats</b> avec ta bourse. Tu n\'as pas toujours le bon cristal : échange 1 contre 10, ou 10 contre 1.';
    const strip = h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;width:100%' });
    host.append(strip);
    const drawStrip = () => {
      strip.innerHTML = '';
      items.forEach((it, i) => {
        strip.append(h('div', {
          style: `flex:1 1 200px;max-width:260px;border:3px ${i === cur ? 'solid #e8590c' : 'dashed #c9a66b'};border-radius:14px;padding:6px 10px;text-align:center;font-size:21px;line-height:1.45;background:${it.done ? '#d3f9d8' : i === cur ? '#fff8e1' : '#f5efe0'};opacity:${i > cur ? 0.75 : 1}`,
          html: `<div style="font-weight:800;font-size:16px">${it.nom[0]} ${it.nom[1]} ${it.done ? '✔' : ''}</div>${it.done ? `<b>${fmtM(it.F.P.milli)}</b>` : it.F.html}`,
        }));
      });
    };
    drawStrip();
    payBoard(host, {
      reserve,
      label: '⚖️ Payer cet achat',
      onPay(api) {
        const it = items[cur], paid = api.paid();
        if (paid === 0) return Atlas.UI.toast('Pose des cristaux pour payer ' + it.nom[1] + '.', 'bad');
        api.bal.tilt(Math.sign(paid - it.F.P.milli));
        if (paid === it.F.P.milli) {
          it.done = true;
          api.spend();
          api.bal.tilt(0);
          cur++;
          drawStrip();
          Atlas.UI.toast('Payé !', 'good');
          if (cur >= items.length) setTimeout(onSolved, 900);
          else ctx.pi('Il te reste <b>' + (items.length - cur) + '</b> achat(s). Regarde ce qu\'il te reste dans la bourse.', 'good');
        } else failv(ctx, payDiag(it.F, paid));
      },
    });
    ctx.pi('Pas assez de moyens ? Casse un gros : 1 gros → 10 moyens. Trop de petits ? 10 petits → 1 moyen.');
  }

  /* ---------- Sélecteur de chiffres (▲ chiffre ▼) ---------- */
  function digitPicker(host, { n, comma = -1, groups = null, onChange }) {
    const vals = Array(n).fill(0);
    const root = h('div', { style: 'display:flex;gap:5px;justify-content:center;align-items:flex-end;flex-wrap:wrap' });
    host.append(root);
    const disp = [];
    const draw = () => disp.forEach((d, i) => { d.textContent = String(vals[i]); });
    const bump = (i, s) => { vals[i] = (vals[i] + s + 10) % 10; draw(); if (onChange) onChange(); };
    const mk = (i) => {
      const bs = 'min-width:44px;padding:0;background:#fff';
      const up = h('button', { class: 'btn', style: bs + ';min-height:38px;font-size:18px', onclick: () => bump(i, 1) }, '▲');
      const d = h('button', { class: 'btn', style: bs + ';min-height:54px;font-size:32px', onclick: () => bump(i, 1) }, '0');
      const dn = h('button', { class: 'btn', style: bs + ';min-height:38px;font-size:18px', onclick: () => bump(i, -1) }, '▼');
      disp[i] = d;
      return h('div', { style: 'display:flex;flex-direction:column;gap:3px;align-items:center' }, up, d, dn);
    };
    if (groups) {
      let i0 = 0;
      groups.forEach((g) => {
        const box = h('div', { style: 'border:2px solid #e8590c;border-radius:12px;padding:4px 6px;background:#fff3e6;display:flex;flex-direction:column;align-items:center;gap:2px' },
          h('div', { style: 'font-weight:800;font-size:14px;color:#7c2d12' }, g.name));
        const cells = h('div', { style: 'display:flex;gap:3px' });
        for (let j = 0; j < g.n; j++) cells.append(mk(i0 + j));
        box.append(cells);
        root.append(box);
        i0 += g.n;
      });
    } else {
      for (let i = 0; i < n; i++) {
        root.append(mk(i));
        if (i === comma) root.append(h('div', { style: 'font:900 40px inherit;align-self:center;color:#e8590c;padding:0 2px' }, ','));
      }
    }
    draw();
    return {
      vals,
      str: () => vals.join(''),
      reset() { vals.fill(0); draw(); },
      mark(i, kind) { disp[i].style.background = kind === 'bad' ? '#ffe3e3' : kind === 'ok' ? '#d3f9d8' : '#fff'; },
    };
  }

  /* ================================================================
     ÉNIGME « coffre » : ranger des cartes, puis lire un grand nombre
     ================================================================ */
  function permute(a, fn, cur = [], used = []) {
    if (cur.length === a.length) return fn(cur);
    for (let i = 0; i < a.length; i++) if (!used[i]) { used[i] = true; cur.push(a[i]); permute(a, fn, cur, used); cur.pop(); used[i] = false; }
  }
  function genCards(r, n) {
    const best = (cards, dir) => { let b = null; permute(cards, (p) => { const s = p.join(''); if (b === null || (dir > 0 ? s > b : s < b)) b = s; }); return b; };
    let last = null;
    for (let t = 0; t < 400; t++) {
      const lens = r.shuffle([1, 2, 2, 3, 3, 4, 1]).slice(0, n);
      if (lens.reduce((a, b) => a + b, 0) > 12) continue;
      const cards = lens.map((L) => {
        let s = String(r.int(1, 9));
        for (let j = 1; j < L; j++) s += r.chance(0.35) ? '0' : String(r.int(0, 9));
        return s;
      });
      if (new Set(cards).size < n || !cards.some((c) => c.slice(1).includes('0'))) continue;
      const info = { cards, max: best(cards, 1), min: best(cards, -1) };
      const byLenD = cards.slice().sort((a, b) => b.length - a.length).join('');
      const byValD = cards.slice().sort((a, b) => Number(b) - Number(a)).join('');
      const byLenA = cards.slice().sort((a, b) => a.length - b.length).join('');
      const byValA = cards.slice().sort((a, b) => Number(a) - Number(b)).join('');
      info.byLenD = byLenD; info.byValD = byValD; info.byLenA = byLenA; info.byValA = byValA;
      last = info;
      if (byLenD !== info.max && byValD !== info.max && byLenA !== info.min && byValA !== info.min && info.max !== info.min) return info;
    }
    return last;
  }
  function genClasses(r) {
    for (let t = 0; t < 2000; t++) {
      const a = r.int(1, 99);
      const mk = () => (r.chance(0.3) ? 0 : r.int(1, 999));
      const cl = [a, mk(), mk(), mk()];
      const zeros = cl.slice(1).filter((x) => x === 0).length;
      const nz = cl.filter((x) => x > 0).length;
      const inner = cl.filter((x) => x > 0 && String(x).padStart(3, '0').slice(1).includes('0') && String(x).padStart(3, '0').indexOf('0') >= 0 && (x < 100 || String(x).includes('0'))).length;
      if (zeros >= 1 && nz >= 3 && inner >= 1 && cl.some((x) => x > 0 && x < 100) && cl[1] + cl[2] + cl[3] > 0) return cl;
    }
    return [17, 23, 0, 9];
  }

  function buildCoffre(ctx, host, { tasks, n = 4, onSolved }) {
    const r = ctx.rng;
    let ti = 0;
    const next = () => {
      if (ti >= tasks.length) return onSolved();
      const t = tasks[ti];
      (t === 'lettres' ? lettres : cartes)(t, () => { ti++; setTimeout(next, 900); });
    };

    const cartes = (kind, done) => {
      host.innerHTML = '';
      const want = kind === 'grand';
      const info = genCards(r, n);
      const cards = info.cards;
      const total = cards.join('').length;
      const slots = Array(n).fill(null);
      ctx.consigne.innerHTML = want
        ? `Pose les <b>${n} cartes</b> dans le coffre pour écrire le <b>plus grand nombre</b> possible. Touche une carte pour la poser.`
        : `Pose les <b>${n} cartes</b> dans le coffre pour écrire le <b>plus petit nombre</b> possible. Touche une carte pour la poser.`;
      const vault = h('div', { style: 'width:100%;background:#f5efe0;border:3px solid #9a6a3e;border-radius:14px;padding:4px 8px' });
      const slotRow = h('div', { style: 'display:flex;gap:6px;justify-content:center;flex-wrap:wrap' });
      const tray = h('div', { style: 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;min-height:64px' });
      host.append(h('div', { style: 'font-weight:800;color:#7a5230' }, '🔒 Le coffre'), vault, slotRow, h('div', { style: 'font-weight:800;color:#7a5230' }, '🃏 Les cartes'), tray);
      const cardStyle = 'min-width:70px;min-height:58px;font-size:26px;padding:0 12px;background:#fffdf6;font-variant-numeric:tabular-nums';
      const str = () => slots.map((i) => (i == null ? '' : cards[i])).join('');
      const render = () => {
        const s = str();
        const cells = padCells(s.padEnd(total, ' ').padStart(12, ' '));
        // les chiffres posés restent à leur place finale (alignés à droite sur la longueur totale)
        const cc = Array(12).fill('');
        for (let i = 0; i < s.length; i++) cc[12 - total + i] = s[i];
        vault.innerHTML = gridSvg({ heads: CL_HEADS, rows: [{ label: '', cells: cc }], groups: CLASSES, lw: 0, cw: 30, rh: 42, hh: 18, hfs: 11, fs: 26 });
        slotRow.innerHTML = '';
        slots.forEach((ci, si) => {
          slotRow.append(h('button', {
            class: 'btn', style: cardStyle + (ci == null ? ';background:#e9ecef;color:#868e96;border-style:dashed' : ''),
            onclick: () => { if (ci != null) { slots[si] = null; render(); } },
          }, ci == null ? `${si + 1}` : intFmt(cards[ci])));
        });
        tray.innerHTML = '';
        cards.forEach((c, ci) => {
          if (slots.includes(ci)) return;
          tray.append(h('button', {
            class: 'btn', style: cardStyle,
            onclick: () => { const e = slots.indexOf(null); if (e >= 0) { slots[e] = ci; render(); } },
          }, intFmt(c)));
        });
        void cells;
      };
      const open = h('button', { class: 'btn btn-go', style: 'min-height:54px;font-size:20px' }, '🗝️ Ouvrir le coffre');
      const reset = h('button', { class: 'btn', style: 'min-height:54px;font-size:18px', onclick: () => { slots.fill(null); render(); } }, '↺ Tout reprendre');
      host.append(h('div', { class: 'puz-tools' }, reset, open));
      open.onclick = () => {
        if (slots.includes(null)) return Atlas.UI.toast('Pose les ' + n + ' cartes avant d\'ouvrir.', 'bad');
        const s = str(), good = want ? info.max : info.min;
        if (s === good) {
          vault.style.background = '#d3f9d8';
          Atlas.UI.toast('Clic ! Le coffre s\'ouvre.', 'good');
          ctx.pi(`Oui : <b>${intFmt(good)}</b>. ${want ? 'Pour le plus grand, le plus grand chiffre va tout à gauche.' : 'Pour le plus petit, le plus petit chiffre va tout à gauche.'}`, 'good');
          return done();
        }
        const cmp = (a, b, la, lb) => {
          let p = 0; while (p < a.length && a[p] === b[p]) p++;
          const A = padCells(a), B = padCells(b);
          const off = 12 - a.length;
          const mark = (i) => (i - off < p ? 'ok' : i - off === p ? 'bad' : 'none');
          const m = Array.from({ length: 12 }, (_, i) => (i < off ? 'none' : mark(i)));
          return { p, svg: gridSvg({ heads: CL_HEADS, groups: CLASSES, lw: 56, cw: 26, rh: 38, hh: 16, hfs: 10, fs: 22, rows: [{ label: la, cells: A, mark: m }, { label: lb, cells: B, mark: m }] }) };
        };
        const c = cmp(s, good, 'Toi', want ? 'Mieux' : 'Mieux');
        let head;
        if (s === (want ? info.min : info.max)) head = `Tu as fait le plus <b>${want ? 'petit' : 'grand'}</b> nombre ! Le coffre veut le plus <b>${want ? 'grand' : 'petit'}</b>.`;
        else if (s === (want ? info.byLenD : info.byLenA)) head = `Tu as rangé les cartes de la plus ${want ? 'longue' : 'courte'} à la plus ${want ? 'courte' : 'longue'}. Mais le nombre aura toujours ${total} chiffres : c'est le <b>chiffre de gauche</b> qui décide.`;
        else if (s === (want ? info.byValD : info.byValA)) head = `Tu as rangé les cartes du ${want ? 'plus grand au plus petit' : 'plus petit au plus grand'} nombre. Mais ici on compare <b>chiffre par chiffre</b>, en partant de la gauche.`;
        else head = `Compare chiffre par chiffre, en partant de la gauche : le premier qui change est celui-ci <span style="color:#e03131;font-weight:800">${s[c.p]} contre ${good[c.p]}</span>. Pour le plus ${want ? 'grand' : 'petit'}, il faut ${good[c.p]}.`;
        failv(ctx, head + c.svg);
      };
      render();
      ctx.pi(want ? 'Le plus grand nombre : quel chiffre veux-tu tout à gauche ? Regarde le <b>premier chiffre</b> de chaque carte.' : 'Le plus petit : le premier chiffre le plus petit possible, tout à gauche. Et les zéros ?');
    };

    const lettres = (kind, done) => {
      host.innerHTML = '';
      const cl = genClasses(r);
      const words = frClasses(cl);
      const truth = cl.map((x) => String(x).padStart(3, '0')).join('');
      ctx.consigne.innerHTML = 'Le coffre est fermé par un code <b>écrit en lettres</b>. Compose-le en chiffres : <b>3 chiffres par tranche</b>, avec les zéros.';
      host.append(h('div', { style: 'background:#fff8e1;border:3px dashed #c9a66b;border-radius:14px;padding:10px 16px;font-size:23px;font-weight:800;text-align:center;line-height:1.4;max-width:100%' }, '« ' + words + ' »'));
      const picker = digitPicker(host, { n: 12, groups: CLASSES });
      const open = h('button', { class: 'btn btn-go', style: 'min-height:54px;font-size:20px' }, '🗝️ Ouvrir le coffre');
      host.append(h('div', { class: 'puz-tools' }, open));
      open.onclick = () => {
        const s = picker.str();
        if (s === truth) {
          for (let i = 0; i < 12; i++) picker.mark(i, 'ok');
          Atlas.UI.toast('Clic ! Le coffre s\'ouvre.', 'good');
          ctx.pi(`Oui : <b>${intFmt(String(Number(truth)))}</b>. Chaque tranche a 3 chiffres : on complète avec des zéros.`, 'good');
          return done();
        }
        const naive = cl.filter((x) => x > 0).join('');
        const mark = Array.from({ length: 12 }, (_, i) => (s[i] === truth[i] ? (truth[i] === '0' ? 'zero' : 'ok') : 'bad'));
        const tab = gridSvg({
          heads: CL_HEADS, groups: CLASSES, lw: 70, cw: 26, rh: 38, hh: 16, hfs: 10, fs: 22,
          rows: [{ label: 'Toi', cells: s.split(''), mark: mark.map((m, i) => (s[i] === truth[i] ? 'none' : m)) }, { label: 'Il fallait', cells: truth.split(''), mark }],
        });
        for (let i = 0; i < 12; i++) picker.mark(i, s[i] === truth[i] ? 'none' : 'bad');
        let head;
        if (s.replace(/^0+/, '') === naive) head = `Tu as collé les nombres des tranches sans zéros. Mais <b>chaque tranche fait 3 chiffres</b> : 23 millions s'écrit <b>023</b>, et une tranche absente s'écrit <b>000</b>.`;
        else head = 'Lis le code tranche par tranche : milliards, millions, mille, unités. Les chiffres en rouge ne sont pas bons ; les zéros jaunes sont à garder.';
        failv(ctx, head + tab);
      };
      ctx.pi('Cherche les mots <b>milliards</b>, <b>millions</b>, <b>mille</b> : ils séparent les tranches. Un mot absent = une tranche de 000.');
    };
    next();
  }

  /* ================================================================
     ÉNIGME « mystère » : couper l'intervalle avec des questions limitées
     ================================================================ */
  function buildMystere(ctx, host, { onSolved }) {
    const r = ctx.rng;
    const ROUNDS = [
      { txt: 'un nombre <b>entier</b> entre <b>1</b> et <b>100</b>', base: 1000, step: 1000, M: 100, intD: 3, decD: 0 },
      { txt: 'un nombre avec <b>un chiffre après la virgule</b>, entre <b>0,1</b> et <b>10</b>', base: 100, step: 100, M: 100, intD: 2, decD: 1 },
      { txt: 'un nombre avec <b>deux chiffres après la virgule</b>, entre <b>0,01</b> et <b>1</b>', base: 10, step: 10, M: 100, intD: 1, decD: 2 },
    ];
    let k = 0;
    const round = () => {
      if (k >= ROUNDS.length) return onSolved();
      const R = ROUNDS[k];
      const val = (i) => R.base + i * R.step;
      const show = (m) => Atlas.fmt(m / 1000, R.decD);
      const N = r.int(0, R.M - 1);
      let a = 0, b = R.M - 1, qLeft = Math.ceil(Math.log2(R.M)) + 1;
      const log = [];
      host.innerHTML = '';
      ctx.consigne.innerHTML = `Nombre mystère ${k + 1} / 3 — Rosa pense à ${R.txt}. Pose-lui des questions <b>« plus grand que… ? »</b> : tu en as ${qLeft}. Puis trouve son nombre !`;
      const lineBox = h('div', { style: 'width:100%' });
      const info = h('div', { style: 'font-size:18px;font-weight:700;text-align:center' });
      const dots = h('div', { style: 'font-size:22px;letter-spacing:3px;text-align:center' });
      const logBox = h('div', { style: 'font-size:16px;text-align:center;min-height:40px;line-height:1.5' });
      host.append(lineBox, info, dots);
      const picker = digitPicker(host, { n: R.intD + R.decD, comma: R.decD ? R.intD - 1 : -1 });
      const qmilli = () => {
        const s = picker.str();
        return Math.round(Number(s.slice(0, R.intD) + '.' + (s.slice(R.intD) || '0')) * 1000);
      };
      const bGt = h('button', { class: 'btn', style: 'min-height:54px;font-size:18px' }, '❓ Plus grand que ça ?');
      const bLt = h('button', { class: 'btn', style: 'min-height:54px;font-size:18px' }, '❓ Plus petit que ça ?');
      const bIs = h('button', { class: 'btn btn-go', style: 'min-height:54px;font-size:18px' }, '🎯 C\'est ce nombre !');
      host.append(h('div', { class: 'puz-tools' }, bGt, bLt, bIs), logBox);

      const drawLine = (Q) => {
        const x = (m) => 30 + (540 * (m - val(0))) / (val(R.M - 1) - val(0));
        let s = '<svg viewBox="0 0 600 78" style="width:100%;max-width:640px;height:auto;max-height:none;display:block;margin:0 auto" font-family="inherit">';
        s += '<line x1="30" y1="38" x2="570" y2="38" stroke="#6b4f2a" stroke-width="4" stroke-linecap="round"/>';
        for (let t = 0; t <= 4; t++) {
          const m = val(0) + ((val(R.M - 1) - val(0)) * t) / 4;
          const mm = Math.round(m / R.step) * R.step;
          s += `<line x1="${x(m)}" y1="30" x2="${x(m)}" y2="46" stroke="#6b4f2a" stroke-width="3"/><text x="${x(m)}" y="68" text-anchor="middle" font-size="15" font-weight="700" fill="#495057">${t === 0 || t === 4 ? show(mm) : show(m)}</text>`;
        }
        const x0 = x(val(a)), x1 = x(val(b));
        s += `<rect x="${x0 - 3}" y="26" width="${Math.max(6, x1 - x0 + 6)}" height="24" rx="8" fill="#ffd8a8" stroke="#e8590c" stroke-width="3" opacity=".9"/>`;
        if (Q != null) {
          const qx = Math.max(30, Math.min(570, x(Q)));
          s += `<polygon points="${qx},34 ${qx - 9},12 ${qx + 9},12" fill="#1c7ed6"/><text x="${qx}" y="10" text-anchor="middle" font-size="14" font-weight="800" fill="#1864ab">${show(Q)}</text>`;
        }
        return s + '</svg>';
      };
      const refresh = (Q) => {
        lineBox.innerHTML = drawLine(Q);
        const left = b - a + 1;
        info.innerHTML = left === 1 ? 'Il ne reste <b>qu\'une</b> possibilité : propose-la !' : `Il reste <b>${left}</b> possibilités : de <b>${show(val(a))}</b> à <b>${show(val(b))}</b>.`;
        dots.textContent = '●'.repeat(qLeft) + '○'.repeat(Math.max(0, Math.ceil(Math.log2(R.M)) + 1 - qLeft));
        dots.title = 'questions restantes';
        logBox.innerHTML = log.slice(-4).map((l) => l).join('<br>');
      };

      const compareTbl = (Q, B2, la, lb) => {
        const nd = R.intD + R.decD;
        const pad = (m) => String(Math.round((m / 1000) * 10 ** R.decD)).padStart(nd, '0').split('');
        const QA = pad(Q), BA = pad(B2);
        let p = 0; while (p < nd && QA[p] === BA[p]) p++;
        const mark = QA.map((_, i) => (i < p ? 'ok' : i === p ? 'bad' : 'none'));
        const heads = [];
        const ip = ['unités', 'dizaines', 'centaines'];
        for (let i = 0; i < R.intD; i++) heads.push(ip[R.intD - 1 - i]);
        const dp = ['dixièmes', 'centièmes'];
        for (let i = 0; i < R.decD; i++) heads.push(dp[i]);
        return gridSvg({ heads, comma: R.decD ? R.intD - 1 : -1, lw: 78, cw: 66, hfs: 12, rows: [{ label: la, cells: QA, mark }, { label: lb, cells: BA, mark }] });
      };

      const ask = (type) => {
        if (b === a) return Atlas.UI.toast('Tu connais déjà son nombre : propose-le !', 'bad');
        if (qLeft <= 0) return;
        const Q = qmilli();
        const yes = (i) => (type === 'gt' ? val(i) > Q : val(i) < Q);
        const yesA = yes(a), yesB = yes(b);
        qLeft--;
        if (yesA === yesB) {
          // question inutile : même réponse pour tous les nombres restants
          const bound = type === 'gt' ? (yesA ? val(a) : val(b)) : (yesA ? val(b) : val(a));
          const sentence = `Tu le savais déjà : le nombre est entre <b>${show(val(a))}</b> et <b>${show(val(b))}</b>, donc il est ${yesA ? '' : 'pas '}${type === 'gt' ? 'plus grand' : 'plus petit'} que <b>${show(Q)}</b>.`;
          const tbl = R.decD && Q >= 0 ? '<div style="font-size:15px">Compare ' + show(Q) + ' et ' + show(bound) + ' :</div>' + compareTbl(Q, bound, show(Q), show(bound)) : '';
          log.push(`❌ ${type === 'gt' ? '>' : '<'} ${show(Q)} : question inutile`);
          refresh(Q);
          failv(ctx, sentence + tbl);
          checkEnd();
          return;
        }
        const truth = yes(N);
        if (type === 'gt') { if (truth) a = Math.max(a, firstGreater(Q)); else b = Math.min(b, lastAtMost(Q)); }
        else if (truth) b = Math.min(b, lastBelow(Q)); else a = Math.max(a, firstAtLeast(Q));
        log.push(`${truth ? '✅' : '🚫'} « ${type === 'gt' ? 'plus grand' : 'plus petit'} que ${show(Q)} ? » — ${truth ? 'Oui' : 'Non'}`);
        refresh(Q);
        ctx.pi(`Rosa : « ${truth ? 'Oui !' : 'Non !'} »`);
        checkEnd();
      };
      const idx = (pred, from, dir) => { for (let i = from; i >= 0 && i < R.M; i += dir) if (pred(i)) return i; return dir > 0 ? R.M : -1; };
      const firstGreater = (Q) => idx((i) => val(i) > Q, 0, 1);
      const firstAtLeast = (Q) => idx((i) => val(i) >= Q, 0, 1);
      const lastAtMost = (Q) => idx((i) => val(i) <= Q, R.M - 1, -1);
      const lastBelow = (Q) => idx((i) => val(i) < Q, R.M - 1, -1);
      let ended = false;
      const checkEnd = () => {
        if (ended) return;
        if (qLeft <= 0 && b > a) {
          ended = true;
          setTimeout(() => {
            failv(ctx, 'Plus de questions ! Pour la prochaine fois : coupe <b>en deux</b> les possibilités à chaque question (vise le milieu). Rosa choisit un autre nombre.');
            setTimeout(round, 2400);
          }, 1000);
        }
      };
      bGt.onclick = () => ask('gt');
      bLt.onclick = () => ask('lt');
      bIs.onclick = () => {
        if (ended) return;
        const Q = qmilli();
        if (Q === val(N)) {
          ended = true;
          Atlas.UI.toast('Trouvé !', 'good');
          ctx.pi(`Rosa : « Oui, <b>${show(Q)}</b> ! Tu as coupé les possibilités en deux à chaque fois. »`, 'good');
          k++;
          return setTimeout(round, 1600);
        }
        const inside = Q >= val(a) && Q <= val(b) && (Q - R.base) % R.step === 0;
        const tooBig = Q > val(N);
        failv(ctx, `Ce n'est pas <b>${show(Q)}</b> : le nombre de Rosa est plus ${tooBig ? 'petit' : 'grand'}.` + (inside ? '' : ` Tu savais déjà qu'il était entre <b>${show(val(a))}</b> et <b>${show(val(b))}</b>.`));
      };
      refresh(null);
      ctx.pi(k === 0 ? 'Astuce : pose ta question au <b>milieu</b> de ce qu\'il reste. Chaque réponse élimine la moitié des nombres !'
        : k === 1 ? 'Attention aux décimaux : 3,5 est plus grand que 3,45 (compare les dixièmes d\'abord).' : 'Entre 0 et 1 : 0,5 est plus grand que 0,45. Compare chiffre par chiffre.');
    };
    round();
  }

  /* ---------- La carte du marché ---------- */
  const W = 26, H = 18;
  const map = Atlas.buildMap(W, H, (m) => {
    m.border('T');
    m.rect(2, 2, 21, 15, '#');           // place pavée
    m.rect(22, 8, 25, 9, '=');           // chemin vers le village (est)
    m.rect(17, 12, 19, 14, '~');         // bassin
    m.rect(17, 11, 19, 11, ':'); m.rect(16, 12, 16, 14, ':'); m.rect(20, 12, 20, 14, ':');
    m.sprinkle(',', 6, 4);
    m.sprinkle('*', 12, 9);
    [[3, 3, 'k'], [4, 3, 'b'], [20, 3, 'k'], [20, 4, 'b'], [3, 14, 'b'], [3, 13, 'k'], [10, 2, 'b'], [11, 2, 'k'], [14, 15, 'k'], [10, 15, 'b'], [21, 11, 'k'], [21, 6, 'b']]
      .forEach(([x, y, c]) => m.set(x, y, c));
    m.set(1, 4, 'B'); m.set(1, 5, 'a'); m.set(23, 5, 'A'); m.set(23, 12, 'B');
    m.set(21, 7, 'S'); m.set(2, 10, 'S');
  });

  const lessonExchange = (() => {
    let s = '<svg viewBox="0 0 440 250" style="background:#fffdf6;border-radius:12px">';
    // 10 moyens qui glissent vers 1 gros
    for (let k = 0; k < 10; k++) {
      const x = 18 + k * 24, y = 62;
      s += `<g>${gemG(2, x, y, 22)}<animateTransform attributeName="transform" type="translate" values="0 0;0 0;${340 - x} ${-12};${340 - x} ${-12};0 0" keyTimes="0;0.2;0.6;0.85;1" dur="5s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.55;0.62;0.9;1" dur="5s" repeatCount="indefinite"/></g>`;
    }
    s += `<g opacity="0">${gemG(1, 318, 38, 58)}<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.55;0.65;0.9;1" dur="5s" repeatCount="indefinite"/></g>`;
    s += '<text x="150" y="40" text-anchor="middle" font-size="18" font-weight="800" fill="#2b8a3e">10 moyens</text><text x="348" y="30" text-anchor="middle" font-size="18" font-weight="800" fill="#1864ab">1 gros</text>';
    s += '<text x="220" y="125" text-anchor="middle" font-size="26" font-weight="800" fill="#2b1d0e">10 moyens = 1 gros</text>';
    [[3, 2, '10 petits = 1 moyen'], [4, 3, '10 poussières = 1 petit']].forEach(([a, b, t], j) => {
      const y = 150 + j * 46;
      s += `${gemG(a, 40, y, 32)}<text x="82" y="${y + 24}" font-size="20" font-weight="800" fill="#6b4f2a">→</text>${gemG(b, 108, y, 38)}<text x="160" y="${y + 25}" font-size="22" font-weight="800" fill="#2b1d0e">${t}</text>`;
    });
    return s + '</svg>';
  })();

  const lessonDec = '<div style="width:100%">'
    + gridSvg({ heads: ['unités', 'dixièmes', 'centièmes', 'millièmes'], comma: 0, lw: 78, cw: 78, hfs: 14, rows: [{ label: '3,42', cells: ['3', '4', '2', ''], mark: ['ok', 'ok', 'ok', 'none'] }] })
    + '<div style="text-align:center;font-weight:800;font-size:19px;margin-bottom:6px">3,42 = 3 unités et <span style="color:#e8590c">42 centièmes</span></div>'
    + gridSvg({ heads: ['unités', 'dixièmes', 'centièmes', 'millièmes'], comma: 0, lw: 78, cw: 78, hfs: 14, rows: [{ label: '3,042', cells: ['3', '0', '4', '2'], mark: ['ok', 'zero', 'ok', 'ok'] }] })
    + '<div style="text-align:center;font-weight:800;font-size:19px">3,042 = 3 unités et <span style="color:#e8590c">42 millièmes</span>. Le <span style="background:#fff3bf;padding:0 4px">0</span> compte !</div></div>';

  const lessonBig = '<div style="width:100%">'
    + gridSvg({ heads: CL_HEADS, groups: CLASSES, lw: 0, cw: 30, rh: 42, hh: 18, hfs: 11, fs: 24, rows: [{ label: '', cells: '017023000009'.split(''), mark: '017023000009'.split('').map((c, i) => (c === '0' && i > 0 ? 'zero' : 'ok')) }] })
    + '<div style="text-align:center;font-weight:800;font-size:18px;margin-top:4px">dix-sept milliards <span style="color:#e8590c">vingt-trois millions</span> neuf</div>'
    + '<div style="text-align:center;font-size:17px;margin-top:4px">= 17 023 000 009. Chaque tranche a <b>3 chiffres</b> : 23 millions → <b>023</b>, et « mille » absent → <b>000</b>.</div></div>';

  const lessonCmp = '<div style="width:100%">'
    + gridSvg({ heads: ['unités', 'dixièmes', 'centièmes'], comma: 0, lw: 70, cw: 84, hfs: 14, rows: [{ label: '3,5', cells: ['3', '5', ''], mark: ['ok', 'ok', 'none'] }, { label: '3,45', cells: ['3', '4', '5'], mark: ['ok', 'bad', 'none'] }] })
    + '<div style="text-align:center;font-weight:800;font-size:19px">On compare chiffre par chiffre, depuis la gauche : <span style="color:#e8590c">5 dixièmes &gt; 4 dixièmes</span>, donc 3,5 &gt; 3,45.</div>'
    + '<div style="text-align:center;font-size:16px;margin-top:4px">(Et 3,5 = 3,50 : un zéro à droite de la virgule ne change rien.)</div></div>';

  Atlas.region({
    id: 'marche', num: 2, name: 'Le Marché aux Cristaux', chapter: 'Nombres entiers et décimaux (1)',
    map, spawn: { x: 23, y: 8 },
    theme: { sky: '#ffd9a8', grass: ['#c8d868', '#c1d260', '#cfdf74'], path: '#d9a066', tuft: '#9aae3c', outside: '#a9b85a' },
    signs: {
      '21,7': '<b>Marché aux Cristaux</b><br>1 gros = 10 moyens · 1 moyen = 10 petits · 1 petit = 10 poussières.<br>« Ici, chaque chiffre a sa colonne. »',
      '2,10': '<b>Étal de Rosa</b><br>Prix affichés : en lettres, en fractions, en morceaux… Depuis la tempête, plus personne ne s\'y retrouve !',
    },
    exits: [{ x: 25, y: 8, to: 'village' }, { x: 25, y: 9, to: 'village' }],
    props: [
      { x: 5, y: 5, t: 'crate', solid: true },
      { x: 6, y: 5, t: 'town:107', solid: true },
      { x: 4, y: 6, t: 'town:131', solid: true },
      { x: 17, y: 4, t: 'town:57', solid: true },
      { x: 16, y: 6, t: 'town:131', solid: true },
      { x: 15, y: 4, t: 'crate', solid: true },
      { x: 7, y: 13, t: 'crate', solid: true },
      { x: 9, y: 13, t: 'town:107', solid: true },
      { x: 11, y: 13, t: 'crate', solid: true },
      { x: 13, y: 13, t: 'crate', solid: true },
      { x: 20, y: 10, t: 'crate', solid: true },
      { x: 6, y: 3, t: 'town:131', solid: true },
    ],
    npcs: [
      {
        id: 'rosa', x: 5, y: 6, name: 'Rosa, la marchande', t: 'dungeon:112',
        look: { top: '#e8590c', bottom: '#7a2a1d', hair: '#3b2412', style: 'queue', hat: 'bandana', hatColor: '#f59f00', apron: '#fff3bf' },
        talk: (A) => A.done('payer')
          ? ['Tu vois ? Dix moyens, un gros, et hop ! Je n\'ai plus peur de me tromper de monnaie.', 'Si tu veux ma bourse à cristaux, va voir la Grand-mère Cristalline, au milieu de la place !']
          : ['Bienvenuebienvenue ! Une étiquette en lettres, une autre en fractions, une troisième en bouts de nombres… je n\'y comprends plus rien depuis la tempête !', 'Pose-moi les bons cristaux sur le comptoir, à côté : la balance ne ment jamais.'],
      },
      {
        id: 'oscar', x: 15, y: 5, name: 'Maître Oscar', t: 'dungeon:98',
        look: { top: '#5a3a1c', bottom: '#33281f', hair: '#f1f3f5', style: 'court', beard: '#f1f3f5', hat: 'beret', hatColor: '#8b1e2e', scale: 1.04 },
        talk: (A) => A.done('coffre')
          ? ['Un coffre ouvert, des cartes bien rangées… Les grands nombres ne te font plus peur !', 'Souviens-toi : chaque tranche a trois chiffres. Les zéros ne sont pas du décor.']
          : ['Hmm, hmm. Je garde le trésor de la guilde dans ce coffre. Il ne s\'ouvre que sur le plus grand nombre… ou le plus petit, selon l\'humeur.', 'Les cartes sont à côté du coffre. Regarde bien le chiffre de gauche !'],
      },
      {
        id: 'tilda', x: 8, y: 12, name: 'Tilda', t: 'dungeon:88',
        talk: (A) => A.done('mystere')
          ? ['Tu coupes les possibilités en deux à chaque question ? Je le savais ! C\'est ma technique aussi.', 'Entre 0 et 100, sept questions suffisent, tu sais.']
          : ['Rosa dit qu\'elle a un nombre secret. Moi, je le trouve toujours en sept questions !', 'Le secret : ne devine pas au hasard. Pose ta question pile au milieu.'],
      },
    ],
    objects: [
      { id: 'o-payer', x: 6, y: 6, t: 'town:116', kind: 'enigme', enigme: 'payer' },
      { id: 'o-coffre', x: 14, y: 5, t: 'crate', kind: 'enigme', enigme: 'coffre' },
      { id: 'o-mystere', x: 9, y: 12, t: 'S', kind: 'enigme', enigme: 'mystere' },
      {
        id: 'o-gardien', x: 12, y: 11, t: 'dungeon:100', name: 'Grand-mère Cristalline', kind: 'gardien',
        look: { top: '#9c36b5', bottom: '#7a2a8f', hair: '#dee2e6', style: 'chignon', dress: true, shawl: '#ffd43b', scale: 1.04 },
        notReady: 'Doucement, mon petit. La Grande Vente ne s\'ouvre qu\'aux apprentis qui savent payer, ranger les nombres et deviner. Retourne voir Rosa, Oscar et Tilda.',
        intro: ['Ah, te voilà ! Tu as remis de l\'ordre dans mon marché. Il reste la Grande Vente.', 'Une liste de courses aux étiquettes toutes différentes, une bourse qui n\'a pas toujours le bon cristal, et un coffre à cinq cartes. On échange, on compte, on range. En avant !'],
      },
    ],
    treasure: {
      x: 1, y: 4, needs: 'loupe',
      hint: 'Un buisson cache des cristaux très, très petits… Il faudrait une <b>loupe</b> pour les voir. (On la gagne à la Mine aux Graduations.)',
      text: 'Avec la loupe, on les voit : des poussières de cristal violettes, par milliers ! Il y avait un vrai trésor ici.',
    },
    lesson: [
      {
        text: 'Au marché, on paie avec des <b>cristaux</b>. Rosa le montre : <b>10 moyens s\'échangent contre 1 gros</b>. Et ainsi de suite, de colonne en colonne !',
        svg: lessonExchange,
      },
      {
        text: 'Chaque chiffre a sa <b>colonne</b>. Dans 3,42 : 3 unités et <b>42 centièmes</b>. Pas « 3 et 42 » ! Dans 3,042, le <b>zéro</b> des dixièmes compte.',
        svg: lessonDec,
      },
      {
        text: 'Pour les <b>grands nombres</b> : on lit tranche par tranche, 3 chiffres par tranche. Une tranche vide s\'écrit <b>000</b>.',
        svg: lessonBig,
      },
      {
        text: 'Pour <b>comparer</b> deux nombres : on part de la gauche et on regarde le premier chiffre qui change.',
        svg: lessonCmp,
      },
      {
        text: 'À toi ! Tu n\'as que des <b>moyens</b>. Échange 10 moyens contre 1 gros (le bouton sous la colonne), puis paie <b>1 unité et 3 dixièmes</b>.',
        act: (el, done) => {
          el.style.flexDirection = 'column';
          el.append(h('div', { style: 'font:800 22px inherit;background:#fff8e1;border:3px dashed #c9a66b;border-radius:12px;padding:6px 14px;margin-bottom:6px', html: '<b>1</b> unité et <b>3</b> dixièmes' }));
          let fin = false;
          payBoard(el, {
            reserve: [0, 0, 13, 0, 0],
            onPay(api) {
              if (fin) return;
              const p = api.paid();
              api.bal.tilt(Math.sign(p - 1300));
              if (p === 1300) { fin = true; done(); }
              else Atlas.UI.toast(p === 0 ? 'Pose des cristaux avec +.' : '1 gros + 3 moyens : échange d\'abord 10 moyens contre 1 gros.', 'bad');
            },
          });
        },
      },
    ],
    enigmes: {
      payer: {
        title: 'Payer juste',
        consigne: '',
        build: (ctx) => buildPayer(ctx, ctx.el, { onSolved: () => ctx.win('Trois achats payés au cristal près ! Rosa est ravie : chaque chiffre est dans sa colonne.') }),
      },
      coffre: {
        title: 'Le coffre aux cartes',
        consigne: '',
        build: (ctx) => buildCoffre(ctx, ctx.el, { tasks: ['grand', 'petit', 'lettres'], n: 4, onSolved: () => ctx.win('Le coffre est ouvert ! Le plus grand nombre commence par le plus grand chiffre, et chaque tranche a 3 chiffres.') }),
      },
      mystere: {
        title: 'Le nombre mystère',
        consigne: '',
        build: (ctx) => buildMystere(ctx, ctx.el, { onSolved: () => ctx.win('Trois nombres mystères trouvés ! Couper en deux à chaque question, c\'est la bonne stratégie.') }),
      },
    },
    gardien: {
      title: 'La Grande Vente',
      consigne: '',
      build: (ctx) => {
        buildVente(ctx, ctx.el, {
          onSolved: () => {
            Atlas.UI.toast('Étape 1 réussie !', 'good');
            setTimeout(() => {
              ctx.consigne.innerHTML = '<b>Étape 2 / 2</b> — Le coffre de la caisse : cinq cartes, puis un code en lettres.';
              buildCoffre(ctx, ctx.el, {
                tasks: ['grand', 'lettres'], n: 5,
                onSolved: () => ctx.win('Les achats sont payés, le coffre est ouvert : voici la page de l\'Atlas ! Et prends cette bourse à cristaux : elle te servira partout.'),
              });
            }, 900);
          },
        });
      },
    },
    tool: {
      id: 'bourse', name: 'Bourse à cristaux',
      icon: '<svg viewBox="0 0 30 30"><path d="M9,10 Q4,16 6,23 Q15,29 24,23 Q26,16 21,10 Z" fill="#c9a66b" stroke="#6b4f2a" stroke-width="2" stroke-linejoin="round"/><path d="M10,10 L8,5 L15,8 L22,5 L20,10" fill="#e0b77a" stroke="#6b4f2a" stroke-width="2" stroke-linejoin="round"/><polygon points="15,14 20,18 15,24 10,18" fill="#4dabf7" stroke="#1864ab" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    },
  });
  Atlas._mt = { genPrice, priceForm, genCards, genClasses, frClasses, frWords, digitsOf, payDiag }; // TEST
})();
