/* =========================================================
   LA BATAILLE NAVALE DES ANGLES · sixième — jeu du chapitre « Les angles » de 6e (nommer un angle)
   La mer est faite d'« îles » : des points d'où partent des demi-droites. Chaque angle entre deux
   demi-droites voisines est une case. Des bateaux (de 1 à 3 cases voisines autour d'un même sommet)
   sont cachés. Pour tirer, il faut NOMMER l'angle visé avec trois lettres : le sommet au milieu, un point
   de chaque côté. Un nom mal formé (sommet pas au milieu, deux points du même côté, angle qui contient une
   autre demi-droite…) fait perdre le tir, avec l'explication.
   Personne n'a jamais de secret à l'écran : le jeu place lui-même les flottes, chaque moitié de la tablette
   ne montre que ses propres tirs. Regarder l'écran de l'autre ne sert donc à rien.
   Duel (tour par tour, moteur commun) : chacun cherche la flotte de l'autre sur la même mer.
   Adresse avec ?tout : toutes les missions sont ouvertes (pour le professeur).
   ========================================================= */
(function () {
  'use strict';
  const { U } = window.Moteur;
  const { rand, pick, shuffle } = U;
  const app = document.getElementById('app');
  const S = U.store('u6e-bataille-angles');
  S.d.stars = S.d.stars || {}; S.d.best = S.d.best || {};
  const ALL_OPEN = /[?&]tout\b/.test(location.search);
  const Snd = window.Moteur.makeSound(() => !!S.d.mute);
  Snd.splash = function () { this.noise(0.35, 0.18, 900); };
  Snd.boom = function () { this.noise(0.45, 0.35, 500); this.tone(110, 0.3, 'sawtooth', 0.06, 50); };
  Snd.sink = function () { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.25, 'square', 0.05, 0, i * 0.12)); };
  const muteBtn = document.getElementById('mute');
  const syncMute = () => { muteBtn.textContent = S.d.mute ? '🔇' : '🔊'; };
  muteBtn.addEventListener('click', () => { S.d.mute = !S.d.mute; S.save(); syncMute(); Snd.init(); });
  syncMute();

  /* =========================================================
     La mer : des îles (sommets) et leurs demi-droites
     sea = { islands: [{ C, V (lettre du sommet), rays: [{ d, pts: [lettres] }] }], cases: [{ is, r (demi-droite de départ), v (mesure) }] }
     ========================================================= */
  const W = 460, H = 320, LEN = 66;
  const norm = (a) => ((a % 360) + 360) % 360;
  const ccw = (a, b) => norm(b - a);
  const P = (C, a, L) => ({ x: C.x + L * Math.cos((a * Math.PI) / 180), y: C.y - L * Math.sin((a * Math.PI) / 180) });
  const f = (n) => n.toFixed(1);
  const LET = 'ABCDEFGHIJKLMNPRSTUVWXYZ';
  function makeSea(o) {
    const centers = o.islands === 2 ? [{ x: 130, y: 160 }, { x: 330, y: 160 }] : [{ x: 100, y: 102 }, { x: 360, y: 102 }, { x: 230, y: 222 }];
    const letters = shuffle([...LET]);
    const take = () => letters.pop();
    const islands = centers.map((C) => {
      let dirs;
      for (;;) {
        const n = rand(o.rays[0], o.rays[1]); dirs = [];
        for (let t = 0; t < 200 && dirs.length < n; t++) { const d = rand(0, 359); if (dirs.every((x) => Math.min(ccw(x, d), ccw(d, x)) >= 30)) dirs.push(d); }
        dirs.sort((a, b) => a - b);
        // pas d'angle plat ni rentrant, pas de demi-droites exactement opposées
        const ok = dirs.length === n && dirs.every((d, i) => ccw(d, dirs[(i + 1) % n]) < 170) && !dirs.some((d) => dirs.some((e) => Math.abs(ccw(d, e) - 180) < 4));
        if (ok) break;
      }
      return { C, V: take(), rays: dirs.map((d) => ({ d, pts: [take()] })) };
    });
    // un deuxième point sur certaines demi-droites (un angle a alors plusieurs noms)
    if (o.double) islands.forEach((is) => shuffle([...is.rays]).slice(0, o.double).forEach((r) => { const l = letters.pop(); if (l) r.pts.push(l); }));
    const cases = [];
    islands.forEach((is, k) => is.rays.forEach((r, i) => cases.push({ is: k, r: i, v: ccw(r.d, is.rays[(i + 1) % is.rays.length].d) })));
    return { islands, cases };
  }
  /** une flotte au hasard : bateaux de cases voisines autour d'un même sommet */
  function makeFleet(sea, sizes) {
    for (let t = 0; t < 500; t++) {
      const used = new Set(), ships = [];
      let ok = true;
      for (const L of sizes) {
        let placed = false;
        for (let u = 0; u < 60 && !placed; u++) {
          const k = rand(0, sea.islands.length - 1), n = sea.islands[k].rays.length;
          if (L > n - 1) continue;
          const s = rand(0, n - 1), cells = [];
          for (let j = 0; j < L; j++) cells.push(sea.cases.findIndex((c) => c.is === k && c.r === (s + j) % n));
          if (cells.some((c) => used.has(c))) continue;
          cells.forEach((c) => used.add(c)); ships.push({ cells, hits: new Set() }); placed = true;
        }
        if (!placed) { ok = false; break; }
      }
      if (ok) return ships;
    }
    return null;
  }

  /* ---------- Lire un nom d'angle ---------- */
  const ang = (s) => `<span class="m-ang">${s}</span>`;
  /** renvoie { ok, cell } ou { ok: false, why } */
  function readName(sea, name) {
    const [X, V, Y] = [...name];
    const isV = sea.islands.findIndex((is) => is.V === V);
    if (isV < 0) {
      const asV = sea.islands.find((is) => is.V === X || is.V === Y);
      return { ok: false, why: asV ? `Le <b>sommet</b> d’un angle s’écrit <b>au milieu</b> : ici le sommet est ${asV.V}, il faut écrire ${ang(`?${asV.V}?`)}.` : `${V} n’est pas un sommet : le nom d’un angle a le <b>sommet au milieu</b>.` };
    }
    const is = sea.islands[isV], rayOf = (L) => is.rays.findIndex((r) => r.pts.includes(L));
    const rx = rayOf(X), ry = rayOf(Y);
    if (rx < 0 || ry < 0) { const bad = rx < 0 ? X : Y; return { ok: false, why: `${bad} n’est sur aucune demi-droite qui part de ${V} : il faut un point sur <b>chaque côté</b> de l’angle.` }; }
    if (rx === ry) return { ok: false, why: `${X} et ${Y} sont sur la <b>même</b> demi-droite [${V}${X}) : ${ang(name)} n’est pas un angle de la mer (ses deux côtés sont confondus).` };
    const n = is.rays.length, a = Math.min(rx, ry), b = Math.max(rx, ry);
    // l'angle nommé est le plus petit des deux secteurs ; il est une case seulement si les deux demi-droites sont voisines
    const fwd = ccw(is.rays[rx].d, is.rays[ry].d), start = fwd < 180 ? rx : ry, inner = fwd < 180 ? (ry - rx + n) % n : (rx - ry + n) % n;
    if (inner !== 1) {
      const mid = is.rays[(start + 1) % n];
      return { ok: false, why: `${ang(name)} contient la demi-droite [${V}${mid.pts[0]}) : ce n’est pas <b>une</b> case. Vise un angle sans demi-droite à l’intérieur.` };
    }
    void a; void b;
    return { ok: true, cell: sea.cases.findIndex((c) => c.is === isV && c.r === start) };
  }
  /** tous les noms possibles d'une case (pour la correction) */
  function namesOf(sea, i) {
    const c = sea.cases[i], is = sea.islands[c.is], r1 = is.rays[c.r], r2 = is.rays[(c.r + 1) % is.rays.length], out = [];
    r1.pts.forEach((x) => r2.pts.forEach((y) => { out.push(x + is.V + y, y + is.V + x); }));
    return out;
  }

  /* ---------- Dessin ---------- */
  function wedge(C, a1, v, r, cls, attr = '') {
    const p = P(C, a1, r), q = P(C, a1 + v, r);
    return `<path d="M${f(C.x)} ${f(C.y)} L${f(p.x)} ${f(p.y)} A${r} ${r} 0 0 0 ${f(q.x)} ${f(q.y)} Z" class="${cls}" ${attr}/>`;
  }
  /** shots : Map(case → 'hit'|'miss'), sunk : Set(cases coulées), reveal : liste des bateaux à montrer */
  function seaSVG(sea, shots, sunk, reveal) {
    let h = `<svg viewBox="0 0 ${W} ${H}" class="sfig" role="img" aria-label="La mer et ses îles">`;
    h += `<defs><pattern id="waves" width="40" height="16" patternUnits="userSpaceOnUse"><path d="M0 8 Q10 2 20 8 T40 8" class="wave"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#waves)"/>`;
    sea.cases.forEach((c, i) => {
      const is = sea.islands[c.is], a1 = is.rays[c.r].d, st = shots.get(i);
      const cls = sunk.has(i) ? 'sunk' : st === 'hit' ? 'hit' : st === 'miss' ? 'miss' : (reveal && reveal.has(i)) ? 'shown' : 'free';
      h += wedge(is.C, a1, c.v, LEN - 6, `cell ${cls}`);
      if (st) { const m = P(is.C, a1 + c.v / 2, c.v < 45 ? 44 : 36); h += `<text x="${f(m.x)}" y="${f(m.y)}" class="mk" text-anchor="middle" dominant-baseline="central">${st === 'hit' ? (sunk.has(i) ? '☠' : '🔥') : '💧'}</text>`; }
    });
    sea.islands.forEach((is) => {
      is.rays.forEach((r) => {
        const E = P(is.C, r.d, LEN + 8);
        h += `<line x1="${f(is.C.x)}" y1="${f(is.C.y)}" x2="${f(E.x)}" y2="${f(E.y)}" class="ray"/>`;
        r.pts.forEach((L, k) => { const Q = P(is.C, r.d, k === 0 ? LEN : LEN * 0.55), T = P(Q, r.d + 90, 11); h += `<circle cx="${f(Q.x)}" cy="${f(Q.y)}" r="2.6" class="pt"/><text x="${f(T.x)}" y="${f(T.y)}" class="lbl" text-anchor="middle" dominant-baseline="central">${L}</text>`; });
      });
      h += `<circle cx="${f(is.C.x)}" cy="${f(is.C.y)}" r="9" class="isle"/><text x="${f(is.C.x)}" y="${f(is.C.y + 1)}" class="vl" text-anchor="middle" dominant-baseline="central">${is.V}</text>`;
    });
    return h + '</svg>';
  }
  const allLetters = (sea) => sea.islands.flatMap((is) => [is.V, ...is.rays.flatMap((r) => r.pts)]).sort();
  /** clavier de lettres : 3 cases, effacer, tirer */
  function nameKeyboard(host, sea, onFire, enabled = true) {
    let buf = '';
    host.innerHTML = `<div class="namebox"><span class="m-ang big"><span class="nb"></span></span></div><div class="letters">${allLetters(sea).map((L) => `<button type="button" class="lk" data-l="${L}">${L}</button>`).join('')}</div>
      <div class="m-row"><button type="button" class="m-btn m-ghost" data-a="del">⌫</button><button type="button" class="m-btn m-go" data-a="fire">💥 Tirer</button></div>`;
    const nb = host.querySelector('.nb');
    const draw = () => { nb.textContent = buf.padEnd(3, '·'); };
    host.querySelectorAll('.lk').forEach((b) => U.tap(b, () => { if (!enabled || buf.length >= 3) return; buf += b.dataset.l; Snd.key(); draw(); }));
    U.tap(host.querySelector('[data-a="del"]'), () => { buf = buf.slice(0, -1); draw(); });
    U.tap(host.querySelector('[data-a="fire"]'), () => { if (!enabled || buf.length !== 3) return; const n = buf; buf = ''; draw(); onFire(n); });
    draw();
    host.classList.toggle('off', !enabled);
  }
  /** tir sur une flotte ; renvoie { valid, why, cell, hit, sunkShip, already } */
  function shoot(sea, fleet, shots, name) {
    const r = readName(sea, name);
    if (!r.ok) return { valid: false, why: r.why };
    const i = r.cell;
    if (shots.has(i)) return { valid: true, already: true, cell: i };
    const ship = fleet.find((s) => s.cells.includes(i));
    if (!ship) { shots.set(i, 'miss'); return { valid: true, cell: i, hit: false }; }
    shots.set(i, 'hit'); ship.hits.add(i);
    return { valid: true, cell: i, hit: true, sunkShip: ship.hits.size === ship.cells.length ? ship : null };
  }
  const sunkSet = (fleet) => new Set(fleet.filter((s) => s.hits.size === s.cells.length).flatMap((s) => s.cells));

  /* =========================================================
     Missions (solo : trouver la flotte cachée par le jeu)
     ========================================================= */
  const MISSIONS = [
    { id: 'b1', icon: '⛵', name: 'Premier tir', tag: '2 îles, des noms simples', sea: { islands: 2, rays: [4, 5] }, fleet: [2, 1, 1] },
    { id: 'b2', icon: '🚤', name: 'L’archipel', tag: '3 îles', sea: { islands: 3, rays: [4, 5] }, fleet: [3, 2, 1] },
    { id: 'b3', icon: '🛳️', name: 'Deux noms', tag: 'Des demi-droites avec deux points', sea: { islands: 3, rays: [4, 5], double: 2 }, fleet: [3, 2, 1] },
    { id: 'b4', icon: '🚢', name: 'Grande flotte', tag: 'Plus d’îles, plus de bateaux', sea: { islands: 3, rays: [5, 6], double: 2 }, fleet: [3, 2, 2, 1], boss: true },
  ];
  const unlocked = (i) => ALL_OPEN || i === 0 || (S.d.stars[MISSIONS[i - 1].id] || 0) > 0;
  const starStr = (n) => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;
  let G = null;
  const capt = (html) => `<div class="capt"><span class="face" aria-hidden="true">🧑‍✈️</span><div class="say">${html}</div></div>`;
  function home() {
    G = null;
    const total = MISSIONS.reduce((s, z) => s + (S.d.stars[z.id] || 0), 0);
    const nextI = MISSIONS.findIndex((z, i) => unlocked(i) && !S.d.stars[z.id]);
    app.innerHTML = `<div class="screen"><header class="brand"><h1>Bataille <span>navale</span></h1><span class="lvl">sixième</span></header>
      <p class="tag">Des angles · <b>⭐ ${total} / ${MISSIONS.length * 3}</b></p>
      ${capt(!S.d.intro ? 'Capitaine ! Des bateaux se cachent dans les <b>angles</b> autour des îles. Pour tirer, donne le <b>nom</b> de l’angle visé : trois lettres, le <b>sommet au milieu</b>. Un nom mal écrit, et l’obus tombe à l’eau…' : pick(['Le sommet, toujours au milieu !', 'Deux points sur la même demi-droite ne font pas un angle.', 'Défie un camarade : chacun cherche la flotte de l’autre !']))}
      <button type="button" class="duel-btn" data-act="duel">⚔️ <b>Duel</b> <small>à deux sur la tablette : personne ne voit la flotte de l’autre, le jeu la cache</small></button>
      <div class="map">${MISSIONS.map((z, i) => { const lock = !unlocked(i), st = S.d.stars[z.id] || 0; return `<button type="button" class="zone${z.boss ? ' boss' : ''}${lock ? ' locked' : ''}${i === nextI ? ' next' : ''}" data-z="${i}" ${lock ? 'disabled' : ''}>
        <span class="num">${i + 1}</span><span class="ico">${lock ? '🔒' : z.icon}</span><span class="nm">${z.name}</span><span class="rl">${z.tag}</span><span class="st">${starStr(st)}</span>${S.d.best[z.id] ? `<span class="rec">Record : ${S.d.best[z.id]} tirs</span>` : ''}</button>`; }).join('')}</div>
      <p class="foot">⭐⭐⭐ = aucun nom d’angle mal écrit. Moins de tirs = meilleur record. Ta progression reste sur cet appareil.</p></div>`;
    app.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => { Snd.init(); S.d.intro = true; S.save(); start(MISSIONS[Number(b.dataset.z)]); }));
    app.querySelector('[data-act="duel"]').addEventListener('click', () => { Snd.init(); duel(); });
  }
  function start(M) {
    const sea = makeSea(M.sea), fleet = makeFleet(sea, M.fleet);
    if (!fleet) { start(M); return; }
    G = { M, sea, fleet, shots: new Map(), tirs: 0, bad: 0, log: [] };
    draw('');
  }
  function draw(msg) {
    const { M, sea, fleet } = G, left = fleet.filter((s) => s.hits.size < s.cells.length).length;
    app.innerHTML = `<div class="screen play"><div class="hud"><button type="button" class="quit" data-act="quit" aria-label="Arrêter">✕</button><span class="zn">${M.icon} ${M.name}</span><span class="zn right">💥 ${G.tirs} tirs · ✗ ${G.bad} · 🚢 ${left} à couler</span></div>
      <div class="game"><div class="field">${seaSVG(sea, G.shots, sunkSet(fleet))}<p class="fleetinfo">Bateaux : ${M.fleet.map((n) => '▮'.repeat(n)).join(' · ')}</p></div>
      <div class="side"><p class="ask">Nomme l’angle visé :</p><div id="kb"></div><div class="msg" id="msg">${msg}</div><div class="log">${G.log.map((l) => `<p>${l}</p>`).join('')}</div></div></div></div>`;
    app.querySelector('[data-act="quit"]').addEventListener('click', () => { if (confirm('Quitter la bataille ?')) home(); });
    nameKeyboard(document.getElementById('kb'), sea, fire);
  }
  function fire(name) {
    const r = shoot(G.sea, G.fleet, G.shots, name);
    if (!r.valid) { G.bad++; Snd.bad(); G.log.unshift(`✗ ${ang(name)} : nom mal formé`); draw(`<div class="explain"><b>Tir perdu : ${ang(name)}</b> n’est pas le nom d’une case. ${r.why}</div>`); return; }
    if (r.already) { draw(`<div class="explain warn">${ang(name)} : tu as déjà tiré sur cet angle (c’est le même que ${namesOf(G.sea, r.cell).filter((x) => x !== name).slice(0, 2).map(ang).join(' ou ')}).</div>`); return; }
    G.tirs++;
    if (r.hit) { Snd.boom(); if (r.sunkShip) setTimeout(() => Snd.sink(), 250); } else Snd.splash();
    G.log.unshift(`${r.hit ? (r.sunkShip ? '☠' : '🔥') : '💧'} ${ang(name)}`);
    const done = G.fleet.every((s) => s.hits.size === s.cells.length);
    draw(`<div class="explain ${r.hit ? 'good' : ''}">${ang(name)} : ${r.hit ? (r.sunkShip ? `<b>coulé !</b> (${r.sunkShip.cells.length} case${r.sunkShip.cells.length > 1 ? 's' : ''})` : '<b>touché !</b>') : 'à l’eau.'}</div>`);
    if (done) finish();
  }
  function finish() {
    const M = G.M, stars = G.bad === 0 ? 3 : G.bad <= 2 ? 2 : 1, old = S.d.stars[M.id] || 0, oldBest = S.d.best[M.id] || 0;
    S.d.stars[M.id] = Math.max(old, stars); if (!oldBest || G.tirs < oldBest) S.d.best[M.id] = G.tirs; S.save();
    Snd.win(); U.confetti(stars * 25);
    const next = MISSIONS[MISSIONS.indexOf(M) + 1];
    document.getElementById('msg').insertAdjacentHTML('beforeend', `<div class="explain good"><b>🏆 Toute la flotte est coulée en ${G.tirs} tirs !</b> ${'⭐'.repeat(stars)} ${G.bad ? `(${G.bad} nom${G.bad > 1 ? 's' : ''} mal écrit${G.bad > 1 ? 's' : ''})` : ''}${!oldBest || G.tirs < oldBest ? ' · 🏅 record !' : ''}</div>
      <div class="row"><button type="button" class="btn ghost" data-act="home">← Missions</button><button type="button" class="btn${next ? '' : ' go'}" data-act="again">↻ Rejouer</button>${next ? '<button type="button" class="btn go" data-act="next">Mission suivante ▶</button>' : ''}</div>`);
    document.getElementById('kb').innerHTML = '';
    app.querySelector('[data-act="home"]').addEventListener('click', home);
    app.querySelector('[data-act="again"]').addEventListener('click', () => start(M));
    app.querySelector('[data-act="next"]')?.addEventListener('click', () => start(next));
  }

  /* =========================================================
     DUEL : même mer, une flotte cachée par joueur (placée par le jeu), chacun son tour
     ========================================================= */
  const MODES = [
    { id: '1', nom: 'Petite mer', desc: '2 îles, 3 bateaux', sea: { islands: 2, rays: [4, 5] }, fleet: [2, 1, 1] },
    { id: '2', nom: 'Archipel', desc: '3 îles, 3 bateaux, deux noms possibles', sea: { islands: 3, rays: [4, 5], double: 1 }, fleet: [3, 2, 1] },
    { id: '3', nom: 'Grande bataille', desc: '3 îles, 4 bateaux', sea: { islands: 3, rays: [5, 6], double: 2 }, fleet: [3, 2, 2, 1] },
  ];
  function duel() {
    window.Moteur.match({ jeu: 'bataille-angles-6e', titre: 'Bataille navale des angles', niveauScolaire: 'sixième', theme: 'bataille', icone: '⚓', sound: Snd, modes: MODES, quitter: home,
      start: (ctx) => duelPlay(ctx) });
  }
  function duelPlay(ctx) {
    const M = MODES.find((m) => m.id === ctx.mode) || MODES[0];
    let sea, fleets;
    do { sea = makeSea(M.sea); fleets = [makeFleet(sea, M.fleet), makeFleet(sea, M.fleet)]; } while (!fleets[0] || !fleets[1]);
    // shots[k] = les tirs du joueur k sur la flotte de l'adversaire (fleets[1 - k])
    const D = { turn: rand(0, 1), shots: [new Map(), new Map()], tirs: [0, 0], bad: [0, 0], msg: ['', ''] };
    ctx.P.forEach((p) => {
      p.el.innerHTML = `<div class="bz"><div class="dhead"><span>${p.k === 0 ? '🟦' : '🟥'} ${U.esc(p.nom)}</span><span class="bst"></span></div><div class="bfield"></div>
        <p class="m-turnmsg"></p><div class="bkb"></div><div class="bmsg"></div></div>`;
    });
    function render() {
      ctx.turn(D.turn);
      ctx.P.forEach((p) => {
        const k = p.k, mine = D.turn === k, el = p.el, enemy = fleets[1 - k], myFleet = fleets[k];
        const leftE = enemy.filter((s) => s.hits.size < s.cells.length).length, leftM = myFleet.filter((s) => s.hits.size < s.cells.length).length;
        el.querySelector('.bst').textContent = `À couler : ${leftE} · Ma flotte : ${leftM}/${myFleet.length}`;
        el.querySelector('.bfield').innerHTML = seaSVG(sea, D.shots[k], sunkSet(enemy));
        el.querySelector('.m-turnmsg').textContent = mine ? 'À toi : nomme l’angle visé.' : `Au tour de ${ctx.P[1 - k].nom}…`;
        nameKeyboard(el.querySelector('.bkb'), sea, (name) => fireD(k, name), mine);
        el.querySelector('.bmsg').innerHTML = D.msg[k];
      });
    }
    function fireD(k, name) {
      if (D.turn !== k) return;
      const r = shoot(sea, fleets[1 - k], D.shots[k], name), who = U.esc(ctx.P[k].nom);
      if (!r.valid) { D.bad[k]++; Snd.bad(); D.msg[k] = `✗ ${ang(name)} : tir perdu. ${r.why}`; D.msg[1 - k] = `${who} a mal nommé son angle : tir perdu.`; D.turn = 1 - k; render(); return; }
      if (r.already) { D.msg[k] = `${ang(name)} : déjà visé ! Choisis un autre angle.`; render(); return; }
      D.tirs[k]++;
      if (r.hit) { Snd.boom(); if (r.sunkShip) setTimeout(() => Snd.sink(), 250); } else Snd.splash();
      const res = r.hit ? (r.sunkShip ? 'coulé ☠' : 'touché 🔥') : 'à l’eau 💧';
      D.msg[k] = `${ang(name)} : ${res}`; D.msg[1 - k] = `${who} tire sur ${ang(name)} : ${res}`;
      if (fleets[1 - k].every((s) => s.hits.size === s.cells.length)) {
        const show = (j) => seaSVG(sea, D.shots[1 - j], sunkSet(fleets[j]), new Set(fleets[j].flatMap((s) => s.cells)));
        ctx.end({ winner: k, score: [0, 1].map((x) => `${D.tirs[x]} tirs, ${D.bad[x]} nom${D.bad[x] > 1 ? 's' : ''} mal écrit${D.bad[x] > 1 ? 's' : ''}`), stats: [0, 1].map((x) => ({ tirs: D.tirs[x], nomsFaux: D.bad[x] })),
          text: [0, 1].map((x) => `<p class="m-dim">${who} a coulé toute la flotte en ${D.tirs[k]} tirs.</p><p class="m-dim">Ta flotte (les tirs de l’adversaire) :</p><div class="endsea">${show(x)}</div>`) });
        return;
      }
      D.turn = 1 - k; render();
    }
    render();
  }

  window.__bataille = { makeSea, makeFleet, readName, namesOf, shoot, MISSIONS, MODES };
  home();
})();
