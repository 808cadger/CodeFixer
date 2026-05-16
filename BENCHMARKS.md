# CodeFixer Benchmark Notes

Date: 2026-05-16

## Positioning

CodeFixer is not trying to replace mature linters. It is a beginner-focused pre-run assistant that explains common mistakes in plain English and only applies conservative fixes.

## Competitor Baseline

| Tool | Strength | CodeFixer MVP angle |
| --- | --- | --- |
| ESLint | Mature JavaScript static analysis that finds and fixes code problems. | Simpler beginner explanations, no setup, browser-only demo mode. |
| Ruff | Fast Python linter/formatter with a unified toolchain. | Lightweight teaching layer for obvious syntax and logic mistakes before installing tooling. |
| GitHub CodeQL | Repository-scale code scanning surfaced through GitHub alerts. | Instant local feedback for pasted beginner code, with one-click safe fixes. |

Sources:

- ESLint: https://eslint.org/
- Ruff formatter docs: https://docs.astral.sh/ruff/formatter/
- GitHub CodeQL docs: https://docs.github.com/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning-with-codeql

## Local Engine Benchmark

Run:

```bash
node benchmarks/run-benchmark.js
```

Current result on the development machine:

```json
{
  "runs": 5000,
  "diagnostics": 5000,
  "total_ms": 127.46,
  "avg_ms_per_analysis": 0.0255
}
```

Regenerate the numbers after analyzer changes. The important target is interactive feel: analysis should remain effectively instant for beginner-sized snippets.

## Quality Gates

- `node --check src/analyzer.js`
- `node --check src/app.js`
- `node --check sw.js`
- `node tests/analyzer.test.js`
- `node benchmarks/run-benchmark.js`

## Differentiators To Preserve

- No backend required for the MVP.
- No AI dependency in the default path.
- Conservative fixes only.
- Warnings are labeled as low-confidence when the analyzer is unsure.
- Clear separation between rules, diagnostics, fixes, UI rendering, and benchmark tests.
