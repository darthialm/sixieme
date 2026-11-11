'use strict';
/* =========================================================
   QUESTIONS ★ (plus difficiles) des types qui n'en avaient pas.
   Ce fichier se charge après chapitres-p2.js. Les fonctions d'origine ne sont pas modifiées :
   sans ★, elles tirent exactement les mêmes questions. C'est indispensable, car les sujets
   papier et les pages des étiquettes QR sont recalculés à partir d'une graine.
   Une fois qu'un contrôle papier utilise une version ★, ne plus la modifier (le tirage changerait) :
   pour ajouter des questions, créer un nouveau type d'exercice.
   ========================================================= */
(function () {
  const fd = (m, k) => fmt(m / 10 ** k);
  /** question à une réponse numérique */
  const ask = ({ st, fig = '', pre = '', ans, unit = '', label = 'Résultat', msg, hints, remed = null, expr = null }) => ({
    _ans: ans, _expr: expr, hints,
    remediate(r) { const x = val(r); if (!x || eq(x.value, ans) || !remed) return null; return remed(x.value); },
    q: `<p class="statement">${st}</p>${fig}<p class="big">${pre}${inp('num', label)}${unit ? ' ' + unit : ''}</p>`,
    check(r) { const x = val(r); if (!x) return null; const ok = eq(x.value, ans); markInput(r, 0, ok); return { ok, msg }; },
  });
  const trueFalse = (st, truth, why, hints) => withRemed(withHints(mcq(`<p class="statement">${st}</p>`, ['Vrai', 'Faux'], truth ? 0 : 1, why, { keepOrder: true }), hints), () => 'Cherche un exemple : essaie avec des nombres ou fais un petit dessin.');
  const checks = (st, pool, n, explain, remed) => {
    const trues = shuffle(pool.filter((x) => x.ok)), falses = shuffle(pool.filter((x) => !x.ok));
    const nt = Math.min(trues.length, Math.max(1, rand(1, n - 1)));
    return multiQ(st, shuffle([...trues.slice(0, nt), ...falses.slice(0, n - nt)]), explain, remed || ((_k, it) => `${it.html} : ${it.why || 'relis cette écriture attentivement.'}`), { col: true });
  };

  /* ---------- Chapitre 5 : opérations ---------- */
  function opVocH() {
    const b = rand(2, 9), c = rand(2, 9), d = rand(2, 9), big = rand(30, 70), small = rand(3, 12);
    const f = pick([
      () => ({ t: `la somme de ${big} et du produit de ${b} par ${c}`, e: `${big} + (${b} × ${c})`, s: `${big} + ${b * c}`, v: big + b * c, nat: 2, bad: [`(${big} + ${b}) × ${c}`, `${big} × (${b} + ${c})`] }),
      () => ({ t: `le produit de ${small} par la somme de ${b} et de ${c}`, e: `${small} × (${b} + ${c})`, s: `${small} × ${b + c}`, v: small * (b + c), nat: 0, bad: [`(${small} × ${b}) + ${c}`, `${small} + (${b} × ${c})`] }),
      () => ({ t: `la différence de ${big} et de la somme de ${b} et de ${c}`, e: `${big} − (${b} + ${c})`, s: `${big} − ${b + c}`, v: big - b - c, nat: 1, bad: [`(${big} − ${b}) + ${c}`, `${big} + (${b} − ${c})`] }),
      () => ({ t: `le produit de la différence de ${big} et de ${b} par ${c}`, e: `(${big} − ${b}) × ${c}`, s: `${big - b} × ${c}`, v: (big - b) * c, nat: 0, bad: [`${big} − (${b} × ${c})`, `(${big} × ${c}) − ${b}`] }),
      () => ({ t: `la somme du produit de ${small} par ${b} et du produit de ${c} par ${d}`, e: `(${small} × ${b}) + (${c} × ${d})`, s: `${small * b} + ${c * d}`, v: small * b + c * d, nat: 2, bad: [`${small} × (${b} + ${c}) × ${d}`, `(${small} + ${b}) × (${c} + ${d})`] }),
    ])();
    const hints = [`Relis le tableau du vocabulaire dans ${ficheLink('operations')}.`, 'Outil : lis la phrase depuis le début. Le premier mot (somme, différence, produit) donne l\'opération faite <b>en dernier</b>.'];
    const mode = rand(0, 2);
    if (mode === 0) return ask({ st: `Calcule <b>${f.t}</b>.`, ans: f.v, hints, msg: `Cela s'écrit ${f.e} = ${f.s} = <b>${fmt(f.v)}</b>.` });
    if (mode === 1) return withHints(mcq(`<p class="statement">Quel calcul correspond à la phrase : « ${f.t} » ?</p>`, [f.e, ...f.bad], 0, `Le premier mot donne l'opération faite en dernier. La phrase s'écrit <b>${f.e}</b>.`, { col: true }), hints);
    const opts = ['un produit', 'une différence', 'une somme'];
    return withHints(mcq(`<p class="statement">Le calcul <b>${f.e}</b> est…</p>`, opts, f.nat, `On regarde l'opération faite <b>en dernier</b>, quand les parenthèses sont calculées : ${f.s}. C'est <b>${opts[f.nat]}</b>.`, { keepOrder: true }), hints);
  }

  function opGaucheH() {
    const name = pick(['A', 'B', 'C', 'D']), hints = [`Relis la règle 1 dans ${ficheLink('operations')}.`, 'Outil : réécris le calcul à chaque étape en ne faisant que la première opération.'];
    const mode = rand(0, 2);
    if (mode === 2) {
      const b = rand(9, 25), c = rand(3, 8), a = rand(b + c + 5, 70), who = pick(['Noa', 'Sacha', 'Camille', 'Alix']);
      const opts = [`${who} a tort : on calcule d'abord ${a} − ${b}, et le résultat est ${a - b + c}.`, `${who} a raison : le résultat est ${a - b - c}.`, `${who} a tort : le résultat est ${a + b + c}.`];
      return withHints(mcq(`<p class="statement">${who} écrit : ${a} − ${b} + ${c} = ${a} − ${b + c} = ${a - b - c}. Que penses-tu de ce calcul ?</p>`, opts, 0, `Avec seulement des + et des −, on calcule de gauche à droite : ${a} − ${b} = ${a - b}, puis ${a - b} + ${c} = <b>${a - b + c}</b>.`, { col: true }), hints);
    }
    const k = mode === 1 ? 1 : 0, sc = 10 ** k, n = mode === 1 ? 4 : 5;
    for (;;) {
      const nums = [rand(40, 95) * sc + (k ? rand(1, 9) : 0)], ops = [];
      for (let i = 1; i < n; i++) { nums.push(k ? rand(11, 95) : rand(4, 32)); ops.push(pick(['+', '−'])); }
      if (!ops.includes('−') || !ops.includes('+')) continue;
      let cur = nums[0], okRun = true; const lines = [];
      const tail = (i) => nums.slice(i + 1).map((x, j) => ` ${ops[i + j]} ${fd(x, k)}`).join('');
      for (let i = 1; i < n; i++) { cur = ops[i - 1] === '+' ? cur + nums[i] : cur - nums[i]; if (cur < 0) okRun = false; lines.push(`${fd(cur, k)}${tail(i)}`); }
      if (!okRun) continue;
      const expr = nums.map((x, i) => (i ? ` ${ops[i - 1]} ` : '') + fd(x, k)).join(''), ans = cur / sc;
      lines[lines.length - 1] = `<b>${fd(cur, k)}</b>`;
      return ask({ st: 'Calcule en respectant la règle. Écris chaque étape sur ton cahier.', pre: `${name} = ${expr} = `, ans, hints, expr, msg: `De gauche à droite :${stepsHTML(name, [expr, ...lines])}` });
    }
  }

  function opParH() {
    const name = pick(['A', 'B', 'C', 'D', 'E']);
    const f = pick([
      () => { const b = rand(3, 12), a = rand(b + 2, 25), c = rand(2, 6), d = rand(2, 5); return { expr: `(${a} − ${b}) × (${c} + ${d})`, s: [`${a - b} × ${c + d}`], ans: (a - b) * (c + d) }; },
      () => { const e = rand(2, 8), d = rand(e + 2, 15), c = rand(4, 12), b = rand(4, 15), a = rand(b + c + d, 90); return { expr: `${a} − (${b} + ${c}) − (${d} − ${e})`, s: [`${a} − ${b + c} − ${d - e}`, `${a - b - c} − ${d - e}`], ans: a - b - c - d + e }; },
      () => { const d = rand(3, 9), c = rand(d + 3, d + 12), b = rand(4, 20), a = rand(10, 40); return { expr: `(${a} + ${b}) − (${c} − ${d})`, s: [`${a + b} − ${c - d}`], ans: a + b - c + d }; },
      () => { const a = rand(1, 8) * 10 + 5, b = rand(1, 7) * 10 + 5, c = rand(2, 6); return { expr: `(${fd(a, 1)} + ${fd(b, 1)}) × ${c}`, s: [`${fd(a + b, 1)} × ${c}`], ans: (a + b) * c / 10 }; },
      () => { const b = rand(1, 9) * 100 + 25, c = rand(1, 9) * 10 + 5, a = rand(20, 60); return { expr: `${a} − (${fd(b, 2)} + ${fd(c, 1)})`, s: [`${a} − ${fd(b + c * 10, 2)}`], ans: (a * 100 - b - c * 10) / 100 }; },
    ])();
    return ask({ st: 'Calcule en respectant les règles. Écris chaque étape sur ton cahier.', pre: `${name} = ${f.expr} = `, ans: f.ans, expr: f.expr,
      hints: [`Relis la règle 2 dans ${ficheLink('operations')}.`, 'Outil : calcule d\'abord <b>toutes</b> les parenthèses, puis ce qui reste.'],
      msg: `Les parenthèses d'abord :${stepsHTML(name, [f.expr, ...f.s, `<b>${fmt(f.ans)}</b>`])}` });
  }

  function opPar2H() {
    const name = pick(['A', 'B', 'D', 'E']);
    const f = pick([
      () => { const d = rand(2, 9), e = rand(2, 9), c = rand(d + e + 3, 35), b = rand(c + 3, 80), a = rand(b + 5, 150); const i1 = d + e, i2 = c - i1, i3 = b - i2; return { expr: `${a} − (${b} − (${c} − (${d} + ${e})))`, s: [`${a} − (${b} − (${c} − ${i1}))`, `${a} − (${b} − ${i2})`, `${a} − ${i3}`], ans: a - i3 }; },
      () => { const c = rand(3, 8), d = rand(2, 6), b = rand(c + d + 2, 25), e = rand(2, 6), g = rand(e + 2, 10); const i1 = c + d, i2 = b - i1; return { expr: `(${b} − (${c} + ${d})) × (${g} − ${e})`, s: [`(${b} − ${i1}) × ${g - e}`, `${i2} × ${g - e}`], ans: i2 * (g - e) }; },
      () => { const d = rand(1, 5), c = rand(1, 6) * 10 + 5, b = c + d * 10 + rand(2, 12) * 10 + 5, a = rand(Math.ceil(b / 10) + 2, 40); const i1 = c + d * 10, i2 = b - i1; return { expr: `${a} − (${fd(b, 1)} − (${fd(c, 1)} + ${d}))`, s: [`${a} − (${fd(b, 1)} − ${fd(i1, 1)})`, `${a} − ${fd(i2, 1)}`], ans: (a * 10 - i2) / 10 }; },
      () => { const e = rand(2, 5), d = rand(e + 1, 9), c = rand(2, 5), b = rand(2, 9), a = rand(2, 4); const i1 = d - e, i2 = c * i1, i3 = b + i2; return { expr: `${a} × (${b} + (${c} × (${d} − ${e})))`, s: [`${a} × (${b} + (${c} × ${i1}))`, `${a} × (${b} + ${i2})`, `${a} × ${i3}`], ans: a * i3 }; },
    ])();
    return ask({ st: 'Calcule en écrivant les étapes sur ton cahier.', pre: `${name} = ${f.expr} = `, ans: f.ans, expr: f.expr,
      hints: [`Relis la règle 3 dans ${ficheLink('operations')}.`, 'Outil : cherche les parenthèses qui ne contiennent pas d\'autres parenthèses, puis recommence à chaque ligne.'],
      msg: `Les parenthèses les plus intérieures d'abord :${stepsHTML(name, [f.expr, ...f.s, `<b>${fmt(f.ans)}</b>`])}` });
  }

  function opPbH() {
    const who = pick(['Léa', 'Tom', 'Inès', 'Noah', 'Jade', 'Yanis', 'Emma', 'Lucas']);
    const f = pick([
      () => { const n = rand(2, 3), m = rand(2, 4), p = 5 * rand(160, 240), q = 5 * rand(90, 150), r = 5 * rand(90, 240); const t1 = n * p, t2 = m * q, tot = t1 + t2 + r, b = tot < 5000 ? 5000 : 10000;
        return { st: `Au cinéma, une famille prend ${n} places adulte à ${eur(p)} et ${m} places enfant à ${eur(q)}, puis du pop-corn à ${eur(r)}. Elle paie avec un billet de ${eur(b)}. Combien lui rend-on ?`, ans: (b - tot) / 100, unit: '€', w: [`Adultes : ${n} × ${e2(p)} = ${eur(t1)}`, `Enfants : ${m} × ${e2(q)} = ${eur(t2)}`, `Total : ${e2(t1)} + ${e2(t2)} + ${e2(r)} = ${eur(tot)}`, `Monnaie : ${e2(b)} − ${e2(tot)} = ${eur(b - tot)}`], fin: `On rend <b>${eur(b - tot)}</b> à la famille.` }; },
      () => { const u = 5 * rand(29, 45), n = 10, red = 5 * rand(30, 90), c = n * u - red;
        return { st: `Un ticket de bus coûte ${eur(u)}. Un carnet de ${n} tickets coûte ${eur(c)}. Combien économise-t-on en achetant le carnet plutôt que ${n} tickets à l'unité ?`, ans: red / 100, unit: '€', w: [`${n} tickets à l'unité : ${n} × ${e2(u)} = ${eur(n * u)}`, `Économie : ${e2(n * u)} − ${e2(c)} = ${eur(red)}`], fin: `On économise <b>${eur(red)}</b>.` }; },
      () => { const d1 = rand(320, 1590), d2 = rand(150, 980), res = rand(500, 3000), tot = d1 + d2 + res;
        return { st: `${who} dépense ${eur(d1)}, puis ${eur(d2)}. Il reste alors ${eur(res)} dans sa tirelire. Combien y avait-il dans la tirelire au départ ?`, ans: tot / 100, unit: '€', w: [`Dépenses : ${e2(d1)} + ${e2(d2)} = ${eur(d1 + d2)}`, `Au départ : ${e2(res)} + ${e2(d1 + d2)} = ${eur(tot)}`], fin: `Il y avait <b>${eur(tot)}</b> au départ.` }; },
      () => { const t = rand(3, 5), l = 5 * rand(35, 70), x = 10 * rand(8, 25), goal = 100 * rand(Math.ceil((t * l + x) / 100) + 1, Math.ceil((t * l + x) / 100) + 4), done = t * l + x;
        return { st: `Pour préparer une course de ${fd(goal, 2)} km, ${who} fait ${t} tours d'un parcours de ${fd(l, 2)} km, puis court encore ${fd(x, 2)} km. Combien de kilomètres manque-t-il pour atteindre ${fd(goal, 2)} km ?`, ans: (goal - done) / 100, unit: 'km', w: [`Tours : ${t} × ${fd(l, 2)} = ${fd(t * l, 2)} km`, `Distance courue : ${fd(t * l, 2)} + ${fd(x, 2)} = ${fd(done, 2)} km`, `Reste : ${fd(goal, 2)} − ${fd(done, 2)} = ${fd(goal - done, 2)} km`], fin: `Il manque <b>${fd(goal - done, 2)} km</b>.` }; },
      () => { const v = 5 * rand(15, 40), n = rand(4, 8), b = 5 * rand(30, 90), c = rand(3, 6), one = v + n * b;
        return { st: `Une caisse vide pèse ${fd(v, 2)} kg. On y range ${n} boîtes de ${fd(b, 2)} kg chacune. Quelle est la masse totale de ${c} caisses remplies de la même façon ?`, ans: c * one / 100, unit: 'kg', w: [`Boîtes d'une caisse : ${n} × ${fd(b, 2)} = ${fd(n * b, 2)} kg`, `Une caisse remplie : ${fd(v, 2)} + ${fd(n * b, 2)} = ${fd(one, 2)} kg`, `${c} caisses : ${c} × ${fd(one, 2)} = ${fd(c * one, 2)} kg`], fin: `La masse totale est <b>${fd(c * one, 2)} kg</b>.` }; },
    ])();
    return ask({ st: f.st, ans: f.ans, unit: f.unit, label: 'Réponse',
      hints: ['Lis l\'énoncé deux fois. Qu\'est-ce qu\'on cherche à la fin ? Que faut-il calculer avant ?', 'Outil : sur ton cahier, écris une petite question pour chaque étape, et le calcul qui y répond.', 'À l\'évaluation, écris chaque calcul et termine par une phrase réponse.'],
      msg: `<ul class="fb-list">${f.w.map((x) => `<li>${x}</li>`).join('')}</ul>${f.fin}` });
  }

  /* ---------- Chapitre 6 : angles ---------- */
  const named = (fn) => { const v = pick(['A', 'B', 'K', 'M', 'O', 'S']), rest = shuffle(['C', 'D', 'E', 'F', 'G', 'H', 'L', 'N', 'P', 'R', 'T'].filter((x) => x !== v)); return fn(v, rest); };

  function angNomH() {
    const hints = [`Relis « Définition et notation » dans ${ficheLink('angles')}.`, 'Outil : le sommet s\'écrit au milieu. Deux points situés sur le même côté donnent des angles de même mesure.'];
    return named((nV, [P1n, P2n, Qn, Rn]) => {
      if (Math.random() < 0.3) {
        const same = Math.random() < 0.5;
        const o = mcq(`<p class="statement">${same ? `Les points ${P1n} et ${P2n} sont sur la demi-droite [${nV}${Qn}).` : `Le point ${nV} est sur le segment [${P1n}${P2n}] et l'angle ${angN(P1n + nV + Rn)} est aigu.`} Les angles ${angN(P1n + nV + Rn)} et ${angN(P2n + nV + Rn)} ont-ils la même mesure ?</p>`, ['Oui', 'Non', 'On ne peut pas savoir'], same ? 0 : 1,
          same ? `${P1n} et ${P2n} sont sur le même côté de l'angle de sommet ${nV} : les deux angles ont <b>la même mesure</b> (ce sont deux noms de l'angle de sommet ${nV}).` : `${P1n} et ${P2n} sont de part et d'autre de ${nV} : ensemble, les deux angles forment un angle plat (180°). L'un est aigu, donc l'autre est obtus : ils n'ont <b>pas la même mesure</b>.`, { keepOrder: true });
        return withHints(o, hints);
      }
      const a1 = rand(-20, 10), a2 = a1 + rand(48, 65), a3 = a2 + rand(42, 58), V = { x: 0, y: 0 };
      const u = polar(a1), v = polar(a2), w = polar(a3), L = 3.9;
      const fig = figure({ [nV]: V, [P1n]: G.mul(u, 1.9), [P2n]: G.mul(u, 3.4), [Qn]: G.mul(v, 3.3), [Rn]: G.mul(w, 3.3) }, [F2.seg(V, G.mul(u, L)), F2.seg(V, G.mul(v, L)), F2.seg(V, G.mul(w, L)), arcMark(V, u, v, 0.8, 'f-arcm f-arc-red')],
        { marks: { [nV]: 'none', [P1n]: { dash: u }, [P2n]: { dash: u }, [Qn]: { dash: v }, [Rn]: { dash: w } }, extra: [G.mul(u, L), G.mul(v, L), G.mul(w, L), { x: -1, y: 1 }], pad: 0.7, center: G.mul(G.norm(G.add(u, w)), -2) });
      const items = shuffle([{ html: angN(P1n + nV + Qn), ok: true }, { html: angN(Qn + nV + P2n), ok: true }, { html: angN(P1n + nV + Rn), ok: false, why: `cet angle a pour côtés [${nV}${P1n}) et [${nV}${Rn}) : il est plus grand que l'angle rouge.` }, { html: angN(nV + P1n + Qn), ok: false, why: 'le sommet doit être au milieu du nom.' }, { html: angN(P2n + P1n + Qn), ok: false, why: `le sommet de l'angle rouge est ${nV}.` }]);
      return withHints(multiQ(`<p>Coche <b>tous</b> les noms possibles de l'angle marqué en rouge.</p>${fig}`, items, `Le sommet est ${nV}. Un côté passe par ${P1n} et ${P2n}, l'autre par ${Qn}. On peut écrire ${angN(P1n + nV + Qn)}, ${angN(Qn + nV + P1n)}, ${angN(P2n + nV + Qn)} ou ${angN(Qn + nV + P2n)}.`, (_k, it) => `${it.html} : ${it.why}`), hints);
    });
  }

  function angNatureH() {
    const hints = [`Relis le tableau « Nature d'un angle » dans ${ficheLink('angles')}.`, 'Outil : aigu → moins de 90° ; droit → 90° ; obtus → entre 90° et 180° ; plat → 180°.'];
    if (Math.random() < 0.45) {
      const kind = pick([0, 2]), name = ['aigus', 'droits', 'obtus'][kind], ms = shuffle([89, 91, 90, 180, 179, rand(1, 20), rand(120, 170), rand(45, 80)]).slice(0, 6);
      if (!ms.some((m) => natOf(m) === kind)) ms[0] = kind === 0 ? 89 : 91;
      const items = ms.map((m) => ({ html: deg(m), ok: natOf(m) === kind, why: `${deg(m)} : cet angle est ${NATS[natOf(m)]}.` }));
      return withHints(multiQ(`<p class="statement">Coche <b>tous</b> les angles <b>${name}</b>.</p>`, items, ms.map((m) => `${deg(m)} : ${NATS[natOf(m)]}`).join(' ; ') + '.', (_k, it) => it.why), hints);
    }
    const f = pick([
      () => { const x = rand(12, 78); return { t: `Un angle est <b>supplémentaire</b> d'un angle de ${deg(x)}`, m: 180 - x, w: `180° − ${deg(x)} = ${deg(180 - x)}` }; },
      () => { const x = rand(100, 170); return { t: `Un angle est <b>supplémentaire</b> d'un angle de ${deg(x)}`, m: 180 - x, w: `180° − ${deg(x)} = ${deg(180 - x)}` }; },
      () => { const x = rand(12, 78); return { t: `Un angle est <b>complémentaire</b> d'un angle de ${deg(x)}`, m: 90 - x, w: `90° − ${deg(x)} = ${deg(90 - x)}` }; },
      () => { const x = pick([45, 90, rand(50, 85), rand(15, 40)]); return { t: `Un angle mesure <b>le double</b> de ${deg(x)}`, m: 2 * x, w: `2 × ${deg(x)} = ${deg(2 * x)}` }; },
      () => { const x = 2 * rand(46, 89); return { t: `Une bissectrice partage un angle de ${deg(x)} en deux. On regarde l'un des deux angles obtenus`, m: x / 2, w: `${deg(x)} : 2 = ${deg(x / 2)}` }; },
    ])();
    const n = natOf(f.m);
    return withHints(mcq(`<p class="statement">${f.t}. Quelle est sa nature ?</p>`, NATS.map(cap), n, `${f.w} : l'angle est <b>${NATS[n]}</b>.`, { keepOrder: true }), hints);
  }

  function angMesureH() {
    const ns = pickNames3(), beta = rand(-20, 20), b = polar(beta), n = polar(beta + 90), V = { x: 0, y: 0 }, L = 4.3;
    const dirAt = (t) => G.add(G.mul(b, Math.cos((t * Math.PI) / 180)), G.mul(n, Math.sin((t * Math.PI) / 180)));
    const scene = (s1, s2) => figure({ [ns[1]]: V, [ns[0]]: G.mul(s1, L - 0.3), [ns[2]]: G.mul(s2, L - 0.3) }, [protractorDraw(V, b, n, 3.1), F2.seg(V, G.mul(s1, L), 'f-seg f-thick'), F2.seg(V, G.mul(s2, L), 'f-seg f-thick')],
      { marks: { [ns[1]]: 'none', [ns[0]]: { dash: s1 }, [ns[2]]: { dash: s2 } }, extra: [G.mul(b, 3.6), G.mul(b, -3.6), G.mul(n, 3.5), G.mul(n, -0.6)], pad: 0.6, center: G.mul(n, -2), cls: 'p2-protfig' });
    const nm = angN(ns.join(''));
    if (Math.random() < 0.5) {
      // aucun côté sur le 0 : on fait la différence des deux lectures
      const t1 = 10 * rand(1, 6), t2 = t1 + 5 * rand(6, 18), m = t2 - t1;
      return ask({ st: `Attention : <b>aucun côté</b> de l'angle ${nm} n'est sur le 0 du rapporteur. Quelle est sa mesure ?`, fig: scene(dirAt(t1), dirAt(t2)), pre: `${nm} = `, ans: m, unit: '°', label: 'Mesure',
        hints: [`Relis « Utiliser le rapporteur » dans ${ficheLink('angles')}.`, 'Outil : lis les deux côtés sur la <b>même</b> graduation, puis calcule l\'écart entre les deux nombres.'],
        remed: (x) => (eq(x, t1) || eq(x, t2) ? 'Tu as lu un seul côté. L\'angle est l\'écart entre les deux côtés.' : null),
        msg: `Sur la même graduation, on lit ${deg(t1)} et ${deg(t2)}. L'angle mesure ${deg(t2)} − ${deg(t1)} = <b>${deg(m)}</b>.` });
    }
    // le 0 est sur la graduation intérieure, et l'angle est proche d'un angle droit
    const m = pick([75, 80, 85, 95, 100, 105, 5 * rand(4, 32)]);
    return ask({ st: `Lis la mesure de l'angle ${nm} sur le rapporteur.`, fig: scene(G.mul(b, -1), dirAt(180 - m)), pre: `${nm} = `, ans: m, unit: '°', label: 'Mesure',
      hints: [`Relis « Utiliser le rapporteur » dans ${ficheLink('angles')}.`, `Outil : le côté [${ns[1]}${ns[0]}) est sur le 0 de quelle graduation ? Suis celle-là.`],
      remed: (x) => (eq(x, 180 - m) ? `Tu as lu la mauvaise graduation. Suis celle qui part de <b>0</b> sur le côté [${ns[1]}${ns[0]}).` : null),
      msg: `Le 0° est sur [${ns[1]}${ns[0]}) (graduation intérieure). On lit <b>${deg(m)}</b> sur [${ns[1]}${ns[2]}).` });
  }

  function angCalculH() {
    const hints = [`Relis le tableau « Relations entre deux angles » dans ${ficheLink('angles')}.`, 'Outil : un angle plat vaut 180°, un angle droit vaut 90°. Enlève ce que tu connais déjà.'];
    const v = rand(0, 4);
    if (v <= 1) {
      const flat = v === 0, a0 = rand(-12, 12), tot = flat ? 180 : 90;
      const x = flat ? rand(30, 65) : rand(20, 33), y = flat ? rand(30, 65) : rand(20, 33), ans = tot - x - y, O = { x: 0, y: 0 }, L = 3.6;
      const [A, B, C, D] = shuffle(['A', 'B', 'C', 'D', 'E', 'F', 'R', 'S'].slice()).slice(0, 4), d = (t) => polar(a0 + t);
      const items = [F2.seg(O, G.mul(d(0), L)), F2.seg(O, G.mul(d(x), L)), F2.seg(O, G.mul(d(x + y), L)), F2.seg(O, G.mul(d(tot), L)), arcMark(O, d(0), d(x), 0.7, 'f-arcm f-arc-red'), arcMark(O, d(x), d(x + y), 0.85, 'f-arcm f-arc-red'), arcMark(O, d(x + y), d(tot), 1, 'f-arcm f-arc-blue'), arcLabel(O, d(0), d(x), `${x}°`, 1.75), arcLabel(O, d(x), d(x + y), `${y}°`, 1.75), arcLabel(O, d(x + y), d(tot), '?', 1.75, 'f-len f-blue-t')];
      if (!flat) items.push(F2.right(O, d(0), d(90), 0.32));
      const fig = figure({ O, [A]: G.mul(d(0), L - 0.4), [B]: G.mul(d(x), L - 0.4), [C]: G.mul(d(x + y), L - 0.4), [D]: G.mul(d(tot), L - 0.4) }, items, { marks: { O: 'none', [A]: { dash: d(0) }, [B]: { dash: d(x) }, [C]: { dash: d(x + y) }, [D]: { dash: d(tot) } }, extra: [G.mul(d(0), L), G.mul(d(tot), L), { x: 0, y: 0.8 }], pad: 0.6, center: G.mul(d(tot / 2), -3) });
      const askN = angN(C + 'O' + D);
      return ask({ st: flat ? `Les points ${A}, O et ${D} sont alignés. Calcule l'angle ${askN}.` : `L'angle ${angN(A + 'O' + D)} est droit. Calcule l'angle ${askN}.`, fig, pre: `${askN} = `, ans, unit: '°', label: 'Mesure', hints,
        remed: (r) => (eq(r, tot - x) || eq(r, tot - y) ? `Il faut enlever <b>les deux</b> angles connus de ${tot}°.` : eq(r, (flat ? 90 : 180) - x - y) ? `Regarde bien : ici, le total vaut ${tot}°.` : null),
        msg: `${deg(x)} + ${deg(y)} = ${deg(x + y)}. Le total vaut ${tot}°, donc ${askN} = ${tot}° − ${deg(x + y)} = <b>${deg(ans)}</b>.` });
    }
    if (v === 2) {
      const x = rand(12, 78), c = 90 - x, s = 180 - c;
      return ask({ st: `Un angle mesure ${deg(x)}. Combien mesure le <b>supplémentaire de son complémentaire</b> ?`, ans: s, unit: '°', label: 'Mesure', hints: [...hints, 'Outil : commence par le complémentaire, puis cherche le supplémentaire de ce résultat.'],
        msg: `Complémentaire : 90° − ${deg(x)} = ${deg(c)}. Supplémentaire de ${deg(c)} : 180° − ${deg(c)} = <b>${deg(s)}</b>.` });
    }
    if (v === 3) {
      const x = 2 * rand(15, 75), rest = 180 - x, h = rest / 2;
      return ask({ st: `A, O et B sont alignés, avec O entre A et B. On a ${angN('AOC')} = ${deg(x)}. La demi-droite [OD) est la bissectrice de l'angle ${angN('COB')}. Calcule ${angN('COD')}.`, pre: `${angN('COD')} = `, ans: h, unit: '°', label: 'Mesure', hints: [...hints, 'Outil : fais un dessin à main levée. Calcule d\'abord l\'angle COB.'],
        remed: (r) => (eq(r, rest) ? 'C\'est la mesure de l\'angle COB entier. La bissectrice le partage en deux.' : null),
        msg: `${angN('AOB')} est plat : ${angN('COB')} = 180° − ${deg(x)} = ${deg(rest)}. La bissectrice le partage en deux : ${deg(rest)} : 2 = <b>${deg(h)}</b>.` });
    }
    const names = pick([['E', 'F', 'G', 'H'], ['A', 'B', 'C', 'D'], ['R', 'S', 'T', 'U']]), [nE, nF, nG, nH] = names, x = rand(30, 150), { fig } = crossFig(names, rand(-20, 20), x);
    const asks = [{ n: `${nF}O${nH}`, v: x }, { n: `${nE}O${nH}`, v: 180 - x }, { n: `${nF}O${nG}`, v: 180 - x }];
    return {
      hints,
      _vals: asks.map((a) => a.v),
      q: `<p>Les droites (${nE}${nF}) et (${nG}${nH}) se coupent en O, et ${angN(nE + 'O' + nG)} = ${deg(x)}. Calcule les trois autres angles.</p>${fig}<div class="form-lines">${asks.map((a) => `<div class="form-line">${angN(a.n)} = ${inp('num', 'Mesure')} °</div>`).join('')}</div>`,
      check(r) {
        const vs = asks.map((_, i) => val(r, i)); if (vs.some((y) => !y)) return null;
        let ok = true; asks.forEach((a, i) => { const g = eq(vs[i].value, a.v); markInput(r, i, g); ok = ok && g; });
        return { ok, msg: `${angN(asks[0].n)} est opposé par le sommet à ${angN(nE + 'O' + nG)} : <b>${deg(x)}</b>. Les deux autres forment un angle plat avec lui : 180° − ${deg(x)} = <b>${deg(180 - x)}</b>.` };
      },
    };
  }

  function angRecoH() {
    const hints = [`Relis le tableau « Relations entre deux angles » dans ${ficheLink('angles')}.`, 'Outil : vérifie dans l\'ordre : même sommet ? un côté commun ? de part et d\'autre de ce côté ?'];
    const opts3 = ['adjacents', 'opposés par le sommet', 'ni adjacents, ni opposés par le sommet'];
    const v = rand(0, 3);
    if (v === 0) {
      const names = pick([['E', 'F', 'G', 'H'], ['A', 'B', 'C', 'D'], ['R', 'S', 'T', 'U']]), [nE, nF, nG, nH] = names, { fig } = crossFig(names, rand(-20, 20), rand(40, 140));
      const p = pick([{ a: nE + 'O' + nG, b: nF + 'O' + nH, g: 1, w: 'les côtés de l\'un prolongent les côtés de l\'autre' }, { a: nG + 'O' + nE, b: nE + 'O' + nH, g: 0, w: `ils ont le même sommet et le côté commun [O${nE}), et ils sont de part et d'autre de ce côté` }, { a: nE + 'O' + nH, b: nG + 'O' + nF, g: 1, w: 'les côtés de l\'un prolongent les côtés de l\'autre' }, { a: nG + 'O' + nF, b: nF + 'O' + nH, g: 0, w: `ils ont le même sommet et le côté commun [O${nF}), et ils sont de part et d'autre de ce côté` }]);
      return withHints(mcq(`<p>Les angles ${angN(p.a)} et ${angN(p.b)} sont…</p>${fig}`, opts3, p.g, `${cap(p.w)} : ils sont <b>${opts3[p.g]}</b>.`, { keepOrder: true }), hints);
    }
    if (v === 1) {
      return named((nV, [A, B, C]) => {
        const a1 = rand(-15, 15), a2 = a1 + rand(35, 50), a3 = a2 + rand(35, 50), u = polar(a1), w = polar(a2), t = polar(a3), V = { x: 0, y: 0 }, L = 3.6;
        const fig = figure({ [nV]: V, [A]: G.mul(u, L - 0.4), [B]: G.mul(w, L - 0.4), [C]: G.mul(t, L - 0.4) }, [F2.seg(V, G.mul(u, L)), F2.seg(V, G.mul(w, L)), F2.seg(V, G.mul(t, L))], { marks: { [nV]: 'none', [A]: { dash: u }, [B]: { dash: w }, [C]: { dash: t } }, extra: [G.mul(u, L), G.mul(t, L), { x: -0.8, y: 0.8 }], pad: 0.6, center: G.mul(w, -3) });
        const adj = Math.random() < 0.5;
        return withHints(mcq(`<p>Les angles ${angN(A + nV + B)} et ${angN(adj ? B + nV + C : A + nV + C)} sont…</p>${fig}`, opts3, adj ? 0 : 2, adj ? `Même sommet ${nV}, côté commun [${nV}${B}), et de part et d'autre de ce côté : ils sont <b>adjacents</b>.` : `Ils ont le côté commun [${nV}${A}), mais l'un est à l'intérieur de l'autre : ils ne sont <b>ni adjacents, ni opposés par le sommet</b>.`, { keepOrder: true }), hints);
      });
    }
    if (v === 2) {
      const kind = rand(0, 2), x = rand(15, 75) + 0.5, y = kind === 0 ? 90 - x : kind === 1 ? 180 - x : pick([179 - x, 91 - x]);
      const opts = ['complémentaires', 'supplémentaires', 'ni complémentaires, ni supplémentaires'], sum = x + y;
      return withHints(mcq(`<p class="statement">Deux angles mesurent ${deg(x)} et ${deg(y)}. Ils sont…</p>`, opts, kind, `${deg(x)} + ${deg(y)} = ${deg(sum)} : ils sont <b>${opts[kind]}</b>.`, { keepOrder: true }), ['Outil : additionne les deux mesures, sans oublier les chiffres après la virgule.', 'Complémentaires → 90° ; supplémentaires → 180°.']);
    }
    const s = pick([
      ['Deux angles opposés par le sommet ont toujours la même mesure.', true, 'C\'est la propriété des angles opposés par le sommet.'],
      ['Deux angles de même mesure sont toujours opposés par le sommet.', false, 'Deux angles peuvent avoir la même mesure n\'importe où sur une figure.'],
      ['Deux angles adjacents ont toujours la même mesure.', false, 'Être adjacents parle de leur position, pas de leur mesure.'],
      ['Deux angles complémentaires sont forcément tous les deux aigus.', true, 'Leur somme vaut 90° : chacun mesure moins de 90°.'],
      ['Deux angles supplémentaires peuvent être tous les deux obtus.', false, 'Deux angles obtus dépassent 180° à eux deux.'],
      ['Deux angles supplémentaires peuvent être tous les deux droits.', true, '90° + 90° = 180°.'],
      ['Deux angles supplémentaires sont forcément adjacents.', false, 'Supplémentaires parle de leur somme : ils peuvent être éloignés sur la figure.'],
    ]);
    return trueFalse(s[0], s[1], `<b>${s[1] ? 'Vrai' : 'Faux'}.</b> ${s[2]}`, hints);
  }

  /* ---------- Chapitre 7 : triangles ---------- */
  function triVocH() {
    const ns = pickNames3(), [a, b, c] = ns, hints = [`Relis « Définition et vocabulaire » dans ${ficheLink('triangles')}.`, 'Outil : fais un dessin à main levée. Le côté opposé à un sommet est en face de lui.'];
    const v = rand(0, 3);
    if (v === 0) {
      const k = rand(1, 3), total = ((k + 2) * (k + 1)) / 2, names = ['D', 'E', 'F'], A = { x: 2.6, y: -3.6 }, B = { x: 0, y: 0 }, C = { x: 6.5, y: 0 };
      const pts = { A, B, C }, extra = [];
      for (let i = 0; i < k; i++) { const P = { x: (6.5 * (i + 1)) / (k + 1), y: 0 }; pts[names[i]] = P; extra.push(F2.seg(A, P)); }
      const opts = [...new Set([total, total + 1, total - 1, k + 1, k + 2, 2 * (k + 1)])].filter((x) => x > 0).slice(0, 4);
      return withHints(mcq(`<p>Combien de <b>triangles</b> peux-tu compter sur cette figure ?</p>${triFig(pts, extra)}`, opts.map(String), 0, `Chaque triangle a pour sommet A et pour côté opposé un segment de la base. Avec ${k + 2} points sur la base, il y a <b>${total}</b> segments, donc ${total} triangles.`), ['Outil : compte les petits triangles, puis ceux formés de plusieurs petits.', 'Outil : un triangle a toujours A pour sommet. Combien de segments peux-tu choisir sur la base ?']);
    }
    if (v === 1) {
      const o = [`[${b}${c}]`, `[${a}${b}]`, `[${a}${c}]`];
      return withHints(mcq(`<p class="statement">${ns.join('')} est un triangle <b>isocèle en ${a}</b>. Quelle est sa <b>base</b> ?</p>`, o, 0, `Le sommet principal est ${a}. La base est le côté opposé : <b>[${b}${c}]</b>.`), hints);
    }
    if (v === 2) {
      const o = [`[${a}${c}]`, `[${a}${b}]`, `[${b}${c}]`];
      return withHints(mcq(`<p class="statement">${ns.join('')} est un triangle <b>rectangle en ${b}</b> (sans figure). Quelle est son hypoténuse ?</p>`, o, 0, `L'hypoténuse est le côté opposé à l'angle droit, donc opposé à ${b} : <b>[${a}${c}]</b>.`), hints);
    }
    const o = [angN(a + b + c), angN(b + a + c), angN(a + c + b)];
    return withHints(mcq(`<p class="statement">Dans le triangle ${ns.join('')}, quel angle est <b>opposé au côté [${a}${c}]</b> ?</p>`, o, 0, `L'angle opposé à [${a}${c}] a pour sommet le point qui n'est pas sur ce côté, ${b} : c'est ${o[0]}.`), hints);
  }

  function triNatureH() {
    const ns = pickNames3(), [a, b, c] = ns, nm = ns.join(''), v = rand(0, 2);
    const hints = [`Relis les définitions des triangles particuliers dans ${ficheLink('triangles')}.`, 'Outil : fais un dessin à main levée et code ce que tu sais.'];
    const opts = (good) => [good, ...shuffle([`isocèle en ${a}`, `isocèle en ${b}`, `isocèle en ${c}`, 'équilatéral', 'quelconque', `rectangle en ${a}`, `rectangle isocèle en ${a}`].filter((x) => x !== good)).slice(0, 3)];
    if (v === 0) {
      const kind = rand(0, 3), x = rand(40, 75) / 10;
      let y; do { y = rand(25, 90) / 10; } while (eq(y, x) || y >= 2 * x);
      // z : un troisième côté différent, qui permet bien de construire le triangle
      let z; do { z = rand(25, 90) / 10; } while (eq(z, x) || eq(z, y) || z >= x + y || x >= y + z || y >= x + z);
      const L = kind === 0 ? [x, x, y] : kind === 1 ? [y, x, x] : kind === 2 ? [x, x, x] : [x, y, z];
      // L = [ab, ac, bc]
      const good = kind === 0 ? `isocèle en ${a}` : kind === 1 ? `isocèle en ${c}` : kind === 2 ? 'équilatéral' : 'quelconque';
      const why = kind === 2 ? 'les trois côtés ont la même longueur' : kind === 3 ? 'les trois côtés ont des longueurs différentes' : `les deux côtés égaux partent de ${kind === 0 ? a : c}`;
      return withHints(mcq(`<p class="statement">Dans le triangle ${nm} : ${a}${b} = ${cm(L[0])}, ${a}${c} = ${cm(L[1])} et ${b}${c} = ${cm(L[2])}. Ce triangle est…</p>`, opts(good), 0, `Ici, ${why} : ${nm} est <b>${good}</b>.`), hints);
    }
    if (v === 1) {
      const kind = rand(0, 2), x = rand(25, 70);
      const data = [
        { t: `${a}${b} = ${a}${c} et l'angle ${angN(b + a + c)} est droit`, g: `rectangle isocèle en ${a}`, w: 'deux côtés égaux qui partent de ' + a + ', et un angle droit en ' + a },
        { t: `${a}${b} = ${a}${c} et ${angN(b + a + c)} = 60°`, g: 'équilatéral', w: `isocèle avec un angle de 60° : les deux autres angles valent (180° − 60°) : 2 = 60°` },
        { t: `${angN(a)} = ${deg(x)} et ${angN(b)} = ${deg(90 - x)}`, g: `rectangle en ${c}`, w: `${deg(x)} + ${deg(90 - x)} = 90°, donc ${angN(c)} = 180° − 90° = 90°` },
      ][kind];
      const list = kind === 2 ? [data.g, `rectangle en ${a}`, `isocèle en ${c}`, 'quelconque'] : opts(data.g);
      return withHints(mcq(`<p class="statement">Dans le triangle ${nm}, on sait que ${data.t}. Ce triangle est…</p>`, list, 0, `On a : ${data.w}. ${nm} est <b>${data.g}</b>.`), hints);
    }
    const s = pick([
      ['Un triangle équilatéral est aussi isocèle.', true, 'Il a deux côtés égaux (et même trois).'],
      ['Un triangle isocèle est forcément équilatéral.', false, 'Deux côtés égaux ne suffisent pas : le troisième peut être différent.'],
      ['Un triangle rectangle peut aussi être isocèle.', true, 'C\'est le triangle rectangle isocèle.'],
      ['Un triangle peut avoir deux angles droits.', false, '90° + 90° = 180° : il ne resterait rien pour le troisième angle.'],
      ['Un triangle rectangle peut être équilatéral.', false, 'Un triangle équilatéral a trois angles de 60°.'],
    ]);
    return trueFalse(s[0], s[1], `<b>${s[1] ? 'Vrai' : 'Faux'}.</b> ${s[2]}`, hints);
  }

  /** triangle à l'échelle : base [BC] de 5,5 cm, angles donnés en A et B ; D prolonge [BC] après C */
  const extFig = (nA, nB, nC, nD, a, b) => {
    const c = 180 - a - b, BC = 5.5, AB = (BC * Math.sin((c * Math.PI) / 180)) / Math.sin((a * Math.PI) / 180);
    const B = { x: 0, y: 0 }, C = { x: BC, y: 0 }, D = { x: BC + 2.4, y: 0 }, A = polar(b, AB);
    return triFig({ [nA]: A, [nB]: B, [nC]: C, [nD]: D }, [F2.seg(C, D), arcMark(C, { x: 1, y: 0 }, G.sub(A, C), 0.7, 'f-arcm f-arc-blue')]);
  };
  function tri180H() {
    const ns = pickNames3(), [nA, nB, nC] = ns, nm = ns.join(''), v = rand(0, 3);
    const hints = [`Relis la propriété « La règle des 180° » dans ${ficheLink('triangles')}.`, 'Outil : fais un dessin à main levée. Calcule d\'abord ce que tu peux, même si ce n\'est pas ce qu\'on te demande.'];
    if (v === 0) {
      let a, b; do { a = rand(35, 85); b = rand(35, 85); } while (a + b > 150);
      const c = 180 - a - b, ans = a + b, nD = 'X';
      return ask({ st: `Dans le triangle ${nm}, ${angN(nA)} = ${deg(a)} et ${angN(nB)} = ${deg(b)}. Le point ${nD} prolonge [${nB}${nC}] après ${nC}. Calcule l'angle ${angN(nA + nC + nD)}.`, fig: extFig(nA, nB, nC, nD, a, b), pre: `${angN(nA + nC + nD)} = `, ans, unit: '°', label: 'Mesure', hints,
        remed: (x) => (eq(x, c) ? `C'est l'angle ${angN(nC)} du triangle. L'angle demandé est à côté : ensemble, ils forment un angle plat.` : null),
        msg: `${angN(nC)} = 180° − ${deg(a)} − ${deg(b)} = ${deg(c)}. ${nB}, ${nC} et ${nD} sont alignés, donc ${angN(nA + nC + nD)} = 180° − ${deg(c)} = <b>${deg(ans)}</b>.` });
    }
    if (v === 1) {
      const top = 2 * rand(15, 60) + 1, ans = (180 - top) / 2;
      return ask({ st: `${nm} est un triangle isocèle en ${nA} et ${angN(nA)} = ${deg(top)}. Calcule ${angN(nB)}. Le résultat n'est pas forcément un nombre entier.`, pre: `${angN(nB)} = `, ans, unit: '°', label: 'Mesure', hints,
        remed: (x) => (eq(x, 180 - top) ? 'C\'est pour les deux angles à la base ensemble : partage en deux.' : null),
        msg: `180° − ${deg(top)} = ${deg(180 - top)}. Les deux angles à la base sont égaux : ${deg(180 - top)} : 2 = <b>${deg(ans)}</b>.` });
    }
    if (v === 2) {
      let h, b; do { h = rand(15, 40); b = rand(30, 75); } while (180 - 2 * h - b < 15);
      const ans = 180 - h - b;
      return ask({ st: `Dans le triangle ${nm}, ${angN(nA)} = ${deg(2 * h)} et ${angN(nB)} = ${deg(b)}. La bissectrice de l'angle ${angN(nA)} coupe [${nB}${nC}] en X. Calcule l'angle ${angN(nA + 'X' + nB)}.`, pre: `${angN(nA + 'X' + nB)} = `, ans, unit: '°', label: 'Mesure', hints: [...hints, `Outil : regarde le triangle ${nA}${nB}X.`],
        msg: `La bissectrice partage l'angle : ${angN(nB + nA + 'X')} = ${deg(2 * h)} : 2 = ${deg(h)}. Dans le triangle ${nA}${nB}X : 180° − ${deg(h)} − ${deg(b)} = <b>${deg(ans)}</b>.` });
    }
    const a = rand(30, 90), b = rand(30, 60), real = Math.random() < 0.5, c = real ? 180 - a - b : 180 - a - b + pick([-10, 10, 5]);
    return withHints(mcq(`<p class="statement">Un triangle peut-il avoir des angles de ${deg(a)}, ${deg(b)} et ${deg(c)} ?</p>`, ['Oui', 'Non'], real ? 0 : 1, `${deg(a)} + ${deg(b)} + ${deg(c)} = ${deg(a + b + c)}. ${real ? 'La somme vaut 180° : c\'est <b>possible</b>.' : 'La somme devrait valoir 180° : c\'est <b>impossible</b>.'}`, { keepOrder: true }), hints);
  }

  function triNatAngH() {
    const ns = pickNames3(), [nA, nB, nC] = ns, nm = ns.join(''), v = rand(0, 2);
    const hints = [`Relis la méthode « Trouver la nature d'un triangle à partir de ses angles » dans ${ficheLink('triangles')}.`, 'Outil : trouve les trois angles, puis compare-les.'];
    const pool = [`isocèle en ${nA}`, `isocèle en ${nB}`, `isocèle en ${nC}`, `rectangle en ${nA}`, `rectangle en ${nB}`, `rectangle en ${nC}`, `rectangle isocèle en ${nA}`, 'équilatéral', 'quelconque'];
    const opts = (g) => [g, ...shuffle(pool.filter((x) => x !== g)).slice(0, 3)];
    if (v === 0) {
      // deux angles à la base donnés par une relation : cas limites équilatéral et rectangle
      const top = pick([60, 90, 2 * rand(15, 40), 2 * rand(50, 70)]), base = (180 - top) / 2;
      const g = top === 60 ? 'équilatéral' : top === 90 ? `rectangle isocèle en ${nA}` : `isocèle en ${nA}`;
      return withHints(mcq(`<p class="statement">Dans le triangle ${nm}, ${angN(nB)} = ${angN(nC)} et ${angN(nA)} = ${deg(top)}. Ce triangle est…</p>`, opts(g), 0, `${angN(nB)} = ${angN(nC)} = (180° − ${deg(top)}) : 2 = ${deg(base)}. Les angles sont ${deg(top)}, ${deg(base)} et ${deg(base)} : ${nm} est <b>${g}</b>.`), hints);
    }
    if (v === 1) {
      const x = rand(20, 70), g = `rectangle en ${nA}`;
      return withHints(mcq(`<p class="statement">Dans le triangle ${nm}, les angles ${angN(nB)} et ${angN(nC)} sont <b>complémentaires</b>, et ${angN(nB)} = ${deg(x)}. Ce triangle est…</p>`, x === 45 ? opts(`rectangle isocèle en ${nA}`) : opts(g), 0, `${angN(nB)} + ${angN(nC)} = 90°, donc ${angN(nA)} = 180° − 90° = 90°. ${nm} est <b>${x === 45 ? `rectangle isocèle en ${nA}` : g}</b>.`), hints);
    }
    // angle extérieur connu
    const b = pick([rand(30, 50), 60, 45]), ext = pick([b + b, 90 + 0, rand(80, 130)]), c = 180 - ext, a = 180 - b - c;
    if (a <= 5 || c <= 5) return triNatAngH();
    const angs = { [nA]: a, [nB]: b, [nC]: c }, right = Object.keys(angs).find((k) => angs[k] === 90);
    let g = 'quelconque';
    if (a === b && b === c) g = 'équilatéral'; else if (right) g = `rectangle en ${right}`; else if (a === b) g = `isocèle en ${nC}`; else if (a === c) g = `isocèle en ${nB}`; else if (b === c) g = `isocèle en ${nA}`;
    return withHints(mcq(`<p class="statement">Dans le triangle ${nm}, ${angN(nB)} = ${deg(b)}. Le point X prolonge [${nB}${nC}] après ${nC}, et ${angN(nA + nC + 'X')} = ${deg(ext)}. Ce triangle est…</p>`, opts(g), 0, `${angN(nC)} = 180° − ${deg(ext)} = ${deg(c)}, puis ${angN(nA)} = 180° − ${deg(b)} − ${deg(c)} = ${deg(a)}. Les angles sont ${deg(a)}, ${deg(b)} et ${deg(c)} : ${nm} est <b>${g}</b>.`), hints);
  }

  /* ---------- Chapitres 1 à 4 : les types qui n'avaient pas de ★ ---------- */
  function nomsH() {
    const [a, b, c, e] = shuffle(['A', 'B', 'C', 'D', 'E', 'F', 'M', 'N', 'P', 'R', 'S', 'T']);
    const why = { dr: 'une droite peut se nommer avec deux quelconques de ses points.', seg: 'les crochets désignent des segments, et ces deux segments ne sont pas les mêmes.', hors: `${e} n'est pas sur la droite.` };
    return withHints(checks(`<p class="statement">Les points ${a}, ${b} et ${c} sont sur une droite (d), dans cet ordre. Le point ${e} n'est pas sur (d). Coche <b>tout</b> ce qui est vrai.</p>`, [
      { html: `(${a}${b}) et (${b}${c}) sont la même droite`, ok: true, why: why.dr },
      { html: `${a} ∈ (${b}${c})`, ok: true },
      { html: `${b} ∈ [${a}${c}]`, ok: true },
      { html: `${c} ∉ [${a}${b}]`, ok: true },
      { html: `[${a}${b}] et [${b}${c}] sont le même segment`, ok: false, why: why.seg },
      { html: `${c} ∈ [${a}${b}]`, ok: false, why: `${c} est après ${b} : il n'est pas entre ${a} et ${b}.` },
      { html: `${e} ∈ (${a}${c})`, ok: false, why: why.hors },
      { html: `(${a}${e}) et (${a}${b}) sont la même droite`, ok: false, why: why.hors },
    ], 5, `(${a}${b}), (${b}${c}) et (${a}${c}) désignent la même droite. ${b} est sur le segment [${a}${c}], mais ${c} n'est pas sur [${a}${b}]. ${e} n'est pas sur (d).`),
    [`Relis « La droite » dans ${ficheLink('droites')}.`, 'Outil : dessine la droite et place les points dans l\'ordre donné.']);
  }

  function fracDecH() {
    const hints = [`Relis « Fractions décimales » dans ${ficheLink('decimaux1')}.`, 'Outil : place le nombre dans un tableau de numération. Le rang du dernier chiffre donne le dénominateur.'];
    const v = rand(0, 2);
    if (v === 0) {
      const k = pick([2, 3]), den = 10 ** k, I = pick([0, 0, rand(1, 40)]);
      let d; do { d = k === 2 ? rand(1, 9) : pick([rand(1, 9), rand(11, 99)]); } while (d % 10 === 0);
      const m = I * den + d, x = m / den, sol = `${m}/${den}`;
      return {
        _sol: sol, hints,
        q: `<p class="big">${fmt(x)} = ${inp('frac')}</p><p class="hint">Écris ce nombre sous forme de fraction décimale (exemple de saisie : 37/10).</p>`,
        check(r) {
          const y = val(r); if (!y) return null;
          if (!y.isFrac) return { retry: true, msg: 'On attend une fraction, écrite avec une barre : 37/10.' };
          if (![10, 100, 1000, 10000].includes(y.d) || !Number.isInteger(y.n)) return { retry: true, msg: 'Une fraction décimale a pour dénominateur 10, 100 ou 1 000. Corrige ta fraction.' };
          const ok = eq(y.value, x); markInput(r, 0, ok);
          return { ok, msg: `${fmt(x)} = <b>${F(m, den)}</b> : attention aux zéros, le dernier chiffre est au rang des ${den === 100 ? 'centièmes' : 'millièmes'}.` };
        },
      };
    }
    if (v === 1) {
      const k = pick([2, 3, 3]), den = 10 ** k;
      let n; do { n = pick([rand(1, 9), rand(11, 99), rand(1001, 4999)]); } while (n % 10 === 0);
      const x = n / den;
      return ask({ st: `Donne l'écriture décimale de ${F(n, den)}.`, ans: x, hints, msg: `${F(n, den)} : le dernier chiffre de ${groupInt(String(n))} est au rang des ${den === 100 ? 'centièmes' : 'millièmes'}. Donc ${F(n, den)} = <b>${fmt(x)}</b>.` });
    }
    const u = rand(1, 90), dx = rand(1, 9), mil = rand(1, 9), x = (u * 1000 + dx * 100 + mil) / 1000, parts = shuffle([`${u}`, F(dx, 10), F(mil, 1000)]);
    return ask({ st: `Écris sous forme d'un seul nombre décimal : ${parts.join(' + ')}.`, ans: x, hints: [...hints, 'Attention : il n\'y a pas de centièmes. Que faut-il écrire à ce rang ?'],
      remed: (y) => (eq(y, u + dx / 10 + mil / 100) ? 'Il n\'y a pas de centièmes : il faut écrire un <b>0</b> à ce rang.' : null),
      msg: `${u} unités, ${dx} dixièmes, 0 centième, ${mil} millièmes : <b>${fmt(x)}</b>.` });
  }

  function notationH() {
    const [a, b, c] = shuffle(['A', 'B', 'C', 'D', 'E', 'F', 'I', 'M', 'N', 'P', 'R', 'S']);
    return withHints(checks(`<p class="statement">Les points ${a}, ${b} et ${c} sont alignés, dans cet ordre. Coche <b>tout</b> ce qui est vrai.</p>`, [
      { html: `[${a}${b}) et [${a}${c}) sont la même demi-droite`, ok: true },
      { html: `(${a}${b}) et (${b}${c}) sont la même droite`, ok: true },
      { html: `${c} ∈ [${a}${b})`, ok: true },
      { html: `${b} ∈ [${c}${a})`, ok: true },
      { html: `[${a}${b}) et [${b}${a}) sont la même demi-droite`, ok: false, why: 'elles n\'ont pas la même origine : la première lettre est l\'origine.' },
      { html: `[${b}${a}) et [${b}${c}) sont la même demi-droite`, ok: false, why: `elles partent de ${b} dans deux sens opposés.` },
      { html: `${c} ∈ [${a}${b}]`, ok: false, why: `le segment s'arrête en ${b}, et ${c} est après.` },
      { html: `${a} ∈ [${b}${c})`, ok: false, why: `cette demi-droite part de ${b} vers ${c} : ${a} est de l'autre côté.` },
    ], 5, `Pour une demi-droite, la première lettre est l'origine. [${a}${b}) part de ${a} et passe par ${b} puis ${c}. [${b}${a}) part de ${b} vers ${a}, et [${b}${c}) part de ${b} vers ${c} : ce sont deux demi-droites différentes.`),
    [`Relis le tableau des notations dans ${ficheLink('cercle')}.`, 'Outil : dessine les trois points dans l\'ordre, puis trace chaque figure.']);
  }

  function ecrireH() {
    const [a, b] = shuffle(['A', 'B', 'C', 'D', 'E', 'F', 'R', 'S']), M = pick(['M', 'P', 'T']), L = rand(15, 95) / 10;
    return withHints(checks(`<p class="statement">${M} est un point du segment [${a}${b}], et ce segment mesure ${cm(L)}. Coche <b>toutes</b> les écritures correctes.</p>`, [
      { html: `${a}${b} = ${cm(L)}`, ok: true },
      { html: `${M} ∈ [${a}${b}]`, ok: true },
      { html: `${a}${M} + ${M}${b} = ${a}${b}`, ok: true },
      { html: `${M} ∈ (${a}${b})`, ok: true },
      { html: `[${a}${b}] = ${cm(L)}`, ok: false, why: `[${a}${b}] est une figure. Sa longueur s'écrit ${a}${b}.` },
      { html: `${M} ∈ ${a}${b}`, ok: false, why: `${a}${b} sans crochets est un nombre : un point ne peut pas lui appartenir.` },
      { html: `(${a}${b}) = ${cm(L)}`, ok: false, why: 'une droite est illimitée : elle n\'a pas de longueur.' },
      { html: `[${a}${M}] + [${M}${b}] = [${a}${b}]`, ok: false, why: 'on additionne des longueurs, pas des figures.' },
    ], 5, `Sans crochets, ${a}${b} est un nombre (une longueur). Avec crochets, [${a}${b}] est une figure : on écrit ${a}${b} = ${cm(L)} et ${M} ∈ [${a}${b}].`),
    [`Relis « Attention aux notations » dans ${ficheLink('cercle')}.`, 'Outil : pour chaque écriture, demande-toi : est-ce un nombre, ou une figure ?']);
  }

  function disqueH() {
    const r = 5 * rand(5, 12), asDisk = Math.random() < 0.5, R = r / 10;
    const ds = shuffle([R, R, round1(R + 0.5), R - 0.02, R + 0.05, R - 0.5, Math.floor(R)]).slice(0, 5);
    if (!ds.some((d) => eq(d, R))) ds[0] = R;
    const names = shuffle(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    const items = ds.map((d, i) => { const dd = Math.round(d * 100) / 100, on = eq(dd, R), inn = dd < R; return { html: `O${names[i]} = ${cm(dd)}`, ok: asDisk ? on || inn : on, why: `${cm(dd)} ${on ? 'est égal au' : inn ? 'est plus petit que le' : 'est plus grand que le'} rayon.` }; });
    return withHints(multiQ(`<p class="statement">On trace le cercle de centre O et de rayon ${cm(R)}. Coche <b>tous</b> les points qui appartiennent ${asDisk ? 'au <b>disque</b>' : 'au <b>cercle</b>'}.</p>`, items, asDisk ? `Le disque contient les points à une distance du centre <b>inférieure ou égale</b> au rayon, y compris ceux du cercle.` : 'Le cercle contient seulement les points à une distance du centre <b>exactement égale</b> au rayon.', (_k, it) => it.why, { col: true }),
      [`Relis « Différence entre cercle et disque » dans ${ficheLink('cercle')}.`, 'Outil : compare chaque distance au rayon, chiffre par chiffre. Un zéro à la fin d\'un décimal ne change rien.']);
  }

  /* ---------- Branchement : la version d'origine reste utilisée quand hard est faux ---------- */
  const add = (k, h) => { const base = GENS[k].f; GENS[k].f = (hard) => (hard ? h() : base()); GENS[k].hard = true; };
  Object.entries({
    'o-voc': opVocH, 'o-gauche': opGaucheH, 'o-par': opParH, 'o-par2': opPar2H, 'o-pb': opPbH,
    'a-nom': angNomH, 'a-nature': angNatureH, 'a-mesure': angMesureH, 'a-calcul': angCalculH, 'a-reco': angRecoH,
    't-voc': triVocH, 't-nature': triNatureH, 't-180': tri180H, 't-natang': triNatAngH,
    'd-noms': nomsH, 'n-fracdec': fracDecH, 'c-notation': notationH, 'c-ecrire': ecrireH, 'c-disque': disqueH,
  }).forEach(([k, h]) => add(k, h));
}());
