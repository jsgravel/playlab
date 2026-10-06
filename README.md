# Tile Hop

A gentle, mobile-first matching puzzle. Plan ahead using each tile's small next-symbol preview and guide a rabbit up to the clouds. Eighty-four deterministic puzzles across seven gardens, optional stars, hints, undo, original synthesized music, and locally saved progress. Original 12-level saves remain compatible.

## Garden adventure

Each garden has 12 climbs. Finish every climb in a garden to unlock the next; unlocked gardens allow their levels to be played in any order. Completing a garden celebrates the milestone and offers entry to the next. Completing all 84 levels triggers the final congratulations celebration, which can be revisited from the garden trail.

1. **Clover Garden:** the original matching puzzles.
2. **Willow Walk:** hops reach at most one column sideways.
3. **Lantern Orchard:** collect keys before landing on gated tiles. Keys are retained through the climb and gates do not consume them.
4. **Cloud Springs:** spring tiles skip the next row; match a tile two rows above.
5. **Starlight Sanctuary:** a fifth symbol, longer routes, and two-key gates combine the mechanics.
6. **Copper Grove:** spending gates and longer forks introduce key budgeting.
7. **Crystal Labyrinth:** deeper branches, repeated tolls, and two-key spending gates test multi-hop planning.

Rules appear above each puzzle. Undo reverses key collection and spring position. Hints evaluate reach, keys, and spring hops to find a complete route. Stars remain optional discoveries, not a completion requirement.

Later puzzles now use designed column patterns, merging forks, false leads, key detours, and spring shortcuts. Willow levels have 5–7 rows, Lantern Orchard 8–10, Cloud Springs 10–12, and Starlight Sanctuary 12–14. A bounded play window follows the rabbit; swipe inside it to inspect the full route. Completed levels, garden unlocks, and statistics remain saved when the layouts update.

From Lantern Orchard onward, correct hops grow an **untimed combo**. At 3, 6, and 10 hops the counter, rabbit glow, landing ring, and sparkles become richer. Wrong matches, blocked gates, undo, restart, and changing levels reset the active streak. Waiting and hints do not. The best combo saves in Show stats and clears with a full-game reset. New and returning players receive a combo tutorial.

Spring jumps fade the skipped row and outline the landing row without revealing the correct match. Keys and padlocks use clear SVG icons; the key inventory stays beside the matching prompt. Each garden has a destination, and the garden trail has named cards with completion meters and unlock requirements.

The first time you enter a garden, a short animated rabbit example introduces its rules. Watch, replay, or try the example without changing your puzzle progress. Acknowledgements are saved, and How to play lets you review the current garden's example. Starlight has separate examples for the sun symbol and two-key gates. Mechanic sound cues distinguish collecting keys, opening/blocked gates, preparing/using springs, stars, and milestone celebrations; all use the effects mute and volume controls.

Run `node verify.cjs`, `node verify-audio.cjs`, `node verify-tutorials.cjs`, and `node verify-fullscreen.cjs` for dependency-free checks of puzzles, progression, tutorials, audio, and fullscreen.

## Play locally

Open `index.html` directly, or serve this directory with any static server. No build, package install, or backend is required. Fonts are optional Google Fonts; system fonts work offline. Game data and visuals are included locally.

## Deploy on GitHub Pages

1. Create a GitHub repository and upload `index.html`, `style.css`, `audio.js`, `tutorials.js`, `game.js`, `fullscreen.js`, `manifest.webmanifest`, and `.nojekyll` to its root.
2. In the repository, open **Settings → Pages**.
3. Select **Deploy from a branch**, choose your branch (usually `main`) and **/ (root)**, then save.
4. Open the published URL displayed by GitHub Pages once deployment completes.

Relative asset links support both `username.github.io` and `username.github.io/repository-name/`. No credentials or API keys are needed. Progress is stored only in the current browser; private browsing or clearing site data may remove it.

## Controls

The Full screen button sits beside the level selector. Supported browsers use native fullscreen; Exit or Escape returns to normal. Other browsers use a focus view that hides the surrounding page while keeping the game and Exit button visible. For an app-like view on iPhone, open the site in Safari and choose Share → Add to Home Screen. Open the saved icon to play without the regular browser toolbar. This does not add offline caching.

