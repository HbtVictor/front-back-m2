# Contrat d'API — Écran Classement (Leaderboard)
**Binôme :** Victor & Ronan  
**Atelier :** Rétro-contrat (Séance 1)  

---

## 1. Description de la Ressource & Endpoint

- **Méthode HTTP :** `GET`
- **URL :** `/api/leaderboard`
- **Description :** Récupère la liste ordonnée des joueurs pour l'écran de classement selon la période choisie.

### Paramètres de Requête (Query Parameters)

| Paramètre | Type | Requis / Optionnel | Valeur par défaut | Description / Valeurs acceptées |
| :--- | :--- | :--- | :--- | :--- |
| `scope` | `string` | Optionnel | `"season"` | Période d'agrégation : `"season"` (Saison) ou `"today"` (Aujourd'hui) |

---

## 2. Format de Réponse (Succès — `200 OK`)

### Structure JSON

```json
{
  "scope": "season",
  "rows": [
    {
      "rank": 1,
      "id": 6,
      "pseudo": "Ishak MESSAOUDI",
      "team": null,
      "level": 3,
      "xp": 533
    },
    {
      "rank": 2,
      "id": 2,
      "pseudo": "Jérémy",
      "team": null,
      "level": 3,
      "xp": 496
    },
    {
      "rank": 10,
      "id": 1,
      "pseudo": "Dylan",
      "team": null,
      "level": 1,
      "xp": 0
    }
  ]
}
```

### Typage et Contraintes des Champs

| Objet | Champ | Type | Nullable | Requis | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Racine** | `scope` | `string` | Non | Oui | Période appliquée (`"season"` ou `"today"`). |
| | `rows` | `Array<LeaderboardRow>` | Non | Oui | Liste triée des lignes du classement. |
| **LeaderboardRow** | `rank` | `integer` | Non | Oui | Position dans le classement (`>= 1`). |
| | `id` | `integer` | Non | Oui | Identifiant unique du joueur. |
| | `pseudo` | `string` | Non | Oui | Nom / pseudonyme affiché. |
| | `team` | `string` | **Oui** (`null`) | Oui | Nom de l'équipe (ou `null` si non assigné). |
| | `level` | `integer` | Non | Oui | Niveau du joueur (`>= 1`). |
| | `xp` | `integer` | Non | Oui | Points d'expérience accumulés (`>= 0`). |

---

## 3. Ambiguïtés Tranchées (Règles Métier)

1. **Égalités (Ex-æquo) :**
   - **Règle :** Chaque joueur a un rang (`rank`) strictement unique et séquentiel ($1, 2, 3, \dots$). Pas de rang partagé.
   - **Départage :** Si deux joueurs ont le même nombre de points d'XP, ils sont départagés par ordre alphabétique croissant du `pseudo` (`pseudo ASC`).
2. **Joueurs sans partie :**
   - **Règle :** Les joueurs n'ayant joué aucune manche ou ayant `0 XP` sont **inclus** dans le classement avec `xp: 0` et `level: 1` (ils apparaissent en fin de tableau).
   - En cas de tableau entièrement vide (`rows: []`), le front affiche l'état vide informatif.
3. **Tri :**
   - **Règle :** Le tri est effectué et garanti par le **Backend** : `ORDER BY xp DESC, pseudo ASC`. Le Frontend consomme la liste brute sans refaire de tri local.
4. **Pagination :**
   - **Règle :** **Pas de pagination**. L'ensemble des joueurs est retourné en une seule charge utile dans `rows`.

---

## 4. Gestion des Erreurs

### Format standardisé d'erreur

Toutes les erreurs HTTP renvoient un objet JSON uniforme :
```json
{
  "error": {
    "code": "STRING",
    "message": "STRING"
  }
}
```

| Code HTTP | `error.code` | Cause | Exemple de message |
| :--- | :--- | :--- | :--- |
| **`400 Bad Request`** | `INVALID_PARAM` | Valeur de `scope` non reconnue | `"Le paramètre 'scope' doit être 'season' ou 'today'."` |
| **`401 Unauthorized`** | `UNAUTHENTICATED` | Cookie de session / code de classe absent ou invalide | `"Connecte-toi avec le code de classe"` |
| **`500 Internal Error`** | `SERVER_ERROR` | Crash ou incident base de données côté back | `"Une erreur inattendue est survenue"` |
