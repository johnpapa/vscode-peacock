---
name: ai-ready
license: MIT
metadata:
  version: "1.2.0"
description: "**ANALYSIS SKILL** — Analyze any repository and generate AI-ready configuration — AGENTS.md, copilot-instructions.md, skills, CI workflows, issue templates. WHEN: \"make this repo ai-ready\", \"set up AI config\", \"add copilot instructions\", \"prepare this repo for AI contributions\", \"generate AGENTS.md\". INVOKES: glob, grep, view, create, edit for repo analysis and file generation. FOR SINGLE OPERATIONS: use create/edit directly for individual config files."
---

# AI-Ready Repo Skill

## Persona

Adopt the perspective of an experienced repo maintainer who has managed high-traffic repos and reviewed thousands of PRs. Prioritize what **reduces review burden and contributor friction**. Every file you generate should earn its place — generic boilerplate creates noise.

---

Follow these steps in order to analyze the current repository and generate all missing AI-ready configuration assets.

**First run vs. re-run:** On the first run, most assets will be missing — the skill creates them. On re-runs, it **audits** existing assets against the current codebase, checking for drift, stale content, and new conventions from recent PR reviews. The skill **never overwrites existing files without user approval**.

**Skipping assets:** If the user's prompt mentions skipping specific assets (e.g., "skip CI and issue templates"), respect those exclusions. Still run the full analysis, but skip generation for the excluded assets.

**Report-only mode:** If the user asks for a report without generating files (e.g., "how ai-ready is this repo?", "score this repo"), run the full analysis (Steps 0–1) and display the report (Step 11) — but skip all generation steps (Steps 2–10).

### The 12 tracked assets

Assets are grouped into three categories. Count assets with **Nailed It** status for the score.

**🤖 AI Context** — what AI agents read to understand your repo

| # | Asset | Generated in |
|---|-------|-------------|
| 1 | `AGENTS.md` | Step 2 |
| 2 | `.github/copilot-instructions.md` | Step 3 |
| 3 | Maintenance matrix (in `copilot-instructions.md`) | Step 8 |
| 4 | `.mcp.json` | Step 4b |
| 5 | `.github/workflows/copilot-setup-steps.yml` | Step 4 |

**🔧 Dev Workflow** — what keeps PRs clean and contributors on track

| # | Asset | Generated in |
|---|-------|-------------|
| 6 | CI workflow (`.github/workflows/ci.yml`) | Step 5 |
| 7 | Issue templates (`.github/ISSUE_TEMPLATE/`) | Step 6 |
| 8 | PR template (`.github/PULL_REQUEST_TEMPLATE.md`) | Step 6 |
| 9 | `.github/dependabot.yml` | (checked, not generated) |

**📖 Onboarding** — what helps new contributors get started

| # | Asset | Generated in |
|---|-------|-------------|
| 10 | README Contributing section | Step 7 |
| 11 | Changelog (`CHANGELOG.md`) | Step 9 |
| 12 | Documentation (or explicit "not needed" note) | Step 10 |

**Scoring:** 🟩 Nailed It (counted) · 🟨 Could Be Better (not counted) · ⬜ Missing (not counted)

| Medal | Name | Count | What it means |
|-------|------|-------|---------------|
| 🥉 | **Getting Started** | 1–4 | Basics in place but AI agents are mostly guessing |
| 🥈 | **On Track** | 5–7 | AI agents can help but miss your conventions |
| 🥇 | **Solid** | 8–10 | AI agents follow your patterns and catch most expectations |
| 🏆 | **AI-Ready** | 11–12 | AI agents contribute like your best team members |

---

## Step 0 — Detect GitHub context automatically

**Zero user input required.** The skill is GitHub-native — it discovers everything from GitHub's tools.

### 0a. Identify the repo

Run `git remote -v` to extract the GitHub `owner/repo`. If not GitHub, fall back to local-only analysis.

### 0b–0d. Fetch metadata, mine PR reviews, check community health

Use GitHub MCP tools or `gh` CLI to auto-discover repo metadata, PR review patterns, and community health gaps. See [references/github-discovery.md](references/github-discovery.md) for the full API table, PR mining technique, and health gap mapping.

Key insight: **PR review mining is the highest-value step.** Repeated reviewer feedback becomes conventions in `copilot-instructions.md`.

---

## Step 1 — Analyze the codebase

GitHub context tells you *what* the repo is. Local analysis tells you *how* it works. Use glob, grep, and view combined with GitHub context from Step 0.

### 1a. Detect languages, frameworks, and repo type

