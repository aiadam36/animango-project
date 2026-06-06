// Storage key
const FAV_KEY = "animango:topPicks";

// Tiny store backed by localStorage
const favStore = {
  get() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); }
    catch { return []; }
  },
  set(arr) { localStorage.setItem(FAV_KEY, JSON.stringify(arr)); },
  isFav(id) { return this.get().some(x => x.id === id); },
  add(item) {
    const arr = this.get();
    if (!arr.some(x => x.id === item.id)) {
      arr.unshift({
        id: item.id,
        title: item.title,
        image: item.image || "",
        type: (item.type || "anime").toLowerCase(),
        score: item.score ?? null,
        rank: item.rank ?? null,
        popularity: item.popularity ?? null,
        year: item.year ?? null,
        url: item.url || "",
        addedAt: Date.now()
      });
      this.set(arr);
    }
  },
  remove(id) { this.set(this.get().filter(x => x.id !== id)); },
  toggle(item) { this.isFav(item.id) ? this.remove(item.id) : this.add(item); }
};

// Page wiring
const favGrid  = document.getElementById("topPicks");  // match your HTML
const favType  = document.getElementById("favType");
const favSort  = document.getElementById("favSort");
const favCount = document.getElementById("favCount");

function renderFavs() {
  if (!favGrid) return;

  const type = favType?.value || "all";
  const sort = favSort?.value || "added";

  let arr = favStore.get();

  // Filter
  if (type !== "all") arr = arr.filter(x => (x.type || "").toLowerCase() === type);

  // Sort
  if (sort === "score") arr.sort((a,b) => (b.score ?? -1) - (a.score ?? -1));
  else if (sort === "popularity") arr.sort((a,b) => (a.popularity ?? 1e9) - (b.popularity ?? 1e9));
  else if (sort === "year") arr.sort((a,b) => (b.year ?? 0) - (a.year ?? 0));
  else arr.sort((a,b) => (b.addedAt || 0) - (a.addedAt || 0));

  // Count
  favCount.textContent = `${arr.length} item${arr.length === 1 ? "" : "s"}`;

  // Empty state
  favGrid.innerHTML = "";
  favGrid.classList.toggle("empty", arr.length === 0);
  if (arr.length === 0) return;

  // Render cards
  arr.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="thumb">
        <img src="${item.image || ""}" alt="${item.title}">
        <button class="fav-star active" title="Remove from My Top Picks">★</button>
      </div>
      <h3>${item.title}</h3>
      <div class="meta">
        <span class="badge">📂 ${item.type}</span>
        <span class="badge">⭐ ${item.score ?? "N/A"}</span>
        <span class="badge">👥 ${item.popularity ?? "—"}</span>
        <span class="badge">📅 ${item.year ?? "—"}</span>
      </div>
      ${item.url ? `<div class="buttons"><a class="btn" href="${item.url}" target="_blank" rel="noopener">View on MAL</a></div>` : ""}
    `;

    // ⭐ Click to remove from Top Picks
    card.querySelector(".fav-star").addEventListener("click", () => {
      favStore.remove(item.id);
      renderFavs();
    });

    favGrid.appendChild(card);
  });
}

favType?.addEventListener("change", renderFavs);
favSort?.addEventListener("change", renderFavs);
renderFavs();
