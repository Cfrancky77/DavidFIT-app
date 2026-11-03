// Données des séances (source : fiches PDF du coach, 31/10/2026)
window.SEANCES_DATA = {
  "version": 1,
  "source": "Sport/fiche sport/*.pdf (2026-10-31)",
  "seances": [
    {
      "id": "jambes",
      "nom": "Jambes",
      "echauffement": {
        "exercice": "Rameur",
        "duree_min": 5,
        "resistance": "Modérée"
      },
      "consigne": "Faire une montée de gamme (charges progressives) sur le squat et le soulevé de terre.",
      "exercices": [
        {
          "id": "front_squat",
          "nom": "Front squat",
          "series": 4,
          "reps": "8-10",
          "repos_s": 120,
          "charge": true,
          "machine": "squat_rack",
          "alternatives": [
            "smith_machine"
          ]
        },
        {
          "id": "deadlift",
          "nom": "Soulevé de terre (deadlift)",
          "series": 4,
          "reps": "8-10",
          "repos_s": 120,
          "charge": true,
          "machine": "plateforme_barre",
          "alternatives": [
            "squat_rack"
          ]
        },
        {
          "id": "hip_thrust",
          "nom": "Hip thrust",
          "series": 4,
          "reps": "10",
          "repos_s": 90,
          "charge": true,
          "machine": "hip_thrust_machine",
          "alternatives": [
            "banc_plat_barre",
            "smith_machine"
          ]
        },
        {
          "id": "fente_bulgare",
          "nom": "Fente bulgare",
          "series": 4,
          "reps": "10",
          "par_cote": true,
          "repos_s": 60,
          "charge": true,
          "machine": "banc_plat_halteres",
          "alternatives": [
            "smith_machine"
          ]
        },
        {
          "id": "leg_extension",
          "nom": "Leg extension",
          "series": 4,
          "reps": "12",
          "par_cote": true,
          "repos_s": 60,
          "charge": true,
          "machine": "leg_extension",
          "alternatives": []
        }
      ],
      "finisher": {
        "exercice": "Vélo",
        "objectif": "Cadence 60-70 rpm, +25 W chaque minute en ajoutant de la résistance. Objectif 200-250 W.",
        "machine": "velo_droit"
      }
    },
    {
      "id": "dos",
      "nom": "Dos / Biceps",
      "note": "Le PDF porte par erreur le titre « SEANCE PECS / TRICEPS » et la consigne du développé couché.",
      "echauffement": {
        "exercice": "Elliptique",
        "duree_min": 5,
        "resistance": "Modérée"
      },
      "consigne": "Faire une montée de gamme sur le premier exercice.",
      "exercices": [
        {
          "id": "tirage_vertical",
          "nom": "Tirage vertical barre ou traction",
          "series": 4,
          "reps": "8-10",
          "repos_s": 120,
          "charge": true,
          "machine": "lat_pulldown",
          "alternatives": [
            "barre_traction",
            "traction_assistee"
          ]
        },
        {
          "id": "rowing_ez",
          "nom": "Rowing barre EZ prise supination",
          "series": 4,
          "reps": "8-10",
          "repos_s": 120,
          "charge": true,
          "machine": "barre_ez",
          "alternatives": [
            "rowing_assis_poulie"
          ]
        },
        {
          "id": "retropulsion_corde",
          "nom": "Rétropulsion poulie haute corde",
          "series": 4,
          "reps": "8-10",
          "repos_s": 120,
          "charge": true,
          "machine": "poulie_vis_a_vis",
          "alternatives": []
        },
        {
          "id": "tirage_bucheron",
          "nom": "Tirage bûcheron",
          "series": 4,
          "reps": "10",
          "repos_s": 60,
          "charge": true,
          "machine": "banc_plat_halteres",
          "alternatives": [
            "poulie_vis_a_vis"
          ]
        },
        {
          "id": "curl_poulie_basse",
          "nom": "Curl biceps poulie basse",
          "series": 6,
          "reps": "12",
          "repos_s": 60,
          "charge": true,
          "machine": "poulie_vis_a_vis",
          "alternatives": []
        }
      ],
      "finisher": {
        "exercice": "Rameur",
        "objectif": "Faire 3 km.",
        "machine": "rameur"
      }
    },
    {
      "id": "pecs",
      "nom": "Pecs / Triceps",
      "echauffement": {
        "exercice": "Elliptique",
        "duree_min": 5,
        "resistance": "Modérée"
      },
      "consigne": "Faire une montée de gamme sur le développé couché.",
      "exercices": [
        {
          "id": "dev_couche",
          "nom": "Développé couché",
          "series": 4,
          "reps": "8-10",
          "repos_s": 120,
          "charge": true,
          "machine": "banc_developpe_couche",
          "alternatives": [
            "smith_machine",
            "chest_press"
          ]
        },
        {
          "id": "dev_incline_halteres",
          "nom": "Développé incliné haltères",
          "series": 4,
          "reps": "8-10",
          "repos_s": 120,
          "charge": true,
          "machine": "banc_inclinable_halteres",
          "alternatives": [
            "incline_press_machine"
          ]
        },
        {
          "id": "dev_militaire",
          "nom": "Développé militaire",
          "series": 4,
          "reps": "8-10",
          "repos_s": 120,
          "charge": true,
          "machine": "squat_rack",
          "alternatives": [
            "shoulder_press",
            "smith_machine"
          ]
        },
        {
          "id": "ecarte_vis_a_vis",
          "nom": "Écarté vis-à-vis",
          "series": 4,
          "reps": "10",
          "repos_s": 90,
          "charge": true,
          "machine": "poulie_vis_a_vis",
          "alternatives": [
            "pec_deck"
          ]
        },
        {
          "id": "extension_triceps",
          "nom": "Extension triceps poulie haute",
          "series": 6,
          "reps": "12",
          "repos_s": 60,
          "charge": true,
          "machine": "poulie_vis_a_vis",
          "alternatives": []
        }
      ],
      "finisher": {
        "exercice": "Pompes",
        "objectif": "15 pompes en 1 min, répéter 10 fois.",
        "machine": "poids_du_corps"
      }
    }
  ],
  "machines": {
    "squat_rack": "Cage / rack à squat + barre olympique",
    "smith_machine": "Smith machine (barre guidée)",
    "plateforme_barre": "Plateforme haltérophilie + barre olympique",
    "hip_thrust_machine": "Machine hip thrust / glute drive",
    "banc_plat_barre": "Banc plat + barre",
    "banc_plat_halteres": "Banc plat + haltères",
    "leg_extension": "Machine leg extension",
    "velo_droit": "Vélo droit (affichage watts)",
    "lat_pulldown": "Machine tirage vertical (lat pulldown)",
    "barre_traction": "Barre de traction",
    "traction_assistee": "Machine traction / dips assistée",
    "barre_ez": "Barre EZ (zone poids libres)",
    "rowing_assis_poulie": "Tirage horizontal assis (poulie basse)",
    "poulie_vis_a_vis": "Poulies vis-à-vis réglables (cable crossover)",
    "rameur": "Rameur",
    "elliptique": "Elliptique",
    "banc_developpe_couche": "Banc développé couché + barre",
    "chest_press": "Machine chest press",
    "banc_inclinable_halteres": "Banc inclinable + haltères",
    "incline_press_machine": "Machine développé incliné",
    "shoulder_press": "Machine shoulder press",
    "pec_deck": "Pec deck / butterfly",
    "poids_du_corps": "Poids du corps (tapis)"
  }
};
