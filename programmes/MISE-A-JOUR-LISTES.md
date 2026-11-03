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
