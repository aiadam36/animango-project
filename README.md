# 🥭 Animango

> **Your personal anime & manga companion — discover, track, and review, all in one place.**

Animango is a desktop application built with [Electron](https://www.electronjs.org/) that lets you search for anime and manga, track your watching/reading progress, write personal reviews, and curate your own Top Picks list — powered by the free [Jikan API](https://jikan.moe/) (unofficial MyAnimeList API).

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Search** | Search any anime or manga by title, with live results from MyAnimeList |
| 📺 **Airing Now** | Browse currently airing anime this season |
| ⏭️ **Upcoming** | See what's coming in the next season |
| 🔥 **Top Popular** | Explore the most popular anime of all time |
| 🗓️ **Schedule** | View the broadcast schedule for any day of the week |
| 📋 **My List** | Add titles to your personal tracker with status, progress, and reviews |
| ⭐ **My Top Picks** | Star your all-time favorites and sort them by score, popularity, or year |
| 🔒 **SFW Filter** | All results are automatically filtered for safe-for-work content |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Installation

1. **Clone or download the project:**
   ```bash
   git clone https://github.com/danizz140506-bot/animango.git
   cd animango
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**
   ```bash
   npm start
   ```

The Animango window will open automatically.

---

## 🖥️ How to Use

### Home Page

When you launch Animango, the home page loads three sections automatically:

- **Top Popular** — the highest-popularity anime on MAL
- **Airing Now** — currently broadcasting this season
- **Upcoming** — titles confirmed for the next season

You can also check the **broadcast schedule** for a specific day using the dropdown at the top of the page.

---

### Searching for Anime & Manga

1. Type a title into the search bar (e.g. `One Piece`, `Berserk`).
2. Select **Anime** or **Manga** from the dropdown.
3. Click **Search** or press **Enter**.

Results appear as cards showing the title, score, rank, popularity, and year. Click **View Details** on any card to open a full info modal with synopsis, genres, producers, broadcast time, and a link to MyAnimeList.

---

### Adding to My List

1. Find a title via search or the home sections.
2. Click **Add to My List** on its card.
3. The title is saved to your local tracker.

Navigate to **My List** in the top nav to manage everything you've added.

---

### Managing My List

On the **My List** page you can:

- **Filter** entries by status using the dropdown (All, Watching, Reading, Completed, On Hold, Dropped, Plan)
- **Update status** — change between Plan / Watching / Reading / Completed / On Hold / Dropped
- **Track progress** — enter how many episodes watched (anime) or chapters read (manga)
- **Write a review** — add personal notes in the text area
- **Save changes** — click 💾 Save to persist your updates
- **Delete** — click 🗑️ Delete to remove a title from your list

> Your data is stored locally in a `data/userData.json` file inside the project folder — no account or internet connection needed for your list.

---

### My Top Picks

Star ⭐ any title from anywhere in the app to add it to **My Top Picks**.

On the **My Top Picks** page you can:

- **Filter** by type (All / Anime / Manga)
- **Sort** by Recently Added, Score, Popularity, or Year
- **Remove** a pick by clicking the ★ star on its card

> Top Picks are stored in your browser's `localStorage` and persist between sessions.

---

## 📦 Building for Windows

To package the app as a standalone Windows `.exe`:

```bash
npm run pack:win
```

The output will be placed in the `dist/` folder.

---

## 🔌 API

Animango uses the **[Jikan v4 API](https://docs.api.jikan.moe/)** — a free, open-source REST API for MyAnimeList data. No API key is required.

All requests automatically include a `sfw=1` parameter and results are further filtered client-side to block restricted content.

> **Rate limiting:** Jikan enforces a rate limit of ~3 requests/second. Animango handles `429 Too Many Requests` responses automatically by waiting and retrying.

---

## 🛠️ Tech Stack

- **[Electron](https://www.electronjs.org/)** — desktop shell
- **[Jikan API v4](https://jikan.moe/)** — anime & manga data
- **Vanilla JS** — no frontend framework
- **localStorage** — Top Picks persistence
- **JSON file storage** — My List persistence (via Electron main process)
