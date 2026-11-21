# Site « sixième » — consignes pour Claude

## Corriger un contrôle papier (PDF de copies scannées)

Quand le professeur donne un PDF de copies « Contrôle » (code de copie en haut à gauche, ex. `BMG-03`) :

1. **Préparer, en une seule commande** (ne rien chercher d'autre, ne pas demander le fichier de correction) :
   ```bash
   cd "C:/Users/mimib/Desktop/API EcoleDirecte/ecoledirecte-api"
   node --env-file=.env scripts/controle-correction.ts "<chemin du PDF>" [ID]
   ```
   Le script extrait les pages (`%TEMP%\controle-ID\p01.jpg…`, 1240 px de large), garde la pleine résolution dans
   `%TEMP%\controle-ID\hd\`, récupère le fichier pour la correction assistée dans `prof.json` (dépôt privé, chiffré)
   et affiche le nombre de questions par compétence de chaque copie (les copies aménagées en ont moins).
   Si l'ID n'est pas deviné d'après le nom du PDF, il liste les contrôles : lire le code sur la 1re page et relancer.

2. **Lire les copies** : chaque page une seule fois, 3 ou 4 par message. Calculer soi-même les réponses à partir
   des énoncés imprimés. `corrige-compact.txt` (une ligne par question, ex. `grep "BMG-08 Q8"`) seulement pour une
   question douteuse ; ne pas lire `correction.txt` en entier.
   **Doute de lecture** (chiffre ou virgule peu lisible, rature, deux cases marquées, réponse surlignée mais pas
   cochée, case presque vide…) : **ne jamais choisir seul**. Relire d'abord cette page dans `hd\` ; si le doute
   reste, **poser la question au professeur** avec l'outil de question (copie, prénom, question, ce qui est lu, les
   deux lectures possibles, image de la zone si possible) et **attendre sa réponse** avant de donner la ligne de cette
   copie. Regrouper les doutes en une ou deux séries de questions plutôt que de les poser un par un.

3. **Noter** :
   - Par question : `1` si entièrement juste, `0` sinon (ces chiffres alimentent le corrigé en ligne de l'élève).
     Deux cases cochées = 0.
   - On ne compte pas tout faux quand une partie du raisonnement est juste : une question **en partie juste**
     (inattention : retenue, virgule, recopie ; une étape fausse puis la suite cohérente ; 2 calculs justes sur 3 ;
     problème pas terminé) garde `0` mais compte **½ pour le niveau**.
   - Niveau = (justes + ½ × en partie justes) / nombre de questions : tout = TB, ≥ 2/3 MS, ≥ 1/3 MF, sinon MI.
     Une seule question (le problème), jugée d'abord sur le choix des opérations : tout juste TB ; bonnes
     opérations à chaque étape, même avec des erreurs de calcul, ou problème presque fini (dernière étape
     manquante) MS ; au moins une étape juste (bonne opération ou calcul juste), ou juste avec les nombres de
     l'élève, MF ; aucune MI.
   - Le niveau écrit dans la ligne l'emporte sur les chiffres : le site le lit tel quel.

4. **Répondre en 4 parties** :
   1. **À vérifier** : les copies absentes du scan, et le rappel des doutes de lecture tranchés par le professeur.
      Aucun doute ne doit rester sans avoir été posé.
   2. **Lignes à coller**, dans l'ordre des codes, sans aucune remarque :
      `BMG-03 C1=MF(100) C2=MF(00001) C3=MS(0)`
   3. **À écrire sur les copies** : **une fiche par élève**, affichée avec l'outil de visuel interactif
      (`show_widget`), avec des flèches ← → (boutons et clavier) pour passer d'un élève à l'autre, dans l'**ordre des
      pages du scan**. Ne pas répéter les fiches en texte. Si l'outil n'est pas disponible : un tableau, une ligne
      par copie. Chaque fiche : prénom (lu sur la bande ; sinon le code), n° de page, code, niveaux C1 C2 C3,
      Q1, Q2… avec ✓ (juste), ½ (en partie juste) ou ✗ (faux ou vide), puis la Remarque. Une question à plusieurs calculs (ex. priorités D, C, E) : marquer chaque
      calcul dans l'ordre de la copie (« D✓ C✗ E✓ ») pour que le professeur valide ou barre chacun. Le problème :
      marquer chaque étape (« Dépense✗ Reçue✓ Finale✓* », ✓* = calcul juste avec les nombres de l'élève), puis
      le niveau. Une question à cases : préciser la case fausse (« ½ 3e case »). Au moins une remarque par copie
      (si tout est juste : un mot sur le travail). La remarque : 1 ou 2 phrases courtes et didactiques qui
      réengagent l'élève : ce qui est réussi, une piste pour trouver soi-même l'erreur (question à se poser, ordre de
      grandeur, vérification), ou un renvoi au corrigé en ligne. Pas de correction toute faite.
   4. **Bilan pour la classe** (à dire en rendant les copies, sans nommer personne) : ce qui est réussi par la
      plupart ; 2 ou 3 erreurs fréquentes avec la question, le nombre de copies et une piste à reprendre ensemble ;
      un mot d'encouragement.

Les mêmes règles sont écrites dans le fichier de correction produit par le site (`aiText` dans `script.js`) : si on
les change, changer les deux. Les pages scannées restent dans le dossier temporaire : ne jamais les copier dans le
projet (les bandes portent parfois les prénoms).

Après la correction, le professeur colle les lignes dans « Résultats » (Espace professeur) puis clique sur
« Mettre les résultats en ligne » : `resultats/ID.json` (dépôt public du site, codes anonymes, aucun prénom). L'élève
scanne le QR de sa copie (`#/m/ABC-07`) ou tape son code sur `#/m`, et arrive sur sa page « Mon contrôle » (corrigé de
son sujet, détail par question, exercices de remédiation). Les étiquettes QR restent possibles.

## Jeux (solo + duel sur tablette)

- `jeux-commun/moteur.js` et `moteur.css` (questions, pavés, écran coupé gauche/droite, `Moteur.match` pour les duels au
  tour par tour) et le dossier `jeu-trigone/` sont **identiques dans les deux sites** : toute modification se recopie
  dans l'autre site (Trigone choisit sa version avec `<body data-niveau="6|5">`).
- Un nouveau jeu doit avoir un mode solo et un mode duel, et une vraie mécanique où les décisions du joueur sont des
  décisions mathématiques (pas un quiz habillé, pas seulement une course).
