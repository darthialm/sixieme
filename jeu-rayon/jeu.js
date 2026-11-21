/* =========================================================
   LE RAYON · sixième — jeu du chapitre « Les angles » de 6e
   Le joueur commande un rayon laser qui part du sommet O. Pour toucher la cible, il tape l'ANGLE DE TIR :
   l'angle entre la demi-droite [Ox) et le rayon (dans le sens de la flèche). C'est l'angle qui fait jouer.
   - Coup d'œil : on estime (cible large) ; un tir raté montre l'angle tiré, pour corriger.
   - Le rapporteur : cible fine ; on pose un fil sur la cible et on lit la bonne graduation.
   - Angles voisins, angle droit, opposés par le sommet, bissectrice : la cible est trop fine pour viser
     à l'œil ; il faut CALCULER l'angle de tir à partir des mesures données (somme, 180°, 90°, égalité, moitié).
   3 tirs par cible ; les étoiles récompensent les tirs réussis du premier coup.
   Duel (tour par tour, moteur commun) : chacun a une tour et 3 cristaux ; à son tour, on tire sur un cristal
   de l'adversaire. Les murs cachent certains cristaux. Le niveau de chaque joueur règle la finesse des cristaux.
   Adresse avec ?tout : toutes les missions sont ouvertes (pour le professeur).
   ========================================================= */