**Options → Show stats** displays saved undo uses, level restarts, distinct flawless levels, and total completed levels. A flawless climb has no wrong matching tap, blocked gate attempt, undo, or restart. Hints and tutorial practice do not count as errors. Repeated clean clears count once per level; a clean replay after a completed flawed climb can earn a flawless mark. Error state survives reloads. Older saves retain level progress, with stats starting from this update rather than guessing past results.

**Restart entire game…** opens a warning and defaults focus to keeping progress. Only the explicit erase confirmation clears all game progress, garden unlocks, star records, tutorial acknowledgements, and stats in this browser. Music/effects preferences are preserved. This full reset cannot be undone; the normal Restart control also asks for confirmation, resets only the current level, and increments its restart counter only after confirmation. Stats and the full-game reset live in Options beside How to play, away from the hop controls.

Tap a tile; desktop users can also use Tab and Enter. Every valid tap commits immediately, so consecutive hops never wait for the rabbit animation. Undo reverses a hop, Restart resets the current level, Hint highlights a route toward the top. Undo or restart also cancels pending finish celebrations. The level selector opens the garden trail with completion checks and locked garden previews. Music and effects have independent buttons and start off. Woodland Radio includes twelve original synthesized compositions spanning fantasy flute/harp, soft piano, plucked guitar, ambient pads, and gentle retro, a song selector, next-song button, and separate music/effects volume sliders. Tracks play in order and repeat. Audio preferences are saved locally; returning players must interact before music starts. Audio pauses in background tabs. No external music files or copyrighted game recordings are used. Reduced-motion preferences disable decorative animations.

The garden camera glides upward with each hop and gently follows undo. Rapid taps retarget the glide without locking input; HUD updates do not restart it. New levels establish their starting view immediately, and reduced-motion preferences use immediate camera positioning.

Copper Grove and Crystal Labyrinth add 24 levels after the original 60; existing saved level numbers, completions, and statistics stay compatible. Copper gates show a minus-key badge and **spend** the indicated keys; original gates still only require keys. Undo refunds a toll and removes any key collected on the undone tile. The hint solver accounts for both collection and spending.

The new gardens use authored multi-hop forks instead of immediate dead ends. Both branches can keep matching before merging at a gate, but only one carries enough keys through the tolls. Planning depth increases within each garden; Copper Grove has 10–21 rows and Crystal Labyrinth 18–32 rows. Stars remain optional and do not identify the correct route. Every puzzle is checked for solvability and delayed failure branches; the game stays untimed. The first five gardens have unlimited undo and hints; the last two use the assist budgets described below. New mechanics receive compact interactive lessons. The garden trail uses two compact rows for all seven gardens.

Locked gardens offer a tutorial preview. Viewing it does not unlock levels or skip the introductory lesson when the garden is reached.

Finishing a level keeps the final landing visible. A smiling rabbit dances beside a 40-piece confetti burst, while a compact inline card offers the next climb or next garden. Garden milestones and the 84-level congratulations use that same unobstructed view. Reduced-motion preferences suppress the burst and dance. Completion remains saved immediately; pressing Next restores the regular controls.

Gates with enough available keys show an open green lock; locked gates keep their closed icon. Copper spending and undo immediately update that readiness. This indicates affordability, not a recommended route.

Successful hops in combo gardens play a quiet rising melody, capped at a comfortable pitch. The sound gains a warm lower layer at 3, a harmony at 6, and a small bell accent at 10. Key, gate, spring, and star cues remain distinct, and all these sounds obey the effects mute/volume controls. A broken streak restarts the melody.

Copper Grove allows **3 undos and 2 hints** per attempt; Crystal Labyrinth allows **2 undos and 1 hint**. Repeating a hint at the same position costs only once. Using the last assist does not end the attempt: requesting another one does, as does reaching a dead end with no undos. Failed attempts require a full level restart. Restart refills both allowances; abandoning an active hard attempt also counts as a failure. Hard routes, budgets, and failed state survive refreshes and garden switching. Stats show easy restarts, hard restarts, and failed hard attempts separately, with historical restarts preserved in the total. The new assist lesson appears once for returning hard-garden players too.
