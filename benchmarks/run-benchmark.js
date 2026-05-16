const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "analyzer.js"), "utf8");
const context = { globalThis: {}, performance };
vm.createContext(context);
vm.runInContext(source, context);

const engine = context.globalThis.CodeFixerEngine;
const cases = [
  ["python-demo", "python", engine.DEMOS.python],
  ["javascript-demo", "javascript", engine.DEMOS.javascript],
  ["python-clean", "python", "def add(a, b):\n    return a + b\n"],
  ["javascript-clean", "javascript", "function add(a, b) {\n  return a + b;\n}\n"],
  ["python-comment", "python", "print('ok') # unmatched ) in comment\n"]
];

const iterations = 1000;
const started = performance.now();
let diagnostics = 0;

for (let index = 0; index < iterations; index += 1) {
  for (const [, language, code] of cases) {
    diagnostics += engine.analyzeCode(code, language).diagnostics.length;
  }
}

const elapsed = performance.now() - started;
const runs = iterations * cases.length;
console.log(JSON.stringify({
  runs,
  diagnostics,
  total_ms: Number(elapsed.toFixed(2)),
  avg_ms_per_analysis: Number((elapsed / runs).toFixed(4))
}, null, 2));
