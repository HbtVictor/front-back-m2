/**
 * Stub Serveur Back — Hub API Classement
 * Implémentation stricte du contrat "atelier1_retro-contrat_team-lisnard.yaml"
 * 
 * Lancement : node server.js
 * Port par défaut : 3000 (ou variable d'environnement PORT)
 */

const http = require('node:http');
const { URL } = require('node:url');

const PORT = process.env.PORT || 3000;

// Base de données simulée pour la "saison" (triée par XP DESC)
const JOUEURS_SAISON = [
  { pseudo: "Ishak MESSAOUDI", joueurId: "p_6", equipe: null, niveau: 3, xp: 533 },
  { pseudo: "Jérémy", joueurId: "p_2", equipe: null, niveau: 3, xp: 496 },
  { pseudo: "clément lisnard", joueurId: "p_9", equipe: null, niveau: 3, xp: 388 },
  { pseudo: "Rémi", joueurId: "p_11", equipe: null, niveau: 3, xp: 300 },
  { pseudo: "Léo", joueurId: "p_4", equipe: null, niveau: 2, xp: 271 },
  { pseudo: "Victor", joueurId: "p_5", equipe: null, niveau: 2, xp: 238 },
  { pseudo: "Mathias", joueurId: "p_3", equipe: null, niveau: 2, xp: 226 },
  { pseudo: "Arthur Courchay", joueurId: "p_7", equipe: null, niveau: 2, xp: 151 },
  { pseudo: "Loris", joueurId: "p_8", equipe: null, niveau: 2, xp: 113 },
  { pseudo: "Dylan", joueurId: "p_1", equipe: null, niveau: 1, xp: 0 },
  { pseudo: "Dylan_Test", joueurId: "p_13", equipe: null, niveau: 1, xp: 0 },
  { pseudo: "Mohammed", joueurId: "p_12", equipe: null, niveau: 1, xp: 0 },
  { pseudo: "RemZizire - Rémi", joueurId: "p_10", equipe: null, niveau: 1, xp: 0 },
];

// Base de données simulée pour "aujourd_hui"
const JOUEURS_AUJOURDHUI = [
  { pseudo: "Victor", joueurId: "p_5", equipe: null, niveau: 2, xp: 95 },
  { pseudo: "Ishak MESSAOUDI", joueurId: "p_6", equipe: null, niveau: 3, xp: 80 },
  { pseudo: "Jérémy", joueurId: "p_2", equipe: null, niveau: 3, xp: 50 },
  { pseudo: "clément lisnard", joueurId: "p_9", equipe: null, niveau: 3, xp: 42 },
  { pseudo: "Rémi", joueurId: "p_11", equipe: null, niveau: 3, xp: 20 },
  { pseudo: "Arthur Courchay", joueurId: "p_7", equipe: null, niveau: 2, xp: 15 },
];

function sendJson(res, statusCode, body) {
  const json = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  });
  res.end(json);
}

