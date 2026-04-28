# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Peacock, please report it responsibly.

**Do not open a public issue.** Instead, use [GitHub's private vulnerability reporting](https://github.com/johnpapa/vscode-peacock/security/advisories/new) or email [johnpapa@gmail.com](mailto:johnpapa@gmail.com).

## Scope

Peacock is a VS Code extension that modifies workspace color settings. The primary security concerns are:

- Extension code that could access or modify files beyond VS Code color settings
- Dependencies with known vulnerabilities (tinycolor2, vsls)
- Webpack build output integrity

## Supported Versions

Only the latest published version on the VS Code Marketplace receives security updates.
