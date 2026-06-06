const listDiv = document.getElementById("list");
const statusFilter = document.getElementById("statusFilter");
const filterCount = document.getElementById("filterCount");

let listCache = [];   // all entries from storage

// ---------- Load + initial render ----------
(async function loadList() {
  listCache = await window.electronAPI.getAll() || [];
  renderList(statusFilter?.value || "all");
})();

// ---------- Filter change ----------
statusFilter?.addEventListener("change", () => {
  renderList(statusFilter.value);
});

// ---------- Render list with filter ----------
function renderList(filter = "all") {
  listDiv.innerHTML = "";

  const items = listCache.filter(it =>
    filter === "all" ? true : (it.status || "").toLowerCase() === filter.toLowerCase()
  );

  if (filterCount) filterCount.textContent = `${items.length}/${listCache.length}`;

  if (!items.length) {
    listDiv.innerHTML = `<p class="muted">No items for this filter.</p>`;
    return;
  }

  items.forEach(renderCard);
}

// ---------- helpers ----------
const opt = (label, current) => `<option ${label===current?'selected':''}>${label}</option>`;

// ---------- Render a single card ----------
function renderCard(it) {
  const type = (it.type || (it.totalChapters ? "manga" : "anime")).toLowerCase();
  const isManga = type === "manga";

  const statuses = isManga
    ? ["Plan","Reading","Completed","On Hold","Dropped"]
    : ["Plan","Watching","Completed","On Hold","Dropped"];

  const div = document.createElement("div");
  div.className = `card ${isManga ? 'is-manga' : 'is-anime'}`;

  const epTotal = it.totalEpisodes ?? "?" ;
  const chTotal = it.totalChapters ?? "?" ;

  // progress blocks (only one is shown)
  const epBlock = `
    <p><strong>Episodes:</strong></p>
    <input class="ep" type="number" min="0" value="${it.episodesWatched || 0}">
    <span class="muted">/ ${epTotal}</span>
  `;

  const chBlock = `
    <p><strong>Chapters:</strong></p>
    <input class="ch" type="number" min="0" value="${it.chaptersRead || 0}">
    <span class="muted">/ ${chTotal}</span>
  `;

  div.innerHTML = `
    <div class="thumb">
      <img src="${it.image || ""}" alt="${it.title}">
    </div>

    <h3>${it.title} <small>(${type})</small></h3>

    <p><strong>Status:</strong></p>
    <select class="status">
      ${statuses.map(s => opt(s, it.status)).join("")}
    </select>

    ${isManga ? chBlock : epBlock}

    <p><strong>Review:</strong></p>
    <textarea class="review" placeholder="Write your thoughts...">${it.userReview || ""}</textarea>

    <div class="actions">
      <button class="save">💾 Save</button>
      <button class="del">🗑️ Delete</button>
    </div>
  `;

  // SAVE
  div.querySelector(".save").addEventListener("click", async () => {
    const updated = {
      ...it,
      status: div.querySelector(".status").value,
      userReview: div.querySelector(".review").value
    };

    if (isManga) {
      updated.chaptersRead = Number(div.querySelector(".ch").value || 0);
      updated.episodesWatched = 0; // keep clean
    } else {
      updated.episodesWatched = Number(div.querySelector(".ep").value || 0);
      updated.chaptersRead = 0;    // keep clean
    }

    await window.electronAPI.saveEntry(updated);

    const idx = listCache.findIndex(e => e.id === it.id);
    if (idx !== -1) listCache[idx] = updated;

    alert(`Saved changes for "${it.title}" ✅`);
  });

  // DELETE
  div.querySelector(".del").addEventListener("click", async () => {
    if (!confirm(`Remove "${it.title}" from your list?`)) return;
    await window.electronAPI.deleteEntry(it.id);
    listCache = listCache.filter(e => e.id !== it.id);
    renderList(statusFilter?.value || "all");
  });

  listDiv.appendChild(div);
}
