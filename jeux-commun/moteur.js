/* =========================================================
   MOTEUR COMMUN DES JEUX (sites de 6e et de 5e) — jeux-commun/moteur.js
   Le même fichier est copié dans les deux sites : si on le change, changer les deux.

   - Moteur.U : outils et hasard. Le hasard peut être « fixé » par une graine (U.withSeed) : en duel, deux
     joueurs du même niveau ont ainsi exactement les mêmes questions, dans le même ordre.
   - Moteur.question(host, q, opts) : affiche une question et son mode de réponse, puis la corrige.
       q = { type, fig, txt, input, options, answer, show, why, dec, unit, exact, check }
         type   : identifiant de la sorte de question (pour les statistiques)
         fig    : figure (SVG ou HTML), facultative ;  txt : la consigne (HTML)
         input  : 'choice' (boutons, answer = index), 'num' (pavé numérique, answer = nombre),
                  'frac' (pavé fraction, answer = [num, den] ; une fraction égale est acceptée sauf si exact),
                  'tap' (toucher un élément [data-tap] de la figure, answer = valeur ou liste de valeurs)
         show   : la bonne réponse écrite (HTML) ;  why : l'explication courte affichée après une erreur
   - Moteur.duel(cfg) : DUEL 1 contre 1 sur une seule tablette coupée en deux : moitié gauche / moitié droite.
       Les joueurs sont côte à côte ; le bouton ⟳ tourne chaque moitié vers son joueur (assis face à face aux
       deux bouts de la tablette). Ce choix est gardé sur l'appareil.
       Chaque joueur tape son prénom (clavier à l'écran) et choisit son niveau ; le premier à cfg.cible
       bonnes réponses gagne. Une erreur bloque le joueur quelques secondes avec la correction.
       Les duels sont gardés sur l'appareil (localStorage « jeux-duels ») pour être envoyés plus tard.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Hasard ---------- */
  let src = Math.random;
  function mulberry(a) {
    return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const U = {
    r: () => src(),
    rand: (a, b) => a + Math.floor(src() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(src() * arr.length)],
    shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(src() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    withSeed(seed, fn) { const old = src; src = mulberry(seed); try { return fn(); } finally { src = old; } },
    esc: (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    /** fraction écrite en colonne */
    fr: (n, d) => `<span class="m-fr"><span>${n}</span><span>${d}</span></span>`,
    gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; },
    num: (x) => String(Math.round(x * 1000) / 1000).replace('.', ','),
    now: () => performance.now(),
    /** mémoire de l'appareil : S = U.store('cle') ; S.d.record = 3 ; S.save() */
    store(key) {
      let d; try { d = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) { d = {}; }
      return { d, save() { try { localStorage.setItem(key, JSON.stringify(d)); } catch (e) { /* stockage indisponible */ } } };
    },
    /** toucher rapide : réagit dès que le doigt se pose (deux joueurs peuvent toucher en même temps) ; Entrée/Espace marchent aussi */
    tap(el, fn) {
      el.addEventListener('pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); fn(e); });
      el.addEventListener('click', (e) => { if (e.detail === 0) fn(e); });
    },
    confetti(n = 60, colors = ['#ffd23f', '#3fe3ff', '#ff5fae', '#3ee08f', '#a78bfa', '#ff9a3c'], host = document.body) {
      const box = document.createElement('div');
      box.className = 'm-confetti';
      let h = '';
      for (let i = 0; i < n; i++) h += `<i style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};--dx:${Math.round(Math.random() * 180 - 90)}px;--r:${Math.round(360 + Math.random() * 720)}deg;animation-delay:${(Math.random() * 0.3).toFixed(2)}s;${i % 3 ? '' : 'border-radius:50%;'}"></i>`;
      box.innerHTML = h;
      host.appendChild(box);
      setTimeout(() => box.remove(), 2400);
    },
  };

  /* ---------- Sons synthétisés (aucun fichier) ---------- */
  function makeSound(isMuted) {
    const S = {
      ctx: null,
      init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* pas de son */ } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
      tone(f, d, type = 'triangle', vol = 0.07, f2 = 0, delay = 0) {
        if (isMuted() || !this.ctx) return;
        const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.02);
      },
      noise(d, vol = 0.2, freq = 900) {
        if (isMuted() || !this.ctx) return;
        const c = this.ctx, b = c.createBuffer(1, Math.floor(c.sampleRate * d), c.sampleRate), x = b.getChannelData(0);
        for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / x.length);
        const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
        s.buffer = b; s.connect(f).connect(g).connect(c.destination); s.start();
      },
      good(k = 0) { const b = 520 * Math.pow(1.06, Math.min(k, 10)); [1, 1.26, 1.5].forEach((m, i) => this.tone(b * m, 0.12, 'triangle', 0.07, 0, i * 0.06)); },
      bad() { this.tone(170, 0.3, 'sawtooth', 0.06, 90); },
      tick() { this.tone(1200, 0.03, 'square', 0.02); },
      key() { this.tone(660, 0.03, 'triangle', 0.03); },
      win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.07, 0, i * 0.11)); },
      lose() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.045, 0, i * 0.18)); },
    };
    document.addEventListener('pointerdown', () => S.init(), { once: true });
    return S;
  }

  /* =========================================================
     Une question et sa réponse
     ========================================================= */
  function isRight(q, v) {
    if (q.check) return !!q.check(v);
    if (v === null || v === undefined) return false;
    switch (q.input) {
      case 'choice': return Number(v) === Number(q.answer);
      case 'num': return Math.abs(Number(v) - Number(q.answer)) < 1e-9;
      case 'frac': {
        const [n, d] = v, [N, D] = q.answer;
        if (!d) return false;
        return q.exact ? n === N && d === D : n * D === N * d;
      }
      case 'tap': return [].concat(q.answer).map(String).includes(String(v));
      default: return false;
    }
  }
  const PAD_NUM = ['7', '8', '9', '4', '5', '6', '1', '2', '3', ',', '0', '⌫'];

  /**
   * Affiche la question q dans host.  opts = { onAnswer(ok, given), keyboard: true (clavier de l'ordinateur), sound }
   * Après la réponse, la bonne réponse est montrée automatiquement.  Renvoie { kill(), reveal() }.
   */
  function question(host, q, opts = {}) {
    host.innerHTML = `<div class="m-q m-in-${q.input}">${q.fig ? `<div class="m-fig">${q.fig}</div>` : ''}<div class="m-side"><div class="m-txt">${q.txt || ''}</div><div class="m-zone"></div></div></div>`;
    const zone = host.querySelector('.m-zone'), fig = host.querySelector('.m-fig');
    let done = false, buf = '', frac = ['', ''], fi = 0, keyH = null;
    const finish = (given, el) => {
      if (done) return;
      done = true;
      const ok = isRight(q, given);
      paint(ok, given, el);
      if (keyH) document.removeEventListener('keydown', keyH);
      if (opts.onAnswer) opts.onAnswer(ok, given);
    };
    function paint(ok, given, el) {
      host.querySelector('.m-q').classList.add(ok ? 'm-ok' : 'm-ko', 'm-done');
      if (q.input === 'choice') {
        zone.querySelectorAll('.m-ch').forEach((b) => { b.disabled = true; if (Number(b.dataset.i) === Number(q.answer)) b.classList.add('m-good'); });
        if (!ok && el) el.classList.add('m-bad');
      } else if (q.input === 'tap') {
        if (!ok && el) el.classList.add('m-bad');
        host.querySelectorAll('[data-tap]').forEach((t) => { if ([].concat(q.answer).map(String).includes(t.dataset.tap)) t.classList.add('m-good'); });
      } else {
        const disp = zone.querySelector('.m-disp');
        disp.classList.add(ok ? 'm-good' : 'm-bad');
        if (!ok && q.show) disp.insertAdjacentHTML('beforeend', `<span class="m-corr">→ ${q.show}</span>`);
        zone.querySelectorAll('.m-key').forEach((b) => { b.disabled = true; });
      }
    }
    if (q.input === 'choice') {
      zone.innerHTML = `<div class="m-choices${q.options.length > 3 ? ' m-many' : ''}">${q.options.map((o, i) => `<button type="button" class="m-ch" data-i="${i}">${o}</button>`).join('')}</div>`;
      zone.querySelectorAll('.m-ch').forEach((b) => U.tap(b, () => { if (!done) finish(Number(b.dataset.i), b); }));
      if (opts.keyboard) keyH = (e) => { const b = zone.querySelectorAll('.m-ch')[Number(e.key) - 1]; if (/^[1-9]$/.test(e.key) && b) { e.preventDefault(); finish(Number(b.dataset.i), b); } };
    } else if (q.input === 'tap') {
      host.querySelectorAll('[data-tap]').forEach((t) => { t.classList.add('m-tapable'); U.tap(t, () => { if (!done) finish(t.dataset.tap, t); }); });
    } else {
      const isF = q.input === 'frac';
      zone.innerHTML = `<div class="m-disp">${isF ? '<span class="m-fr m-fin"><span class="m-box on"></span><span class="m-box"></span></span>' : '<span class="m-box on"></span>'}${q.unit ? `<span class="m-unit">${q.unit}</span>` : ''}</div>
        <div class="m-pad">${PAD_NUM.map((k) => `<button type="button" class="m-key${k === ',' && !q.dec ? ' m-off' : ''}" data-k="${k}"${k === ',' && !q.dec ? ' disabled' : ''}>${k}</button>`).join('')}
        ${isF ? '<button type="button" class="m-key m-sw" data-k="sw">▲▼</button>' : ''}<button type="button" class="m-key m-okk" data-k="ok">OK</button></div>`;
      const boxes = zone.querySelectorAll('.m-box');
      const draw = () => {
        if (isF) { boxes.forEach((b, i) => { b.textContent = frac[i]; b.classList.toggle('on', i === fi); }); }
        else boxes[0].textContent = buf;
      };
      const press = (k) => {
        if (done) return;
        if (opts.sound) opts.sound.key();
        if (k === 'ok') {
          if (isF) { if (!frac[0]) return; finish([Number(frac[0]), frac[1] === '' ? 1 : Number(frac[1])]); }
          else { if (buf === '' || buf === ',') return; finish(Number(buf.replace(',', '.'))); }
          return;
        }
        if (k === 'sw') { fi = 1 - fi; draw(); return; }
        if (isF) {
          if (k === '⌫') { if (!frac[fi] && fi === 1) fi = 0; else frac[fi] = frac[fi].slice(0, -1); }
          else if (k !== ',' && frac[fi].length < 4) frac[fi] += k;
        } else if (k === '⌫') buf = buf.slice(0, -1);
        else if (k === ',') { if (!buf.includes(',')) buf = (buf || '0') + ','; }
        else if (buf.replace(',', '').length < 6) buf = buf === '0' ? k : buf + k;
        draw();
      };
      zone.querySelectorAll('.m-key').forEach((b) => U.tap(b, () => { if (!b.disabled) press(b.dataset.k); }));
      boxes.forEach((b, i) => U.tap(b, () => { fi = i; draw(); }));
      if (opts.keyboard) keyH = (e) => {
        if (/^[0-9]$/.test(e.key)) press(e.key);
        else if ((e.key === ',' || e.key === '.') && q.dec) press(',');
        else if (e.key === 'Backspace') press('⌫');
        else if (e.key === 'Enter') press('ok');
        else if (isF && (e.key === '/' || e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Tab')) press('sw');
        else return;
        e.preventDefault();
      };
    }
    if (keyH) document.addEventListener('keydown', keyH);
    if (fig) fig.querySelectorAll('svg').forEach((s) => s.setAttribute('preserveAspectRatio', 'xMidYMid meet'));
    return {
      kill() { done = true; if (keyH) document.removeEventListener('keydown', keyH); },
      reveal() { if (!done) { done = true; if (keyH) document.removeEventListener('keydown', keyH); paint(false, null, null); } },
    };
  }

  /* =========================================================
     DUEL 1 contre 1 — tablette coupée en deux (gauche / droite)
     cfg = { jeu, titre, niveauScolaire ('sixième'…), theme (classe CSS), icone, niveaux: [{ id, nom, desc }],
             gen(niveauId, i) → question, cible (10), penalite (ms, 3000), sound, quitter() }
     ========================================================= */
  const KBD = ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN-', 'ÉÈËÏÇ⌫'];
  const smartCase = (s) => s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());

  function duel(cfg) {
    const cible = cfg.cible || 10, pen = cfg.penalite || 3000, Snd = cfg.sound;
    const root = document.createElement('div');
    let face = false; try { face = localStorage.getItem('jeux-duel-face') === '1'; } catch (e) { /* rien */ }
    root.className = `m-duel ${cfg.theme || ''}${face ? ' m-face' : ''}`;
    root.innerHTML = `<div class="m-half m-left"><div class="m-in"></div></div>
      <div class="m-mid"><button type="button" class="m-quit" aria-label="Quitter le duel">✕</button><span class="m-vs">${cfg.icone || '⚔️'} DUEL</span>
        <button type="button" class="m-turn" aria-label="Tourner les deux moitiés">${face ? '⇅' : '⟳'}</button></div>
      <div class="m-half m-right"><div class="m-in"></div></div>`;
    document.body.appendChild(root);
    document.body.classList.add('m-duel-on');
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* pas de plein écran */ }
    const P = [mkPlayer(root.querySelector('.m-left .m-in'), 0), mkPlayer(root.querySelector('.m-right .m-in'), 1)];
    let phase = 'setup', seed = 0, timers = [], over = false;
    const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

    function mkPlayer(el, k) { return { el, k, prenom: '', niveau: null, step: 'nom', ready: false, score: 0, err: 0, i: 0, log: [], q: null, ctrl: null, again: false }; }
    const other = (p) => P[1 - p.k];
    const lvl = (id) => cfg.niveaux.find((n) => n.id === id) || cfg.niveaux[0];

    /* ----- Préparation : prénom puis niveau ----- */
    function setup(p) {
      if (p.step === 'nom') {
        p.el.innerHTML = `<div class="m-set">
          <p class="m-kick">${cfg.titre} · ${cfg.niveauScolaire || ''} · Joueur ${p.k + 1}</p>
          <p class="m-ask">Tape ton prénom</p>
          <div class="m-namebox">${U.esc(p.prenom) || '<i>…</i>'}</div>
          <div class="m-kbd">${KBD.map((r) => `<div>${[...r].map((c) => `<button type="button" class="m-k" data-c="${c}">${c}</button>`).join('')}</div>`).join('')}</div>
          <div class="m-row"><button type="button" class="m-btn m-ghost" data-a="skip">Sans prénom</button><button type="button" class="m-btn m-go" data-a="next">Suivant ▶</button></div></div>`;
        const box = p.el.querySelector('.m-namebox');
        p.el.querySelectorAll('.m-k').forEach((b) => U.tap(b, () => {
          if (Snd) Snd.key();
          const c = b.dataset.c;
          if (c === '⌫') p.prenom = p.prenom.slice(0, -1);
          else if (p.prenom.length < 18) p.prenom = smartCase(p.prenom + c);
          box.innerHTML = U.esc(p.prenom) || '<i>…</i>';
        }));
        U.tap(p.el.querySelector('[data-a="skip"]'), () => { p.prenom = ''; p.step = 'niv'; setup(p); });
        U.tap(p.el.querySelector('[data-a="next"]'), () => { p.prenom = p.prenom.trim(); p.step = 'niv'; setup(p); });
      } else if (p.step === 'niv') {
        p.el.innerHTML = `<div class="m-set">
          <p class="m-kick">${p.prenom ? U.esc(p.prenom) : `Joueur ${p.k + 1}`} · choisis ton niveau</p>
          <div class="m-levels">${cfg.niveaux.map((n) => `<button type="button" class="m-lv${p.niveau === n.id ? ' on' : ''}" data-id="${n.id}"><b>${n.nom}</b><span>${n.desc || ''}</span></button>`).join('')}</div>
          <div class="m-row"><button type="button" class="m-btn m-ghost" data-a="back">◀ Prénom</button></div></div>`;
        p.el.querySelectorAll('.m-lv').forEach((b) => U.tap(b, () => { p.niveau = b.dataset.id; p.ready = true; p.step = 'wait'; setup(p); checkStart(); }));
        U.tap(p.el.querySelector('[data-a="back"]'), () => { p.step = 'nom'; setup(p); });
      } else {
        p.el.innerHTML = `<div class="m-set m-wait">
          <p class="m-ask">${p.prenom ? U.esc(p.prenom) : `Joueur ${p.k + 1}`} : prêt !</p>
          <p class="m-dim">${lvl(p.niveau).nom}</p>
          <p class="m-dim m-pulse">En attente de l’adversaire…</p>
          <div class="m-row"><button type="button" class="m-btn m-ghost" data-a="back">Changer de niveau</button></div></div>`;
        U.tap(p.el.querySelector('[data-a="back"]'), () => { p.ready = false; p.step = 'niv'; setup(p); });
      }
    }
    function checkStart() {
      if (!P.every((p) => p.ready) || phase !== 'setup') return;
      phase = 'count';
      seed = Math.floor(Math.random() * 1e9);
      over = false;
      P.forEach((p) => { p.score = 0; p.err = 0; p.i = 0; p.log = []; p.again = false; });
      let n = 3;
      const tick = () => {
        P.forEach((p) => { p.el.innerHTML = `<div class="m-count">${n || 'GO !'}</div>`; });
        if (Snd) { if (n) Snd.tone(520, 0.12, 'square', 0.05); else Snd.tone(1040, 0.3, 'square', 0.06); }
        if (n === 0) { later(() => { phase = 'play'; P.forEach(play); }, 500); return; }
        n--; later(tick, 750);
      };
      tick();
    }

    /* ----- Le match ----- */
    function play(p) {
      p.el.innerHTML = `<div class="m-play">
        <div class="m-hud"><span class="m-me">${p.prenom ? U.esc(p.prenom) : `Joueur ${p.k + 1}`}</span>
          <div class="m-track"><i></i><b>${cfg.icone || '🏁'}</b></div><span class="m-sc"></span></div>
        <div class="m-opp"><span>${other(p).prenom ? U.esc(other(p).prenom) : 'Adversaire'}</span><div class="m-track m-small"><i></i></div></div>
        <div class="m-qhost"></div><div class="m-lock"></div></div>`;
      hud();
      nextQ(p);
    }
    function hud() {
      P.forEach((p) => {
        const me = p.el.querySelector('.m-hud .m-track i'), op = p.el.querySelector('.m-opp .m-track i'), sc = p.el.querySelector('.m-sc'), ic = p.el.querySelector('.m-hud .m-track b');
        if (!me) return;
        const pc = Math.min(100, (p.score / cible) * 100);
        me.style.width = pc + '%'; ic.style.left = `calc(${pc}% - ${pc / 100 * 1.6}em)`;
        op.style.width = Math.min(100, (other(p).score / cible) * 100) + '%';
        sc.textContent = `${p.score} / ${cible}`;
      });
    }
    function nextQ(p) {
      if (over) return;
      const nivIdx = cfg.niveaux.findIndex((n) => n.id === p.niveau);
      const q = U.withSeed(seed + p.i * 7919 + nivIdx * 1000003, () => cfg.gen(p.niveau, p.i));
      p.q = q; p.i++;
      const host = p.el.querySelector('.m-qhost'), lock = p.el.querySelector('.m-lock');
      lock.className = 'm-lock'; lock.innerHTML = '';
      p.ctrl = question(host, q, { sound: Snd, onAnswer: (ok, given) => answered(p, q, ok, given) });
    }
    function answered(p, q, ok, given) {
      if (over) return;
      p.log.push({ type: q.type, ok, q });
      if (ok) {
        p.score++;
        if (Snd) Snd.good(p.score);
        hud();
        if (p.score >= cible) { finish(p); return; }
        later(() => nextQ(p), 550);
      } else {
        p.err++;
        if (Snd) Snd.bad();
        const lock = p.el.querySelector('.m-lock');
        lock.className = 'm-lock on';
        lock.innerHTML = `<div class="m-why"><b>${q.show ? `Réponse : ${q.show}` : 'Raté !'}</b>${q.why ? `<span>${q.why}</span>` : ''}</div><div class="m-bar"><i style="animation-duration:${pen}ms"></i></div>`;
        later(() => nextQ(p), pen);
      }
    }
    function finish(w) {
      over = true; phase = 'end';
      timers.forEach(clearTimeout); timers = [];
      P.forEach((p) => { if (p.ctrl) p.ctrl.kill(); });
      if (Snd) Snd.win();
      U.confetti(70, undefined, w.el);
      saveDuel(w);
      P.forEach((p) => endScreen(p, p === w));
    }
    function endScreen(p, won) {
      const o = other(p), miss = p.log.filter((l) => !l.ok);
      p.el.innerHTML = `<div class="m-end${won ? ' m-won' : ''}">
        <p class="m-big">${won ? '🏆 Gagné !' : p.score >= cible - 2 ? 'Perdu… de très peu !' : 'Perdu… revanche ?'}</p>
        <p class="m-dim">${p.prenom ? U.esc(p.prenom) : `Joueur ${p.k + 1}`} : <b>${p.score}</b> · ${o.prenom ? U.esc(o.prenom) : 'adversaire'} : <b>${o.score}</b> · ${p.err} erreur${p.err > 1 ? 's' : ''}</p>
        <div class="m-miss">${miss.length ? `<p class="m-kick">Tes erreurs, avec la correction</p>${miss.map((l) => `<div class="m-mi">${l.q.fig ? `<div class="m-mfig">${l.q.fig}</div>` : ''}<div><div>${l.q.txt}</div><b>${l.q.show || ''}</b>${l.q.why ? `<small>${l.q.why}</small>` : ''}</div></div>`).join('')}` : '<p class="m-kick">Aucune erreur, bravo !</p>'}</div>
        <div class="m-row"><button type="button" class="m-btn m-go" data-a="again">${p.again ? '✔ Prêt' : '↻ Revanche'}</button><button type="button" class="m-btn m-ghost" data-a="lvl">Changer de niveau</button></div></div>`;
      U.tap(p.el.querySelector('[data-a="again"]'), () => {
        p.again = !p.again;
        p.el.querySelector('[data-a="again"]').textContent = p.again ? '✔ Prêt' : '↻ Revanche';
        if (P.every((x) => x.again)) { phase = 'setup'; P.forEach((x) => { x.ready = true; }); checkStart(); }
      });
      U.tap(p.el.querySelector('[data-a="lvl"]'), () => {
        phase = 'setup';
        P.forEach((x) => { x.ready = false; x.again = false; x.step = x === p ? 'niv' : x.step === 'nom' ? 'nom' : 'niv'; setup(x); });
      });
    }
    function saveDuel(w) {
      try {
        const all = JSON.parse(localStorage.getItem('jeux-duels') || '[]');
        all.push({ jeu: cfg.jeu, date: new Date().toISOString(), joueurs: P.map((p) => ({
          prenom: p.prenom, niveau: p.niveau, justes: p.score, erreurs: p.err, gagne: p === w,
          types: p.log.reduce((m, l) => { const t = m[l.type] || (m[l.type] = [0, 0]); t[l.ok ? 0 : 1]++; return m; }, {}),
        })) });
        localStorage.setItem('jeux-duels', JSON.stringify(all.slice(-300)));
      } catch (e) { /* stockage indisponible */ }
    }
    function close() {
      timers.forEach(clearTimeout); over = true;
      P.forEach((p) => { if (p.ctrl) p.ctrl.kill(); });
      root.remove(); document.body.classList.remove('m-duel-on');
      try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* rien */ }
      if (cfg.quitter) cfg.quitter();
    }
    // côte à côte (les deux joueurs du même côté) ou face à face (chaque moitié tournée vers son joueur)
    U.tap(root.querySelector('.m-turn'), () => {
      face = !face; root.classList.toggle('m-face', face);
      root.querySelector('.m-turn').textContent = face ? '⇅' : '⟳';
      try { localStorage.setItem('jeux-duel-face', face ? '1' : '0'); } catch (e) { /* rien */ }
    });
    U.tap(root.querySelector('.m-quit'), () => { if (phase !== 'play' || confirm('Arrêter le duel ?')) close(); });
    P.forEach(setup);
    return { close };
  }

  /* =========================================================
     Pavé numérique réutilisable (nombre ou fraction)
     o = { unit, dec, frac, ok ('OK'), onSubmit(v), sound }  →  { clear(), enable(bool), el }
     v = nombre, ou [num, den] pour une fraction
     ========================================================= */
  function pad(host, o = {}) {
    const isF = !!o.frac;
    host.innerHTML = `<div class="m-padbox${isF ? ' m-in-frac' : ''}"><div class="m-disp">${isF ? '<span class="m-fr m-fin"><span class="m-box on"></span><span class="m-box"></span></span>' : '<span class="m-box on"></span>'}${o.unit ? `<span class="m-unit">${o.unit}</span>` : ''}</div>
      <div class="m-pad">${PAD_NUM.map((k) => `<button type="button" class="m-key${k === ',' && !o.dec ? ' m-off' : ''}" data-k="${k}"${k === ',' && !o.dec ? ' disabled' : ''}>${k}</button>`).join('')}
      ${isF ? '<button type="button" class="m-key m-sw" data-k="sw">▲▼</button>' : ''}<button type="button" class="m-key m-okk" data-k="ok">${o.ok || 'OK'}</button></div></div>`;
    const box = host.querySelector('.m-padbox'), boxes = host.querySelectorAll('.m-box');
    let buf = '', fr = ['', ''], fi = 0, on = true;
    const draw = () => { if (isF) boxes.forEach((b, i) => { b.textContent = fr[i]; b.classList.toggle('on', i === fi); }); else boxes[0].textContent = buf; };
    const press = (k) => {
      if (!on) return;
      if (o.sound) o.sound.key();
      if (k === 'ok') {
        if (isF) { if (!fr[0]) return; o.onSubmit([Number(fr[0]), fr[1] === '' ? 1 : Number(fr[1])]); }
        else { if (buf === '' || buf === ',') return; o.onSubmit(Number(buf.replace(',', '.'))); }
        return;
      }
      if (k === 'sw') { fi = 1 - fi; draw(); return; }
      if (isF) { if (k === '⌫') { if (!fr[fi] && fi === 1) fi = 0; else fr[fi] = fr[fi].slice(0, -1); } else if (k !== ',' && fr[fi].length < 3) fr[fi] += k; }
      else if (k === '⌫') buf = buf.slice(0, -1);
      else if (k === ',') { if (!buf.includes(',')) buf = (buf || '0') + ','; }
      else if (buf.replace(',', '').length < 5) buf = buf === '0' ? k : buf + k;
      draw();
    };
    host.querySelectorAll('.m-key').forEach((b) => U.tap(b, () => { if (!b.disabled) press(b.dataset.k); }));
    boxes.forEach((b, i) => U.tap(b, () => { fi = i; draw(); }));
    let keyH = null;
    if (o.keyboard) {
      keyH = (e) => {
        if (!document.body.contains(box)) { document.removeEventListener('keydown', keyH); return; }
        if (/^[0-9]$/.test(e.key)) press(e.key); else if ((e.key === ',' || e.key === '.') && o.dec) press(',');
        else if (e.key === 'Backspace') press('⌫'); else if (e.key === 'Enter') press('ok');
        else if (isF && (e.key === '/' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) press('sw'); else return;
        e.preventDefault();
      };
      document.addEventListener('keydown', keyH);
    }
    return {
      el: box,
      clear() { buf = ''; fr = ['', '']; fi = 0; draw(); },
      enable(b) { on = !!b; box.classList.toggle('m-padoff', !on); },
      kill() { on = false; if (keyH) document.removeEventListener('keydown', keyH); },
    };
  }

  /* =========================================================
     ÉCRAN COUPÉ + MATCH AU TOUR PAR TOUR (plateau partagé)
     cfg = { jeu, titre, niveauScolaire, theme, icone, sound,
             niveaux: [{ id, nom, desc }]  (chaque joueur choisit le sien, facultatif)
             modes:   [{ id, nom, desc }]  (un choix commun pour la partie, facultatif)
             start(ctx), quitter() }
     ctx = { P: [{ k, prenom, nom, niveau, el }], mode, turn(k), end({ winner, text: [html, html] }), later(fn, ms), sound }
     Joueur 0 = moitié gauche, joueur 1 = moitié droite. ctx.turn(k) éclaire la moitié du joueur k.
     ========================================================= */
  function split(cfg) {
    const root = document.createElement('div');
    let face = false; try { face = localStorage.getItem('jeux-duel-face') === '1'; } catch (e) { /* rien */ }
    root.className = `m-duel ${cfg.theme || ''}${face ? ' m-face' : ''}`;
    root.innerHTML = `<div class="m-half m-left"><div class="m-in"></div></div>
      <div class="m-mid"><button type="button" class="m-quit" aria-label="Quitter le duel">✕</button><span class="m-vs">${cfg.icone || '⚔️'} DUEL</span><span class="m-arrow"></span>
        <button type="button" class="m-turn" aria-label="Tourner les deux moitiés">${face ? '⇅' : '⟳'}</button></div>
      <div class="m-half m-right"><div class="m-in"></div></div>`;
    document.body.appendChild(root);
    document.body.classList.add('m-duel-on');
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); } catch (e) { /* rien */ }
    U.tap(root.querySelector('.m-turn'), () => {
      face = !face; root.classList.toggle('m-face', face);
      root.querySelector('.m-turn').textContent = face ? '⇅' : '⟳';
      try { localStorage.setItem('jeux-duel-face', face ? '1' : '0'); } catch (e) { /* rien */ }
    });
    const halves = [root.querySelector('.m-left .m-in'), root.querySelector('.m-right .m-in')];
    return {
      root, halves,
      arrow(k) { root.querySelector('.m-arrow').textContent = k === 0 ? '◀' : k === 1 ? '▶' : ''; root.querySelectorAll('.m-half').forEach((h, i) => { h.classList.toggle('m-active', i === k); h.classList.toggle('m-waiting', k !== null && k !== undefined && i !== k); }); },
      close() { root.remove(); document.body.classList.remove('m-duel-on'); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* rien */ } },
    };
  }
  /** clavier à l'écran dans el (prénom, ou classe) ; cb(texte) */
  function askName(el, titre, k, cb, Snd, o = {}) {
    let prenom = o.value || '';
    el.innerHTML = `<div class="m-set"><p class="m-kick">${titre} · Joueur ${k + 1}</p><p class="m-ask">${o.ask || 'Tape ton prénom'}</p><div class="m-namebox">${U.esc(prenom) || '<i>…</i>'}</div>
      <div class="m-kbd">${(o.digits ? ['123456789', ...KBD] : KBD).map((r) => `<div>${[...r].map((c) => `<button type="button" class="m-k" data-c="${c}">${c}</button>`).join('')}</div>`).join('')}</div>
      <div class="m-row">${o.noSkip ? '' : `<button type="button" class="m-btn m-ghost" data-a="skip">${o.skip || 'Sans prénom'}</button>`}<button type="button" class="m-btn m-go" data-a="next">Suivant ▶</button></div></div>`;
    const box = el.querySelector('.m-namebox');
    el.querySelectorAll('.m-k').forEach((b) => U.tap(b, () => {
      if (Snd) Snd.key();
      const c = b.dataset.c;
      if (c === '⌫') prenom = prenom.slice(0, -1); else if (prenom.length < 18) prenom = o.raw ? prenom + c : smartCase(prenom + c);
      box.innerHTML = U.esc(prenom) || '<i>…</i>';
    }));
    const sk = el.querySelector('[data-a="skip"]'); if (sk) U.tap(sk, () => cb(''));
    U.tap(el.querySelector('[data-a="next"]'), () => { if (o.noSkip && !prenom.trim()) return; cb(prenom.trim()); });
  }

  /* =========================================================
     ENVOI DES RÉSULTATS au Grist du professeur (le même formulaire que les devoirs en ligne)
     Une ligne par joueur et par duel : Prénom, Code « JEU-… », Classe, Devoir « 🎮 Jeu — partie (duel) », Score, Détail (JSON).
     Le widget « Mes devoirs » et le bilan de l'Espace prof ignorent ces lignes (code non reconnu).
     Les lignes attendent dans une file sur la tablette (clé « jeux-envois ») et partent dès que le réseau le permet.
     Pour couper l'envoi (tests) : window.JEUX_ENVOI = false.
     ========================================================= */
  const GRIST = { a: 'https://grist.numerique.gouv.fr/o/docs', k: '1CSVewczBDMwLGG3cFYgyA', t: 'Table1', c: ['Prenom', 'Code', 'Classe', 'Devoir', 'Score', 'Detail'] };
  const QKEY = 'jeux-envois';
  const queue = () => { try { return JSON.parse(localStorage.getItem(QKEY) || '[]'); } catch (e) { return []; } };
  const setQueue = (q) => { try { localStorage.setItem(QKEY, JSON.stringify(q.slice(-500))); } catch (e) { /* stockage indisponible */ } };
  let flushing = null;
  function flush() {
    if (window.JEUX_ENVOI === false) return Promise.resolve(queue().length);
    if (flushing) return flushing;
    flushing = (async () => {
      try {
        for (;;) {
          const q = queue();
          if (!q.length) break;
          const fields = {};
          GRIST.c.forEach((c, i) => { fields[c] = q[0][i] ?? ''; });
          const r = await fetch(`${GRIST.a}/api/s/${GRIST.k}/tables/${encodeURIComponent(GRIST.t)}/records`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records: [{ fields }] }),
          });
          if (!r.ok) break;
          const q2 = queue(); q2.shift(); setQueue(q2);
        }
      } catch (e) { /* pas de réseau : on réessaiera */ }
      flushing = null;
      return queue().length;
    })();
    return flushing;
  }
  /** rows = [[Prénom, Code, Classe, Devoir, Score, Détail], …] ; renvoie une promesse du nombre de lignes encore en attente */
  function sendRows(rows) { if (rows.length) setQueue([...queue(), ...rows]); return flush(); }
  window.addEventListener('online', () => flush());
  setInterval(() => { if (queue().length) flush(); }, 60000);
  setTimeout(() => { if (queue().length) flush(); }, 3000);
  const lastClasse = () => { try { return localStorage.getItem('jeux-classe') || ''; } catch (e) { return ''; } };

  function saveDuel(rec) {
    try {
      const all = JSON.parse(localStorage.getItem('jeux-duels') || '[]');
      all.push({ date: new Date().toISOString(), ...rec });
      localStorage.setItem('jeux-duels', JSON.stringify(all.slice(-300)));
    } catch (e) { /* stockage indisponible */ }
  }
  function match(cfg) {
    const Snd = cfg.sound, sp = split(cfg);
    const P = sp.halves.map((el, k) => ({ k, el, prenom: '', classe: '', nom: `Joueur ${k + 1}`, niveau: null, step: 'nom', again: false }));
    let mode = null, timers = [], phase = 'setup', ended = false;
    const later = (fn, ms) => { const t = setTimeout(() => { if (!ended) fn(); }, ms); timers.push(t); return t; };
    const clearT = () => { timers.forEach(clearTimeout); timers = []; };
    function setup(p) {
      const afterName = () => (cfg.niveaux ? 'niv' : 'wait');
      /* suivi des élèves : chaque joueur peut taper le code de sa carte ; ses réponses vont alors sur son compte */
      if (p.step === 'nom' && window.Suivi && !p.sansCode) {
        askName(p.el, `${cfg.titre} · ${cfg.niveauScolaire || ''}`, p.k, (c) => {
          c = c.replace(/[^A-Z0-9]/g, '');
          if (!c) { p.sansCode = true; setup(p); return; }
          p.el.querySelector('.m-ask').textContent = 'Vérification…';
          Suivi.joueur(c).then((j) => {
            p.joueur = j; p.prenom = j.me.prenom; p.nom = j.me.prenom; p.classe = j.me.classe;
            p.step = afterName(); setup(p); check();
          }).catch((e) => { const a = p.el.querySelector('.m-ask'); if (a) a.textContent = e.message + ' Retape ton code, ou joue sans code.'; });
        }, Snd, { ask: 'Tape le code de ta carte', skip: 'Sans code', digits: true, raw: true });
        return;
      }
      if (p.step === 'nom') { askName(p.el, `${cfg.titre} · ${cfg.niveauScolaire || ''}`, p.k, (n) => { p.prenom = n; p.nom = n || `Joueur ${p.k + 1}`; p.step = n ? 'classe' : afterName(); setup(p); check(); }, Snd); return; }
      if (p.step === 'classe') {
        // la classe sert à ranger le résultat dans Grist ; la liste vient de jeux-classes.js (propre à chaque site)
        const list = window.JEUX_CLASSES || [], last = lastClasse();
        const done = (c) => { p.classe = c; try { localStorage.setItem('jeux-classe', c); } catch (e) { /* rien */ } p.step = afterName(); setup(p); check(); };
        if (!list.length || p.typeClasse) { askName(p.el, U.esc(p.nom), p.k, (c) => done(c), Snd, { ask: 'Tape ta classe', noSkip: true, digits: true, raw: true, value: p.typeClasse ? '' : last }); return; }
        p.el.innerHTML = `<div class="m-set"><p class="m-kick">${U.esc(p.nom)}</p><p class="m-ask">Ta classe ?</p>
          <div class="m-levels">${list.map((c) => `<button type="button" class="m-lv${c === last ? ' on' : ''}" data-c="${U.esc(c)}"><b>${U.esc(c)}</b></button>`).join('')}</div>
          <div class="m-row"><button type="button" class="m-btn m-ghost" data-a="other">Autre classe…</button></div></div>`;
        p.el.querySelectorAll('.m-lv').forEach((b) => U.tap(b, () => done(b.dataset.c)));
        U.tap(p.el.querySelector('[data-a="other"]'), () => { p.typeClasse = true; setup(p); });
        return;
      }
      if (p.step === 'niv') {
        p.el.innerHTML = `<div class="m-set"><p class="m-kick">${U.esc(p.nom)} · choisis ton niveau</p>
          <div class="m-levels">${cfg.niveaux.map((n) => `<button type="button" class="m-lv" data-id="${n.id}"><b>${n.nom}</b><span>${n.desc || ''}</span></button>`).join('')}</div></div>`;
        p.el.querySelectorAll('.m-lv').forEach((b) => U.tap(b, () => { p.niveau = b.dataset.id; p.step = 'wait'; setup(p); check(); }));
        return;
      }
      if (p.step === 'mode') {
        p.el.innerHTML = `<div class="m-set"><p class="m-kick">Choisissez ensemble la partie</p>
          <div class="m-levels">${cfg.modes.map((n) => `<button type="button" class="m-lv" data-id="${n.id}"><b>${n.nom}</b><span>${n.desc || ''}</span></button>`).join('')}</div></div>`;
        p.el.querySelectorAll('.m-lv').forEach((b) => U.tap(b, () => { mode = b.dataset.id; go(); }));
        return;
      }
      p.el.innerHTML = `<div class="m-set m-wait"><p class="m-ask">${U.esc(p.nom)} : prêt !</p>${p.niveau ? `<p class="m-dim">${(cfg.niveaux.find((n) => n.id === p.niveau) || {}).nom || ''}</p>` : ''}<p class="m-dim m-pulse">En attente de l’adversaire…</p></div>`;
    }
    function check() {
      if (!P.every((p) => p.step === 'wait')) return;
      if (cfg.modes && !mode) { P.forEach((p) => { p.step = 'mode'; setup(p); }); return; }
      go();
    }
    function go() {
      phase = 'play'; ended = false; clearT();
      P.forEach((p) => { p.step = 'wait'; p.again = false; });
      cfg.start(ctx);
    }
    const ctx = {
      P, get mode() { return mode; }, sound: Snd, later,
      turn(k) { sp.arrow(k); },
      /** une décision du joueur k (ou p), jugée par le jeu : envoyée sur son compte s'il a tapé son code */
      trace(k, ev) {
        const p = typeof k === 'number' ? P[k] : k;
        if (!p || !p.joueur || !window.Suivi) return;
        try { Suivi.logPour(p.joueur, Object.assign({ src: 'duel' }, ev, { extra: Object.assign({ jeu: cfg.jeu, mode, niveau: p.niveau, adversaire: P[1 - p.k].prenom || '' }, ev.extra || {}) })); } catch (e) { /* rien */ }
      },
      end(r) {
        ended = true; clearT(); phase = 'end'; sp.arrow(null);
        if (Snd) Snd.win();
        if (r.winner !== null && r.winner !== undefined) U.confetti(70, undefined, P[r.winner].el);
        saveDuel({ jeu: cfg.jeu, mode, joueurs: P.map((p) => ({ prenom: p.prenom, classe: p.classe, niveau: p.niveau, gagne: p.k === r.winner, ...(r.stats ? r.stats[p.k] : {}) })) });
        const draw0 = r.winner === null || r.winner === undefined, t = Date.now();
        P.forEach((p) => ctx.trace(p, { ch: cfg.ch || null, comp: `${cfg.jeu}:partie`, ok: draw0 ? null : p.k === r.winner,
          extra: { resultat: draw0 ? 'égalité' : p.k === r.winner ? 'gagné' : 'perdu', score: r.score ? r.score[p.k] : null, ...(r.stats ? r.stats[p.k] : {}) } }));
        const modeNom = mode && cfg.modes ? (cfg.modes.find((m) => m.id === mode) || {}).nom : '';
        const lvNom = (p) => (p.niveau && cfg.niveaux ? (cfg.niveaux.find((n) => n.id === p.niveau) || {}).nom : '');
        const rows = P.filter((p) => p.prenom).map((p) => {
          const o = P[1 - p.k], res = draw0 ? 'égalité' : p.k === r.winner ? 'gagné' : 'perdu';
          return [p.prenom, `JEU-${t.toString(36).toUpperCase()}-${p.k + 1}`, p.classe || '', `🎮 ${cfg.titre}${modeNom ? ` — ${modeNom}` : ''} (duel)`,
            r.score ? r.score[p.k] : res,
            JSON.stringify({ jeu: cfg.jeu, mode, niveau: p.niveau, niveauNom: lvNom(p), resultat: res, adversaire: o.prenom || '', classeAdv: o.classe || '', ...(r.stats ? r.stats[p.k] : {}), t })];
        });
        const status = (txt) => P.forEach((p) => { const e = p.el.querySelector('.m-sent'); if (e && p.prenom) e.textContent = txt; });
        if (rows.length) sendRows(rows).then((left) => status(window.JEUX_ENVOI === false ? '(envoi coupé)' : left ? '⏳ Pas de connexion : le résultat partira tout seul plus tard.' : '📤 Résultat envoyé à ton professeur.'));
        P.forEach((p) => {
          const won = p.k === r.winner, draw = r.winner === null || r.winner === undefined;
          p.el.innerHTML = `<div class="m-end${won ? ' m-won' : ''}"><p class="m-big">${draw ? 'Égalité !' : won ? '🏆 Gagné !' : 'Perdu… revanche ?'}</p>
            <div class="m-miss">${r.text ? r.text[p.k] : ''}</div><p class="m-dim m-sent">${p.prenom ? '📤 Envoi du résultat…' : 'Sans prénom : ce duel n’est pas envoyé au professeur.'}</p>
            <div class="m-row"><button type="button" class="m-btn m-go" data-a="again">↻ Revanche</button>${cfg.niveaux || cfg.modes ? '<button type="button" class="m-btn m-ghost" data-a="lvl">Changer les réglages</button>' : ''}</div></div>`;
          const ag = p.el.querySelector('[data-a="again"]');
          U.tap(ag, () => { p.again = !p.again; ag.textContent = p.again ? '✔ Prêt' : '↻ Revanche'; if (P.every((x) => x.again)) go(); });
          const lv = p.el.querySelector('[data-a="lvl"]');
          if (lv) U.tap(lv, () => { mode = null; P.forEach((x) => { x.step = cfg.niveaux ? 'niv' : 'wait'; setup(x); }); if (!cfg.niveaux) check(); });
        });
      },
    };
    U.tap(sp.root.querySelector('.m-quit'), () => {
      if (phase === 'play' && !confirm('Arrêter le duel ?')) return;
      ended = true; clearT(); sp.close();
      if (window.Suivi) P.forEach((p) => { if (p.joueur) { Suivi.finJoueur(p.joueur); p.joueur = null; } });
      if (cfg.quitter) cfg.quitter();
    });
    P.forEach(setup);
    return ctx;
  }

  /** une décision du joueur en partie SOLO, jugée par le jeu : envoyée sur le compte de l'élève connecté.
      ev = { jeu, ch, comp, ok, rep, att, err, aide, ms, extra } (comp : « jeu:sorte de décision ») */
  function trace(ev) {
    if (!window.Suivi || !Suivi.connecte() || !ev) return;
    try { Suivi.log(Object.assign({ src: 'jeu' }, ev, { extra: Object.assign({ jeu: ev.jeu }, ev.extra || {}) })); } catch (e) { /* rien */ }
  }

  window.Moteur = { U, question, duel, makeSound, isRight, pad, split, match, askName, saveDuel, sendRows, flushEnvois: flush, enAttente: () => queue().length, trace };
})();
