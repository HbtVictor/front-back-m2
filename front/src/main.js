import { getClassement, USE_MOCK } from "./api/classement.js";

const LIMITE = 20;

const state = { periode: "saison", page: 1, requestId: 0 };

const $rows = document.getElementById("rows");
const $status = document.getElementById("status");
const $pager = document.getElementById("pager");
const $pagerInfo = document.getElementById("pager-info");
const $prev = document.getElementById("prev");
const $next = document.getElementById("next");
const $tabs = document.querySelectorAll(".tab");

document.getElementById("mode").textContent = USE_MOCK
  ? "Données mockées (VITE_USE_MOCK=true)"
  : "Données servies par le back";

const ERROR_MESSAGES = {
  401: "Session expirée ou invalide. Reconnecte-toi.",
  429: "Trop de requêtes, réessaie dans quelques instants.",
};

function setStatus(text, isError = false) {
  $status.hidden = !text;
  $status.textContent = text ?? "";
  $status.classList.toggle("is-error", isError);
}

function cell(className, text) {
  const td = document.createElement("td");
  td.className = className;
  td.textContent = text;
  return td;
}

function renderRows(entrees) {
  $rows.replaceChildren(
    ...entrees.map((e) => {
      const tr = document.createElement("tr");
      tr.dataset.joueurId = e.joueurId;
      // Top 3 doré : logique d'affichage purement front (contrat, principe 4)
      tr.classList.toggle("is-top", e.rang <= 3);

      // Joueur sans équipe : equipe === null -> "—" (contrat, principe 3)
      const equipe = cell("col-equipe", e.equipe ?? "—");
      equipe.classList.toggle("is-empty", e.equipe === null);

      tr.append(
        cell("col-rang", e.rang),
        cell("col-joueur", e.pseudo),
        equipe,
        cell("col-niveau", e.niveau),
        cell("col-xp", e.xp),
      );
      return tr;
    }),
  );
}

function renderPager({ page, totalPages, totalElements }) {
  $pager.hidden = totalPages <= 1;
  $pagerInfo.textContent = `Page ${page} / ${totalPages} · ${totalElements} joueurs`;
  $prev.disabled = page <= 1;
  $next.disabled = page >= totalPages;
}

async function load() {
  const requestId = ++state.requestId;
  $tabs.forEach((t) => {
    const active = t.dataset.periode === state.periode;
    t.classList.toggle("is-active", active);
    t.setAttribute("aria-selected", active);
  });
  setStatus("Chargement…");

  try {
    const data = await getClassement({ periode: state.periode, page: state.page, limite: LIMITE });
    if (requestId !== state.requestId) return; // une requête plus récente a pris le relais

    // Le tri est garanti par le serveur : on affiche tel quel
    renderRows(data.entrees);
    renderPager(data.pagination);
    setStatus(data.entrees.length ? null : "Aucun joueur classé pour cette période.");
  } catch (err) {
    if (requestId !== state.requestId) return;
    $rows.replaceChildren();
    $pager.hidden = true;
    setStatus(ERROR_MESSAGES[err.status] ?? err.message, true);
    console.error(`[classement] ${err.status} ${err.code}: ${err.message}`);
  }
}

$tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    if (tab.dataset.periode === state.periode) return;
    state.periode = tab.dataset.periode;
    state.page = 1;
    load();
  }),
);

$prev.addEventListener("click", () => {
  state.page -= 1;
  load();
});
$next.addEventListener("click", () => {
  state.page += 1;
  load();
});

load();
