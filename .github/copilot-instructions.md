# Copilot Instructions — Peacock

## Project Type

VS Code extension written in TypeScript, bundled with Webpack, published to the VS Code Marketplace.

## TypeScript Conventions

- Strict mode enabled (`tsconfig.json`)
- Use explicit types for function parameters and return values
- Use `import type` for type-only imports
- All source code lives in `src/`

## VS Code Extension Patterns

- Use `vscode.commands.registerCommand()` for command registration
- Use `vscode.workspace.getConfiguration('peacock')` for reading settings
- Use `vscode.window.showQuickPick()` and `vscode.window.showInputBox()` for user input
- All commands must be declared in `package.json` under `contributes.commands`
- All settings must be declared in `package.json` under `contributes.configuration.properties`

## Color Handling

- All color manipulation uses `tinycolor2` via the helpers in `src/color-library.ts`
- Never manipulate hex strings directly — always go through the color library
- Colors are stored as hex strings (e.g., `#ff0000`) in VS Code configuration

## Test Conventions

- **Unit tests:** Mocha + Sinon, located in `src/test/`
- **E2E tests:** Playwright, located in `e2e/` (primarily for docs screenshots)
- Run unit tests: `npm test`
- Run e2e tests: `npm run test:e2e`
- Tests use `testworkspace/` as the VS Code workspace
- **Every bug fix must include a regression test** that fails without the fix and passes with it
- **Every new feature must include unit tests** covering the happy path and relevant edge cases

## Code Style

- ESLint + Prettier (config in `.eslintrc` and `.prettierrc.js`)
- Husky pre-commit hook runs Prettier automatically
- Lint: `npm run lint`
- Fix: `npm run lint-fix`

## Maintenance Matrix

| When this changes... | Also update... |
|---|---|
| New command added | `package.json` (contributes.commands + menus), `src/models/enums.ts` (Commands enum), `src/commands.ts`, `src/extension.ts` (register), `src/test/`, `docs/guide/`, `docs/changelog/README.md` |
| New setting added | `package.json` (contributes.configuration), `src/models/enums.ts` (StandardSettings or AffectedSettings enum), `src/configuration/read-configuration.ts`, `src/test/`, `docs/guide/`, `docs/changelog/README.md` |
| Bug fix | `src/test/` (add a regression test that fails without the fix), `docs/changelog/README.md` |
| Color application logic | `src/apply-color.ts`, `src/color-library.ts`, related unit tests |
| Live Share integration | `src/live-share/`, `src/live-share/liveshare-commands.ts`, `package.json` (vsls dependency), related tests, run `npm run test-all` |
| Remote features | `src/remote/`, related tests |
| Docs content | `docs/` (update pages), `docs/_sidebar.md` (if new page), `e2e/` (if screenshots change) |
| Dependencies updated | `package.json`, `package-lock.json`, verify webpack build, run full test suite |
| Version bump | `package.json` (version field only), `docs/changelog/README.md` |
