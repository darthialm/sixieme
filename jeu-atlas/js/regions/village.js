/* L'Atlas perdu — le Village (point de départ, relié aux régions 1 à 7 et à la Porte des 7 pages). */
(function () {
  'use strict';
  const { h } = Atlas;

  /* Petit outil pour dessiner une carte par rectangles (utilisable par toutes les régions). */
  Atlas.buildMap = function (W, H, draw) {
    const g = Array.from({ length: H }, () => Array(W).fill('.'));
    const api = {
      W, H, g,
      set(x, y, c) { if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = c; },
      get(x, y) { return y >= 0 && y < H && x >= 0 && x < W ? g[y][x] : null; },
      rect(x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) api.set(x, y, c); },
      border(c = 'T') {
        const trees = ['T', 'T', 'Y', 'A', 'T', 'a'];
        for (let x = 0; x < W; x++) { api.set(x, 0, c === 'T' ? trees[(x * 7) % 6] : c); api.set(x, H - 1, c === 'T' ? trees[(x * 5 + 3) % 6] : c); }
        for (let y = 0; y < H; y++) { api.set(0, y, c === 'T' ? trees[(y * 3 + 1) % 6] : c); api.set(W - 1, y, c === 'T' ? trees[(y * 11) % 6] : c); }
      },
      /* parsème c sur les cases d'herbe, à peu près une case sur n */
      sprinkle(c, n, seed = 1) {
        let s = seed;
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
          s = (s * 1103515245 + 12345) & 0x7fffffff;
          if (g[y][x] === '.' && s % n === 0) g[y][x] = c;
        }
      },
    };
    draw(api);
    return g.map((r) => r.join(''));
  };

  const W = 30, H = 20;
  const map = Atlas.buildMap(W, H, (m) => {
    m.border('T');
    m.rect(10, 7, 19, 12, '=');            // place
    m.rect(5, 0, 6, 8, '='); m.rect(5, 7, 10, 8, '=');        // vers la gare (1)
    m.rect(14, 0, 15, 7, '=');                                 // vers la tour (3)
    m.rect(24, 0, 25, 8, '='); m.rect(19, 7, 25, 8, '=');      // Porte des 7 pages
    m.rect(24, 3, 29, 4, '=');                                 // vers le port (6)
    m.rect(0, 9, 10, 10, '=');                                 // vers le marché (2)
    m.rect(19, 9, 29, 10, '=');                                // vers la mine (4)
    m.rect(6, 11, 10, 12, '='); m.rect(6, 12, 7, 19, '=');     // vers la forge (5)
    m.rect(19, 11, 23, 12, '='); m.rect(22, 12, 23, 19, '=');  // vers le chantier (7)
    m.sprinkle('*', 9, 3);
    m.sprinkle(',', 7, 8);
    m.sprinkle('m', 61, 5);
    [[2, 3], [3, 6], [2, 13], [3, 16], [17, 15], [26, 15], [27, 13], [26, 6], [21, 2], [12, 2], [9, 16], [16, 17], [19, 16]].forEach(([x, y], i) => m.set(x, y, ['B', 'A', 'a', 'B', 'T', 'Y', 'B'][i % 7]));
    // panneaux
    m.set(4, 2, 'S'); m.set(13, 2, 'S'); m.set(23, 2, 'S'); m.set(27, 5, 'S'); m.set(2, 8, 'S'); m.set(27, 11, 'S'); m.set(5, 15, 'S'); m.set(24, 15, 'S');
  });

  const signs = {
    '4,2': '↑ <b>1. La Gare du Brouillard</b><br>Parallèles et perpendiculaires',
    '13,2': '↑ <b>3. La Tour du Guetteur</b><br>Distances et cercles',
    '23,2': '↑ <b>La Porte des 7 pages</b><br>Vers le reste du royaume',
    '27,5': '→ <b>6. Le Port des Voiles</b><br>Angles',
    '2,8': '← <b>2. Le Marché aux Cristaux</b><br>Nombres entiers et décimaux',
    '27,11': '→ <b>4. La Mine aux Graduations</b><br>Nombres entiers et décimaux',
    '5,15': '↓ <b>5. La Forge aux Machines</b><br>Addition, soustraction, multiplication',
    '24,15': '↓ <b>7. Le Chantier des Charpentiers</b><br>Triangles',
  };

  const exits = [];
  const ex = (cells, to) => cells.forEach(([x, y]) => exits.push({ x, y, to }));
  ex([[5, 0], [6, 0]], 'gare');
  ex([[14, 0], [15, 0]], 'tour');
  ex([[24, 0], [25, 0]], 'relais');
  ex([[29, 3], [29, 4]], 'port');
  ex([[0, 9], [0, 10]], 'marche');
  ex([[29, 9], [29, 10]], 'mine');
  ex([[6, 19], [7, 19]], 'forge');
  ex([[22, 19], [23, 19]], 'chantier');
  exits.forEach((e) => { if (e.to === 'relais') e.lockedText = 'La <b>Porte des 7 pages</b> est fermée. Elle s\'ouvrira quand tu auras rassemblé les pages des régions 1 à 7.'; });

  /* La marchande : tenues pour le héros (jamais de réponses à vendre). */
  async function shop(A) {
    const P = A.profile;
    if (!Array.isArray(P.outfits) || typeof P.outfits[0] !== 'number' || P.outfits[0] > 20) P.outfits = [0, 1, 2, 3];
    const pan = Atlas.UI.panel('🧺 La charrette de Mireille');
    const render = () => {
      pan.body.innerHTML = '';
      pan.body.append(h('p', { class: 'consigne' }, 'Des tenues pour ton aventurier ! Tu as ', h('b', {}, String(P.coins)), ' ', h('span', { class: 'coin' }), '.'));
      const grid = h('div', { class: 'hero-pick' });
      Atlas.OUTFITS.forEach((O, i) => {
        const owned = P.outfits.includes(i);
        const worn = (P.outfit || 0) === i;
        grid.append(h('button', {
          class: 'hero-btn' + (worn ? ' on' : ''),
          onclick: () => {
            if (worn) return;
            if (!owned) {
              if (P.coins < O.price) return Atlas.UI.toast(`Il te faut ${O.price} pièces.`, 'bad');
              P.coins -= O.price;
              P.outfits.push(i);
              Atlas.UI.toast('Nouvelle tenue !', 'good');
            }
            P.outfit = i;
            Atlas.save();
            Atlas.UI.hud();
            if (Atlas.world && Atlas.world.setHeroLook) Atlas.world.setHeroLook();
            render();
          },
        }, Atlas.sprite(`hero:${P.hero}:${i}`, 80),
        h('div', { style: 'font-weight:700;font-size:14px' }, O.name),
        h('div', { style: 'font-size:13px' }, worn ? 'Portée' : owned ? 'Mettre' : `${O.price} pièces`)));
      });
      pan.body.append(grid, h('p', { class: 'muted' }, 'Gagne des pièces avec les énigmes, les gardiens et les pierres de défi.'));
    };
    render();
  }

  Atlas.VILLAGE = {
    id: 'village',
    name: 'Le Village',
    map,
    spawn: { x: 13, y: 13 },
    signs,
    exits,
    arrive: {
      gare: { x: 5, y: 1 }, tour: { x: 14, y: 1 }, relais: { x: 24, y: 1 }, port: { x: 28, y: 4 },
      marche: { x: 1, y: 9 }, mine: { x: 28, y: 9 }, forge: { x: 6, y: 18 }, chantier: { x: 22, y: 18 },
    },
    props: [
      { x: 8, y: 2, stamp: 'maison_rouge' },
      { x: 17, y: 2, stamp: 'maison_grise' },
      { x: 11, y: 14, stamp: 'maison_bois' },
      { x: 14, y: 9, stamp: 'puits' },
      { x: 16, y: 16, t: 'town:94', solid: true },
    ],
    npcs: [
      {
        id: 'mireille', x: 18, y: 8, t: 'dungeon:100', name: 'Mireille, la marchande',
        talk: async (A) => {
          await A.say([{ who: 'dungeon:100', name: 'Mireille', text: 'Bonjour mon petit ! Regarde ma charrette, j\'ai de jolies tenues. Ça se paie en pièces, bien sûr !' }]);
          await shop(A);
        },
      },
      {
        id: 'maire', x: 11, y: 11, t: 'dungeon:98', name: 'Le maire Hubert',
        talk: (A) => {
          const n = Atlas.pages();
          if (n === 0) return ['Ah, notre apprenti cartographe ! Les sept chemins autour du village mènent aux régions les plus abîmées.', 'Va où tu veux, dans l\'ordre que tu veux. Chaque page rapportée nous sauve un peu plus !'];
          if (n < 7) return [`Déjà ${n} page${n > 1 ? 's' : ''} sur 7 ! Le village respire mieux.`, 'Quand tu auras les 7 premières pages, la Porte du nord s\'ouvrira.'];
          return ['Les 7 pages ! La Porte du nord est ouverte. Le reste du royaume t\'attend, mon ami.'];
        },
      },
      {
        id: 'garde', x: 26, y: 1, t: 'dungeon:96', name: 'Gardienne de la Porte',
        talk: () => Atlas.isUnlocked('relais')
          ? ['La Porte est ouverte. Bon voyage, cartographe !']
          : [`Halte ! La Porte des 7 pages ne s'ouvre qu'avec les pages des régions 1 à 7. Tu en as ${Atlas.ORDER.slice(0, 7).filter((r) => Atlas.hasPage(r)).length}.`],
      },
      {
        id: 'enfant', x: 21, y: 13, t: 'dungeon:88', name: 'Léo',
        talk: () => ['Tu as vu les pierres grises ? Si tu réussis leurs calculs, elles donnent des pièces !', 'Une fois par jour seulement… mais on peut toujours s\'entraîner.'],
      },
    ],
    objects: [
      { id: 'pierre1', x: 12, y: 7, t: 'rock', kind: 'mental' },
      { id: 'pierre2', x: 3, y: 11, t: 'rock', kind: 'mental' },
      { id: 'pierre3', x: 25, y: 13, t: 'rock', kind: 'mental' },
    ],
    intro: (P) => [
      { who: 'pi', text: `Bonjour ${Atlas.escape(P.name)} ! Moi, c'est <b>Pi</b>, le hibou du royaume d'Orthogone.` },
      { who: 'pi', text: 'Cette nuit, une tempête a déchiré <b>l\'Atlas</b>, le grand livre où tout était mesuré et tracé. Ses pages se sont envolées partout !' },
      { who: 'pi', text: 'Sans elles, plus rien ne tombe juste : les rails se croisent, les ponts sont trop courts… Il faut réparer chaque région avec les maths pour retrouver sa page.' },
      { who: 'pi', text: 'Sept chemins partent du village. Choisis celui que tu veux ! Touche une case pour te déplacer, et touche les gens pour leur parler.' },
    ],
  };
})();
