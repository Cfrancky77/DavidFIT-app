// Exercices proposés pour remplacer un exercice en cours de séance, classés par groupe musculaire.
// Images : Free Exercise DB (domaine public), voir img/SOURCE.md. `mots` sert à retrouver le groupe d'un exercice à partir de son nom.
window.REPLACEMENTS = {
  groupes: [
    { id: 'jambes', nom: 'Jambes', mots: ['squat', 'presse', 'fente', 'leg', 'souleve', 'deadlift', 'hip', 'mollet', 'cuisse', 'fessier', 'ischio', 'quadri'], exercices: [
      { nom: 'Presse à cuisses', machine: 'Presse à cuisses (leg press)', img: 'leg_press' },
      { nom: 'Goblet squat', machine: 'Haltère ou kettlebell', img: 'goblet_squat' },
      { nom: 'Front squat', machine: 'Cage / rack à squat + barre olympique', img: 'front_squat' },
      { nom: 'Fentes haltères', machine: 'Haltères', img: 'fentes_halteres', par_cote: true },
      { nom: 'Fente bulgare', machine: 'Banc plat + haltères', img: 'fente_bulgare', par_cote: true },
      { nom: 'Leg extension', machine: 'Machine leg extension', img: 'leg_extension' },
      { nom: 'Leg curl couché', machine: 'Machine leg curl couché', img: 'leg_curl_couche' },
      { nom: 'Leg curl assis', machine: 'Machine leg curl assis', img: 'leg_curl_assis' },
      { nom: 'Soulevé de terre roumain', machine: 'Barre ou haltères', img: 'souleve_roumain' },
      { nom: 'Soulevé de terre (deadlift)', machine: 'Plateforme haltérophilie + barre olympique', img: 'deadlift' },
      { nom: 'Hip thrust', machine: 'Machine hip thrust ou banc + barre', img: 'hip_thrust' },
      { nom: 'Mollets à la presse', machine: 'Presse à cuisses', img: 'mollets_presse' }
    ] },
    { id: 'dos', nom: 'Dos', mots: ['tirage', 'rowing', 'traction', 'dos', 'row', 'bucheron', 'pulldown', 'retropulsion'], exercices: [
      { nom: 'Tirage vertical', machine: 'Machine tirage vertical (lat pulldown)', img: 'tirage_vertical' },
      { nom: 'Tirage horizontal assis', machine: 'Tirage horizontal assis (poulie basse)', img: 'seated_row' },
      { nom: 'Rowing barre buste penché', machine: 'Barre EZ ou droite', img: 'rowing_ez' },
      { nom: 'Rowing haltères buste penché', machine: 'Haltères', img: 'rowing_halteres' },
      { nom: 'Tirage bûcheron', machine: 'Banc plat + haltère', img: 'tirage_bucheron', par_cote: true },
      { nom: 'Rétropulsion à la corde', machine: 'Poulie haute + corde', img: 'retropulsion_corde' }
    ] },
    { id: 'pecs', nom: 'Pecs', mots: ['couche', 'pec', 'pecs', 'ecarte', 'pompe', 'chest', 'incline', 'bench'], exercices: [
      { nom: 'Développé couché barre', machine: 'Banc plat + barre', img: 'dev_couche' },
      { nom: 'Développé couché haltères', machine: 'Banc plat + haltères', img: 'dev_couche_halteres' },
      { nom: 'Développé incliné haltères', machine: 'Banc inclinable + haltères', img: 'dev_incline_halteres' },
      { nom: 'Chest press', machine: 'Machine chest press', img: 'chest_press' },
      { nom: 'Écarté vis-à-vis', machine: 'Poulies vis-à-vis', img: 'ecarte_vis_a_vis' },
      { nom: 'Pompes', machine: 'Tapis', img: 'pompes' }
    ] },
    { id: 'epaules', nom: 'Épaules', mots: ['epaule', 'epaules', 'militaire', 'elevation', 'elevations', 'lateral', 'laterales', 'shoulder', 'oiseau'], exercices: [
      { nom: 'Développé militaire', machine: 'Barre + rack', img: 'dev_militaire' },
      { nom: 'Développé épaules haltères', machine: 'Banc à dossier + haltères', img: 'dev_epaules_halteres' },
      { nom: 'Développé épaules machine', machine: 'Machine shoulder press', img: 'shoulder_press_machine' },
      { nom: 'Élévations latérales', machine: 'Haltères légers', img: 'elevations_laterales' }
    ] },
    { id: 'bras', nom: 'Bras', mots: ['curl', 'biceps', 'triceps', 'dips', 'marteau', 'extension'], exercices: [
      { nom: 'Curl poulie basse', machine: 'Poulie basse', img: 'curl_poulie_basse' },
      { nom: 'Curl marteau', machine: 'Haltères', img: 'curl_marteau' },
      { nom: 'Extension triceps poulie', machine: 'Poulie haute', img: 'extension_triceps' },
      { nom: 'Dips sur banc', machine: 'Banc plat', img: 'dips_banc' }
    ] },
    { id: 'abdos', nom: 'Abdos', mots: ['crunch', 'gainage', 'abdo', 'abdos', 'twist', 'planche', 'releve'], exercices: [
      { nom: 'Crunch machine', machine: 'Machine abdominaux', img: 'crunch_machine' },
      { nom: 'Gainage planche', machine: 'Tapis', img: 'gainage', reps: '45 s' },
      { nom: 'Russian twist', machine: 'Tapis (+ disque)', img: 'russian_twist' }
    ] }
  ]
};
