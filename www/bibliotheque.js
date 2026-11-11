// Bibliothèque de programmes prêts à ajouter (programmes génériques, à adapter à ton niveau).
// `variante` : équivalent sur machine guidée, proposé quand la séance est lancée en mode Machine.
// Images : Free Exercise DB (domaine public), voir img/SOURCE.md.
window.STOCK_EXTRA = ['leg_press', 'chest_press', 'seated_row', 'shoulder_press_machine', 'leg_curl_couche', 'crunch_machine',
  'dev_couche_halteres', 'rowing_halteres', 'dev_epaules_halteres', 'elevations_laterales', 'curl_marteau', 'dips_banc',
  'goblet_squat', 'souleve_roumain', 'fentes_halteres', 'leg_curl_assis', 'mollets_presse', 'gainage', 'russian_twist',
  // Variantes « machine guidée » (voir img/SOURCE.md : Free Exercise DB et wger.de)
  'm_hack_squat', 'm_deadlift', 'm_split_squat', 'm_lat_pulldown', 'm_seated_row', 'm_curl', 'm_incline_press',
  'm_shoulder_press', 'm_triceps_ext', 'm_dips', 'm_leg_curl_couche', 'm_leg_curl_assis'];

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
      { nom: 'Tirage vertical', series: 3, reps: '12', repos_s: 90, machine: 'Machine tirage vertical (lat pulldown)', img: 'tirage_vertical', variante: { nom: 'Tirage vertical', machine: 'Machine tirage vertical (lat pulldown)', img: 'm_lat_pulldown' } },
      { nom: 'Tirage horizontal assis', series: 3, reps: '12', repos_s: 90, machine: 'Tirage horizontal assis (poulie basse)', img: 'seated_row', variante: { nom: 'Rowing assis machine', machine: 'Machine rowing assis (seated row)', img: 'm_seated_row' } },
      { nom: 'Développé épaules machine', series: 3, reps: '12', repos_s: 90, machine: 'Machine shoulder press', img: 'shoulder_press_machine', variante: { nom: 'Développé épaules machine', machine: 'Machine shoulder press', img: 'm_shoulder_press' } },
      { nom: 'Leg curl couché', series: 3, reps: '12', repos_s: 60, machine: 'Machine leg curl couché', img: 'leg_curl_couche', variante: { nom: 'Leg curl couché', machine: 'Machine leg curl couché', img: 'm_leg_curl_couche' } },
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
      { nom: 'Développé couché haltères', series: 4, reps: '8-10', repos_s: 120, machine: 'Banc plat + haltères', img: 'dev_couche_halteres', variante: { nom: 'Chest press', machine: 'Machine chest press', img: 'chest_press' } },
      { nom: 'Rowing haltères buste penché', series: 4, reps: '10', repos_s: 90, machine: 'Haltères', img: 'rowing_halteres', variante: { nom: 'Rowing assis machine', machine: 'Machine rowing assis (seated row)', img: 'm_seated_row' } },
      { nom: 'Développé épaules haltères', series: 3, reps: '10', repos_s: 90, machine: 'Banc à dossier + haltères', img: 'dev_epaules_halteres', variante: { nom: 'Développé épaules machine', machine: 'Machine shoulder press', img: 'm_shoulder_press' } },
      { nom: 'Élévations latérales', series: 3, reps: '12-15', repos_s: 60, machine: 'Haltères légers', img: 'elevations_laterales' },
      { nom: 'Curl marteau', series: 3, reps: '12', repos_s: 60, machine: 'Haltères', img: 'curl_marteau', variante: { nom: 'Curl biceps machine', machine: 'Machine curl biceps', img: 'm_curl' } },
      { nom: 'Dips sur banc', series: 3, reps: '12', repos_s: 60, machine: 'Banc plat', img: 'dips_banc', variante: { nom: 'Dips machine assistée', machine: 'Machine dips assistée', img: 'm_dips' } }
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
      { nom: 'Goblet squat', series: 4, reps: '12', repos_s: 90, machine: 'Haltère ou kettlebell', img: 'goblet_squat', variante: { nom: 'Presse à cuisses', machine: 'Presse à cuisses (leg press)', img: 'leg_press' } },
      { nom: 'Soulevé de terre roumain', series: 4, reps: '10', repos_s: 90, machine: 'Barre ou haltères', img: 'souleve_roumain', variante: { nom: 'Soulevé de terre à la machine', machine: 'Machine soulevé de terre (leverage)', img: 'm_deadlift' } },
      { nom: 'Fentes haltères', series: 3, reps: '10', par_cote: true, repos_s: 60, machine: 'Haltères', img: 'fentes_halteres', variante: { nom: 'Fente à la Smith machine', machine: 'Smith machine', img: 'm_split_squat' } },
      { nom: 'Leg curl assis', series: 3, reps: '12', repos_s: 60, machine: 'Machine leg curl assis', img: 'leg_curl_assis', variante: { nom: 'Leg curl assis', machine: 'Machine leg curl assis', img: 'm_leg_curl_assis' } },
      { nom: 'Mollets à la presse', series: 3, reps: '15', repos_s: 60, machine: 'Presse à cuisses', img: 'mollets_presse' },
      { nom: 'Gainage planche', series: 3, reps: '45 s', repos_s: 45, machine: 'Tapis', img: 'gainage' },
      { nom: 'Russian twist', series: 3, reps: '20', repos_s: 45, machine: 'Tapis (+ disque)', img: 'russian_twist' }
    ],
    finisher: { exercice: 'Vélo', objectif: '10 min, 30 s rapide / 30 s lent.' }
  }
];
