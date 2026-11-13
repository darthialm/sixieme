# Révisions 6e — Mathématiques

Site de révision tout-en-un pour les élèves de 6e. Au début, l'élève choisit son chapitre :

| Chapitre | Fiche de cours | Exercices |
|---|---|---|
| **1. Droites** | Codage des points (tableaux OUI / NON), droite et notations, ∈ / ∉, position de deux droites, tracés animés de la perpendiculaire et de la parallèle | Coder un point, appartenance et alignement, nommer une droite, position de deux droites (dont des sécantes qui se coupent hors du cadre), propriété des deux perpendiculaires, **tracer** une perpendiculaire et une parallèle |
| **2. Nombres décimaux (partie 1)** | Numération, tableau des classes, décomposition, partie entière / décimale, zéros inutiles, fractions décimales, « À retenir » | Rang d'un chiffre, nombre de dizaines / dixièmes, tranches de trois (clic entre les chiffres), décomposer / recomposer, zéros inutiles (clic sur les zéros), fractions décimales, lettres → chiffres, différentes écritures |
| **3. Distance et cercle** | Notations [AB], [AB), AB, milieu, unités de longueur, médiatrice (construction animée au compas), vocabulaire du cercle, cercle et disque | Notations, bien écrire, milieu, **tracer** une demi-droite et un milieu, propriété et réciproque de la médiatrice, **tracer** la médiatrice, vocabulaire du cercle, rayon / diamètre, cercle et disque, **tracer** un cercle |
| **4. Nombres décimaux (partie 2)** | Demi-droite graduée (ce que vaut une case, lire et placer un point), comparer, ranger, intercaler, encadrer, arrondir (règle du chiffre suivant) | Lire une abscisse (pas de 1, 0,1, 0,01, 10), placer un point, comparer, ranger (clic dans l'ordre), intercaler, encadrer, arrondir |

Chaque chapitre a aussi un **contrôle blanc** de 15 questions noté sur 20 (avec un bouton « Passer » si l'élève bloque) : chaque compétence y figure au moins une fois, et au moins 40 % des questions sont ★ plus difficiles quand le chapitre en propose assez. L'entraînement se fait par **séries finies et progressives** : 4 questions de base puis 2 questions ★ (3 questions pour un tracé). L'élève voit son résultat à la fin, et n'a pas besoin d'aller plus loin ; il peut refaire une autre série s'il le souhaite.
Les exercices changent à chaque fois et sont corrigés immédiatement, avec la méthode.
La progression est enregistrée dans le navigateur de l'élève (aucun compte, aucune donnée envoyée). Elle est séparée de celle du site de 5e, même si les deux sites sont sur le même compte GitHub.

## Espace professeur (protégé par un code)

En bas de chaque page, le lien **Espace professeur** (adresse : `…/index.html#/prof`) demande un code. **Le code par défaut est `prof6e`** : change-le tout en haut de `script.js`, à la ligne `const CODE_PROF = 'prof6e';`. Une fois le code saisi, l'appareil s'en souvient ; le lien « Verrouiller cet espace » le referme (utile sur un ordinateur partagé).
C'est une protection légère : un élève très curieux pourrait lire le fichier `script.js`.

### 1. Donner un devoir

- Cocher une ou plusieurs notions (dans un ou plusieurs chapitres), choisir le nombre de questions (5, 10, 15 ou 20).
- **Copier le lien** du devoir et le coller dans l'ENT, Pronote ou le cahier de textes. Le bouton « 🔗 lien seul » copie le lien d'une seule notion ; on peut aussi copier le lien d'une fiche de cours.
- L'élève écrit **son prénom** avant de commencer. Il a droit aux indices et au second essai.
- À la fin, il obtient une **carte de résultat** à prendre en capture d'écran : prénom, score, réussites avec aide, date et heure, numéro d'essai, et un **code** de 14 caractères (par exemple `0060-169KK-JS844`).

### 2. Recevoir les résultats automatiquement (Grist ou Google Forms)

Pour ne pas recopier les codes un par un, les résultats arrivent tout seuls dans un tableau, une ligne par élève.

**Avec Grist (apps.education.fr), conseillé :**
1. Créer un document Grist avec une table de 6 colonnes nommées exactement : **Prénom, Code, Classe, Devoir, Score, Détail**.
2. Ajouter une vue **Formulaire** sur cette table, avec ces 6 champs, puis **Publier**.
3. Coller le lien du formulaire publié (`…/o/docs/forms/…/1`) dans l'Espace professeur, partie 2, puis cliquer sur **Relier et tester**.

Le test lit la structure du formulaire et envoie une ligne « TEST » dans la table.
- Si elle arrive : « ✔ Ça marche ! ». Les liens de devoir enverront ensuite chaque résultat automatiquement.
- Si Grist refuse les envois venant d'un autre site : le site passe en **mode manuel**. À la fin du devoir, l'élève voit un lien vers le formulaire et un bouton pour copier son code ; il y recopie prénom, score et code. On vérifie ensuite tous les codes d'un coup (partie 3).
- Le résultat du test peut dépendre de l'adresse du site : après avoir déplacé le site (sur la Forge par exemple), refaire « Relier et tester » depuis la nouvelle adresse.

**Avec Google Forms :** créer un formulaire de 6 questions « Réponse courte » (Prénom, Code, Classe, Devoir, Score, Détail), ne pas collecter les e-mails ni limiter à l'établissement, l'associer à Sheets, puis coller son « lien prérempli » (avec `x` dans chaque réponse) dans le même champ.

Le champ **Classe** permet de faire un lien par classe. Données transmises : prénom, code, classe, devoir, score, détail (aide, essai, date et heure). Vérifier avec l'établissement que l'outil choisi est autorisé.

### 3. Bilan des résultats (sans lire la table ligne par ligne)

L'Espace professeur, partie 3, fait le bilan tout seul : **une ligne par élève**, même s'il a fait le devoir plusieurs fois.
- Filtres par devoir et par classe ; au choix, le score retenu est le **meilleur**, le **premier** ou le **dernier** essai.
- Moyenne, nombre d'élèves sous la moitié, scores en couleur, réussites avec ou sans aide, nombre d'essais.
- **Qui n'a pas fait le devoir** : colle une seule fois la liste des prénoms de chaque classe (gardée sur cet ordinateur, valable pour tous les devoirs). Une classe qui n'a encore aucun résultat s'ajoute avec le champ « ＋ autre classe » du widget (dans l'Espace prof, tes classes du menu ✏️ apparaissent déjà).
- **Codes vérifiés** : une ligne tapée à la main ou recopiée sur un camarade est signalée à part et n'est pas comptée.
- « Copier ce bilan » pour le coller dans un tableur.

**Widget « Mes devoirs » dans Grist** (le plus simple) :
- À l'ouverture, une **carte par classe** affiche son **dernier devoir**, combien d'élèves l'ont fait et **qui ne l'a pas encore fait**.
- « Voir la classe » ouvre la liste de tous ses devoirs, du plus récent au plus ancien, puis le détail du devoir choisi : scores et élèves qui ne l'ont pas fait.
- **Devoir donné :** quand tu copies le lien d'un devoir pour une classe, l'Espace prof envoie une ligne `DONNE-…` dans ta table. Il faut un formulaire Grist relié en mode automatique, avec la case « Envoyer les résultats » cochée. Le devoir apparaît alors dans le widget dès le jour où tu le donnes, même si personne ne l'a encore fait. Copier plusieurs fois le même lien n'ajoute pas d'autre ligne.
- Les exercices de **remédiation** proposés par les étiquettes QR sont rangés à part (« Remédiations après un contrôle »). Ils ne remplacent jamais le dernier devoir.
- Conseil : mets la page qui contient le widget **en premier** dans ton document Grist, pour tomber dessus à l'ouverture.

**Installer le widget `bilan.html`.** Déposer aussi `bilan.html` sur GitHub. Dans le document Grist : Ajouter → Ajouter un widget à la page → **Personnalisé**, données = la table des résultats ; dans le panneau de droite, « URL personnalisée » = l'adresse de `bilan.html` (affichée et copiable dans l'Espace professeur, partie 3) ; accorder l'accès **complet au document**. Le bilan s'affiche dans Grist et se met à jour tout seul. C'est Grist qui transmet les données au widget : aucune clé n'est nécessaire. Avec l'accès complet, les listes d'élèves sont enregistrées dans une table « Listes » du document : elles sont donc les mêmes sur l'ordinateur et sur la tablette. Si l'accès complet est refusé, elles restent seulement sur l'appareil où elles ont été collées.

