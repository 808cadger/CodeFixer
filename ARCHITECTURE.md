# CodeFixer Architecture

CodeFixer is intentionally static: no build step, no backend, no AI dependency in the default path.

## Layers

| Layer | File | Responsibility |
| --- | --- | --- |
| UI shell | `index.html` | Editor, controls, result panels, PWA entry point |
| Presentation | `src/styles.css` | Responsive layout, diagnostic states, editor styling |
| Analyzer engine | `src/analyzer.js` | Rule registry, diagnostics, safe fixes, simulated tests |
| App controller | `src/app.js` | DOM wiring, rendering, apply-fix flow, service worker registration |
| Offline runtime | `sw.js` | Static asset cache for installable PWA behavior |
| Regression tests | `tests/analyzer.test.js` | Engine contract and safe-fix behavior |
| Benchmark | `benchmarks/run-benchmark.js` | Local speed check for browser-sized snippets |

## Diagnostic Contract

Every rule returns diagnostics with the same shape:

```js
{
  id: "python-missing-colon",
  severity: "error",
  title: "Missing colon",
  line: 1,
  message: "Python needs a colon at the end of this line.",
  confidence: 0.97,
  fix: {
    label: "Add colon",
    safe: true,
    apply(code) {}
  }
}
```

The UI only enables `Apply Fix` when `fix.safe` is true.

## Rule Strategy

Rules are split into:

- Common rules: delimiters and quotes.
- Python rules: colons, assignment in conditions, indentation, range-length loops.
- JavaScript rules: semicolons, assignment in conditions, array-length loops, loose equality.

This keeps the MVP understandable and makes future rules easy to add without touching rendering code.

## Safety Posture

- Preserve user code by default.
- Apply only local, deterministic edits.
- Treat likely logic bugs as warnings, not automatic edits.
- Label diagnostic confidence in the UI.
- Keep AI optional for future versions.

## Extension Points

- Add new rules to `LANGUAGE_RULES`.
- Add backend execution by replacing `runDemoTests` with an async adapter.
- Add AI explanation as an optional post-processor that never mutates code directly.
