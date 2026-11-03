# Mettre à jour les listes déroulantes du tableau du coach

Le modèle `Training-programmes.xlsx` contient maintenant tous les exercices de l'appli (environ 470 noms, rangés par groupe musculaire) et les machines (environ 75) dans l'onglet **Listes**. Les noms correspondent à ceux du catalogue : l'appli retrouve alors toute seule l'image et la machine de l'exercice.

Le vrai tableau Google (compte du coach) n'est pas modifié automatiquement. Pour y mettre les nouvelles listes :

1. Ouvrir `listes-exercices-machines.csv` (ce dossier) dans un tableur ou un éditeur de texte.
2. Dans le Google Sheets, onglet **Listes** : coller la colonne *Exercice* à partir de la cellule **B2** et la colonne *Machine* à partir de **F2** (les anciennes valeurs peuvent être remplacées ; garder « Aide » et les autres colonnes).
3. Pour chaque onglet de programme (Commun, Nouvel élève, un onglet par client) : sélectionner la colonne **Exercice** (C) → *Données → Validation des données* → modifier la règle : plage de la liste `Listes!B2:B900`. Idem pour la colonne **Machine** (G) : `Listes!F2:F900`. Choisir « Afficher un avertissement » plutôt que « Rejeter » pour pouvoir saisir un exercice libre.
4. Astuce : faire l'étape 3 une fois dans « Nouvel élève », qui sert de modèle aux futurs clients.

Les anciens programmes ne sont pas touchés.
