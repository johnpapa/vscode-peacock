# Training Repos

This skill's heuristics — especially course detection, notebook handling, and multi-language support — were trained and validated against these repos. Use them for regression testing when making changes to the skill.

## Course/Tutorial repos

- `github/copilot-cli-for-beginners` — Copilot CLI course (markdown + Python)
- `microsoft/ai-agents-for-beginners` — AI agents course (markdown + notebooks + Python/C#)
- `microsoft/generative-ai-for-beginners` — GenAI course (markdown + notebooks + Python/JS/TS)
- `microsoft/mcp-for-beginners` — MCP tutorial (markdown + TS/Python/Java/C#)
- `microsoft/langchainjs-for-beginners` — LangChain.js course (markdown + TypeScript)
- `microsoft/langchain-for-beginners` — LangChain course (markdown + Python)
- `microsoft/langchain4j-for-beginners` — LangChain4j course (markdown + Java)
- `microsoft/ML-For-Beginners` — Machine Learning course (markdown + notebooks + Python)
- `microsoft/Web-Dev-For-Beginners` — Web development course (markdown + JS/HTML/CSS)
- `microsoft/AI-For-Beginners` — AI course (markdown + notebooks + Python)
- `microsoft/Data-Science-For-Beginners` — Data science course (markdown + notebooks + Python)
- `microsoft/IoT-For-Beginners` — IoT course (markdown + hardware samples)
- `microsoft/Generative-AI-for-beginners-dotnet` — GenAI .NET course (markdown + C#)
- `microsoft/generative-ai-for-beginners-java` — GenAI Java course (markdown + Java)
- `microsoft/AZD-for-beginners` — Azure Developer CLI tutorial (markdown + CLI examples)
- `microsoft/edgeai-for-beginners` — Edge AI course (markdown + sample apps)
- `microsoft/xr-development-for-beginners` — XR/Unity course (markdown + Unity/C#)

## Application repos

- `johnpapa/vscode-peacock` — VS Code functional extension (TypeScript, Mocha tests)
- `johnpapa/shopathome` — Multi-framework shopping app (Angular 21, React 19, Svelte 5, Vue 3.5, Fastify 5, Azure Functions v4)
- `johnpapa/angular-styleguide` — Documentation-only style guide (markdown)
- `johnpapa/heroes-angular` — Standard Angular SPA with json-server backend, Cypress, proxy config
- `johnpapa/heroes-vue` — Vue SPA with separate API package, not a monorepo
- `johnpapa/heroes-react` — React SPA (CRA-era) with json-server, proxy, Docker, env files

## npm packages

- `johnpapa/lite-server` — Small CLI package (JS, Mocha/Istanbul tests, bin/ entry point)

## Multi-app collections

- `johnpapa/hello-worlds` — Angular/React/Svelte/Vue demos, independent apps, no workspace
- `johnpapa/http-interceptors` — Same concept in Angular + Svelte, comparison monorepo

## VS Code extension variants

- `johnpapa/vscode-cloak` — Functional extension (TypeScript, webpack, commands + settings)
- `johnpapa/vscode-winteriscoming` — Theme extension (JSON theme files, no runtime code)
- `johnpapa/vscode-angular-snippets` — Snippets extension (JSON snippets, language-scoped, devcontainer)

## Large open-source library monorepos

- `langchain-ai/langchain` — Python multi-package monorepo (`libs/*`), pyproject.toml per package, AGENTS.md + CLAUDE.md
- `langchain-ai/langchainjs` — TypeScript monorepo (pnpm + Turborepo + Changesets), workspace packages under `libs/`
- `langchain4j/langchain4j` — Java Maven aggregator with 30+ modules, JDK-conditional builds, Spotless formatting

## Real-world field tests

- `FritzAndFriends/BlazorWebFormsComponents` — .NET multi-target library (Blazor, C#)
