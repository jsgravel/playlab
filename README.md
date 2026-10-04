# Tile Hop

A gentle, mobile-first matching puzzle. Plan ahead using each tile's small next-symbol preview and guide a rabbit up to the clouds. Sixty deterministic puzzles across five gardens, optional stars, hints, undo, original synthesized music, and locally saved progress. Original 12-level saves remain compatible.

## Garden adventure

Each garden has 12 climbs. Finish every climb in a garden to unlock the next; unlocked gardens allow their levels to be played in any order. Completing a garden celebrates the milestone and offers entry to the next. Completing all 60 levels triggers the final congratulations celebration, which can be revisited from the garden trail.

1. **Clover Garden:** the original matching puzzles.
2. **Willow Walk:** hops reach at most one column sideways.
3. **Lantern Orchard:** collect keys before landing on gated tiles. Keys are retained through the climb and gates do not consume them.
4. **Cloud Springs:** spring tiles skip the next row; match a tile two rows above.
5. **Starlight Sanctuary:** a fifth symbol, longer routes, and two-key gates combine the mechanics.

Rules appear above each puzzle. Undo reverses key collection and spring position. Hints evaluate reach, keys, and spring hops to find a complete route. Stars remain optional discoveries, not a completion requirement.

Run `node verify.cjs` and `node verify-audio.cjs` for dependency-free checks of the puzzles, progression, saved games, and audio lifecycle.

## Play locally

Open `index.html` directly, or serve this directory with any static server. No build, package install, or backend is required. Fonts are optional Google Fonts; system fonts work offline. Game data and visuals are included locally.

## Deploy on GitHub Pages

1. Create a GitHub repository and upload `index.html`, `style.css`, `audio.js`, `game.js`, and `.nojekyll` to its root.
2. In the repository, open **Settings → Pages**.
3. Select **Deploy from a branch**, choose your branch (usually `main`) and **/ (root)**, then save.
4. Open the published URL displayed by GitHub Pages once deployment completes.

Relative asset links support both `username.github.io` and `username.github.io/repository-name/`. No credentials or API keys are needed. Progress is stored only in the current browser; private browsing or clearing site data may remove it.

## Controls

Tap a tile; desktop users can also use Tab and Enter. Undo reverses a hop, Restart resets the current level, Hint highlights a route toward the top. The level selector opens the garden trail with completion checks and locked garden previews. Music and effects have independent buttons and start off. Woodland Radio includes four original synthesized fantasy compositions, a song selector, next-song button, and music volume. Tracks play in order and repeat. Audio preferences are saved locally; returning players must interact before music starts. Audio pauses in background tabs. No external music files or copyrighted game recordings are used. Reduced-motion preferences disable decorative animations.
