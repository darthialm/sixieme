/* =========================================================
   Région 4 — LA MINE AUX GRADUATIONS · chapitre « Nombres entiers et décimaux (2) »
   Attendus : comparer, ranger, placer et lire sur une droite graduée ; encadrer (unité, dixième, centième) ;
   intercaler un décimal entre deux autres.
   Énigmes :
     wagon      arrêter le wagon : on lit la droite graduée, on zoome avec la loupe (unités → dixièmes → centièmes),
                on pose le drapeau d'arrêt ; le wagon roule jusque-là. 3 wagons : dixième, centième, graduations
                qui ne vont pas de 1 en 1 (pas de 0,2 ; 0,25 ; 0,02).
     filon      un filon est caché ; chaque forage (énergie limitée) dit « plus loin » ou « moins loin » ;
                on l'encadre à l'unité, au dixième, au centième (la droite se zoome à chaque encadrement juste).
     minerais   ranger 5 pépites du plus petit au plus grand (glisser-déposer), puis intercaler un décimal
                entre deux autres (de plus en plus proches).
   Gardien : l'Éboulement (filon à retrouver avec peu d'énergie, puis rangement + intercalations serrées).
   Interne : les nombres sont des ENTIERS (milliers, ou dix-millièmes pour les intercalations) ; Atlas.fmt à l'écran.
   ========================================================= */