**Liste de classe et noms des élèves :** un élève compte comme « fait » s'il a tapé le même prénom que dans la liste. L'initiale ou le nom de famille peuvent différer : « Léa M. » dans la liste correspond à « Léa », « Léa M » ou « Léa Martin ». Deux élèves qui ont le même prénom sont distingués par leur initiale.

**Sans widget :** copier-coller (dans la table, Ctrl+A puis Ctrl+C, et Ctrl+V dans l'Espace professeur, partie 3 ; fonctionne aussi avec Google Sheets). Le chargement par clé API est refusé par le Grist de l'État (réglage de sécurité du serveur) : ne pas l'utiliser.

**Devoir sur papier :** au début du devoir, l'élève peut cliquer sur « 📝 Je préfère faire ce devoir sur papier ». Il obtient une feuille à imprimer (ou à recopier) avec ses questions, son prénom et sa classe ; les figures de construction sont imprimées en vraie grandeur. Une ligne `PAPIER-…` arrive dans la table, et le bilan affiche « 📝 Sur papier — à vérifier » (non compté dans la moyenne, mais l'élève n'apparaît pas dans « Pas encore fait »).

**Option « Seul le premier essai compte »** (case à cocher en partie 1) : l'élève peut refaire le devoir pour s'entraîner, mais seul son premier essai est envoyé.

### 4. Vidéoprojecteur

Cocher des notions puis cliquer sur « 📽 Vidéoprojecteur » : une question s'affiche en très grand, sans menu. Touches : **R** affiche la réponse (ou l'animation de la construction), **→** passe à la question suivante, **F** met en plein écran. Minuteur au choix : 30 s, 1 min, 1 min 30, 2 min.

