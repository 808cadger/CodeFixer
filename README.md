# CodeFixer

Minimal PWA that helps beginner and intermediate Python/JavaScript developers catch and fix common coding mistakes before running code.

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
- Missing quotes.
- Missing Python colons.
- Assignment inside `if`/`while` conditions.
- Suspicious JavaScript `<= array.length` loops.
- Unusual Python indentation.

## AI use

No AI is required for the MVP. The project is designed so an optional backend or AI explainer can be added later without changing the local demo mode.

## Safety rule

CodeFixer preserves user code unless a fix is clearly safe. If the analyzer is unsure, it shows a warning instead of editing.
