/* =========================================================
   L'ATLAS PERDU · monde en 3D (Three.js) — remplace l'ancien affichage Phaser.
   Les régions restent décrites en cases (map en lettres, props, npcs, objects, exits) : ce fichier les construit
   en maquette 3D low-poly, gère la caméra, le déplacement au doigt / au clavier et les interactions.
   Il fournit aussi Atlas.portrait(token) : un portrait (image) rendu en 3D pour les dialogues et menus.
   Jetons de personnages : 'pi', 'hero', 'hero:<id>:<tenue>', 'dungeon:NN' (habitants, voir NPC_LOOKS),
   ou un objet 'town:NN' / 'rock'. Une région peut aussi donner `look: {...}` à un habitant (voir character()).
   ========================================================= */
import * as THREE from '../lib/three.module.min.js';

const A = window.Atlas;
const UI = A.UI;

/* ---------------------------------------------------------------- Matériaux */
const matCache = new Map();
function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, flatShading: true }, o)));
  return matCache.get(k);
}
const smooth = (c, o = {}) => mat(c, Object.assign({ flatShading: false }, o));
const SKIN = '#ffd8b8';

function mesh(geo, m, x = 0, y = 0, z = 0, parent, shadow = true) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.castShadow = shadow;
  o.receiveShadow = true;
  if (parent) parent.add(o);
  return o;
}

/* ---------------------------------------------------------------- Tenues et héros */
// Tenues achetables chez Mireille (index = n° de tenue, sert au code de sauvegarde).
A.OUTFITS = [
  { name: 'Explorateur', tunic: '#2f5fa8', tunicD: '#24497f', cape: '#b8492e', scarf: '#d9443a', band: '#1c9a8a', price: 0 },
  { name: 'Voyageur', tunic: '#8a5a33', tunicD: '#6b4423', cape: '#5e6b3a', scarf: '#e0a83a', band: '#c0392b', price: 0 },
  { name: 'Braise', tunic: '#b8322a', tunicD: '#8c241f', cape: '#3b3f4a', scarf: '#f2c14e', band: '#f2c14e', price: 0 },
  { name: 'Lagon', tunic: '#1c8a8a', tunicD: '#146b6b', cape: '#d8b878', scarf: '#ff8a5c', band: '#ffffff', price: 0 },
  { name: 'Nuit étoilée', tunic: '#26306b', tunicD: '#1b2350', cape: '#6a3fa0', scarf: '#ffd43b', band: '#ffd43b', price: 20 },
  { name: 'Désert', tunic: '#d9b36b', tunicD: '#b8914d', cape: '#e8743b', scarf: '#ffffff', band: '#e8743b', price: 20 },
  { name: 'Marin', tunic: '#f2f2ee', tunicD: '#d0d0c8', cape: '#1f3a6b', scarf: '#d9443a', band: '#1f3a6b', price: 30 },
  { name: 'Neige', tunic: '#cfe6ff', tunicD: '#a9c8ea', cape: '#ffffff', scarf: '#4dabf7', band: '#4dabf7', price: 30 },
  { name: 'Forgeron', tunic: '#4a3a2c', tunicD: '#33281f', cape: '#1f1f24', scarf: '#ff7b25', band: '#ff7b25', price: 40 },
  { name: 'Royal', tunic: '#9b1c31', tunicD: '#7a1526', cape: '#f2c14e', scarf: '#ffffff', band: '#f2c14e', price: 50 },
  { name: 'Mage', tunic: '#5f3dc4', tunicD: '#4527a0', cape: '#2b1f66', scarf: '#9775fa', band: '#e599f7', price: 60 },
  { name: 'Or', tunic: '#e0b23a', tunicD: '#b88c22', cape: '#ffffff', scarf: '#2f5fa8', band: '#2f5fa8', price: 80 },
];
// Héros de départ (cheveux / coiffure). Les ids sont gardés de l'ancienne version.
A.HERO_LOOKS = {
  85: { name: 'Explorateur blond', hair: '#e9bd5b', style: 'meches' },
  88: { name: 'Explorateur brun', hair: '#5a2d14', style: 'meches' },
  99: { name: 'Exploratrice blonde', hair: '#e9bd5b', style: 'queue' },
  112: { name: 'Exploratrice brune', hair: '#3b2412', style: 'queue' },
};

/* Le héros validé : aventurier élancé, cheveux en mèches, yeux en amande, cape qui enveloppe les épaules. */
function buildHero(lookId = 85, outfitId = 0) {
  const look = A.HERO_LOOKS[lookId] || A.HERO_LOOKS[85];
  const O = A.OUTFITS[outfitId] || A.OUTFITS[0];
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  const tunic = mat(O.tunic), tunicD = mat(O.tunicD), pants = mat('#3b3f4a'), leather = mat('#6b4423'), hairM = mat(look.hair);
  const legs = [-0.1, 0.1].map((x) => {
    const leg = new THREE.Group(); leg.position.set(x, 0.47, 0); inner.add(leg);
    mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.34, 8), pants, 0, -0.17, 0, leg);
    mesh(new THREE.BoxGeometry(0.13, 0.16, 0.2), leather, 0, -0.39, 0.03, leg);
    return leg;
  });
  mesh(new THREE.CylinderGeometry(0.17, 0.21, 0.42, 10), tunic, 0, 0.66, 0, inner);
  mesh(new THREE.CylinderGeometry(0.21, 0.27, 0.16, 10), tunicD, 0, 0.42, 0, inner);
  mesh(new THREE.TorusGeometry(0.2, 0.03, 6, 18), leather, 0, 0.5, 0, inner).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.025, 12), mat('#f4c542', { metalness: 0.6, roughness: 0.3 }), 0, 0.5, 0.21, inner).rotation.x = Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.16, 0.16, 0.08), mat('#8b5a2b'), 0.22, 0.45, 0.06, inner);
  const arms = [-1, 1].map((s) => {
    const arm = new THREE.Group(); arm.position.set(s * 0.23, 0.82, 0); inner.add(arm);
    mesh(new THREE.CapsuleGeometry(0.05, 0.3, 4, 8), tunic, 0, -0.16, 0, arm).rotation.z = s * 0.18;
    mesh(new THREE.SphereGeometry(0.055, 10, 8), smooth(SKIN), s * 0.04, -0.36, 0, arm);
    return arm;
  });
  // cape : un arc qui enveloppe les épaules puis s'évase
  const capeGeo = new THREE.PlaneGeometry(1, 1, 8, 8);
  const pos = capeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i), t = 0.5 - pos.getY(i);
    const r = 0.205 + 0.13 * t * t + 0.02 * t;
    const a = (1.75 - 0.45 * t) * u * 2;
    pos.setXYZ(i, r * Math.sin(a), 0.9 - t * 0.7 - (1 - t) * 0.03 * Math.abs(Math.sin(a)), -r * Math.cos(a) + Math.sin(u * 9 + t * 3) * 0.012 * t);
  }
  capeGeo.computeVertexNormals();
  const cape = mesh(capeGeo, mat(O.cape, { side: THREE.DoubleSide, flatShading: false }), 0, 0, 0, inner);
  mesh(new THREE.TorusGeometry(0.12, 0.05, 8, 16), mat(O.scarf), 0, 0.88, 0, inner).rotation.x = Math.PI / 2;
  // tête
  const head = new THREE.Group(); head.position.y = 1.1; inner.add(head);
  mesh(new THREE.SphereGeometry(0.2, 22, 18), smooth(SKIN), 0, 0, 0, head).scale.set(0.95, 1.12, 0.95);
  mesh(new THREE.ConeGeometry(0.05, 0.1, 10), smooth(SKIN), 0, -0.17, 0.06, head).rotation.x = Math.PI;
  mesh(new THREE.SphereGeometry(0.025, 8, 6), smooth(SKIN), 0, -0.02, 0.19, head);
  [-1, 1].forEach((s) => {
    mesh(new THREE.SphereGeometry(0.048, 14, 10), smooth('#ffffff'), s * 0.075, 0.03, 0.165, head, false).scale.set(1.15, 0.8, 0.45);
    mesh(new THREE.SphereGeometry(0.03, 12, 10), smooth('#2b7a78'), s * 0.073, 0.028, 0.183, head, false).scale.set(1, 1, 0.4);
    mesh(new THREE.SphereGeometry(0.016, 8, 6), smooth('#10131c'), s * 0.073, 0.028, 0.193, head, false).scale.set(1, 1, 0.4);
    mesh(new THREE.SphereGeometry(0.008, 6, 4), smooth('#ffffff', { emissive: '#ffffff' }), s * 0.065, 0.042, 0.199, head, false);
    mesh(new THREE.BoxGeometry(0.07, 0.014, 0.02), mat(shade(look.hair, -0.25)), s * 0.078, 0.092, 0.17, head, false).rotation.z = -s * 0.22;
    mesh(new THREE.SphereGeometry(0.04, 8, 6), smooth(SKIN), s * 0.19, 0, 0, head).scale.set(0.5, 1, 0.8);
  });
  mesh(new THREE.BoxGeometry(0.05, 0.01, 0.01), smooth('#a0523a'), 0, -0.095, 0.175, head, false);
  mesh(new THREE.SphereGeometry(0.215, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hairM, 0, 0.03, -0.02, head).scale.set(1, 1.15, 1.05);
  const locks = [[-0.12, 0.13, 0.12, 0.5, -0.5], [-0.03, 0.16, 0.15, 0.3, -0.7], [0.07, 0.15, 0.14, 0.4, -0.9], [0.15, 0.1, 0.1, 0.6, -1.2], [-0.17, 0.05, 0.06, 0.2, 0.3], [0.0, 0.2, -0.05, -0.3, -0.4], [0.12, 0.18, -0.12, -0.5, -0.8]];
  locks.forEach(([x, y, z, rx, rz]) => { mesh(new THREE.ConeGeometry(0.07, 0.22, 6), hairM, x, y, z, head).rotation.set(rx + 1.2, 0, rz); });
  if (look.style === 'queue') {
    const tail = mesh(new THREE.CapsuleGeometry(0.06, 0.26, 4, 8), hairM, 0, -0.05, -0.24, head);
    tail.rotation.x = 0.35;
    mesh(new THREE.TorusGeometry(0.055, 0.02, 6, 12), mat(O.band), 0, 0.08, -0.2, head).rotation.x = 1.2;
  }
  mesh(new THREE.TorusGeometry(0.205, 0.022, 6, 22), mat(O.band), 0, 0.08, -0.01, head).rotation.x = Math.PI / 2 - 0.25;
  return { g, inner, legs, arms, cape, head };
}