### 5. Contrôles papier par compétences (avec étiquettes QR)

Dans l'Espace professeur, carte **📝 Contrôle sur papier, par compétences** :
1. **Coche les compétences** dans la liste (ce sont les types d'exercices du site). Choisis la classe, la **date du contrôle** (elle est imprimée sur les copies), la **durée** et colle la liste des prénoms. Coche la **version aménagée** pour les élèves qui en ont besoin. L'outil retient ce choix pour la classe.
   - **🪑 Plan de classe** (une fois par classe) :
     - indique les tables de chaque rangée, de gauche à droite (`2 4 2`, `2 2 2`, `3 3`…), et le nombre de rangées ;
     - choisis le prénom de chaque place, ou utilise « Placer les élèves non placés » ;
     - le petit numéro sur chaque place montre l'ordre de distribution, et **les copies sortent de l'imprimante dans cet ordre** ;
     - en `2 4 2` : la table de 2 de gauche, puis les 2 places les plus proches dans la table de 4, rangée par rangée ; ensuite l'autre allée (table de 2 de droite, puis les 2 places les plus proches) ;
     - options : faire la 2e allée du fond vers le tableau, ou imprimer en ordre inverse (si ton imprimante empile les pages à l'envers) ;
     - les élèves qui ne sont pas sur le plan sont imprimés à la fin ;
     - le plan **et la liste des élèves** sont gardés pour chaque classe, sur cet appareil. En choisissant la classe, tout revient (la classe choisie la dernière fois est reprise à l'ouverture).
2. **Préparer le contrôle**. Avec « ≈ 30 min (automatique) », réglage par défaut, le site fait tout seul :
   - il ajoute des questions, en commençant par les compétences qui en ont le moins, jusqu'à environ 30 minutes, tant que la page tient ;
   - si la page est pleine avant, certaines questions deviennent **★ un peu plus difficiles**. C'est la même compétence, avec un piège ou des nombres plus durs, par exemple un arrondi avec retenue (3,96 → 4,0) ;
   - chaque copie est vérifiée. Si une copie dépasse, elle reçoit d'autres nombres.

   Un tableau affiche ensuite le nombre de questions par compétence, les ★ et la **durée estimée**. Tu peux ajuster avec − et +.
   - Les temps par question sont des estimations, à ajuster après les premiers contrôles. Ils sont dans `CTL_T`, au début de la partie « Contrôles » de `script.js`.
   - Certaines compétences prennent beaucoup de place pour peu de temps : figures du chapitre Droites, vocabulaire du cercle. Sans tracé, la page est alors pleine vers 18 à 20 minutes, et l'outil le signale. Ajoute une compétence de tracé, ou une compétence qui a des questions ★.
   - Deux tracés de droites (perpendiculaire et parallèle) avec une autre compétence ne tiennent pas sur une page.
   - Tu peux aussi choisir « ≈ 20 min », ou un nombre fixe de questions par compétence.
3. **Imprimer les sujets** : une feuille A4 par élève, en recto seul. Les nombres changent pour chaque élève, mais les questions ressemblent à celles du site. En haut de la feuille, une bande porte le prénom, à détacher. La copie ne garde que son **code** (ex. `K7P-04`) et une grille **TB / MS / MF / MI** par compétence. Les tracés sont imprimés en vraie grandeur.
   - Version aménagée : une question de moins par compétence (parfois deux, pour tenir sur la page), pas de ★, des caractères plus grands et une **aide** sous la première question de chaque compétence.
   - Chaque copie tient dans une page : elle ne peut jamais passer sur une 2e page. Les deux colonnes sont construites par le site (et non par le navigateur), donc elles s'impriment pareil partout.
   - Avec Chrome ou Edge, la copie occupe toute la page. Avec Safari ou Firefox, qui ajoutent parfois leurs propres marges, la copie est un peu plus petite pour tenir dans la zone imprimable (un peu moins de questions, ou plus de ★).
   - Si une copie est un peu trop longue à l'impression (police différente), son texte est légèrement resserré. Au pire, l'outil le signale avant d'imprimer.
   - Les demi-droites graduées restent dans les colonnes. « Complète avec <, > ou = » se fait en écrivant le signe dans une case. « Range » donne la liste des nombres, puis une ligne de cases séparées par < ou >.
   - Chapitres 5 à 7 : un cadre quadrillé pour écrire les étapes ou faire les calculs d'un problème. Les opérations à trous et la virgule à placer s'impriment telles quelles. Le rapporteur à lire est imprimé en grand.
   - À l'impression : marges « aucune », échelle 100 %. Si l'adresse du site apparaît encore en bas de page, décoche « En-têtes et pieds de page ».
4. **📁 Mes contrôles** : pour chaque contrôle enregistré :
   - **🖨️ Sujets** pour réimprimer ;
   - **📄 Corrigé** : les réponses de chaque copie, et la figure finale pour les constructions ;
   - **🤖 Fichier IA** ;
   - la **date**, modifiable (réimprime ensuite les sujets) ;
   - **🗑** pour supprimer un contrôle de cet appareil. Sa ligne `CTRL-…` reste dans Grist : supprime-la là-bas si tu veux.

   Dans chaque fenêtre d'impression, le bouton **← Revenir au site** ferme la fenêtre.
5. **Correction assistée** (facultatif) :
   - détache les bandes avec les prénoms, scanne la pile en un seul PDF ;
   - envoie ce PDF à Claude avec le **fichier pour la correction assistée** (.txt) ; ce fichier contient les énoncés et les réponses attendues, sans aucun nom ;
   - Claude répond une ligne par copie : `K7P-04 C1=TB(111) C2=MF?(100)` (« ? » marque un doute).
6. **Après la correction : étiquettes**. Colle la réponse dans « Résultats », ou tape-les toi-même (`K7P-04 C1=TB C2=MF`). Vérifie le tableau, où les doutes sont surlignés. Puis **imprime les étiquettes** : planche A4 de 21 étiquettes (3 × 7, 63,5 × 38,1 mm, type L7160). Tu peux commencer à une étiquette déjà entamée.
7. Chaque étiquette porte un QR code. L'élève le scanne et arrive sur **sa page** :
   - son bilan par compétence ;
   - un bouton « Je refais ces exercices » pour chaque compétence MF ou MI (comme un devoir, résultat envoyé dans ta table) ;
   - le corrigé de **son** sujet, avec ✔ / ✘ par question et l'animation des constructions.

Le contrôle est enregistré sur l'appareil et, si Grist est configuré, dans une ligne `CTRL-…` de la table. Sur un autre appareil, colle la cellule « Détail » de cette ligne dans « Ce contrôle a été créé sur un autre appareil ». « Copier le tableau » copie les niveaux pour un tableur.

**RGPD** :
- les copies scannées ne portent qu'un code, et le fichier envoyé à l'IA ne contient aucun nom ;
- le QR code ne contient ni nom ni prénom : seulement le code de la copie, la classe, les compétences et les niveaux. La page de l'élève est recalculée à partir de ce lien, sans rien stocker en ligne ;
- fais valider l'usage d'une IA pour la correction par ton établissement.

## Automatismes du jour

Sur l'accueil, la carte **⚡ Automatismes du jour** propose 5 questions rapides, tous chapitres confondus :
- d'abord jusqu'à **3 questions sur les points faibles** de l'élève (« Mes erreurs ») ;
- puis des notions **déjà travaillées**, en choisissant les moins réussies et celles qui n'ont pas été revues depuis longtemps ;
- au tout début, des questions du chapitre 1.

Réussir un point faible sans indice compte pour le corriger (2 réussites d'affilée). La carte indique si les automatismes sont faits aujourd'hui et le nombre de jours de suite. Les exercices de tracé (planche) n'y figurent pas : ils restent dans « Mes erreurs » de chaque chapitre.

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

1. Créer un **nouveau dépôt** (par exemple `revisions-6e`), puis **Add file → Upload files** et glisser `index.html`, `style.css`, `script.js`, `qrcode.js`, `bilan.html` (et ce `README.md`).
2. **Commit changes**.
3. **Settings → Pages → Deploy from a branch → main → / (root) → Save**.
4. Après 1 à 2 minutes, ouvrir le site et recharger avec **Ctrl + F5**.

## Modifier le site

- **Les fiches** sont dans `index.html`, une section par page (`data-ch` = chapitre, `data-p` = page, `data-title` = nom dans le menu). Une fraction s'écrit `[[numérateur|dénominateur]]`.
- `<div data-numtab="83,614"></div>` affiche un tableau de numération ; `<p data-arr="12848,3,2"></p>` affiche la règle du chiffre suivant (12,848 arrondi au centième).
- **Les exercices** sont dans `script.js` (une fonction par type) et sont déclarés dans l'objet `GENS`, avec leur clé (celle qui sert dans les liens de devoir).
- **Ajouter un chapitre** : ajouter des sections `data-ch="nouveau"` dans `index.html`, une entrée dans `CHAPTERS` et ses exercices dans `GENS` (`ch: 'nouveau'`). Le contrôle blanc, la progression et l'espace professeur suivent automatiquement.
- **Contrôles papier** : un nouveau type d'exercice peut indiquer son temps estimé, en minutes (`t: 2` dans `GENS`). Il peut aussi avoir une version ★ : `hard: true` dans `GENS`, et la fonction reçoit alors `hard` en paramètre. Sinon, un tracé compte pour 6 minutes et une autre question pour 2 minutes.
- **Questions ★ et sujets déjà imprimés** : les sujets papier et les pages des étiquettes QR sont recalculés à partir d'une graine. Modifier une fonction d'exercice changerait donc les sujets déjà distribués. Les versions ★ ajoutées ensuite sont dans `questions-difficiles.js`, sans toucher aux fonctions d'origine. Pour ajouter des questions à un type déjà utilisé sur papier, crée plutôt un nouveau type d'exercice.
- **Réglages** : nombre de questions du contrôle blanc et part de ★ dans `EXAM_N` et `EXAM_HARD`, longueur des séries d'entraînement dans `TRAIN_EASY`, `TRAIN_HARD` et `TRAIN_SLOW` (`script.js`).


## Poser et calculer (10/11/2026) — `poser.js`
- Pages `operations/addition`, `soustraction`, `multiplication` (remplacent `poser` et `calculer`), clés `o-pa` (addition), `o-ps` (soustraction), `o-pm` (multiplication), toutes avec ★.
- L'élève pose l'opération dans une grille : il touche une case puis un chiffre (pavé ou clavier), « , » pour la virgule.
- Retenues : bouton « Ajouter une retenue », affichées en haut ou à droite sur le côté, à droite de la ligne calculée, dans l'ordre d'écriture (préférence `revisions6e-retenues`, choisie aussi dans la fiche). Une retenue comptée non barrée : rappel pendant le calcul, puis une fois avant la vérification.
- Soustraction : méthode choisie en image au début de chaque question (cassage : barrer et réécrire + petit 1 devant ; conservation des écarts : petit 1 devant + « +1 » en bas). Fiche : l'élève touche sa méthode, une seule s'affiche (`revisions6e-soustraction`).
- Erreurs repérées : virgules non alignées (cas d'un nombre entier), nombres alignés à droite, nombre mal recopié ou inversé, retenue oubliée, soustraction à l'envers, +1 oublié, case vide en haut (écrire un 0), ligne non décalée, virgule du produit.
- Papier : la grille devient un cadre ; corrigé = opération posée. Vidéoprojecteur : « Afficher la réponse » remplit la grille.

## Classeur : synchronisation entre appareils

Par défaut, le classeur (`classeur.html`) garde les classes sur l'appareil. En bas de page, l'encadré **Synchroniser entre tes appareils** l'envoie aussi dans le fichier `classeur.json` d'un **dépôt GitHub privé, séparé de celui du site**. Le fichier est chiffré (AES-GCM, clé tirée par PBKDF2 d'un code de synchronisation choisi par le professeur). Le code n'est jamais enregistré : chaque appareil ne garde que la clé et le jeton GitHub (permission *Contents : Read and write* sur ce seul dépôt). Si deux appareils ont modifié le classeur, il demande quelle version garder. La version écartée est gardée sur l'appareil, dans `revisions6e-classeur-ecarte`.

Dans l'onglet Séances, le bouton **✏️ Modifier les textes de cette séance** permet de changer le titre, le cours, l'activité, le texte des étapes du déroulé (repris dans le contenu de séance pour École Directe) et les devoirs. Ces textes sont rangés dans `data.perso` (par séance, seulement ce qui diffère de l'original de `SEANCES` / `BLOCS`). Ils sont donc enregistrés et synchronisés avec les classes. Les durées et la planification ne changent pas.

