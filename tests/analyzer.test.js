const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "analyzer.js"), "utf8");
const context = { globalThis: {} };
vm.createContext(context);
vm.runInContext(source, context);

const engine = context.globalThis.CodeFixerEngine;

function applyAllSafeFixes(code, language, limit = 5) {
  let next = code;
  for (let index = 0; index < limit; index += 1) {
    const result = engine.analyzeCode(next, language);
    if (!result.fix) return { code: next, result };
    next = result.fix.fix.apply(next);
  }
  return { code: next, result: engine.analyzeCode(next, language) };
}

function ids(result) {
  return result.diagnostics.map((item) => item.id);
}

{
  const result = engine.analyzeCode(engine.DEMOS.python, "python");
  assert(ids(result).includes("missing-closing-delimiter"));
  assert(ids(result).includes("assignment-in-condition"));
  assert(result.fix.fix.safe);
}

{
  const fixed = applyAllSafeFixes(engine.DEMOS.python, "python");
  assert.equal(fixed.result.issues.length, 0);
  assert.equal(fixed.result.testResult.status, "passed");
}

{
  const result = engine.analyzeCode(engine.DEMOS.javascript, "javascript");
  assert(ids(result).includes("mismatched-delimiter"));
  assert(ids(result).includes("assignment-in-condition"));
  assert(ids(result).includes("javascript-off-by-one-loop"));
}

{
  const fixed = applyAllSafeFixes(engine.DEMOS.javascript, "javascript");
  assert.equal(fixed.result.issues.length, 0);
  assert.equal(fixed.result.testResult.status, "warning");
}

{
  const result = engine.analyzeCode("print('ok') # ) comment should be ignored", "python");
  assert.equal(result.issues.length, 0);
}

{
  const result = engine.analyzeCode("if value == 3\n    print(value)", "python");
  assert(ids(result).includes("python-missing-colon"));
}

{
  const result = engine.analyzeCode("if (total([1, 2, 3]) === 6) {\n  console.log('ok');\n}", "javascript");
  assert.equal(result.issues.length, 0);
}

console.log("analyzer tests passed");
