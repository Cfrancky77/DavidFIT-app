# Training

Application Android de suivi des séances en salle, personnalisable pour un coach. Données 100 % locales, sans compte.

## Ce que fait l'appli
- Les 3 séances du coach (jambes, dos/biceps, pecs/triceps) avec échauffement et finisher.
- Pour chaque exercice : la **machine conseillée** et une alternative si elle est occupée (modifiable).
- Saisie **kg / reps** par série, charges de la séance précédente pré-remplies.
- **Minuteur de repos** automatique quand on coche une série (vibration + bip).
- Accueil avec la semaine en cours et la prochaine séance conseillée ; thème clair / sombre / système.
- **Historique**, **agenda** mensuel des séances faites, **courbe de progression** des charges par exercice.
- Export / import d'une sauvegarde (texte JSON).

Tout reste sur le téléphone, sans compte ni connexion.

## Récupérer l'APK
Chaque push lance le workflow **APK Android** (onglet *Actions*) :
- l'APK est dans l'artefact `Training-apk` du run ;
- il est aussi publié dans *Releases* : https://github.com/proprietaire/depot/releases/latest (`Training.apk`).

Sur le téléphone : télécharger `Training.apk`, autoriser l'installation depuis cette source, installer.
Les mises à jour s'installent par-dessus sans perdre les données (clé de signature fixe `ci/debug.keystore`).

## Personnaliser pour le coach
- `www/branding.js` : nom de l'appli, nom du coach, message d'accueil, coordonnées (page Contact dans Réglages, affichée si au moins une est remplie).
- `www/branding/logo.png` : logo en haut de l'accueil.
- `assets/icon-only.png`, `icon-foreground.png`, `icon-background.png` (1024 px) et `splash.png` / `splash-dark.png` (2732 px) : icône et écran de démarrage, générés au build par `@capacitor/assets`.
- `capacitor.config.json` → `appName` : nom sous l'icône du téléphone.

## Programmes
- **Entraînement → + Créer** : nouveau programme saisi à la main (exercices, séries, reps, repos, machine).
- **Bibliothèque** : programmes génériques prêts à ajouter (`www/bibliotheque.js`).
- **Importer** : fichier `.json` ou texte collé ; **Partager** (sur la fiche d'un programme) copie ce texte.
- Format : voir `programmes/exemple.json`. Champ `img` facultatif = nom d'une image de `www/img` (sans `_0.jpg`).

### Tableau (CSV) : le format pour le coach
- Modèle : `programmes/modele.csv` (les 3 séances + un exemple de programme perso). S'ouvre dans Excel, LibreOffice ou Google Sheets.
- Colonnes : `Client ; Séance ; Type ; Exercice ; Séries ; Reps ; Repos ; Machine ; Par côté ; Note`.
  - `Type` : `Exercice` (par défaut), `Échauffement` (durée dans Reps, ex. `5 min` ; récupération après l'échauffement dans Repos, ex. `1:00`, 1 min si vide), `Finisher` (objectif dans Note), `Consigne` (texte dans Note).
  - `Reps` peut être une durée (`30 s`, `45 s`, `1 min`) pour un exercice tenu (gainage…) : l'appli affiche alors un chrono par série, qui coche la série et lance le repos à la fin.
  - `Repos` : `90`, `1:30` ou `1 min 30`. `Par côté` : `oui` / `non`.
  - `Client` : vide = pour tout le monde ; sinon prénom ou e-mail de l'élève (plusieurs séparés par des virgules).
- Séparateur `;`, `,` ou tabulation, détecté tout seul. **Importer** accepte le fichier `.csv` ou les lignes collées ; **Exporter en tableau** (fiche d'un programme) fait l'inverse.

### Programmes du coach en ligne
**Mode onglets (actif)** : `programmesSheet` dans `www/branding.js` = identifiant du Google Sheets (partagé « Tous les utilisateurs disposant du lien : lecteur »).
Onglet `Commun` = séances pour tous ; un onglet par élève, nommé avec son code client (ex. `MD202615`), mêmes colonnes sans `Client`.
L'élève saisit son code au premier lancement ou dans Réglages. Conseil : formater les colonnes en **Texte brut** (Format → Nombre) pour que Google ne transforme pas `8-10` en date.

**Variante lien unique** : `programmesUrl` = lien CSV publié d'un Google Sheets (Fichier → Partager → Publier sur le Web → la feuille → CSV).
L'appli le relit au démarrage et à l'ouverture d'Entraînement (au plus une fois par heure, bouton **Actualiser** pour forcer) et affiche
les lignes sans client + celles dont la colonne `Client` correspond au **code client** saisi dans Réglages (à défaut, le prénom).
Ce n'est pas une connexion sécurisée : quiconque a le lien publié peut lire tout le tableau.

## Modifier les séances
Les séances sont dans `www/seances.js` (exercices, séries, reps, repos, machine conseillée et alternatives).

## Structure
- `www/` : l'appli (HTML/CSS/JS sans framework)
- `capacitor.config.json` : emballage Android via Capacitor
- `.github/workflows/android.yml` : compilation de l'APK


> Copie publique anonymisée : marque, logo, icônes, contact, lien du tableau et programmes du coach retirés.