function shade(hex, k) {
  const c = new THREE.Color(hex);
  const hsl = {};
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + k)));
  return '#' + c.getHexString();
}

/* ---------------------------------------------------------------- Habitants */
// Apparences des habitants (les régions gardent leurs anciens jetons 'dungeon:NN').
const NPC_LOOKS = {
  84: { top: '#6a3fa0', bottom: '#4a2a75', hair: '#d9d9d9', style: 'long', hat: 'mage', hatColor: '#4a2a75', beard: '#e9ecef', dress: true },
  85: { top: '#6b8e3a', bottom: '#4a3a2c', hair: '#7a3e1d', style: 'court' },
  86: { top: '#8a5a33', bottom: '#3b3f4a', hair: null, style: 'chauve', beard: '#6b4423', apron: '#d9c7a0' },
  87: { top: '#1f3a6b', bottom: '#1b2a45', hair: '#adb5bd', style: 'court', hat: 'kepi', hatColor: '#1f3a6b', moustache: '#adb5bd', scale: 1.06 },
  88: { top: '#e8743b', bottom: '#3b5b8a', hair: '#5a2d14', style: 'meches', scale: 0.85 },
  96: { top: '#9aa3ad', bottom: '#6b7280', hair: '#8a5a33', style: 'queue', hat: 'casque', hatColor: '#c3c9cf', armor: true },
  97: { top: '#9aa3ad', bottom: '#6b7280', hair: '#3b2412', style: 'court', hat: 'casque', hatColor: '#c3c9cf', armor: true },
  98: { top: '#5a3a1c', bottom: '#33281f', hair: '#f1f3f5', style: 'court', beard: '#f1f3f5', hat: 'beret', hatColor: '#8b1e2e', scale: 1.04 },
  99: { top: '#d6336c', bottom: '#a61e4d', hair: '#a0522d', style: 'longs', dress: true },
  100: { top: '#9c36b5', bottom: '#7a2a8f', hair: '#dee2e6', style: 'chignon', dress: true, shawl: '#f783ac' },
  110: { top: '#c92a2a', bottom: '#5c1a1a', hair: '#3b2412', style: 'court', hat: 'capuche', hatColor: '#c92a2a' },
  111: { top: '#7a5230', bottom: '#4a3a2c', hair: '#c0703a', style: 'court', beard: '#c0703a', scale: 0.82 },
  112: { top: '#2f9e44', bottom: '#4a3a2c', hair: '#212529', style: 'longs', hat: 'bandana', hatColor: '#2f9e44' },
};
A.NPC_LOOKS = NPC_LOOKS;

/* Un habitant : look = {top, bottom, hair, style, hat, hatColor, beard, moustache, dress, apron, shawl, armor, skin, scale} */
function character(look) {
  const L = Object.assign({ top: '#868e96', bottom: '#495057', hair: '#5a2d14', style: 'court', skin: SKIN, scale: 1 }, look);
  const g = new THREE.Group();
  const inner = new THREE.Group(); g.add(inner);
  inner.scale.setScalar(L.scale);
  const top = mat(L.top), bottom = mat(L.bottom), hairM = L.hair ? mat(L.hair) : null, skin = smooth(L.skin);
  if (L.dress) {
    mesh(new THREE.CylinderGeometry(0.17, 0.3, 0.6, 12), bottom, 0, 0.3, 0, inner);
  } else {
    [-0.1, 0.1].forEach((x) => {
      mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.36, 8), bottom, x, 0.26, 0, inner);
      mesh(new THREE.BoxGeometry(0.13, 0.14, 0.19), mat('#4a3020'), x, 0.07, 0.03, inner);
    });
  }
  mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.42, 10), top, 0, 0.66, 0, inner);
  if (L.armor) {
    mesh(new THREE.SphereGeometry(0.21, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('#c3c9cf', { metalness: 0.5, roughness: 0.4 }), 0, 0.72, 0, inner).scale.set(1, 0.8, 1);
  }
  if (L.apron) mesh(new THREE.BoxGeometry(0.28, 0.42, 0.04), mat(L.apron), 0, 0.55, 0.19, inner);
  if (L.shawl) mesh(new THREE.TorusGeometry(0.17, 0.06, 8, 16), mat(L.shawl), 0, 0.84, 0, inner).rotation.x = Math.PI / 2;
  [-1, 1].forEach((s) => {
    mesh(new THREE.CapsuleGeometry(0.05, 0.28, 4, 8), top, s * 0.22, 0.66, 0, inner).rotation.z = s * 0.15;
    mesh(new THREE.SphereGeometry(0.052, 10, 8), skin, s * 0.26, 0.48, 0, inner);
  });
  const head = new THREE.Group(); head.position.y = 1.08; inner.add(head);
  mesh(new THREE.SphereGeometry(0.2, 20, 16), skin, 0, 0, 0, head).scale.set(0.95, 1.1, 0.95);
  mesh(new THREE.ConeGeometry(0.05, 0.1, 10), skin, 0, -0.17, 0.06, head).rotation.x = Math.PI;
  mesh(new THREE.SphereGeometry(0.028, 8, 6), skin, 0, -0.02, 0.19, head);
  [-1, 1].forEach((s) => {
    mesh(new THREE.SphereGeometry(0.042, 12, 8), smooth('#ffffff'), s * 0.073, 0.03, 0.165, head, false).scale.set(1.1, 0.8, 0.45);
    mesh(new THREE.SphereGeometry(0.022, 10, 8), smooth('#3b2a1a'), s * 0.071, 0.028, 0.182, head, false).scale.set(1, 1, 0.4);
    mesh(new THREE.SphereGeometry(0.007, 6, 4), smooth('#ffffff', { emissive: '#ffffff' }), s * 0.064, 0.04, 0.19, head, false);
    mesh(new THREE.BoxGeometry(0.065, 0.014, 0.02), mat(L.hair ? shade(L.hair, -0.2) : '#6b4423'), s * 0.076, 0.09, 0.17, head, false).rotation.z = -s * 0.15;
    mesh(new THREE.SphereGeometry(0.04, 8, 6), skin, s * 0.19, 0, 0, head).scale.set(0.5, 1, 0.8);
  });
  mesh(new THREE.BoxGeometry(0.05, 0.01, 0.01), smooth('#a0523a'), 0, -0.095, 0.175, head, false);
  if (hairM && L.style !== 'chauve') {
    mesh(new THREE.SphereGeometry(0.212, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hairM, 0, 0.03, -0.02, head).scale.set(1, 1.12, 1.05);
    if (L.style === 'meches') [[-0.1, 0.14, 0.12, -0.5], [0.02, 0.17, 0.14, -0.8], [0.13, 0.12, 0.1, -1.1]].forEach(([x, y, z, rz]) => mesh(new THREE.ConeGeometry(0.065, 0.2, 6), hairM, x, y, z, head).rotation.set(1.6, 0, rz));
    if (L.style === 'longs' || L.style === 'long') mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.34, 12, 1, true, Math.PI * 0.6, Math.PI * 0.8), mat(L.hair, { side: THREE.DoubleSide }), 0, -0.1, -0.02, head);
    if (L.style === 'queue') mesh(new THREE.CapsuleGeometry(0.055, 0.22, 4, 8), hairM, 0, -0.05, -0.23, head).rotation.x = 0.35;
    if (L.style === 'chignon') mesh(new THREE.SphereGeometry(0.1, 10, 8), hairM, 0, 0.12, -0.17, head);
  }
  if (L.beard) mesh(new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), mat(L.beard), 0, -0.03, 0.04, head).scale.set(1, 1.2, 1);
  if (L.moustache) [-1, 1].forEach((s) => mesh(new THREE.CapsuleGeometry(0.018, 0.05, 3, 6), mat(L.moustache), s * 0.035, -0.06, 0.18, head).rotation.z = s * 1.2);
  const hc = mat(L.hatColor || '#495057');
  if (L.hat === 'mage') { mesh(new THREE.ConeGeometry(0.2, 0.42, 12), hc, 0, 0.3, -0.02, head).rotation.x = -0.15; mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 16), hc, 0, 0.13, 0, head); }
  if (L.hat === 'kepi') { mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.14, 14), hc, 0, 0.18, 0, head); mesh(new THREE.BoxGeometry(0.22, 0.02, 0.12), mat('#111'), 0, 0.12, 0.2, head); mesh(new THREE.BoxGeometry(0.22, 0.03, 0.02), mat('#f4c542'), 0, 0.18, 0.19, head); }
  if (L.hat === 'casque') mesh(new THREE.SphereGeometry(0.235, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), mat(L.hatColor, { metalness: 0.5, roughness: 0.35 }), 0, 0.03, -0.01, head);
  if (L.hat === 'beret') mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.07, 16), hc, 0.03, 0.19, 0, head).rotation.z = -0.15;
  if (L.hat === 'capuche') mesh(new THREE.SphereGeometry(0.25, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), hc, 0, 0.02, -0.04, head).rotation.x = -0.3;
  if (L.hat === 'bandana') mesh(new THREE.TorusGeometry(0.205, 0.03, 6, 22), hc, 0, 0.08, -0.01, head).rotation.x = Math.PI / 2 - 0.25;
  return { g, inner, head };
}

