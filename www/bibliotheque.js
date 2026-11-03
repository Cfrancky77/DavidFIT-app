// Bibliothèque de programmes prêts à ajouter (programmes génériques, à adapter à ton niveau).
// Images : Free Exercise DB (domaine public), voir img/SOURCE.md.
window.STOCK_EXTRA = ['leg_press', 'chest_press', 'seated_row', 'shoulder_press_machine', 'leg_curl_couche', 'crunch_machine',
  'dev_couche_halteres', 'rowing_halteres', 'dev_epaules_halteres', 'elevations_laterales', 'curl_marteau', 'dips_banc',
  'goblet_squat', 'souleve_roumain', 'fentes_halteres', 'leg_curl_assis', 'mollets_presse', 'gainage', 'russian_twist'];

window.LIBRARY = [
  {
    id: 'lib_full_body_machines',
    nom: 'Full body machines',
    niveau: 'Débutant',
    description: 'Tout le corps sur machines guidées : idéal pour reprendre ou les jours de fatigue.',
    echauffement: { exercice: 'Vélo', duree_min: 5, resistance: 'Modérée' },
    consigne: 'Charge permettant de finir chaque série avec 2 répétitions en réserve.',
    exercices: [
      { nom: 'Presse à cuisses', series: 3, reps: '12', repos_s: 90, machine: 'Presse à cuisses (leg press)', img: 'leg_press' },
      { nom: 'Chest press', series: 3, reps: '12', repos_s: 90, machine: 'Machine chest press', img: 'chest_press' },
      { nom: 'Tirage vertical', series: 3, reps: '12', repos_s: 90, machine: 'Machine tirage vertical (lat pulldown)', img: 'tirage_vertical' },
      { nom: 'Tirage horizontal assis', series: 3, reps: '12', repos_s: 90, machine: 'Tirage horizontal assis (poulie basse)', img: 'seated_row' },
      { nom: 'Développé épaules machine', series: 3, reps: '12', repos_s: 90, machine: 'Machine shoulder press', img: 'shoulder_press_machine' },
      { nom: 'Leg curl couché', series: 3, reps: '12', repos_s: 60, machine: 'Machine leg curl couché', img: 'leg_curl_couche' },
      { nom: 'Crunch machine', series: 3, reps: '15', repos_s: 60, machine: 'Machine abdominaux', img: 'crunch_machine' }
    ],
    finisher: { exercice: 'Elliptique', objectif: '10 min à allure modérée.' }
  },
  {
    id: 'lib_haut_halteres',
    nom: 'Haut du corps haltères',
    niveau: 'Intermédiaire',
    description: 'Pecs, dos, épaules et bras avec haltères et banc : peu de machines à attendre.',
    echauffement: { exercice: 'Rameur', duree_min: 5, resistance: 'Modérée' },
    consigne: 'Montée en charge progressive sur les deux premiers exercices.',
    exercices: [
      { nom: 'Développé couché haltères', series: 4, reps: '8-10', repos_s: 120, machine: 'Banc plat + haltères', img: 'dev_couche_halteres' },
      { nom: 'Rowing haltères buste penché', series: 4, reps: '10', repos_s: 90, machine: 'Haltères', img: 'rowing_halteres' },
      { nom: 'Développé épaules haltères', series: 3, reps: '10', repos_s: 90, machine: 'Banc à dossier + haltères', img: 'dev_epaules_halteres' },
      { nom: 'Élévations latérales', series: 3, reps: '12-15', repos_s: 60, machine: 'Haltères légers', img: 'elevations_laterales' },
      { nom: 'Curl marteau', series: 3, reps: '12', repos_s: 60, machine: 'Haltères', img: 'curl_marteau' },
      { nom: 'Dips sur banc', series: 3, reps: '12', repos_s: 60, machine: 'Banc plat', img: 'dips_banc' }
    ],
    finisher: { exercice: 'Pompes', objectif: '3 séries au maximum, 1 min de repos.' }
  },
  {
    id: 'lib_bas_abdos',
    nom: 'Bas du corps & abdos',
    niveau: 'Intermédiaire',
    description: 'Cuisses, fessiers, mollets puis gainage.',
    echauffement: { exercice: 'Vélo', duree_min: 5, resistance: 'Modérée' },
    consigne: 'Contrôle la descente sur chaque répétition.',
    exercices: [
      { nom: 'Goblet squat', series: 4, reps: '12', repos_s: 90, machine: 'Haltère ou kettlebell', img: 'goblet_squat' },
      { nom: 'Soulevé de terre roumain', series: 4, reps: '10', repos_s: 90, machine: 'Barre ou haltères', img: 'souleve_roumain' },
      { nom: 'Fentes haltères', series: 3, reps: '10', par_cote: true, repos_s: 60, machine: 'Haltères', img: 'fentes_halteres' },
      { nom: 'Leg curl assis', series: 3, reps: '12', repos_s: 60, machine: 'Machine leg curl assis', img: 'leg_curl_assis' },
      { nom: 'Mollets à la presse', series: 3, reps: '15', repos_s: 60, machine: 'Presse à cuisses', img: 'mollets_presse' },
      { nom: 'Gainage planche', series: 3, reps: '45 s', repos_s: 45, machine: 'Tapis', img: 'gainage' },
      { nom: 'Russian twist', series: 3, reps: '20', repos_s: 45, machine: 'Tapis (+ disque)', img: 'russian_twist' }
    ],
    finisher: { exercice: 'Vélo', objectif: '10 min, 30 s rapide / 30 s lent.' }
  }
];
