# Mettre à jour les listes déroulantes du tableau du coach

Le modèle `Training-programmes.xlsx` contient maintenant tous les exercices de l'appli (environ 470 noms, rangés par groupe musculaire) et les machines (environ 75) dans l'onglet **Listes**. Les noms correspondent à ceux du catalogue : l'appli retrouve alors toute seule l'image et la machine de l'exercice.

Le vrai tableau Google (compte du coach) n'est pas modifié automatiquement. Pour y mettre les nouvelles listes :

1. Ouvrir `listes-exercices-machines.csv` (ce dossier) dans un tableur ou un éditeur de texte.
2. Dans le Google Sheets, onglet **Listes** : coller la colonne *Exercice* à partir de la cellule **B2** et la colonne *Machine* à partir de **F2** (les anciennes valeurs peuvent être remplacées ; garder « Aide » et les autres colonnes).
3. Pour chaque onglet de programme (Commun, Nouvel élève, un onglet par client) : sélectionner la colonne **Exercice** (C) → *Données → Validation des données* → modifier la règle : plage de la liste `Listes!B2:B900`. Idem pour la colonne **Machine** (G) : `Listes!F2:F900`. Choisir « Afficher un avertissement » plutôt que « Rejeter » pour pouvoir saisir un exercice libre.
4. Astuce : faire l'étape 3 une fois dans « Nouvel élève », qui sert de modèle aux futurs clients.

Les anciens programmes ne sont pas touchés.

## Version avec colonne « Groupe » (liste d'exercices filtrée)

Colonne **Groupe** (Jambes, Dos, Pecs, Épaules, Bras, Abdos, Cardio) en C, avant **Exercice** (D) : on choisit d'abord le groupe, la liste des exercices ne montre alors que ceux du groupe. Groupe vide = liste complète. L'appli ignore cette colonne (elle lit les colonnes par leur nom) : les anciens tableaux continuent de marcher.

Dans Google Sheets, une liste déroulante ne peut pas dépendre d'une autre cellule par formule : on utilise un petit script (déclencheur simple, sans autorisation).

1. Onglet **Listes** : coller `listes-par-groupe.csv` à partir de la cellule **H1** (colonnes Groupes, Jambes, Dos, Pecs, Épaules, Bras, Abdos, Cardio).
2. Dans chaque onglet de programme (d'abord « Nouvel élève ») : insérer une colonne **C** nommée *Groupe*. Validation de C2:C500 : *Menu déroulant (depuis une plage)* = `Listes!H2:H20`.
3. Validation de **D2:D500** (Exercice) : *Menu déroulant (depuis une plage)* = `Listes!B2:B900`, option « Afficher un avertissement ». C'est la liste complète par défaut.
4. *Extensions → Apps Script* : coller le contenu de `groupe-apps-script.gs`, Enregistrer. Rien d'autre à faire.

Un message « Liste … appliquée » s'affiche en bas à droite à chaque choix de groupe (s'il n'apparaît jamais, le script n'est pas enregistré ou pas dans ce Sheets). Test : en C2 choisir « Jambes » → la liste en D2 ne montre que des exercices de jambes. Les lignes dont le groupe n'a pas été (re)choisi gardent la liste complète.

## Liste déroulante pour la colonne « Séance » (A)

Dans l'onglet **Listes**, colonne **Q** : « Séances » en Q1, puis Jambes, Dos / Biceps, Pecs / Triceps, Épaules / Abdos, Haut du corps, Bas du corps, Full body, Cardio (à compléter). Dans chaque onglet de programme : validation de **A2:A500** = *Menu déroulant (depuis une plage)* `Listes!Q2:Q50`, avec avertissement (un autre nom reste accepté). Le nom de séance doit rester identique sur toutes les lignes d'une même séance.

## Colonne « Variante » (mode Libre / Machine)

Colonne facultative **Variante**, n'importe où (l'appli lit les colonnes par leur nom) : le nom de l'exercice équivalent sur **machine guidée**, par exemple « Chest press » pour « Développé couché ». Si au moins un exercice d'une séance a une variante, l'appli propose « Commencer en libre » ou « Commencer sur machines » ; sur machines, chaque exercice qui a une variante est remplacé par celle-ci (séries, reps et repos conservés). Ligne sans variante = exercice inchangé dans les deux modes. Anciens tableaux sans cette colonne : rien ne change.

L'image et la machine sont retrouvées d'après le nom (même liste que la colonne Exercice) : choisir de préférence un nom de la liste. Validation conseillée : *Menu déroulant (depuis une plage)* `Listes!B2:B900`, avec « Afficher un avertissement ».

## Lignes « Étirement » (retour au calme)

Type **Étirement** : une ligne par étirement, nom dans *Exercice*, durée dans *Reps* (« 30 s », « 45 s », « 1 min » ; 30 s par défaut), *Par côté* = oui si chaque côté. S'il n'y en a aucune, l'appli propose d'elle-même 4 étirements selon les groupes musculaires travaillés (liste `ETIREMENTS` dans `www/remplacements.js`, photos Free Exercise DB). Un nom identique à un étirement de cette liste reprend sa photo.

## Ligne « Finisher » avec des séries

Type **Finisher** : sans *Séries*, c'est une simple case à cocher (texte dans *Note*, ou *Reps*). Avec *Séries* rempli (ex. 10 séries, Reps « 15 » ou « 15 en 1 min », Repos « 0:30 »), c'est un exercice normal avec une case par série et un repos, affiché en dernier avec le badge Finisher, juste avant le retour au calme.

## Répétitions dans un temps donné (« 15 en 1 min »)

Dans *Reps*, écrire **15 en 1 min** (ou « 12 en 45 s », « 10 en 1:30 ») : l'appli compte 15 répétitions à faire dans cette durée. Chaque série a un bouton ⏱ qui lance le minuteur de la série : à la fin (ou avec « Passer ») la série est cochée, et il n'y a pas de repos en plus, le repos est le temps restant. Marche pour un Exercice comme pour un Finisher avec *Séries*. Exemple : `;Pecs / Triceps;Finisher;Pompes;10;15 en 1 min;;;non;Pompes, répéter 10 fois.`
