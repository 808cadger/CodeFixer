# CodeFixer

[![Release](https://img.shields.io/github/v/release/808cadger/CodeFixer?include_prereleases&label=release)](https://github.com/808cadger/CodeFixer/releases)
[![Last commit](https://img.shields.io/github/last-commit/808cadger/CodeFixer)](https://github.com/808cadger/CodeFixer/commits)
[![License](https://img.shields.io/github/license/808cadger/CodeFixer)](https://github.com/808cadger/CodeFixer/blob/HEAD/LICENSE)
![Platforms](https://img.shields.io/badge/platform-Web%2FPWA-0f766e)
![Mode](https://img.shields.io/badge/mode-local--first-17211f)

Minimal PWA that helps beginner and intermediate Python/JavaScript developers catch and fix common coding mistakes before running code.

## Project Snapshot

| Area | Details |
|------|---------|
| Primary use case | Catch syntax mistakes, explain them simply, suggest safe fixes, and run a demo test flow before code is executed. |
| Platforms | Web/PWA |
| Core stack | HTML, CSS, JavaScript, Service Worker |
| Review first | `index.html`, `src/analyzer.js`, `src/app.js`, `ARCHITECTURE.md`, `BENCHMARKS.md` |

## Download Links

| Platform | Link |
|----------|------|
| Web / PWA | [Open from GitHub Pages](https://808cadger.github.io/CodeFixer/) and choose **Install** or **Add to Home Screen** |
| iOS / iPhone | [Open the PWA in Safari](https://808cadger.github.io/CodeFixer/) and choose **Share -> Add to Home Screen** |
| Android | [Open the PWA in Chrome](https://808cadger.github.io/CodeFixer/) and choose **Install app** or **Add to Home screen** |
| Source | [Download the GitHub source ZIP](https://github.com/808cadger/CodeFixer/archive/refs/heads/main.zip) |
| Repository | [View on GitHub](https://github.com/808cadger/CodeFixer) |
| Releases | [Download release artifacts](https://github.com/808cadger/CodeFixer/releases) |

## Why This Repo Is Worth Reviewing

- Static analyzer architecture is split into rules, diagnostics, safe fixes, UI rendering, tests, and benchmarks.
- Safe one-click fixes are enabled only when the edit is deterministic and low-risk.
- The default app is local-first and does not require AI, accounts, telemetry, or a backend.
- Benchmark notes compare the MVP against ESLint, Ruff, and GitHub CodeQL positioning.

<!-- INSTALL-START -->
## Install and run

These instructions install and run `CodeFixer` from a fresh clone.

### Clone
```bash
git clone https://github.com/808cadger/CodeFixer.git
cd CodeFixer
```

### Web app
```bash
python3 -m http.server 8080
```

Open:

```text
http://127.0.0.1:8080
```

### Quality checks
```bash
node --check src/analyzer.js
node --check src/app.js
node --check sw.js
node tests/analyzer.test.js
node benchmarks/run-benchmark.js
```

### AI/API setup
- No API key is required.
- AI explainers can be added later as an optional backend path.
- The default MVP runs fully in the browser.

### License
- Apache License 2.0. See [`LICENSE`](./LICENSE).
<!-- INSTALL-END -->

## MVP features

- Single-page code editor.
- Python and JavaScript selector.
- Analyze button.
- Syntax issue panel.
- Plain-English explanation panel.
- Safe one-click fix panel.
- Simulated test runner panel.
- Low-confidence logic warnings.
- Local demo mode with sample broken code.
- Installable PWA with service worker cache.

## Run locally

No build step is required.

```bash
python3 -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080
```

## Demo flow

1. Open the app.
2. Leave the sample Python code loaded or switch to JavaScript.
3. Click `Analyze`.
4. Review the syntax issue and explanation.
5. Click `Apply Fix` when available.
6. Re-run analysis until the simulated test runner can complete.

## Current detection

CodeFixer uses simple static checks first:

- Missing closing brackets.
- Mismatched brackets.
- Missing quotes.
- Missing Python colons.
- Assignment inside `if`/`while` conditions.
- Suspicious JavaScript `<= array.length` loops.
- Unusual Python indentation.
- JavaScript loose equality warnings.

## Architecture and benchmarks

- Architecture notes: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Benchmark notes: [`BENCHMARKS.md`](BENCHMARKS.md)

Quality gates:

```bash
node --check src/analyzer.js
node --check src/app.js
node --check sw.js
node tests/analyzer.test.js
node benchmarks/run-benchmark.js
```

## AI use

No AI is required for the MVP. The project is designed so an optional backend or AI explainer can be added later without changing the local demo mode.

## Safety rule

CodeFixer preserves user code unless a fix is clearly safe. If the analyzer is unsure, it shows a warning instead of editing.
