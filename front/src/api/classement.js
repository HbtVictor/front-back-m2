import { mockFetch } from "./mock.js";

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const TOKEN = import.meta.env.VITE_API_TOKEN ?? "";

const doFetch = USE_MOCK ? mockFetch : (url, options) => fetch(url, options);

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * GET /api/v1/classement
 * @param {{ periode: "saison" | "aujourd_hui", page?: number, limite?: number }} query
 * @returns {Promise<{ periode: string, pagination: object, entrees: object[] }>}
 */
export async function getClassement({ periode, page = 1, limite = 20 }) {
  const qs = new URLSearchParams({ periode, page: String(page), limite: String(limite) });

  let res;
  try {
    res = await doFetch(`/api/v1/classement?${qs}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${TOKEN}` },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Impossible de joindre le serveur.");
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    // Format d'erreur unique du contrat : { code, message }
    throw new ApiError(
      res.status,
      body?.code ?? "UNKNOWN_ERROR",
      body?.message ?? `Erreur HTTP ${res.status}`,
    );
  }

  return body;
}
