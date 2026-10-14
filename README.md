# Révisions 6e — Mathématiques

Site de révision tout-en-un pour les élèves de 6e. Au début, l'élève choisit son chapitre :

| Chapitre | Fiche de cours | Exercices |
|---|---|---|
| **1. Droites** | Codage des points (tableaux OUI / NON), droite et notations, ∈ / ∉, position de deux droites, tracés animés de la perpendiculaire et de la parallèle | Coder un point, appartenance et alignement, nommer une droite, position de deux droites (dont des sécantes qui se coupent hors du cadre), propriété des deux perpendiculaires, **tracer** une perpendiculaire et une parallèle |
| **2. Nombres décimaux (partie 1)** | Numération, tableau des classes, décomposition, partie entière / décimale, zéros inutiles, fractions décimales, « À retenir » | Rang d'un chiffre, nombre de dizaines / dixièmes, tranches de trois (clic entre les chiffres), décomposer / recomposer, zéros inutiles (clic sur les zéros), fractions décimales, lettres → chiffres, différentes écritures |
| **3. Distance et cercle** | Notations [AB], [AB), AB, milieu, unités de longueur, médiatrice (construction animée au compas), vocabulaire du cercle, cercle et disque | Notations, bien écrire, milieu, **tracer** une demi-droite et un milieu, propriété et réciproque de la médiatrice, **tracer** la médiatrice, vocabulaire du cercle, rayon / diamètre, cercle et disque, **tracer** un cercle |
| **4. Nombres décimaux (partie 2)** | Demi-droite graduée (méthodes 1 et 2), comparer, ranger, intercaler, encadrer, arrondir (règle du chiffre suivant) | Lire une abscisse (pas de 1, 0,1, 0,01, 10), placer un point, comparer, ranger (clic dans l'ordre), intercaler, encadrer, arrondir |

Chaque chapitre a aussi un **contrôle blanc** de 10 questions noté sur 20 (avec un bouton « Passer » si l'élève bloque).
Les exercices changent à chaque fois et sont corrigés immédiatement, avec la méthode.
La progression est enregistrée dans le navigateur de l'élève (aucun compte, aucune donnée envoyée). Elle est séparée de celle du site de 5e, même si les deux sites sont sur le même compte GitHub.

## Donner un devoir sur une notion précise

En bas de chaque page, le lien **Espace professeur** (adresse : `…/index.html#/prof`) permet de :

- cocher une ou plusieurs notions (dans un ou plusieurs chapitres) et choisir le nombre de questions (5, 10, 15 ou 20) ;
- **copier le lien** du devoir, à coller dans l'ENT, Pronote ou le cahier de textes ;
- copier le lien d'**une seule notion** (bouton « 🔗 lien seul ») ou d'une **fiche de cours**.

Le lien ouvre directement une série sur ces notions, avec indices, remédiation et correction. À la fin, l'élève voit son score (réussites, dont celles obtenues avec de l'aide), la date et l'heure. Rien n'est envoyé au professeur : demander une capture d'écran si besoin.

Format du lien : `#/devoir/clé1,clé2/nombre`, par exemple `#/devoir/e-arrondir,e-encadrer/10`.

## Aides à la révision

- **💡 Indices didactiques** (jamais la réponse) : 1. une question qui relance et renvoie à la fiche ; 2. un exemple résolu avec d'autres nombres ; 3. un outil (tableau de numération, intervalle colorié sur la demi-droite, nombres complétés par des zéros, droites prolongées en pointillés, chiffre du rang encadré…). Pas d'indice dans les contrôles blancs.
- **🤔 Remédiation selon l'erreur** : au premier essai, si la réponse correspond à une erreur classique, un message ciblé l'explique et l'élève a un second essai. Exemples : dizaines / dixièmes confondus, rangs comptés depuis la gauche, chiffre des dizaines donné à la place du nombre de dizaines, tranches faites depuis la gauche, rang vide oublié, zéro « du milieu » barré, virgule prise pour une barre de fraction, graduation comptée comme une unité, 14,52 > 14,6, ordre croissant / décroissant inversé, troncature au lieu d'arrondi, [AB] = 5 cm, origine d'une demi-droite inversée, point équidistant mais pas sur le segment, corde prise pour un diamètre, diamètre pris comme rayon, écartement de compas trop petit ou changé, droites « parallèles » qui se coupent hors du cadre, croix ajoutée sur une intersection…
- **🎬 Animations** : équerre, règle et compas dessinés étape par étape (perpendiculaire, parallèle avec règle et équerre, médiatrice, demi-droite, milieu, cercle). Avant de répondre, « Voir un exemple » montre la méthode sur **d'autres** données ; après, « Voir la construction » montre la correction.
- **📌 Mes erreurs** : chaque type de question raté est ajouté à la page « Mes erreurs » du chapitre. Un point faible disparaît après 2 réussites d'affilée sans indice.
- **🔊 Écouter** : lecture à voix haute des énoncés, indices, corrections et fiches (« appartient à », « la demi-droite d'origine A passant par B », « est parallèle à », fractions décimales lues « trente-sept dixièmes »…).

## La planche de construction

Règle (longueur au millimètre), **Demi-droite**, Droite, Compas (rayon affiché), Point (s'accroche aux intersections), Équerre (perpendiculaire), **Parallèle** (règle + équerre), Déplacer, boutons − / + pour ajuster le dernier tracé, choix du nom du prochain point.
Les points sont codés par une croix, comme dans le cours (un petit trait pour un point donné sur une droite).
Le site vérifie les directions à 2° près, les longueurs et les rayons à 1 mm près, et que les tracés passent par les bons points.

## Mettre le site en ligne avec GitHub Pages

1. Créer un **nouveau dépôt** (par exemple `revisions-6e`), puis **Add file → Upload files** et glisser `index.html`, `style.css`, `script.js` (et ce `README.md`).
2. **Commit changes**.
3. **Settings → Pages → Deploy from a branch → main → / (root) → Save**.
4. Après 1 à 2 minutes, ouvrir le site et recharger avec **Ctrl + F5**.

## Modifier le site

- **Les fiches** sont dans `index.html`, une section par page (`data-ch` = chapitre, `data-p` = page, `data-title` = nom dans le menu). Une fraction s'écrit `[[numérateur|dénominateur]]`.
- `<div data-numtab="83,614"></div>` affiche un tableau de numération ; `<p data-arr="12848,3,2"></p>` affiche la règle du chiffre suivant (12,848 arrondi au centième).
- **Les exercices** sont dans `script.js` (une fonction par type) et sont déclarés dans l'objet `GENS`, avec leur clé (celle qui sert dans les liens de devoir).
- **Ajouter un chapitre** : ajouter des sections `data-ch="nouveau"` dans `index.html`, une entrée dans `CHAPTERS` et ses exercices dans `GENS` (`ch: 'nouveau'`). Le contrôle blanc, la progression et l'espace professeur suivent automatiquement.
