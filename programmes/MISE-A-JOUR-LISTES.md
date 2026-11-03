# Mettre à jour les listes déroulantes du tableau du coach

Le modèle `Training-programmes.xlsx` contient maintenant tous les exercices de l'appli (environ 470 noms, rangés par groupe musculaire) et les machines (environ 75) dans l'onglet **Listes**. Les noms correspondent à ceux du catalogue : l'appli retrouve alors toute seule l'image et la machine de l'exercice.

Le vrai tableau Google (compte du coach) n'est pas modifié automatiquement. Pour y mettre les nouvelles listes :

1. Ouvrir `listes-exercices-machines.csv` (ce dossier) dans un tableur ou un éditeur de texte.
2. Dans le Google Sheets, onglet **Listes** : coller la colonne *Exercice* à partir de la cellule **B2** et la colonne *Machine* à partir de **F2** (les anciennes valeurs peuvent être remplacées ; garder « Aide » et les autres colonnes).
3. Pour chaque onglet de programme (Commun, Nouvel élève, un onglet par client) : sélectionner la colonne **Exercice** (C) → *Données → Validation des données* → modifier la règle : plage de la liste `Listes!B2:B900`. Idem pour la colonne **Machine** (G) : `Listes!F2:F900`. Choisir « Afficher un avertissement » plutôt que « Rejeter » pour pouvoir saisir un exercice libre.
4. Astuce : faire l'étape 3 une fois dans « Nouvel élève », qui sert de modèle aux futurs clients.

Les anciens programmes ne sont pas touchés.

## Version avec colonne « Groupe » (liste d'exercices filtrée)

Le modèle `Training-programmes.xlsx` a maintenant une colonne **Groupe** (Jambes, Dos, Pecs, Épaules, Bras, Abdos, Cardio) avant **Exercice** : on choisit d'abord le groupe, la liste des exercices ne montre alors que ceux du groupe. Groupe vide = liste complète. L'appli ignore cette colonne (elle lit les colonnes par leur nom), les anciens tableaux continuent donc de fonctionner.

Pour l'avoir dans le vrai Google Sheets :
1. Onglet **Listes** : coller `listes-par-groupe.csv` à partir de la cellule **H1** (colonnes Groupes, Jambes, Dos, Pecs, Épaules, Bras, Abdos, Cardio).
2. *Données → Plages nommées* : créer `Liste_Jambes` = Listes!I2:I200, `Liste_Dos` = J2:J200, `Liste_Pecs` = K2:K200, `Liste_Epaules` = L2:L200, `Liste_Bras` = M2:M200, `Liste_Abdos` = N2:N200, `Liste_Cardio` = O2:O200.
3. Dans chaque onglet de programme (d'abord « Nouvel élève ») : insérer une colonne **C** nommée *Groupe* avec une validation « liste d'après une plage » = `Listes!H2:H20`.
4. Validation de la colonne **Exercice** (maintenant D) : « liste d'après une plage », formule `=INDIRECT("Liste_"&SUBSTITUTE(SUBSTITUTE($C2;"É";"E");" ";""))`, avec avertissement au lieu de rejet.

Non testé directement dans Google Sheets depuis ici (le modèle xlsx est valide pour Excel et LibreOffice) : si l'étape 4 n'est pas acceptée, garder la liste complète (colonne Exercice sans filtre) et dire-le.