/* ---------------------------------------------------------------- Pi le hibou */
function buildOwl() {
  const g = new THREE.Group();
  mesh(new THREE.SphereGeometry(0.2, 14, 10), mat('#a0683a'), 0, 0, 0, g).scale.set(1, 1.1, 0.95);
  mesh(new THREE.SphereGeometry(0.13, 12, 8), mat('#e8c99b'), 0, -0.04, 0.1, g);
  [-0.08, 0.08].forEach((x) => {
    mesh(new THREE.SphereGeometry(0.065, 12, 10), smooth('#ffffff'), x, 0.07, 0.15, g, false);
    mesh(new THREE.SphereGeometry(0.035, 10, 8), smooth('#1b1b2f'), x, 0.07, 0.205, g, false);
    mesh(new THREE.SphereGeometry(0.01, 6, 4), smooth('#ffffff', { emissive: '#ffffff' }), x - 0.012, 0.085, 0.235, g, false);
    mesh(new THREE.ConeGeometry(0.04, 0.12, 4), mat('#7a4b24'), x * 1.3, 0.22, 0, g);
  });
  mesh(new THREE.ConeGeometry(0.03, 0.07, 4), mat('#f5a623'), 0, 0, 0.2, g).rotation.x = Math.PI / 2;
  const wings = [-1, 1].map((s) => { const w = mesh(new THREE.SphereGeometry(0.11, 8, 6), mat('#8b5a2b'), s * 0.2, -0.02, -0.02, g); w.scale.set(0.5, 1, 1); return w; });
  return { g, wings };
}

/* ---------------------------------------------------------------- Décor */
function tree(kind, rnd) {
  const g = new THREE.Group();
  const big = 0.85 + rnd() * 0.4;
  if (kind === 'A' || kind === 'a') {
    const col = kind === 'A' ? ['#2b7a3d', '#3a9150'] : ['#c76b28', '#e0893a'];
    mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.5, 6), mat('#7a4b24'), 0, 0.25, 0, g);
    mesh(new THREE.ConeGeometry(0.55 * big, 0.9 * big, 7), mat(col[0]), 0, 0.85 * big, 0, g);
    mesh(new THREE.ConeGeometry(0.4 * big, 0.7 * big, 7), mat(col[1]), 0, 1.3 * big, 0, g);
    return { g, top: g };
  }
  const leaves = kind === 'Y' ? ['#c4532c', '#e07a3a', '#f2a14a'] : ['#2f8a3a', '#47a84a', '#6cc25e'];
  mesh(new THREE.CylinderGeometry(0.12 * big, 0.16 * big, 0.8 * big, 6), mat('#8b5a2b'), 0, 0.4 * big, 0, g);
  const top = new THREE.Group(); top.position.y = 0.8 * big; g.add(top);
  mesh(new THREE.IcosahedronGeometry(0.62 * big, 0), mat(leaves[0]), 0, 0.35 * big, 0, top);
  mesh(new THREE.IcosahedronGeometry(0.48 * big, 0), mat(leaves[1]), -0.12, 0.7 * big, 0.1, top);
  mesh(new THREE.IcosahedronGeometry(0.28 * big, 0), mat(leaves[2]), -0.16, 0.98 * big, 0.12, top);
  g.rotation.y = rnd() * 6;
  return { g, top };
}

/* Toit à deux pans : prisme dont le faîte suit l'axe x, de largeur (profondeur) depth, longueur len, hauteur hh.
   Posé avec sa base à y = 0 (le placer sur le haut des murs). */
function gableRoof(len, depth, hh, m, wallM, wallDepth) {
  const g = new THREE.Group();
  const prism = (hw, h, L, material, inset = 0) => {
    const sh = new THREE.Shape();
    sh.moveTo(-hw, 0); sh.lineTo(hw, 0); sh.lineTo(0, h); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: L, bevelEnabled: false });
    geo.translate(0, 0, -L / 2);
    const o = mesh(geo, material, 0, inset, 0, g);
    o.rotation.y = Math.PI / 2;
    return o;
  };
  // pignons (triangles de mur sous le toit), puis le toit qui déborde
  if (wallM) prism(wallDepth / 2, hh * (wallDepth / 2) / (depth / 2), len - 0.36, wallM);
  const roof = prism(depth / 2, hh, len, m, 0.02);
  // épaisseur du toit : une seconde peau plus sombre juste dessous (bords visibles)
  const under = prism(depth / 2 - 0.02, hh - 0.03, len - 0.02, mat(shade('#' + m.color.getHexString(), -0.18)), -0.05);
  void roof; void under;
  // rangées de tuiles en relief sur chaque pan + poutre de faîte : on lit bien les deux pentes vue d'en haut
  const hw = depth / 2, ang = Math.atan2(hh, hw), slope = Math.hypot(hw, hh);
  const dark = mat(shade('#' + m.color.getHexString(), -0.12)), ridgeM = mat(shade('#' + m.color.getHexString(), -0.28));
  [-1, 1].forEach((side) => {
    for (let k = 1; k <= 4; k++) {
      const f = k / 5;
      const strip = mesh(new THREE.BoxGeometry(len + 0.02, 0.035, slope / 5 * 0.45), k % 2 ? dark : m, 0, f * hh + 0.03, side * hw * (1 - f) + side * 0.02, g, false);
      strip.rotation.x = side * ang;
    }
  });
  mesh(new THREE.BoxGeometry(len + 0.06, 0.09, 0.14), ridgeM, 0, hh + 0.02, 0, g, false);
  return g;
}

