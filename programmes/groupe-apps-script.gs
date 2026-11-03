/**
 * Liste d'exercices filtrée par groupe, dans le Google Sheets des programmes (compte du coach).
 *
 * Installation (une fois) : Extensions → Apps Script → coller ce code → Enregistrer (icône disquette).
 * Aucun déploiement ni autorisation : c'est un déclencheur simple, il agit dès qu'on modifie la colonne Groupe (C).
 *
 * Prérequis : onglet « Listes » avec, à partir de H1, les colonnes Groupes, Jambes, Dos, Pecs, Épaules, Bras, Abdos, Cardio
 * (fichier listes-par-groupe.csv). Quand on choisit un groupe en colonne C, la liste déroulante de la colonne D (Exercice)
 * de la même ligne ne propose plus que les exercices de ce groupe. Groupe vide = liste complète (Listes!B).
 */
const COL_GROUPE = 3;      // C
const COL_EXERCICE = 4;    // D
const PREMIERE_COL_GROUPES = 9; // I : Jambes (H = liste des groupes)
const AUTRES_ONGLETS = ['Listes', 'Aide'];

function onEdit(e) {
  if (!e || !e.range) return;
  const feuille = e.range.getSheet();
  if (AUTRES_ONGLETS.indexOf(feuille.getName()) !== -1) return;
  const r = e.range;
  if (r.getColumn() > COL_GROUPE || r.getLastColumn() < COL_GROUPE) return;
  const listes = e.source.getSheetByName('Listes');
  if (!listes) return;
  const entetes = listes.getRange(1, PREMIERE_COL_GROUPES, 1, 12).getValues()[0].map(function (v) { return String(v).trim(); });
  const dernier = Math.max(2, listes.getLastRow());
  const debut = Math.max(2, r.getRow());
  for (let ligne = debut; ligne <= r.getLastRow(); ligne++) {
    const groupe = String(feuille.getRange(ligne, COL_GROUPE).getValue() || '').trim();
    const i = groupe ? entetes.indexOf(groupe) : -1;
    const source = i >= 0
      ? listes.getRange(2, PREMIERE_COL_GROUPES + i, dernier - 1, 1)
      : listes.getRange(2, 2, dernier - 1, 1); // liste complète
    const regle = SpreadsheetApp.newDataValidation().requireValueInRange(source, true).setAllowInvalid(true).build();
    feuille.getRange(ligne, COL_EXERCICE).setDataValidation(regle);
  }
}
