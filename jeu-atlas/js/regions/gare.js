/* =========================================================
   Région 1 — LA GARE DU BROUILLARD · chapitre 1 « Parallèles et perpendiculaires (rappels) »
   Attendus : perpendiculaires / parallèles ; deux perpendiculaires à une même droite sont parallèles ;
   une perpendiculaire à l'une de deux parallèles est perpendiculaire à l'autre ; tracer à l'équerre ;
   plus court chemin d'un point à une droite.
   Énigmes :
     signaux    les rails sont dans le brouillard ; seul le carnet du chef donne les relations (⊥, ⫽).
                Il faut répartir les trains en 2 départs : deux trains d'un même départ ne doivent jamais
                se croiser → il faut DÉDUIRE quels rails sont parallèles.
     equerre    tracer à l'équerre (qu'on fait glisser le long d'une droite) le rail perpendiculaire,
                puis le rail parallèle, passant par une station. Le wagon roule sur ce qu'on a tracé.
     passerelle on choisit où arrive la passerelle sur la voie ; on n'a que les planches de la plus courte.
   Gardien : l'Aiguillage géant (signaux à 7 rails + rail parallèle à l'équerre).
   ========================================================= */
(function () {
  'use strict';
  const { h, svg: S, geo } = Atlas;
  const VW = 800, VH = 500;

  /* ---------- Outils communs ---------- */
  const unit = (deg) => ({ x: Math.cos((deg * Math.PI) / 180), y: Math.sin((deg * Math.PI) / 180) });
  const add = (p, u, k) => ({ x: p.x + u.x * k, y: p.y + u.y * k });
  const perpOf = (u) => ({ x: -u.y, y: u.x });
  const distToLine = (P, L) => Math.abs((P.x - L.p.x) * L.u.y - (P.y - L.p.y) * L.u.x);
  const angleBetween = (u, v) => { const c = Math.abs(u.x * v.x + u.y * v.y); return (Math.acos(Math.min(1, c)) * 180) / Math.PI; };

  function drawLine(svg, L, attrs) {
    const a = add(L.p, L.u, -2000), b = add(L.p, L.u, 2000);
    return S.el('line', Object.assign({ x1: a.x, y1: a.y, x2: b.x, y2: b.y }, attrs), svg);
  }
  function rails(svg, L, color = '#6b4f2a') {
    const g = S.el('g', {}, svg);
    drawLine(g, L, { stroke: '#c9b48a', 'stroke-width': 14, 'stroke-linecap': 'butt' });
    const n = perpOf(L.u);
    for (let k = -60; k <= 60; k++) {
      const c = add(L.p, L.u, k * 18);
      const a = add(c, n, 9), b = add(c, n, -9);
      S.el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: '#8a6a3e', 'stroke-width': 3 }, g);
    }
    [4, -4].forEach((o) => {
      const p = add(L.p, n, o);
      drawLine(g, { p, u: L.u }, { stroke: color, 'stroke-width': 2.5 });
    });
    return g;
  }
  function station(svg, P, label, color = '#1c7ed6') {
    const g = S.el('g', {}, svg);
    S.el('circle', { cx: P.x, cy: P.y, r: 9, fill: color, stroke: '#fff', 'stroke-width': 3 }, g);
    S.el('text', { x: P.x + 13, y: P.y - 10, 'font-size': 22, 'font-weight': 800, fill: color, text: label, stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke' }, g);
    return g;
  }
  function rightAngle(svg, V, u, n, size = 14, color = '#e8590c') {
    const a = add(V, u, size), c = add(add(V, u, size), n, size), b = add(V, n, size);
    return S.el('path', { d: `M${a.x},${a.y} L${c.x},${c.y} L${b.x},${b.y}`, fill: 'none', stroke: color, 'stroke-width': 3 }, svg);
  }

  /* ---------- L'équerre virtuelle : elle glisse le long d'une droite de base ---------- */
  Atlas.Equerre = function (svg, base, { onMove } = {}) {
    const E = { base, t: 0, s: 1, g: S.el('g', { class: 'equerre' }, svg) };
    const poly = S.el('polygon', { fill: 'rgba(116,192,252,0.45)', stroke: '#1864ab', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, E.g);
    const marks = S.el('g', {}, E.g);
    const ra = S.el('path', { fill: 'none', stroke: '#1864ab', 'stroke-width': 2 }, E.g);
    const dot = S.el('circle', { r: 5, fill: '#e8590c' }, E.g);
    E.vertex = () => add(E.base.p, E.base.u, E.t);
    E.normal = () => { const n = perpOf(E.base.u); return { x: n.x * E.s, y: n.y * E.s }; };
    E.perp = () => ({ p: E.vertex(), u: E.normal() });
    E.draw = () => {
      const V = E.vertex(), n = E.normal(), u = E.base.u;
      const A = add(V, u, 120), B = add(V, n, 190);
      poly.setAttribute('points', `${V.x},${V.y} ${A.x},${A.y} ${B.x},${B.y}`);
      const c1 = add(V, u, 16), c2 = add(add(V, u, 16), n, 16), c3 = add(V, n, 16);
      ra.setAttribute('d', `M${c1.x},${c1.y} L${c2.x},${c2.y} L${c3.x},${c3.y}`);
      marks.innerHTML = '';
      for (let k = 20; k < 180; k += 10) {
        const p = add(V, n, k), q = add(p, u, k % 50 === 0 ? 9 : 5);
        S.el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: '#1864ab', 'stroke-width': 1.5 }, marks);
      }
      dot.setAttribute('cx', V.x);
      dot.setAttribute('cy', V.y);
      if (onMove) onMove(E);
    };
    E.setBase = (L, near) => {
      E.base = L;
      E.t = near ? (near.x - L.p.x) * L.u.x + (near.y - L.p.y) * L.u.y : 0;
      E.draw();
    };
    E.flip = () => { E.s = -E.s; E.draw(); };
    S.drag(E.g, svg, {
      start: (p) => { E.off = E.t - ((p.x - E.base.p.x) * E.base.u.x + (p.y - E.base.p.y) * E.base.u.y); },
      move: (p) => { E.t = (p.x - E.base.p.x) * E.base.u.x + (p.y - E.base.p.y) * E.base.u.y + E.off; E.draw(); },
    });
    E.draw();
    return E;
  };

  /* ================================================================
     ÉNIGME « signaux » (aussi utilisée par le gardien)
     ================================================================ */
  function buildSignaux(ctx, host, { nA = 3, nB = 3, onSolved }) {
    const r = ctx.rng;
    const th = r.int(0, 179);
    const uA = unit(th), uB = unit(th + 90);
    const C = { x: VW / 2, y: VH / 2 };
    const letters = r.shuffle(['a', 'b', 'c', 'e', 'f', 'g', 'k', 'm']);
    const lines = [];
    const mk = (fam, k, n) => {
      const u = fam === 'A' ? uA : uB;
      const off = (k - (n - 1) / 2) * 70 + r.int(-12, 12);
      return { fam, u, p: add(C, perpOf(u), off) };
    };
    for (let k = 0; k < nA; k++) lines.push(mk('A', k, nA));
    for (let k = 0; k < nB; k++) lines.push(mk('B', k, nB));
    lines.forEach((L, i) => { L.name = i === 0 ? 'd' : letters[i]; L.slot = i === 0 ? 1 : 0; });

    // Carnet : un arbre de relations qui relie tous les rails (il faut enchaîner les propriétés).
    const order = [lines[0], ...r.shuffle(lines.slice(1))];
    const rel = [];
    for (let i = 1; i < order.length; i++) {
      // de préférence relier à un rail de l'autre famille (plus de ⊥ → plus de raisonnement)
      const pool = order.slice(0, i);
      const other = pool.filter((q) => q.fam !== order[i].fam);
      const q = other.length && r.chance(0.7) ? r.pick(other) : r.pick(pool);
      rel.push({ a: q, b: order[i], t: q.fam === order[i].fam ? '⫽' : '⊥' });
    }
    const relShown = r.shuffle(rel);

    // Point d'entrée visible de chaque rail : là où il sort du cadre (le reste est dans le brouillard).
    const entry = (L) => {
      let best = null;
      for (const s of [-1, 1]) {
        for (let k = 0; k < 1000; k += 2) {
          const P = add(L.p, L.u, s * k);
          if (P.x < 18 || P.x > VW - 18 || P.y < 18 || P.y > VH - 18) {
            if (!best || r.chance(0.5)) best = add(L.p, L.u, s * (k - 2));
            break;
          }
        }
      }
      return best;
    };
    lines.forEach((L) => { L.entry = entry(L); });

    host.innerHTML = '';
    const wrap = h('div', { style: 'display:flex;gap:14px;flex-wrap:wrap;justify-content:center;align-items:flex-start;width:100%' });
    const left = h('div', { style: 'flex:1 1 420px;min-width:280px;display:flex;flex-direction:column;align-items:center' });
    const right = h('div', { style: 'flex:0 1 250px;min-width:220px' });
    wrap.append(left, right);
    host.append(wrap);
    const svg = S.root(left, VW, VH);
    S.el('rect', { x: 0, y: 0, width: VW, height: VH, fill: '#a3cf7a' }, svg);
    const railLayer = S.el('g', {}, svg);
    lines.forEach((L) => { L.g = rails(railLayer, L); });
    const fx = S.el('g', {}, svg);
    const fog = S.el('g', { style: 'transition:opacity 1.2s' }, svg);
    S.el('rect', { x: 0, y: 0, width: VW, height: VH, fill: '#e9eef3' }, fog);
    for (let i = 0; i < 26; i++) S.el('circle', { cx: r.int(0, VW), cy: r.int(0, VH), r: r.int(50, 120), fill: '#fff', opacity: 0.55 }, fog);
    S.el('text', { x: VW / 2, y: VH / 2, 'text-anchor': 'middle', 'font-size': 30, fill: '#adb5bd', 'font-weight': 800, text: '~ brouillard ~' }, fog);
    const labels = S.el('g', {}, svg);
    lines.forEach((L) => {
      S.el('circle', { cx: L.entry.x, cy: L.entry.y, r: 15, fill: L.name === 'd' ? '#e8590c' : '#495057', stroke: '#fff', 'stroke-width': 3 }, labels);
      S.el('text', { x: L.entry.x, y: L.entry.y + 7, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 800, fill: '#fff', text: L.name }, labels);
    });

    // Carnet du chef
    right.append(h('div', { class: 'carnet' },
      h('div', { style: 'font-weight:800;color:#7c2d12;margin-bottom:6px' }, '📒 Carnet du chef de gare'),
      ...relShown.map((x) => h('div', { style: 'font:700 20px ui-monospace,Consolas,monospace;margin:4px 0' }, `(${x.a.name}) ${x.t} (${x.b.name})`))));
    // Départs
    const slots = h('div', { style: 'margin-top:10px' });
    right.append(h('div', { style: 'font-weight:800;margin-top:12px' }, '🚂 Les départs'),
      h('div', { class: 'muted', style: 'font-size:15px' }, 'Touche un train pour changer son départ. Deux trains du même départ ne doivent jamais se croiser.'),
      slots);
    const renderSlots = () => {
      slots.innerHTML = '';
      [1, 2].forEach((s) => {
        const box = h('div', { style: `border:2px dashed ${s === 1 ? '#1c7ed6' : '#e8590c'};border-radius:10px;padding:6px;margin:6px 0;min-height:48px` },
          h('div', { style: `font-weight:800;color:${s === 1 ? '#1c7ed6' : '#e8590c'}` }, s === 1 ? 'Départ 1 — 8 h 00' : 'Départ 2 — 8 h 10'));
        const row = h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' });
        lines.filter((L) => L.slot === s).forEach((L) => row.append(trainBtn(L)));
        box.append(row);
        slots.append(box);
      });
      const waiting = lines.filter((L) => L.slot === 0);
      if (waiting.length) {
        slots.append(h('div', { style: 'font-weight:700;margin-top:4px' }, 'Trains à placer :'), h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' }, waiting.map(trainBtn)));
      }
    };
    const trainBtn = (L) => h('button', {
      class: 'btn', style: 'padding:4px 10px;font-size:18px',
      onclick: () => {
        if (L.name === 'd') return Atlas.UI.toast('Le train de (d) part toujours au départ 1.');
        L.slot = L.slot === 1 ? 2 : 1;
        renderSlots();
      },
    }, `🚂 (${L.name})`);
    renderSlots();
    const go = h('button', { class: 'btn btn-go', style: 'margin-top:8px;width:100%' }, 'Lever le brouillard et lancer les trains');
    right.append(go);

    // Chemin de déduction entre deux rails dans le carnet
    const explain = (X, Y) => {
      const adj = new Map(lines.map((L) => [L, []]));
      rel.forEach((e) => { adj.get(e.a).push([e.b, e]); adj.get(e.b).push([e.a, e]); });
      const prev = new Map([[X, null]]);
      const q = [X];
      while (q.length) { const c = q.shift(); for (const [n, e] of adj.get(c)) if (!prev.has(n)) { prev.set(n, [c, e]); q.push(n); } }
      const edges = [];
      let c = Y;
      while (prev.get(c)) { const [p, e] = prev.get(c); edges.unshift(e); c = p; }
      return edges.map((e) => `(${e.a.name}) ${e.t} (${e.b.name})`).join(', ');
    };

    let running = false;
    go.onclick = () => {
      if (running) return;
      if (lines.some((L) => L.slot === 0)) return Atlas.UI.toast('Place d\'abord tous les trains.', 'bad');
      running = true;
      fog.style.opacity = '0';
      fx.innerHTML = '';
      let bad = null;
      for (let i = 0; i < lines.length && !bad; i++) for (let j = i + 1; j < lines.length && !bad; j++) {
        if (lines[i].slot === lines[j].slot && lines[i].fam !== lines[j].fam) bad = [lines[i], lines[j]];
      }
      setTimeout(() => {
        if (bad) {
          const [X, Y] = bad;
          const I = geo.inter(X.p, add(X.p, X.u, 1), Y.p, add(Y.p, Y.u, 1));
          if (I) {
            S.el('circle', { cx: I.x, cy: I.y, r: 30, fill: 'none', stroke: '#e03131', 'stroke-width': 6 }, fx);
            S.el('text', { x: I.x, y: I.y + 12, 'text-anchor': 'middle', 'font-size': 34, text: '💥' }, fx);
          }
          const hl = ctx.fail(`Les trains (${X.name}) et (${Y.name}) partent ensemble… et leurs rails se croisent ! ` +
            `Dans le carnet : ${explain(X, Y)}. Donc (${X.name}) ⊥ (${Y.name}).`);
          if (hl > 0) setTimeout(() => { fog.style.opacity = '1'; fx.innerHTML = ''; running = false; }, 3200);
        } else {
          // les trains roulent : départ 1 puis départ 2
          const anim = (slot, done) => {
            const dots = lines.filter((L) => L.slot === slot).map((L) => ({ L, c: S.el('rect', { width: 26, height: 14, rx: 4, fill: slot === 1 ? '#1c7ed6' : '#e8590c', stroke: '#fff', 'stroke-width': 2 }, fx) }));
            const t0 = performance.now();
            const tick = (t) => {
              const k = Math.min(1, (t - t0) / 1600);
              dots.forEach(({ L, c }) => {
                const P = add(L.p, L.u, -500 + 1000 * k);
                c.setAttribute('x', P.x - 13); c.setAttribute('y', P.y - 7);
                c.setAttribute('transform', `rotate(${(Math.atan2(L.u.y, L.u.x) * 180) / Math.PI} ${P.x} ${P.y})`);
              });
              if (k < 1) requestAnimationFrame(tick); else done();
            };
            requestAnimationFrame(tick);
          };
          anim(1, () => anim(2, () => onSolved()));
        }
      }, 1300);
    };
    ctx.pi('Les rails sont cachés. Lis le carnet : si deux rails sont <b>parallèles</b>, leurs trains ne se croisent jamais. Attention : deux perpendiculaires à une même droite…');
  }

  /* ================================================================
     ÉNIGME « équerre » : tracer le rail perpendiculaire ou parallèle passant par S
     ================================================================ */
  function buildEquerre(ctx, host, { tasks = ['perp', 'par'], onSolved }) {
    const r = ctx.rng;
    let ti = 0;
    const next = () => {
      if (ti >= tasks.length) return onSolved();
      one(tasks[ti], () => { ti++; next(); });
    };
    const one = (kind, done) => {
      host.innerHTML = '';
      const rail = { p: { x: VW / 2 + r.int(-80, 80), y: VH / 2 + r.int(-40, 40) }, u: unit(r.pick([r.int(5, 35), r.int(145, 175), r.int(55, 125)])) };
      const n = perpOf(rail.u);
      const side = r.pick([-1, 1]);
      const Sst = add(add(rail.p, rail.u, r.int(-120, 120)), n, side * r.int(110, 150));
      if (Sst.y < 40 || Sst.y > VH - 40 || Sst.x < 40 || Sst.x > VW - 40) return one(kind, done);
      const wantU = kind === 'perp' ? n : rail.u;
      const Tst = add(Sst, wantU, kind === 'perp' ? side * 90 : r.pick([-1, 1]) * 170);
      if (Tst.y < 25 || Tst.y > VH - 25 || Tst.x < 25 || Tst.x > VW - 25) return one(kind, done);

      ctx.consigne.innerHTML = kind === 'perp'
        ? `Trace le nouveau rail qui passe par la station <b>S</b> et qui est <b>perpendiculaire</b> à la voie. Le wagon doit aller de S à T.`
        : `Trace le nouveau rail qui passe par la station <b>S</b> et qui est <b>parallèle</b> à la voie. Le wagon doit aller de S à T.`;
      const svg = S.root(host, VW, VH);
      S.el('rect', { x: 0, y: 0, width: VW, height: VH, fill: '#b6dc8f' }, svg);
      rails(svg, rail);
      const traced = S.el('g', {}, svg);
      station(svg, Sst, 'S', '#1c7ed6');
      station(svg, Tst, 'T', '#2f9e44');
      const lines = [{ ...rail, base: true }];
      const hit = S.el('g', {}, svg);
      const eq = Atlas.Equerre(svg, rail);
      eq.setBase(rail, Atlas.geo.project(Sst, rail.p, add(rail.p, rail.u, 1)));
      eq.t += r.pick([-1, 1]) * r.int(70, 130);
      eq.draw();
      let choosing = false;
      const addHit = (L) => {
        const l = drawLine(hit, L, { stroke: 'transparent', 'stroke-width': 26 });
        l.style.cursor = 'pointer';
        l.addEventListener('pointerdown', (e) => {
          if (!choosing) return;
          e.stopPropagation();
          choosing = false;
          eq.setBase(L, S.pt(svg, e));
          bPose.classList.remove('on');
        });
      };
      addHit(rail);
      const tools = h('div', { class: 'puz-tools' });
      const bPose = h('button', { class: 'btn', onclick: () => { choosing = !choosing; bPose.classList.toggle('on', choosing); if (choosing) ctx.pi('Touche la droite sur laquelle poser l\'équerre.'); } }, '📐 Poser l\'équerre sur…');
      const bFlip = h('button', { class: 'btn', onclick: () => eq.flip() }, '↕ Retourner');
      const bTrace = h('button', {
        class: 'btn', onclick: () => {
          const L = eq.perp();
          if (lines.length > 4) return Atlas.UI.toast('Trop de traits : efface-les d\'abord.', 'bad');
          lines.push(L);
          drawLine(traced, L, { stroke: '#495057', 'stroke-width': 2, 'stroke-dasharray': '10 6' });
          rightAngle(traced, L.p, eq.base.u, L.u, 12, '#495057');
          addHit(L);
        },
      }, '✏️ Tracer le long de l\'équerre');
      const bErase = h('button', { class: 'btn', onclick: () => { traced.innerHTML = ''; hit.innerHTML = ''; lines.length = 1; addHit(rail); eq.setBase(rail, eq.vertex()); } }, '🧽 Effacer');
      const bGo = h('button', { class: 'btn btn-go' }, '🚃 Faire rouler le wagon');
      tools.append(bPose, bFlip, bTrace, bErase, bGo);
      host.append(tools);
      bGo.onclick = () => {
        const cands = lines.filter((L) => !L.base && distToLine(Sst, L) < 9);
        if (!cands.length) {
          ctx.fail(lines.length === 1
            ? 'Il n\'y a encore aucun rail tracé ! Fais glisser l\'équerre, puis « Tracer ».'
            : 'Aucun de tes traits ne passe par la station S : le wagon ne peut pas monter dessus. Fais glisser l\'équerre jusqu\'à ce que son bord passe exactement par S.');
          return;
        }
        const L = cands[cands.length - 1];
        const ang = angleBetween(L.u, rail.u);
        const ok = kind === 'perp' ? ang > 88 : ang < 2;
        // le wagon roule
        const wagon = S.el('rect', { width: 24, height: 14, rx: 4, fill: '#e8590c', stroke: '#fff', 'stroke-width': 2 }, svg);
        const dirToT = (Tst.x - Sst.x) * L.u.x + (Tst.y - Sst.y) * L.u.y >= 0 ? 1 : -1;
        const t0 = performance.now();
        const runLen = ok ? Math.hypot(Tst.x - Sst.x, Tst.y - Sst.y) : 200;
        const tick = (t) => {
          const k = Math.min(1, (t - t0) / 1200);
          const P = add(Sst, L.u, dirToT * runLen * k);
          wagon.setAttribute('x', P.x - 12); wagon.setAttribute('y', P.y - 7);
          wagon.setAttribute('transform', `rotate(${(Math.atan2(L.u.y, L.u.x) * 180) / Math.PI} ${P.x} ${P.y})`);
          if (k < 1) return requestAnimationFrame(tick);
          if (ok) {
            rightAngle(svg, kind === 'perp' ? geo.project(Sst, rail.p, add(rail.p, rail.u, 1)) : Sst, rail.u, n, 16);
            Atlas.UI.toast(kind === 'perp' ? 'Rail perpendiculaire posé !' : 'Rail parallèle posé !', 'good');
            setTimeout(done, 900);
          } else {
            wagon.remove();
            ctx.fail(kind === 'perp'
              ? 'Ton rail passe bien par S, mais il n\'est pas perpendiculaire à la voie. Pose l\'équerre <b>sur la voie</b>.'
              : 'Ton rail passe par S, mais il n\'est pas parallèle à la voie : il finirait par la croiser ! Astuce : trace d\'abord une perpendiculaire à la voie passant par S, puis pose l\'équerre sur ce trait.');
          }
        };
        requestAnimationFrame(tick);
      };
      ctx.pi(kind === 'perp'
        ? 'Fais glisser l\'équerre le long de la voie. Son bord doit passer exactement par S, puis « Tracer ».'
        : 'Un rail parallèle en deux temps : une perpendiculaire à la voie passant par S… puis une perpendiculaire à ce trait, passant par S.');
    };
    next();
  }

  /* ================================================================
     ÉNIGME « passerelle » : le plus court chemin d'un point à une droite
     ================================================================ */
  function buildPasserelle(ctx, host, { rounds = 3, onSolved }) {
    const r = ctx.rng;
    let k = 0;
    const one = () => {
      if (k >= rounds) return onSolved();
      host.innerHTML = '';
      const L = { p: { x: VW / 2 + r.int(-60, 60), y: VH / 2 + r.int(40, 90) }, u: unit(k === 0 ? r.int(-4, 4) : r.pick([r.int(15, 35), r.int(145, 165)])) };
      const n = perpOf(L.u);
      const Q = add(add(L.p, L.u, r.int(-150, 150)), n, -r.int(150, 210));
      if (Q.y < 30 || Q.x < 40 || Q.x > VW - 40) return one();
      const H = geo.project(Q, L.p, add(L.p, L.u, 1));
      const best = Math.hypot(Q.x - H.x, Q.y - H.y);
      ctx.consigne.innerHTML = `Passerelle ${k + 1} / ${rounds} : relie le quai <b>Q</b> à la voie. Tu n'as que les planches de la passerelle <b>la plus courte possible</b>. Fais glisser le point <b>M</b> sur la voie, puis construis.`;
      const svg = S.root(host, VW, VH);
      S.el('rect', { x: 0, y: 0, width: VW, height: VH, fill: '#b6dc8f' }, svg);
      // l'eau entre le quai et la voie
      const w1 = add(L.p, n, -18), w2 = add(L.p, n, -90);
      const band = [add(w1, L.u, -1500), add(w1, L.u, 1500), add(w2, L.u, 1500), add(w2, L.u, -1500)];
      S.el('polygon', { points: band.map((p) => `${p.x},${p.y}`).join(' '), fill: '#74c0fc' }, svg);
      rails(svg, L);
      const plank = S.el('line', { stroke: '#a0703c', 'stroke-width': 12, 'stroke-linecap': 'round' }, svg);
      station(svg, Q, 'Q', '#7c2d12');
      const eqLayer = S.el('g', {}, svg);
      let eq = null;
      const M = { t: r.pick([-1, 1]) * r.int(90, 160) + ((H.x - L.p.x) * L.u.x + (H.y - L.p.y) * L.u.y) };
      const mG = S.el('g', {}, svg);
      const mC = S.el('circle', { r: 13, fill: '#fab005', stroke: '#fff', 'stroke-width': 3 }, mG);
      const mT = S.el('text', { 'font-size': 22, 'font-weight': 800, fill: '#7c4a00', text: 'M', stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke' }, mG);
      const place = () => {
        const P = add(L.p, L.u, M.t);
        mC.setAttribute('cx', P.x); mC.setAttribute('cy', P.y);
        mT.setAttribute('x', P.x + 14); mT.setAttribute('y', P.y + 30);
        plank.setAttribute('x1', Q.x); plank.setAttribute('y1', Q.y); plank.setAttribute('x2', P.x); plank.setAttribute('y2', P.y);
        plank.setAttribute('stroke-dasharray', '4 10');
        plank.setAttribute('stroke-width', 4);
        plank.setAttribute('stroke', '#7c4a00');
      };
      S.drag(mG, svg, { move: (p) => { M.t = (p.x - L.p.x) * L.u.x + (p.y - L.p.y) * L.u.y; place(); } });
      place();
      const tools = h('div', { class: 'puz-tools' },
        h('button', { class: 'btn', onclick: () => { if (eq) { eq.g.remove(); eq = null; return; } eq = Atlas.Equerre(eqLayer, L); eq.setBase(L, add(L.p, L.u, M.t)); eq.s = -1; eq.draw(); } }, '📐 Équerre'),
        h('button', {
          class: 'btn btn-go', onclick: () => {
            const P = add(L.p, L.u, M.t);
            const len = Math.hypot(Q.x - P.x, Q.y - P.y);
            plank.setAttribute('stroke-dasharray', '');
            plank.setAttribute('stroke-width', 12);
            plank.setAttribute('stroke', '#a0703c');
            if (len <= best + 4) {
              rightAngle(svg, H, L.u, { x: -n.x, y: -n.y }, 16);
              Atlas.UI.toast('Passerelle construite !', 'good');
              k++;
              setTimeout(one, 1100);
            } else {
              const miss = Math.round(((len - best) / best) * 100);
              ctx.fail(`La passerelle est trop longue : il manque ${miss} % de planches ! Il y avait un chemin plus court. Lequel ? Regarde l'angle entre la passerelle et la voie…`);
              setTimeout(place, 1400);
            }
          },
        }, '🔨 Construire la passerelle'));
      host.append(tools);
      ctx.pi(k === 0 ? 'Déplace M sur la voie. Où la passerelle est-elle la plus courte ?' : 'La voie est penchée cette fois. Le plus court chemin est toujours le même genre de chemin…');
    };
    one();
  }

  /* ---------- La carte de la gare ---------- */
  const W = 26, H = 16;
  const map = Atlas.buildMap(W, H, (m) => {
    m.border('T');
    m.rect(1, 7, 24, 7, 'h');           // grande voie est-ouest
    m.rect(12, 1, 12, 14, 'v');         // voie nord-sud
    m.set(12, 7, 'h');
    m.rect(13, 13, 14, 15, '=');        // chemin vers le village (sud)
    m.rect(13, 12, 16, 13, '=');
    m.rect(2, 2, 8, 5, 'g');            // cour de la gare
    m.rect(17, 10, 24, 14, '~');        // le canal
    m.rect(16, 9, 24, 9, '#');          // quai
    m.sprinkle(',', 6, 4);
    m.sprinkle('*', 13, 9);
    [[20, 3], [22, 4], [3, 12], [5, 13], [8, 11], [21, 2]].forEach(([x, y], i) => m.set(x, y, ['B', 'A', 'B', 'a', 'B', 'T'][i]));
    m.set(10, 9, 'S');
    m.set(6, 11, 'k'); m.set(7, 11, 'b');
  });

  Atlas.region({
    id: 'gare', num: 1, name: 'La Gare du Brouillard', chapter: 'Parallèles et perpendiculaires',
    map, spawn: { x: 13, y: 14 },
    signs: { '10,9': '<b>Gare du Brouillard</b><br>« Un rail bien tracé, un train bien arrivé. »' },
    exits: [{ x: 13, y: 15, to: 'village' }, { x: 14, y: 15, to: 'village' }],
    props: [
      { x: 3, y: 2, stamp: 'maison_grise' },
      { x: 9, y: 3, t: 'dungeon:54', solid: true },
      { x: 18, y: 5, t: 'town:57', solid: true },
    ],
    npcs: [
      {
        id: 'lina', x: 7, y: 5, t: 'dungeon:99', name: 'Lina, l\'aiguilleuse',
        talk: (A) => A.done('signaux')
          ? ['Merci ! Grâce à toi, les trains partent sans se croiser.', 'Rappelle-toi : deux rails perpendiculaires au même rail sont parallèles entre eux.']
          : ['Avec ce brouillard, je ne vois plus les rails ! Le chef a tout noté dans son carnet.', 'Le poste des signaux est juste là, avec la cible rouge et blanche.'],
      },
      {
        id: 'victor', x: 16, y: 4, t: 'dungeon:86', name: 'Victor, le poseur de rails',
        talk: (A) => A.done('equerre')
          ? ['Beau travail à l\'équerre ! Mes rails tombent pile.']
          : ['On doit poser de nouveaux rails, mais je ne sais plus me servir de mon équerre…', 'Viens à mon chariot, à côté.'],
      },
      {
        id: 'nina', x: 15, y: 10, t: 'dungeon:85', name: 'Nina, la batelière',
        talk: (A) => A.done('passerelle')
          ? ['Les passerelles sont parfaites, et on a économisé du bois !']
          : ['Il faut des passerelles au-dessus du canal, mais il nous reste très peu de planches.', 'Les planches sont posées près du quai.'],
      },
    ],
    objects: [
      { id: 'o-signaux', x: 9, y: 5, t: 'town:95', kind: 'enigme', enigme: 'signaux' },
      { id: 'o-equerre', x: 18, y: 4, t: 'town:116', kind: 'enigme', enigme: 'equerre' },
      { id: 'o-passerelle', x: 16, y: 8, t: 'town:106', kind: 'enigme', enigme: 'passerelle' },
      {
        id: 'o-gardien', x: 5, y: 9, t: 'dungeon:87', name: 'Chef Gaston', kind: 'gardien',
        notReady: 'Hmpf. Je suis le chef de gare. Reviens quand tu auras réglé les signaux, les rails et les passerelles.',
        intro: ['Hmpf ! Tu as réparé ma gare… pas mal pour un apprenti.', 'Mais voici le vrai défi : l\'Aiguillage géant. Sept rails dans le brouillard, et un dernier rail à poser à l\'équerre. Prêt ?'],
      },
    ],
    treasure: {
      x: 22, y: 4, needs: 'compas',
      hint: 'Ce buisson cache quelque chose… Il faudrait un <b>compas</b> pour savoir où creuser. (On le gagne à la Tour du Guetteur.)',
      text: 'Avec le compas, on trouve l\'endroit exact : ici ! Un vieux coffre de cheminot…',
    },
    lesson: [
      {
        text: 'Deux droites <b>perpendiculaires</b> se coupent en formant un <b>angle droit</b>. On le vérifie avec l\'équerre et on le code avec un petit carré.',
        svg: `<svg viewBox="0 0 400 220"><line x1="40" y1="150" x2="360" y2="150" stroke="#1c7ed6" stroke-width="4"/><line x1="200" y1="20" x2="200" y2="210" stroke="#e8590c" stroke-width="4"/><path d="M216,150 L216,134 L200,134" fill="none" stroke="#2b1d0e" stroke-width="3"/><text x="365" y="145" font-size="20" fill="#1c7ed6" font-weight="800">(d)</text><text x="208" y="35" font-size="20" fill="#e8590c" font-weight="800">(p)</text><text x="120" y="200" font-size="20" font-weight="800">(d) ⊥ (p)</text></svg>`,
      },
      {
        text: 'Deux droites <b>parallèles</b> ne se coupent jamais, même si on les prolonge très, très loin. On écrit (d) ⫽ (d′).',
        svg: `<svg viewBox="0 0 400 220"><line x1="20" y1="70" x2="380" y2="40" stroke="#1c7ed6" stroke-width="4"/><line x1="20" y1="170" x2="380" y2="140" stroke="#2f9e44" stroke-width="4"/><text x="330" y="30" font-size="20" fill="#1c7ed6" font-weight="800">(d)</text><text x="330" y="130" font-size="20" fill="#2f9e44" font-weight="800">(d′)</text><text x="140" y="210" font-size="20" font-weight="800">(d) ⫽ (d′)</text></svg>`,
      },
      {
        text: 'Une propriété très utile : si deux droites sont <b>perpendiculaires à la même droite</b>, alors elles sont <b>parallèles</b> entre elles.',
        svg: `<svg viewBox="0 0 400 220"><line x1="20" y1="110" x2="380" y2="110" stroke="#2b1d0e" stroke-width="4"/><line x1="120" y1="15" x2="120" y2="205" stroke="#1c7ed6" stroke-width="4"/><line x1="280" y1="15" x2="280" y2="205" stroke="#2f9e44" stroke-width="4"/><path d="M136,110 L136,94 L120,94" fill="none" stroke="#e8590c" stroke-width="3"/><path d="M296,110 L296,94 L280,94" fill="none" stroke="#e8590c" stroke-width="3"/><text x="345" y="100" font-size="18" font-weight="800">(d)</text><text x="128" y="30" font-size="18" fill="#1c7ed6" font-weight="800">(a)</text><text x="288" y="30" font-size="18" fill="#2f9e44" font-weight="800">(b)</text><text x="20" y="200" font-size="16" font-weight="700">(a) ⊥ (d) et (b) ⊥ (d), donc (a) ⫽ (b)</text></svg>`,
      },
      {
        text: 'Et l\'inverse : si deux droites sont <b>parallèles</b>, toute droite <b>perpendiculaire à l\'une</b> est <b>perpendiculaire à l\'autre</b>.',
        svg: `<svg viewBox="0 0 400 220"><line x1="20" y1="70" x2="380" y2="70" stroke="#1c7ed6" stroke-width="4"/><line x1="20" y1="150" x2="380" y2="150" stroke="#2f9e44" stroke-width="4"/><line x1="200" y1="10" x2="200" y2="210" stroke="#e8590c" stroke-width="4"/><path d="M216,70 L216,54 L200,54" fill="none" stroke="#2b1d0e" stroke-width="3"/><path d="M216,150 L216,134 L200,134" fill="none" stroke="#e8590c" stroke-width="3" stroke-dasharray="4 3"/><text x="20" y="62" font-size="18" fill="#1c7ed6" font-weight="800">(a)</text><text x="20" y="142" font-size="18" fill="#2f9e44" font-weight="800">(b)</text><text x="208" y="25" font-size="18" fill="#e8590c" font-weight="800">(p)</text><text x="225" y="200" font-size="15" font-weight="700">(a) ⫽ (b) et (p) ⊥ (a), donc (p) ⊥ (b)</text></svg>`,
      },
      {
        text: 'À toi ! Fais <b>glisser l\'équerre</b> le long de la voie jusqu\'à ce que son bord passe par la station <b>S</b>.',
        act: (el, done) => {
          const svg = S.root(el, VW, 380);
          const rail = { p: { x: 400, y: 280 }, u: unit(0) };
          S.el('rect', { x: 0, y: 0, width: VW, height: 380, fill: '#b6dc8f' }, svg);
          rails(svg, rail);
          const Sp = { x: 520, y: 110 };
          station(svg, Sp, 'S');
          let ok = false;
          const eq = Atlas.Equerre(svg, rail, {
            onMove: (E) => {
              if (ok) return;
              if (distToLine(Sp, E.perp()) < 8 && (Sp.y - E.vertex().y) * E.normal().y > 0) {
                ok = true;
                const L = E.perp();
                drawLine(svg, L, { stroke: '#495057', 'stroke-width': 2, 'stroke-dasharray': '10 6' });
                done();
              }
            },
          });
          eq.s = -1;
          eq.setBase(rail, { x: 250, y: 280 });
        },
      },
    ],
    enigmes: {
      signaux: {
        title: 'Les signaux dans le brouillard',
        consigne: 'Le brouillard cache les rails. Seul le <b>carnet du chef</b> dit lesquels sont perpendiculaires (⊥) ou parallèles (⫽). Répartis les trains en <b>2 départs</b> : deux trains qui partent ensemble ne doivent <b>jamais se croiser</b>.',
        build: (ctx) => buildSignaux(ctx, ctx.el, { nA: 3, nB: 3, onSolved: () => ctx.win('Aucun croisement ! Les trains sur des rails parallèles peuvent rouler en même temps.') }),
      },
      equerre: {
        title: 'Le nouveau rail',
        consigne: '',
        build: (ctx) => buildEquerre(ctx, ctx.el, { tasks: ['perp', 'par'], onSolved: () => ctx.win('Les deux rails sont posés : un perpendiculaire, un parallèle. Victor est ravi !') }),
      },
      passerelle: {
        title: 'Les passerelles du canal',
        consigne: '',
        build: (ctx) => buildPasserelle(ctx, ctx.el, { rounds: 3, onSolved: () => ctx.win('Le plus court chemin d\'un point à une droite, c\'est la <b>perpendiculaire</b> ! Sa longueur s\'appelle la distance du point à la droite.') }),
      },
    },
    gardien: {
      title: 'L\'Aiguillage géant',
      consigne: '<b>Étape 1 / 2</b> — Sept rails dans le brouillard. Répartis les trains en 2 départs sans aucun croisement.',
      build: (ctx) => {
        buildSignaux(ctx, ctx.el, {
          nA: 4, nB: 3,
          onSolved: () => {
            Atlas.UI.toast('Étape 1 réussie !', 'good');
            setTimeout(() => {
              buildEquerre(ctx, ctx.el, { tasks: ['par'], onSolved: () => ctx.win('Hmpf… Bravo. Voici la page de l\'Atlas. Et garde cette équerre, tu la mérites.') });
            }, 900);
          },
        });
      },
    },
    tool: {
      id: 'equerre', name: 'Équerre',
      icon: '<svg viewBox="0 0 30 30"><polygon points="4,26 26,26 4,4" fill="#74c0fc" stroke="#1864ab" stroke-width="2"/><path d="M4,20 L10,20 L10,26" fill="none" stroke="#1864ab" stroke-width="2"/></svg>',
    },
  });
})();
