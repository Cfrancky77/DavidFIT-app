/**
 * Réception de la progression des élèves → onglet « Suivi » d'un Google Sheets PRIVÉ.
 *
 * Installation (une seule fois, depuis le compte du coach) : voir programmes/SUIVI.md.
 * Le Sheets qui reçoit les retours ne doit JAMAIS être partagé par lien : il est séparé du tableau des programmes.
 * Chaque séance envoyée par l'appli = une ou plusieurs lignes (une par exercice). Une séance déjà reçue est ignorée (id).
 */
const ONGLET = 'Suivi';
const ENTETES = ['Reçu le', 'Id séance', 'Date', 'Code client', 'Séance', 'Exercice', 'Séries (kg × reps, ou durée)', 'Charge max (kg)', 'Volume (kg)', 'Échauffement', 'Finisher', 'Note'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const brut = (e && e.postData && e.postData.contents) || '';
    if (!brut || brut.length > 60000) return reponse_({ ok: false, erreur: 'taille' });
    let p;
    try { p = JSON.parse(brut); } catch (err) { return reponse_({ ok: false, erreur: 'json' }); }
    if (!p || p.v !== 1 || !p.id || !p.client || !Array.isArray(p.exercices)) return reponse_({ ok: false, erreur: 'format' });

    const feuille = feuille_();
    const id = texte_(p.id, 40);
    if (feuille.getLastRow() > 1 && feuille.getRange(2, 2, feuille.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext()) {
      return reponse_({ ok: true, doublon: true });
    }

    const recu = new Date();
    const lignes = p.exercices.slice(0, 40).map(function (ex) {
      const series = (ex.series || []).slice(0, 30);
      const duree = series.length && series[0].duree;
      const kgs = series.map(function (s) { return Number(s.kg) || 0; });
      const volume = duree ? 0 : series.reduce(function (t, s) { return t + (Number(s.kg) || 0) * (Number(s.reps) || 0); }, 0);
      const detail = series.map(function (s) {
        const kg = Number(s.kg) || 0; const v = Number(s.reps) || 0;
        return duree ? (kg ? kg + ' kg · ' : '') + Math.floor(v / 60) + ':' + ('0' + (v % 60)).slice(-2) : kg + '×' + v;
      }).join(' · ');
      return [recu, id, texte_(p.date, 30), texte_(p.client, 60), texte_(p.seance, 80), texte_(ex.nom, 80), detail,
        Math.max.apply(null, kgs.length ? kgs : [0]), Math.round(volume), p.echauffement ? 'oui' : 'non', p.finisher ? 'oui' : 'non', texte_(p.note, 300)];
    });
    if (!lignes.length) lignes.push([recu, id, texte_(p.date, 30), texte_(p.client, 60), texte_(p.seance, 80), '', '', 0, 0, p.echauffement ? 'oui' : 'non', p.finisher ? 'oui' : 'non', texte_(p.note, 300)]);
    feuille.getRange(feuille.getLastRow() + 1, 1, lignes.length, ENTETES.length).setValues(lignes);
    return reponse_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// Pour vérifier le déploiement : ouvrir l'adresse dans un navigateur affiche {"ok":true}.
function doGet() { return reponse_({ ok: true, service: 'suivi' }); }

function feuille_() {
  const classeur = SpreadsheetApp.getActiveSpreadsheet();
  let f = classeur.getSheetByName(ONGLET);
  if (!f) {
    f = classeur.insertSheet(ONGLET);
    f.getRange(1, 1, 1, ENTETES.length).setValues([ENTETES]).setFontWeight('bold');
    f.setFrozenRows(1);
  }
  return f;
}

// Texte brut borné ; une apostrophe devant =, +, - ou @ empêche qu'une cellule soit prise pour une formule.
function texte_(v, max) {
  const t = String(v === undefined || v === null ? '' : v).slice(0, max);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function reponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
