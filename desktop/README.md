# Training pour PC (Linux et Windows)

La même appli que sur Android (`../www`), dans une fenêtre Electron, livrée en AppImage (Linux) et en installeur `.exe` (Windows).

- Les données (séances, charges, réglages) sont gardées dans `~/.config/training`.
- Les programmes du coach (Google Sheets) fonctionnent comme sur Android.
- Les mises à jour passent par **FCDI Apps** (le bandeau de mise à jour Android est désactivé sur PC).

## Essayer en local

    cd desktop
    npm install
    npm start

## Construire l'AppImage

    cd desktop
    npm run build        # crée dist/Training-x86_64.AppImage

## Construire l'installeur Windows

    cd desktop
    npm run build:win    # crée dist/Training-Setup-x64.exe (à lancer sous Windows)

L'installeur n'est pas signé par un éditeur reconnu : Windows SmartScreen demande confirmation au premier lancement. Pas de FCDI Apps sous Windows : les mises à jour se font en retéléchargeant l'installeur.

Le workflow `.github/workflows/desktop.yml` fait tout cela à chaque build Android et ajoute le fichier à la release `v0.1.N`.
