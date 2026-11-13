/* =========================================================
   Jeux — Estimangle (chapitre Les angles)
   Un menu propose deux jeux :
   - « Estimer » : un angle est tracé, on trouve sa mesure à l'œil, sur un cadenas à 3 roues (centaines, dizaines, unités).
   - « Lancer »  : une mesure est donnée, une demi-droite tourne degré par degré, on l'arrête au bon moment.
   Les mesures vont de 1° en 1° (de 1° à 179°). On marque un point seulement avec la mesure EXACTE.
   Niveaux : Facile (un côté horizontal / rotation lente) et Expert (angle tourné n'importe comment / rotation rapide).
   ========================================================= */
(function () {
  const ROUNDS = 10;
  const MODES = {
    estimer: { icon: '🎯', name: 'Estimer', goal: 'Trouve la mesure exacte de l\'angle, à l\'œil.' },
    lancer: { icon: '🚀', name: 'Lancer', goal: 'Arrête la demi-droite pile sur la bonne mesure.' },
  };
  // speed : vitesse de la demi-droite en mode Lancer (degrés par seconde)
  const LEVELS = { facile: { label: 'Facile', speed: 14 }, expert: { label: 'Expert', speed: 30 } };
  const BEST_KEY = 'revisions6e-estimangle-1deg'; // mesures au degré près : records repartis de zéro
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const rad = (d) => (d * Math.PI) / 180;
  const dir = (a) => ({ x: Math.cos(rad(a)), y: -Math.sin(rad(a)) }); // y vers le bas à l'écran
  const at = (V, a, L) => { const d = dir(a); return { x: V.x + L * d.x, y: V.y + L * d.y }; };
  const f = (n) => n.toFixed(3);
  const ray = (V, a, L, cls) => { const P = at(V, a, L); return `<line x1="${f(V.x)}" y1="${f(V.y)}" x2="${f(P.x)}" y2="${f(P.y)}" class="${cls}"/>`; };
  const label = (V, a, L, txt, cls) => { const P = at(V, a, L); return `<text x="${f(P.x)}" y="${f(P.y)}" class="${cls}" text-anchor="middle" dominant-baseline="middle">${txt}</text>`; };
  const arc = (V, a1, a2, r, cls) => {
    const P = at(V, a1, r), Q = at(V, a2, r), big = Math.abs(a2 - a1) > 180 ? 1 : 0, sweep = a2 > a1 ? 0 : 1;
    return `<path d="M${f(P.x)} ${f(P.y)} A${r} ${r} 0 ${big} ${sweep} ${f(Q.x)} ${f(Q.y)}" class="${cls}"/>`;
  };
  const DEFS = '<defs><filter id="eg-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=".09" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
  const dot = (V) => `<circle cx="${f(V.x)}" cy="${f(V.y)}" r="0.14" class="eg-dot"/>`;
  const loadBest = () => { try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}') || {}; } catch (e) { return {}; } };
  const saveBest = (b) => { try { localStorage.setItem(BEST_KEY, JSON.stringify(b)); } catch (e) { /* stockage indisponible */ } };
  /** petit dessin d'angle pour les cartes du menu */
  const miniAngle = (m, moving) => {
    const V = { x: m > 90 ? -0.4 : -1.6, y: 1.2 }, L = m > 90 ? 2.6 : 3.2;
    return `<svg viewBox="-2.2 -2.6 4.6 4.4" aria-hidden="true">${DEFS}<g filter="url(#eg-glow)">${ray(V, 0, L, 'eg-ray')}${ray(V, m, L, moving ? 'eg-ray eg-move' : 'eg-ray')}${arc(V, 0, m, 0.9, 'eg-arc')}</g>${dot(V)}</svg>`;
  };

  /** Une roue du cadenas (un chiffre). Molette au survol (sans cliquer), glisser, clic sur le chiffre du dessus /
      dessous, flèches ↑ ↓, ou taper le chiffre au clavier. Les grands chiffres sont en haut, comme une vraie roue. */
  function wheel(el, { max, value, onChange, onKey }) {
    let v = value;
    el.innerHTML = '<span class="eg-dg eg-dg-prev"></span><span class="eg-dg eg-dg-cur"></span><span class="eg-dg eg-dg-next"></span>';
    const [pv, cu, nx] = el.querySelectorAll('.eg-dg');
    const wrap = (n) => ((n % (max + 1)) + max + 1) % (max + 1);
    const show = (d = 0) => {
      pv.textContent = wrap(v + 1); cu.textContent = v; nx.textContent = wrap(v - 1);
      el.setAttribute('aria-valuenow', String(v));
      if (d) { el.classList.remove('eg-up', 'eg-down'); void el.offsetWidth; el.classList.add(d > 0 ? 'eg-down' : 'eg-up'); }
    };
    const set = (w, d) => { w = wrap(w); if (w !== v) { v = w; show(d); onChange(); } };
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
    return { get value() { return v; }, el };
  }

  /** Cadenas à 3 roues : centaines (0-1), dizaines, unités. */
  function lock(host, { value, onEnter }) {
    host.innerHTML = `<div class="eg-lock" role="group" aria-label="Mesure en degrés">
      ${['centaines', 'dizaines', 'unités'].map((n) => `<div class="eg-wheel" tabindex="0" role="spinbutton" aria-label="Chiffre des ${n}"></div>`).join('')}
      <span class="eg-deg">°</span></div>`;
    const els = [...host.querySelectorAll('.eg-wheel')], digits = [Math.floor(value / 100), Math.floor(value / 10) % 10, value % 10];
    const ws = els.map((el, i) => wheel(el, {
      max: i === 0 ? 1 : 9, value: digits[i], onChange: () => {},
      onKey: (k) => { if (k === 'enter') onEnter(); else { const j = i + (k === 'next' ? 1 : -1); if (els[j]) els[j].focus({ preventScroll: true }); } },
    }));
    return { get value() { return ws[0].value * 100 + ws[1].value * 10 + ws[2].value; }, first: els[1] };
  }

  function mount(root) {
    root.classList.add('eg-game');
    const st = { mode: 'estimer', level: 'facile', round: 0, good: 0, gaps: [], res: [], phase: 'menu', raf: 0 };
    const $ = (s) => root.querySelector(s);
    function stop() { cancelAnimationFrame(st.raf); st.raf = 0; }

    /* ---------- Menu ---------- */
    function menu() {
      stop(); st.phase = 'menu';
      const best = loadBest();
      const rec = (m) => { const b = best[m + '-' + st.level]; return b ? `🏆 Record : ${b.good} / ${ROUNDS}` : 'Pas encore de record'; };
      root.innerHTML = `<div class="eg-menu">
        <p class="eg-logo">ESTIM<span>ANGLE</span></p>
        <div class="eg-lv" role="group" aria-label="Niveau">
          ${Object.entries(LEVELS).map(([k, l]) => `<button type="button" data-level="${k}" aria-pressed="${k === st.level}">${k === 'facile' ? '🙂' : '🔥'} ${l.label}</button>`).join('')}
        </div>
        <div class="eg-cards">
          ${Object.entries(MODES).map(([k, m], i) => `<button type="button" class="eg-card eg-card-${k}" data-mode="${k}">
            ${miniAngle(i ? 115 : 50, i === 1)}
            <span class="eg-card-name">${m.icon} ${m.name}</span>
            <span class="eg-card-goal">${m.goal}</span>
            <span class="eg-card-rec">${rec(k)}</span></button>`).join('')}
        </div></div>`;
      root.querySelectorAll('[data-level]').forEach((b) => b.addEventListener('click', () => { st.level = b.dataset.level; menu(); root.querySelector(`[data-level="${st.level}"]`).focus(); }));
      root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { st.mode = b.dataset.mode; newGame(); }));
    }

    /* ---------- Partie ---------- */
    function newGame() {
      stop();
      Object.assign(st, { round: 0, good: 0, gaps: [], res: [] });
      const m = MODES[st.mode];
      root.innerHTML = `<div class="eg-play">
        <div class="eg-hud">
          <button type="button" class="eg-back">← Menu</button>
          <span class="eg-title">${m.icon} ${m.name} <small>${LEVELS[st.level].label}</small></span>
          <span class="eg-pts" aria-live="polite"></span>
        </div>
        <div class="eg-pips" aria-hidden="true">${'<i></i>'.repeat(ROUNDS)}</div>
        <p class="eg-ask"></p>
        <svg class="eg-svg" role="img" aria-label="Angle du jeu"></svg>
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
      st.phase = 'idle'; st.round++;
      $('.eg-feedback').innerHTML = '';
      if (st.round > ROUNDS) return end();
      hud();
      (st.mode === 'estimer' ? roundEstimer : roundLancer)();
    }
    function end() {
      const avg = Math.round((st.gaps.reduce((a, b) => a + b, 0) / st.gaps.length) * 10) / 10;
      const key = st.mode + '-' + st.level, best = loadBest(), prev = best[key];
      const record = !prev || st.good > prev.good || (st.good === prev.good && avg < prev.avg);
      if (record) { best[key] = { good: st.good, avg }; saveBest(best); }
      hud();
      const stars = st.good >= 6 ? 3 : st.good >= 3 ? 2 : st.good >= 1 ? 1 : 0;
      const msg = st.good === ROUNDS ? 'Incroyable, un œil de rapporteur !' : st.good >= 6 ? 'Excellent !' : st.good >= 3 ? 'Très bien, tu vises juste !' : st.good >= 1 ? 'Bien joué, la mesure exacte, c\'est dur !' : 'Aucune mesure exacte… Retente ta chance !';
      $('.eg-ask').innerHTML = '';
      $('.eg-svg').style.display = 'none';
      $('.eg-controls').innerHTML = '';
      $('.eg-feedback').innerHTML = `<div class="eg-end">
        <p class="eg-stars">${'<span class="on">★</span>'.repeat(stars)}${'<span>★</span>'.repeat(3 - stars)}</p>
        <p class="eg-score">${st.good} / ${ROUNDS}</p><p class="eg-msg">${msg}</p>
        <p class="eg-sub">Écart moyen : ${String(avg).replace('.', ',')}°${record ? (prev ? ' · 🏆 Nouveau record !' : ' · 🏆 Premier record !') : ` · Record : ${prev.good} / ${ROUNDS}`}</p>
        <p class="eg-btns"><button type="button" class="eg-btn eg-again">↻ Rejouer</button><button type="button" class="eg-btn eg-alt eg-menu-b">Menu</button></p></div>`;
      $('.eg-again').addEventListener('click', newGame);
      $('.eg-menu-b').addEventListener('click', menu);
      $('.eg-again').focus({ preventScroll: true });
    }
    /** Résultat d'un angle */
    function verdict(gap, html) {
      const ok = gap === 0;
      if (ok) st.good++;
      st.gaps.push(gap); st.res.push(ok);
      hud();
      const head = ok ? '🎉 EXACT !' : gap <= 2 ? `🔥 Tout près ! ${gap}° d'écart` : gap <= 7 ? `👀 Pas loin : ${gap}° d'écart` : `💨 Raté : ${gap}° d'écart`;
      $('.eg-feedback').innerHTML = `<div class="eg-verdict ${ok ? 'ok' : gap <= 2 ? 'near' : 'ko'}"><p class="eg-big">${head}</p>${html}</div>
        <p><button type="button" class="eg-btn eg-next">${st.round < ROUNDS ? 'Angle suivant →' : 'Voir mon score →'}</button></p>`;
      const b = $('.eg-next'); b.addEventListener('click', next); b.focus({ preventScroll: true });
    }

    /* ---------- Jeu 1 : estimer ---------- */
    function roundEstimer() {
      const svg = $('.eg-svg');
      const m = rnd(1, 179), L = 4.4;
      // Facile : un côté horizontal ; Expert : angle tourné n'importe comment
      let a0, s;
      if (st.level === 'facile') { s = Math.random() < 0.5 ? 1 : -1; a0 = s > 0 ? 0 : 180; } else { s = Math.random() < 0.5 ? 1 : -1; a0 = rnd(0, 359); }
      const mid = a0 + (s * m) / 2, V = { x: -2 * Math.cos(rad(mid)), y: 2 * Math.sin(rad(mid)) };
      const a1 = a0 + s * m;
      svg.style.display = '';
      svg.setAttribute('viewBox', '-5.4 -5.4 10.8 10.8');
      const base = DEFS + `<g filter="url(#eg-glow)">${ray(V, a0, L, 'eg-ray')}${ray(V, a1, L, 'eg-ray')}</g>` + dot(V);
      svg.innerHTML = base;
      $('.eg-ask').innerHTML = 'Combien mesure cet angle ?';
      $('.eg-controls').innerHTML = '<div class="eg-pick"><div class="eg-lock-host"></div><button type="button" class="eg-btn eg-ok">Valider</button></div>';
      let done = false;
      const pick = lock($('.eg-lock-host'), { value: 90, onEnter: () => validate() });
      pick.first.focus({ preventScroll: true });
      $('.eg-ok').addEventListener('click', () => validate());
      function validate() {
        if (done) return; done = true;
        const g = pick.value, gap = Math.abs(g - m), ok = gap === 0;
        const ag = a0 + s * Math.min(g, 359);
        svg.innerHTML = base + `<g filter="url(#eg-glow)">${ok ? '' : ray(V, ag, L, 'eg-guess')}${arc(V, Math.min(a0, a1), Math.max(a0, a1), 0.9, 'eg-arc')}</g>` + label(V, (a0 + a1) / 2, 1.75, `${m}°`, 'eg-lab');
        $('.eg-controls').innerHTML = '';
        verdict(gap, `<p>L'angle mesure <b>${m}°</b>, tu as dit <b>${g}°</b>${ok ? '.' : g < m ? ' : trop petit.' : ' : trop grand.'}</p>`);
      }
    }

    /* ---------- Jeu 2 : lancer ---------- */
    function roundLancer() {
      const svg = $('.eg-svg');
      const t = rnd(1, 179), left = Math.random() < 0.5, d0 = st.level === 'facile' ? 0 : rnd(-25, 25);
      const a0 = left ? 180 + d0 : d0, s = left ? -1 : 1, V = { x: 0, y: 1.6 }, L = 4.6;
      svg.style.display = '';
      svg.setAttribute('viewBox', '-5.2 -3.5 10.4 6.8');
      const fixed = DEFS + `<g filter="url(#eg-glow)">${ray(V, a0, L, 'eg-ray')}`;
      const draw = (a, extra = '') => { svg.innerHTML = fixed + ray(V, a0 + s * a, L, 'eg-ray eg-move') + extra + '</g>' + dot(V); };
      draw(0);
      $('.eg-ask').innerHTML = `Arrête la demi-droite à <b class="eg-target-val">${t}°</b>`;
      $('.eg-controls').innerHTML = '<button type="button" class="eg-btn eg-go">▶ Lancer</button>';
      const btn = $('.eg-go');
      btn.focus({ preventScroll: true });
      // la demi-droite tourne de façon fluide : on déplace seulement son extrémité (pas de redessin = pas de clignotement) ;
      // à l'arrêt, l'angle est arrondi au degré
      let cur = 0, dirn = 1, last = 0;
      const speed = LEVELS[st.level].speed;
      const mv = svg.querySelector('.eg-move');
      const tick = (now) => {
        const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
        cur += dirn * speed * dt;
        if (cur >= 180) { cur = 360 - cur; dirn = -1; }
        if (cur <= 0) { cur = -cur; dirn = 1; }
        const P = at(V, a0 + s * cur, L);
        mv.setAttribute('x2', f(P.x)); mv.setAttribute('y2', f(P.y));
        st.raf = requestAnimationFrame(tick);
      };
      const halt = () => {
        if (st.phase !== 'run') return;
        st.phase = 'done'; stop();
        const a = Math.round(cur), gap = Math.abs(a - t), ok = gap === 0;
        const lo = Math.min(0, s * a), hi = Math.max(0, s * a);
        draw(a, (ok ? '' : ray(V, a0 + s * t, L, 'eg-guess eg-want')) + arc(V, a0 + lo, a0 + hi, 0.9, 'eg-arc'));
        svg.insertAdjacentHTML('beforeend', label(V, a0 + (s * a) / 2, 1.75, `${a}°`, 'eg-lab'));
        $('.eg-controls').innerHTML = '';
        verdict(gap, `<p>Il fallait <b>${t}°</b>, ton angle mesure <b>${a}°</b>${ok ? '.' : a < t ? ' : trop petit.' : ' : trop grand.'}</p>
          ${ok ? '' : '<p class="eg-hint">En pointillés : la bonne demi-droite.</p>'}`);
      };
      btn.addEventListener('click', () => {
        if (st.phase === 'run') return halt();
        st.phase = 'run'; last = 0;
        btn.textContent = '⏹ Stop'; btn.classList.add('eg-stop');
        st.raf = requestAnimationFrame(tick);
      });
      st.halt = halt;
      st.phase = 'ready';
    }

    document.addEventListener('keydown', (e) => {
      if (st.mode !== 'lancer' || !root.closest('.page')?.classList.contains('active')) return;
      if ((e.code === 'Space' || e.key === ' ') && (st.phase === 'run' || st.phase === 'ready')) {
        e.preventDefault();
        if (st.phase === 'run') st.halt(); else $('.eg-go')?.click();
      }
    });
    // on quitte la page : on arrête l'animation et on revient au menu
    window.addEventListener('hashchange', () => { if (st.phase === 'run') menu(); });
    menu();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.game[data-game="estimangle"]').forEach(mount);
  });
})();
