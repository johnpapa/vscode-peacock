# Detection Tables Reference

Detailed detection heuristics for Step 1 — codebase analysis.

## Manifest detection

| Manifest | Language | What to extract |
|----------|----------|-----------------|
| `package.json` | JavaScript/TypeScript | dependencies, devDependencies, scripts (build, test, lint, typecheck), engines.node |
| `Cargo.toml` | Rust | workspace members, dependencies, build/test profile |
| `go.mod` | Go | module name, Go version |
| `pyproject.toml` or `requirements.txt` | Python | dependencies, build system, scripts, python version |
| `*.csproj` or `*.sln` | C# / .NET | target framework, package references, test SDK |
| `Gemfile` | Ruby | dependencies, ruby version |
| `pom.xml` or `build.gradle` | Java | dependencies, plugins, build tasks |

Also check for:
- **Lockfiles** — `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lockb`, `Cargo.lock`, `go.sum`, `poetry.lock`, `Pipfile.lock`
- **Runtime version files** — `.nvmrc`, `.node-version`, `.python-version`, `.tool-versions`, `.ruby-version`, `rust-toolchain.toml`
- **Monorepo markers** — `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `turbo.json`, Cargo workspace, Go workspace. Also check for **large library monorepos**: Maven aggregator (`pom.xml` with `<modules>`), Python multi-package (`libs/` directory with multiple `pyproject.toml`), or Turborepo + Changesets (`turbo.json` + `.changeset/`).

  *Why?*: Large open-source libraries like LangChain organize code as multi-package monorepos — dozens of independently published packages under one repo. Treating them as a single package misses cross-package dependencies, per-package build commands, and module-specific conventions.
- **Notebooks** — `*.ipynb` files. If found, note the count and locations. Notebooks are common in course repos, data science projects, and tutorials.

## VS Code extension detection

Check for `contributes` in root `package.json` (commands, themes, snippets, views, menus). If present, this is a **VS Code extension**, not a regular app. Also check for `vsce` or `@vscode/vsce` in devDependencies, and `vscode:prepublish` in scripts. Extensions come in three flavors:
- **Functional extensions** — TypeScript code with activation events, commands, webpack/esbuild bundling, tests
- **Theme extensions** — JSON theme files, no runtime code, published via `vsce`
- **Snippet extensions** — JSON snippet definitions, language-scoped, content-driven not logic-driven

*Why?*: VS Code extensions look like npm packages but have completely different conventions. The `package.json` IS the product spec — commands, menus, settings, keybindings. Treating them like a web app misses what matters.

## Multi-app collection detection

Multiple independent apps in subdirectories (e.g., `angular/`, `react/`, `svelte/`), each with its own `package.json`, but **no workspace config** tying them together. This is different from a monorepo — there's no shared build or dependency graph. Each app builds and runs independently.

*Why?*: Not every repo with multiple folders is a monorepo. Some are "collections" — the same concept implemented in different frameworks for comparison or learning. Don't invent workspace tooling where none exists.

## Demo app pattern detection

A frontend app + mock backend (`json-server`, `db.json`) + proxy config (`proxy.conf.json`, `vite.config.ts` proxy). Common in demo/tutorial repos. If detected, document the mock API setup in AGENTS.md so agents know to start both frontend and backend.

## Course/tutorial repo detection

*Why?*: Course repos are fundamentally different from application repos. The "product" is markdown lessons and code samples — not a running application. Generating CI, setup steps, or a build pipeline for a course repo misses the point. Detecting this early shapes every later step.

Check for **multiple signals** — no single check is definitive:

1. **Numbered folders** — glob for top-level directories matching `NN-*` (e.g., `00-intro`, `01-setup`, `05-advanced`), `N-topic` (e.g., `1-Introduction`, `6-Data-Science-In-Wild`), `Chapter N`, `Module N`, or `Unit N`. 3+ matches is a strong signal.
2. **README content** — scan the root README for course/tutorial language: "lesson", "chapter", "module", "unit", "what you'll learn", "prerequisites", "course structure", "hands-on", "assignment", "quiz", "curriculum", "week". Multiple matches strengthen the signal.
3. **Repo description/topics** — check the GitHub description and topics (from Step 0b) for terms like "beginners", "course", "tutorial", "workshop", "learn", "curriculum", "lessons".
4. **Lesson structure** — check if numbered folders each contain a `README.md` (lesson content) and optionally `assignment.md`, `solution/`, `code/`, `quiz/`, or `notebook/` subdirectories.
5. **No primary application** — the repo has no root-level `package.json`, `Cargo.toml`, `go.mod`, or other manifest that would indicate a buildable application (individual lesson folders may have their own manifests for code samples).
6. **Devcontainer** — check for `.devcontainer/` directory. Common in course repos to provide a ready-to-go development environment. If present, credit it as a form of environment setup (similar to copilot-setup-steps.yml).

**A repo is a course if 3+ of these signals are present.** Record it in the findings table as `Repo type: course` with evidence.

### Course repo adaptations

When a repo is a course, the following steps adapt:
- **Step 4** (copilot-setup-steps.yml) — skip if a `.devcontainer/` exists (it serves the same purpose for courses). If no devcontainer and no build step, skip entirely.
- **Step 5** (CI workflow) — skip build/test CI. Suggest markdown validation (link checking, spell check) instead if not already present.
- **Step 3** (copilot-instructions.md) — include lesson structure conventions: expected folder contents, naming patterns, how to add a new lesson. If lessons have quizzes or assignments, document the expected structure (e.g., each lesson needs `README.md` + `assignment.md` + `solution/`).
- **Step 2** (AGENTS.md) — "Adding a New Lesson" section instead of "Adding a New Feature". Include the lesson template (what files/folders each lesson should contain).
- **Report** — mark skipped assets as "N/A — course repo" instead of "Missing". Credit `.devcontainer/` in the "Nailed It" section if present.

## Findings table template

Before proceeding from Step 1, produce a structured summary combining GitHub context (Step 0) and codebase analysis (Step 1). Include file-path evidence for each finding:

| Category | Finding | Evidence (source) |
|----------|---------|-------------------|
| Repo | e.g., johnpapa/ai-ready | `git remote -v` |
| Description | e.g., "Copilot CLI skill..." | GitHub API / repo metadata |
| Topics | e.g., copilot, skills, ai-ready | GitHub API |
| Language | e.g., TypeScript (65%), Rust (30%) | GitHub API language breakdown |
| Multi-language | yes/no — if no single language exceeds 50%, flag as multi-language | GitHub API |
| Repo type | app / course / docs-only / VS Code extension / npm package / collection | Step 1a-ii detection |
| VS Code extension type | functional / theme / snippets (if applicable) | `package.json` contributes field |
| Notebooks | e.g., 12 `.ipynb` files in `lessons/` | glob for `*.ipynb` |
| Mock backend | e.g., json-server on port 3000 | `db.json`, proxy config |
| Framework | e.g., React, Phaser | `package.json` dependencies |
| Test runner | e.g., Vitest | `package.json` devDependencies |
| Test command | e.g., `npm test` | `package.json` scripts.test |
| Build command | e.g., `npm run build` | `package.json` scripts.build |
| Runtime version | e.g., Node 22 | `.nvmrc` or `package.json` engines |
| Package manager | e.g., pnpm | `pnpm-lock.yaml` exists |
| Contributors | e.g., 3 contributors | GitHub API |
| Team size | e.g., solo / small / large | Contributor count |
| PR CI exists | yes/no | `.github/workflows/` or GitHub Actions API |
| Community health | e.g., 71% | GitHub API community/profile |
| PR review patterns | e.g., "maintainer often asks for tests" | Mined from recent PR review comments |
| Release cadence | e.g., monthly, tagged releases | GitHub Releases API |
| AGENTS.md | exists / missing | repo root |
| copilot-instructions.md | exists / missing | `.github/` |
| Changelog | exists / pointer / missing | `CHANGELOG.md`, Releases |
| Changelog freshness | current / stale | latest entry vs latest git tag |
| Docs exist | yes / no | `docs/`, config file |
| Docs framework | Docsify / Docusaurus / etc. | config file path |
| Docs deploy pipeline | yes / no | workflow file path |
| README links to docs | yes / no | README.md link |
| Default branch | e.g., `main`, `dev`, `master` | `gh repo view --json defaultBranchRef` |
| Push access | yes / no | `gh api repos/{owner}/{repo} --jq '.permissions.push'` |
| Custom agents | e.g., 2 agents: migration guide, orchestrator | `.github/agents/` |
| Custom skills | e.g., 6 skills: bunit-test, component-dev, ... | `.github/skills/` |
| Devcontainer | yes/no | `.devcontainer/` |
| Monorepo | yes/no | workspace config file |
| Areas | e.g., frontend (React), backend (Express), shared (TypeScript) | workspace config paths |

## Drift detection for existing assets

For existing AI-ready assets, read their current contents and compare against your analysis. Flag drift in any of these dimensions:

| Asset | What to compare |
|-------|----------------|
| `AGENTS.md` | Repo structure still accurate? Build/test commands still correct? Tech stack changed? |
| `copilot-instructions.md` | New conventions from recent PR reviews? Maintenance matrix still covers current file relationships? |
| `copilot-setup-steps.yml` | Runtime versions match? Install/build commands still correct? New dependencies? |
| CI workflow | Build/test/lint commands still match the project? New tools added? |
| Issue templates | Still relevant to the project type? |
| README Contributing | Links still valid? Commands still correct? |

For each existing asset where you find drift, classify it as **"Could Be Better"** in the report with a specific suggestion (e.g., "AGENTS.md lists Node 18 but `.nvmrc` now says Node 22"). Do not silently skip existing files — always evaluate them.

## Monorepo area detection

If a workspace config was found in Step 1a, read it to find package/project paths (e.g., `packages/*`, `apps/*`, `libs/*`). List each area — name, path glob, and primary stack — and note which areas have conventions that differ from root.

**For large library monorepos** (Maven aggregator, Python `libs/`, pnpm workspace with many packages):
- List each published package/module separately with its purpose (e.g., `langchain4j-core`, `langchain4j-open-ai`, `langchain4j-ollama`)
- Note the module taxonomy if one exists (core vs providers vs integrations vs experimental)
- Identify **cross-package dependencies** — which packages depend on which. Changes to core packages ripple to all dependents.
- Detect **release tooling** — Changesets (`.changeset/`), semantic-release, Maven release plugin, or manual versioning. Document in the maintenance matrix.
- Detect **conditional modules** — JDK-specific modules (`jdk21`), platform-specific builds, or optional integrations that only build under certain conditions.

*Why?*: A fix in `langchain4j-core` affects 30+ downstream modules. Without mapping cross-package dependencies, agents make changes to one package and miss the ripple effects.