Find manifest files and extract details. See [references/detection-tables.md](references/detection-tables.md) for the full manifest table, VS Code extension detection, multi-app collections, demo app patterns, and course/tutorial repo detection.

Key detections: lockfiles, runtime version files, monorepo markers, notebooks, VS Code extensions, multi-app collections, demo apps.

**Course repos** (3+ signals: numbered folders, lesson keywords, no primary app) adapt Steps 2–5. See detection-tables.md for the full signal list and step adaptations.

### 1b. Detect test setup

Identify test runner, find test directories (`tests/`, `__tests__/`, `spec/`, `e2e/`), extract test commands from scripts.

### 1c. Detect CI/CD

Check `.github/workflows/` for PR triggers. Check for other CI systems. Recognize community workflows (stale, welcome) as valid automation — not missing CI.

### 1d. Check existing AI configuration

Check for: `AGENTS.md`, `.github/copilot-instructions.md`, `.github/skills/`, `.github/agents/`, `.github/extensions/`, `.devcontainer/`.

**copilot-setup-steps.yml** — check ALL known locations: `.github/workflows/copilot-setup-steps.yml` (canonical), `.github/copilot-setup-steps.yml` (legacy), and repo root. If found in a non-canonical location, flag it for consolidation into `.github/workflows/` — do not create a duplicate.

If multiple instruction files exist, check for duplicates, contradictions, stale references, and scope clarity. See [references/detection-tables.md](references/detection-tables.md) for drift detection details.

### 1e. Check repo configuration

Check for: `CODEOWNERS`, `dependabot.yml`, issue templates, PR template, `LICENSE`, README Contributing section.

### 1f–1g. Evaluate changelog and documentation

Assess changelog health (exists, format, freshness). Assess docs (exists, framework, navigation, deploy pipeline, README linkage).

### 1h. Scan directory structure

List top-level directories and immediate children (skip `node_modules`, `.git`, `dist`, `build`, `target`, `vendor`).

### 1i. Compile findings

Produce a structured findings table combining GitHub context and codebase analysis with file-path evidence. See [references/detection-tables.md](references/detection-tables.md) for the full findings table template.

List which of the 12 assets are missing. For existing assets, compare against analysis and flag drift as "Could Be Better."

### 1j. Detect monorepo areas

If workspace config found, list areas with name, path glob, and primary stack. For large library monorepos, map cross-package dependencies. See [references/detection-tables.md](references/detection-tables.md) for details.

---

## Step 2 — Generate AGENTS.md

If missing, create `AGENTS.md` at the repo root. If it exists, compare against analysis and flag drift. **Do not overwrite.**

Sections: Project Overview (never hardcode versions — reference manifests), Repository Structure, Tech Stack, Build & Run, Testing, Key Patterns and Conventions, CI/CD, Adding a New [Feature/Module] (trace the full registration chain — enums, index re-exports, config declarations), Screen Size / Responsive Rules (UI projects only), Common Pitfalls.

---

## Step 3 — Generate .github/copilot-instructions.md

If missing, create it. If it exists, compare against analysis — especially new PR review patterns and maintenance matrix drift.

Content: Language-Specific Conventions (separate subsections for multi-language repos), Notebook Conventions (if `.ipynb` detected), Course/Lesson Conventions (if course repo), Framework Patterns, Conventions Mined from PR Reviews, Test Conventions, Code Style Notes (reference linter configs), Asset/Content Rules (if assets detected), **Maintenance Matrix** (trace dependency graphs — the most valuable section).

The maintenance matrix defines what must be updated when different parts of the codebase change. Populate with real file paths. Trace import chains and registration patterns — don't stop at top-level files.

**Monorepo:** Create `.github/instructions/{area-name}.instructions.md` with `applyTo` patterns for areas with different stacks.

---

## Step 4 — Generate copilot-setup-steps.yml

Check ALL locations first: `.github/workflows/copilot-setup-steps.yml`, `.github/copilot-setup-steps.yml`, and repo root. If one exists anywhere, do NOT create another — consolidate into `.github/workflows/` if at a legacy location.

If truly missing from all locations, create `.github/workflows/copilot-setup-steps.yml`. Steps: checkout, set up runtime, install dependencies, install test dependencies, build. Derive from existing CI when possible. For .NET multi-target, install all required SDK versions.

---

## Step 4b — Generate .mcp.json

If missing, generate `.mcp.json` at the repo root based on detected dependencies (databases, APIs, cloud platforms, browser automation, DevOps tools). Use `${VAR}` for secrets. Only include servers the project actually needs — do not speculatively add servers.

*Why?*: Copilot CLI no longer supports `.vscode/mcp.json` — the correct location is `.mcp.json` at the repo root. If `.vscode/mcp.json` exists, flag it as "Could Be Better" and suggest migrating to `.mcp.json`.

