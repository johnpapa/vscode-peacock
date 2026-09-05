# GitHub Discovery Reference

Detailed API calls and techniques for Step 0 — GitHub-native context discovery.

## 0b. Fetch repo metadata from GitHub

Use the GitHub MCP tools (if available) or `gh` CLI to pull rich context the user should never have to explain:

| What to fetch | Tool / Command | What you learn |
|---------------|---------------|----------------|
| Repo description, topics, visibility, default branch | `github-mcp-server-get_file_contents` on `/` or `gh repo view --json description,topics,isPrivate,primaryLanguage,defaultBranchRef --jq '.' | cat` | What this project is about, how it's categorized, default branch name |
| Language breakdown | `gh api repos/{owner}/{repo}/languages | cat` (bash) | Accurate language percentages (better than guessing from files) |
| Community health | `gh api repos/{owner}/{repo}/community/profile | cat` (bash) | Which community files exist (CONTRIBUTING, CODE_OF_CONDUCT, license, issue templates) — GitHub already knows this |
| Contributors | `gh api repos/{owner}/{repo}/contributors --jq '.[].login' | cat` (bash) | Team size, contribution patterns |
| Open issues | `github-mcp-server-list_issues` or `gh issue list | cat` | Active problems, what the project cares about |
| Recent merged PRs | `gh pr list --state merged --limit 10 --json title,body,files | cat` (bash) | Contribution patterns — what files get touched together, what a typical PR looks like |
| PR review comments | `github-mcp-server-pull_request_read` on recent PRs | **Repeated review feedback = conventions that should be in copilot-instructions.md** |
| Releases | `gh release list --limit 5 | cat` (bash) | Release cadence, versioning scheme |
| GitHub Actions workflows | `github-mcp-server-actions_list` or read `.github/workflows/` | CI/CD setup, what runs on PRs |
| Branch protection | `github-mcp-server-list_branches` | Default branch, protection rules |
| Push permissions | `gh api repos/{owner}/{repo} --jq '.permissions.push' | cat` (bash) | Whether the user can push directly or needs to fork |

## 0c. PR review mining details

This is the **highest-value** GitHub-native insight. Look at the 5-10 most recent merged PRs.

*Why?*: If a maintainer leaves the same review comment on 5 different PRs, that's a convention waiting to be documented. Mining PR reviews turns reviewer fatigue into automated guidance.

1. Use `github-mcp-server-list_pull_requests` (state: closed, sort: updated) to find recent merged PRs
2. For each, use `github-mcp-server-pull_request_read` (method: get_review_comments) to read review threads
3. Look for **repeated patterns** — the same feedback given across multiple PRs becomes a convention:
   - "Please add tests for this" → add to test conventions
   - "Use X pattern instead of Y" → add to coding conventions
   - "Update the docs when you change this" → add to maintenance matrix
   - "Don't forget to update the changelog" → add to maintenance matrix

**If few or no review comments are found** (e.g., PRs are self-merged or auto-merged), expand the search to up to 20 merged PRs. If there are still no review patterns, note this in the findings: _"No PR review patterns found — consider adding conventions as the team grows."_ Never silently skip this section.

These mined conventions go directly into `copilot-instructions.md` — turning repeated human review feedback into automated AI guidance.

## 0d. Community health gap mapping

GitHub's community health API tells you exactly what's missing. Map it to the assets this skill generates:

| GitHub says missing | Skill generates |
|-------------------|-----------------|
| No issue templates | `.github/ISSUE_TEMPLATE/` (Step 6) |
| No pull request template | `.github/PULL_REQUEST_TEMPLATE.md` (Step 6) |
| No CONTRIBUTING guide | README Contributing section (Step 7) |
| No CODE_OF_CONDUCT | Can suggest adding one |
| No license | Flag in the report |
| No README | Flag in the report |
