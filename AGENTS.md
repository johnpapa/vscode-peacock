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

Before publishing a new version, verify all of the following — don't skip steps even if the change feels small:

1. **CI is green on `main`** — check the latest push-triggered run of `ci.yml`, not just the last PR's run.
2. **Fresh local verification** — `rm -rf node_modules && npm ci`, then `npm run lint`, `npm run test-compile`, `npm run test:unit`, and `npm run package:check` all pass. (Host tests can only be verified via CI in most dev environments — a sandbox without a real VS Code/Electron runtime can't launch the extension host.)
3. **No open PRs or issues that should block the release** — check for anything still in flight that the release should wait for (e.g., an in-progress dependency-modernization chain).
4. **`docs/changelog/README.md` is finalized** — rename the `## Unreleased` section to `## X.Y.Z (YYYY-MM-DD)`, add a fresh empty `## Unreleased` heading above it for whatever comes next. Every entry should link the issue/PR it closes. Pick the version bump per semver: a new user-facing feature → minor; fixes/infra only → patch; a removed/renamed command, setting, or default → major.
5. **`package.json`'s `version` is bumped** — use `npm version X.Y.Z --no-git-tag-version` (updates `package.json` and `package-lock.json` together, no git tag). Version lives solely in `package.json` — there's no other file to sync.
6. **`README.md`'s "Latest published version" line is left alone until the release is actually live** — it names a real Marketplace link, so updating it early would claim a version is published before it is. Update it (and create the git tag / GitHub Release / `vsce publish`) only as the last step, after the version-bump PR is merged.
7. **VSIX packaging sanity** — `npm run package:check` catches dev-only file leakage and size regressions automatically (added after `.claude/`, `.husky/`, and stray config files were found shipping in the package unnoticed — see the 4.4.0 changelog entry).

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

## Common Pitfalls

- **Don't forget both output targets** — the extension ships as both Node and Browser bundles. Test both if changing core logic.
- **Color manipulation goes through tinycolor2** — don't use raw hex string manipulation; use the color-library helpers.
- **Husky pre-commit runs Prettier** — your code will be auto-formatted on commit. Don't fight it.
- **Tests need a workspace** — Mocha tests use `testworkspace/` as the VS Code workspace. Make sure it exists.
- **Version is in package.json only** — unlike multi-file version bumps in some projects, the extension version lives solely in `package.json`.
- **The root `CHANGELOG.md` is a pointer file** — the real changelog lives at `docs/changelog/README.md`. Always edit the docs version, not the root file.
