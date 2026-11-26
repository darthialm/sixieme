/* =========================================================
   L'ATLAS PERDU · sixième — moteur du jeu (monde, dialogues, énigmes, sauvegarde, Atlas)
   Jeu d'aventure solo : une région par chapitre de la progression de 6e.
   Conception : jeu-aventure-6e/BIBLE.md (hors du site).

   Une région est un fichier js/regions/<id>.js qui appelle Atlas.region({...}) :
     id, num, name, chapter, map (lignes de caractères, voir LEGENDE), spawn {x,y},
     props   [{x,y,stamp}|{x,y,t:'town:83',solid}]         décor en plusieurs cases (maisons, puits…)
     npcs    [{id,x,y,t:'dungeon:84',name,talk(A)}]        talk renvoie des répliques ou fait await A.say(...)
     objects [{id,x,y,t,kind:'enigme'|'gardien'|'tresor'|'mental'|'action', enigme, use(A)}]
     exits   [{x,y,to}]                                     cases de sortie (vers 'village' ou une région)
     signs   {'x,y': 'texte'}                               panneaux lisibles
     lesson  [{text, svg?, act?(el, done)}]                 leçon de Pi au premier passage
     enigmes {id:{title, consigne, build(ctx)}}             3 énigmes (ordre = ordre du code de sauvegarde)
     gardien {title, consigne, build(ctx)}
     tool    {id, name, icon}                                outil gagné avec la page
     treasure{x,y,needs:'compas', text, build?(ctx)}        trésor caché (★)
   ========================================================= */