---

## Step 5 — Generate CI workflow

If no PR-triggered workflow exists, create `.github/workflows/ci.yml` with: `pull_request` + `push` triggers with `paths-ignore` for docs/config, a build-and-test job matching the project's actual toolchain. Use the **default branch** detected in Step 0b — do not hardcode `main`. Never modify existing workflows.

---

## Step 6 — Generate issue templates and PR template

If missing, create bug report and feature request YAML forms, plus a PR template with description, changes, how-to-test, and checklist (derived from maintenance matrix). Note old-format `.md` templates as "Could Be Better."

---

## Step 7 — Update README Contributing section

If README exists but has no Contributing section: link to `CONTRIBUTING.md` if it exists, otherwise add a Contributing section with fork/branch/PR instructions and test commands. Never rewrite the rest of the README.

---

## Step 8 — Verify maintenance matrix

Verify the matrix in `copilot-instructions.md` covers file cross-references, change cascades, and cross-cutting concerns. Trace actual dependency graphs per language (`.csproj` ProjectReferences, import chains, `mod` declarations, `__init__.py` re-exports).

---

## Step 9 — Evaluate and improve changelog

If missing, create `CHANGELOG.md` with Keep a Changelog format. If a pointer file, verify the target. If stale, flag with dates. Document non-standard locations in AGENTS.md.

---

## Step 10 — Evaluate and improve documentation

If docs exist, add to AGENTS.md and copilot-instructions.md. If missing, assess whether needed by project type. Always document docs status in AGENTS.md.

---

## Step 11 — Display the AI-Readiness Report

Display the report using the format in [references/report-template.md](references/report-template.md). Include the skill version from frontmatter `metadata.version` at the bottom of the report (e.g., `Assisted by ai-ready v1.0.0`). Then:
1. Add AI-Ready badge (see report-template.md § 11a)
2. Offer to create PR (see report-template.md § 11b)

---

## Important Rules

### Do No Harm

This skill's first obligation is to leave the repo in a **better state than it found it — never worse**. Every rule below serves this principle.

- **NEVER create duplicates** — before creating any file, check ALL known locations (canonical, legacy, and root). If a file exists anywhere, do not create another copy. Consolidate instead.
- **NEVER push directly to main/master** — always create a feature branch and open a PR for review. The only exception is if the user explicitly asks to commit to the default branch.
- **NEVER leave an opened PR unattended** — once a PR is open and CI passes, either merge it (small, well-tested, no ambiguous judgment calls) or ask the user which way to go; report the outcome either way. Opening a PR and going quiet is not acceptable. If CI is red or still pending, don't merge — fix it, wait, or report the blocker instead.
- **Whenever a merge happens, use squash and delete the branch afterward** — both local and remote. Don't leave merged branches lying around.
- **NEVER overwrite existing files** — only create missing assets. Flag drift for user review.
- **NEVER delete files without user approval** — if consolidating duplicates or removing stale files, include the deletion in the PR for review.

### General Rules

- **NEVER open a pager** — append `| cat` to every `gh`/`git` command. Use `git --no-pager`.
- **ALWAYS customize to the repo's actual stack** — never produce generic boilerplate.
- **Self-consistency** — every generated file must follow the conventions you establish. Cross-check before finalizing.
- **GitHub-native by default** — auto-discover via MCP tools and `gh` CLI. Fall back to local analysis.
- **Mine PR reviews** — turn repeated review feedback into `copilot-instructions.md` rules.
- **Be specific** — real file paths, real commands, real patterns.
- **Use `create` to write new files** — never `edit` from scratch.
- **Run full analysis first (Steps 0–1)** — never guess.
- **ALWAYS display the report at the end** — never skip or abbreviate.
- **NEVER use markdown headings in user output** — use bold + emojis instead.
- **ALWAYS mention the AI Ready skill in issue/PR communication** — when posting to an issue or PR (body or comment), include explicit attribution such as `Assisted by [ai-ready](https://github.com/johnpapa/ai-ready)`.
- **ALWAYS update docs to repo standards** — when generated guidance or workflows change, update related docs and changelog per the repo's maintenance matrix (for this repo: `README.md`, `docs/how-it-works.md`, `AGENTS.md`, `CHANGELOG.md`).
- **ALWAYS handle PR conflicts proactively** — when creating PRs, sync with the target branch and attempt conflict resolution; if conflicts remain, explicitly ask the user how they want to proceed.

---

## Training Repos

See [references/training-repos.md](references/training-repos.md) for the full list of repos used to validate this skill's heuristics.
