// Mock fidèle au contrat atelier1_retro-contrat_team-lisnard.yaml
// GET /api/v1/classement?periode=&page=&limite=  (Bearer requis)

const SAISON = [
  { joueurId: "p_1042", pseudo: "Ishak MESSAOUDI", equipe: null, niveau: 3, xp: 533 },
  { joueurId: "p_1007", pseudo: "Jérémy", equipe: null, niveau: 3, xp: 496 },
  { joueurId: "p_1013", pseudo: "clément lisnard", equipe: null, niveau: 3, xp: 388 },
  { joueurId: "p_1021", pseudo: "Rémi", equipe: null, niveau: 3, xp: 300 },
  { joueurId: "p_1033", pseudo: "Léo", equipe: null, niveau: 2, xp: 271 },
  { joueurId: "p_1002", pseudo: "Victor", equipe: null, niveau: 2, xp: 238 },
  { joueurId: "p_1018", pseudo: "Mathias", equipe: null, niveau: 2, xp: 226 },
  { joueurId: "p_1025", pseudo: "Arthur Courchay", equipe: null, niveau: 2, xp: 151 },
  { joueurId: "p_1029", pseudo: "Loris", equipe: null, niveau: 2, xp: 113 },
  { joueurId: "p_1001", pseudo: "Dylan", equipe: null, niveau: 1, xp: 0 },
  { joueurId: "p_1050", pseudo: "Dylan_Test", equipe: null, niveau: 1, xp: 0 },
];

const AUJOURD_HUI = [
  { joueurId: "p_1013", pseudo: "clément lisnard", equipe: null, niveau: 3, xp: 120 },
  { joueurId: "p_1002", pseudo: "Victor", equipe: null, niveau: 2, xp: 95 },
  { joueurId: "p_1042", pseudo: "Ishak MESSAOUDI", equipe: null, niveau: 3, xp: 80 },
  { joueurId: "p_1033", pseudo: "Léo", equipe: null, niveau: 2, xp: 42 },
  { joueurId: "p_1001", pseudo: "Dylan", equipe: null, niveau: 1, xp: 0 },
];

const DATA = { saison: SAISON, aujourd_hui: AUJOURD_HUI };

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const badParam = (message) => json(400, { code: "INVALID_QUERY_PARAMETER", message });

export async function mockFetch(url, options = {}) {
  await new Promise((r) => setTimeout(r, 250));

  const auth = options.headers?.Authorization ?? "";
  if (!/^Bearer \S+$/.test(auth)) {
    return json(401, {
      code: "INVALID_TOKEN",
      message: "Le jeton d'authentification est manquant ou invalide.",
    });
  }

  const params = new URL(url, window.location.origin).searchParams;
  const periode = params.get("periode");
  if (!(periode in DATA)) {
    return badParam("La période doit être 'saison' ou 'aujourd_hui'.");
  }

  const page = Number(params.get("page") ?? 1);
  const limite = Number(params.get("limite") ?? 20);
  if (!Number.isInteger(page) || page < 1) return badParam("Le paramètre 'page' doit être un entier >= 1.");
  if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
    return badParam("Le paramètre 'limite' doit être un entier entre 1 et 100.");
  }

  // Tri garanti côté serveur : XP DESC (l'ordre des tableaux ci-dessus fait office de départage par date)
  const all = DATA[periode].map((j, i) => ({ rang: i + 1, ...j }));
  const totalPages = Math.max(1, Math.ceil(all.length / limite));

  return json(200, {
    periode,
    pagination: { page, limite, totalElements: all.length, totalPages },
    entrees: all.slice((page - 1) * limite, page * limite),
  });
}