function house(kind, w, d) {
  const g = new THREE.Group();
  const W = w - 0.3, D = d - 0.5;
  const red = kind === 'maison_rouge', grey = kind === 'maison_grise';
  const wall = mat(grey ? '#cfd4da' : red ? '#f6e6c4' : '#c9955a');
  const roof = mat(grey ? '#5c6f8a' : red ? '#d9553a' : '#8a5a33');
  mesh(new THREE.BoxGeometry(W, 1.5, D), wall, 0, 0.75, 0, g);
  if (!grey) [-W / 2 + 0.05, 0, W / 2 - 0.05].forEach((x) => mesh(new THREE.BoxGeometry(0.14, 1.52, 0.14), mat('#9a6a3e'), x, 0.76, D / 2, g));
  else mesh(new THREE.BoxGeometry(W + 0.06, 0.25, D + 0.06), mat('#9aa3ad'), 0, 0.12, 0, g);
  mesh(new THREE.BoxGeometry(0.62, 1.0, 0.1), mat('#7a4b24'), w > 2 ? 0.45 : 0, 0.5, D / 2 + 0.03, g);
  mesh(new THREE.SphereGeometry(0.04, 6, 4), mat('#f4c542', { metalness: 0.6 }), (w > 2 ? 0.45 : 0) + 0.2, 0.52, D / 2 + 0.1, g);
  if (w > 2) [-0.75].forEach((x) => {
    mesh(new THREE.BoxGeometry(0.55, 0.45, 0.08), mat('#9fd8ff', { roughness: 0.3 }), x, 0.95, D / 2 + 0.02, g);
    mesh(new THREE.BoxGeometry(0.66, 0.1, 0.18), mat('#7a4b24'), x, 0.68, D / 2 + 0.07, g);
    [-0.15, 0, 0.15].forEach((k, i) => mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(['#f783ac', '#ffd43b', '#ff6b6b'][i]), x + k, 0.77, D / 2 + 0.08, g));
  });
  const roofG = gableRoof(W + 0.36, D + 0.5, 0.55 * D + 0.35, roof, wall, D);
  roofG.position.y = 1.5;
  g.add(roofG);
  mesh(new THREE.BoxGeometry(0.34, 1.3, 0.34), mat('#a39a8f'), W / 2 - 0.5, 2.5, -D * 0.22, g);
  mesh(new THREE.BoxGeometry(0.42, 0.08, 0.42), mat('#7d756b'), W / 2 - 0.5, 3.17, -D * 0.22, g);
  return g;
}

function prop(token, rnd) {
  const g = new THREE.Group();
  switch (token) {
    case 'town:95': // signal ferroviaire
      mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.4, 8), mat('#495057'), 0, 0.7, 0, g);
      mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 18), mat('#e03131'), 0, 1.35, 0.05, g).rotation.x = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.07, 18), mat('#ffffff'), 0, 1.35, 0.06, g).rotation.x = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 12), smooth('#ffd43b', { emissive: '#ffb703', emissiveIntensity: 0.6 }), 0, 1.35, 0.08, g).rotation.x = Math.PI / 2;
      mesh(new THREE.BoxGeometry(0.4, 0.12, 0.4), mat('#868e96'), 0, 0.06, 0, g);
      break;
    case 'town:116': // établi du poseur de rails
      mesh(new THREE.BoxGeometry(0.9, 0.08, 0.5), mat('#b07a43'), 0, 0.55, 0, g);
      [[-0.38, -0.2], [0.38, -0.2], [-0.38, 0.2], [0.38, 0.2]].forEach(([x, z]) => mesh(new THREE.BoxGeometry(0.07, 0.55, 0.07), mat('#7a4b24'), x, 0.27, z, g));
      mesh(new THREE.BoxGeometry(0.5, 0.03, 0.35), mat('#74c0fc', { transparent: true, opacity: 0.85 }), -0.05, 0.6, 0, g).rotation.y = 0.3;
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), mat('#495057'), 0.3, 0.62, 0.05, g).rotation.z = 1.5;
      break;
    case 'town:106': // tas de planches
      for (let k = 0; k < 4; k++) mesh(new THREE.BoxGeometry(0.9, 0.08, 0.16), mat(k % 2 ? '#b07a43' : '#c99358'), 0, 0.06 + k * 0.09, (k % 2 ? 0.04 : -0.04) + (k - 1.5) * 0.02, g).rotation.y = (k % 2 ? 0.06 : -0.04);
      break;
    case 'town:57': // charrette
      mesh(new THREE.BoxGeometry(1.2, 0.4, 0.75), mat('#b07a43'), 0, 0.5, 0, g);
      [[-0.4, 0.4], [0.4, 0.4], [-0.4, -0.4], [0.4, -0.4]].forEach(([x, z]) => { const w = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 12), mat('#5a3a1c'), x, 0.24, z, g); w.rotation.x = Math.PI / 2; });
      ['#e8590c', '#ffd43b', '#82c91e', '#fa5252'].forEach((c, i) => mesh(new THREE.SphereGeometry(0.14, 8, 6), mat(c), -0.4 + i * 0.27, 0.78, 0, g));
      break;
    case 'dungeon:54': // wagonnet
      mesh(new THREE.BoxGeometry(0.8, 0.45, 0.55), mat('#6b7280', { metalness: 0.4, roughness: 0.5 }), 0, 0.45, 0, g);
      mesh(new THREE.BoxGeometry(0.7, 0.05, 0.45), mat('#3b2412'), 0, 0.66, 0, g);
      [[-0.28, 0.28], [0.28, 0.28], [-0.28, -0.28], [0.28, -0.28]].forEach(([x, z]) => { const w = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.06, 12), mat('#343a40'), x, 0.17, z, g); w.rotation.x = Math.PI / 2; });
      break;
    case 'rock': { // pierre de défi : menhir avec rune lumineuse
      const s = mesh(new THREE.DodecahedronGeometry(0.42, 0), mat('#8f969e'), 0, 0.55, 0, g); s.scale.set(0.8, 1.45, 0.6);
      mesh(new THREE.BoxGeometry(0.22, 0.32, 0.02), smooth('#66d9e8', { emissive: '#22b8cf', emissiveIntensity: 0.9 }), 0, 0.62, 0.25, g, false);
      break;
    }
    case 'town:94': // ruche
      mesh(new THREE.SphereGeometry(0.32, 12, 10), mat('#f2c14e'), 0, 0.45, 0, g).scale.set(1, 1.2, 1);
      mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), mat('#7a4b24'), 0, 0.2, -0.25, g);
      break;
    case 'town:107': mesh(new THREE.SphereGeometry(0.28, 10, 8), mat('#d9c7a0'), 0, 0.25, 0, g).scale.set(1, 1.2, 0.9); break;
    case 'town:131': mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.6, 12), mat('#9a6a3e'), 0, 0.3, 0, g); mesh(new THREE.TorusGeometry(0.27, 0.025, 6, 16), mat('#495057'), 0, 0.45, 0, g).rotation.x = Math.PI / 2; break;
    case 'town:83': case 'S':
      mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), mat('#7a4b24'), 0, 0.45, 0, g);
      mesh(new THREE.BoxGeometry(0.7, 0.4, 0.06), mat('#c99358'), 0, 0.85, 0.03, g);
      break;
    case 'town:92': // puits
      mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.5, 14), mat('#9aa3ad'), 0, 0.25, 0, g);
      mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.02, 14), mat('#2f86c4'), 0, 0.45, 0, g);
      [-0.38, 0.38].forEach((x) => mesh(new THREE.BoxGeometry(0.07, 0.8, 0.07), mat('#7a4b24'), x, 0.85, 0, g));
      { const r = gableRoof(1.0, 1.0, 0.45, mat('#d9553a')); r.position.y = 1.22; g.add(r); }
      break;
    default:
      mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), mat('#b07a43'), 0, 0.3, 0, g);
      mesh(new THREE.BoxGeometry(0.62, 0.08, 0.62), mat('#7a4b24'), 0, 0.3, 0, g);
  }
  g.rotation.y = (rnd() - 0.5) * 0.3;
  return g;
}