(function () {
  'use strict';

  const TILE = 16;

  /* ---------------------------------------------------------------- Registre des régions */
  // Ordre fixe : sert au code de sauvegarde (ne jamais réordonner, seulement ajouter à la fin).
  const ORDER = ['gare', 'marche', 'tour', 'mine', 'forge', 'port', 'chantier',
    'relais', 'jardin', 'boulangerie', 'auberge', 'lac', 'ecluse', 'enclos', 'bazar', 'champs', 'foire', 'chateau'];
  const META = {
    gare: [1, 'La Gare du Brouillard', 'Parallèles et perpendiculaires'],
    marche: [2, 'Le Marché aux Cristaux', 'Nombres entiers et décimaux (1)'],
    tour: [3, 'La Tour du Guetteur', 'Distances et cercles'],
    mine: [4, 'La Mine aux Graduations', 'Nombres entiers et décimaux (2)'],
    forge: [5, 'La Forge aux Machines', 'Addition, soustraction, multiplication'],
    port: [6, 'Le Port des Voiles', 'Angles'],
    chantier: [7, 'Le Chantier des Charpentiers', 'Triangles'],
    relais: [8, 'Le Relais des Messagers', 'Division, durées'],
    jardin: [9, 'Le Jardin aux Dalles', 'Quadrilatères'],
    boulangerie: [10, 'La Boulangerie', 'Fractions (1)'],
    auberge: [11, "L'Auberge", 'Proportionnalité'],
    lac: [12, 'Le Lac Miroir', 'Symétrie axiale'],
    ecluse: [13, "L'Écluse", 'Fractions (2)'],
    enclos: [14, 'Les Enclos', 'Périmètres'],
    bazar: [15, 'Le Bazar', 'Pourcentages'],
    champs: [16, 'Les Champs', 'Aires'],
    foire: [17, 'La Foire', 'Données, probabilités'],
    chateau: [18, 'Le Château', 'Solides et volumes'],
  };
  const REG = {};

  const Atlas = (window.Atlas = {
    TILE, ORDER, META, REG,
    region(def) {
      def.enigmes = def.enigmes || {};
      def.npcs = def.npcs || [];
      def.objects = def.objects || [];
      def.props = def.props || [];
      def.exits = def.exits || [];
      def.signs = def.signs || {};
      REG[def.id] = def;
    },
  });

  /* ---------------------------------------------------------------- Hasard reproductible */
  function makeRng(seed) {
    let s = seed >>> 0 || 1;
    const next = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = {
      seed,
      next,
      int: (a, b) => a + Math.floor(next() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      chance: (p) => next() < p,
      shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      },
    };
    return r;
  }
  Atlas.rng = makeRng;
  Atlas.newSeed = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;

  /* ---------------------------------------------------------------- Nombres (écriture française) */
  Atlas.parseNum = function (raw) {
    if (raw == null) return NaN;
    const s = String(raw).trim().replace(/\s/g, '').replace(',', '.');
    if (!/^-?\d*\.?\d+$/.test(s) && !/^-?\d+\.?$/.test(s)) return NaN;
    return Number(s);
  };
  Atlas.fmt = function (n, maxDec = 4) {
    const r = Math.round(n * 10 ** maxDec) / 10 ** maxDec;
    const [i, d] = String(Math.abs(r)).split('.');
    const ent = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (r < 0 ? '−' : '') + ent + (d ? ',' + d : '');
  };
  Atlas.near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

  /* ---------------------------------------------------------------- Sauvegarde et profils */
  const KEY = 'atlas6.v1';
  const store = {
    read() {
      try {
        const j = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (j && Array.isArray(j.profiles)) return j;
      } catch (e) { /* stockage indisponible */ }
      return { profiles: [], current: null };
    },
    write(data) {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* tant pis */ }
    },
  };
  let DB = store.read();

  function blankProfile(name, hero) {
    return {
      id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4),
      name, hero, outfit: 0, coins: 0, outfits: [0, 1, 2, 3], visited: ['village'], regions: {},
      at: { region: 'village', x: null, y: null }, mental: {}, introSeen: false,
    };
  }
  Atlas.profile = () => DB.profiles.find((p) => p.id === DB.current) || null;
  Atlas.save = () => store.write(DB);
  Atlas.rs = function (id) {
    const P = Atlas.profile();
    if (!P.regions[id]) P.regions[id] = { lesson: false, en: {}, gardien: false, flawless: false, treasure: false };
    return P.regions[id];
  };

  /* Code de sauvegarde : 7 bits par région + pièces + héros, en base 32 (sans 0/O/1/I). */
  const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const HEROES = [85, 88, 99, 112];
  Atlas.HEROES = HEROES;
  Atlas.exportCode = function () {
    const P = Atlas.profile();
    const bits = [];
    const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >> i) & 1); };
    for (const id of ORDER) {
      const r = P.regions[id] || { en: {} };
      const keys = REG[id] ? Object.keys(REG[id].enigmes) : [];
      put(r.lesson ? 1 : 0, 1);
      for (let k = 0; k < 3; k++) put(keys[k] && r.en[keys[k]] ? 1 : 0, 1);
      put(r.gardien ? 1 : 0, 1);
      put(r.flawless ? 1 : 0, 1);
      put(r.treasure ? 1 : 0, 1);
    }
    put(Math.min(P.coins, 16383), 14);
    put(Math.max(0, HEROES.indexOf(P.hero)), 2);
    put(Math.min(15, P.outfit || 0), 4);
    let sum = 0;
    bits.forEach((b, i) => { sum = (sum + b * (i % 7 + 1)) % 32; });
    put(sum, 5);
    while (bits.length % 5) bits.push(0);
    let out = '';
    for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).join(''), 2)];
    return out.match(/.{1,5}/g).join('-');
  };
  Atlas.importCode = function (code, name) {
    const s = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const bits = [];
    for (const ch of s) {
      const v = B32.indexOf(ch);
      if (v < 0) return null;
      for (let i = 4; i >= 0; i--) bits.push((v >> i) & 1);
    }
    const need = ORDER.length * 7 + 14 + 2 + 4 + 5;
    if (bits.length < need) return null;
    let pos = 0;
    const get = (n) => { let v = 0; for (let i = 0; i < n; i++) v = (v << 1) | bits[pos++]; return v; };
    const P = blankProfile(name || 'Joueur', HEROES[0]);
    for (const id of ORDER) {
      const keys = REG[id] ? Object.keys(REG[id].enigmes) : [];
      const r = { lesson: !!get(1), en: {}, gardien: false, flawless: false, treasure: false };
      for (let k = 0; k < 3; k++) { const b = get(1); if (b && keys[k]) r.en[keys[k]] = true; }
      r.gardien = !!get(1); r.flawless = !!get(1); r.treasure = !!get(1);
      if (r.lesson || r.gardien || Object.keys(r.en).length) { P.regions[id] = r; P.visited.push(id); }
    }
    P.coins = get(14);
    P.hero = HEROES[get(2)] || HEROES[0];
    P.outfit = get(4);
    P.outfits = Array.from(new Set([0, 1, 2, 3, P.outfit]));
    const end = pos;
    let sum = 0;
    for (let i = 0; i < end; i++) sum = (sum + bits[i] * (i % 7 + 1)) % 32;
    if (get(5) !== sum) return null;
    P.introSeen = true;
    return P;
  };

  /* ---------------------------------------------------------------- Progression */
  Atlas.hasPage = (id) => !!(Atlas.profile() && Atlas.profile().regions[id] && Atlas.profile().regions[id].gardien);
  Atlas.pages = () => ORDER.filter((id) => Atlas.hasPage(id)).length;
  // Mode professeur : ?tout dans l'adresse, ou Espace professeur du site déverrouillé sur cet appareil (même clé que script.js)
  Atlas.profMode = (() => { try { return localStorage.getItem('revisions6e-prof') === 'prof:ok'; } catch (e) { return false; } })();
  Atlas.allUnlocked = /[?&]tout\b/.test(location.search) || Atlas.profMode;
  Atlas.isUnlocked = function (id) {
    if (id === 'village') return true;
    if (Atlas.allUnlocked) return true;
    const n = META[id] ? META[id][0] : 99;
    if (n <= 7) return true;
    if (n === 8) return ORDER.slice(0, 7).every((r) => Atlas.hasPage(r));
    return Atlas.hasPage(ORDER[n - 2]);
  };
  Atlas.tools = function () {
    return ORDER.filter((id) => REG[id] && REG[id].tool && Atlas.hasPage(id)).map((id) => REG[id].tool);
  };
  Atlas.hasTool = (toolId) => Atlas.allUnlocked || Atlas.tools().some((t) => t.id === toolId);
  Atlas.stars = function (id) {
    const r = Atlas.profile() && Atlas.profile().regions[id];
    if (!r) return 0;
    const def = REG[id];
    const repaired = def && Object.keys(def.enigmes).length > 0 && Object.keys(def.enigmes).every((k) => r.en[k]);
    return (repaired ? 1 : 0) + (r.flawless ? 1 : 0) + (r.treasure ? 1 : 0);
  };
  Atlas.addCoins = function (n) {
    const P = Atlas.profile();
    P.coins = Math.max(0, P.coins + n);
    Atlas.save();
    UI.hud();
  };

  /* ================================================================= INTERFACE (DOM) */
  const $ = (sel, root = document) => root.querySelector(sel);
  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'html') e.innerHTML = v;
      else if (v !== false && v != null) e.setAttribute(k, v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(kid));
    return e;
  };
  Atlas.h = h;

  /* Portrait d'un sprite Kenney ('dungeon:84') ou de Pi ('pi'), en CSS. */
  function sprite(t, size = 64) {
    if (Atlas.portrait) {
      const im = h('img', { class: 'spr', alt: '', src: Atlas.portrait(String(t)), style: `width:${size}px;height:${size}px;object-fit:cover` });
      return im;
    }
    if (t === 'pi') return h('span', { class: 'spr', style: `width:${size}px;height:${size}px;background-image:url(${PI_URL});background-size:${size}px ${size}px` });
    const [sheet, f] = String(t).split(':');
    const n = Number(f);
    const k = size / 16;
    return h('span', {
      class: 'spr',
      style: `width:${size}px;height:${size}px;background-image:url(assets/${sheet}.png);` +
        `background-size:${192 * k}px ${176 * k}px;background-position:-${(n % 12) * 16 * k}px -${Math.floor(n / 12) * 16 * k}px`,
    });
  }
  Atlas.sprite = sprite;

  /* Pi le hibou, dessiné en pixels. */
  const PI_PIX = [
    '................',
    '...d........d...',
    '...dd......dd...',
    '...dodddddddod..',
    '..doooooooooood.',
    '..dwwwdoodwwwd..',
    '.dwwkwwddwwkwwd.',
    '.dwwkwwddwwkwwd.',
    '.ddwwwdyydwwwdd.',
    '.doodddyydddood.',
    '.docccccccccccod',
    '.docvccvccvccod.',
    '..dccccccccccd..',
    '..ddcvccvccvdd..',
    '...dddddddddd...',
    '....yy....yy....',
  ];
  const PI_PAL = { d: '#3b2412', o: '#8b5a2b', w: '#fff7e6', k: '#1b1b2f', y: '#f5a623', c: '#e8c99b', v: '#c9a06d' };
  const PI_URL = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const x = c.getContext('2d');
    PI_PIX.forEach((row, j) => [...row].forEach((ch, i) => {
      if (PI_PAL[ch]) { x.fillStyle = PI_PAL[ch]; x.fillRect(i, j, 1, 1); }
    }));
    return c.toDataURL();
  })();
  Atlas.PI_URL = PI_URL;

  const UI = (Atlas.UI = {
    busy: 0,
    root: null,
    init() {
      this.root = $('#ui');
      this.hudEl = h('div', { class: 'hud', hidden: true },
        h('div', { class: 'hud-left' },
          h('span', { class: 'hud-region', id: 'hud-region' }, ''),
        ),
        h('div', { class: 'hud-right' },
          h('span', { class: 'chip', title: 'Pièces' }, h('span', { class: 'coin' }), h('b', { id: 'hud-coins' }, '0')),
          h('span', { class: 'chip', title: "Pages de l'Atlas" }, '📖 ', h('b', { id: 'hud-pages' }, '0'), '/18'),
          h('button', { class: 'btn btn-hud', onclick: () => Atlas.openAtlas() }, '🗺️ Atlas'),
          h('button', { class: 'btn btn-hud', onclick: () => Atlas.openBag() }, '🎒'),
          h('button', { class: 'btn btn-hud', onclick: () => Atlas.openMenu() }, '☰'),
        ));
      this.root.append(this.hudEl);
    },
    hud() {
      const P = Atlas.profile();
      if (!P) return;
      this.hudEl.hidden = false;
      $('#hud-coins').textContent = P.coins;
      $('#hud-pages').textContent = Atlas.pages();
      const id = Atlas.world && Atlas.world.regionId;
      $('#hud-region').textContent = id === 'village' ? 'Le Village' : (META[id] ? `${META[id][0]}. ${META[id][1]}` : '');
    },

    /* Boîte de dialogue : lignes = ['texte'] ou [{who:'dungeon:84'|'pi', name, text}] */
    say(lines, defaults = {}) {
      if (!Array.isArray(lines)) lines = [lines];
      return new Promise((resolve) => {
        UI.busy++;
        let i = 0, closed = false;
        const box = h('div', { class: 'dialog' });
        const close = () => { if (closed) return; closed = true; box.remove(); UI.busy--; resolve(); };
        const show = () => {
          if (i >= lines.length) return close();
          let L = lines[i];
          if (typeof L === 'string') L = { text: L };
          L = Object.assign({}, defaults, L);
          box.innerHTML = '';
          const who = L.who || 'pi';
          box.append(
            h('div', { class: 'dialog-portrait' }, sprite(who, 64)),
            h('div', { class: 'dialog-body' },
              h('div', { class: 'dialog-name' }, L.name || (who === 'pi' ? 'Pi' : '')),
              h('div', { class: 'dialog-text', html: L.text }),
              h('div', { class: 'dialog-next' }, i < lines.length - 1 ? '▼' : '✔')));
          i++;
        };
        box.addEventListener('click', show);
        box._key = (e) => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E') { e.preventDefault(); show(); } };
        this.root.append(box);
        show();
        const onKey = (e) => { if (!box.isConnected) return document.removeEventListener('keydown', onKey, true); box._key(e); };
        setTimeout(() => document.addEventListener('keydown', onKey, true), 50);
      });
    },

    /* Choix : renvoie l'index choisi (ou -1). */
    choose(text, options, who = 'pi') {
      return new Promise((resolve) => {
        UI.busy++;
        const box = h('div', { class: 'dialog' },
          h('div', { class: 'dialog-portrait' }, sprite(who, 64)),
          h('div', { class: 'dialog-body' },
            h('div', { class: 'dialog-text', html: text }),
            h('div', { class: 'dialog-choices' }, options.map((o, k) =>
              h('button', { class: 'btn', onclick: (e) => { e.stopPropagation(); box.remove(); UI.busy--; resolve(k); } }, o)))));
        this.root.append(box);
      });
    },

    toast(text, kind = '') {
      const t = h('div', { class: 'toast ' + kind, html: text });
      this.root.append(t);
      setTimeout(() => t.classList.add('out'), 2200);
      setTimeout(() => t.remove(), 2700);
    },

    /* Grand panneau plein écran. Renvoie {el, body, close} */
    panel(title, { cls = '', onClose, closable = true } = {}) {
      UI.busy++;
      const body = h('div', { class: 'panel-body' });
      const head = h('div', { class: 'panel-head' }, h('h2', { html: title }));
      const el = h('div', { class: 'panel-wrap' }, h('div', { class: 'panel ' + cls }, head, body));
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        el.remove();
        UI.busy--;
        if (onClose) onClose();
      };
      if (closable) head.append(h('button', { class: 'btn btn-close', title: 'Fermer', onclick: close }, '✕'));
      this.root.append(el);
      return { el, head, body, close };
    },

    confirm(text) {
      return UI.choose(text, ['Oui', 'Non']).then((k) => k === 0);
    },

    /* Champ réponse numérique (virgule acceptée) */
    answer(parent, { label = '', unit = '', placeholder = '?', onSubmit, width = 7 } = {}) {
      const input = h('input', { class: 'answer-input', inputmode: 'decimal', autocomplete: 'off', placeholder, style: `width:${width}em` });
      const go = () => {
        const raw = input.value;
        const v = Atlas.parseNum(raw);
        if (Number.isNaN(v)) { UI.toast('Écris un nombre (par exemple 12 ou 3,5).', 'bad'); return; }
        onSubmit(v, raw);
      };
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); e.stopPropagation(); });
      const row = h('div', { class: 'answer-row' }, label ? h('label', { html: label }) : null, input, unit ? h('span', { class: 'unit' }, unit) : null,
        h('button', { class: 'btn btn-go', onclick: go }, 'Valider'));
      parent.append(row);
      return { row, input, focus: () => input.focus(), clear: () => { input.value = ''; } };
    },

    confetti() {
      const c = h('div', { class: 'confetti' });
      for (let i = 0; i < 40; i++) {
        c.append(h('i', { style: `left:${Math.random() * 100}%;background:hsl(${Math.random() * 360},80%,60%);animation-delay:${Math.random() * 0.4}s;animation-duration:${1.2 + Math.random()}s` }));
      }
      this.root.append(c);
      setTimeout(() => c.remove(), 2600);
    },
  });

  /* ================================================================= SVG ET GÉOMÉTRIE (pour les énigmes) */
  const NS = 'http://www.w3.org/2000/svg';
  const S = (Atlas.svg = {
    el(tag, attrs = {}, parent) {
      const e = document.createElementNS(NS, tag);
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'text') e.textContent = v;
        else if (v != null && v !== false) e.setAttribute(k, v);
      }
      if (parent) parent.append(e);
      return e;
    },
    /* Crée un <svg> responsive dans parent avec un viewBox w×h. */
    root(parent, w, h2, cls = 'puz') {
      const s = S.el('svg', { viewBox: `0 0 ${w} ${h2}`, class: cls });
      parent.append(s);
      return s;
    },
    /* Coordonnées d'un événement pointeur dans le repère du svg. */
    pt(svg, e) {
      const p = svg.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      const r = p.matrixTransform(svg.getScreenCTM().inverse());
      return { x: r.x, y: r.y };
    },
    /* Glisser un élément (ou une zone) : callbacks reçoivent le point dans le repère du svg. */
    drag(target, svg, { start, move, end } = {}) {
      target.style.touchAction = 'none';
      target.style.cursor = 'grab';
      target.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        target.setPointerCapture(e.pointerId);
        if (start && start(S.pt(svg, e), e) === false) return;
        const mv = (ev) => move && move(S.pt(svg, ev), ev);
        const up = (ev) => {
          target.removeEventListener('pointermove', mv);
          target.removeEventListener('pointerup', up);
          target.removeEventListener('pointercancel', up);
          if (end) end(S.pt(svg, ev), ev);
        };
        target.addEventListener('pointermove', mv);
        target.addEventListener('pointerup', up);
        target.addEventListener('pointercancel', up);
      });
    },
  });
  Atlas.geo = {
    dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    /* angle de la direction a→b en degrés, sens mathématique (y vers le haut) */
    dir: (a, b) => (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI,
    /* angle géométrique AOB entre 0 et 180 */
    angle(A, O, B) {
      const u = { x: A.x - O.x, y: A.y - O.y };
      const v = { x: B.x - O.x, y: B.y - O.y };
      const c = (u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y));
      return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
    },
    /* projeté orthogonal de P sur la droite (AB) */
    project(P, A, B) {
      const dx = B.x - A.x, dy = B.y - A.y;
      const t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / (dx * dx + dy * dy);
      return { x: A.x + t * dx, y: A.y + t * dy, t };
    },
    /* intersection des droites (AB) et (CD), ou null si parallèles */
    inter(A, B, C, D) {
      const d = (A.x - B.x) * (C.y - D.y) - (A.y - B.y) * (C.x - D.x);
      if (Math.abs(d) < 1e-9) return null;
      const t = ((A.x - C.x) * (C.y - D.y) - (A.y - C.y) * (C.x - D.x)) / d;
      return { x: A.x + t * (B.x - A.x), y: A.y + t * (B.y - A.y) };
    },
    /* points d'intersection de deux cercles */
    circles(c1, r1, c2, r2) {
      const d = Math.hypot(c2.x - c1.x, c2.y - c1.y);
      if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return [];
      const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
      const hh = Math.sqrt(Math.max(0, r1 * r1 - a * a));
      const mx = c1.x + (a * (c2.x - c1.x)) / d, my = c1.y + (a * (c2.y - c1.y)) / d;
      return [
        { x: mx + (hh * (c2.y - c1.y)) / d, y: my - (hh * (c2.x - c1.x)) / d },
        { x: mx - (hh * (c2.y - c1.y)) / d, y: my + (hh * (c2.x - c1.x)) / d },
      ];
    },
  };

  /* ================================================================= LEÇONS, ÉNIGMES, GARDIENS */

  /* Leçon : slides [{text, svg?: string | fn(el), act?: fn(el, done)}] */
  Atlas.playLesson = function (regionId, { replay = false } = {}) {
    const def = REG[regionId];
    if (!def || !def.lesson) return Promise.resolve();
    return new Promise((resolve) => {
      const P = UI.panel(`Leçon de Pi · ${def.name}`, { cls: 'lesson', onClose: () => { Atlas.rs(regionId).lesson = true; Atlas.save(); resolve(); } });
      let i = 0;
      const render = () => {
        const sl = def.lesson[i];
        P.body.innerHTML = '';
        const stage = h('div', { class: 'lesson-stage' });
        const bubble = h('div', { class: 'pi-bubble' }, sprite('pi', 56), h('div', { class: 'pi-text', html: sl.text }));
        const next = h('button', { class: 'btn btn-go' }, i < def.lesson.length - 1 ? 'Suivant ▶' : "J'ai compris !");
        const nav = h('div', { class: 'lesson-nav' },
          h('span', { class: 'lesson-count' }, `${i + 1} / ${def.lesson.length}`),
          i > 0 ? h('button', { class: 'btn', onclick: () => { i--; render(); } }, '◀') : h('span'),
          next);
        P.body.append(bubble, stage, nav);
        if (typeof sl.svg === 'string') stage.innerHTML = sl.svg;
        else if (typeof sl.svg === 'function') sl.svg(stage);
        const doNext = () => { if (i < def.lesson.length - 1) { i++; render(); } else P.close(); };
        next.onclick = doNext;
        if (sl.act) {
          next.disabled = true;
          next.textContent = 'À toi !';
          sl.act(stage, () => { next.disabled = false; next.textContent = i < def.lesson.length - 1 ? 'Suivant ▶' : "J'ai compris !"; UI.toast('Bravo !', 'good'); });
        }
      };
      render();
    });
  };

  /* Énigme ou gardien. kind = 'enigme' | 'gardien' | 'tresor' */
  /* Suivi des élèves (suivi.js) : chaque énigme réussie ou chaque cœur perdu va sur le compte de l'élève connecté.
     Le n° de la région est celui du chapitre du site (1 = droites, 2 = decimaux1…). */
  const CH6 = ['droites', 'decimaux1', 'cercle', 'decimaux2', 'operations', 'angles', 'triangles'];
  const suivi = (ev) => { if (window.Suivi) Suivi.jeu(Object.assign({ jeu: 'atlas' }, ev)); };
  Atlas.playEnigme = function (regionId, key, kind = 'enigme') {
    const def = REG[regionId];
    const E = kind === 'gardien' ? def.gardien : kind === 'tresor' ? def.treasure : def.enigmes[key];
    if (!E) return Promise.resolve(false);
    const trace = (ok, text) => suivi({ ch: CH6[(def.num || 0) - 1] || 'atlas', comp: `atlas:${regionId}:${kind === 'enigme' ? key : kind}`, ok,
      err: ok || !text ? null : String(text).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60), extra: { titre: E.title } });
    const MAX = E.hearts || 5;
    return new Promise((resolve) => {
      let finished = false;
      const P = UI.panel((kind === 'gardien' ? '👑 ' : kind === 'tresor' ? '💎 ' : '') + E.title, {
        cls: 'enigme',
        onClose: () => { cleanup(); if (!finished) resolve(false); },
      });
      const heartsEl = h('div', { class: 'hearts' });
      P.head.insertBefore(heartsEl, P.head.lastChild);
      let hearts = MAX, lost = 0, cleanups = [], attempt = 0;
      const cleanup = () => { cleanups.forEach((f) => { try { f(); } catch (e) { /* */ } }); cleanups = []; };
      const drawHearts = () => {
        heartsEl.innerHTML = '';
        for (let k = 0; k < MAX; k++) heartsEl.append(h('span', { class: 'heart' + (k < hearts ? '' : ' empty') }, '♥'));
      };
      const build = () => {
        cleanup();
        hearts = MAX;
        drawHearts();
        P.body.innerHTML = '';
        const consigne = h('div', { class: 'consigne', html: E.consigne || '' });
        const content = h('div', { class: 'enigme-content' });
        const piText = h('div', { class: 'pi-text' }, '');
        const bubble = h('div', { class: 'pi-bubble small' }, sprite('pi', 44), piText);
        P.body.append(consigne, content, bubble);
        const ctx = {
          el: content,
          consigne,
          rng: makeRng(Atlas.newSeed()),
          attempt,
          gardien: kind === 'gardien',
          get hearts() { return hearts; },
          pi(text, mood = '') { piText.innerHTML = text; bubble.className = 'pi-bubble small ' + mood; },
          fail(text) {
            if (finished) return hearts;
            trace(false, text);
            hearts--;
            lost++;
            drawHearts();
            P.el.querySelector('.panel').classList.remove('shake');
            void P.el.offsetWidth;
            P.el.querySelector('.panel').classList.add('shake');
            ctx.pi(text || 'Ce n\'est pas ça…', 'bad');
            if (hearts <= 0) {
              UI.busy++;
              setTimeout(() => {
                UI.busy--;
                UI.toast('Plus de cœurs ! On recommence avec de nouvelles données.', 'bad');
                attempt++;
                build();
              }, 2200);
            }
            return hearts;
          },
          win(text) {
            if (finished) return;
            finished = true;
            trace(true);
            ctx.pi(text || 'Bravo !', 'good');
            UI.confetti();
            const r = Atlas.rs(regionId);
            let reward = 0;
            if (kind === 'enigme') {
              if (!r.en[key]) reward = 5;
              r.en[key] = true;
            } else if (kind === 'gardien') {
              if (!r.gardien) reward = 15;
              r.gardien = true;
              if (lost === 0) r.flawless = true;
            } else if (kind === 'tresor') {
              if (!r.treasure) reward = 10;
              r.treasure = true;
            }
            if (reward) Atlas.addCoins(reward);
            Atlas.save();
            const bar = h('div', { class: 'win-bar' },
              reward ? h('span', {}, `+${reward} `, h('span', { class: 'coin' })) : null,
              h('button', { class: 'btn btn-go', onclick: () => { P.close(); resolve(true); } }, 'Continuer ▶'));
            P.body.append(bar);
            bar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          },
          onCleanup(f) { cleanups.push(f); },
          restart() { attempt++; build(); },
        };
        ctx.pi(E.pi || 'Prends ton temps. Une erreur coûte un cœur.');
        const ret = E.build(ctx);
        if (typeof ret === 'function') cleanups.push(ret);
      };
      build();
    });
  };

  /* ================================================================= CALCUL MENTAL (pierres de défi) */
  function mentalQuestion(r) {
    const kinds = [
      () => { const a = r.int(3, 9), b = r.int(3, 9); return [`${a} × ${b}`, a * b]; },
      () => { const a = r.int(2, 9) * 10 + r.int(1, 9), b = r.int(11, 49); return [`${a} + ${b}`, a + b]; },
      () => { const a = r.int(40, 99), b = r.int(11, a - 5); return [`${a} − ${b}`, a - b]; },
      () => { const x = r.int(12, 999) / 10, k = r.pick([10, 100]); return [`${Atlas.fmt(x)} × ${k}`, x * k]; },
      () => { const x = r.int(12, 999), k = r.pick([10, 100]); return [`${x} : ${k}`, x / k]; },
      () => { const a = r.int(1, 9) / 10, b = r.int(1, 9) / 10; return [`${Atlas.fmt(a)} + ${Atlas.fmt(b)}`, Math.round((a + b) * 10) / 10]; },
      () => { const a = r.int(1, 99) / 100; return [`1 − ${Atlas.fmt(a)}`, Math.round((1 - a) * 100) / 100]; },
      () => { const a = r.int(2, 40) * 2; return [`La moitié de ${a}`, a / 2]; },
      () => { const a = r.int(12, 90); return [`Le double de ${a}`, a * 2]; },
      () => { const a = r.int(2, 9) * 10; return [`${a} × 0,5`, a / 2]; },
      () => { const a = r.int(11, 99); return [`${a} × 0,1`, a / 10]; },
      () => { const a = r.int(11, 49); return [`${a} × 11`, a * 11]; },
    ];
    return r.pick(kinds)();
  }
  Atlas.openMental = function (stoneId) {
    const P = Atlas.profile();
    const today = new Date().toISOString().slice(0, 10);
    const paid = P.mental[stoneId] === today;
    const r = makeRng(Atlas.newSeed());
    const pan = UI.panel('🪨 Pierre de défi', { cls: 'mental' });
    let k = 0, good = 0;
    const N = 5;
    const info = h('p', { class: 'consigne', html: paid
      ? "Tu as déjà été récompensé aujourd'hui pour cette pierre : tu peux t'entraîner, sans pièces."
      : `5 calculs de tête. <b>2 pièces</b> par bonne réponse !` });
    const q = h('div', { class: 'mental-q' });
    const prog = h('div', { class: 'mental-prog' });
    pan.body.append(info, prog, q);
    let ans;
    const ask = () => {
      if (k >= N) {
        q.innerHTML = '';
        const gain = paid ? 0 : good * 2;
        q.append(h('p', { class: 'mental-end' }, `${good} / ${N} bonnes réponses.`),
          gain ? h('p', {}, `+${gain} `, h('span', { class: 'coin' })) : null,
          h('button', { class: 'btn btn-go', onclick: () => pan.close() }, 'Terminer'));
        if (!paid) { P.mental[stoneId] = today; Atlas.addCoins(gain); }
        return;
      }
      const [txt, val] = mentalQuestion(r);
      prog.textContent = `Calcul ${k + 1} / ${N}`;
      q.innerHTML = '';
      q.append(h('div', { class: 'mental-calc' }, txt + ' = ?'));
      ans = UI.answer(q, {
        onSubmit: (v) => {
          suivi({ ch: 'mental', comp: 'atlas:calcul-mental', ok: Atlas.near(v, val), rep: `${txt} = ${Atlas.fmt(v)}`, att: Atlas.near(v, val) ? null : Atlas.fmt(val) });
          if (Atlas.near(v, val)) { good++; UI.toast('Juste !', 'good'); }
          else UI.toast(`Non : ${txt} = ${Atlas.fmt(val)}`, 'bad');
          k++;
          ask();
        },
      });
      setTimeout(() => ans.focus(), 50);
    };
    ask();
  };

  /* ================================================================= ATLAS (carte), SACOCHE, MENU */
  // Positions des régions sur la carte de l'Atlas (en % de la largeur/hauteur)
  const MAP_POS = {
    village: [27, 55], gare: [12, 30], tour: [27, 22], port: [42, 30], marche: [10, 55], mine: [44, 55], forge: [14, 80], chantier: [40, 80],
    relais: [58, 12], jardin: [70, 12], boulangerie: [82, 12], auberge: [93, 25], lac: [93, 42], ecluse: [80, 42], enclos: [67, 42],
    bazar: [67, 62], champs: [80, 62], foire: [93, 62], chateau: [86, 84],
  };
  Atlas.openAtlas = function () {
    const P = Atlas.profile();
    const pan = UI.panel(`🗺️ L'Atlas de ${escapeHtml(P.name)} — ${Atlas.pages()} page${Atlas.pages() > 1 ? 's' : ''} sur 18`, { cls: 'atlas' });
    const map = h('div', { class: 'atlas-map' });
    const svg = S.root(map, 100, 100, 'atlas-lines');
    svg.setAttribute('preserveAspectRatio', 'none');
    const chain = ['village', 'gare', 'tour', 'port', 'mine', 'chantier', 'forge', 'marche'];
    ['gare', 'tour', 'port', 'marche', 'mine', 'forge', 'chantier'].forEach((id) => {
      S.el('line', { x1: MAP_POS.village[0], y1: MAP_POS.village[1], x2: MAP_POS[id][0], y2: MAP_POS[id][1], class: 'road' }, svg);
    });
    S.el('line', { x1: MAP_POS.port[0], y1: MAP_POS.port[1], x2: MAP_POS.relais[0], y2: MAP_POS.relais[1], class: 'road gate' }, svg);
    for (let i = 7; i < ORDER.length - 1; i++) {
      const a = MAP_POS[ORDER[i]], b = MAP_POS[ORDER[i + 1]];
      S.el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'road' }, svg);
    }
    void chain;
    const node = (id) => {
      const [x, y] = MAP_POS[id];
      const isV = id === 'village';
      const visited = P.visited.includes(id);
      const unlocked = Atlas.isUnlocked(id);
      const made = isV || !!REG[id];
      const st = isV ? 0 : Atlas.stars(id);
      const page = !isV && Atlas.hasPage(id);
      const here = Atlas.world && Atlas.world.regionId === id;
      const n = h('button', {
        class: `atlas-node${visited ? ' visited' : ''}${unlocked ? '' : ' fog'}${page ? ' page' : ''}${here ? ' here' : ''}`,
        style: `left:${x}%;top:${y}%`,
        onclick: async () => {
          if (here) return pan.close();
          if (!unlocked) return UI.toast(META[id] && META[id][0] === 8 ? 'Cette région s\'ouvre avec les 7 premières pages.' : 'Région encore dans le brouillard.');
          if (!made) return UI.toast('Cette région arrive bientôt !');
          if (!visited) return UI.toast('Va d\'abord la découvrir à pied !');
          pan.close();
          Atlas.world.travel(id);
        },
      },
      h('span', { class: 'atlas-num' }, isV ? '🏠' : unlocked ? String(META[id][0]) : '?'),
      h('span', { class: 'atlas-name' }, isV ? 'Village' : unlocked ? META[id][1] : '???'),
      !isV && unlocked ? h('span', { class: 'atlas-stars' }, '★'.repeat(st) + '☆'.repeat(3 - st)) : null,
      here ? h('span', { class: 'atlas-here' }, '📍') : null);
      return n;
    };
    Object.keys(MAP_POS).forEach((id) => map.append(node(id)));
    map.append(h('div', { class: 'atlas-gate', style: `left:${(MAP_POS.port[0] + MAP_POS.relais[0]) / 2}%;top:${(MAP_POS.port[1] + MAP_POS.relais[1]) / 2}%` },
      Atlas.isUnlocked('relais') ? '🚪' : '🔒'));
    pan.body.append(map, h('p', { class: 'atlas-help' }, 'Touche une région déjà visitée pour t\'y rendre. Les leçons de Pi se revoient dans la sacoche 🎒.'));
  };

  Atlas.openBag = function () {
    const P = Atlas.profile();
    const pan = UI.panel('🎒 Sacoche');
    const tools = Atlas.tools();
    pan.body.append(h('h3', {}, 'Outils'),
      tools.length
        ? h('div', { class: 'bag-tools' }, tools.map((t) => h('div', { class: 'bag-tool' }, h('span', { class: 'bag-icon', html: t.icon || '🔧' }), h('span', {}, t.name))))
        : h('p', { class: 'muted' }, 'Aucun outil pour le moment. Bats le gardien d\'une région pour gagner son outil.'),
      h('h3', {}, 'Revoir une leçon de Pi'),
      h('div', { class: 'bag-lessons' }, ORDER.filter((id) => REG[id] && REG[id].lesson && P.regions[id] && P.regions[id].lesson)
        .map((id) => h('button', { class: 'btn', onclick: () => { pan.close(); Atlas.playLesson(id, { replay: true }); } }, `${META[id][0]}. ${META[id][2]}`))),
      h('p', { class: 'muted' }, `Pièces : ${P.coins}`));
  };

  Atlas.openMenu = function () {
    const P = Atlas.profile();
    const pan = UI.panel('☰ Menu');
    const code = Atlas.exportCode();
    pan.body.append(
      h('p', {}, 'Joueur : ', h('b', {}, P.name)),
      h('h3', {}, 'Code de sauvegarde'),
      h('p', { class: 'muted' }, 'Recopie ce code pour continuer ta partie sur un autre appareil (à la maison ou en classe).'),
      h('div', { class: 'save-code' }, code),
      h('div', { class: 'menu-btns' },
        h('button', { class: 'btn', onclick: () => { pan.close(); Atlas.boot.profiles(); } }, '👤 Changer de joueur'),
        h('button', { class: 'btn', onclick: () => { pan.close(); UI.say(HELP); } }, '❓ Comment jouer'),
        Atlas.world && Atlas.world.setQuality ? h('button', { class: 'btn', onclick: (e) => {
          const low = !Atlas.world.fps.low;
          Atlas.world.setQuality(low);
          e.target.textContent = low ? '🖥️ Graphismes : légers' : '🖥️ Graphismes : beaux';
        } }, Atlas.world.fps.low ? '🖥️ Graphismes : légers' : '🖥️ Graphismes : beaux') : null));
  };
  const HELP = [
    'Pour te déplacer, <b>touche une case</b> : tu y vas tout seul. Au clavier : les flèches ou ZQSD.',
    'Pour parler à quelqu\'un ou utiliser un objet, <b>touche-le</b> (ou Espace quand tu es à côté).',
    'Un <b>!</b> jaune montre une énigme. Une erreur coûte un cœur ; sans cœur, l\'énigme recommence avec d\'autres nombres.',
    'Quand les 3 énigmes d\'une région sont réussies, son <b>gardien</b> t\'attend. Bats-le pour récupérer la page de l\'Atlas.',
  ];

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  Atlas.escape = escapeHtml;

  /* API passée aux habitants et objets des régions */
  Atlas.api = {
    say: (l, d) => UI.say(l, d),
    choose: (t, o, w) => UI.choose(t, o, w),
    toast: (t, k) => UI.toast(t, k),
    get rs() { return Atlas.rs(Atlas.world.regionId); },
    get profile() { return Atlas.profile(); },
    coins: (n) => Atlas.addCoins(n),
    enigme: (key) => Atlas.playEnigme(Atlas.world.regionId, key),
    lesson: () => Atlas.playLesson(Atlas.world.regionId, { replay: true }),
    done: (key) => !!Atlas.rs(Atlas.world.regionId).en[key],
    hasPage: (id) => Atlas.hasPage(id),
    hasTool: (t) => Atlas.hasTool(t),
    refresh: () => Atlas.world.refreshMarkers(),
  };

  /* ================================================================= DÉMARRAGE */
  Atlas.boot = function () {
    UI.init();
    Atlas.boot.profiles();
  };

  Atlas.boot.profiles = function () {
    DB = store.read();
    const old = document.querySelector('.title-screen');
    if (old) old.remove();
    UI.hudEl.hidden = true;
    const scr = h('div', { class: 'title-screen' });
    const list = h('div', { class: 'profile-list' });
    const render = () => {
      list.innerHTML = '';
      DB.profiles.forEach((p) => {
        list.append(h('div', { class: 'profile-row' },
          h('button', { class: 'profile-btn', onclick: () => start(p.id) }, sprite(`hero:${p.hero}:${p.outfit || 0}`, 48),
            h('span', { class: 'profile-name' }, p.name),
            h('span', { class: 'profile-info' }, `📖 ${ORDER.filter((id) => p.regions[id] && p.regions[id].gardien).length}/18`)),
          h('button', { class: 'btn btn-del', title: 'Supprimer', onclick: async () => {
            if (await UI.confirm(`Supprimer la partie de <b>${escapeHtml(p.name)}</b> ? Elle sera perdue (sauf si tu as noté son code).`)) {
              DB.profiles = DB.profiles.filter((q) => q.id !== p.id);
              store.write(DB);
              render();
            }
          } }, '🗑')));
      });
    };
    render();
    scr.append(
      h('div', { class: 'title-box' },
        h('div', { class: 'title-logo' }, sprite('pi', 72), h('div', {}, h('h1', {}, "L'Atlas perdu"), h('p', { class: 'subtitle' }, 'Une aventure mathématique · 6e'))),
        Atlas.allUnlocked ? h('p', { class: 'prof-banner' }, '👩‍🏫 Mode professeur : toutes les régions et tous les gardiens sont ouverts.') : null,
        list,
        h('div', { class: 'title-btns' },
          Atlas.allUnlocked ? h('button', { class: 'btn btn-go', onclick: () => {
            let p = DB.profiles.find((q) => q.prof);
            if (!p) { p = blankProfile('Prof', HEROES[0]); p.prof = true; p.introSeen = true; DB.profiles.push(p); }
            start(p.id);
          } }, '👩‍🏫 Entrer en prof') : null,
          h('button', { class: 'btn btn-go', onclick: () => newProfile() }, '✨ Nouveau joueur'),
          h('button', { class: 'btn', onclick: () => importProfile() }, '🔑 J\'ai un code'))));
    UI.root.append(scr);

    function start(pid) {
      DB.current = pid;
      store.write(DB);
      scr.remove();
      Atlas.startGame();
    }
    function newProfile() {
      const pan = UI.panel('Nouveau joueur');
      let hero = HEROES[0];
      const name = h('input', { class: 'answer-input', maxlength: 14, placeholder: 'Ton pseudo', style: 'width:12em' });
      name.addEventListener('keydown', (e) => e.stopPropagation());
      const heroes = h('div', { class: 'hero-pick' });
      HEROES.forEach((f, i) => {
        const b = h('button', { class: 'hero-btn' + (i === 0 ? ' on' : ''), onclick: () => { hero = f; heroes.querySelectorAll('.hero-btn').forEach((x) => x.classList.remove('on')); b.classList.add('on'); } }, sprite(`hero:${f}:0`, 80));
        heroes.append(b);
      });
      pan.body.append(h('p', {}, 'Choisis ton pseudo (pas ton nom de famille) :'), name, h('p', {}, 'Choisis ton personnage :'), heroes,
        h('button', { class: 'btn btn-go', onclick: () => {
          const n = name.value.trim();
          if (!n) return UI.toast('Écris un pseudo.', 'bad');
          const p = blankProfile(n, hero);
          DB.profiles.push(p);
          pan.close();
          start(p.id);
        } }, 'Commencer l\'aventure ▶'));
      setTimeout(() => name.focus(), 50);
    }
    function importProfile() {
      const pan = UI.panel('Continuer avec un code');
      const name = h('input', { class: 'answer-input', maxlength: 14, placeholder: 'Ton pseudo', style: 'width:12em' });
      const code = h('input', { class: 'answer-input', placeholder: 'XXXXX-XXXXX-…', style: 'width:18em;text-transform:uppercase' });
      [name, code].forEach((i) => i.addEventListener('keydown', (e) => e.stopPropagation()));
      pan.body.append(h('p', {}, 'Ton pseudo :'), name, h('p', {}, 'Ton code de sauvegarde :'), code,
        h('button', { class: 'btn btn-go', onclick: () => {
          const p = Atlas.importCode(code.value, name.value.trim() || 'Joueur');
          if (!p) return UI.toast('Ce code ne marche pas. Vérifie chaque lettre.', 'bad');
          DB.profiles.push(p);
          pan.close();
          start(p.id);
        } }, 'Continuer ▶'));
    }
  };

  Atlas.startGame = function () {
    const P = Atlas.profile();
    const go = (scene) => {
      const at = P.at && P.at.region && (P.at.region === 'village' || REG[P.at.region]) ? P.at : { region: 'village' };
      scene.loadRegion(at.region, at.x != null ? { x: at.x, y: at.y } : null);
      if (!P.introSeen) {
        P.introSeen = true;
        Atlas.save();
        setTimeout(() => UI.say(Atlas.VILLAGE.intro(P)), 500);
      }
    };
    if (!Atlas.world) Atlas.world = new Atlas.World3D(document.getElementById('game'));
    go(Atlas.world);
  };

  window.addEventListener('load', () => Atlas.boot());
})();
