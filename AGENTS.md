# Peacock — Agent Guide

## Project Overview

Peacock is a Visual Studio Code extension that subtly changes the color of your workspace. It's ideal when you have multiple VS Code instances, use VS Live Share, or use VS Code's Remote features and want to quickly identify which editor is which.

- **Publisher:** johnpapa
- **VS Code Marketplace:** [Peacock](https://marketplace.visualstudio.com/items?itemName=johnpapa.vscode-peacock)
- **Version:** See `package.json` for the current version

## Repository Structure

```
vscode-peacock/
├── src/                        — Extension source code (TypeScript)
│   ├── extension.ts            — Extension entry point (activation, command registration)
│   ├── commands.ts             — Command implementations (enter color, random, favorites, etc.)
│   ├── apply-color.ts          — Core color application logic
│   ├── color-library.ts        — Color manipulation utilities (uses tinycolor2)
│   ├── configuration/          — VS Code configuration read/write helpers
│   ├── models/                 — TypeScript interfaces, enums, constants, state
│   ├── inputs.ts               — User input prompts (color picker, quick pick)
│   ├── statusbar.ts            — Status bar color display
│   ├── live-share/             — VS Live Share integration
│   ├── remote/                 — Remote development integration
│   ├── test/                   — Mocha unit tests
│   ├── logging.ts              — Output channel logging
│   ├── mementos.ts             — Global state persistence
│   ├── notification.ts         — User notifications
│   └── object-library.ts       — Object/element management
├── e2e/                        — Playwright end-to-end tests (docs screenshots)
├── docs/                       — Docsify documentation site
│   ├── guide/                  — User guide pages
│   ├── about/                  — About pages
│   ├── changelog/              — Changelog page
│   ├── _sidebar.md             — Navigation sidebar
│   └── index.html              — Docsify entry point
├── resources/                  — Extension icons and assets
├── testworkspace/              — Test workspace used by Mocha tests
├── .github/
│   ├── workflows/docs.yml      — Docs deploy + Playwright e2e tests
│   ├── ISSUE_TEMPLATE/         — Bug report and feature request templates
│   └── PULL_REQUEST_TEMPLATE/  — PR template
├── webpack.config.js           — Webpack bundler config (Node + Web targets)
├── tsconfig.json               — TypeScript configuration
├── playwright.config.ts        — Playwright e2e test config
└── package.json                — Extension manifest, commands, settings, scripts
```

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Runtime:** VS Code Extension Host (Node.js + Browser via `extension-web.js`)
- **Bundler:** Webpack (dual target: `extension-node.js` and `extension-web.js`)
- **Color library:** tinycolor2 — all color manipulation goes through this
- **VS Live Share:** `vsls` package for Live Share integration
- **Linting:** ESLint + Prettier (husky pre-commit hook runs Prettier automatically)
- **Testing:** dual-lane — Vitest (fast, pure-logic unit tests in `src/test/unit/`) + Mocha (real VS Code extension host tests in `src/test/suite/`) + Playwright (e2e docs tests in `e2e/`)
- **Docs:** Docsify (static site in `docs/`, deployed to GitHub Pages)

## Build & Run

```bash
npm install                     # Install dependencies
npm run webpack                 # Build (development mode)
npm run vscode:prepublish       # Build (production mode — webpack --mode production)
```

To run the extension locally, press **F5** in VS Code — this launches the Extension Development Host with the extension loaded.

## Testing

```bash
npm test                        # Compile + run Mocha host tests + Vitest unit tests
npm run test:unit               # Vitest only — fast, pure logic, no VS Code needed
npm run test:host               # Compile + Mocha host tests + Live Share host tests
npm run just-test               # Mocha host tests only (skip compile)
npm run test:e2e                # Run Playwright e2e tests (docs screenshots)
npm run test:coverage           # Run both lanes with coverage (host + Vitest)
npm run test-all                # Run test + Live Share tests
npm run package:check           # Package the VSIX and verify contents/size (see Release Process)
```

**Test structure — two lanes, pick based on whether the code touches the `vscode` API:**

- **Unit lane** (`src/test/unit/`, Vitest): pure logic with no `vscode` API dependency — color math, data transforms, pick-A-or-B decisions. Runs in ~1s, no VS Code needed. `vscode` itself is mocked (`src/test/unit/mocks/vscode.ts`).
- **Host lane** (`src/test/suite/`, Mocha + Sinon): anything that touches the real `vscode` API — commands, real config reads/writes, UI prompts. Boots an actual VS Code extension host; slower, but it's the ground truth.
- E2e tests live in `e2e/` and use Playwright to capture docs screenshots
- The `testworkspace/` directory is used as a VS Code workspace during host tests
- When migrating a host test to the unit lane, only move it if the underlying logic is genuinely pure — extract a pure helper first if needed. Never delete host coverage without an equivalent unit replacement that exercises the same branches.

**Test requirements:**

- Every bug fix must include a regression test that fails without the fix and passes with it
- Every new feature must include unit tests covering the happy path and relevant edge cases
- Never merge code that reduces the passing test count
- UI/theme-affecting changes (status bar, title bar, activity bar, color tokens) should be verified on Windows, VS Live Share, and Cursor before considering the fix complete — automated tests alone haven't caught real-world issues here in the past
- **Treat "this can't be tested" claims in a PR as a hypothesis to verify, not a fact to accept.** Before agreeing, `grep` `src/test/` for the exact `vscode` API/state the new code depends on (e.g. `env.remoteName`, a config key, a command). If any existing suite already stubs/mocks that exact dependency (host lane can `sinon.stub(vscode.env, ...)`; unit lane only has what's in `src/test/unit/mocks/vscode.ts`), the claim usually means "untestable in the one lane I checked," not "untestable everywhere" — write the test in the lane that already supports it instead of skipping coverage. See PR #757 for a worked example (claim was wrong; host-lane precedent existed in `remote.test.ts`).

## Key Patterns and Conventions

- **Commands** are registered in `extension.ts` and implemented in `commands.ts`
- **Color application** flows through `apply-color.ts` → `color-library.ts` (tinycolor2)
- **Configuration** is read/written via helpers in `src/configuration/`
- **State** is managed through VS Code's `workspaceState` and `globalState` APIs (see `mementos.ts`)
- **Models** define all TypeScript interfaces and enums in `src/models/`
- **Dual output** — the extension compiles to both Node (`extension-node.js`) and Web (`extension-web.js`) via Webpack

## CI/CD

- **CI** (`ci.yml`): Triggered on `pull_request` and `push` to `main` (ignores docs/markdown). Runs, in order: Lint → Build (`test-compile`) → Test (Host) (`xvfb-run npm run just-test`) → Test (Unit) (`npm run test:unit`) → Package contents check (`npm run package:check`).
- **Docs + E2E** (`docs.yml`): Triggered on push to `main` and PRs when `docs/`, `e2e/`, `playwright.config.ts`, or the workflow itself changes. Runs Playwright e2e tests, then deploys `docs/` to GitHub Pages.

## Release Process

**This checklist is mandatory for every release, no exceptions — run through it in full even when the release feels small.** Almost all of it is agent-executable — Claude (or any agent working this repo) should just do it, not ask a human to. Exactly one step is human-only: it's called out explicitly below, and it's the only one that requires stopping and waiting for a person.

### Agent-executable — do these yourself, don't wait to be asked

**CI, on every push to `main` (confirm green, don't assume):**

- **Lint** — `npm run lint`
- **Build** — `npm run test-compile`
- **Test (Host)** — Mocha extension-host tests (`xvfb-run npm run just-test`)
- **Test (Unit)** — Vitest (`npm run test:unit`)
- **Package contents check** — `npm run package:check` (catches dev-only file leakage into the VSIX and package-size regressions; see `scripts/check-vsix-contents.js`)

Check the latest **push-triggered** run of `ci.yml` on `main` — not just the last PR's run, since PR runs can be stale relative to what actually merged. If you want to double-check locally instead of trusting CI, `rm -rf node_modules && npm ci` then run the same commands above (host tests still need a real VS Code/Electron runtime, so they can only be verified via CI in most dev environments).

**Then, in order:**

1. **Check for blocking open work** — any in-flight PRs or issues the release should wait for (e.g., an in-progress dependency-modernization chain). Don't release out from under unfinished work.
2. **Finalize `docs/changelog/README.md`** — rename the `## Unreleased` section to `## X.Y.Z (YYYY-MM-DD)`, add a fresh empty `## Unreleased` heading above it for whatever comes next. Every entry should link the issue/PR it closes, and separate entries by category (Features / Fixes / Docs / Infrastructure). Pick the version bump per semver: a new user-facing feature → minor; fixes/infra only → patch; a removed/renamed command, setting, or default → major. **Use the actual date the tag will be pushed, not the date drafting started** — if the release PR sits open for a day or two (e.g., waiting on other work to land first), update the date before merging, not after.
3. **Bump `package.json`'s `version`** — use `npm version X.Y.Z --no-git-tag-version` (updates `package.json` and `package-lock.json` together, no git tag yet). Version lives solely in `package.json` — there's no other file to sync at this step.
4. **Open a PR with the changelog + version bump, verify CI is green, merge it to `main`.**
5. **Before tagging, do one final full read-through of everything landing in this release** — the entire changelog section top to bottom, plus any README/docs changes — checked against what actually merged this cycle. Do this as a single comprehensive pass, not by fixing issues one at a time only as the maintainer happens to spot them; if a mid-cycle PR added an entry after the changelog was first drafted (e.g., a fix that landed while the release PR was still open), confirm it got folded in before tagging, not left as a dangling `## Unreleased` entry.
6. **Create and push the git tag** for the release (e.g. `vX.Y.Z`) once the merge commit is on `main` and green.
7. **Create the GitHub Release** from that tag, using the changelog section as the release notes.
8. ~~Update `README.md`'s "Latest published version" line~~ — no longer needed. The README uses a live shields.io badge (`https://img.shields.io/visual-studio-marketplace/v/johnpapa.vscode-peacock`) that reads the current version directly from the Marketplace API, so it never goes stale and there's nothing to sync after publishing. **General principle: never hardcode a value in README/docs that changes every release** (version numbers, dates, counts) — prefer a live badge or a generic phrasing that stays true across releases.
9. **Draft the release's social media announcements** (LinkedIn, X/Twitter, etc.) if the release warrants one — pull the headline changes from the finalized changelog. Drafting is agent-executable; posting is not (see below). Follow these conventions when drafting:
   - **Always include a 🦚 emoji** — this is Peacock's repo, it should feel like Peacock.
   - **Always give a copy-paste-ready version**, not just the text shown in chat. Save each platform's draft to its own file (e.g. `/tmp/peacock-x-paste-safe.txt`, `/tmp/peacock-linkedin-paste-safe.txt`) so the maintainer can copy straight from a file instead of the chat UI, which can mangle emoji/formatting on copy.
   - **LinkedIn strips Markdown on paste** (`**bold**`, backticks, etc. render as literal stray characters) — write LinkedIn drafts as plain text, using emoji and line breaks for emphasis instead of Markdown syntax.
   - **Truly-empty blank lines between paragraphs often get collapsed on paste** (observed on LinkedIn). Insert an invisible zero-width space (U+200B) on each blank line so it survives as a real line and paragraph breaks are preserved.
   - **Verify every factual/attribution claim against the actual source before drafting** — don't imply the maintainer personally discovered, reported, or fixed an upstream bug unless that's literally true. Check the linked upstream issue/PR yourself (e.g. via `gh issue view`/`gh pr view` on the external repo) rather than inferring credit from the changelog wording alone; changelog phrasing written by an agent earlier in the release can itself be imprecise about who did what.
   - **If the announcement includes before/after or comparison screenshots, verify both images represent the exact same UI state before publishing anything.** Diff them at the pixel level (e.g. Python/PIL `getpixel`/crop comparison) rather than eyeballing — incidental UI state at capture time (mouse hovering over a sash/divider, a focused vs. unfocused window, an open dropdown) can render extra colors/borders that have nothing to do with the feature being demonstrated, and look like a real bug if left in. If found, patch the incidental artifact out (or recapture) so the comparison isolates only the actual difference being illustrated.

### Human-only — steps that need a person

- **Run `vsce publish`** (or manually upload the packaged VSIX) to push the new version to the Marketplace. This needs the publisher's Marketplace personal access token, which only the maintainer holds — an agent shouldn't have it or use it autonomously. It's also one of two genuinely irreversible, externally-visible actions in the whole process — everything before it can be redone or reverted; this can't.
- **Review and post the social media announcements.** An agent can draft them, but publishing public content under the maintainer's voice/identity is the maintainer's call — review for accuracy (don't let a drafted "hook" overstate or misrepresent a feature) and post it themselves.

## Adding a New Command

1. Define the command in `package.json` under `contributes.commands` with a `command` ID and `title` (category: "Peacock")
2. Add menu visibility rules in `contributes.menus.commandPalette` if needed
3. Add the command ID to the `Commands` enum in `src/models/enums.ts`
4. Implement the command handler in `src/commands.ts`
5. Register the command in `src/extension.ts` using `vscode.commands.registerCommand`
6. Add a unit test in `src/test/`
7. Update docs in `docs/guide/` if the command is user-facing
8. Update `docs/changelog/README.md`

## Adding a New Setting

### StandardSettings (scalar values, not color tokens)

1. Define the setting in `package.json` under `contributes.configuration.properties` with type, default, and description
2. Add the setting name to `StandardSettings` enum in `src/models/enums.ts`
3. Add a reader in `src/configuration/read-configuration.ts`
4. Add unit tests in `src/test/`
5. Update docs in `docs/guide/`
6. Update `docs/changelog/README.md`

### AffectedSettings (toggle whether a VS Code color token is colored)

1. Define the setting in `package.json` under `contributes.configuration.properties` (boolean, default false)
2. Add to `AffectedSettings` enum in `src/models/enums.ts` — and add the VS Code color token to `ColorSettings` enum
3. Add the property to `IPeacockAffectedElementSettings` in `src/models/interfaces.ts`
4. Wire into `getAffectedElements()` in `src/configuration/read-configuration.ts`
5. Wire into the appropriate `collect*Settings()` function in `src/configuration/read-configuration.ts`
6. Wire into `updateAffectedElements()` in `src/configuration/update-configuration.ts`
7. Add unit tests in `src/test/suite/affected-elements.test.ts`
8. Update docs in `docs/guide/`
9. Update `docs/changelog/README.md`

## Webview Security Checklist

Peacock has one webview today (`color-picker-html.ts`/`color-picker-webview.ts`, the custom color picker panel). Any PR that adds or touches a webview must be checked against this list -- a real injection bug shipped in an earlier revision of that panel (fixed, but only after a maintainer-requested review caught it) because none of this was checked at the time:

- **Never interpolate a caller-supplied string into HTML using only `isValidColorInput()`/tinycolor-style "is this parseable" validation as the guard.** tinycolor's `rgb()`/`hsl()` parsing is not anchored to the whole string, so a value like `rgb(1,2,3)" autofocus onfocus="..."` passes validity checks while still breaking out of an HTML attribute. Before interpolating any value into a webview's HTML, normalize it to a known-safe shape first (e.g. `getColorHex()`'s tinycolor-formatted `#rrggbb[aa]`, which can only ever contain `#` and hex digits) -- don't just gate on "is this a valid color," gate on "is this exactly the narrow shape I'm about to embed."
- **Don't leave a webview's CSP on `script-src 'unsafe-inline'`** if you can avoid it. Generate a per-render nonce (plain `Math.random()`-based, like `getNonce()` in `color-picker-html.ts` -- no need for Node's `crypto` module, which the `extension-web.js` web/webworker bundle can't resolve) and use `script-src 'nonce-${nonce}'` plus a matching `<script nonce="${nonce}">`, so a future change that accidentally reintroduces an interpolated value can't also inject a second inline script.
- **A Quick Pick's `onDidSelectItem` callback fires on every highlighted item, not just the final selection.** If a Quick Pick is extended with a non-data sentinel item (e.g. this repo's `customColorPickerLabel`, appended to the favorites list to open a picker panel), the highlight-preview callback must explicitly skip that sentinel -- parsing it as real data and feeding the result to `applyColor()` will treat it as invalid input, which unapplies every current color the instant the item is merely arrowed over, before it's ever selected.
- **A webview panel can be closed three ways: Cancel, Apply, or the tab's own close button (`onDidDispose`).** All three must revert/resolve through the _same_ code path (ideally the same serialized message queue used for regular messages -- see `serializeMessageHandler()` in `color-picker-html.ts`), not a separate direct call. Routing `onDidDispose`'s revert around the queue lets it race a still-in-flight message (e.g. a rapid color-well drag) and either leave a stale value applied or run before/after the wrong thing.
- **Guard every `panel.webview.postMessage()` call with a disposed check**, not just the first one. A message can still be mid-flight (queued) when the panel closes; posting to an already-disposed webview throws, and since `postMessage` isn't usually awaited, that surfaces as an unhandled promise rejection rather than a caught error. If you touch `src/test/suite/lib/fake-webview-panel.ts`, keep its `postMessage` throwing after dispose (mirroring the real API) -- a fake that always succeeds can hide exactly this bug.
- **`retainContextWhenHidden` should be `true` for any webview with meaningful in-panel state** (typed input, a live preview, `acquireVsCodeApi()` state). The default discards and later rebuilds the webview's DOM/script when the panel is hidden and re-shown (e.g. the user switches tabs and comes back), silently resetting anything not persisted -- for a small panel, the memory cost of keeping it alive is worth avoiding that.

## Common Pitfalls

- **Don't forget both output targets** — the extension ships as both Node and Browser bundles. Test both if changing core logic.
- **Color manipulation goes through tinycolor2** — don't use raw hex string manipulation; use the color-library helpers.
- **Husky pre-commit runs Prettier** — your code will be auto-formatted on commit. Don't fight it.
- **Tests need a workspace** — Mocha tests use `testworkspace/` as the VS Code workspace. Make sure it exists.
- **Version is in package.json only** — unlike multi-file version bumps in some projects, the extension version lives solely in `package.json`.
- **The root `CHANGELOG.md` is a pointer file** — the real changelog lives at `docs/changelog/README.md`. Always edit the docs version, not the root file.
- **Touching or adding a webview?** Run it against the Webview Security Checklist above — a real injection bug shipped in this repo's one webview before that checklist existed.
