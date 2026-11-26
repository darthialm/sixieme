/* =========================================================
   Région 3 — LA TOUR DU GUETTEUR · chapitre 3 « Distances et cercles »
   Attendus : cercle, centre, rayon, diamètre, corde ; point sur le cercle / dans le disque / dehors ;
   reporter une longueur au compas ; point à deux distances données de deux points (deux cercles) ;
   distance d'un point à une droite.
   Énigmes :
     tours     placer des tours et choisir la LARGEUR de leur lanterne (diamètre) pour éclairer toutes les maisons
               avec une réserve d'huile limitée : il faut passer du diamètre au rayon et trouver le centre.
     tresor    compas virtuel (centre + écartement) : deux cercles, deux points d'intersection, un indice pour choisir.
     messager  le messager rejoint la route : distance d'un point à une droite (perpendiculaire), puis on la lit.
   Gardien : la Nuit des voleurs (3 tours à placer, puis le butin du voleur à deux distances).
   ========================================================= */
(function () {
  'use strict';
  const { h, svg: S, geo } = Atlas;
  const VW = 800, VH = 500, U = 40;                 // 1 case = 40 unités du dessin
  const GX0 = 1, GX1 = 19, GY0 = 1, GY1 = 10;       // points de la grille utilisables
  const P = (gx, gy) => ({ x: gx * U, y: gy * U });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const f1 = (n) => Atlas.fmt(n, 1);
  const cs = (n) => (Math.abs(n) >= 2 ? 'cases' : 'case');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const inGrid = (g) => g.x >= GX0 && g.x <= GX1 && g.y >= GY0 && g.y <= GY1;

  /* ---------- Dessin : terrain, textes, icônes ---------- */
  function terrain(svg, { dock = false } = {}) {
    S.el('rect', { x: 0, y: 0, width: VW, height: VH, fill: '#c3e28f' }, svg);
    if (dock) S.el('rect', { x: 0, y: 432, width: VW, height: 68, fill: '#e3cd96' }, svg);
    const g = S.el('g', {}, svg);
    for (let gx = GX0; gx <= GX1; gx++) for (let gy = GY0; gy <= GY1; gy++) S.el('circle', { cx: gx * U, cy: gy * U, r: 2.2, fill: 'rgba(55,95,30,0.32)' }, g);
    return g;
  }
  const tx = (parent, x, y, text, fill = '#2b1d0e', size = 20, anchor = 'middle') =>
    S.el('text', { x, y, 'text-anchor': anchor, 'font-size': size, 'font-weight': 800, fill, stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', text }, parent);
  const seg = (parent, a, b, attrs) => S.el('line', Object.assign({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }, attrs), parent);

  function iconHouse(parent, p) {
    const g = S.el('g', { transform: `translate(${p.x},${p.y})` }, parent);
    S.el('rect', { x: -14, y: -9, width: 28, height: 20, rx: 2, fill: '#f6e7c8', stroke: '#7a4b24', 'stroke-width': 2 }, g);
    S.el('polygon', { points: '-18,-9 18,-9 0,-27', fill: '#c0392b', stroke: '#7a2a1d', 'stroke-width': 2 }, g);
    const win = S.el('rect', { x: -5, y: -3, width: 10, height: 10, fill: '#868e96' }, g);
    return { g, win };
  }
  function iconTower(parent, col, label) {
    const g = S.el('g', {}, parent);
    S.el('circle', { cx: 0, cy: 0, r: 6, fill: 'none', stroke: col, 'stroke-width': 3 }, g);
    S.el('rect', { x: -11, y: -34, width: 22, height: 36, rx: 3, fill: '#dfe3e8', stroke: '#495057', 'stroke-width': 2.5 }, g);
    S.el('polygon', { points: '-15,-34 15,-34 0,-53', fill: col, stroke: '#343a40', 'stroke-width': 2 }, g);
    S.el('circle', { cx: 0, cy: -20, r: 6, fill: '#ffd43b', stroke: '#e67700', 'stroke-width': 2 }, g);
    if (label) {
      S.el('circle', { cx: 0, cy: 15, r: 10, fill: col, stroke: '#fff', 'stroke-width': 2 }, g);
      S.el('text', { x: 0, y: 20, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800, fill: '#fff', text: label }, g);
    }
    return g;
  }
  const LANDMARKS = {
    puits: { name: 'le puits', de: 'du puits', short: 'Puits' },
    chene: { name: 'le vieux chêne', de: 'du vieux chêne', short: 'Chêne' },
    rocher: { name: 'le grand rocher', de: 'du grand rocher', short: 'Rocher' },
    moulin: { name: 'le moulin', de: 'du moulin', short: 'Moulin' },
  };
  function iconLandmark(parent, kind, p) {
    const g = S.el('g', { transform: `translate(${p.x},${p.y})` }, parent);
    if (kind === 'puits') {
      S.el('rect', { x: -15, y: -8, width: 30, height: 18, rx: 6, fill: '#9aa3ad', stroke: '#495057', 'stroke-width': 2 }, g);
      S.el('ellipse', { cx: 0, cy: -8, rx: 15, ry: 6, fill: '#2f86c4', stroke: '#495057', 'stroke-width': 2 }, g);
      S.el('polygon', { points: '-19,-16 19,-16 0,-32', fill: '#d9553a', stroke: '#7a2a1d', 'stroke-width': 2 }, g);
    } else if (kind === 'chene') {
      S.el('rect', { x: -5, y: -6, width: 10, height: 18, fill: '#7a4b24' }, g);
      S.el('circle', { cx: 0, cy: -16, r: 20, fill: '#2f9e44', stroke: '#1b6b2e', 'stroke-width': 2 }, g);
      S.el('circle', { cx: -9, cy: -10, r: 11, fill: '#37b24d' }, g);
    } else if (kind === 'rocher') {
      S.el('polygon', { points: '-20,10 -12,-14 4,-20 18,-6 22,10', fill: '#adb5bd', stroke: '#495057', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g);
      S.el('polygon', { points: '-12,-14 4,-20 6,-4 -6,2', fill: '#ced4da' }, g);
    } else {
      S.el('polygon', { points: '-13,12 13,12 8,-14 -8,-14', fill: '#f1e3c4', stroke: '#7a4b24', 'stroke-width': 2 }, g);
      S.el('g', { transform: 'translate(0,-16)' }, g);
      [0, 90, 180, 270].forEach((a) => S.el('polygon', { points: '0,0 -5,-26 5,-26', fill: '#e9ecef', stroke: '#495057', 'stroke-width': 1.5, transform: `rotate(${a + 45} 0 -16)` }, g));
      S.el('circle', { cx: 0, cy: -16, r: 4, fill: '#495057' }, g);
    }
    return g;
  }
  function iconChest(parent, p) {
    const g = S.el('g', { transform: `translate(${p.x},${p.y})` }, parent);
    S.el('rect', { x: -17, y: -8, width: 34, height: 20, rx: 3, fill: '#b07a43', stroke: '#5a3a1c', 'stroke-width': 2.5 }, g);
    S.el('path', { d: 'M-17,-8 Q0,-26 17,-8 Z', fill: '#c99358', stroke: '#5a3a1c', 'stroke-width': 2.5 }, g);
    S.el('rect', { x: -4, y: -6, width: 8, height: 9, fill: '#ffd43b', stroke: '#e67700', 'stroke-width': 1.5 }, g);
    return g;
  }
  function iconHole(parent, p) {
    const g = S.el('g', { transform: `translate(${p.x},${p.y})` }, parent);
    S.el('ellipse', { cx: 0, cy: 3, rx: 17, ry: 9, fill: '#7a4b24' }, g);
    S.el('ellipse', { cx: 0, cy: 3, rx: 12, ry: 6, fill: '#3b2412' }, g);
    return g;
  }
  function rightMark(parent, V, u, n, s = 12, color = '#2b1d0e') {
    const a = { x: V.x + u.x * s, y: V.y + u.y * s }, c = { x: V.x + (u.x + n.x) * s, y: V.y + (u.y + n.y) * s }, b = { x: V.x + n.x * s, y: V.y + n.y * s };
    return S.el('path', { d: `M${a.x},${a.y} L${c.x},${c.y} L${b.x},${b.y}`, fill: 'none', stroke: color, 'stroke-width': 3 }, parent);
  }

  /* ================================================================
     LE COMPAS VIRTUEL : on déplace la pointe (centre) et on écarte la mine (écartement en cases).
     ================================================================ */
  const COLORS = ['#e8590c', '#1c7ed6', '#7048e8', '#0b7285'];
  function Compas(svg, { c = P(10, 7), r = 3, th = -0.4, snapPts = [], lockCenter = false, maxR = 10, onChange } = {}) {
    const C = { c, r, th };
    const g = S.el('g', {}, svg);
    const legN = S.el('line', { stroke: '#6c757d', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
    const legP = S.el('line', { stroke: '#e8590c', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
    const hinge = S.el('circle', { r: 10, fill: '#495057', stroke: '#fff', 'stroke-width': 3 }, g);
    const tag = S.el('text', { 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: '#7c2d12', stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke' }, g);
    const needle = S.el('g', {}, g);
    S.el('circle', { r: 8, fill: '#343a40', stroke: '#fff', 'stroke-width': 3 }, needle);
    S.el('circle', { r: 32, fill: 'transparent' }, needle);
    const pen = S.el('g', {}, g);
    S.el('circle', { r: 8, fill: '#e8590c', stroke: '#fff', 'stroke-width': 3 }, pen);
    S.el('circle', { r: 32, fill: 'transparent' }, pen);
    C.pencil = () => ({ x: C.c.x + Math.cos(C.th) * C.r * U, y: C.c.y + Math.sin(C.th) * C.r * U });
    C.draw = () => {
      const A = C.c, B = C.pencil();
      const len = C.r * U;
      const u = { x: Math.cos(C.th), y: Math.sin(C.th) };
      let n = { x: u.y, y: -u.x };
      if (n.y > 0) n = { x: -n.x, y: -n.y };
      const L = Math.max(len * 0.8, 90), hgt = Math.sqrt(L * L - (len / 2) ** 2);
      const Hg = { x: (A.x + B.x) / 2 + n.x * hgt, y: (A.y + B.y) / 2 + n.y * hgt };
      legN.setAttribute('x1', Hg.x); legN.setAttribute('y1', Hg.y); legN.setAttribute('x2', A.x); legN.setAttribute('y2', A.y);
      legP.setAttribute('x1', Hg.x); legP.setAttribute('y1', Hg.y); legP.setAttribute('x2', B.x); legP.setAttribute('y2', B.y);
      hinge.setAttribute('cx', Hg.x); hinge.setAttribute('cy', Hg.y);
      tag.setAttribute('x', clamp(Hg.x, 70, VW - 70)); tag.setAttribute('y', Math.max(22, Hg.y - 16));
      tag.textContent = `écartement : ${C.r} case${C.r > 1 ? 's' : ''}`;
      needle.setAttribute('transform', `translate(${A.x},${A.y})`);
      pen.setAttribute('transform', `translate(${B.x},${B.y})`);
      if (onChange) onChange(C);
    };
    C.setR = (v) => { C.r = clamp(v, 1, maxR); C.draw(); };
    S.drag(pen, svg, {
      move: (p) => {
        const dx = p.x - C.c.x, dy = p.y - C.c.y;
        C.r = clamp(Math.round(Math.hypot(dx, dy) / U), 1, maxR);
        C.th = Math.atan2(dy, dx);
        C.draw();
      },
    });
    if (!lockCenter) {
      S.drag(needle, svg, {
        move: (p) => {
          let best = null;
          snapPts.forEach((q) => { if (dist(q, p) < 30 && (!best || dist(q, p) < dist(best, p))) best = q; });
          C.c = best ? { x: best.x, y: best.y } : { x: clamp(Math.round(p.x / U), GX0, GX1) * U, y: clamp(Math.round(p.y / U), GY0, GY1) * U };
          C.draw();
        },
      });
    } else needle.style.pointerEvents = 'none';
    /* Trace le cercle au compas dans `layer` ; renvoie {c, r (en cases)}. */
    C.trace = (layer, color) => {
      const R = C.r * U, per = 2 * Math.PI * R;
      const el = S.el('circle', { cx: C.c.x, cy: C.c.y, r: R, fill: color + '14', stroke: color, 'stroke-width': 4, 'stroke-dasharray': per, 'stroke-dashoffset': per, style: 'transition:stroke-dashoffset .9s ease' }, layer);
      setTimeout(() => { el.style.strokeDashoffset = 0; }, 30);
      setTimeout(() => { el.removeAttribute('stroke-dasharray'); el.style.transition = ''; }, 1200);
      return { c: { x: C.c.x, y: C.c.y }, r: C.r, el };
    };
    C.draw();
    return C;
  }

  /* ================================================================
     ÉNIGME « tours » : placer des tours, choisir la LARGEUR (diamètre) de leur lanterne
     ================================================================ */
  function genClusters(r, n) {
    const circ = (rr) => { const o = []; for (let x = -rr; x <= rr; x++) for (let y = -rr; y <= rr; y++) if (x * x + y * y === rr * rr) o.push([x, y]); return o; };
    for (let t = 0; t < 4000; t++) {
      const cl = [];
      let ok = true;
      for (let i = 0; i < n && ok; i++) {
        const rr = r.pick([3, 3, 4, 4, 5]);
        const ring = circ(rr);
        const o = r.pick(ring);
        const lox = 1 + Math.abs(o[0]), hix = GX1 - Math.abs(o[0]), loy = 1 + Math.abs(o[1]), hiy = GY1 - Math.abs(o[1]);
        if (lox > hix || loy > hiy) { ok = false; break; }
        const c = { x: r.int(lox, hix), y: r.int(loy, hiy) };
        if (cl.some((q) => Math.hypot(q.c.x - c.x, q.c.y - c.y) < q.rr + rr + 2)) { ok = false; break; }
        const hs = [{ x: c.x + o[0], y: c.y + o[1] }, { x: c.x - o[0], y: c.y - o[1] }];
        const extra = r.chance(0.6) ? 1 : 2;
        for (let k = 0; k < extra; k++) {
          let hs3 = null;
          for (let z = 0; z < 60 && !hs3; z++) {
            let cand;
            if (k === 0 && r.chance(0.6)) { const q = r.pick(ring); cand = { x: c.x + q[0], y: c.y + q[1] }; }
            else { cand = { x: c.x + r.int(-rr, rr), y: c.y + r.int(-rr, rr) }; const dd = Math.hypot(cand.x - c.x, cand.y - c.y); if (dd > rr - 0.01 || dd < 1.5) continue; }
            if (!inGrid(cand) || hs.some((q) => q.x === cand.x && q.y === cand.y)) continue;
            hs3 = cand;
          }
          if (hs3) hs.push(hs3);
        }
        cl.push({ c, rr, houses: hs });
      }
      if (ok && cl.length === n) return cl;
    }
    throw new Error('tour: tirage impossible');
  }

  function buildTours(ctx, host, { n = 2, slack = 2, lead = '', onSolved }) {
    const r = ctx.rng;
    const cl = genClusters(r, n);
    const houses = [];
    cl.forEach((c) => c.houses.forEach((q) => houses.push(q)));
    const budget = cl.reduce((s, c) => s + 2 * c.rr, 0) + slack;
    host.innerHTML = '';
    ctx.consigne.innerHTML = `${lead}Protège <b>toutes les maisons</b> avec <b>${n} tours</b>. Une lanterne éclaire un disque ; sa taille est sa <b>largeur</b>, de bord à bord. L'huile est limitée !`;
    const svg = S.root(host, VW, VH);
    svg.style.touchAction = 'none';
    terrain(svg, { dock: true });
    tx(svg, 780, 462, 'Fais glisser chaque tour sur la carte', '#7c4a00', 17, 'end');
    const disks = S.el('g', {}, svg);
    houses.forEach((q) => { q.icon = iconHouse(svg, P(q.x, q.y)); });
    const cols = ['#1c7ed6', '#e8590c', '#7048e8'];
    const towers = [];
    for (let i = 0; i < n; i++) {
      const t = { i, gx: 0, gy: 0, placed: false, D: 6, col: cols[i] };
      t.dock = { x: 70 + i * 90, y: 474 };
      t.g = iconTower(svg, t.col, String(i + 1));
      t.hit = S.el('circle', { cx: 0, cy: -18, r: 30, fill: 'transparent' }, t.g);
      t.pos = () => (t.placed ? P(t.gx, t.gy) : t.dock);
      t.put = () => { const p = t.pos(); t.g.setAttribute('transform', `translate(${p.x},${p.y})`); };
      t.put();
      let off = { x: 0, y: 0 };
      S.drag(t.g, svg, {
        start: (p) => { if (busy) return false; const q = t.pos(); off = { x: q.x - p.x, y: q.y - p.y }; },
        move: (p) => {
          t.gx = clamp(Math.round((p.x + off.x) / U), GX0, GX1);
          t.gy = clamp(Math.round((p.y + off.y) / U), GY0, GY1);
          t.placed = true;
          t.put();
        },
      });
      towers.push(t);
    }
    const fx = S.el('g', { 'pointer-events': 'none' }, svg);
    let busy = false;

    const ctrl = h('div', { class: 'puz-tools', style: 'flex-wrap:wrap;gap:10px;align-items:center' });
    const budgetEl = h('div', { style: 'font-weight:800;font-size:18px' });
    const refresh = () => {
      const used = towers.reduce((s, t) => s + t.D, 0);
      budgetEl.textContent = `🛢️ Huile : ${used} / ${budget} cases de large au total`;
      budgetEl.style.color = used > budget ? '#e03131' : '#2b1d0e';
    };
    towers.forEach((t) => {
      const val = h('b', { style: 'min-width:7.5em;display:inline-block;text-align:center' }, '');
      const upd = () => { val.textContent = `${t.D} cases de large`; refresh(); };
      ctrl.append(h('div', { style: `display:flex;align-items:center;gap:6px;background:#fff8e1;border:2px solid ${t.col};border-radius:12px;padding:4px 8px` },
        h('span', { style: `font-weight:800;color:${t.col}` }, `Tour ${t.i + 1}`),
        h('button', { class: 'btn', onclick: () => { if (busy) return; t.D = Math.max(2, t.D - 2); upd(); } }, '−'),
        val,
        h('button', { class: 'btn', onclick: () => { if (busy) return; t.D = Math.min(16, t.D + 2); upd(); } }, '+')));
      upd();
    });
    const go = h('button', { class: 'btn btn-go' }, '🔥 Allumer les tours');
    host.append(ctrl, h('div', { style: 'text-align:center;margin:6px 0' }, budgetEl), h('div', { class: 'puz-tools' }, go));

    go.onclick = () => {
      if (busy) return;
      if (towers.some((t) => !t.placed)) return Atlas.UI.toast('Place d\'abord toutes les tours sur la carte.', 'bad');
      const used = towers.reduce((s, t) => s + t.D, 0);
      if (used > budget) return Atlas.UI.toast(`Trop d'huile : ${used} cases de large, mais ${budget} au maximum.`, 'bad');
      busy = true;
      disks.innerHTML = ''; fx.innerHTML = '';
      towers.forEach((t) => {
        const p = P(t.gx, t.gy);
        const gg = S.el('g', { transform: `translate(${p.x},${p.y})` }, disks);
        S.el('circle', { r: (t.D / 2) * U, fill: 'rgba(255,224,102,0.38)', stroke: '#f59f00', 'stroke-width': 4, style: 'transform:scale(0);transition:transform .7s ease-out' }, gg);
        setTimeout(() => { gg.firstChild.style.transform = 'scale(1)'; }, 30);
      });
      setTimeout(evaluate, 950);
    };

    function evaluate() {
      const reach = (t, q) => Math.hypot(t.gx - q.x, t.gy - q.y);
      const out = houses.filter((q) => !towers.some((t) => reach(t, q) <= t.D / 2 + 1e-9));
      if (!out.length) {
        houses.forEach((q) => q.icon.win.setAttribute('fill', '#ffd43b'));
        towers.forEach((t) => {
          const p = P(t.gx, t.gy), rr = (t.D / 2) * U;
          seg(fx, p, { x: p.x + rr, y: p.y }, { stroke: '#2b1d0e', 'stroke-width': 3, 'stroke-dasharray': '6 5' });
          tx(fx, p.x + rr / 2, p.y - 8, `rayon ${t.D / 2}`, '#7c2d12', 17);
        });
        Atlas.UI.toast('Tout le village est protégé !', 'good');
        return setTimeout(onSolved, 1500);
      }
      // une maison hors de portée : de préférence celle qui trahit la confusion rayon / diamètre
      let pick = null;
      for (const q of out) {
        const t = towers.slice().sort((a, b) => reach(a, q) - reach(b, q))[0];
        const d = reach(t, q);
        if (d > t.D / 2 && d <= t.D + 1e-9) { pick = { q, t, d, conf: true }; break; }
        if (!pick) pick = { q, t, d, conf: false };
      }
      const { q, t, d, conf } = pick;
      const p = P(t.gx, t.gy), hp = P(q.x, q.y), rr = t.D / 2;
      const ux = (hp.x - p.x) / (d * U), uy = (hp.y - p.y) / (d * U);
      S.el('circle', { cx: hp.x, cy: hp.y, r: 24, fill: 'none', stroke: '#e03131', 'stroke-width': 5 }, fx);
      seg(fx, p, hp, { stroke: '#e03131', 'stroke-width': 4, 'stroke-dasharray': '8 6' });
      tx(fx, (p.x + hp.x) / 2, (p.y + hp.y) / 2 - 10, `${f1(d)} ${cs(d)}`, '#c92a2a', 18);
      let msg;
      if (conf) {
        seg(fx, { x: p.x - ux * rr * U, y: p.y - uy * rr * U }, { x: p.x + ux * rr * U, y: p.y + uy * rr * U }, { stroke: '#2b1d0e', 'stroke-width': 3 });
        S.el('circle', { cx: p.x + ux * rr * U, cy: p.y + uy * rr * U, r: 6, fill: '#2f9e44' }, fx);
        msg = `La lanterne de la tour ${t.i + 1} fait <b>${t.D} cases de large</b> : c'est son <b>diamètre</b>. Elle n'éclaire que <b>${rr} ${cs(rr)}</b> autour de la tour : c'est le <b>rayon</b>, la moitié du diamètre. La maison est à ${f1(d)} ${cs(d)}.`;
      } else {
        seg(fx, p, { x: p.x + ux * rr * U, y: p.y + uy * rr * U }, { stroke: '#2f9e44', 'stroke-width': 6 });
        msg = `Cette maison est à ${f1(d)} ${cs(d)} de la tour ${t.i + 1}, mais la lumière n'atteint que ${rr} ${cs(rr)} (le rayon). Elle est <b>dehors</b> du disque. Rapproche la tour ou agrandis la lanterne.`;
      }
      const left = ctx.fail(msg);
      if (left > 0) setTimeout(() => { disks.innerHTML = ''; fx.innerHTML = ''; busy = false; }, 4200);
    }
    ctx.pi('Une lanterne de <b>8 cases de large</b> : jusqu\'où éclaire-t-elle <i>autour de la tour</i> ? Compte les cases entre les points de la grille.');
  }

  /* ================================================================
     ÉNIGME « trésor à deux distances » (aussi dans le gardien, en plus dur)
     ================================================================ */
  const ZONES = [
    { name: 'champ de blé', col: '#f2c94c' },
    { name: 'pré de fleurs', col: '#f783ac' },
    { name: 'verger', col: '#ff8787' },
  ];
  function genTreasure(r, hard) {
    const offs = (a) => {
      const o = [[a, 0], [-a, 0], [0, a], [0, -a]];
      if (a === 5) o.push([3, 4], [3, -4], [-3, 4], [-3, -4], [4, 3], [4, -3], [-4, 3], [-4, -3]);
      return o;
    };
    for (let t = 0; t < 4000; t++) {
      const X = { x: r.int(3, 17), y: r.int(3, 8) };
      const a = r.int(3, 6), b = hard ? r.int(3, 5) : r.int(3, 6);
      const oa = r.pick(offs(a)), ob = r.pick(offs(b));
      if (oa[0] * ob[1] - oa[1] * ob[0] === 0) continue;
      const Pp = { x: X.x + oa[0], y: X.y + oa[1] }, Cc = { x: X.x + ob[0], y: X.y + ob[1] };
      if (!inGrid(Pp) || !inGrid(Cc)) continue;
      const dx = Cc.x - Pp.x, dy = Cc.y - Pp.y, L = Math.hypot(dx, dy);
      if (L < 2.5) continue;
      const hh = Math.abs((X.x - Pp.x) * dy - (X.y - Pp.y) * dx) / L;
      if (hh < 1.8) continue;
      const pr = geo.project(X, Pp, Cc);
      const Xp = { x: 2 * pr.x - X.x, y: 2 * pr.y - X.y };
      if (Xp.x < 1.2 || Xp.x > 18.8 || Xp.y < 1.2 || Xp.y > 9.8) continue;
      return { X, P: Pp, C: Cc, a, b, Xp };
    }
    throw new Error('tresor: tirage impossible');
  }

  function buildTresor(ctx, host, { rounds = 2, hard = false, lead = '', onSolved }) {
    const r = ctx.rng;
    let k = 0;
    const one = () => {
      if (k >= rounds) return onSolved();
      const D = genTreasure(r, hard || k === 1);
      const diamRound = hard || k === 1;
      const kinds = r.shuffle(Object.keys(LANDMARKS));
      const kP = kinds[0], kC = kinds[1];
      const zone = r.pick(ZONES);
      const Xp = P(D.X.x, D.X.y), Pp = P(D.P.x, D.P.y), Cp = P(D.C.x, D.C.y), X2 = { x: D.Xp.x * U, y: D.Xp.y * U };
      host.innerHTML = '';
      const nm = (q) => LANDMARKS[q].name, de = (q) => LANDMARKS[q].de;
      ctx.consigne.innerHTML = `${lead}${rounds > 1 ? `Trésor ${k + 1} / ${rounds} — ` : ''}Le coffre est à <b>${D.a} cases</b> ${de(kP)}, ` +
        (diamRound ? `et sur le cercle de centre ${nm(kC)} qui mesure <b>${2 * D.b} cases de diamètre</b>.` : `et à <b>${D.b} cases</b> ${de(kC)}.`) +
        ` Indice : il est dans le <b>${zone.name}</b>.`;
      const svg = S.root(host, VW, VH);
      svg.style.touchAction = 'none';
      terrain(svg);
      S.el('ellipse', { cx: Xp.x, cy: Xp.y, rx: 58, ry: 50, fill: zone.col, opacity: 0.55, stroke: '#7c4a00', 'stroke-width': 3, 'stroke-dasharray': '8 6' }, svg);
      tx(svg, Xp.x, Xp.y - 58, zone.name, '#7c4a00', 16);
      const circles = S.el('g', { 'pointer-events': 'none' }, svg);
      iconLandmark(svg, kP, Pp); tx(svg, Pp.x, Pp.y + 30, LANDMARKS[kP].short, '#1c5aa0', 16);
      iconLandmark(svg, kC, Cp); tx(svg, Cp.x, Cp.y + 30, LANDMARKS[kC].short, '#1c5aa0', 16);
      const markL = S.el('g', { 'pointer-events': 'none' }, svg);
      const fx = S.el('g', { 'pointer-events': 'none' }, svg);
      const drawn = [];
      let marker = null, busy = false;
      let rLab = null;
      const compas = Compas(svg, { c: P(10, 9), r: 3, th: -0.5, snapPts: [Pp, Cp], onChange: (C) => { if (rLab) rLab.textContent = `${C.r} case${C.r > 1 ? 's' : ''}`; } });
      rLab = h('b', { style: 'min-width:5.5em;display:inline-block;text-align:center' }, `${compas.r} cases`);
      const inters = () => {
        const out = [];
        for (let i = 0; i < drawn.length; i++) for (let j = i + 1; j < drawn.length; j++) geo.circles(drawn[i].c, drawn[i].r * U, drawn[j].c, drawn[j].r * U).forEach((q) => out.push(q));
        return out;
      };
      const setMarker = (p) => {
        marker = p;
        markL.innerHTML = '';
        S.el('circle', { cx: p.x, cy: p.y, r: 13, fill: 'rgba(224,49,49,0.18)', stroke: '#e03131', 'stroke-width': 3 }, markL);
        seg(markL, { x: p.x - 9, y: p.y }, { x: p.x + 9, y: p.y }, { stroke: '#e03131', 'stroke-width': 3 });
        seg(markL, { x: p.x, y: p.y - 9 }, { x: p.x, y: p.y + 9 }, { stroke: '#e03131', 'stroke-width': 3 });
      };
      svg.addEventListener('pointerdown', (e) => {
        if (busy) return;
        let p = S.pt(svg, e), best = null;
        inters().forEach((q) => { if (dist(q, p) < 28 && (!best || dist(q, p) < dist(best, p))) best = q; });
        setMarker(best || p);
      });

      const bMinus = h('button', { class: 'btn', onclick: () => compas.setR(compas.r - 1) }, '−');
      const bPlus = h('button', { class: 'btn', onclick: () => compas.setR(compas.r + 1) }, '+');
      const bTrace = h('button', { class: 'btn', onclick: () => {
        if (busy) return;
        if (drawn.length >= 4) return Atlas.UI.toast('Déjà 4 cercles : efface-les d\'abord.', 'bad');
        const sp = compas.trace(circles, COLORS[drawn.length % 4]);
        drawn.push(sp);
      } }, '✏️ Tracer le cercle');
      const bClear = h('button', { class: 'btn', onclick: () => { if (busy) return; circles.innerHTML = ''; drawn.length = 0; } }, '🧽 Effacer les cercles');
      const bDig = h('button', { class: 'btn btn-go' }, '⛏️ Creuser ici');
      host.append(
        h('div', { class: 'puz-tools', style: 'flex-wrap:wrap;gap:8px;align-items:center' }, h('span', { style: 'font-weight:700' }, 'Écartement du compas :'), bMinus, rLab, bPlus, bTrace, bClear),
        h('div', { class: 'puz-tools' }, bDig));

      bDig.onclick = () => {
        if (busy) return;
        if (!marker) return Atlas.UI.toast('Touche la carte à l\'endroit où tu veux creuser.', 'bad');
        busy = true;
        const M = marker;
        const m1 = dist(M, Pp) / U, m2 = dist(M, Cp) / U;
        if (dist(M, Xp) <= 16) {
          markL.innerHTML = '';
          iconChest(fx, Xp);
          Atlas.UI.toast('Le coffre ! ' + (k + 1 < rounds ? '' : '★'), 'good');
          k++;
          return setTimeout(one, 1700);
        }
        iconHole(fx, M);
        const ok1 = Math.abs(m1 - D.a) < 0.3, ok2 = Math.abs(m2 - D.b) < 0.3;
        seg(fx, Pp, M, { stroke: ok1 ? '#2f9e44' : '#e03131', 'stroke-width': 4, 'stroke-dasharray': '8 6' });
        seg(fx, Cp, M, { stroke: ok2 ? '#2f9e44' : '#e03131', 'stroke-width': 4, 'stroke-dasharray': '8 6' });
        tx(fx, (Pp.x + M.x) / 2, (Pp.y + M.y) / 2 - 8, `${f1(m1)}`, ok1 ? '#2b8a3e' : '#c92a2a', 18);
        tx(fx, (Cp.x + M.x) / 2, (Cp.y + M.y) / 2 - 8, `${f1(m2)}`, ok2 ? '#2b8a3e' : '#c92a2a', 18);
        let msg;
        if (dist(M, X2) <= 16) {
          iconChest(fx, { x: -100, y: -100 });
          S.el('circle', { cx: Xp.x, cy: Xp.y, r: 22, fill: 'none', stroke: '#2f9e44', 'stroke-width': 5, 'stroke-dasharray': '6 5' }, fx);
          msg = `Trou vide ! Ce point est bien à ${D.a} cases ${de(kP)} et à ${D.b} ${de(kC)}… mais deux cercles se coupent en <b>deux points</b>. L'indice dit « ${zone.name} » : le coffre est à l'<b>autre point</b> d'intersection (cercle vert).`;
        } else if (diamRound && drawn.some((c) => dist(c.c, Cp) < 12 && c.r === 2 * D.b)) {
          msg = `Trou vide ! Tu as écarté le compas de <b>${2 * D.b} cases</b> autour ${de(kC)}. Mais ${2 * D.b} cases, c'est le <b>diamètre</b> : le compas se règle sur le <b>rayon</b>, la moitié, soit ${D.b} cases.`;
        } else {
          msg = `Trou vide ! Ici, c'est à ${f1(m1)} cases ${de(kP)} (il en faut ${D.a}) et à ${f1(m2)} ${de(kC)} (il en faut ${D.b}). Trace <b>deux cercles</b> avec le compas, centrés sur les repères : le coffre est sur les deux.`;
        }
        const left = ctx.fail(msg);
        if (left > 0) setTimeout(() => { fx.innerHTML = ''; markL.innerHTML = ''; marker = null; busy = false; }, 4600);
      };
      ctx.pi(k === 0
        ? 'Pose la <b>pointe</b> du compas sur un repère, écarte la <b>mine</b> de la bonne distance, puis trace. Fais pareil avec l\'autre repère. Touche un point où les cercles se croisent !'
        : 'Attention aux mots : le <b>diamètre</b> n\'est pas le <b>rayon</b>. Le compas se règle sur le rayon.');
    };
    one();
  }

  /* ================================================================
     ÉNIGME « messager » : distance d'un point à une droite
     ================================================================ */
  function buildMessager(ctx, host, { rounds = 2, lead = '', onSolved }) {
    const r = ctx.rng;
    let k = 0;
    const one = () => {
      if (k >= rounds) return onSolved();
      host.innerHTML = '';
      let u;
      if (k === 0) u = r.pick([{ x: 1, y: 0 }, { x: 0, y: 1 }]);
      else { const s = r.pick([[4, 3], [4, -3], [3, 4], [3, -4]]); u = { x: s[0] / 5, y: s[1] / 5 }; }
      let H, d, nrm, T, tries = 0;
      do {
        H = P(r.int(5, 15), r.int(4, 8));
        d = r.int(3, 5);
        const sg = r.pick([-1, 1]);
        nrm = { x: -u.y * sg, y: u.x * sg };
        T = { x: H.x + nrm.x * d * U, y: H.y + nrm.y * d * U };
        tries++;
      } while ((T.x < 40 || T.x > 760 || T.y < 50 || T.y > 440) && tries < 500);
      const tilted = k > 0;
      const kB = r.pick([-1, 1]) * r.int(3, 5);
      const B = { x: H.x + u.x * kB * U, y: H.y + u.y * kB * U };
      const vertDrop = tilted ? Math.abs(T.y - (H.y + ((T.x - H.x) * u.y) / u.x)) / U : null;
      ctx.consigne.innerHTML = `${lead}Course ${k + 1} / ${rounds} — Le messager part de la <b>tour</b> et doit rejoindre la <b>route</b> par le <b>chemin le plus court</b>. Place le point <b>M</b> d'arrivée, puis envoie-le.`;
      const svg = S.root(host, VW, VH);
      svg.style.touchAction = 'none';
      terrain(svg);
      const far = (p, s) => ({ x: p.x + u.x * s, y: p.y + u.y * s });
      seg(svg, far(H, -1500), far(H, 1500), { stroke: '#c9a46a', 'stroke-width': 30 });
      seg(svg, far(H, -1500), far(H, 1500), { stroke: '#f1deb2', 'stroke-width': 3, 'stroke-dasharray': '16 12' });
      tx(svg, clamp(far(H, 6 * U * (u.x >= 0 ? 1 : -1)).x, 60, 740), clamp(far(H, 6 * U * (u.x >= 0 ? 1 : -1)).y - 24, 30, 470), 'la route', '#7a4b24', 18);
      // borne (repère en biais, piège classique)
      S.el('rect', { x: B.x - 5, y: B.y - 26, width: 10, height: 26, fill: '#b07a43', stroke: '#5a3a1c', 'stroke-width': 2 }, svg);
      S.el('circle', { cx: B.x, cy: B.y, r: 6, fill: '#7a4b24' }, svg);
      tx(svg, B.x, B.y - 32, 'borne', '#5a3a1c', 14);
      const tw = iconTower(S.el('g', { transform: `translate(${T.x},${T.y})` }, svg), '#c0392b', '');
      tx(svg, T.x, T.y + 24, 'tour', '#7c2d12', 16);
      const eqL = S.el('g', { 'pointer-events': 'none' }, svg);
      const fx = S.el('g', { 'pointer-events': 'none' }, svg);
      // point M : se déplace sur la route
      const M0 = r.pick([-1, 1]) * r.int(2, 4);
      let sM = M0 * U, eqOn = false, busy = false, phase = 'place';
      const Mp = () => ({ x: H.x + u.x * sM, y: H.y + u.y * sM });
      const mG = S.el('g', {}, svg);
      S.el('circle', { r: 14, fill: '#fab005', stroke: '#fff', 'stroke-width': 3 }, mG);
      S.el('text', { y: 6, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: '#7c4a00', text: 'M' }, mG);
      S.el('circle', { r: 28, fill: 'transparent' }, mG);
      const guide = S.el('line', { stroke: '#7c4a00', 'stroke-width': 3, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round', 'pointer-events': 'none' }, svg);
      const place = () => {
        const p = Mp();
        mG.setAttribute('transform', `translate(${p.x},${p.y})`);
        guide.setAttribute('x1', T.x); guide.setAttribute('y1', T.y); guide.setAttribute('x2', p.x); guide.setAttribute('y2', p.y);
        eqL.innerHTML = '';
        if (eqOn) {
          const a = { x: p.x + u.x * 90, y: p.y + u.y * 90 }, b = { x: p.x + nrm.x * 260, y: p.y + nrm.y * 260 };
          S.el('polygon', { points: `${p.x},${p.y} ${a.x},${a.y} ${b.x},${b.y}`, fill: 'rgba(116,192,252,0.45)', stroke: '#1864ab', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, eqL);
          rightMark(eqL, p, u, nrm, 16, '#1864ab');
        }
      };
      S.drag(mG, svg, {
        start: () => { if (busy || phase !== 'place') return false; },
        move: (p) => {
          const s = (p.x - H.x) * u.x + (p.y - H.y) * u.y;
          const q = { x: H.x + u.x * s, y: H.y + u.y * s };
          if (q.x > 12 && q.x < VW - 12 && q.y > 12 && q.y < VH - 12) sM = s;
          place();
        },
      });
      place();

      const bEq = h('button', { class: 'btn', onclick: () => { eqOn = !eqOn; bEq.classList.toggle('on', eqOn); place(); } }, '📐 Équerre');
      const bSend = h('button', { class: 'btn btn-go' }, '🏃 Envoyer le messager');
      const tools = h('div', { class: 'puz-tools' }, bEq, bSend);
      host.append(tools);

      const runner = (A, B2, ms, done) => {
        const dot = S.el('circle', { r: 11, fill: '#e8590c', stroke: '#fff', 'stroke-width': 3 }, fx);
        const t0 = performance.now();
        const tick = (t) => {
          const q = Math.min(1, (t - t0) / ms);
          dot.setAttribute('cx', A.x + (B2.x - A.x) * q); dot.setAttribute('cy', A.y + (B2.y - A.y) * q);
          if (q < 1) requestAnimationFrame(tick); else done();
        };
        requestAnimationFrame(tick);
      };

      bSend.onclick = () => {
        if (busy || phase !== 'place') return;
        busy = true;
        const M = Mp();
        fx.innerHTML = '';
        runner(T, M, 900, () => {
          if (dist(M, H) <= 16) {
            phase = 'measure';
            sM = 0; place();
            fx.innerHTML = '';
            seg(fx, T, H, { stroke: '#2f9e44', 'stroke-width': 6, 'stroke-linecap': 'round' });
            rightMark(fx, H, u, { x: -nrm.x, y: -nrm.y }, 16, '#2b1d0e');
            for (let i = 1; i <= d; i++) {
              const q = { x: T.x - nrm.x * i * U, y: T.y - nrm.y * i * U };
              seg(fx, { x: q.x - u.x * 8, y: q.y - u.y * 8 }, { x: q.x + u.x * 8, y: q.y + u.y * 8 }, { stroke: '#1b6b2e', 'stroke-width': 3 });
              if (i < d) tx(fx, q.x + u.x * 20, q.y + u.y * 20 + 5, String(i), '#1b6b2e', 14);
            }
            Atlas.UI.toast('Le messager arrive par le plus court chemin !', 'good');
            ctx.pi('Bien joué : le trajet est <b>perpendiculaire</b> à la route. Combien de cases mesure-t-il ? Compte les graduations.', 'good');
            tools.style.display = 'none';
            const ans = Atlas.UI.answer(host, {
              label: 'Distance de la tour à la route :', unit: 'cases',
              onSubmit: (v) => {
                if (Math.abs(v - d) < 1e-9) {
                  ans.row.remove();
                  Atlas.UI.toast('Oui : ' + d + ' cases.', 'good');
                  k++;
                  return setTimeout(one, 1000);
                }
                const dB = dist(T, B) / U;
                let msg;
                fx.querySelectorAll('.err').forEach((e) => e.remove());
                const eg = S.el('g', { class: 'err' }, fx);
                if (tilted && Math.abs(v - vertDrop) < 0.3) {
                  const yy = H.y + ((T.x - H.x) * u.y) / u.x;
                  seg(eg, T, { x: T.x, y: yy }, { stroke: '#e03131', 'stroke-width': 4, 'stroke-dasharray': '8 6' });
                  msg = 'Tu as mesuré tout droit vers le bas : ce trajet est <b>en biais</b> par rapport à la route. La distance se mesure <b>perpendiculairement</b> à la route (le trait vert, avec l\'angle droit).';
                } else if (Math.abs(v - dB) < 0.3) {
                  seg(eg, T, B, { stroke: '#e03131', 'stroke-width': 4, 'stroke-dasharray': '8 6' });
                  msg = 'Tu as mesuré jusqu\'à la <b>borne</b> : c\'est un trajet en biais, plus long. La distance de la tour à la route est la longueur du trait <b>perpendiculaire</b> (en vert).';
                } else {
                  msg = 'Ce n\'est pas ça. Compte les graduations le long du <b>trait vert</b> : de la tour jusqu\'à l\'angle droit sur la route.';
                }
                const left = ctx.fail(msg);
                if (left > 0) setTimeout(() => eg.remove(), 4200);
              },
            });
          } else {
            const len = dist(T, M) / U;
            seg(fx, T, M, { stroke: '#e03131', 'stroke-width': 5, 'stroke-dasharray': '8 6' });
            seg(fx, T, H, { stroke: '#2f9e44', 'stroke-width': 5 });
            rightMark(fx, H, u, { x: -nrm.x, y: -nrm.y }, 16, '#2b1d0e');
            const left = ctx.fail(`Ce trajet est <b>en biais</b> : il mesure ${f1(len)} cases, c'est trop long ! Le plus court chemin (en vert) arrive à <b>angle droit</b> sur la route. Essaie avec l'équerre.`);
            if (left > 0) setTimeout(() => { fx.innerHTML = ''; busy = false; }, 4000);
          }
        });
      };
      ctx.pi(k === 0 ? 'Fais glisser <b>M</b> le long de la route. Où le trajet est-il le plus court ? L\'équerre peut t\'aider.' : 'La route est penchée cette fois. Le plus court chemin est toujours le même genre de chemin…');
    };
    one();
  }

  /* ---------- La carte de la tour ---------- */
  const W = 26, HH = 18;
  const map = Atlas.buildMap(W, HH, (m) => {
    m.border('T');
    m.rect(8, 1, 17, 7, 'g');           // la colline (gravier)
    m.rect(9, 2, 16, 6, ':');           // le sommet
    m.rect(12, 8, 13, 17, '=');         // chemin vers le village (sud)
    m.rect(7, 10, 18, 11, '=');         // petite place de la vallée
    m.rect(20, 2, 23, 4, '~');          // la mare
    m.rect(2, 14, 4, 16, ':');          // jardin en terre
    m.sprinkle(',', 6, 3);
    m.sprinkle('*', 12, 9);
    m.sprinkle('R', 55, 4);
    [[6, 7], [16, 12], [17, 12], [22, 10], [15, 8], [14, 5], [11, 5], [7, 7], [6, 12], [24, 12], [25, 13]].forEach(([x, y]) => { if (m.get(x, y) !== ':') m.set(x, y, '.'); });
    [[5, 3, 'B'], [6, 5, 'T'], [3, 7, 'A'], [20, 6, 'B'], [23, 7, 'Y'], [21, 9, 'a'], [8, 16, 'T'], [17, 16, 'B'], [24, 16, 'A'], [24, 13, 'A'], [2, 11, 'B'], [19, 14, 'a'], [16, 9, 'a']]
      .forEach(([x, y, c]) => m.set(x, y, c));
    m.set(11, 16, 'S');
    ['R'].forEach(() => { m.set(7, 8, 'R'); m.set(18, 7, 'R'); m.set(5, 13, 'R'); m.set(22, 12, 'R'); });
  });

  Atlas.region({
    id: 'tour', num: 3, name: 'La Tour du Guetteur', chapter: 'Distances et cercles',
    map, spawn: { x: 12, y: 16 },
    theme: { sky: '#f6c177', grass: ['#9ccf6a', '#a3d170', '#93c764'], path: '#e3bd84', tuft: '#7fae4a', outside: '#6f8d4a' },
    signs: { '11,16': '<b>La Tour du Guetteur</b><br>« Un cercle, c\'est tous les points à la même distance du centre. »' },
    exits: [{ x: 12, y: 17, to: 'village' }, { x: 13, y: 17, to: 'village' }],
    props: [
      { x: 12, y: 2, stamp: 'tour' },
      { x: 3, y: 9, stamp: 'maison_rouge' },
      { x: 19, y: 9, stamp: 'maison_grise' },
      { x: 3, y: 13, stamp: 'maison_bois' },
      { x: 20, y: 13, stamp: 'maison_rouge' },
    ],
    npcs: [
      {
        id: 'ysia', x: 14, y: 5, t: 'dungeon:112', name: 'Ysia, la guetteuse',
        look: { top: '#1c7ed6', bottom: '#1b2a45', hair: '#5a2d14', style: 'queue', hat: 'bandana', hatColor: '#f59f00' },
        talk: (A) => A.done('tours')
          ? ['Mes tours brillent ! Je vois tout le village.', 'Retiens-le : un cercle, c\'est tous les points à la <b>même distance</b> du centre. Et le rayon, c\'est la moitié du diamètre.']
          : ['Je suis Ysia, la guetteuse. Les tours de la vallée sont éteintes, et je n\'ai presque plus d\'huile.', 'Une lanterne éclaire un <b>disque</b> : il faut bien choisir où poser chaque tour. Le poste est juste à côté.'],
      },
      {
        id: 'gaspard', x: 7, y: 7, t: 'dungeon:111', name: 'Gaspard, le puisatier',
        talk: (A) => A.done('tresor')
          ? ['Hé hé ! Le coffre était donc à deux pas… enfin, à deux cercles.', 'Moi je creuse, toi tu traces : bon duo.']
          : ['Un coffre enterré, qu\'ils disaient. « À tant de pas du puits et à tant du chêne. » Mon grand-père adorait ça.', 'Le puits est là : essaie le compas de Pi. Mais creuser au hasard, ça fatigue.'],
      },
      {
        id: 'tim', x: 17, y: 12, t: 'dungeon:88', name: 'Tim, le messager',
        talk: (A) => A.done('messager')
          ? ['Youpi ! Je suis arrivé avant le soleil !', 'Le plus court, c\'est tout droit… enfin, à angle droit !']
          : ['Vite vite vite ! Je dois porter ce message à la route avant la nuit !', 'Mais je ne sais jamais quel chemin prendre. Aide-moi : mon sac est là, juste à côté !'],
      },
      {
        id: 'berthe', x: 6, y: 12, t: 'dungeon:100', name: 'Berthe, la doyenne',
        talk: (A) => A.done('tours')
          ? ['Grâce à toi, mes petits-enfants dorment tranquilles dans leurs maisons.', 'Tu veux un biscuit ? Non ? Le trésor du buisson, là-bas, attend un outil de la gare…']
          : ['Les voleurs rôdent la nuit, mon petit. Sans les tours allumées, je ne dors plus.', 'Parle à Ysia, elle t\'expliquera.'],
      },
    ],
    objects: [
      { id: 'o-tours', x: 11, y: 5, t: 'town:95', kind: 'enigme', enigme: 'tours' },
      { id: 'o-tresor', x: 6, y: 7, t: 'town:92', kind: 'enigme', enigme: 'tresor' },
      { id: 'o-messager', x: 16, y: 12, t: 'town:107', kind: 'enigme', enigme: 'messager' },
      {
        id: 'o-gardien', x: 15, y: 8, t: 'dungeon:96', name: 'Capitaine Bastien', kind: 'gardien',
        notReady: 'Halte ! Je suis le capitaine du guet. Reviens quand les tours, le trésor et le messager seront réglés.',
        intro: ['Tu as rallumé la vallée, bravo !', 'Mais cette nuit, des voleurs rôdent. Il faut protéger tout le village avec trois tours, puis retrouver leur butin. Prêt ?'],
      },
      { id: 'pierre', x: 22, y: 10, t: 'rock', kind: 'mental' },
    ],
    treasure: {
      x: 24, y: 13, needs: 'equerre',
      hint: 'Ce buisson cache quelque chose… Il faudrait une <b>équerre</b> pour tracer la perpendiculaire exacte. (On la gagne à la Gare du Brouillard.)',
      text: 'Avec l\'équerre, on trouve l\'endroit exact : ici ! Une vieille lanterne en or du premier guetteur…',
    },
    lesson: [
      {
        text: 'Un <b>cercle</b> : tous ses points sont à la <b>même distance</b> du <b>centre</b> O. Cette distance, c\'est le <b>rayon</b>. Le <b>diamètre</b> passe par le centre : il vaut <b>2 × le rayon</b>.',
        svg: `<svg viewBox="0 0 400 220"><circle cx="110" cy="110" r="85" fill="#e7f5ff" stroke="#1864ab" stroke-width="3"/><line x1="36.4" y1="152.5" x2="183.6" y2="67.5" stroke="#1c7ed6" stroke-width="4"/><line x1="95.2" y1="26.3" x2="183.6" y2="152.5" stroke="#2f9e44" stroke-width="4"/><g><line x1="110" y1="110" x2="195" y2="110" stroke="#e8590c" stroke-width="5"/><circle cx="195" cy="110" r="6" fill="#e8590c"/><animateTransform attributeName="transform" type="rotate" from="0 110 110" to="360 110 110" dur="6s" repeatCount="indefinite"/></g><circle cx="110" cy="110" r="5" fill="#2b1d0e"/><text x="96" y="132" font-size="18" font-weight="800">O</text><text x="20" y="168" font-size="16" font-weight="800" fill="#1c7ed6">A</text><text x="188" y="62" font-size="16" font-weight="800" fill="#1c7ed6">B</text><text x="215" y="55" font-size="15" font-weight="800">O : le centre</text><text x="215" y="85" font-size="15" font-weight="800" fill="#e8590c">le rayon (qui tourne)</text><text x="215" y="115" font-size="15" font-weight="800" fill="#1c7ed6">diamètre [AB]</text><text x="215" y="133" font-size="14" font-weight="700" fill="#1c7ed6">= 2 × rayon</text><text x="215" y="165" font-size="15" font-weight="800" fill="#2f9e44">une corde</text></svg>`,
      },
      {
        text: 'Un point peut être <b>sur le cercle</b> (OA = rayon), <b>dans le disque</b> (OB plus petit que le rayon) ou <b>dehors</b> (OC plus grand que le rayon).',
        svg: `<svg viewBox="0 0 400 220"><circle cx="120" cy="105" r="60" fill="#fff3bf" stroke="#e67700" stroke-width="3"/><line x1="120" y1="105" x2="180" y2="105" stroke="#e8590c" stroke-width="4"/><line x1="120" y1="105" x2="150" y2="85" stroke="#1c7ed6" stroke-width="4"/><line x1="120" y1="105" x2="330" y2="55" stroke="#e03131" stroke-width="3" stroke-dasharray="7 5"/><circle cx="120" cy="105" r="4" fill="#2b1d0e"/><circle cx="180" cy="105" r="6" fill="#e8590c"/><circle cx="150" cy="85" r="6" fill="#1c7ed6"/><circle cx="330" cy="55" r="6" fill="#e03131"/><text x="104" y="126" font-size="16" font-weight="800">O</text><text x="186" y="124" font-size="16" font-weight="800" fill="#e8590c">A</text><text x="148" y="76" font-size="16" font-weight="800" fill="#1c7ed6">B</text><text x="336" y="50" font-size="16" font-weight="800" fill="#e03131">C</text><text x="20" y="182" font-size="15" font-weight="800" fill="#e8590c">A sur le cercle : OA = rayon</text><text x="20" y="200" font-size="15" font-weight="800" fill="#1c7ed6">B dans le disque : OB &lt; rayon</text><text x="20" y="218" font-size="15" font-weight="800" fill="#e03131">C dehors : OC &gt; rayon</text></svg>`,
      },
      {
        text: 'Un point à <b>2 distances</b> données de deux points : on trace <b>deux cercles</b>. Ils se coupent en <b>deux points</b> X et X′. Un indice permet de choisir le bon !',
        svg: `<svg viewBox="0 0 400 220"><circle cx="100" cy="110" r="90" fill="rgba(28,126,214,0.10)" stroke="#1c7ed6" stroke-width="3"/><circle cx="240" cy="110" r="80" fill="rgba(232,89,12,0.10)" stroke="#e8590c" stroke-width="3"/><circle cx="100" cy="110" r="5" fill="#1c7ed6"/><circle cx="240" cy="110" r="5" fill="#e8590c"/><circle cx="176.1" cy="61.9" r="7" fill="#2f9e44"><animate attributeName="r" values="7;11;7" dur="1.4s" repeatCount="indefinite"/></circle><circle cx="176.1" cy="158.1" r="7" fill="#2f9e44"><animate attributeName="r" values="7;11;7" dur="1.4s" repeatCount="indefinite"/></circle><text x="88" y="132" font-size="18" font-weight="800" fill="#1c7ed6">P</text><text x="232" y="132" font-size="18" font-weight="800" fill="#e8590c">Q</text><text x="186" y="58" font-size="18" font-weight="800" fill="#2b8a3e">X</text><text x="186" y="172" font-size="18" font-weight="800" fill="#2b8a3e">X′</text></svg>`,
      },
      {
        text: 'La <b>distance d\'un point à une droite</b>, c\'est la longueur du chemin le plus court : celui qui arrive à <b>angle droit</b> (perpendiculaire). Un chemin en biais est toujours plus long.',
        svg: `<svg viewBox="0 0 400 220"><line x1="20" y1="160" x2="380" y2="100" stroke="#c9a46a" stroke-width="10" stroke-linecap="round"/><line x1="200" y1="40" x2="214.6" y2="127.6" stroke="#2f9e44" stroke-width="5"/><line x1="200" y1="40" x2="300" y2="113.3" stroke="#e03131" stroke-width="4" stroke-dasharray="8 6"/><path d="M226.4,125.6 L224.4,113.8 L212.6,115.8" fill="none" stroke="#2b1d0e" stroke-width="3"/><circle cx="200" cy="40" r="7" fill="#1c7ed6"/><text x="212" y="38" font-size="18" font-weight="800" fill="#1c7ed6">T</text><text x="200" y="148" font-size="18" font-weight="800" fill="#2f9e44">H</text><text x="296" y="136" font-size="18" font-weight="800" fill="#e03131">M</text><text x="226" y="86" font-size="15" font-weight="800" fill="#2f9e44">TH : le plus court</text><text x="262" y="68" font-size="15" font-weight="800" fill="#e03131">TM : plus long</text></svg>`,
      },
      {
        text: 'À toi ! Le brigand est à <b>3 cases</b> de la tour. <b>Écarte la mine du compas</b> (glisse le point orange) de <b>3 cases</b>, puis trace le cercle.',
        act: (el, done) => {
          const svg = S.root(el, VW, 400);
          svg.style.touchAction = 'none';
          S.el('rect', { x: 0, y: 0, width: VW, height: 400, fill: '#c3e28f' }, svg);
          for (let gx = 1; gx <= 19; gx++) for (let gy = 1; gy <= 9; gy++) S.el('circle', { cx: gx * U, cy: gy * U, r: 2.2, fill: 'rgba(55,95,30,0.32)' }, svg);
          const c = P(10, 5);
          const lay = S.el('g', {}, svg);
          iconTower(svg, '#c0392b', '').setAttribute('transform', `translate(${c.x},${c.y})`);
          let finished = false, rl = null;
          const compas = Compas(svg, { c, r: 1, th: -0.3, lockCenter: true, maxR: 8, onChange: (C) => { if (rl) rl.textContent = `${C.r} case${C.r > 1 ? 's' : ''}`; } });
          rl = h('b', { style: 'min-width:5.5em;display:inline-block;text-align:center' }, '1 case');
          const bTrace = h('button', { class: 'btn btn-go', onclick: () => {
            if (finished) return;
            if (compas.r !== 3) { Atlas.UI.toast(`Ton écartement est de ${compas.r} case${compas.r > 1 ? 's' : ''}, pas 3. Règle-le d'abord.`, 'bad'); return; }
            lay.innerHTML = '';
            compas.trace(lay, '#e8590c');
            finished = true;
            Atlas.UI.toast('Tous ces points sont à 3 cases de la tour !', 'good');
            done();
          } }, '✏️ Tracer le cercle');
          el.append(h('div', { class: 'puz-tools', style: 'flex-wrap:wrap;gap:8px;align-items:center' },
            h('button', { class: 'btn', onclick: () => compas.setR(compas.r - 1) }, '−'), rl,
            h('button', { class: 'btn', onclick: () => compas.setR(compas.r + 1) }, '+'), bTrace));
        },
      },
    ],
    enigmes: {
      tours: {
        title: 'Les tours de guet',
        consigne: '',
        build: (ctx) => buildTours(ctx, ctx.el, {
          n: 2, slack: 2,
          onSolved: () => ctx.win('Tout le village est éclairé ! Le <b>rayon</b> est la moitié du <b>diamètre</b> : une lanterne de 8 cases de large éclaire 4 cases autour de la tour.'),
        }),
      },
      tresor: {
        title: 'Le trésor à deux distances',
        consigne: '',
        build: (ctx) => buildTresor(ctx, ctx.el, {
          rounds: 2,
          onSolved: () => ctx.win('Coffre trouvé ! Deux cercles se coupent en <b>deux points</b> : ici, l\'indice a servi à choisir le bon.'),
        }),
      },
      messager: {
        title: 'Le messager',
        consigne: '',
        build: (ctx) => buildMessager(ctx, ctx.el, {
          rounds: 2,
          onSolved: () => ctx.win('Le plus court chemin d\'un point à une droite est la <b>perpendiculaire</b> : sa longueur est la <b>distance du point à la droite</b>.'),
        }),
      },
    },
    gardien: {
      title: 'La Nuit des voleurs',
      consigne: '',
      build: (ctx) => {
        buildTours(ctx, ctx.el, {
          n: 3, slack: 0, lead: '<b>Étape 1 / 2</b> — ',
          onSolved: () => {
            Atlas.UI.toast('Étape 1 réussie !', 'good');
            setTimeout(() => {
              buildTresor(ctx, ctx.el, {
                rounds: 1, hard: true, lead: '<b>Étape 2 / 2</b> — Le voleur a enterré son butin. ',
                onSolved: () => ctx.win('Les voleurs sont démasqués ! Voici la page de l\'Atlas, et le compas pour tes prochaines aventures.'),
              });
            }, 900);
          },
        });
      },
    },
    tool: {
      id: 'compas', name: 'Compas',
      icon: '<svg viewBox="0 0 30 30"><line x1="15" y1="4" x2="7" y2="26" stroke="#6c757d" stroke-width="3" stroke-linecap="round"/><line x1="15" y1="4" x2="23" y2="26" stroke="#e8590c" stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="5" r="3.5" fill="#495057"/><path d="M9,22 Q15,29 21,22" fill="none" stroke="#1864ab" stroke-width="1.8" stroke-dasharray="3 2"/></svg>',
    },
  });
})();
