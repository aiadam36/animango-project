// ========== DOM ==========
const btnSearch  = document.getElementById("btnSearch");
const q          = document.getElementById("q");
const type       = document.getElementById("type");
const msg        = document.getElementById("msg");
const results    = document.getElementById("results");

// Modal
const modal           = document.getElementById("detailsModal");
const closeModal      = document.getElementById("closeModal");
const modalImage      = document.getElementById("modalImage");
const modalTitle      = document.getElementById("modalTitle");
const modalSynopsis   = document.getElementById("modalSynopsis");
const modalGenres     = document.getElementById("modalGenres");
const modalProducers  = document.getElementById("modalProducers");
const modalSource     = document.getElementById("modalSource");
const modalRating     = document.getElementById("modalRating");
const modalStatus     = document.getElementById("modalStatus");
const modalEpisodes   = document.getElementById("modalEpisodes");
const modalLink       = document.getElementById("modalLink");

// Extra modal fields
const modalRank       = document.getElementById("modalRank");
const modalPop        = document.getElementById("modalPop");
const modalYear       = document.getElementById("modalYear");
const modalBroadcast  = document.getElementById("modalBroadcast");

// Schedule
const scheduleDay   = document.getElementById("scheduleDay");
const btnSchedule   = document.getElementById("btnSchedule");
const scheduleList  = document.getElementById("scheduleList");
if (btnSchedule && scheduleDay && scheduleList) btnSchedule.addEventListener("click", loadSchedule);

// ========== My Top Picks store ==========
const FAV_KEY = "animango:topPicks";
const favStore = {
  get(){ try { return JSON.parse(localStorage.getItem(FAV_KEY)||"[]"); } catch { return []; } },
  set(arr){ localStorage.setItem(FAV_KEY, JSON.stringify(arr)); },
  isFav(id){ return this.get().some(x=>x.id===id); },
  add(item){ const a=this.get(); if(!a.some(x=>x.id===item.id)){ a.unshift(item); this.set(a); } },
  remove(id){ this.set(this.get().filter(x=>x.id!==id)); },
  toggle(item){ this.isFav(item.id) ? this.remove(item.id) : this.add(item); }
};

// ========== Helpers ==========
function getYear(it){
  const d = it?.aired?.from || it?.published?.from || null;
  return d ? new Date(d).getFullYear() : "—";
}
function todayLabel(){
  return ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"][new Date().getDay()];
}

// Always-on SFW guard (blocks Hentai, Erotica, and "mild nudity"; keeps normal R+)
function isSfw(it) {
  const ratingText = (it?.rating || "").toLowerCase();

  // Block RX (hentai) and any rating text that literally mentions "mild nudity"
  const blockByRating =
    ratingText.includes("rx") || ratingText.includes("mild nudity");

  // Block genres that are hentai or erotica (from both lists)
  const genres = (it?.genres || []).concat(it?.explicit_genres || []);
  const blockedGenres = new Set(["hentai", "erotica"]);
  const hasBlockedGenre = genres.some(
    g => blockedGenres.has((g?.name || "").toLowerCase())
  );

  return !(blockByRating || hasBlockedGenre);
}



// Ensure every Jikan URL carries sfw=1
function withSfw(url){
  const u = new URL(url);
  if (!u.searchParams.has("sfw")) u.searchParams.set("sfw","1");
  return u.toString();
}

