# Training pour PC (Linux)

La même appli que sur Android (`../www`), dans une fenêtre Electron, livrée en AppImage.

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

Le workflow `.github/workflows/desktop.yml` le fait à chaque build Android et ajoute le fichier à la release `v0.1.N`.
