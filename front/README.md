# Front — Écran Classement

Implémenté uniquement à partir de `../atelier1_retro-contrat_team-lisnard.yaml`.

```bash
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```

## Brancher sur le back (12 h 05)

Dans `.env` :

```
VITE_USE_MOCK=false
VITE_BACK_URL=http://localhost:3000   # URL du back
VITE_API_TOKEN=<jeton>
```

Puis relancer `npm run dev`. Le proxy Vite redirige `/api/*` vers le back (pas de souci CORS).

## Ce que le front suppose du contrat

- `GET /api/v1/classement?periode=saison|aujourd_hui&page=1&limite=20`
- En-tête `Authorization: Bearer <token>`
- 200 → `{ periode, pagination: { page, limite, totalElements, totalPages }, entrees: [{ rang, joueurId, pseudo, equipe, niveau, xp }] }`
- Erreurs 400 / 401 / 429 → `{ code, message }`
- Le front ne trie pas, affiche `—` si `equipe === null`, colore en doré si `rang <= 3`.
