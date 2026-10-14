# ⛳ Rift Links

A daily golf course of League of Legends mini-games. Every day there's a new
course of 9 holes; players choose a **Quick Three**, **Half Course (6)** or
**Full Course (9)**. Each hole is a different mini-game, and every game's result is
turned into golf strokes so they all add up on one scorecard.

There's also **Free Play Mode** (play any hole as often as you want) and a
**Leaderboard** (for now: your scores and fun rating per hole) — so you can find out which
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
| `npm run fetch-models` | Re-measure the 3D models for **Size Up** (once per patch, see below) |

## 2. Where the data comes from

Champions and items come from **Data Dragon**, Riot's free public data files
(names, titles, lore blurbs, base stats, item costs and recipes, icons).

- **Live (default):** with no local data, the browser downloads the newest patch.
- **Pinned (recommended):** run `npm run fetch-data` once per patch. The data is
  saved in `public/data/` and ships with your site. Daily puzzles then stay
  stable until *you* update them (a new champion mid-day won't change today's puzzle).

**Size Up** uses the real 3D models from **Community Dragon** (a fan mirror of
the game files). `npm run fetch-models` measures every model and saves the
heights to `src/data/generated/models.json`; the browser then loads the models
straight from Community Dragon. The raw models have no animations, so a few
champions stand in an odd pose — the `FIXES` list in `scripts/fetch-models.mjs`
skips or turns those. Run it once per patch.

**Deep Dive** uses hand-made data you should check, because I wrote a first
draft: `src/data/curated/deepDive.ts` (prompts + rarity tiers).

## 3. The 9 holes

| Hole | Game | Par | Type |
|---|---|---|---|
| Title Shot | Guess the champion from their title, hints after each miss | 4 | procedural |
| Redacted Lore | Guess the champion from their bio (name blacked out) | 4 | procedural |
| Gold Rush | Higher/lower on item gold cost, 5 calls | 4 | procedural |
| Health Bar | Higher/lower on champion base HP, 5 calls | 4 | procedural |
| Range Finder | Estimate attack range with a slider | 3 | procedural |
| Price Check | Estimate an item's total cost with a slider | 3 | procedural |
| Recipe Book | Which item do these components build into? | 3 | procedural |
| Size Up | Resize a champion's 3D model next to another (Magnitudle-style) | 3 | procedural |
| Deep Dive | 3 answers to a prompt, rarer = more points (Krillion-style) | 5 | curated |

**Procedural** holes generate new puzzles forever from Riot's data — no daily
work from you. **Curated** holes need you to add content now and then.

## 4. How the daily course works

- The date (UTC, like most daily games) is the "seed". Same date → same 9 holes
  in the same order → same puzzles for every player.
- 3 holes = the first 3 of today's 9, 6 = the first 6. Results are saved, so a
  player can finish 3 and later **extend to 6 or 9** without replaying.
- Scoring: each hole turns its result into strokes (capped at par + 3). Example:
  Title Shot solved on the 1st guess = 2 strokes = eagle on a par 4.
- At the end you get a shareable emoji scorecard (🦅 🐦 🟩 🟨 🟥).

## 5. Finding your favourite games

After every hole you can rate it 1–5 stars. The **Leaderboard** sorts all holes
by your average fun rating, and shows the average score to par — if a hole is
always −2 it's too easy, if it's always +3 it's too hard. Tune the scoring
(e.g. `strokesFromAvgError` in `src/lib/scoring.ts`) or drop the hole.

## 6. Project structure

```
src/
  App.tsx              ← screens + data loading
  views/               ← Home, Course (3/6/9), Range, Stats
  games/
    registry.ts        ← THE LIST OF HOLES — add/remove games here
    guessChampion.tsx  ← engine: guess a champion from a clue
    higherLower.tsx    ← engine: higher/lower chains
    estimate.tsx       ← engine: slider estimates
    recipe.tsx, sizeUp.tsx, deepDive.tsx
  components/          ← scorecard, result card, champion input …
  data/
    load.ts            ← Data Dragon loader
    curated/           ← your hand-made content
  lib/                 ← seeded random, dates, golf scoring, saving
scripts/fetch-data.mjs ← pins patch data into public/data/
```

## 7. Adding a new hole

1. Create a component in `src/games/` that receives `HoleProps`
   (`data`, `seed`, `par`, `onFinish`). Use `createRng(seed)` for anything random.
2. Call `onFinish({ strokes, detail })` exactly once when the hole is over.
3. Add it to the `HOLES` list in `src/games/registry.ts`.

Many new holes need no new component at all — the engines are reusable. For
example a "Move Speed" higher/lower hole is just a new `makeHigherLowerHole({...})`
entry in the registry.

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

## 9. Next steps (when you know which holes you like)

- **Leaderboards + accounts:** add Supabase (free tier). `src/lib/storage.ts` is
  the only file that talks to storage, so that's where it plugs in. For real
  leaderboards, check answers on the server so people can't cheat.
- **TFT holes:** Data Dragon also has TFT champion, trait and augment files.
- **Front 9 / Back 9:** add 9 more holes and expand to an 18-hole course.
- **Before ads:** your own domain, an Impressum, a privacy policy and a cookie
  consent banner (if you're in Germany/EU).

## Riot's fan project rules (important)

This project uses Riot's IP under the **"Legal Jibber Jabber"** policy
(https://www.riotgames.com/en/legal): free for players, passive ad revenue OK,
**no paywalls / paid unlocks, no crowdfunding, not run by a company** without a
license from Riot. The required notice is already in the site footer. Riot can
revoke permission at any time, so keep it fair and fun.
