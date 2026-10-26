# Livrable Atelier 2 — Liste des Écarts au Branchement
**Binôme :** Ronan (Back) & Victor (Front)  
**Contrat d'entrée utilisé :** `atelier1_retro-contrat_team-lisnard.yaml` (Team Lisnard)  

---

## 1. Description du Branchement
- **Back stub :** Implémenté sur Node.js (`http://localhost:3000/api/v1/classement`)
- **Front mock :** Implémenté par le Front sans communication préalable.

---

## 2. Tableau des Écarts Constatés et Risques de Rupture

| # | Élément | Contrat Team Lisnard (Back implémenté) | Hub Réel / Attendu Front classique | Conséquence au branchement si non respecté |
|---|---|---|---|---|
| **1** | **URL de la route** | `GET /api/v1/classement` | `GET /api/leaderboard` | **Erreur 404** (route introuvable). |
| **2** | **Sécurité / Auth** | Header `Authorization: Bearer <token>` obligatoire | Cookie de session implicite | **Erreur 401** `INVALID_TOKEN` si le token Bearer est omis. |
| **3** | **Nom du filtre temporel** | `periode` (`saison`, `aujourd_hui`) | `scope` (`season`, `today`) | **Erreur 400** `INVALID_QUERY_PARAMETER` si le Front envoie `?scope=season`. |
| **4** | **Liste des joueurs** | Tableau dans `data.entrees` | Tableau dans `data.rows` | **Écran blanc / Crash Front** (`data.rows.map is not a function`). |
| **5** | **Identifiant joueur** | Champ `joueurId` de type `string` (regex `^p_[0-9]+$`) | Champ `id` de type `integer` | `key={player.id}` vaut `undefined`, perte d'identité des éléments. |
| **6** | **Champs de la ligne** | Français : `rang`, `equipe`, `niveau` | Anglais : `rank`, `team`, `level` | Tableau vide ou colonnes vides dans le DOM (`undefined`). |
| **7** | **Structure des erreurs** | Objet plat : `{ code, message }` | Objet imbriqué : `{ error: { code, message } }` | Le gestionnaire d'erreur du Front ne lit pas le bon message d'erreur. |
| **8** | **Pagination** | Objet obligatoire `data.pagination` (`page`, `limite`, `totalElements`, `totalPages`) | Aucune pagination (liste exhaustive) | Si le Front n'exploite pas `pagination`, risque de n'afficher que les 20 premiers joueurs. |

---

## 3. Conclusion & Retex de l'Atelier
- **Règle vérifiée :** Développer strictement à l'aveugle à partir d'un contrat OpenAPI protège le binôme si et seulement si **les deux parties respectent la spec à la lettre**.
- Dès qu'un développeur fait une supposition basée sur "l'ancien écran" ou ses habitudes de nommage (anglais vs français, `rows` vs `entrees`, cookies vs Bearer), le branchement casse instantanément.
