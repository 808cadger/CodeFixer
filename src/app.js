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
  editor.value = CODEFIXER_DEMOS[languageSelect.value];
  analyze();
}

function analyze() {
  const code = editor.value.trimEnd();
  const result = analyzeCode(code, languageSelect.value);
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
  panels.errors.innerHTML = list(issues.map((issue) => card(issue.title, lineLabel(issue) + issue.explanation)));
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
  const fixed = fix.fix();
  panels.fix.innerHTML = card("Suggested fix", `${lineLabel(fix)}${fix.explanation}<code class="code-preview">${escapeHtml(previewChangedLine(fixed, fix.line))}</code>`, "ok");
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
  panels.warnings.innerHTML = list(warnings.map((warning) => card(warning.title, lineLabel(warning) + warning.explanation, "warning")));
}

function applyFix() {
  if (!latestFix) return;
  editor.value = latestFix.fix();
  analyze();
}

function lineLabel(item) {
  return item.line ? `Line ${item.line}: ` : "";
}

function previewChangedLine(code, line) {
  if (!line) return code;
  return code.split("\n")[line - 1] || "";
}

function card(title, body, type = "") {
  return `<div class="issue-card ${type}"><strong>${escapeHtml(title)}</strong>${body}</div>`;
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
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {
      statusBadge.textContent = "Offline cache unavailable";
    });
  });
}

loadDemo();
