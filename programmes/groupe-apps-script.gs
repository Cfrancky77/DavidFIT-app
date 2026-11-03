/**
 * Liste d'exercices filtrée par groupe, dans le Google Sheets des programmes (compte du coach).
 *
 * Installation (une fois) : Extensions → Apps Script → coller ce code (en remplaçant tout) → Enregistrer (icône disquette).
 * Aucun déploiement ni autorisation : c'est un déclencheur simple, il agit dès qu'on modifie la colonne Groupe (C).
 *
 * Prérequis : onglet « Listes » dont la ligne 1 contient, quelque part, les titres Jambes, Dos, Pecs, Épaules, Bras, Abdos, Cardio
 * (fichier listes-par-groupe.csv). Quand on choisit un groupe en colonne C, la liste déroulante de la colonne D (Exercice)
 * de la même ligne ne propose plus que les exercices de ce groupe. Groupe vide = liste complète (colonne « Exercice » de Listes).
 * Un message « Filtre … » s'affiche en bas à droite à chaque changement : s'il n'apparaît pas, le script ne s'exécute pas.
 */
const COL_GROUPE = 3;      // C
const COL_EXERCICE = 4;    // D
const AUTRES_ONGLETS = ['Listes', 'Aide'];

// Minuscules sans accents ni espaces superflus : « Épaules » = « epaules » = « Épaules ».
function cle_(v) {
  return String(v === undefined || v === null ? '' : v).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const feuille = e.range.getSheet();
    if (AUTRES_ONGLETS.indexOf(feuille.getName()) !== -1) return;
    const r = e.range;
    if (r.getRow() < 2 || r.getColumn() > COL_GROUPE || r.getLastColumn() < COL_GROUPE) return;
    const listes = e.source.getSheetByName('Listes');
    if (!listes) { e.source.toast('Onglet « Listes » introuvable.', 'Filtre par groupe', 6); return; }
    const entetes = listes.getRange(1, 1, 1, listes.getLastColumn()).getValues()[0].map(cle_);
    const dernier = Math.max(2, listes.getLastRow());
    const colComplete = entetes.indexOf('exercice') + 1 || 2;
    let message = '';
    for (let ligne = Math.max(2, r.getRow()); ligne <= r.getLastRow(); ligne++) {
      const groupe = cle_(feuille.getRange(ligne, COL_GROUPE).getValue());
      const col = groupe ? entetes.indexOf(groupe) + 1 : 0;
      const source = listes.getRange(2, col || colComplete, dernier - 1, 1);
      const regle = SpreadsheetApp.newDataValidation().requireValueInRange(source, true).setAllowInvalid(true).build();
      feuille.getRange(ligne, COL_EXERCICE).setDataValidation(regle);
      message = groupe && !col ? 'Groupe « ' + groupe + ' » inconnu : liste complète.' : (col ? 'Liste « ' + groupe + ' » appliquée.' : 'Liste complète appliquée.');
    }
    e.source.toast(message, 'Filtre par groupe', 4);
  } catch (err) {
    e.source.toast('Erreur : ' + err.message, 'Filtre par groupe', 10);
  }
}
