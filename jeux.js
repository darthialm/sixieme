/* =========================================================
   Jeux d'entraînement de l'œil, sur un moteur commun (menu à deux cartes, 10 manches, pastilles, score, record,
   confettis + réplique façon mème quand c'est parfait).
   - Estimangle (chapitre Les angles) : « Estimer » la mesure d'un angle (cadenas à 3 roues) ou « Lancer » une
     demi-droite et l'arrêter à la bonne mesure. Mesures de 1° à 179°, un point seulement avec la mesure EXACTE.
   - Droite parfaite (chapitre Droites) : tracer la parallèle ou la perpendiculaire à (d) passant par un point,
     « Tracer » (on fait tourner la droite à la souris / au doigt) ou « Lancer » (on l'arrête au bon moment).
     PERFECT si l'écart est au plus 1° (Facile) ou 0,5° (Expert).
   Pas de filtre SVG (il était recalculé à chaque image et faisait clignoter) : la lueur est un trait large et pâle dessous.
   ========================================================= */
(function () {
  const ROUNDS = 10;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (a) => a[rnd(0, a.length - 1)];
  const rad = (d) => (d * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;
  const dir = (a) => ({ x: Math.cos(rad(a)), y: -Math.sin(rad(a)) }); // y vers le bas à l'écran
  const at = (V, a, L) => { const d = dir(a); return { x: V.x + L * d.x, y: V.y + L * d.y }; };
  const f = (n) => n.toFixed(3);
  const dec = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
  const seg = (P, Q, cls) => `<line x1="${f(P.x)}" y1="${f(P.y)}" x2="${f(Q.x)}" y2="${f(Q.y)}" class="${cls}"/>`;
  /** trait lumineux : une lueur (trait large et pâle) + le trait */
  const glow = (P, Q, cls) => seg(P, Q, `eg-halo ${cls}`) + seg(P, Q, cls);
  const ray = (V, a, L, cls) => glow(V, at(V, a, L), cls);
  const line = (A, a, L, cls) => glow(at(A, a + 180, L), at(A, a, L), cls);
  const dash = (A, a, L, cls) => seg(at(A, a + 180, L), at(A, a, L), cls);
  /** déplace un trait déjà dessiné (et sa lueur) sans redessiner la figure */
  const moveSeg = (els, P, Q) => els.forEach((e) => { e.setAttribute('x1', f(P.x)); e.setAttribute('y1', f(P.y)); e.setAttribute('x2', f(Q.x)); e.setAttribute('y2', f(Q.y)); });
  const label = (V, a, L, txt, cls) => { const P = at(V, a, L); return `<text x="${f(P.x)}" y="${f(P.y)}" class="${cls}" text-anchor="middle" dominant-baseline="middle">${txt}</text>`; };
  const arc = (V, a1, a2, r, cls) => {
    const P = at(V, a1, r), Q = at(V, a2, r), big = Math.abs(a2 - a1) > 180 ? 1 : 0, sweep = a2 > a1 ? 0 : 1;
    return `<path d="M${f(P.x)} ${f(P.y)} A${r} ${r} 0 ${big} ${sweep} ${f(Q.x)} ${f(Q.y)}" class="${cls}"/>`;
  };
  const dot = (V) => `<circle cx="${f(V.x)}" cy="${f(V.y)}" r="0.14" class="eg-dot"/>`;
  const loadBest = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
  const saveBest = (k, b) => { try { localStorage.setItem(k, JSON.stringify(b)); } catch (e) { /* stockage indisponible */ } };

  /* ---------- Fête : confettis + réplique façon mème ---------- */
  const CHEERS = [['😎', 'Œil de lynx !'], ['🤯', 'Rapporteur humain !'], ['🐐', 'Le GOAT des angles'], ['🎯', 'En plein dans le mille !'],
    ['🧠', 'Cerveau galaxie'], ['🔥', 'Trop fort !'], ['👑', 'Roi·reine des angles'], ['🦅', 'Vue d\'aigle !'], ['💯', 'Pile poil !'], ['🕺', 'Petite danse de la victoire']];
  function party(root, meme) {
    root.querySelectorAll('.eg-party').forEach((n) => n.remove());
    const [emo, txt] = meme || pick(CHEERS);
    const colors = ['#3fe3ff', '#ff5fae', '#ffd23f', '#3ee08f', '#a78bfa', '#fff'];
    let bits = '';
    for (let i = 0; i < 70; i++) {
      bits += `<i style="left:${rnd(0, 100)}%;background:${colors[i % colors.length]};--dx:${rnd(-80, 80)}px;--r:${rnd(360, 1080)}deg;animation:eg-fall ${(1.4 + Math.random() * 1.1).toFixed(2)}s cubic-bezier(.25,.6,.5,1) ${(Math.random() * 0.35).toFixed(2)}s both !important;${i % 3 ? '' : 'border-radius:50%;'}"></i>`;
    }
    root.insertAdjacentHTML('beforeend', `<div class="eg-party" aria-hidden="true">${bits}<div class="eg-meme"><span>${emo}</span><b>${txt}</b></div></div>`);
    const p = root.querySelector('.eg-party');
    setTimeout(() => p.remove(), 2800);
  }

  /* ---------- Moteur commun ----------
     G = { logo: [a, b], bestKey, modes: { k: { icon, name, goal, mini } }, levels: { k: label }, unit(gap) -> texte,
           round(ctx) } ; une manche appelle ctx.finish({ gap, perfect, cls, head, html, meme }) */
  function arcade(root, G) {
    root.classList.add('eg-game');
    const st = { mode: Object.keys(G.modes)[0], level: Object.keys(G.levels)[0], round: 0, good: 0, gaps: [], res: [], phase: 'menu', raf: 0, halt: null };
    const $ = (s) => root.querySelector(s);
    const stop = () => { cancelAnimationFrame(st.raf); st.raf = 0; };

    function menu() {
      stop(); st.phase = 'menu';
      const best = loadBest(G.bestKey);
      const rec = (m) => { const b = best[m + '-' + st.level]; return b ? `🏆 Record : ${b.good} / ${ROUNDS}` : 'Pas encore de record'; };
      root.innerHTML = `<div class="eg-menu">
        <p class="eg-logo">${G.logo[0]}<span>${G.logo[1]}</span></p>
        <div class="eg-lv" role="group" aria-label="Niveau">
          ${Object.entries(G.levels).map(([k, l], i) => `<button type="button" data-level="${k}" aria-pressed="${k === st.level}">${i ? '🔥' : '🙂'} ${l}</button>`).join('')}
        </div>
        <div class="eg-cards">
          ${Object.entries(G.modes).map(([k, m], i) => `<button type="button" class="eg-card eg-card-${i ? 'b' : 'a'}" data-mode="${k}">
            ${m.mini}<span class="eg-card-name">${m.icon} ${m.name}</span>
            <span class="eg-card-goal">${m.goal}</span><span class="eg-card-rec">${rec(k)}</span></button>`).join('')}
        </div></div>`;
      root.querySelectorAll('[data-level]').forEach((b) => b.addEventListener('click', () => { st.level = b.dataset.level; menu(); root.querySelector(`[data-level="${st.level}"]`).focus(); }));
      root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { st.mode = b.dataset.mode; newGame(); }));
    }
    function newGame() {
      stop();
      Object.assign(st, { round: 0, good: 0, gaps: [], res: [] });
      const m = G.modes[st.mode];
      root.innerHTML = `<div class="eg-play">
        <div class="eg-hud">
          <button type="button" class="eg-back">← Menu</button>
          <span class="eg-title">${m.icon} ${m.name} <small>${G.levels[st.level]}</small></span>
          <span class="eg-pts" aria-live="polite"></span>
        </div>
        <div class="eg-pips" aria-hidden="true">${'<i></i>'.repeat(ROUNDS)}</div>
        <p class="eg-ask"></p>
        <svg class="eg-svg" role="img" aria-label="Figure du jeu"></svg>
        <div class="eg-controls"></div>
        <div class="eg-feedback" aria-live="polite"></div></div>`;
      $('.eg-back').addEventListener('click', menu);
      $('.eg-svg').addEventListener('click', () => { if (st.phase === 'run') st.halt(); });
      next();
    }
    function hud() {
      $('.eg-pts').innerHTML = `⭐ <b>${st.good}</b>`;
      root.querySelectorAll('.eg-pips i').forEach((p, i) => { p.className = st.res[i] === true ? 'ok' : st.res[i] === false ? 'ko' : i === st.round - 1 ? 'cur' : ''; });
    }
    function next() {
      stop();
      st.phase = 'idle'; st.halt = null; st.round++;
      $('.eg-feedback').innerHTML = '';
      if (st.round > ROUNDS) return end();
      hud();
      const svg = $('.eg-svg');
      svg.style.display = '';
      G.round({
        svg, mode: st.mode, level: st.level, $,
        ask: (h) => { $('.eg-ask').innerHTML = h; },
        controls: (h) => { const c = $('.eg-controls'); c.innerHTML = h; return c; },
        // animation : fn(dt en secondes) appelée à chaque image tant que la manche tourne
        run: (fn) => {
          st.phase = 'run'; let last = 0;
          const tick = (now) => { const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now; fn(dt); st.raf = requestAnimationFrame(tick); };
          st.raf = requestAnimationFrame(tick);
        },
        ready: (halt) => { st.halt = () => { if (st.phase !== 'run') return; st.phase = 'done'; stop(); halt(); }; st.phase = 'ready'; },
        finish: verdict,
      });
    }
    function verdict(r) {
      if (r.perfect) st.good++;
      st.gaps.push(r.gap); st.res.push(!!r.perfect);
      hud();
      $('.eg-controls').innerHTML = '';
      $('.eg-feedback').innerHTML = `<div class="eg-verdict ${r.cls}"><p class="eg-big">${r.head}</p>${r.html}</div>
        <p><button type="button" class="eg-btn eg-next">${st.round < ROUNDS ? 'Suivant →' : 'Voir mon score →'}</button></p>`;
      const b = $('.eg-next'); b.addEventListener('click', next); b.focus({ preventScroll: true });
      if (r.perfect) party(root, r.meme);
    }
    function end() {
      const avg = Math.round((st.gaps.reduce((a, b) => a + b, 0) / st.gaps.length) * 10) / 10;
      const key = st.mode + '-' + st.level, best = loadBest(G.bestKey), prev = best[key];
      const record = !prev || st.good > prev.good || (st.good === prev.good && avg < prev.avg);
      if (record) { best[key] = { good: st.good, avg }; saveBest(G.bestKey, best); }
      hud();
      const stars = st.good >= 6 ? 3 : st.good >= 3 ? 2 : st.good >= 1 ? 1 : 0;
      const msg = st.good === ROUNDS ? 'Incroyable, un sans-faute !' : st.good >= 6 ? 'Excellent !' : st.good >= 3 ? 'Très bien, tu vises juste !' : st.good >= 1 ? 'Bien joué, c\'est dur d\'être parfait !' : 'Pas encore de parfait… Retente ta chance !';
      $('.eg-ask').innerHTML = '';
      $('.eg-svg').style.display = 'none';
      $('.eg-controls').innerHTML = '';
      $('.eg-feedback').innerHTML = `<div class="eg-end">
        <p class="eg-stars">${'<span class="on">★</span>'.repeat(stars)}${'<span>★</span>'.repeat(3 - stars)}</p>
        <p class="eg-score">${st.good} / ${ROUNDS}</p><p class="eg-msg">${msg}</p>
        <p class="eg-sub">Écart moyen : ${dec(avg)}°${record ? (prev ? ' · 🏆 Nouveau record !' : ' · 🏆 Premier record !') : ` · Record : ${prev.good} / ${ROUNDS}`}</p>
        <p class="eg-btns"><button type="button" class="eg-btn eg-again">↻ Rejouer</button><button type="button" class="eg-btn eg-alt eg-menu-b">Menu</button></p></div>`;
      $('.eg-again').addEventListener('click', newGame);
      $('.eg-menu-b').addEventListener('click', menu);
      $('.eg-again').focus({ preventScroll: true });
    }
    // barre Espace : Lancer / Stop
    document.addEventListener('keydown', (e) => {
      if (!root.closest('.page')?.classList.contains('active')) return;
      if ((e.code === 'Space' || e.key === ' ') && (st.phase === 'run' || st.phase === 'ready') && $('.eg-go')) {
        e.preventDefault();
        if (st.phase === 'run') st.halt(); else $('.eg-go').click();
      }
    });
    window.addEventListener('hashchange', () => { if (st.phase === 'run') menu(); });
    menu();
  }

  /** bouton Lancer → Stop, commun aux deux modes « Lancer » */
  function launcher(ctx, onRun, onHalt) {
    const btn = ctx.controls('<button type="button" class="eg-btn eg-go">▶ Lancer</button>').querySelector('.eg-go');
    btn.focus({ preventScroll: true });
    ctx.ready(onHalt);
    btn.addEventListener('click', () => {
      if (btn.classList.contains('eg-stop')) { ctx.svg.dispatchEvent(new Event('click')); return; }
      btn.textContent = '⏹ Stop'; btn.classList.add('eg-stop');
      ctx.run(onRun);
    });
  }

  /* =========================================================
     Estimangle
     ========================================================= */
  /** Une roue du cadenas (un chiffre). Molette au survol (sans cliquer), glisser, clic sur le chiffre du dessus /
      dessous, flèches ↑ ↓, ou taper le chiffre au clavier. Les grands chiffres sont en haut, comme une vraie roue. */
  function wheel(el, { max, value, onKey }) {
    let v = value;
    el.innerHTML = '<span class="eg-dg eg-dg-prev"></span><span class="eg-dg eg-dg-cur"></span><span class="eg-dg eg-dg-next"></span>';
    const [pv, cu, nx] = el.querySelectorAll('.eg-dg');
    const wrap = (n) => ((n % (max + 1)) + max + 1) % (max + 1);
    const show = (d = 0) => {
      pv.textContent = wrap(v + 1); cu.textContent = v; nx.textContent = wrap(v - 1);
      el.setAttribute('aria-valuenow', String(v));
      if (d) { el.classList.remove('eg-up', 'eg-down'); void el.offsetWidth; el.classList.add(d > 0 ? 'eg-down' : 'eg-up'); }
    };
    const set = (w, d) => { w = wrap(w); if (w !== v) { v = w; show(d); } };
    const move = (k) => set(v + k, k);
    let acc = 0;
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      acc += e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
      if (Math.abs(acc) >= 50) { move(acc < 0 ? 1 : -1); acc = 0; }
    }, { passive: false });
    let y0 = null, dragged = false;
    el.addEventListener('pointerdown', (e) => { y0 = e.clientY; dragged = false; el.setPointerCapture(e.pointerId); el.focus({ preventScroll: true }); });
    el.addEventListener('pointermove', (e) => {
      if (y0 === null) return;
      const dy = e.clientY - y0;
      if (Math.abs(dy) >= 20) { move(dy > 0 ? 1 : -1); y0 = e.clientY; dragged = true; }
    });
    el.addEventListener('pointerup', (e) => {
      if (y0 === null) return; y0 = null;
      if (dragged) return;
      const r = el.getBoundingClientRect(), y = (e.clientY - r.top) / r.height;
      if (y < 0.33) move(1); else if (y > 0.67) move(-1);
    });
    el.addEventListener('pointercancel', () => { y0 = null; });
    el.addEventListener('keydown', (e) => {
      const k = { ArrowUp: 1, ArrowDown: -1 }[e.key];
      if (k) { e.preventDefault(); move(k); }
      else if (/^[0-9]$/.test(e.key) && +e.key <= max) { e.preventDefault(); set(+e.key, +e.key > v ? 1 : -1); onKey('next'); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); onKey('next'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); onKey('prev'); }
      else if (e.key === 'Enter') { e.preventDefault(); onKey('enter'); }
    });
    show();
    return { get value() { return v; } };
  }
  /** Cadenas à 3 roues : centaines (0-1), dizaines, unités. */
  function lock(host, { value, onEnter }) {
    host.innerHTML = `<div class="eg-lock" role="group" aria-label="Mesure en degrés">
      ${['centaines', 'dizaines', 'unités'].map((n) => `<div class="eg-wheel" tabindex="0" role="spinbutton" aria-label="Chiffre des ${n}"></div>`).join('')}
      <span class="eg-deg">°</span></div>`;
    const els = [...host.querySelectorAll('.eg-wheel')], digits = [Math.floor(value / 100), Math.floor(value / 10) % 10, value % 10];
    const ws = els.map((el, i) => wheel(el, {
      max: i === 0 ? 1 : 9, value: digits[i],
      onKey: (k) => { if (k === 'enter') onEnter(); else { const j = i + (k === 'next' ? 1 : -1); if (els[j]) els[j].focus({ preventScroll: true }); } },
    }));
    return { get value() { return ws[0].value * 100 + ws[1].value * 10 + ws[2].value; }, first: els[1] };
  }
  const miniAngle = (m, moving) => {
    const V = { x: m > 90 ? -0.4 : -1.6, y: 1.2 }, L = m > 90 ? 2.6 : 3.2;
    return `<svg viewBox="-2.2 -2.6 4.6 4.4" aria-hidden="true">${ray(V, 0, L, 'eg-ray')}${ray(V, m, L, moving ? 'eg-ray eg-move' : 'eg-ray')}${arc(V, 0, m, 0.9, 'eg-arc')}${dot(V)}</svg>`;
  };
  const SPEED_ANGLE = { facile: 14, expert: 30 }; // degrés par seconde en « Lancer »
  const gapHead = (gap, ok, u = '°') => (ok ? '🎉 EXACT !' : gap <= 2 ? `🔥 Tout près ! ${dec(gap)}${u} d'écart` : gap <= 7 ? `👀 Pas loin : ${dec(gap)}${u} d'écart` : `💨 Raté : ${dec(gap)}${u} d'écart`);
  const cls = (ok, gap, near) => (ok ? 'ok' : gap <= near ? 'near' : 'ko');

  const ESTIMANGLE = {
    logo: ['ESTIM', 'ANGLE'], bestKey: 'revisions6e-estimangle-1deg',
    levels: { facile: 'Facile', expert: 'Expert' },
    modes: {
      estimer: { icon: '🎯', name: 'Estimer', goal: 'Trouve la mesure exacte de l\'angle, à l\'œil.', mini: miniAngle(50, false) },
      lancer: { icon: '🚀', name: 'Lancer', goal: 'Arrête la demi-droite pile sur la bonne mesure.', mini: miniAngle(115, true) },
    },
    round(ctx) { (ctx.mode === 'estimer' ? angleEstimer : angleLancer)(ctx); },
  };
  function angleEstimer(ctx) {
    const { svg } = ctx;
    const m = rnd(1, 179), L = 4.4, s = Math.random() < 0.5 ? 1 : -1;
    // Facile : un côté horizontal ; Expert : angle tourné n'importe comment
    const a0 = ctx.level === 'facile' ? (s > 0 ? 0 : 180) : rnd(0, 359);
    const mid = a0 + (s * m) / 2, V = { x: -2 * Math.cos(rad(mid)), y: 2 * Math.sin(rad(mid)) };
    const a1 = a0 + s * m;
    svg.setAttribute('viewBox', '-5.4 -5.4 10.8 10.8');
    const base = ray(V, a0, L, 'eg-ray') + ray(V, a1, L, 'eg-ray');
    svg.innerHTML = base + dot(V);
    ctx.ask('Combien mesure cet angle ?');
    const c = ctx.controls('<div class="eg-pick"><div class="eg-lock-host"></div><button type="button" class="eg-btn eg-ok">Valider</button></div>');
    let done = false;
    const lk = lock(c.querySelector('.eg-lock-host'), { value: 90, onEnter: () => validate() });
    lk.first.focus({ preventScroll: true });
    c.querySelector('.eg-ok').addEventListener('click', () => validate());
    function validate() {
      if (done) return;
      const g = lk.value;
      if (g < 1 || g > 179) { // un angle tracé mesure entre 1° et 179° : on ne compte pas une erreur de réglage du cadenas
        const el = c.querySelector('.eg-lock'); el.classList.remove('eg-shake'); void el.offsetWidth; el.classList.add('eg-shake');
        if (!c.querySelector('.eg-warn')) c.insertAdjacentHTML('beforeend', '<p class="eg-warn">Choisis une mesure entre 1° et 179°.</p>');
        return;
      }
      done = true;
      const gap = Math.abs(g - m), ok = gap === 0;
      svg.innerHTML = base + (ok ? '' : seg(V, at(V, a0 + s * Math.min(g, 359), L), 'eg-guess')) + arc(V, Math.min(a0, a1), Math.max(a0, a1), 0.9, 'eg-arc')
        + dot(V) + label(V, (a0 + a1) / 2, 1.75, `${m}°`, 'eg-lab');
      ctx.finish({ gap, perfect: ok, cls: cls(ok, gap, 2), head: gapHead(gap, ok), html: `<p>L'angle mesure <b>${m}°</b>, tu as dit <b>${g}°</b>${ok ? '.' : g < m ? ' : trop petit.' : ' : trop grand.'}</p>` });
    }
  }
  function angleLancer(ctx) {
    const { svg } = ctx;
    const t = rnd(1, 179), left = Math.random() < 0.5, d0 = ctx.level === 'facile' ? 0 : rnd(-25, 25);
    const a0 = left ? 180 + d0 : d0, s = left ? -1 : 1, V = { x: 0, y: 1.6 }, L = 4.6;
    svg.setAttribute('viewBox', '-5.2 -3.5 10.4 6.8');
    svg.innerHTML = ray(V, a0, L, 'eg-ray') + ray(V, a0, L, 'eg-ray eg-move') + dot(V);
    const mv = [...svg.querySelectorAll('.eg-move')];
    ctx.ask(`Arrête la demi-droite à <b class="eg-target-val">${t}°</b>`);
    // la demi-droite tourne de façon fluide (on déplace seulement son extrémité) ; à l'arrêt, l'angle est arrondi au degré
    let cur = 0, dirn = 1;
    launcher(ctx, (dt) => {
      cur += dirn * SPEED_ANGLE[ctx.level] * dt;
      if (cur >= 180) { cur = 360 - cur; dirn = -1; }
      if (cur <= 0) { cur = -cur; dirn = 1; }
      moveSeg(mv, V, at(V, a0 + s * cur, L));
    }, () => {
      const a = Math.round(cur), gap = Math.abs(a - t), ok = gap === 0;
      const lo = Math.min(0, s * a), hi = Math.max(0, s * a);
      svg.innerHTML = ray(V, a0, L, 'eg-ray') + ray(V, a0 + s * a, L, 'eg-ray eg-move') + (ok ? '' : seg(V, at(V, a0 + s * t, L), 'eg-guess eg-want'))
        + arc(V, a0 + lo, a0 + hi, 0.9, 'eg-arc') + dot(V) + label(V, a0 + (s * a) / 2, 1.75, `${a}°`, 'eg-lab');
      ctx.finish({ gap, perfect: ok, cls: cls(ok, gap, 2), head: gapHead(gap, ok), html: `<p>Il fallait <b>${t}°</b>, ton angle mesure <b>${a}°</b>${ok ? '.' : a < t ? ' : trop petit.' : ' : trop grand.'}</p>
        ${ok ? '' : '<p class="eg-hint">En pointillés : la bonne demi-droite.</p>'}` });
    });
  }

  /* =========================================================
     Droite parfaite : parallèle / perpendiculaire à (d) passant par un point
     ========================================================= */
  const PERFECT = { facile: 1, expert: 0.5 };      // écart maximal (en degrés) pour un PERFECT
  const SPEED_LINE = { facile: 10, expert: 20 };   // degrés par seconde en « Lancer »
  const miniLines = (perp, moving) => {
    const A = { x: 0.4, y: -0.9 }, O = { x: 0, y: 0.9 }, a = 12;
    return `<svg viewBox="-2.4 -2.3 4.8 4.4" aria-hidden="true">${line(O, a, 3, 'eg-ray')}${line(A, perp ? a + 90 : a, 3, moving ? 'eg-ray eg-move' : 'eg-ray eg-mine')}${dot(A)}</svg>`;
  };
  const DROITE = {
    logo: ['DROITE ', 'PARFAITE'], bestKey: 'revisions6e-droite-parfaite',
    levels: { facile: 'Facile', expert: 'Expert' },
    modes: {
      tracer: { icon: '✏️', name: 'Tracer', goal: 'Fais tourner la droite pour qu\'elle soit parfaitement parallèle ou perpendiculaire.', mini: miniLines(false, false) },
      lancer: { icon: '🚀', name: 'Lancer', goal: 'La droite tourne : arrête-la pile au bon moment.', mini: miniLines(true, true) },
    },
    round: droiteRound,
  };
  /** angle (entre 0 et 90°) entre deux directions de droites */
  const lineGap = (a, b) => { const d = (((a - b) % 180) + 180) % 180; return Math.min(d, 180 - d); };
  function droiteRound(ctx) {
    const { svg } = ctx;
    const perp = Math.random() < 0.5, word = perp ? 'perpendiculaire' : 'parallèle';
    const W = 5.6, H = 3.8, L = 14;
    // la droite (d) : Facile = pas trop penchée ; Expert = n'importe quelle direction
    const ad = ctx.level === 'facile' ? rnd(-35, 35) : rnd(0, 179);
    const name = pick(['A', 'B', 'C', 'E', 'M', 'K', 'R', 'S']), dn = pick(['d', 'd', 'e', 'f']);
    let O, A;
    for (let k = 0; k < 50; k++) { // point bien visible, à une bonne distance de (d)
      O = { x: rnd(-12, 12) / 10, y: rnd(-8, 8) / 10 };
      A = at(at(O, ad, rnd(-15, 15) / 10), ad + (Math.random() < 0.5 ? 90 : -90), rnd(13, 24) / 10);
      if (Math.abs(A.x) < W - 1 && Math.abs(A.y) < H - 0.8) break;
    }
    const target = perp ? ad + 90 : ad;
    // nom de (d) près d'un bord, du côté opposé au point
    const lp = (() => { for (const t of [4.2, -4.2, 3.2, -3.2, 2.2]) { const P = at(O, ad, t); if (Math.abs(P.x) < W - 0.5 && Math.abs(P.y) < H - 0.5) return P; } return O; })();
    const side = dir(ad + 90), sgn = ((A.x - O.x) * side.x + (A.y - O.y) * side.y) > 0 ? -1 : 1;
    const dLab = `<text x="${f(lp.x + sgn * side.x * 0.45)}" y="${f(lp.y + sgn * side.y * 0.45)}" class="eg-name" text-anchor="middle" dominant-baseline="middle">(${dn})</text>`;
    const ptLab = `<text x="${f(A.x + 0.38)}" y="${f(A.y - 0.38)}" class="eg-name" text-anchor="middle" dominant-baseline="middle">${name}</text>`;
    svg.setAttribute('viewBox', `${-W} ${-H} ${2 * W} ${2 * H}`);
    const fixed = line(O, ad, L, 'eg-ray');
    let cur = target + (Math.random() < 0.5 ? 1 : -1) * rnd(25, 65);
    svg.innerHTML = fixed + line(A, cur, L, 'eg-ray eg-mine') + dot(A) + dLab + ptLab;
    const mv = [...svg.querySelectorAll('.eg-mine')];
    const show = () => moveSeg(mv, at(A, cur + 180, L), at(A, cur, L));
    ctx.ask(`Trace la <b>${word}</b> à (${dn}) passant par ${name}`);

    const finish = () => {
      const gap = lineGap(cur, target), g = Math.round(gap * 10) / 10, ok = g <= PERFECT[ctx.level];
      // la figure finale : la vraie droite en pointillés (et l'équerre si perpendiculaire)
      const I = (() => { // pied de la perpendiculaire / point de (d) le plus proche du point
        const u = dir(ad), t = (A.x - O.x) * u.x + (A.y - O.y) * u.y; return { x: O.x + t * u.x, y: O.y + t * u.y };
      })();
      let mark = '';
      if (perp) {
        const u = dir(ad), v = dir(ad + 90), q = 0.32, k = ((A.x - I.x) * v.x + (A.y - I.y) * v.y) > 0 ? 1 : -1;
        const P1 = { x: I.x + q * u.x, y: I.y + q * u.y }, P2 = { x: P1.x + k * q * v.x, y: P1.y + k * q * v.y }, P3 = { x: I.x + k * q * v.x, y: I.y + k * q * v.y };
        mark = `<path d="M${f(P1.x)} ${f(P1.y)} L${f(P2.x)} ${f(P2.y)} L${f(P3.x)} ${f(P3.y)}" class="eg-sq"/>`;
      }
      svg.innerHTML = fixed + (ok ? '' : dash(A, target, L, 'eg-guess eg-want') + mark) + line(A, cur, L, `eg-ray ${ok ? 'eg-want-ok' : 'eg-mine'}`) + (ok ? mark : '') + dot(A) + dLab + ptLab;
      const W2 = word.toUpperCase();
      ctx.finish({
        gap: g, perfect: ok, cls: cls(ok, g, 3),
        head: ok ? `✨ PERFECT ${W2} !` : gapHead(g, false),
        html: `<p>Écart avec la vraie ${word} : <b>${dec(g)}°</b>${ok ? '.' : ` (PERFECT si ${dec(PERFECT[ctx.level])}° ou moins).`}</p>
          ${ok ? '' : `<p class="eg-hint">En pointillés : la vraie ${word}.</p>`}`,
        meme: ok ? [perp ? '📐' : '🛤️', `Perfect ${word} !`] : null,
      });
    };

    if (ctx.mode === 'tracer') {
      // on attrape la droite n'importe où sur la figure et on la fait tourner autour du point ;
      // molette (sans cliquer) ou flèches pour régler finement
      const toAngle = (e) => {
        const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
        const q = p.matrixTransform(svg.getScreenCTM().inverse());
        if (Math.hypot(q.x - A.x, q.y - A.y) < 0.3) return;
        cur = deg(Math.atan2(-(q.y - A.y), q.x - A.x)); show();
      };
      let down = false, done = false;
      svg.classList.add('eg-grab');
      svg.tabIndex = 0;
      const onDown = (e) => { if (done) return; down = true; svg.setPointerCapture(e.pointerId); toAngle(e); };
      const onMove = (e) => { if (down && !done) toAngle(e); };
      const onUp = () => { down = false; };
      let acc = 0;
      const onWheel = (e) => { if (done) return; e.preventDefault(); acc += e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY; if (Math.abs(acc) >= 40) { cur += acc < 0 ? 0.5 : -0.5; acc = 0; show(); } };
      const onKey = (e) => {
        if (done) return;
        const k = { ArrowUp: 1, ArrowLeft: 1, ArrowDown: -1, ArrowRight: -1 }[e.key];
        if (k) { e.preventDefault(); cur += k * (e.shiftKey ? 2 : 0.5); show(); } else if (e.key === 'Enter') { e.preventDefault(); validate(); }
      };
      svg.addEventListener('pointerdown', onDown); svg.addEventListener('pointermove', onMove);
      svg.addEventListener('pointerup', onUp); svg.addEventListener('pointercancel', onUp);
      svg.addEventListener('wheel', onWheel, { passive: false }); svg.addEventListener('keydown', onKey);
      const c = ctx.controls('<p class="eg-hint">Attrape la droite et fais-la tourner (souris ou doigt), molette pour ajuster.</p><button type="button" class="eg-btn eg-ok">Valider</button>');
      c.querySelector('.eg-ok').addEventListener('click', () => validate());
      svg.focus({ preventScroll: true });
      function validate() {
        if (done) return; done = true;
        ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((t, i) => svg.removeEventListener(t, [onDown, onMove, onUp, onUp][i]));
        svg.removeEventListener('wheel', onWheel); svg.removeEventListener('keydown', onKey);
        svg.classList.remove('eg-grab'); svg.removeAttribute('tabindex');
        finish();
      }
    } else {
      mv.forEach((e) => e.classList.add('eg-move'));
      launcher(ctx, (dt) => { cur += SPEED_LINE[ctx.level] * dt; show(); }, finish);
    }
  }

  const GAMES = { estimangle: ESTIMANGLE, droite: DROITE };
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.game[data-game]').forEach((el) => { const G = GAMES[el.dataset.game]; if (G) arcade(el, G); });
  });
})();