(function () {
  'use strict';
  const { h, svg: S } = Atlas;
  const VW = 800, VH = 500;
  const SC = 1000;

  /* ---------- Écriture des nombres (entiers internes → texte français) ---------- */
  const fmtv = (v, sc = SC) => Atlas.fmt(v / sc, 4);
  const decs = (step, sc) => { for (let d = 0; d <= 4; d++) if ((step * 10 ** d) % sc === 0) return d; return 4; };
  const fix = (v, d, sc = SC) => {
    const ld = Math.round(Math.log10(sc));
    const i = Math.floor(v / sc), f = v - i * sc;
    return d ? `${i},${String(f).padStart(ld, '0').slice(0, d)}` : String(i);
  };
  const plur = (n, w) => `${n} ${w}${n > 1 ? 's' : ''}`;
  const partsTxt = (v, nd) => {
    const a = [plur(Math.floor(v / 1000), 'unité')];
    if (nd >= 1) a.push(plur(Math.floor(v / 100) % 10, 'dixième'));
    if (nd >= 2) a.push(plur(Math.floor(v / 10) % 10, 'centième'));
    return a.join(', ').replace(/, ([^,]*)$/, ' et $1');
  };
  const RANG = ['dixièmes', 'centièmes', 'millièmes', 'dix-millièmes'];

  /* ---------- Comparaison chiffre à chiffre (écritures de texte « 3,45 ») ---------- */
  const decCount = (t) => (t.split(',')[1] || '').length;
  const padTxt = (t, nd) => { const [i, f = ''] = t.split(','); return { i, f: f.padEnd(nd, '0'), n: f.length }; };
  function firstDiff(a, b) {
    const nd = Math.max(decCount(a), decCount(b));
    const A = padTxt(a, nd), B = padTxt(b, nd);
    if (A.i !== B.i) return { col: -1, da: A.i, db: B.i, name: 'partie entière' };
    for (let k = 0; k < nd; k++) if (A.f[k] !== B.f[k]) return { col: k, da: A.f[k], db: B.f[k], name: RANG[k] };
    return null;
  }
  /* Petit tableau : les nombres alignés, zéros ajoutés en gris, premier chiffre différent en orange. */
  function cmpBox(rows, col) {
    const nd = Math.max(...rows.map((r) => decCount(r.txt)));
    const box = h('div', { style: 'margin:8px auto;padding:8px 14px;background:#fff7e0;border:2px solid #c9a36a;border-radius:12px;width:fit-content;max-width:100%' });
    rows.forEach((r) => {
      const P = padTxt(r.txt, nd);
      const line = h('div', { style: 'font:800 28px ui-monospace,Consolas,monospace;display:flex;align-items:baseline;gap:0;white-space:nowrap' });
      line.append(h('span', { style: 'font:700 14px system-ui,sans-serif;color:#7c5a2a;width:6.5em;display:inline-block' }, r.label || ''));
      line.append(h('span', { style: col === -1 ? 'color:#e8590c;text-decoration:underline' : '' }, P.i));
      if (nd) line.append(h('span', {}, ','));
      [...P.f].forEach((ch, k) => line.append(h('span', { style: `${k === col ? 'color:#e8590c;text-decoration:underline;' : ''}${k >= P.n ? 'color:#adb5bd' : ''}` }, ch)));
      box.append(line);
    });
    return box;
  }

  /* ================================================================
     LA DROITE GRADUÉE (une planche par niveau de zoom) — valeurs entières
     ================================================================ */
  function Ruler(svg, { sc = SC, ys = [110, 255, 400] } = {}) {
    const X0 = 70, X1 = 730;
    const R = { sc, lines: [], X0, X1, onTap: null };
    const gBeam = S.el('g', {}, svg), gLine = S.el('g', {}, svg), gFx = S.el('g', { 'pointer-events': 'none' }, svg);
    R.x = (L, v) => X0 + ((v - L.lo) / (L.hi - L.lo)) * (X1 - X0);
    R.val = (L, i) => L.lo + i * L.step;
    R.span = (L, a, b, color, op = 0.25) => S.el('rect', { x: R.x(L, a), y: L.y - 6, width: R.x(L, b) - R.x(L, a), height: 58, rx: 6, fill: color, 'fill-opacity': op, stroke: color, 'stroke-width': 4 }, L.fx);
    R.band = (L, i, color = '#2f9e44', op = 0.25) => R.span(L, R.val(L, i), R.val(L, i + 1), color, op);
    R.ring = (L, v, color = '#2f9e44') => S.el('circle', { cx: R.x(L, v), cy: L.y + 12, r: 21, fill: 'none', stroke: color, 'stroke-width': 5 }, L.fx);
    R.flag = (L, v, color = '#e03131') => {
      const x = R.x(L, v), g = S.el('g', {}, L.fx);
      S.el('line', { x1: x, y1: L.y + 2, x2: x, y2: L.y - 46, stroke: '#2b1d0e', 'stroke-width': 4 }, g);
      S.el('polygon', { points: `${x},${L.y - 46} ${x + 34},${L.y - 35} ${x},${L.y - 24}`, fill: color, stroke: '#fff', 'stroke-width': 2 }, g);
      return g;
    };
    R.drill = (L, v, dir) => {
      const x = R.x(L, v), g = S.el('g', {}, L.fx), s = dir > 0 ? 1 : -1;
      S.el('line', { x1: x, y1: L.y + 2, x2: x, y2: L.y - 40, stroke: '#ced4da', 'stroke-width': 3 }, g);
      S.el('circle', { cx: x, cy: L.y - 40, r: 9, fill: '#495057', stroke: '#fff', 'stroke-width': 2 }, g);
      S.el('polygon', { points: `${x + s * 12},${L.y - 52} ${x + s * 40},${L.y - 40} ${x + s * 12},${L.y - 28}`, fill: dir > 0 ? '#4dabf7' : '#ff922b', stroke: '#fff', 'stroke-width': 2 }, g);
      return g;
    };
    R.gem = (L, v) => {
      const x = R.x(L, v), g = S.el('g', {}, L.fx);
      S.el('polygon', { points: `${x},${L.y - 44} ${x + 15},${L.y - 24} ${x},${L.y - 4} ${x - 15},${L.y - 24}`, fill: '#22d3ee', stroke: '#0b7285', 'stroke-width': 3 }, g);
      S.el('polygon', { points: `${x},${L.y - 44} ${x + 15},${L.y - 24} ${x},${L.y - 24}`, fill: '#a5f3fc' }, g);
      return g;
    };
    R.wagon = (L, v, done) => {
      const g = S.el('g', {}, L.fx);
      S.el('polygon', { points: '-28,-36 28,-36 22,-12 -22,-12', fill: '#868e96', stroke: '#343a40', 'stroke-width': 3 }, g);
      S.el('circle', { cx: -13, cy: -7, r: 7, fill: '#343a40' }, g);
      S.el('circle', { cx: 13, cy: -7, r: 7, fill: '#343a40' }, g);
      const x1 = R.x(L, v), t0 = performance.now(), dur = 500 + (1000 * (x1 - X0)) / (X1 - X0);
      g.setAttribute('transform', `translate(${X0},${L.y + 1})`);
      const tick = (t) => {
        const k = Math.max(0, Math.min(1, (t - t0) / dur)), e = 1 - (1 - k) * (1 - k);
        g.setAttribute('transform', `translate(${X0 + (x1 - X0) * e},${L.y + 1})`);
        if (k < 1) requestAnimationFrame(tick); else if (done) done();
      };
      requestAnimationFrame(tick);
      return g;
    };
    /* Ajoute une planche ; parent = {L, i} : intervalle zoomé (faisceau de la loupe). */
    R.add = (view, parent) => {
      const lvl = R.lines.length, y = ys[lvl];
      const L = { lvl, y, lo: view.lo, hi: view.hi, split: view.split, step: (view.hi - view.lo) / view.split, labels: view.labels || 'all' };
      L.d = decs(L.step, sc);
      L.g = S.el('g', {}, gLine);
      L.fx = S.el('g', {}, gFx);
      if (parent) {
        const P = parent.L, a = R.val(P, parent.i), b = R.val(P, parent.i + 1);
        L.beam = S.el('polygon', { points: `${R.x(P, a)},${P.y + 46} ${R.x(P, b)},${P.y + 46} ${X1 + 28},${y} ${X0 - 28},${y}`, fill: 'rgba(255,214,102,0.28)', stroke: '#ffd43b', 'stroke-width': 2, 'stroke-dasharray': '8 6' }, gBeam);
        L.pband = R.span(P, a, b, '#ffd43b', 0.3);
        L.lens = S.el('text', { x: 400, y: (P.y + 46 + y) / 2 + 12, 'text-anchor': 'middle', 'font-size': 34, text: '🔍' }, gBeam);
      }
      S.el('rect', { x: X0 - 28, y, width: X1 - X0 + 56, height: 46, rx: 9, fill: '#e5c58d', stroke: '#8a6a3e', 'stroke-width': 3 }, L.g);
      for (let i = 0; i <= L.split; i++) {
        const x = X0 + (i * (X1 - X0)) / L.split, end = i === 0 || i === L.split;
        S.el('line', { x1: x, y1: y, x2: x, y2: y + (end ? 24 : 15), stroke: '#3b2412', 'stroke-width': end ? 4 : 2.5 }, L.g);
        if (L.labels === 'all' || (L.labels === 'ends' && end)) {
          const txt = L.labels === 'ends' ? fmtv(R.val(L, i), sc) : fix(R.val(L, i), L.d, sc);
          S.el('text', { x, y: y + 41, 'text-anchor': 'middle', 'font-size': txt.length >= 6 ? 16 : 19, 'font-weight': 800, fill: '#4a2f12', text: txt }, L.g);
        }
      }
      const hit = S.el('rect', { x: X0 - 28, y: y - 52, width: X1 - X0 + 56, height: 112, fill: 'transparent' }, L.g);
      hit.style.cursor = 'pointer';
      hit.addEventListener('click', (e) => {
        const p = S.pt(svg, e), u = ((p.x - X0) / (X1 - X0)) * L.split;
        if (R.onTap) R.onTap(L, { tick: Math.max(0, Math.min(L.split, Math.round(u))), seg: Math.max(0, Math.min(L.split - 1, Math.floor(u))) });
      });
      R.lines.push(L);
      return L;
    };
    R.trunc = (n) => {
      while (R.lines.length > n) {
        const L = R.lines.pop();
        [L.g, L.fx, L.beam, L.pband, L.lens].forEach((e) => e && e.remove());
      }
    };
    return R;
  }

  function mineBg(svg, h2 = VH) {
    S.el('rect', { x: 0, y: 0, width: VW, height: h2, fill: '#3a2c24' }, svg);
    S.el('rect', { x: 0, y: 0, width: 14, height: h2, fill: '#6b4a2b' }, svg);
    S.el('rect', { x: VW - 14, y: 0, width: 14, height: h2, fill: '#6b4a2b' }, svg);
  }

  /* ---------- Plateau « loupe + drapeau » (énigme du wagon et leçon) ---------- */
  function zoomBoard(host, { lo, hi, split, labels = 'all', target, maxLines = 3, onBadZoom, onFlag, ys, svgH = VH }) {
    const svg = S.root(host, VW, svgH);
    mineBg(svg, svgH);
    const R = Ruler(svg, { ys });
    R.add({ lo, hi, split, labels });
    const B = { svg, R, mode: maxLines > 1 ? 'zoom' : 'flag', flag: null };
    const bZ = h('button', { class: 'btn', onclick: () => B.setMode('zoom') }, '🔍 Loupe');
    const bF = h('button', { class: 'btn', onclick: () => B.setMode('flag') }, '🚩 Poser l\'arrêt');
    B.tools = h('div', { class: 'puz-tools' }, maxLines > 1 ? bZ : null, bF);
    host.append(B.tools);
    B.setMode = (m) => { B.mode = m; bZ.classList.toggle('on', m === 'zoom'); bF.classList.toggle('on', m === 'flag'); };
    B.setMode(B.mode);
    B.clearFlag = () => { if (B.flag) { B.flag.g.remove(); B.flag = null; } };
    R.onTap = (L, t) => {
      if (B.mode === 'zoom') {
        if (L.lvl >= maxLines - 1) { Atlas.UI.toast('Cette droite est déjà zoomée au maximum : pose l\'arrêt.', 'bad'); return; }
        const a = R.val(L, t.seg), b = R.val(L, t.seg + 1);
        if (target >= a && target <= b) {
          R.trunc(L.lvl + 1);
          if (B.flag && B.flag.lvl > L.lvl) B.flag = null;
          R.add({ lo: a, hi: b, split: 10, labels: 'all' }, { L, i: t.seg });
        } else if (onBadZoom) onBadZoom(L, t.seg);
      } else {
        B.clearFlag();
        const v = R.val(L, t.tick);
        B.flag = { lvl: L.lvl, v, g: R.flag(L, v) };
        if (onFlag) onFlag(B.flag);
      }
    };
    return B;
  }

  /* ================================================================
     ÉNIGME « wagon » : arrêter le wagon au filon
     ================================================================ */
  function buildWagon(ctx, host, { kinds, onSolved }) {
    const r = ctx.rng;
    let dead = false, k = 0;
    ctx.onCleanup(() => { dead = true; });

    const gen = (kind) => {
      if (kind === 'pas') {
        const t = r.pick(['u5', 'u4', 't5']), A = r.int(1, 40);
        if (t === 't5') { const lo = A * 1000 + r.int(0, 8) * 100; return { kind, lo, hi: lo + 100, split: 5, T: lo + r.int(1, 4) * 20, labels: 'ends', max: 1 }; }
        const lo = A * 1000;
        return t === 'u5'
          ? { kind, lo, hi: lo + 1000, split: 5, T: lo + r.int(1, 4) * 200, labels: 'ends', max: 1 }
          : { kind, lo, hi: lo + 1000, split: 4, T: lo + r.int(1, 3) * 250, labels: 'ends', max: 1 };
      }
      const lo = r.int(1, 30) * 1000, a = r.int(0, 4), b = kind === 'centieme' ? r.int(0, 9) : r.int(1, 9);
      let c = 0;
      if (kind === 'centieme') { do { c = r.int(1, 9); } while (c === b); }
      return { kind, lo, hi: lo + 5000, split: 5, T: lo + a * 1000 + b * 100 + c * 10, labels: 'all', max: 3 };
    };

    const round = () => {
      if (dead) return;
      if (k >= kinds.length) return onSolved();
      host.innerHTML = '';
      const G = gen(kinds[k]), T = G.T;
      ctx.consigne.innerHTML = G.kind === 'pas'
        ? `Wagon ${k + 1} / ${kinds.length} — Le filon est à <b>${fmtv(T)}</b>. Regarde de combien avance <b>chaque graduation</b>, puis pose l'arrêt.`
        : `Wagon ${k + 1} / ${kinds.length} — Le filon est à <b>${fmtv(T)}</b>. Zoome avec la loupe, pose l'arrêt, puis lance le wagon.`;
      let busy = false;

      const badZoom = (L, seg) => {
        const idx = Math.max(0, Math.min(L.split - 1, Math.floor((T - L.lo) / L.step)));
        const a = B.R.val(L, idx), b = B.R.val(L, idx + 1);
        const e1 = B.R.band(L, seg, '#e03131'), e2 = B.R.band(L, idx, '#2f9e44');
        setTimeout(() => { e1.remove(); e2.remove(); }, 3000);
        let m;
        if (L.step === 1000) m = `Le filon <b>${fmtv(T)}</b> a pour partie entière ${Math.floor(T / 1000)} : il est entre <b>${fmtv(a)}</b> et <b>${fmtv(b)}</b> (en vert), pas dans l'intervalle que tu as touché (en rouge).`;
        else m = `Regarde le chiffre des dixièmes de <b>${fmtv(T)}</b> : c'est ${Math.floor(T / 100) % 10}. Le filon est entre <b>${fmtv(a)}</b> et <b>${fmtv(b)}</b> (en vert), pas dans l'intervalle rouge.`;
        ctx.fail(m);
      };
      const B = zoomBoard(host, { lo: G.lo, hi: G.hi, split: G.split, labels: G.labels, target: T, maxLines: G.max, onBadZoom: badZoom });
      const R = B.R;
      const bGo = h('button', { class: 'btn btn-go' }, '🚃 Lancer le wagon');
      B.tools.append(bGo);

      const stopMessage = (P) => {
        const L0 = R.lines[0];
        if (G.kind === 'pas') {
          const believed = (G.hi - G.lo) / 10, i = (P - G.lo) / L0.step;
          if (believed !== L0.step && G.lo + i * believed === T) {
            return `Tu as compté de ${fmtv(believed)} en ${fmtv(believed)}. Mais entre <b>${fmtv(G.lo)}</b> et <b>${fmtv(G.hi)}</b> il n'y a que ${G.split} pas égaux : ${fmtv(G.hi - G.lo)} : ${G.split} = <b>${fmtv(L0.step)}</b> par graduation.`;
          }
          return `Ici, chaque graduation vaut <b>${fmtv(L0.step)}</b> (${fmtv(G.hi - G.lo)} : ${G.split}). Pour atteindre ${fmtv(T)}, il faut avancer de ${fmtv(T - G.lo)}, soit ${(T - G.lo) / L0.step} pas depuis ${fmtv(G.lo)}.`;
        }
        const pst = R.lines[B.flag.lvl].step, nd = T % 100 ? 2 : 1;
        if (T % pst !== 0 && Math.abs(P - T) < pst) {
          return `Tu t'es arrêté à <b>${fmtv(P)}</b>, mais le filon est à <b>${fmtv(T)}</b>, entre deux graduations de ta droite. Il fallait zoomer encore avec la loupe.`;
        }
        return `Le filon <b>${fmtv(T)}</b> = ${partsTxt(T, nd)}. Ton arrêt <b>${fmtv(P)}</b> = ${partsTxt(P, nd)}. Compte les graduations en partant du bon entier.`;
      };

      bGo.onclick = () => {
        if (busy || dead) return;
        if (!B.flag) { Atlas.UI.toast('Pose d\'abord l\'arrêt du wagon (🚩), puis touche une graduation.', 'bad'); return; }
        busy = true;
        const P = B.flag.v, L0 = R.lines[0];
        R.wagon(L0, P, () => {
          if (dead) return;
          R.gem(L0, T);
          if (P === T) {
            Atlas.UI.toast('Le wagon s\'arrête pile sur le filon !', 'good');
            setTimeout(() => { k++; round(); }, 1300);
            return;
          }
          R.lines.forEach((L) => {
            if (T < L.lo || T > L.hi) return;
            if ((T - L.lo) % L.step === 0) R.ring(L, T);
            else R.band(L, Math.floor((T - L.lo) / L.step));
          });
          const hl = ctx.fail(stopMessage(P));
          if (hl > 0) setTimeout(() => { if (!dead && ctx.hearts > 0) round(); }, 4200);
        });
      };
      ctx.pi(G.kind === 'pas'
        ? 'Les graduations ne vont pas toujours de 1 en 1 ! Compte les pas entre les deux nombres écrits.'
        : 'Touche 🔍 puis l\'intervalle où se cache le filon : la droite se zoome. Quand tu vois la bonne graduation, touche 🚩 puis la graduation.');
    };
    round();
  }

  /* ================================================================
     ÉNIGME « filon » : forages « plus loin / moins loin » et encadrements
     ================================================================ */
  function buildFilon(ctx, host, { energy: E0 = 14, w = 8, tag = '', onSolved }) {
    const r = ctx.rng;
    let dead = false;
    ctx.onCleanup(() => { dead = true; });
    host.innerHTML = '';
    const A = r.int(0, 12);
    const V = (A + r.int(0, w - 1)) * 1000 + r.int(0, 9) * 100 + r.int(0, 9) * 10 + r.int(1, 9);
    ctx.consigne.innerHTML = `${tag}Un filon est caché entre <b>${A}</b> et <b>${A + w}</b>. Fore pour savoir s'il est <b>plus loin</b> (▶) ou <b>moins loin</b> (◀), puis <b>encadre-le</b> : à l'unité, au dixième, au centième.`;
    const svg = S.root(host, VW, VH);
    mineBg(svg);
    const R = Ruler(svg);
    R.add({ lo: A * 1000, hi: (A + w) * 1000, split: w, labels: 'all' });
    let p = 0, energy = E0, mode = 'drill', sel = null, selEl = null, done = false;
    const drills = [[], [], []];
    const eTxt = S.el('text', { x: 28, y: 36, 'font-size': 26, 'font-weight': 800, fill: '#ffd43b' }, svg);
    S.el('text', { x: 772, y: 34, 'text-anchor': 'end', 'font-size': 20, 'font-weight': 700, fill: '#f3e4c4', text: '▶ plus loin     ◀ moins loin' }, svg);
    const showE = () => { eTxt.textContent = `⚡ Énergie : ${energy}`; };
    showE();
    const names = ['à l\'unité', 'au dixième', 'au centième'];
    const bDrill = h('button', { class: 'btn', onclick: () => setMode('drill') }, '⛏ Forer (−1 ⚡)');
    const bFrame = h('button', { class: 'btn', onclick: () => setMode('frame') }, '📏 Encadrer');
    const bOk = h('button', { class: 'btn btn-go', disabled: true }, 'Choisis un intervalle');
    host.append(h('div', { class: 'puz-tools' }, bDrill, bFrame, bOk));
    const setMode = (m) => { mode = m; bDrill.classList.toggle('on', m === 'drill'); bFrame.classList.toggle('on', m === 'frame'); };
    setMode('drill');
    const clearSel = () => { sel = null; if (selEl) { selEl.remove(); selEl = null; } bOk.disabled = true; bOk.textContent = 'Choisis un intervalle'; };

    R.onTap = (L, t) => {
      if (done) return;
      if (L.lvl !== p) { Atlas.UI.toast('Travaille sur la droite du bas (la plus zoomée).', 'bad'); return; }
      if (mode === 'drill') {
        const v = R.val(L, t.tick);
        if (drills[p].some((d) => d.v === v)) { Atlas.UI.toast('Tu as déjà foré ici.', 'bad'); return; }
        if (energy <= 0) { Atlas.UI.toast('Plus d\'énergie ! Encadre avec ce que tu sais.', 'bad'); return; }
        energy--;
        const dir = V > v ? 1 : -1;
        drills[p].push({ v, dir, g: R.drill(L, v, dir) });
        showE();
        ctx.pi(dir > 0 ? `En <b>${fmtv(v)}</b> : « plus loin ». Le filon est <b>après</b> ${fmtv(v)}.` : `En <b>${fmtv(v)}</b> : « moins loin ». Le filon est <b>avant</b> ${fmtv(v)}.`);
      } else {
        clearSel();
        sel = t.seg;
        selEl = R.band(L, sel, '#1c7ed6', 0.3);
        bOk.disabled = false;
        bOk.textContent = `Valider : ${fmtv(R.val(L, sel))} < filon < ${fmtv(R.val(L, sel + 1))}`;
      }
    };

    bOk.onclick = () => {
      if (dead || done || sel == null) return;
      const L = R.lines[p], lo = R.val(L, sel), hi = R.val(L, sel + 1);
      let lb = L.lo, ub = L.hi;
      drills[p].forEach((d) => { if (d.dir > 0) lb = Math.max(lb, d.v); else ub = Math.min(ub, d.v); });
      const s0 = Math.round((lb - L.lo) / L.step), s1 = Math.round((ub - L.lo) / L.step) - 1;
      if (s0 === s1 && sel === s0) {
        // encadrement prouvé
        R.band(L, sel, '#2f9e44', 0.3);
        if (selEl) { selEl.remove(); selEl = null; }
        if (p < 2) {
          Atlas.UI.toast(`Le filon est entre ${fmtv(lo)} et ${fmtv(hi)} : zoom !`, 'good');
          R.add({ lo, hi, split: 10, labels: 'all' }, { L, i: sel });
          p++;
          clearSel();
          setMode('drill');
          ctx.pi(`Bien ! Encadrement ${names[p - 1]} trouvé. Maintenant, encadre-le <b>${names[p]}</b> : fore entre ${fmtv(lo)} et ${fmtv(hi)}.`);
        } else {
          done = true;
          R.lines.forEach((Q) => R.gem(Q, V));
          bOk.disabled = true;
          setTimeout(() => { if (!dead) onSolved(V); }, 1300);
        }
        return;
      }
      const bad = drills[p].filter((d) => (d.dir > 0 && hi <= d.v) || (d.dir < 0 && lo >= d.v))
        .sort((a, b) => Math.abs(a.v - (lo + hi) / 2) - Math.abs(b.v - (lo + hi) / 2))[0];
      const e1 = R.band(L, sel, '#e03131', 0.3), extra = [e1];
      let m;
      if (bad) {
        extra.push(R.ring(L, bad.v, '#e03131'));
        m = `Tu as foré en <b>${fmtv(bad.v)}</b> : « ${bad.dir > 0 ? 'plus loin' : 'moins loin'} ». Le filon est donc <b>${bad.dir > 0 ? 'après' : 'avant'}</b> ${fmtv(bad.v)}, pas entre ${fmtv(lo)} et ${fmtv(hi)}.`;
      } else {
        for (let s = s0; s <= s1; s++) extra.push(R.band(L, s, '#fab005', 0.25));
        m = `Tu ne peux pas en être sûr : tes forages laissent encore <b>${s1 - s0 + 1} intervalles</b> possibles (en jaune). Fore pour réduire la zone avant d'encadrer.`;
      }
      setTimeout(() => extra.forEach((e) => e.remove()), 3200);
      clearSel();
      ctx.fail(m);
    };
    ctx.pi(`Fore sur une graduation : on te répond « plus loin » ou « moins loin ». Coupe la zone en <b>deux</b> à chaque fois, tu économises l'énergie !`);
  }

  /* ================================================================
     ÉNIGME « minerais » : ranger des pépites, puis intercaler
     ================================================================ */
  function buildRange(ctx, host, { mixed = false, kinds, onSolved }) {
    const r = ctx.rng;
    let dead = false;
    ctx.onCleanup(() => { dead = true; });

    const genSet = () => {
      const mk = (txt) => { const [i, f = ''] = txt.split(','); return { txt, v: Number(i) * 1000 + Number(f.padEnd(3, '0')) }; };
      if (!mixed) {
        const b = r.int(2, 9), pool = ['5', '45', '405', '054', '4', '04', '54', '504'];
        const rest = r.shuffle(pool.filter((f) => f !== '5' && f !== '45')).slice(0, 3);
        return r.shuffle(['5', '45', ...rest]).map((f) => mk(`${b},${f}`));
      }
      const b = r.int(2, 8);
      return r.shuffle([
        mk(`${b - 1},${r.pick(['9', '95', '999'])}`),
        mk(`${b},${r.pick(['04', '054', '4'])}`),
        mk(`${b},${r.pick(['45', '405'])}`),
        mk(`${b},${r.pick(['5', '504'])}`),
        mk(r.chance(0.5) ? `${b + 1}` : `${b + 1},0${r.int(1, 9)}`),
      ]);
    };

    /* ----- Partie 1 : le rangement ----- */
    const rank = (after) => {
      if (dead) return;
      host.innerHTML = '';
      ctx.consigne.innerHTML = (ctx.gardien ? '<b>Étape 2 / 2</b> — ' : '') + 'Range les pépites sur l\'étagère, <b>du plus petit</b> (à gauche) <b>au plus grand</b> (à droite). Glisse-les avec le doigt.';
      const set = genSet();
      const svg = S.root(host, VW, VH);
      mineBg(svg);
      S.el('line', { x1: 150, y1: 62, x2: 650, y2: 62, stroke: '#ffd43b', 'stroke-width': 4 }, svg);
      S.el('polygon', { points: '650,50 676,62 650,74', fill: '#ffd43b' }, svg);
      S.el('text', { x: 40, y: 70, 'font-size': 22, 'font-weight': 800, fill: '#f3e4c4', text: 'petit' }, svg);
      S.el('text', { x: 700, y: 70, 'font-size': 22, 'font-weight': 800, fill: '#f3e4c4', text: 'grand' }, svg);
      S.el('text', { x: 400, y: 316, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: '#bfae93', text: '— le tas de minerais —' }, svg);
      const SX = (i) => 36 + i * 148;
      for (let i = 0; i < 5; i++) {
        S.el('rect', { x: SX(i), y: 110, width: 124, height: 64, rx: 18, fill: 'none', stroke: '#f3e4c4', 'stroke-width': 3, 'stroke-dasharray': '7 7', opacity: 0.6 }, svg);
        S.el('rect', { x: SX(i) - 8, y: 176, width: 140, height: 14, rx: 4, fill: '#9c6b3a', stroke: '#5a3a1c', 'stroke-width': 2 }, svg);
      }
      const slots = [null, null, null, null, null];
      const pieces = set.map((c, i) => {
        const P = Object.assign({ slot: null, home: { x: SX(i), y: 340 } }, c);
        P.g = S.el('g', {}, svg);
        S.el('rect', { width: 124, height: 64, rx: 20, fill: '#a8adb4', stroke: '#495057', 'stroke-width': 3 }, P.g);
        S.el('path', { d: 'M14,18 Q30,6 54,10', fill: 'none', stroke: '#e9ecef', 'stroke-width': 4, 'stroke-linecap': 'round' }, P.g);
        S.el('text', { x: 62, y: 43, 'text-anchor': 'middle', 'font-size': c.txt.length > 5 ? 25 : 29, 'font-weight': 800, fill: '#212529', text: c.txt }, P.g);
        return P;
      });
      const put = (P, x, y) => { P.pos = { x, y }; P.g.setAttribute('transform', `translate(${x},${y})`); };
      const home = (P) => { P.slot = null; put(P, P.home.x, P.home.y); };
      pieces.forEach((P) => {
        home(P);
        S.drag(P.g, svg, {
          start: (pt) => {
            if (P.slot != null) { slots[P.slot] = null; P.slot = null; }
            svg.append(P.g);
            P.off = { x: pt.x - P.pos.x, y: pt.y - P.pos.y };
          },
          move: (pt) => put(P, pt.x - P.off.x, pt.y - P.off.y),
          end: () => {
            let best = -1, bd = 80;
            for (let j = 0; j < 5; j++) {
              const d = Math.hypot(P.pos.x - SX(j), P.pos.y - 110);
              if (d < bd) { bd = d; best = j; }
            }
            if (best < 0) return home(P);
            const Q = slots[best];
            if (Q) home(Q);
            slots[best] = P; P.slot = best;
            put(P, SX(best), 110);
          },
        });
      });
      const note = h('div', {});
      const bCheck = h('button', { class: 'btn btn-go' }, '✅ Vérifier le rangement');
      host.append(h('div', { class: 'puz-tools' }, bCheck), note);
      bCheck.onclick = () => {
        note.innerHTML = '';
        if (slots.some((s) => !s)) { Atlas.UI.toast('Place les 5 pépites sur l\'étagère.', 'bad'); return; }
        const vs = slots.map((s) => s.v);
        let bad = -1;
        for (let i = 0; i < 4 && bad < 0; i++) if (vs[i] > vs[i + 1]) bad = i;
        if (bad < 0) {
          pieces.forEach((P) => P.g.firstChild.setAttribute('fill', '#8ce99a'));
          Atlas.UI.toast('Rangement parfait !', 'good');
          setTimeout(() => { if (!dead) after(); }, 1500);
          return;
        }
        if (vs.every((v, i) => i === 0 || v < vs[i - 1])) {
          ctx.fail('Tu as rangé du plus <b>grand</b> au plus <b>petit</b>. L\'étagère va du plus petit (à gauche) au plus grand (à droite).');
          return;
        }
        const a = slots[bad], b = slots[bad + 1];
        const d = firstDiff(a.txt, b.txt);
        note.append(cmpBox([{ label: 'à gauche', txt: a.txt }, { label: 'à droite', txt: b.txt }], d ? d.col : -2));
        const fa = padTxt(a.txt, 3).f, fb = padTxt(b.txt, 3).f;
        const asInt = d && d.col >= 0 && Number(a.txt.split(',')[1] || 0) < Number(b.txt.split(',')[1] || 0) && decCount(a.txt) !== decCount(b.txt);
        let m = d.col === -1
          ? `<b>${a.txt}</b> est plus grand que <b>${b.txt}</b> : ${d.da} unités contre ${d.db}.`
          : `<b>${a.txt}</b> est plus grand que <b>${b.txt}</b> : au rang des ${d.name}, ${d.da} &gt; ${d.db}.`;
        if (asInt) m += ` Ne compare pas ${Number(a.txt.split(',')[1])} et ${Number(b.txt.split(',')[1])} comme des entiers !`;
        else if (decCount(a.txt) !== decCount(b.txt)) m += ' Écris-les avec le même nombre de décimales.';
        void fa; void fb;
        home(a); home(b); slots[bad] = null; slots[bad + 1] = null;
        ctx.fail(m);
      };
      ctx.pi('Astuce : écris les nombres avec le même nombre de décimales (3,5 = 3,50), puis compare chiffre par chiffre, en partant de la gauche.');
    };

    /* ----- Partie 2 : intercaler ----- */
    let ki = 0;
    const between = () => {
      if (dead) return;
      if (ki >= kinds.length) return onSolved();
      const kind = kinds[ki];
      host.innerHTML = '';
      const sc = 10000, A = r.int(1, 20);
      let lo = A * 10000 + r.int(0, 9) * 1000, gap = 1000;
      if (kind === 'c') { lo += r.int(0, 9) * 100; gap = 100; }
      if (kind === 'm') { lo += r.int(0, 9) * 100 + r.int(0, 9) * 10; gap = 10; }
      const hi = lo + gap, tLo = fmtv(lo, sc), tHi = fmtv(hi, sc);
      ctx.consigne.innerHTML = `Une pépite doit se glisser <b>strictement entre</b> <b>${tLo}</b> et <b>${tHi}</b>. Écris un nombre qui convient.`;
      const svg = S.root(host, VW, 300);
      mineBg(svg, 300);
      const R = Ruler(svg, { sc, ys: [60, 200] });
      const plo = lo - (lo % (gap * 10));
      const L0 = R.add({ lo: plo, hi: plo + gap * 10, split: 10, labels: 'all' });
      const i0 = (lo - plo) / gap;
      R.band(L0, i0, '#ffd43b', 0.3);
      S.el('text', { x: (R.x(L0, lo) + R.x(L0, hi)) / 2, y: L0.y - 14, 'text-anchor': 'middle', 'font-size': 34, 'font-weight': 800, fill: '#ffd43b', text: '?' }, svg);
      const note = h('div', {});
      let locked = false;
      const ans = Atlas.UI.answer(host, {
        label: 'Ton nombre :',
        onSubmit: (v, raw) => {
          if (locked || dead) return;
          note.innerHTML = '';
          const txt = String(raw).trim().replace(/\s/g, '').replace('.', ',');
          const xi = Math.round(v * 1e6), lo6 = lo * 100, hi6 = hi * 100;
          if (xi === lo6 || xi === hi6) {
            const bound = xi === lo6 ? tLo : tHi;
            R.ring(L0, xi === lo6 ? lo : hi, '#e03131');
            ctx.fail(`<b>${txt}</b> est <b>égal</b> à ${bound} : c'est une des deux bornes ! Il faut un nombre <b>strictement</b> entre les deux.`);
            return;
          }
          if (xi < lo6 || xi > hi6) {
            const big = xi > hi6, bt = big ? tHi : tLo;
            const d = firstDiff(txt, bt);
            note.append(cmpBox([{ label: 'borne', txt: tLo }, { label: 'ton nombre', txt }, { label: 'borne', txt: tHi }], d ? d.col : -2));
            const x4 = v * sc;
            if (x4 >= L0.lo && x4 <= L0.hi) R.flag(L0, x4);
            ctx.fail(`<b>${txt}</b> est plus ${big ? 'grand' : 'petit'} que <b>${bt}</b> : ${d && d.col === -1 ? `${d.da} unités contre ${d.db}` : `au rang des ${d ? d.name : ''}, ${d ? d.da : ''} ${big ? '&gt;' : '&lt;'} ${d ? d.db : ''}`}. Il doit être <b>entre</b> ${tLo} et ${tHi}.`);
            return;
          }
          locked = true;
          const L1 = R.add({ lo, hi, split: 10, labels: 'all' }, { L: L0, i: i0 });
          R.flag(L1, v * sc, '#2f9e44');
          Atlas.UI.toast(`${txt} est bien entre ${tLo} et ${tHi} !`, 'good');
          setTimeout(() => { if (!dead) { ki++; between(); } }, 2600);
        },
      });
      const bNone = h('button', { class: 'btn', style: 'margin-left:8px' }, '🚫 Il n\'y a aucun nombre entre les deux');
      ans.row.append(bNone);
      host.append(note);
      bNone.onclick = () => {
        if (locked || dead) return;
        locked = true;
        const mid = lo + gap / 2;
        const L1 = R.add({ lo, hi, split: 10, labels: 'all' }, { L: L0, i: i0 });
        R.ring(L1, mid, '#2f9e44');
        const hl = ctx.fail(`Il y en a <b>toujours</b> ! Zoome : entre ${tLo} et ${tHi}, il y a 10 nouveaux pas de ${fmtv(gap / 10, sc)}. Par exemple <b>${fmtv(mid, sc)}</b>.`);
        if (hl > 0) setTimeout(() => { if (!dead && ctx.hearts > 0) between(); }, 4500);
      };
      ctx.pi(kind === 'd'
        ? 'Entre deux dixièmes qui se suivent, il y a des centièmes. Zoome dans ta tête !'
        : 'Entre deux nombres qui se suivent, il y en a toujours un autre : il suffit d\'ajouter une décimale.');
    };

    rank(between);
  }

  /* ---------- La carte de la mine ---------- */
  const W = 26, H = 18;
  const map = Atlas.buildMap(W, H, (m) => {
    m.border('T');
    m.rect(13, 3, 24, 15, ':');             // sol de la mine (terre)
    m.rect(12, 2, 24, 2, 'W');              // mur du fond
    m.rect(12, 16, 24, 16, 'W');            // mur du bas
    m.rect(12, 3, 12, 7, 'W');              // mur ouest, avec l'entrée en (12, 8-9)
    m.rect(12, 10, 12, 15, 'W');
    m.rect(1, 8, 12, 9, '=');               // chemin depuis le village
    m.set(0, 8, '='); m.set(0, 9, '=');
    m.rect(11, 9, 24, 9, 'h');              // grande voie
    m.rect(18, 3, 18, 15, 'v');             // voie nord-sud
    m.set(18, 9, 'h');
    m.sprinkle(',', 7, 5);
    [[14, 4], [15, 4], [14, 5], [23, 6], [24, 6], [24, 7], [22, 14], [22, 15], [21, 15], [15, 13], [14, 14], [16, 15], [6, 3], [7, 14], [10, 13]]
      .forEach(([x, y]) => m.set(x, y, 'R'));
    m.set(10, 7, 'S');
    m.set(4, 11, 'b'); m.set(5, 11, 'b'); m.set(6, 11, 'k');
  });

  Atlas.region({
    id: 'mine', num: 4, name: 'La Mine aux Graduations', chapter: 'Nombres entiers et décimaux (2)',
    map, spawn: { x: 2, y: 8 },
    theme: { sky: '#e6b878', grass: ['#a8913f', '#9c8638', '#b09a48'], path: '#c9a36a', tuft: '#8a7330', outside: '#6e5a2a' },
    signs: { '10,7': '<b>Mine aux Graduations</b><br>« Entre deux nombres, il y en a toujours un autre. »' },
    exits: [{ x: 0, y: 8, to: 'village' }, { x: 0, y: 9, to: 'village' }],
    props: [
      { x: 3, y: 3, stamp: 'maison_bois' },
      { x: 14, y: 9, t: 'dungeon:54', solid: true },
      { x: 20, y: 9, t: 'dungeon:54', solid: true },
      { x: 18, y: 13, t: 'dungeon:54', solid: true },
    ],
    npcs: [
      {
        id: 'edgar', x: 6, y: 7, t: 'dungeon:85', name: 'Edgar, le guide',
        talk: (A) => A.done('wagon') && A.done('filon') && A.done('minerais')
          ? ['Toute la mine est réparée ! Il ne reste que l\'éboulement : va voir le contremaître, au fond.']
          : ['Bienvenue à la Mine aux Graduations ! Depuis la tempête, les étiquettes des galeries sont tombées.', 'Le contremaître Bruno est au fond, derrière les éboulis. Aide d\'abord ses mineurs.'],
      },
      {
        id: 'gus', x: 15, y: 7, t: 'dungeon:111', name: 'Gustave, le wagonnier',
        talk: (A) => A.done('wagon')
          ? ['Mon wagon s\'arrête pile au filon, maintenant. Quel soulagement !', 'Souviens-toi : on lit d\'abord les entiers, puis les dixièmes, puis les centièmes.']
          : ['Mon wagon ne sait plus où s\'arrêter. Il faut lire la droite graduée, et zoomer !', 'Mon wagon est là, sur les rails.'],
      },
      {
        id: 'lola', x: 19, y: 5, t: 'dungeon:112', name: 'Lola, la foreuse',
        talk: (A) => A.done('filon')
          ? ['Quel flair ! Couper la zone en deux à chaque forage, c\'est la bonne méthode.']
          : ['Chaque forage coûte de l\'énergie. Il y a un filon caché, mais je ne sais pas où forer.', 'Ma foreuse est juste à côté.'],
      },
      {
        id: 'zoe', x: 20, y: 12, t: 'dungeon:88', name: 'Zoé, la trieuse',
        talk: (A) => A.done('minerais')
          ? ['Tout est bien rangé ! Et on trouve toujours un nombre de plus entre deux autres.']
          : ['Mes pépites sont toutes mélangées ! 3,45 ou 3,5, laquelle est la plus grande ?', 'Les sacs de minerai sont à côté de moi.'],
      },
    ],
    objects: [
      { id: 'o-wagon', x: 16, y: 10, t: 'dungeon:54', kind: 'enigme', enigme: 'wagon' },
      { id: 'o-filon', x: 20, y: 5, t: 'town:116', kind: 'enigme', enigme: 'filon' },
      { id: 'o-minerais', x: 21, y: 12, t: 'town:107', kind: 'enigme', enigme: 'minerais' },
      {
        id: 'o-gardien', x: 23, y: 14, t: 'dungeon:87', name: 'Contremaître Bruno', kind: 'gardien',
        look: { top: '#e8a317', bottom: '#4a3a2c', hair: '#5a2d14', style: 'court', hat: 'casque', hatColor: '#f2b01e', moustache: '#5a2d14', scale: 1.05 },
        notReady: 'Je suis coincé derrière l\'éboulement ! Reviens quand tu auras réparé le wagon, le forage et le tri des minerais.',
        intro: ['Ouf, tu es là ! Un éboulement a tout bouleversé, et il me reste très peu d\'énergie.', 'Retrouve le filon enfoui, puis range les minerais. Prêt ?'],
      },
    ],
    treasure: {
      x: 24, y: 3, needs: 'bourse',
      hint: 'Ce tas de cailloux scintille… mais il faut payer le passage avec la <b>bourse à cristaux</b>. (On la gagne au Marché aux Cristaux.)',
      text: 'Avec la bourse, on paie le vieux mineur qui gardait ce coin : voici sa cachette !',
    },
    lesson: [
      {
        text: 'Sur une <b>droite graduée</b>, chaque graduation a une valeur. Entre 3 et 4, il y a 10 pas égaux : chaque pas vaut 1 <b>dixième</b>, soit 0,1.',
        svg: (el) => {
          const s = S.root(el, VW, 250);
          mineBg(s, 250);
          const R = Ruler(s, { ys: [100] });
          const L = R.add({ lo: 3000, hi: 4000, split: 10, labels: 'ends' });
          R.flag(L, 3600);
          S.el('text', { x: 400, y: 200, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 800, fill: '#fff3d6', text: '3,6 = 3 unités + 6 dixièmes' }, s);
          S.el('text', { x: 400, y: 232, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 700, fill: '#ffd43b', text: '1 pas = 0,1' }, s);
        },
      },
      {
        text: 'On peut <b>zoomer</b> avec la loupe ! Entre 3,4 et 3,5, il y a encore 10 pas, de 1 <b>centième</b> (0,01). Et on peut zoomer encore, sans jamais s\'arrêter.',
        svg: (el) => {
          const s = S.root(el, VW, 320);
          mineBg(s, 320);
          const R = Ruler(s, { ys: [50, 200] });
          const L0 = R.add({ lo: 3000, hi: 4000, split: 10, labels: 'all' });
          setTimeout(() => {
            const L1 = R.add({ lo: 3400, hi: 3500, split: 10, labels: 'all' }, { L: L0, i: 4 });
            R.flag(L1, 3470, '#2f9e44');
          }, 700);
        },
      },
      {
        text: '<b>3,45</b> ou <b>3,5</b> : lequel est le plus grand ? Écris-les avec le même nombre de décimales : 3,45 et 3,50. On compare les dixièmes : 4 &lt; 5. Donc <b>3,45 &lt; 3,5</b> (et non « 45 &gt; 5 » !).',
        svg: '<svg viewBox="0 0 400 230"><rect width="400" height="230" rx="14" fill="#3a2c24"/><text x="200" y="38" text-anchor="middle" fill="#ffd43b" font-size="20" font-weight="800">3,45 ou 3,5 ?</text><g font-family="ui-monospace,Consolas,monospace" font-size="46" font-weight="800"><text x="90" y="105" fill="#fff3d6">3,<tspan fill="#ff922b">4</tspan>5</text><text x="90" y="165" fill="#fff3d6">3,<tspan fill="#ff922b">5</tspan><tspan fill="#868e96">0</tspan></text></g><text x="260" y="100" fill="#f3e4c4" font-size="19" font-weight="700">4 dixièmes</text><text x="260" y="160" fill="#f3e4c4" font-size="19" font-weight="700">5 dixièmes</text><text x="200" y="208" text-anchor="middle" fill="#8ce99a" font-size="22" font-weight="800">4 &lt; 5 donc 3,45 &lt; 3,5</text></svg>',
      },
      {
        text: '<b>Intercaler</b>, c\'est trouver un nombre entre deux autres. Entre 3,45 et 3,46, il y a 3,455 : on ajoute une décimale. Il y a <b>toujours</b> un nombre entre deux décimaux !',
        svg: (el) => {
          const s = S.root(el, VW, 320);
          mineBg(s, 320);
          const R = Ruler(s, { ys: [50, 200] });
          const L0 = R.add({ lo: 3400, hi: 3500, split: 10, labels: 'all' });
          R.band(L0, 5, '#ffd43b', 0.3);
          setTimeout(() => {
            const L1 = R.add({ lo: 3450, hi: 3460, split: 10, labels: 'all' }, { L: L0, i: 5 });
            R.flag(L1, 3455, '#2f9e44');
          }, 700);
        },
      },
      {
        text: 'À toi ! Le wagon doit s\'arrêter à <b>3,47</b>. Touche 🔍 puis l\'intervalle où il se trouve, zoome deux fois, puis touche 🚩 et la graduation 3,47.',
        act: (el, done) => {
          let ok = false;
          zoomBoard(el, {
            lo: 2000, hi: 7000, split: 5, target: 3470, svgH: 460,
            onBadZoom: (L, seg) => Atlas.UI.toast(`3,47 n'est pas entre ${fmtv(L.lo + seg * L.step)} et ${fmtv(L.lo + (seg + 1) * L.step)} : regarde sa partie entière, puis ses dixièmes.`, 'bad'),
            onFlag: (f) => {
              if (ok) return;
              if (f.v === 3470) { ok = true; done(); } else Atlas.UI.toast(`Ici, c'est ${fmtv(f.v)}. Zoome encore pour trouver 3,47.`, 'bad');
            },
          });
        },
      },
    ],
    enigmes: {
      wagon: {
        title: 'Arrêter le wagon',
        consigne: '',
        build: (ctx) => buildWagon(ctx, ctx.el, { kinds: ['dixieme', 'centieme', 'pas'], onSolved: () => ctx.win('Les trois wagons s\'arrêtent pile ! Lire une droite graduée : on regarde de combien avance chaque graduation, et on zoome au besoin.') }),
      },
      filon: {
        title: 'Le filon caché',
        consigne: '',
        build: (ctx) => buildFilon(ctx, ctx.el, { energy: 14, w: 8, onSolved: (V) => ctx.win(`Le filon est quelque part entre ${fmtv(Math.floor(V / 10) * 10)} et ${fmtv(Math.floor(V / 10) * 10 + 10)} ! Encadrer, c'est trouver les deux graduations qui l'entourent, de plus en plus près.`) }),
      },
      minerais: {
        title: 'Le rangement des minerais',
        consigne: '',
        build: (ctx) => buildRange(ctx, ctx.el, { kinds: ['d', 'c'], onSolved: () => ctx.win('Bien rangé, bien intercalé ! Pour comparer des décimaux, on les écrit avec le même nombre de décimales. Et il y a toujours un nombre entre deux autres.') }),
      },
    },
    gardien: {
      title: 'L\'Éboulement',
      consigne: '',
      build: (ctx) => {
        buildFilon(ctx, ctx.el, {
          energy: 12, w: 8, tag: '<b>Étape 1 / 2</b> — L\'éboulement a enfoui le filon, et il reste peu d\'énergie. ',
          onSolved: () => {
            Atlas.UI.toast('Étape 1 réussie !', 'good');
            setTimeout(() => {
              buildRange(ctx, ctx.el, { mixed: true, kinds: ['c', 'm'], onSolved: () => ctx.win('Bravo ! Le passage est dégagé, les minerais sont rangés. Voici la page de l\'Atlas, et la loupe : elle te servira à trouver des trésors cachés.') });
            }, 900);
          },
        });
      },
    },
    tool: {
      id: 'loupe', name: 'Loupe',
      icon: '<svg viewBox="0 0 30 30"><circle cx="12" cy="12" r="8" fill="#a5f3fc" fill-opacity="0.6" stroke="#0b7285" stroke-width="3"/><line x1="18" y1="18" x2="27" y2="27" stroke="#6b4423" stroke-width="4" stroke-linecap="round"/></svg>',
    },
  });
})();
