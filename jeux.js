/* =========================================================
   Jeux — Estimangle (chapitre Les angles)
   Mode « Estimer » : un angle est tracé, on donne sa mesure à l'œil.
   Mode « Lancer »  : une mesure est donnée, une demi-droite tourne, on l'arrête au bon moment.
   Une réponse est JUSTE seulement si c'est la mesure EXACTE. Pour que ce soit jouable, les mesures vont
   de 10° en 10° (Facile) ou de 5° en 5° (Expert) : la réponse se choisit sur une roue de nombres
   (molette, doigt ou flèches, sans cliquer avant), et la demi-droite avance par crans du même pas.
   ========================================================= */
(function () {
  const ROUNDS = 10;
  // step : pas des mesures ; tick : durée d'un cran de la demi-droite qui tourne (en secondes)
  const LEVELS = { facile: { step: 10, label: 'Facile', tick: 0.25 }, expert: { step: 5, label: 'Expert', tick: 0.11 } };
  const BEST_KEY = 'revisions6e-estimangle-exact'; // règle « mesure exacte » : records repartis de zéro
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const rad = (d) => (d * Math.PI) / 180;
  const dir = (a) => ({ x: Math.cos(rad(a)), y: -Math.sin(rad(a)) }); // y vers le bas à l'écran
  const at = (V, a, L) => { const d = dir(a); return { x: V.x + L * d.x, y: V.y + L * d.y }; };
  const f = (n) => n.toFixed(3);
  const ray = (V, a, L, cls) => { const P = at(V, a, L); return `<line x1="${f(V.x)}" y1="${f(V.y)}" x2="${f(P.x)}" y2="${f(P.y)}" class="${cls}"/>`; };
  const label = (V, a, L, txt, cls) => { const P = at(V, a, L); return `<text x="${f(P.x)}" y="${f(P.y)}" class="${cls}" text-anchor="middle" dominant-baseline="middle">${txt}</text>`; };
  /** petit arc de codage entre les directions a1 et a2 (sens s) — seulement pour la correction */
  const arc = (V, a1, a2, r, cls) => {
    const P = at(V, a1, r), Q = at(V, a2, r), big = Math.abs(a2 - a1) > 180 ? 1 : 0, sweep = a2 > a1 ? 0 : 1;
    return `<path d="M${f(P.x)} ${f(P.y)} A${r} ${r} 0 ${big} ${sweep} ${f(Q.x)} ${f(Q.y)}" class="${cls}"/>`;
  };
  const loadBest = () => { try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}') || {}; } catch (e) { return {}; } };
  const saveBest = (b) => { try { localStorage.setItem(BEST_KEY, JSON.stringify(b)); } catch (e) { /* stockage indisponible */ } };

  /** Roue de nombres : on fait défiler les valeurs (molette au survol, glisser du doigt ou de la souris, flèches du
      clavier, ou clic sur le nombre au-dessus / au-dessous). Comme une vraie roue : les grands nombres sont en haut ;
      molette vers le haut, flèche ↑ ou doigt qui tire la roue vers le bas = nombre plus grand. Un cran de molette = un pas. */
  function drum(host, { min, max, step, value, onEnter }) {
    let v = value;
    host.innerHTML = `<div class="eg-drum" tabindex="0" role="spinbutton" aria-label="Mesure en degrés" aria-valuemin="${min}" aria-valuemax="${max}">
      <span class="eg-dr-n eg-dr-prev"></span><span class="eg-dr-n eg-dr-cur"></span><span class="eg-dr-n eg-dr-next"></span></div>`;
    const el = host.querySelector('.eg-drum'), [pv, cu, nx] = el.querySelectorAll('.eg-dr-n');
    const show = (dirn = 0) => {
      pv.textContent = v + step <= max ? `${v + step}°` : ''; cu.textContent = `${v}°`; nx.textContent = v - step >= min ? `${v - step}°` : '';
      el.setAttribute('aria-valuenow', String(v)); el.setAttribute('aria-valuetext', `${v} degrés`);
      // le nombre suivant arrive d'en haut (plus grand) ou d'en bas (plus petit)
      if (dirn) { el.classList.remove('eg-up', 'eg-down'); void el.offsetWidth; el.classList.add(dirn > 0 ? 'eg-down' : 'eg-up'); }
    };
    const move = (k) => { const w = Math.min(max, Math.max(min, v + k * step)); if (w !== v) { v = w; show(k); } };
    // molette (et pavé tactile) : pas besoin de cliquer avant, il suffit d'être au-dessus ; au plus un pas par cran
    let acc = 0;
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      acc += e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
      if (Math.abs(acc) >= 50) { move(acc < 0 ? 1 : -1); acc = 0; }
    }, { passive: false });
    // glisser : tirer la roue vers le bas fait descendre le nombre du dessus (plus grand) au milieu
    let y0 = null, dragged = false;
    el.addEventListener('pointerdown', (e) => { y0 = e.clientY; dragged = false; el.setPointerCapture(e.pointerId); el.focus({ preventScroll: true }); });
    el.addEventListener('pointermove', (e) => {
      if (y0 === null) return;
      const dy = e.clientY - y0;
      if (Math.abs(dy) >= 22) { move(dy > 0 ? 1 : -1); y0 = e.clientY; dragged = true; }
    });
    el.addEventListener('pointerup', (e) => {
      if (y0 === null) return; y0 = null;
      if (dragged) return;
      // simple clic sur le nombre du dessus (plus grand) ou du dessous (plus petit) : on le choisit
      const r = el.getBoundingClientRect(), y = (e.clientY - r.top) / r.height;
      if (y < 0.33) move(1); else if (y > 0.67) move(-1);
    });
    el.addEventListener('pointercancel', () => { y0 = null; });
    el.addEventListener('keydown', (e) => {
      const k = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 3, PageDown: -3 }[e.key];
      if (k) { e.preventDefault(); move(k); }
      else if (e.key === 'Enter') { e.preventDefault(); onEnter?.(); }
    });
    show();
    return { get value() { return v; }, el };
  }

  function mount(root) {
    const st = { mode: 'estimer', level: 'facile', round: 0, good: 0, phase: 'idle', raf: 0 };
    root.innerHTML = `
      <div class="eg-bar">
        <div class="eg-seg" role="group" aria-label="Mode de jeu">
          <button type="button" data-mode="estimer" aria-pressed="true">🎯 Estimer l'angle</button>
          <button type="button" data-mode="lancer" aria-pressed="false">🚀 Lancer l'angle</button>
        </div>
        <div class="eg-seg" role="group" aria-label="Niveau">
          <button type="button" data-level="facile" aria-pressed="true">Facile · de 10° en 10°</button>
          <button type="button" data-level="expert" aria-pressed="false">Expert · de 5° en 5°</button>
        </div>
      </div>
      <p class="eg-rule"></p>
      <div class="eg-status" aria-live="polite"></div>
      <p class="eg-ask"></p>
      <svg class="eg-svg" role="img" aria-label="Angle du jeu"></svg>
      <div class="eg-controls"></div>
      <div class="eg-feedback" aria-live="polite"></div>`;
    const $ = (s) => root.querySelector(s);
    const svg = $('.eg-svg');
    const step = () => LEVELS[st.level].step;

    function setRule() {
      $('.eg-rule').innerHTML = st.mode === 'estimer'
        ? `Un angle est tracé. Trouve sa mesure <b>sans rapporteur</b>, à l'œil : elle va de ${step()}° en ${step()}°. Fais défiler les nombres (molette de la souris, glisser du doigt ou flèches du clavier), puis valide. <b>C'est juste seulement si c'est la mesure exacte.</b> ${ROUNDS} angles par partie.`
        : `Une mesure est donnée. Appuie sur <b>Lancer</b> : une demi-droite tourne, de ${step()}° en ${step()}°. Appuie sur <b>Stop</b> (ou la barre <kbd>Espace</kbd>) quand l'angle a la bonne mesure. <b>C'est juste seulement si c'est la mesure exacte.</b> ${ROUNDS} angles par partie.`;
    }
    function status() {
      $('.eg-status').innerHTML = st.round > ROUNDS ? '' : `<span>Angle <b>${st.round}</b> / ${ROUNDS}</span><span>✅ <b>${st.good}</b> juste${st.good > 1 ? 's' : ''}</span>`;
    }
    function stop() { cancelAnimationFrame(st.raf); st.raf = 0; }

    function newGame() {
      stop();
      st.round = 0; st.good = 0;
      root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === st.mode)));
      root.querySelectorAll('[data-level]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.level === st.level)));
      setRule();
      next();
    }
    function next() {
      stop();
      st.phase = 'idle';
      st.round++;
      $('.eg-feedback').innerHTML = '';
      if (st.round > ROUNDS) return end();
      status();
      (st.mode === 'estimer' ? roundEstimer : roundLancer)();
    }
    function end() {
      const key = st.mode + '-' + st.level, best = loadBest(), prev = best[key];
      const record = prev == null || st.good > prev;
      if (record) { best[key] = st.good; saveBest(best); }
      status();
      $('.eg-ask').innerHTML = '';
      svg.innerHTML = ''; svg.style.display = 'none';
      const msg = st.good === ROUNDS ? 'Parfait, tu as l\'œil !' : st.good >= 7 ? 'Très bien !' : st.good >= 4 ? 'Pas mal, continue à t\'entraîner.' : 'Entraîne-toi encore : compare chaque angle à l\'angle droit (90°) et à sa moitié (45°).';
      $('.eg-controls').innerHTML = '';
      $('.eg-feedback').innerHTML = `<div class="eg-end"><p class="eg-score">${st.good} / ${ROUNDS}</p><p><b>Partie terminée.</b> ${msg}</p>
        <p class="muted">${record ? (prev == null ? 'Premier score enregistré' : `Nouveau record ! (avant : ${prev} / ${ROUNDS})`) : `Ton record : ${prev} / ${ROUNDS}`} — mode « ${st.mode === 'estimer' ? 'Estimer' : 'Lancer'} », niveau ${LEVELS[st.level].label}.</p>
        <p><button type="button" class="btn primary eg-again">Rejouer</button></p></div>`;
      $('.eg-again').addEventListener('click', newGame);
    }
    /** Affiche le résultat d'un angle : JUSTE ou FAUX, avec l'écart et la marge */
    function verdict(ok, html) {
      if (ok) st.good++;
      status();
      $('.eg-feedback').innerHTML = `<div class="eg-verdict ${ok ? 'ok' : 'ko'}"><p class="eg-big">${ok ? '✅ JUSTE' : '❌ FAUX'}</p>${html}</div>
        <p><button type="button" class="btn primary eg-next">${st.round < ROUNDS ? 'Angle suivant →' : 'Voir mon score →'}</button></p>`;
      const b = $('.eg-next'); b.addEventListener('click', next); b.focus({ preventScroll: true });
    }
    const gapTxt = (gap, ok) => (ok ? 'Mesure exacte, bravo !' : `Écart : <b>${gap}°</b>. Il faut la mesure exacte.`);

    /* ---------- Mode 1 : estimer ---------- */
    function roundEstimer() {
      const m = step() * rnd(1, 180 / step() - 1), s = Math.random() < 0.5 ? 1 : -1, a0 = rnd(0, 359), L = 4.4;
      const mid = a0 + (s * m) / 2, V = { x: -2 * Math.cos(rad(mid)), y: 2 * Math.sin(rad(mid)) };
      const a1 = a0 + s * m;
      svg.style.display = '';
      svg.setAttribute('viewBox', '-5.4 -5.4 10.8 10.8');
      const base = ray(V, a0, L, 'eg-ray') + ray(V, a1, L, 'eg-ray') + `<circle cx="${f(V.x)}" cy="${f(V.y)}" r="0.12" class="eg-dot"/>`;
      svg.innerHTML = base;
      $('.eg-ask').innerHTML = 'Combien mesure cet angle ?';
      $('.eg-controls').innerHTML = '<div class="eg-pick"><span>Mon estimation :</span><div class="eg-drum-host"></div><button type="button" class="btn primary eg-ok">Valider</button></div>';
      let done = false;
      const pick = drum($('.eg-drum-host'), { min: step(), max: 180 - step(), step: step(), value: 90, onEnter: () => validate() });
      pick.el.focus({ preventScroll: true }); // les flèches du clavier marchent tout de suite
      $('.eg-ok').addEventListener('click', () => validate());
      function validate() {
        if (done) return; done = true;
        const g = pick.value;
        const gap = Math.abs(g - m), ok = gap === 0;
        const ag = a0 + s * g;
        svg.innerHTML = base + ray(V, ag, L, `eg-guess ${ok ? 'ok' : 'ko'}`)
          + arc(V, Math.min(a0, a1), Math.max(a0, a1), 0.9, 'eg-arc') + label(V, (a0 + a1) / 2, 1.75, `${m}°`, 'eg-lab');
        $('.eg-controls').innerHTML = '';
        verdict(ok, `<p>L'angle mesure <b>${m}°</b>. Tu as dit <b>${g}°</b>${g === m ? ' : pile !' : g < m ? ' (trop petit).' : ' (trop grand).'}</p><p>${gapTxt(gap, ok)}</p>
          ${ok ? '' : `<p class="muted small">Sur la figure, en pointillés : la demi-droite qui donnerait ${g}°.</p>`}`);
      }
    }

    /* ---------- Mode 2 : lancer ---------- */
    function roundLancer() {
      const t = step() * rnd(1, 180 / step() - 1), left = Math.random() < 0.5, d0 = rnd(-12, 12);
      const a0 = left ? 180 + d0 : d0, s = left ? -1 : 1, V = { x: 0, y: 1.6 }, L = 4.6;
      svg.style.display = '';
      svg.setAttribute('viewBox', '-5.2 -3.5 10.4 6.8');
      const fixed = ray(V, a0, L, 'eg-ray') + `<circle cx="${f(V.x)}" cy="${f(V.y)}" r="0.12" class="eg-dot"/>`;
      const draw = (a, extra = '') => { svg.innerHTML = fixed + ray(V, a0 + s * a, L, 'eg-ray eg-move') + extra; };
      svg.innerHTML = fixed;
      $('.eg-ask').innerHTML = `Arrête la demi-droite quand l'angle mesure <b class="eg-target-val">${t}°</b>.`;
      $('.eg-controls').innerHTML = '<button type="button" class="btn primary eg-go">▶ Lancer</button>';
      const btn = $('.eg-go');
      btn.focus({ preventScroll: true });
      // la demi-droite avance par crans du pas du niveau : on peut s'arrêter pile sur la bonne mesure
      let cur = 0, dirn = 1, last = 0, acc = 0;
      const dur = LEVELS[st.level].tick;
      const tick = (now) => {
        acc += last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
        let moved = false;
        while (acc >= dur) {
          acc -= dur; moved = true;
          cur += dirn * step();
          if (cur >= 180) { cur = 180; dirn = -1; }
          if (cur <= 0) { cur = 0; dirn = 1; }
        }
        if (moved) draw(cur);
        st.raf = requestAnimationFrame(tick);
      };
      const halt = () => {
        if (st.phase !== 'run') return;
        st.phase = 'done'; stop();
        const a = Math.round(cur), gap = Math.abs(a - t), ok = gap === 0;
        const lo = Math.min(0, s * a), hi = Math.max(0, s * a);
        draw(a, ray(V, a0 + s * t, L, `eg-guess eg-want`) + arc(V, a0 + lo, a0 + hi, 0.9, 'eg-arc') + label(V, a0 + (s * a) / 2, 1.75, `${a}°`, 'eg-lab'));
        $('.eg-controls').innerHTML = '';
        verdict(ok, `<p>Il fallait <b>${t}°</b>. Ton angle mesure <b>${a}°</b>${a === t ? ' : pile !' : a < t ? ' (trop petit).' : ' (trop grand).'}</p><p>${gapTxt(gap, ok)}</p>
          ${ok ? '' : `<p class="muted small">Sur la figure, en pointillés verts : la demi-droite qui donnait ${t}°.</p>`}`);
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

    root.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { st.mode = b.dataset.mode; newGame(); }));
    root.querySelectorAll('[data-level]').forEach((b) => b.addEventListener('click', () => { st.level = b.dataset.level; newGame(); }));
    svg.addEventListener('click', () => { if (st.phase === 'run') st.halt(); });
    document.addEventListener('keydown', (e) => {
      if (st.mode !== 'lancer' || !root.closest('.page')?.classList.contains('active')) return;
      if ((e.code === 'Space' || e.key === ' ') && (st.phase === 'run' || st.phase === 'ready')) {
        e.preventDefault();
        if (st.phase === 'run') st.halt(); else $('.eg-go')?.click();
      }
    });
    // on quitte la page : on arrête l'animation
    window.addEventListener('hashchange', () => { if (st.phase === 'run') newGame(); });
    newGame();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.game[data-game="estimangle"]').forEach(mount);
  });
})();