function sendError(res, statusCode, code, message) {
  sendJson(res, statusCode, { code, message });
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const method = req.method;

  console.log(`[${new Date().toLocaleTimeString()}] ${method} ${pathname}${reqUrl.search}`);

  // Gestion CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    });
    res.end();
    return;
  }

  // Page d'accueil / statut
  if (pathname === '/' || pathname === '/api') {
    return sendJson(res, 200, {
      nom: "Stub API Classement — Hub",
      contrat: "atelier1_retro-contrat_team-lisnard.yaml",
      endpoint: "/api/v1/classement?periode=saison",
      statut: "en ligne",
    });
  }

  // Route conforme au contrat : GET /api/v1/classement
  if (pathname === '/api/v1/classement') {
    if (method !== 'GET') {
      return sendError(res, 405, "METHOD_NOT_ALLOWED", "Seule la méthode GET est autorisée.");
    }

    // 1. VÉRIFICATION DU TOKEN (Sécurité Bearer JWT)
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`  ↳ 401 Rejeté : Token manquant ou format invalide (Header Authorization reçu : "${authHeader || 'aucun'}")`);
      return sendError(
        res,
        401,
        "INVALID_TOKEN",
        "Le jeton d'authentification est manquant ou invalide."
      );
    }

    // 2. VÉRIFICATION DU PARAMÈTRE 'periode' (Obligatoire)
    const periode = reqUrl.searchParams.get('periode');
    if (!periode) {
      console.warn("  ↳ 400 Rejeté : Paramètre 'periode' manquant");
      return sendError(
        res,
        400,
        "INVALID_QUERY_PARAMETER",
        "Le paramètre 'periode' est obligatoire. Valeurs possibles : 'saison', 'aujourd_hui'."
      );
    }

    if (periode !== 'saison' && periode !== 'aujourd_hui') {
      console.warn(`  ↳ 400 Rejeté : Valeur periode invalide "${periode}"`);
      return sendError(
        res,
        400,
        "INVALID_QUERY_PARAMETER",
        "La période doit être 'saison' ou 'aujourd_hui'."
      );
    }

    // 3. VÉRIFICATION DE LA PAGINATION ('page' et 'limite')
    const pageParam = reqUrl.searchParams.get('page');
    const limiteParam = reqUrl.searchParams.get('limite');

    let page = 1;
    let limite = 20;

    if (pageParam !== null) {
      const parsedPage = Number(pageParam);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        console.warn(`  ↳ 400 Rejeté : page invalide "${pageParam}"`);
        return sendError(
          res,
          400,
          "INVALID_QUERY_PARAMETER",
          "Le paramètre 'page' doit être un entier supérieur ou égal à 1."
        );
      }
      page = parsedPage;
    }

    if (limiteParam !== null) {
      const parsedLimite = Number(limiteParam);
      if (!Number.isInteger(parsedLimite) || parsedLimite < 1 || parsedLimite > 100) {
        console.warn(`  ↳ 400 Rejeté : limite invalide "${limiteParam}"`);
        return sendError(
          res,
          400,
          "INVALID_QUERY_PARAMETER",
          "La limite doit être un entier compris entre 1 et 100."
        );
      }
      limite = parsedLimite;
    }

    // 4. RÉCUPÉRATION ET FORMATAGE DES DONNÉES
    const sourceData = periode === 'saison' ? JOUEURS_SAISON : JOUEURS_AUJOURDHUI;
    const totalElements = sourceData.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / limite));

    // Découpage pagination
    const debut = (page - 1) * limite;
    const fin = debut + limite;
    const joueursPage = sourceData.slice(debut, fin);

    // Attribution stricte et continue du rang (1, 2, 3...)
    const entrees = joueursPage.map((joueur, index) => ({
      rang: debut + index + 1,
      joueurId: joueur.joueurId,
      pseudo: joueur.pseudo,
      equipe: joueur.equipe, // null si pas d'équipe
      niveau: joueur.niveau,
      xp: joueur.xp,
    }));

    const responsePayload = {
      periode,
      pagination: {
        page,
        limite,
        totalElements,
        totalPages,
      },
      entrees,
    };

    console.log(`  ↳ 200 Succès : ${entrees.length} entrées retournées (Page ${page}/${totalPages})`);
    return sendJson(res, 200, responsePayload);
  }

  // Route 404 inconnue
  return sendError(res, 404, "NOT_FOUND", `L'URL ${pathname} n'existe pas.`);
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 STUB BACKEND PRÊT — Hub API Classement`);
  console.log(`📡 URL : http://localhost:${PORT}`);
  console.log(`🎯 Route : GET http://localhost:${PORT}/api/v1/classement?periode=saison`);
  console.log(`🔑 Sécurité : Header "Authorization: Bearer <token>" requis`);
  console.log(`====================================================\n`);
});
