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

---

## 4. Résultats du branchement réel (front `front/` ↔ back `server.js`)

**Verdict : 0 écart bloquant.** Le front s'est branché sur le back du premier coup (`VITE_USE_MOCK=false`), sans modifier une seule ligne de code.

### Cas testés et conformes au contrat

| Cas | Requête | Résultat |
|---|---|---|
| Onglet Saison | `?periode=saison&page=1&limite=20` | 200, 13 joueurs affichés, rangs 1..13, top 3 doré, `—` pour `equipe: null` |
| Onglet Aujourd'hui | `?periode=aujourd_hui` | 200, 6 joueurs affichés |
| Pagination | `limite=5`, pages 1 → 3 | `totalPages: 3`, rangs continus (11..13 en page 3), boutons Précédent/Suivant corrects |
| Sans token | pas d'en-tête `Authorization` | 401 `{ code: "INVALID_TOKEN", message }` |
| Période manquante / invalide | `?periode=season` | 400 `INVALID_QUERY_PARAMETER`, message lu correctement par le front |
| Page / limite invalides | `page=0`, `page=1.5`, `limite=101` | 400 `INVALID_QUERY_PARAMETER` |
| Format JSON | toutes les réponses | `application/json`, tous les champs requis présents, `joueurId` respecte `^p_[0-9]+$` |

### Écarts non bloquants constatés

| # | Écart | Contrat | Constaté | Impact |
|---|---|---|---|---|
| **A** | **Rate limiting absent** | 429 `RATE_LIMITED` documenté | 50 appels d'affilée → 50 × 200, jamais de 429 | Le cas 429 géré par le front n'est jamais testé en réel. |
| **B** | **Token jamais validé** | `bearerFormat: JWT` | N'importe quelle chaîne après `Bearer ` est acceptée (`Bearer xxx` → 200) | Acceptable pour un stub, mais il n'y a aucune vraie sécurité. |
| **C** | **Codes d'erreur hors contrat** | Seulement 400 / 401 / 429 | Le back renvoie aussi 404 `NOT_FOUND` et 405 `METHOD_NOT_ALLOWED` | Le format `{ code, message }` est respecté, donc le front les affiche bien, mais ils ne sont pas documentés. |
| **D** | **Page au-delà de la dernière** | Non spécifié | `page=99` → 200 avec `entrees: []` | Le front afficherait « Aucun joueur classé », ce qui est trompeur (un 400 ou un renvoi vers la dernière page serait plus clair). Ce cas n'arrive pas via l'UI. |
| **E** | **Départage des égalités invérifiable** | XP égale → départage par date d'obtention de l'XP | Ordre codé en dur (Dylan, Dylan_Test, Mohammed, RemZizire à 0 XP), aucune date exposée | Impossible de vérifier la règle côté front. |
| **F** | **`page=` vide** | `page` absent → défaut 1 | `page=` (vide) → 400 | Zone grise du contrat. |
| **G** | **Schéma `Bearer` sensible à la casse** | Non spécifié (la RFC 7235 le dit insensible à la casse) | `bearer xxx` → 401 | Mineur. |

### Trous du contrat révélés par le branchement

- **Pas de section `servers`** : l'URL et le port du back ne sont pas spécifiés. Le front a supposé `localhost:3000` et c'est tombé juste par convention.
- **Obtention du token non décrite** : le contrat exige un Bearer sans dire d'où il vient.
- **Données** : le mock front (11 joueurs, ids `p_10xx`) et le stub back (13 joueurs, ids `p_1..p_13`) diffèrent, ce qui est normal puisque le contrat ne fixe que la forme des données, pas leur contenu.