(function () {
  'use strict';
  const { U } = window.Moteur;
  const { rand, pick, shuffle } = U;
  const app = document.getElementById('app');
  const S = U.store('u6e-rayon');
  S.d.stars = S.d.stars || {};
  const ALL_OPEN = /[?&]tout\b/.test(location.search);
  const Snd = window.Moteur.makeSound(() => !!S.d.mute);
  Snd.zap = function () { this.tone(1400, 0.25, 'sawtooth', 0.04, 300); };
  Snd.shatter = function () { this.noise(0.35, 0.3, 3000); [1568, 2093, 2637].forEach((f, i) => this.tone(f, 0.15, 'triangle', 0.04, 0, i * 0.05)); };
  Snd.thud = function () { this.noise(0.15, 0.25, 400); };
  const muteBtn = document.getElementById('mute');
  const syncMute = () => { muteBtn.textContent = S.d.mute ? '🔇' : '🔊'; };
  muteBtn.addEventListener('click', () => { S.d.mute = !S.d.mute; S.save(); syncMute(); Snd.init(); });
  syncMute();

  /* =========================================================
     Géométrie (écran 400 × 250, angles en degrés, sens inverse des aiguilles d'une montre)
     ========================================================= */
  const D2R = Math.PI / 180, W = 400, H = 250;
  const P = (O, a, L) => ({ x: O.x + L * Math.cos(a * D2R), y: O.y - L * Math.sin(a * D2R) });
  const f = (n) => n.toFixed(1);
  const dirOf = (O, T) => Math.atan2(-(T.y - O.y), T.x - O.x) / D2R;
  const norm180 = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
  const deg = (x) => `${U.num(x)}°`;
  const ang = (s) => `<span class="m-ang">${s}</span>`;
  /** premier obstacle sur le rayon (O, a) : murs (segments), bords. Renvoie la distance */
  function beamLength(O, a, walls) {
    const u = { x: Math.cos(a * D2R), y: -Math.sin(a * D2R) };
    let best = Infinity;
    if (u.x > 1e-9) best = Math.min(best, (W - O.x) / u.x); if (u.x < -1e-9) best = Math.min(best, -O.x / u.x);
    if (u.y > 1e-9) best = Math.min(best, (H - O.y) / u.y); if (u.y < -1e-9) best = Math.min(best, -O.y / u.y);
    for (const w of walls) {
      const v = { x: w.B.x - w.A.x, y: w.B.y - w.A.y }, den = u.x * v.y - u.y * v.x;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((w.A.x - O.x) * v.y - (w.A.y - O.y) * v.x) / den, s = ((w.A.x - O.x) * u.y - (w.A.y - O.y) * u.x) / den;
      if (t > 0.5 && s >= 0 && s <= 1) best = Math.min(best, t);
    }
    return best;
  }
  /** le rayon (O, a) touche-t-il le disque (C, r) avant l'obstacle situé à la distance maxL ? */
  function beamHits(O, a, C, r, maxL) {
    const u = { x: Math.cos(a * D2R), y: -Math.sin(a * D2R) }, w = { x: C.x - O.x, y: C.y - O.y };
    const t = w.x * u.x + w.y * u.y;
    if (t < 0 || t - r > maxL) return false;
    return Math.abs(w.x * u.y - w.y * u.x) <= r;
  }
  const seg = (A, B, cls) => `<line x1="${f(A.x)}" y1="${f(A.y)}" x2="${f(B.x)}" y2="${f(B.y)}" class="${cls}"/>`;
  const txt = (Q, t, cls = 'lbl') => `<text x="${f(Q.x)}" y="${f(Q.y)}" class="${cls}" text-anchor="middle" dominant-baseline="central">${t}</text>`;
  /** arc d'angle de a1 à a2 (dans un sens ou dans l'autre), avec une étiquette au milieu */
  function arc(O, a1, a2, r, cls, label, lr) {
    const lo = Math.min(a1, a2), hi = Math.max(a1, a2), p = P(O, lo, r), q = P(O, hi, r);
    return `<path d="M${f(O.x)} ${f(O.y)} L${f(p.x)} ${f(p.y)} A${r} ${r} 0 ${hi - lo > 180 ? 1 : 0} 0 ${f(q.x)} ${f(q.y)} Z" class="${cls}"/>` + (label ? txt(P(O, (lo + hi) / 2, lr || r + 16), label, `alab ${cls}`) : '');
  }
  const square = (O, a, s = 11) => { const p = P(O, a, s), q = P(p, a + 90, s), r = P(O, a + 90, s); return `<path d="M${f(p.x)} ${f(p.y)} L${f(q.x)} ${f(q.y)} L${f(r.x)} ${f(r.y)}" class="sq"/>`; };
  function protractor(O, base, R = 112) {
    let h = `<g class="prot"><path d="M${f(P(O, base, R).x)} ${f(P(O, base, R).y)} A${R} ${R} 0 0 0 ${f(P(O, base + 180, R).x)} ${f(P(O, base + 180, R).y)} Z" class="pr"/>`;
    for (let t = 0; t <= 180; t += 5) {
      const big = t % 10 === 0, a = base + t;
      h += seg(P(O, a, R), P(O, a, R - (big ? 9 : 5)), 'prt');
      if (big) h += txt(P(O, a, R - 17), 180 - t, 'pro') + txt(P(O, a, R - 30), t, 'pri');
    }
    return h + `<circle cx="${f(O.x)}" cy="${f(O.y)}" r="3" class="prc"/></g>`;
  }

  /* =========================================================
     Les tableaux (une cible par tableau)
     b = { O, r0, s, alpha, tol, T, d, extras, tool, txt, why, hint, kind, labels }
     L'angle de tir α se mesure à partir de [Ox) (direction r0), dans le sens s (+1 ou −1).
     ========================================================= */
  const LOW = { x: 200, y: 228 }, MID = { x: 200, y: 140 };
  const shotDir = (b, alpha) => b.r0 + b.s * alpha;
  function refRay(b) {
    const O = b.O, end = P(O, b.r0, 175), mk = P(O, b.r0, 150);
    // petite flèche courbe au bout de [Ox) : le sens dans lequel on compte l'angle de tir
    const R = 160, a1 = P(O, b.r0, R), a2 = P(O, b.r0 + b.s * 9, R);
    return seg(O, end, 'ref') + txt(P(mk, b.r0 - 90 * b.s, 12), 'x', 'lbl ref') +
      `<path d="M${f(a1.x)} ${f(a1.y)} A${R} ${R} 0 0 ${b.s > 0 ? 0 : 1} ${f(a2.x)} ${f(a2.y)}" class="flow" marker-end="url(#arr)"/>`;
  }
  function target(b) { const r = Math.max(4.5, b.d * Math.tan(b.tol * D2R)); return { C: P(b.O, shotDir(b, b.alpha), b.d), r }; }

  function bEstime(i, tol = 6) {
    const r0 = i < 3 ? 0 : pick([0, 180]), s = r0 === 0 ? 1 : -1;
    return { kind: 'estime', O: LOW, r0, s, alpha: rand(12, 168), d: rand(140, 185), tol, extras: '', tool: false,
      txt: 'Estime l’angle de tir : l’angle entre [Ox) et le rayon, dans le sens de la flèche.', why: (a) => `Il fallait environ ${a}° : compare avec l’angle droit (90°) et l’angle plat (180°).` };
  }
  function bRapporteur(i) {
    const b = bEstime(i + 3, 2);
    b.kind = 'rapporteur'; b.tool = true; b.alpha = rand(3, 34) * 5 + pick([0, 0, 1, -1, 2, -2]);
    b.txt = 'Pose le <b>fil</b> sur la cible (fais-le glisser), puis lis la mesure : attention, prends la graduation qui part de 0 sur [Ox) !';
    b.why = (a) => `Il fallait ${a}°. Le 0 posé sur [Ox) est celui de la graduation ${b.r0 === 0 ? 'intérieure' : 'extérieure'} : c’est celle-là qu’on suit.`;
    return b;
  }
  function bSupp() {
    const alpha = pick([rand(100, 165), rand(15, 80)]), m = 180 - alpha, O = MID;
    const b = { kind: 'supp', O, r0: 0, s: 1, alpha, d: 112, tol: 1, tool: false };
    b.extras = seg(O, P(O, 180, 175), 'ref') + txt(P(P(O, 180, 150), 90, 12), 'x’', 'lbl ref') + arc(O, alpha, 180, 34, 'given', m + '°') + seg(O, P(O, alpha, 100), 'help') + txt(P(P(O, alpha, 94), alpha + 90, 11), 'z', 'lbl');
    b.txt = `x’, O et x sont alignés, et ${ang('x’Oz')} = ${m}°. Vise la cible sur [Oz) : quel est l’angle ${ang('xOz')} ?`;
    b.hint = 'x’, O, x alignés : les deux angles ' + ang('xOz') + ' et ' + ang('zOx’') + ' forment un angle plat (180°).';
    b.why = () => `${ang('xOz')} et ${ang('zOx’')} sont supplémentaires : 180° − ${m}° = ${alpha}°.`;
    return b;
  }
  function bAdj() {
    const p = rand(20, 75), q = rand(20, 85), alpha = p + q, O = MID;
    if (alpha > 168) return bAdj();
    const b = { kind: 'adj', O, r0: 0, s: 1, alpha, d: 112, tol: 1, tool: false };
    b.extras = seg(O, P(O, p, 125), 'help2') + txt(P(P(O, p, 112), p + 90, 12), 'u', 'lbl') + arc(O, 0, p, 46, 'given', p + '°', 60) + arc(O, p, alpha, 32, 'given2', q + '°', 46) + seg(O, P(O, alpha, 100), 'help') + txt(P(P(O, alpha, 94), alpha + 90, 11), 'z', 'lbl');
    b.txt = `${ang('xOu')} = ${p}° et ${ang('uOz')} = ${q}°. Quel est l’angle de tir ${ang('xOz')} ?`;
    b.hint = `${ang('xOu')} et ${ang('uOz')} sont adjacents : ensemble, ils forment ${ang('xOz')}.`;
    b.why = () => `Les angles sont adjacents : ${p}° + ${q}° = ${alpha}°.`;
    return b;
  }
  function bComp() {
    const m = rand(12, 78), inside = Math.random() < 0.55, alpha = inside ? 90 - m : 90 + m, O = MID;
    const b = { kind: 'comp', O, r0: 0, s: 1, alpha, d: 112, tol: 1, tool: false };
    b.extras = seg(O, P(O, 90, 135), 'help2') + square(O, 0) + txt(P(P(O, 90, 128), 180, 10), 'y', 'lbl') + arc(O, 90, alpha, 38, 'given', m + '°') + seg(O, P(O, alpha, 100), 'help') + txt(P(P(O, alpha, 94), alpha + 90, 11), 'z', 'lbl');
    b.txt = `${ang('xOy')} est un angle droit et ${ang('yOz')} = ${m}°. Quel est l’angle de tir ${ang('xOz')} ?`;
    b.hint = `L’angle droit ${ang('xOy')} mesure 90°. [Oz) est-elle à l’intérieur ou à l’extérieur de cet angle droit ?`;
    b.why = () => inside ? `[Oz) est dans l’angle droit : 90° − ${m}° = ${alpha}° (angles complémentaires).` : `[Oz) est au-delà de [Oy) : 90° + ${m}° = ${alpha}°.`;
    return b;
  }
  function bOpp() {
    const alpha = rand(18, 82), O = MID;
    const b = { kind: 'opp', O, r0: 0, s: 1, alpha, d: 112, tol: 1, tool: false };
    b.extras = seg(O, P(O, 180, 175), 'ref') + txt(P(P(O, 180, 150), 90, 12), 'x’', 'lbl ref') + seg(P(O, alpha + 180, 120), O, 'help2') + txt(P(P(O, alpha + 180, 112), alpha + 90, 12), 'z’', 'lbl') + arc(O, 180, 180 + alpha, 34, 'given', alpha + '°') + seg(O, P(O, alpha, 100), 'help') + txt(P(P(O, alpha, 94), alpha + 90, 11), 'z', 'lbl');
    b.txt = `Les droites (xx’) et (zz’) se coupent en O, et ${ang('x’Oz’')} = ${alpha}°. Quel est l’angle de tir ${ang('xOz')} ?`;
    b.hint = `${ang('xOz')} et ${ang('x’Oz’')} ont le même sommet et leurs côtés se prolongent : comment s’appellent-ils ?`;
    b.why = () => `${ang('xOz')} et ${ang('x’Oz’')} sont opposés par le sommet : ils ont la même mesure, ${alpha}°.`;
    return b;
  }
  function bBis(hard) {
    const w = rand(10, 45) * 2, O = LOW;
    let p = rand(10, 160 - w);
    const alpha = p + w / 2, sup = hard && Math.random() < 0.6;
    const b = { kind: 'bis', O, r0: 0, s: 1, alpha, d: 160, tol: 1, tool: false };
    b.extras = seg(O, P(O, p, 190), 'wall') + seg(O, P(O, p + w, 190), 'wall') + txt(P(P(O, p, 180), p - 90, 12), 'a', 'lbl') + txt(P(P(O, p + w, 180), p + w + 90, 12), 'b', 'lbl') + arc(O, p, p + w, 54, 'given2', w + '°', 70);
    if (sup) { b.extras += seg(O, P(O, 180, 175), 'ref') + txt(P(P(O, 180, 150), 90, 12), 'x’', 'lbl ref') + arc(O, p + w, 180, 30, 'given', (180 - p - w) + '°', 44); }
    else b.extras += arc(O, 0, p, 30, 'given', p + '°', 44);
    b.txt = sup ? `x’, O, x sont alignés, ${ang('bOx’')} = ${180 - p - w}° et ${ang('aOb')} = ${w}°. Tire sur la <b>bissectrice</b> de ${ang('aOb')} : quel angle de tir ?`
      : `${ang('xOa')} = ${p}° et ${ang('aOb')} = ${w}°. Tire sur la <b>bissectrice</b> de ${ang('aOb')} : quel angle de tir ?`;
    b.hint = sup ? `Commence par ${ang('xOb')} (180° − …), puis enlève la moitié de ${ang('aOb')}.` : `La bissectrice coupe ${ang('aOb')} en deux angles de ${w / 2}°. Ajoute-les à ${ang('xOa')}.`;
    b.why = () => sup ? `${ang('xOb')} = 180° − ${180 - p - w}° = ${p + w}°, puis ${p + w}° − ${w}° : 2 = ${p + w}° − ${w / 2}° = ${alpha}°.` : `La bissectrice partage ${ang('aOb')} en deux : ${w}° : 2 = ${w / 2}°, et ${p}° + ${w / 2}° = ${alpha}°.`;
    return b;
  }

  const MISSIONS = [
    { id: 'm1', icon: '👁️', name: 'Coup d’œil', tag: 'Estimer un angle', n: 6, gen: (i) => bEstime(i),
      rule: 'L’<b>angle de tir</b> est l’angle entre [Ox) et le rayon. Compare avec l’angle droit (90°), sa moitié (45°) et l’angle plat (180°).', tip: 'La cible est large : une bonne estimation suffit. Si tu rates, ton tir s’affiche avec sa mesure : corrige !' },
    { id: 'm2', icon: '📐', name: 'Le rapporteur', tag: 'Mesurer un angle', n: 6, gen: (i) => bRapporteur(i),
      rule: 'Le rapporteur est posé : centre sur O, 0 sur [Ox). Fais glisser le <b>fil</b> sur la cible, puis lis la graduation qui part de <b>ce</b> 0.', tip: 'La cible est fine : il faut mesurer. Attention, [Ox) part parfois vers la gauche : la bonne graduation change !' },
    { id: 'm3', icon: '➕', name: 'Angles voisins', tag: 'Adjacents, supplémentaires', n: 6, gen: (i) => (i % 2 ? bSupp() : bAdj()),
      rule: '<b>Adjacents</b> : leurs mesures s’ajoutent. <b>Supplémentaires</b> (points alignés) : la somme fait 180°.', tip: 'La cible est minuscule : impossible de viser à l’œil. Il faut <b>calculer</b> l’angle de tir.' },
    { id: 'm4', icon: '📏', name: 'L’angle droit', tag: 'Complémentaires', n: 6, gen: () => bComp(),
      rule: 'Un angle droit mesure <b>90°</b>. Deux angles <b>complémentaires</b> ont une somme de 90°.', tip: 'Regarde bien où est [Oz) : dans l’angle droit, ou au-delà ?' },
    { id: 'm5', icon: '✖️', name: 'Opposés', tag: 'Opposés par le sommet', n: 6, gen: (i) => (i < 4 ? bOpp() : pick([bOpp, bSupp, bComp])()),
      rule: 'Deux angles <b>opposés par le sommet</b> ont la <b>même mesure</b>.', tip: 'Deux droites qui se croisent en O : l’angle connu est en bas, la cible en haut…' },
    { id: 'm6', icon: '✂️', name: 'La bissectrice', tag: 'Passer entre deux murs', n: 6, gen: (i) => bBis(i >= 4),
      rule: 'La <b>bissectrice</b> partage un angle en deux angles de même mesure.', tip: 'Le rayon doit passer pile au milieu des deux murs.' },
    { id: 'm7', icon: '🏰', name: 'Le Phare', tag: 'Tout le chapitre', n: 8, boss: true, gen: (i) => [bRapporteur, bSupp, bAdj, bComp, bOpp, () => bBis(true), bSupp, () => bBis(true)][i](i),
      rule: 'Mesurer, ajouter, compléter à 90° ou à 180°, reconnaître des angles opposés, couper en deux : tout sert !', tip: 'Le gardien du phare n’accepte que les tirs parfaits.' },
  ];
  const unlocked = (i) => ALL_OPEN || i === 0 || (S.d.stars[MISSIONS[i - 1].id] || 0) > 0;
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;

  /* =========================================================
     Dessin d'un tableau
     ========================================================= */
  const DEFS = '<defs><marker id="arr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="arrh"/></marker></defs>';
  function boardSVG(b, st) {
    const t = target(b);
    let h = `<svg viewBox="0 0 ${W} ${H}" class="rfig" role="img" aria-label="Le tir">${DEFS}<rect x="0" y="0" width="${W}" height="${H}" class="sky"/>`;
    h += b.extras + refRay(b);
    if (st.showProt) h += protractor(b.O, b.r0 === 0 ? 0 : 0);
    (st.shots || []).forEach((s, k) => {
      const a = shotDir(b, s.v), L = beamLength(b.O, a, []);
      h += seg(b.O, P(b.O, a, s.hit ? b.d : L), `beam${k === st.shots.length - 1 ? ' last' : ' old'}${s.hit ? ' hit' : ''}`);
      if (st.showMyAngle && k === st.shots.length - 1 && !s.hit) h += arc(b.O, b.r0, a, 22, 'mine', deg(s.v), 40);
    });
    if (st.solution) h += seg(b.O, t.C, 'beam sol');
    h += `<g class="tgt${st.hit ? ' boom' : ''}"><circle cx="${f(t.C.x)}" cy="${f(t.C.y)}" r="${f(t.r + 5)}" class="tg2"/><circle cx="${f(t.C.x)}" cy="${f(t.C.y)}" r="${f(t.r)}" class="tg"/></g>`;
    if (st.thread !== undefined) h += seg(b.O, P(b.O, st.thread, 230), 'thread');
    h += `<g class="tower" transform="translate(${f(b.O.x)},${f(b.O.y)})"><circle r="9" class="tw"/><circle r="3.5" class="tw2"/></g>` + txt({ x: b.O.x + (b.r0 === 0 ? -12 : 12), y: b.O.y + 12 }, 'O', 'lbl');
    return h + '</svg>';
  }
  /** fil du rapporteur : suit le doigt sur la figure */
  function bindThread(svgEl, O, onMove) {
    let drag = false;
    const pt = (e) => { const m = svgEl.getScreenCTM(); if (!m) return null; const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); return p; };
    const mv = (e) => { const p = pt(e); if (p) onMove(dirOf(O, p)); };
    svgEl.addEventListener('pointerdown', (e) => { drag = true; try { svgEl.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } mv(e); e.preventDefault(); });
    svgEl.addEventListener('pointermove', (e) => { if (drag) mv(e); });
    svgEl.addEventListener('pointerup', () => { drag = false; });
    svgEl.addEventListener('pointercancel', () => { drag = false; });
  }

  /* =========================================================
     Écrans (solo)
     ========================================================= */
  let G = null;
  const guide = (html) => `<div class="guide"><span class="face" aria-hidden="true">🧑‍🚀</span><div class="say">${html}</div></div>`;
  function home() {
    if (G && G.pad) G.pad.kill();
    G = null;
    const total = MISSIONS.reduce((s, z) => s + (S.d.stars[z.id] || 0), 0);
    const nextI = MISSIONS.findIndex((z, i) => unlocked(i) && !S.d.stars[z.id]);
    app.innerHTML = `<div class="screen">
      <header class="brand"><h1>Le <span>Rayon</span></h1><span class="lvl">sixième</span></header>
      <p class="tag">Vise juste : l’angle de tir, c’est toi qui le trouves. · <b>⭐ ${total} / ${MISSIONS.length * 3}</b></p>
      ${guide(!S.d.intro ? 'Salut, je suis <b>Lumen</b>. Mon laser part du point O. Pour toucher une cible, tape l’<b>angle de tir</b> : l’angle entre la demi-droite [Ox) et le rayon. D’abord à l’œil, puis au rapporteur… et ensuite, les cibles seront si fines qu’il faudra <b>calculer</b> !'
        : pick(['Un tir raté ? Demande-toi : trop ouvert, ou pas assez ?', 'Points alignés = angle plat = 180°.', 'Le 0 du rapporteur doit être <b>sur</b> [Ox).', 'Défie un ami en <b>Duel</b> sur la même tablette !']))}
      <button type="button" class="duel-btn" data-act="duel">⚔️ <b>Duel des tours</b> <small>à deux, chacun son tour : brise les 3 cristaux de l’autre</small></button>
      <div class="map">${MISSIONS.map((z, i) => { const lock = !unlocked(i), st = S.d.stars[z.id] || 0; return `<button type="button" class="zone${z.boss ? ' boss' : ''}${lock ? ' locked' : ''}${i === nextI ? ' next' : ''}" data-z="${i}" ${lock ? 'disabled' : ''}>
        <span class="num">${i + 1}</span><span class="ico">${lock ? '🔒' : z.icon}</span><span class="nm">${z.name}</span><span class="rl">${z.tag}</span><span class="st">${starStr(st)}</span></button>`; }).join('')}</div>
      <p class="foot">Une étoile ouvre la mission suivante. ⭐⭐⭐ = toutes les cibles touchées du premier coup. Ta progression reste sur cet appareil.</p></div>`;
    app.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => { Snd.init(); S.d.intro = true; S.save(); brief(MISSIONS[Number(b.dataset.z)]); }));
    app.querySelector('[data-act="duel"]').addEventListener('click', () => { Snd.init(); duel(); });
    app.scrollTop = 0;
  }
  function brief(M) {
    const idx = MISSIONS.indexOf(M);
    app.innerHTML = `<div class="screen"><div class="card"><p class="kicker">Mission ${idx + 1} / ${MISSIONS.length} · ${M.tag}</p><h1>${M.icon} ${M.name}</h1>
      <div class="rule">${M.rule}</div>${guide(M.tip)}<p class="howto">${M.n} cibles, 3 tirs par cible. Tape l’angle de tir sur le pavé, puis « Tirer ».</p>
      <div class="row"><button type="button" class="btn ghost" data-act="back">← Missions</button><button type="button" class="btn go" data-act="go">▶ Allumer le laser</button></div></div></div>`;
    app.querySelector('[data-act="back"]').addEventListener('click', home);
    app.querySelector('[data-act="go"]').addEventListener('click', () => start(M));
    app.querySelector('[data-act="go"]').focus();
  }
  function start(M) { G = { M, i: 0, first: 0, shotsTotal: 0, missed: 0, res: [] }; nextBoard(); }
  function nextBoard() {
    const M = G.M;
    if (G.i >= M.n) { end(); return; }
    G.b = M.gen(G.i); G.st = { shots: [], showMyAngle: G.b.kind === 'estime', thread: G.b.tool ? 90 : undefined, showProt: G.b.tool }; G.phase = 'aim';
    app.innerHTML = `<div class="screen play"><div class="hud"><button type="button" class="quit" data-act="quit" aria-label="Arrêter">✕</button><span class="zn">${M.icon} ${M.name}</span>
      <span class="dots">${Array.from({ length: M.n }, (_, i) => `<i class="${G.res[i] || (i === G.i ? 'cur' : '')}"></i>`).join('')}</span><span class="ammo" id="ammo"></span></div>
      <div class="game"><div class="field" id="field"></div><div class="side"><p class="ask">${G.b.txt}</p><div id="padh"></div><div id="msg" class="msg"></div></div></div></div>`;
    app.querySelector('[data-act="quit"]').addEventListener('click', () => { if (confirm('Arrêter la mission ?')) home(); });
    G.pad = window.Moteur.pad(document.getElementById('padh'), { unit: '°', ok: '⚡ Tirer', keyboard: true, sound: Snd, onSubmit: fire });
    draw();
  }
  function draw() {
    const field = document.getElementById('field');
    field.innerHTML = boardSVG(G.b, G.st);
    document.getElementById('ammo').innerHTML = [0, 1, 2].map((k) => `<span class="${k < G.st.shots.length ? 'used' : ''}">⚡</span>`).join('');
    if (G.b.tool && G.phase === 'aim') {
      const svgEl = field.querySelector('svg');
      bindThread(svgEl, G.b.O, (a) => { G.st.thread = a; const th = svgEl.querySelector('.thread'); if (th) { const e = P(G.b.O, a, 230); th.setAttribute('x2', f(e.x)); th.setAttribute('y2', f(e.y)); } });
    }
  }
  function fire(v) {
    if (!G || G.phase !== 'aim') return;
    if (v > 180) { document.getElementById('msg').innerHTML = '<div class="explain">Un angle de tir est compris entre 0° et 180° ici.</div>'; return; }
    const b = G.b, hit = Math.abs(v - b.alpha) <= b.tol + 1e-9;
    G.st.shots.push({ v, hit }); G.shotsTotal++;
    Snd.zap();
    G.pad.clear();
    const msg = document.getElementById('msg');
    if (hit) {
      G.phase = 'done'; G.st.hit = true; draw(); setTimeout(() => Snd.shatter(), 150);
      const first = G.st.shots.length === 1; if (first) G.first++;
      G.res[G.i] = first ? 'ok' : 'mid'; G.i++;
      msg.innerHTML = `<div class="explain good"><b>🎯 Touché${first ? ' du premier coup' : ''} !</b> ${b.kind === 'estime' || b.kind === 'rapporteur' ? `La cible était à ${b.alpha}°.` : b.why()}</div><button type="button" class="btn go" data-act="next">Cible suivante ▶</button>`;
      if (first) U.confetti(30, ['#7df9ff', '#fff36b', '#ff6bd6']);
    } else {
      draw(); setTimeout(() => Snd.thud(), 150);
      const dir = v > b.alpha ? 'trop ouvert' : 'pas assez ouvert';
      if (G.st.shots.length >= 3) {
        G.phase = 'done'; G.missed++; G.res[G.i] = 'ko'; G.i++; G.st.solution = true; draw();
        msg.innerHTML = `<div class="explain"><b>Raté (${v}° : ${dir}).</b> ${b.why(b.alpha)}</div><button type="button" class="btn go" data-act="next">Cible suivante ▶</button>`;
      } else {
        msg.innerHTML = `<div class="explain"><b>Raté : ${v}°, c’est ${dir}.</b> ${b.hint && G.st.shots.length === 1 ? `<br>💡 ${b.hint}` : b.kind === 'estime' ? 'Regarde l’angle que tu as tiré, et corrige.' : ''}</div>`;
        return;
      }
    }
    const nb = app.querySelector('[data-act="next"]'); nb.focus();
    nb.addEventListener('click', nextBoard);
  }
  function end() {
    const M = G.M, idx = MISSIONS.indexOf(M), next = MISSIONS[idx + 1];
    const stars = G.first === M.n ? 3 : G.first >= M.n - 2 && G.missed === 0 ? 2 : 1;
    const old = S.d.stars[M.id] || 0; S.d.stars[M.id] = Math.max(old, stars); S.save();
    if (G.pad) G.pad.kill();
    Snd.win(); U.confetti(stars * 30);
    app.innerHTML = `<div class="screen"><div class="card"><p class="kicker">Mission ${idx + 1} · ${M.name}</p><h1 class="center">${stars === 3 ? 'Tirs parfaits !' : 'Mission terminée'}</h1>
      <div class="stars">${[0, 1, 2].map((i) => `<span class="${i < stars ? 'on' : ''}" style="animation-delay:${0.2 + i * 0.25}s">★</span>`).join('')}</div>
      <div class="stats"><div><b>${G.first}</b><span>du premier coup</span></div><div><b>${G.shotsTotal}</b><span>tirs</span></div><div><b>${G.missed}</b><span>cible${G.missed > 1 ? 's' : ''} manquée${G.missed > 1 ? 's' : ''}</span></div></div>
      ${guide(stars === 3 ? 'Précision parfaite ! Tu n’as pas tiré au hasard : tu as trouvé l’angle.' : 'Pour 3 étoiles, chaque cible doit tomber du premier tir. Prends le temps de trouver l’angle avant de tirer !')}
      ${!old && next ? `<p class="center unlock">🔓 Mission ouverte : ${next.icon} ${next.name}</p>` : ''}
      <div class="row"><button type="button" class="btn ghost" data-act="home">← Missions</button><button type="button" class="btn${next ? '' : ' go'}" data-act="again">↻ Rejouer</button>${next ? '<button type="button" class="btn go" data-act="next">Mission suivante ▶</button>' : ''}</div></div></div>`;
    app.querySelector('[data-act="home"]').addEventListener('click', home);
    app.querySelector('[data-act="again"]').addEventListener('click', () => start(M));
    app.querySelector('[data-act="next"]')?.addEventListener('click', () => brief(next));
    G = null;
  }

  /* =========================================================
     DUEL DES TOURS (tour par tour)
     Joueur 0 : tour en bas à gauche, [Ox) vers la droite. Joueur 1 : tour en bas à droite, [Ox) vers la gauche.
     Chacun a 3 cristaux dans son camp ; on tire sur ceux de l'adversaire. Les murs arrêtent les rayons.
     ========================================================= */
  const LV = [
    { id: '1', nom: 'Œil de lynx', desc: 'Cristaux larges, à l’estime', tol: 5, prot: false },
    { id: '2', nom: 'Géomètre', desc: 'Cristaux fins, rapporteur et fil', tol: 2.2, prot: true },
    { id: '3', nom: 'Sniper', desc: 'Cristaux très fins, rapporteur et fil', tol: 1.2, prot: true },
  ];
  function duel() {
    window.Moteur.match({ jeu: 'rayon-6e', titre: 'Le Rayon', niveauScolaire: 'sixième', theme: 'rayon', icone: '⚡', sound: Snd, niveaux: LV, quitter: home,
      start: (ctx) => duelStart(ctx) });
  }
  function duelStart(ctx) {
    const T = [{ O: { x: 34, y: 226 }, r0: 0, s: 1 }, { O: { x: 366, y: 226 }, r0: 180, s: -1 }];
    // les murs du milieu
    const walls = [];
    for (let k = 0; k < 2; k++) { const x = rand(150, 250), y = rand(60, 200), a = rand(60, 120), L = rand(30, 55); walls.push({ A: P({ x, y }, a, L / 2), B: P({ x, y }, a + 180, L / 2) }); }
    // les cristaux : ceux du joueur k sont dans SON camp ; on les règle selon le niveau du TIREUR (l'adversaire)
    const crystals = [[], []];
    for (let k = 0; k < 2; k++) {
      const shooter = T[1 - k], tol = LV.find((l) => l.id === ctx.P[1 - k].niveau).tol;
      for (let t = 0; t < 300 && crystals[k].length < 3; t++) {
        const C = { x: k === 0 ? rand(40, 170) : rand(230, 360), y: rand(30, 175) };
        const d = Math.hypot(C.x - shooter.O.x, C.y - shooter.O.y), r = Math.max(4, d * Math.tan(tol * D2R));
        if (crystals[k].some((c) => Math.hypot(c.C.x - C.x, c.C.y - C.y) < 2 * r + 30)) continue;
        if (Math.hypot(C.x - T[k].O.x, C.y - T[k].O.y) < 60) continue;
        crystals[k].push({ C, r, alive: true });
      }
    }
    const D = { T, walls, crystals, turn: Math.random() < 0.5 ? 0 : 1, shots: [], last: null, ui: [] };
    ctx.P.forEach((p) => {
      p.el.innerHTML = `<div class="dz"><div class="dhead"><span class="dme">${p.k === 0 ? '🟦' : '🟥'} ${U.esc(p.nom)}</span><span class="dcr" data-c></span></div>
        <div class="dfield"></div><p class="m-turnmsg"></p><div class="dpad"></div><div class="dmsg"></div></div>`;
      D.ui[p.k] = { pad: window.Moteur.pad(p.el.querySelector('.dpad'), { unit: '°', ok: '⚡ Tirer', sound: Snd, onSubmit: (v) => shoot(p.k, v) }), thread: LV.find((l) => l.id === p.niveau).prot ? 90 : undefined };
    });
    function svgFor(k) {
      let h = `<svg viewBox="0 0 ${W} ${H}" class="rfig" role="img" aria-label="Plateau du duel">${DEFS}<rect x="0" y="0" width="${W}" height="${H}" class="sky"/>`;
      h += `<rect x="0" y="0" width="200" height="${H}" class="camp c0"/><rect x="200" y="0" width="200" height="${H}" class="camp c1"/>`;
      walls.forEach((w) => { h += seg(w.A, w.B, 'wall'); });
      const me = T[k], lv = LV.find((l) => l.id === ctx.P[k].niveau);
      if (lv.prot && D.turn === k) h += protractor(me.O, 0, 120);
      T.forEach((t, j) => { h += seg(t.O, P(t.O, t.r0, 70), 'ref') + txt(P(P(t.O, t.r0, 60), 90, 11), 'x', 'lbl ref'); const sw = t.s > 0 ? [t.r0, t.r0 + 30] : [t.r0 - 30, t.r0], a1 = P(t.O, sw[0], 22), a2 = P(t.O, sw[1], 22); h += `<path d="M${f(a1.x)} ${f(a1.y)} A22 22 0 0 0 ${f(a2.x)} ${f(a2.y)}" class="flow" marker-end="url(#arr)"/>`; });
      crystals.forEach((cs, j) => cs.forEach((c) => { if (c.alive) h += `<g class="cry c${j}"><path d="M${f(c.C.x)} ${f(c.C.y - c.r - 5)} L${f(c.C.x + c.r + 3)} ${f(c.C.y)} L${f(c.C.x)} ${f(c.C.y + c.r + 5)} L${f(c.C.x - c.r - 3)} ${f(c.C.y)} Z" class="cr"/><circle cx="${f(c.C.x)}" cy="${f(c.C.y)}" r="${f(c.r)}" class="core"/></g>`; else h += `<g class="shard"><circle cx="${f(c.C.x)}" cy="${f(c.C.y)}" r="4" class="dead"/></g>`; }));
      D.shots.slice(-2).forEach((s, i, arr) => { const t = T[s.k], a = t.r0 + t.s * s.v; h += seg(t.O, P(t.O, a, s.L), `beam ${i === arr.length - 1 ? 'last' : 'old'} b${s.k}`); });
      if (D.ui[k].thread !== undefined && D.turn === k) h += seg(me.O, P(me.O, D.ui[k].thread, 500), 'thread');
      T.forEach((t, j) => { h += `<g transform="translate(${f(t.O.x)},${f(t.O.y)})"><circle r="10" class="tw t${j}"/><circle r="3.5" class="tw2"/></g>`; });
      return h + '</svg>';
    }
    function render() {
      ctx.turn(D.turn);
      ctx.P.forEach((p) => {
        const k = p.k, fl = p.el.querySelector('.dfield');
        fl.innerHTML = svgFor(k);
        p.el.querySelector('[data-c]').innerHTML = `Mes cristaux : ${crystals[k].map((c) => (c.alive ? '💎' : '·')).join(' ')}`;
        p.el.querySelector('.m-turnmsg').textContent = D.turn === k ? 'À toi de tirer ! Tape ton angle de tir.' : `Au tour de ${ctx.P[1 - k].nom}…`;
        D.ui[k].pad.enable(D.turn === k);
        const lv = LV.find((l) => l.id === p.niveau);
        if (lv.prot && D.turn === k) {
          const svgEl = fl.querySelector('svg');
          bindThread(svgEl, T[k].O, (a) => { D.ui[k].thread = a; const th = svgEl.querySelector('.thread'); const e = P(T[k].O, a, 500); if (th) { th.setAttribute('x2', f(e.x)); th.setAttribute('y2', f(e.y)); } });
        }
      });
    }
    function shoot(k, v) {
      if (D.turn !== k || D.busy) return;
      if (v > 180) return;
      const t = T[k], a = t.r0 + t.s * v, L = beamLength(t.O, a, walls), enemy = crystals[1 - k];
      let hitC = null, best = Infinity;
      enemy.forEach((c) => { if (c.alive && beamHits(t.O, a, c.C, c.r, L)) { const d = Math.hypot(c.C.x - t.O.x, c.C.y - t.O.y); if (d < best) { best = d; hitC = c; } } });
      const len = hitC ? best : L;
      D.shots.push({ k, v, L: len, hit: !!hitC });
      D.ui[k].pad.clear(); D.ui[k].thread = 90;
      Snd.zap();
      if (hitC) { hitC.alive = false; setTimeout(() => Snd.shatter(), 150); } else setTimeout(() => Snd.thud(), 150);
      const who = ctx.P[k].nom;
      const line = hitC ? `💥 ${U.esc(who)} tire à <b>${U.num(v)}°</b> : cristal brisé !` : `${U.esc(who)} tire à <b>${U.num(v)}°</b> : raté${L < beamLength(t.O, a, []) - 1 ? ' (un mur arrête le rayon)' : ''}.`;
      ctx.P.forEach((p) => { p.el.querySelector('.dmsg').innerHTML = line; });
      if (enemy.every((c) => !c.alive)) {
        D.busy = true; render();
        ctx.later(() => ctx.end({ winner: k, text: ctx.P.map((p) => `<p class="m-dim">${p.k === k ? 'Tu as brisé les 3 cristaux' : `${U.esc(ctx.P[k].nom)} a brisé tes 3 cristaux`} en ${D.shots.filter((s) => s.k === k).length} tirs.</p>`),
          score: ctx.P.map((p) => `${D.shots.filter((s) => s.k === p.k && s.hit).length}/${D.shots.filter((s) => s.k === p.k).length}`),
          stats: ctx.P.map((p) => ({ tirs: D.shots.filter((s) => s.k === p.k).length, touches: D.shots.filter((s) => s.k === p.k && s.hit).length })) }), 1200);
        return;
      }
      D.turn = 1 - k; render();
    }
    render();
  }

  window.__rayon = { MISSIONS, bEstime, bRapporteur, bSupp, bAdj, bComp, bOpp, bBis, beamLength, beamHits };
  home();
})();
