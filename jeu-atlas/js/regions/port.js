/* =========================================================
   Région 6 — LE PORT DES VOILES · chapitre 6 « Angles »
   Attendus : estimer si un angle est aigu, droit ou obtus ; mesurer au rapporteur ; construire un angle de mesure donnée.
   Énigmes :
     recifs   six passages entre des récifs, six bateaux (petit / moyen / grand). On estime sans mesurer
              (la longueur des récifs ne compte pas) : petit → aigu, moyen → droit, grand → obtus.
     routes   mesurer l'angle quai / route avec un VRAI rapporteur qu'on déplace et qu'on tourne au doigt
              (demi-cercle à deux graduations). Le jeu vérifie la pose (centre sur le sommet, zéro sur un côté,
              côté dans le demi-cercle) avant d'accepter la lecture.
     cap      construire le cap : on pose le rapporteur sur le quai, on glisse le crayon sur la graduation
              et le bateau part dans cette direction ; l'île (cachée dans la brume) apparaît, on voit de combien on la rate.
   Gardien : la Régate (étape 1 : relevés au rapporteur ; étape 2 : caps de la flotte).
   Besoins communs : voir le compte rendu (aucun fichier commun modifié).
   ========================================================= */
(function () {
  'use strict';
  const { h, svg: S, geo } = Atlas;
  const VW = 800, VH = 500;
  const R = 158;               // rayon du rapporteur (unités du dessin)
  const RN = R - 27, RI = R - 44; // rayons où s'écrivent les nombres (graduation extérieure / intérieure)

  /* ---------- Petits outils de géométrie (angles en degrés, sens mathématique, y vers le haut) ---------- */
  const rad = (d) => (d * Math.PI) / 180;
  const n360 = (a) => ((a % 360) + 360) % 360;
  const gap = (a, b) => { const d = Math.abs(n360(a - b)); return d > 180 ? 360 - d : d; };
  const n180 = (a) => { const d = n360(a); return d > 180 ? d - 360 : d; };
  const pol = (O, a, r) => ({ x: O.x + r * Math.cos(rad(a)), y: O.y - r * Math.sin(rad(a)) });
  const dirOf = (O, P) => geo.dir(O, P);
  const lp = (phi, r) => ({ x: r * Math.cos(rad(phi)), y: -r * Math.sin(rad(phi)) });
  const inBox = (p, m = 30) => p.x > m && p.x < VW - m && p.y > m && p.y < VH - m;

  /* ================================================================
     LE RAPPORTEUR VIRTUEL : demi-cercle gradué (deux graduations), qu'on déplace et qu'on tourne.
       - on le fait glisser par le corps ; on le tourne avec les boutons orange (aux deux bouts) ;
       - petit « aimant » : près du sommet / d'un côté, il se cale (pratique au doigt) ;
       - option pen : un crayon qu'on fait glisser sur le bord, pour marquer une graduation.
     P.C centre (repère du dessin), P.rho = direction (sens math) de l'extrémité DROITE du bord plat,
     graduation extérieure : 0 à droite → 180 à gauche ; graduation intérieure : 180 à droite → 0 à gauche.
     ================================================================ */
  function Rapporteur(svg, o = {}) {
    const bw = o.w || VW, bh = o.h || VH;
    const P = { C: { x: o.x, y: o.y }, rho: n360(o.rho || 0), phi: 90, snapC: o.snapC || null, snapA: o.snapA || [], onChange: o.onChange || null };
    P.g = S.el('g', {}, svg);
    const L = S.el('g', {}, P.g);
    const shape = S.el('path', {
      d: `M${-R - 10},20 L${R + 10},20 L${R + 10},0 L${R},0 A${R},${R} 0 0 0 ${-R},0 L${-R - 10},0 Z`,
      fill: 'rgba(255,255,255,0.42)', stroke: '#2f4858', 'stroke-width': 1.8, 'stroke-linejoin': 'round',
    }, L);
    const tk = S.el('g', { 'pointer-events': 'none' }, L);
    for (let k = 0; k <= 180; k++) {
      const len = k % 10 === 0 ? 14 : k % 5 === 0 ? 10 : 6;
      const a = lp(k, R), b = lp(k, R - len);
      S.el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#2f4858', 'stroke-width': k % 10 === 0 ? 1.4 : 0.9 }, tk);
    }
    for (let k = 0; k <= 180; k += 10) {
      const po = lp(k, RN), pi = lp(k, RI);
      S.el('text', { transform: `translate(${po.x},${po.y}) rotate(${90 - k})`, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 10.5, 'font-weight': 700, fill: '#1864ab', text: String(k) }, tk);
      S.el('text', { transform: `translate(${pi.x},${pi.y}) rotate(${90 - k})`, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 10.5, 'font-weight': 700, fill: '#c2410c', text: String(180 - k) }, tk);
    }
    S.el('line', { x1: -R - 10, y1: 0, x2: R + 10, y2: 0, stroke: '#2f4858', 'stroke-width': 1.2 }, tk);
    S.el('line', { x1: 0, y1: -14, x2: 0, y2: 8, stroke: '#c92a2a', 'stroke-width': 1.6 }, tk);
    S.el('line', { x1: -9, y1: 0, x2: 9, y2: 0, stroke: '#c92a2a', 'stroke-width': 1.6 }, tk);
    S.el('circle', { cx: 0, cy: 0, r: 5, fill: 'none', stroke: '#c92a2a', 'stroke-width': 1.4 }, tk);
    const hl = S.el('g', { 'pointer-events': 'none' }, L);

    const clampC = (c) => ({ x: Math.max(60, Math.min(bw - 60, c.x)), y: Math.max(20, Math.min(bh - 10, c.y)) });
    const snap = () => {
      if (P.snapC && geo.dist(P.C, P.snapC) <= 7) P.C = { x: P.snapC.x, y: P.snapC.y };
      for (const a of P.snapA) if (gap(P.rho, a) <= 4) { P.rho = n360(a); break; }
    };
    P.update = (notify = true) => {
      P.g.setAttribute('transform', `translate(${P.C.x},${P.C.y}) rotate(${-P.rho})`);
      if (notify && P.onChange) P.onChange(P);
    };
    P.clearHl = () => { hl.innerHTML = ''; };
    P.flip = () => { P.rho = n360(P.rho + 180); P.clearHl(); P.update(); };

    /* surligner la bonne graduation : bande dorée du 0 jusqu'au côté + pastille avec la valeur */
    P.hlArc = (zero, phi, val) => {
      const r = zero === 'out' ? RN : RI;
      const a0 = zero === 'out' ? 0 : 180;
      const p0 = lp(a0, r), p1 = lp(phi, r);
      S.el('path', { d: `M${p0.x},${p0.y} A${r},${r} 0 0 ${zero === 'out' ? 0 : 1} ${p1.x},${p1.y}`, fill: 'none', stroke: 'rgba(250,204,21,.85)', 'stroke-width': 15, 'stroke-linecap': 'round' }, hl);
      const z = lp(a0, r);
      S.el('circle', { cx: z.x, cy: z.y, r: 9, fill: 'none', stroke: '#2f9e44', 'stroke-width': 3.5 }, hl);
      if (val != null) {
        const q = lp(phi, R + 28);
        const g = S.el('g', { transform: `translate(${q.x},${q.y}) rotate(${P.rho})` }, hl);
        S.el('circle', { r: 19, fill: '#2f9e44', stroke: '#fff', 'stroke-width': 3 }, g);
        S.el('text', { y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 17, 'font-weight': 800, fill: '#fff', text: `${val}°` }, g);
      }
    };
    P.ring = (scale, phi) => {
      const q = lp(phi, scale === 'out' ? RN : RI);
      S.el('circle', { cx: q.x, cy: q.y, r: 13, fill: 'none', stroke: '#e03131', 'stroke-width': 3.5 }, hl);
      S.el('line', { x1: q.x - 8, y1: q.y - 8, x2: q.x + 8, y2: q.y + 8, stroke: '#e03131', 'stroke-width': 3 }, hl);
      S.el('line', { x1: q.x - 8, y1: q.y + 8, x2: q.x + 8, y2: q.y - 8, stroke: '#e03131', 'stroke-width': 3 }, hl);
    };

    /* crayon (construction d'angle) */
    let penG = null;
    if (o.pen) {
      penG = S.el('g', {}, L);
      S.el('line', { x1: R + 2, y1: 0, x2: R + 18, y2: 0, stroke: '#9c3a0a', 'stroke-width': 3 }, penG);
      S.el('circle', { cx: R + 32, cy: 0, r: 15, fill: '#ffa94d', stroke: '#9c3a0a', 'stroke-width': 2.5 }, penG);
      S.el('text', { x: R + 32, y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 17, fill: '#7c2d12', 'pointer-events': 'none', text: '✎' }, penG);
      P.setPhi = (v) => {
        P.phi = Math.max(0, Math.min(180, Math.round(v)));
        penG.setAttribute('transform', `rotate(${-P.phi})`);
        if (P.onChange) P.onChange(P);
      };
      P.penDir = () => n360(P.rho + P.phi);
      S.drag(penG, svg, {
        move: (p) => {
          let a = n360(dirOf(P.C, p) - P.rho);
          if (a > 180) a = a > 270 ? 0 : 180;
          P.setPhi(a);
        },
      });
      P.setPhi(90);
    }

    if (o.interactive === false) {
      P.g.setAttribute('pointer-events', 'none');
    } else {
      let off = { x: 0, y: 0 };
      S.drag(shape, svg, {
        start: (p) => { off = { x: P.C.x - p.x, y: P.C.y - p.y }; P.clearHl(); },
        move: (p) => { P.C = clampC({ x: p.x + off.x, y: p.y + off.y }); snap(); P.update(); },
      });
      [-1, 1].forEach((sx) => {
        const kn = S.el('g', {}, L);
        S.el('circle', { cx: sx * (R + 30), cy: 40, r: 19, fill: '#fff3bf', stroke: '#e67700', 'stroke-width': 2.5 }, kn);
        S.el('text', { x: sx * (R + 30), y: 41, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 24, 'font-weight': 800, fill: '#e67700', 'pointer-events': 'none', text: '⟳' }, kn);
        let a0 = 0, r0 = 0;
        S.drag(kn, svg, {
          start: (p) => { a0 = dirOf(P.C, p); r0 = P.rho; P.clearHl(); },
          move: (p) => { P.rho = n360(r0 + (dirOf(P.C, p) - a0)); snap(); P.update(); },
        });
      });
    }
    P.set = (x, y, rho) => { P.C = { x, y }; if (rho != null) P.rho = n360(rho); P.update(false); };
    P.update(false);
    return P;
  }

  /* ---------- Vérification de la pose ---------- */
  // Mesurer : deux côtés (rays = [{a},{a}]). Le zéro est sur un côté, l'autre côté doit être sous le demi-cercle.
  function poseMesure(P, V, rays) {
    if (geo.dist(P.C, V) > 8) return { bad: 'centre' };
    let zero = null;
    rays.forEach((ry, i) => {
      if (gap(P.rho, ry.a) <= 2.5) zero = { i, scale: 'out' };
      else if (gap(P.rho + 180, ry.a) <= 2.5) zero = { i, scale: 'in' };
    });
    if (!zero) return { bad: 'zero' };
    const j = 1 - zero.i;
    const phi = n360(rays[j].a - P.rho);
    if (!(phi > 1 && phi < 179)) return { bad: 'side', zero, j };
    return { ok: true, zero, j, phi };
  }
  // Construire : un seul côté (le quai) ; le demi-cercle doit être du côté de la mer.
  function poseCap(P, V, aq, s) {
    if (geo.dist(P.C, V) > 8) return { bad: 'centre' };
    let scale = null;
    if (gap(P.rho, aq) <= 2.5) scale = 'out';
    else if (gap(P.rho + 180, aq) <= 2.5) scale = 'in';
    if (!scale) return { bad: 'zero' };
    if (Math.cos(rad(P.rho + 90 - (aq + s * 90))) < 0.5) return { bad: 'side', scale };
    return { ok: true, scale };
  }
  const poseMsg = (d, cap) => {
    if (d.bad === 'centre') return 'Le <b>centre</b> du rapporteur (la petite croix rouge) doit être exactement sur le <b>sommet</b> de l\'angle.';
    if (d.bad === 'zero') return cap
      ? 'Le bord plat du rapporteur doit <b>suivre le quai</b>, avec le <b>0</b> posé sur le quai. Tourne-le avec un bouton orange.'
      : 'Le <b>0</b> doit être posé sur un côté de l\'angle : le bord plat du rapporteur doit <b>suivre ce côté</b>. Tourne-le avec un bouton orange.';
    return cap
      ? 'Le demi-cercle est du côté de la <b>terre</b> ! Retourne le rapporteur (bouton ⟲) : les graduations doivent être du côté de la mer.'
      : 'L\'autre côté de l\'angle est <b>hors du demi-cercle</b> : retourne le rapporteur (bouton ⟲) pour qu\'il le recouvre.';
  };
  function drawDiag(fx, P, V, rays, d, sea) {
    fx.innerHTML = '';
    const red = '#e03131';
    const lab = (p, t) => S.el('text', { x: p.x, y: p.y, 'font-size': 17, 'font-weight': 800, fill: red, stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', text: t }, fx);
    if (d.bad === 'centre') {
      S.el('line', { x1: P.C.x, y1: P.C.y, x2: V.x, y2: V.y, stroke: red, 'stroke-width': 3, 'stroke-dasharray': '6 5' }, fx);
      S.el('circle', { cx: V.x, cy: V.y, r: 16, fill: 'none', stroke: red, 'stroke-width': 4 }, fx);
      S.el('circle', { cx: P.C.x, cy: P.C.y, r: 13, fill: 'none', stroke: red, 'stroke-width': 4, 'stroke-dasharray': '5 4' }, fx);
      lab({ x: V.x + 20, y: V.y - 14 }, 'sommet');
      lab({ x: P.C.x + 18, y: P.C.y + 28 }, 'centre');
    } else if (d.bad === 'zero') {
      const a = pol(P.C, P.rho, 260), b = pol(P.C, P.rho + 180, 260);
      S.el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: red, 'stroke-width': 4, 'stroke-dasharray': '10 6' }, fx);
      rays.forEach((ry) => { const e = pol(V, ry.a, 150); S.el('line', { x1: V.x, y1: V.y, x2: e.x, y2: e.y, stroke: '#f59f00', 'stroke-width': 7, opacity: 0.75, 'stroke-linecap': 'round' }, fx); });
    } else if (d.bad === 'side') {
      if (d.j != null) {
        const e = pol(V, rays[d.j].a, 160);
        S.el('line', { x1: V.x, y1: V.y, x2: e.x, y2: e.y, stroke: red, 'stroke-width': 7, opacity: 0.8, 'stroke-linecap': 'round' }, fx);
        lab(pol(V, rays[d.j].a, 175), 'hors du demi-cercle');
      } else if (sea != null) {
        const e = pol(V, sea, 110);
        S.el('line', { x1: V.x, y1: V.y, x2: e.x, y2: e.y, stroke: '#1c7ed6', 'stroke-width': 6, 'stroke-linecap': 'round' }, fx);
        lab(pol(V, sea, 128), 'côté mer');
      }
    }
  }

  /* ---------- Dessins communs ---------- */
  function seaBg(svg, r) {
    S.el('rect', { x: 0, y: 0, width: VW, height: VH, fill: '#7cc4f2' }, svg);
    for (let i = 0; i < 14; i++) {
      const x = r.int(10, 760), y = r.int(10, 480);
      S.el('path', { d: `M${x},${y} q8,-6 16,0 q8,6 16,0`, fill: 'none', stroke: 'rgba(255,255,255,.45)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, svg);
    }
  }
  function boatIcon(parent, x, y, rot, color, sc = 1) {
    const g = S.el('g', { transform: `translate(${x},${y}) rotate(${rot}) scale(${sc})` }, parent);
    S.el('path', { d: 'M-20,-9 L10,-9 Q24,0 10,9 L-20,9 Z', fill: color, stroke: '#fff', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g);
    S.el('rect', { x: -12, y: -4, width: 14, height: 8, rx: 2, fill: '#fff', opacity: 0.85 }, g);
    return g;
  }
  function drawQuai(svg, V, a, len) {
    const g = S.el('g', {}, svg);
    const E = pol(V, a, len);
    S.el('line', { x1: V.x, y1: V.y, x2: E.x, y2: E.y, stroke: '#a0703c', 'stroke-width': 14 }, g);
    for (let d = 12; d < len; d += 16) {
      const p = pol(V, a, d), q1 = pol(p, a + 90, 7), q2 = pol(p, a - 90, 7);
      S.el('line', { x1: q1.x, y1: q1.y, x2: q2.x, y2: q2.y, stroke: '#5c3b1a', 'stroke-width': 1.5 }, g);
    }
    S.el('line', { x1: V.x, y1: V.y, x2: E.x, y2: E.y, stroke: '#2b1d0e', 'stroke-width': 2.2 }, g);
    const t = pol(V, a, len * 0.62), tq = pol(t, a + 90, 20);
    S.el('text', { x: tq.x, y: tq.y, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: '#5c3b1a', stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', text: 'quai' }, g);
    return g;
  }
  function drawRoute(svg, V, a, len) {
    const g = S.el('g', {}, svg);
    const E = pol(V, a, len);
    S.el('line', { x1: V.x, y1: V.y, x2: E.x, y2: E.y, stroke: 'rgba(255,255,255,.7)', 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
    S.el('line', { x1: V.x, y1: V.y, x2: E.x, y2: E.y, stroke: '#c92a2a', 'stroke-width': 2.2 }, g);
    boatIcon(g, E.x, E.y, -a, '#e8590c', 1.1);
    const t = pol(V, a, len * 0.55), tq = pol(t, a - 90, 18);
    S.el('text', { x: tq.x, y: tq.y, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: '#a61e1e', stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', text: 'route' }, g);
    return g;
  }
  function vertexMark(svg, V, label = 'O') {
    S.el('circle', { cx: V.x, cy: V.y, r: 6, fill: '#e03131', stroke: '#fff', 'stroke-width': 2.5 }, svg);
    S.el('text', { x: V.x - 20, y: V.y + 24, 'font-size': 20, 'font-weight': 800, fill: '#1b1b1b', stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', text: label }, svg);
  }
  function arcMark(parent, V, a1, a2, r, color, label) {
    const d = n180(a2 - a1);
    const p1 = pol(V, a1, r), p2 = pol(V, a2, r);
    S.el('path', { d: `M${p1.x},${p1.y} A${r},${r} 0 0 ${d > 0 ? 0 : 1} ${p2.x},${p2.y}`, fill: 'none', stroke: color, 'stroke-width': 4 }, parent);
    if (label != null) {
      const t = pol(V, a1 + d / 2, r + 26);
      S.el('text', { x: t.x, y: t.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 22, 'font-weight': 800, fill: color, stroke: '#fff', 'stroke-width': 5, 'paint-order': 'stroke', text: label }, parent);
    }
  }
  function rightMark(parent, V, a1, a2, size, color) {
    const p1 = pol(V, a1, size), p3 = pol(V, a2, size);
    const p2 = { x: p1.x + p3.x - V.x, y: p1.y + p3.y - V.y };
    return S.el('path', { d: `M${p1.x},${p1.y} L${p2.x},${p2.y} L${p3.x},${p3.y}`, fill: 'none', stroke: color, 'stroke-width': 3 }, parent);
  }

  /* ---------- Tirage des angles ---------- */
  function pickM(r, kind) {
    if (kind === 'any') kind = r.pick(['acute', 'obtuse']);
    const lo = kind === 'acute' ? 20 : 95, hi = kind === 'acute' ? 85 : 160;
    let m;
    do { m = r.chance(0.6) ? 5 * r.int(lo / 5, hi / 5) : r.int(lo, hi); } while (m >= 88 && m <= 92);
    return { m, kind };
  }
  const tilted = (a) => Math.min(gap(a, 0), gap(a, 180)) > 15;
  function layoutMesure(r, orient, m) {
    for (let t = 0; t < 600; t++) {
      const V = { x: r.int(240, 560), y: r.int(190, 320) };
      let a1, a2;
      if (orient === 'right') { a1 = 0; a2 = m; }
      else if (orient === 'left') { a1 = 180; a2 = 180 - m; }
      else { a1 = r.int(0, 359); a2 = a1 + (r.chance(0.5) ? m : -m); if (!tilted(a1) || !tilted(a2)) continue; }
      const lo = t < 450 ? 175 : 160;
      const L1 = r.int(lo, 250), L2 = r.int(lo, 250);
      if (inBox(pol(V, a1, L1)) && inBox(pol(V, a2, L2))) return { V, a1, a2, L1, L2 };
    }
    const a1 = orient === 'left' ? 180 : orient === 'right' ? 0 : 30;
    return { V: { x: 400, y: 250 }, a1, a2: orient === 'left' ? 180 - m : a1 + m, L1: 170, L2: 170 };
  }
  function layoutCap(r, orient, m) {
    for (let t = 0; t < 800; t++) {
      const V = { x: r.int(240, 540), y: r.int(200, 320) };
      let aq, s;
      if (orient === 'right') { aq = 0; s = 1; }
      else if (orient === 'left') { aq = 180; s = -1; }
      else { aq = r.int(0, 359); s = r.chance(0.5) ? 1 : -1; if (!tilted(aq)) continue; }
      const D = r.int(240, 330);
      const at = aq + s * m;
      const T = pol(V, at, D);
      let Lq = 250;
      while (Lq > 120 && !inBox(pol(V, aq, Lq), 25)) Lq -= 10;
      if (inBox(T, 40) && Lq >= 150) return { V, aq, s, D, at, T, Lq };
    }
    const V = { x: 400, y: 250 }, aq = orient === 'left' ? 180 : 0, s = orient === 'left' ? -1 : 1;
    return { V, aq, s, D: 220, at: aq + s * m, T: pol(V, aq + s * m, 220), Lq: 200 };
  }

  /* ================================================================
     ÉNIGME « récifs » : estimer aigu / droit / obtus (sans mesurer)
     ================================================================ */
  const CAT = ['aigu', 'droit', 'obtus'];
  const BOATS = [{ n: 'petit', sc: 1.0, col: '#f59f00' }, { n: 'moyen', sc: 1.3, col: '#e8590c' }, { n: 'grand', sc: 1.7, col: '#1c7ed6' }];
  function buildRecifs(ctx, host) {
    const r = ctx.rng;
    const counts = [1, 1, 1];
    for (let i = 0; i < 3; i++) counts[r.int(0, 2)]++;
    let cats = [];
    counts.forEach((n, c) => { for (let j = 0; j < n; j++) cats.push(c); });
    cats = r.shuffle(cats);
    const CW = 254, CH = 190;
    const passages = cats.map((cat, i) => {
      const m = cat === 1 ? 90 : cat === 0 ? r.int(22, 70) : r.int(110, 160);
      const bis = r.int(0, 359);
      const L1 = cat === 0 ? r.int(70, 98) : cat === 2 ? r.int(50, 76) : r.int(55, 98);
      const L2 = cat === 0 ? r.int(70, 98) : cat === 2 ? r.int(50, 76) : r.int(55, 98);
      const a1 = bis - m / 2, a2 = bis + m / 2;
      const O = { x: 0, y: 0 }, e1 = pol(O, a1, L1), e2 = pol(O, a2, L2);
      const xs = [0, e1.x, e2.x], ys = [0, e1.y, e2.y];
      const cx0 = 10 + (i % 3) * 263, cy0 = 8 + Math.floor(i / 3) * 198;
      const V = { x: cx0 + CW / 2 - (Math.min(...xs) + Math.max(...xs)) / 2, y: cy0 + CH / 2 - (Math.min(...ys) + Math.max(...ys)) / 2 - 4 };
      return { i, cat, m, a1, a2, L1, L2, V, cx0, cy0 };
    });
    const boats = cats.map((c, id) => ({ id, size: c, cell: null })).sort((a, b) => a.size - b.size || a.id - b.id);
    boats.forEach((b, k) => { b.slot = k; });

    host.innerHTML = '';
    ctx.consigne.innerHTML = 'Chaque bateau passe par un angle à sa taille : le <b>petit</b> par un angle <b>aigu</b>, le <b>moyen</b> par un angle <b>droit</b>, le <b>grand</b> par un angle <b>obtus</b>. <b>Estime</b> chaque angle, sans le mesurer, puis donne à chaque passage son bateau.';
    const svg = S.root(host, VW, 520);
    S.el('rect', { x: 0, y: 0, width: VW, height: 520, fill: '#e7f5ff' }, svg);
    const slotXY = (p) => ({ x: p.cx0 + CW - 38, y: p.cy0 + CH - 32 });
    passages.forEach((p) => {
      const c = S.el('g', { style: 'cursor:pointer' }, svg);
      S.el('rect', { x: p.cx0, y: p.cy0, width: CW, height: CH, rx: 14, fill: '#4da3dc', stroke: '#1c6ea4', 'stroke-width': 3 }, c);
      const e1 = pol(p.V, p.a1, p.L1), e2 = pol(p.V, p.a2, p.L2);
      S.el('polygon', { points: `${p.V.x},${p.V.y} ${e1.x},${e1.y} ${e2.x},${e2.y}`, fill: '#b9e4ff', opacity: 0.85 }, c);
      [[e1, p.a1, p.L1], [e2, p.a2, p.L2]].forEach(([e, a, len]) => {
        S.el('line', { x1: p.V.x, y1: p.V.y, x2: e.x, y2: e.y, stroke: '#6b4a2b', 'stroke-width': 10, 'stroke-linecap': 'round' }, c);
        for (let d = 8; d < len; d += 12) { const q = pol(p.V, a + (d % 24 ? 8 : -8), d); S.el('circle', { cx: q.x, cy: q.y, r: 4.5, fill: '#8d6e4d' }, c); }
      });
      S.el('circle', { cx: p.V.x, cy: p.V.y, r: 8, fill: '#5a3d22' }, c);
      S.el('circle', { cx: p.cx0 + 20, cy: p.cy0 + 20, r: 13, fill: '#fff', stroke: '#1c6ea4', 'stroke-width': 2 }, c);
      S.el('text', { x: p.cx0 + 20, y: p.cy0 + 21, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 16, 'font-weight': 800, fill: '#1c6ea4', text: 'ABCDEF'[p.i] }, c);
      const sl = slotXY(p);
      S.el('rect', { x: sl.x - 30, y: sl.y - 22, width: 60, height: 44, rx: 10, fill: 'rgba(255,255,255,.35)', stroke: '#fff', 'stroke-width': 2.5, 'stroke-dasharray': '6 4' }, c);
      c.addEventListener('click', () => onCell(p.i));
    });
    const fxCell = S.el('g', { 'pointer-events': 'none' }, svg);
    const dyn = S.el('g', {}, svg);
    let sel = null, busy = false;
    const chipXY = (b) => ({ x: 10 + b.slot * 131, y: 414 });
    const render = () => {
      dyn.innerHTML = '';
      boats.forEach((b) => {
        const cx = chipXY(b);
        const g = S.el('g', { style: 'cursor:pointer' }, dyn);
        S.el('rect', { x: cx.x, y: cx.y, width: 123, height: 98, rx: 12, fill: sel === b.id ? '#fff3bf' : '#fff', stroke: sel === b.id ? '#e67700' : '#74c0fc', 'stroke-width': sel === b.id ? 5 : 2.5, opacity: b.cell == null ? 1 : 0.35 }, g);
        boatIcon(g, cx.x + 61, cx.y + 42, 0, BOATS[b.size].col, BOATS[b.size].sc * 1.35);
        S.el('text', { x: cx.x + 61, y: cx.y + 86, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 700, fill: '#495057', text: BOATS[b.size].n }, g);
        g.addEventListener('click', () => onChip(b));
        if (b.cell != null) {
          const sl = slotXY(passages[b.cell]);
          boatIcon(dyn, sl.x, sl.y, 0, BOATS[b.size].col, BOATS[b.size].sc * 0.95).setAttribute('pointer-events', 'none');
        }
      });
    };
    const onChip = (b) => {
      if (busy) return;
      fxCell.innerHTML = '';
      if (b.cell != null) { b.cell = null; sel = b.id; } else sel = sel === b.id ? null : b.id;
      render();
    };
    const onCell = (i) => {
      if (busy) return;
      fxCell.innerHTML = '';
      const here = boats.find((b) => b.cell === i);
      if (sel != null) {
        const b = boats.find((x) => x.id === sel);
        if (here) here.cell = null;
        b.cell = i;
        sel = null;
      } else if (here) here.cell = null;
      render();
    };
    render();
    const go = h('button', { class: 'btn btn-go', style: 'margin-top:8px' }, '⛵ Lancer la flotte');
    host.append(h('div', { class: 'puz-tools' }, go));
    ctx.pi('Un angle <b>droit</b>, c\'est le coin d\'une feuille. Plus fermé : <b>aigu</b>. Plus ouvert : <b>obtus</b>. Touche un bateau, puis un passage.');
    go.onclick = () => {
      if (busy) return;
      if (boats.some((b) => b.cell == null)) return Atlas.UI.toast('Place d\'abord les six bateaux.', 'bad');
      fxCell.innerHTML = '';
      const bad = [];
      passages.forEach((p) => { const b = boats.find((x) => x.cell === p.i); if (b.size !== p.cat) bad.push({ p, b }); });
      if (!bad.length) {
        busy = true;
        passages.forEach((p) => {
          const bis = (p.a1 + p.a2) / 2, start = pol(p.V, bis, Math.max(p.L1, p.L2) + 24), end = pol(p.V, bis, 14);
          const hd = (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI;
          const b = boats.find((x) => x.cell === p.i);
          const g = boatIcon(fxCell, 0, 0, hd, BOATS[b.size].col, BOATS[b.size].sc * 0.8);
          g.style.transition = 'transform 1.3s ease-in-out';
          g.style.transform = `translate(${start.x}px,${start.y}px) rotate(${hd}deg)`;
          setTimeout(() => { g.style.transform = `translate(${end.x}px,${end.y}px) rotate(${hd}deg)`; }, 60);
        });
        setTimeout(() => ctx.win('Tous les bateaux passent ! Un angle <b>droit</b> mesure 90°, un angle <b>aigu</b> est plus petit, un angle <b>obtus</b> est plus grand. La longueur des côtés ne change rien.'), 1700);
        return;
      }
      const worst = bad.find((x) => x.b.size > x.p.cat) || bad[0];
      const { p, b } = worst;
      const ref = p.a1 + (n180(p.a2 - p.a1) >= 0 ? 1 : -1) * 90;
      S.el('rect', { x: p.cx0 + 2, y: p.cy0 + 2, width: CW - 4, height: CH - 4, rx: 12, fill: 'none', stroke: '#e03131', 'stroke-width': 6 }, fxCell);
      const er = pol(p.V, ref, 80), e1 = pol(p.V, p.a1, 80);
      S.el('line', { x1: p.V.x, y1: p.V.y, x2: er.x, y2: er.y, stroke: '#e8590c', 'stroke-width': 4, 'stroke-dasharray': '8 6' }, fxCell);
      S.el('line', { x1: p.V.x, y1: p.V.y, x2: e1.x, y2: e1.y, stroke: '#e8590c', 'stroke-width': 2, opacity: 0.8 }, fxCell);
      rightMark(fxCell, p.V, p.a1, ref, 17, '#e8590c');
      const tr = pol(p.V, ref, 96);
      S.el('text', { x: tr.x, y: tr.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 15, 'font-weight': 800, fill: '#e8590c', stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', text: 'angle droit' }, fxCell);
      const longTrap = (p.cat === 0 && Math.max(p.L1, p.L2) >= 85) || (p.cat === 2 && Math.max(p.L1, p.L2) <= 62)
        ? ' Attention : la <b>longueur des récifs</b> ne change pas l\'angle, seul compte l\'écartement.' : '';
      const name = `passage ${'ABCDEF'[p.i]}`;
      const why = p.cat === 0 ? 'est <b>aigu</b> : il s\'ouvre <b>moins</b> qu\'un angle droit (le trait orange)'
        : p.cat === 2 ? 'est <b>obtus</b> : il s\'ouvre <b>plus</b> qu\'un angle droit (le trait orange)'
          : 'est <b>droit</b> : un coin de feuille, exactement le trait orange';
      b.cell = null; sel = null;
      render();
      if (b.size > p.cat) ctx.fail(`Le ${BOATS[b.size].n} bateau s'échoue au ${name} ! Ce passage ${why}.${longTrap}`);
      else ctx.fail(`Le ${BOATS[b.size].n} bateau passe au ${name}, mais il y avait de la place pour plus gros : ce passage ${why}.${longTrap}`);
    };
  }

  /* ================================================================
     ÉNIGME « routes » : mesurer avec le rapporteur (aussi utilisée par le gardien)
     ================================================================ */
  function buildMesure(ctx, host, { rounds, onSolved }) {
    const r = ctx.rng;
    let k = 0, dead = false;
    ctx.onCleanup(() => { dead = true; });
    const one = () => {
      if (dead) return;
      if (k >= rounds.length) return onSolved();
      host.innerHTML = '';
      const spec = rounds[k];
      const { m, kind } = pickM(r, spec.m);
      const Ly = layoutMesure(r, spec.orient, m);
      const { V, a1, a2 } = Ly;
      const rays = [{ a: a1 }, { a: a2 }];
      ctx.consigne.innerHTML = `Route ${k + 1} / ${rounds.length} : mesure l'angle entre le <b>quai</b> et la <b>route</b> du bateau. Pose le rapporteur, puis écris la mesure.`;
      const svg = S.root(host, VW, VH);
      seaBg(svg, r);
      drawQuai(svg, V, a1, Ly.L1);
      drawRoute(svg, V, a2, Ly.L2);
      vertexMark(svg, V);
      const P = Rapporteur(svg, { x: V.x < 400 ? 640 : 160, y: 425, rho: 0, snapC: V, snapA: [a1, a1 + 180, a2, a2 + 180] });
      const fx = S.el('g', { 'pointer-events': 'none' }, svg);
      const tools = h('div', { class: 'puz-tools' },
        h('button', { class: 'btn', onclick: () => { fx.innerHTML = ''; P.flip(); } }, '⟲ Retourner le rapporteur'));
      host.append(tools);
      let busy = false;
      const submit = (v) => {
        if (busy) return;
        fx.innerHTML = '';
        P.clearHl();
        const d = poseMesure(P, V, rays);
        if (!d.ok) { drawDiag(fx, P, V, rays, d); ctx.fail(poseMsg(d, false)); return; }
        if (Math.abs(v - m) <= 2) {
          busy = true;
          arcMark(fx, V, a1, a2, 70, '#2f9e44', `${m}°`);
          Atlas.UI.toast(`Oui : ${m}° !`, 'good');
          k++;
          setTimeout(one, 1700);
        } else if (Math.abs(v - (180 - m)) <= 2) {
          P.hlArc(d.zero.scale, d.phi, m);
          P.ring(d.zero.scale === 'out' ? 'in' : 'out', d.phi);
          ctx.fail(`Tu as lu <b>${v}°</b> : c'est l'<b>autre graduation</b> ! Ici le 0 est ${d.zero.scale === 'out' ? 'à droite (graduation extérieure)' : 'à gauche (graduation intérieure)'} : on lit en partant de ce 0. Un angle ${m < 90 ? 'aigu mesure <b>moins</b>' : 'obtus mesure <b>plus</b>'} de 90°, donc ${m}°.`);
        } else if ((m < 90 && v > 90) || (m > 90 && v < 90)) {
          ctx.fail(`${v}° ne va pas : cet angle est ${m < 90 ? '<b>aigu</b>, il mesure moins de 90°' : '<b>obtus</b>, il mesure plus de 90°'}. Estime d'abord, puis lis la graduation qui part du 0.`);
        } else {
          ctx.fail(`Pas tout à fait : lis bien <b>où le côté coupe la graduation</b>, au degré près (un petit trait = 1°).${Math.abs(v - m) <= 8 ? ' Tu es tout près !' : ''}`);
        }
      };
      Atlas.UI.answer(host, { label: 'L\'angle mesure', unit: '°', onSubmit: submit });
      ctx.pi(k === 0
        ? 'Glisse le rapporteur : la <b>croix rouge</b> sur le sommet O. Tourne-le avec un bouton orange : le bord plat suit un côté, le <b>0</b> sur ce côté.'
        : spec.orient === 'rot'
          ? 'Le dessin est penché : tourne le rapporteur pour que son bord plat suive un côté. Deux nombres sont possibles : pars du 0 !'
          : 'Attention aux <b>deux graduations</b> : lis celle qui part du 0 posé sur le côté. Estime d\'abord : aigu ou obtus ?');
    };
    one();
  }

  /* ================================================================
     ÉNIGME « cap » : construire l'angle au rapporteur (aussi utilisée par le gardien)
     ================================================================ */
  function buildCap(ctx, host, { rounds, onSolved }) {
    const r = ctx.rng;
    let k = 0, dead = false;
    ctx.onCleanup(() => { dead = true; });
    const one = () => {
      if (dead) return;
      if (k >= rounds.length) return onSolved();
      host.innerHTML = '';
      const spec = rounds[k];
      const { m } = pickM(r, spec.m);
      const Ly = layoutCap(r, spec.orient, m);
      const { V, aq, s, D, at, T, Lq } = Ly;
      ctx.consigne.innerHTML = `Cap ${k + 1} / ${rounds.length} : l'île est cachée dans la brume. Le bateau doit partir en faisant un angle de <b>${m}°</b> avec le <b>quai</b>, du côté de la <b>mer</b>. Pose le rapporteur, glisse le crayon ✎ sur la bonne graduation, puis lance !`;
      const svg = S.root(host, VW, VH);
      seaBg(svg, r);
      // la terre : demi-plan de l'autre côté de la côte
      const u = pol({ x: 0, y: 0 }, aq, 1), nrm = pol({ x: 0, y: 0 }, aq - s * 90, 1);
      const pts = [[-1500, 0], [1500, 0], [1500, 1500], [-1500, 1500]].map(([a, b]) => ({ x: V.x + (u.x - 0) * a + nrm.x * b, y: V.y + u.y * a + nrm.y * b }));
      S.el('polygon', { points: pts.map((p) => `${p.x},${p.y}`).join(' '), fill: '#ead9a4' }, svg);
      const c0 = pol(V, aq + s * 90, 0), cA = pol(V, aq, 1500), cB = pol(V, aq + 180, 1500);
      S.el('line', { x1: cA.x, y1: cA.y, x2: cB.x, y2: cB.y, stroke: '#c9b06a', 'stroke-width': 5 }, svg);
      const tl = pol(V, aq + 180, 120), tlq = pol(tl, aq - s * 90, 34);
      const tm = pol(V, aq + s * 90, 60);
      if (inBox(tlq, 15)) S.el('text', { x: tlq.x, y: tlq.y, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: '#a0873a', text: 'terre' }, svg);
      void c0; void tm;
      const fog = S.el('g', { style: 'transition:opacity 1.2s' }, svg);
      for (let i = 0; i < 9; i++) {
        const q = pol(V, aq + s * r.int(15, 165), r.int(150, 360));
        if (inBox(q, 0)) S.el('ellipse', { cx: q.x, cy: q.y, rx: r.int(40, 80), ry: r.int(20, 34), fill: '#fff', opacity: 0.6 }, fog);
      }
      drawQuai(svg, V, aq, Lq);
      const boat0 = boatIcon(svg, V.x, V.y, -(aq + s * 45), '#e8590c', 1.1);
      vertexMark(svg, V);
      const fx = S.el('g', { 'pointer-events': 'none' }, svg);
      const P = Rapporteur(svg, { x: V.x < 400 ? 640 : 160, y: 425, rho: 0, snapC: V, snapA: [aq, aq + 180], pen: true });
      const fx2 = S.el('g', { 'pointer-events': 'none' }, svg);
      const go = h('button', { class: 'btn btn-go' }, '⛵ Tracer le cap et lancer le bateau');
      const tools = h('div', { class: 'puz-tools' },
        h('button', { class: 'btn', onclick: () => { fx2.innerHTML = ''; P.flip(); } }, '⟲ Retourner le rapporteur'),
        h('button', { class: 'btn', onclick: () => P.setPhi(P.phi - 1) }, '✎ −1°'),
        h('button', { class: 'btn', onclick: () => P.setPhi(P.phi + 1) }, '✎ +1°'),
        go);
      host.append(tools);
      ctx.pi(k === 0
        ? 'Pose le rapporteur : la croix sur le sommet O, le bord plat sur le <b>quai</b>, le demi-cercle côté <b>mer</b>. Puis fais glisser le crayon ✎ sur la graduation <b>' + m + '</b> qui part du 0 du quai.'
        : 'Même méthode : le <b>0</b> sur le quai, le demi-cercle côté mer. Quelle graduation part du 0 ? Le crayon va sur le ' + m + ' de <b>celle-là</b>.');
      let busy = false;
      const reset = () => {
        if (dead) return;
        fx.innerHTML = '';
        fog.style.opacity = '1';
        boat0.style.display = '';
        busy = false;
      };
      go.onclick = () => {
        if (busy) return;
        fx2.innerHTML = '';
        P.clearHl();
        const d = poseCap(P, V, aq, s);
        if (!d.ok) { drawDiag(fx2, P, V, [{ a: aq }], d, aq + s * 90); ctx.fail(poseMsg(d, true)); return; }
        busy = true;
        const aPen = P.penDir();
        const mPen = d.scale === 'out' ? P.phi : 180 - P.phi;
        const delta = mPen - m;
        const hit = Math.abs(delta) <= 2;
        boat0.style.display = 'none';
        const ray = pol(V, aPen, D + 60);
        S.el('line', { x1: V.x, y1: V.y, x2: ray.x, y2: ray.y, stroke: '#c92a2a', 'stroke-width': 2.5, 'stroke-dasharray': '9 6' }, fx);
        const sailer = boatIcon(fx, V.x, V.y, -aPen, '#e8590c', 1.2);
        const t0 = performance.now(), dur = 1500;
        const tick = (t) => {
          if (dead) return;
          const kk = Math.min(1, (t - t0) / dur);
          const p = pol(V, aPen, D * kk);
          sailer.setAttribute('transform', `translate(${p.x},${p.y}) rotate(${-aPen}) scale(1.2)`);
          if (kk < 1) return requestAnimationFrame(tick);
          arrive();
        };
        const arrive = () => {
          fog.style.opacity = '0';
          const ir = Math.round(D * Math.tan(rad(2.2)));
          const is = S.el('g', {}, fx);
          S.el('circle', { cx: T.x, cy: T.y, r: ir + 6, fill: '#f1d98a', stroke: '#fff', 'stroke-width': 3 }, is);
          S.el('circle', { cx: T.x, cy: T.y, r: ir, fill: '#51cf66' }, is);
          S.el('text', { x: T.x, y: T.y - ir - 12, 'text-anchor': 'middle', 'font-size': 26, text: '🌴' }, is);
          if (hit) {
            arcMark(fx, V, aq, at, 70, '#2f9e44', `${m}°`);
            S.el('text', { x: T.x, y: T.y + ir + 28, 'text-anchor': 'middle', 'font-size': 24, text: '⚓' }, fx);
            Atlas.UI.toast('Droit sur l\'île !', 'good');
            k++;
            setTimeout(one, 1900);
            return;
          }
          const B = pol(V, aPen, D);
          S.el('line', { x1: V.x, y1: V.y, x2: T.x, y2: T.y, stroke: '#2f9e44', 'stroke-width': 3, 'stroke-dasharray': '7 5' }, fx);
          S.el('line', { x1: B.x, y1: B.y, x2: T.x, y2: T.y, stroke: '#e03131', 'stroke-width': 3 }, fx);
          arcMark(fx, V, aPen, at, 90, '#e03131', `${Math.round(Math.abs(delta))}°`);
          let msg;
          if (Math.abs(mPen - (180 - m)) <= 2) {
            P.hlArc(d.scale, d.scale === 'out' ? m : 180 - m, m);
            P.ring(d.scale === 'out' ? 'in' : 'out', P.phi);
            msg = `Ton cap fait <b>${mPen}°</b> avec le quai au lieu de ${m}° : tu as lu l'<b>autre graduation</b> ! Le 0 est ${d.scale === 'out' ? 'à droite' : 'à gauche'}, on compte en partant de <b>ce</b> 0.`;
          } else {
            msg = `Le bateau rate l'île de <b>${Math.round(Math.abs(delta))}°</b> : ton angle fait ${mPen}° avec le quai, il en fallait ${m}°. Il est parti <b>trop ${delta > 0 ? 'ouvert' : 'fermé'}</b>.`;
          }
          const hl = ctx.fail(msg);
          if (hl > 0) setTimeout(reset, 3600);
        };
        requestAnimationFrame(tick);
      };
    };
    one();
  }

  /* ---------- La carte du port ---------- */
  const W = 26, H = 18;
  const map = Atlas.buildMap(W, H, (m) => {
    m.border('T');
    m.rect(11, 1, 24, 16, '~');          // la mer
    m.rect(1, 6, 10, 11, '=');           // la plage / place du port
    m.rect(0, 8, 0, 9, '=');             // sortie vers le village (ouest)
    m.rect(9, 12, 10, 14, '=');          // plage sud
    m.rect(9, 3, 10, 5, '=');            // plage nord
    m.rect(10, 8, 19, 9, '_');           // grand quai
    m.rect(18, 4, 19, 13, '_');          // quai transversal
    m.rect(13, 4, 17, 4, '_');           // ponton nord
    m.rect(13, 13, 17, 13, '_');         // ponton sud
    m.sprinkle(',', 9, 3);
    m.sprinkle('*', 25, 7);
    [[2, 4], [3, 14], [5, 16], [1, 2], [8, 1], [2, 11]].forEach(([x, y], i) => m.set(x, y, ['a', 'B', 'T', 'A', 'B', 'a'][i]));
    [[10, 6], [8, 14], [4, 13]].forEach(([x, y]) => m.set(x, y, 'R'));
    m.set(9, 7, 'S');
    m.set(7, 11, 'k'); m.set(8, 11, 'b'); m.set(9, 11, 'b');
    m.set(15, 8, 'b'); m.set(12, 9, 'k');
    m.set(19, 5, 'b');
  });

  const lou = { top: '#1d4e89', bottom: '#22223b', hair: '#8b4513', style: 'queue', hat: 'kepi', hatColor: '#f8f9fa', scale: 1.04 };

  Atlas.region({
    id: 'port', num: 6, name: 'Le Port des Voiles', chapter: 'Angles',
    map, spawn: { x: 2, y: 8 },
    theme: { sky: '#bfe6ff', grass: ['#d9c26a', '#d3bb60', '#e0cc78'], path: '#f2dfae', tuft: '#b89c3c', outside: '#e4d298' },
    signs: { '9,7': '<b>Le Port des Voiles</b><br>« Pour tenir son cap, il faut bien mesurer son angle. »' },
    exits: [{ x: 0, y: 8, to: 'village' }, { x: 0, y: 9, to: 'village' }],
    props: [
      { x: 3, y: 2, stamp: 'maison_bois' },
      { x: 5, y: 13, stamp: 'maison_grise' },
      { x: 7, y: 7, t: 'town:57', solid: true },
      { x: 11, y: 12, t: 'town:107', solid: true },
    ],
    npcs: [
      {
        id: 'yann', x: 16, y: 4, t: 'dungeon:85', name: 'Yann, le pilote',
        talk: (A) => A.done('recifs')
          ? ['Bien vu ! Un angle droit, c\'est 90°. Plus petit, il est aigu. Plus grand, obtus.', 'Et les récifs longs ou courts, ça ne change rien à l\'angle !']
          : ['Les passages entre les récifs sont de plus en plus étroits… Mes bateaux ne savent plus par où passer.', 'La carte des récifs est au bout du ponton.'],
      },
      {
        id: 'pia', x: 19, y: 7, t: 'dungeon:99', name: 'Pia, la cartographe',
        talk: (A) => A.done('routes')
          ? ['Parfait ! Centre sur le sommet, zéro sur un côté : voilà la bonne pose.', 'Et si deux nombres hésitent, l\'angle est-il plus petit ou plus grand qu\'un droit ?']
          : ['Je dois relever les routes des bateaux, mais je mélange toujours les deux graduations du rapporteur…', 'Le poste de mesure est sur le quai.'],
      },
      {
        id: 'gus', x: 14, y: 12, t: 'dungeon:98', name: 'Gus, le vieux loup de mer',
        talk: (A) => A.done('cap')
          ? ['Droit sur l\'île ! Mon cap était toujours à dix degrés près.', 'Un bon marin vérifie toujours : le centre sur le sommet !']
          : ['De mon temps, on trouvait son cap au flair… et on finissait au fond de l\'eau.', 'La balise de cap est au bout du ponton sud.'],
      },
      {
        id: 'mina', x: 6, y: 9, t: 'dungeon:88', name: 'Mina, la mousse',
        talk: (A) => A.hasPage('port')
          ? ['Tu as la page de l\'Atlas ! Je veux devenir capitaine, moi aussi.']
          : ['Regarde, la capitaine Lou est sur le quai ! Elle attend que le port soit réparé.', 'Un angle droit, c\'est comme le coin d\'une cale !'],
      },
    ],
    objects: [
      { id: 'o-recifs', x: 14, y: 4, t: 'town:83', kind: 'enigme', enigme: 'recifs' },
      { id: 'o-routes', x: 19, y: 6, t: 'town:116', kind: 'enigme', enigme: 'routes' },
      { id: 'o-cap', x: 14, y: 13, t: 'town:95', kind: 'enigme', enigme: 'cap' },
      {
        id: 'o-gardien', x: 18, y: 11, t: 'dungeon:112', look: lou, name: 'Capitaine Lou', kind: 'gardien',
        notReady: 'Mille sabords ! Je suis la capitaine Lou. Reviens quand tu auras réglé les récifs, les routes et les caps.',
        intro: ['Mille sabords ! Tu as remis mon port en ordre.', 'Place à la Régate : toute la flotte doit rejoindre ses îles. Relève les routes, puis donne les caps. Prêt ?'],
      },
    ],
    treasure: {
      x: 2, y: 15, needs: 'compas',
      hint: 'Ce buisson de sable cache quelque chose… Il faudrait un <b>compas</b> pour tracer le bon cercle. (On le gagne à la Tour du Guetteur.)',
      text: 'Avec le compas, on trouve l\'endroit exact : ici ! Un vieux coffre de marin, plein de pièces…',
    },
    lesson: [
      {
        text: 'Un angle <b>droit</b> mesure 90° : c\'est le coin d\'une feuille. Plus petit, il est <b>aigu</b>. Plus grand, il est <b>obtus</b>.',
        svg: (el) => {
          const s = S.root(el, 480, 210);
          [[50, 'aigu', 40, '#1c7ed6'], [200, 'droit', 90, '#2f9e44'], [350, 'obtus', 135, '#e8590c']].forEach(([x, nom, m, col], i) => {
            const V = { x, y: 150 };
            [0, m].forEach((a) => { const e = pol(V, a, 80); S.el('line', { x1: V.x, y1: V.y, x2: e.x, y2: e.y, stroke: col, 'stroke-width': 5, 'stroke-linecap': 'round' }, s); });
            if (m === 90) rightMark(s, V, 0, 90, 18, '#2b1d0e'); else arcMark(s, V, 0, m, 26, '#2b1d0e');
            S.el('text', { x: x + 35, y: 192, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 800, fill: col, text: nom }, s);
            S.el('text', { x: x + 35, y: 22, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: '#495057', text: ['moins de 90°', '90°', 'plus de 90°'][i] }, s);
          });
        },
      },
      {
        text: 'Pour mesurer : le <b>centre</b> du rapporteur (la croix) sur le <b>sommet</b>, le <b>0</b> sur un <b>côté</b> de l\'angle.',
        svg: (el) => {
          const s = S.root(el, 480, 240);
          const V = { x: 240, y: 190 };
          [0, 50].forEach((a) => { const e = pol(V, a, 215); S.el('line', { x1: V.x, y1: V.y, x2: e.x, y2: e.y, stroke: '#c92a2a', 'stroke-width': 3 }, s); });
          const P = Rapporteur(s, { x: 90, y: 100, rho: 25, interactive: false, w: 480, h: 240 });
          const note = S.el('g', { opacity: 0 }, s);
          S.el('text', { x: 240, y: 234, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: '#2f9e44', stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', text: '① centre sur le sommet   ② 0 sur un côté' }, note);
          const t0 = Date.now();
          const step = () => {
            if (!s.isConnected) return;
            const k = Math.min(1, (Date.now() - t0 - 400) / 1600);
            if (k > 0) {
              const e = k * k * (3 - 2 * k);
              P.set(90 + (V.x - 90) * e, 100 + (V.y - 100) * e, 25 * (1 - e));
            }
            if (k < 1) setTimeout(step, 30); else note.setAttribute('opacity', 1);
          };
          step();
        },
      },
      {
        text: 'Attention aux <b>deux graduations</b> ! Ici le 0 est à droite : on lit <b>50</b>, pas 130. Un angle plus petit qu\'un droit, c\'est moins de 90°.',
        svg: (el) => {
          const s = S.root(el, 480, 240);
          const V = { x: 240, y: 190 };
          [0, 50].forEach((a) => { const e = pol(V, a, 215); S.el('line', { x1: V.x, y1: V.y, x2: e.x, y2: e.y, stroke: '#c92a2a', 'stroke-width': 3 }, s); });
          const P = Rapporteur(s, { x: V.x, y: V.y, rho: 0, interactive: false, w: 480, h: 240 });
          setTimeout(() => { if (s.isConnected) { P.hlArc('out', 50, 50); P.ring('in', 50); } }, 700);
        },
      },
      {
        text: 'Allonger les côtés ne change <b>pas</b> l\'angle ! Seul compte l\'<b>écartement</b> entre les deux côtés.',
        svg: (el) => {
          const s = S.root(el, 480, 200);
          const V = { x: 70, y: 160 };
          const lens = [90, 230, 90];
          const e = (a, l) => pol(V, a, l);
          [0, 40].forEach((a, i) => {
            const ln = S.el('line', { x1: V.x, y1: V.y, x2: e(a, 90).x, y2: e(a, 90).y, stroke: i ? '#e8590c' : '#1c7ed6', 'stroke-width': 6, 'stroke-linecap': 'round' }, s);
            S.el('animate', { attributeName: 'x2', values: lens.map((l) => e(a, l).x).join(';'), dur: '4.5s', repeatCount: 'indefinite' }, ln);
            S.el('animate', { attributeName: 'y2', values: lens.map((l) => e(a, l).y).join(';'), dur: '4.5s', repeatCount: 'indefinite' }, ln);
          });
          arcMark(s, V, 0, 40, 46, '#2f9e44', '40°');
          S.el('text', { x: 330, y: 40, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 800, fill: '#495057', text: 'toujours 40°' }, s);
        },
      },
      {
        text: 'À toi ! Pose le rapporteur sur le sommet <b>O</b>, le 0 sur un côté, puis écris la mesure de l\'angle.',
        act: (stage, done) => {
          const el = h('div', { style: 'width:100%;display:flex;flex-direction:column;align-items:center' });
          stage.append(el);
          const s = S.root(el, VW, 380);
          S.el('rect', { x: 0, y: 0, width: VW, height: 380, fill: '#7cc4f2' }, s);
          const V = { x: 280, y: 310 }, m = 65;
          drawQuai(s, V, 0, 330);
          drawRoute(s, V, m, 250);
          vertexMark(s, V);
          const msg = h('div', { class: 'consigne', style: 'text-align:center;margin:6px 0' }, 'Fais glisser le rapporteur (et tourne-le si besoin).');
          const rays = [{ a: 0 }, { a: m }];
          let ans = null, fin = false;
          const P = Rapporteur(s, {
            x: 640, y: 340, rho: 0, w: VW, h: 380, snapC: V, snapA: [0, 180, m, m + 180],
            onChange: (Q) => {
              const d = poseMesure(Q, V, rays);
              msg.innerHTML = d.ok ? '✅ Bien posé ! Quelle est la mesure de l\'angle ?' : 'Fais glisser le rapporteur (et tourne-le si besoin).';
              if (ans) ans.row.style.display = d.ok ? '' : 'none';
            },
          });
          const fx = S.el('g', { 'pointer-events': 'none' }, s);
          el.append(msg);
          ans = Atlas.UI.answer(el, {
            label: 'L\'angle mesure', unit: '°',
            onSubmit: (v) => {
              if (fin) return;
              P.clearHl();
              const d = poseMesure(P, V, rays);
              if (!d.ok) return Atlas.UI.toast('Le rapporteur n\'est pas bien posé.', 'bad');
              if (Math.abs(v - m) <= 2) { fin = true; arcMark(fx, V, 0, m, 60, '#2f9e44', `${m}°`); done(); }
              else if (Math.abs(v - (180 - m)) <= 2) { P.hlArc(d.zero.scale, d.phi, m); P.ring(d.zero.scale === 'out' ? 'in' : 'out', d.phi); Atlas.UI.toast('C\'est l\'autre graduation : pars du 0 posé sur le côté !', 'bad'); }
              else Atlas.UI.toast('Regarde où le côté coupe la graduation, au degré près.', 'bad');
            },
          });
          ans.row.style.display = 'none';
        },
      },
    ],
    enigmes: {
      recifs: {
        title: 'Les récifs',
        consigne: '',
        build: (ctx) => buildRecifs(ctx, ctx.el),
      },
      routes: {
        title: 'Mesurer les routes',
        consigne: '',
        build: (ctx) => buildMesure(ctx, ctx.el, {
          rounds: [{ m: 'acute', orient: 'right' }, { m: 'obtuse', orient: 'left' }, { m: 'any', orient: 'rot' }],
          onSolved: () => ctx.win('Trois routes mesurées ! Centre sur le sommet, 0 sur un côté, et on lit la graduation qui part de ce 0.'),
        }),
      },
      cap: {
        title: 'Donner le cap',
        consigne: '',
        build: (ctx) => buildCap(ctx, ctx.el, {
          rounds: [{ m: 'acute', orient: 'right' }, { m: 'obtuse', orient: 'left' }, { m: 'any', orient: 'rot' }],
          onSolved: () => ctx.win('Les trois bateaux ont touché leur île ! Pour construire un angle : le 0 sur le côté de départ, on marque la bonne graduation, puis on trace.'),
        }),
      },
    },
    gardien: {
      title: 'La Régate',
      consigne: '<b>Étape 1 / 2</b> — Relève les routes de la flotte : mesure chaque angle au rapporteur.',
      build: (ctx) => {
        buildMesure(ctx, ctx.el, {
          rounds: [{ m: 'obtuse', orient: 'rot' }, { m: 'acute', orient: 'rot' }],
          onSolved: () => {
            Atlas.UI.toast('Étape 1 réussie !', 'good');
            setTimeout(() => {
              buildCap(ctx, ctx.el, {
                rounds: [{ m: 'obtuse', orient: 'rot' }, { m: 'acute', orient: 'rot' }],
                onSolved: () => ctx.win('Toute la flotte est arrivée ! Voici la page de l\'Atlas… et garde ce rapporteur, tu l\'as bien mérité.'),
              });
            }, 900);
          },
        });
      },
    },
    tool: {
      id: 'rapporteur', name: 'Rapporteur',
      icon: '<svg viewBox="0 0 30 30"><path d="M3,24 A12,12 0 0 1 27,24 Z" fill="#e7f5ff" stroke="#1864ab" stroke-width="2" stroke-linejoin="round"/><path d="M15,24 L15,19 M7.5,24 L8.5,21.5 M22.5,24 L21.5,21.5 M10,15.5 L12,17.5 M20,15.5 L18,17.5" stroke="#1864ab" stroke-width="1.5"/><circle cx="15" cy="24" r="1.6" fill="#c92a2a"/></svg>',
    },
  });
})();
