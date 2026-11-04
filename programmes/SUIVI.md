# Recevoir la progression des élèves (côté coach)

Les élèves qui le souhaitent activent **Réglages → Partager ma progression avec mon coach**. Après chaque séance, l'appli envoie un résumé :
code client, date, séance, exercices, séries (kg × reps ou durée), échauffement / finisher faits, note. Pas de prénom, de taille ni de poids.
Les retours arrivent dans un Google Sheets **privé**, un exercice par ligne.

> Ce Google Sheets doit rester **privé** (jamais partagé par lien) et être **différent** du tableau des programmes, qui, lui, est lisible par lien.

## Installation (une fois, depuis le compte du coach, ~5 minutes)
1. Créer un **nouveau Google Sheets vide** (ex. « Suivi des élèves »). Ne pas le partager.
2. Menu **Extensions → Apps Script**. Supprimer le code présent, coller tout le contenu de [`suivi-apps-script.gs`](suivi-apps-script.gs), enregistrer.
3. **Déployer → Nouveau déploiement** → type **Application Web** :
   - *Exécuter en tant que* : **Moi** ;
   - *Qui a accès* : **Tout le monde** (l'appli des élèves n'a pas de compte Google ; le script ne sait qu'**ajouter** des lignes, il ne donne accès à rien).
4. Autoriser quand Google le demande (écran « Google n'a pas validé cette appli » : *Paramètres avancés → Accéder à… → Autoriser*).
5. Copier l'adresse **Application Web** (elle finit par `/exec`). L'ouvrir dans un navigateur : elle doit afficher `{"ok":true,"service":"suivi"}`.
6. Donner **uniquement cette adresse `/exec`** à la personne qui gère l'appli (jamais le lien du Google Sheets de suivi : il ne doit figurer nulle part dans l'appli ni dans le code). Elle la met dans `www/branding.js` (`partageUrl`) puis publie une nouvelle version. Tant qu'elle est vide, l'option n'apparaît pas chez les élèves.

L'onglet **Suivi** (tous les élèves) se crée au premier envoi, ainsi qu'un **onglet par élève** nommé d'après son code client (ex. FC202611), alimenté automatiquement. Pour lire un seul élève : ouvrir son onglet. Pour tout voir : *Données → Créer un filtre* (par code client), ou un tableau croisé dynamique pour suivre la charge par exercice.
Modifier le script plus tard : *Déployer → Gérer les déploiements → modifier → Nouvelle version* (l'adresse ne change pas).

## À savoir
- Une séance déjà reçue est ignorée (pas de doublons), un envoi raté (hors ligne) repart tout seul plus tard.
- L'adresse du script est dans l'appli : quelqu'un pourrait y envoyer de fausses lignes. Les lignes portent un code client : le tri par code les repère.
- Ce sont des données de santé : n'activer l'option qu'avec l'accord des élèves, et ne pas partager le Sheets de suivi.

## Mode coach dans l'appli (lecture du suivi sans passer par le Google Sheets)
1. Mettre à jour le script (coller la nouvelle version de [`suivi-apps-script.gs`](suivi-apps-script.gs), puis *Déployer → Gérer les déploiements → modifier → Nouvelle version*).
2. Dans Apps Script : roue crantée **Paramètres du projet → Propriétés du script → Ajouter** : nom `CODE_COACH`, valeur = un code **long et secret** (ex. 16 caractères au hasard). Sans cette propriété, la lecture reste impossible.
3. Dans l'appli : **Réglages → 7 appuis rapides sur la ligne de version** → carte « Mode coach » → saisir le code (gardé sur l'appareil du coach, à re-saisir si changé).
Écrans : liste des élèves (dernière séance, jours d'entraînement sur 4 semaines) ; par élève : régularité, séances du programme faites et % d'exercices faits, évolution des charges (8 semaines), dernières séances avec notes.
Sécurité : le code est vérifié par le script (3000 dernières lignes au plus renvoyées, essai raté ralenti de 1,5 s). Quiconque connaît le code lit les données de tous les élèves : ne pas le partager aux élèves.