// Retry-friendly fetch
async function jikan(url){
  const res = await fetch(withSfw(url));
  if (res.status === 429){
    const wait = Number(res.headers.get("Retry-After") || 1);
    if (msg) msg.textContent = `Rate limited. Retrying in ${wait}s…`;
    await new Promise(r=>setTimeout(r, wait*1000));
    return jikan(url);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ========== Card builder (shared) + ⭐ ==========
function createCard(item, entryType="anime"){
  const card = document.createElement("div");
  card.classList.add("card");

  const imgUrl =
    item.images?.webp?.image_url ||
    item.images?.jpg?.image_url  ||
    "";

  const year = getYear(item);
  card.innerHTML = `
    <div class="thumb">
      <img src="${imgUrl}" alt="${item.title}">
      <button class="fav-star" title="Add to My Top Picks">☆</button>
    </div>

    <h3>${item.title}</h3>

    <div class="meta">
      <span class="badge">⭐ ${item.score ?? "N/A"}</span>
      <span class="badge">🏆 Rank: ${item.rank ?? "—"}</span>
      <span class="badge">👥 Pop: ${item.popularity ?? "—"}</span>
      <span class="badge">📅 ${year}</span>
    </div>

    <p><strong>Type:</strong> ${item.type ?? "Unknown"}</p>
    <p><strong>Episodes/Chapters:</strong> ${item.episodes ?? item.chapters ?? "?"}</p>

    <div class="buttons">
      <button class="btn detailsBtn">View Details</button>
      <button class="btn addBtn">Add to My List</button>
    </div>
  `;

  // ⭐ star wiring
  const star = card.querySelector(".fav-star");
  function favObj(){
    return {
      id: item.mal_id,
      title: item.title,
      image: imgUrl,
      type: (entryType || "anime").toLowerCase(),
      score: item.score ?? null,
      rank: item.rank ?? null,
      popularity: item.popularity ?? null,
      year: year === "—" ? null : year,
      url: item.url || "",
      addedAt: Date.now()
    };
  }
  function syncStar(){
    const on = favStore.isFav(item.mal_id);
    star.textContent = on ? "★" : "☆";
    star.classList.toggle("active", on);
  }
  syncStar();
  star.addEventListener("click", (e)=>{
    e.stopPropagation();
    if (!isSfw(item)){ alert("This title is restricted and cannot be saved as a Top Pick."); return; }
    favStore.toggle(favObj());
    syncStar();
  });

  // View details
  card.querySelector(".detailsBtn").addEventListener("click", ()=>openModal(item));

  // Add to list (SFW guard)
  card.querySelector(".addBtn").addEventListener("click", ()=>{
    if (!isSfw(item)){ alert("This title is restricted and cannot be added to your list."); return; }
    const entry = {
      id: item.mal_id,
      title: item.title,
      type: entryType,
      totalEpisodes: item.episodes ?? null,
      totalChapters: item.chapters ?? null,
      episodesWatched: 0,
      chaptersRead: 0,
      status: "Plan",
      userReview: "",
      addedAt: new Date().toISOString(),
      image: imgUrl,
    };
    window.electronAPI.addEntry(entry);
    alert(`"${item.title}" added to My List!`);
  });

  return card;
}

// ========== SEARCH ==========
btnSearch?.addEventListener("click", searchAnime);
q?.addEventListener("keydown", e => { if (e.key === "Enter") searchAnime(); });

async function searchAnime(){
  const term = q.value.trim();
  const category = type.value;
  if (!term){ msg.textContent = "Please enter a title to search."; return; }

  results.innerHTML = "";
  msg.textContent = "Loading results…";

  try{
    const data = await jikan(`https://api.jikan.moe/v4/${category}?q=${encodeURIComponent(term)}&limit=12`);
    const arr = (data.data || []).filter(isSfw);

    if (!arr.length){ msg.textContent = "No results found."; return; }
    msg.textContent = "";
    results.innerHTML = "";
    arr.forEach(item => results.appendChild(createCard(item, category)));
  }catch(err){
    console.error(err);
    msg.textContent = "Error fetching data. Try again later.";
  }
}

// ========== HOME SECTIONS ==========
async function loadPopular(){
  const grid = document.getElementById("gridPopular");
  if (!grid) return;
  grid.textContent = "Loading…";
  try{
    const data = await jikan("https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=12");
    const arr = (data.data || []).filter(isSfw);
    grid.innerHTML = "";
    arr.forEach(it => grid.appendChild(createCard(it, "anime")));
  }catch(e){ console.error(e); grid.textContent = "Failed to load Top Popular."; }
}
async function loadAiringNow(){
  const grid = document.getElementById("gridAiring");
  if (!grid) return;
  grid.textContent = "Loading…";
  try{
    const data = await jikan("https://api.jikan.moe/v4/seasons/now?limit=12");
    const arr = (data.data || []).filter(isSfw);
    grid.innerHTML = "";
    arr.forEach(it => grid.appendChild(createCard(it, "anime")));
  }catch(e){ console.error(e); grid.textContent = "Failed to load Airing Now."; }
}
async function loadUpcoming(){
  const grid = document.getElementById("gridUpcoming");
  if (!grid) return;
  grid.textContent = "Loading…";
  try{
    const data = await jikan("https://api.jikan.moe/v4/seasons/upcoming?limit=12");
    const arr = (data.data || []).filter(isSfw);
    grid.innerHTML = "";
    arr.forEach(it => grid.appendChild(createCard(it, "anime")));
  }catch(e){ console.error(e); grid.textContent = "Failed to load Upcoming."; }
}
function loadHomeSections(){ loadPopular(); loadAiringNow(); loadUpcoming(); }
window.addEventListener("DOMContentLoaded", loadHomeSections);

// ========== MODAL ==========
function openModal(item){
  modal.style.display = "block";
  modalImage.src =
    item.images?.webp?.image_url ||
    item.images?.jpg?.image_url  ||
    "";
  modalTitle.textContent     = item.title;
  modalSynopsis.textContent  = item.synopsis ?? "No synopsis available.";
  modalGenres.textContent    = item.genres?.map(g=>g.name).join(", ") || "N/A";
  modalProducers.textContent = item.producers?.map(p=>p.name).join(", ") || "N/A";
  modalSource.textContent    = item.source ?? "Unknown";
  modalRating.textContent    = item.rating ?? "Unrated";
  modalStatus.textContent    = item.status ?? "Unknown";
  modalEpisodes.textContent  = item.episodes ?? item.chapters ?? "?";
  modalLink.href             = item.url;

  modalRank.textContent      = item.rank ?? "—";
  modalPop.textContent       = item.popularity ?? "—";
  modalYear.textContent      = getYear(item);
  const bc = item.broadcast?.string || `${item.broadcast?.day ?? ""} ${item.broadcast?.time ?? ""}`.trim();
  modalBroadcast.textContent = bc || "Not scheduled";
}
closeModal?.addEventListener("click", ()=>{ modal.style.display = "none"; });
window.addEventListener("click", (e)=>{ if (e.target === modal) modal.style.display = "none"; });

// ========== SCHEDULE ==========
async function loadSchedule(){
  if (!scheduleList) return;

  scheduleList.textContent = "Loading schedule…";
  let day = (scheduleDay?.value || "today").toLowerCase();
  if (day === "today") day = todayLabel();

  try{
    const data = await jikan(`https://api.jikan.moe/v4/schedules?filter=${encodeURIComponent(day)}&limit=12`);
    const arr = (data.data || []).filter(isSfw);

    if (!arr.length){ scheduleList.textContent = "No scheduled shows found for this day."; return; }

    scheduleList.innerHTML = "";
    arr.forEach(it=>{
      const c = document.createElement("div");
      c.className = "card";

      const imgUrl =
        it.images?.webp?.image_url ||
        it.images?.jpg?.image_url  ||
        "";
      const year = getYear(it);

      c.innerHTML = `
        <div class="thumb">
          <img src="${imgUrl}" alt="${it.title}">
          <button class="fav-star" title="Add to My Top Picks">☆</button>
        </div>
        <h3>${it.title}</h3>
        <div class="meta">
          <span class="badge">⭐ ${it.score ?? "N/A"}</span>
          <span class="badge">📅 ${it.broadcast?.string || "—"}</span>
          <span class="badge">🗓️ ${year}</span>
        </div>
        <p class="type-line"><strong>Type:</strong> ${it.type ?? "Anime"}</p>
        <p class="epch-line"><strong>Episodes/Chapters:</strong> ${it.episodes ?? it.chapters ?? "?"}</p>
        <div class="buttons">
          <button class="btn detailsBtn">View Details</button>
          <button class="btn addBtn">Add to My List</button>
        </div>
      `;

      // ⭐ Top pick
      const star = c.querySelector(".fav-star");
      function favObj(){
        return {
          id: it.mal_id, title: it.title, image: imgUrl, type: "anime",
          score: it.score ?? null, rank: it.rank ?? null, popularity: it.popularity ?? null,
          year: year === "—" ? null : year, url: it.url || "", addedAt: Date.now()
        };
      }
      function syncStar(){
        const on = favStore.isFav(it.mal_id);
        star.textContent = on ? "★" : "☆";
        star.classList.toggle("active", on);
      }
      syncStar();
      star.addEventListener("click", (e)=>{
        e.stopPropagation();
        favStore.toggle(favObj());
        syncStar();
      });

      // Details & add
      c.querySelector(".detailsBtn").addEventListener("click", ()=>openModal(it));
      c.querySelector(".addBtn").addEventListener("click", ()=>{
        const entry = {
          id: it.mal_id,
          title: it.title,
          type: "anime",
          totalEpisodes: it.episodes ?? null,
          totalChapters: null,
          episodesWatched: 0,
          chaptersRead: 0,
          status: "Plan",
          userReview: "",
          addedAt: new Date().toISOString(),
          image: imgUrl,
        };
        window.electronAPI.addEntry(entry);
        alert(`"${it.title}" added to My List!`);
      });

      scheduleList.appendChild(c);
    });
  }catch(e){
    console.error("Schedule error:", e);
    scheduleList.textContent = "Failed to load schedule.";
  }
}
