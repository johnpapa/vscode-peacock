# Peacock — Agent Guide

## Project Overview

Peacock is a Visual Studio Code extension that subtly changes the color of your workspace. It's ideal when you have multiple VS Code instances, use VS Live Share, or use VS Code's Remote features and want to quickly identify which editor is which.

- **Publisher:** johnpapa
- **Version:** 4.2.3
- **VS Code Marketplace:** [Peacock](https://marketplace.visualstudio.com/items?itemName=johnpapa.vscode-peacock)

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
- **Linting:** ESLint + Prettier (enforced via husky pre-commit hook)
- **Testing:** Mocha (unit tests in `src/test/`) + Playwright (e2e docs tests in `e2e/`)
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
npm test                        # Compile + run Mocha unit tests
npm run just-test               # Run Mocha tests only (skip compile)
npm run test:e2e                # Run Playwright e2e tests (docs screenshots)
npm run test:coverage           # Run tests with Istanbul coverage
npm run test-all                # Run unit + Live Share tests
```

**Test structure:**
- Unit tests live in `src/test/` and use Mocha + Sinon for mocking
- E2e tests live in `e2e/` and use Playwright to capture docs screenshots
- The `testworkspace/` directory is used as a VS Code workspace during tests

## Key Patterns and Conventions

- **Commands** are registered in `extension.ts` and implemented in `commands.ts`
- **Color application** flows through `apply-color.ts` → `color-library.ts` (tinycolor2)
- **Configuration** is read/written via helpers in `src/configuration/`
- **State** is managed through VS Code's `workspaceState` and `globalState` APIs (see `mementos.ts`)
- **Models** define all TypeScript interfaces and enums in `src/models/`
- **Dual output** — the extension compiles to both Node (`extension-node.js`) and Web (`extension-web.js`) via Webpack

## CI/CD

- **Docs + E2E** (`docs.yml`): Triggered on push to `main` and PRs when `docs/`, `e2e/`, `playwright.config.ts`, or the workflow itself changes. Runs Playwright e2e tests, then deploys `docs/` to GitHub Pages.

## Adding a New Command

1. Define the command in `package.json` under `contributes.commands` with a `command` ID and `title` (category: "Peacock")
2. Add menu visibility rules in `contributes.menus.commandPalette` if needed
3. Implement the command handler in `src/commands.ts`
4. Register the command in `src/extension.ts` using `vscode.commands.registerCommand`
5. Add a unit test in `src/test/`
6. Update docs in `docs/guide/` if the command is user-facing
7. Update `CHANGELOG.md`

## Adding a New Setting

1. Define the setting in `package.json` under `contributes.configuration.properties` with type, default, and description
2. Add a reader in `src/configuration/read-configuration.ts`
3. If the setting affects color application, update `src/apply-color.ts`
4. Add unit tests
5. Update docs in `docs/guide/`
6. Update `CHANGELOG.md`

## Common Pitfalls

- **Don't forget both output targets** — the extension ships as both Node and Browser bundles. Test both if changing core logic.
- **Color manipulation goes through tinycolor2** — don't use raw hex string manipulation; use the color-library helpers.
- **Husky pre-commit runs Prettier** — your code will be auto-formatted on commit. Don't fight it.
- **Tests need a workspace** — Mocha tests use `testworkspace/` as the VS Code workspace. Make sure it exists.
- **Version is in package.json only** — unlike multi-file version bumps in some projects, the extension version lives solely in `package.json`.
