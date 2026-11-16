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
   **Doute de lecture** (virgule, retenue, petit chiffre dans une case, rature) : relire cette page dans `hd\`.

3. **Noter** :
   - Par question : `1` si entièrement juste, `0` sinon (ces chiffres alimentent le corrigé en ligne de l'élève).
     Deux cases cochées = 0.
   - On ne compte pas tout faux quand une partie du raisonnement est juste : une question **en partie juste**
     (inattention : retenue, virgule, recopie ; une étape fausse puis la suite cohérente ; 2 calculs justes sur 3 ;
     problème pas terminé) garde `0` mais compte **½ pour le niveau**.
   - Niveau = (justes + ½ × en partie justes) / nombre de questions : tout = TB, ≥ 2/3 MS, ≥ 1/3 MF, sinon MI.
     Une seule question (le problème) : juste TB, l'essentiel juste MS, un début MF, rien MI.
   - Le niveau écrit dans la ligne l'emporte sur les chiffres : le site le lit tel quel.

4. **Répondre en 4 parties** :
   1. **À vérifier** : uniquement les lectures douteuses (copie, question, ce qui est lu, le choix retenu, la ligne à
      mettre si c'est l'autre lecture) et les copies absentes du scan.
   2. **Lignes à coller**, dans l'ordre des codes, sans aucune remarque :
      `BMG-03 C1=MF(100) C2=MF(00001) C3=MS(0)`
   3. **À écrire sur les copies** : un **tableau**, une ligne par copie dans l'**ordre des pages du scan**.
      Colonnes : n° de page · prénom (lu sur la bande ; sinon le code) · Q1, Q2… avec ✓ (juste), ½ (en partie juste)
      ou ✗ (faux ou vide) · Remarque. Dans une case ½ ou ✗ d'une question à plusieurs calculs ou cases, préciser la
      partie fausse en 1 ou 2 caractères (« ½ E »). Au moins une remarque par copie (si tout est juste : un mot sur
      le travail). La remarque : 1 ou 2 phrases courtes et didactiques qui
      réengagent l'élève : ce qui est réussi, une piste pour trouver soi-même l'erreur (question à se poser, ordre de
      grandeur, vérification), ou un renvoi au corrigé en ligne. Pas de correction toute faite.
   4. **Bilan pour la classe** (à dire en rendant les copies, sans nommer personne) : ce qui est réussi par la
      plupart ; 2 ou 3 erreurs fréquentes avec la question, le nombre de copies et une piste à reprendre ensemble ;
      un mot d'encouragement.

Les mêmes règles sont écrites dans le fichier de correction produit par le site (`aiText` dans `script.js`) : si on
les change, changer les deux. Les pages scannées restent dans le dossier temporaire : ne jamais les copier dans le
projet (les bandes portent parfois les prénoms).

Après la correction, le professeur colle les lignes dans « Résultats » (Espace professeur) et imprime les étiquettes :
prénom, code, niveaux, et un QR vers la page « Mon contrôle » de l'élève (corrigé de son sujet, détail par question,
exercices de remédiation).