/* Sprites d'étiquettes (!, ✓, couronne) */
function labelTex(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const col = kind === 'ok' ? ['#2f9e44', '#d3f9d8'] : kind === 'g' ? ['#e67700', '#fff3bf'] : ['#f59f00', '#fff9db'];
  x.fillStyle = 'rgba(0,0,0,0.25)'; x.beginPath(); x.arc(66, 68, 50, 0, 7); x.fill();
  x.fillStyle = col[0]; x.beginPath(); x.arc(64, 62, 50, 0, 7); x.fill();
  x.lineWidth = 8; x.strokeStyle = '#fff'; x.stroke();
  x.fillStyle = col[1];
  x.font = 'bold 72px Trebuchet MS, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(kind === 'ok' ? '✓' : kind === 'g' ? '♛' : '!', 64, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const LABELS = {};
const labelSprite = (kind) => {
  if (!LABELS[kind]) LABELS[kind] = new THREE.SpriteMaterial({ map: labelTex(kind), depthTest: false });
  const s = new THREE.Sprite(LABELS[kind]);
  s.scale.set(0.55, 0.55, 1);
  s.renderOrder = 10;
  return s;
};

/* ---------------------------------------------------------------- Portraits (pour les dialogues) */
let PR = null;
const portraitCache = new Map();
function npcLookFromToken(t) {
  const m = /^dungeon:(\d+)$/.exec(t || '');
  return m ? NPC_LOOKS[Number(m[1])] || null : null;
}
A.portrait = function (token) {
  const P = A.profile && A.profile();
  if (token === 'hero' && P) token = `hero:${P.hero}:${P.outfit || 0}`;
  if (portraitCache.has(token)) return portraitCache.get(token);
  if (!PR) {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setSize(160, 160);
    r.outputColorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Scene();
    s.add(new THREE.HemisphereLight('#fff8e6', '#8a7a60', 1.4));
    const d = new THREE.DirectionalLight('#ffffff', 1.6); d.position.set(1, 2, 3); s.add(d);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    PR = { r, s, cam };
  }
  const holder = new THREE.Group();
  let target = 1.1, dist = 1.25;
  if (token === 'pi') { const o = buildOwl(); o.g.position.y = 1.1; holder.add(o.g); dist = 0.95; }
  else if (token.startsWith('hero:')) { const [, id, out] = token.split(':'); holder.add(buildHero(Number(id), Number(out)).g); }
  else if (token.startsWith('look:')) { const L = JSON.parse(token.slice(5)); holder.add(character(L).g); target = 1.1 * (L.scale || 1); }
  else if (npcLookFromToken(token)) { const c = character(npcLookFromToken(token)); holder.add(c.g); target = 1.1 * (npcLookFromToken(token).scale || 1); }
  else { const p = prop(token === 'town:83' ? 'S' : token, () => 0.5); holder.add(p); target = 0.6; dist = 2.0; }
  PR.s.add(holder);
  PR.cam.position.set(0.25, target + 0.12, dist);
  PR.cam.lookAt(0, target - 0.02, 0);
  PR.r.render(PR.s, PR.cam);
  const url = PR.r.domElement.toDataURL();
  PR.s.remove(holder);
  portraitCache.set(token, url);
  return url;
};
A.clearPortraitCache = (prefix) => { [...portraitCache.keys()].forEach((k) => { if (!prefix || k.startsWith(prefix)) portraitCache.delete(k); }); };

/* jeton de portrait d'un habitant (apparence sur mesure si `look`) */
const whoOf = (n) => (n.look ? 'look:' + JSON.stringify(n.look) : n.t);
A.whoOf = whoOf;

/* ================================================================= LE MONDE */
const WALK = 4.2; // cases par seconde
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const SOLID_DECOR = 'TYAaBFfSLRWkbC';

class World3D {
  constructor(parent) {
    this.parent = parent;
    const lowSaved = (() => { try { return localStorage.getItem('atlas6.quality') === 'low'; } catch (e) { return false; } })();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = !lowSaved;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.pixelRatio = lowSaved ? 1 : Math.min(devicePixelRatio, 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    parent.append(this.renderer.domElement);
    this.renderer.domElement.style.touchAction = 'none';
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
    this.hemi = new THREE.HemisphereLight('#fff8e6', '#5b8a3c', 1.15);
    this.sun = new THREE.DirectionalLight('#fff1d0', 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
    this.sun.shadow.bias = -0.0005;
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.camOff = new THREE.Vector3(0, 11.5, 10);
    this.camLook = new THREE.Vector3();
    this.clock = new THREE.Clock();
    this.keys = {};
    this.fade = Object.assign(document.createElement('div'), { className: 'fade3d' });
    Object.assign(this.fade.style, { position: 'fixed', inset: '0', background: '#14101e', opacity: '0', transition: 'opacity .22s', pointerEvents: 'none', zIndex: 5 });
    document.body.append(this.fade);
    this.fps = { n: 0, t: 0, checked: false, low: lowSaved };
    this.resize();
    addEventListener('resize', () => this.resize());
    this.renderer.domElement.addEventListener('pointerdown', (e) => this.onTap(e));
    addEventListener('keydown', (e) => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      this.keys[k] = true;
      if (UI.busy) return;
      if (k === ' ' || k === 'e' || k === 'enter') { e.preventDefault(); this.actFacing(); }
      if (k === 'm') A.openAtlas();
      if (k.startsWith('arrow')) e.preventDefault();
    });
    addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    addEventListener('blur', () => { this.keys = {}; });
    this.renderer.setAnimationLoop(() => this.tick());
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    // en portrait (téléphone), on recule un peu pour voir autant de cases
    const k = w / h < 0.8 ? 1.35 : 1;
    this.camOff.set(0, 11.5 * k, 10 * k);
    this.camera.updateProjectionMatrix();
  }

  setQuality(low) {
    this.fps.low = low;
    this.renderer.shadowMap.enabled = !low;
    this.pixelRatio = low ? 1 : Math.min(devicePixelRatio, 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    try { localStorage.setItem('atlas6.quality', low ? 'low' : 'high'); } catch (e) { /* */ }
  }

  /* ------------------------------------------------ construction d'une région */
  loadRegion(id, at) {
    const def = id === 'village' ? A.VILLAGE : A.REG[id];
    if (!def) return;
    if (this.root) { this.scene.remove(this.root); this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); }
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.def = def;
    this.regionId = id;
    const map = def.map;
    this.rows = map.length;
    this.cols = map[0].length;
    this.solid = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.things = {};
    this.swayers = [];
    this.waterMeshes = [];
    let seed = 7 + id.length * 131;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const theme = def.theme || {};
    const sky = theme.sky || '#9fd3f5';
    this.scene.background = new THREE.Color(sky);
    this.scene.fog = new THREE.Fog(sky, 24, 46);

    // sol : une instance par case
    const tileGeo = new THREE.BoxGeometry(1, 0.4, 1);
    const groundColor = (c, x, y) => {
      if (c === '=' ) return theme.path || '#ecc98b';
      if (c === ':') return '#b08350';
      if (c === '#') return (x + y) % 2 ? '#b8bec6' : '#a9b0b9';
      if (c === 'g' || c === 'h' || c === 'v' || c === 'x') return '#a7a29a';
      if (c === '_') return '#b07a43';
      if (c === '~') return '#6b5a3a';
      const g = theme.grass || ['#7cc95a', '#78c556', '#83cf60'];
      return g[Math.floor(rnd() * g.length)];
    };
    const tiles = new THREE.InstancedMesh(tileGeo, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), this.rows * this.cols);
    tiles.receiveShadow = true;
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    let n = 0;
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) {
      const c = map[y][x];
      const dy = c === '~' ? -0.45 : c === '=' || c === ':' ? -0.23 : c === '_' ? -0.17 : -0.2;
      m4.makeTranslation(x, dy, y);
      tiles.setMatrixAt(n, m4);
      tiles.setColorAt(n, col.set(groundColor(c, x, y)));
      n++;
    }
    this.root.add(tiles);
    // au-delà de la carte : une prairie et une forêt basse, pour ne jamais voir le vide
    const outer = theme.outside || shade((theme.grass || ['#7cc95a'])[0], -0.08);
    const skirt = mesh(new THREE.PlaneGeometry(this.cols + 60, this.rows + 60), mat(outer), (this.cols - 1) / 2, -0.4, (this.rows - 1) / 2, this.root, false);
    skirt.rotation.x = -Math.PI / 2;
    const ring = [];
    for (let x = -4; x < this.cols + 4; x += 1.3) { ring.push([x + rnd(), -1.5 - rnd() * 2]); ring.push([x + rnd(), this.rows + 0.5 + rnd() * 2.5]); }
    for (let y = -4; y < this.rows + 4; y += 1.3) { ring.push([-1.5 - rnd() * 2, y + rnd()]); ring.push([this.cols + 0.5 + rnd() * 2.5, y + rnd()]); }
    ring.forEach(([x, z]) => { const t = tree(rnd() < 0.3 ? 'A' : rnd() < 0.15 ? 'Y' : 'T', rnd); t.g.position.set(x, -0.2, z); t.g.traverse((o) => { o.castShadow = false; }); this.root.add(t.g); });

    // petites touffes et fleurs (instanciées)
    const tufts = [], flowers = [];
    const rails = [];
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) {
      const c = map[y][x];
      if (c === ',') for (let k = 0; k < 5; k++) tufts.push([x + (rnd() - 0.5) * 0.8, y + (rnd() - 0.5) * 0.8]);
      if (c === '*') for (let k = 0; k < 4; k++) flowers.push([x + (rnd() - 0.5) * 0.7, y + (rnd() - 0.5) * 0.7, ['#f783ac', '#ffd43b', '#ffffff', '#b197fc'][Math.floor(rnd() * 4)]]);
      if (c === '.' && rnd() < 0.18) tufts.push([x + (rnd() - 0.5) * 0.8, y + (rnd() - 0.5) * 0.8]);
      if (c === 'h' || c === 'v') rails.push([x, y, c]);
    }
    if (tufts.length) {
      const im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.045, 0.24, 3), mat(theme.tuft || '#5fae45'), tufts.length);
      tufts.forEach(([x, z], i) => { m4.makeTranslation(x, 0.1, z); im.setMatrixAt(i, m4); });
      this.root.add(im);
    }
    if (flowers.length) {
      const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 6, 4), new THREE.MeshStandardMaterial({ roughness: 0.6 }), flowers.length);
      flowers.forEach(([x, z, c], i) => { m4.makeTranslation(x, 0.07, z); im.setMatrixAt(i, m4); im.setColorAt(i, col.set(c)); });
      this.root.add(im);
    }
    // rails : traverses + 2 rails
    if (rails.length) {
      const sleeper = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 0.06, 0.8), mat('#7a5230'), rails.length * 3);
      const steel = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 0.07, 0.06), mat('#868e96', { metalness: 0.6, roughness: 0.4 }), rails.length * 2);
      let a = 0, b = 0;
      const q = new THREE.Quaternion(), e = new THREE.Euler(), s1 = new THREE.Vector3(1, 1, 1);
      rails.forEach(([x, z, c]) => {
        const rot = c === 'v' ? Math.PI / 2 : 0;
        q.setFromEuler(e.set(0, rot, 0));
        for (let k = -1; k <= 1; k++) {
          const off = k * 0.33;
          m4.compose(new THREE.Vector3(x + (c === 'h' ? off : 0), 0.03, z + (c === 'v' ? off : 0)), q, s1);
          sleeper.setMatrixAt(a++, m4);
        }
        [-0.25, 0.25].forEach((o) => {
          m4.compose(new THREE.Vector3(x + (c === 'v' ? o : 0), 0.09, z + (c === 'h' ? o : 0)), q, s1);
          steel.setMatrixAt(b++, m4);
        });
      });
      sleeper.receiveShadow = true;
      this.root.add(sleeper, steel);
    }

    // eau (un plan par case d'eau, matériau commun animé)
    this.waterMat = this.waterMat || new THREE.MeshStandardMaterial({ color: '#3d9ad8', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 });
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) if (map[y][x] === '~') {
      const w = mesh(new THREE.PlaneGeometry(1.001, 1.001), this.waterMat, x, -0.1, y, this.root, false);
      w.rotation.x = -Math.PI / 2;
      this.solid[y][x] = true;
      this.waterMeshes.push(w);
    }

    // décor posé sur les cases
    for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) {
      const c = map[y][x];
      if (!SOLID_DECOR.includes(c) && c !== 'm') continue;
      if ('TYAa'.includes(c)) { const t = tree(c, rnd); t.g.position.set(x, 0, y); this.root.add(t.g); this.swayers.push({ o: t.top, ph: rnd() * 6 }); }
      else if (c === 'B') { mesh(new THREE.IcosahedronGeometry(0.42, 0), mat('#3f9a3f'), x, 0.3, y, this.root); mesh(new THREE.IcosahedronGeometry(0.3, 0), mat('#5cb85c'), x + 0.2, 0.42, y - 0.1, this.root); }
      else if (c === 'R') mesh(new THREE.DodecahedronGeometry(0.4, 0), mat('#9aa3ad'), x, 0.25, y, this.root).rotation.set(0.3, rnd() * 3, 0.2);
      else if (c === 'm') { mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.14, 6), mat('#f1e3c3'), x + 0.1, 0.07, y, this.root); mesh(new THREE.SphereGeometry(0.1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat('#e03131'), x + 0.1, 0.13, y, this.root); }
      else if (c === 'F' || c === 'f') {
        const g = new THREE.Group(); g.position.set(x, 0, y); if (c === 'f') g.rotation.y = Math.PI / 2; this.root.add(g);
        mesh(new THREE.BoxGeometry(0.1, 0.6, 0.1), mat('#9a6a3e'), 0, 0.3, 0, g);
        [0.42, 0.22].forEach((h) => mesh(new THREE.BoxGeometry(1, 0.08, 0.06), mat('#b07a43'), 0, h, 0, g));
      } else if (c === 'S') { const s = prop('S', rnd); s.position.set(x, 0, y); this.root.add(s); }
      else if (c === 'L') { const l = prop('town:106', rnd); l.position.set(x, 0, y); this.root.add(l); }
      else if (c === 'W') mesh(new THREE.BoxGeometry(1, 1.1, 1), mat('#8f969e'), x, 0.55, y, this.root);
      else if (c === 'k') { const p = prop('town:107', rnd); p.position.set(x, 0, y); this.root.add(p); }
      else if (c === 'b') { const p = prop('town:131', rnd); p.position.set(x, 0, y); this.root.add(p); }
      else if (c === 'C') { const p = prop('town:57', rnd); p.position.set(x, 0, y); this.root.add(p); }
      if (c !== 'm') this.solid[y][x] = true;
      if (c === 'S') this.things[`${x},${y}`] = { kind: 'sign', text: def.signs[`${x},${y}`] || '…' };
    }

    // décor en plusieurs cases (maisons, puits…)
    const STAMP = { maison_rouge: [3, 3], maison_grise: [3, 3], maison_bois: [2, 3], puits: [1, 1], tour: [1, 4], chateau: [4, 3] };
    for (const p of def.props) {
      if (p.stamp) {
        const [w, d] = STAMP[p.stamp] || [1, 1];
        let o;
        if (p.stamp.startsWith('maison')) o = house(p.stamp, w, d);
        else if (p.stamp === 'puits') o = prop('town:92', rnd);
        else if (p.stamp === 'tour') { o = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.45, 0.55, 3.2, 10), mat('#cfd4da'), 0, 1.6, 0, o); mesh(new THREE.ConeGeometry(0.65, 0.9, 10), mat('#5c6f8a'), 0, 3.6, 0, o); mesh(new THREE.BoxGeometry(0.3, 0.4, 0.1), mat('#ffd43b', { emissive: '#ffb703', emissiveIntensity: 0.5 }), 0, 2.6, 0.5, o); }
        else { o = new THREE.Group(); mesh(new THREE.BoxGeometry(w - 0.2, 2.2, d - 0.4), mat('#cfd4da'), 0, 1.1, 0, o); [-1, 1].forEach((s) => { mesh(new THREE.CylinderGeometry(0.5, 0.5, 3, 10), mat('#bfc5cc'), s * (w / 2 - 0.3), 1.5, 0, o); mesh(new THREE.ConeGeometry(0.62, 0.9, 10), mat('#5c6f8a'), s * (w / 2 - 0.3), 3.45, 0, o); }); }
        o.position.set(p.x + (w - 1) / 2, 0, p.y + (d - 1) / 2);
        this.root.add(o);
        for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) if (this.solid[p.y + j]) this.solid[p.y + j][p.x + i] = true;
      } else {
        const o = prop(p.t, rnd);
        o.position.set(p.x, 0, p.y);
        this.root.add(o);
        if (p.solid) this.solid[p.y][p.x] = true;
      }
    }

    // habitants
    this.npcs = [];
    this.pickables = [];
    for (const nDef of def.npcs) {
      if (nDef.when && !nDef.when()) continue;
      const look = nDef.look || npcLookFromToken(nDef.t) || {};
      const c = character(look);
      c.g.position.set(nDef.x, 0, nDef.y);
      c.g.rotation.y = nDef.face != null ? nDef.face : (rnd() - 0.5) * 0.8;
      this.root.add(c.g);
      c.g.traverse((o) => { o.userData.cell = { x: nDef.x, y: nDef.y }; });
      this.pickables.push(c.g);
      this.npcs.push({ def: nDef, c, ph: rnd() * 6 });
      this.solid[nDef.y][nDef.x] = true;
      this.things[`${nDef.x},${nDef.y}`] = { kind: 'npc', ref: nDef, c };
    }
    // objets (énigmes, gardien, pierres…)
    for (const o of def.objects) {
      if (o.when && !o.when()) continue;
      let obj;
      if (o.kind === 'gardien' && npcLookFromToken(o.t)) {
        const c = character(o.look || npcLookFromToken(o.t));
        obj = c.g;
        obj.rotation.y = 0.2;
        this.npcs.push({ def: o, c, ph: rnd() * 6 });
      } else obj = prop(o.t || 'crate', rnd);
      obj.position.set(o.x, 0, o.y);
      this.root.add(obj);
      obj.traverse((m) => { m.userData.cell = { x: o.x, y: o.y }; });
      this.pickables.push(obj);
      if (o.solid !== false) this.solid[o.y][o.x] = true;
      this.things[`${o.x},${o.y}`] = { kind: 'object', ref: o };
    }
    if (def.treasure && !(A.profile().regions[id] || {}).treasure) {
      const tr = def.treasure;
      this.things[`${tr.x},${tr.y}`] = { kind: 'object', ref: { kind: 'tresor', x: tr.x, y: tr.y, hidden: true } };
      this.solid[tr.y][tr.x] = true;
    }
    for (const e of def.exits) {
      this.things[`${e.x},${e.y}`] = { kind: 'exit', ref: e };
      this.solid[e.y][e.x] = false;
    }
    this.refreshMarkers();

    // héros et Pi
    const P = A.profile();
    const start = at || def.spawn;
    this.P = { x: start.x, y: start.y, fx: start.x, fy: start.y, dir: 0, path: [], moving: null, pending: null };
    this.hero = buildHero(P.hero, P.outfit || 0);
    this.hero.g.position.set(start.x, 0, start.y);
    this.root.add(this.hero.g);
    this.owl = buildOwl();
    this.root.add(this.owl.g);
    this.ring = mesh(new THREE.RingGeometry(0.25, 0.36, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 }), 0, 0.03, 0, this.root, false);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.visible = false;
    this.camLook.set(start.x, 0.5, start.y);
    this.fps = Object.assign(this.fps, { n: 0, t: 0, checked: this.fps.checked });

    this.fade.style.opacity = '0';
    P.at = { region: id, x: start.x, y: start.y };
    if (!P.visited.includes(id)) P.visited.push(id);
    A.save();
    UI.hud();
    if (def.onEnter) setTimeout(() => def.onEnter(A.api), 300);
    else if (id !== 'village' && def.lesson && !A.rs(id).lesson) {
      setTimeout(async () => {
        await UI.say([{ who: 'pi', text: `Bienvenue à <b>${def.name}</b> ! Avant de commencer, je t'explique l'essentiel.` }]);
        await A.playLesson(id);
      }, 400);
    }
  }

  setHeroLook() {
    if (!this.hero) return;
    const P = A.profile();
    const old = this.hero.g;
    this.hero = buildHero(P.hero, P.outfit || 0);
    this.hero.g.position.copy(old.position);
    this.hero.g.rotation.copy(old.rotation);
    this.root.remove(old);
    this.root.add(this.hero.g);
    A.clearPortraitCache('hero');
  }

  refreshMarkers() {
    (this.markers || []).forEach((m) => this.root.remove(m));
    this.markers = [];
    const def = this.def;
    const rs = this.regionId === 'village' ? null : A.rs(this.regionId);
    for (const o of def.objects) {
      if (o.when && !o.when()) continue;
      let kind = null;
      if (o.kind === 'enigme') kind = rs.en[o.enigme] ? 'ok' : '!';
      if (o.kind === 'gardien') {
        const ready = Object.keys(def.enigmes).every((k) => rs.en[k]);
        kind = rs.gardien ? 'ok' : ready ? 'g' : null;
      }
      if (!kind) continue;
      const s = labelSprite(kind);
      s.position.set(o.x, o.kind === 'gardien' ? 1.95 : 1.75, o.y);
      s.userData.base = s.position.y;
      this.root.add(s);
      this.markers.push(s);
    }
  }

  walkable(x, y) { return x >= 0 && y >= 0 && x < this.cols && y < this.rows && !this.solid[y][x]; }

  findPath(goals) {
    const key = (x, y) => y * this.cols + x;
    const start = key(this.P.x, this.P.y);
    const goalSet = new Set(goals.map((g) => key(g.x, g.y)));
    if (goalSet.has(start)) return [];
    const prev = new Map([[start, null]]);
    const q = [[this.P.x, this.P.y]];
    while (q.length) {
      const [cx, cy] = q.shift();
      for (const [dx, dy] of DIRS) {
        const nx = cx + dx, ny = cy + dy, k = key(nx, ny);
        if (prev.has(k) || !this.walkable(nx, ny)) continue;
        prev.set(k, key(cx, cy));
        if (goalSet.has(k)) {
          const out = [];
          let c = k;
          while (c !== start) { out.unshift({ x: c % this.cols, y: Math.floor(c / this.cols) }); c = prev.get(c); }
          return out;
        }
        q.push([nx, ny]);
      }
    }
    return null;
  }

  /* ------------------------------------------------ toucher */
  onTap(e) {
    if (UI.busy || !this.hero) return;
    const ptr = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ptr, this.camera);
    let cell = null;
    const hit = ray.intersectObjects(this.pickables, true)[0];
    if (hit && hit.object.userData.cell) cell = hit.object.userData.cell;
    if (!cell) {
      const t = -ray.ray.origin.y / ray.ray.direction.y;
      if (t > 0) {
        const p = ray.ray.origin.clone().addScaledVector(ray.ray.direction, t);
        cell = { x: Math.round(p.x), y: Math.round(p.z) };
      }
    }
    if (!cell || cell.x < 0 || cell.y < 0 || cell.x >= this.cols || cell.y >= this.rows) return;
    const { x, y } = cell;
    const th = this.things[`${x},${y}`];
    if (th && th.kind !== 'exit') {
      if (Math.abs(x - this.P.x) + Math.abs(y - this.P.y) === 1 && !this.P.moving) { this.face(x, y); this.interact(x, y); return; }
      const goals = DIRS.map(([a, b]) => ({ x: x + a, y: y + b })).filter((g) => this.walkable(g.x, g.y));
      const path = this.findPath(goals);
      if (path) { this.P.path = path; this.P.pending = { x, y }; }
      return;
    }
    if (!this.walkable(x, y)) return;
    const path = this.findPath([{ x, y }]);
    if (path) {
      this.P.path = path;
      this.P.pending = null;
      this.ring.position.set(x, 0.03, y);
      this.ring.visible = true;
    }
  }

  face(x, y) { this.P.dir = Math.atan2(x - this.P.x, y - this.P.y); }

  actFacing() {
    if (this.P.moving) return;
    const dx = Math.round(Math.sin(this.P.dir)), dy = Math.round(Math.cos(this.P.dir));
    this.interact(this.P.x + dx, this.P.y + dy);
  }

  /* ------------------------------------------------ boucle */
  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05), t = this.clock.elapsedTime;
    if (!this.hero) { this.renderer.render(this.scene, this.camera); return; }
    const P = this.P;
    // qualité automatique : si c'est lent les premières secondes, on allège
    if (!this.fps.checked) {
      this.fps.n++; this.fps.t += dt;
      if (this.fps.t > 3) {
        this.fps.checked = true;
        if (this.fps.n / this.fps.t < 32 && !this.fps.low) this.setQuality(true);
      }
    }
    if (UI.busy) { P.path = []; P.pending = null; }
    if (!P.moving && !P.path.length && !UI.busy) {
      const K = this.keys;
      const d = K.arrowup || K.z || K.w ? [0, -1] : K.arrowdown || K.s ? [0, 1] : K.arrowleft || K.q || K.a ? [-1, 0] : K.arrowright || K.d ? [1, 0] : null;
      if (d) {
        P.dir = Math.atan2(d[0], d[1]);
        const nx = P.x + d[0], ny = P.y + d[1];
        if (this.walkable(nx, ny)) P.path = [{ x: nx, y: ny }];
      }
    }
    if (!P.moving && P.path.length) { P.moving = P.path.shift(); P.dir = Math.atan2(P.moving.x - P.x, P.moving.y - P.y); }
    if (P.moving) {
      const dx = P.moving.x - P.fx, dy = P.moving.y - P.fy, d = Math.hypot(dx, dy), sp = WALK * dt;
      if (d <= sp) {
        P.fx = P.x = P.moving.x; P.fy = P.y = P.moving.y; P.moving = null;
        const prof = A.profile();
        prof.at = { region: this.regionId, x: P.x, y: P.y };
        const th = this.things[`${P.x},${P.y}`];
        if (th && th.kind === 'exit') { P.path = []; this.ring.visible = false; this.useExit(th.ref); }
        else if (!P.path.length) {
          this.ring.visible = false;
          if (P.pending) { const a = P.pending; P.pending = null; this.face(a.x, a.y); this.interact(a.x, a.y); }
        }
      } else { P.fx += (dx / d) * sp; P.fy += (dy / d) * sp; }
    }
    const walking = !!P.moving;
    const H = this.hero;
    H.g.position.set(P.fx, 0, P.fy);
    let da = P.dir - H.g.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da));
    H.g.rotation.y += da * Math.min(1, dt * 12);
    const sw = walking ? Math.sin(t * 13) : 0;
    H.inner.position.y = walking ? Math.abs(Math.sin(t * 13)) * 0.05 : Math.sin(t * 2) * 0.008;
    H.legs[0].rotation.x = sw * 0.6; H.legs[1].rotation.x = -sw * 0.6;
    H.arms[0].rotation.x = -sw * 0.5; H.arms[1].rotation.x = sw * 0.5;
    H.cape.rotation.x = walking ? -0.12 - Math.abs(sw) * 0.05 : Math.sin(t * 1.5) * 0.02;
    // Pi
    this.owl.g.position.set(P.fx - 0.6, 1.55 + Math.sin(t * 3) * 0.12, P.fy - 0.3);
    this.owl.g.rotation.y = H.g.rotation.y * 0.6;
    this.owl.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * Math.sin(t * 16) * 0.5; });
    // vie du décor
    this.swayers.forEach((s) => { s.o.rotation.z = Math.sin(t * 1.3 + s.ph) * 0.03; });
    this.npcs.forEach((n) => { n.c.inner.position.y = Math.abs(Math.sin(t * 2 + n.ph)) * 0.025; });
    (this.markers || []).forEach((m, i) => { m.position.y = m.userData.base + Math.sin(t * 3 + i) * 0.08; });
    if (this.ring.visible) this.ring.scale.setScalar(1 + Math.sin(t * 6) * 0.1);
    if (this.waterMat) this.waterMat.color.setHSL(0.565, 0.68, 0.44 + Math.sin(t * 1.2) * 0.02);
    // caméra
    this.camLook.lerp(new THREE.Vector3(P.fx, 0.5, P.fy), 1 - Math.pow(0.002, dt));
    this.camera.position.copy(this.camLook).add(this.camOff);
    this.camera.lookAt(this.camLook);
    this.sun.position.set(this.camLook.x - 8, 16, this.camLook.z + 10);
    this.sun.target.position.copy(this.camLook);
    this.renderer.render(this.scene, this.camera);
  }

  /* ------------------------------------------------ sorties et voyages */
  useExit(e) {
    if (!A.isUnlocked(e.to)) {
      UI.say([{ who: 'pi', text: e.lockedText || 'Ce chemin est fermé pour l\'instant. Rassemble les 7 premières pages de l\'Atlas !' }]);
      return;
    }
    if (e.to !== 'village' && !A.REG[e.to]) {
      UI.say([{ who: 'pi', text: `<b>${A.META[e.to] ? A.META[e.to][1] : 'Cette région'}</b> n'est pas encore prête. Elle arrive bientôt !` }]);
      return;
    }
    this.travel(e.to, e.at);
  }

  travel(id, at) {
    this.fade.style.opacity = '1';
    const from = this.regionId;
    setTimeout(() => {
      let spot = at || null;
      if (!spot && id === 'village' && A.VILLAGE.arrive) spot = A.VILLAGE.arrive[from] || null;
      this.loadRegion(id, spot);
    }, 230);
  }

  /* ------------------------------------------------ interactions (identiques à la version 2D) */
  async interact(x, y) {
    const th = this.things[`${x},${y}`];
    if (!th || UI.busy) return;
    const Api = A.api;
    if (th.kind === 'sign') return UI.say([{ who: 'town:83', name: 'Panneau', text: th.text }]);
    if (th.kind === 'npc') {
      const n = th.ref;
      if (th.c) th.c.g.rotation.y = Math.atan2(this.P.x - x, this.P.y - y);
      const out = await n.talk(Api);
      if (Array.isArray(out) || typeof out === 'string') await UI.say(out, { who: whoOf(n), name: n.name });
      this.refreshMarkers();
      return;
    }
    if (th.kind !== 'object') return;
    const o = th.ref, id = this.regionId, def = this.def;
    if (o.kind === 'enigme') {
      const E = def.enigmes[o.enigme];
      const k = await UI.choose(`<b>${E.title}</b><br>${A.rs(id).en[o.enigme] ? 'Déjà réussie ✔ — tu peux la rejouer pour t\'entraîner.' : 'Tu veux essayer ?'}`, ['Allons-y !', 'Plus tard']);
      if (k !== 0) return;
      const ok = await A.playEnigme(id, o.enigme);
      this.refreshMarkers();
      if (ok) await this.afterEnigme();
    } else if (o.kind === 'gardien') {
      const rs = A.rs(id);
      const ready = Object.keys(def.enigmes).every((k) => rs.en[k]);
      if (!ready && !A.allUnlocked) {
        const left = Object.keys(def.enigmes).filter((k) => !rs.en[k]).length;
        await UI.say([{ who: o.t ? whoOf(o) : 'pi', name: o.name || '', text: o.notReady || `Reviens quand tu auras réparé la région : il te reste ${left} énigme${left > 1 ? 's' : ''}.` }]);
        return;
      }
      if (o.intro) await UI.say(o.intro, { who: whoOf(o), name: o.name });
      const had = rs.gardien;
      const ok = await A.playEnigme(id, null, 'gardien');
      this.refreshMarkers();
      if (ok && !had) await this.afterGardien();
    } else if (o.kind === 'tresor') {
      const tr = def.treasure;
      if (!A.hasTool(tr.needs)) {
        await UI.say([{ who: 'pi', text: tr.hint || 'Il y a quelque chose de caché ici… mais il me manque un outil pour le trouver.' }]);
        return;
      }
      if (tr.text) await UI.say([{ who: 'pi', text: tr.text }]);
      const ok = tr.build ? await A.playEnigme(id, null, 'tresor') : (A.rs(id).treasure = true, A.addCoins(10), true);
      if (ok) { UI.toast('💎 Trésor trouvé ! ★', 'good'); delete this.things[`${x},${y}`]; }
    } else if (o.kind === 'mental') {
      A.openMental(`${id}:${o.id || x + '_' + y}`);
    } else if (o.use) {
      await o.use(Api);
      this.refreshMarkers();
    }
  }

  async afterEnigme() {
    const id = this.regionId, def = this.def, rs = A.rs(id);
    const all = Object.keys(def.enigmes).every((k) => rs.en[k]);
    if (all && !rs._announced) {
      rs._announced = true;
      A.save();
      await UI.say([{ who: 'pi', text: 'La région est réparée ! ★<br>Le <b>gardien</b> t\'attend maintenant (la couronne ♛ au-dessus de sa tête). Il rend la page de l\'Atlas.' }]);
    }
  }

  async afterGardien() {
    const id = this.regionId, def = this.def;
    UI.confetti();
    const lines = [{ who: 'pi', text: `Tu as récupéré la <b>page ${A.META[id][0]}</b> de l'Atlas : « ${def.name} » ! 📖` }];
    if (def.tool) lines.push({ who: 'pi', text: `Et tu gagnes un outil : <b>${def.tool.name}</b> ${def.tool.icon || ''}. Il est rangé dans ta sacoche.` });
    if (A.pages() === 7) lines.push({ who: 'pi', text: 'Sept pages ! La <b>Porte des 7 pages</b>, au nord du village, vient de s\'ouvrir…' });
    await UI.say(lines);
    UI.hud();
  }
}

A.World3D = World3D;
A.THREE = THREE;
