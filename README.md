# LoL Nerdles

Daily League of Legends mini-games. Every day there's a new set of 9 games;
players choose a **Quick Three**, **Half Course (6)** or **Full Course (9)**.
Every game scores 0–100 points, shown as a League rank (Iron → Challenger), so
totally different games add up to one rank for the day.

There's also **Free Play Mode** (play any game as often as you want) and a
**Leaderboard** (for now: your scores and fun rating per game) — so you can find out which
games are actually fun before building more.

---

## 1. Start it in VS Code

1. Install **Node.js LTS** (version 20 or newer): https://nodejs.org
2. Unzip this folder and open it in VS Code (*File → Open Folder…*).
3. Open the terminal in VS Code (*Terminal → New Terminal*) and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open the link it prints (usually http://localhost:5173). Edit any file and
   the page updates instantly.

Other commands:

| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Typecheck + build the final site into `dist/` |
| `npm run preview` | Preview the built site locally |
| `npm run fetch-data` | Save the latest champion/item data into `public/data/` (see below) |
| `npm run fetch-models` | Re-measure the 3D models for **Size Up** + **Silhouette** (once per patch, see below) |
| `npm run fetch-connections` | Rebuild the champion groups for **Rift Connections** (once per patch) |
| `npm run fetch-proplay` | Re-collect the Worlds stats for **Pro Play** + **Big Numbers** (after each Worlds) |

## 2. Where the data comes from

Champions and items come from **Data Dragon**, Riot's free public data files
(names, titles, lore blurbs, base stats, item costs and recipes, icons).

- **Live (default):** with no local data, the browser downloads the newest patch.
- **Pinned (recommended):** run `npm run fetch-data` once per patch. The data is
  saved in `public/data/` and ships with your site. Daily puzzles then stay
  stable until *you* update them (a new champion mid-day won't change today's puzzle).

**Size Up** and **Silhouette** use the real 3D models from **Community Dragon**
(a fan mirror of the game files). `npm run fetch-models` measures every model and saves the
heights to `src/data/generated/models.json`; the browser then loads the models
straight from Community Dragon. The raw models have no animations, so a few
champions stand in an odd pose — the `FIXES` list in `scripts/fetch-models.mjs`
skips or turns those. Run it once per patch.

**Rift Connections** groups come from `npm run fetch-connections`: regions and
release dates from Riot's Universe site, skin lines and races from Community
Dragon, resource types and name/title quirks from Data Dragon. Your own groups
go in `src/data/curated/connections.ts`.

**Pro Play** and the Worlds questions in **Big Numbers** use real stats from the
official LoL Esports API: `npm run fetch-proplay` reads every Worlds game since
2023 (the first year with stats in the live feed) and saves kills, games and
picks to `src/data/generated/proplay.json`. Re-run it after each Worlds.

**Deep Dive** asks 5 categories a day: 3 champion questions built from the
Rift Connections groups (rarity = how few skins a champion has, or the list
order for hand-made groups) and 2 free-text questions about pro play and the
game from `src/data/curated/deepDive.ts`. Those tiers are first guesses — move
answers between tiers, add questions, and update the year ranges after each
Worlds/MSI.

## 3. The 9 games

| Name | Game | Type |
|---|---|---|
| Redacted Lore | Guess the champion from their bio (name blacked out) | procedural |
| Stat Check | Higher/lower on champion stats — a different stat every round | procedural |
| Pro Play | Higher/lower on real Worlds stats: players, champions or teams | procedural |
| Big Numbers | Estimate a huge number on a 1-to-a-billion slider (or type it) | procedural |
| Silhouette | Guess the champion from their 3D model's shadow; each miss adds light + a hint | procedural |
| Splash Zoom | Guess the champion from a zoomed-in piece of splash art | procedural |
| Rift Connections | Sort 16 champions into 4 hidden groups (NYT Connections-style) | procedural |
| Size Up | Resize a champion's 3D model next to another (Magnitudle-style) | procedural |
| Deep Dive | 5 categories, one answer each, rarer = more points (Krillion-style) | curated |

**Procedural** games generate new puzzles forever from Riot's data — no daily
work from you. **Curated** games need you to add content now and then.

## 4. How the daily games and the score work

- The date (UTC, like most daily games) is the "seed". Same date → same 9 games
  in the same order → same puzzles for every player.
- 3 games = the first 3 of today's 9, 6 = the first 6. Results are saved, so a
  player can finish 3 and later **extend to 6 or 9** without replaying.
- **Score:** every game gives 0–100 points (`src/lib/scoring.ts`):
  - guess the champion: 1st guess 100, then 15 less per guess, missed 0
  - higher/lower: 20 per correct call
  - sliders (Size Up, Big Numbers): 100 when spot on, fewer the further off
  - Rift Connections: 100 − 20 per mistake (out of mistakes: 10 per group found)
  - Deep Dive: depth points × 5
- The day's score is the **average** of the games played, shown as a rank:
  95+ Challenger, 90+ Grandmaster, 85+ Master, 75+ Diamond, 65+ Emerald,
  55+ Platinum, 45+ Gold, 35+ Silver, 20+ Bronze, below that Iron. An average
  means a Quick Three and a Full Course can be compared directly.
- At the end you get a shareable result: rank, points and one 🟩/🟨/🟥 per game.
- **Reset the daily for everyone:** bump `DAILY_VERSION` in `src/lib/course.ts`.
  Today's progress is forgotten and every day gets fresh puzzles.

## 5. Finding your favourite games

After every game you can rate it 1–5 stars. The **Leaderboard** sorts all games
by your average fun rating, and shows your average score — if a game is always
Challenger it's too easy, if it's always Iron it's too hard. Tune its scoring
(the helpers in `src/lib/scoring.ts`) or drop the game.

## 6. Project structure

```
src/
  App.tsx              ← screens + data loading
  views/               ← Home, Course (3/6/9), Range, Stats
  games/
    registry.ts        ← THE LIST OF GAMES — add/remove games here
    guessChampion.tsx  ← engine: guess a champion from a clue (Redacted Lore, Silhouette)
    higherLower.tsx    ← engine: higher/lower chains (Stat Check, Pro Play)
    sizeUp.tsx, connections.tsx, deepDive.tsx …
  components/          ← scorecard, result card, champion input …
  data/
    load.ts            ← Data Dragon loader
    curated/           ← your hand-made content
  lib/                 ← seeded random, dates, scoring + ranks, saving
scripts/fetch-data.mjs ← pins patch data into public/data/
scripts/fetch-models.mjs, fetch-connections.mjs ← regenerate src/data/generated/
```

## 7. Adding a new game

1. Create a component in `src/games/` that receives `HoleProps`
   (`data`, `seed`, `onFinish`). Use `createRng(seed)` for anything random.
2. Call `onFinish({ score, detail })` exactly once when the game is over (`score` = 0–100).
3. Add it to the `HOLES` list in `src/games/registry.ts`.

Many new games need no new component at all — the engines are reusable. For
example, a new higher/lower hole is just a `makeHigherLowerHole({ setup })` with
your own list of things to compare (see `src/games/statCheck.tsx`), and a new
guess-the-champion game is a `makeGuessChampionHole({ clue })`
(see `src/games/splashZoom.tsx`).

## 8. Online + working together

The code lives at https://github.com/HeinoDoe/LeagueGame and the site is
published at **https://heinodoe.github.io/LeagueGame/**. Every push to `main`
rebuilds and republishes it automatically (`.github/workflows/deploy.yml`,
GitHub Pages with *Source: GitHub Actions*). Check the **Actions** tab if an
update doesn't show up after a few minutes.

**Bring in a friend:** on GitHub open *Settings → Collaborators → Add people*
and enter their GitHub username. Once they accept the invite:

```bash
git clone https://github.com/HeinoDoe/LeagueGame.git
cd LeagueGame
npm install
npm run dev
```

Day to day: `git pull` before you start, then commit and push your changes.
If you both work at the same time, use a branch per feature
(`git switch -c new-hole`) and merge it with a pull request on GitHub.

**Later, a domain:** buy one, add it under Settings → Pages → Custom domain,
and set the DNS records GitHub shows you. Nothing in the code needs to change.

## 9. Next steps (when you know which games you like)

- **Leaderboards + accounts:** add Supabase (free tier). `src/lib/storage.ts` is
  the only file that talks to storage, so that's where it plugs in. For real
  leaderboards, check answers on the server so people can't cheat.
- **TFT games:** Data Dragon also has TFT champion, trait and augment files.
- **More games per day:** add more games and let the daily pick from a bigger pool.
- **Before ads:** your own domain, an Impressum, a privacy policy and a cookie
  consent banner (if you're in Germany/EU).

## Riot's fan project rules (important)

This project uses Riot's IP under the **"Legal Jibber Jabber"** policy
(https://www.riotgames.com/en/legal): free for players, passive ad revenue OK,
**no paywalls / paid unlocks, no crowdfunding, not run by a company** without a
license from Riot. The required notice is already in the site footer. Riot can
revoke permission at any time, so keep it fair and fun.
