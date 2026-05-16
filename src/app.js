(function attachCodeFixerApp(global) {
  const engine = global.CodeFixerEngine;
  const editor = document.querySelector("#codeEditor");
  const languageSelect = document.querySelector("#languageSelect");
  const analyzeButton = document.querySelector("#analyzeButton");
  const loadDemoButton = document.querySelector("#loadDemoButton");
  const applyFixButton = document.querySelector("#applyFixButton");
  const statusBadge = document.querySelector("#statusBadge");

  const panels = {
    errors: document.querySelector("#errorPanel"),
    explanation: document.querySelector("#explanationPanel"),
    fix: document.querySelector("#fixPanel"),
    tests: document.querySelector("#testPanel"),
    warnings: document.querySelector("#warningPanel")
  };

  let latestFix = null;

  function loadDemo() {
    editor.value = engine.DEMOS[languageSelect.value];
    analyze();
  }

  function analyze() {
    const result = engine.analyzeCode(editor.value.trimEnd(), languageSelect.value);
    latestFix = result.fix;
    renderIssues(result.issues);
    renderExplanation(result.explanation);
    renderFix(result.fix);
    renderTests(result.testResult);
    renderWarnings(result.warnings);
    statusBadge.textContent = result.issues.length ? "Needs fix" : "Ready";
  }

  function renderIssues(issues) {
    if (!issues.length) {
      panels.errors.innerHTML = card("No syntax issues found.", "CodeFixer did not find obvious missing quotes, brackets, colons, or unsafe assignments.", "ok");
      return;
    }
    panels.errors.innerHTML = list(issues.map((issue) => card(issue.title, `${escapeHtml(lineLabel(issue) + issue.message)}${confidenceLabel(issue)}`, "", true)));
  }

  function renderExplanation(explanation) {
    panels.explanation.textContent = explanation;
    panels.explanation.classList.remove("empty");
  }

  function renderFix(fix) {
    applyFixButton.disabled = !fix;
    if (!fix) {
      panels.fix.innerHTML = card("No safe one-click fix", "CodeFixer will not change your code unless the fix is clear.", "warning");
      return;
    }
    const fixed = fix.fix.apply(editor.value);
    const preview = previewChangedLine(fixed, fix.line);
    panels.fix.innerHTML = card(
      "Suggested fix",
      `${escapeHtml(fix.fix.label)}${confidenceLabel(fix)}<code class="code-preview">${escapeHtml(preview)}</code>`,
      "ok",
      true
    );
  }

  function renderTests(testResult) {
    const state = testResult.status === "passed" ? "ok" : testResult.status === "warning" ? "warning" : "";
    panels.tests.innerHTML = card(testResult.status.toUpperCase(), testResult.message, state);
  }

  function renderWarnings(warnings) {
    if (!warnings.length) {
      panels.warnings.innerHTML = card("No logic warnings", "No suspicious beginner-level logic patterns were detected.", "ok");
      return;
    }
    panels.warnings.innerHTML = list(warnings.map((warning) => card(warning.title, `${escapeHtml(lineLabel(warning) + warning.message)}${confidenceLabel(warning)}`, "warning", true)));
  }

  function applyFix() {
    if (!latestFix) return;
    editor.value = latestFix.fix.apply(editor.value);
    analyze();
  }

  function lineLabel(item) {
    return item.line ? `Line ${item.line}: ` : "";
  }

  function previewChangedLine(code, line) {
    if (!line) return code;
    return code.split("\n")[line - 1] || "";
  }

  function confidenceLabel(item) {
    if (!item.confidence) return "";
    const percent = Math.round(item.confidence * 100);
    const label = item.confidence < 0.75 ? "low-confidence" : "confidence";
    return `<span class="diagnostic-meta ${label}">${percent}% confidence</span>`;
  }

  function card(title, body, type = "", bodyContainsHtml = false) {
    const safeBody = bodyContainsHtml ? body : escapeHtml(body);
    return `<div class="issue-card ${type}"><strong>${escapeHtml(title)}</strong>${safeBody}</div>`;
  }

  function list(items) {
    return `<ul class="issue-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("\"", "&quot;")
      .replaceAll("'", "&#039;");
  }

  analyzeButton.addEventListener("click", analyze);
  loadDemoButton.addEventListener("click", loadDemo);
  applyFixButton.addEventListener("click", applyFix);
  languageSelect.addEventListener("change", loadDemo);

  if ("serviceWorker" in navigator) {
    global.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {
        statusBadge.textContent = "Offline cache unavailable";
      });
    });
  }

  loadDemo();
})(window);
